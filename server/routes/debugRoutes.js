const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// Diagnostic endpoint to test token verification
router.get('/debug-auth', (req, res) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    console.log('[Debug Auth]', {
      hasAuthHeader: !!authHeader,
      authHeader,
      hasToken: !!token,
      tokenPrefix: token ? token.slice(0, 10) + '...' : null,
      jwt_secret: process.env.JWT_SECRET
    });

    if (!token) {
      return res.json({ 
        status: 'error',
        error: 'No token provided',
        authHeader 
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      res.json({
        status: 'success',
        decoded: {
          firebase_uid: decoded.firebase_uid,
          email: decoded.email,
          exp: decoded.exp
        }
      });
    } catch (e) {
      res.json({ 
        status: 'error',
        error: 'Token verification failed',
        message: e.message,
        jwt_secret_length: process.env.JWT_SECRET?.length 
      });
    }
  } catch (e) {
    res.json({ 
      status: 'error',
      error: 'Request processing failed',
      message: e.message 
    });
  }
});

// Protected endpoint to test auth middleware
router.get('/test-auth', auth, (req, res) => {
  res.json({ 
    status: 'success',
    message: 'Auth middleware passed',
    user: req.user 
  });
});

module.exports = router;