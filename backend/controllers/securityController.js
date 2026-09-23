const crypto = require('crypto');
const User = require('../models/User');
const SecurityLog = require('../models/SecurityLog');
const { logSecurityEvent } = require('../middleware/securityMiddleware');

/**
 * GET /api/security/logs
 * Fetch recent security audit trail entries.
 * All authenticated users can view – auditors/admins can see all;
 * regular users only see their own events.
 */
exports.getSecurityLogs = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const filter = {};

        // Regular users see only their own logs
        if (req.user.role === 'user') {
            filter.userId = req.user.userId;
        }

        const logs = await SecurityLog.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * POST /api/security/api-key
 * Generate a new API key for the current user (SaaS feature).
 */
exports.generateApiKey = async (req, res) => {
    try {
        const newKey = `ecoswap_${crypto.randomBytes(24).toString('hex')}`;
        await User.findByIdAndUpdate(req.user.userId, { apiKey: newKey });

        await logSecurityEvent({
            eventType: 'API_KEY_GENERATED',
            userId: req.user.userId,
            userEmail: req.user.email,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
            userAgent: req.headers['user-agent'] || '',
            status: 'SUCCESS',
            details: 'New API key generated',
        });

        res.json({ apiKey: newKey });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * GET /api/security/iam-policy
 * Return the IAM role-permission matrix describing system access control.
 */
exports.getIAMPolicy = async (_req, res) => {
    const policy = {
        service: 'EcoSwap Cloud Platform',
        model: 'RBAC – Role-Based Access Control',
        cloudConcepts: ['IAM', 'SaaS', 'PaaS', 'Audit Trail', 'API Key Auth'],
        roles: [
            {
                role: 'user',
                description: 'Standard campus user',
                permissions: [
                    'items:read',
                    'items:create',
                    'items:update_own',
                    'items:delete_own',
                    'security:view_own_logs',
                    'security:generate_api_key',
                ],
            },
            {
                role: 'admin',
                description: 'Cloud administrator',
                permissions: [
                    'items:read',
                    'items:create',
                    'items:update_any',
                    'items:delete_any',
                    'security:view_all_logs',
                    'security:generate_api_key',
                    'users:manage_roles',
                ],
            },
            {
                role: 'auditor',
                description: 'Security auditor (read-only)',
                permissions: [
                    'items:read',
                    'security:view_all_logs',
                    'security:generate_api_key',
                ],
            },
        ],
        apiKeyAuth: {
            header: 'X-API-KEY',
            description: 'Programmatic access via API keys – SaaS integration pattern',
        },
        auditRetention: '90 days (auto-expiring TTL index)',
    };
    res.json(policy);
};

/**
 * GET /api/security/stats
 * Aggregate security statistics for the dashboard.
 */
exports.getSecurityStats = async (req, res) => {
    try {
        const [totalLogs, loginSuccesses, loginFailures, apiKeyEvents] = await Promise.all([
            SecurityLog.countDocuments(),
            SecurityLog.countDocuments({ eventType: 'AUTH_LOGIN', status: 'SUCCESS' }),
            SecurityLog.countDocuments({ eventType: 'AUTH_LOGIN_FAILED', status: 'FAILURE' }),
            SecurityLog.countDocuments({ eventType: { $in: ['API_KEY_GENERATED', 'API_KEY_ACCESS'] } }),
        ]);

        const totalUsers = await User.countDocuments();
        const roleCounts = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } },
        ]);

        res.json({
            totalLogs,
            loginSuccesses,
            loginFailures,
            apiKeyEvents,
            totalUsers,
            roleCounts: roleCounts.reduce((acc, r) => { acc[r._id] = r.count; return acc; }, {}),
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
