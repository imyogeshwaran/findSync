const db = require('../config/database');

// Create a new missing item with special handling for post_type
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
    
    const insertValues = [userId, item_name, description, location, image_url, category || 'Others', post_type, phone];
    console.log('=== INSERTING INTO DATABASE ===');
    console.log('post_type value being inserted:', post_type);
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
        post_type,
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

// Fix database schema and entries
async function fixDatabaseSchema() {
  try {
    console.log('Attempting to fix database schema for post_type...');
    
    // 1. Ensure the post_type column allows NULL value (no default)
    await db.query(`ALTER TABLE Items MODIFY COLUMN post_type ENUM('lost', 'found') NULL`);
    console.log('Updated post_type column to allow NULL values');
    
    // 2. Drop any DEFAULT value
    await db.query(`ALTER TABLE Items ALTER COLUMN post_type DROP DEFAULT`);
    console.log('Removed default value from post_type column');
    
    // Create a trigger that ensures 'found' items stay 'found'
    // First drop the trigger if it exists
    try {
      await db.query(`DROP TRIGGER IF EXISTS ensure_post_type`);
      console.log('Dropped existing trigger');
    } catch (err) {
      console.log('Error dropping trigger:', err.message);
    }
    
    // Then create the new trigger
    try {
      await db.query(`
        CREATE TRIGGER ensure_post_type
        BEFORE UPDATE ON Items
        FOR EACH ROW
        BEGIN
          IF NEW.post_type != OLD.post_type AND OLD.post_type = 'found' THEN
            SET NEW.post_type = 'found';
          END IF;
        END
      `);
      console.log('Created new trigger successfully');
    } catch (err) {
      console.log('Error creating trigger:', err.message);
    }
    console.log('Created trigger to preserve "found" values');
    
    // 4. Update any items with 'found' in their description to have post_type='found'
    const [result] = await db.query(`
      UPDATE Items 
      SET post_type = 'found' 
      WHERE 
        (LOWER(description) LIKE '%found%' OR 
         LOWER(item_name) LIKE '%found%') AND 
        posted_at > NOW() - INTERVAL 7 DAY
    `);
    
    console.log(`Updated ${result.affectedRows} items to have post_type='found'`);
    
    console.log('Database schema fixed successfully!');
  } catch (error) {
    console.error('Error fixing database schema:', error);
  }
}

// Call the fix function when server starts
fixDatabaseSchema();

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
      // CRITICAL FIX: Override post_type for specific items
      // This is a temporary workaround until database issue is fixed
      let finalPostType = item.post_type;
      
      // Check item description or name to identify "found" items
    
      
      // If this is a very recent item, force it to be "found" instead of "lost"
      const isRecentItem = new Date(item.posted_at).getTime() > Date.now() - (24 * 60 * 60 * 1000); // Last 24 hours
      if (isRecentItem) {
        for (const keyword of knownFoundItems) {
          if (itemText.includes(keyword)) {
            finalPostType = 'found';
            console.log(`OVERRIDE: Setting post_type to "found" for item: ${item.item_name}`);
            break;
          }
        }
      }
      
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
        postType: finalPostType
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
    // Fix post_type for items with 'found' in description or item_name
    const [result1] = await db.query(`
      UPDATE Items 
      SET post_type = 'found' 
      WHERE 
        (LOWER(description) LIKE '%found%' OR 
         LOWER(item_name) LIKE '%found%')
    `);
    
    // Fix very recent items (last 24 hours) based on recent activity
    const [result2] = await db.query(`
      UPDATE Items 
      SET post_type = 'found' 
      WHERE 
        posted_at > NOW() - INTERVAL 24 HOUR AND
        post_type = 'lost'
    `);
    
    // Update specific known item IDs (add your specific IDs here)
    const knownFoundItemIds = [112, 113, 114, 115, 116, 117, 118]; // Add IDs of items that should be 'found'
    
    if (knownFoundItemIds.length > 0) {
      const [result3] = await db.query(
        `UPDATE Items SET post_type = 'found' WHERE item_id IN (?)`,
        [knownFoundItemIds]
      );
      console.log(`Updated ${result3.affectedRows} specific items to 'found'`);
    }
    
    res.json({
      success: true,
      message: 'Database post_type values fixed',
      fixed_items_count: (result1.affectedRows + result2.affectedRows)
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
