import React, { useState, useEffect } from 'react';
import { getNotifications, createContact, getConversationHistory, getAuthToken } from '../services/api';
import SendIcon from '../assets/SendIcon.svg';

export default function NotificationsPanel() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);

  // Get current user from token
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = getAuthToken();
        if (token) {
          // Decode token to get user info
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser(payload);
        }
      } catch (err) {
        console.error('Error getting user:', err);
      }
    };
    fetchUser();
  }, []);

  // Load notifications and group into conversations
  useEffect(() => {
    loadConversations();
    // Auto-refresh every 5 seconds
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const res = await getNotifications();
      if (res && res.notifications) {
        // Group notifications by sender (conversation)
        const grouped = {};
        res.notifications.forEach(notification => {
          const key = notification.sender_id;
          if (!grouped[key]) {
            grouped[key] = {
              sender_id: notification.sender_id,
              sender_name: notification.sender_name,
              sender_email: notification.sender_email,
              item_id: notification.item_id,
              item_name: notification.item_name,
              last_message_date: notification.contact_date,
              messages: []
            };
          }
          grouped[key].messages.push(notification);
          // Update last message date
          if (new Date(notification.contact_date) > new Date(grouped[key].last_message_date)) {
            grouped[key].last_message_date = notification.contact_date;
          }
        });
        
        // Convert to array and sort by last message date
        const conversationList = Object.values(grouped).sort((a, b) => 
          new Date(b.last_message_date) - new Date(a.last_message_date)
        );
        
        setConversations(conversationList);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    try {
      // Fetch full conversation history
      const res = await getConversationHistory(conversation.sender_id, conversation.item_id);
      if (res && res.messages) {
        setConversationMessages(res.messages);
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) {
      alert('Please enter a message');
      return;
    }

    // Prevent self-messaging (safety check)
    if (user?.id === selectedConversation.sender_id) {
      alert('You cannot send messages to yourself');
      return;
    }

    try {
      setSending(true);
      console.log('📤 Sending message to:', {
        receiver_id: selectedConversation.sender_id,
        item_id: selectedConversation.item_id,
        message: messageText
      });

      await createContact({
        item_id: selectedConversation.item_id,
        message: messageText,
        receiver_id: selectedConversation.sender_id
      });

      setMessageText('');
      
      // Reload conversation to show new message
      const res = await getConversationHistory(selectedConversation.sender_id, selectedConversation.item_id);
      if (res && res.messages) {
        setConversationMessages(res.messages);
      }
      
      // Also reload conversations list
      loadConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message: ' + (err.message || err));
    } finally {
      setSending(false);
    }
  };

  const containerStyle = {
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    gap: '16px',
    height: 'calc(100vh - 150px)',
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
  };

  const listContainerStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  };

  const conversationItemStyle = {
    padding: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: 'transparent',
    color: '#fff'
  };

  const conversationItemHoverStyle = {
    ...conversationItemStyle,
    background: 'rgba(168, 85, 247, 0.2)'
  };

  const chatContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    overflow: 'hidden'
  };

  const messagesContainerStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  };

  const messageStyle = (isOwn) => ({
    padding: '10px 12px',
    borderRadius: '8px',
    maxWidth: '70%',
    wordWrap: 'break-word',
    background: isOwn ? 'linear-gradient(135deg, #4f46e5, #a855f7)' : 'rgba(255,255,255,0.1)',
    color: '#fff',
    alignSelf: isOwn ? 'flex-end' : 'flex-start',
    fontSize: '14px'
  });

  const inputContainerStyle = {
    padding: '16px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    gap: '8px'
  };

  const inputStyle = {
    flex: 1,
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(0,0,0,0.3)',
    color: '#fff',
    fontSize: '14px',
    fontFamily: 'inherit'
  };

  const sendButtonStyle = {
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s ease'
  };

  const emptyStyle = {
    padding: '40px 20px',
    textAlign: 'center',
    opacity: 0.7,
    color: '#fff'
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '24px', fontWeight: '800', color: '#fff' }}>
        💬 Messages
      </h2>

      {loading ? (
        <div style={emptyStyle}>Loading messages...</div>
      ) : conversations.length === 0 ? (
        <div style={emptyStyle}>No messages yet. Start a conversation by notifying an item owner!</div>
      ) : (
        <div style={containerStyle}>
          {/* Conversations List */}
          <div style={listContainerStyle}>
            <div style={{ padding: '12px', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#a855f7' }}>
              Conversations
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {conversations.map((conversation) => (
                <div
                  key={`${conversation.sender_id}-${conversation.item_id}`}
                  onClick={() => handleSelectConversation(conversation)}
                  onMouseEnter={(e) => e.currentTarget.style.background = conversationItemHoverStyle.background}
                  onMouseLeave={(e) => e.currentTarget.style.background = conversationItemStyle.background}
                  style={{
                    ...conversationItemStyle,
                    background: selectedConversation?.sender_id === conversation.sender_id ? 'rgba(168, 85, 247, 0.3)' : 'transparent'
                  }}
                >
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>
                    {conversation.sender_name || 'Anonymous'}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                    📌 Item: {conversation.item_name || `#${conversation.item_id}`}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '4px' }}>
                    {new Date(conversation.last_message_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          {selectedConversation ? (
            <div style={chatContainerStyle}>
              {/* Header */}
              <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(79, 70, 229, 0.1)' }}>
                <div style={{ fontWeight: '600', fontSize: '16px', color: '#a855f7' }}>
                  {selectedConversation.sender_name || 'Anonymous'}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                  📌 {selectedConversation.item_name || `Item #${selectedConversation.item_id}`}
                </div>
              </div>

              {/* Messages */}
              <div style={messagesContainerStyle}>
                {conversationMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', opacity: 0.5, color: '#fff' }}>No messages yet</div>
                ) : (
                  conversationMessages.map((message) => {
                    const isOwn = message.sender_id === user?.id;
                    return (
                      <div key={message.contact_id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                        <div style={messageStyle(isOwn)}>
                          {message.message}
                        </div>
                        <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '4px' }}>
                          {new Date(message.contact_date).toLocaleTimeString()}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input */}
              <div style={inputContainerStyle}>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message... (Shift+Enter for new line)"
                  style={{
                    ...inputStyle,
                    minHeight: '40px',
                    resize: 'none'
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !messageText.trim()}
                  style={{
                    ...sendButtonStyle,
                    opacity: (sending || !messageText.trim()) ? 0.6 : 1,
                    cursor: (sending || !messageText.trim()) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '40px',
                    height: '40px'
                  }}
                  title="Send message (or press Enter)"
                >
                  {sending ? (
                    <span style={{ fontSize: '16px' }}>⏳</span>
                  ) : (
                    <img 
                      src={SendIcon} 
                      alt="Send" 
                      style={{ width: '18px', height: '18px' }}
                    />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ ...chatContainerStyle, justifyContent: 'center', alignItems: 'center' }}>
              <div style={emptyStyle}>Select a conversation to start messaging</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
