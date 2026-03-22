const Report = require('../models/Report');
const Order = require('../models/Order');
const User = require('../models/User');
const Review = require('../models/Review');

/**
 * Report Controller
 * 
 * Handles report generation, retrieval, and management
 * Reports are automatically created when orders are placed or payments are completed
 */

/**
 * Create a report (Auto-generated)
 * Called automatically when:
 * 1. Order is placed successfully
 * 2. Payment is completed
 * 
 * @route POST /api/reports/create
 * @access Private (Internal)
 */
exports.createReport = async (req, res) => {
  try {
    const { orderId, userId, reportType = 'Order Report' } = req.body;

    // Validate input
    if (!orderId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and User ID are required'
      });
    }

    // Check if report already exists for this order
    const existingReport = await Report.findOne({ order: orderId });
    if (existingReport) {
      return res.status(200).json({
        success: true,
        message: 'Report already exists',
        report: existingReport
      });
    }

    // Fetch order details
    const order = await Order.findById(orderId).populate('user').populate('items.product');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Fetch user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prepare items data
    const reportItems = order.items.map(item => ({
      product: item.product._id,
      productName: item.product.name,
      productPrice: item.price,
      quantity: item.quantity,
      itemTotal: item.price * item.quantity
    }));

    // Create report
    const reportData = {
      user: userId,
      userName: user.name,
      userEmail: user.email,
      order: orderId,
      orderNumber: order.orderNumber || `ORD-${orderId}`,
      orderStatus: order.orderStatus,
      orderDate: order.createdAt,
      items: reportItems,
      totalAmount: order.totalAmount || order.totalPrice || 0,
      paymentMethod: order.paymentMethod || 'pending',
      transactionId: order.transactionId || null,
      paymentStatus: order.orderStatus === 'cancelled' ? 'refunded' : 'completed',
      paymentDate: order.updatedAt,
      shippingAddress: order.shippingAddress || {},
      reportType,
      reportStatus: 'Generated'
    };

    const newReport = await Report.create(reportData);

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      report: newReport
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all reports (Admin only)
 * @route GET /api/reports
 * @access Private/Admin
 */
