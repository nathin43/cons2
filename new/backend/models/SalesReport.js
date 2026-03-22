const mongoose = require('mongoose');

const salesReportSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true,
  },
  totalSales: {
    type: Number,
    default: 0,
  },
  totalOrders: {
    type: Number,
    default: 0,
  },
  totalRevenue: {
    type: Number,
    default: 0,
  },
  deliveredOrders: {
    type: Number,
    default: 0,
  },
  cancelledOrders: {
    type: Number,
    default: 0,
  },
  newCustomers: {
    type: Number,
    default: 0,
  },
  topProducts: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    productName: String,
    unitsSold: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
  }],
  paymentMethodBreakdown: {
    cod: { type: Number, default: 0 },
    razorpay: { type: Number, default: 0 },
    upi: { type: Number, default: 0 },
    card: { type: Number, default: 0 },
  },
}, {
  timestamps: true,
  collection: 'sales_reports',
});

// Indexes
salesReportSchema.index({ date: -1, period: 1 }, { unique: true });
salesReportSchema.index({ period: 1, createdAt: -1 });

module.exports = mongoose.model('SalesReport', salesReportSchema);
