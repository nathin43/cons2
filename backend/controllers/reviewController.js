const Review = require('../models/Review');
const Product = require('../models/Product');

/**
 * Get all reviews for a product
 * @route GET /api/reviews/product/:productId
 * @access Public
 */
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 10, page = 1 } = req.query;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Get reviews with pagination
    const skip = (page - 1) * limit;
    const reviews = await Review.find({ product: productId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalReviews = await Review.countDocuments({ product: productId });

    res.status(200).json({
      success: true,
      reviews,
      totalReviews,
      currentPage: page,
      totalPages: Math.ceil(totalReviews / limit)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

/**
 * Add a new review
 * @route POST /api/reviews
 * @access Private
 */
exports.addReview = async (req, res) => {
  try {
    const { productId, rating, title, feedback } = req.body;
    const userId = req.user._id;

    // Validation
    if (!productId || !rating || !title || !feedback) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: userId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product. You can update your review instead.'
      });
    }

    // Create new review
    const review = new Review({
      product: productId,
      user: userId,
      rating,
      title,
      feedback,
      verified: true // Mark as verified since user is logged in
    });

    await review.save();

    // Update product rating
    await updateProductRating(productId);

    // Populate user data
    await review.populate('user', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding review',
      error: error.message
    });
  }
};

/**
 * Update a review
 * @route PUT /api/reviews/:reviewId
 * @access Private
 */
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, feedback } = req.body;
    const userId = req.user._id;

    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check authorization
    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this review'
      });
    }

    // Update fields
    if (rating) review.rating = rating;
    if (title) review.title = title;
    if (feedback) review.feedback = feedback;

    await review.save();

    // Update product rating
    await updateProductRating(review.product);

    // Populate user data
    await review.populate('user', 'name avatar');

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating review',
      error: error.message
    });
  }
};

/**
 * Delete a review
 * @route DELETE /api/reviews/:reviewId
 * @access Private
 */
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check authorization
    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this review'
      });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(reviewId);

    // Update product rating
    await updateProductRating(productId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
};

/**
 * Mark review as helpful
 * @route PUT /api/reviews/:reviewId/helpful
 * @access Public
 */
exports.markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpful: 1 } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review marked as helpful',
      review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking review as helpful',
      error: error.message
    });
  }
};

/**
 * Mark review as unhelpful
 * @route PUT /api/reviews/:reviewId/unhelpful
 * @access Public
 */
exports.markUnhelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { unhelpful: 1 } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review marked as unhelpful',
      review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking review as unhelpful',
      error: error.message
    });
  }
};

/**
 * Helper function to update product rating
 */
async function updateProductRating(productId) {
  try {
    const reviews = await Review.find({ product: productId });

    if (reviews.length === 0) {
      await Product.findByIdAndUpdate(productId, {
        'ratings.average': 0,
        'ratings.count': 0
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = (totalRating / reviews.length).toFixed(1);

    await Product.findByIdAndUpdate(productId, {
      'ratings.average': parseFloat(averageRating),
      'ratings.count': reviews.length
    });
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
}

/**
 * Get user's reviews
 * @route GET /api/reviews/user/my-reviews
 * @access Private
 */
exports.getUserReviews = async (req, res) => {
  try {
    const userId = req.user._id;

    const reviews = await Review.find({ user: userId })
      .populate('product', 'name image')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user reviews',
      error: error.message
    });
  }
};

/**
 * Check if user can review product
 * @route GET /api/reviews/check/:productId
 * @access Private
 */
exports.canUserReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    const existingReview = await Review.findOne({
      product: productId,
      user: userId
    });

    res.status(200).json({
      success: true,
      canReview: !existingReview,
      existingReview: existingReview || null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking review status',
      error: error.message
    });
  }
};
