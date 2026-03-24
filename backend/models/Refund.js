const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  orderNumber: {
    type: String,
    trim: true,
    default: null,
  },
  customerName: {
    type: String,
    trim: true,
    default: null,
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: null,
  },
  customerPhone: {
    type: String,
    trim: true,
    default: null,
  },
  refundType: {
    type: String,
    enum: ['cancellation', 'return-refund'],
    required: true,
    default: 'cancellation',
  },
  sourceReturnId: {
    type: String,
    trim: true,
    default: null,
  },
  productSummary: {
    type: String,
    trim: true,
    default: null,
  },
  paymentMethod: {
    type: String,
    trim: true,
    default: null,
  },
  paymentStatus: {
    type: String,
    trim: true,
    default: null,
  },
  amount: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  refundStatus: {
    type: String,
    enum: ['pending', 'approved', 'processing', 'completed', 'rejected'],
    default: 'pending',
  },
  adminNotes: {
    type: String,
    default: null,
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null,
  },
  processedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes
refundSchema.index({ order: 1 });
refundSchema.index({ user: 1, createdAt: -1 });
refundSchema.index({ refundStatus: 1, createdAt: -1 });
refundSchema.index({ refundType: 1, createdAt: -1 });
refundSchema.index({ sourceReturnId: 1 }, { sparse: true });

module.exports = mongoose.model('Refund', refundSchema);
