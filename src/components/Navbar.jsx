import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.js';
import ProfileMenu from './ProfileMenu';

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState('');

  // Sync search input with URL param (for back/forward navigation)
  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam !== null) {
      setSearchValue(searchParam);
    } else if (location.pathname === '/' || location.pathname === '') {
      // Only clear if we're on home page
      setSearchValue('');
    }
  }, [searchParams, location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmedSearch = searchValue.trim();
    
    // Navigate to home with search param
    if (trimmedSearch) {
      navigate(`/?search=${encodeURIComponent(trimmedSearch)}`);
    } else {
      // Clear search if empty
      navigate('/');
    }
  };

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
            color: '#007bff',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          🏠 AdsPlatform
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
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
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
              onFocus={(e) => e.currentTarget.style.borderColor = '#007bff'}
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
          {user ? (
            <ProfileMenu />
          ) : (
            <>
              <ProfileMenu />
              <Link
                to="/register"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
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

