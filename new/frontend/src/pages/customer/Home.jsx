import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProductCard from '../../components/ProductCard';
import API from '../../services/api';
import './Home.css';

/**
 * Home Page Component
 * Landing page with featured products and categories
 */

// Simple in-memory cache for products
const CACHE_KEY = 'products_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getProductsFromCache = () => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }
  } catch (e) {
    console.log('Cache read error:', e);
  }
  return null;
};

const setProductsInCache = (products) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      data: products,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.log('Cache write error:', e);
  }
};

const Home = () => {
  const navigate = useNavigate();
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const autoPlayTimerRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const touchDeltaRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Auto-rotate categories every 3 seconds
    const categoryInterval = setInterval(() => {
      setCurrentCategoryIndex((prev) => (prev + 1) % categories.length);
    }, 3000);

    // Fetch products
    fetchProducts();

    return () => {
      clearInterval(categoryInterval);
    };
  }, []);

  // Auto-play carousel only when enabled
  useEffect(() => {
    if (!autoPlayEnabled || products.length === 0) {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      setCurrentProductIndex((prev) => (prev + 1) % products.length);
    }, 5000);

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [autoPlayEnabled, products.length]);

  const fetchProducts = async (retries = 2) => {
    // Try to get from cache first
    const cachedProducts = getProductsFromCache();
    if (cachedProducts) {
      console.log('Loading products from cache');
      setProducts(cachedProducts);
      setCurrentProductIndex(0);
      setLoading(false);
      return;
    }

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const { data } = await API.get('/products');
        const productList = data.products || [];
        setProducts(productList);
        setProductsInCache(productList); // Cache the results
        setCurrentProductIndex(0); // Reset to first product
        setLoading(false);
        return; // Success, exit
      } catch (error) {
        console.error(`Error fetching products (attempt ${attempt + 1}/${retries + 1}):`, error.message);

        // If this was the last retry or not a timeout error, give up
        if (attempt === retries || !error.code?.includes('ECONNABORTED')) {
          console.error('Failed to fetch products:', error);
          setLoading(false);
          return;
        }

        // Wait before retrying with exponential backoff
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.log(`Retrying in ${waitTime}ms...`);
        await delay(waitTime);
      }
    }
  };

  // Handle carousel navigation
  const handlePrevProduct = () => {
    setAutoPlayEnabled(false); // Pause auto-play on user interaction
    setCurrentProductIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  const handleNextProduct = () => {
    setAutoPlayEnabled(false); // Pause auto-play on user interaction
    setCurrentProductIndex((prev) => (prev + 1) % products.length);
  };

  const handleThumbnailClick = (index) => {
    setAutoPlayEnabled(false); // Pause auto-play on user interaction
    setCurrentProductIndex(index);
  };

  // Resume auto-play after user inactivity (10 seconds)
  useEffect(() => {
    if (autoPlayEnabled) return;

    const resumeTimer = setTimeout(() => {
      setAutoPlayEnabled(true);
    }, 10000);

    return () => clearTimeout(resumeTimer);
  }, [autoPlayEnabled]);

  // Feature card handlers
  const handleFreeGiftClick = () => {
    setActiveModal('gift');
  };

  const handleSecurePaymentClick = () => {
    setActiveModal('payment');
  };

  const handleEasyReturnsClick = () => {
    navigate('/easy-return');
  };

  const handleSupportClick = () => {
    navigate('/contact');
  };

  const categories = [
    {
      name: 'Switches',
      icon: '🔘',
      color: '#2f6fe4',
      colorRgb: '47, 111, 228',
      colorAlt: '#22d3ee',
      colorAltRgb: '34, 211, 238'
    },
    {
      name: 'Lights',
      icon: '💡',
      color: '#d97706',
      colorRgb: '217, 119, 6',
      colorAlt: '#f59e0b',
      colorAltRgb: '245, 158, 11'
    },
    {
      name: 'Fans',
      icon: '💨',
      color: '#0f766e',
      colorRgb: '15, 118, 110',
      colorAlt: '#2dd4bf',
      colorAltRgb: '45, 212, 191'
    },
    {
      name: 'Motors',
      icon: '⚙️',
      color: '#6d28d9',
      colorRgb: '109, 40, 217',
      colorAlt: '#8b5cf6',
      colorAltRgb: '139, 92, 246'
    },
    {
      name: 'Pipes',
      icon: '🔧',
      color: '#059669',
      colorRgb: '5, 150, 105',
      colorAlt: '#34d399',
      colorAltRgb: '52, 211, 153'
    },
    {
      name: 'Wire & Cables',
      icon: '🔌',
      color: '#0ea5e9',
      colorRgb: '14, 165, 233',
      colorAlt: '#38bdf8',
      colorAltRgb: '56, 189, 248'
    },
    {
      name: 'Tank',
      icon: '🚡',
      color: '#64748b',
      colorRgb: '100, 116, 139',
      colorAlt: '#7aa2d6',
      colorAltRgb: '122, 162, 214'
    },
    {
      name: 'Heater',
      icon: '🔥',
      color: '#f97316',
      colorRgb: '249, 115, 22',
      colorAlt: '#f87171',
      colorAltRgb: '248, 113, 113'
    }
  ];


  // Get thumbnail display count
  const THUMBNAIL_DISPLAY_COUNT = 6;
  const totalProducts = products.length;
  const displayedThumbnails = Math.min(THUMBNAIL_DISPLAY_COUNT, totalProducts);

  // Calculate which thumbnails to show based on current index
  const getThumbnailsToDisplay = () => {
    if (totalProducts <= THUMBNAIL_DISPLAY_COUNT) {
      return products.slice(0, totalProducts);
    }

    // Show 6 thumbnails centered around active product
    let startIndex = Math.max(0, currentProductIndex - Math.floor(THUMBNAIL_DISPLAY_COUNT / 2));
    const endIndex = Math.min(totalProducts, startIndex + THUMBNAIL_DISPLAY_COUNT);

    // Adjust start if we're near the end
    if (endIndex === totalProducts) {
      startIndex = Math.max(0, totalProducts - THUMBNAIL_DISPLAY_COUNT);
    }

    return products.slice(startIndex, endIndex);
  };

  // Get the actual index within the displayed thumbnails
  const getActiveThumbnailIndex = () => {
    if (totalProducts <= THUMBNAIL_DISPLAY_COUNT) {
      return currentProductIndex;
    }

    const displayedThumbs = getThumbnailsToDisplay();
    const activeProduct = products[currentProductIndex];
    return displayedThumbs.findIndex(p => p._id === activeProduct._id);
  };

  const handleCategoryTouchStart = (event) => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    touchDeltaRef.current = { x: 0, y: 0 };
  };

  const handleCategoryTouchMove = (event) => {
    const touch = event.touches[0];
    touchDeltaRef.current = {
      x: touch.clientX - touchStartRef.current.x,
      y: touch.clientY - touchStartRef.current.y
    };
  };

  const handleCategoryTouchEnd = () => {
    const { x, y } = touchDeltaRef.current;
    if (Math.abs(x) > 40 && Math.abs(x) > Math.abs(y)) {
      if (x < 0) {
        setCurrentCategoryIndex((prev) => (prev + 1) % categories.length);
      } else {
        setCurrentCategoryIndex((prev) => (prev - 1 + categories.length) % categories.length);
      }
    }
  };

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="hero">
        {/* Animated Background Elements */}
        <div className="hero-animated-bg">
          <div className="hero-gradient-orb orb-1"></div>
          <div className="hero-gradient-orb orb-2"></div>
          <div className="hero-gradient-orb orb-3"></div>
          <div className="hero-wave wave-1"></div>
          <div className="hero-wave wave-2"></div>
          <div className="hero-wave wave-3"></div>
        </div>

        {/* Floating Particles */}
        <div className="hero-particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`particle particle-${i + 1}`}></div>
          ))}
        </div>

        <div className="container hero-container">
          <div className="hero-content">
            <span className="hero-label">WELCOME TO MANI ELECTRICAL</span>
            <h1 className="hero-title">
              <span className="hero-title-line line-1">BEST ELECTRICAL</span>
              <span className="hero-title-line line-2">APPLIANCES EVER!</span>
            </h1>
            <p className="hero-description">Find everything you need for your electrical projects. High-quality products at unbeatable prices with fast delivery.</p>
            <Link to="/products" className="btn-buy-product hero-cta">
              <span className="btn-shimmer"></span>
              Buy Products
            </Link>
          </div>

          <div className="hero-image-container">
            <div
              className="category-spotlight"
              onTouchStart={handleCategoryTouchStart}
              onTouchMove={handleCategoryTouchMove}
              onTouchEnd={handleCategoryTouchEnd}
            >
              <div className="category-spotlight-stage" aria-live="polite">
                {(() => {
                  const prevIndex = (currentCategoryIndex - 1 + categories.length) % categories.length;
                  const nextIndex = (currentCategoryIndex + 1) % categories.length;
                  const prevCategory = categories[prevIndex];
                  const activeCategory = categories[currentCategoryIndex];
                  const nextCategory = categories[nextIndex];
                  return (
                    <>
                      <div
                        className="category-spotlight-card side left"
                        style={{
                          '--accent': prevCategory.color,
                          '--accent-rgb': prevCategory.colorRgb,
                          '--accent-alt': prevCategory.colorAlt,
                          '--accent-alt-rgb': prevCategory.colorAltRgb
                        }}
                      >
                        <div className="category-icon-bubble">
                          <span className="category-center-pulse" aria-hidden="true"></span>
                          <span className="category-outer-ring ring-one" aria-hidden="true"></span>
                          <span className="category-outer-ring ring-two" aria-hidden="true"></span>
                          <span className="category-orbit" aria-hidden="true">
                            <span className="category-orbit-dot dot-one"></span>
                            <span className="category-orbit-dot dot-two"></span>
                            <span className="category-orbit-dot dot-three"></span>
                            <span className="category-orbit-dot dot-four"></span>
                            <span className="category-orbit-dot dot-five"></span>
                            <span className="category-orbit-dot dot-six"></span>
                          </span>
                          <span className="category-orbit inner" aria-hidden="true">
                            <span className="category-orbit-dot dot-seven"></span>
                            <span className="category-orbit-dot dot-eight"></span>
                            <span className="category-orbit-dot dot-nine"></span>
                            <span className="category-orbit-dot dot-ten"></span>
                          </span>
                          <span className="category-spotlight-image category-spotlight-text">
                            {prevCategory.name}
                          </span>
                        </div>
                      </div>
                      <div
                        className="category-spotlight-card active"
                        style={{
                          '--accent': activeCategory.color,
                          '--accent-rgb': activeCategory.colorRgb,
                          '--accent-alt': activeCategory.colorAlt,
                          '--accent-alt-rgb': activeCategory.colorAltRgb
                        }}
                      >
                        <div className="category-icon-bubble">
                          <span className="category-center-pulse" aria-hidden="true"></span>
                          <span className="category-outer-ring ring-one" aria-hidden="true"></span>
                          <span className="category-outer-ring ring-two" aria-hidden="true"></span>
                          <span className="category-orbit" aria-hidden="true">
                            <span className="category-orbit-dot dot-one"></span>
                            <span className="category-orbit-dot dot-two"></span>
                            <span className="category-orbit-dot dot-three"></span>
                            <span className="category-orbit-dot dot-four"></span>
                            <span className="category-orbit-dot dot-five"></span>
                            <span className="category-orbit-dot dot-six"></span>
                          </span>
                          <span className="category-orbit inner" aria-hidden="true">
                            <span className="category-orbit-dot dot-seven"></span>
                            <span className="category-orbit-dot dot-eight"></span>
                            <span className="category-orbit-dot dot-nine"></span>
                            <span className="category-orbit-dot dot-ten"></span>
                          </span>
                          <span className="category-spotlight-image category-spotlight-text">
                            {activeCategory.name}
                          </span>
                        </div>
                      </div>
                      <div
                        className="category-spotlight-card side right"
                        style={{
                          '--accent': nextCategory.color,
                          '--accent-rgb': nextCategory.colorRgb,
                          '--accent-alt': nextCategory.colorAlt,
                          '--accent-alt-rgb': nextCategory.colorAltRgb
                        }}
                      >
                        <div className="category-icon-bubble">
                          <span className="category-center-pulse" aria-hidden="true"></span>
                          <span className="category-outer-ring ring-one" aria-hidden="true"></span>
                          <span className="category-outer-ring ring-two" aria-hidden="true"></span>
                          <span className="category-orbit" aria-hidden="true">
                            <span className="category-orbit-dot dot-one"></span>
                            <span className="category-orbit-dot dot-two"></span>
                            <span className="category-orbit-dot dot-three"></span>
                            <span className="category-orbit-dot dot-four"></span>
                            <span className="category-orbit-dot dot-five"></span>
                            <span className="category-orbit-dot dot-six"></span>
                          </span>
                          <span className="category-orbit inner" aria-hidden="true">
                            <span className="category-orbit-dot dot-seven"></span>
                            <span className="category-orbit-dot dot-eight"></span>
                            <span className="category-orbit-dot dot-nine"></span>
                            <span className="category-orbit-dot dot-ten"></span>
                          </span>
                          <span className="category-spotlight-image category-spotlight-text">
                            {nextCategory.name}
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="category-spotlight-controls">
                <button
                  className="category-nav-btn prev"
                  onClick={() => setCurrentCategoryIndex((prev) => (prev - 1 + categories.length) % categories.length)}
                  aria-label="Previous category"
                >
                  ‹
                </button>

                <div className="category-progress" aria-hidden="true">
                  <div className="category-progress-track">
                    <div
                      className="category-progress-fill"
                      style={{ transform: `scaleX(${(currentCategoryIndex + 1) / categories.length})` }}
                    ></div>
                  </div>
                  <span className="category-progress-text">
                    {currentCategoryIndex + 1} / {categories.length}
                  </span>
                </div>

                <button
                  className="category-nav-btn next"
                  onClick={() => setCurrentCategoryIndex((prev) => (prev + 1) % categories.length)}
                  aria-label="Next category"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="featured-products-section">
        <div className="featured-bg-shape featured-shape-1"></div>
        <div className="featured-bg-shape featured-shape-2"></div>

        <div className="container">
          {/* Section Title */}
          <div className="featured-title-wrapper">
            <h2 className="featured-section-title">Featured Products</h2>
            <div className="featured-title-divider"></div>
            <p className="featured-section-subtitle">Discover our bestselling electrical products</p>
          </div>

          {loading ? (
            <div className="featured-loading">
              <div className="spinner"></div>
              <p>Loading featured products...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="featured-carousel-wrapper">
              {/* Vertical Box Card */}
              <div className="featured-card-vertical">
                {/* Image Section at Top */}
                <div className="featured-image-section">
                  <div className="featured-image-box">
                    <img
                      src={products[currentProductIndex].image}
                      alt={products[currentProductIndex].name}
                      className="featured-image"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x400?text=Product';
                      }}
                    />
                  </div>
                </div>

                {/* Details Section Below */}
                <div className="featured-details-section">
                  <span className="featured-category-pill">
                    {products[currentProductIndex].category?.toUpperCase()}
                  </span>

                  <h3 className="featured-product-title">
                    {products[currentProductIndex].name}
                  </h3>

                  <p className="featured-product-desc">
                    Premium quality electrical component for residential and commercial applications
                  </p>

                  <div className="featured-price-text">
                    ₹{products[currentProductIndex].price?.toLocaleString()}
                  </div>

                  <Link
                    to={`/product/${products[currentProductIndex]._id}`}
                    className="featured-btn-full"
                  >
                    <span>View Details</span>
                    <span className="arrow-right">→</span>
                  </Link>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="featured-controls">
                <button
                  className="featured-nav-btn prev"
                  onClick={handlePrevProduct}
                  aria-label="Previous product"
                  disabled={products.length <= 1}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>

                <div className="featured-dots-wrapper">
                  {getThumbnailsToDisplay().map((product, displayIndex) => {
                    const isActive = getActiveThumbnailIndex() === displayIndex;
                    return (
                      <button
                        key={`${product._id}-${displayIndex}`}
                        className={`featured-dot ${isActive ? 'active' : ''}`}
                        onClick={() => handleThumbnailClick(products.indexOf(product))}
                        style={{
                          backgroundImage: `url(${product.image})`,
                          opacity: isActive ? 1 : 0.6
                        }}
                        title={product.name}
                        aria-label={`Go to ${product.name}`}
                        aria-current={isActive ? 'true' : 'false'}
                      />
                    );
                  })}
                </div>

                <button
                  className="featured-nav-btn next"
                  onClick={handleNextProduct}
                  aria-label="Next product"
                  disabled={products.length <= 1}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>

              {/* Progress Indicator */}
              <div className="featured-progress">
                <div className="featured-progress-bar"
                  style={{
                    width: `${((currentProductIndex + 1) / products.length) * 100}%`
                  }}>
                </div>
              </div>

              {/* Auto-play Status Indicator */}
              {!autoPlayEnabled && (
                <div className="featured-autoplay-paused">
                  <span>Auto-play paused • Click resume or wait 10 seconds</span>
                  <button
                    className="featured-resume-btn"
                    onClick={() => setAutoPlayEnabled(true)}
                    aria-label="Resume auto-play"
                  >
                    Resume
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="featured-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <box x="3" y="3" width="18" height="18" rx="2" ry="2"></box>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <p>No featured products available</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            <div
              className="feature-card"
              onClick={handleFreeGiftClick}
              role="button"
              tabIndex="0"
              onKeyPress={(e) => e.key === 'Enter' && handleFreeGiftClick()}
            >
              <span className="feature-icon">🎁</span>
              <h3>Free Gift</h3>
              <p>Get a FREE product on orders above ₹10,000</p>
            </div>
            <div
              className="feature-card"
              onClick={handleSecurePaymentClick}
              role="button"
              tabIndex="0"
              onKeyPress={(e) => e.key === 'Enter' && handleSecurePaymentClick()}
            >
              <span className="feature-icon">💳</span>
              <h3>Secure Payment</h3>
              <p>100% secure transactions</p>
            </div>
            <div
              className="feature-card"
              onClick={handleEasyReturnsClick}
              role="button"
              tabIndex="0"
              onKeyPress={(e) => e.key === 'Enter' && handleEasyReturnsClick()}
            >
              <span className="feature-icon">🔄</span>
              <h3>Easy Returns</h3>
              <p>7 days return policy</p>
            </div>
            <div
              className="feature-card"
              onClick={handleSupportClick}
              role="button"
              tabIndex="0"
              onKeyPress={(e) => e.key === 'Enter' && handleSupportClick()}
            >
              <span className="feature-icon">🎧</span>
              <h3>24/7 Support</h3>
              <p>Dedicated customer support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Free Gift Modal */}
      {activeModal === 'gift' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content gift-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-circle" onClick={() => setActiveModal(null)}>
              <span>×</span>
            </button>

            {/* Promotional Banner */}
            <div className="gift-banner">
              <div className="gift-icon-large">
                <span className="gift-emoji">🎁</span>
              </div>
              <div className="banner-text">
                <h2>FREE GIFT OFFER</h2>
                <p>Choose a complimentary product</p>
              </div>
            </div>

            {/* Free Gift Badge */}
            <div className="gift-threshold">
              <div className="threshold-badge">
                <span className="currency">₹</span>
                <span className="amount">10,000</span>
              </div>
              <p className="threshold-text">Minimum order to unlock FREE GIFT</p>
            </div>

            <div className="modal-body">
              <div className="policy-item">
                <div className="policy-icon box-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 7h-9l-2-3H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"></path>
                  </svg>
                </div>
                <div className="policy-content">
                  <h4>🎁 How It Works</h4>
                  <p>When your cart total reaches ₹10,000, you'll unlock access to choose ONE free product from our exclusive gift collection.</p>
                </div>
              </div>

              <div className="policy-item">
                <div className="policy-icon location-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                </div>
                <div className="policy-content">
                  <h4>🎉 Gift Selection</h4>
                  <p>Choose from LED Bulbs, Extension Boxes, Mobile Chargers, or Mini Torches. Your selected gift will be added to your cart at ₹0.</p>
                </div>
              </div>

              <div className="policy-item">
                <div className="policy-icon clock-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <div className="policy-content">
                  <h4>✅ Terms & Conditions</h4>
                  <p>Gift is valid only when cart total is ₹10,000 or above. If total drops below threshold, the free gift will be automatically removed from cart.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'payment' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setActiveModal(null)}>✕</button>
            <h2>Secure Payment Methods</h2>
            <div className="modal-body">
              <div className="payment-methods">
                <div className="payment-item">
                  <h4>💳 Credit & Debit Cards</h4>
                  <p>Visa, Mastercard, and American Express cards are securely processed.</p>
                </div>
                <div className="payment-item">
                  <h4>📱 UPI Payments</h4>
                  <p>Google Pay, PhonePe, and other UPI apps for instant and secure transactions.</p>
                </div>
                <div className="payment-item">
                  <h4>🏦 Net Banking</h4>
                  <p>Direct bank transfers from all major Indian banks with 256-bit encryption.</p>
                </div>
                <div className="payment-item">
                  <h4>💰 Cash on Delivery</h4>
                  <p>Pay securely at your doorstep when your order arrives.</p>
                </div>
              </div>
              <div className="security-assurance">
                <h4>🔒 Security Guarantee</h4>
                <p>All transactions are encrypted and processed through trusted payment gateways. Your financial information is 100% secure.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default Home;
