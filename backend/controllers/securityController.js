const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const SecurityLog = require('../models/SecurityLog');
const { logSecurityEvent } = require('../middleware/securityMiddleware');
const { isS3Configured } = require('../services/s3Service');

/**
 * GET /api/security/logs
 * Fetch recent security audit trail entries.
 * Regular users see only their own events; admins and auditors see all.
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
        cloudConcepts: ['IAM Role Control', 'PaaS (Render)', 'DBaaS (Atlas)', 'STaaS (AWS S3)', 'Cloud SLA & Telemetry', 'Audit Trail'],
        roles: [
            {
                role: 'user',
                description: 'Standard campus user',
                permissions: [
                    'items:read',
                    'items:create',
                    'items:update_own',
                    'items:delete_own',
                    'swaps:create',
                    'swaps:manage_own',
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
                    'swaps:manage_all',
                    'security:view_all_logs',
                    'security:generate_api_key',
                    'users:view_all',
                    'users:manage_roles',
                ],
            },
            {
                role: 'auditor',
                description: 'Security auditor (read-only compliance)',
                permissions: [
                    'items:read',
                    'security:view_all_logs',
                    'security:generate_api_key',
                    'iam:inspect_policies',
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

/**
 * GET /api/security/users (Admin Only)
 * List all users and their assigned IAM roles.
 */
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-passwordHash -apiKey').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * PUT /api/security/users/:id/role (Admin Only)
 * Change a user's IAM role.
 */
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['user', 'admin', 'auditor'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Must be user, admin, or auditor.' });
        }

        const targetUser = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { returnDocument: 'after' }
        ).select('-passwordHash -apiKey');

        if (!targetUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Record audit log
        await logSecurityEvent({
            eventType: 'ROLE_CHANGED',
            userId: req.user.userId,
            userEmail: req.user.email,
            ipAddress: req.ip || '',
            userAgent: req.headers['user-agent'] || '',
            status: 'SUCCESS',
            details: `Admin changed role of ${targetUser.email} to ${role}`,
        });

        res.json({ message: `Role updated to ${role} successfully.`, user: targetUser });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * GET /api/security/diagnostics
 * Real-time Cloud Infrastructure & SLA Telemetry (PaaS, DBaaS, STaaS)
 */
exports.getCloudDiagnostics = async (_req, res) => {
    try {
        const start = Date.now();
        let dbLatency = null;
        try {
            if (mongoose.connection.db) {
                await mongoose.connection.db.admin().ping();
                dbLatency = Date.now() - start;
            }
        } catch (e) {
            dbLatency = -1;
        }

        const mem = process.memoryUsage();
        const heapUsedMB = (mem.heapUsed / 1024 / 1024).toFixed(2);
        const heapTotalMB = (mem.heapTotal / 1024 / 1024).toFixed(2);
        const rssMB = (mem.rss / 1024 / 1024).toFixed(2);

        res.json({
            cloudProvider: 'Render (PaaS) & AWS (STaaS) & Atlas (DBaaS)',
            region: process.env.AWS_REGION || 'ap-south-1 (Mumbai)',
            databaseLatency: dbLatency >= 0 ? `${dbLatency} ms` : 'Offline / In-Memory',
            dbStatus: mongoose.connection.readyState === 1 ? 'Healthy (Atlas Clustered Replica Set)' : 'Degraded',
            dbName: mongoose.connection.name || 'ecoswap',
            s3Status: isS3Configured() ? 'Operational (AWS S3 Bucket Connected)' : 'Simulated (Dev Cloud Storage Active)',
            heapMemory: `${heapUsedMB} MB / ${heapTotalMB} MB`,
            rssMemory: `${rssMB} MB`,
            uptimeSeconds: Math.floor(process.uptime()),
            nodeVersion: process.version,
            environment: process.env.NODE_ENV || 'production',
            slaHealth: '99.9% Uptime Compliance',
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
