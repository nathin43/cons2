/**
 * Notification Controller
 * Handles admin notification endpoints
 */

const Notification = require('../models/Notification');
const NotificationService = require('../services/notificationService');

exports.getUnreadNotifications = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { limit = 50 } = req.query;

    const notifications = await NotificationService.getUnreadNotifications(
      adminId,
      parseInt(limit)
    );

    const unreadCount = notifications.length;

    res.status(200).json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message,
    });
  }
};

exports.getAllNotifications = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { limit = 50, skip = 0 } = req.query;

    const { notifications, total } = await NotificationService.getAllNotifications(
      adminId,
      parseInt(limit),
      parseInt(skip)
    );

    const unreadCount = await NotificationService.getUnreadCount(adminId);

    res.status(200).json({
      success: true,
      notifications,
      total,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message,
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { notificationId } = req.params;

    await NotificationService.markAsRead(adminId, notificationId);

    const unreadCount = await NotificationService.getUnreadCount(adminId);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      unreadCount,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    const statusCode = error.message === 'Unauthorized' ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to mark notification as read',
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const adminId = req.admin._id;

    await NotificationService.markAllAsRead(adminId);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      unreadCount: 0,
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all as read',
      error: error.message,
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { notificationId } = req.params;

    await NotificationService.deleteNotification(adminId, notificationId);

    const unreadCount = await NotificationService.getUnreadCount(adminId);

    res.status(200).json({
      success: true,
      message: 'Notification deleted',
      unreadCount,
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    const statusCode = error.message === 'Unauthorized' ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete notification',
    });
  }
};

exports.clearAllNotifications = async (req, res) => {
  try {
    const adminId = req.admin._id;

    await NotificationService.deleteAllNotifications(adminId);

    res.status(200).json({
      success: true,
      message: 'All notifications cleared',
      unreadCount: 0,
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear notifications',
      error: error.message,
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const adminId = req.admin._id;

    const unreadCount = await NotificationService.getUnreadCount(adminId);

    res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message,
    });
  }
};

/**
 * Get notifications with advanced filtering
 * Query parameters:
 * - status: 'all' (default), 'read', 'unread'
 * - type: 'all' (default), 'orders', 'refunds', 'customers', 'messages', 'stock'
 * - limit: number of results (default 50)
 * - skip: number of results to skip (default 0)
 */
exports.getFilteredNotifications = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { status = 'all', type = 'all', limit = 50, skip = 0 } = req.query;

    const { notifications, total } = await NotificationService.getFilteredNotifications(
      adminId,
      { status, type, limit, skip }
    );

    const unreadCount = await NotificationService.getUnreadCount(adminId);

    res.status(200).json({
      success: true,
      notifications,
      total,
      unreadCount,
      filters: { status, type },
    });
  } catch (error) {
    console.error('Error fetching filtered notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message,
    });
  }
};
