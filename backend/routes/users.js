const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Tournament = require('../models/Tournament');
const admin = require('../firebaseAdmin');
const { auth, isAdmin } = require('../middleware/auth');
const TIER_LIMITS = require('../utils/tierLimits');

const router = express.Router();

// Get all bidders (Admin only)
router.get('/', auth, isAdmin, async (req, res) => {
    try {
        const bidders = await User.find({ role: 'bidder', tournamentId: req.user.tournamentId })
            .select('username teamName budget')
            .sort({ teamName: 1 });
        res.json(bidders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user budget (Admin only)
router.post('/budget/:userId', auth, isAdmin, async (req, res) => {
    try {
        const { budget } = req.body;

        if (budget === undefined || budget < 0) {
            return res.status(400).json({ error: 'Invalid budget amount' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.userId,
            { budget: Number(budget) },
            { new: true }
        ).select('username teamName budget');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Notify clients
        const io = req.app.get('io');
        io.to(`tournament_${req.user.tournamentId}`).emit('budget-update');

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Register a new team (Admin only)
router.post('/register-team', auth, isAdmin, async (req, res) => {
    try {
        const { username, password, teamName, initialBudget } = req.body;

        if (!req.user.tournamentId) {
            return res.status(400).json({ error: 'You must select an active tournament first' });
        }

        // Check subscription tier limits
        const adminUser = await User.findById(req.user.userId);
        const tier = adminUser.subscriptionTier || 'free';
        const limit = TIER_LIMITS[tier].teams;
        const currentCount = await User.countDocuments({ role: 'bidder', tournamentId: req.user.tournamentId });

        if (currentCount >= limit) {
            return res.status(403).json({ error: `Upgrade your subscription to register more teams. (${tier} tier limit: ${limit})` });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const autoEmail = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@bidder.local`;

        const existingEmail = await User.findOne({ email: autoEmail });
        if (existingEmail) {
            return res.status(400).json({ error: 'Generated email collision. Please use a unique username without special characters.' });
        }

        // Create the user in Firebase Auth so the bidder can log in
        let firebaseRecord;
        try {
            firebaseRecord = await admin.auth().createUser({
                email: autoEmail,
                password: password,
                displayName: teamName,
            });
        } catch (fbError) {
            console.error("Firebase Admin Error:", fbError);
            return res.status(500).json({ error: 'Failed to provision Firebase Auth identity for the team. Ensure password is at least 6 characters.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newTeam = new User({
            username,
            email: autoEmail,
            firebaseUid: firebaseRecord.uid,
            password: hashedPassword,
            role: 'bidder',
            teamName,
            budget: initialBudget || 100,
            tournamentId: req.user.tournamentId
        });

        await newTeam.save();

        const io = req.app.get('io');
        io.to(`tournament_${req.user.tournamentId}`).emit('budget-update'); // Or a new event for team-added

        res.status(201).json({
            message: 'Team created successfully',
            team: { username: newTeam.username, teamName: newTeam.teamName, budget: newTeam.budget, email: newTeam.email }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
