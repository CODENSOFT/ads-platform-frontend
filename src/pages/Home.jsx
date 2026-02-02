import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAds } from '../api/endpoints';
import { fetchCategories } from '../api/categoriesApi';
import AdCard from '../components/AdCard';
import { capitalizeWords } from '../utils/text';

// Fixed 6 tiles: always use these slugs for navigation (never synthetic ids like cat-real-estate)
const HOME_TILES = [
  { label: 'Auto & Transport', slug: 'automobile', keywords: ['autom', 'transport', 'auto'] },
  { label: 'Imobiliare', slug: 'imobiliare', keywords: ['imobil'] },
  { label: 'Electronice & Tehnică', slug: 'electronice-tehnica', keywords: ['electron', 'tehnic'] },
  { label: 'Casă & Grădină', slug: 'casa-gradina', keywords: ['casa', 'gradina', 'grădină'] },
  { label: 'Modă & Frumusețe', slug: 'moda-frumusete', keywords: ['moda', 'frumus'] },
  { label: 'Locuri de muncă', slug: 'locuri-de-munca', keywords: ['munca', 'muncă', 'job', 'locuri'] },
];

const isMongoObjectId = (v) => {
  const s = String(v || '').trim();
  return /^[a-f0-9]{24}$/i.test(s);
};

