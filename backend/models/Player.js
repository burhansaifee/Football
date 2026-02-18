const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    position: {
        type: String,
        required: true,
        enum: ['Forward', 'Midfielder', 'Defender', 'Goalkeeper']
    },
    basePrice: {
        type: Number,
        required: true,
        min: 1
    },
    currentPrice: {
        type: Number,
        default: 0
    },
    imageUrl: {
        type: String,
        default: 'https://cdn-icons-png.flaticon.com/512/21/21104.png'
    },
    status: {
        type: String,
        enum: ['available', 'in-auction', 'sold', 'unsold'],
        default: 'available'
    },
    currentBidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    soldTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    soldPrice: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);
