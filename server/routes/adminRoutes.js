const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const jwt = require('jsonwebtoken');

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret';
    const decoded = jwt.verify(token, jwtSecret);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized - Admin access required' });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token', details: error.message });
  }
};

// Admin login (no auth required)
router.post('/login', adminController.login);

// Protected routes - require admin token
router.get('/dashboard/stats', verifyAdminToken, adminController.getDashboardStats);
router.get('/users', verifyAdminToken, adminController.getAllUsers);
router.get('/items', verifyAdminToken, adminController.getAllItems);
router.delete('/users/:userId', verifyAdminToken, adminController.deleteUser);
router.delete('/items/:itemId', verifyAdminToken, adminController.deleteItem);

// Post approval routes
router.get('/posts/pending', verifyAdminToken, adminController.getPendingPosts);
router.get('/posts/approved', verifyAdminToken, adminController.getApprovedPosts);
router.get('/posts/rejected', verifyAdminToken, adminController.getRejectedPosts);
router.put('/posts/:itemId/approve', verifyAdminToken, adminController.approvePost);
router.put('/posts/:itemId/reject', verifyAdminToken, adminController.rejectPost);

module.exports = router;
