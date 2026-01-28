import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAds } from '../api/endpoints';
import AdCard from '../components/AdCard';

const CATEGORIES = [
  { name: 'Automobile', slug: 'automobile' },
  { name: 'Imobiliare', slug: 'imobiliare' },
  { name: 'Electronice & Tehnică', slug: 'electronice' },
  { name: 'Casă & Grădină', slug: 'casa-gradina' },
  { name: 'Modă & Frumusețe', slug: 'moda-frumusete' },
  { name: 'Locuri de muncă', slug: 'locuri-de-munca' },
];

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
];

const AdsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [allAds, setAllAds] = useState([]);
  const [visibleAds, setVisibleAds] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Read filters from URL
  const categoryParam = (searchParams.get('category') || '').trim();
  const searchParam = (searchParams.get('search') || '').trim();
  const sort = searchParams.get('sort') || '-createdAt';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  // DEV logs
  if (import.meta.env.DEV) {
    console.log({ categoryParam, searchParam });
  }

  // Fetch ads from API (without filtering)
  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        sort,
      };
      
      // Try server-side filtering first (if API supports it)
      if (categoryParam) params.category = categoryParam;
      if (categoryParam) params.categorySlug = categoryParam;
      if (searchParam) params.search = searchParam;
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

      const fetchedAds = Array.isArray(adsArray) ? adsArray : [];
      
      // Store all fetched ads (DO NOT filter here)
      setAllAds(fetchedAds);
      
      const paginationData = data?.pagination || {};
      setPagination({
        page: paginationData.page || page,
        pages: paginationData.pages || 1,
        total: paginationData.total || fetchedAds.length,
        hasNext: paginationData.hasNext || false,
        hasPrev: paginationData.hasPrev || false,
      });
    } catch (err) {
      console.error('Failed to fetch ads:', err);
      setAllAds([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sort, minPrice, maxPrice, categoryParam, searchParam]);

  // Fetch ads when params change
  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // Filter ads based on query params (client-side fallback)
  useEffect(() => {
    let filtered = [...allAds];

    // Filter by category
    if (categoryParam) {
      const categorySlug = categoryParam.toLowerCase();
      filtered = filtered.filter((ad) => {
        // Support both string and object category
        const adCategory = ad?.category;
        const adCategorySlug = ad?.categorySlug || ad?.category?.slug;
        
        // Check direct slug match
        if (adCategorySlug && String(adCategorySlug).toLowerCase().trim() === categorySlug) {
          return true;
        }
        
        // Check if category object has slug
        if (adCategory && typeof adCategory === 'object' && adCategory.slug) {
          if (String(adCategory.slug).toLowerCase().trim() === categorySlug) {
            return true;
          }
        }
        
        // Check if category is a string that matches
        if (adCategory && typeof adCategory === 'string' && String(adCategory).toLowerCase().trim() === categorySlug) {
          return true;
        }
        
        return false;
      });
    }

    // Filter by search (title contains query)
    if (searchParam) {
      const query = searchParam.toLowerCase();
      filtered = filtered.filter((ad) => {
        const title = String(ad?.title || ad?.name || '').toLowerCase();
        return title.includes(query);
      });
    }

    setVisibleAds(filtered);
  }, [allAds, categoryParam, searchParam]);

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

  const selectedCategoryName = categoryParam ? CATEGORIES.find(c => c.slug === categoryParam)?.name : null;

  return (
    <div className="page">
      <div className="container">
        {/* Premium Header with Filters */}
        <div className="page-header">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="page-header__title">
                {selectedCategoryName || 'All Ads'}
              </h1>
              <p className="page-header__subtitle">
                {visibleAds.length} {visibleAds.length === 1 ? 'result' : 'results'}
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          {(categoryParam || searchParam) && (
            <div className="flex items-center gap-2 flex-wrap mb-6">
              {categoryParam && (
                <span className="pill">
                  Category: {selectedCategoryName || categoryParam}
                  <button
                    type="button"
                    onClick={clearCategory}
                    className="pill-x"
                    aria-label="Clear category"
                  >
                    ×
                  </button>
                </span>
              )}
              {searchParam && (
                <span className="pill">
                  Search: "{searchParam}"
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="pill-x"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                </span>
              )}
              <button className="btn btn-secondary btn-sm" onClick={clearAll}>
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="ads-layout">
          {/* Filters Sidebar */}
          <div className="ads-sidebar card card--pad">
            <h3 className="t-h3 mb-6">Filters</h3>

            <div className="flex flex-col gap-6">
              <div>
                <label className="t-small t-bold mb-2 block">Category</label>
                <select
                  value={categoryParam}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="input"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="t-small t-bold mb-2 block">Price Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="input"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="t-small t-bold mb-2 block">Sort By</label>
                <select
                  value={sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="input"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Ads Grid */}
          <div>
            {loading ? (
              <div className="grid grid-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card card--pad" style={{ height: 320, background: 'var(--surface-2)' }} />
                ))}
              </div>
            ) : visibleAds.length === 0 ? (
              <div className="card card--pad text-center py-6">
                <h3 className="t-h3 mb-2">No listings found</h3>
                <p className="t-body t-muted mb-4">
                  {categoryParam || searchParam 
                    ? 'Try adjusting your filters or search terms'
                    : 'No ads available at the moment'
                  }
                </p>
                {(categoryParam || searchParam) && (
                  <button className="btn btn-secondary" onClick={clearAll}>
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-3">
                  {visibleAds.map(ad => (
                    <AdCard key={ad._id || ad.id} ad={ad} showFavoriteButton={true} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-8">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={!pagination.hasPrev || loading}
                      className="btn btn-secondary"
                    >
                      Previous
                    </button>
                    <span className="t-body t-bold">
                      Page {page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={!pagination.hasNext || loading}
                      className="btn btn-secondary"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .ads-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 32px;
          align-items: start;
        }
        .ads-sidebar {
          position: sticky;
          top: 24px;
        }
        @media (max-width: 1024px) {
          .ads-layout {
            grid-template-columns: 1fr;
          }
          .ads-sidebar {
            position: static;
            margin-bottom: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdsPage;
