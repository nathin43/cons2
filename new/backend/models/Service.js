const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    serviceId: {
      type: String,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: String,
    image: String,
    features: [String],
    price: {
      type: Number,
      default: 0,
    },
    duration: String,
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
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

module.exports = mongoose.model("Service", serviceSchema);
