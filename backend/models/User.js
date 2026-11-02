const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },

    // IAM – Role-Based Access Control
    role: {
        type: String,
        enum: ['user', 'admin', 'auditor'],
        default: 'user',
    },

    // Student Wishlist / Bookmarked Items
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
