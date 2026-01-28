import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.js';
import { useUnread } from '../context/UnreadContext.jsx';
import { getChats } from '../api/chat';

const ProfileMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { totalUnread, setTotalUnread } = useUnread();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Format badge text
  const badgeText = totalUnread > 99 ? '99+' : String(totalUnread);
  const showBadge = totalUnread > 0;

  // Polling: fetch unread count every 30 seconds (throttled)
  useEffect(() => {
    // HARD GUARD: Do NOT poll if user is missing
    if (!user) {
      setTotalUnread(0);
      return;
    }

    let lastFetchTime = 0;
    const MIN_POLL_INTERVAL_MS = 30000; // 30 seconds minimum

    const fetchUnreadCount = async () => {
      // STOP calling protected endpoints when token missing
      const token = localStorage.getItem('token');
      if (!token || !user) {
        setTotalUnread(0);
        return;
      }

      // Throttle: prevent calls faster than 30 seconds
      const now = Date.now();
      if (now - lastFetchTime < MIN_POLL_INTERVAL_MS) {
        return; // Skip if called too soon
      }

      try {
        // Fetch chats to get totalUnread
        const response = await getChats();
        
        // Check if request was skipped (no token)
        if (response.data?.skipped) {
          setTotalUnread(0);
          return;
        }
        
        const totalUnreadCount = response.data?.totalUnread || 0;
        setTotalUnread(totalUnreadCount);
        lastFetchTime = Date.now();
      } catch (err) {
        // Silent fail - never log 429
        if (err?.response?.status === 429) {
          return;
        }
        // Handle 401 silently
        if (err?.response?.status === 401) {
          setTotalUnread(0);
          return;
        }
      }
    };

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
    };
  }, [user, setTotalUnread]);

  // Refresh when navigating to /chats
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !user) {
      return;
    }

    if (location.pathname === '/chats' || location.hash === '#/chats') {
      const fetchUnreadCount = async () => {
        try {
          const response = await getChats();
          
          // Check if request was skipped (no token)
          if (response.data?.skipped) {
            return;
          }
          
          const totalUnreadCount = response.data?.totalUnread || 0;
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
      fetchUnreadCount();
    }
  }, [location.pathname, location.hash, setTotalUnread, user]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on ESC key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/login');
  };

  const handleMenuClick = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  // If user is not logged in, show Login link
  if (!user) {
    return (
      <Link
        to="/login"
        style={{
          padding: '10px 20px',
          color: '#007bff',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '500',
        }}
      >
        Login
      </Link>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '2px solid #ddd',
          backgroundColor: '#f8f9fa',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#007bff';
          e.currentTarget.style.backgroundColor = '#e7f3ff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#ddd';
          e.currentTarget.style.backgroundColor = '#f8f9fa';
        }}
        aria-label="Profile menu"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            minWidth: '220px',
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '8px 0',
            zIndex: 1000,
          }}
        >
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e0e0e0',
            marginBottom: '4px',
          }}>
            <div style={{
              fontSize: '12px',
              color: '#666',
              marginBottom: '4px',
            }}>
              Signed in as
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#1a1a1a',
            }}>
              {user.name || user.email}
            </div>
            {user.email && user.name && (
              <div style={{
                fontSize: '12px',
                color: '#999',
                marginTop: '2px',
              }}>
                {user.email}
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div style={{ padding: '4px 0' }}>
            <button
              onClick={() => handleMenuClick('/create')}
              style={{
                width: '100%',
                padding: '10px 16px',
                textAlign: 'left',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              ➕ Create Ad
            </button>

            <button
              onClick={() => handleMenuClick('/my-ads')}
              style={{
                width: '100%',
                padding: '10px 16px',
                textAlign: 'left',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              📋 My Ads
            </button>

            <button
              onClick={() => handleMenuClick('/favorites')}
              style={{
                width: '100%',
                padding: '10px 16px',
                textAlign: 'left',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              ❤️ Favorites
            </button>

            <button
              onClick={() => handleMenuClick('/chats')}
              style={{
                width: '100%',
                padding: '10px 16px',
                textAlign: 'left',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'background-color 0.2s',
                position: 'relative',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                💬 My Conversations
              </span>
              {showBadge && (
                <span style={{
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  minWidth: '18px',
                  textAlign: 'center',
                  lineHeight: '1.4',
                }}>
                  {badgeText}
                </span>
              )}
            </button>
          </div>

          {/* Divider */}
          <div style={{
            height: '1px',
            backgroundColor: '#e0e0e0',
            margin: '4px 0',
          }} />

          {/* Logout */}
          <div style={{ padding: '4px 0' }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '10px 16px',
                textAlign: 'left',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#dc3545',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff5f5'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              🚪 Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;

