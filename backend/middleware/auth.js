const admin = require('../firebaseAdmin');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'No authentication token' });
        }

        const decodedToken = await admin.auth().verifyIdToken(token);

        // Find the user in our MongoDB by their firebaseUid
        const user = await User.findOne({ firebaseUid: decodedToken.uid });
        if (!user) {
            return res.status(401).json({ error: 'User not found in local database' });
        }

        // Attach the MongoDB user properties to req.user so downstream routes
        // (like isAdmin, or grabbing req.user.userId) continue to function identically.
        req.user = {
            userId: user._id,
            firebaseUid: user.firebaseUid,
            username: user.username,
            role: user.role,
            tournamentId: user.tournamentId
        };

        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

module.exports = { auth, isAdmin };
