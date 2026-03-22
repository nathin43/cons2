import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import './ProductCard.css';

/**
 * Premium E-Commerce Product Card Component
 * Modern, clean, and professional design with advanced features
 * - Rating stars display
 * - Stock status indicators
 * - Hover animations
 * - Responsive design
 */
const ProductCard = ({ product, hideAddToCart = false }) => {
  const navigate = useNavigate();
  const { addToCart, cart } = useContext(CartContext);
  const { isAuthenticated } = useContext(AuthContext);
  const { success, error, info } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      info('Please login to add items to cart');
      navigate('/login');
      return;
    }

    setIsAdding(true);
    try {
      const result = await addToCart(product._id, 1, product);
      if (result.success) {
        success(isInCart ? 'Cart updated! 🛒' : 'Product added to cart! 🛒');
      } else {
        error(result.message);
      }
    } finally {
      setIsAdding(false);
    }
  };

  // Format price for display
  const formatPrice = (price) => {
    return `₹${price?.toLocaleString('en-IN') || '0'}`;
  };

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="star filled">★</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="star half">★</span>);
      } else {
        stars.push(<span key={i} className="star empty">★</span>);
      }
    }
    return stars;
  };

  const cartItem = cart?.items?.find((item) => item.product?._id === product._id);
  const isInCart = Boolean(cartItem);
  const isOutOfStock = !product?.stock || product.stock <= 0;
  const averageRating = product.ratings?.average || 0;
  const ratingCount = product.ratings?.count || 0;

  // Inline SVG placeholder — no external dependency
  const PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg' width%3D'400' height%3D'400' viewBox%3D'0 0 400 400'%3E%3Crect width%3D'400' height%3D'400' fill%3D'%23f1f5f9'%2F%3E%3Ctext x%3D'50%25' y%3D'50%25' dominant-baseline%3D'middle' text-anchor%3D'middle' font-family%3D'sans-serif' font-size%3D'18' fill%3D'%2394a3b8'%3ENo Image%3C%2Ftext%3E%3C%2Fsvg%3E`;

  return (
    <div className="product-card-premium">
      {/* Product Image Section */}
      <Link to={`/product/${product._id}`} className="product-image-link">
        <div className="product-image-container">
          <img
            src={product.image || PLACEHOLDER}
            alt={product.name}
            className="product-image"
            onError={(e) => {
              e.target.onerror = null; // prevent infinite loop
              e.target.src = PLACEHOLDER;
            }}
          />
          {/* Category Badge - Top Left Corner */}
          {product.category && (
            <div className="category-badge-overlay">
              {product.category.toUpperCase()}
            </div>
          )}
        </div>
      </Link>

      {/* Product Details Section */}
      <div className="product-info">
        {/* Product Name */}
        <Link to={`/product/${product._id}`} className="product-title-link">
          <h3 className="product-title">{product.name}</h3>
        </Link>

        {/* Brand */}
        {product.brand && (
          <p className="product-brand">by {product.brand}</p>
        )}

        {/* Rating Section - Centered Stacked Design */}
        {ratingCount > 0 && (
          <div className="rating-container">
            <div className="stars-display">
              {renderStars(averageRating)}
            </div>
            <div className="rating-info">
              <span className="rating-text">{averageRating.toFixed(1)}</span>
              <span className="rating-count">({ratingCount} {ratingCount === 1 ? 'review' : 'reviews'})</span>
            </div>
          </div>
        )}

        {/* Price and Stock Section */}
        <div className="price-stock-wrapper">
          <div className="price-section">
            {product.priceType === 'range' ? (
              <div className="price-display">
                <span className="price-label">Starting from</span>
                <span className="price-amount">{formatPrice(product.priceMin)}</span>
              </div>
            ) : (
              <div className="price-display">
                <span className="price-amount"><span className="price-dot"></span>{formatPrice(product.price)}</span>
              </div>
            )}
          </div>

          {/* Stock Badge - Pill with Dot */}
          {!isOutOfStock && (
            <div className="stock-indicator">
              <span className="stock-dot"></span>
              <span className="stock-text">In Stock</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="product-actions-premium">
          {!hideAddToCart && (
            <button
              type="button"
              className={`btn-add-to-cart ${isInCart ? 'added-state' : ''} ${isOutOfStock ? 'disabled-state' : ''}`}
              onClick={handleAddToCart}
              disabled={isAdding || isOutOfStock}
            >
              {isAdding ? (
                <>
                  <span className="btn-spinner"></span>
                  Adding...
                </>
              ) : isOutOfStock ? (
                'Out of Stock'
              ) : isInCart ? (
                <>
                  <svg className="btn-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Added to Cart
                </>
              ) : (
                <>
                  <svg className="btn-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                  </svg>
                  Add to Cart
                </>
              )}
            </button>
          )}

          <Link
            to={`/product/${product._id}`}
            className="btn-view-details"
          >
            <span>View Details</span>
            <svg className="btn-arrow" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
