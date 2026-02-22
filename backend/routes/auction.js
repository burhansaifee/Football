const express = require('express');
const Player = require('../models/Player');
const User = require('../models/User');
const Bid = require('../models/Bid');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Start random auction (Admin only)
router.post('/start-random', auth, isAdmin, async (req, res) => {
    try {
        // Check if any player is already in auction for this tournament
        const activePlayer = await Player.findOne({ status: 'in-auction', tournamentId: req.user.tournamentId });
        if (activePlayer) {
            return res.status(400).json({ error: 'Auction already in progress', player: activePlayer });
        }

        // Search for available players first
        let count = await Player.countDocuments({ status: 'available', tournamentId: req.user.tournamentId });
        let statusToPick = 'available';

        if (count === 0) {
            // If no available, check for unsold
            count = await Player.countDocuments({ status: 'unsold', tournamentId: req.user.tournamentId });
            statusToPick = 'unsold';
        }

        if (count === 0) {
            return res.status(400).json({ error: 'No players available for auction' });
        }

        // Get random player
        const random = Math.floor(Math.random() * count);
        const player = await Player.findOne({ status: statusToPick, tournamentId: req.user.tournamentId }).skip(random);

        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        player.status = 'in-auction';
        player.currentPrice = player.basePrice;
        player.currentBidder = null; // Clear previous bidder if re-auctioning
        await player.save();

        // Notify clients
        const io = req.app.get('io');
        io.to(`tournament_${req.user.tournamentId}`).emit('bid-update', {
            player: player,
            amount: player.currentPrice,
            bidder: 'System'
        });

        res.json(player);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start auction for a player (Admin only)
router.post('/start/:playerId', auth, isAdmin, async (req, res) => {
    try {
        const player = await Player.findOne({ _id: req.params.playerId, tournamentId: req.user.tournamentId });

        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        if (player.status !== 'available') {
            return res.status(400).json({ error: 'Player not available for auction' });
        }

        player.status = 'in-auction';
        player.currentPrice = player.basePrice;
        await player.save();

        // Notify clients
        const io = req.app.get('io');
        io.to(`tournament_${req.user.tournamentId}`).emit('bid-update', {
            player: player,
            amount: player.currentPrice,
            bidder: 'System'
        });

        res.json(player);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// End auction (Admin only)
router.post('/end/:playerId', auth, isAdmin, async (req, res) => {
    try {
        const player = await Player.findOne({ _id: req.params.playerId, tournamentId: req.user.tournamentId });

        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        if (player.status !== 'in-auction') {
            return res.status(400).json({ error: 'No active auction for this player' });
        }

        player.status = 'sold';
        player.soldTo = player.currentBidder;
        player.soldPrice = player.currentPrice;
        await player.save();

        // Update winner's budget and players
        if (player.currentBidder) {
            await User.findByIdAndUpdate(player.currentBidder, {
                $inc: { budget: -player.currentPrice },
                $push: { players: player._id }
            });
        }

        // Notify clients
        const io = req.app.get('io');
        io.to(`tournament_${req.user.tournamentId}`).emit('auction-ended', {
            player: player,
            winner: player.currentBidder
        });

        res.json(player);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark as Unsold (Admin only)
router.post('/unsold/:playerId', auth, isAdmin, async (req, res) => {
    try {
        const player = await Player.findOne({ _id: req.params.playerId, tournamentId: req.user.tournamentId });
        if (!player) return res.status(404).json({ error: 'Player not found' });

        player.status = 'unsold';
        player.currentBidder = null;
        player.currentPrice = player.basePrice;
        await player.save();

        // Notify clients
        const io = req.app.get('io');
        io.to(`tournament_${req.user.tournamentId}`).emit('auction-ended', { player, status: 'unsold' });
        io.to(`tournament_${req.user.tournamentId}`).emit('players-update');

        res.json(player);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Set Price Manual (Admin only)
router.post('/set-price/:playerId', auth, isAdmin, async (req, res) => {
    try {
        const { newPrice } = req.body;
        const player = await Player.findOne({ _id: req.params.playerId, tournamentId: req.user.tournamentId });

        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        if (player.status !== 'in-auction') {
            return res.status(400).json({ error: 'Player must be in auction to set price' });
        }

        player.currentPrice = Number(newPrice);
        player.currentBidder = null; // Reset bidder as this is a new asking price
        await player.save();

        // Notify clients
        const io = req.app.get('io');
        io.to(`tournament_${req.user.tournamentId}`).emit('bid-update', {
            player: player,
            amount: newPrice,
            bidder: 'Admin (Set Price)'
        });

        res.json(player);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user info (budget, players)
router.get('/user', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .populate('players', 'name position soldPrice');
        res.json({
            username: user.username,
            teamName: user.teamName,
            budget: user.budget,
            players: user.players
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
