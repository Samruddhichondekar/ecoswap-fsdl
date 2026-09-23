const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    condition: { type: String, required: true, default: 'Good' },
    location: { type: String, required: true, default: 'Campus' },
    imageUrl: { type: String, required: true },
    contact: { type: String, required: true },
    status: { type: String, enum: ['Available', 'Exchanged'], default: 'Available' },

    // Advanced features
    transactionType: { type: String, enum: ['Donate', 'Sell', 'Barter', 'Rent'], default: 'Donate' },
    price: { type: Number, default: 0 },
    tags: [{ type: String }],
    views: { type: Number, default: 0 },
    urgent: { type: Boolean, default: false },

    // Auth association
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
