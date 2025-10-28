const jwt = require('jsonwebtoken');
const db = require('../config/database');
require('dotenv').config();

// Async auth middleware: verifies JWT and ensures req.user.id is populated.
// If the token doesn't include a DB user id but contains firebase_uid, look up the user.
const auth = async (req, res, next) => {
  try {
    // Get token from header (support both 'Authorization' and lowercase)
    const authHeader = req.header('Authorization') || req.header('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return res.status(401).json({ error: 'No authentication token, access denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // If token doesn't include numeric DB id but has firebase_uid, try to resolve it
    if ((!decoded.id || decoded.id === null) && decoded.firebase_uid) {
      try {
        const [rows] = await db.query('SELECT user_id FROM Users WHERE firebase_uid = ?', [decoded.firebase_uid]);
        if (rows && rows.length > 0) {
          decoded.id = rows[0].user_id;
        }
      } catch (dbErr) {
        console.error('Auth middleware DB lookup error:', dbErr.message);
        // proceed without id; downstream handlers will reject if id is required
      }
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ error: 'Token is not valid' });
  }
};

module.exports = auth;
