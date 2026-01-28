import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getChats } from '../api/chat';
import { deleteChat } from '../api/chatApi';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';
import { useAuth } from '../auth/useAuth.js';
import { useUnread } from '../context/UnreadContext.jsx';

const Chats = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
  const { setTotalUnread } = useUnread();
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState([]);
  const [deletingChatId, setDeletingChatId] = useState(null);

  useEffect(() => {
    // HARD GUARD: Redirect to login if no token/user
    const token = localStorage.getItem('token');
    if (!token || !user) {
      navigate('/login');
      return;
    }

    const fetchChats = async () => {
      try {
        setLoading(true);
        const response = await getChats();
        
        // Check if request was skipped (no token)
        if (response.data?.skipped) {
          navigate('/login');
          return;
        }
        
        // API returns: { success, chats: [...], totalUnread }
        const chatsData = response.data?.chats || [];
        const totalUnreadCount = response.data?.totalUnread || 0;
        
        setChats(Array.isArray(chatsData) ? chatsData : []);
        
        // Update totalUnread in context
        setTotalUnread(totalUnreadCount);
      } catch (err) {
        // Never log 429 errors
        if (err?.response?.status === 429) {
          setLoading(false);
          return;
        }
        // Handle 401 - redirect to login
        if (err?.response?.status === 401) {
          navigate('/login');
          return;
        }
        const errorMessage = parseError(err);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only depend on user to prevent refetch loops

  // Refetch when navigating back to /chats (e.g., from ChatDetail) - throttled
  useEffect(() => {
    // HARD GUARD: Do NOT call API if token/user is missing
    const token = localStorage.getItem('token');
    if (!token || !user) {
      return;
    }

    if (location.pathname === '/chats' || location.hash === '#/chats') {
      // Guard: Don't refetch if already loading
      if (loading) {
        return;
      }

      const fetchChats = async () => {
        try {
          const response = await getChats();
          if (response.data?.skipped) {
            return;
          }
          const chatsData = response.data?.chats || [];
          const totalUnreadCount = response.data?.totalUnread || 0;
          
          setChats(Array.isArray(chatsData) ? chatsData : []);
          setTotalUnread(totalUnreadCount);
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
      };
      fetchChats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.hash, user]); // Only depend on location and user

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

  // Get unread count for a specific chat
  const getChatUnreadCount = (chat) => {
    return chat.unreadCount || 0;
  };

  // Format badge text for chat unread count
  const formatChatBadge = (count) => {
    if (!count || count === 0) return null;
    return count > 99 ? '99+' : String(count);
  };

  // Handle delete chat
  const handleDeleteChat = async (e, chatId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Delete conversation?')) {
      return;
    }

    setDeletingChatId(chatId);
    try {
      await deleteChat(chatId);
      // Remove chat from state immediately without refetch
      setChats(prev => prev.filter(c => c._id !== chatId));
      showSuccess('Conversation deleted');
    } catch (err) {
      // Handle specific error cases
      if (err?.response?.status === 401) {
        navigate('/login');
        return;
      }
      if (err?.response?.status === 404) {
        // Chat already deleted - remove from state and show message
        // URL logging is handled in chatApi.js
        setChats(prev => prev.filter(c => c._id !== chatId));
        showError('Chat already deleted');
        return;
      }
      // Other errors
      const msg = parseError(err);
      showError(msg);
    } finally {
      setDeletingChatId(null);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <div className="card card--pad text-center py-6">
            <div className="t-body t-muted">Loading conversations...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div className="page-header mb-6">
          <h1 className="page-header__title">My Conversations</h1>
          <p className="page-header__subtitle">
            {chats.length > 0 
              ? `${chats.length} ${chats.length === 1 ? 'conversation' : 'conversations'}`
              : 'Your conversations will appear here'
            }
          </p>
        </div>

        {/* Empty State */}
        {chats.length === 0 ? (
          <div className="card card--pad text-center py-6">
            <h3 className="t-h3 mb-2">No conversations yet</h3>
            <p className="t-body t-muted">
              Start a conversation by contacting a seller from an ad
            </p>
          </div>
        ) : (
          <div className="list">
            {chats.map((chat) => {
              const otherParticipant = getOtherParticipant(chat);
              const lastMessage = chat.lastMessage;
              const chatUnreadCount = getChatUnreadCount(chat);
              const unreadDisplay = formatChatBadge(chatUnreadCount);
              const hasUnread = chatUnreadCount > 0;
              const participantName = otherParticipant?.name || 'Unknown User';
              const participantInitial = participantName[0]?.toUpperCase() || 'U';
              
              return (
                <div
                  key={chat._id}
                  onClick={() => navigate(`/chats/${chat._id}`)}
                  className="list-item"
                >
                  {/* Avatar */}
                  <div className="list-item__avatar">
                    {participantInitial}
                  </div>

                  {/* Content */}
                  <div className="list-item__content">
                    <div className="list-item__header">
                      <h3 className="list-title">
                        {participantName}
                        {unreadDisplay && (
                          <span className="badge badge-active">
                            {unreadDisplay}
                          </span>
                        )}
                      </h3>
                      <div className="list-meta">
                        {chat.updatedAt && (
                          <span className="list-date">
                            {formatDate(chat.updatedAt)}
                          </span>
                        )}
                        <button
                          onClick={(e) => handleDeleteChat(e, chat._id)}
                          disabled={deletingChatId === chat._id}
                          className="btn btn-secondary btn-sm"
                          title="Delete conversation"
                        >
                          {deletingChatId === chat._id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                    
                    {chat.ad && (
                      <p className="list-sub t-muted">
                        {chat.ad.title}
                      </p>
                    )}
                    
                    {lastMessage && (
                      <p className={`list-sub ${hasUnread ? 't-bold' : ''}`}>
                        {lastMessage.text}
                      </p>
                    )}
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
