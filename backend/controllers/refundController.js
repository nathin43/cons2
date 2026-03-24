const Refund = require('../models/Refund');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const User = require('../models/User');
const RefundMessage = require('../models/RefundMessage');
const NotificationService = require('../services/notificationService');
const UserNotificationService = require('../services/userNotificationService');
const Admin = require('../models/Admin');

const normalizeRefundStatus = (status) => {
  const raw = String(status || '').toLowerCase();
  if (raw === 'approved' || raw === 'completed') return 'approved';
  if (raw === 'rejected') return 'rejected';
  return 'pending';
};

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
      orderNumber: order.orderNumber,
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone: req.user.phone || null,
      refundType: 'return-refund',
      productSummary: Array.isArray(order.items) && order.items[0]?.name
        ? order.items[0].name
        : null,
      paymentMethod: order.paymentMethod || null,
      paymentStatus: order.paymentStatus || null,
      amount: order.totalAmount,
      reason,
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
 * Get all refunds (Admin)
 * @route GET /api/refunds
 */
exports.getAllRefunds = async (req, res) => {
  try {
    const { status, type } = req.query;
    const query = {};
    if (status && status !== 'all') query.refundStatus = status;
    if (type && type !== 'all') query.refundType = type;

    const refunds = await Refund.find(query)
      .populate('user', 'name email phone')
      .populate('order', 'orderNumber totalAmount orderStatus paymentMethod paymentStatus items')
      .populate('processedBy', 'name')
      .sort('-createdAt')
      .lean();

    const refundIds = refunds.map((entry) => String(entry._id));
    const lastMessageByRefundId = new Map();
    if (refundIds.length > 0) {
      const allMessages = await RefundMessage.find({ refundId: { $in: refundIds } })
        .sort({ createdAt: 1 })
        .lean();
      allMessages.forEach((message) => {
        lastMessageByRefundId.set(String(message.refundId || ''), message);
      });
    }

    const formattedRefunds = refunds.map((entry) => {
      const orderNumber = entry.orderNumber || entry.order?.orderNumber || null;
      const customerName = entry.customerName || entry.user?.name || 'Customer';
      const customerEmail = entry.customerEmail || entry.user?.email || null;
      const typeLabel = entry.refundType === 'cancellation' ? 'Cancellation' : 'Return Refund';
      const lastMessage = lastMessageByRefundId.get(String(entry._id));
      const firstProductName = Array.isArray(entry.order?.items) && entry.order.items[0]?.name
        ? entry.order.items[0].name
        : null;

      return {
        ...entry,
        refundId: String(entry._id),
        orderId: orderNumber,
        customerName,
        customerEmail,
        customerPhone: entry.customerPhone || entry.user?.phone || null,
        typeLabel,
        product: entry.productSummary || firstProductName || 'N/A',
        paymentMethod: entry.paymentMethod || entry.order?.paymentMethod || null,
        paymentStatus: entry.paymentStatus || entry.order?.paymentStatus || null,
        amount: typeof entry.amount === 'number' ? entry.amount : (entry.order?.totalAmount || 0),
        refundStatus: normalizeRefundStatus(entry.refundStatus),
        status: normalizeRefundStatus(entry.refundStatus),
        lastMessage: lastMessage?.message || null,
        lastMessageSender: lastMessage?.sender || null,
        lastMessageAt: lastMessage?.createdAt || null,
      };
    });

    res.status(200).json({ success: true, count: formattedRefunds.length, refunds: formattedRefunds });
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
      .populate('order', 'orderNumber totalAmount items shippingAddress orderStatus paymentMethod')
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

    const allowedStatuses = ['pending', 'approved', 'rejected'];
    if (!allowedStatuses.includes(refundStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid refund status. Allowed: pending, approved, rejected.',
      });
    }

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
 * Get user's refunds
 * @route GET /api/refunds/my
 */
exports.getMyRefunds = async (req, res) => {
  try {
    const refunds = await Refund.find({ user: req.user.id })
      .populate('order', 'orderNumber totalAmount orderStatus')
      .sort('-createdAt')
      .lean();

    const refundIds = refunds.map((entry) => String(entry._id));
    const messageBuckets = new Map();

    if (refundIds.length > 0) {
      const messages = await RefundMessage.find({ refundId: { $in: refundIds } })
        .sort({ createdAt: 1 })
        .lean();
      messages.forEach((message) => {
        const key = String(message.refundId || '');
        if (!messageBuckets.has(key)) messageBuckets.set(key, []);
        messageBuckets.get(key).push(message);
      });
    }

    const formattedRefunds = refunds.map((entry) => {
      const messages = messageBuckets.get(String(entry._id)) || [];
      const latest = messages.length > 0 ? messages[messages.length - 1] : null;
      return {
        ...entry,
        refundId: String(entry._id),
        orderId: entry.orderNumber || entry.order?.orderNumber || null,
        refundStatus: normalizeRefundStatus(entry.refundStatus),
        messages,
        lastMessage: latest?.message || null,
        lastMessageSender: latest?.sender || null,
        lastMessageAt: latest?.createdAt || null,
      };
    });

    res.status(200).json({ success: true, count: formattedRefunds.length, refunds: formattedRefunds });
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

const getRefundForUser = async (refundId, userId) => {
  const user = await User.findById(userId).select('email').lean();
  if (!user) return null;

  const refund = await Refund.findById(refundId)
    .populate('user', 'email')
    .lean();
  if (!refund) return null;

  const byUserId = refund.user && String(refund.user._id || refund.user) === String(userId);
  const byEmail = String(refund.customerEmail || '').toLowerCase() === String(user.email || '').toLowerCase();
  return (byUserId || byEmail) ? refund : null;
};

/**
 * Get refund chat messages for admin
 * GET /api/refunds/:id/messages/admin
 */
exports.getRefundMessagesAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const refund = await Refund.findById(id).lean();
    if (!refund) {
      return res.status(404).json({ success: false, message: 'Refund request not found.' });
    }

    const messages = await RefundMessage.find({ refundId: id }).sort({ createdAt: 1 }).lean();
    return res.status(200).json({ success: true, refund, messages, status: normalizeRefundStatus(refund.refundStatus) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get refund chat messages for user
 * GET /api/refunds/:id/messages
 */
exports.getRefundMessagesUser = async (req, res) => {
  try {
    const { id } = req.params;
    const refund = await getRefundForUser(id, req.user.id);
    if (!refund) {
      return res.status(404).json({ success: false, message: 'Refund conversation not found.' });
    }

    const messages = await RefundMessage.find({ refundId: id }).sort({ createdAt: 1 }).lean();
    return res.status(200).json({ success: true, refund, messages, status: normalizeRefundStatus(refund.refundStatus) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin sends chat message in refund conversation
 * POST /api/refunds/:id/messages/admin
 */
exports.addRefundMessageAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, newStatus } = req.body || {};
    const trimmed = String(message || '').trim();

    if (!trimmed) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    const refund = await Refund.findById(id);
    if (!refund) {
      return res.status(404).json({ success: false, message: 'Refund request not found.' });
    }

    const chatMessage = await RefundMessage.create({
      refundId: id,
      sender: 'ADMIN',
      message: trimmed,
    });

    if (newStatus && ['pending', 'approved', 'rejected'].includes(newStatus)) {
      refund.refundStatus = newStatus;
    }
    refund.adminNotes = trimmed;
    refund.processedBy = req.admin._id || req.admin.id;
    refund.processedAt = new Date();
    await refund.save();

    return res.status(201).json({
      success: true,
      chatMessage,
      status: normalizeRefundStatus(refund.refundStatus),
      message: 'Reply sent successfully.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * User sends chat message in refund conversation
 * POST /api/refunds/:id/messages
 */
exports.addRefundMessageUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body || {};
    const trimmed = String(message || '').trim();

    if (!trimmed) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    const refund = await getRefundForUser(id, req.user.id);
    if (!refund) {
      return res.status(404).json({ success: false, message: 'Refund conversation not found.' });
    }

    const chatMessage = await RefundMessage.create({
      refundId: id,
      sender: 'USER',
      message: trimmed,
    });

    return res.status(201).json({ success: true, chatMessage });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
