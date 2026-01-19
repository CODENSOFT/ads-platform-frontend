import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMessages, sendMessage } from '../api/chat';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';
import { useAuth } from '../auth/useAuth.js';
import { useChatNotifications } from '../hooks/useChatNotifications.js';

const ChatDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { error: showError } = useToast();
  const { refreshUnreadCount } = useChatNotifications();
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
      // Refresh unread count after successfully fetching messages
      // Backend marks messages as read when fetching
      refreshUnreadCount();
    } catch (err) {
      const errorMessage = parseError(err);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    fetchMessages();

    // Poll messages every 4 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchMessages();
    }, 4000);

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
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading messages...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => navigate('/chats')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '4px 8px',
          }}
        >
          ← Back
        </button>
        <h1 style={{ margin: 0, fontSize: '20px' }}>Chat</h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
            No messages yet. Start the conversation!
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
                }}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: isOwn ? '#007bff' : '#e9ecef',
                    color: isOwn ? '#fff' : '#000',
                  }}
                >
                  {!isOwn && message.senderName && (
                    <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', opacity: 0.8 }}>
                      {message.senderName}
                    </div>
                  )}
                  <div style={{ marginBottom: '4px', wordBreak: 'break-word' }}>
                    {message.text}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.7, textAlign: 'right' }}>
                    {formatTime(message.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} style={{ padding: '16px', borderTop: '1px solid #ddd', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: '1px solid #ddd',
            borderRadius: '20px',
            fontSize: '14px',
          }}
        />
        <button
          type="submit"
          disabled={!messageText.trim() || sending}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '20px',
            cursor: !messageText.trim() || sending ? 'not-allowed' : 'pointer',
            opacity: !messageText.trim() || sending ? 0.5 : 1,
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default ChatDetail;

