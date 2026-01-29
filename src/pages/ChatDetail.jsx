import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMessages, sendMessage, getChats } from '../api/chat';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';
import { useAuth } from '../auth/useAuth.js';
import { useUnread } from '../context/UnreadContext.jsx';
import '../styles/chat-detail.css';

const NEAR_BOTTOM_THRESHOLD = 120;
const POLL_INTERVAL_MS = 30000;
const UNREAD_REFRESH_MIN_MS = 15000;
const BACKOFF_AFTER_429_MS = 90000;

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
  const scrollAreaRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const isFetchingRef = useRef(false);
  const last429Ref = useRef(0);
  const lastUnreadRefreshRef = useRef(0);
  const userNearBottomRef = useRef(true);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const refreshUnreadSafe = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    if (Date.now() - lastUnreadRefreshRef.current < UNREAD_REFRESH_MIN_MS) return;

    getChats()
      .then((chatsResponse) => {
        if (chatsResponse.data?.skipped) return;
        const totalUnreadCount = chatsResponse.data?.totalUnread || 0;
        setTotalUnread(totalUnreadCount);
        lastUnreadRefreshRef.current = Date.now();
      })
      .catch((err) => {
        if (err?.response?.status === 429 || err?.response?.status === 401) return;
      });
  }, [setTotalUnread]);

  const fetchMessages = useCallback(async () => {
    if (!id) return;
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    try {
      const response = await getMessages(id);
      const messagesData = response.data?.messages || response.data?.data || response.data || [];
      setMessages(Array.isArray(messagesData) ? messagesData : []);
      refreshUnreadSafe();
    } catch (err) {
      if (err?.response?.status === 429) {
        last429Ref.current = Date.now();
        return;
      }
      const errorMessage = parseError(err);
      showError(errorMessage);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [id, showError, refreshUnreadSafe]);

  useEffect(() => {
    if (!id) return;

    fetchMessages();

    pollIntervalRef.current = setInterval(() => {
      const token = localStorage.getItem('token');
      if (!token || document.hidden) return;
      if (Date.now() - last429Ref.current < BACKOFF_AFTER_429_MS) return;
      fetchMessages();
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [id, fetchMessages]);

  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;

    const handleScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } = el;
      userNearBottomRef.current = scrollHeight - scrollTop - clientHeight < NEAR_BOTTOM_THRESHOLD;
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (userNearBottomRef.current) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      const token = localStorage.getItem('token');
      if (!token) return;
      fetchMessages();
      refreshUnreadSafe();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchMessages, refreshUnreadSafe]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || sending) return;

    const textToSend = messageText.trim();
    setMessageText('');
    setSending(true);

    const optimisticMessage = {
      _id: `temp-${Date.now()}`,
      text: textToSend,
      sender: user?._id,
      senderName: user?.name,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    scrollToBottom();

    try {
      await sendMessage(id, textToSend);
      refreshUnreadSafe();
      await fetchMessages();
      scrollToBottom();
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== optimisticMessage._id));
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
    } catch {
      return dateString;
    }
  };

  const getOtherParticipant = () => {
    if (messages.length === 0) return null;
    const firstMessage = messages[0];
    const firstIsOwn = firstMessage.sender === user?._id || firstMessage.sender?._id === user?._id;
    if (firstIsOwn) {
      const otherMessage = messages.find(
        (m) => m.sender !== user?._id && m.sender?._id !== user?._id
      );
      return otherMessage
        ? {
            name: otherMessage.senderName || 'Unknown',
            id: otherMessage.sender?._id || otherMessage.sender,
          }
        : null;
    }
    return {
      name: firstMessage.senderName || 'Unknown',
      id: firstMessage.sender?._id || firstMessage.sender,
    };
  };

  const otherParticipant = getOtherParticipant();
  const participantInitial = otherParticipant?.name?.[0]?.toUpperCase() || 'C';

  return (
    <div className="chat-page">
      <div className="chat-shell">
        <header className="chat-topbar">
          <button
            type="button"
            className="chat-back"
            onClick={() => navigate('/chats')}
            aria-label="Back"
          >
            ←
          </button>
          <div className="chat-peer">
            <div className="chat-avatar">{participantInitial}</div>
            <div className="chat-peer-meta">
              <div className="chat-peer-name">{otherParticipant?.name || 'Conversation'}</div>
              <div className="chat-peer-sub">
                {messages.length
                  ? `${messages.length} ${messages.length === 1 ? 'message' : 'messages'}`
                  : 'No messages yet'}
              </div>
            </div>
          </div>
          <div className="chat-actions">
            <button
              type="button"
              className="chat-action"
              onClick={() => fetchMessages()}
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        </header>

        <main className="chat-body" id="chatScrollArea" ref={scrollAreaRef}>
          {loading ? (
            <div className="chat-skeleton">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="chat-skeleton-bubble" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">
              <div className="chat-empty-title">No messages yet</div>
              <div className="chat-empty-text">Send a message to start the conversation.</div>
            </div>
          ) : (
            <div className="chat-thread">
              {messages.map((message) => {
                const isOwn =
                  message.sender === user?._id || message.sender?._id === user?._id;
                const isOptimistic = message._id?.startsWith('temp-');
                return (
                  <div
                    key={message._id}
                    className={`msg ${isOwn ? 'msg--own' : 'msg--other'} ${isOptimistic ? 'msg--pending' : ''}`}
                  >
                    <div className="msg-bubble">
                      {!isOwn && message.senderName && (
                        <div className="msg-sender">{message.senderName}</div>
                      )}
                      <div className="msg-text">{message.text}</div>
                      <div className="msg-time">{formatTime(message.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        <form onSubmit={handleSend} className="chat-composer">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="chat-input"
            aria-label="Message"
          />
          <button
            type="submit"
            disabled={!messageText.trim() || sending}
            className="chat-send"
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatDetail;
