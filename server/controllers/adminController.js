const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Admin login
exports.login = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!password || (!username && !email)) {
      return res.status(400).json({ error: 'Username/Email and password are required' });
    }

    // Query admin by username or email
    let query = 'SELECT admin_id, username, email, password_hash, created_at FROM admin WHERE ';
    let params = [];

    if (username) {
      query += 'username = ?';
      params.push(username);
    } else {
      query += 'email = ?';
      params.push(email);
    }

    const [admins] = await db.query(query, params);

    if (!admins || admins.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = admins[0];

    // Compare password with hash
    const passwordMatches = await bcrypt.compare(password, admin.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret';
    const token = jwt.sign(
      {
        admin_id: admin.admin_id,
        username: admin.username,
        email: admin.email,
        role: 'admin'
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      admin: {
        admin_id: admin.admin_id,
        username: admin.username,
        email: admin.email,
        created_at: admin.created_at
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      error: 'Login failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get admin dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    console.log('Fetching dashboard stats...');
    
    // Get total users
    const [usersCount] = await db.query('SELECT COUNT(*) as count FROM Users');
    
    // Get total items
    const [itemsCount] = await db.query('SELECT COUNT(*) as count FROM Items');
    
    // Get recent users
    const [recentUsers] = await db.query(
      'SELECT user_id, name, email, created_at FROM Users ORDER BY created_at DESC LIMIT 5'
    );
    
    // Get recent items with all details for modal display
    let recentItems = [];
    try {
      const [items] = await db.query(
        `SELECT 
          i.item_id, 
          i.item_name, 
          i.description,
          i.category,
          i.post_type,
          i.location,
          i.image_url,
          i.status, 
          i.posted_at,
          i.phone,
          i.user_id,
          u.name as user_name
        FROM Items i
        LEFT JOIN Users u ON i.user_id = u.user_id
        ORDER BY i.posted_at DESC LIMIT 5`
      );
      recentItems = items || [];
    } catch (itemErr) {
      console.warn('Could not fetch items with all columns:', itemErr.message);
      // Fallback: try without potentially missing columns
      try {
        const [items] = await db.query(
          `SELECT 
            i.item_id, 
            i.item_name, 
            i.description,
            i.category,
            i.post_type,
            i.location,
            i.image_url,
            i.posted_at,
            i.user_id,
            u.name as user_name
          FROM Items i
          LEFT JOIN Users u ON i.user_id = u.user_id
          ORDER BY i.posted_at DESC LIMIT 5`
        );
        recentItems = items || [];
      } catch (fallbackErr) {
        console.error('Failed to fetch items even with fallback:', fallbackErr.message);
        recentItems = [];
      }
    }

    console.log('Dashboard stats fetched successfully');
    return res.json({
      stats: {
        totalUsers: usersCount[0].count,
        totalItems: itemsCount[0].count,
        recentUsers: recentUsers || [],
        recentItems: recentItems || []
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    console.error('Error details:', error.message, error.code);
    return res.status(500).json({
      error: 'Failed to fetch dashboard stats',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query('SELECT user_id, name, email, mobile, created_at FROM Users');
    return res.json({ users: users || [] });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({
      error: 'Failed to fetch users',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all items
exports.getAllItems = async (req, res) => {
  try {
    console.log('Fetching all items...');
    
    // Fetch all item details including description, category, post_type, location, image_url and user name
    let items = [];
    try {
      const [result] = await db.query(
        `SELECT 
          i.item_id, 
          i.item_name, 
          i.description, 
          i.category, 
          i.post_type, 
          i.location, 
          i.image_url, 
          i.status, 
          i.user_id, 
          i.posted_at,
          i.phone,
          u.name as user_name
        FROM Items i
        LEFT JOIN Users u ON i.user_id = u.user_id`
      );
      items = result || [];
    } catch (err) {
      console.warn('Error fetching items with all columns:', err.message);
      // Fallback: try without potentially missing columns
      try {
        const [result] = await db.query(
          `SELECT 
            i.item_id, 
            i.item_name, 
            i.description, 
            i.category, 
            i.post_type, 
            i.location, 
            i.image_url, 
            i.user_id, 
            i.posted_at,
            u.name as user_name
          FROM Items i
          LEFT JOIN Users u ON i.user_id = u.user_id`
        );
        items = result || [];
      } catch (fallbackErr) {
        console.error('Failed to fetch items even with fallback:', fallbackErr.message);
        throw fallbackErr;
      }
    }
    
    console.log('Fetched', items.length, 'items with full details');
    return res.json({ items: items || [] });
  } catch (error) {
    console.error('Get items error:', error);
    console.error('Error details:', error.message, error.code);
    return res.status(500).json({
      error: 'Failed to fetch items',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    await db.query('DELETE FROM Users WHERE user_id = ?', [userId]);
    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      error: 'Failed to delete user',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete item
exports.deleteItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required' });
    }

    await db.query('DELETE FROM Items WHERE item_id = ?', [itemId]);
    return res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    return res.status(500).json({
      error: 'Failed to delete item',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get pending posts for approval
exports.getPendingPosts = async (req, res) => {
  try {
    console.log('Fetching pending posts...');
    
    // First check if approval_status column exists
    const [columns] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Items' AND COLUMN_NAME = 'approval_status'`
    );
    
    if (columns.length === 0) {
      console.warn('approval_status column does not exist, adding it...');
      try {
        await db.query(`ALTER TABLE Items ADD COLUMN approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'`);
        console.log('✅ approval_status column added successfully');
      } catch (alterErr) {
        if (!alterErr.message.includes('Duplicate column')) {
          throw alterErr;
        }
      }
    }
    
    const [items] = await db.query(
      `SELECT item_id, item_name, post_type, category, location, posted_at, approval_status, 
              user_id, description, phone FROM Items WHERE approval_status = 'pending' ORDER BY posted_at DESC`
    );
    console.log('Found', items.length, 'pending posts');
    return res.json({ items: items || [] });
  } catch (error) {
    console.error('Get pending posts error:', error);
    console.error('Error details:', error.message, error.code);
    return res.status(500).json({
      error: 'Failed to fetch pending posts',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get approved posts
exports.getApprovedPosts = async (req, res) => {
  try {
    console.log('Fetching approved posts...');
    
    // First check if approval_status column exists
    const [columns] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Items' AND COLUMN_NAME = 'approval_status'`
    );
    
    if (columns.length === 0) {
      console.warn('approval_status column does not exist, adding it...');
      try {
        await db.query(`ALTER TABLE Items ADD COLUMN approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'`);
        console.log('✅ approval_status column added successfully');
      } catch (alterErr) {
        if (!alterErr.message.includes('Duplicate column')) {
          throw alterErr;
        }
      }
    }
    
    const [items] = await db.query(
      `SELECT item_id, item_name, post_type, category, location, posted_at, approval_status, 
              user_id, description, phone FROM Items WHERE approval_status = 'approved' ORDER BY posted_at DESC`
    );
    console.log('Found', items.length, 'approved posts');
    return res.json({ items: items || [] });
  } catch (error) {
    console.error('Get approved posts error:', error);
    console.error('Error details:', error.message, error.code);
    return res.status(500).json({
      error: 'Failed to fetch approved posts',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get rejected posts
exports.getRejectedPosts = async (req, res) => {
  try {
    console.log('Fetching rejected posts...');
    
    // First check if approval_status column exists
    const [columns] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Items' AND COLUMN_NAME = 'approval_status'`
    );
    
    if (columns.length === 0) {
      console.warn('approval_status column does not exist, adding it...');
      try {
        await db.query(`ALTER TABLE Items ADD COLUMN approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'`);
        console.log('✅ approval_status column added successfully');
      } catch (alterErr) {
        if (!alterErr.message.includes('Duplicate column')) {
          throw alterErr;
        }
      }
    }
    
    const [items] = await db.query(
      `SELECT item_id, item_name, post_type, category, location, posted_at, approval_status, 
              user_id, description, phone FROM Items WHERE approval_status = 'rejected' ORDER BY posted_at DESC`
    );
    console.log('Found', items.length, 'rejected posts');
    return res.json({ items: items || [] });
  } catch (error) {
    console.error('Get rejected posts error:', error);
    console.error('Error details:', error.message, error.code);
    return res.status(500).json({
      error: 'Failed to fetch rejected posts',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Approve a post
exports.approvePost = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required' });
    }

    await db.query('UPDATE Items SET approval_status = ? WHERE item_id = ?', ['approved', itemId]);
    return res.json({ success: true, message: 'Post approved successfully' });
  } catch (error) {
    console.error('Approve post error:', error);
    return res.status(500).json({
      error: 'Failed to approve post',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Reject a post
exports.rejectPost = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required' });
    }

    await db.query('UPDATE Items SET approval_status = ? WHERE item_id = ?', ['rejected', itemId]);
    return res.json({ success: true, message: 'Post rejected successfully' });
  } catch (error) {
    console.error('Reject post error:', error);
    return res.status(500).json({
      error: 'Failed to reject post',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
