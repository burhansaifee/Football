const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    firebaseUid: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: ['admin', 'bidder'],
        required: true
    },
    teamName: {
        type: String,
        required: function () { return this.role === 'bidder'; }
    },
    budget: {
        type: Number,
        default: 100  // Starting budget: 100 coins
    },
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: function () { return this.role === 'bidder'; }
    },
    // Admin specific fields
    razorpayCustomerId: String,
    razorpaySubscriptionId: String,
    subscriptionStatus: {
        type: String,
        enum: ['active', 'past_due', 'canceled', 'none'],
        default: 'none'
    },
    subscriptionTier: {
        type: String,
        default: 'free'
    },
    players: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
