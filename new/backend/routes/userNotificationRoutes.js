const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userNotificationController');
const { protect } = require('../middleware/auth');

// All routes require a logged-in customer
router.use(protect);

// GET  /api/user/notifications                → paginated list + unread count
router.get('/', ctrl.getNotifications);

// GET  /api/user/notifications/unread-count   → quick badge poll
router.get('/unread-count', ctrl.getUnreadCount);

// PATCH /api/user/notifications/read-all      → mark all as read (must come before /:id)
router.patch('/read-all', ctrl.markAllAsRead);

// PATCH /api/user/notifications/read/:id      → mark one as read
router.patch('/read/:id', ctrl.markAsRead);

// DELETE /api/user/notifications/clear        → wipe all (must come before /:id)
router.delete('/clear', ctrl.clearAll);

// DELETE /api/user/notifications/:id          → delete one
router.delete('/:id', ctrl.deleteOne);

module.exports = router;