// Icon per category (slug/name keywords). Each card gets one icon.
const getCategoryIcon = (slug, name = '') => {
  const s = `${(slug || '')} ${(name || '')}`.toLowerCase();

  // Auto & Transport
  if (s.includes('autom') || s.includes('transport') || s.includes('auto')) {
    return (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 11L6.5 6.5H17.5L19 11M5 11H3M5 11V16.5M19 11H21M19 11V16.5M7 16.5H17M7 16.5C7 17.3284 6.32843 18 5.5 18C4.67157 18 4 17.3284 4 16.5M7 16.5C7 15.6716 7.67157 15 8.5 15C9.32843 15 10 15.6716 10 16.5M17 16.5C17 17.3284 17.6716 18 18.5 18C19.3284 18 20 17.3284 20 16.5M17 16.5C17 15.6716 16.3284 15 15.5 15C14.6716 15 14 15.6716 14 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  // Imobiliare
  if (s.includes('imobil')) {
    return (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  // Electronice & Tehnică
  if (s.includes('electron') || s.includes('tehnic')) {
    return (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M6 8H18M6 12H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
  }
  // Casă & Grădină (frunză / grădină)
  if (s.includes('casa') || s.includes('gradina') || s.includes('grădină')) {
    return (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 20C7 16 2 10 2 6a10 10 0 0 1 20 0c0 4-5 10-9 14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  // Modă & Frumusețe
  if (s.includes('moda') || s.includes('frumus')) {
    return (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04097 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7564 11.2728 22.0329 10.6054C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.0621 22.0329 6.39464C21.7564 5.72718 21.351 5.12075 20.84 4.61Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  // Locuri de muncă
  if (s.includes('munca') || s.includes('muncă') || s.includes('job') || s.includes('locuri')) {
    return (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21" stroke="currentColor" strokeWidth="2"/>
      </svg>
    );
  }

  // Default: generic category
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6h16M4 10h16M4 14h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [cats, setCats] = useState([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [recommendedAds, setRecommendedAds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories with robust normalization
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setCatsLoading(true);
        const res = await fetchCategories();

        // normalize possible shapes:
        // res may be axios response -> res.data
        const raw = res?.data ?? res;
        const list = raw?.categories ?? raw?.data ?? raw;

        const arr = Array.isArray(list) ? list : [];
        const normalized = arr
          .map(c => {
            // Generate a fallback ID if none exists
            const id = c?._id || c?.id || `cat-${c?.slug || c?.name || Math.random()}`;
            const name = capitalizeWords(c?.name || c?.title || c?.label || '');
            const slug = (c?.slug || c?.key || c?.name || '').toString().toLowerCase().trim();

            return {
              _id: id,
              name,
              slug,
            };
          })
          .filter(c => c.name && c.name.trim() !== ""); // Only filter by name, not _id

        if (import.meta.env.DEV) console.log("[HOME] categories raw:", raw);
        if (import.meta.env.DEV) console.log("[HOME] categories normalized:", normalized);

        // If normalized is empty, use fallback
        if (mounted) {
          if (normalized.length > 0) {
            setCats(normalized);
          } else {
            // No categories from API, use fallback
            const fallback = [
              { _id: "fallback-automobile", name: "Auto & Transport", slug: "automobile" },
              { _id: "fallback-imobiliare", name: "Imobiliare", slug: "imobiliare" },
              { _id: "fallback-electronice", name: "Electronice & Tehnică", slug: "electronice-tehnica" },
              { _id: "fallback-casa", name: "Casă & Grădină", slug: "casa-gradina" },
              { _id: "fallback-moda", name: "Modă & Frumusețe", slug: "moda-frumusete" },
              { _id: "fallback-jobs", name: "Locuri de muncă", slug: "locuri-de-munca" },
            ];
            setCats(fallback);
          }
        }
      } catch (e) {
        console.error("[HOME] failed to load categories", e);

        // HARD fallback list so UI still shows:
        const fallback = [
          { _id: "fallback-automobile", name: "Auto & Transport", slug: "automobile" },
          { _id: "fallback-imobiliare", name: "Imobiliare", slug: "imobiliare" },
          { _id: "fallback-electronice", name: "Electronice & Tehnică", slug: "electronice-tehnica" },
          { _id: "fallback-casa", name: "Casă & Grădină", slug: "casa-gradina" },
          { _id: "fallback-moda", name: "Modă & Frumusețe", slug: "moda-frumusete" },
          { _id: "fallback-jobs", name: "Locuri de muncă", slug: "locuri-de-munca" },
        ];
        if (mounted) setCats(fallback);
      } finally {
        if (mounted) setCatsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Build 6 tiles from HOME_TILES: fixed slug, label; realCategoryId only if API category has Mongo ObjectId
  const displayCategories = (() => {
    const used = new Set();
    return HOME_TILES.map((tile) => {
      const found = cats.find((c) => {
        if (used.has(c._id)) return false;
        const slug = (c.slug || '').toLowerCase();
        const name = (c.name || '').toLowerCase();
        const matches = tile.keywords.some(
          (kw) => slug.includes(kw.toLowerCase()) || name.includes(kw.toLowerCase())
        );
        if (matches) {
          used.add(c._id);
          return true;
        }
        return false;
      });
      const id = found ? String(found._id || found.id || '') : '';
      return {
        name: tile.label,
        slug: tile.slug,
        realCategoryId: found && isMongoObjectId(id) ? id : null,
      };
    });
  })();

  // Fetch recommended ads
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

  const handleCategoryClick = (category) => {
    const slug = (category.slug || '').trim();
    if (!slug) return;
    navigate(`/ads?category=${encodeURIComponent(slug)}`);
  };

  const categoriesToRender = displayCategories;

  return (
    <div className="page home">
      <style>{`
        .home {
          position: relative;
          min-height: 100vh;
        }
        .home::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(900px 500px at 10% 0%, rgba(37, 99, 235, 0.08), transparent 50%),
            radial-gradient(800px 400px at 90% 80%, rgba(59, 130, 246, 0.06), transparent 50%);
        }
        .home .container {
          position: relative;
          z-index: 1;
        }

        .home-section {
          margin-bottom: 40px;
        }
        .home-section__head {
          margin-bottom: 24px;
        }
        .home-section__title {
          font-size: 22px;
          font-weight: 800;
          color: var(--text-main, #0f172a);
          letter-spacing: -0.02em;
          margin: 0 0 6px 0;
        }
        .home-section__sub {
          font-size: 14px;
          color: var(--text-muted, #64748b);
          margin: 0;
        }
        .home-section__head-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .home-section__head-row .home-section__title {
          margin-bottom: 0;
        }
        .home-section__link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: var(--primary, #2563eb);
          text-decoration: none;
        }
        .home-section__link:hover {
          text-decoration: underline;
        }
        .home-skeleton-card {
          height: 200px;
          background: rgba(15, 23, 42, 0.04);
        }
        .home-panel .home-skeleton-card {
          height: 240px;
        }

        .home .category-card {
          border: 1px solid rgba(20, 80, 200, 0.12);
          border-radius: var(--radius-lg, 18px);
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .home .category-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 40px rgba(15, 23, 42, 0.12);
          border-color: rgba(37, 99, 235, 0.2);
        }
        .home .category-card__icon {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(37, 99, 235, 0.06));
          border: 1px solid rgba(37, 99, 235, 0.15);
          color: var(--primary, #2563eb);
          margin-bottom: 12px;
        }
        .home .category-card__icon svg {
          width: 32px;
          height: 32px;
        }
        .home .category-card__chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          color: var(--primary, #2563eb);
          margin-top: 8px;
          opacity: 0;
          transform: translateY(4px);
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .home .category-card:hover .category-card__chip {
          opacity: 1;
          transform: translateY(0);
        }
        .home .grid.grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }
        @media (max-width: 900px) {
          .home .grid.grid-3 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 640px) {
          .home .grid.grid-3 {
            grid-template-columns: 1fr;
          }
        }

        .home-panel {
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(15, 23, 42, 0.06);
          border-radius: var(--radius-lg, 18px);
          padding: 24px;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
        }
        .home-section__badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          background: rgba(37, 99, 235, 0.1);
          border: 1px solid rgba(37, 99, 235, 0.18);
          color: var(--primary, #2563eb);
          margin-bottom: 12px;
        }
      `}</style>

      <div className="container">
        <div className="hero">
          <h1 className="page-title">Find what you need. Sell what you don&apos;t.</h1>
          <p className="page-subtitle">
            A clean marketplace experience for modern listings — fast search, clear filters, and premium presentation.
          </p>
          <Link to="/ads" className="btn btn-primary">Explore listings</Link>
        </div>

        <section className="home-section">
          <div className="home-section__head">
            <h2 className="home-section__title">Browse categories</h2>
            <p className="home-section__sub">Pick a category to filter listings instantly</p>
          </div>

          {catsLoading ? (
            <div className="grid grid-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card card--pad home-skeleton-card" />
              ))}
            </div>
          ) : (
            <div className="grid grid-3">
              {categoriesToRender.map((category) => (
                <div
                  key={category._id || category.id || category.slug}
                  onClick={() => handleCategoryClick(category)}
                  className="category-card card card-hover"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCategoryClick(category);
                    }
                  }}
                >
                  <div className="category-card__icon">
                    {getCategoryIcon(category.slug, category.name)}
                  </div>
                  <h3 className="category-card__title">{capitalizeWords(category.name)}</h3>
                  <p className="category-card__subtitle">Explore {capitalizeWords(category.name)}</p>
                  <span className="category-card__chip">
                    Explore
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="home-section">
          <div className="home-section__head">
            <span className="home-section__badge">Latest</span>
            <div className="home-section__head-row">
              <h2 className="home-section__title">Recommended</h2>
              <Link to="/ads" className="nav-link home-section__link">
                View all
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>

          <div className="home-panel">
            {loading ? (
              <div className="grid grid-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card card--pad home-skeleton-card" />
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
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
