import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.js';
import { getAds } from '../api/endpoints';
import AdCard from '../components/AdCard';
import FiltersBar from '../components/FiltersBar';
import useCategories from '../hooks/useCategories';
import { buildAdsQuery } from '../utils/adsQuery';

const Home = () => {
  const { user, logout } = useAuth();
  const { categories } = useCategories(); // For getting category labels
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize filters from URL params or defaults
  const getInitialFilters = () => {
    const params = Object.fromEntries(searchParams);
    return {
      q: params.search || params.q || '',
      minPrice: params.minPrice || '',
      maxPrice: params.maxPrice || '',
      currency: params.currency || '',
      category: params.categorySlug || '',
      subCategory: params.subCategorySlug || '',
      sort: params.sort || 'newest',
      // Dynamic filters
      brand: params.brand || '',
      condition: params.condition || '',
      model: params.model || '',
      yearMin: params.yearMin || '',
      yearMax: params.yearMax || '',
      fuel: params.fuel || '',
      rooms: params.rooms || '',
      areaMin: params.areaMin || '',
      areaMax: params.areaMax || '',
    };
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ads, setAds] = useState([]);
  const [filters, setFilters] = useState(getInitialFilters);
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
      
      // Build query params using helper function
      const params = buildAdsQuery(filterParams, page, limit);
      
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

  // Fetch ads whenever URL params change (source of truth)
  useEffect(() => {
    const params = Object.fromEntries(searchParams);
    
    // Extract page and limit from URL or use defaults
    const page = params.page ? parseInt(params.page, 10) : 1;
    const limit = params.limit ? parseInt(params.limit, 10) : 12;
    
    // Build filter params from URL
    const filterParams = {
      search: params.search || '',
      categorySlug: params.categorySlug || '',
      subCategorySlug: params.subCategorySlug || '',
      minPrice: params.minPrice || '',
      maxPrice: params.maxPrice || '',
      currency: params.currency || '',
      sort: params.sort || 'newest',
      // Dynamic filters
      brand: params.brand || '',
      condition: params.condition || '',
      model: params.model || '',
      yearMin: params.yearMin || '',
      yearMax: params.yearMax || '',
      fuel: params.fuel || '',
      rooms: params.rooms || '',
      areaMin: params.areaMin || '',
      areaMax: params.areaMax || '',
    };
    
    // Update local filters state to match URL
    setFilters({
      q: filterParams.search,
      minPrice: filterParams.minPrice,
      maxPrice: filterParams.maxPrice,
      currency: filterParams.currency,
      category: filterParams.categorySlug,
      subCategory: filterParams.subCategorySlug,
      sort: filterParams.sort,
      brand: filterParams.brand,
      condition: filterParams.condition,
      model: filterParams.model,
      yearMin: filterParams.yearMin,
      yearMax: filterParams.yearMax,
      fuel: filterParams.fuel,
      rooms: filterParams.rooms,
      areaMin: filterParams.areaMin,
      areaMax: filterParams.areaMax,
    });
    
    // Fetch with params from URL
    const queryParams = buildAdsQuery(filterParams, page, limit);
    fetchAds(queryParams, page, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Only depend on searchParams, fetchAds is stable

  const handleApplyFilters = (values) => {
    // Clear previous error
    setError(null);

    // Convert prices to numbers for validation
    const min = values.minPrice !== "" && values.minPrice !== null ? Number(values.minPrice) : undefined;
    const max = values.maxPrice !== "" && values.maxPrice !== null ? Number(values.maxPrice) : undefined;

    // Validation: Check if minPrice > maxPrice when both are valid numbers
    if (min !== undefined && max !== undefined && !isNaN(min) && !isNaN(max)) {
      if (min > max) {
        setError('Minimum price cannot be greater than maximum price');
        return; // Do NOT update URL if validation fails
      }
    }

    // Build query params using helper (page=1 on Apply)
    const filterParams = {
      search: values.search || values.q || '',
      categorySlug: values.categorySlug || '',
      subCategorySlug: values.subCategorySlug || '',
      minPrice: values.minPrice || '',
      maxPrice: values.maxPrice || '',
      currency: values.currency || '',
      sort: values.sort || 'newest',
    };
    
    const params = buildAdsQuery(filterParams, 1, pagination.limit);

    // Update URL (this will trigger useEffect to fetch)
    const urlParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        urlParams.set(key, String(params[key]));
      }
    });
    setSearchParams(urlParams);
    // Note: fetchAds will be triggered by useEffect watching searchParams
  };

  const handleResetFilters = () => {
    // Clear any validation errors
    setError(null);

    // Clear URL params completely (this will trigger useEffect to fetch with defaults)
    setSearchParams({});
    // Note: fetchAds will be triggered by useEffect watching searchParams
  };

  const handlePageChange = (newPage) => {
    // Update only page in URL, keep all other params
    const currentParams = new URLSearchParams(searchParams);
    currentParams.set('page', String(newPage));
    setSearchParams(currentParams);
    // Note: fetchAds will be triggered by useEffect watching searchParams
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
              key={JSON.stringify(filters)} // Force remount when filters change from URL
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
                  const category = filters.category ? categories.find(c => c.slug === filters.category) : null;
                  const subcategories = category?.subcategories || category?.subs || [];
                  const subCategory = filters.subCategory && filters.category
                    ? subcategories.find(sub => {
                        const subSlug = sub.slug || sub;
                        return subSlug === filters.subCategory;
                      })
                    : null;
                  const categoryLabel = category?.name || category?.label || filters.category || '';
                  const subCategoryLabel = subCategory?.name || subCategory?.label || filters.subCategory || '';
                  
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
                <h3 style={{ color: '#1a1a1a', marginBottom: '8px' }}>Nu s-au găsit rezultate</h3>
                <p style={{ color: '#666' }}>Încearcă să ajustezi filtrele pentru a vedea mai multe rezultate</p>
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
