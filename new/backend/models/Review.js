const mongoose = require('mongoose');

/**
 * Review Schema for Product Ratings and Feedback
 * Stores user reviews, ratings, and feedback for products
 */
const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Please provide product ID']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide user ID']
  },
  rating: {
    type: Number,
    required: [true, 'Please provide a rating'],
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: [true, 'Please provide a review title'],
    trim: true,
    maxlength: [100, 'Review title cannot exceed 100 characters']
  },
  feedback: {
    type: String,
    required: [true, 'Please provide feedback'],
    minlength: [10, 'Feedback must be at least 10 characters'],
    maxlength: [1000, 'Feedback cannot exceed 1000 characters']
  },
  verified: {
    type: Boolean,
    default: false
  },
  helpful: {
    type: Number,
    default: 0
  },
  unhelpful: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ user: 1 });

module.exports = mongoose.model('Review', reviewSchema);
