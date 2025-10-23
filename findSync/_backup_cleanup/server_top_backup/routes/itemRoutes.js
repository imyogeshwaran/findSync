const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const auth = require('../middleware/auth');

// Public routes
router.get('/', itemController.getItems);
router.get('/:id', itemController.getItemById);

// Protected routes
router.post('/', auth, itemController.createItem);
router.put('/:id/status', auth, itemController.updateItemStatus);

module.exports = router;
