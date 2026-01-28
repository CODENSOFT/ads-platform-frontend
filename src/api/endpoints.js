import api from './client';

// AUTH endpoints
export const register = (data) => {
  return api.post('/auth/register', data);
};

export const login = (data) => {
  return api.post('/auth/login', data);
};

export const forgotPassword = (data) => {
  return api.post('/auth/forgot-password', data);
};

export const resetPassword = (token, data) => {
  return api.post(`/auth/reset-password/${token}`, data);
};

// ADS endpoints (public)
export const getAds = (params = {}) => api.get("/ads", { params });

// Recommended ads (Home)
export const getRecommendedAds = (limit = 10) =>
  api.get("/ads", { params: { limit, sort: "-createdAt" } });

export const getAdById = (id) => api.get(`/ads/${id}`);

export const createAd = (formData) => {
  return api.post('/ads', formData, {
    headers: {
      'Content-Type': undefined, // Let axios set multipart/form-data with boundary
    },
  });
};

export const getMyAds = () => api.get("/ads/my");

export const updateAdStatus = (id, status) =>
  api.patch(`/ads/${id}/status`, { status });

export const updateAd = (id, payload) =>
  api.patch(`/ads/${id}`, payload);

// Optional: update ad with multipart/form-data (e.g., if backend supports updating images)
export const updateAdFormData = (id, formData) => {
  return api.patch(`/ads/${id}`, formData, {
    headers: {
      'Content-Type': undefined, // Let axios set multipart/form-data with boundary
    },
  });
};

export const deleteAd = (id) =>
  api.delete(`/ads/${id}`);

// FAVORITES endpoints (protected)
export const getFavorites = () => {
  // HARD GUARD: never call protected endpoint without token
  const token = localStorage.getItem('token');
  if (!token) {
    return Promise.resolve({ data: { success: false, skipped: true, favorites: [] } });
  }
  return api.get('/favorites/my');
};

export const addFavorite = (adId) => {
  return api.post(`/favorites/${adId}`);
};

export const removeFavorite = (adId) => {
  return api.delete(`/favorites/${adId}`);
};

// CATEGORIES endpoints
export const getCategories = () => {
  return api.get('/categories');
};

