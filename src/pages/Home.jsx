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
    name: 'Electronice & Tehnică',
    slug: 'electronice',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M6 8H18M6 12H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    name: 'Casă & Grădină',
    slug: 'casa-gradina',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    name: 'Modă & Frumusețe',
    slug: 'moda-frumusete',
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

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        setLoading(true);
        const response = await getAds({ limit: 10, sort: '-createdAt' });
        const data = response.data;
        
        let adsArray = [];
        if (data?.ads && Array.isArray(data.ads)) {
          adsArray = data.ads;
        } else if (data?.data?.ads && Array.isArray(data.data.ads)) {
          adsArray = data.data.ads;
        } else if (Array.isArray(data)) {
          adsArray = data;
        }
        
        // Slice to exactly 10 ads
        setRecommendedAds(Array.isArray(adsArray) ? adsArray.slice(0, 10) : []);
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
    navigate(`/ads?category=${encodeURIComponent(slug)}`);
  };

  return (
    <div className="page">
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-header__title">Find what you need. Sell what you don't.</h1>
          <p className="page-header__subtitle">
            A clean marketplace experience for modern listings — fast search, clear filters, and premium presentation.
          </p>
        </div>

        {/* Category Section */}
        <section className="section">
          <div className="grid grid-3">
            {CATEGORIES.map((category) => (
              <div
                key={category.slug}
                onClick={() => handleCategoryClick(category.slug)}
                className="category-card card card-hover"
              >
                <div className="category-card__icon">
                  {category.icon}
                </div>
                <h3 className="category-card__title">
                  {category.name}
                </h3>
                <p className="category-card__subtitle">
                  Explore {category.name}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Recommended Ads Section */}
        <section className="section">
          <div className="flex items-center justify-between mb-6">
            <h2 className="t-h2">Recommended</h2>
            <Link to="/ads" className="nav-link flex items-center gap-2">
              View all
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card card--pad" style={{ height: 240, background: 'var(--surface-2)' }} />
              ))}
            </div>
          ) : recommendedAds.length === 0 ? (
            <div className="text-center py-6">
              <p className="t-muted">No ads available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-3">
              {recommendedAds.map(ad => (
                <AdCard key={ad._id} ad={ad} showFavoriteButton={true} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;
