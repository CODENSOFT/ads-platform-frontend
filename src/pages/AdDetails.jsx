import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAdById } from '../api/endpoints';
import { startChat } from '../api/chatApi';
import { useAuth } from '../auth/useAuth.js';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';
import { buildAdShareUrl } from '../utils/shareUrl';

const AdDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ad, setAd] = useState(null);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getAdById(id);
        
        // Handle different response structures
        const adData = response.data?.ad || response.data?.data || response.data;
        setAd(adData);
      } catch (err) {
        const status = err?.response?.status;
        const message = err?.response?.data?.message || err.message || '';
        
        // Check for 404 or "not found" message
        if (status === 404 || message.toLowerCase().includes('not found')) {
          setError('Ad not found');
        } else {
          setError(message || 'Failed to load ad');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAd();
    }
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Derive adId strictly from ad._id || ad.id
  const getAdId = () => {
    if (!ad) return null;
    const adId = ad._id || ad.id;
    if (!adId) return null;
    const adIdStr = String(adId).trim();
    if (!adIdStr || adIdStr === 'null' || adIdStr === 'undefined') return null;
    return adIdStr;
  };

  // Derive receiverId from multiple possible fields
  const getReceiverId = () => {
    if (!ad) return null;
    
    // Try all possible seller/owner fields
    const receiverId = 
      ad.user?._id ||
      ad.owner?._id ||
      ad.seller?._id ||
      ad.createdBy?._id ||
      ad.userId ||
      ad.ownerId ||
      ad.sellerId ||
      ad.createdById;
    
    if (!receiverId) return null;
    const receiverIdStr = String(receiverId).trim();
    if (!receiverIdStr || receiverIdStr === 'null' || receiverIdStr === 'undefined') return null;
    return receiverIdStr;
  };

  const handleContactSeller = async () => {
    // If user not logged in -> navigate to login and stop
    if (!user) {
      navigate('/login');
      return;
    }

    // CRITICAL: Validate adId before proceeding
    const adId = getAdId();
    if (!adId) {
      showError('Ad ID is missing or invalid');
      return;
    }

    // CRITICAL: Validate receiverId before proceeding
    const receiverId = getReceiverId();
    if (!receiverId) {
      showError('Seller ID is missing or invalid');
      return;
    }

    // CRITICAL: Prevent self-messaging
    const currentUserId = String(user._id || user.id || '').trim();
    if (receiverId === currentUserId) {
      showError("You can't message yourself");
      return;
    }

    // Dev-only log showing what is being sent
    if (import.meta.env.DEV) {
      console.log('[CHAT_START_FRONT] sending', { receiverId, adId });
    }

    setContacting(true);
    try {
      // Call startChat with both receiverId and adId (strings trimmed)
      const response = await startChat({ receiverId, adId });
      
      // Extract chatId robustly from response
      const chatId = response?.chat?._id || response?.data?.chat?._id || response?.data?._id;
      if (chatId) {
        navigate(`/chats/${chatId}`);
      } else {
        showError('Failed to start conversation');
      }
    } catch (err) {
      // Error is already logged in chatApi, just show user-friendly message
      const errorMessage = err.responseData?.message || err.message || parseError(err);
      showError(errorMessage);
    } finally {
      setContacting(false);
    }
  };

  const handleShare = async () => {
    const adId = getAdId();
    if (!adId) {
      showError('Unable to share ad. Missing information.');
      return;
    }

    const shareUrl = buildAdShareUrl(adId);
    if (!shareUrl) {
      showError('Unable to generate share URL.');
      return;
    }

    try {
      // Try to copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      showSuccess('Link copied to clipboard');
    } catch {
      // Fallback: show prompt with URL
      const userConfirmed = window.confirm(
        `Share URL:\n\n${shareUrl}\n\nClick OK to copy manually.`
      );
      if (userConfirmed) {
        // Try to select the text in a temporary input
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        try {
          document.execCommand('copy');
          showSuccess('Link copied');
        } catch {
          showError('Please copy the URL manually');
        }
        document.body.removeChild(input);
      }
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <div className="card card--pad text-center py-6">
            <div className="t-body t-muted">Loading ad details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="container">
          <div className="card card--pad text-center py-6">
            <h2 className="t-h2 text-danger mb-2">Error</h2>
            <p className="t-body t-muted">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="page">
        <div className="container">
          <div className="card card--pad text-center py-6">
            <h2 className="t-h2 mb-2">Ad not found</h2>
            <p className="t-body t-muted">The ad you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  const images = ad.images && Array.isArray(ad.images) ? ad.images : [];
  const mainImage = images[mainImageIndex] || null;
  const hasMultipleImages = images.length > 1;
  const receiverId = getReceiverId();
  const currentUserId = user ? String(user._id || user.id || '').trim() : '';
  const isSelf = receiverId === currentUserId;
  const canContact = user && receiverId && !isSelf;
  const isActive = ad?.status === "active";

  return (
    <div className="page">
      <div className="container">
        <div className="ad-details-layout">
          {/* Left Column - Images */}
          <div>
            {images.length > 0 ? (
              <div className="card">
                <div className="ad-gallery">
                  {mainImage && (
                    <div className="ad-gallery__main">
                      <img src={mainImage} alt={ad.title} />
                    </div>
                  )}
                  {hasMultipleImages && (
                    <div className="ad-gallery__thumbnails">
                      {images.map((image, index) => (
                        <div
                          key={index}
                          className={`ad-gallery__thumb ${mainImageIndex === index ? 'ad-gallery__thumb--active' : ''}`}
                          onClick={() => setMainImageIndex(index)}
                        >
                          <img src={image} alt={`${ad.title} - Image ${index + 1}`} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card ad-gallery__main">
                <div className="t-body t-muted">No image available</div>
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div>
            <div className="card card--pad mb-6">
              <h1 className="t-h1 mb-4">{ad.title}</h1>
              
              <div className="flex items-center gap-4 mb-6 flex-wrap">
                <div className="ad-price">
                  {ad.price} {ad.currency}
                </div>
                {ad.status && (
                  <span className={`badge ${isActive ? 'badge-active' : 'badge-muted'}`}>
                    {ad.status}
                  </span>
                )}
              </div>

            </div>

            {/* Seller Information Card */}
            {(ad.owner || ad.user) && (
              <div className="card card--pad mb-6">
                <h3 className="t-h3 mb-4">Seller Information</h3>
                  {(ad.owner?.name || ad.user?.name) && (
                    <div className="t-body mb-3">
                      <span className="t-muted">Name: </span>
                      <span className="t-bold">{ad.owner?.name || ad.user?.name}</span>
                    </div>
                  )}
                  {(ad.owner?.email || ad.user?.email) && (
                    <div className="t-body mb-6">
                      <span className="t-muted">Email: </span>
                      <span>{ad.owner?.email || ad.user?.email}</span>
                    </div>
                  )}
                  <div className="flex gap-3 flex-col">
                    <button
                      onClick={handleContactSeller}
                      disabled={contacting || !canContact}
                      className="btn btn-primary"
                    >
                      {contacting ? 'Starting conversation...' : 'Contact Seller'}
                    </button>
                    <button
                      onClick={handleShare}
                      className="btn btn-secondary"
                    >
                      Share
                    </button>
                  </div>
              </div>
            )}

            {/* Posted Date */}
            {ad.createdAt && (
              <div className="card card--pad">
                <div className="t-small t-muted">
                  <span className="t-bold">Posted:</span> {formatDate(ad.createdAt)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {ad.description && (
          <div className="card card--pad">
            <h2 className="t-h2 mb-4">Description</h2>
            <p className="t-body" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
              {ad.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdDetails;
