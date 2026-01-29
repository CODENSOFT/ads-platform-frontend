import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import AdCard from '../components/AdCard';
import '../styles/favorites.css';

const Favorites = () => {
  const navigate = useNavigate();
  const { favorites, loadFavorites, loading } = useFavorites();

  const subtitle =
    favorites.length > 0
      ? `${favorites.length} saved listing(s)`
      : 'Your saved listings will appear here';

  return (
    <div className="page">
      <div className="container">
        <header className="fav-header">
          <div>
            <h1 className="fav-title">My Favorites</h1>
            <p className="fav-subtitle">{subtitle}</p>
            <div className="fav-pills">
              <span className="fav-pill">Saved: {favorites.length}</span>
              <span className="fav-pill">Updated: Live</span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadFavorites}
            disabled={loading}
            aria-label="Refresh favorites"
          >
            <span aria-hidden="true">↻</span>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </header>

        {loading && favorites.length === 0 ? (
          <div className="fav-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="fav-skeleton-card" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="fav-empty card">
            <div className="fav-empty-icon" aria-hidden="true">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <h2 className="fav-empty-title">No favorites yet</h2>
            <p className="fav-empty-text">
              Save listings to access them anytime from this page.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/ads')}
              aria-label="Browse listings"
            >
              Browse listings
            </button>
          </div>
        ) : (
          <div className="fav-grid">
            {favorites.map((ad) => (
              <AdCard
                key={ad._id || ad.id}
                ad={ad}
                showFavoriteButton={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
