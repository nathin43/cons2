/**
 * Notification Service
 * Handles creation and management of all notification types
 */

const Notification = require('../models/Notification');

class NotificationService {
  /**
   * Create notification
   */
  static async createNotification(adminId, data) {
    try {
      const notification = await Notification.create({
        admin: adminId,
        ...data,
      });
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create sales notification
   */
  static async notifySaleCompleted(adminId, orderData) {
    return this.createNotification(adminId, {
      type: 'SALE',
      title: 'New Sale Completed',
      description: `${orderData.customerName} purchased ${orderData.productName} for ₹${orderData.amount}`,
      icon: 'shopping-bag',
      color: 'green',
      actionUrl: `/admin/orders/${orderData.orderId}`,
      data: {
        productId: orderData.productId,
        productName: orderData.productName,
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        amount: orderData.amount,
      },
    });
  }

  /**
   * Create low stock alert
   */
  static async notifyLowStock(adminId, productData) {
    return this.createNotification(adminId, {
      type: 'LOW_STOCK',
      title: 'Low Stock Warning',
      description: `${productData.productName} has only ${productData.stock} units remaining`,
      icon: 'alert-triangle',
      color: 'orange',
      actionUrl: `/admin/products/${productData.productId}`,
      data: {
        productId: productData.productId,
        productName: productData.productName,
        stock: productData.stock,
      },
    });
  }

  /**
   * Create out of stock alert
   */
  static async notifyOutOfStock(adminId, productData) {
    return this.createNotification(adminId, {
      type: 'OUT_OF_STOCK',
      title: 'Product Out of Stock',
      description: `${productData.productName} is now out of stock`,
      icon: 'alert-circle',
      color: 'red',
      actionUrl: `/admin/products/${productData.productId}`,
      data: {
        productId: productData.productId,
        productName: productData.productName,
      },
    });
  }

  /**
   * Create new order notification
   */
  static async notifyNewOrder(adminId, orderData) {
    const itemLabel = orderData.itemCount ? ` | Items: ${orderData.itemCount}` : '';
    return this.createNotification(adminId, {
      type: 'NEW_ORDER',
      title: 'New Order Received',
      description: `Order #${orderData.orderNumber} for ₹${orderData.amount} from ${orderData.customerName}${itemLabel}`,
      icon: 'shopping-cart',
      color: 'blue',
      actionUrl: `/admin/orders/${orderData.orderId}`,
      data: {
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        amount: orderData.amount,
        itemCount: orderData.itemCount,
      },
    });
  }

  /**
   * Create order cancelled notification
   */
  static async notifyOrderCancelled(adminId, orderData) {
    const messageSnippet = orderData.cancellationMessage
      ? ` | Message: ${orderData.cancellationMessage}`
      : '';

    return this.createNotification(adminId, {
      type: 'ORDER_CANCELLED',
      title: 'Order Cancelled by Customer',
      description: `Order #${orderData.orderNumber} has been cancelled by ${orderData.customerName}${messageSnippet}`,
      icon: 'x-circle',
      color: 'red',
      actionUrl: `/admin/orders/${orderData.orderId}`,
      data: {
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        cancellationMessage: orderData.cancellationMessage || null,
      },
    });
  }

  /**
   * Create new customer registration notification
   */
  static async notifyNewCustomer(adminId, customerData) {
    return this.createNotification(adminId, {
      type: 'NEW_CUSTOMER',
      title: 'New Customer Joined',
      description: `${customerData.customerName} has registered. Email: ${customerData.email}`,
      icon: 'user-plus',
      color: 'purple',
      actionUrl: `/admin/customers/${customerData.customerId}`,
      data: {
        customerId: customerData.customerId,
        customerName: customerData.customerName,
      },
    });
  }

  /**
   * Create contact message notification
   */
  static async notifyContactMessage(adminId, contactData) {
    return this.createNotification(adminId, {
      type: 'CONTACT_MESSAGE',
      title: 'New Contact Message Received',
      description: `From: ${contactData.from} - ${contactData.subject}`,
      icon: 'mail',
      color: 'blue',
      actionUrl: `/admin/contacts/${contactData.contactId}`,
      data: {
        contactId: contactData.contactId,
        from: contactData.from,
        subject: contactData.subject,
      },
    });
  }

  /**
   * Create refund request notification
   */
  static async notifyRefundRequest(adminId, refundData) {
    const orderPart = refundData.orderNumber ? `Order #${refundData.orderNumber}` : 'Return request';
    const amountPart = refundData.amount ? ` for ₹${refundData.amount}` : '';
    return this.createNotification(adminId, {
      type: 'REFUND_REQUEST',
      title: 'Refund Request Submitted',
      description: `${orderPart}${amountPart} submitted by ${refundData.customerName} (${refundData.category || 'General'})`,
      icon: 'undo-2',
      color: 'yellow',
      actionUrl: `/admin/refund-requests`,
      data: {
        refundId: refundData.refundId,
        // orderNumber is stored as String — never pass data.orderId for returns
        // because customer-typed IDs like "ORD1234" are not valid ObjectIds
        orderNumber: refundData.orderNumber || null,
        customerId: refundData.customerId || null,
        customerName: refundData.customerName,
        amount: refundData.amount || null,
      },
    });
  }

  /**
   * Get all unread notifications
   */
  static async getUnreadNotifications(adminId, limit = 50) {
    try {
      const notifications = await Notification.find(
        { admin: adminId, read: false },
        null,
        { sort: { createdAt: -1 }, limit }
      ).lean();
      return notifications;
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      throw error;
    }
  }

  /**
   * Get all notifications with pagination
   */
  static async getAllNotifications(adminId, limit = 50, skip = 0) {
    try {
      const notifications = await Notification.find({ admin: adminId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();
      const total = await Notification.countDocuments({ admin: adminId });
      return { notifications, total };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(adminId, notificationId) {
    try {
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { read: true },
        { new: true }
      );

      // Verify it belongs to the admin
      if (!notification || notification.admin.toString() !== adminId.toString()) {
        throw new Error('Unauthorized');
      }

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(adminId) {
    try {
      await Notification.updateMany(
        { admin: adminId, read: false },
        { read: true }
      );
      return true;
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(adminId, notificationId) {
    try {
      const notification = await Notification.findById(notificationId);

      if (!notification || notification.admin.toString() !== adminId.toString()) {
        throw new Error('Unauthorized');
      }

      await Notification.findByIdAndDelete(notificationId);
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Delete all notifications
   */
  static async deleteAllNotifications(adminId) {
    try {
      await Notification.deleteMany({ admin: adminId });
      return true;
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(adminId) {
    try {
      const count = await Notification.countDocuments({
        admin: adminId,
        read: false,
      });
      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Get notifications with advanced filtering
   * @param {String} adminId - Admin ID
   * @param {String} status - Filter by read status: 'all', 'read', 'unread'
   * @param {String} type - Filter by notification type: 'orders', 'refunds', 'customers', 'messages', 'stock'
   * @param {Number} limit - Limit results
   * @param {Number} skip - Skip results
   */
  static async getFilteredNotifications(adminId, { status = 'all', type = 'all', limit = 50, skip = 0 } = {}) {
    try {
      const query = { admin: adminId };

      // Apply status filter
      if (status === 'unread') {
        query.read = false;
      } else if (status === 'read') {
        query.read = true;
      }
      // For 'all', don't filter by read status

      // Apply type filter - map user-friendly types to notification types
      if (type !== 'all') {
        switch (type) {
          case 'orders':
            query.type = { $in: ['NEW_ORDER', 'ORDER_CANCELLED', 'SALE'] };
            break;
          case 'refunds':
            query.type = 'REFUND_REQUEST';
            break;
          case 'customers':
            query.type = 'NEW_CUSTOMER';
            break;
          case 'messages':
            query.type = 'CONTACT_MESSAGE';
            break;
          case 'stock':
            query.type = { $in: ['LOW_STOCK', 'OUT_OF_STOCK'] };
            break;
        }
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .lean();

      const total = await Notification.countDocuments(query);

      return { notifications, total };
    } catch (error) {
      console.error('Error fetching filtered notifications:', error);
      throw error;
    }
  }

  /**
   * Get notifications filtered by status
   * @param {String} adminId - Admin ID
   * @param {String} status - 'read' or 'unread'
   * @param {Number} limit - Limit results
   * @param {Number} skip - Skip results
   */
  static async getNotificationsByStatus(adminId, status, limit = 50, skip = 0) {
    try {
      const query = { admin: adminId };

      if (status === 'read') {
        query.read = true;
      } else if (status === 'unread') {
        query.read = false;
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .lean();

      const total = await Notification.countDocuments(query);

      return { notifications, total };
    } catch (error) {
      console.error('Error fetching notifications by status:', error);
      throw error;
    }
  }

  /**
   * Get notifications filtered by type
   * @param {String} adminId - Admin ID
   * @param {String} type - Notification type filter: 'orders', 'refunds', 'customers', 'messages', 'stock'
   * @param {Number} limit - Limit results
   * @param {Number} skip - Skip results
   */
  static async getNotificationsByType(adminId, type, limit = 50, skip = 0) {
    try {
      const query = { admin: adminId };

      // Map user-friendly type names to actual notification types
      switch (type) {
        case 'orders':
          query.type = { $in: ['NEW_ORDER', 'ORDER_CANCELLED', 'SALE'] };
          break;
        case 'refunds':
          query.type = 'REFUND_REQUEST';
          break;
        case 'customers':
          query.type = 'NEW_CUSTOMER';
          break;
        case 'messages':
          query.type = 'CONTACT_MESSAGE';
          break;
        case 'stock':
          query.type = { $in: ['LOW_STOCK', 'OUT_OF_STOCK'] };
          break;
        default:
          // No type filter
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .lean();

      const total = await Notification.countDocuments(query);

      return { notifications, total };
    } catch (error) {
      console.error('Error fetching notifications by type:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
