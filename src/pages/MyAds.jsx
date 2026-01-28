import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyAds, updateAdStatus, deleteAd } from '../api/endpoints';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';

const MyAds = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ads, setAds] = useState([]);
  const [loadingById, setLoadingById] = useState({});
  const [errorById, setErrorById] = useState({});
  const [validationErrorsById, setValidationErrorsById] = useState({});

  // Helper: Set loading state for a specific ad
  const setAdLoading = useCallback((adId, isLoading) => {
    setLoadingById((prev) => ({
      ...prev,
      [adId]: isLoading,
    }));
  }, []);

  // Helper: Set error for a specific ad
  const setAdError = useCallback((adId, message) => {
    setErrorById((prev) => {
      if (message === null) {
        const updated = { ...prev };
        delete updated[adId];
        return updated;
      }
      return { ...prev, [adId]: message };
    });
  }, []);


  // Fetch ads from API
  const fetchMyAds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMyAds();
      
      // Extract list exactly from res.data.ads
      const adsArray = response.data?.ads || [];
      setAds(Array.isArray(adsArray) ? adsArray : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load your ads');
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyAds();
  }, [fetchMyAds]);

  const handleStatusUpdate = async (adId, newStatus) => {
    // Clear any previous error for this ad
    setAdError(adId, null);
    
    // Set loading state
    setAdLoading(adId, true);

    try {
      await updateAdStatus(adId, newStatus);
      
      // Refetch my ads from backend as source of truth
      await fetchMyAds();
      
      // Clear error on success
      setAdError(adId, null);
      const statusMessages = {
        active: 'Ad published',
        sold: 'Ad marked as sold',
        draft: 'Ad status updated',
      };
      success(statusMessages[newStatus] || 'Status updated');
    } catch (err) {
      const errorMsg = parseError(err);
      setAdError(adId, errorMsg);
      showError(errorMsg);
    } finally {
      // Set loading false
      setAdLoading(adId, false);
    }
  };

  const handleEditClick = (ad) => {
    const adId = ad._id || ad.id;
    if (!adId) return;
    navigate(`/edit/${adId}`);
  };

  const validateEditForm = (adId, formData) => {
    const errors = {};

    // Title: required, min 3 chars
    const titleTrimmed = formData.title?.trim() || '';
    if (!titleTrimmed) {
      errors.title = 'Title is required';
    } else if (titleTrimmed.length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }

    // Description: required, min 20 chars
    const descriptionTrimmed = formData.description?.trim() || '';
    if (!descriptionTrimmed) {
      errors.description = 'Description is required';
    } else if (descriptionTrimmed.length < 20) {
      errors.description = 'Description must be at least 20 characters';
    }

    // Price: must be a finite number > 0
    const priceNum = Number(formData.price);
    if (!formData.price || !isFinite(priceNum) || priceNum <= 0) {
      errors.price = 'Price must be a number greater than 0';
    }

    // Currency: must be one of ["EUR","USD","MDL"]
    const validCurrencies = ['EUR', 'USD', 'MDL'];
    if (!formData.currency || !validCurrencies.includes(formData.currency)) {
      errors.currency = 'Currency must be EUR, USD, or MDL';
    }

    setValidationErrorsById((prev) => ({
      ...prev,
      [adId]: errors,
    }));

    return Object.keys(errors).length === 0;
  };

  const handleDelete = async (adId) => {
    // Show confirmation dialog
    if (!window.confirm('Delete this ad?')) {
      return;
    }

    // Clear any previous error for this ad
    setAdError(adId, null);
    
    // Set loading state
    setAdLoading(adId, true);

    try {
      await deleteAd(adId);
      
      // Refetch my ads from backend as source of truth
      await fetchMyAds();
      
      setValidationErrorsById((prev) => {
        const updated = { ...prev };
        delete updated[adId];
        return updated;
      });
      setAdError(adId, null);
      success('Ad deleted');
    } catch (err) {
      const errorMsg = parseError(err);
      setAdError(adId, errorMsg);
      showError(errorMsg);
    } finally {
      // Set loading false
      setAdLoading(adId, false);
    }
  };

  // Calculate counts
  const total = ads.length;
  const draftCount = ads.filter((ad) => ad.status === 'draft').length;
  const activeCount = ads.filter((ad) => ad.status === 'active').length;

  return (
    <div className="page-container">
      <div className="container">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              color: '#1a1a1a',
              marginBottom: '8px',
            }}>
              📋 My Ads
            </h1>
            {!loading && ads.length > 0 && (
              <p style={{ 
                fontSize: '1.1rem', 
                color: '#666',
                margin: 0,
              }}>
                Manage your ads and track their status
              </p>
            )}
          </div>
          {!loading && (
            <button
              onClick={fetchMyAds}
              disabled={loading}
              className="btn-secondary"
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              {loading ? 'Reloading...' : '🔄 Refresh'}
            </button>
          )}
        </div>

        {loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            color: '#666',
            fontSize: '18px',
          }}>
            Loading your ads...
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
              fontSize: '16px',
              fontWeight: '500',
            }}>
              {error}
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {ads.length === 0 ? (
              <div className="card" style={{ 
                textAlign: 'center', 
                padding: '60px 20px',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                <h3 style={{ 
                  color: '#1a1a1a', 
                  marginBottom: '8px',
                  fontSize: '1.5rem',
                  fontWeight: '600',
                }}>
                  No ads yet
                </h3>
                <p style={{ color: '#666', fontSize: '16px', marginBottom: '24px' }}>
                  Create your first ad to get started
                </p>
                <a
                  href="/#/create"
                  className="btn-primary"
                  style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: '600',
                    textDecoration: 'none',
                  }}
                >
                  ➕ Create Ad
                </a>
              </div>
            ) : (
              <>
                <div className="card" style={{ 
                  marginBottom: '24px',
                  padding: '20px',
                }}>
                  <div style={{ 
                    display: 'flex', 
                    gap: '32px', 
                    flexWrap: 'wrap',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <span style={{ color: '#666', fontSize: '14px', fontWeight: '500' }}>Total:</span>
                      <span style={{ 
                        fontSize: '20px', 
                        fontWeight: '700',
                        color: '#1a1a1a',
                      }}>
                        {total}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <span style={{ color: '#666', fontSize: '14px', fontWeight: '500' }}>Draft:</span>
                      <span style={{ 
                        fontSize: '20px', 
                        fontWeight: '700',
                        color: '#6c757d',
                      }}>
                        {draftCount}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <span style={{ color: '#666', fontSize: '14px', fontWeight: '500' }}>Active:</span>
                      <span style={{ 
                        fontSize: '20px', 
                        fontWeight: '700',
                        color: '#28a745',
                      }}>
                        {activeCount}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '24px',
                  marginBottom: '32px',
                }}>
                {ads.map((ad) => {
                  const adId = ad._id || ad.id;
                  const isUpdating = loadingById[adId] || false;
                  const adError = errorById[adId];
                  const isEditing = false;
                  const editFormData = {};
                  const validationErrors = {};
                  const coverImage = ad.images && ad.images[0] ? ad.images[0] : null;
                  const canEdit = ad.status === 'draft' || ad.status === 'active';

                  return (
                    <div
                      key={adId}
                      className="card"
                      style={{
                        padding: 0,
                        overflow: 'hidden',
                      }}
                    >
                      {!isEditing ? (
                        <>
                          {coverImage && (
                            <div style={{
                              width: '100%',
                              aspectRatio: '16/9',
                              overflow: 'hidden',
                              backgroundColor: '#f8f9fa',
                            }}>
                              <img
                                src={coverImage}
                                alt={ad.title}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                            </div>
                          )}
                          <div style={{ padding: '16px' }}>
                            <h3 style={{ 
                              margin: '0 0 12px 0', 
                              fontSize: '18px',
                              fontWeight: '600',
                              color: '#1a1a1a',
                              lineHeight: '1.3',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}>
                              {ad.title}
                            </h3>
                            <div style={{ 
                              marginBottom: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              flexWrap: 'wrap',
                            }}>
                              <div style={{ 
                                fontSize: '22px', 
                                fontWeight: '700',
                                color: '#007bff',
                              }}>
                                {ad.price} {ad.currency}
                              </div>
                              {ad.status && (
                                <div style={{
                                  display: 'inline-block',
                                  padding: '4px 10px',
                                  backgroundColor: ad.status === 'active' ? '#d4edda' : ad.status === 'sold' ? '#f8d7da' : ad.status === 'draft' ? '#e2e3e5' : '#e2e3e5',
                                  color: ad.status === 'active' ? '#155724' : ad.status === 'sold' ? '#721c24' : '#383d41',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  textTransform: 'uppercase',
                                }}>
                                  {ad.status}
                                </div>
                              )}
                            </div>
                            {ad.description && (
                              <div style={{ 
                                marginBottom: '16px', 
                                fontSize: '14px', 
                                color: '#666',
                                lineHeight: '1.5',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}>
                                {ad.description}
                              </div>
                            )}
                            <div style={{ 
                              marginTop: '16px', 
                              display: 'flex', 
                              gap: '8px', 
                              flexWrap: 'wrap' 
                            }}>
                            {canEdit && (
                              <button
                                onClick={() => handleEditClick(ad)}
                                disabled={isUpdating}
                                className="btn-primary"
                                style={{
                                  flex: 1,
                                  padding: '10px',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  opacity: isUpdating ? 0.6 : 1,
                                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                                }}
                              >
                                ✏️ Edit
                              </button>
                            )}
                            {ad.status === 'draft' && (
                              <button
                                onClick={() => handleStatusUpdate(adId, 'active')}
                                disabled={isUpdating}
                                className="btn-success"
                                style={{
                                  flex: 1,
                                  padding: '10px',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  opacity: isUpdating ? 0.6 : 1,
                                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                                }}
                              >
                                {isUpdating ? 'Publishing...' : '📢 Publish'}
                              </button>
                            )}
                            {ad.status === 'active' && (
                              <button
                                onClick={() => handleStatusUpdate(adId, 'sold')}
                                disabled={isUpdating}
                                style={{
                                  flex: 1,
                                  padding: '10px',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  backgroundColor: isUpdating ? '#ccc' : '#ffc107',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  opacity: isUpdating ? 0.6 : 1,
                                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                                }}
                              >
                                {isUpdating ? 'Updating...' : '✅ Mark sold'}
                              </button>
                            )}
                            {ad.status === 'sold' && (
                              <div style={{ 
                                flex: 1,
                                padding: '10px',
                                fontSize: '14px',
                                color: '#666',
                                textAlign: 'center',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '6px',
                              }}>
                                ✓ Sold
                              </div>
                            )}
                            {(ad.status === 'draft' || ad.status === 'active' || ad.status === 'sold') && (
                              <button
                                onClick={() => handleDelete(adId)}
                                disabled={isUpdating}
                                className="btn-danger"
                                style={{
                                  flex: 1,
                                  padding: '10px',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  opacity: isUpdating ? 0.6 : 1,
                                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                                }}
                              >
                                {isUpdating ? 'Deleting...' : '🗑️ Delete'}
                              </button>
                            )}
                            </div>
                            {adError && (
                              <div style={{
                                color: '#c53030',
                                fontSize: '12px',
                                marginTop: '12px',
                                padding: '8px',
                                backgroundColor: '#fff5f5',
                                borderRadius: '6px',
                                border: '1px solid #fed7d7',
                                whiteSpace: 'pre-line',
                              }}>
                                {adError}
                              </div>
                            )}
                          </div>
                        </>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
      </div>
    </div>
  );
};

export default MyAds;
