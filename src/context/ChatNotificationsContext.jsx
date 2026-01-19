import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../auth/useAuth.js';
import { getUnreadCount } from '../api/chat';
import { ChatNotificationsContext } from './ChatNotificationsContext.js';

export const ChatNotificationsProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { token } = useAuth();
  const pollIntervalRef = useRef(null);

  const refreshUnreadCount = useCallback(async () => {
    // If no token, set count to 0
    if (!token) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await getUnreadCount();
      const count = response.data?.count || response.data?.unreadCount || 0;
      setUnreadCount(typeof count === 'number' ? count : 0);
    } catch (err) {
      // Handle 401 (unauthorized) - user logged out or token invalid
      if (err?.response?.status === 401) {
        setUnreadCount(0);
      }
      // For other errors, don't spam console, just keep current count
      // This prevents breaking the app if backend is down
    }
  }, [token]);

  // Refresh on mount if token exists
  useEffect(() => {
    if (token) {
      refreshUnreadCount();
    } else {
      setUnreadCount(0);
    }
  }, [token, refreshUnreadCount]);

  // Polling every 30 seconds if token exists
  useEffect(() => {
    if (token) {
      pollIntervalRef.current = setInterval(() => {
        refreshUnreadCount();
      }, 30000); // 30 seconds

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    } else {
      // Clear interval if token is removed
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      setUnreadCount(0);
    }
  }, [token, refreshUnreadCount]);

  const value = {
    unreadCount,
    refreshUnreadCount,
  };

  return (
    <ChatNotificationsContext.Provider value={value}>
      {children}
    </ChatNotificationsContext.Provider>
  );
};

