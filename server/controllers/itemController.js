const db = require('../config/database');

// Create a missing item
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
    
    console.log('Raw request body:', typeof req.body, req.body);
    
    const { item_name, description, location, image_url, category, phone } = req.body;
    const userId = req.user.id;
    
    console.log('Extracted fields:', {
      item_name: item_name || '(missing)',
      description: description || '(missing)',
      location: location || '(missing)',
      image_url: image_url || '(missing)',
      category: category || '(missing)',
      phone: phone || '(missing)',
      userId: userId || '(missing)'
    });
    
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
    
    const [result] = await db.query(
      `INSERT INTO Items (user_id, item_name, description, location, image_url, category, post_type, phone) 
       VALUES (?, ?, ?, ?, ?, ?, 'lost', ?)`,
      [userId, item_name, description, location, image_url, category || 'Others', phone]
    );
    
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
        phone
      }
    });
  } catch (error) {
    console.error('Error creating missing item:', error);
    res.status(500).json({ error: 'Failed to create missing item', details: error.message });
  }
};

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
       WHERE i.post_type = 'lost' AND i.status = 'open'
       ORDER BY i.posted_at DESC`
    );
    
    // Transform the items to match frontend expectations
    const transformedItems = items.map(item => ({
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
      status: item.status
    }));

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
