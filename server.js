import express from 'express';
import cors from 'cors';
import mysql from 'mysql2';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors({ origin: ['http://localhost:5174', 'http://127.0.0.1:5174'] }));
app.use(express.json());

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'findsync',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

// Test database connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error connecting to MySQL database:', err.message);
    console.log('💡 Database Setup Required:');
    console.log('   1. Create database: mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS findsync;"');
    console.log('   2. Run schema: mysql -u root -p findsync < setup-database.sql');
    console.log('   3. Create .env file with your MySQL password');
    console.log('   4. Restart server: npm run api');
  } else {
    console.log('✅ Successfully connected to MySQL database');
    connection.release();
  }
});

// JWT Secret (in production, use a secure secret)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Routes
app.get('/api/items/missing', async (req, res) => {
  try {
    const [items] = await promisePool.query(
      `SELECT i.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone
       FROM Items i 
       JOIN Users u ON i.user_id = u.user_id 
       WHERE i.post_type = 'lost' AND i.status = 'open'
       ORDER BY i.posted_at DESC`
    );
    
    res.json({ items });
  } catch (error) {
    console.error('Error fetching missing items:', error);
    res.status(500).json({ error: 'Failed to fetch missing items' });
  }
});

app.post('/api/items/missing', authenticateToken, async (req, res) => {
  try {
    const {
      item_name: itemNameRaw,
      name: nameRaw,
      description,
      location,
      phone: phoneRaw,
      mobile: mobileRaw,
      image_url,
      category
    } = req.body;

    const userId = req.user.user_id;
    const item_name = itemNameRaw || nameRaw;
    const phone = phoneRaw || mobileRaw;

    const missing = [];
    if (!item_name) missing.push('item name');
    if (!location) missing.push('location');
    if (!phone) missing.push('mobile number');
    if (missing.length) {
      return res.status(400).json({
        error: `${missing.join(', ')} ${missing.length > 1 ? 'are' : 'is'} required`
      });
    }

    const [result] = await promisePool.query(
      `INSERT INTO Items (user_id, item_name, description, location, image_url, category, post_type, phone)
       VALUES (?, ?, ?, ?, ?, ?, 'lost', ?)`,
      [userId, item_name, description, location, image_url, category || 'Others', phone]
    );

    res.status(201).json({
      success: true,
      message: 'Missing item created successfully',
      item: {
        item_id: result.insertId,
        user_id: userId,
        item_name,
        description,
        location,
        image_url,
        category: category || 'Others',
        post_type: 'lost',
        status: 'open',
        phone
      }
    });
  } catch (error) {
    console.error('Error creating missing item:', error);
    res.status(500).json({ error: 'Failed to create missing item', details: error.message });
  }
});

app.post('/api/users/sync', async (req, res) => {
  try {
    const { firebase_uid, name, email } = req.body;
    
    if (!firebase_uid || !email) {
      return res.status(400).json({ error: 'Firebase UID and email are required' });
    }
    
    // Check if user already exists by firebase_uid
    const [existingUsers] = await promisePool.query(
      'SELECT * FROM Users WHERE firebase_uid = ?',
      [firebase_uid]
    );
    
    let user;
    
    if (existingUsers.length > 0) {
      // Update existing user with latest Firebase data
      await promisePool.query(
        'UPDATE Users SET name = ?, email = ? WHERE firebase_uid = ?',
        [name, email, firebase_uid]
      );
      user = existingUsers[0];
      console.log('✅ Updated existing user:', email);
    } else {
      // Insert new user from Firebase
      const [result] = await promisePool.query(
        'INSERT INTO Users (firebase_uid, name, email) VALUES (?, ?, ?)',
        [firebase_uid, name, email]
      );
      user = {
        user_id: result.insertId,
        firebase_uid,
        name,
        email
      };
      console.log('✅ Created new user:', email);
    }
    
    // Generate JWT token with user_id
    const token = jwt.sign(
      { user_id: user.user_id, firebase_uid, email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: 'User synced successfully',
      token,
      user: {
        user_id: user.user_id,
        firebase_uid,
        name,
        email
      }
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Failed to sync user', details: error.message });
  }
});

app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const [users] = await promisePool.query(
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
});

// Get user's items
app.get('/api/users/items', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const [items] = await promisePool.query(
      `SELECT * FROM Items 
       WHERE user_id = ? 
       ORDER BY posted_at DESC`,
      [userId]
    );
    
    res.json({ success: true, items });
  } catch (error) {
    console.error('Error getting user items:', error);
    res.status(500).json({ error: 'Failed to get user items' });
  }
});

// Update user profile
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { name, phone, location } = req.body;
    
    await promisePool.query(
      'UPDATE Users SET name = ?, phone = ?, location = ? WHERE user_id = ?',
      [name, phone, location, userId]
    );
    
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 API server running on http://127.0.0.1:${PORT}`));
