import React, { useState, useEffect, useRef } from 'react';
import { getAdminConversations, getAdminConversationMessages, adminDeleteMessage } from '../services/api';

export default function AdminConversations() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load all conversations
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAdminConversations();
      if (response.success) {
        setConversations(response.conversations);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  // Load messages for selected conversation
  const handleSelectConversation = async (conversation) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedConversation(conversation);
      console.log('Loading messages for conversation:', conversation.contact_id);
      const response = await getAdminConversationMessages(conversation.contact_id);
      console.log('Messages response:', response);
      if (response && response.messages) {
        setMessages(response.messages);
        console.log('Messages loaded:', response.messages.length);
        setTimeout(scrollToBottom, 100);
      } else {
        console.log('No messages in response');
        setMessages([]);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Handle admin delete message
  const handleAdminDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message? It will show "deleted by system" to users.')) {
      return;
    }

    try {
      const response = await adminDeleteMessage(selectedConversation.contact_id, messageId);
      if (response.success) {
        setMessages(prev => prev.map(msg =>
          msg.message_id === messageId
            ? { ...msg, is_deleted: true, deletion_type: 'admin', message: null }
            : msg
        ));
        setSuccessMsg('Message deleted by system');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
      setError('Failed to delete message: ' + (err.message || String(err)));
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      background: '#0f172a',
      color: '#fff'
    }}>
      {/* Conversations List */}
      <div style={{
        width: '300px',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        overflowY: 'auto',
        background: 'rgba(26, 26, 46, 0.8)'
      }}>
        <div style={{
          padding: '16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(26, 26, 46, 0.95)',
          stickyPosition: 'top',
          zIndex: 10
        }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#fff' }}>All Conversations</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', opacity: 0.7 }}>
            {conversations.length} total
          </p>
        </div>

        {loading && !selectedConversation && (
          <div style={{ padding: '16px', textAlign: 'center', opacity: 0.6, color: '#fff' }}>
            Loading conversations...
          </div>
        )}

        <div>
          {conversations.map(conv => (
            <div
              key={conv.contact_id}
              onClick={() => handleSelectConversation(conv)}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer',
                background: selectedConversation?.contact_id === conv.contact_id ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
                borderLeft: selectedConversation?.contact_id === conv.contact_id ? '4px solid #a78bfa' : 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => !selectedConversation || selectedConversation?.contact_id !== conv.contact_id ? e.currentTarget.style.background = 'rgba(255,255,255,0.05)' : null}
              onMouseLeave={(e) => !selectedConversation || selectedConversation?.contact_id !== conv.contact_id ? e.currentTarget.style.background = 'transparent' : null}
            >
              <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '4px', color: '#fff' }}>
                {conv.sender_name} ↔ {conv.receiver_name}
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '4px', color: '#cbd5e1' }}>
                📦 {conv.item_names ? `Items: ${conv.item_names}` : 'No items'}
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.6, color: '#cbd5e1' }}>
                Messages: {conv.message_count} | Items: {conv.item_count} | Last: {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Messages View */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#0f172a',
        color: '#fff'
      }}>
        {!selectedConversation ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.5,
            fontSize: '1.1rem',
            color: '#cbd5e1'
          }}>
            Select a conversation to view messages
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(26, 26, 46, 0.8)'
            }}>
              <h2 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>
                {selectedConversation.sender_name} ↔ {selectedConversation.receiver_name}
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', opacity: 0.7 }}>
                Item: {selectedConversation.item_name} ({selectedConversation.post_type})
              </p>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {error && (
                <div style={{
                  padding: '12px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  color: '#fca5a5',
                  fontSize: '0.9rem'
                }}>
                  {error}
                </div>
              )}

              {successMsg && (
                <div style={{
                  padding: '12px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '6px',
                  color: '#86efac',
                  fontSize: '0.9rem'
                }}>
                  ✓ {successMsg}
                </div>
              )}

              {loading ? (
                <div style={{ textAlign: 'center', opacity: 0.6, color: '#cbd5e1' }}>Loading messages...</div>
              ) : messages && messages.length === 0 ? (
                <div style={{ textAlign: 'center', opacity: 0.6, color: '#cbd5e1', marginTop: '20px' }}>
                  <p>📭 No messages in this conversation yet</p>
                  <p style={{ fontSize: '0.85rem', opacity: 0.5 }}>Conversations created before the messaging feature was added won't have message history.</p>
                </div>
              ) : (
                messages.map(msg => {
                  if (msg.is_deleted) {
                    const deletionText = msg.deletion_type === 'admin'
                      ? 'Message deleted by system'
                      : 'Message deleted by user';
                    return (
                      <div
                        key={msg.message_id}
                        style={{
                          alignSelf: msg.is_sender ? 'flex-end' : 'flex-start',
                          maxWidth: '70%',
                          background: 'rgba(255,255,255,0.05)',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          opacity: 0.5,
                          fontStyle: 'italic',
                          fontSize: '0.9rem',
                          color: '#cbd5e1'
                        }}
                      >
                        {deletionText}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.message_id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignSelf: msg.sender_id === selectedConversation.sender_id ? 'flex-start' : 'flex-end',
                        maxWidth: '70%',
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: msg.sender_id === selectedConversation.sender_id ? '#60a5fa' : '#34d399', opacity: 0.9 }}>
                        {msg.sender_name || msg.sender_email || 'Unknown'}
                      </div>
                      <div
                        style={{
                          background: msg.sender_id === selectedConversation.sender_id ? 'rgba(96, 165, 250, 0.2)' : 'rgba(52, 211, 153, 0.2)',
                          border: `1px solid ${msg.sender_id === selectedConversation.sender_id ? 'rgba(96, 165, 250, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`,
                          padding: '8px 12px',
                          borderRadius: '8px',
                          borderBottomRightRadius: msg.sender_id === selectedConversation.sender_id ? '8px' : '2px',
                          borderBottomLeftRadius: msg.sender_id === selectedConversation.sender_id ? '2px' : '8px',
                          position: 'relative',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = msg.sender_id === selectedConversation.sender_id ? 'rgba(96, 165, 250, 0.3)' : 'rgba(52, 211, 153, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = msg.sender_id === selectedConversation.sender_id ? 'rgba(96, 165, 250, 0.2)' : 'rgba(52, 211, 153, 0.2)';
                        }}
                      >
                        <div style={{ marginBottom: '4px', color: '#fff', wordBreak: 'break-word' }}>{msg.message}</div>
                        {msg.edited_at && (
                          <div style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '4px', color: '#cbd5e1' }}>
                            (edited)
                          </div>
                        )}
                        <div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '8px', color: '#cbd5e1' }}>
                          {new Date(msg.sent_at).toLocaleString()}
                        </div>
                        <button
                          onClick={() => handleAdminDeleteMessage(msg.message_id)}
                          style={{
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            opacity: 0.8,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.opacity = '1';
                            e.target.style.background = '#dc2626';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.opacity = '0.8';
                            e.target.style.background = '#ef4444';
                          }}
                        >
                          🗑️ Delete (Admin)
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
