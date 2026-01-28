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

  // Fetch unread count on mount and poll every 30s
  useEffect(() => {
    let alive = true;

    const load = async () => {
      // STOP calling protected endpoints when token missing
      const token = localStorage.getItem('token');
      if (!token || !user) {
        setUnread(0);
        return;
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

    if (user) {
      load();
      const t = setInterval(load, 30000); // 30 seconds
      return () => { 
        alive = false; 
        clearInterval(t); 
      };
    } else {
      setUnread(0);
    }
  }, [user]);

  // Refresh when navigating to /chats (messages might have been read)
  useEffect(() => {
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
    <nav style={{
      backgroundColor: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '70px',
      }}>
        <Link
          to="/"
          style={{
            fontSize: '24px',
            fontWeight: '700',
            color: 'var(--green-600)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          AdsPlatform
        </Link>

        {/* Search Input */}
        <form
          onSubmit={handleSearchSubmit}
          style={{
            flex: 1,
            maxWidth: '500px',
            margin: '0 24px',
            position: 'relative',
          }}
        >
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}>
            <input
              type="text"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Caută anunțuri..."
              style={{
                width: '100%',
                padding: '10px 40px 10px 16px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '24px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--green-600)'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
            />
            <button
              type="submit"
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
              }}
              aria-label="Search"
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
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </div>
        </form>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          {user && (
            <Link
              to="/chats"
              style={{
                position: 'relative',
                padding: '8px',
                color: '#333',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label="Messages"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {unread > 0 && (
                <span className="nav-badge">
                  {unread > 99 ? '99+' : String(unread)}
                </span>
              )}
            </Link>
          )}
          {user ? (
            <ProfileMenu />
          ) : (
            <>
              <ProfileMenu />
              <Link
                to="/register"
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'var(--green-600)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--green-700)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--green-600)'}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

