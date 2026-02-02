import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAds } from '../api/endpoints';
import useCategories from '../hooks/useCategories';
import AdCard from '../components/AdCard';
import { capitalizeWords } from '../utils/text';
import '../styles/ads.css';

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
];

const normalizeSlug = (v) => {
  let s = String(v || '').toLowerCase().trim();
  s = s.replace(/\s+/g, '-');
  s = s.replace(/&/g, 'and');
  s = s.replace(/[^a-z0-9-]/g, '');
  return s;
};

// Aliasuri: slug din Home/URL -> slug-uri acceptate din backend (match strict)
const CATEGORY_SLUG_ALIASES = {
  imobiliare: ['imobiliare', 'cat-real-estate'],
  'cat-real-estate': ['cat-real-estate', 'imobiliare'],
  automobile: ['automobile', 'cat-automobile', 'auto-transport'],
  'cat-automobile': ['cat-automobile', 'automobile'],
  'electronice-tehnica': ['electronice-tehnica', 'cat-electronics', 'electronice-tehnica'],
  'cat-electronics': ['cat-electronics', 'electronice-tehnica'],
  'casa-gradina': ['casa-gradina', 'cat-home-garden', 'casa-gradina'],
  'cat-home-garden': ['cat-home-garden', 'casa-gradina'],
  'moda-frumusete': ['moda-frumusete', 'cat-fashion', 'moda-frumusete'],
  'cat-fashion': ['cat-fashion', 'moda-frumusete'],
  'locuri-de-munca': ['locuri-de-munca', 'cat-jobs', 'locuri-de-munca'],
  'cat-jobs': ['cat-jobs', 'locuri-de-munca'],
};

const AdsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories } = useCategories();
  const [loading, setLoading] = useState(true);
  const [visibleAds, setVisibleAds] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Single source of truth = URL query params
  const categorySlugParam = (searchParams.get('category') || '').trim();
  const subCategorySlugParam = (
    searchParams.get('subCategory') ||
    searchParams.get('subCategorySlug') ||
    searchParams.get('subCategoryId') ||
    ''
  ).trim();
  const searchParam = (searchParams.get('search') || '').trim();
  const sort = searchParams.get('sort') || '-createdAt';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  // Fetch ads with server-side filtering only (no client-side filtering, no fetchLimit 10000)
  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page,
        limit,
        sort,
      };
      if (categorySlugParam) {
        params.category = categorySlugParam;
        params.categorySlug = categorySlugParam;
      }
      if (subCategorySlugParam) params.subCategorySlug = subCategorySlugParam;
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
      setVisibleAds(fetchedAds);

      const paginationData = data?.pagination || {};
      setPagination({
        page: paginationData.page ?? page,
        pages: paginationData.pages ?? 1,
        total: paginationData.total ?? fetchedAds.length,
        hasNext: !!paginationData.hasNext,
        hasPrev: !!paginationData.hasPrev,
      });
    } catch (err) {
      console.error('Failed to fetch ads:', err);
      setVisibleAds([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sort, minPrice, maxPrice, categorySlugParam, subCategorySlugParam, searchParam]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value !== '' && value != null) {
      newParams.set(key, String(value));
    } else {
      newParams.delete(key);
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const clearCategory = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('category');
    next.delete('categoryId');
    next.delete('subCategory');
    next.delete('subCategorySlug');
    next.delete('subCategoryId');
    next.delete('page');
    setSearchParams(next);
  };

  const clearSubCategory = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('subCategory');
    next.delete('subCategorySlug');
    next.delete('subCategoryId');
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

  const selectedCategory = categorySlugParam
    ? categories.find((c) => {
        const cs = (c.slug || '').toLowerCase().trim();
        const paramNorm = categorySlugParam.toLowerCase().trim();
        if (cs === paramNorm) return true;
        const accepted = CATEGORY_SLUG_ALIASES[normalizeSlug(categorySlugParam)];
        return accepted && accepted.some((a) => normalizeSlug(a) === normalizeSlug(cs));
      })
    : null;
  const selectedCategoryName = capitalizeWords(
    selectedCategory?.name || selectedCategory?.label || ''
  ) || null;
  const displayCategoryName =
    selectedCategoryName ||
    (categorySlugParam ? capitalizeWords(categorySlugParam.replace(/-/g, ' ')) : '') ||
    '';
  const availableSubcategories = selectedCategory?.subcategories || selectedCategory?.subs || [];
  const selectedSubcategory =
    subCategorySlugParam &&
    availableSubcategories.find(
      (sub) =>
        (sub.slug || sub).toString().toLowerCase() === subCategorySlugParam.toLowerCase()
    );
  const selectedSubcategoryName = capitalizeWords(
    selectedSubcategory?.name || selectedSubcategory?.label || selectedSubcategory || subCategorySlugParam || ''
  ) || subCategorySlugParam;

  const hasActiveFilters =
    categorySlugParam || subCategorySlugParam || searchParam || minPrice || maxPrice;

  return (
    <div className="ads-page">
      <div className="ads-container">
        <header className="ads-header">
          <div className="ads-header__left">
            <h1 className="ads-title">{displayCategoryName || 'All Ads'}</h1>
            <p className="ads-subtitle">
              {pagination.total != null ? pagination.total : visibleAds.length}{' '}
              {(pagination.total != null ? pagination.total : visibleAds.length) === 1 ? 'result' : 'results'}
            </p>
          </div>
          <div className="ads-header__sort">
            <label className="filter-label" htmlFor="ads-sort">
              Sort
            </label>
            <select
              id="ads-sort"
              value={sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="field-input"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </header>

        {hasActiveFilters && (
          <div className="ads-chips">
            {categorySlugParam && (
              <span className="ads-chip">
                Category: {displayCategoryName}
                <button
                  type="button"
                  onClick={clearCategory}
                  className="ads-chip-x"
                  aria-label="Clear category"
                >
                  ×
                </button>
              </span>
            )}
            {subCategorySlugParam && (
              <span className="ads-chip">
                Subcategory: {selectedSubcategoryName}
                <button
                  type="button"
                  onClick={clearSubCategory}
                  className="ads-chip-x"
                  aria-label="Clear subcategory"
                >
                  ×
                </button>
              </span>
            )}
            {searchParam && (
              <span className="ads-chip">
                Search: &quot;{searchParam}&quot;
                <button
                  type="button"
                  onClick={clearSearch}
                  className="ads-chip-x"
                  aria-label="Clear search"
                >
                  ×
                </button>
              </span>
            )}
            <button type="button" className="ads-chips-clear" onClick={clearAll}>
              Clear all
            </button>
          </div>
        )}

        <div className="ads-layout">
          <aside className="ads-sidebar">
            <div className="filter-card">
              <h2 className="filter-title">Filters</h2>

              <div className="filter-group">
                <label className="filter-label" htmlFor="ads-category">
                  Category
                </label>
                <select
                  id="ads-category"
                  value={categorySlugParam}
                  onChange={(e) => {
                    const slug = (e.target.value || '').trim();
                    if (slug) {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set('category', slug);
                      newParams.delete('subCategory');
                      newParams.delete('subCategorySlug');
                      newParams.delete('subCategoryId');
                      newParams.delete('page');
                      setSearchParams(newParams);
                    } else {
                      clearCategory();
                    }
                  }}
                  className="field-input"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => {
                    const catSlug = (cat.slug || '').trim();
                    if (!catSlug) return null;
                    return (
                      <option key={catSlug} value={catSlug}>
                        {capitalizeWords(cat.name || cat.label)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedCategory && (
                <div className="filter-group">
                  <label className="filter-label" htmlFor="ads-subcategory">
                    Subcategory
                  </label>
                  <select
                    id="ads-subcategory"
                    value={subCategorySlugParam}
                    onChange={(e) => {
                      const value = (e.target.value || '').trim();
                      if (value) {
                        const newParams = new URLSearchParams(searchParams);
                        newParams.set('subCategory', value);
                        newParams.delete('page');
                        setSearchParams(newParams);
                      } else {
                        clearSubCategory();
                      }
                    }}
                    className="field-input"
                  >
                    <option value="">All Subcategories</option>
                    {availableSubcategories.map((sub) => {
                      const subSlug = sub.slug ?? sub;
                      const subLabel = sub.name || sub.label || subSlug;
                      return (
                        <option key={subSlug} value={subSlug}>
                          {capitalizeWords(subLabel)}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="filter-group">
                <label className="filter-label" htmlFor="ads-min-price">
                  Price Range
                </label>
                <div className="filter-row-2">
                  <input
                    id="ads-min-price"
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="field-input"
                  />
                  <input
                    id="ads-max-price"
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="field-input"
                  />
                </div>
              </div>
            </div>
          </aside>

          <main className="ads-main">
            {loading ? (
              <div className="ads-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton-image" />
                    <div className="skeleton-body">
                      <div className="skeleton-line" />
                      <div className="skeleton-line" />
                      <div className="skeleton-line" />
                    </div>
                  </div>
                ))}
              </div>
            ) : visibleAds.length === 0 ? (
              <div className="ads-empty">
                <div className="ads-empty__icon" aria-hidden>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                </div>
                <h3 className="ads-empty__title">No listings found</h3>
                <p className="ads-empty__text">
                  {hasActiveFilters
                    ? 'No listings found for this filter. Try adjusting your filters or search.'
                    : 'No ads available at the moment.'}
                </p>
                {hasActiveFilters && (
                  <button type="button" className="btn btn-secondary" onClick={clearAll}>
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="ads-grid">
                  {visibleAds.map((ad) => (
                    <AdCard key={ad._id || ad.id} ad={ad} showFavoriteButton={true} />
                  ))}
                </div>

                {pagination.pages > 1 && (
                  <div className="ads-pagination">
                    <button
                      type="button"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={!pagination.hasPrev || loading}
                      className="ads-pagination__btn"
                    >
                      Previous
                    </button>
                    <span className="ads-pagination__pill" aria-current="page">
                      {page}
                    </span>
                    <span className="ads-pagination__label">
                      of {pagination.pages}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={!pagination.hasNext || loading}
                      className="ads-pagination__btn"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdsPage;
