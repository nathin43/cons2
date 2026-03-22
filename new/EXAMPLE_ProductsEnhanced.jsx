import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProductCard from '../../components/ProductCard';
import API from '../../services/api';
import './Products.css';
import '../components/ProductSectionEnhancements.css';

/**
 * Enhanced Products Page
 * Premium e-commerce product showcase with modern features
 * 
 * Features:
 * - Responsive grid layout (4 cols desktop, 2 tablet, 1 mobile)
 * - Filter and sort options
 * - Loading skeletons
 * - Empty states
 * - Smooth animations
 */
const ProductsEnhanced = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [gridView, setGridView] = useState(4); // 4, 3, or 2 columns

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    // Apply filters and sorting
    let result = [...products];

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category === categoryFilter);
    }

    // Sorting
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => (a.price || a.priceMin) - (b.price || b.priceMin));
        break;
      case 'price-high':
        result.sort((a, b) => (b.price || b.priceMin) - (a.price || a.priceMin));
        break;
      case 'rating':
        result.sort((a, b) => (b.ratings?.average || 0) - (a.ratings?.average || 0));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        // Featured - keep original order
        break;
    }

    setFilteredProducts(result);
  }, [products, categoryFilter, sortBy]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await API.get('/products?limit=100');
      const fetchedProducts = Array.isArray(data.products) ? data.products : [];
      setProducts(fetchedProducts);
      setFilteredProducts(fetchedProducts);
      
      if (fetchedProducts.length === 0) {
        setError('No products available at the moment');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.message || 'Failed to load products');
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories from products
  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

  return (
    <>
      <Navbar />

      <div className="products-grid-enhanced">
        <div className="container">
          {/* Section Header */}
          <div className="products-section-header">
            <h1 className="products-section-title">Premium Electrical Products</h1>
            <p className="products-section-subtitle">
              Discover our wide range of high-quality electrical products for your home and business
            </p>
          </div>

          {/* Filter Bar */}
          {!loading && products.length > 0 && (
            <div className="products-filter-bar">
              <div className="filter-group">
                <label className="filter-label">Category:</label>
                <select 
                  className="filter-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Sort By:</label>
                <select 
                  className="filter-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>

              {/* Grid View Toggle */}
              <div className="grid-view-toggle">
                <button 
                  className={`grid-view-btn ${gridView === 4 ? 'active' : ''}`}
                  onClick={() => setGridView(4)}
                  title="4 columns"
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </button>
                <button 
                  className={`grid-view-btn ${gridView === 3 ? 'active' : ''}`}
                  onClick={() => setGridView(3)}
                  title="3 columns"
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="3" y="3" width="5" height="7" rx="1" />
                    <rect x="10" y="3" width="5" height="7" rx="1" />
                    <rect x="17" y="3" width="4" height="7" rx="1" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Products Count Badge */}
          {!loading && filteredProducts.length > 0 && (
            <div className="products-count-badge">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>{filteredProducts.length} Products</span>
            </div>
          )}

          {/* Loading Skeletons */}
          {loading && (
            <div className={`grid grid-${gridView}`}>
              {[...Array(8)].map((_, index) => (
                <div key={index} className="product-skeleton">
                  <div className="skeleton-image"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-line short"></div>
                    <div className="skeleton-line long"></div>
                    <div className="skeleton-line long"></div>
                    <div className="skeleton-line price"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && products.length === 0 && (
            <div className="products-empty-state">
              <svg className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="empty-state-title">Unable to Load Products</h3>
              <p className="empty-state-text">{error}</p>
              <button className="empty-state-btn" onClick={fetchProducts}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Empty State - No Products After Filter */}
          {!loading && !error && products.length > 0 && filteredProducts.length === 0 && (
            <div className="products-empty-state">
              <svg className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="empty-state-title">No Products Found</h3>
              <p className="empty-state-text">Try adjusting your filters to see more products</p>
              <button 
                className="empty-state-btn"
                onClick={() => {
                  setCategoryFilter('all');
                  setSortBy('featured');
                }}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Clear Filters</span>
              </button>
            </div>
          )}

          {/* Products Grid */}
          {!loading && filteredProducts.length > 0 && (
            <div className={`grid grid-${gridView}`}>
              {filteredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination (Optional - Add if needed) */}
          {!loading && filteredProducts.length > 0 && (
            <div className="products-pagination">
              <button className="pagination-btn" disabled>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="pagination-btn active">1</button>
              <button className="pagination-btn">2</button>
              <button className="pagination-btn">3</button>
              <button className="pagination-btn">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default ProductsEnhanced;
