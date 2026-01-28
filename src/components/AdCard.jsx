import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.js';
import { useFavorites } from '../hooks/useFavorites';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';

const AdCard = ({ ad, showFavoriteButton = true }) => {
  const { user, token } = useAuth();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const { success, error: showError } = useToast();
  const coverImage = ad.images && ad.images[0] ? ad.images[0] : null;
  
  const canFavorite = ad?.status === "active";
  const adId = ad._id || ad.id;
  const saved = showFavoriteButton && adId ? isFavorite(adId) : false;
  const isActive = ad?.status === "active";

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Guard: only show favorite button when enabled
    if (!showFavoriteButton) {
      return;
    }

    // Guard: check ad status before calling API - prevent 400 errors
    if (ad?.status !== "active") {
      showError('Only active ads can be added to favorites');
      return;
    }

    if (!user || !adId) {
      if (!user) {
        navigate('/login');
      }
      return;
    }

    // Check token exists before making API call
    if (!token) {
      navigate('/login');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      if (saved) {
        // User clicked "Saved" button - remove favorite
        const result = await removeFavorite(adId);
        success(result.message || 'Removed from favorites');
      } else {
        // User clicked "Save" button - add favorite
        const result = await addFavorite(adId);
        success(result.message || 'Added to favorites');
      }
    } catch (err) {
      const status = err?.response?.status;
      const backend = err?.response?.data;
      const msg = parseError(err);
      
      // Check for NOT_ACTIVE error type
      const isNotActive = 
        status === 400 && backend?.details?.type === "NOT_ACTIVE";
      
      if (isNotActive) {
        // Keep isFavorited false
        showError(backend?.message || msg || 'Only active ads can be added to favorites');
      } else {
        // Show backend error message
        setError(msg);
        showError(msg);
        
        if (status === 401) {
          navigate('/login');
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCardClick = () => {
    navigate(`/ads/${adId}`);
  };

  return (
    <div 
      onClick={handleCardClick} 
      className="card card-hover ad-card" 
      role="button" 
      tabIndex={0}
    >
      <div className="ad-cover">
        {coverImage ? (
          <img src={coverImage} alt={ad.title} loading="lazy" />
        ) : null}
      </div>

      <div className="ad-body">
        <div className="ad-row">
          <h3 className="ad-title">{ad.title}</h3>
          {ad.status && (
            <span className={`badge ${isActive ? 'badge-active' : 'badge-muted'}`}>
              {ad.status}
            </span>
          )}
        </div>

        <div className="ad-row">
          <div className="ad-price">
            {ad.price} {ad.currency}
          </div>
        </div>

        {showFavoriteButton && (
          <div className="ad-actions">
            <button
              type="button"
              onClick={handleFavoriteClick}
              disabled={busy || !canFavorite}
              className={`btn btn-sm ${saved ? 'btn-danger' : 'btn-secondary'}`}
            >
              {busy ? '...' : (saved ? 'Saved' : 'Save')}
            </button>
            {!canFavorite && (
              <span className="t-small t-muted">Inactive ad</span>
            )}
          </div>
        )}

        {error && (
          <div className="t-small text-danger">{error}</div>
        )}
      </div>
    </div>
  );
};

export default AdCard;
