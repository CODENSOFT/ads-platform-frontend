/**
 * Categories API utilities
 */

import api from './client';

/**
 * Fetch categories from API (list with optional fields)
 * GET /categories -> [{ name, slug, fields?: [...] }]
 * @returns {Promise<any>} Response data
 */
export async function fetchCategories() {
  try {
    const response = await api.get('/categories');
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch a single category by slug (with fields for dynamic attributes)
 * GET /categories/:slug -> { name, slug, fields: [...] }
 * @param {string} slug - Category slug
 * @returns {Promise<any>} Response data (category object with fields)
 */
export async function getCategoryBySlug(slug) {
  if (!slug || !String(slug).trim()) {
    return { data: null };
  }
  try {
    const response = await api.get(`/categories/${encodeURIComponent(String(slug).trim())}`);
    return response;
  } catch (error) {
    throw error;
  }
}
