const express = require('express');
const router = express.Router();
const swapController = require('../controllers/swapController');
const authMiddleware = require('../middleware/authMiddleware');

// All swap operations require authentication
router.use(authMiddleware);

router.post('/', swapController.createSwapRequest);
router.get('/received', swapController.getReceivedSwaps);
router.get('/sent', swapController.getSentSwaps);
router.put('/:id/status', swapController.updateSwapStatus);

module.exports = router;

