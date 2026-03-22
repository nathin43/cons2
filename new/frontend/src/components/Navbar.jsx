import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserPlus, Shield, Package, LogOut, ChevronRight } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { useToast } from '../hooks/useToast';
import LightbulbIcon from './LightbulbIcon';
import UserNotificationBell from './UserNotificationBell';
import './Navbar.css';

/**
 * Navigation Bar Component
 * Amazon/Flipkart inspired design with search bar and category menu
 */
const Navbar = () => {
  const { isAuthenticated, user, logout, isAdmin } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);
  const { info } = useToast();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const handleLogout = () => {
    setDropdownOpen(false);
    logout(() => {
      info('You have been logged out 👋');
      navigate('/');
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (selectedCategory !== 'All') params.set('category', selectedCategory);
    navigate(`/products?${params.toString()}`);
  };

  return (
    <nav className="navbar">
      {/* TOP HEADER - Main Navbar */}
      <div className="navbar-top">
        <div className="navbar-inner">
          {/* LEFT - Logo */}
          <div className="nav-left">
            <Link to="/" className="navbar-brand">
              <span className="logo-pill">
                <LightbulbIcon size={28} color="#ffffff" />
              </span>
              <div className="brand-content">
                <span className="brand-text">Mani Electricals</span>
              </div>
            </Link>
          </div>

          {/* CENTER - Main Navigation Links */}
          <div className="nav-center">
            <nav className="main-nav">
              <NavLink 
                to="/" 
                className={({ isActive }) => `main-nav-link ${isActive ? 'active' : ''}`}
              >
                Home
              </NavLink>
              <NavLink 
                to="/products" 
                className={({ isActive }) => `main-nav-link ${isActive ? 'active' : ''}`}
              >
                Products
              </NavLink>
              <NavLink 
                to="/contact" 
                className={({ isActive }) => `main-nav-link ${isActive ? 'active' : ''}`}
              >
                Contact
              </NavLink>
            </nav>
          </div>

          {/* RIGHT - Search, User, Orders, Cart */}
          <div className="nav-right">
            {/* Search Bar */}
            <form className="search-container" onSubmit={handleSearch}>
              <div className="search-category-wrapper">
                <select
                  className="search-category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  aria-label="Select category"
                >
                  <option value="All">All Categories</option>
                  <option value="Pipes">Pipes</option>
                  <option value="Motors">Motors</option>
                  <option value="Fan">Fan</option>
                  <option value="Lights">Lights</option>
                  <option value="Tank">Tank</option>
                  <option value="Water Heater">Water Heater</option>
                  <option value="Switches">Switches</option>
                  <option value="Wire & Cables">Wire &amp; Cables</option>
                </select>
                <svg className="search-category-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              <div className="search-divider"></div>
              <input
                type="text"
                className="search-input"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search products"
              />
              <button type="submit" className="search-button" aria-label="Search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </button>
            </form>

            {/* User Profile */}
            <div className="user-section">
              <button
                className={`user-button ${dropdownOpen ? 'active' : ''}`}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                title={isAuthenticated ? `Logged in as ${user?.name}` : 'Login or Sign Up'}
              >
                <span className="user-avatar">
                  {isAuthenticated && user?.name ? user.name.charAt(0).toUpperCase() : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="5"></circle>
                      <path d="M20 21a8 8 0 1 0-16 0"></path>
                    </svg>
                  )}
                </span>
                <div className="user-info">
                  <span className="user-greeting">Hello, {isAuthenticated ? user?.name?.split(' ')[0] : 'Sign in'}</span>
                  <span className="user-account">Account & Lists</span>
                </div>
                <svg className="user-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    className="user-dropdown"
                    initial={{ opacity: 0, y: -12, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ 
                      duration: 0.28, 
                      ease: [0.34, 1.56, 0.64, 1]
                    }}
                  >
                    <div className="dropdown-caret" />
                    {/* Non-Authenticated User Welcome Card */}
                    {!isAuthenticated && (
                      <motion.div 
                        className="dropdown-welcome-card"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.25 }}
                      >
                        <motion.div 
                          className="modal-header-icon"
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.15, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
                        >
                          <User size={26} color="#ffffff" strokeWidth={2} />
                        </motion.div>
                        <motion.h3 
                          className="welcome-title"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2, duration: 0.25 }}
                        >
                          Welcome to Mani Electrical
                        </motion.h3>
                        <motion.p 
                          className="welcome-subtitle"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25, duration: 0.25 }}
                        >
                          Sign in to manage your account and orders
                        </motion.p>
                        <motion.div 
                          className="welcome-buttons"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3, duration: 0.25 }}
                        >
                          <Link to="/login" className="welcome-btn primary" onClick={() => setDropdownOpen(false)}>
                            <User size={18} strokeWidth={2} />
                            Sign In
                          </Link>
                          <Link to="/register" className="welcome-btn secondary" onClick={() => setDropdownOpen(false)}>
                            <UserPlus size={18} strokeWidth={2} />
                            Create Account
                          </Link>
                        </motion.div>
                        <div className="dropdown-divider"></div>
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35, duration: 0.25 }}
                        >
                          <Link
                            to="/admin/login"
                            className="welcome-btn admin"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <Shield size={18} strokeWidth={2} />
                            Admin Dashboard
                          </Link>
                        </motion.div>
                      </motion.div>
                    )}

                    {/* Authenticated User Info */}
                    {isAuthenticated && (
                      <motion.div 
                        className="dropdown-user-info"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.25 }}
                      >
                        <motion.div 
                          className="user-avatar-large"
                          whileHover={{ 
                            scale: 1.08,
                            boxShadow: "0 8px 28px rgba(99, 102, 241, 0.45)"
                          }}
                          transition={{ duration: 0.25 }}
                        >
                          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </motion.div>
                        <div className="user-details">
                          <h4 className="user-name-display">{user?.name || 'User'}</h4>
                          <p className="user-email-display">{user?.email || ''}</p>
                        </div>
                      </motion.div>
                    )}

                    <div className="dropdown-divider"></div>

                    {/* Menu Options - Staggered Animation */}
                    {isAuthenticated && (
                      <motion.div 
                        className="dropdown-menu-section"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15, duration: 0.2 }}
                      >
                        <motion.div
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.18, duration: 0.25, ease: "easeOut" }}
                          whileHover={{ x: 4 }}
                        >
                          <Link to="/profile" className="dropdown-menu-item" onClick={() => setDropdownOpen(false)}>
                            <span className="menu-icon-wrap"><User size={16} strokeWidth={2} /></span>
                            <span className="menu-text">My Profile</span>
                            <ChevronRight size={14} className="menu-chevron" />
                          </Link>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.24, duration: 0.25, ease: "easeOut" }}
                          whileHover={{ x: 4 }}
                        >
                          <Link to="/orders" className="dropdown-menu-item" onClick={() => setDropdownOpen(false)}>
                            <span className="menu-icon-wrap"><Package size={16} strokeWidth={2} /></span>
                            <span className="menu-text">My Orders</span>
                            <ChevronRight size={14} className="menu-chevron" />
                          </Link>
                        </motion.div>
                      </motion.div>
                    )}

                    {/* Sign Out - Staggered Animation */}
                    {isAuthenticated && (
                      <>
                        <div className="dropdown-divider"></div>
                        <motion.div 
                          className="dropdown-menu-section dropdown-signout-section"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.30, duration: 0.25, ease: "easeOut" }}
                          whileHover={{ x: 4 }}
                        >
                          <button onClick={handleLogout} className="dropdown-menu-item logout-item">
                            <span className="menu-icon-wrap"><LogOut size={16} strokeWidth={2} /></span>
                            <span className="menu-text">Sign Out</span>
                            <ChevronRight size={14} className="menu-chevron" />
                          </button>
                        </motion.div>
                      </>
                    )}

                    {/* Admin Dashboard - shown for admin users */}
                    {isAuthenticated && isAdmin && (
                      <>
                        <div className="dropdown-divider"></div>
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.36, duration: 0.25 }}
                        >
                          <Link
                            to="/admin"
                            className="welcome-btn admin"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <Shield size={18} strokeWidth={2} />
                            Admin Dashboard
                          </Link>
                        </motion.div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notifications Bell (logged-in users only) */}
            <UserNotificationBell />

            {/* Cart */}
            <Link to="/cart" className="cart-button">
              <div className="cart-icon-wrapper">
                <div className="cart-icon-bg">
                  <svg className="cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="21" r="1"></circle>
                    <circle cx="19" cy="21" r="1"></circle>
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                  </svg>
                </div>
                {cartCount > 0 && (
                  <span className="cart-count" key={cartCount}>
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="cart-text">Cart</span>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              className={`menu-toggle ${menuOpen ? 'open' : ''}`}
              type="button"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <span className="menu-toggle-bar"></span>
              <span className="menu-toggle-bar"></span>
              <span className="menu-toggle-bar"></span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`nav-overlay ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      ></div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <div className="mobile-user-info">
            {isAuthenticated ? (
              <>
                <div className="mobile-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
                <span className="mobile-username">Hello, {user?.name?.split(' ')[0]}</span>
              </>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span className="mobile-username">Hello, Sign in</span>
              </>
            )}
          </div>
        </div>
        
        <div className="mobile-menu-content">
          <div className="mobile-menu-section">
            <h3>Categories</h3>
            <Link to="/products?category=wires-cables" onClick={() => setMenuOpen(false)}>Wires & Cables</Link>
            <Link to="/products?category=motors" onClick={() => setMenuOpen(false)}>Motors</Link>
            <Link to="/products?category=pipes" onClick={() => setMenuOpen(false)}>Pipes</Link>
            <Link to="/products?category=water-tanks" onClick={() => setMenuOpen(false)}>Water Tanks</Link>
            <Link to="/products?category=fans" onClick={() => setMenuOpen(false)}>Fans</Link>
            <Link to="/products?category=switches" onClick={() => setMenuOpen(false)}>Switches</Link>
            <Link to="/products?category=pumps" onClick={() => setMenuOpen(false)}>Pumps</Link>
            <Link to="/products?category=lighting" onClick={() => setMenuOpen(false)}>Lighting</Link>
          </div>

          <div className="mobile-menu-divider"></div>

          <div className="mobile-menu-section">
            <h3>Quick Links</h3>
            <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
            <Link to="/products" onClick={() => setMenuOpen(false)}>All Products</Link>
            <Link to="/contact" onClick={() => setMenuOpen(false)}>Contact Us</Link>
          </div>

          {isAuthenticated && (
            <>
              <div className="mobile-menu-divider"></div>
              <div className="mobile-menu-section">
                <h3>Your Account</h3>
                <Link to="/orders" onClick={() => setMenuOpen(false)}>Your Orders</Link>
                <Link to="/profile" onClick={() => setMenuOpen(false)}>Profile Settings</Link>
                <Link to="/support-messages" onClick={() => setMenuOpen(false)}>Support Messages</Link>
                <button onClick={handleLogout} className="mobile-logout-btn">Sign Out</button>
              </div>
            </>
          )}

          {!isAuthenticated && (
            <>
              <div className="mobile-menu-divider"></div>
              <div className="mobile-menu-section">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="mobile-signin-btn">Sign In</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="mobile-signup-btn">Create Account</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
