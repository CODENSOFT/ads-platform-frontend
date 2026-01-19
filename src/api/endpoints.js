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

export const getAdById = (id) => api.get(`/ads/${id}`);

export const createAd = (formData) => {
  return api.post('/ads', formData, {
    headers: {
      'Content-Type': undefined, // Let axios set multipart/form-data with boundary
    },
  });
};

export const getMyAds = () => api.get("/ads/my");

export const getMyAdsAlt = () => {
  return api.get('/ads/me');
};

export const updateAdStatus = (id, status) =>
  api.patch(`/ads/${id}/status`, { status });

export const updateAd = (id, payload) =>
  api.patch(`/ads/${id}`, payload);

export const deleteAd = (id) =>
  api.delete(`/ads/${id}`);

// FAVORITES endpoints (protected)
export const getFavorites = () => {
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

