/**
 * User Notification Service
 * Creates notifications for customers (users) — separate from admin notifications.
 */

const UserNotification = require('../models/UserNotification');
const User = require('../models/User');

class UserNotificationService {
  // ─── Core ──────────────────────────────────────────────────────────────────

  static async create(userId, data) {
    try {
      return await UserNotification.create({ userId, ...data });
    } catch (err) {
      console.error('[UserNotificationService] create error:', err.message);
    }
  }

  // ─── Order Notifications ───────────────────────────────────────────────────

  static async notifyOrderPlaced(userId, { orderId, orderNumber, amount }) {
    return this.create(userId, {
      type: 'order',
      title: 'Order Placed Successfully',
      message: `Your order #${orderNumber} for ₹${amount} has been placed successfully.`,
      relatedOrderId: orderId,
      actionUrl: `/orders`,
    });
  }

  static async notifyOrderConfirmed(userId, { orderId, orderNumber }) {
    return this.create(userId, {
      type: 'order',
      title: 'Order Confirmed',
      message: `Your order #${orderNumber} has been confirmed by our team.`,
      relatedOrderId: orderId,
      actionUrl: `/orders`,
    });
  }

  static async notifyOrderShipped(userId, { orderId, orderNumber }) {
    return this.create(userId, {
      type: 'order',
      title: 'Order Shipped',
      message: `Your order #${orderNumber} has been shipped and is on its way!`,
      relatedOrderId: orderId,
      actionUrl: `/orders`,
    });
  }

  static async notifyOrderDelivered(userId, { orderId, orderNumber }) {
    return this.create(userId, {
      type: 'order',
      title: 'Order Delivered',
      message: `Your order #${orderNumber} has been delivered successfully.`,
      relatedOrderId: orderId,
      actionUrl: `/orders`,
    });
  }

  static async notifyOrderCancelled(userId, { orderId, orderNumber }) {
    return this.create(userId, {
      type: 'order',
      title: 'Order Cancelled',
      message: `Your order #${orderNumber} has been cancelled.`,
      relatedOrderId: orderId,
      actionUrl: `/orders`,
    });
  }

  static async notifyOrderRejected(userId, { orderId, orderNumber }) {
    return this.create(userId, {
      type: 'order',
      title: 'Order Rejected',
      message: `Your order #${orderNumber} has been rejected by our team. Please contact support for details.`,
      relatedOrderId: orderId,
      actionUrl: `/orders`,
    });
  }

  // ─── Refund Notifications ──────────────────────────────────────────────────

  static async notifyRefundRequested(userId, { orderId, orderNumber, amount }) {
    return this.create(userId, {
      type: 'refund',
      title: 'Refund Request Received',
      message: `Your refund request for order #${orderNumber} (₹${amount}) has been received.`,
      relatedOrderId: orderId,
      actionUrl: `/orders`,
    });
  }

  static async notifyRefundApproved(userId, { orderId, orderNumber, amount }) {
    return this.create(userId, {
      type: 'refund',
      title: 'Refund Approved',
      message: `Your refund of ₹${amount} for order #${orderNumber} has been approved.`,
      relatedOrderId: orderId,
      actionUrl: `/orders`,
    });
  }

  static async notifyRefundCompleted(userId, { orderId, orderNumber, amount }) {
    return this.create(userId, {
      type: 'refund',
      title: 'Refund Processed',
      message: `Your refund amount of ₹${amount} for order #${orderNumber} has been processed to your account.`,
      relatedOrderId: orderId,
      actionUrl: `/orders`,
    });
  }

  // ─── Payment Notifications ─────────────────────────────────────────────────

  static async notifyPaymentSuccess(userId, { orderId, orderNumber, amount }) {
    return this.create(userId, {
      type: 'payment',
      title: 'Payment Successful',
      message: `Payment of ₹${amount} received successfully for Order #${orderNumber}.`,
      relatedOrderId: orderId,
      actionUrl: `/orders`,
    });
  }

  static async notifyPaymentFailed(userId, { orderId, orderNumber }) {
    return this.create(userId, {
      type: 'payment',
      title: 'Payment Failed',
      message: `Payment failed for Order #${orderNumber}. Please try again.`,
      relatedOrderId: orderId,
      actionUrl: `/orders`,
    });
  }

  // ─── Product Notifications (broadcast to all users) ────────────────────────

  static async broadcastNewProduct(productId, productName) {
    try {
      const users = await User.find({ status: { $ne: 'banned' } }).select('_id').lean();
      const docs = users.map((u) => ({
        userId: u._id,
        type: 'product',
        title: 'New Product Available',
        message: `New product added: ${productName}`,
        relatedProductId: productId,
        actionUrl: `/products/${productId}`,
        isRead: false,
      }));
      if (docs.length > 0) await UserNotification.insertMany(docs, { ordered: false });
    } catch (err) {
      console.error('[UserNotificationService] broadcastNewProduct error:', err.message);
    }
  }

  // ─── Offer / Discount Notifications (broadcast) ───────────────────────────

  static async broadcastOffer(title, message, actionUrl = '/products') {
    try {
      const users = await User.find({ status: { $ne: 'banned' } }).select('_id').lean();
      const docs = users.map((u) => ({
        userId: u._id,
        type: 'offer',
        title,
        message,
        actionUrl,
        isRead: false,
      }));
      if (docs.length > 0) await UserNotification.insertMany(docs, { ordered: false });
    } catch (err) {
      console.error('[UserNotificationService] broadcastOffer error:', err.message);
    }
  }

  // ─── Account Notifications ─────────────────────────────────────────────────

  static async notifyPasswordChanged(userId) {
    return this.create(userId, {
      type: 'account',
      title: 'Password Changed',
      message: 'Your account password has been changed successfully. If this was not you, contact support immediately.',
      actionUrl: '/profile',
    });
  }

  static async notifyProfileUpdated(userId) {
    return this.create(userId, {
      type: 'account',
      title: 'Profile Updated',
      message: 'Your profile information has been updated successfully.',
      actionUrl: '/profile',
    });
  }
}

module.exports = UserNotificationService;
