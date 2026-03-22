const mongoose = require('mongoose');

/**
 * Category Schema
 * Stores category-level GST % and flat shipping charge.
 * Admin can edit these values from the admin dashboard.
 */
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true
    },
    gst: {
      type: Number,
      required: [true, 'GST percentage is required'],
      min: 0,
      max: 100,
      default: 18
    },
    shipping: {
      type: Number,
      required: [true, 'Shipping charge is required'],
      min: 0,
      default: 60
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
