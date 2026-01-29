import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getChats } from '../api/chat';
import { deleteChat } from '../api/chatApi';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';
import { useAuth } from '../auth/useAuth.js';
import { useUnread } from '../context/UnreadContext.jsx';
import '../styles/chats.css';

const THROTTLE_MS = 10000;

const getMyId = (user) => String(user?._id || user?.id || '').trim();

const getParticipantId = (p) => {
  if (p != null && typeof p === 'object') return String(p._id || p.id || '');
  return String(p);
};

const getParticipantName = (p) => {
  if (p != null && typeof p === 'object') return p.name || p.email || 'User';
  return 'User';
};

const getOtherParticipant = (chat, myId) => {
  const participants = chat?.participants;
  if (!participants || !Array.isArray(participants)) return null;
  const other = participants.find((p) => getParticipantId(p) !== myId);
  return other !== undefined ? other : participants[0] || null;
};

const getLastMessageText = (chat) => {
  const lm = chat?.lastMessage;
  if (lm != null && typeof lm === 'object' && typeof lm.text === 'string') return lm.text;
  if (typeof lm === 'string') return 'Open conversation…';
  return '';
};

const getChatUnreadCount = (chat) => Number(chat?.unreadCount || 0);

const formatBadge = (count) => {
  if (count == null || count === 0) return null;
  return count > 99 ? '99+' : String(count);
};

const getAdTitle = (chat) => {
  const ad = chat?.ad;
  if (ad != null && typeof ad === 'object') return ad.title || '';
  return '';
};

const Chats = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
  const { setTotalUnread } = useUnread();
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState([]);
  const [deletingChatId, setDeletingChatId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const isFetchingRef = useRef(false);
  const lastFetchAtRef = useRef(0);

  const fetchChatsSafe = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token || !user) {
      navigate('/login');
      return;
    }
    if (isFetchingRef.current) return;
    if (Date.now() - lastFetchAtRef.current < THROTTLE_MS) return;

    isFetchingRef.current = true;
    setLoading(true);
    getChats()
      .then((response) => {
        if (response.data?.skipped) {
          navigate('/login');
          return;
        }
        const chatsData = response.data?.chats || [];
        const totalUnreadCount = response.data?.totalUnread ?? 0;
        setChats(Array.isArray(chatsData) ? chatsData : []);
        setTotalUnread(totalUnreadCount);
      })
      .catch((err) => {
        if (err?.response?.status === 429 || err?.response?.status === 401) {
          if (err?.response?.status === 401) navigate('/login');
          return;
        }
        showError(parseError(err));
      })
      .finally(() => {
        isFetchingRef.current = false;
        setLoading(false);
        lastFetchAtRef.current = Date.now();
      });
  }, [user, navigate, setTotalUnread, showError]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !user) {
      navigate('/login');
      return;
    }
    fetchChatsSafe();
  }, [user, navigate, fetchChatsSafe]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;
    const onChats = location.pathname === '/chats' || location.hash === '#/chats';
    if (onChats) fetchChatsSafe();
  }, [location.pathname, location.hash, user, fetchChatsSafe]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      const token = localStorage.getItem('token');
      if (!token || !user) return;
      const onChats = location.pathname === '/chats' || location.hash === '#/chats';
      if (onChats) fetchChatsSafe();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user, location.pathname, location.hash, fetchChatsSafe]);

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

  const handleDeleteClick = (e, chatId) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDeleteId(chatId);
  };

  const handleDeleteConfirm = async (e, chat) => {
    e.preventDefault();
    e.stopPropagation();
    const chatId = chat._id;
    const chatUnreadCount = getChatUnreadCount(chat);
    setConfirmDeleteId(null);
    setDeletingChatId(chatId);
    try {
      await deleteChat(chatId);
      setChats((prev) => prev.filter((c) => c._id !== chatId));
      setTotalUnread((prev) => Math.max(0, prev - chatUnreadCount));
      showSuccess('Conversation deleted');
    } catch (err) {
      if (err?.response?.status === 401) {
        navigate('/login');
        return;
      }
      if (err?.response?.status === 404) {
        setChats((prev) => prev.filter((c) => c._id !== chatId));
        showError('Chat already deleted');
        return;
      }
      showError(parseError(err));
    } finally {
      setDeletingChatId(null);
    }
  };

  const handleDeleteCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDeleteId(null);
  };

  const handleRowClick = (chatId) => () => {
    if (confirmDeleteId === chatId) return;
    navigate(`/chats/${chatId}`);
  };

  const myId = getMyId(user);

  return (
    <div className="chats-page">
      <div className="chats-shell">
        <header className="chats-header">
          <div>
            <h1 className="chats-title">My Conversations</h1>
            <p className="chats-sub">
              {chats.length > 0
                ? `${chats.length} ${chats.length === 1 ? 'conversation' : 'conversations'}`
                : 'Your conversations will appear here'}
              {' · '}
              Messages are updated automatically when you open a chat.
            </p>
          </div>
          <button
            type="button"
            className="chats-refresh"
            onClick={fetchChatsSafe}
            disabled={loading}
          >
            Refresh
          </button>
        </header>

        {loading ? (
          <div className="chats-skeleton">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="chats-skeleton-row">
                <div className="chats-skeleton-avatar" />
                <div className="chats-skeleton-body">
                  <div className="chats-skeleton-line" />
                  <div className="chats-skeleton-line" />
                  <div className="chats-skeleton-line" />
                </div>
              </div>
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="chats-empty">
            <h2 className="chats-empty-title">No conversations yet</h2>
            <p className="chats-empty-text">
              Start a conversation by contacting a seller from an ad
            </p>
          </div>
        ) : (
          <div className="chats-list">
            {chats.map((chat) => {
              const other = getOtherParticipant(chat, myId);
              const participantName = getParticipantName(other);
              const participantInitial = participantName[0]?.toUpperCase() || 'U';
              const unreadCount = getChatUnreadCount(chat);
              const badgeText = formatBadge(unreadCount);
              const hasUnread = unreadCount > 0;
              const lastText = getLastMessageText(chat);
              const adTitle = getAdTitle(chat);
              const dateSource = chat.updatedAt || chat.lastMessage?.createdAt;
              const isConfirming = confirmDeleteId === chat._id;

              return (
                <button
                  key={chat._id}
                  type="button"
                  className="chat-row"
                  onClick={handleRowClick(chat._id)}
                >
                  <div className="chat-avatar">{participantInitial}</div>
                  <div className="chat-main">
                    <div className="chat-top">
                      <div className="chat-name">
                        {participantName}
                        {badgeText != null && <span className="chat-badge">{badgeText}</span>}
                      </div>
                      <div className="chat-meta">
                        {dateSource && (
                          <span className="chat-date">{formatDate(dateSource)}</span>
                        )}
                        {isConfirming ? (
                          <div className="chat-row-actions" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="chat-del-confirm chat-del-cancel"
                              onClick={(e) => handleDeleteCancel(e)}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="chat-del-confirm chat-del-confirm-btn"
                              onClick={(e) => handleDeleteConfirm(e, chat)}
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="chat-del"
                            onClick={(e) => handleDeleteClick(e, chat._id)}
                            disabled={deletingChatId === chat._id}
                            title="Delete conversation"
                          >
                            {deletingChatId === chat._id ? '…' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="chat-sub">
                      {adTitle && <div className="chat-ad">{adTitle}</div>}
                      {lastText && (
                        <div className={`chat-preview ${hasUnread ? 'chat-preview--unread' : ''}`}>
                          {lastText}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chats;
