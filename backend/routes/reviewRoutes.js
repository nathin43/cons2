const express = require('express');
const router = express.Router();
const { protect, adminProtect } = require('../middleware/auth');
const {
  getProductReviews,
  addReview,
  updateReview,
  deleteReview,
  markHelpful,
  markUnhelpful,
  getUserReviews,
  canUserReview
} = require('../controllers/reviewController');
const { getReviewsByUserId } = require('../controllers/reportControllerNew');

/**
 * Public Routes
 */
// Get all reviews for a product
router.get('/product/:productId', getProductReviews);

// Mark as helpful/unhelpful (public)
router.put('/:reviewId/helpful', markHelpful);
router.put('/:reviewId/unhelpful', markUnhelpful);

/**
 * Protected Routes (requires authentication)
 */
// Add new review
router.post('/', protect, addReview);

// Get user's reviews - MUST come before /user/:userId to avoid conflict
router.get('/user/my-reviews', protect, getUserReviews);

// Check if user can review
router.get('/check/:productId', protect, canUserReview);

// Update review
router.put('/:reviewId', protect, updateReview);

// Delete review
router.delete('/:reviewId', protect, deleteReview);

/**
 * Admin Routes
 */
// Get reviews by user ID (Admin only) - Must come AFTER /user/my-reviews
router.get('/user/:userId', adminProtect, getReviewsByUserId);

module.exports = router;
