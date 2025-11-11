const db = require('../config/database');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Sync Firebase user to MySQL
exports.syncUser = async (req, res) => {
  try {
    const { firebase_uid, name, email, phone, location } = req.body;
    
    if (!firebase_uid || !email) {
      return res.status(400).json({ error: 'Firebase UID and email are required' });
    }
    
    // Check if user already exists
    const [existingUsers] = await db.query(
      'SELECT * FROM Users WHERE firebase_uid = ?',
      [firebase_uid]
    );
    
    let user;
    
    if (existingUsers.length > 0) {
      // Update existing user
      await db.query(
        'UPDATE Users SET name = ?, email = ?, phone = ?, location = ? WHERE firebase_uid = ?',
        [name, email, phone || null, location || null, firebase_uid]
      );
      user = existingUsers[0];
    } else {
      // Insert new user
      const [result] = await db.query(
        'INSERT INTO Users (firebase_uid, name, email, phone, location) VALUES (?, ?, ?, ?, ?)',
        [firebase_uid, name, email, phone || null, location || null]
      );
      user = {
        user_id: result.insertId,
        firebase_uid,
        name,
        email,
        phone,
        location
      };
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.user_id || user.id, firebase_uid, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: 'User synced successfully',
      token,
      user: {
        user_id: user.user_id || user.id,
        firebase_uid,
        name,
        email,
        phone: user.phone || null,
        location: user.location || null
      }
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Failed to sync user', details: error.message });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [users] = await db.query(
      'SELECT user_id, firebase_uid, name, email, phone, location, created_at FROM Users WHERE user_id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, user: users[0] });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

// Get all users (admin)
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT user_id, firebase_uid, name, email, phone, location, created_at FROM Users ORDER BY created_at DESC'
    );
    
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};
