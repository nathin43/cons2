const User = require('../models/User');
const Order = require('../models/Order');
const Review = require('../models/Review');

/**
 * Get all users with their report data for admin reports page
 * 
 * @route GET /api/reports/users
 * @access Private/Admin
 */
exports.getUsersForReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = {};
    
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    if (req.query.accountStatus) {
      filter.status = req.query.accountStatus;
    }

    // Get users with aggregation for order stats
    const users = await User.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'orders'
        }
      },
      {
        $addFields: {
          totalOrders: { $size: '$orders' },
          totalAmountSpent: { $sum: '$orders.totalAmount' },
          lastOrder: { $max: '$orders.createdAt' }
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          status: 1,
          totalOrders: 1,
          totalAmountSpent: 1,
          lastOrder: 1,
          createdAt: 1
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Apply additional filters after aggregation
    let filteredUsers = users;

    if (req.query.minOrders || req.query.maxOrders) {
      const minOrders = parseInt(req.query.minOrders) || 0;
      const maxOrders = parseInt(req.query.maxOrders) || Infinity;
      filteredUsers = filteredUsers.filter(
        user => user.totalOrders >= minOrders && user.totalOrders <= maxOrders
      );
    }

    if (req.query.minAmount || req.query.maxAmount) {
      const minAmount = parseFloat(req.query.minAmount) || 0;
      const maxAmount = parseFloat(req.query.maxAmount) || Infinity;
      filteredUsers = filteredUsers.filter(
        user => user.totalAmountSpent >= minAmount && user.totalAmountSpent <= maxAmount
      );
    }

    if (req.query.dateFrom || req.query.dateTo) {
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : new Date(0);
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : new Date();
      filteredUsers = filteredUsers.filter(
        user => user.lastOrder && user.lastOrder >= dateFrom && user.lastOrder <= dateTo
      );
    }

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json({
      success: true,
      users: filteredUsers,
      currentPage: page,
      totalPages,
      totalUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Export users report to Excel
 * 
 * @route GET /api/reports/export/excel
 * @access Private/Admin
 */
exports.exportUsersExcel = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Excel export functionality - To be implemented with exceljs library'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get payments by user ID (Admin only) - Stub
 * 
 * @route GET /api/payments/user/:userId
 * @access Private/Admin
 */
exports.getPaymentsByUserId = async (req, res) => {
  try {
    // Payments extracted from orders
    const orders = await Order.find({ user: req.params.userId })
      .select('_id orderNumber createdAt paymentMethod totalAmount paymentStatus paymentDetails')
      .sort('-createdAt');

    const payments = orders.map(order => ({
      _id: order._id,
      orderId: order._id,
      createdAt: order.createdAt,
      method: order.paymentMethod || 'N/A',
      amount: order.totalAmount,
      status: order.paymentStatus || 'pending',
      refundAmount: null
    }));

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get invoices by user ID (Admin only) - Stub
 * 
 * @route GET /api/invoices/user/:userId
 * @access Private/Admin
 */
exports.getInvoicesByUserId = async (req, res) => {
  try {
    // Invoices extracted from orders
    const orders = await Order.find({ user: req.params.userId })
      .select('_id orderNumber createdAt totalAmount')
      .sort('-createdAt');

    const invoices = orders.map((order, index) => ({
      _id: order._id,
      invoiceNumber: order.orderNumber || `INV-${order._id.toString().slice(-8)}`,
      orderId: order._id,
      date: order.createdAt,
      tax: (order.totalAmount * 0.18).toFixed(2), // 18% GST
      amount: order.totalAmount
    }));

    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get reviews by user ID (Admin only)
 * 
 * @route GET /api/reviews/user/:userId
 * @access Private/Admin
 */
exports.getReviewsByUserId = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.params.userId })
      .populate('product', 'name')
      .sort('-createdAt');

    const formattedReviews = reviews.map(review => ({
      _id: review._id,
      productName: review.product?.name || 'Unknown Product',
      product: review.product,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      status: review.status || 'pending'
    }));

    res.status(200).json(formattedReviews);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
