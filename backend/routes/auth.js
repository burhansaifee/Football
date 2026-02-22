const express = require('express');
const admin = require('../firebaseAdmin');
const User = require('../models/User');
const Tournament = require('../models/Tournament');

const router = express.Router();

// Register new user (Sync profile from Firebase to MongoDB)
router.post('/register', async (req, res) => {
    try {
        const { username, email, firebaseUid, role, teamName, joinCode, tournamentName } = req.body;

        if (!firebaseUid || !email) {
            return res.status(400).json({ error: 'Firebase UID and email are required' });
        }

        // Check if user exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }, { firebaseUid }]
        });

        if (existingUser) {
            // Check for legacy account linking
            if (existingUser.email === email && !existingUser.firebaseUid) {
                existingUser.firebaseUid = firebaseUid;
                await existingUser.save();
                return res.status(200).json({ message: 'Legacy account linked successfully', user: existingUser });
            }

            if (existingUser.username === username) return res.status(400).json({ error: 'Username already taken. Try registering normally.' });
            if (existingUser.email === email) return res.status(400).json({ error: 'Email already registered.' });
            return res.status(400).json({ error: 'User already exists' });
        }

        if (role !== 'admin') {
            return res.status(400).json({ error: 'Only admins can register publicly. Bidders must be invited.' });
        }

        // Create user
        const user = new User({
            username,
            email,
            firebaseUid,
            role: 'admin',
            tournamentId: null
        });

        await user.save();

        const newJoinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const tournament = new Tournament({
            name: tournamentName || `${username}'s Tournament`,
            adminId: user._id,
            joinCode: newJoinCode,
            status: 'setup'
        });
        await tournament.save();

        res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
        console.error("Registration sync error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Login (Sync profile back to frontend after Firebase auth)
router.post('/login', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No Firebase token provided' });
        }

        // Verify the Firebase ID token
        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(token);
        } catch (verifyError) {
            console.error("Firebase token verification failed. Detailed Error:", verifyError);
            return res.status(401).json({ error: 'Invalid Firebase token. Check backend console.' });
        }

        // Find user by their Firebase UID
        let user = await User.findOne({ firebaseUid: decodedToken.uid });

        // If not found by UID, try account linking via email for legacy accounts
        if (!user && decodedToken.email) {
            user = await User.findOne({ email: decodedToken.email });
            if (user && !user.firebaseUid) {
                user.firebaseUid = decodedToken.uid;
                await user.save();
            } else if (user && user.firebaseUid !== decodedToken.uid) {
                return res.status(400).json({ error: 'Email already attached to another authentication method.' });
            }
        }

        if (!user) {
            return res.status(404).json({ error: 'User profile not found in database. Please register first.' });
        }

        let currentTournamentId = user.tournamentId;

        // If admin, find their active tournament
        if (user.role === 'admin') {
            const tournament = await Tournament.findOne({ adminId: user._id });
            if (tournament) {
                currentTournamentId = tournament._id;
            }
        }

        res.json({
            token, // Returning the same firebase token back to the frontend for consistency
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                teamName: user.teamName,
                budget: user.budget,
                tournamentId: currentTournamentId,
                firebaseUid: user.firebaseUid
            }
        });
    } catch (error) {
        console.error("Login sync error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
