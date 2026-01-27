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
 * Start a new chat with a seller (Direct Messages only - no ad/adId)
 * @param {Object} params - Chat start parameters
 * @param {string} params.receiverId - Receiver/Seller ID (Mongo ObjectId)
 * @returns {Promise<ChatResponse>}
 * @throws {Error} If validation fails or request fails
 */
export const startChat = async ({ receiverId }) => {
  // Normalize to string
  const receiverIdStr = String(receiverId || '').trim();

  // Validate receiverId before request
  if (!receiverId || receiverIdStr === '' || ['null', 'undefined'].includes(receiverIdStr)) {
    throw new Error('Seller id missing');
  }

  // HARD GUARD: never call protected endpoint without token
  const token = getToken();
  if (!token) {
    const error = new Error('Authentication token is required');
    // Silent - no console spam
    throw error;
  }

  // Prepare request
  const API_URL = getApiUrl();
  const url = `${API_URL}/chats/start`;
  
  // Payload exactly: { receiverId: receiverIdStr }
  const payload = {
    receiverId: receiverIdStr
  };

  // Dev-only log showing what is being sent
  if (import.meta.env.DEV) {
    console.log('[CHAT_START_FRONT] payload', { receiverId: receiverIdStr });
  }

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

/**
 * Delete a chat conversation
 * @param {string} chatId - Chat ID (Mongo ObjectId)
 * @returns {Promise<any>}
 * @throws {Error} If validation fails or request fails
 */
export const deleteChat = async (chatId) => {
  // Validate chatId
  const chatIdStr = String(chatId || '').trim();
  if (!chatId || chatIdStr === '' || ['null', 'undefined'].includes(chatIdStr)) {
    throw new Error('Chat ID is required');
  }

  // HARD GUARD: never call protected endpoint without token
  const token = getToken();
  if (!token) {
    const error = new Error('Authentication token is required');
    // Silent - no console spam
    throw error;
  }

  // Prepare request
  const API_URL = getApiUrl();
  const url = `${API_URL}/chats/${chatIdStr}`;

  try {
    const response = await axios.delete(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Log successful response
    if (import.meta.env.DEV) {
      console.log('[CHAT_API] Delete success:', {
        status: response.status,
        data: response.data
      });
    }

    return response.data;
  } catch (error) {
    // Logging similar to startChat
    console.error('[CHAT_API] Delete status:', error.response?.status);
    console.error('[CHAT_API] Delete response:', error.response?.data);
    
    // Log detailed error information
    if (error.response?.data) {
      console.error('[CHAT_API] Backend error response (full):', JSON.stringify(error.response.data, null, 2));
    }

    // Re-throw with more context
    const enhancedError = new Error(
      error.response?.data?.message || 
      error.response?.data?.error || 
      error.message || 
      'Failed to delete chat'
    );
    enhancedError.status = error.response?.status;
    enhancedError.responseData = error.response?.data;
    throw enhancedError;
  }
};
