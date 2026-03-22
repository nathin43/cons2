/**
 * User Notification Controller
 * Handles REST endpoints for customer notifications.
 */

const UserNotification = require('../models/UserNotification');

/**
 * GET /api/user/notifications
 * Fetch paginated notifications for the logged-in user (latest first, max 20).
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      UserNotification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserNotification.countDocuments({ userId }),
      UserNotification.countDocuments({ userId, isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[UserNotificationController] getNotifications:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

/**
 * GET /api/user/notifications/unread-count
 * Return only the unread count (lightweight poll).
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await UserNotification.countDocuments({
      userId: req.user.id,
      isRead: false,
    });
    res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    console.error('[UserNotificationController] getUnreadCount:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch count' });
  }
};

/**
 * PATCH /api/user/notifications/read/:id
 * Mark a single notification as read.
 */
exports.markAsRead = async (req, res) => {
  try {
    const notification = await UserNotification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const unreadCount = await UserNotification.countDocuments({
      userId: req.user.id,
      isRead: false,
    });

    res.status(200).json({ success: true, notification, unreadCount });
  } catch (error) {
    console.error('[UserNotificationController] markAsRead:', error.message);
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
};

/**
 * PATCH /api/user/notifications/read-all
 * Mark all notifications as read.
 */
exports.markAllAsRead = async (req, res) => {
  try {
    await UserNotification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read', unreadCount: 0 });
  } catch (error) {
    console.error('[UserNotificationController] markAllAsRead:', error.message);
    res.status(500).json({ success: false, message: 'Failed to mark all as read' });
  }
};

/**
 * DELETE /api/user/notifications/clear
 * Delete all notifications for the user.
 */
exports.clearAll = async (req, res) => {
  try {
    await UserNotification.deleteMany({ userId: req.user.id });
    res.status(200).json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    console.error('[UserNotificationController] clearAll:', error.message);
    res.status(500).json({ success: false, message: 'Failed to clear notifications' });
  }
};

/**
 * DELETE /api/user/notifications/:id
 * Delete a single notification.
 */
exports.deleteOne = async (req, res) => {
  try {
    const notification = await UserNotification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const unreadCount = await UserNotification.countDocuments({
      userId: req.user.id,
      isRead: false,
    });

    res.status(200).json({ success: true, message: 'Notification deleted', unreadCount });
  } catch (error) {
    console.error('[UserNotificationController] deleteOne:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
};
