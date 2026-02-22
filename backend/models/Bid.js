const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
        required: true
    },
    bidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 1
    },
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Bid', bidSchema);
