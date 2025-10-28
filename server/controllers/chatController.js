const db = require('../config/database');

// Get chat history for a contact/notification
exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const { contactId } = req.params;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!contactId) return res.status(400).json({ error: 'Contact ID is required' });

    // First verify the user is part of this contact/conversation
    const [contactRows] = await db.query(
      `SELECT * FROM Contacts WHERE contact_id = ? AND (sender_id = ? OR receiver_id = ?)`,
      [contactId, userId, userId]
    );

    if (!contactRows || !contactRows.length) {
      return res.status(403).json({ error: 'Not authorized to view this conversation' });
    }

    const contact = contactRows[0];

    // Get all messages in this conversation
    const [messages] = await db.query(
      `SELECT m.*, 
              u_sender.name as sender_name, 
              u_sender.email as sender_email,
              u_receiver.name as receiver_name,
              u_receiver.email as receiver_email
       FROM Messages m
       LEFT JOIN Users u_sender ON m.sender_id = u_sender.user_id
       LEFT JOIN Users u_receiver ON m.receiver_id = u_receiver.user_id
       WHERE m.contact_id = ?
       ORDER BY m.sent_at ASC`,
      [contactId]
    );

    // Mark unread messages as read if user is receiver
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await db.query(
      `UPDATE Messages 
       SET read_at = ? 
       WHERE contact_id = ? AND receiver_id = ? AND read_at IS NULL`,
      [now, contactId, userId]
    );

    res.json({
      success: true,
      contact,
      messages,
      isOwner: contact.receiver_id === userId
    });
  } catch (err) {
    console.error('Error fetching chat history:', err);
    res.status(500).json({ error: 'Failed to fetch chat history', details: err.message });
  }
};

// Send a reply in an existing conversation
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const { contactId } = req.params;
    const { message } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!contactId) return res.status(400).json({ error: 'Contact ID is required' });
    if (!message) return res.status(400).json({ error: 'Message is required' });

    // Verify the user is part of this contact/conversation
    const [contactRows] = await db.query(
      `SELECT * FROM Contacts WHERE contact_id = ? AND (sender_id = ? OR receiver_id = ?)`,
      [contactId, userId, userId]
    );

    if (!contactRows || !contactRows.length) {
      return res.status(403).json({ error: 'Not authorized to reply to this conversation' });
    }

    const contact = contactRows[0];
    
    // The receiver of the new message is whichever user is not the sender
    const receiverId = contact.sender_id === userId ? contact.receiver_id : contact.sender_id;

    // Insert the message
    const [result] = await db.query(
      `INSERT INTO Messages (contact_id, sender_id, receiver_id, message) 
       VALUES (?, ?, ?, ?)`,
      [contactId, userId, receiverId, message]
    );

    // Get the inserted message with user details
    const [messageRows] = await db.query(
      `SELECT m.*, 
              u_sender.name as sender_name, 
              u_sender.email as sender_email,
              u_receiver.name as receiver_name,
              u_receiver.email as receiver_email
       FROM Messages m
       LEFT JOIN Users u_sender ON m.sender_id = u_sender.user_id
       LEFT JOIN Users u_receiver ON m.receiver_id = u_receiver.user_id
       WHERE m.message_id = ?`,
      [result.insertId]
    );

    res.json({
      success: true,
      message: messageRows[0]
    });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Failed to send message', details: err.message });
  }
};