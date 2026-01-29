import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyAds, updateAdStatus, deleteAd } from '../api/endpoints';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';
import '../styles/my-ads.css';

const MyAds = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ads, setAds] = useState([]);
  const [loadingById, setLoadingById] = useState({});
  const [errorById, setErrorById] = useState({});
  const [validationErrorsById, setValidationErrorsById] = useState({});

  const setAdLoading = useCallback((adId, isLoading) => {
    setLoadingById((prev) => ({
      ...prev,
      [adId]: isLoading,
    }));
  }, []);

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

  const fetchMyAds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMyAds();
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
    setAdError(adId, null);
    setAdLoading(adId, true);

    try {
      await updateAdStatus(adId, newStatus);
      await fetchMyAds();
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

    const titleTrimmed = formData.title?.trim() || '';
    if (!titleTrimmed) {
      errors.title = 'Title is required';
    } else if (titleTrimmed.length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }

    const descriptionTrimmed = formData.description?.trim() || '';
    if (!descriptionTrimmed) {
      errors.description = 'Description is required';
    } else if (descriptionTrimmed.length < 20) {
      errors.description = 'Description must be at least 20 characters';
    }

    const priceNum = Number(formData.price);
    if (!formData.price || !isFinite(priceNum) || priceNum <= 0) {
      errors.price = 'Price must be a number greater than 0';
    }

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
    if (!window.confirm('Delete this ad?')) {
      return;
    }

    setAdError(adId, null);
    setAdLoading(adId, true);

    try {
      await deleteAd(adId);
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
      setAdLoading(adId, false);
    }
  };

  const total = ads.length;
  const draftCount = ads.filter((ad) => ad.status === 'draft').length;
  const activeCount = ads.filter((ad) => ad.status === 'active').length;

  const getStatusBadgeClass = (status) => {
    if (status === 'active') return 'badge badge--active';
    if (status === 'sold') return 'badge badge--sold';
    return 'badge badge--draft';
  };

  return (
    <div className="page">
      <div className="container">
        <header className="page-header page-header--row">
          <div>
            <h1 className="page-header__title">My Ads</h1>
            <p className="page-header__subtitle">
              Manage your ads and track their status
            </p>
          </div>
          <div className="page-header__actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={fetchMyAds}
              disabled={loading}
              aria-label="Refresh"
            >
              {loading ? 'Reloading…' : 'Refresh'}
            </button>
          </div>
        </header>

        {loading && (
          <div className="card card--pad text-center py-6">
            <div className="t-body t-muted">Loading your ads...</div>
          </div>
        )}

        {error && (
          <div className="alert alert--danger" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {ads.length === 0 ? (
              <div className="myads-empty card">
                <div className="myads-empty__icon" aria-hidden="true">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                </div>
                <h2 className="myads-empty__title">No ads yet</h2>
                <p className="myads-empty__text">
                  Create your first ad to get started
                </p>
                <a href="/#/create" className="btn btn-primary myads-empty__cta">
                  Create Ad
                </a>
              </div>
            ) : (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-card__label">Total</div>
                    <div className="stat-card__value">{total}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card__label">Draft</div>
                    <div className={`stat-card__value ${draftCount === 0 ? 'stat-card__value--muted' : ''}`}>
                      {draftCount}
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card__label">Active</div>
                    <div className={`stat-card__value ${activeCount > 0 ? 'stat-card__value--success' : 'stat-card__value--muted'}`}>
                      {activeCount}
                    </div>
                  </div>
                </div>

                <div className="ads-grid">
                  {ads.map((ad) => {
                    const adId = ad._id || ad.id;
                    const isUpdating = loadingById[adId] || false;
                    const adError = errorById[adId];
                    const coverImage = ad.images && ad.images[0] ? ad.images[0] : null;
                    const canEdit = ad.status === 'draft' || ad.status === 'active';

                    return (
                      <article key={adId} className="ad-manage-card card">
                        <div className="ad-manage-card__media">
                          {coverImage ? (
                            <img src={coverImage} alt={ad.title || 'Ad'} />
                          ) : (
                            <div className="ad-manage-card__media-placeholder" aria-hidden="true">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="ad-manage-card__body">
                          <h3 className="ad-manage-card__title">{ad.title}</h3>
                          <div className="ad-manage-card__meta">
                            <span className="price">
                              {ad.price} {ad.currency}
                            </span>
                            {ad.status && (
                              <span className={getStatusBadgeClass(ad.status)}>
                                {ad.status}
                              </span>
                            )}
                          </div>
                          {ad.description && (
                            <p className="desc">{ad.description}</p>
                          )}
                        </div>
                        <div className="ad-manage-card__actions">
                          {canEdit && (
                            <button
                              type="button"
                              className="btn btn-primary-outline"
                              onClick={() => handleEditClick(ad)}
                              disabled={isUpdating}
                            >
                              Edit
                            </button>
                          )}
                          {ad.status === 'draft' && (
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => handleStatusUpdate(adId, 'active')}
                              disabled={isUpdating}
                            >
                              {isUpdating ? 'Publishing…' : 'Publish'}
                            </button>
                          )}
                          {ad.status === 'active' && (
                            <button
                              type="button"
                              className="btn btn-warning"
                              onClick={() => handleStatusUpdate(adId, 'sold')}
                              disabled={isUpdating}
                            >
                              {isUpdating ? 'Updating…' : 'Mark sold'}
                            </button>
                          )}
                          {ad.status === 'sold' && (
                            <span className="ad-manage-card__sold-label">Sold</span>
                          )}
                          {(ad.status === 'draft' || ad.status === 'active' || ad.status === 'sold') && (
                            <button
                              type="button"
                              className="btn btn-danger-outline"
                              onClick={() => handleDelete(adId)}
                              disabled={isUpdating}
                            >
                              {isUpdating ? 'Deleting…' : 'Delete'}
                            </button>
                          )}
                        </div>
                        {adError && (
                          <div className="alert alert--danger alert--sm" role="alert">
                            {adError}
                          </div>
                        )}
                      </article>
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
