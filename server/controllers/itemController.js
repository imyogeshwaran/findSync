const db = require('../config/database');
const fs = require('fs');
const path = require('path');

// Create a new missing item with proper post_type handling
exports.createMissingItem = async (req, res) => {
  try {
    console.log('Request received at:', new Date().toISOString());
    console.log('Full request:', {
      body: req.body,
      headers: req.headers,
      user: req.user,
      method: req.method,
      path: req.path,
      query: req.query
    });
    
    console.log('==========================================');
    console.log('Raw request body:', typeof req.body, req.body);
    console.log('==========================================');
    
    // Extract incoming fields
    let { item_name, description, location, category, phone, post_type, finder_name } = req.body;
    
    // Handle uploaded image file
    // Instead of storing large base64 data in the DB (which can overflow column limits),
    // save the file to disk under server/public/uploads and store a small URL path in DB.
    let image_url = null;
    if (req.file) {
      try {
        // Ensure uploads directory exists
        const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
        fs.mkdirSync(uploadsDir, { recursive: true });

        // Determine extension from original name or fallback to jpg
        const origName = req.file.originalname || '';
        let ext = path.extname(origName).toLowerCase();
        if (!ext) {
          // Fallback by mimetype
          if (req.file.mimetype === 'image/png') ext = '.png';
          else if (req.file.mimetype === 'image/webp') ext = '.webp';
          else if (req.file.mimetype === 'image/gif') ext = '.gif';
          else ext = '.jpg';
        }

        const filename = `${Date.now()}-${Math.random().toString(36).slice(2,10)}${ext}`;
        const filePath = path.join(uploadsDir, filename);

        // Write buffer to disk
        fs.writeFileSync(filePath, req.file.buffer);

        // Store the accessible uploads path (served by server as /uploads/...)
        // Use absolute URL so the browser loads image from backend (not from Vite dev server)
        const relativePath = `/uploads/${filename}`;
        const host = req.get && req.get('host') ? req.get('host') : (process.env.BACKEND_HOST || 'localhost:5000');
        // Store just the relative path - the frontend will construct the full URL
        image_url = relativePath;
        console.log('Saved uploaded image to', filePath, 'and stored image_url as', image_url);

        // Create absolute URL for immediate Socket.IO broadcast
        const baseUrl = `http://${host}`;
        const absoluteImageUrl = `${baseUrl}${relativePath}`;
      } catch (fsErr) {
        console.error('Failed to save uploaded file to disk:', fsErr.message);
        // Keep image_url null so DB insert won't store an oversized value
        image_url = null;
      }
    }

    // Resolve user id and name from the token and database
    let userId = req.user && req.user.id;
    const firebaseUid = req.user && req.user.firebase_uid;
    const tokenName = req.user && (req.user.name || req.user.displayName || null);
    
    console.log('Auth debug - Token data:', {
      userId,
      firebaseUid,
      tokenName,
      fullUser: req.user
    });

    // If we don't have a userId but have firebaseUid, look up or create the user
    if ((!userId || userId === null) && firebaseUid) {
      try {
        const [users] = await db.query('SELECT user_id, name FROM Users WHERE firebase_uid = ?', [firebaseUid]);
        if (users && users.length > 0) {
          userId = users[0].user_id;
          finder_name = users[0].name || tokenName || finder_name;
          console.log('Found existing user:', { userId, name: users[0].name });
        } else {
          // Create new user with name from token
          const [r] = await db.query('INSERT INTO Users (firebase_uid, email, name) VALUES (?, ?, ?)', 
            [firebaseUid, req.user.email || null, tokenName || null]);
          userId = r.insertId;
          finder_name = tokenName || finder_name;
          console.log('Created new user:', { userId, name: tokenName });
        }
      } catch (err) {
        console.error('Error resolving user from firebase_uid:', err.message);
      }
    } else if (userId) {
      // If we have userId, make sure to get the name
      try {
        const [users] = await db.query('SELECT name FROM Users WHERE user_id = ?', [userId]);
        if (users && users.length > 0 && users[0].name) {
          finder_name = users[0].name;
          console.log('Retrieved name for existing userId:', { userId, name: users[0].name });
        }
      } catch (err) {
        console.error('Error getting user name:', err.message);
      }
    }

    console.log('==========================================');
    console.log('Extracted fields:', {
      item_name: item_name || '(missing)',
      description: description || '(missing)',
      location: location || '(missing)',
      image_url: image_url || '(missing)',
      category: category || '(missing)',
      phone: phone || '(missing)',
      post_type: post_type || '(missing)',
      finder_name: finder_name || '(missing)',
      userId: userId || '(missing)'
    });
    console.log('==========================================');
    console.log('DETAILED POST_TYPE ANALYSIS:');
    console.log('post_type value:', post_type);
    console.log('post_type type:', typeof post_type);
    console.log('post_type === "found":', post_type === 'found');
    console.log('post_type === "lost":', post_type === 'lost');
    console.log('post_type == "found":', post_type == 'found');
    console.log('post_type == "lost":', post_type == 'lost');
    console.log('==========================================');
    
    // Validate required fields per schema
    const missingFields = [];
    if (!item_name) missingFields.push('item name');
    if (!location) missingFields.push('location');
    if (!phone) missingFields.push('mobile number');
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `${missingFields.join(', ')} ${missingFields.length > 1 ? 'are' : 'is'} required`
      });
    }
    
    // Ensure post_type is valid, default to 'lost' if not provided or invalid
    const validPostType = (post_type === 'found' || post_type === 'lost') ? post_type : 'lost';
    console.log('=== POST_TYPE VALIDATION ===');
    console.log('Original post_type from request:', post_type);
    console.log('Type of post_type:', typeof post_type);
    console.log('Validated post_type:', validPostType);
    console.log('==========================================');
    
    // Ensure we have a userId before inserting
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: user id could not be resolved' });
    }

    console.log('=== INSERTING INTO DATABASE ===');
    console.log('post_type value being inserted:', validPostType);

  // Detect whether the Items table has a finder_name column
  let includeFinder = false;
  // Will hold the final name used for finder_name column
  let resolvedFinderName = null;
    try {
      const [foundCols] = await db.query("SHOW COLUMNS FROM Items LIKE 'finder_name'");
      includeFinder = foundCols && foundCols.length > 0;
    } catch (colErr) {
      console.warn('Could not check for finder_name column:', colErr.message);
    }

    let result;
    let userName = 'Unknown';
    if (includeFinder) {
      // Get the user's name from the database
      try {
        console.log('Looking up user name for userId:', userId);
        const [userResult] = await db.query('SELECT name FROM Users WHERE user_id = ?', [userId]);
        if (userResult && userResult.length > 0 && userResult[0].name) {
          userName = userResult[0].name;
        }
      } catch (err) {
        console.error('Error getting user name:', err);
      }
      try {
        console.log('Looking up user name for userId:', userId);
        const [userResult] = await db.query('SELECT name FROM Users WHERE user_id = ?', [userId]);
        console.log('Database query result for user:', userResult);
        
        if (userResult && userResult.length > 0) {
          console.log('Found user in database:', userResult[0]);
          if (userResult[0].name) {
            userName = userResult[0].name;
            console.log('Using name from database:', userName);
          } else {
            console.log('User found but name is null in database');
          }
        } else {
          console.log('No user found in database for userId:', userId);
        }
      } catch (err) {
        console.error('Error getting user name:', err.message);
      }
      
      console.log('Name resolution debug:', {
        userNameFromDB: userName,
        tokenName: tokenName,
        finder_name: finder_name
      });

      // If DB has no name but token provides one, update the Users table so future lookups succeed
      if ((userName === 'Unknown' || !userName) && tokenName) {
        try {
          console.log('Updating Users table with tokenName for user_id', userId, '->', tokenName);
          await db.query('UPDATE Users SET name = ? WHERE user_id = ?', [tokenName, userId]);
          userName = tokenName;
        } catch (updateErr) {
          console.error('Failed to update Users.name from tokenName:', updateErr.message);
        }
      }

  // Use database name as priority, then fallback to token name or finder_name
  resolvedFinderName = userName !== 'Unknown' ? userName : (tokenName || finder_name || 'Unknown');
      console.log('Final resolved finder name:', resolvedFinderName);

  const insertValues = [userId, item_name, resolvedFinderName, description, location, image_url, category || 'Others', validPostType, phone];
      console.log('Full insert values (with finder_name):', insertValues);
      [result] = await db.query(
        `INSERT INTO Items (user_id, item_name, finder_name, description, location, image_url, category, post_type, phone) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        insertValues
      );
    } else {
      const insertValues = [userId, item_name, description, location, image_url, category || 'Others', validPostType, phone];
      console.log('Full insert values (without finder_name):', insertValues);
      [result] = await db.query(
        `INSERT INTO Items (user_id, item_name, description, location, image_url, category, post_type, phone) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        insertValues
      );
    }

    console.log('Item inserted with ID:', result.insertId);

    // Prepare the new item data for Socket.IO emission
    const newItemData = {
      id: result.insertId,
      item_name,
      description,
      location,
      image_url,
      category: category || 'Others',
      post_type: validPostType,
      finder_name: resolvedFinderName || userName,
      phone,
      posted_at: new Date().toISOString()
    };

    // Emit the new item through Socket.IO
    try {
      console.log('Emitting new item through Socket.IO:', newItemData);
      const io = req.app.get('io');
      if (io) {
        io.emit('new_item', newItemData);
      } else {
        console.error('Socket.IO instance not found');
      }
    } catch (socketError) {
      console.error('Error emitting Socket.IO event:', socketError);
      // Continue with response even if socket emission fails
    }

    // Verify insertion
    const [checkResult] = await db.query(
      `SELECT post_type FROM Items WHERE item_id = ?`,
      [result.insertId]
    );

    if (checkResult.length > 0) {
      console.log('VERIFICATION: post_type is now:', checkResult[0].post_type);
    }

    // Emit real-time event to all connected clients
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('new_item', {
          id: result.insertId,
          user_id: userId,
          item_name,
          finder_name: includeFinder ? (resolvedFinderName || tokenName || null) : undefined,
          description,
          location,
          image_url,
          category: category || 'Others',
          post_type: validPostType,
          phone
        });
        console.log('Emitted new_item event via Socket.IO');
      } else {
        console.warn('Socket.IO instance not found on app');
      }
    } catch (emitErr) {
      console.error('Error emitting new_item event:', emitErr);
    }
    res.status(201).json({
      success: true,
      message: 'Missing item created successfully',
      item: {
        id: result.insertId,
        user_id: userId,
        item_name,
        finder_name: includeFinder ? (resolvedFinderName || tokenName || null) : undefined,
        description,
        location,
        image_url,
        category: category || 'Others',
        post_type: validPostType,
        phone
      }
    });
  } catch (error) {
    console.error('Error creating missing item:', error);
    res.status(500).json({ error: 'Failed to create missing item', details: error.message });
  }
};

