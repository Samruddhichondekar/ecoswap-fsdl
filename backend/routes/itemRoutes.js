const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadMiddleware } = require('../services/s3Service');

router.get('/', itemController.getItems);
router.get('/:id', itemController.getItemById);

// Protected AWS S3 Image Upload (STaaS)
router.post('/upload', authMiddleware, uploadMiddleware.single('image'), itemController.uploadImage);

router.post('/', authMiddleware, itemController.createItem);
router.put('/:id', authMiddleware, itemController.updateItem);
router.delete('/:id', authMiddleware, itemController.deleteItem);

module.exports = router;
