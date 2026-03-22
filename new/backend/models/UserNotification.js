const mongoose = require('mongoose');

const UserNotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['order', 'product', 'offer', 'payment', 'refund', 'account'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    relatedOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    relatedProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    actionUrl: {
      type: String,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient per-user queries sorted by newest first
UserNotificationSchema.index({ userId: 1, createdAt: -1 });
UserNotificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('UserNotification', UserNotificationSchema);
