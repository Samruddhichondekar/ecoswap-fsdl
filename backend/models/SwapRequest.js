const mongoose = require('mongoose');

const swapRequestSchema = new mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    itemRequested: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true,
    },
    itemOffered: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        default: null,
    },
    message: {
        type: String,
        trim: true,
        default: 'Hi! I am interested in swapping for this item.',
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected', 'Cancelled'],
        default: 'Pending',
    },
}, { timestamps: true });

// Compound index to help lookup requests by user and status quickly
swapRequestSchema.index({ owner: 1, status: 1 });
swapRequestSchema.index({ requester: 1, status: 1 });

module.exports = mongoose.model('SwapRequest', swapRequestSchema);

