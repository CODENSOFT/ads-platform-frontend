import { useState, useEffect } from 'react';
import { getCategories } from '../api/endpoints';

const CACHE_KEY = 'categories_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to get from cache first
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const { data, timestamp } = JSON.parse(cached);
            const now = Date.now();
            if (now - timestamp < CACHE_EXPIRY) {
              // Cache is still valid
              setCategories(data);
              setLoading(false);
              // Still fetch in background to update cache
              fetchAndCache();
              return;
            }
          } catch (e) {
            // Invalid cache, continue to fetch
          }
        }

        // Fetch from API
        await fetchAndCache();
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load categories');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchAndCache = async () => {
      const response = await getCategories();
      const categoriesData = response.data?.categories || response.data?.data || response.data || [];
      const categoriesArray = Array.isArray(categoriesData) ? categoriesData : [];
      
      setCategories(categoriesArray);
      
      // Cache the result
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: categoriesArray,
          timestamp: Date.now(),
        }));
      } catch (e) {
        // Ignore localStorage errors
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};

export default useCategories;

