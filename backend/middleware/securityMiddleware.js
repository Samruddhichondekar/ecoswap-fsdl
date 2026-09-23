const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SecurityLog = require('../models/SecurityLog');

const JWT_SECRET = process.env.JWT_SECRET || 'ecoswap_super_secret_jwt_key_2024';

/**
 * RBAC middleware – restricts access to users with the specified role(s).
 * Usage: requireRole('admin')  or  requireRole('admin', 'auditor')
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required.' });
        }
        const userRole = req.user.role || 'user';
        if (!allowedRoles.includes(userRole)) {
            // Log the unauthorized attempt
            SecurityLog.create({
                eventType: 'UNAUTHORIZED_ACCESS',
                userId: req.user.userId,
                userEmail: req.user.email || '',
                ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
                userAgent: req.headers['user-agent'] || '',
                status: 'FAILURE',
                details: `Role "${userRole}" attempted to access resource requiring: ${allowedRoles.join(', ')}`,
            }).catch(() => {});

            return res.status(403).json({
                message: `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
            });
        }
        next();
    };
};

/**
 * API Key authentication middleware for SaaS/PaaS style access.
 * Looks for X-API-KEY header and validates against stored user API keys.
 */
const apiKeyAuth = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return next(); // Fall through to normal auth if no API key provided
    }
    try {
        const user = await User.findOne({ apiKey });
        if (!user) {
            await SecurityLog.create({
                eventType: 'API_KEY_ACCESS',
                ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
                userAgent: req.headers['user-agent'] || '',
                status: 'FAILURE',
                details: 'Invalid API key used',
            });
            return res.status(401).json({ message: 'Invalid API key.' });
        }
        req.user = {
            userId: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
        };

        await SecurityLog.create({
            eventType: 'API_KEY_ACCESS',
            userId: user._id,
            userEmail: user.email,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
            userAgent: req.headers['user-agent'] || '',
            status: 'SUCCESS',
            details: 'API key authentication successful',
        });

        next();
    } catch (err) {
        res.status(500).json({ message: 'API key validation error.' });
    }
};

/**
 * Utility: record a security event from anywhere in the app.
 */
const logSecurityEvent = async (data) => {
    try {
        await SecurityLog.create(data);
    } catch (err) {
        console.error('[Security] Failed to write audit log:', err.message);
    }
};

module.exports = { requireRole, apiKeyAuth, logSecurityEvent };
