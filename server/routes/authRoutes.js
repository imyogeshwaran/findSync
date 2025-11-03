const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const userController = require('../controllers/userController');
require('dotenv').config();

// Route for handling manual signup
router.post('/signup', async (req, res) => {
  try {
    console.log('auth/signup called with body:', req.body);
    const { firebase_uid, name, email, mobile, password } = req.body;

    if (!firebase_uid || !email || !password) {
      return res.status(400).json({ error: 'Firebase UID, email, and password are required for manual signup' });
    }

    // Check if user already exists - use LOWER() for case-insensitive email comparison
    const [existingUsers] = await db.query(
      'SELECT user_id, email, firebase_uid FROM Users WHERE LOWER(email) = LOWER(?) OR firebase_uid = ?',
      [email, firebase_uid]
    );
    
    if (existingUsers && existingUsers.length > 0) {
      const matchedUser = existingUsers[0];
      console.log('User exists, updating profile:', {
        attemptedEmail: email.toLowerCase(),
        existingEmail: matchedUser.email.toLowerCase(),
        emailMatch: email.toLowerCase() === matchedUser.email.toLowerCase(),
        attemptedFirebaseUid: firebase_uid,
        matchedUserId: matchedUser.user_id
      });

      // Update the user's information
      const updateSql = `
        UPDATE Users 
        SET 
          name = COALESCE(?, name),
          mobile = COALESCE(?, mobile),
          password = COALESCE(?, password)
        WHERE user_id = ?
      `;
      
      try {
        await db.query(updateSql, [name, mobile, password, matchedUser.user_id]);
        console.log('Updated user profile successfully');

        // Generate JWT for the existing user
        const token = jwt.sign(
          {
            id: matchedUser.user_id,
            firebase_uid: matchedUser.firebase_uid,
            email: matchedUser.email,
            name: name || matchedUser.name
          },
          process.env.JWT_SECRET || 'dev-secret',
          { expiresIn: '7d' }
        );

        return res.json({
          success: true,
          message: 'User profile updated successfully',
          token,
          user: {
            id: matchedUser.user_id,
            firebase_uid: matchedUser.firebase_uid,
            email: matchedUser.email,
            name: name || matchedUser.name
          }
        });
      } catch (updateError) {
        console.error('Failed to update user profile:', updateError);
        return res.status(500).json({
          error: 'Failed to update user profile',
          details: process.env.NODE_ENV === 'development' ? updateError.message : undefined
        });
      }
    }

    // Use a direct INSERT with known columns - simpler and more reliable
    const insertSql = `
      INSERT INTO Users (
        firebase_uid, name, email, mobile, phone, password
      ) VALUES (
        ?, ?, ?, ?, ?, ?
      )`;
    const values = [
      firebase_uid,
      name || null,
      email,
      mobile || null,  // try mobile column
      mobile || null,  // also update phone column for compatibility
      password || null
    ];

    console.log('Executing INSERT with SQL:', insertSql);
    console.log('Values:', values);

    let userId;
    
    try {
      const [result] = await db.query(insertSql, values);
      console.log('INSERT successful, insertId:', result.insertId);
      userId = result.insertId;
    } catch (dbError) {
      console.error('Database error during INSERT:', dbError);
      // Try fallback without mobile/phone if the first attempt fails
      if (dbError.code === 'ER_BAD_FIELD_ERROR') {
        console.log('Retrying INSERT without mobile/phone columns...');
        const fallbackSql = `
          INSERT INTO Users (
            firebase_uid, name, email, password
          ) VALUES (
            ?, ?, ?, ?
          )`;
        const fallbackValues = [firebase_uid, name || null, email, password || null];
        
        try {
          const [fallbackResult] = await db.query(fallbackSql, fallbackValues);
          console.log('Fallback INSERT successful, insertId:', fallbackResult.insertId);
          userId = fallbackResult.insertId;
        } catch (fallbackError) {
          console.error('Fallback INSERT also failed:', fallbackError);
          return res.status(500).json({
            error: 'Database error while creating user',
            details: process.env.NODE_ENV === 'development' ? fallbackError.message : undefined
          });
        }
      } else {
        return res.status(500).json({
          error: 'Database error while creating user',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        });
      }
    }

    // Generate JWT (use fallback secret in dev if missing)
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret';
    const token = jwt.sign(
      {
        id: userId,
        firebase_uid,
        email,
        name
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
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
    return res.status(500).json({ 
      error: 'Failed to create user',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Route for handling Google/Firebase authentication
// This endpoint will ensure the user exists in the database and return a JWT
router.post('/login', async (req, res) => {
  try {
    const { email, password, firebase_uid, name, id_token } = req.body;

    // Check if this is a regular login (email + password) or Firebase auth
    const isRegularLogin = email && password;
    const isFirebaseLogin = firebase_uid && id_token;

    if (!isRegularLogin && !isFirebaseLogin) {
      return res.status(400).json({ error: 'Invalid login credentials' });
    }

    // Ensure user exists in Users table and get their DB user_id
    let userId = null;
    let userName = name;
    let userFirebaseUid = firebase_uid;

    try {
      // For regular login, check email and password
      if (isRegularLogin) {
        const [users] = await db.query(
          'SELECT user_id, firebase_uid, name, email, password FROM Users WHERE LOWER(email) = LOWER(?)',
          [email]
        );

        if (!users || users.length === 0) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];
        if (user.password !== password) { // In production, use proper password hashing!
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        userId = user.user_id;
        userFirebaseUid = user.firebase_uid;
        userName = user.name;
      } else {
        // For Firebase login, find user by firebase_uid or email
        const [existingUsers] = await db.query(
          'SELECT user_id, firebase_uid, name, email FROM Users WHERE firebase_uid = ? OR LOWER(email) = LOWER(?)',
          [firebase_uid, email]
        );
    
    if (existingUsers && existingUsers.length > 0) {
          const user = existingUsers[0];
          userId = user.user_id;
          
          // Update user info if it's changed
          if (user.name !== name || user.email !== email || user.firebase_uid !== firebase_uid) {
            console.log('Updating existing user info:', {
              oldName: user.name,
              newName: name,
              oldEmail: user.email,
              newEmail: email,
              oldFirebaseUid: user.firebase_uid,
              newFirebaseUid: firebase_uid
            });
            
            await db.query(
              'UPDATE Users SET name = ?, email = ?, firebase_uid = ? WHERE user_id = ?',
              [name, email, firebase_uid, userId]
            );
          }
        } else {
          // Insert new user for Firebase auth
          const [result] = await db.query(
            'INSERT INTO Users (firebase_uid, name, email) VALUES (?, ?, ?)',
            [firebase_uid, name, email]
          );
          userId = result.insertId;
        }
      }

      // Issue JWT including the DB user id and name
      const jwtSecret = process.env.JWT_SECRET || 'dev-secret';
      const token = jwt.sign(
        {
          id: userId,
          firebase_uid: userFirebaseUid,
          email,
          name: userName
        },
        jwtSecret,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: userId,
          firebase_uid: userFirebaseUid,
          email,
          name: userName
        }
      });
    } catch (dbError) {
      console.error('Database error during login:', dbError);
      res.status(500).json({ error: 'Database operation failed', details: process.env.NODE_ENV === 'development' ? dbError.message : undefined });
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed', details: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

// Backwards-compatible sync endpoint (some frontends call /api/auth/sync)
router.post('/sync', userController.syncUser);

module.exports = router;

