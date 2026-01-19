import { useContext } from 'react';
import { ChatNotificationsContext } from '../context/ChatNotificationsContext.js';

export const useChatNotifications = () => {
  const context = useContext(ChatNotificationsContext);
  if (!context) {
    throw new Error('useChatNotifications must be used within a ChatNotificationsProvider');
  }
  return context;
};

