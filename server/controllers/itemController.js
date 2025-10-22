const db = require('../config/database');

// Create a missing item
exports.createMissingItem = async (req, res) => {
  try {
    const { name, description, location, mobile, image_url, category } = req.body;
    const userId = req.user.id;
    
    if (!name || !location) {
      return res.status(400).json({ error: 'Name and location are required' });
    }
    
    const [result] = await db.query(
      `INSERT INTO missing_items (user_id, name, description, location, mobile, image_url, category) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, description, location, mobile, image_url, category || 'Others']
    );
    
    res.status(201).json({
      success: true,
      message: 'Missing item created successfully',
      item: {
        id: result.insertId,
        user_id: userId,
        name,
        description,
        location,
        mobile,
        image_url,
        category: category || 'Others'
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
      `SELECT mi.*, u.name as owner_name, u.email as owner_email 
       FROM missing_items mi 
       JOIN users u ON mi.user_id = u.id 
       WHERE mi.status = 'missing'
       ORDER BY mi.created_at DESC`
    );
    
    res.json({ success: true, items });
  } catch (error) {
    console.error('Error getting missing items:', error);
    res.status(500).json({ error: 'Failed to get missing items' });
  }
};

// Get missing items by user
exports.getUserMissingItems = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [items] = await db.query(
      `SELECT * FROM missing_items 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
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
      `SELECT mi.*, u.name as owner_name, u.email as owner_email, u.firebase_uid 
       FROM missing_items mi 
       JOIN users u ON mi.user_id = u.id 
       WHERE mi.id = ?`,
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
