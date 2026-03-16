/**
 * Socket.IO Notification Handlers
 * Real-time notification events
 */

const Notification = require('../models/Notification');
const NotificationService = require('../services/notificationService');

module.exports = (io) => {
  // Store admin socket connections
  const adminSockets = {};

  io.on('connection', (socket) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`[${timestamp}] Notification socket connected: ${socket.id}`);

    // Handle socket errors
    socket.on('error', (error) => {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      console.error(`[${timestamp}] Socket error on ${socket.id}:`, error.message);
    });

    // Admin joins notification room
    socket.on('notification:admin-join', (adminId) => {
      try {
        if (adminId) {
          socket.join(`admin:${adminId}`);
          adminSockets[adminId] = socket.id;
          const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
          console.log(`[${timestamp}] Admin ${adminId} joined notification room`);
        }
      } catch (error) {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        console.error(`[${timestamp}] Error in admin-join:`, error.message);
      }
    });

    // Request to sync notifications
    socket.on('notification:sync', async (adminId) => {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      try {
        const notifications = await NotificationService.getAllNotifications(adminId, 50, 0);
        const unreadCount = await NotificationService.getUnreadCount(adminId);

        socket.emit('notification:sync-response', {
          success: true,
          notifications: notifications.notifications,
          unreadCount,
          total: notifications.total,
        });
      } catch (error) {
        console.error(`[${timestamp}] Sync error:`, error.message);
        socket.emit('notification:sync-error', {
          success: false,
          message: error.message,
        });
      }
    });

    // Listen for mark as read
    socket.on('notification:mark-read', async (data) => {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      try {
        const { notificationId, adminId } = data;
        await NotificationService.markAsRead(adminId, notificationId);

        // Broadcast to admin's sockets
        io.to(`admin:${adminId}`).emit('notification:marked-read', {
          notificationId,
        });
      } catch (error) {
        console.error(`[${timestamp}] Mark read error:`, error.message);
      }
    });

    // Listen for mark all as read
    socket.on('notification:mark-all-read', async (adminId) => {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      try {
        await NotificationService.markAllAsRead(adminId);

        // Broadcast to admin's sockets
        io.to(`admin:${adminId}`).emit('notification:all-marked-read');
      } catch (error) {
        console.error(`[${timestamp}] Mark all read error:`, error.message);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      try {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        // Remove from adminSockets
        for (const adminId in adminSockets) {
          if (adminSockets[adminId] === socket.id) {
            delete adminSockets[adminId];
            console.log(`[${timestamp}] Admin ${adminId} left notification room`);
          }
        }
        console.log(`[${timestamp}] Notification socket disconnected: ${socket.id}`);
      } catch (error) {
        console.error('Error during disconnect:', error.message);
      }
    });
  });

  /**
   * Emit notification to specific admin
   */
  const emitToAdmin = (adminId, notification) => {
    try {
      io.to(`admin:${adminId}`).emit('notification:new', notification);
    } catch (error) {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      console.error(`[${timestamp}] Error emitting to admin ${adminId}:`, error.message);
    }
  };

  /**
   * Emit batch notifications to admin
   */
  const emitBatchToAdmin = (adminId, notifications) => {
    try {
      io.to(`admin:${adminId}`).emit('notification:batch', notifications);
    } catch (error) {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      console.error(`[${timestamp}] Error emitting batch to admin ${adminId}:`, error.message);
    }
  };

  /**
   * Emit unread count update to admin
   */
  const emitUnreadCountUpdate = (adminId, unreadCount) => {
    io.to(`admin:${adminId}`).emit('notification:unread-count', {
      unreadCount,
    });
  };

  /**
   * Emit to all connected admins (broadcast)
   */
  const broadcastToAllAdmins = (notification) => {
    io.emit('notification:broadcast', notification);
  };

  return {
    emitToAdmin,
    emitBatchToAdmin,
    emitUnreadCountUpdate,
    broadcastToAllAdmins,
  };
};
