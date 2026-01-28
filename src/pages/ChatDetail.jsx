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
      <div className="page">
        <div className="container">
          <div className="card card--pad text-center py-6">
            <div className="t-body t-muted">Loading messages...</div>
          </div>
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
  const participantInitial = otherParticipant?.name?.[0]?.toUpperCase() || 'U';

  return (
    <div style={{ padding: 0, height: '100vh', overflow: 'hidden' }}>
      <div className="chat-container">
        {/* Header */}
        <div className="chat-header">
          <button
            onClick={() => navigate('/chats')}
            className="chat-header__back"
            aria-label="Back to conversations"
          >
            ←
          </button>
          <div className="chat-header__avatar">
            {participantInitial}
          </div>
          <div className="chat-header__info">
            <h1 className="chat-header__name">
              {otherParticipant?.name || 'Conversation'}
            </h1>
            <p className="chat-header__meta">
              {messages.length > 0 ? `${messages.length} ${messages.length === 1 ? 'message' : 'messages'}` : 'No messages yet'}
            </p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-messages__empty">
              <h3 className="t-h3 mb-2">No messages yet</h3>
              <p className="t-body t-muted">
                Start the conversation by sending a message below
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwn = message.sender === user?._id || message.sender?._id === user?._id;
              const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.sender !== message.sender && messages[index - 1]?.sender?._id !== message.sender?._id);
              const isOptimistic = message._id?.startsWith('temp-');
              
              return (
                <div
                  key={message._id}
                  className={`chat-message ${isOwn ? 'chat-message--own' : ''} ${showAvatar ? 'chat-message--show-avatar' : ''} ${isOptimistic ? 'chat-message--optimistic' : ''}`}
                >
                  {!isOwn && (
                    <div className="chat-message__avatar">
                      {message.senderName?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="chat-message__bubble">
                    {!isOwn && message.senderName && (
                      <div className="chat-message__sender">
                        {message.senderName}
                      </div>
                    )}
                    <div className="chat-message__text">
                      {message.text}
                    </div>
                    <div className="chat-message__time">
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
        <form onSubmit={handleSend} className="chat-input">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="chat-input__field"
          />
          <button
            type="submit"
            disabled={!messageText.trim() || sending}
            className="chat-input__send"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatDetail;
