const db = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Sync Firebase user to MySQL
exports.syncUser = async (req, res) => {
  try {
    console.log('syncUser called with body:', req.body);
    // Accept either `mobile` or `phone` from the client (some forms send `phone`)
    const { firebase_uid, name, email, mobile, phone, password, isGoogleAuth } = req.body;
    const normalizedMobile = mobile || phone || null;

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

      // Keep existing values if the new ones aren't provided. Prefer meaningful names over the default 'User'.
      if (name && name !== 'User' && name !== existingUser.name) {
        updateFields.push('name = ?');
        updateValues.push(name);
      }
      if (email && email !== existingUser.email) {
        updateFields.push('email = ?');
        updateValues.push(email);
      }
      if (normalizedMobile && !existingUser.mobile) {
        updateFields.push('mobile = ?');
        updateValues.push(normalizedMobile);
      }
      if (password && !existingUser.password) {
        // Hash password before storing
        const hashed = await bcrypt.hash(password, 10);
        updateFields.push('password = ?');
        updateValues.push(hashed);
      }

      if (updateFields.length > 0) {
        updateValues.push(firebase_uid); // For WHERE clause
        await db.query(
          `UPDATE Users SET ${updateFields.join(', ')} WHERE firebase_uid = ?`,
          updateValues
        );
      }

      // Re-read the user row so we return the actual saved values
      const [refreshed] = await db.query(
        'SELECT user_id, firebase_uid, name, email, mobile FROM Users WHERE firebase_uid = ? OR email = ?',
        [firebase_uid, email]
      );
      const dbRow = refreshed && refreshed[0] ? refreshed[0] : existingUser;
      userRecord = {
        user_id: dbRow.user_id,
        firebase_uid: dbRow.firebase_uid,
        name: dbRow.name,
        email: dbRow.email,
        mobile: dbRow.mobile || null
      };
    } else {
      // Insert new user with all fields
      const insertSql = `
        INSERT INTO Users (
          firebase_uid, name, email, mobile, password
        ) VALUES (
          ?, ?, ?, ?, ?
        )`;

      // Hash password before insert if provided
      const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
      // If name is not meaningful (e.g. 'User') store NULL so we don't persist a placeholder
      const insertValues = [
        firebase_uid,
        name && name !== 'User' ? name : null,
        email,
        normalizedMobile,
        hashedPassword
      ];

      console.log('Executing INSERT:', insertSql, insertValues);
      const [result] = await db.query(insertSql, insertValues);

      // Read back the inserted row to get the real stored values
      const [rowsAfterInsert] = await db.query(
        'SELECT user_id, firebase_uid, name, email, mobile FROM Users WHERE user_id = ?',
        [result.insertId]
      );
      const inserted = rowsAfterInsert && rowsAfterInsert[0] ? rowsAfterInsert[0] : null;
      userRecord = {
        user_id: inserted ? inserted.user_id : result.insertId,
        firebase_uid,
        name: inserted ? inserted.name : insertValues[1],
        email: inserted ? inserted.email : insertValues[2],
        mobile: inserted ? inserted.mobile : insertValues[3]
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
        email: userRecord.email,
        mobile: userRecord.mobile || null
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
      'SELECT user_id, firebase_uid, name, email, mobile, created_at FROM Users WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Normalize to consistent response shape
  const u = users[0];
  res.json({ success: true, user: { id: u.user_id, firebase_uid: u.firebase_uid, name: u.name, email: u.email, mobile: u.mobile || null, created_at: u.created_at } });
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
