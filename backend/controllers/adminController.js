const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * Get admin dashboard statistics with real-time data
 * @route GET /api/admin/dashboard
 * @access Private/Admin
 */
exports.getDashboard = async (req, res) => {
  try {
    console.log('\n🔍 Dashboard request from admin:', req.admin?.email || 'Unknown');
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Build week/month bounds WITHOUT mutating `now`
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevWeekStart = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() - 7);

    // ========== SALES METRICS ==========
    // Total sales: delivered (COD) + paid online (Razorpay) orders - optimized with aggregation
    const totalSalesResult = await Order.aggregate([
      {
        $match: {
          $or: [{ orderStatus: 'delivered' }, { paymentStatus: 'paid' }]
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    const totalSales = totalSalesResult[0]?.total || 0;
    
    // Current week sales
    const currentWeekSales = await Order.aggregate([
      {
        $match: {
          $or: [{ orderStatus: 'delivered' }, { paymentStatus: 'paid' }],
          createdAt: { $gte: startOfWeek }
        }
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    // Previous week sales
    const prevWeekSales = await Order.aggregate([
      {
        $match: {
          $or: [{ orderStatus: 'delivered' }, { paymentStatus: 'paid' }],
          createdAt: { $gte: prevWeekStart, $lt: startOfWeek }
        }
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const currentSales = currentWeekSales[0]?.total || 0;
    const prevSales = prevWeekSales[0]?.total || 0;
    const salesGrowth = prevSales > 0 ? ((currentSales - prevSales) / prevSales * 100).toFixed(1) : 0;

    // ========== ORDERS METRICS ==========
    const totalOrders = await Order.countDocuments();
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: startOfToday }
    });
    // Mutually exclusive status counts so the donut chart totals correctly
    const pendingOrders = await Order.countDocuments({
      orderStatus: { $in: ['pending', 'confirmed', 'processing'] }
    });
    const shippedOrders = await Order.countDocuments({ orderStatus: 'shipped' });
    // deliveredOrdersCount: only orders with orderStatus 'delivered' (for distribution chart accuracy)
    const deliveredOrdersCount = await Order.countDocuments({ orderStatus: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ orderStatus: { $in: ['cancelled', 'refunded'] } });

    // ========== PRODUCTS METRICS ==========
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ status: 'active' });
    const inactiveProducts = await Product.countDocuments({ status: 'inactive' });
    const outOfStock = await Product.countDocuments({ stock: 0 });
    const lowStockItems = await Product.countDocuments({ stock: { $gt: 0, $lte: 10 } });

    // ========== USERS METRICS ==========
    const totalUsers = await User.countDocuments();
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: startOfToday }
    });

    // ========== SALES TREND DATA (Last 7 days) ==========
    // Build array with local dates FIRST, then query those days to avoid timezone mismatch
    const salesTrendData = [];
    const trendMap = {};
    
    // Build the past 7 days using local dates
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Create local date boundaries WITHOUT timezone conversion
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
      const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
      
      trendMap[dateStr] = { 
        revenue: 0, 
        orders: 0,
        startOfDay,
        endOfDay 
      };
      
      salesTrendData.push({
        date: dateStr,
        day: dayName,
        revenue: 0,
        orders: 0
      });
    }
    
    // Query sales for all 7 days efficiently with .lean() for performance
    const sevenDaysAgo = Object.values(trendMap)[0].startOfDay; // First day's start
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const trendResults = await Order.find({
      $or: [{ orderStatus: 'delivered' }, { paymentStatus: 'paid' }],
      createdAt: { $gte: sevenDaysAgo, $lte: today }
    }).select('createdAt totalAmount').lean();
    
    // Group results by date using local time (client-side grouping ensures correct timezone handling)
    trendResults.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const dateStr = orderDate.toLocaleDateString('en-CA');
      
      if (trendMap[dateStr]) {
        trendMap[dateStr].revenue += order.totalAmount || 0;
        trendMap[dateStr].orders += 1;
      }
    });
    
    // Update salesTrendData with actual values
    salesTrendData.forEach(item => {
      const data = trendMap[item.date];
      item.revenue = data.revenue;
      item.orders = data.orders;
    });

    // ========== RECENT ORDERS ==========
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .populate('items.product', 'name image')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // ========== AVERAGE RATING ==========
    const avgRatingResult = await Product.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$ratings.average' }
        }
      }
    ]);
    
    const avgRating = avgRatingResult[0]?.avgRating ? parseFloat(avgRatingResult[0].avgRating).toFixed(1) : 0;

    console.log('📊 Dashboard Stats Summary:');
    console.log(`  💰 Total Sales: ₹${totalSales}`);
    console.log(`  📦 Orders: ${totalOrders} total, ${todayOrders} today, ${pendingOrders} active`);
    console.log(`  📦 Status: ${pendingOrders} pending, ${shippedOrders} shipped, ${deliveredOrdersCount} delivered`);
    console.log(`  📦 Products: ${totalProducts} total, ${activeProducts} active, ${outOfStock} out of stock`);
    console.log(`  👥 Users: ${totalUsers} total, ${newUsersToday} new today`);
    console.log(`  📈 Sales Growth: ${salesGrowth}%`);
    console.log(`  ⭐ Average Rating: ${avgRating}`);
    console.log(`  📊 Sales Trend Data Points: ${salesTrendData.length}`);
    salesTrendData.forEach((d, i) => {
      console.log(`    Day ${i}: ${d.day} (${d.date}) - ₹${d.revenue} from ${d.orders} orders`);
    });

    res.status(200).json({
      success: true,
      stats: {
        // Sales - ensure all are numbers
        totalSales: Number(totalSales) || 0,
        salesGrowth: Number(salesGrowth) || 0,
        currentWeekSales: Number(currentSales) || 0,
        
        // Orders - ensure all are numbers
        totalOrders: Number(totalOrders) || 0,
        todayOrders: Number(todayOrders) || 0,
        pendingOrders: Number(pendingOrders) || 0,
        shippedOrders: Number(shippedOrders) || 0,
        deliveredOrders: Number(deliveredOrdersCount) || 0,
        cancelledOrders: Number(cancelledOrders) || 0,
        
        // Products - ensure all are numbers
        totalProducts: Number(totalProducts) || 0,
        activeProducts: Number(activeProducts) || 0,
        inactiveProducts: Number(inactiveProducts) || 0,
        outOfStock: Number(outOfStock) || 0,
        lowStockItems: Number(lowStockItems) || 0,
        lowStockCount: Number(lowStockItems) || 0,
        
        // Users - ensure all are numbers
        totalUsers: Number(totalUsers) || 0,
        newUsersToday: Number(newUsersToday) || 0,
        
        // Other - ensure all are numbers
        avgRating: Number(avgRating) || 0
      },
      salesTrendData: salesTrendData.map(item => ({
        date: item.date,
        day: item.day,
        revenue: Number(item.revenue) || 0,
        orders: Number(item.orders) || 0
      })),
      orderDistribution: {
        delivered: Number(deliveredOrdersCount) || 0,
        shipped: Number(shippedOrders) || 0,
        pending: Number(pendingOrders) || 0,
        cancelled: Number(cancelledOrders) || 0
      },
      recentOrders: recentOrders || [],
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get revenue trend data for a specific week (Mon–Sun)
 * @route GET /api/admin/revenue-trend?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * @access Private/Admin
 */
exports.getRevenueTrend = async (req, res) => {
  try {
    const { mode = 'weekly', startDate, endDate, date: dateParam } = req.query;
    const salesTrendData = [];

    // ── DAILY: hourly breakdown for one calendar day ──────────────────────────
    if (mode === 'daily') {
      // Use supplied date or today
      const ref = dateParam
        ? new Date(dateParam + 'T00:00:00')
        : new Date();
      const startOfDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());

      for (let h = 0; h < 24; h++) {
        const slotStart = new Date(startOfDay.getTime() + h * 60 * 60 * 1000);
        const slotEnd   = new Date(slotStart.getTime() + 60 * 60 * 1000);

        const hourSales = await Order.aggregate([
          {
            $match: {
              orderStatus: { $in: ['delivered', 'paid', 'confirmed', 'processing'] },
              createdAt: { $gte: slotStart, $lt: slotEnd }
            }
          },
          { $group: { _id: null, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } }
        ]);

        const label = String(h).padStart(2, '0') + ':00';
        salesTrendData.push({
          date: startOfDay.toLocaleDateString('en-CA'),
          day: label,
          hour: h,
          revenue: hourSales[0]?.revenue || 0,
          orders:  hourSales[0]?.orders  || 0
        });
      }

      return res.status(200).json({ success: true, salesTrendData });
    }

    // ── MONTHLY: one entry per calendar day in the given month ────────────────
    if (mode === 'monthly') {
      const ref = dateParam
        ? new Date(dateParam + 'T00:00:00')
        : new Date();
      const year  = ref.getFullYear();
      const month = ref.getMonth(); // 0-based
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let d = 1; d <= daysInMonth; d++) {
        const startOfDay = new Date(year, month, d);
        const endOfDay   = new Date(year, month, d + 1);

        const daySales = await Order.aggregate([
          {
            $match: {
              orderStatus: { $in: ['delivered', 'paid', 'confirmed', 'processing'] },
              createdAt: { $gte: startOfDay, $lt: endOfDay }
            }
          },
          { $group: { _id: null, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } }
        ]);

        salesTrendData.push({
          date: startOfDay.toLocaleDateString('en-CA'),
          day:  String(d),          // X-axis label: "1", "2", … "31"
          revenue: daySales[0]?.revenue || 0,
          orders:  daySales[0]?.orders  || 0
        });
      }

      return res.status(200).json({ success: true, salesTrendData });
    }

    // ── WEEKLY (default): one entry per day between startDate and endDate ─────
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'startDate and endDate are required for weekly mode' });
    }

    const current = new Date(startDate + 'T00:00:00');
    const end     = new Date(endDate   + 'T00:00:00');

    while (current <= end) {
      const startOfDay = new Date(current.getFullYear(), current.getMonth(), current.getDate());
      const endOfDay   = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      // Use createdAt — consistent with dashboard trend and avoids updatedAt drift
      const dailySales = await Order.aggregate([
        {
          $match: {
            $or: [{ orderStatus: 'delivered' }, { paymentStatus: 'paid' }],
            createdAt: { $gte: startOfDay, $lt: endOfDay }
          }
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 }
          }
        }
      ]);

      // en-CA gives reliable YYYY-MM-DD in local time (avoids UTC midnight drift)
      salesTrendData.push({
        date: startOfDay.toLocaleDateString('en-CA'),
        day:  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][current.getDay()],
        revenue: dailySales[0]?.revenue || 0,
        orders:  dailySales[0]?.orders  || 0
      });

      current.setDate(current.getDate() + 1);
    }

    res.status(200).json({ success: true, salesTrendData });
  } catch (error) {
    console.error('Revenue Trend Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch revenue trend' });
  }
};

