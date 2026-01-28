/**
 * Categories API utilities
 */

const getApiBase = () => {
  const base = import.meta.env.VITE_API_URL || "http://localhost:5001";
  return base.endsWith("/api") ? base : `${base.replace(/\/+$/, "")}/api`;
};

/**
 * Fetch categories from API
 * @returns {Promise<any>} Response data
 */
export async function fetchCategories() {
  const apiBase = getApiBase();
  const url = `${apiBase}/categories`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}
