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
      enum: [
        "defective",
        "damaged",
        "wrong-item",
        "poor-quality",
        "changed-mind",
        "other",
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["easy-return"],
      default: "easy-return",
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

module.exports = mongoose.model("Return", returnSchema);
