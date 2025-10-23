const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Public routes
router.post('/sync', userController.syncUser);

// Protected routes
router.get('/profile', auth, userController.getUserProfile);
router.get('/all', auth, userController.getAllUsers);

module.exports = router;
