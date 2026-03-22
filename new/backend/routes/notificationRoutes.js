const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { adminProtect } = require('../middleware/auth');

// Protect all notification routes with admin auth
router.use(adminProtect);

// Get filtered notifications with advanced filters
// Must come before other specific get routes
router.get('/filter', notificationController.getFilteredNotifications);

// Get all notifications with pagination
router.get('/', notificationController.getAllNotifications);

// Get unread notifications only
router.get('/unread', notificationController.getUnreadNotifications);

// Get unread count
router.get('/count', notificationController.getUnreadCount);

// Mark notification as read
router.put('/:notificationId/read', notificationController.markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', notificationController.markAllAsRead);

// Delete specific notification
router.delete('/:notificationId', notificationController.deleteNotification);

// Delete all notifications
router.delete('/', notificationController.clearAllNotifications);

module.exports = router;
