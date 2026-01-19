import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.js';
import { getAds } from '../api/endpoints';
import AdCard from '../components/AdCard';
import FiltersBar from '../components/FiltersBar';
import { findCategoryBySlug, findSubcategoryBySlug } from '../data/categories';

const Home = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ads, setAds] = useState([]);
  const [filters, setFilters] = useState({
    q: '',
    minPrice: '',
    maxPrice: '',
    currency: '',
    category: '',
    subCategory: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    pages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false,
  });

  const fetchAds = useCallback(async (filterParams = {}, page = 1, limit = 12) => {
    try {
      setLoading(true);
      setError(null);
      
      // Combine filters with pagination params
      const params = {
        ...filterParams,
        page,
        limit,
      };
      
      const response = await getAds(params);
      
      // Normalize response - try multiple paths to extract array
      let adsArray = [];
      const data = response.data;
      
      if (data?.ads && Array.isArray(data.ads)) {
        adsArray = data.ads;
      } else if (data?.data?.ads && Array.isArray(data.data.ads)) {
        adsArray = data.data.ads;
      } else if (data?.data && Array.isArray(data.data)) {
        adsArray = data.data;
      } else if (data?.items && Array.isArray(data.items)) {
        adsArray = data.items;
      } else if (Array.isArray(data)) {
        adsArray = data;
      }
      
      // Ensure ads is always an array
      let finalAds = Array.isArray(adsArray) ? adsArray : [];
      
      // Local filtering fallback if backend doesn't support category filter
      if (filterParams.categorySlug) {
        const categorySlug = filterParams.categorySlug;
        finalAds = finalAds.filter((ad) => {
          // Try multiple possible paths for category in ad object
          const adCategory = ad.category?.slug || ad.category || ad.categorySlug;
          return adCategory === categorySlug;
        });
      }
      
      // Apply subcategory filter if exists (local fallback)
      if (filterParams.subCategorySlug && finalAds.length > 0) {
        const subCategorySlug = filterParams.subCategorySlug;
        finalAds = finalAds.filter((ad) => {
          const adSubCategory = ad.subCategory?.slug || ad.subCategory || ad.subCategorySlug;
          return adSubCategory === subCategorySlug;
        });
      }
      
      setAds(finalAds);
      
      // Extract pagination from response
      const paginationData = data?.pagination || {};
      setPagination({
        page: paginationData.page || page,
        limit: paginationData.limit || limit,
        pages: paginationData.pages || 1,
        total: paginationData.total || 0,
        hasNext: paginationData.hasNext || false,
        hasPrev: paginationData.hasPrev || false,
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load ads');
      setAds([]); // Ensure ads is array even on error
      // Reset pagination on error
      setPagination({
        page: 1,
        limit: 12,
        pages: 1,
        total: 0,
        hasNext: false,
        hasPrev: false,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const handleApplyFilters = (values) => {
    // Clear previous error
    setError(null);

    // Trim search query
    const trimmedQ = values.q ? values.q.trim() : '';

    // Convert prices to numbers - use undefined for empty values
    const min = values.minPrice !== "" && values.minPrice !== null ? Number(values.minPrice) : undefined;
    const max = values.maxPrice !== "" && values.maxPrice !== null ? Number(values.maxPrice) : undefined;

    // Validation: Check if minPrice > maxPrice when both are valid numbers
    if (min !== undefined && max !== undefined && !isNaN(min) && !isNaN(max)) {
      if (min > max) {
        setError('Minimum price cannot be greater than maximum price');
        return; // Do NOT fetch if validation fails
      }
    }

    // Update filters state
    setFilters({
      q: trimmedQ,
      minPrice: values.minPrice || '',
      maxPrice: values.maxPrice || '',
      currency: values.currency || '',
      category: values.category || '',
      subCategory: values.subCategory || '',
    });

    // Build params object - OMIT empty values
    const params = {};
    
    // q: include only if trimmed length > 0
    if (trimmedQ.length > 0) {
      params.q = trimmedQ;
    }
    
    // minPrice: include only if it is a valid number (not "", not null, not NaN)
    if (min !== undefined && !isNaN(min)) {
      params.minPrice = min;
    }
    
    // maxPrice: include only if it is a valid number
    if (max !== undefined && !isNaN(max)) {
      params.maxPrice = max;
    }
    
    // currency: include only if currency is not empty
    if (values.currency && values.currency.trim() !== '') {
      params.currency = values.currency;
    }

    // categorySlug: include only if category is not empty
    if (values.categorySlug && values.categorySlug.trim() !== '') {
      params.categorySlug = values.categorySlug;
    }

    // subCategorySlug: include only if subCategory is not empty
    if (values.subCategorySlug && values.subCategorySlug.trim() !== '') {
      params.subCategorySlug = values.subCategorySlug;
    }

    // Reset page to 1 when applying filters, then fetch
    fetchAds(params, 1, pagination.limit);
  };

  const handleResetFilters = () => {
    // Clear filters
    setFilters({
      q: '',
      minPrice: '',
      maxPrice: '',
      currency: '',
      category: '',
      subCategory: '',
    });

    // Clear any validation errors
    setError(null);

    // Reset page to 1 and refetch all ads (no filters)
    fetchAds({}, 1, pagination.limit);
  };

  const handlePageChange = (newPage) => {
    // Build clean filters from current filters state
    const params = {};
    const trimmedQ = filters.q.trim();
    if (trimmedQ.length > 0) {
      params.q = trimmedQ;
    }
    const min = filters.minPrice !== "" && filters.minPrice !== null ? Number(filters.minPrice) : undefined;
    const max = filters.maxPrice !== "" && filters.maxPrice !== null ? Number(filters.maxPrice) : undefined;
    if (min !== undefined && !isNaN(min)) {
      params.minPrice = min;
    }
    if (max !== undefined && !isNaN(max)) {
      params.maxPrice = max;
    }
    if (filters.currency && filters.currency.trim() !== '') {
      params.currency = filters.currency;
    }
    if (filters.category && filters.category.trim() !== '') {
      params.categorySlug = filters.category; // Backend expects categorySlug
    }
    if (filters.subCategory && filters.subCategory.trim() !== '') {
      params.subCategorySlug = filters.subCategory; // Backend expects subCategorySlug
    }
    
    fetchAds(params, newPage, pagination.limit);
  };

  return (
    <div className="page-container">
      <div className="container">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            color: '#1a1a1a',
            marginBottom: '8px',
          }}>
            Browse Ads
          </h1>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#666',
            margin: 0,
          }}>
            Discover amazing deals and find what you're looking for
          </p>
        </div>

        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#666',
            fontSize: '18px',
          }}>
            <div>Loading ads...</div>
          </div>
        )}
        
        {error && (
          <div className="card" style={{
            backgroundColor: '#fff5f5',
            border: '1px solid #fed7d7',
            marginBottom: '24px',
          }}>
            <div style={{ 
              color: '#c53030', 
              marginBottom: '16px',
              fontSize: '16px',
              fontWeight: '500',
            }}>
              {error}
            </div>
            <button
              onClick={() => fetchAds({}, pagination.page, pagination.limit)}
              disabled={loading}
              className="btn-secondary"
            >
              {loading ? 'Refreshing...' : 'Try Again'}
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <FiltersBar
              initialValues={filters}
              onApply={handleApplyFilters}
              onReset={handleResetFilters}
            />
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '16px', 
              marginBottom: '24px',
              flexWrap: 'wrap',
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ color: '#666', fontSize: '14px' }}>Results: </span>
                  <strong style={{ color: '#1a1a1a', fontSize: '16px' }}>
                    {pagination.total || ads.length}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#666', fontSize: '14px' }}>Page: </span>
                  <strong style={{ color: '#1a1a1a', fontSize: '16px' }}>
                    {pagination.page} / {pagination.pages}
                  </strong>
                </div>
                {(filters.category || filters.subCategory) && (() => {
                  const category = filters.category ? findCategoryBySlug(filters.category) : null;
                  const subCategory = filters.subCategory && filters.category
                    ? findSubcategoryBySlug(filters.category, filters.subCategory)
                    : null;
                  const categoryLabel = category?.label || filters.category || '';
                  const subCategoryLabel = subCategory?.label || filters.subCategory || '';
                  
                  return (
                    <div>
                      <span style={{ color: '#666', fontSize: '14px' }}>Filter: </span>
                      <strong style={{ color: '#007bff', fontSize: '16px' }}>
                        {subCategoryLabel 
                          ? `${categoryLabel} / ${subCategoryLabel}`
                          : categoryLabel}
                      </strong>
                    </div>
                  );
                })()}
              </div>
              <button
                onClick={() => fetchAds({}, pagination.page, pagination.limit)}
                disabled={loading}
                className="btn-secondary"
                style={{ fontSize: '14px', padding: '8px 16px' }}
              >
                🔄 Refresh
              </button>
            </div>
            {Array.isArray(ads) && ads.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <h3 style={{ color: '#1a1a1a', marginBottom: '8px' }}>No ads found</h3>
                <p style={{ color: '#666' }}>Try adjusting your filters to see more results</p>
              </div>
            ) : Array.isArray(ads) ? (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '24px',
                  marginBottom: '32px',
                }}>
                  {ads.map((ad) => (
                    <AdCard key={ad._id} ad={ad} showFavoriteButton={true} />
                  ))}
                </div>
                {pagination.pages > 1 && (
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    marginTop: '32px',
                  }}>
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrev || loading}
                      className="btn-primary"
                      style={{
                        opacity: !pagination.hasPrev || loading ? 0.5 : 1,
                        cursor: !pagination.hasPrev || loading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      ← Previous
                    </button>
                    <span style={{
                      padding: '10px 20px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#333',
                    }}>
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNext || loading}
                      className="btn-primary"
                      style={{
                        opacity: !pagination.hasNext || loading ? 0.5 : 1,
                        cursor: !pagination.hasNext || loading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
