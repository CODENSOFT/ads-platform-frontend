import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { getUnreadCountCached, getChats } from '../api/chat';
import { useAuth } from '../auth/useAuth.js';

/**
 * Hook to get and poll unread message count
 * - Refreshes on app load
 * - Refreshes when route changes to /chats
 * - Polls every 30 seconds (throttled)
 */
export const useUnreadCount = () => {
  const { token } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const pollIntervalRef = useRef(null);
  const lastChatsCacheRef = useRef(null);
  const abortControllerRef = useRef(null);
  const lastFetchTimeRef = useRef(0);
  const MIN_POLL_INTERVAL_MS = 30000; // 30 seconds minimum

  const fetchUnreadCount = useCallback(async () => {
    // HARD GUARD: Do NOT call API if token is missing
    if (!token) {
      setUnreadCount(0);
      return;
    }

    // Throttle: prevent calls faster than 30 seconds
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    if (timeSinceLastFetch < MIN_POLL_INTERVAL_MS) {
      return; // Skip if called too soon
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      // Try to get from getChats cache first (if available)
      if (lastChatsCacheRef.current?.totalUnread !== undefined) {
        setUnreadCount(lastChatsCacheRef.current.totalUnread);
      }

      // Also fetch from API to ensure accuracy
      const response = await getUnreadCountCached();
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      const count = response.data?.count || response.data?.unreadCount || 0;
      setUnreadCount(typeof count === 'number' ? count : 0);
      lastFetchTimeRef.current = Date.now();
    } catch (err) {
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // Handle 401 (unauthorized) - user logged out or token invalid
      if (err?.response?.status === 401) {
        setUnreadCount(0);
        return;
      }
      
      // Handle 429 (rate limit) - skip silently
      if (err?.response?.status === 429) {
        return;
      }
      
      // For other errors, keep current count
    }
  }, [token]);

  // Update from getChats response if available
  const updateFromChats = (chatsResponse) => {
    if (chatsResponse?.data?.totalUnread !== undefined) {
      const totalUnread = chatsResponse.data.totalUnread;
      setUnreadCount(totalUnread);
      lastChatsCacheRef.current = { totalUnread };
    }
  };

  // Fetch on mount and poll every 30 seconds (only if token exists)
  useEffect(() => {
    // HARD GUARD: Do NOT poll if token is missing
    if (!token) {
      setUnreadCount(0);
      return;
    }

    // Initial fetch
    fetchUnreadCount();

    // Poll every 30 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchUnreadCount();
    }, MIN_POLL_INTERVAL_MS);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [token, fetchUnreadCount]);

  // Refresh when navigating to /chats (throttled)
  useEffect(() => {
    if (!token) return;
    
    if (location.pathname === '/chats' || location.hash === '#/chats') {
      fetchUnreadCount();
    }
  }, [location.pathname, location.hash, token, fetchUnreadCount]);

  // Format badge text
  const badgeText = unreadCount > 99 ? '99+' : String(unreadCount);

  return {
    unreadCount,
    badgeText: unreadCount > 0 ? badgeText : null,
    refreshUnreadCount: fetchUnreadCount,
    updateFromChats,
  };
};
