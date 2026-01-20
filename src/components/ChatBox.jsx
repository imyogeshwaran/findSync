import React, { useState, useEffect, useRef } from 'react';
import { getChatHistory, sendChatMessage, editChatMessage, deleteChatMessage } from '../services/api';

export default function ChatBox({ contactId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef(null);
  const longPressTimer = useRef(null);

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

  // Handle long press on message
  const handleMessageMouseDown = (e, messageId, messageText) => {
    if (!messageText) return; // Don't show menu for deleted messages
    
    longPressTimer.current = setTimeout(() => {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuOpenId(messageId);
      setContextMenuPos({
        x: rect.right - 100,
        y: rect.top
      });
    }, 500); // 500ms long press
  };

  const handleMessageMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  // Handle edit message
  const handleEditMessage = async (messageId, originalText) => {
    setEditingMessageId(messageId);
    setEditingText(originalText);
    setMenuOpenId(null);
  };

  const handleSaveEdit = async (messageId) => {
    if (!editingText.trim()) {
      alert('Message cannot be empty');
      return;
    }

    try {
      const response = await editChatMessage(contactId, messageId, editingText.trim());
      if (response.success) {
        setMessages(prev => prev.map(msg => 
          msg.message_id === messageId 
            ? { ...msg, message: editingText.trim(), edited_at: new Date().toISOString() }
            : msg
        ));
        setEditingMessageId(null);
        setEditingText('');
      }
    } catch (err) {
      console.error('Failed to edit message:', err);
      alert('Failed to edit message: ' + (err.message || String(err)));
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const response = await deleteChatMessage(contactId, messageId);
      if (response.success) {
        setMessages(prev => prev.map(msg => 
          msg.message_id === messageId 
            ? { ...msg, is_deleted: true, message: null }
            : msg
        ));
        setMenuOpenId(null);
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
      alert('Failed to delete message: ' + (err.message || String(err)));
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
          messages.map(msg => {
            if (msg.is_deleted) {
              const deletionText = msg.deletion_type === 'admin' 
                ? 'Message deleted by system' 
                : 'Message deleted';
              return (
                <div
                  key={msg.message_id}
                  style={{
                    alignSelf: msg.is_sender ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    borderBottomRightRadius: msg.is_sender ? '4px' : '12px',
                    borderBottomLeftRadius: msg.is_sender ? '12px' : '4px',
                    opacity: 0.5,
                    fontStyle: 'italic'
                  }}
                >
                  <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>{deletionText}</div>
                </div>
              );
            }

            return (
              <div
                key={msg.message_id}
                style={{
                  position: 'relative',
                  alignSelf: msg.is_sender ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                }}
              >
                {editingMessageId === msg.message_id ? (
                  <div style={{
                    background: 'rgba(79,70,229,0.3)',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    borderBottomRightRadius: msg.is_sender ? '4px' : '12px',
                    borderBottomLeftRadius: msg.is_sender ? '12px' : '4px',
                  }}>
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        padding: '6px',
                        color: '#fff',
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                        marginBottom: '8px',
                        resize: 'vertical',
                        minHeight: '50px'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleSaveEdit(msg.message_id)}
                        style={{
                          flex: 1,
                          background: '#4f46e5',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        style={{
                          flex: 1,
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onMouseDown={(e) => handleMessageMouseDown(e, msg.message_id, msg.message)}
                    onMouseUp={handleMessageMouseUp}
                    onMouseLeave={handleMessageMouseUp}
                    style={{
                      background: msg.is_sender ? 'rgba(79,70,229,0.4)' : 'rgba(255,255,255,0.1)',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      borderBottomRightRadius: msg.is_sender ? '4px' : '12px',
                      borderBottomLeftRadius: msg.is_sender ? '12px' : '4px',
                      cursor: 'grab',
                      userSelect: 'none',
                      position: 'relative'
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', marginBottom: '4px', opacity: 0.8 }}>
                      {msg.sender_name || msg.sender_email || 'User'}
                    </div>
                    <div style={{ marginBottom: '4px' }}>{msg.message}</div>
                    {msg.edited_at && (
                      <div style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '4px' }}>
                        (edited)
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.6 }}>
                      {new Date(msg.sent_at).toLocaleTimeString()}
                    </div>
                  </div>
                )}

                {/* Context menu */}
                {menuOpenId === msg.message_id && msg.is_sender && (
                  <div
                    style={{
                      position: 'absolute',
                      top: contextMenuPos.y,
                      left: contextMenuPos.x,
                      background: 'rgba(0,0,0,0.95)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
                      zIndex: 1000,
                      minWidth: '120px',
                      overflow: 'hidden'
                    }}
                  >
                    <button
                      onClick={() => handleEditMessage(msg.message_id, msg.message)}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '8px 12px',
                        background: 'none',
                        border: 'none',
                        color: '#fff',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(79,70,229,0.3)'}
                      onMouseLeave={(e) => e.target.style.background = 'none'}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(msg.message_id)}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '8px 12px',
                        background: 'none',
                        border: 'none',
                        color: '#f87171',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(248,113,113,0.2)'}
                      onMouseLeave={(e) => e.target.style.background = 'none'}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })
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