const db = require('../config/database');

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
    
    const { item_name, description, location, image_url, category, phone, post_type } = req.body;
    const userId = req.user.id;
    
    console.log('==========================================');
    console.log('Extracted fields:', {
      item_name: item_name || '(missing)',
      description: description || '(missing)',
      location: location || '(missing)',
      image_url: image_url || '(missing)',
      category: category || '(missing)',
      phone: phone || '(missing)',
      post_type: post_type || '(missing)',
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
    
    const insertValues = [userId, item_name, description, location, image_url, category || 'Others', validPostType, phone];
    console.log('=== INSERTING INTO DATABASE ===');
    console.log('post_type value being inserted:', validPostType);
    console.log('Full insert values:', insertValues);
    
    const [result] = await db.query(
      `INSERT INTO Items (user_id, item_name, description, location, image_url, category, post_type, phone) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      insertValues
    );
    
    console.log('Item inserted with ID:', result.insertId);

    // Verify insertion
    const [checkResult] = await db.query(
      `SELECT post_type FROM Items WHERE item_id = ?`,
      [result.insertId]
    );

    if (checkResult.length > 0) {
      console.log('VERIFICATION: post_type is now:', checkResult[0].post_type);
    }

    res.status(201).json({
      success: true,
      message: 'Missing item created successfully',
      item: {
        id: result.insertId,
        user_id: userId,
        item_name,
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
      `SELECT i.*, u.name as owner_name, u.email as owner_email, u.firebase_uid 
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
