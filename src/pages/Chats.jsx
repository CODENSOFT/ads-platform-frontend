import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChats } from '../api/chat';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';
import { useAuth } from '../auth/useAuth.js';
import { useChatNotifications } from '../hooks/useChatNotifications.js';

const Chats = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
  const { unreadCount, refreshUnreadCount } = useChatNotifications();
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState([]);
  const [hasShownNotification, setHasShownNotification] = useState(false);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        const response = await getChats();
        const chatsData = response.data?.chats || response.data?.data || response.data || [];
        setChats(Array.isArray(chatsData) ? chatsData : []);
        
        // Refresh unread count after fetching chats
        refreshUnreadCount();
      } catch (err) {
        const errorMessage = parseError(err);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [showError, refreshUnreadCount]);

  // Show notification when user opens page and has unread messages
  useEffect(() => {
    if (!loading && unreadCount > 0 && !hasShownNotification) {
      showSuccess(`Ai ${unreadCount} ${unreadCount === 1 ? 'mesaj nou' : 'mesaje noi'}`);
      setHasShownNotification(true);
    }
  }, [loading, unreadCount, hasShownNotification, showSuccess]);

  const getOtherParticipant = (chat) => {
    if (!chat.participants || !Array.isArray(chat.participants)) return null;
    const other = chat.participants.find(p => p._id !== user?._id);
    return other || chat.participants[0] || null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    } catch {
      return dateString;
    }
  };

  // Format unread count: show number or "99+" if > 99
  const formatUnreadCount = (count) => {
    if (!count || count === 0) return null;
    return count > 99 ? '99+' : String(count);
  };

  // Get unread count for a specific chat
  const getChatUnreadCount = (chat) => {
    return chat.unreadCount || chat.unreadMessages || chat.unread || 0;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="container" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '18px', color: '#666' }}>Loading conversations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="container" style={{ maxWidth: '900px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            color: '#1a1a1a',
            marginBottom: '8px',
          }}>
            💬 My Conversations
          </h1>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#666',
            margin: 0,
          }}>
            {chats.length > 0 
              ? `${chats.length} ${chats.length === 1 ? 'conversation' : 'conversations'}`
              : 'Your conversations will appear here'
            }
          </p>
        </div>
        
        {chats.length === 0 ? (
          <div className="card" style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <h3 style={{ 
              color: '#1a1a1a', 
              marginBottom: '8px',
              fontSize: '1.5rem',
              fontWeight: '600',
            }}>
              No conversations yet
            </h3>
            <p style={{ color: '#666', fontSize: '16px' }}>
              Start a conversation by contacting a seller from an ad
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {chats.map((chat) => {
              const otherParticipant = getOtherParticipant(chat);
              const lastMessage = chat.lastMessage;
              const chatUnreadCount = getChatUnreadCount(chat);
              const unreadDisplay = formatUnreadCount(chatUnreadCount);
              
              return (
                <div
                  key={chat._id}
                  onClick={() => navigate(`/chats/${chat._id}`)}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    padding: '20px',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    gap: '16px',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px',
                      }}>
                        <div style={{ 
                          fontWeight: '600', 
                          fontSize: '18px', 
                          color: '#1a1a1a',
                        }}>
                          {otherParticipant?.name || 'Unknown User'}
                        </div>
                        {unreadDisplay && (
                          <span style={{
                            backgroundColor: '#007bff',
                            color: '#fff',
                            borderRadius: '12px',
                            padding: '2px 8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            minWidth: '20px',
                            textAlign: 'center',
                            lineHeight: '1.5',
                          }}>
                            {unreadDisplay}
                          </span>
                        )}
                      </div>
                      {chat.ad && (
                        <div style={{ 
                          fontSize: '14px', 
                          color: '#666', 
                          marginBottom: '8px',
                          fontWeight: '500',
                        }}>
                          📋 {chat.ad.title}
                        </div>
                      )}
                      {lastMessage && (
                        <div style={{ 
                          fontSize: '14px', 
                          color: chatUnreadCount > 0 ? '#1a1a1a' : '#888',
                          fontWeight: chatUnreadCount > 0 ? '500' : '400',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          lineHeight: '1.5',
                        }}>
                          {lastMessage.text}
                        </div>
                      )}
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '4px',
                    }}>
                      {chat.updatedAt && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#999', 
                          whiteSpace: 'nowrap',
                          fontWeight: '500',
                        }}>
                          {formatDate(chat.updatedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chats;