/**
 * Get top customers by total products purchased
 * @route GET /api/admin/customers/top-buyers
 * @access Private/Admin
 */
exports.getTopBuyers = async (req, res) => {
  try {
    const topBuyers = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$user',
          totalProducts: { $sum: '$items.quantity' },
          productNames: { $addToSet: '$items.name' },
        },
      },
      { $sort: { totalProducts: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          _id: 1,
          name: '$userInfo.name',
          email: '$userInfo.email',
          totalProducts: 1,
          productNames: 1,
        },
      },
    ]);

    const globalStats = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$user', total: { $sum: '$items.quantity' } } },
      { $group: { _id: null, customersWithOrders: { $sum: 1 }, totalProducts: { $sum: '$total' } } },
    ]);
    const gs = globalStats[0] || { customersWithOrders: 0, totalProducts: 0 };
    const insights = {
      customersWithOrders: gs.customersWithOrders,
      avgProducts: gs.customersWithOrders > 0
        ? parseFloat((gs.totalProducts / gs.customersWithOrders).toFixed(1))
        : 0,
    };

    res.status(200).json({ success: true, topBuyers, insights });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all customers
 * @route GET /api/admin/customers
 * @access Private/Admin
 */
exports.getCustomers = async (req, res) => {
  try {
    const customers = await User.find().select('-password').sort('-createdAt');

    res.status(200).json({
      success: true,
      count: customers.length,
      customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get customer details with orders
 * @route GET /api/admin/customers/:id
 * @access Private/Admin
 */
exports.getCustomer = async (req, res) => {
  try {
    const customer = await User.findById(req.params.id).select('-password');
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const orders = await Order.find({ user: req.params.id })
      .populate('items.product')
      .sort('-createdAt');

    const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || order.totalPrice || 0), 0);

    res.status(200).json({
      success: true,
      customer,
      orders,
      totalOrders: orders.length,
      totalSpent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete customer
 * @route DELETE /api/admin/customers/:id
 * @access Private/Admin
 */
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await User.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    await customer.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Check user data consistency across all modules
 * @route GET /api/admin/verify/data-consistency
 * @access Private/Admin
 */
exports.checkDataConsistency = async (req, res) => {
  try {
    const consistencyService = require('../services/userDataConsistency');
    
    const report = await consistencyService.getFullConsistencyReport();

    res.status(200).json({
      success: true,
      report,
      message: 'Data consistency check completed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Verify specific user profile update
 * @route GET /api/admin/verify/profile/:userId
 * @access Private/Admin
 */
exports.verifyUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('_id name email phone address status createdAt updatedAt').lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      verified: true,
      user,
      message: 'User profile verified in database',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get user update audit log
 * @route GET /api/admin/verify/audit/:userId
 * @access Private/Admin
 */
exports.getUserAuditLog = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('name email phone address status updatedAt _id').lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get related orders count
    const ordersCount = await Order.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        status: user.status,
        lastUpdated: user.updatedAt
      },
      relatedData: {
        ordersCount
      },
      message: 'Audit log retrieved'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
