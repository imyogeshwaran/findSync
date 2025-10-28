const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/database');
require('dotenv').config();

// Route for handling Google/Firebase authentication
// This endpoint will ensure the user exists in the database and return a JWT
router.post('/login', async (req, res) => {
  try {
    const { firebase_uid, email, name, id_token } = req.body;

    if (!firebase_uid || !email || !id_token) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // In a real app you'd verify the Firebase ID token here.
    // Ensure user exists in Users table and get their DB user_id
    let userId = null;

    // Try to find existing user (Users table uses `user_id`)
    const [rows] = await db.query('SELECT user_id FROM Users WHERE firebase_uid = ?', [firebase_uid]);
    if (rows && rows.length > 0) {
      userId = rows[0].user_id;
      // Optionally update name/email if changed
      await db.query('UPDATE Users SET name = ?, email = ? WHERE user_id = ?', [name, email, userId]);
    } else {
      // Insert new user
      const [result] = await db.query('INSERT INTO Users (firebase_uid, name, email) VALUES (?, ?, ?)', [firebase_uid, name, email]);
      userId = result.insertId;
    }

    // Issue JWT including the DB user id so protected endpoints can use req.user.id
    const token = jwt.sign(
      {
        id: userId,
        firebase_uid,
        email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: userId,
        firebase_uid,
        email,
        name
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

module.exports = router;