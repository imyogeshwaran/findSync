const db = require('../config/database');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Sync Firebase user to MySQL
exports.syncUser = async (req, res) => {
  try {
    const { firebase_uid, name, email } = req.body;
    
    if (!firebase_uid || !email) {
      return res.status(400).json({ error: 'Firebase UID and email are required' });
    }
    
    // Check if user already exists
    const [existingUsers] = await db.query(
      'SELECT * FROM users WHERE firebase_uid = ?',
      [firebase_uid]
    );
    
    let user;
    
    if (existingUsers.length > 0) {
      // Update existing user
      await db.query(
        'UPDATE users SET name = ?, email = ? WHERE firebase_uid = ?',
        [name, email, firebase_uid]
      );
      user = existingUsers[0];
    } else {
      // Insert new user
      const [result] = await db.query(
        'INSERT INTO users (firebase_uid, name, email) VALUES (?, ?, ?)',
        [firebase_uid, name, email]
      );
      user = {
        id: result.insertId,
        firebase_uid,
        name,
        email
      };
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, firebase_uid, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: 'User synced successfully',
      token,
      user: {
        id: user.id,
        firebase_uid,
        name,
        email
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
      'SELECT id, firebase_uid, name, email, created_at FROM users WHERE id = ?',
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
      'SELECT id, firebase_uid, name, email, created_at FROM users ORDER BY created_at DESC'
    );
    
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};
