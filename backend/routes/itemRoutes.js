const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', itemController.getItems);
router.get('/:id', itemController.getItemById);
router.post('/', authMiddleware, itemController.createItem);
router.put('/:id', authMiddleware, itemController.updateItem);
router.delete('/:id', authMiddleware, itemController.deleteItem);

module.exports = router;
