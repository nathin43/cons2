const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'SALE',
        'LOW_STOCK',
        'OUT_OF_STOCK',
        'NEW_ORDER',
        'ORDER_CANCELLED',
        'NEW_CUSTOMER',
        'CONTACT_MESSAGE',
        'REFUND_REQUEST',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: 'bell',
    },
    color: {
      type: String,
      enum: ['green', 'orange', 'red', 'blue', 'purple', 'yellow', 'gray'],
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    actionUrl: {
      type: String,
      default: null,
    },
    // Flexible data field to store specific information
    data: {
      productId: mongoose.Schema.Types.ObjectId,
      productName: String,
      orderId: mongoose.Schema.Types.ObjectId,
      orderNumber: String,
      customerId: mongoose.Schema.Types.ObjectId,
      customerName: String,
      amount: Number,
      stock: Number,
      contactId: mongoose.Schema.Types.ObjectId,
      refundId: mongoose.Schema.Types.ObjectId,
      from: String,
      subject: String,
    },
  },
  { timestamps: true }
);

// Index for faster queries
NotificationSchema.index({ admin: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ admin: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
