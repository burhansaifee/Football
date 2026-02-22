const express = require('express');
const router = express.Router();
const Tournament = require('../models/Tournament');
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth');
const TIER_LIMITS = require('../utils/tierLimits');

// Create a new tournament (Admin only)
router.post('/', auth, isAdmin, async (req, res) => {
    try {
        const { name, sport } = req.body;
        if (!name) return res.status(400).json({ error: 'Tournament name is required' });

        // Check subscription tier limits
        const adminUser = await User.findById(req.user.userId);
        const tier = adminUser.subscriptionTier || 'free';
        const limit = TIER_LIMITS[tier].tournaments;
        const currentCount = await Tournament.countDocuments({ adminId: req.user.userId });

        if (currentCount >= limit) {
            return res.status(403).json({ error: `Upgrade to a higher tier to create more tournaments. (${tier} tier limit: ${limit})` });
        }

        // Generate a random 6-character alphanumeric join code
        const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const tournament = new Tournament({
            name,
            sport: sport || 'Football',
            adminId: req.user.userId,
            joinCode
        });

        await tournament.save();

        // Automatically set admin's current tournament to this one
        await User.findByIdAndUpdate(req.user.userId, { tournamentId: tournament._id });

        // Since the user is authenticated via Firebase, their JWT remains valid. 
        // We do not need to mint a new token, but we echo the current token for API compatibility.
        const token = req.header('Authorization')?.replace('Bearer ', '');

        res.status(201).json({ tournament, token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all tournaments for the authenticated admin
router.get('/', auth, isAdmin, async (req, res) => {
    try {
        const tournaments = await Tournament.find({ adminId: req.user.userId }).sort({ createdAt: -1 });
        res.json(tournaments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Select a tournament and get a new token (Admin only)
router.post('/select', auth, isAdmin, async (req, res) => {
    try {
        const { tournamentId } = req.body;
        if (!tournamentId) return res.status(400).json({ error: 'Tournament ID is required' });

        const tournament = await Tournament.findOne({ _id: tournamentId, adminId: req.user.userId });
        if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

        await User.findByIdAndUpdate(req.user.userId, { tournamentId: tournament._id });

        const token = req.header('Authorization')?.replace('Bearer ', '');

        res.json({ message: 'Tournament selected', token, tournament });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Join a tournament (Bidder only)
router.post('/join', auth, async (req, res) => {
    try {
        if (req.user.role !== 'bidder') {
            return res.status(403).json({ error: 'Only bidders can join a tournament via code' });
        }

        const { joinCode } = req.body;
        if (!joinCode) return res.status(400).json({ error: 'Join code is required' });

        const tournament = await Tournament.findOne({ joinCode: joinCode.toUpperCase() });
        if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

        await User.findByIdAndUpdate(req.user.userId, { tournamentId: tournament._id });

        const token = req.header('Authorization')?.replace('Bearer ', '');

        res.json({ message: 'Joined tournament successfully', token, tournament });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
