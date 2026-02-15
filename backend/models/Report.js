const mongoose = require('mongoose');

/**
 * Report Schema
 * Stores generated reports linked to users, orders, and payments
 * Reports are auto-generated when orders are placed or payments are completed
 */
const reportSchema = new mongoose.Schema({
  // User Information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },

  // Order Information
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: function() {
      return this.reportType !== 'User Summary';
    }
  },
  orderNumber: {
    type: String,
    required: function() {
      return this.reportType !== 'User Summary';
    }
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  orderDate: {
    type: Date,
    required: function() {
      return this.reportType !== 'User Summary';
    }
  },

  // Order Items Details
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: String,
    productPrice: Number,
    quantity: Number,
    itemTotal: Number
  }],

  // Amount Details
  totalAmount: {
    type: Number,
    required: function() {
      return this.reportType !== 'User Summary';
    }
  },

  // Payment Information
  paymentMethod: {
    type: String,
    enum: [
      'credit_card',
      'debit_card',
      'paypal',
      'upi',
      'wallet',
      'cod',
      'Cash on Delivery',
      'Credit Card',
      'Debit Card',
      'UPI',
      'pending'
    ],
    required: function() {
      return this.reportType !== 'User Summary';
    }
  },
  transactionId: {
    type: String,
    default: null
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'paid'],
    required: function() {
      return this.reportType !== 'User Summary';
    }
  },
  paymentDate: {
    type: Date,
    default: null
  },

  // Shipping Information
  shippingAddress: {
    fullName: String,
    phone: String,
    email: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },

  // Report Metadata
  reportType: {
    type: String,
    enum: ['Order Report', 'Payment Report', 'Invoice', 'User Summary'],
    default: 'Order Report'
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalAmountSpent: {
    type: Number,
    default: 0
  },
  lastOrderDate: {
    type: Date,
    default: null
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  reportStatus: {
    type: String,
    enum: ['Generated', 'Downloaded', 'Archived'],
    default: 'Generated'
  },
  reportGeneratedAt: {
    type: Date,
    default: Date.now
  },
  lastDownloadedAt: {
    type: Date,
    default: null
  },
  downloadCount: {
    type: Number,
    default: 0
  },

  // Notes & Additional Info
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
reportSchema.index({ user: 1, reportGeneratedAt: -1 });
reportSchema.index({ order: 1 });
reportSchema.index({ paymentStatus: 1 });
reportSchema.index({ reportType: 1 });
reportSchema.index({ user: 1, reportType: 1 });

// Middleware to populate related data
reportSchema.pre(/^find/, function(next) {
  if (this.options._recursed) {
    return next();
  }
  
  this.populate({
    path: 'user',
    select: 'name email phone'
  }).populate({
    path: 'order',
    select: '_id orderNumber orderStatus'
  });
  
  next();
});

module.exports = mongoose.model('Report', reportSchema);
