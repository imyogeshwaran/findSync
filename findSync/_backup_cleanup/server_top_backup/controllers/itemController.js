const db = require('../config/database');
const multer = require('multer');
const path = require('path');

// Multer setup to store file in memory so we can write binary to DB
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const okExt = allowed.test(path.extname(file.originalname).toLowerCase());
    const okMime = allowed.test(file.mimetype);
    if (okExt && okMime) return cb(null, true);
    cb(new Error('Only images (jpeg, jpg, png) are allowed'));
  }
}).single('image');

// Create an item (lost/found) and optionally store an image as binary in ItemImages
exports.createItem = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const { item_name, description, category, post_type, location } = req.body;
    const userId = req.user && (req.user.user_id || req.user.id);

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!item_name || !location || !post_type) {
      return res.status(400).json({ error: 'item_name, location and post_type are required' });
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [itemRes] = await conn.query(
        `INSERT INTO Items (user_id, item_name, description, category, post_type, location, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, item_name, description || null, category || null, post_type, location, req.file ? req.file.originalname : null]
      );

      const itemId = itemRes.insertId;

      if (req.file) {
        await conn.query(
          `INSERT INTO ItemImages (item_id, image_url, image_data) VALUES (?, ?, ?)`,
          [itemId, req.file.originalname, req.file.buffer]
        );
      }

      await conn.commit();

      res.status(201).json({ success: true, item_id: itemId });
    } catch (error) {
      await conn.rollback();
      console.error('Error creating item:', error);
      res.status(500).json({ error: 'Failed to create item', details: error.message });
    } finally {
      conn.release();
    }
  });
};

// Get items with optional filters (post_type, status)
exports.getItems = async (req, res) => {
  try {
    const { post_type, status } = req.query;
    let sql = `SELECT i.*, u.name as owner_name, u.email as owner_email,
                      GROUP_CONCAT(DISTINCT img.image_url) as image_urls
               FROM Items i
               JOIN Users u ON i.user_id = u.user_id
               LEFT JOIN ItemImages img ON i.item_id = img.item_id`;
    const where = [];
    const params = [];
    if (post_type) { where.push('i.post_type = ?'); params.push(post_type); }
    if (status) { where.push('i.status = ?'); params.push(status); }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' GROUP BY i.item_id ORDER BY i.posted_at DESC';

    const [rows] = await db.query(sql, params);
    res.json({ success: true, items: rows });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items', details: error.message });
  }
};

// Get a single item by id
exports.getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT i.*, u.name as owner_name, u.email as owner_email,
              GROUP_CONCAT(DISTINCT img.image_url) as image_urls
       FROM Items i
       JOIN Users u ON i.user_id = u.user_id
       LEFT JOIN ItemImages img ON i.item_id = img.item_id
       WHERE i.item_id = ?
       GROUP BY i.item_id`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ success: true, item: rows[0] });
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item', details: error.message });
  }
};

// Get items for current user
exports.getUserItems = async (req, res) => {
  try {
    const userId = req.user && (req.user.user_id || req.user.id);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const [rows] = await db.query('SELECT * FROM Items WHERE user_id = ? ORDER BY posted_at DESC', [userId]);
    res.json({ success: true, items: rows });
  } catch (error) {
    console.error('Error fetching user items:', error);
    res.status(500).json({ error: 'Failed to fetch user items', details: error.message });
  }
};

// Update item status (open/matched/closed)
exports.updateItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user && (req.user.user_id || req.user.id);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const [result] = await db.query('UPDATE Items SET status = ? WHERE item_id = ? AND user_id = ?', [status, id, userId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Item not found or not owned by user' });
    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status', details: error.message });
  }
};

// Delete item
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user && (req.user.user_id || req.user.id);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const [result] = await db.query('DELETE FROM Items WHERE item_id = ? AND user_id = ?', [id, userId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Item not found or not owned by user' });
    res.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item', details: error.message });
  }
};