exports.getAllReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, user, status, type, startDate, endDate } = req.query;

    // Build filter query
    const filters = {};
    if (user) filters.user = user;
    if (status) filters.reportStatus = status;
    if (type) filters.reportType = type;
    if (startDate || endDate) {
      filters.reportGeneratedAt = {};
      if (startDate) filters.reportGeneratedAt.$gte = new Date(startDate);
      if (endDate) filters.reportGeneratedAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const reports = await Report.find(filters)
      .populate('user', 'name email phone')
      .populate('order', 'orderNumber orderStatus')
      .sort({ reportGeneratedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalReports = await Report.countDocuments(filters);

    res.status(200).json({
      success: true,
      count: reports.length,
      totalReports,
      totalPages: Math.ceil(totalReports / limit),
      currentPage: parseInt(page),
      reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get user's reports (User can only see their own)
 * @route GET /api/reports/user/:userId
 * @access Private/User
 */
exports.getUserReports = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status, type, startDate, endDate } = req.query;

    // Verify user is accessing their own reports or is admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own reports'
      });
    }

    // Build filter query
    const filters = { user: userId };
    if (status) filters.reportStatus = status;
    if (type) filters.reportType = type;
    if (startDate || endDate) {
      filters.reportGeneratedAt = {};
      if (startDate) filters.reportGeneratedAt.$gte = new Date(startDate);
      if (endDate) filters.reportGeneratedAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const reports = await Report.find(filters)
      .populate('order', 'orderNumber orderStatus')
      .sort({ reportGeneratedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalReports = await Report.countDocuments(filters);

    res.status(200).json({
      success: true,
      count: reports.length,
      totalReports,
      totalPages: Math.ceil(totalReports / limit),
      currentPage: parseInt(page),
      reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get single report details
 * @route GET /api/reports/:reportId
 * @access Private
 */
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId)
      .populate('user', 'name email phone address city state zipCode')
      .populate('order')
      .populate('items.product', 'name description');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check access: user can only see their own reports
    if (req.user.id !== report.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this report'
      });
    }

    res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const normalizePaymentMethod = (method) => {
  if (!method) return 'N/A';
  const normalized = method.toString().toLowerCase();
  if (normalized.includes('cod')) return 'COD';
  if (normalized.includes('upi')) return 'UPI';
  if (normalized.includes('card')) return 'Card';
  if (normalized.includes('cash')) return 'COD';
  return method;
};

const normalizePaymentStatus = (status) => {
  if (!status) return 'Pending';
  const normalized = status.toString().toLowerCase();
  if (normalized === 'paid' || normalized === 'completed') return 'Paid';
  if (normalized === 'failed' || normalized === 'refunded') return 'Failed';
  return 'Pending';
};

const normalizeOrderStatus = (status) => {
  if (!status) return 'Pending';
  const normalized = status.toString().toLowerCase();
  if (normalized === 'delivered') return 'Delivered';
  if (normalized === 'cancelled') return 'Cancelled';
  return 'Pending';
};

const buildAddressLine = (address) => {
  if (!address) return 'N/A';
  const street = address.street || address.address;
  const parts = [street, address.city, address.state, address.zipCode, address.country].filter(Boolean);
  return parts.length ? parts.join(', ') : 'N/A';
};

const getAggregatedStatus = (statuses = []) => {
  if (statuses.includes('Downloaded')) return 'Downloaded';
  if (statuses.includes('Generated')) return 'Generated';
  if (statuses.includes('Archived')) return 'Archived';
  return 'Generated';
};

const buildReportData = (order, user, reportType = 'Order Report') => {
  const reportItems = order.items.map(item => ({
    product: item.product?._id || item.product,
    productName: item.product?.name || item.name,
    productPrice: item.price,
    quantity: item.quantity,
    itemTotal: item.price * item.quantity
  }));

  return {
    user: user._id,
    userName: user.name,
    userEmail: user.email,
    order: order._id,
    orderNumber: order.orderNumber || `ORD-${order._id}`,
    orderStatus: order.orderStatus,
    orderDate: order.createdAt,
    items: reportItems,
    totalAmount: order.totalAmount || 0,
    paymentMethod: order.paymentMethod || 'pending',
    transactionId: order.transactionId || null,
    paymentStatus: order.paymentStatus || 'pending',
    paymentDate: order.updatedAt,
    shippingAddress: order.shippingAddress || {},
    reportType,
    reportStatus: 'Generated'
  };
};

/**
 * Get customer-wise reports (Admin only)
 * @route GET /api/reports/customers
 * @access Private/Admin
 */
exports.getCustomerReports = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      searchUser,
      reportType,
      reportStatus,
      startDate,
      endDate,
      paymentStatus,
      orderStatus
    } = req.query;

    const filters = {};
    if (searchUser) filters.userEmail = { $regex: searchUser, $options: 'i' };
    if (reportType) filters.reportType = reportType;
    if (reportStatus) filters.reportStatus = reportStatus;
    if (paymentStatus) {
      if (paymentStatus === 'paid') {
        filters.paymentStatus = { $in: ['paid', 'completed'] };
      } else if (paymentStatus === 'failed') {
        filters.paymentStatus = { $in: ['failed', 'refunded'] };
      } else {
        filters.paymentStatus = paymentStatus;
      }
    }
    if (orderStatus) filters.orderStatus = orderStatus;
    if (startDate || endDate) {
      filters.orderDate = {};
      if (startDate) filters.orderDate.$gte = new Date(startDate);
      if (endDate) filters.orderDate.$lte = new Date(endDate);
    }

    const reports = await Report.find(filters)
      .populate('user', 'name email phone address createdAt')
      .sort({ orderDate: -1 });

    const grouped = new Map();
    reports.forEach(report => {
      const userId = report.user?._id?.toString() || report.user?.toString();
      if (!userId) return;

      if (!grouped.has(userId)) {
        grouped.set(userId, {
          customerId: userId,
          customerDetails: {
            name: report.user?.name || report.userName,
            email: report.user?.email || report.userEmail,
            phone: report.user?.phone || report.shippingAddress?.phone || 'N/A',
            address: buildAddressLine(report.user?.address || report.shippingAddress),
            accountCreatedAt: report.user?.createdAt || null
          },
          totalOrdersCount: 0,
          totalAmountSpent: 0,
          lastOrderDate: report.orderDate,
          reportStatus: report.reportStatus || 'Generated',
          downloadCount: 0,
          reportGeneratedAt: report.reportGeneratedAt
        });
      }

      const entry = grouped.get(userId);
      entry.totalOrdersCount += 1;
      entry.totalAmountSpent += report.totalAmount || 0;
      entry.lastOrderDate = entry.lastOrderDate && entry.lastOrderDate > report.orderDate
        ? entry.lastOrderDate
        : report.orderDate;
      entry.downloadCount += report.downloadCount || 0;
      entry.reportGeneratedAt = entry.reportGeneratedAt && entry.reportGeneratedAt > report.reportGeneratedAt
        ? entry.reportGeneratedAt
        : report.reportGeneratedAt;
      entry.reportStatus = getAggregatedStatus([entry.reportStatus, report.reportStatus]);
    });

    const customerReports = Array.from(grouped.values());
    const totalReports = customerReports.length;
    const totalPages = Math.ceil(totalReports / limit);
    const startIndex = (page - 1) * limit;
    const paginated = customerReports.slice(startIndex, startIndex + parseInt(limit));

    res.status(200).json({
      success: true,
      reports: paginated,
      totalReports,
      totalPages,
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get single customer report details (Admin only)
 * @route GET /api/reports/customers/:customerId
 * @access Private/Admin
 */
exports.getCustomerReportById = async (req, res) => {
  try {
    const { customerId } = req.params;
    const reports = await Report.find({ user: customerId })
      .populate('user', 'name email phone address createdAt')
      .sort({ orderDate: -1 });

    if (!reports.length) {
      return res.status(404).json({
        success: false,
        message: 'Customer report not found'
      });
    }

    const user = reports[0].user;
    const orders = reports.map(report => ({
      orderId: report.order?._id || report.order,
      orderNumber: report.orderNumber || 'N/A',
      orderDate: report.orderDate,
      orderStatus: normalizeOrderStatus(report.orderStatus),
      products: report.items?.map(item => ({
        name: item.productName,
        quantity: item.quantity,
        price: item.productPrice,
        total: item.itemTotal
      })) || [],
      totalAmount: report.totalAmount || 0
    }));

    const payments = reports.map(report => ({
      orderId: report.order?._id || report.order,
      paymentMethod: normalizePaymentMethod(report.paymentMethod),
      paymentStatus: normalizePaymentStatus(report.paymentStatus),
      transactionId: report.transactionId,
      paymentDate: report.paymentDate,
      invoiceNumber: report.orderNumber ? `INV-${report.orderNumber}` : 'N/A'
    }));

    const reviews = await Review.find({ user: customerId })
      .populate('product', 'name')
      .sort({ createdAt: -1 });

    const totalAmountSpent = reports.reduce((sum, report) => sum + (report.totalAmount || 0), 0);
    const lastOrderDate = reports.reduce((latest, report) => {
      if (!latest) return report.orderDate;
      return latest > report.orderDate ? latest : report.orderDate;
    }, null);
    const reportStatus = getAggregatedStatus(reports.map(r => r.reportStatus));
    const downloadCount = reports.reduce((sum, report) => sum + (report.downloadCount || 0), 0);
    const reportGeneratedAt = reports.reduce((latest, report) => {
      if (!latest) return report.reportGeneratedAt;
      return latest > report.reportGeneratedAt ? latest : report.reportGeneratedAt;
    }, null);

    res.status(200).json({
      success: true,
      data: {
        customerId,
        customerDetails: {
          name: user?.name || reports[0].userName,
          email: user?.email || reports[0].userEmail,
          mobile: user?.phone || reports[0].shippingAddress?.phone || 'N/A',
          address: buildAddressLine(user?.address || reports[0].shippingAddress),
          accountCreatedAt: user?.createdAt || null,
          totalOrdersCount: reports.length,
          totalAmountSpent,
          lastOrderDate
        },
        orders,
        payments,
        reviews: reviews.map(review => ({
          productName: review.product?.name,
          rating: review.rating,
          comment: review.feedback,
          reviewDate: review.createdAt
        })),
        feedback: [],
        meta: {
          generatedAt: reportGeneratedAt,
          generatedBy: req.admin?.name || 'System',
          status: reportStatus,
          downloadCount
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Download customer report (Admin only)
 * @route PUT /api/reports/customers/:customerId/download
 * @access Private/Admin
 */
exports.downloadCustomerReport = async (req, res) => {
  try {
    const { customerId } = req.params;
    await Report.updateMany(
      { user: customerId },
      {
        $inc: { downloadCount: 1 },
        $set: { reportStatus: 'Downloaded', lastDownloadedAt: new Date() }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Customer report download recorded'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete customer reports (Admin only)
 * @route DELETE /api/reports/customers/:customerId
 * @access Private/Admin
 */
exports.deleteCustomerReports = async (req, res) => {
  try {
    const { customerId } = req.params;
    await Report.deleteMany({ user: customerId });
    res.status(200).json({
      success: true,
      message: 'Customer reports deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Regenerate customer report (Admin only)
 * @route POST /api/reports/customers/:customerId/regenerate
 * @access Private/Admin
 */
exports.regenerateCustomerReport = async (req, res) => {
  try {
    const { customerId } = req.params;
    const user = await User.findById(customerId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const orders = await Order.find({ user: customerId }).populate('items.product');
    await Report.deleteMany({ user: customerId });

    const createdReports = [];
    for (const order of orders) {
      const reportData = buildReportData(order, user, 'Order Report');
      const newReport = await Report.create(reportData);
      createdReports.push(newReport);
    }

    res.status(200).json({
      success: true,
      message: 'Customer report regenerated',
      count: createdReports.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Download report (increments download count)
 * @route PUT /api/reports/:reportId/download
 * @access Private
 */
exports.downloadReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check access
    if (req.user.id !== report.user.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to download this report'
      });
    }

    // Update download info
    report.reportStatus = 'Downloaded';
    report.lastDownloadedAt = new Date();
    report.downloadCount += 1;
    await report.save();

    res.status(200).json({
      success: true,
      message: 'Report download recorded',
      report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Generate report for specific order
 * @route POST /api/reports/generate/:orderId
 * @access Private/User
 */
exports.generateReportForOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Fetch order
    const order = await Order.findById(orderId).populate('user');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // User can only generate reports for their own orders
    if (req.user.id !== order.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only generate reports for your own orders'
      });
    }

    // Check if report already exists
    let report = await Report.findOne({ order: orderId });
    if (!report) {
      // Create new report
      report = await exports.createReport({
        body: {
          orderId: orderId,
          userId: req.user.id,
          reportType: 'Invoice'
        }
      }, res);
    }

    res.status(200).json({
      success: true,
      message: 'Report ready for download',
      report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get report statistics (Admin only)
 * @route GET /api/reports/stats/dashboard
 * @access Private/Admin
 */
exports.getReportStats = async (req, res) => {
  try {
    const totalReports = await Report.countDocuments();
    const generatedReports = await Report.countDocuments({ reportStatus: 'Generated' });
    const downloadedReports = await Report.countDocuments({ reportStatus: 'Downloaded' });
    const totalDownloads = await Report.aggregate([
      {
        $group: {
          _id: null,
          totalDownloads: { $sum: '$downloadCount' }
        }
      }
    ]);

    const reportsThisMonth = await Report.countDocuments({
      reportGeneratedAt: {
        $gte: new Date(new Date().setDate(1)),
        $lte: new Date()
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalReports,
        generated: generatedReports,
        downloaded: downloadedReports,
        downloaded_total: totalDownloads[0]?.totalDownloads || 0,
        thisMonth: reportsThisMonth
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


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
      // Filter by status field
      if (req.query.accountStatus === 'active') {
        filter.status = 'ACTIVE';
      } else if (req.query.accountStatus === 'blocked') {
        filter.status = 'BLOCKED';
      } else if (req.query.accountStatus === 'suspended') {
        filter.status = 'SUSPENDED';
      } else if (req.query.accountStatus === 'inactive') {
        filter.status = 'INACTIVE';
      }
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
          statusReason: 1,
          statusChangedAt: 1,
          statusChangedBy: 1,
          suspensionUntil: 1,
          lastLoginAt: 1,
          loginAttempts: 1,
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

    // Calculate actual status for each user and apply INACTIVE filter
    const usersWithActualStatus = await Promise.all(users.map(async (userData) => {
      const user = await User.findById(userData._id);
      if (!user) return null;
      
      const actualStatus = user.getActualStatus();
      
      return {
        ...userData,
        actualStatus: actualStatus.status,
        actualStatusReason: actualStatus.reason,
        actualStatusChangedAt: actualStatus.changedAt,
        actualStatusChangedBy: actualStatus.changedBy,
        actualSuspensionUntil: actualStatus.suspensionUntil
      };
    }));

    let filteredUsers = usersWithActualStatus.filter(u => u !== null);

    // Filter by INACTIVE status if requested
    if (req.query.accountStatus === 'inactive') {
      filteredUsers = filteredUsers.filter(u => u.actualStatus === 'INACTIVE');
    }

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
 * Get comprehensive user report data for admin
 * Fetches user details, orders, payments, invoices, and reviews
 * 
 * @route GET /api/admin/reports/user/:userId
 * @access Private/Admin
 */
exports.getUserFullReport = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Fetch user details
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Fetch all orders for this user
    const orders = await Order.find({ user: userId })
      .populate('items.product', 'name price images')
      .sort({ createdAt: -1 });

    // Fetch all reviews by this user
    const reviews = await Review.find({ user: userId })
      .populate('product', 'name images')
      .sort({ createdAt: -1 });

    // Prepare response data
    const responseData = {
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        accountStatus: user.accountStatus,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        addresses: user.addresses || []
      },
      orders: orders.map(order => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        items: order.items,
        totalAmount: order.totalAmount || order.totalPrice,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        deliveredAt: order.deliveredAt
      })),
      reviews: reviews.map(review => ({
        _id: review._id,
        product: review.product,
        rating: review.rating,
        comment: review.comment,
        status: review.status,
        createdAt: review.createdAt
      })),
      summary: {
        totalOrders: orders.length,
        totalSpent: orders.reduce((sum, order) => sum + (order.totalAmount || order.totalPrice || 0), 0),
        totalReviews: reviews.length,
        deliveredOrders: orders.filter(o => o.orderStatus === 'delivered').length,
        pendingOrders: orders.filter(o => o.orderStatus === 'pending').length,
        cancelledOrders: orders.filter(o => o.orderStatus === 'cancelled').length
      }
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching user full report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user report data',
      error: error.message
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
