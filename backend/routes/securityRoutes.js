const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');
const authMiddleware = require('../middleware/authMiddleware');

// All security routes require authentication
router.use(authMiddleware);

// Audit trail logs
router.get('/logs', securityController.getSecurityLogs);

// IAM role-permission policy
router.get('/iam-policy', securityController.getIAMPolicy);

// Security dashboard stats
router.get('/stats', securityController.getSecurityStats);

// Generate a new API key (SaaS feature)
router.post('/api-key', securityController.generateApiKey);

module.exports = router;
