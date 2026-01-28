import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../auth/useAuth.js';
import { getUnreadCountCached } from '../api/chat';
import { ChatNotificationsContext } from './ChatNotificationsContext.js';
import { useToast } from '../hooks/useToast';

export const ChatNotificationsProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { token } = useAuth();
  const { error: showError } = useToast();
  const pollIntervalRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const lastFetchTimeRef = useRef(0);
  const MIN_POLL_INTERVAL_MS = 30000; // 30 seconds minimum

  const refreshUnreadCount = useCallback(async (retryAfterMs = null) => {
    // HARD GUARD: Do NOT call API if token is missing
    if (!token) {
      setUnreadCount(0);
      return;
    }

    // Throttle: prevent calls faster than 30 seconds
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    if (timeSinceLastFetch < MIN_POLL_INTERVAL_MS && !retryAfterMs) {
      return; // Skip if called too soon
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      // Use cached version to avoid calling on every navigation
      const response = await getUnreadCountCached();
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      const count = response.data?.count || response.data?.unreadCount || 0;
      setUnreadCount(typeof count === 'number' ? count : 0);
      lastFetchTimeRef.current = Date.now();
      
      // Clear any pending retry
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
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
      
      // Handle 429 (rate limit) - don't retry automatically, just skip
      if (err?.type === 'RATE_LIMIT' || err?.response?.status === 429) {
        // Don't show error toast, just skip this poll
        return;
      }
      
      // For other errors, don't spam console, just keep current count
      // This prevents breaking the app if backend is down
    }
  }, [token, showError]);

  // Polling every 30 seconds if token exists
  useEffect(() => {
    // HARD GUARD: Do NOT poll if token is missing
    if (!token) {
      setUnreadCount(0);
      return;
    }

    // Initial fetch
    refreshUnreadCount();

    // Poll every 30 seconds
    pollIntervalRef.current = setInterval(() => {
      refreshUnreadCount();
    }, MIN_POLL_INTERVAL_MS);

    // Cleanup on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
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

