import React, { useState, useEffect, useRef } from 'react';
import { getNotifications, createContact } from '../services/api';

function MessageThread({ messages, sender, onSendMessage }) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSendMessage(message.trim());
    setMessage('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender_id === sender ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                msg.sender_id === sender
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <p className="text-sm">{msg.message}</p>
              <span className="text-xs opacity-70">
                {new Date(msg.sent_at).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-transparent"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export function ChatDialog({ contact, onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollInterval = useRef();

  // Load initial messages and poll for updates
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await getNotifications();
        if (res.success && Array.isArray(res.notifications)) {
          setMessages(res.notifications);
        }
      } catch (err) {
        console.error('Error loading messages:', err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
    // Poll for new messages every 3 seconds
    pollInterval.current = setInterval(loadMessages, 3000);

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [contact.id]);

  const handleSendMessage = async (message) => {
    try {
      const res = await createContact({
        item_id: contact.item_id,
        message: message
      });
      if (res.success) {
        // Optimistically add message to UI
        setMessages(prev => [...prev, {
          message,
          sent_at: new Date().toISOString(),
          sender_id: contact.sender_id,
          is_sender: true
        }]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message: ' + (err.message || String(err)));
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg h-[600px] rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Chat</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-500 p-4">
            {error}
          </div>
        ) : (
          <MessageThread
            messages={messages}
            sender={contact.sender_id}
            onSendMessage={handleSendMessage}
          />
        )}
      </div>
    </div>
  );
}