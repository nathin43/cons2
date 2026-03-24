const mongoose = require('mongoose');

const refundMessageSchema = new mongoose.Schema(
  {
    refundId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    sender: {
      type: String,
      enum: ['USER', 'ADMIN'],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

refundMessageSchema.index({ refundId: 1, createdAt: 1 });

module.exports = mongoose.model('RefundMessage', refundMessageSchema);
