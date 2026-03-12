import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import API from '../services/api';
import './CheckoutModal.css';

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

const CheckoutModal = ({ isOpen, onClose, selectedItems, subtotal = 0, gst = 0, shipping = 0, total = 0 }) => {
  const navigate = useNavigate();
  const { fetchCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { success, error: showError } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    pincode: user?.address?.zipCode || '',
    paymentMethod: 'Cash on Delivery'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
    }
    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('checkout-modal-overlay')) {
      onClose();
    }
  };

  // Step navigation handlers
  const validateStep1 = () => {
    if (!formData.name || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.pincode) {
      setError('Please fill all required fields');
      return false;
    }
    if (!/^[0-9]{10}$/.test(formData.phone)) {
      setError('Phone number must be 10 digits');
      return false;
    }
    if (!/^[0-9]{6}$/.test(formData.pincode)) {
      setError('Pincode must be 6 digits');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = (e) => {
    // Prevent any form submission when clicking Next
    e.preventDefault();
    e.stopPropagation();
    
    // Validate Step 1: Customer Details
    if (currentStep === 1 && !validateStep1()) {
      return;
    }
    
    // Validate Step 2: Payment Method must be selected before going to Order Summary
    if (currentStep === 2 && !formData.paymentMethod) {
      setError('Please select a payment method before proceeding');
      return;
    }
    
    setError('');
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handlePrevious = (e) => {
    // Prevent any form submission when clicking Previous
    e.preventDefault();
    e.stopPropagation();
    
    setError('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleRazorpayPayment = async (orderItems, shippingAddress) => {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setError('Failed to load Razorpay. Please check your internet connection.');
      setLoading(false);
      return;
    }

    try {
      const { data } = await API.post('/razorpay/create-order', {
        items: orderItems,
        shippingAddress
      });

      if (!data.success) {
        setError(data.message || 'Could not initiate payment.');
        setLoading(false);
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Mani Electrical Shop',
        description: 'Order Payment',
        order_id: data.razorpayOrderId,
        handler: async (response) => {
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
              onClose();
              setTimeout(() => navigate('/orders', { state: { orderSuccess: true } }), 1500);
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
          contact: shippingAddress.phone
        },
        theme: { color: '#0f172a' },
        modal: {
          ondismiss: () => {
            setError('Payment cancelled. Your order was NOT placed.');
            showError('Payment cancelled.');
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        setError(`Payment failed: ${response.error.description}`);
        showError('Payment failed. Please try again.');
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to initiate Razorpay payment. Please try again.';
      setError(msg);
      showError(msg);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Only process order if on step 3 (Order Summary)
    if (currentStep !== 3) {
      return;
    }

    setLoading(true);

    try {
      // Validate cart has items
      if (!selectedItems || selectedItems.length === 0) {
        setError('Your cart is empty. Please add items before checkout.');
        setLoading(false);
        return;
      }

      // Final validation of all required fields
      if (!formData.name || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.pincode) {
        setError('Please fill all required customer details');
        setLoading(false);
        return;
      }

      // Validate phone number format
      if (!/^[0-9]{10}$/.test(formData.phone)) {
        setError('Phone number must be exactly 10 digits');
        setLoading(false);
        return;
      }

      // Validate pincode format
      if (!/^[0-9]{6}$/.test(formData.pincode)) {
        setError('Pincode must be exactly 6 digits');
        setLoading(false);
        return;
      }

      // Ensure payment method is selected
      if (!formData.paymentMethod) {
        setError('Please select a payment method');
        setLoading(false);
        return;
      }

      const shippingAddress = {
        name: formData.name,
        phone: formData.phone,
        street: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.pincode,
        country: 'India'
      };

      const orderItems = selectedItems.map(item => ({
        product: item.product._id,
        quantity: item.quantity
      }));

      // Handle Online Payment (Razorpay)
      if (formData.paymentMethod === 'Online Payment (Razorpay)') {
        await handleRazorpayPayment(orderItems, shippingAddress);
        return;
      }

      // Handle Cash on Delivery - Order placed only on button click
      if (formData.paymentMethod === 'Cash on Delivery') {
        const orderData = {
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
          onClose();
          setTimeout(() => navigate('/orders', { state: { orderSuccess: true } }), 1500);
        } else {
          setError(data.message || 'Failed to place order');
          showError(data.message || 'Failed to place order');
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to place order. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-modal-overlay" onClick={handleBackdropClick}>
      <div className="checkout-modal">
        <button className="checkout-modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="checkout-modal-header">
          <h2>🛒 Complete Your Order</h2>
        </div>

        {/* Step Indicator */}
        <div className="checkout-steps-indicator">
          <div className={`step-item ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-circle">
              {currentStep > 1 ? '✓' : '1'}
            </div>
            <span className="step-label">Customer Details</span>
          </div>
          <div className="step-line"></div>
          <div className={`step-item ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-circle">
              {currentStep > 2 ? '✓' : '2'}
            </div>
            <span className="step-label">Payment Method</span>
          </div>
          <div className="step-line"></div>
          <div className={`step-item ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-circle">3</div>
            <span className="step-label">Order Summary</span>
          </div>
        </div>

        {error && <div className="checkout-modal-error">{error}</div>}

        <div className="checkout-modal-body">
          <form onSubmit={handleSubmit}>
            
            {/* STEP 1: Customer Details */}
            {currentStep === 1 && (
              <div className="checkout-section step-content">
                <h3>📋 Customer Details</h3>

                <div className="checkout-field">
                  <label>Full Name <span className="required">*</span></label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div className="checkout-field">
                  <label>Phone Number <span className="required">*</span></label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    onChange={handleChange}
                    pattern="[0-9]{10}"
                  />
                </div>

                <div className="checkout-field">
                  <label>Address <span className="required">*</span></label>
                  <textarea
                    name="address"
                    placeholder="House no., Street, Area, Landmark"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                  />
                </div>

                <div className="checkout-field-row">
                  <div className="checkout-field">
                    <label>City <span className="required">*</span></label>
                    <input
                      type="text"
                      name="city"
                      placeholder="City"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="checkout-field">
                    <label>State <span className="required">*</span></label>
                    <input
                      type="text"
                      name="state"
                      placeholder="State"
                      value={formData.state}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="checkout-field">
                    <label>Pincode <span className="required">*</span></label>
                    <input
                      type="text"
                      name="pincode"
                      placeholder="6-digit PIN"
                      value={formData.pincode}
                      onChange={handleChange}
                      pattern="[0-9]{6}"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Payment Method */}
            {currentStep === 2 && (
              <div className="checkout-section step-content">
                <h3>💳 Payment Method</h3>

                <div className="checkout-payment-options">
                  <label className={`checkout-payment-card ${formData.paymentMethod === 'Cash on Delivery' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Cash on Delivery"
                      checked={formData.paymentMethod === 'Cash on Delivery'}
                      onChange={handleChange}
                    />
                    <div className="payment-content">
                      <span className="payment-icon">💵</span>
                      <div className="payment-info">
                        <span className="payment-title">Cash on Delivery</span>
                        <span className="payment-desc">Pay when you receive</span>
                      </div>
                    </div>
                  </label>

                  <label className={`checkout-payment-card ${formData.paymentMethod === 'Online Payment (Razorpay)' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Online Payment (Razorpay)"
                      checked={formData.paymentMethod === 'Online Payment (Razorpay)'}
                      onChange={handleChange}
                    />
                    <div className="payment-content">
                      <span className="payment-icon">💳</span>
                      <div className="payment-info">
                        <span className="payment-title">Online Payment</span>
                        <span className="payment-desc">UPI, Cards, Net Banking</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 3: Order Summary */}
            {currentStep === 3 && (
              <div className="checkout-section step-content">
                <h3>📦 Order Summary</h3>

                <div className="checkout-order-items">
                  {selectedItems.map(item => (
                    <div key={item._id} className="checkout-order-item">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/50x50?text=Item';
                        }}
                      />
                      <div className="item-details">
                        <p className="item-name">{item.product.name}</p>
                        <p className="item-qty">Qty: {item.quantity}</p>
                      </div>
                      <div className="item-price">
                        ₹{((item.price || item.product.price) * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="checkout-totals">
                  <div className="checkout-total-row">
                    <span>Subtotal ({selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''})</span>
                    <span>₹{fmt(subtotal)}</span>
                  </div>
                  <div className="checkout-total-row">
                    <span>GST</span>
                    <span>₹{fmt(gst)}</span>
                  </div>
                  <div className="checkout-total-row">
                    <span>Shipping</span>
                    <span>₹{fmt(shipping)}</span>
                  </div>
                  <div className="checkout-divider"></div>
                  <div className="checkout-total-row total">
                    <span>Total</span>
                    <span>₹{fmt(total)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="checkout-actions">
              {currentStep > 1 && (
                <button
                  type="button"
                  className="checkout-btn checkout-btn-secondary"
                  onClick={handlePrevious}
                  disabled={loading}
                >
                  ← Previous
                </button>
              )}
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  className="checkout-btn checkout-btn-primary"
                  onClick={handleNext}
                  style={{ marginLeft: currentStep === 1 ? 'auto' : '0' }}
                >
                  Next →
                </button>
              ) : (
                // Place Order button - triggers form submission
                // For COD: Order is placed ONLY when user clicks this button
                // For Razorpay: Opens payment gateway
                <button
                  type="submit"
                  className="checkout-btn checkout-btn-place"
                  disabled={loading}
                >
                  {loading ? 'Placing Order...' : '🔒 Place Order'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