// Check database schema to see post_type definition
async function checkPostTypeEnum() {
  try {
    const [columns] = await db.query(
      `SHOW COLUMNS FROM Items WHERE Field = 'post_type'`
    );
    
    if (columns.length > 0) {
      console.log('=== POST_TYPE COLUMN DEFINITION ===');
      console.log('Type:', columns[0].Type);
      console.log('Default:', columns[0].Default);
      console.log('===================================');
    } else {
      console.log('post_type column not found in Items table');
    }
  } catch (error) {
    console.error('Error checking post_type definition:', error);
  }
}

// Call the check function when server starts
checkPostTypeEnum();

// Get all missing items
exports.getAllMissingItems = async (req, res) => {
  try {
    const [items] = await db.query(
      `SELECT 
        i.*,
        u.name as owner_name,
        u.email as owner_email,
        i.phone as owner_phone,
        DATE_FORMAT(i.posted_at, '%Y-%m-%d') as date
       FROM Items i 
       JOIN Users u ON i.user_id = u.user_id 
       WHERE i.status = 'open'
       ORDER BY i.posted_at DESC`
    );
    
    // Transform the items to match frontend expectations
    const transformedItems = items.map(item => {
      console.log('Backend transforming item:', item.item_name, 'post_type:', item.post_type);
      
      return {
        id: item.item_id,
        title: item.item_name,
        description: item.description,
        location: item.location,
        category: item.category,
        image: item.image_url,
        date: item.date,
        ownerName: item.owner_name,
        ownerPhone: item.owner_phone,
        ownerLocation: item.location,
        status: item.status,
        post_type: item.post_type // Use the actual post_type from database
      };
    });
    console.log('Backend sending transformed items count:', transformedItems.length);

    res.json({ success: true, items: transformedItems });
  } catch (error) {
    console.error('Error getting missing items:', error);
    res.status(500).json({ error: 'Failed to get missing items', details: error.message });
  }
};

