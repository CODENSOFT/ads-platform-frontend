import api from './client';

// AUTH endpoints
export const register = (data) => {
  return api.post('/api/auth/register', data);
};

export const login = (data) => {
  return api.post('/api/auth/login', data);
};

export const forgotPassword = (data) => {
  return api.post('/api/auth/forgot-password', data);
};

export const resetPassword = (token, data) => {
  return api.post(`/api/auth/reset-password/${token}`, data);
};

// ADS endpoints (public)
export const getAds = (params = {}) => api.get("/api/ads", { params });

export const getAdById = (id) => api.get(`/api/ads/${id}`);

export const createAd = (formData) => {
  return api.post('/api/ads', formData, {
    headers: {
      'Content-Type': undefined, // Let axios set multipart/form-data with boundary
    },
  });
};

export const getMyAds = () => api.get("/api/ads/my");

export const getMyAdsAlt = () => {
  return api.get('/api/ads/me');
};

export const updateAdStatus = (id, status) =>
  api.patch(`/api/ads/${id}/status`, { status });

export const updateAd = (id, payload) =>
  api.patch(`/api/ads/${id}`, payload);

export const deleteAd = (id) =>
  api.delete(`/api/ads/${id}`);

// FAVORITES endpoints (protected)
export const getFavorites = () => {
  return api.get('/api/favorites');
};

export const addFavorite = (adId) => {
  return api.post(`/api/favorites/${adId}`);
};

export const removeFavorite = (adId) => {
  return api.delete(`/api/favorites/${adId}`);
};

