/**
 * Socket IO Service for Real-time Notifications
 * Establishes WebSocket connection and handles real-time events
 */

import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  /**
   * Initialize socket connection
   */
  connect(url, options = {}) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    try {
      this.socket = io(url || import.meta.env.VITE_SOCKET_URL || 'http://localhost:50004', {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling'],
        ...options,
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected:', this.socket.id);
        this.isConnected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        this.isConnected = false;
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      return this.socket;
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      return null;
    }
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }

  /**
   * Listen to new notification event
   */
  onNewNotification(callback) {
    if (this.socket) {
      this.socket.on('notification:new', callback);
    }
  }

  /**
   * Listen to batch notifications
   */
  onBatchNotifications(callback) {
    if (this.socket) {
      this.socket.on('notification:batch', callback);
    }
  }

  /**
   * Listen to real-time count update
   */
  onUnreadCountUpdate(callback) {
    if (this.socket) {
      this.socket.on('notification:unread-count', callback);
    }
  }

  /**
   * Emit mark as read event
   */
  emitMarkAsRead(notificationId) {
    if (this.socket) {
      this.socket.emit('notification:mark-read', { notificationId });
    }
  }

  /**
   * Emit mark all as read
   */
  emitMarkAllAsRead() {
    if (this.socket) {
      this.socket.emit('notification:mark-all-read');
    }
  }

  /**
   * Request notification sync
   */
  requestSync() {
    if (this.socket) {
      this.socket.emit('notification:sync');
    }
  }

  /**
   * Remove listener
   */
  off(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  /**
   * Get socket instance
   */
  getSocket() {
    return this.socket;
  }

  /**
   * Check if connected
   */
  getConnectedStatus() {
    return this.isConnected;
  }
}

export default new SocketService();
