/**
 * Build query parameters for GET /api/ads
 * @param {Object} filters - Filter values
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 12)
 * @returns {Object} Query params object
 */
export const buildAdsQuery = (filters = {}, page = 1, limit = 12) => {
  const params = {
    page,
    limit,
  };

  // Search (trimmed string)
  if (filters.search && typeof filters.search === 'string') {
    const trimmed = filters.search.trim();
    if (trimmed.length > 0) {
      params.search = trimmed;
    }
  }

  // Category slug
  if (filters.categorySlug && typeof filters.categorySlug === 'string') {
    const trimmed = filters.categorySlug.trim();
    if (trimmed.length > 0) {
      params.categorySlug = trimmed;
    }
  }

  // Subcategory slug
  if (filters.subCategorySlug && typeof filters.subCategorySlug === 'string') {
    const trimmed = filters.subCategorySlug.trim();
    if (trimmed.length > 0) {
      params.subCategorySlug = trimmed;
    }
  }

  // Min price (number only, ignore if empty/invalid)
  if (filters.minPrice !== undefined && filters.minPrice !== null && filters.minPrice !== '') {
    const minPrice = Number(filters.minPrice);
    if (!isNaN(minPrice) && isFinite(minPrice) && minPrice >= 0) {
      params.minPrice = minPrice;
    }
  }

  // Max price (number only, ignore if empty/invalid)
  if (filters.maxPrice !== undefined && filters.maxPrice !== null && filters.maxPrice !== '') {
    const maxPrice = Number(filters.maxPrice);
    if (!isNaN(maxPrice) && isFinite(maxPrice) && maxPrice >= 0) {
      params.maxPrice = maxPrice;
    }
  }

  // Currency (trimmed string)
  if (filters.currency && typeof filters.currency === 'string') {
    const trimmed = filters.currency.trim();
    if (trimmed.length > 0) {
      params.currency = trimmed;
    }
  }

  // Sort (default to 'newest' if not provided or invalid)
  const validSorts = ['newest', 'price_asc', 'price_desc'];
  if (filters.sort && validSorts.includes(filters.sort)) {
    params.sort = filters.sort;
  } else {
    params.sort = 'newest'; // Default sort
  }

  return params;
};

