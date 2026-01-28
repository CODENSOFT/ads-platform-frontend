import { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAds } from '../api/endpoints';
import AdCard from '../components/AdCard';

const CATEGORIES = [
  { name: 'Automobile', slug: 'automobile' },
  { name: 'Imobiliare', slug: 'imobiliare' },
  { name: 'Electronice & Tehnică', slug: 'electronice' },
  { name: 'Casă & Grădină', slug: 'casa-gradina' },
  { name: 'Modă & Frumusețe', slug: 'moda-frumusete' },
  { name: 'Locuri de muncă', slug: 'joburi' },
];

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
];

const AdsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Read filters from URL
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || '-createdAt';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const normalizedSearch = useMemo(() => String(search || '').trim().toLowerCase(), [search]);

  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        sort,
      };
      
      if (category) params.category = category;
      if (search) params.search = search;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const response = await getAds(params);
      const data = response.data;
      
      let adsArray = [];
      if (data?.ads && Array.isArray(data.ads)) {
        adsArray = data.ads;
      } else if (data?.data?.ads && Array.isArray(data.data.ads)) {
        adsArray = data.data.ads;
      } else if (Array.isArray(data)) {
        adsArray = data;
      }

      let finalAds = Array.isArray(adsArray) ? adsArray : [];
      // Fallback: ensure title contains search term (case-insensitive) even if backend doesn't filter
      if (normalizedSearch) {
        finalAds = finalAds.filter((ad) => {
          const title = String(ad?.title || ad?.name || '').toLowerCase();
          return title.includes(normalizedSearch);
        });
      }

      setAds(finalAds);
      
      const paginationData = data?.pagination || {};
      setPagination({
        page: paginationData.page || page,
        pages: paginationData.pages || 1,
        total: paginationData.total || 0,
        hasNext: paginationData.hasNext || false,
        hasPrev: paginationData.hasPrev || false,
      });
    } catch (err) {
      console.error('Failed to fetch ads:', err);
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, [category, search, sort, page, limit, minPrice, maxPrice, normalizedSearch]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.delete('page'); // Reset to page 1 on filter change
    setSearchParams(newParams);
  };

  const clearCategory = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('category');
    next.delete('page');
    setSearchParams(next);
  };

  const clearSearch = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('search');
    next.delete('page');
    setSearchParams(next);
  };

  const clearAll = () => setSearchParams({});

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(newPage));
    setSearchParams(newParams);
  };

  const FilterSidebar = () => (
    <div style={{
      background: 'var(--card)',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      height: 'fit-content',
      position: 'sticky',
      top: '24px',
    }}>
      <h3 style={{
        margin: '0 0 24px 0',
        fontSize: '1.25rem',
        fontWeight: '700',
        color: 'var(--text)',
      }}>
        Filters
      </h3>

      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--text)',
        }}>
          Category
        </label>
        <select
          value={category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            border: '2px solid var(--border)',
            fontSize: '14px',
            background: 'var(--card)',
            color: 'var(--text)',
            cursor: 'pointer',
          }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat.slug} value={cat.slug}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--text)',
        }}>
          Price Range
        </label>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              border: '2px solid var(--border)',
              fontSize: '14px',
            }}
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              border: '2px solid var(--border)',
              fontSize: '14px',
            }}
          />
        </div>
      </div>

      <div>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--text)',
        }}>
          Sort By
        </label>
        <select
          value={sort}
          onChange={(e) => handleFilterChange('sort', e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            border: '2px solid var(--border)',
            fontSize: '14px',
            background: 'var(--card)',
            color: 'var(--text)',
            cursor: 'pointer',
          }}
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div style={{
      background: 'var(--bg)',
      minHeight: '100vh',
      padding: '32px 0',
    }}>
      <div className="container" style={{ maxWidth: '1400px' }}>
        {/* Filter pills */}
        {(category || search) && (
          <div style={{ marginBottom: 18, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {category && (
              <span className="p-badge" style={{ gap: 8 }}>
                Category: {CATEGORIES.find(c => c.slug === category)?.name || category}
                <button
                  type="button"
                  onClick={clearCategory}
                  style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', fontWeight: 900 }}
                  aria-label="Clear category"
                >
                  ×
                </button>
              </span>
            )}
            {search && (
              <span className="p-badge" style={{ gap: 8 }}>
                Search: “{search}”
                <button
                  type="button"
                  onClick={clearSearch}
                  style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', fontWeight: 900 }}
                  aria-label="Clear search"
                >
                  ×
                </button>
              </span>
            )}
            <button className="btn btn-secondary" onClick={clearAll} style={{ padding: '8px 12px' }}>
              Clear all
            </button>
          </div>
        )}

        {/* Mobile Filter Toggle */}
        <div style={{
          display: 'none',
          marginBottom: '24px',
        }}
        className="mobile-filter-toggle"
        >
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="btn-primary"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {filtersOpen ? '✕' : '☰'} Filters
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: '32px',
          alignItems: 'start',
        }}
        className="ads-layout"
        >
          {/* Desktop Sidebar */}
          <div className="desktop-sidebar">
            <FilterSidebar />
          </div>

          {/* Mobile Filter Sheet */}
          {filtersOpen && (
            <div
              className="mobile-filter-sheet"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                zIndex: 1000,
                display: 'none',
              }}
              onClick={() => setFiltersOpen(false)}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '320px',
                  height: '100%',
                  background: 'var(--card)',
                  padding: '24px',
                  overflowY: 'auto',
                  boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>Filters</h3>
                  <button
                    onClick={() => setFiltersOpen(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                      color: 'var(--muted)',
                    }}
                  >
                    ✕
                  </button>
                </div>
                <FilterSidebar />
              </div>
            </div>
          )}

          {/* Main Content */}
          <div>
            {/* Results Header */}
            <div style={{
              background: 'var(--card)',
              borderRadius: '20px',
              padding: '24px',
              marginBottom: '32px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}>
              <div>
                <h2 style={{
                  margin: '0 0 8px 0',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: 'var(--text)',
                }}>
                  {category ? CATEGORIES.find(c => c.slug === category)?.name || 'Ads' : 'All Ads'}
                </h2>
                <p style={{
                  margin: 0,
                  color: 'var(--muted)',
                  fontSize: '14px',
                }}>
                  {pagination.total} {pagination.total === 1 ? 'result' : 'results'}
                </p>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div style={{
                textAlign: 'center',
                padding: '80px 20px',
                background: 'var(--card)',
                borderRadius: '20px',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                <p style={{ color: 'var(--muted)' }}>Loading ads...</p>
              </div>
            )}

            {/* Ads Grid */}
            {!loading && (
              <>
                {ads.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '80px 20px',
                    background: 'var(--card)',
                    borderRadius: '20px',
                  }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>🔍</div>
                    <h3 style={{ margin: '0 0 8px 0', color: 'var(--text)' }}>No ads found</h3>
                    <p style={{ color: 'var(--muted)' }}>Try adjusting your filters</p>
                  </div>
                ) : (
                  <>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: '24px',
                      marginBottom: '32px',
                    }}>
                      {ads.map(ad => (
                        <AdCard key={ad._id} ad={ad} showFavoriteButton={true} />
                      ))}
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                      <div style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                      }}>
                        <button
                          onClick={() => handlePageChange(page - 1)}
                          disabled={!pagination.hasPrev || loading}
                          className="btn-ghost"
                          style={{
                            opacity: !pagination.hasPrev ? 0.5 : 1,
                          }}
                        >
                          ← Previous
                        </button>
                        <span style={{
                          padding: '12px 20px',
                          background: 'var(--card)',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: 'var(--text)',
                        }}>
                          Page {page} of {pagination.pages}
                        </span>
                        <button
                          onClick={() => handlePageChange(page + 1)}
                          disabled={!pagination.hasNext || loading}
                          className="btn-ghost"
                          style={{
                            opacity: !pagination.hasNext ? 0.5 : 1,
                          }}
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .ads-layout {
            grid-template-columns: 1fr;
          }
          .desktop-sidebar {
            display: none;
          }
          .mobile-filter-toggle {
            display: block !important;
          }
          .mobile-filter-sheet {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdsPage;
