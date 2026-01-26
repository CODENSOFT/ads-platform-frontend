import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getUnreadCountCached, getChats } from '../api/chat';
import { useAuth } from '../auth/useAuth.js';

/**
 * Hook to get and poll unread message count
 * - Refreshes on app load
 * - Refreshes when route changes to /chats
 * - Polls every 25 seconds
 */
export const useUnreadCount = () => {
  const { token } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const pollIntervalRef = useRef(null);
  const lastChatsCacheRef = useRef(null);

  const fetchUnreadCount = async () => {
    if (!token) {
      setUnreadCount(0);
      return;
    }

    try {
      // Try to get from getChats cache first (if available)
      if (lastChatsCacheRef.current?.totalUnread !== undefined) {
        setUnreadCount(lastChatsCacheRef.current.totalUnread);
      }

      // Also fetch from API to ensure accuracy
      const response = await getUnreadCountCached();
      const count = response.data?.count || response.data?.unreadCount || 0;
      setUnreadCount(typeof count === 'number' ? count : 0);
    } catch (err) {
      // Handle 401 (unauthorized) - user logged out or token invalid
      if (err?.response?.status === 401) {
        setUnreadCount(0);
        return;
      }
      // For other errors, keep current count
    }
  };

  // Update from getChats response if available
  const updateFromChats = (chatsResponse) => {
    if (chatsResponse?.data?.totalUnread !== undefined) {
      const totalUnread = chatsResponse.data.totalUnread;
      setUnreadCount(totalUnread);
      lastChatsCacheRef.current = { totalUnread };
    }
  };

  // Fetch on mount and when route changes to /chats
  useEffect(() => {
    fetchUnreadCount();

    // Poll every 25 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchUnreadCount();
    }, 25000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [token]);

  // Refresh when navigating to /chats
  useEffect(() => {
    if (location.pathname === '/chats' || location.hash === '#/chats') {
      fetchUnreadCount();
    }
  }, [location.pathname, location.hash, token]);

  // Format badge text
  const badgeText = unreadCount > 99 ? '99+' : String(unreadCount);

  return {
    unreadCount,
    badgeText: unreadCount > 0 ? badgeText : null,
    refreshUnreadCount: fetchUnreadCount,
    updateFromChats,
  };
};
