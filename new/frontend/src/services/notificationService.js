/**
 * Admin Notification Service
 * Handles all notification-related API calls
 */

import API from './api';

export const notificationService = {
  // Fetch all notifications
  getAllNotifications: async (limit = 50, skip = 0) => {
    try {
      const response = await API.get('/admin/notifications', {
        params: { limit, skip },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Fetch unread notifications only
  getUnreadNotifications: async (limit = 50) => {
    try {
      const response = await API.get('/admin/notifications/unread', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      throw error;
    }
  },

  // Get unread count
  getUnreadCount: async () => {
    try {
      const response = await API.get('/admin/notifications/count');
      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  },

  // Mark as read
  markAsRead: async (notificationId) => {
    try {
      const response = await API.put(`/admin/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Mark all as read
  markAllAsRead: async () => {
    try {
      const response = await API.put('/admin/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    try {
      const response = await API.delete(`/admin/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  // Clear all notifications
  clearAllNotifications: async () => {
    try {
      const response = await API.delete('/admin/notifications');
      return response.data;
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      throw error;
    }
  },
};

export default notificationService;
