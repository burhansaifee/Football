const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    sport: {
        type: String,
        default: 'Football'
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    joinCode: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['setup', 'active', 'completed'],
        default: 'setup'
    }
}, { timestamps: true });

module.exports = mongoose.model('Tournament', tournamentSchema);
