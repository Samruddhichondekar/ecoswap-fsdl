const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema({
    eventType: {
        type: String,
        required: true,
        enum: [
            'AUTH_REGISTER',
            'AUTH_LOGIN',
            'AUTH_LOGIN_FAILED',
            'AUTH_LOGOUT',
            'UNAUTHORIZED_ACCESS',
            'TOKEN_VALIDATION',
            'API_KEY_GENERATED',
            'API_KEY_ACCESS',
            'ROLE_CHANGED',
            'ITEM_CREATED',
            'ITEM_DELETED',
        ],
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    userEmail: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    status: { type: String, enum: ['SUCCESS', 'FAILURE', 'WARNING'], default: 'SUCCESS' },
    details: { type: String, default: '' },
}, { timestamps: true });

// Automatically expire logs older than 90 days (cloud best-practice)
securityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('SecurityLog', securityLogSchema);
