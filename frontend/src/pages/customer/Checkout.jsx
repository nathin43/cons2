import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import UPIPayment from '../../components/UPIPayment';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import API from '../../services/api';
import './Checkout.css';

/**
 * Checkout Page Component
 * Order placement with selected items only
 */
const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useContext(CartContext);
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
    paymentMethod: 'Cash on Delivery',
    // Credit Card fields
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    // Debit Card fields
    debitCardholderName: '',
    debitCardNumber: '',
    debitExpiryDate: '',
    debitCvv: '',
    // UPI fields
    upiId: '',
    upiProvider: 'gpay'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  // Calculate subtotal of selected items only
  const subtotal = selectedItems.reduce((total, item) => {
    const itemPrice = item.price || item.product.price || 0;
    return total + (itemPrice * item.quantity);
  }, 0);

  const total = subtotal;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate payment details based on selected method
      if (formData.paymentMethod === 'Credit Card') {
        if (!formData.cardholderName || !formData.cardNumber || !formData.expiryDate || !formData.cvv) {
          setError('Please fill all credit card details');
          setLoading(false);
          return;
        }
        const cleanCardNumber = formData.cardNumber.replace(/\s/g, '');
        if (cleanCardNumber.length !== 16) {
          setError('Card number must be 16 digits');
          setLoading(false);
          return;
        }
        if (!formData.cvv.match(/^\d{3,4}$/)) {
          setError('CVV must be 3-4 digits');
          setLoading(false);
          return;
        }
        if (!formData.expiryDate.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
          setError('Expiry date must be in MM/YY format');
          setLoading(false);
          return;
        }
      } else if (formData.paymentMethod === 'Debit Card') {
        if (!formData.debitCardholderName || !formData.debitCardNumber || !formData.debitExpiryDate || !formData.debitCvv) {
          setError('Please fill all debit card details');
          setLoading(false);
          return;
        }
        const cleanCardNumber = formData.debitCardNumber.replace(/\s/g, '');
        if (cleanCardNumber.length !== 16) {
          setError('Card number must be 16 digits');
          setLoading(false);
          return;
        }
        if (!formData.debitCvv.match(/^\d{3,4}$/)) {
          setError('CVV must be 3-4 digits');
          setLoading(false);
          return;
        }
        if (!formData.debitExpiryDate.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
          setError('Expiry date must be in MM/YY format');
          setLoading(false);
          return;
        }
      } else if (formData.paymentMethod === 'UPI') {
        if (!formData.upiId) {
          setError('Please enter UPI ID');
          setLoading(false);
          return;
        }
        if (!formData.upiId.match(/^[a-zA-Z0-9._-]+@[a-zA-Z]+$/)) {
          setError('Please enter valid UPI ID (e.g., username@upi)');
          setLoading(false);
          return;
        }
      }

      const orderData = {
        // Use ONLY selected items for order
        items: selectedItems.map(item => ({
          product: item.product._id,
          quantity: item.quantity
        })),
        shippingAddress: {
          name: formData.name,
          phone: formData.phone,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: 'India'
        },
        paymentMethod: formData.paymentMethod,
        paymentDetails: {
          creditCard: formData.paymentMethod === 'Credit Card' ? {
            cardholderName: formData.cardholderName,
            cardNumber: formData.cardNumber.replace(/\s/g, '').slice(-4), // Only store last 4 digits for security
            expiryDate: formData.expiryDate
          } : null,
          debitCard: formData.paymentMethod === 'Debit Card' ? {
            cardholderName: formData.debitCardholderName,
            cardNumber: formData.debitCardNumber.replace(/\s/g, '').slice(-4),
            expiryDate: formData.debitExpiryDate
          } : null,
          upi: formData.paymentMethod === 'UPI' ? {
            upiId: formData.upiId,
            provider: formData.upiProvider
          } : null
        }
      };

      const { data } = await API.post('/orders', orderData);

      if (data.success) {
        // DO NOT clear cart - items persist for easy re-ordering
        // Order has been created with copies of cart items
        // Cart and Order are independent - user can place new orders without losing cart
        success('Order placed successfully! 🎉');
        setTimeout(() => navigate('/orders'), 1500);
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
                    {['Cash on Delivery', 'Credit Card', 'Debit Card', 'UPI'].map(method => (
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

                  {/* Credit Card Details */}
                  {formData.paymentMethod === 'Credit Card' && (
                    <div className="payment-details card-details">
                      <div className="card-header">
                        <div className="card-icon">💳</div>
                        <h3>Credit Card Details</h3>
                      </div>
                      <div className="form-group">
                        <label>Cardholder Name *</label>
                        <input
                          type="text"
                          name="cardholderName"
                          placeholder="John Doe"
                          value={formData.cardholderName}
                          onChange={handleChange}
                          required
                        />
                        <small>Enter name as on card</small>
                      </div>
                      <div className="form-group">
                        <label>Card Number *</label>
                        <input
                          type="text"
                          name="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={formData.cardNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                            const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                            setFormData({ ...formData, cardNumber: formatted });
                          }}
                          maxLength="19"
                          required
                        />
                        <small>16-digit card number</small>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Expiry Date (MM/YY) *</label>
                          <input
                            type="text"
                            name="expiryDate"
                            placeholder="12/25"
                            value={formData.expiryDate}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              let formatted = value;
                              if (value.length >= 2) {
                                formatted = value.slice(0, 2) + '/' + value.slice(2, 4);
                              }
                              setFormData({ ...formData, expiryDate: formatted });
                            }}
                            maxLength="5"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>CVV *</label>
                          <input
                            type="password"
                            name="cvv"
                            placeholder="123"
                            value={formData.cvv}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              setFormData({ ...formData, cvv: value });
                            }}
                            maxLength="4"
                            required
                          />
                        </div>
                      </div>
                      <div className="card-security-info">
                        <p>🔒 Your card details are encrypted and secure</p>
                      </div>
                    </div>
                  )}

                  {/* Debit Card Details */}
                  {formData.paymentMethod === 'Debit Card' && (
                    <div className="payment-details card-details">
                      <div className="card-header">
                        <div className="card-icon">💳</div>
                        <h3>Debit Card Details</h3>
                      </div>
                      <div className="form-group">
                        <label>Cardholder Name *</label>
                        <input
                          type="text"
                          name="debitCardholderName"
                          placeholder="John Doe"
                          value={formData.debitCardholderName}
                          onChange={handleChange}
                          required
                        />
                        <small>Enter name as on card</small>
                      </div>
                      <div className="form-group">
                        <label>Card Number *</label>
                        <input
                          type="text"
                          name="debitCardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={formData.debitCardNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                            const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                            setFormData({ ...formData, debitCardNumber: formatted });
                          }}
                          maxLength="19"
                          required
                        />
                        <small>16-digit card number</small>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Expiry Date (MM/YY) *</label>
                          <input
                            type="text"
                            name="debitExpiryDate"
                            placeholder="12/25"
                            value={formData.debitExpiryDate}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              let formatted = value;
                              if (value.length >= 2) {
                                formatted = value.slice(0, 2) + '/' + value.slice(2, 4);
                              }
                              setFormData({ ...formData, debitExpiryDate: formatted });
                            }}
                            maxLength="5"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>CVV *</label>
                          <input
                            type="password"
                            name="debitCvv"
                            placeholder="123"
                            value={formData.debitCvv}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              setFormData({ ...formData, debitCvv: value });
                            }}
                            maxLength="4"
                            required
                          />
                        </div>
                      </div>
                      <div className="card-security-info">
                        <p>🔒 Your card details are encrypted and secure</p>
                      </div>
                    </div>
                  )}

                  {/* UPI Payment Methods */}
                  {formData.paymentMethod === 'UPI' && (
                    <div className="payment-details upi-details">
                      <UPIPayment
                        upiId={formData.upiId}
                        onUpiIdChange={(value) => setFormData({ ...formData, upiId: value })}
                        selectedUpiProvider={formData.upiProvider}
                        onProviderChange={(provider) => setFormData({ ...formData, upiProvider: provider })}
                      />
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
                  <span>Subtotal ({selectedItems.length} items)</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>

                <div className="summary-total">
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
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

      <Footer />
    </>
  );
};

export default Checkout;
