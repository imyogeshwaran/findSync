const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/missing', itemController.getAllMissingItems);
router.get('/missing/:id', itemController.getMissingItemById);

// Protected routes
router.post('/missing', auth, upload.single('image'), itemController.createMissingItem);
router.get('/my-items', auth, itemController.getUserMissingItems);
router.put('/missing/:id', auth, itemController.updateMissingItem);
router.delete('/missing/:id', auth, itemController.deleteMissingItem);

// Fix database issues
router.get('/fix-post-types', itemController.fixPostTypes);

module.exports = router;
