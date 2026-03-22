const Payment = require('../models/Payment');
const Order = require('../models/Order');

/**
 * Get all payments (Admin)
 * @route GET /api/payments
 */
exports.getAllPayments = async (req, res) => {
  try {
    const { status, method, fromDate, toDate } = req.query;
    const query = {};

    if (status && status !== 'all') query.paymentStatus = status;
    if (method && method !== 'all') query.paymentMethod = method;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const payments = await Payment.find(query)
      .populate('user', 'name email phone')
      .populate('order', 'orderNumber orderStatus totalAmount')
      .sort('-createdAt');

    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    res.status(200).json({
      success: true,
      count: payments.length,
      totalAmount,
      payments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get single payment by ID (Admin)
 * @route GET /api/payments/:id
 */
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('order', 'orderNumber orderStatus items shippingAddress totalAmount');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.status(200).json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get payments by user ID (Admin)
 * @route GET /api/payments/user/:userId
 */
exports.getPaymentsByUserId = async (req, res) => {
  try {
    // First try the Payment collection
    let payments = await Payment.find({ user: req.params.userId })
      .populate('order', 'orderNumber orderStatus')
      .sort('-createdAt');

    // Fallback: if no Payment records yet, derive from orders (backward compat)
    if (payments.length === 0) {
      const orders = await Order.find({ user: req.params.userId })
        .select('_id orderNumber createdAt paymentMethod totalAmount paymentStatus razorpayPaymentId')
        .sort('-createdAt');

      payments = orders.map(order => ({
        _id: order._id,
        order: { _id: order._id, orderNumber: order.orderNumber, orderStatus: order.orderStatus },
        amount: order.totalAmount,
        paymentMethod: order.paymentMethod || 'N/A',
        paymentStatus: order.paymentStatus || 'pending',
        transactionId: order.razorpayPaymentId || null,
        createdAt: order.createdAt,
      }));
    }

    res.status(200).json({ success: true, count: payments.length, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get payments for current user
 * @route GET /api/payments/my
 */
exports.getMyPayments = async (req, res) => {
  try {
    let payments = await Payment.find({ user: req.user.id })
      .populate('order', 'orderNumber orderStatus')
      .sort('-createdAt');

    // Fallback from orders
    if (payments.length === 0) {
      const orders = await Order.find({ user: req.user.id })
        .select('_id orderNumber createdAt paymentMethod totalAmount paymentStatus')
        .sort('-createdAt');

      payments = orders.map(order => ({
        _id: order._id,
        order: { _id: order._id, orderNumber: order.orderNumber },
        amount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus || 'pending',
        createdAt: order.createdAt,
      }));
    }

    res.status(200).json({ success: true, count: payments.length, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get payment stats (Admin dashboard)
 * @route GET /api/payments/stats
 */
exports.getPaymentStats = async (req, res) => {
  try {
    const orders = await Order.find().select('totalAmount paymentStatus paymentMethod').lean();

    const stats = {
      totalPayments: orders.length,
      totalRevenue: 0,
      paid: 0,
      pending: 0,
      failed: 0,
      byMethod: {},
    };

    for (const o of orders) {
      stats.totalRevenue += o.totalAmount || 0;
      if (o.paymentStatus === 'paid') stats.paid++;
      else if (o.paymentStatus === 'failed') stats.failed++;
      else stats.pending++;

      const method = o.paymentMethod || 'Unknown';
      stats.byMethod[method] = (stats.byMethod[method] || 0) + 1;
    }

    res.status(200).json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
