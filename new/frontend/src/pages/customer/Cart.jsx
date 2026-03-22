// ─────────────────────────────────────────────────────────────────────────────
//  SHOPPING CART  — Modern Redesign
//  Layout: 2-col (70/30), sticky summary, entrance animation, mobile bar
// ─────────────────────────────────────────────────────────────────────────────
import { useContext, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import CheckoutModal from '../../components/CheckoutModal';
import CartLoginRequired from '../../components/CartLoginRequired';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import './Cart.css';
import { calculateOrderTotals } from '../../utils/pricingUtils';
import useCategories from '../../hooks/useCategories';

/* ─── SVG Icons ──────────────────────────────────────────────── */
const CheckIcon = () => (
  <svg viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 5L4.5 8.5L11 1.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM7 9h2v9H7V9zm-1 13h12a2 2 0 0 0 2-2V9H4v11a2 2 0 0 0 2 2z" fill="currentColor"/>
  </svg>
);

const CartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="30" height="30">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M16 10a4 4 0 0 1-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ─── Format currency ─────────────────────────────────────────── */
const fmt = (n) => (n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

/* ════════════════════════════════════════════════════════════════
   CART PAGE COMPONENT
════════════════════════════════════════════════════════════════ */
const Cart = () => {
  const navigate = useNavigate();
  const { cart, updateCartItem, removeFromCart, loading } = useContext(CartContext);
  const { isAuthenticated } = useContext(AuthContext);
  const { info, error } = useToast();
  const { categoriesMap } = useCategories();

  const [selectedItems, setSelectedItems] = useState(new Set());
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [removingItems, setRemovingItems] = useState(new Set());
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  /* ── Derived values (computed before any early return so hook count stays constant) ── */
  const items         = cart?.items || [];
  const selectedCount = selectedItems.size;
  const isAllSelected = items.length > 0 && selectedCount === items.length;

  const selectedItemsList = items.filter(item => selectedItems.has(item.product._id));

  const {
    subtotal: selectedSubtotal,
    gst:      selectedGST,
    shipping: selectedShipping,
    total:    finalTotal,
  } = calculateOrderTotals(selectedItemsList, categoriesMap);


  // Show animated login required screen if user is not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <Navbar />
        <CartLoginRequired autoRedirect={true} redirectDelay={4000} />
        <Footer />
      </>
    );
  }

  /* ── Helpers ── */
  const setItemUpdating = (id, val) =>
    setUpdatingItems(prev => { const s = new Set(prev); val ? s.add(id) : s.delete(id); return s; });

  const handleQuantityChange = async (productId, newQty) => {
    if (newQty < 1) return;
    setItemUpdating(productId, true);
    try {
      const res = await updateCartItem(productId, newQty);
      if (res && !res.success) info(res.message || 'Failed to update cart');
    } catch { info('Failed to update quantity. Please try again.'); }
    finally   { setItemUpdating(productId, false); }
  };

  const handleRemove = async (productId) => {
    if (!window.confirm('Remove this item from cart?')) return;
    setRemovingItems(prev => { const s = new Set(prev); s.add(productId); return s; });
    setItemUpdating(productId, true);
    try {
      await removeFromCart(productId);
      const s = new Set(selectedItems); s.delete(productId); setSelectedItems(s);
      info('Item removed from cart 🗑️');
    } finally {
      setItemUpdating(productId, false);
      setRemovingItems(prev => { const s = new Set(prev); s.delete(productId); return s; });
    }
  };

  const handleSelectItem = (id) => {
    const s = new Set(selectedItems);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedItems(s);
  };

  const handleSelectAll = () =>
    setSelectedItems(isAllSelected ? new Set() : new Set(items.map(i => i.product._id)));

  const handleCheckout = () => {
    if (selectedCount === 0) { info('Please select at least one item to proceed'); return; }
    setIsCheckoutModalOpen(true);
  };

  const handleCloseCheckoutModal = () => {
    setIsCheckoutModalOpen(false);
  };

  const getSelectedItemsData = () => {
    return items.filter(item => selectedItems.has(item.product._id));
  };

  /* ════════════════ LOADING ════════════════ */
  if (loading) return (
    <>
      <Navbar />
      <div className="cart-page">
        <div className="cart-loading">
          <div className="cart-spinner" />
          <span>Loading your cart…</span>
        </div>
      </div>
    </>
  );

  /* ════════════════ EMPTY STATE ════════════════ */
  if (!cart || items.length === 0) return (
    <>
      <Navbar />
      <div className="cart-page">
        <div className="cart-container">
          <div className="cart-empty">
            <div className="empty-cart-visual">
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="empty-illustration">
                <circle cx="60" cy="60" r="58" fill="#f0f0ff" stroke="#e0e7ff" strokeWidth="2"/>
                <path d="M30 38h8l10 32h34l8-24H48" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="50" cy="78" r="4" fill="#6366f1"/>
                <circle cx="74" cy="78" r="4" fill="#6366f1"/>
                <path d="M55 55h10M60 50v10" stroke="#a5b4fc" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h2>Your Cart is Empty</h2>
            <p>Looks like you haven't added anything yet.<br/>Explore our products and find something you'll love!</p>
            <Link to="/products" className="cart-empty-btn">
              Start Shopping →
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );

  /* ════════════════ MAIN RENDER ════════════════ */
  return (
    <>
      <Navbar />

      <div className="cart-page">
        <div className="cart-container">

          {/* ── Page Header ── */}
          <div className="cart-header cart-header--animate">
            <div className="cart-header-left">
              <span className="cart-header-icon"><CartIcon /></span>
              <div>
                <h1>Shopping Cart</h1>
                <p className="cart-header-sub">Review items and proceed when ready</p>
              </div>
              <span className="cart-count-badge">{items.length} {items.length === 1 ? 'Item' : 'Items'}</span>
            </div>
          </div>


          {/* ── Main 2-Column Grid ── */}
          <div className="cart-grid">

            {/* ═══ LEFT — Items Column ═══ */}
            <div className="cart-items-col">

              {/* Section header */}
              <div className="items-section-header">
                <div className="items-title-group">
                  <h2>Cart Items</h2>
                  <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                </div>
                <label className="select-all-label" htmlFor="select-all-chk">
                  <input
                    id="select-all-chk"
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    style={{ display: 'none' }}
                  />
                  <div className={`custom-checkbox${isAllSelected ? ' checked' : ''}`}>
                    {isAllSelected && <CheckIcon />}
                  </div>
                  Select All
                </label>
              </div>

              {/* Items list */}
              <div className="items-list">
                {items.map((item) => {
                  const product    = item.product || {};
                  const itemPrice  = item.price || product.price || 0;
                  const itemQty    = item.quantity || 1;
                  const productId  = product._id;
                  const isSelected = selectedItems.has(productId);
                  const isUpdating = updatingItems.has(productId);
                  const isRemoving = removingItems.has(productId);

                  return (
                    <div
                      key={item._id || productId}
                      className={[
                        'cart-card',
                        isSelected ? 'cart-card--selected' : '',
                        isUpdating ? 'cart-card--updating' : '',
                        isRemoving ? 'cart-card--removing' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      {/* Checkbox */}
                      <label className="card-checkbox-label" htmlFor={`chk-${productId}`}>
                        <input
                          id={`chk-${productId}`}
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectItem(productId)}
                          style={{ display: 'none' }}
                        />
                        <div className={`custom-checkbox${isSelected ? ' checked' : ''}`}>
                          {isSelected && <CheckIcon />}
                        </div>
                      </label>

                      {/* Image */}
                      <div className="card-image-wrap">
                        <img
                          src={product.image}
                          alt={product.name || 'Product'}
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/120x120?text=Product'; }}
                        />
                      </div>

                      {/* Info */}
                      <div className="card-info">
                        <Link to={`/product/${productId}`} className="card-name">
                          {product.name || 'Unknown Product'}
                        </Link>
                        {product.brand && <p className="card-brand">{product.brand}</p>}
                        <p className="card-unit-price">
                          ₹{fmt(itemPrice)}
                          <span className="card-unit-label"> / unit</span>
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="card-actions">
                        <div className="qty-pill">
                          <button
                            className="qty-pill-btn"
                            onClick={() => handleQuantityChange(productId, itemQty - 1)}
                            disabled={isUpdating || itemQty <= 1}
                            aria-label="Decrease quantity"
                          >−</button>
                          <span className={`qty-pill-value${isUpdating ? ' qty-pill-value--spin' : ''}`}>
                            {itemQty}
                          </span>
                          <button
                            className="qty-pill-btn"
                            onClick={() => handleQuantityChange(productId, itemQty + 1)}
                            disabled={isUpdating || itemQty >= (product.stock || 999)}
                            aria-label="Increase quantity"
                          >+</button>
                        </div>

                        <p className="card-total">₹{fmt(itemPrice * itemQty)}</p>

                        <button
                          className="card-remove-btn"
                          onClick={() => handleRemove(productId)}
                          disabled={isUpdating}
                          aria-label="Remove item"
                          title="Remove item"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* end cart-items-col */}

            {/* ═══ RIGHT — Summary Column ═══ */}
            <div className="cart-summary-col">
              <div className="summary-card">

                <h2 className="summary-title">Order Summary</h2>

                <div className="summary-body">
                  <div className="summary-row">
                    <span className="summary-label">Selected Items</span>
                    <span className="summary-value">{selectedCount}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Subtotal</span>
                    <span className="summary-value">₹{fmt(selectedSubtotal)}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">GST</span>
                    <span className="summary-value">₹{fmt(selectedGST)}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Shipping</span>
                    <span className="summary-value">₹{fmt(selectedShipping)}</span>
                  </div>
                </div>

                <div className="summary-divider" />

                <div className="summary-total-row">
                  <span className="summary-total-label">Total Amount</span>
                  <span className="summary-total-value">₹{fmt(finalTotal)}</span>
                </div>

                {selectedCount === 0 && (
                  <p className="summary-hint">☝️ Select items above to see your total</p>
                )}

                <button
                  className={`checkout-btn${selectedCount === 0 ? ' checkout-btn--disabled' : ''}`}
                  onClick={handleCheckout}
                  disabled={selectedCount === 0}
                >
                  Proceed to Checkout
                  <span className="checkout-btn-arrow"> →</span>
                </button>

                <div className="checkout-secure">
                  <ShieldIcon />
                  <span>Secure &amp; Encrypted Checkout</span>
                </div>

                <Link to="/products" className="continue-link">← Continue Shopping</Link>

                <div className="summary-divider" style={{ marginTop: 20 }} />

                <div className="trust-badges">
                  <div className="trust-badge"><span>🔒</span><span>100% Secure</span></div>
                  <div className="trust-badge"><span>🚚</span><span>Free Delivery</span></div>
                  <div className="trust-badge"><span>↩️</span><span>Easy Returns</span></div>
                </div>

              </div>
            </div>
            {/* end cart-summary-col */}

          </div>
          {/* end cart-grid */}

        </div>
      </div>

      {/* ── Mobile Sticky Bottom Bar ── */}
      <div className={`mobile-bar${selectedCount > 0 ? ' mobile-bar--visible' : ''}`}>
        <div className="mobile-bar-inner">
          <div className="mobile-bar-total">
            <span className="mobile-bar-label">Total ({selectedCount} items)</span>
            <span className="mobile-bar-amount">₹{fmt(finalTotal)}</span>
          </div>
          <button
            className="checkout-btn checkout-btn--mobile"
            onClick={handleCheckout}
            disabled={selectedCount === 0}
          >
            Checkout →
          </button>
        </div>
      </div>

      <Footer />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={handleCloseCheckoutModal}
        selectedItems={getSelectedItemsData()}
        subtotal={selectedSubtotal}
        gst={selectedGST}
        shipping={selectedShipping}
        total={finalTotal}
      />
    </>
  );
};

export default Cart;
