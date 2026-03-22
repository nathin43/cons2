import React, { useState, useCallback, useEffect, useContext } from 'react';
import API from '../services/api';
import { NotificationContext } from './NotificationContext';
import { AuthContext } from './AuthContext';

export const NotificationProvider = ({ children }) => {
  const { admin } = useContext(AuthContext); // Check if admin is authenticated
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: 'all', type: 'all' });

  const fetchNotifications = useCallback(async (limit = 50, skip = 0) => {
    // Guard: only fetch if admin is authenticated
    if (!admin) return;
    
    try {
      setLoading(true);
      const response = await API.get(`/admin/notifications`, { params: { limit, skip } });
      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [admin]);

  const fetchUnreadNotifications = useCallback(async (limit = 50) => {
    // Guard: only fetch if admin is authenticated
    if (!admin) return;
    
    try {
      const response = await API.get(`/admin/notifications/unread`, { params: { limit } });
      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
    }
  }, [admin]);

  const fetchUnreadCount = useCallback(async () => {
    // Guard: only fetch if admin is authenticated
    if (!admin) return;
    
    try {
      const response = await API.get(`/admin/notifications/count`);
      if (response.data.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [admin]);

  const markAsRead = useCallback(async (notificationId) => {
    if (!admin) return; // Guard
    
    try {
      const response = await API.put(`/admin/notifications/${notificationId}/read`);
      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        );
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [admin]);

  const markAllAsRead = useCallback(async () => {
    if (!admin) return; // Guard
    
    try {
      const response = await API.put(`/admin/notifications/mark-all-read`);
      if (response.data.success) {
        setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [admin]);

  const deleteNotification = useCallback(async (notificationId) => {
    if (!admin) return; // Guard
    
    try {
      const response = await API.delete(`/admin/notifications/${notificationId}`);
      if (response.data.success) {
        setNotifications((prev) => prev.filter((notif) => notif._id !== notificationId));
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [admin]);

  const clearAllNotifications = useCallback(async () => {
    if (!admin) return; // Guard
    
    try {
      const response = await API.delete(`/admin/notifications`);
      if (response.data.success) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }, [admin]);

  const addNotification = useCallback((notification) => {
    setNotifications((prev) => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  const fetchFilteredNotifications = useCallback(
    async (status = 'all', type = 'all', limit = 50, skip = 0) => {
      try {
        setLoading(true);
        const response = await API.get(`/admin/notifications/filter`, {
          params: { status, type, limit, skip },
        });
        if (response.data.success) {
          setNotifications(response.data.notifications);
          setUnreadCount(response.data.unreadCount);
          setFilters({ status, type });
        }
      } catch (error) {
        console.error('Error fetching filtered notifications:', error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const setStatusFilter = useCallback(
    async (status) => {
      setFilters((prev) => ({ ...prev, status }));
      await fetchFilteredNotifications(status, filters.type);
    },
    [filters.type, fetchFilteredNotifications]
  );

  const setTypeFilter = useCallback(
    async (type) => {
      setFilters((prev) => ({ ...prev, type }));
      await fetchFilteredNotifications(filters.status, type);
    },
    [filters.status, fetchFilteredNotifications]
  );

  const resetFilters = useCallback(async () => {
    setFilters({ status: 'all', type: 'all' });
    await fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    loading,
    filters,
    fetchNotifications,
    fetchUnreadNotifications,
    fetchUnreadCount,
    fetchFilteredNotifications,
    setStatusFilter,
    setTypeFilter,
    resetFilters,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    addNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
