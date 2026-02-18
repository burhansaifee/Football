const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
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
    players: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
