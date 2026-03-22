const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    contactId: {
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
    subject: {
      type: String,
      required: false,
    },
    message: {
      type: String,
      required: true,
    },
    inquiryType: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
    category: {
      type: String,
      enum: ["support", "sales", "feedback", "other"],
      default: "support",
    },
    status: {
      type: String,
      enum: ["new", "read", "replied", "resolved"],
      default: "new",
    },
    replyMessage: {
      type: String,
      default: null,
    },
    repliedAt: {
      type: Date,
      default: null,
    },
    repliedBy: {
      type: String,
      default: null,
    },
    // Refund/Return reply linkage
    orderId: {
      type: String,
      default: null,
    },
    refundDecision: {
      type: String,
      default: null,
    },
    returnId: {
      type: String,
      default: null,
    },
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
contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ userId: 1 }, { sparse: true });
contactSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Contact", contactSchema);
