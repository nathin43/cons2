const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema(
  {
    returnId: {
      type: String,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    orderId: {
      type: String,
      default: null,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["easy-return", "order-cancellation-refund"],
      default: "easy-return",
    },
    paymentStatus: {
      type: String,
      default: null,
    },
    paymentMethod: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["new", "in-progress", "approved", "rejected", "completed"],
      default: "new",
    },
    adminNotes: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes
returnSchema.index({ status: 1, createdAt: -1 });
returnSchema.index({ orderId: 1 }, { sparse: true });
returnSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Return", returnSchema);
