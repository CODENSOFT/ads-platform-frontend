import axios from 'axios';

/**
 * @typedef {Object} ChatResponse
 * @property {boolean} success
 * @property {Object} chat - Chat object with _id
 * @property {string} message
 */

/**
 * Get API base URL from environment
 * @returns {string}
 */
const getApiUrl = () => {
  const envURL = import.meta.env.VITE_API_URL || "http://localhost:5001";
  return envURL.endsWith('/api') ? envURL : `${envURL.replace(/\/+$/, '')}/api`;
};

/**
 * Get authentication token from localStorage
 * @returns {string|null}
 */
const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Start a new chat with a seller
 * @param {string} adId - Ad ID (Mongo ObjectId) - must be from ad._id
 * @returns {Promise<ChatResponse>}
 * @throws {Error} If validation fails or request fails
 */
export const startChat = async (adId) => {
  // Fix obligatoriu: NU trimite request dacă adId este null/undefined/""
  if (!adId || adId === null || adId === undefined || adId === '' || String(adId).trim() === '') {
    const errorMsg = 'Ad ID is required and cannot be null, undefined, or empty';
    console.error('[CHAT_API] Validation failed: adId is null/undefined/empty', { 
      adId, 
      type: typeof adId,
      value: adId 
    });
    console.error('[CHAT_API] Request blocked - not sending to backend');
    throw new Error(errorMsg);
  }

  // Normalize adId to string
  const adIdStr = String(adId).trim();

  // Verify token exists
  const token = getToken();
  if (!token) {
    const error = new Error('Authentication token is required');
    console.error('[CHAT_API] No token found');
    throw error;
  }

  // Prepare request
  const API_URL = getApiUrl();
  const url = `${API_URL}/chats/start`;
  const method = 'POST';
  
  // Normalizează payload-ul să fie EXACT: { ad: adId }
  // NU adId, NU id, NU ad: obiect întreg
  const payload = {
    ad: adIdStr
  };

  // Log request payload before sending
  console.log('[CHAT_API] Request payload:', payload);
  console.log('[CHAT_API] Request URL:', url);
  console.log('[CHAT_API] Request method:', method);
  console.log('[CHAT_API] Has token:', !!token);

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Log successful response
    console.log('[CHAT_API] Response success:', {
      status: response.status,
      data: response.data
    });

    return response.data;
  } catch (error) {
    // Logging complet în catch
    console.error('[CHAT_API] status:', error.response?.status);
    console.error('[CHAT_API] response:', error.response?.data);
    console.log('[CHAT_API] request payload:', payload);
    
    // Log detailed error information
    if (error.response?.data) {
      console.error('[CHAT_API] Backend error response (full):', JSON.stringify(error.response.data, null, 2));
    }

    // Re-throw with more context
    const enhancedError = new Error(
      error.response?.data?.message || 
      error.response?.data?.error || 
      error.message || 
      'Failed to start chat'
    );
    enhancedError.status = error.response?.status;
    enhancedError.responseData = error.response?.data;
    throw enhancedError;
  }
};
