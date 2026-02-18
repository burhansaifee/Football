const express = require('express');
const Player = require('../models/Player');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all players
router.get('/', auth, async (req, res) => {
    try {
        const players = await Player.find()
            .populate('currentBidder', 'username teamName')
            .populate('soldTo', 'username teamName');
        res.json(players);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new player (Admin only)
router.post('/', auth, isAdmin, async (req, res) => {
    try {
        const { name, position, basePrice, imageUrl } = req.body;

        const player = new Player({
            name,
            position,
            basePrice,
            imageUrl,
            currentPrice: basePrice
        });

        await player.save();

        // Notify clients
        const io = req.app.get('io');
        io.emit('players-update');

        res.status(201).json(player);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete player (Admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        await Player.findByIdAndDelete(req.params.id);

        // Notify clients
        const io = req.app.get('io');
        io.emit('players-update');

        res.json({ message: 'Player deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
