const SalesReport = require('../models/SalesReport');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

/**
 * Generate / refresh a daily sales report for a given date
 * @route POST /api/sales-reports/generate
 */
exports.generateDailyReport = async (req, res) => {
  try {
    const { date } = req.body;
    const reportDate = date ? new Date(date + 'T00:00:00') : new Date();
    const dayStart = new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: { $gte: dayStart, $lte: dayEnd },
    }).lean();

    const totalOrders = orders.length;
    const totalSales = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const deliveredOrders = orders.filter(o => o.orderStatus === 'delivered').length;
    const cancelledOrders = orders.filter(o => o.orderStatus === 'cancelled').length;

    const newCustomers = await User.countDocuments({
      createdAt: { $gte: dayStart, $lte: dayEnd },
    });

    // Payment method breakdown
    const paymentMethodBreakdown = { cod: 0, razorpay: 0, upi: 0, card: 0 };
    for (const o of orders) {
      const m = (o.paymentMethod || '').toUpperCase();
      if (m === 'CASH ON DELIVERY') paymentMethodBreakdown.cod++;
      else if (m === 'RAZORPAY') paymentMethodBreakdown.razorpay++;
      else if (m === 'UPI') paymentMethodBreakdown.upi++;
      else paymentMethodBreakdown.card++;
    }

    // Top products
    const productMap = {};
    for (const o of orders) {
      for (const item of o.items || []) {
        const pid = item.product.toString();
        if (!productMap[pid]) {
          productMap[pid] = { product: item.product, productName: item.name || '', unitsSold: 0, revenue: 0 };
        }
        productMap[pid].unitsSold += item.quantity;
        productMap[pid].revenue += item.price * item.quantity;
      }
    }
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const report = await SalesReport.findOneAndUpdate(
      { date: dayStart, period: 'daily' },
      {
        date: dayStart,
        period: 'daily',
        totalSales,
        totalOrders,
        totalRevenue: totalSales,
        deliveredOrders,
        cancelledOrders,
        newCustomers,
        topProducts,
        paymentMethodBreakdown,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, message: 'Daily report generated', report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get sales reports with filters
 * @route GET /api/sales-reports
 */
exports.getSalesReports = async (req, res) => {
  try {
    const { period, fromDate, toDate, limit } = req.query;
    const query = {};

    if (period && period !== 'all') query.period = period;
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const reports = await SalesReport.find(query)
      .sort('-date')
      .limit(parseInt(limit) || 90);

    // Compute aggregates
    const totals = {
      totalSales: 0,
      totalOrders: 0,
      totalRevenue: 0,
      totalDelivered: 0,
      totalCancelled: 0,
      totalNewCustomers: 0,
    };
    for (const r of reports) {
      totals.totalSales += r.totalSales;
      totals.totalOrders += r.totalOrders;
      totals.totalRevenue += r.totalRevenue;
      totals.totalDelivered += r.deliveredOrders;
      totals.totalCancelled += r.cancelledOrders;
      totals.totalNewCustomers += r.newCustomers;
    }

    res.status(200).json({ success: true, count: reports.length, totals, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get a specific report by ID
 * @route GET /api/sales-reports/:id
 */
exports.getSalesReportById = async (req, res) => {
  try {
    const report = await SalesReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    res.status(200).json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a sales report
 * @route DELETE /api/sales-reports/:id
 */
exports.deleteSalesReport = async (req, res) => {
  try {
    const report = await SalesReport.findByIdAndDelete(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    res.status(200).json({ success: true, message: 'Report deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
