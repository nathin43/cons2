import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import API from '../../services/api';
import { calculateOrderTotals } from '../../utils/pricingUtils';
import useCategories from '../../hooks/useCategories';
import './Checkout.css';

/**
 * Dynamically loads the Razorpay checkout script
 * Returns a promise that resolves to true on success
 */
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

/**
 * Checkout Page Component
 * Order placement with selected items only
 */
const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, fetchCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { success, error: showError } = useToast();

  // Get selected items from navigation state
  const selectedItemIds = location.state?.selectedItems || [];

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || '',
    paymentMethod: 'Cash on Delivery'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Live category GST/shipping data from DB
  const { categoriesMap } = useCategories();

  // Validate selected items exist
  useEffect(() => {
    if (!cart || cart.items.length === 0 || selectedItemIds.length === 0) {
      navigate('/cart');
    }
  }, []);

  // Filter selected items from cart
  const selectedItems = cart.items.filter(item =>
    selectedItemIds.includes(item.product._id)
  );

  if (!selectedItems || selectedItems.length === 0) {
    return (
      <>
        <Navbar />
        <div className="checkout-page">
          <div className="container">
            <div className="empty-cart">
              <h2>No items selected for checkout</h2>
              <p>Please select items from your cart</p>
              <button onClick={() => navigate('/cart')} className="btn btn-primary">
                Back to Cart
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Calculate subtotal, GST, shipping and total for selected items using live DB category rates
  const { subtotal, gst, shipping, total } = calculateOrderTotals(selectedItems, categoriesMap);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ── Razorpay flow ──────────────────────────────────────────────────────
  const handleRazorpayPayment = async (orderItems, shippingAddress) => {
    setPaymentProcessing(true);

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setError('Failed to load Razorpay. Please check your internet connection.');
      setLoading(false);
      setPaymentProcessing(false);
      return;
    }

    try {
      // Step 1: Create Razorpay order on backend
      const { data } = await API.post('/razorpay/create-order', {
        items: orderItems,
        shippingAddress
      });

      if (!data.success) {
        setError(data.message || 'Could not initiate payment.');
        setLoading(false);
        setPaymentProcessing(false);
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.amount,            // paise
        currency: data.currency,
        name: 'Mani Electricals',
        description: 'Secure Checkout',
        image: `${window.location.origin}/logo.png`,
        order_id: data.razorpayOrderId,
        handler: async (response) => {
          // Step 2: Verify signature and save order
          try {
            const verifyRes = await API.post('/razorpay/verify-payment', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              items: data.validatedItems,
              shippingAddress: data.shippingAddress,
              subtotal: data.subtotal,
              gst: data.gst,
              shipping: data.shipping,
              totalAmount: data.totalAmount
            });

            if (verifyRes.data.success) {
              success('Payment successful! Order placed. 🎉');
              window.dispatchEvent(new CustomEvent('order-placed'));
              await fetchCart();
              navigate('/order-confirmation', {
                state: {
                  order: verifyRes.data.order,
                  items: data.validatedItems,
                  totalAmount: data.totalAmount,
                  paymentId: response.razorpay_payment_id
                },
                replace: true
              });
            } else {
              setError('Payment verification failed. Please contact support.');
              showError('Payment verification failed.');
            }
          } catch (verifyErr) {
            setError(verifyErr.response?.data?.message || 'Payment verification error.');
            showError('Payment verification error. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: shippingAddress.name,
          email: user?.email || '',
          contact: shippingAddress.phone
        },
        notes: {
          address: `${shippingAddress.street}, ${shippingAddress.city}`,
          total_items: `${orderItems.length} item(s)`,
          total_amount: `INR ${data.totalAmount}`
        },
        theme: { color: '#2563eb' },
        config: {
          display: {
            blocks: {
              banks: { name: 'Pay via UPI or Netbanking', instruments: [{ method: 'upi' }, { method: 'netbanking' }] },
              cards: { name: 'Pay via Card',             instruments: [{ method: 'card' }] }
            },
            sequence: ['block.banks', 'block.cards'],
            preferences: { show_default_blocks: false }
          }
        },
        modal: {
          backdropclose: false,
          animation: true,
          ondismiss: () => {
            setError('Payment cancelled. Your order was NOT placed.');
            showError('Payment cancelled.');
            setLoading(false);
          }
        }
      };

      // Hide loading overlay before Razorpay modal appears
      setPaymentProcessing(false);

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        setError(`Payment failed: ${response.error.description}`);
        showError('Payment failed. Please try again.');
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      // Show the actual server error message; fallback is generic
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to initiate Razorpay payment. Please try again.';
      setError(msg);
      showError(msg);
      setLoading(false);
      setPaymentProcessing(false);
    }
  };
  // ────────────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const shippingAddress = {
        name: formData.name,
        phone: formData.phone,
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: 'India'
      };

      const orderItems = selectedItems.map(item => ({
        product: item.product._id,
        quantity: item.quantity
      }));

      // ── Razorpay → separate two-step flow ─────────────────────────────
      if (formData.paymentMethod === 'Online Payment (Razorpay)') {
        await handleRazorpayPayment(orderItems, shippingAddress);
        return; // loading state managed inside handleRazorpayPayment
      }
      // ─────────────────────────────────────────────────────────────────

      const orderData = {
        // Use ONLY selected items for order
        items: orderItems,
        shippingAddress,
        paymentMethod: formData.paymentMethod,
        paymentDetails: {}
      };

      const { data } = await API.post('/orders', orderData);

      if (data.success) {
        success('Order placed successfully! 🎉');
        window.dispatchEvent(new CustomEvent('order-placed'));
        await fetchCart();
        setTimeout(() => navigate('/orders', { state: { orderSuccess: true } }), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
      showError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="checkout-page">
        <div className="container">
          <h1>Checkout</h1>

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="checkout-grid">
            <div className="checkout-form-section">
              <form onSubmit={handleSubmit}>
                <div className="form-section">
                  <h2>Shipping Address</h2>

                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      pattern="[0-9]{10}"
                    />
                  </div>

                  <div className="form-group">
                    <label>Street Address *</label>
                    <input
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>City *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>State *</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Zip Code *</label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        required
                        pattern="[0-9]{6}"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h2>Payment Method</h2>

                  <div className="payment-methods">
                    {['Cash on Delivery', 'Online Payment (Razorpay)'].map(method => (
                      <label key={method} className="payment-option">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method}
                          checked={formData.paymentMethod === method}
                          onChange={handleChange}
                        />
                        <span>{method}</span>
                      </label>
                    ))}
                  </div>

                  {/* Razorpay Online Payment */}
                  {formData.paymentMethod === 'Online Payment (Razorpay)' && (
                    <div className="payment-details cod-message">
                      <div className="cod-icon">💳</div>
                      <h3>Pay Securely Online</h3>
                      <p className="cod-description">
                        You will be redirected to Razorpay's secure payment gateway.
                      </p>
                      <div className="cod-info">
                        <p>✓ Credit / Debit Cards accepted</p>
                        <p>✓ UPI (GPay, PhonePe, Paytm, BHIM)</p>
                        <p>✓ Net Banking &amp; Wallets</p>
                        <p>✓ 100% secure &amp; encrypted</p>
                        <p>🔒 Order is saved ONLY after successful payment</p>
                      </div>
                    </div>
                  )}

                  {/* Cash on Delivery Confirmation */}
                  {formData.paymentMethod === 'Cash on Delivery' && (
                    <div className="payment-details cod-message">
                      <div className="cod-icon">💵</div>
                      <h3>Cash on Delivery</h3>
                      <p className="cod-description">Pay when your order is delivered.</p>
                      <div className="cod-info">
                        <p>✓ No advance payment required</p>
                        <p>✓ Pay to delivery person in cash</p>
                        <p>✓ Inspect product before payment</p>
                      </div>
                    </div>
                  )}


                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={loading}
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              </form>
            </div>

            <div className="checkout-summary">
              <h2>Order Summary</h2>
              <p className="selected-info">
                {selectedItems.length} item(s) selected for checkout
              </p>

              <div className="summary-items">
                {selectedItems.map(item => (
                  <div key={item._id} className="summary-item">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/80x80?text=Product';
                      }}
                    />
                    <div className="item-details">
                      <p className="item-name">{item.product.name}</p>
                      <p className="item-qty">Qty: {item.quantity}</p>
                    </div>
                    <div className="item-price">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="summary-totals">
                <div className="summary-row">
                  <span>Subtotal ({selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''})</span>
                  <span>₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="summary-row">
                  <span>GST</span>
                  <span>₹{gst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span>₹{shipping.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>

                <div className="summary-total">
                  <span>Total</span>
                  <span>₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Cancellation Policy Notice */}
              <div className="checkout-policy-notice">
                <div className="policy-header">
                  <span className="policy-icon">ℹ️</span>
                  <strong>Cancellation Policy</strong>
                </div>
                <p>
                  Orders can be cancelled online within <strong>24 hours</strong> of placing the order.
                  After 24 hours, please contact our support team for cancellation requests.
                </p>
                <div className="policy-contact">
                  <span>📞 +91-9095399271</span>
                  <span>✉️ manielectricalshop@gmail.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Processing Overlay — shown while backend creates the Razorpay order */}
      {paymentProcessing && (
        <div className="payment-processing-overlay">
          <div className="payment-processing-modal">
            <div className="payment-spinner"></div>
            <h3>Preparing Secure Checkout</h3>
            <p>Please wait while we set up your secure payment…</p>
            <div className="payment-trust-badges">
              <span>🔒 256-bit SSL</span>
              <span>🛡️ Secured by Razorpay</span>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default Checkout;
