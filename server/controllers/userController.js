const db = require('../config/database');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Sync Firebase user to MySQL
exports.syncUser = async (req, res) => {
  try {
    console.log('syncUser called with body:', req.body);
    const { firebase_uid, name, email, mobile, password, isGoogleAuth } = req.body;

    if (!firebase_uid || !email) {
      return res.status(400).json({ error: 'Firebase UID and email are required' });
    }

    // Note: password is only required for manual signup flows that call /api/auth/signup.
    // The sync endpoint can be called after Firebase auth without a password.

    // Check if user already exists in the `Users` table
    const [existingUsers] = await db.query(
      'SELECT user_id, firebase_uid, name, email, mobile, password FROM Users WHERE firebase_uid = ? OR email = ?',
      [firebase_uid, email]
    );

    let userRecord;

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      
      // Only update if this request has more complete data than what's stored
      const updateFields = [];
      const updateValues = [];

      // Keep existing values if the new ones aren't provided
      if (name && (name !== 'User' || !existingUser.name)) {
        updateFields.push('name = ?');
        updateValues.push(name);
      }
      if (email && (!existingUser.email || existingUser.email === 'undefined')) {
        updateFields.push('email = ?');
        updateValues.push(email);
      }
      if (mobile && !existingUser.mobile) {
        updateFields.push('mobile = ?');
        updateValues.push(mobile);
      }
      if (password && !existingUser.password) {
        updateFields.push('password = ?');
        updateValues.push(password);
      }

      if (updateFields.length > 0) {
        updateValues.push(firebase_uid); // For WHERE clause
        await db.query(
          `UPDATE Users SET ${updateFields.join(', ')} WHERE firebase_uid = ?`,
          updateValues
        );
      }

      // Build userRecord from DB row, prefer existing DB values if request omitted fields
      const dbRow = existingUsers[0];
      userRecord = {
        user_id: dbRow.user_id,
        firebase_uid: dbRow.firebase_uid,
        name: (typeof name !== 'undefined' && name !== null) ? name : dbRow.name,
        email: (typeof email !== 'undefined' && email !== null) ? email : dbRow.email,
        mobile: (typeof mobile !== 'undefined' && mobile !== null) ? mobile : dbRow.mobile || null
      };
    } else {
      // Insert new user with all fields
      const insertSql = `
        INSERT INTO Users (
          firebase_uid, name, email, mobile, password
        ) VALUES (
          ?, ?, ?, ?, ?
        )`;
      
      const insertValues = [
        firebase_uid,
        name || 'User',  // Default to 'User' if name is not provided
        email,
        mobile || null,
        password || null
      ];

      console.log('Executing INSERT:', insertSql, insertValues);
      const [result] = await db.query(insertSql, insertValues);
      userRecord = {
        user_id: result.insertId,
        firebase_uid,
        name: insertValues[insertFields.indexOf('name')] || null,
        email: insertValues[insertFields.indexOf('email')] || null,
        mobile: insertValues[insertFields.indexOf('mobile')] || null
      };
    }

    const userId = userRecord.user_id;

    // Generate JWT token and include name so downstream handlers have access
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret';
    const token = jwt.sign(
      { id: userId, firebase_uid, email, name: userRecord.name },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'User synced successfully',
      token,
      user: {
        id: userId,
        firebase_uid: userRecord.firebase_uid,
        name: userRecord.name,
        email: userRecord.email
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
      'SELECT user_id, firebase_uid, name, email, created_at FROM Users WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Normalize to consistent response shape
    const u = users[0];
    res.json({ success: true, user: { id: u.user_id, firebase_uid: u.firebase_uid, name: u.name, email: u.email, created_at: u.created_at } });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

// Get all users (admin)
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT user_id, firebase_uid, name, email, created_at FROM Users ORDER BY created_at DESC'
    );

    const normalized = users.map(u => ({ id: u.user_id, firebase_uid: u.firebase_uid, name: u.name, email: u.email, created_at: u.created_at }));

    res.json({ success: true, users: normalized });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};
