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
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const chatsResponse = await getChats();
          // Check if request was skipped (no token)
          if (!chatsResponse.data?.skipped) {
            const totalUnreadCount = chatsResponse.data?.totalUnread || 0;
            setTotalUnread(totalUnreadCount);
          }
        } catch (err) {
          // Silent fail - never log 429
          if (err?.response?.status === 429) {
            return;
          }
          // Handle 401 silently
          if (err?.response?.status === 401) {
            return;
          }
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

  // Get other participant info
  const getOtherParticipant = () => {
    if (messages.length === 0) return null;
    const firstMessage = messages[0];
    if (firstMessage.sender === user?._id || firstMessage.sender?._id === user?._id) {
      // Find a message from the other person
      const otherMessage = messages.find(m => 
        m.sender !== user?._id && m.sender?._id !== user?._id
      );
      return otherMessage ? {
        name: otherMessage.senderName || 'Unknown',
        id: otherMessage.sender?._id || otherMessage.sender
      } : null;
    }
    return {
      name: firstMessage.senderName || 'Unknown',
      id: firstMessage.sender?._id || firstMessage.sender
    };
  };

  const otherParticipant = getOtherParticipant();

  return (
    <div className="page-container" style={{ padding: 0, height: '100vh', overflow: 'hidden' }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh',
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: '#fff',
        boxShadow: '0 0 30px rgba(0,0,0,0.1)',
      }}>
        {/* Header */}
        <div style={{ 
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}>
          <button
            onClick={() => navigate('/chats')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '10px 12px',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              transition: 'all 0.2s',
              backdropFilter: 'blur(10px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ←
          </button>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: '600',
            backdropFilter: 'blur(10px)',
          }}>
            {otherParticipant?.name?.[0]?.toUpperCase() || '💬'}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ 
              margin: 0, 
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#fff',
            }}>
              {otherParticipant?.name || 'Conversation'}
            </h1>
            <div style={{ 
              fontSize: '13px', 
              opacity: 0.9,
              marginTop: '2px',
            }}>
              {messages.length > 0 ? `${messages.length} messages` : 'No messages yet'}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '24px',
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          background: 'linear-gradient(180deg, #f5f7fa 0%, #e8ecf1 100%)',
          position: 'relative',
        }}>
          {/* Background pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.03,
            backgroundImage: 'radial-gradient(circle at 2px 2px, #667eea 1px, transparent 0)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
          }} />
          
          {messages.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#666', 
              padding: '80px 20px',
              position: 'relative',
              zIndex: 1,
            }}>
              <div style={{ 
                fontSize: '64px', 
                marginBottom: '20px',
                opacity: 0.3,
              }}>💬</div>
              <h3 style={{ 
                color: '#1a1a1a',
                marginBottom: '8px',
                fontSize: '1.5rem',
                fontWeight: '600',
              }}>
                No messages yet
              </h3>
              <p style={{ color: '#666', fontSize: '16px' }}>
                Start the conversation by sending a message below
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwn = message.sender === user?._id || message.sender?._id === user?._id;
              const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.sender !== message.sender);
              
              return (
                <div
                  key={message._id}
                  style={{
                    display: 'flex',
                    justifyContent: isOwn ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end',
                    gap: '10px',
                    position: 'relative',
                    zIndex: 1,
                    animation: message._id?.startsWith('temp-') ? 'fadeIn 0.3s ease-in' : 'none',
                  }}
                >
                  {!isOwn && (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#fff',
                      flexShrink: 0,
                      opacity: showAvatar ? 1 : 0,
                      transition: 'opacity 0.2s',
                      marginBottom: '4px',
                    }}>
                      {message.senderName?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div
                    style={{
                      maxWidth: '65%',
                      padding: '14px 18px',
                      borderRadius: isOwn 
                        ? '20px 20px 6px 20px' 
                        : '20px 20px 20px 6px',
                      background: isOwn 
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : '#fff',
                      color: isOwn ? '#fff' : '#1a1a1a',
                      boxShadow: isOwn
                        ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                        : '0 2px 8px rgba(0,0,0,0.08)',
                      position: 'relative',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = isOwn
                        ? '0 6px 16px rgba(102, 126, 234, 0.4)'
                        : '0 4px 12px rgba(0,0,0,0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = isOwn
                        ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                        : '0 2px 8px rgba(0,0,0,0.08)';
                    }}
                  >
                    {!isOwn && message.senderName && (
                      <div style={{ 
                        fontSize: '13px', 
                        fontWeight: '600', 
                        marginBottom: '6px', 
                        opacity: 0.9,
                        color: '#667eea',
                      }}>
                        {message.senderName}
                      </div>
                    )}
                    <div style={{ 
                      marginBottom: '6px', 
                      wordBreak: 'break-word',
                      lineHeight: '1.6',
                      fontSize: '15px',
                      fontWeight: isOwn ? '400' : '400',
                    }}>
                      {message.text}
                    </div>
                    <div style={{ 
                      fontSize: '11px', 
                      opacity: isOwn ? 0.8 : 0.6, 
                      textAlign: 'right',
                      marginTop: '4px',
                      fontWeight: '500',
                    }}>
                      {formatTime(message.createdAt)}
                    </div>
                  </div>
                  {isOwn && (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#fff',
                      flexShrink: 0,
                      opacity: 0,
                    }} />
                  )}
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
            padding: '20px 24px',
            background: '#fff',
            borderTop: '1px solid #e8ecf1',
            display: 'flex', 
            gap: '12px',
            alignItems: 'center',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
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
              padding: '14px 20px',
              border: '2px solid #e8ecf1',
              borderRadius: '25px',
              fontSize: '15px',
              outline: 'none',
              background: '#f8f9fa',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#667eea';
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e8ecf1';
              e.currentTarget.style.background = '#f8f9fa';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <button
            type="submit"
            disabled={!messageText.trim() || sending}
            style={{
              padding: '14px 28px',
              borderRadius: '25px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: !messageText.trim() || sending ? 'not-allowed' : 'pointer',
              opacity: !messageText.trim() || sending ? 0.5 : 1,
              minWidth: '110px',
              background: !messageText.trim() || sending 
                ? '#ccc' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              transition: 'all 0.2s',
              boxShadow: !messageText.trim() || sending 
                ? 'none' 
                : '0 4px 12px rgba(102, 126, 234, 0.3)',
            }}
            onMouseEnter={(e) => {
              if (messageText.trim() && !sending) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (messageText.trim() && !sending) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
              }
            }}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ChatDetail;

