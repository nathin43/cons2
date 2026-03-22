/**
 * User Notification API Service
 * Handles all customer notification API calls.
 */

import API from './api';

const BASE = '/user/notifications';

const userNotificationApi = {
  /** Fetch paginated notifications */
  getNotifications: async (page = 1, limit = 20, t = Date.now()) => {
    const res = await API.get(BASE, { params: { page, limit, t } });
    return res.data;
  },

  /** Lightweight poll – only unread count */
  getUnreadCount: async () => {
    const res = await API.get(`${BASE}/unread-count`);
    return res.data;
  },

  /** Mark a single notification as read */
  markAsRead: async (id) => {
    const res = await API.patch(`${BASE}/read/${id}`);
    return res.data;
  },

  /** Mark all notifications as read */
  markAllAsRead: async () => {
    const res = await API.patch(`${BASE}/read-all`);
    return res.data;
  },

  /** Delete a single notification */
  deleteOne: async (id) => {
    const res = await API.delete(`${BASE}/${id}`);
    return res.data;
  },

  /** Clear all notifications */
  clearAll: async () => {
    const res = await API.delete(`${BASE}/clear`);
    return res.data;
  },
};

export default userNotificationApi;
