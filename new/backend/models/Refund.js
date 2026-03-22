const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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
  // Cancel reason chosen by user (e.g. "Ordered by mistake")
  cancelReason: {
    type: String,
    trim: true,
    default: null,
  },
  // Optional message the user typed when requesting refund
  userMessage: {
    type: String,
    trim: true,
    default: null,
  },
  // Payment method of the original order
  paymentMethod: {
    type: String,
    default: null,
  },
  // Source of the refund request
  source: {
    type: String,
    enum: ['order_cancellation', 'manual'],
    default: 'order_cancellation',
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
  // Admin reply message visible to user
  adminReply: {
    type: String,
    default: null,
  },
  adminReplyAt: {
    type: Date,
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
refundSchema.index({ source: 1, createdAt: -1 });

module.exports = mongoose.model('Refund', refundSchema);
