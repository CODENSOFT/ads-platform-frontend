import { useFavorites } from '../hooks/useFavorites';
import AdCard from '../components/AdCard';

const Favorites = () => {
  const { favorites, loadFavorites, loading } = useFavorites();

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
              ❤️ My Favorites
            </h1>
            <p style={{ 
              fontSize: '1.1rem', 
              color: '#666',
              margin: 0,
            }}>
              {favorites.length > 0 
                ? `${favorites.length} ${favorites.length === 1 ? 'ad saved' : 'ads saved'}`
                : 'Your saved ads will appear here'
              }
            </p>
          </div>
          <button
            onClick={loadFavorites}
            disabled={loading}
            className="btn-secondary"
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
        </div>

        {loading && favorites.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            color: '#666',
            fontSize: '18px',
          }}>
            Loading favorites...
          </div>
        ) : favorites.length === 0 ? (
          <div className="card" style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❤️</div>
            <h3 style={{ 
              color: '#1a1a1a', 
              marginBottom: '8px',
              fontSize: '1.5rem',
              fontWeight: '600',
            }}>
              No favorites yet
            </h3>
            <p style={{ color: '#666', fontSize: '16px' }}>
              Start saving ads you like to see them here
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '32px',
          }}>
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
