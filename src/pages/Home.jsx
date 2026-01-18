import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getAds } from '../api/endpoints';
import AdCard from '../components/AdCard';
import FiltersBar from '../components/FiltersBar';

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
      setAds(Array.isArray(adsArray) ? adsArray : []);
      
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
    
    fetchAds(params, newPage, pagination.limit);
  };

  return (
    <div>
      <h1>Ads</h1>
      {user ? (
        <div>
          <p>Logged in as {user.email}</p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <Link
              to="/create"
              style={{
                padding: '6px 12px',
                backgroundColor: '#007bff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              Create Ad
            </Link>
            <Link
              to="/my-ads"
              style={{
                padding: '6px 12px',
                backgroundColor: '#17a2b8',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              My Ads
            </Link>
            <Link
              to="/favorites"
              style={{
                padding: '6px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              Favorites
            </Link>
            <button onClick={logout}>Logout</button>
          </div>
        </div>
      ) : (
        <div>
          <p>
            <Link to="/login">Login</Link> | <Link to="/register">Register</Link>
          </p>
        </div>
      )}

      {loading && <div>Loading...</div>}
      
      {error && (
        <div>
          <div style={{ color: 'red', marginBottom: '8px' }}>{error}</div>
          <button
            onClick={() => fetchAds({}, pagination.page, pagination.limit)}
            disabled={loading}
            style={{
              padding: '6px 12px',
              backgroundColor: loading ? '#ccc' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <p style={{ margin: 0 }}>Results: {pagination.total || ads.length}</p>
            <p style={{ margin: 0 }}>Page {pagination.page} / {pagination.pages}</p>
            <button
              onClick={() => fetchAds({}, pagination.page, pagination.limit)}
              disabled={loading}
              style={{
                padding: '6px 12px',
                backgroundColor: loading ? '#ccc' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          {Array.isArray(ads) && ads.length === 0 ? (
            <div>No ads found</div>
          ) : Array.isArray(ads) ? (
            <>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                marginTop: '20px',
              }}>
                {ads.map((ad) => (
                  <AdCard key={ad._id} ad={ad} showFavoriteButton={true} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'center', alignItems: 'center' }}>
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev || loading}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: !pagination.hasPrev || loading ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: !pagination.hasPrev || loading ? 'not-allowed' : 'pointer',
                    opacity: !pagination.hasPrev || loading ? 0.6 : 1,
                  }}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext || loading}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: !pagination.hasNext || loading ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: !pagination.hasNext || loading ? 'not-allowed' : 'pointer',
                    opacity: !pagination.hasNext || loading ? 0.6 : 1,
                  }}
                >
                  Next
                </button>
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
};

export default Home;
