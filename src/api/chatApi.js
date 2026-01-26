import axios from 'axios';

/**
 * @typedef {Object} StartChatPayload
 * @property {string} adId - Ad ID (Mongo ObjectId)
 * @property {string} receiverId - Receiver/Seller ID (Mongo ObjectId)
 */

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
 * @param {StartChatPayload} payload - Chat start payload
 * @returns {Promise<ChatResponse>}
 * @throws {Error} If validation fails or request fails
 */
export const startChat = async (payload) => {
  const { adId, receiverId } = payload;

  // Runtime validation: check required fields
  if (!adId || typeof adId !== 'string' || adId.trim() === '') {
    const error = new Error('Ad ID is required and must be a non-empty string');
    console.error('[CHAT_API] Validation failed: adId missing or invalid', { adId, payload });
    throw error;
  }

  if (!receiverId || typeof receiverId !== 'string' || receiverId.trim() === '') {
    const error = new Error('Receiver ID is required and must be a non-empty string');
    console.error('[CHAT_API] Validation failed: receiverId missing or invalid', { receiverId, payload });
    throw error;
  }

  // Get token
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
  
  // Clean payload: ensure no undefined values
  const requestBody = {
    adId: String(adId).trim(),
    receiverId: String(receiverId).trim()
  };

  // Log request details
  console.log('[CHAT_API] Request:', {
    method,
    url,
    body: requestBody,
    hasToken: !!token,
    tokenLength: token.length
  });

  try {
    const response = await axios.post(url, requestBody, {
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
    // Log detailed error information
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data, // Важно! Точный body ответа backend
      requestUrl: url,
      requestBody: requestBody,
      headers: error.response?.headers
    };

    console.error('[CHAT_API] Request failed:', errorDetails);
    
    // Log response data separately for visibility
    if (error.response?.data) {
      console.error('[CHAT_API] Backend error response:', JSON.stringify(error.response.data, null, 2));
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
