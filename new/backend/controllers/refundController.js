const Refund = require('../models/Refund');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');
const UserNotificationService = require('../services/userNotificationService');
const Admin = require('../models/Admin');

/**
 * Create refund request (User)
 * @route POST /api/refunds
 */
exports.createRefund = async (req, res) => {
  try {
    const { orderId, reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!['delivered', 'confirmed', 'shipped'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Refund can only be requested for delivered, confirmed, or shipped orders',
      });
    }

    // Check for existing refund on this order
    const existing = await Refund.findOne({ order: orderId, refundStatus: { $nin: ['rejected'] } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A refund request already exists for this order' });
    }

    const refund = await Refund.create({
      order: orderId,
      user: req.user.id,
      amount: order.totalAmount,
      reason,
      paymentMethod: order.paymentMethod || null,
      source: 'manual',
    });

    // Notify admin
    try {
      const mainAdmin = await Admin.findOne({ role: 'MAIN_ADMIN' }).select('_id').lean();
      if (mainAdmin) {
        await NotificationService.notifyRefundRequest(mainAdmin._id, {
          refundId: refund._id,
          orderId: order._id,
          orderNumber: order.orderNumber,
          amount: order.totalAmount,
        });
      }
    } catch (e) {
      console.error('Refund notification error (non-fatal):', e.message);
    }

    // Notify user: refund request received
    try {
      await UserNotificationService.notifyRefundRequested(req.user.id, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: order.totalAmount,
      });
    } catch (err) {
      console.error('User refund-requested notification error (non-fatal):', err.message);
    }

    res.status(201).json({ success: true, message: 'Refund request submitted', refund });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all refunds (Admin) — includes order-cancellation refunds
 * @route GET /api/refunds
 */
exports.getAllRefunds = async (req, res) => {
  try {
    const { status, source } = req.query;
    const query = {};
    if (status && status !== 'all') query.refundStatus = status;
    if (source && source !== 'all') query.source = source;

    const refunds = await Refund.find(query)
      .populate('user', 'name email phone')
      .populate('order', 'orderNumber totalAmount orderStatus paymentMethod paymentStatus')
      .populate('processedBy', 'name')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: refunds.length, refunds });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get single refund (Admin)
 * @route GET /api/refunds/:id
 */
exports.getRefundById = async (req, res) => {
  try {
    const refund = await Refund.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('order', 'orderNumber totalAmount items shippingAddress orderStatus paymentMethod paymentStatus')
      .populate('processedBy', 'name');

    if (!refund) {
      return res.status(404).json({ success: false, message: 'Refund not found' });
    }

    res.status(200).json({ success: true, refund });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update refund status (Admin)
 * @route PUT /api/refunds/:id
 */
exports.updateRefundStatus = async (req, res) => {
  try {
    const { refundStatus, adminNotes } = req.body;

    const refund = await Refund.findById(req.params.id);
    if (!refund) {
      return res.status(404).json({ success: false, message: 'Refund not found' });
    }

    refund.refundStatus = refundStatus;
    if (adminNotes) refund.adminNotes = adminNotes;
    refund.processedBy = req.admin._id || req.admin.id;
    refund.processedAt = new Date();

    await refund.save();

    // If approved/completed, update payment status
    if (['approved', 'completed'].includes(refundStatus)) {
      await Payment.findOneAndUpdate(
        { order: refund.order },
        { paymentStatus: 'refunded' }
      );
    }

    // Notify user of refund status change
    try {
      const order = await Order.findById(refund.order).select('orderNumber totalAmount').lean();
      const orderData = {
        orderId: refund.order,
        orderNumber: order?.orderNumber || '',
        amount: order?.totalAmount || refund.amount,
      };
      if (refundStatus === 'approved') {
        await UserNotificationService.notifyRefundApproved(refund.user.toString(), orderData);
      } else if (refundStatus === 'completed') {
        await UserNotificationService.notifyRefundCompleted(refund.user.toString(), orderData);
      }
    } catch (err) {
      console.error('User refund-status notification error (non-fatal):', err.message);
    }

    res.status(200).json({ success: true, message: 'Refund status updated', refund });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin sends reply message to user for a refund request
 * @route POST /api/refunds/:id/reply
 */
exports.replyToRefund = async (req, res) => {
  try {
    const { replyMessage, newStatus } = req.body;

    if (!replyMessage || !replyMessage.trim()) {
      return res.status(400).json({ success: false, message: 'Reply message is required' });
    }

    const refund = await Refund.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('order', 'orderNumber');

    if (!refund) {
      return res.status(404).json({ success: false, message: 'Refund not found' });
    }

    refund.adminReply = replyMessage.trim();
    refund.adminReplyAt = new Date();
    if (newStatus) {
      refund.refundStatus = newStatus;
      refund.processedBy = req.admin._id || req.admin.id;
      refund.processedAt = new Date();
    }

    await refund.save();

    // Return user phone from user model for WhatsApp
    const userPhone = refund.user?.phone || null;

    res.status(200).json({
      success: true,
      message: 'Reply sent successfully',
      refund,
      userPhone,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get user's refunds (including order-cancellation refunds)
 * @route GET /api/refunds/my
 */
exports.getMyRefunds = async (req, res) => {
  try {
    const refunds = await Refund.find({ user: req.user.id })
      .populate('order', 'orderNumber totalAmount orderStatus paymentMethod')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: refunds.length, refunds });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get refund stats (Admin)
 * @route GET /api/refunds/stats
 */
exports.getRefundStats = async (req, res) => {
  try {
    const refunds = await Refund.find().lean();

    const stats = {
      total: refunds.length,
      pending: 0,
      approved: 0,
      processing: 0,
      completed: 0,
      rejected: 0,
      totalRefundAmount: 0,
    };

    for (const r of refunds) {
      stats[r.refundStatus] = (stats[r.refundStatus] || 0) + 1;
      if (['approved', 'processing', 'completed'].includes(r.refundStatus)) {
        stats.totalRefundAmount += r.amount || 0;
      }
    }

    res.status(200).json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