// Get missing items by user
exports.getUserMissingItems = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [items] = await db.query(
      `SELECT * FROM Items 
       WHERE user_id = ? AND post_type = 'lost'
       ORDER BY posted_at DESC`,
      [userId]
    );
    
    res.json({ success: true, items });
  } catch (error) {
    console.error('Error getting user missing items:', error);
    res.status(500).json({ error: 'Failed to get user missing items' });
  }
};

// Get single missing item
exports.getMissingItemById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [items] = await db.query(
      `SELECT i.*, u.user_id as owner_id, u.name as owner_name, u.email as owner_email, u.firebase_uid 
       FROM Items i 
       JOIN Users u ON i.user_id = u.user_id 
       WHERE i.item_id = ? AND i.post_type = 'lost'`,
      [id]
    );
    
    if (items.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ success: true, item: items[0] });
  } catch (error) {
    console.error('Error getting missing item:', error);
    res.status(500).json({ error: 'Failed to get missing item' });
  }
};

// Manual fix endpoint to fix all post_type values
exports.fixPostTypes = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Post type handling has been simplified - no manual fixes needed',
      fixed_items_count: 0
    });
  } catch (error) {
    console.error('Error fixing post_type values:', error);
    res.status(500).json({ error: 'Failed to fix post_type values', details: error.message });
  }
};

// Update missing item
exports.updateMissingItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, location, mobile, image_url, category, status } = req.body;
    const userId = req.user.id;
    
    // Check if item exists and belongs to user
    const [items] = await db.query(
      'SELECT * FROM missing_items WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (items.length === 0) {
      return res.status(404).json({ error: 'Item not found or unauthorized' });
    }
    
    await db.query(
      `UPDATE missing_items 
       SET name = ?, description = ?, location = ?, mobile = ?, image_url = ?, category = ?, status = ?
       WHERE id = ? AND user_id = ?`,
      [name, description, location, mobile, image_url, category, status || 'missing', id, userId]
    );
    
    res.json({ success: true, message: 'Item updated successfully' });
  } catch (error) {
    console.error('Error updating missing item:', error);
    res.status(500).json({ error: 'Failed to update missing item' });
  }
};

// Delete missing item
exports.deleteMissingItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const [result] = await db.query(
      'DELETE FROM missing_items WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found or unauthorized' });
    }
    
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting missing item:', error);
    res.status(500).json({ error: 'Failed to delete missing item' });
  }
};
