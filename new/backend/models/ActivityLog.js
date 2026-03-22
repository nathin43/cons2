const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
  adminName: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'PRODUCT_CREATED',
      'PRODUCT_UPDATED',
      'PRODUCT_DELETED',
      'ORDER_STATUS_UPDATED',
      'ORDER_CANCELLED',
      'REFUND_PROCESSED',
      'RETURN_UPDATED',
      'USER_STATUS_CHANGED',
      'CONTACT_REPLIED',
      'REPORT_GENERATED',
      'ADMIN_CREATED',
      'ADMIN_UPDATED',
      'SETTINGS_CHANGED',
      'OTHER',
    ],
  },
  description: {
    type: String,
    required: true,
  },
  targetType: {
    type: String,
    enum: ['Product', 'Order', 'User', 'Admin', 'Return', 'Contact', 'Report', 'Settings', 'Other'],
    default: 'Other',
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ipAddress: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
  collection: 'activity_logs',
});

// Indexes
activityLogSchema.index({ admin: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ targetType: 1, targetId: 1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
