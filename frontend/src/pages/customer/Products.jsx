import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProductCard from '../../components/ProductCard';
import API from '../../services/api';
import './Products.css';

/**
 * Mani Electrical - Products Page
 * Professional product showcase with search and advanced filtering
 */
const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [showInStockOnly, setShowInStockOnly] = useState(false);

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

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
      const errorMsg = err.response?.data?.message || 'Failed to load products';
      setError(errorMsg);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters whenever any filter changes
  useEffect(() => {
    applyFilters();
  }, [products, searchQuery, selectedCategory, selectedBrand, sortBy, showInStockOnly]);

  const applyFilters = () => {
    let result = [...products];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.brand?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Brand filter
    if (selectedBrand !== 'all') {
      result = result.filter(p => p.brand === selectedBrand);
    }

    // Stock filter
    if (showInStockOnly) {
      result = result.filter(p => p.stock > 0);
    }

    // Sorting
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => (a.price || a.priceMin || 0) - (b.price || b.priceMin || 0));
        break;
      case 'price-high':
        result.sort((a, b) => (b.price || b.priceMin || 0) - (a.price || a.priceMin || 0));
        break;
      case 'name':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'popularity':
        result.sort((a, b) => (b.ratings?.count || 0) - (a.ratings?.count || 0));
        break;
      case 'latest':
      default:
        result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
    }

    setFilteredProducts(result);
  };

  // Get unique categories and brands
  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];
  const brands = ['all', ...new Set(products.map(p => p.brand).filter(Boolean))];

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSortBy('latest');
    setShowInStockOnly(false);
  };

  return (
    <>
      <Navbar />

      <div className="products-page">
        <div className="container">
          {/* Page Header */}
          <div className="page-header">
            <h1 className="page-title">Our Products</h1>
            <p className="page-subtitle">Discover quality electrical solutions for every need</p>
          </div>

          {/* Premium Search Bar */}
          <div className="search-section">
            <div className="search-wrapper">
              <div className="search-bar">
                <div className="search-icon-wrapper">
                  <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M21 21l-4.35-4.35" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search products, brands, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="search-clear" onClick={() => setSearchQuery('')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M18 6L6 18M6 6l12 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
                <button className="search-btn">
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Premium Filter Panel */}
          {!loading && products.length > 0 && (
            <div className="filters-panel">
              <div className="filters-header">
                <div className="filters-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                  </svg>
                  <span>Filters</span>
                </div>
                <div className="results-badge">
                  <span className="results-number">{filteredProducts.length}</span>
                  <span className="results-text">{filteredProducts.length === 1 ? 'product' : 'products'}</span>
                </div>
              </div>

              <div className="filters-content">
                <div className="filter-card">
                  <div className="filter-card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h4v4H4zM14 4h4v4h-4zM4 14h4v4H4zM14 14h4v4h-4z" />
                    </svg>
                  </div>
                  <div className="filter-card-content">
                    <label className="filter-label">Category</label>
                    <select
                      className="filter-select"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat === 'all' ? 'All Categories' : cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="filter-card">
                  <div className="filter-card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                  </div>
                  <div className="filter-card-content">
                    <label className="filter-label">Brand</label>
                    <select
                      className="filter-select"
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                    >
                      {brands.map(brand => (
                        <option key={brand} value={brand}>
                          {brand === 'all' ? 'All Brands' : brand}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="filter-card">
                  <div className="filter-card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M6 12h12M9 18h6" />
                    </svg>
                  </div>
                  <div className="filter-card-content">
                    <label className="filter-label">Sort By</label>
                    <select
                      className="filter-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="latest">Latest Products</option>
                      <option value="popularity">Most Popular</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="name">Name: A to Z</option>
                    </select>
                  </div>
                </div>

                <div className="filter-card toggle-card">
                  <div className="filter-card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <div className="filter-card-content toggle-content">
                    <label className="filter-label">In Stock Only</label>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={showInStockOnly}
                        onChange={(e) => setShowInStockOnly(e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              {(searchQuery || selectedCategory !== 'all' || selectedBrand !== 'all' || showInStockOnly) && (
                <div className="filters-footer">
                  <button className="clear-filters-btn" onClick={clearFilters}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M15 9l-6 6M9 9l6 6" />
                    </svg>
                    Reset All Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p className="loading-text">Loading products...</p>
            </div>
          ) : error && products.length === 0 ? (
            <div className="error-container">
              <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
                <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
              </svg>
              <h3>Unable to Load Products</h3>
              <p>{error}</p>
              <button
                className="retry-button"
                onClick={() => fetchProducts()}
              >
                Try Again
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="no-products">
              <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path d="M8 15h8M9 9h.01M15 9h.01" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <h3>No Products Found</h3>
              <p>Try adjusting your search or filters</p>
              {(searchQuery || selectedCategory !== 'all' || selectedBrand !== 'all' || showInStockOnly) && (
                <button className="retry-button" onClick={clearFilters}>
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="products-grid-section">
              <div className="grid grid-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Products;
