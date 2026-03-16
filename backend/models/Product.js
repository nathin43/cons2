const mongoose = require('mongoose');

/**
 * Product Schema for Electric Shop items
 * Stores all product information including images and inventory
 */
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a product name'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a product description']
  },
  price: {
    type: Number,
    required: [true, 'Please provide a product price'],
    min: 0
  },
  category: {
    type: String,
    required: [true, 'Please provide a product category'],
    enum: ['Wire & Cables', 'Fan', 'Pipes', 'Motors', 'Heater', 'Lights', 'Switches', 'Tank', 'Water Heater', 'Other']
  },
  brand: {
    type: String,
    required: [true, 'Please provide a brand name']
  },
  image: {
    type: String,
    required: [true, 'Please provide a product image']
  },
  images: {
    type: [String],
    default: []
  },
  stock: {
    type: Number,
    required: [true, 'Please provide stock quantity'],
    min: 0,
    default: 0
  },
  specifications: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'out-of-stock', 'low-stock'],
    default: 'active'
  },
  featured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Auto-update status based on stock level
// 'inactive' is admin-managed and never overridden automatically
productSchema.pre('save', function(next) {
  if (this.status !== 'inactive') {
    if (this.stock === 0) {
      this.status = 'out-of-stock';
    } else if (this.stock <= 10) {
      this.status = 'low-stock';
    } else {
      this.status = 'active';
    }
  }
  next();
});

// Add indexes for query performance
// Index for category filtering (very common)
productSchema.index({ category: 1 });

// Index for status filtering
productSchema.index({ status: 1 });

// Index for featured products
productSchema.index({ featured: 1, createdAt: -1 });

// Compound index for category + status filters (common combination)
productSchema.index({ category: 1, status: 1 });

// Text index for search on name, description, and brand
productSchema.index({ name: 'text', description: 'text', brand: 'text' });

// Index for sorting by creation date
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
