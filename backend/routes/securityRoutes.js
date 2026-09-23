const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');
const authMiddleware = require('../middleware/authMiddleware');

// Public IAM policy and stats overview for instant inspection
router.get('/iam-policy', securityController.getIAMPolicy);
router.get('/stats', securityController.getSecurityStats);

// Protected audit trail & API key generation
router.get('/logs', authMiddleware, securityController.getSecurityLogs);
router.post('/api-key', authMiddleware, securityController.generateApiKey);

module.exports = router;
