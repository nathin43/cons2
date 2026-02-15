import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import './ProductReviews.css';

/**
 * Product Reviews Component
 * Displays and manages product reviews and ratings
 */
const ProductReviews = ({ productId }) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [reviews, setReviews] = useState([]);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [canReview, setCanReview] = useState(true);
  const [editingReviewId, setEditingReviewId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    feedback: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
    fetchProduct();
    if (isAuthenticated) {
      checkIfUserCanReview();
    }
  }, [productId, isAuthenticated]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/reviews/product/${productId}`);
      setReviews(data.reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProduct = async () => {
    try {
      const { data } = await API.get(`/products/${productId}`);
      setProduct(data.product);
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  };

  const checkIfUserCanReview = async () => {
    try {
      const { data } = await API.get(`/reviews/check/${productId}`);
      setCanReview(data.canReview);
      if (!data.canReview && data.existingReview) {
        setEditingReviewId(data.existingReview._id);
        setFormData({
          rating: data.existingReview.rating,
          title: data.existingReview.title,
          feedback: data.existingReview.feedback
        });
      }
    } catch (error) {
      console.error('Error checking review status:', error);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    if (formData.title.length < 5) {
      errors.title = 'Title must be at least 5 characters';
    }
    if (!formData.feedback.trim()) {
      errors.feedback = 'Feedback is required';
    }
    if (formData.feedback.length < 10) {
      errors.feedback = 'Feedback must be at least 10 characters';
    }
    if (formData.feedback.length > 1000) {
      errors.feedback = 'Feedback cannot exceed 1000 characters';
    }
    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      if (editingReviewId) {
        // Update existing review
        const { data } = await API.put(`/reviews/${editingReviewId}`, formData);
        if (data.success) {
          setReviews(reviews.map(r => r._id === editingReviewId ? data.review : r));
          alert('Review updated successfully!');
          setFormData({ rating: 5, title: '', feedback: '' });
          setEditingReviewId(null);
          setShowForm(false);
        }
      } else {
        // Add new review
        const { data } = await API.post('/reviews', {
          productId,
          ...formData
        });
        if (data.success) {
          setReviews([data.review, ...reviews]);
          setFormData({ rating: 5, title: '', feedback: '' });
          setShowForm(false);
          setCanReview(false);
          alert('Review added successfully!');
        }
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting review');
      console.error('Error submitting review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      const { data } = await API.delete(`/reviews/${reviewId}`);
      if (data.success) {
        setReviews(reviews.filter(r => r._id !== reviewId));
        setCanReview(true);
        setEditingReviewId(null);
        alert('Review deleted successfully!');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting review');
    }
  };

  const handleMarkHelpful = async (reviewId) => {
    try {
      const { data } = await API.put(`/reviews/${reviewId}/helpful`);
      if (data.success) {
        setReviews(reviews.map(r => r._id === reviewId ? data.review : r));
      }
    } catch (error) {
      console.error('Error marking helpful:', error);
    }
  };

  const handleMarkUnhelpful = async (reviewId) => {
    try {
      const { data } = await API.put(`/reviews/${reviewId}/unhelpful`);
      if (data.success) {
        setReviews(reviews.map(r => r._id === reviewId ? data.review : r));
      }
    } catch (error) {
      console.error('Error marking unhelpful:', error);
    }
  };

  const renderStars = (rating, interactive = false, onChange = null) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''}`}
            onClick={() => interactive && onChange && onChange(star)}
            style={{ cursor: interactive ? 'pointer' : 'default' }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="product-reviews-section">
      <div className="reviews-header">
        <div>
          <h2>Customer Reviews</h2>
          <p className="reviews-subtitle">Verified feedback from real buyers</p>
        </div>

        {isAuthenticated && !showForm && (
          <button
            className="btn btn-primary write-review-btn"
            onClick={() => setShowForm(true)}
            disabled={!canReview && !editingReviewId}
          >
            {editingReviewId ? 'Edit Review' : 'Write a Review'}
          </button>
        )}
      </div>

      {/* Review Summary */}
      <div className="review-summary">
        <div className="average-rating">
          <div className="rating-number">
            {product?.ratings?.average || 0}
          </div>
          <div className="rating-stars">
            {renderStars(product?.ratings?.average || 0)}
          </div>
          <div className="rating-count">
            {product?.ratings?.count || reviews.length} reviews
          </div>
        </div>
        <div className="rating-meta">
          <div className="rating-label">Average Rating</div>
          <p>Based on verified customer feedback and experiences.</p>
        </div>
      </div>

      {/* Review Form */}
      {isAuthenticated && (
        <div className="review-form-container">
          {showForm && (
            <form className="review-form" onSubmit={handleSubmitReview}>
              <h3>{editingReviewId ? 'Edit Your Review' : 'Share Your Feedback'}</h3>

              {/* Rating */}
              <div className="form-group">
                <label>Rating</label>
                <div className="interactive-stars">
                  {renderStars(
                    formData.rating,
                    true,
                    (rating) => setFormData(prev => ({ ...prev, rating }))
                  )}
                </div>
                <span className="rating-label">
                  {['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][formData.rating - 1]}
                </span>
              </div>

              {/* Title */}
              <div className="form-group">
                <label htmlFor="title">Review Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className={`form-input ${formErrors.title ? 'error' : ''}`}
                  placeholder="Summarize your experience"
                  value={formData.title}
                  onChange={handleInputChange}
                  maxLength="100"
                />
                {formErrors.title && (
                  <span className="error-message">{formErrors.title}</span>
                )}
                <span className="char-count">
                  {formData.title.length}/100
                </span>
              </div>

              {/* Feedback */}
              <div className="form-group">
                <label htmlFor="feedback">Your Feedback *</label>
                <textarea
                  id="feedback"
                  name="feedback"
                  className={`form-textarea ${formErrors.feedback ? 'error' : ''}`}
                  placeholder="Share your detailed experience with this product..."
                  value={formData.feedback}
                  onChange={handleInputChange}
                  maxLength="1000"
                  rows="5"
                ></textarea>
                {formErrors.feedback && (
                  <span className="error-message">{formErrors.feedback}</span>
                )}
                <span className="char-count">
                  {formData.feedback.length}/1000
                </span>
              </div>

              {/* Form Actions */}
              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : editingReviewId ? 'Update Review' : 'Submit Review'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ rating: 5, title: '', feedback: '' });
                    setFormErrors({});
                  }}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {!isAuthenticated && (
        <div className="login-prompt">
          <p>Please login to write a review</p>
          <a href="/login" className="btn btn-primary">Login</a>
        </div>
      )}

      {/* Reviews List */}
      <div className="reviews-list">
        {loading ? (
          <div className="loading">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="no-reviews">
            <div className="no-reviews-icon">💬</div>
            <p>No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          reviews.map(review => (
            <div key={review._id} className="review-item">
              <div className="review-header">
                <div className="reviewer-info">
                  <div className="reviewer-name">{review.user?.name}</div>
                  <div className="review-date">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {review.verified && (
                  <span className="verified-badge">✓ Verified Purchase</span>
                )}
              </div>

              <div className="review-rating">
                {renderStars(review.rating)}
                <span className="rating-label">
                  {['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][review.rating - 1]}
                </span>
              </div>

              <div className="review-title">{review.title}</div>
              <div className="review-content">{review.feedback}</div>

              <div className="review-footer">
                <div className="helpful-buttons">
                  <button
                    className="helpful-btn"
                    onClick={() => handleMarkHelpful(review._id)}
                  >
                    👍 Helpful ({review.helpful})
                  </button>
                  <button
                    className="unhelpful-btn"
                    onClick={() => handleMarkUnhelpful(review._id)}
                  >
                    👎 Not Helpful ({review.unhelpful})
                  </button>
                </div>

                {isAuthenticated && user?._id === review.user?._id && (
                  <div className="review-actions">
                    <button
                      className="edit-btn"
                      onClick={() => {
                        setFormData({
                          rating: review.rating,
                          title: review.title,
                          feedback: review.feedback
                        });
                        setEditingReviewId(review._id);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteReview(review._id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
