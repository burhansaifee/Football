const express = require('express');
const Player = require('../models/Player');
const { auth, isAdmin } = require('../middleware/auth');
const User = require('../models/User');
const TIER_LIMITS = require('../utils/tierLimits');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const router = express.Router();

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'player_images',
        allowed_formats: ['jpg', 'png', 'jpeg'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }]
    },
});

const upload = multer({ storage: storage });

// Get all players
router.get('/', auth, async (req, res) => {
    try {
        const players = await Player.find({ tournamentId: req.user.tournamentId })
            .populate('currentBidder', 'username teamName')
            .populate('soldTo', 'username teamName');
        res.json(players);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new player (Admin only)
router.post('/', auth, isAdmin, upload.single('image'), async (req, res) => {
    try {
        let { name, position, basePrice, imageUrl } = req.body;

        if (req.file) {
            imageUrl = req.file.path; // Cloudinary returns the full URL in .path or .secure_url
        } else if (imageUrl && imageUrl.includes('drive.google.com')) {
            const match = imageUrl.match(/id=([^&]+)/) || imageUrl.match(/file\/d\/([^\/]+)/);
            if (match && match[1]) {
                imageUrl = `https://drive.google.com/uc?export=view&id=${match[1]}`;
            }
        }

        // Check subscription tier limits
        const adminUser = await User.findById(req.user.userId);
        const tier = adminUser.subscriptionTier || 'free';
        const limit = TIER_LIMITS[tier].players;
        const currentCount = await Player.countDocuments({ tournamentId: req.user.tournamentId });

        if (currentCount >= limit) {
            return res.status(403).json({ error: `Upgrade your subscription to add more players. (${tier} tier limit: ${limit})` });
        }

        const player = new Player({
            name,
            position,
            basePrice,
            imageUrl,
            currentPrice: basePrice,
            tournamentId: req.user.tournamentId
        });

        await player.save();

        // Notify clients
        const io = req.app.get('io');
        io.to(`tournament_${req.user.tournamentId}`).emit('players-update');

        res.status(201).json(player);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete player (Admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        const player = await Player.findOne({ _id: req.params.id, tournamentId: req.user.tournamentId });
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }
        await Player.findByIdAndDelete(req.params.id);

        // Notify clients
        const io = req.app.get('io');
        io.to(`tournament_${req.user.tournamentId}`).emit('players-update');

        res.json({ message: 'Player deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
