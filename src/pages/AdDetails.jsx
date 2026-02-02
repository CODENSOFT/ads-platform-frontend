import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAdById, getCategoryBySlug } from '../api/endpoints';
import { startChat } from '../api/chatApi';
import { useAuth } from '../auth/useAuth.js';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';
import { buildAdShareUrl } from '../utils/shareUrl';
import { capitalizeWords } from '../utils/text';
import '../styles/ad-details.css';

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
  const [categorySchema, setCategorySchema] = useState(null);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getAdById(id);

        const adData = response.data?.ad || response.data?.data || response.data;
        setAd(adData);
      } catch (err) {
        const status = err?.response?.status;
        const message = err?.response?.data?.message || err.message || '';

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

  useEffect(() => {
    if (!ad) {
      setCategorySchema(null);
      return;
    }
    const slug = ad.category?.slug || ad.categorySlug || (typeof ad.category === 'string' ? ad.category : '');
    if (!slug || !String(slug).trim()) {
      setCategorySchema(null);
      return;
    }
    let cancelled = false;
    getCategoryBySlug(slug)
      .then((res) => {
        if (cancelled) return;
        const cat = res?.data?.category ?? res?.data?.data ?? res?.data;
        setCategorySchema(cat?.fields && Array.isArray(cat.fields) ? cat : null);
      })
      .catch(() => {
        if (!cancelled) setCategorySchema(null);
      });
    return () => { cancelled = true; };
  }, [ad]);

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

  const getAdId = () => {
    if (!ad) return null;
    const adId = ad._id || ad.id;
    if (!adId) return null;
    const adIdStr = String(adId).trim();
    if (!adIdStr || adIdStr === 'null' || adIdStr === 'undefined') return null;
    return adIdStr;
  };

  const getReceiverId = () => {
    if (!ad) return null;

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
    if (!user) {
      navigate('/login');
      return;
    }

    const adId = getAdId();
    if (!adId) {
      showError('Ad ID is missing or invalid');
      return;
    }

    const receiverId = getReceiverId();
    if (!receiverId) {
      showError('Seller ID is missing or invalid');
      return;
    }

    const currentUserId = String(user._id || user.id || '').trim();
    if (receiverId === currentUserId) {
      showError("You can't message yourself");
      return;
    }

    if (import.meta.env.DEV) {
      console.log('[CHAT_START_FRONT] sending', { receiverId, adId });
    }

    setContacting(true);
    try {
      const response = await startChat({ receiverId, adId });

      const chatId = response?.chat?._id || response?.data?.chat?._id || response?.data?._id;
      if (chatId) {
        navigate(`/chats/${chatId}`);
      } else {
        showError('Failed to start conversation');
      }
    } catch (err) {
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
      await navigator.clipboard.writeText(shareUrl);
      showSuccess('Link copied to clipboard');
    } catch {
      const userConfirmed = window.confirm(
        `Share URL:\n\n${shareUrl}\n\nClick OK to copy manually.`
      );
      if (userConfirmed) {
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
      <div className="ad-page">
        <div className="ad-container">
          <div className="state-card">
            <p className="state-text">Loading ad details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ad-page">
        <div className="ad-container">
          <div className="state-card text-danger">
            <h2 className="state-title">Error</h2>
            <p className="state-text">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="ad-page">
        <div className="ad-container">
          <div className="state-card">
            <h2 className="state-title">Ad not found</h2>
            <p className="state-text">The ad you're looking for doesn't exist or has been removed.</p>
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
  const isActive = ad?.status === 'active';

  return (
    <div className="ad-page">
      <div className="ad-container">
        <div className="ad-breadcrumb">
          <button type="button" className="ad-back" onClick={() => navigate(-1)}>
            Back
          </button>
          <span className="ad-breadcrumb-sep">/</span>
          <span className="ad-breadcrumb-current">Listing</span>
        </div>

        <div className="ad-layout">
          <section className="ad-gallery-card">
            <div className="ad-gallery-main">
              {mainImage ? (
                <img src={mainImage} alt={ad.title} />
              ) : (
                <div className="ad-gallery-empty">No image</div>
              )}
            </div>

            {hasMultipleImages && (
              <div className="ad-thumbs">
                {images.map((image, index) => (
                  <button
                    type="button"
                    key={index}
                    className={`ad-thumb ${mainImageIndex === index ? 'ad-thumb--active' : ''}`}
                    onClick={() => setMainImageIndex(index)}
                    aria-label={`View image ${index + 1}`}
                    aria-pressed={mainImageIndex === index}
                  >
                    <img src={image} alt={`${ad.title} - Image ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside className="ad-side">
            <div className="ad-side-card">
              <div className="ad-title-row">
                <h1 className="ad-title">{ad.title}</h1>
              </div>

              <div className="ad-price-row">
                <div className="ad-price">
                  {ad.price} {ad.currency}
                </div>
                {ad.status && (
                  <span className={`ad-badge ${isActive ? 'ad-badge--active' : 'ad-badge--muted'}`}>
                    {ad.status}
                  </span>
                )}
              </div>

              <div className="ad-meta">
                {ad.createdAt && (
                  <div className="ad-meta-item">
                    <span>Posted </span>
                    <strong>{formatDate(ad.createdAt)}</strong>
                  </div>
                )}
              </div>

              <div className="ad-divider" />

              <div className="seller-block">
                <div className="seller-title">Seller</div>
                <div className="seller-row">
                  <div className="seller-label">Name</div>
                  <div className="seller-value">{ad.owner?.name || ad.user?.name || '—'}</div>
                </div>
                <div className="seller-row">
                  <div className="seller-label">Email</div>
                  <div className="seller-value">{ad.owner?.email || ad.user?.email || '—'}</div>
                </div>

                <div className="seller-actions">
                  <button
                    type="button"
                    onClick={handleContactSeller}
                    disabled={contacting || !canContact}
                    className="btn btn-primary ad-btn"
                  >
                    {contacting ? 'Starting…' : 'Message seller'}
                  </button>

                  <button type="button" onClick={handleShare} className="btn btn-secondary ad-btn">
                    Share listing
                  </button>

                  {!user && <div className="ad-hint">Sign in to message the seller.</div>}

                  {isSelf && <div className="ad-hint">You can't message yourself.</div>}
                </div>
              </div>
            </div>
          </aside>
        </div>

        {ad.description && (
          <div className="ad-description-card">
            <h2 className="ad-section-title">Description</h2>
            <p className="ad-description">{ad.description}</p>
          </div>
        )}

        {(() => {
          const detailsObj = ad.details && typeof ad.details === 'object' && !Array.isArray(ad.details)
            ? ad.details
            : ad.attributes && typeof ad.attributes === 'object' && !Array.isArray(ad.attributes)
              ? ad.attributes
              : {};
          const fields = categorySchema?.fields || [];
          const rows = fields
            .map((field) => {
              const key = field.key || field.name;
              if (!key) return null;
              const val = detailsObj[key];
              if (val === undefined || val === null || (typeof val === 'string' && !String(val).trim())) return null;
              const label = field.label || capitalizeWords(String(key).replace(/-/g, ' '));
              const displayVal = field.type === 'boolean' ? (val ? 'Yes' : 'No') : String(val);
              const unit = field.unit ? ` ${field.unit}` : '';
              return { label, value: displayVal + unit };
            })
            .filter(Boolean);
          if (rows.length === 0) return null;
          return (
            <div className="ad-specs-card">
              <h2 className="ad-section-title">Details</h2>
              <dl className="ad-specs-list">
                {rows.map((row, idx) => (
                  <div key={idx} className="ad-specs-row">
                    <dt className="ad-specs-label">{row.label}</dt>
                    <dd className="ad-specs-value">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default AdDetails;
