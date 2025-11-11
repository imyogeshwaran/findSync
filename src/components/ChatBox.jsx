import React, { useState, useEffect, useRef } from 'react';
import { getChatHistory, sendChatMessage } from '../services/api';

export default function ChatBox({ contactId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat history
  useEffect(() => {
    let mounted = true;
    const loadChat = async () => {
      try {
        setLoading(true);
        const response = await getChatHistory(contactId);
        if (!mounted) return;
        
        if (response.success && response.messages) {
          setMessages(response.messages);
          setTimeout(scrollToBottom, 100);
        }
      } catch (err) {
        console.error('Error loading chat:', err);
        if (mounted) setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadChat();
    const interval = setInterval(loadChat, 5000); // Poll for new messages
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [contactId]);

  // Handle send message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const response = await sendChatMessage(contactId, newMessage.trim());
      if (response.success && response.message) {
        setMessages(prev => [...prev, response.message]);
        setNewMessage('');
        scrollToBottom();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message: ' + (err.message || String(err)));
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ 
      position: 'fixed',
      bottom: 20,
      right: 20,
      width: '360px',
      maxWidth: 'calc(100vw - 40px)',
      height: '500px',
      maxHeight: 'calc(100vh - 100px)',
      background: 'rgba(0,0,0,0.95)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      zIndex: 100
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Chat</h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            opacity: 0.6,
            cursor: 'pointer',
            padding: '4px 8px'
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', opacity: 0.7 }}>Loading messages...</div>
        ) : error ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#f87171' }}>{error}</div>
        ) : messages.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', opacity: 0.7 }}>No messages yet</div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.message_id}
              style={{
                alignSelf: msg.is_sender ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                background: msg.is_sender ? 'rgba(79,70,229,0.4)' : 'rgba(255,255,255,0.1)',
                padding: '8px 12px',
                borderRadius: '12px',
                borderBottomRightRadius: msg.is_sender ? '4px' : '12px',
                borderBottomLeftRadius: msg.is_sender ? '12px' : '4px',
              }}
            >
              <div style={{ fontSize: '0.85rem', marginBottom: '4px', opacity: 0.8 }}>
                {msg.sender_name || msg.sender_email || 'User'}
              </div>
              <div>{msg.message}</div>
              <div style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.6 }}>
                {new Date(msg.sent_at).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSend} style={{
        padding: '12px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        gap: '8px'
      }}>
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#fff',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          style={{
            background: 'linear-gradient(135deg,#4f46e5,#a855f7)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            color: '#fff',
            cursor: 'pointer',
            opacity: !newMessage.trim() || sending ? 0.6 : 1
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}