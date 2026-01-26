import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAdById } from '../api/endpoints';
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
    } catch (e) {
      return dateString;
    }
  };

  const handleContactSeller = async () => {
    // If user not logged in -> navigate to login and stop
    if (!user) {
      navigate('/login');
      return;
    }

    // Calculate adId correctly: ad?._id || ad?.id
    const adId = ad?._id || ad?.id;
    
    // Calculate receiverId correctly (seller of the ad)
    const receiverId = ad?.user?._id || ad?.seller?._id || ad?.owner?._id || ad?.createdBy?._id || ad?.userId;

    // Validation: check if adId or receiverId are missing
    if (!adId || !receiverId) {
      console.error("[CHAT_START] Missing adId or receiverId", { adId, receiverId });
      alert("Cannot start chat: invalid ad data");
      return;
    }

    console.log("[CHAT_START]", { adId, receiverId });

    // Get API URL and token
    const envURL = import.meta.env.VITE_API_URL || "http://localhost:5001";
    const API = envURL.endsWith('/api') ? envURL : `${envURL.replace(/\/+$/, '')}/api`;
    const token = localStorage.getItem('token');

    setContacting(true);
    try {
      // Request: POST /api/chats/start with body { adId, receiverId }
      const response = await axios.post(`${API}/chats/start`, {
        adId,
        receiverId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // After OK response from backend: navigate to chat
      const chatId = response.data?.chat?._id || response.data?.data?._id || response.data?._id;
      if (chatId) {
        navigate(`/chats/${chatId}`);
      } else {
        showError('Failed to start conversation');
      }
    } catch (err) {
      const errorMessage = parseError(err);
      showError(errorMessage);
    } finally {
      setContacting(false);
    }
  };

  const handleShare = async () => {
    if (!ad || !id) {
      showError('Unable to share ad. Missing information.');
      return;
    }

    const shareUrl = buildAdShareUrl(id);
    if (!shareUrl) {
      showError('Unable to generate share URL.');
      return;
    }

    try {
      // Try to copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      showSuccess('Link copied to clipboard');
    } catch (err) {
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
        } catch (e) {
          showError('Please copy the URL manually');
        }
        document.body.removeChild(input);
      }
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="container" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '18px', color: '#666' }}>Loading ad details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="container" style={{ maxWidth: '800px' }}>
          <div className="card" style={{
            backgroundColor: '#fff5f5',
            border: '1px solid #fed7d7',
            textAlign: 'center',
            padding: '40px 20px',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ color: '#c53030', marginBottom: '8px' }}>Error</h2>
            <p style={{ color: '#666', fontSize: '16px' }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="page-container">
        <div className="container" style={{ maxWidth: '800px' }}>
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <h2 style={{ color: '#1a1a1a', marginBottom: '8px' }}>Ad not found</h2>
            <p style={{ color: '#666' }}>The ad you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  const images = ad.images && Array.isArray(ad.images) ? ad.images : [];
  const mainImage = images[mainImageIndex] || null;
  const hasMultipleImages = images.length > 1;

  return (
    <div className="page-container">
      <div className="container" style={{ maxWidth: '1000px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
          {/* Left Column - Images */}
          <div>
            {images.length > 0 ? (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {mainImage && (
                  <div style={{ 
                    width: '100%', 
                    aspectRatio: '1',
                    backgroundColor: '#f8f9fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: hasMultipleImages ? '16px' : 0,
                  }}>
                    <img
                      src={mainImage}
                      alt={ad.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  </div>
                )}
                {hasMultipleImages && (
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    flexWrap: 'wrap',
                    padding: '16px',
                  }}>
                    {images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${ad.title} - Image ${index + 1}`}
                        onClick={() => setMainImageIndex(index)}
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: mainImageIndex === index ? '3px solid #007bff' : '2px solid #e0e0e0',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          opacity: mainImageIndex === index ? 1 : 0.7,
                        }}
                        onMouseEnter={(e) => {
                          if (mainImageIndex !== index) e.currentTarget.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                          if (mainImageIndex !== index) e.currentTarget.style.opacity = '0.7';
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="card" style={{
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8f9fa',
                color: '#999',
              }}>
                No image available
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ 
                fontSize: '2rem', 
                fontWeight: '700', 
                color: '#1a1a1a',
                marginBottom: '16px',
                lineHeight: '1.2',
              }}>
                {ad.title}
              </h1>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px',
                marginBottom: '24px',
                flexWrap: 'wrap',
              }}>
                <div>
                  <div style={{ 
                    fontSize: '2rem', 
                    fontWeight: '700',
                    color: '#007bff',
                  }}>
                    {ad.price} {ad.currency}
                  </div>
                </div>
                {ad.status && (
                  <div style={{
                    display: 'inline-block',
                    padding: '6px 14px',
                    backgroundColor: ad.status === 'active' ? '#d4edda' : ad.status === 'sold' ? '#f8d7da' : '#e2e3e5',
                    color: ad.status === 'active' ? '#155724' : ad.status === 'sold' ? '#721c24' : '#383d41',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                  }}>
                    {ad.status}
                  </div>
                )}
              </div>
            </div>

            {/* Seller Information Card */}
            {(ad.owner || ad.user) && (
              <div className="card" style={{ marginBottom: '24px' }}>
                <h3 style={{ 
                  marginBottom: '16px', 
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1a1a1a',
                }}>
                  Seller Information
                </h3>
                {(ad.owner?.name || ad.user?.name) && (
                  <div style={{ marginBottom: '12px', fontSize: '15px' }}>
                    <span style={{ color: '#666', fontWeight: '500' }}>Name: </span>
                    <span style={{ color: '#1a1a1a', fontWeight: '500' }}>
                      {ad.owner?.name || ad.user?.name}
                    </span>
                  </div>
                )}
                {(ad.owner?.email || ad.user?.email) && (
                  <div style={{ marginBottom: '20px', fontSize: '15px' }}>
                    <span style={{ color: '#666', fontWeight: '500' }}>Email: </span>
                    <span style={{ color: '#1a1a1a' }}>
                      {ad.owner?.email || ad.user?.email}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleContactSeller}
                    disabled={contacting || !ad || !(ad?._id || ad?.id) || !(ad?.user?._id || ad?.seller?._id || ad?.owner?._id || ad?.createdBy?._id || ad?.userId)}
                    className="btn-primary"
                    style={{
                      flex: 1,
                      padding: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      opacity: (contacting || !ad || !(ad?._id || ad?.id) || !(ad?.user?._id || ad?.seller?._id || ad?.owner?._id || ad?.createdBy?._id || ad?.userId)) ? 0.6 : 1,
                      cursor: (contacting || !ad || !(ad?._id || ad?.id) || !(ad?.user?._id || ad?.seller?._id || ad?.owner?._id || ad?.createdBy?._id || ad?.userId)) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {contacting ? 'Starting conversation...' : '💬 Contact Seller'}
                  </button>
                  <button
                    onClick={handleShare}
                    className="btn-secondary"
                    style={{
                      padding: '12px 20px',
                      fontSize: '16px',
                      fontWeight: '600',
                    }}
                    title="Share this ad"
                  >
                    📤 Share
                  </button>
                </div>
              </div>
            )}

            {/* Posted Date */}
            {ad.createdAt && (
              <div className="card" style={{
                backgroundColor: '#f8f9fa',
                padding: '16px',
              }}>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  <strong>Posted:</strong> {formatDate(ad.createdAt)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {ad.description && (
          <div className="card">
            <h2 style={{ 
              marginBottom: '16px', 
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1a1a1a',
            }}>
              Description
            </h2>
            <p style={{ 
              whiteSpace: 'pre-wrap', 
              lineHeight: '1.8',
              fontSize: '16px',
              color: '#333',
              margin: 0,
            }}>
              {ad.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdDetails;
