import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext.js';
import { getFavorites, addFavorite as addFavoriteAPI, removeFavorite as removeFavoriteAPI } from '../api/endpoints';
import { FavoritesContext } from './FavoritesContext';

export const FavoritesProvider = ({ children }) => {
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [favorites, setFavorites] = useState([]); // Full ad objects for Favorites page
  const [loading, setLoading] = useState(false);
  const { token, user } = useAuth();

  // Load favorites from backend (source of truth)
  const loadFavorites = useCallback(async () => {
    if (!token) {
      setFavoriteIds(new Set());
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getFavorites();
      const data = response.data;
      
      let idsSet = new Set();
      let favoritesArray = [];
      
      // Handle format A: { success:true, favorites:[{_id:...}, ...] }
      if (data?.success && Array.isArray(data.favorites)) {
        const favs = data.favorites;
        // Check if array contains objects or just IDs
        if (favs.length > 0 && typeof favs[0] === 'object') {
          // Format A: array of ad objects
          favoritesArray = favs;
          favs.forEach((ad) => {
            const id = ad._id || ad.id;
            if (id) idsSet.add(String(id));
          });
        } else {
          // Format B: array of ID strings
          favs.forEach((id) => {
            if (id) idsSet.add(String(id));
          });
        }
      }
      // Handle format: { ads: [...] } or legacy formats
      else if (data?.ads && Array.isArray(data.ads)) {
        favoritesArray = data.ads;
        data.ads.forEach((ad) => {
          const id = ad._id || ad.id;
          if (id) idsSet.add(String(id));
        });
      } else if (data?.data?.ads && Array.isArray(data.data.ads)) {
        favoritesArray = data.data.ads;
        data.data.ads.forEach((ad) => {
          const id = ad._id || ad.id;
          if (id) idsSet.add(String(id));
        });
      } else if (data?.data && Array.isArray(data.data)) {
        favoritesArray = data.data;
        data.data.forEach((ad) => {
          const id = ad._id || ad.id;
          if (id) idsSet.add(String(id));
        });
      } else if (Array.isArray(data)) {
        favoritesArray = data;
        data.forEach((ad) => {
          const id = ad._id || ad.id;
          if (id) idsSet.add(String(id));
        });
      }
      
      setFavoriteIds(idsSet);
      setFavorites(favoritesArray);
    } catch (error) {
      // Handle 401: redirect to login and clear state
      if (error?.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setFavoriteIds(new Set());
        setFavorites([]);
        // Navigation will be handled by ProtectedRoute
      } else {
        console.error('Failed to load favorites:', error);
        setFavoriteIds(new Set());
        setFavorites([]);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Add favorite: call API then reload from backend
  const addFavorite = useCallback(async (adId) => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      await addFavoriteAPI(adId);
      // Always reload to sync with backend (source of truth)
      await loadFavorites();
      return { success: true, message: 'Added to favorites' };
    } catch (err) {
      // Handle 401: redirect to login
      if (err?.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setFavoriteIds(new Set());
        setFavorites([]);
        throw new Error('Authentication required');
      }

      // Handle idempotent responses - if already favorited, treat as success
      const backend = err?.response?.data;
      const message = backend?.message || '';
      const errorType = backend?.details?.type || '';
      
      // Check for "ALREADY_FAVORITE" or similar messages
      if (
        err.response?.status === 200 ||
        err.response?.data?.success === true ||
        message.toLowerCase().includes('already') ||
        errorType === 'ALREADY_FAVORITE'
      ) {
        // Treat as success and reload to sync state
        await loadFavorites();
        return { success: true, message: message || 'Already in favorites' };
      }
      
      // For other errors, reload anyway to ensure state is correct
      await loadFavorites();
      throw err;
    }
  }, [loadFavorites, token]);

  // Remove favorite: call API then reload from backend
  const removeFavorite = useCallback(async (adId) => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      await removeFavoriteAPI(adId);
      // Always reload to sync with backend (source of truth)
      await loadFavorites();
      return { success: true, message: 'Removed from favorites' };
    } catch (err) {
      // Handle 401: redirect to login
      if (err?.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setFavoriteIds(new Set());
        setFavorites([]);
        throw new Error('Authentication required');
      }

      // Handle idempotent responses
      const backend = err?.response?.data;
      const message = backend?.message || '';
      
      if (
        err.response?.status === 200 ||
        err.response?.data?.success === true ||
        message.toLowerCase().includes('not in favorites')
      ) {
        // Treat as success and reload to sync state
        await loadFavorites();
        return { success: true, message: message || 'Removed from favorites' };
      }
      
      // For other errors, reload anyway to ensure state is correct
      await loadFavorites();
      throw err;
    }
  }, [loadFavorites, token]);

  // Check if ad is favorite
  const isFavorite = useCallback((adId) => {
    if (!adId) return false;
    return favoriteIds.has(String(adId));
  }, [favoriteIds]);

  // Clear favorites (on logout)
  const clearFavorites = useCallback(() => {
    setFavoriteIds(new Set());
    setFavorites([]);
  }, []);

  // Load favorites when token exists, clear on logout
  useEffect(() => {
    if (token && user) {
      loadFavorites();
    } else {
      clearFavorites();
    }
  }, [token, user, loadFavorites, clearFavorites]);


  const value = {
    favoriteIds, // Set<string>
    favorites, // Array<Ad> - full ad objects for Favorites page
    loading,
    loadFavorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    clearFavorites,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};
