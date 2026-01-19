import api from './client';

export const startChat = (adId, receiverId) => {
  return api.post('/chats/start', { adId, receiverId });
};

export const getChats = () => {
  return api.get('/chats');
};

export const getMessages = (conversationId) => {
  return api.get(`/chats/${conversationId}/messages`);
};

export const sendMessage = (conversationId, text) => {
  return api.post(`/chats/${conversationId}/messages`, { text });
};

export const getUnreadCount = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    // Return a promise that resolves to 0 if no token
    return Promise.resolve({ data: { count: 0 } });
  }
  return api.get('/chats/unread-count');
};

