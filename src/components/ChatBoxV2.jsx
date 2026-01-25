import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getChatHistory, sendChatMessage, editChatMessage, deleteChatMessage } from '../services/api';
import { messageQueueService } from '../services/messageQueue';
import { useWebSocket } from '../hooks/useWebSocket';
import { getAuthToken } from '../services/api';

export default function ChatBox({ contactId, userId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [queuedMessages, setQueuedMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const messagesEndRef = useRef(null);
  const longPressTimer = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // WebSocket hook
  const { isConnected, connectionError, emit, on, off } = useWebSocket(userId);

  // Update connection status
  useEffect(() => {
    setConnectionStatus(isConnected ? 'connected' : 'disconnected');
  }, [isConnected]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat history on mount
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
          
          // Mark messages as read
          emit('message_read', { contactId, senderId: userId });
        }
      } catch (err) {
        console.error('Error loading chat:', err);
        if (mounted) setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (contactId) {
      loadChat();
    }
  }, [contactId, userId, emit]);

  // Load queued messages
  useEffect(() => {
    const queued = messageQueueService.getQueuedByContact(contactId);
    setQueuedMessages(queued);
  }, [contactId]);

  // Real-time message listener
  useEffect(() => {
    const handleNewMessage = (data) => {
      console.log('📨 Received new message:', data);
      
      if (data.contactId === contactId) {
        const newMsg = {
          message_id: `msg_${Date.now()}`,
          message: data.message,
          sent_at: data.timestamp,
          is_sender: false,
          sender_name: data.senderName || 'User',
          is_deleted: false,
          delivery_status: 'delivered'
        };
        
        setMessages(prev => [...prev, newMsg]);
        setTimeout(scrollToBottom, 100);
        
        // Emit read receipt
        emit('message_delivered', { messageId: newMsg.message_id, senderId: userId });
      }
    };

    const handleMessageEdited = (data) => {
      console.log('✏️ Message edited notification:', data);
      if (data.contactId === contactId) {
        setMessages(prev => prev.map(msg => 
          msg.message_id === data.messageId
            ? { ...msg, message: data.newText, edited_at: new Date().toISOString() }
            : msg
        ));
      }
    };

    const handleMessageDeleted = (data) => {
      console.log('🗑️ Message deleted notification:', data);
      if (data.contactId === contactId) {
        setMessages(prev => prev.map(msg => 
          msg.message_id === data.messageId
            ? { ...msg, is_deleted: true, message: null }
            : msg
        ));
      }
    };

    const handleUserTyping = (data) => {
      if (data.contactId === contactId) {
        setOtherUserTyping(data.isTyping);
      }
    };

    const handleMessageDelivered = (data) => {
      console.log('✅ Message delivered:', data.messageId);
      setMessages(prev => prev.map(msg => 
        msg.message_id === data.messageId
          ? { ...msg, delivery_status: 'delivered', delivered_at: data.deliveredAt }
          : msg
      ));
    };

    on('message_received', handleNewMessage);
    on('message_edited_notification', handleMessageEdited);
    on('message_deleted_notification', handleMessageDeleted);
    on('user_typing', handleUserTyping);
    on('message_delivered_notification', handleMessageDelivered);

    return () => {
      off('message_received', handleNewMessage);
      off('message_edited_notification', handleMessageEdited);
      off('message_deleted_notification', handleMessageDeleted);
      off('user_typing', handleUserTyping);
      off('message_delivered_notification', handleMessageDelivered);
    };
  }, [contactId, userId, emit, on, off]);

  // Handle typing indicator
  const handleTypingChange = (e) => {
    setNewMessage(e.target.value);
    
    if (!isTyping && isConnected) {
      setIsTyping(true);
      emit('typing', { contactId, receiverId: userId, isTyping: true });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isConnected) {
        setIsTyping(false);
        emit('typing', { contactId, receiverId: userId, isTyping: false });
      }
    }, 3000);
  };

  // Handle send message with optimistic update
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    
    // Optimistic update
    const tempMessage = {
      message_id: `temp_${Date.now()}`,
      message: messageText,
      sent_at: new Date().toISOString(),
      is_sender: true,
      sender_name: 'You',
      is_deleted: false,
      delivery_status: 'pending'
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    
    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    emit('typing', { contactId, receiverId: userId, isTyping: false });

    try {
      setSending(true);
      const response = await sendChatMessage(contactId, messageText);
      
      if (response.success && response.message) {
        // Replace temp message with real message from server
        setMessages(prev => prev.map(msg => 
          msg.message_id === tempMessage.message_id 
            ? { ...response.message, delivery_status: 'delivered' }
            : msg
        ));

        // Notify other user of new message
        emit('message_new', {
          contactId,
          receiverId: userId,
          message: messageText,
          senderName: 'User'
        });

        scrollToBottom();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      
      // Queue message for retry
      const queuedMsg = messageQueueService.enqueue({
        contactId,
        message: messageText,
        senderId: userId
      });

      // Update UI to show queued status
      setMessages(prev => prev.map(msg => 
        msg.message_id === tempMessage.message_id 
          ? { ...msg, id: queuedMsg.id, delivery_status: 'pending', queued: true }
          : msg
      ));

      setError('Message queued. Will send when connection restores.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSending(false);
    }
  };

  // Retry queued messages when connection restored
  useEffect(() => {
    if (isConnected && queuedMessages.length > 0) {
      console.log('🔄 Retrying queued messages...');
      
      queuedMessages.forEach(async (queuedMsg) => {
        try {
          const response = await sendChatMessage(queuedMsg.contactId, queuedMsg.message);
          if (response.success) {
            messageQueueService.markAsSent(queuedMsg.id, response.message.message_id);
            setQueuedMessages(prev => prev.filter(m => m.id !== queuedMsg.id));
            
            // Update message in UI
            setMessages(prev => prev.map(msg => 
              msg.id === queuedMsg.id 
                ? { ...response.message, delivery_status: 'delivered' }
                : msg
            ));
          }
        } catch (err) {
          console.error('Failed to retry message:', err);
          messageQueueService.markAsFailed(queuedMsg.id);
        }
      });
    }
  }, [isConnected, queuedMessages]);

  // Handle long press on message
  const handleMessageMouseDown = (e, messageId, messageText) => {
    if (!messageText) return;
    
    longPressTimer.current = setTimeout(() => {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuOpenId(messageId);
      setContextMenuPos({
        x: rect.right - 100,
        y: rect.top
      });
    }, 500);
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

        // Notify other user
        emit('message_edited', {
          contactId,
          messageId,
          newText: editingText.trim(),
          receiverId: userId
        });

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

        // Notify other user
        emit('message_deleted', {
          contactId,
          messageId,
          receiverId: userId
        });

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
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Chat</h3>
          <div style={{
            fontSize: '0.75rem',
            opacity: 0.6,
            marginTop: '2px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: isConnected ? '#22c55e' : '#ef4444',
              display: 'inline-block'
            }}></span>
            {isConnected ? 'Connected' : 'Connecting...'}
          </div>
        </div>
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
                  key={msg.message_id || msg.id}
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
                key={msg.message_id || msg.id}
                style={{
                  position: 'relative',
                  alignSelf: msg.is_sender ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                }}
              >
                {editingMessageId === (msg.message_id || msg.id) ? (
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
                        onClick={() => handleSaveEdit(msg.message_id || msg.id)}
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
                    onMouseDown={(e) => handleMessageMouseDown(e, msg.message_id || msg.id, msg.message)}
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
                      position: 'relative',
                      opacity: msg.queued ? 0.7 : 1
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
                    <div style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {new Date(msg.sent_at).toLocaleTimeString()}
                      {msg.is_sender && (
                        <span style={{ marginLeft: 'auto' }}>
                          {msg.delivery_status === 'pending' && '⏳'}
                          {msg.delivery_status === 'sent' && '✓'}
                          {msg.delivery_status === 'delivered' && '✓✓'}
                          {msg.delivery_status === 'read' && '✓✓'}
                          {msg.queued && '📌'}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Context menu */}
                {menuOpenId === (msg.message_id || msg.id) && msg.is_sender && (
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
                      onClick={() => handleEditMessage(msg.message_id || msg.id, msg.message)}
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
                      onClick={() => handleDeleteMessage(msg.message_id || msg.id)}
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

        {otherUserTyping && (
          <div style={{
            alignSelf: 'flex-start',
            maxWidth: '80%',
            background: 'rgba(255,255,255,0.1)',
            padding: '8px 12px',
            borderRadius: '12px',
            fontSize: '0.85rem',
            fontStyle: 'italic',
            opacity: 0.7
          }}>
            User is typing...
          </div>
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
          onChange={handleTypingChange}
          placeholder="Type a message..."
          disabled={!isConnected}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#fff',
            outline: 'none',
            opacity: isConnected ? 1 : 0.5,
            cursor: isConnected ? 'text' : 'not-allowed'
          }}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending || !isConnected}
          style={{
            background: 'linear-gradient(135deg,#4f46e5,#a855f7)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            color: '#fff',
            cursor: (!newMessage.trim() || sending || !isConnected) ? 'not-allowed' : 'pointer',
            opacity: (!newMessage.trim() || sending || !isConnected) ? 0.6 : 1
          }}
        >
          {sending ? '⏳' : '📤'}
        </button>
      </form>
    </div>
  );
}
