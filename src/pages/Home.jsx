import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAds } from '../api/endpoints';
import AdCard from '../components/AdCard';

const CATEGORIES = [
  {
    name: 'Automobile',
    slug: 'automobile',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 11L6.5 6.5H17.5L19 11M5 11H3M5 11V16.5M19 11H21M19 11V16.5M7 16.5H17M7 16.5C7 17.3284 6.32843 18 5.5 18C4.67157 18 4 17.3284 4 16.5M7 16.5C7 15.6716 7.67157 15 8.5 15C9.32843 15 10 15.6716 10 16.5M17 16.5C17 17.3284 17.6716 18 18.5 18C19.3284 18 20 17.3284 20 16.5M17 16.5C17 15.6716 16.3284 15 15.5 15C14.6716 15 14 15.6716 14 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    name: 'Imobiliare',
    slug: 'imobiliare',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    name: 'Electronice și Tehnică',
    slug: 'electronice-si-tehnica',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M6 8H18M6 12H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    name: 'Casă și Grădină',
    slug: 'casa-si-gradina',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    name: 'Modă și Frumusețe',
    slug: 'moda-si-frumusete',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04097 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7564 11.2728 22.0329 10.6054C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.0621 22.0329 6.39464C21.7564 5.72718 21.351 5.12075 20.84 4.61Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    name: 'Locuri de muncă',
    slug: 'locuri-de-munca',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
];

const Home = () => {
  const navigate = useNavigate();
  const [recommendedAds, setRecommendedAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ active: 0, newToday: 0 });

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        setLoading(true);
        const response = await getAds({ limit: 10, sort: 'newest' });
        const data = response.data;
        
        let adsArray = [];
        if (data?.ads && Array.isArray(data.ads)) {
          adsArray = data.ads;
        } else if (data?.data?.ads && Array.isArray(data.data.ads)) {
          adsArray = data.data.ads;
        } else if (Array.isArray(data)) {
          adsArray = data;
        }

        setRecommendedAds(Array.isArray(adsArray) ? adsArray : []);
        
        // Mock stats (replace with actual API call if available)
        setStats({
          active: data?.pagination?.total || adsArray.length || 0,
          newToday: Math.floor(Math.random() * 50) + 10,
        });
      } catch (err) {
        console.error('Failed to fetch recommended ads:', err);
        setRecommendedAds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommended();
  }, []);

  const handleCategoryClick = (slug) => {
    navigate(`/ads?category=${slug}`);
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        padding: '80px 0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div className="container" style={{ maxWidth: '1400px', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '48px',
            alignItems: 'center',
          }}
          className="hero-grid"
          >
            <div>
              <h1 style={{
                fontSize: '3.5rem',
                fontWeight: '800',
                color: 'var(--text)',
                marginBottom: '24px',
                lineHeight: '1.1',
              }}>
                Find what you need.<br />
                Sell what you don't.
              </h1>
              <p style={{
                fontSize: '1.25rem',
                color: 'var(--muted)',
                marginBottom: '32px',
                lineHeight: '1.6',
              }}>
                Discover amazing deals and connect with buyers and sellers in your community.
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <Link to="/ads" className="btn-primary" style={{ textDecoration: 'none' }}>
                  Browse Ads
                </Link>
                <Link to="/create" className="btn-ghost" style={{ textDecoration: 'none' }}>
                  Post an Ad
                </Link>
              </div>
            </div>
            
            {/* Stats Panel */}
            <div style={{
              background: 'var(--card)',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15)',
              border: '2px solid rgba(16, 185, 129, 0.1)',
            }}>
              <h3 style={{
                margin: '0 0 24px 0',
                fontSize: '1.25rem',
                fontWeight: '700',
                color: 'var(--text)',
              }}>
                Marketplace Stats
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: '800',
                    color: 'var(--green-600)',
                    marginBottom: '4px',
                  }}>
                    {stats.active.toLocaleString()}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '14px', fontWeight: '500' }}>
                    Active Ads
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: '800',
                    color: 'var(--green-600)',
                    marginBottom: '4px',
                  }}>
                    {stats.newToday}+
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '14px', fontWeight: '500' }}>
                    New Today
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section style={{ padding: '80px 0', background: 'var(--bg)' }}>
        <div className="container" style={{ maxWidth: '1400px' }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: 'var(--text)',
            marginBottom: '48px',
            textAlign: 'center',
          }}>
            Browse by Category
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
          }}
          className="category-grid"
          >
            {CATEGORIES.map((category) => (
              <div
                key={category.slug}
                onClick={() => handleCategoryClick(category.slug)}
                style={{
                  background: 'var(--card)',
                  borderRadius: '20px',
                  padding: '32px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '2px solid transparent',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.borderColor = 'var(--green-500)';
                  e.currentTarget.style.boxShadow = '0 8px 24px var(--green-glow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
                }}
              >
                <div style={{
                  color: 'var(--green-600)',
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'center',
                }}>
                  {category.icon}
                </div>
                <h3 style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: 'var(--text)',
                }}>
                  {category.name}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recommended Ads */}
      <section style={{ padding: '80px 0', background: 'var(--bg)' }}>
        <div className="container" style={{ maxWidth: '1400px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
          }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: 'var(--text)',
              margin: 0,
            }}>
              Recommended
            </h2>
            <Link
              to="/ads"
              style={{
                color: 'var(--green-600)',
                fontSize: '1rem',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--green-700)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--green-600)';
              }}
            >
              View all
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ color: 'var(--muted)' }}>Loading recommended ads...</p>
            </div>
          ) : recommendedAds.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ color: 'var(--muted)' }}>No ads available at the moment.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '24px',
            }}
            className="recommended-grid"
            >
              {recommendedAds.map(ad => (
                <AdCard key={ad._id} ad={ad} showFavoriteButton={true} />
              ))}
            </div>
          )}
        </div>
      </section>

      <style>{`
        @media (max-width: 1024px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
          }
          .category-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .recommended-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          .category-grid {
            grid-template-columns: 1fr !important;
          }
          .recommended-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
