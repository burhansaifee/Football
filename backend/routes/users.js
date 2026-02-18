const express = require('express');
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all bidders (Admin only)
router.get('/', auth, isAdmin, async (req, res) => {
    try {
        const bidders = await User.find({ role: 'bidder' })
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
        io.emit('budget-update');

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
