import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
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
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '16px',
        margin: '8px',
        maxWidth: '300px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        cursor: 'pointer',
      }}
    >
      {coverImage && (
        <img
          src={coverImage}
          alt={ad.title}
          style={{
            width: '100%',
            height: '200px',
            objectFit: 'cover',
            borderRadius: '4px',
            marginBottom: '12px',
          }}
        />
      )}
      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{ad.title}</h3>
      <div style={{ marginBottom: '8px' }}>
        <strong style={{ fontSize: '20px' }}>
          {ad.price} {ad.currency}
        </strong>
      </div>
      {ad.status && (
        <div style={{
          display: 'inline-block',
          padding: '4px 8px',
          backgroundColor: '#f0f0f0',
          borderRadius: '4px',
          fontSize: '12px',
          marginBottom: '12px',
        }}>
          {ad.status}
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/ads/${adId}`);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              flex: 1,
              cursor: 'pointer',
            }}
          >
            View Details
          </button>
          {showFavoriteButton && (
            <button
              onClick={handleFavoriteClick}
              disabled={busy || !canFavorite}
              style={{
                padding: '8px 16px',
                backgroundColor: saved ? '#dc3545' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: (busy || !canFavorite) ? 'not-allowed' : 'pointer',
                opacity: (busy || !canFavorite) ? 0.6 : 1,
              }}
            >
              {busy ? '...' : (saved ? '❤️ Saved' : '❤️ Save')}
            </button>
          )}
        </div>
        {showFavoriteButton && !canFavorite && (
          <div style={{
            color: '#666',
            fontSize: '12px',
            marginTop: '4px',
          }}>
            Activate ad to save
          </div>
        )}
        {showFavoriteButton && error && (
          <div style={{
            color: 'red',
            fontSize: '12px',
            marginTop: '4px',
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdCard;
