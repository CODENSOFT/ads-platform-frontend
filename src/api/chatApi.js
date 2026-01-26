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
 * @param {Object} params - Chat start parameters
 * @param {string} params.receiverId - Receiver/Seller ID (Mongo ObjectId)
 * @param {string} params.adId - Ad ID (Mongo ObjectId)
 * @returns {Promise<ChatResponse>}
 * @throws {Error} If validation fails or request fails
 */
export const startChat = async ({ receiverId, adId }) => {
  // Normalize to strings first
  const receiverIdStr = String(receiverId || '').trim();
  const adIdStr = String(adId || '').trim();

  // Improve validation to also block literal strings "null"/"undefined"
  if (['', 'null', 'undefined'].includes(receiverIdStr)) {
    const errorMsg = 'Missing receiverId/adId';
    console.error('[CHAT_API] Validation failed: receiverId is missing or invalid', { receiverId, receiverIdStr, adId });
    throw new Error(errorMsg);
  }

  if (['', 'null', 'undefined'].includes(adIdStr)) {
    const errorMsg = 'Missing receiverId/adId';
    console.error('[CHAT_API] Validation failed: adId is missing or invalid', { receiverId, adId, adIdStr });
    throw new Error(errorMsg);
  }

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
  
  // Send request body exactly: { receiverId, adId }
  const payload = {
    receiverId: receiverIdStr,
    adId: adIdStr
  };

  // Add dev-only debug log before request
  if (import.meta.env.DEV) {
    console.log('[CHAT_START] sending', { receiverId: receiverIdStr, adId: adIdStr });
  }

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
