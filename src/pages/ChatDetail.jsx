import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMessages, sendMessage, getChats } from '../api/chat';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';
import { useAuth } from '../auth/useAuth.js';
import { useUnread } from '../context/UnreadContext.jsx';

const ChatDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { error: showError } = useToast();
  const { setTotalUnread } = useUnread();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const response = await getMessages(id);
      const messagesData = response.data?.messages || response.data?.data || response.data || [];
      setMessages(Array.isArray(messagesData) ? messagesData : []);
      
      // Backend marks messages as read when fetching
      // Refresh totalUnread by fetching chats
      try {
        const chatsResponse = await getChats();
        const totalUnreadCount = chatsResponse.data?.totalUnread || 0;
        setTotalUnread(totalUnreadCount);
      } catch (err) {
        // Silent fail - never log 429
        if (err?.response?.status === 429) {
          return;
        }
      }
    } catch (err) {
      // Never log 429 errors
      if (err?.response?.status === 429) {
        return;
      }
      const errorMessage = parseError(err);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    fetchMessages();

    // Poll messages every 30 seconds (reduced from 4s to prevent spam)
    pollIntervalRef.current = setInterval(() => {
      fetchMessages();
    }, 30000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [id, showError]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim() || sending) return;

    const textToSend = messageText.trim();
    setMessageText('');
    setSending(true);

    // Optimistic update
    const optimisticMessage = {
      _id: `temp-${Date.now()}`,
      text: textToSend,
      sender: user?._id,
      senderName: user?.name,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      await sendMessage(id, textToSend);
      // Re-fetch to get the actual message from backend
      await fetchMessages();
    } catch (err) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m._id !== optimisticMessage._id));
      const errorMessage = parseError(err);
      showError(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="container" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '18px', color: '#666' }}>Loading messages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: 0 }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: 'calc(100vh - 70px)',
        maxWidth: '1000px',
        margin: '0 auto',
        backgroundColor: '#fff',
      }}>
        {/* Header */}
        <div className="card" style={{ 
          margin: 0,
          borderRadius: 0,
          borderBottom: '1px solid #e0e0e0',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}>
          <button
            onClick={() => navigate('/chats')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '8px',
              color: '#007bff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ←
          </button>
          <h1 style={{ 
            margin: 0, 
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#1a1a1a',
          }}>
            Conversation
          </h1>
        </div>

        {/* Messages Area */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '24px',
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px',
          backgroundColor: '#f8f9fa',
        }}>
          {messages.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#666', 
              padding: '60px 20px',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
              <h3 style={{ 
                color: '#1a1a1a',
                marginBottom: '8px',
                fontSize: '1.25rem',
                fontWeight: '600',
              }}>
                No messages yet
              </h3>
              <p style={{ color: '#666', fontSize: '15px' }}>
                Start the conversation!
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender === user?._id || message.sender?._id === user?._id;
              
              return (
                <div
                  key={message._id}
                  style={{
                    display: 'flex',
                    justifyContent: isOwn ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '12px 16px',
                      borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      backgroundColor: isOwn ? '#007bff' : '#fff',
                      color: isOwn ? '#fff' : '#1a1a1a',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    }}
                  >
                    {!isOwn && message.senderName && (
                      <div style={{ 
                        fontSize: '12px', 
                        fontWeight: '600', 
                        marginBottom: '6px', 
                        opacity: 0.9,
                      }}>
                        {message.senderName}
                      </div>
                    )}
                    <div style={{ 
                      marginBottom: '4px', 
                      wordBreak: 'break-word',
                      lineHeight: '1.5',
                      fontSize: '15px',
                    }}>
                      {message.text}
                    </div>
                    <div style={{ 
                      fontSize: '11px', 
                      opacity: 0.7, 
                      textAlign: 'right',
                      marginTop: '4px',
                    }}>
                      {formatTime(message.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form 
          onSubmit={handleSend} 
          style={{ 
            padding: '16px 24px',
            borderTop: '1px solid #e0e0e0',
            display: 'flex', 
            gap: '12px',
            backgroundColor: '#fff',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            style={{
              flex: 1,
              padding: '12px 18px',
              border: '1px solid #ddd',
              borderRadius: '24px',
              fontSize: '15px',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#007bff';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#ddd';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <button
            type="submit"
            disabled={!messageText.trim() || sending}
            className="btn-primary"
            style={{
              padding: '12px 24px',
              borderRadius: '24px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: !messageText.trim() || sending ? 'not-allowed' : 'pointer',
              opacity: !messageText.trim() || sending ? 0.5 : 1,
              minWidth: '100px',
            }}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatDetail;

