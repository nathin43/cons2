import { useEffect, useCallback } from 'react';
import { useNotifications } from '../context/NotificationContext';
import socketService from '../services/socketService';

/**
 * Hook for handling real-time notifications via Socket.IO
 */
export const useNotificationSocket = () => {
  const { addNotification, fetchUnreadCount } = useNotifications();

  const setupSocketListeners = useCallback(() => {
    // Listen to new notifications
    socketService.onNewNotification((notification) => {
      console.log('📬 New notification received:', notification);
      addNotification(notification);
    });

    // Listen to batch notifications
    socketService.onBatchNotifications((notifications) => {
      console.log(`📬 Batch of ${notifications.length} notifications received`);
      notifications.forEach((notif) => addNotification(notif));
    });

    // Listen to unread count updates
    socketService.onUnreadCountUpdate((data) => {
      console.log('🔔 Unread count updated:', data.unreadCount);
      fetchUnreadCount();
    });
  }, [addNotification, fetchUnreadCount]);

  useEffect(() => {
    // Initialize socket connection
    socketService.connect();

    // Setup listeners
    setupSocketListeners();

    // Cleanup
    return () => {
      socketService.off('notification:new');
      socketService.off('notification:batch');
      socketService.off('notification:unread-count');
    };
  }, [setupSocketListeners]);

  return socketService;
};

export default useNotificationSocket;
