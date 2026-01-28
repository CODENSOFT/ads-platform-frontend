import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.js';
import ProfileMenu from './ProfileMenu';
import { safeGetUnreadCount } from '../api/chat';

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [navSearch, setNavSearch] = useState('');
  const [unread, setUnread] = useState(0);

  // Sync search input with URL param (for back/forward navigation)
  useEffect(() => {
    const searchParam = searchParams.get('search');
    const isAdsRoute = location.pathname === '/ads' || location.hash.startsWith('#/ads');
    if (isAdsRoute) {
      setNavSearch(searchParam ? String(searchParam) : '');
      return;
    }
    // Keep user input when not on /ads; do not sync to unrelated routes
  }, [searchParams, location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = String(navSearch || '').trim();
    if (!q) {
      sessionStorage.removeItem('last_ads_search');
      navigate('/ads');
      return;
    }
    sessionStorage.setItem('last_ads_search', q);
    navigate(`/ads?search=${encodeURIComponent(q)}`);
  };

  // Fetch unread count on mount and poll every 30s (throttled)
  useEffect(() => {
    // HARD GUARD: Do NOT poll if user/token is missing
    if (!user) {
      setUnread(0);
      return;
    }

    let alive = true;
    let lastFetchTime = 0;
    const MIN_POLL_INTERVAL_MS = 30000; // 30 seconds minimum

    const load = async () => {
      // STOP calling protected endpoints when token missing
      const token = localStorage.getItem('token');
      if (!token || !user) {
        setUnread(0);
        return;
      }

      // Throttle: prevent calls faster than 30 seconds
      const now = Date.now();
      if (now - lastFetchTime < MIN_POLL_INTERVAL_MS) {
        return; // Skip if called too soon
      }

      try {
        const data = await safeGetUnreadCount();
        if (!alive) return;
        
        // If skipped or rate limited, keep last known value
        if (data?.skipped || data?.rateLimited) {
          return;
        }
        
        const count = Number(data?.count || 0);
        if (Number.isFinite(count)) {
          setUnread(count);
          lastFetchTime = Date.now();
        }
      } catch (e) {
        // Silent fail - never log 429 or spam console
        if (e?.response?.status === 429) {
          return;
        }
        // Handle 401 silently
        if (e?.response?.status === 401) {
          setUnread(0);
          return;
        }
      }
    };

    // Initial load
    load();
    
    // Poll every 30 seconds
    const t = setInterval(load, MIN_POLL_INTERVAL_MS);
    
    return () => { 
      alive = false; 
      clearInterval(t); 
    };
  }, [user]);

  // Refresh when navigating to /chats (messages might have been read) - throttled
  useEffect(() => {
    // HARD GUARD: Do NOT call API if token/user is missing
    const token = localStorage.getItem('token');
    if (!token || !user) {
      return;
    }

    if (location.pathname === '/chats' || location.hash === '#/chats') {
      const load = async () => {
        try {
          const data = await safeGetUnreadCount();
          
          // If skipped or rate limited, keep last known value
          if (data?.skipped || data?.rateLimited) {
            return;
          }
          
          const count = Number(data?.count || 0);
          if (Number.isFinite(count)) {
            setUnread(count);
          }
        } catch (e) {
          // Silent fail - never log 429
          if (e?.response?.status === 429) {
            return;
          }
          // Handle 401 silently
          if (e?.response?.status === 401) {
            setUnread(0);
            return;
          }
        }
      };
      load();
    }
  }, [location.pathname, location.hash, user]);

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-inner">
          {/* Left: Brand */}
          <Link to="/" className="brand">
            <span className="brand-badge">A</span>
            <span>AdsPlatform</span>
          </Link>

          {/* Center: Search */}
          <form onSubmit={handleSearchSubmit} className="search">
            <div className="search-box">
              <input
                className="search-input"
                type="text"
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Search ads…"
              />
              <button
                type="submit"
                className="search-btn"
                aria-label="Search"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>
            </div>
          </form>

          {/* Right: Navigation Links */}
          <div className="nav-links">
            <Link to="/ads" className="nav-link">
              Ads
            </Link>
            
            {user && (
              <>
                <Link to="/favorites" className="nav-link">
                  Favorites
                </Link>
                <Link to="/chats" className="nav-link">
                  My Conversations
                  {unread > 0 && (
                    <span className="nav-badge">
                      {unread > 99 ? '99+' : String(unread)}
                    </span>
                  )}
                </Link>
              </>
            )}
            
            <ProfileMenu />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
