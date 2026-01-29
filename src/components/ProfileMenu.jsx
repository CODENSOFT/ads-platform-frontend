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

  // If user is not logged in, show Login and Register links
  if (!user) {
    return (
      <>
        <Link to="/login" className="nav-link">
          Login
        </Link>
        <Link to="/register" className="nav-link nav-link--primary">
          Register
        </Link>
      </>
    );
  }

  return (
    <div className="profile-menu">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`profile-btn ${isOpen ? 'is-open' : ''}`}
        aria-label="Profile menu"
      >
        <span className="profile-btn__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="12"
              cy="7"
              r="4"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="profile-dropdown"
        >
          {/* Header */}
          <div className="profile-dropdown__header">
            <div className="profile-dropdown__label">Signed in as</div>
            <div className="profile-dropdown__name">{user.name || user.email}</div>
            {user.email && user.name && (
              <div className="profile-dropdown__email">{user.email}</div>
            )}
          </div>

          {/* Menu Items */}
          <div className="profile-dropdown__section">
            <button
              onClick={() => handleMenuClick('/create')}
              className="menu-item"
            >
              <span className="menu-item__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    d="M12 5v14M5 12h14"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="menu-item__label">Create Ad</span>
            </button>

            <button
              onClick={() => handleMenuClick('/my-ads')}
              className="menu-item"
            >
              <span className="menu-item__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 5a3 3 0 0 1 6 0v2H9V5Z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="menu-item__label">My Ads</span>
            </button>

            <button
              onClick={() => handleMenuClick('/favorites')}
              className="menu-item"
            >
              <span className="menu-item__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="menu-item__label">Favorites</span>
            </button>

            <button
              onClick={() => handleMenuClick('/chats')}
              className="menu-item menu-item--with-right"
            >
              <span className="menu-item__left">
                <span className="menu-item__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="menu-item__label">My Conversations</span>
              </span>
              {showBadge && <span className="menu-item__badge">{badgeText}</span>}
            </button>
          </div>

          {/* Divider */}
          <div className="profile-dropdown__divider" />

          {/* Logout */}
          <div className="profile-dropdown__section">
            <button
              onClick={handleLogout}
              className="menu-item menu-item--danger"
            >
              <span className="menu-item__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 17l5-5-5-5"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21 12H9"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="menu-item__label">Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;

