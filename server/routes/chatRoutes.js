const express = require('express');
const router = express.Router();
const { getChatHistory, sendMessage } = require('../controllers/chatController');
const auth = require('../middleware/auth');

// Protect all chat routes
router.use(auth);

// Get chat history for a contact
router.get('/:contactId', getChatHistory);

// Send a message in a conversation
router.post('/:contactId/messages', sendMessage);

module.exports = router;