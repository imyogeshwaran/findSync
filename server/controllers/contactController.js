const db = require('../config/database');

// Create a contact/notification for an item owner
exports.createContact = async (req, res) => {
  try {
    const senderId = req.user && req.user.id;
    const { item_id, message } = req.body;

    if (!senderId) return res.status(401).json({ error: 'Unauthorized' });
    if (!item_id || !message) return res.status(400).json({ error: 'item_id and message are required' });

    // Find the owner/receiver of the item
    const [itemRows] = await db.query(`SELECT i.item_id, i.user_id as owner_id FROM Items i WHERE i.item_id = ?`, [item_id]);
    const item = itemRows && itemRows.length ? itemRows[0] : null;
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const receiverId = item.owner_id;
    if (!receiverId) return res.status(400).json({ error: 'Item owner not found' });

    // Insert into Contacts
    const [result] = await db.query(`INSERT INTO Contacts (sender_id, receiver_id, item_id, message) VALUES (?, ?, ?, ?)`, [senderId, receiverId, item_id, message]);

    res.json({ success: true, contact_id: result.insertId });
  } catch (err) {
    console.error('Error creating contact:', err.message);
    res.status(500).json({ error: 'Failed to create contact', details: err.message });
  }
};

// Get notifications for the logged-in user (contacts where they are receiver)
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const [rows] = await db.query(
      `SELECT c.contact_id, c.sender_id, c.receiver_id, c.item_id, c.message, c.contact_date, u.name as sender_name, u.email as sender_email
       FROM Contacts c
       LEFT JOIN Users u ON c.sender_id = u.user_id
       WHERE c.receiver_id = ?
       ORDER BY c.contact_date DESC`,
      [userId]
    );

    res.json({ success: true, notifications: rows });
  } catch (err) {
    console.error('Error fetching notifications:', err.message);
    res.status(500).json({ error: 'Failed to fetch notifications', details: err.message });
  }
};
