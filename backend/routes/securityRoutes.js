const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/securityMiddleware');

// All security routes require authentication
router.use(authMiddleware);

// Audit trail logs (role-filtered: users see own; admin/auditor see all)
router.get('/logs', securityController.getSecurityLogs);

// IAM role-permission policy
router.get('/iam-policy', securityController.getIAMPolicy);

// Security dashboard stats
router.get('/stats', securityController.getSecurityStats);

// Cloud Infrastructure & SLA Telemetry Diagnostics
router.get('/diagnostics', securityController.getCloudDiagnostics);

// Generate a new API key (SaaS feature)
router.post('/api-key', securityController.generateApiKey);

// Admin-only IAM User Management
router.get('/users', requireRole('admin'), securityController.getUsers);
router.put('/users/:id/role', requireRole('admin'), securityController.updateUserRole);

module.exports = router;
