import { useState, useContext, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { useLoading } from '../../context/LoadingContext';
import API from '../../services/api';
import { calculateOrderTotals } from '../../utils/pricingUtils';
import useCategories from '../../hooks/useCategories';
import './Checkout.css';

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

const INDIA_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
];

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, clearCartStateImmediately } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { success, error: showError } = useToast();

  const selectedItemIds = location.state?.selectedItems || [];
  const steps = ['Address', 'Payment', 'Review', 'Confirmation'];
  const [currentStep, setCurrentStep] = useState(1);

  const streetRaw = user?.address?.street || '';
  const [housePart, ...areaParts] = streetRaw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    pincode: user?.address?.zipCode || '',
    house: housePart || '',
    area: areaParts.join(', ') || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    addressType: 'Home',
    saveAddress: false,
    paymentMethod: 'Cash on Delivery'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [confirmationData, setConfirmationData] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const { showLoader, hideLoader } = useLoading();

  const { categoriesMap } = useCategories();

  useEffect(() => {
    if (orderSuccess) return;
    if (!cart || cart.items.length === 0 || selectedItemIds.length === 0) {
      navigate('/cart');
    }
  }, [cart, selectedItemIds.length, navigate, orderSuccess]);

  const selectedItems = useMemo(() => {
    const allItems = cart?.items || [];
    return allItems.filter((item) => selectedItemIds.includes(item.product._id));
  }, [cart, selectedItemIds]);

  const validateSingleField = (name, value) => {
    const text = String(value || '').trim();

    if (name === 'name') return text ? '' : 'Full Name is required';
    if (name === 'phone') return /^\d{10}$/.test(String(value || '')) ? '' : 'Phone number must be 10 digits';
    if (name === 'pincode') return /^\d{6}$/.test(String(value || '')) ? '' : 'Enter a valid 6-digit pincode';
    if (name === 'house') return text ? '' : 'House / Building is required';
    if (name === 'area') return text ? '' : 'Area / Street / Landmark is required';
    if (name === 'city') return text ? '' : 'City is required';
    if (name === 'state') return text ? '' : 'State is required';

    return '';
  };

  const isAddressFormValid = useMemo(
    () =>
      !!formData.name.trim() &&
      /^\d{10}$/.test(formData.phone) &&
      /^\d{6}$/.test(formData.pincode) &&
      !!formData.house.trim() &&
      !!formData.area.trim() &&
      !!formData.city.trim() &&
      !!formData.state.trim(),
    [formData]
  );

  if (!selectedItems || selectedItems.length === 0) {
    return (
      <>
        <Navbar />
        <div className="co-page">
          <div className="co-container">
            <div className="co-empty">
              <h2>No items selected for checkout</h2>
              <p>Please select items from your cart</p>
              <button
                onClick={() => navigate('/cart')}
                className="co-place-btn"
                style={{ maxWidth: 260, margin: '0 auto' }}
              >
                Back to Cart
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const { subtotal, gst, shipping, total } = calculateOrderTotals(selectedItems, categoriesMap);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let nextValue = type === 'checkbox' ? checked : value;

    if (name === 'phone') nextValue = value.replace(/\D/g, '').slice(0, 10);
    if (name === 'pincode') nextValue = value.replace(/\D/g, '').slice(0, 6);

    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    setFieldErrors((prev) => ({
      ...prev,
      [name]: prev[name] ? validateSingleField(name, nextValue) : ''
    }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setFieldErrors((prev) => ({ ...prev, [name]: validateSingleField(name, value) }));
  };

  const validateAddressStep = () => {
    const nextErrors = {};
    ['name', 'phone', 'pincode', 'house', 'area', 'city', 'state'].forEach((field) => {
      const msg = validateSingleField(field, formData[field]);
      if (msg) nextErrors[field] = msg;
    });

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError('Please correct the highlighted fields.');
      return false;
    }

    setError('');
    return true;
  };

  const validatePaymentStep = () => {
    if (!formData.paymentMethod) {
      setError('Please select a payment method.');
      return false;
    }

    setError('');
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateAddressStep()) return;
    if (currentStep === 2 && !validatePaymentStep()) return;
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

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
        amount: data.amount,
        currency: data.currency,
        name: 'Mani Electricals',
        description: 'Secure Checkout',
        image: `${window.location.origin}/logo.png`,
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
              success('Payment successful! Order placed.');
              setOrderSuccess(true);
              clearCartStateImmediately?.();
              localStorage.removeItem('cart');
              sessionStorage.removeItem('cart');
              window.dispatchEvent(new CustomEvent('order-placed'));
              setConfirmationData({
                order: verifyRes.data.order,
                items: data.validatedItems,
                totalAmount: data.totalAmount,
                paymentId: response.razorpay_payment_id,
                paymentMethod: 'Razorpay',
                paymentStatus: 'Paid'
              });
              setCurrentStep(4);
            } else {
              setError('Payment verification failed. Please contact support.');
              showError('Payment verification failed.');
            }
          } catch (verifyErr) {
            setError(verifyErr.response?.data?.message || 'Payment verification error.');
            showError('Payment verification error.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: shippingAddress.name,
          email: user?.email || '',
          contact: shippingAddress.phone
        },
        theme: { color: '#2563eb' },
        modal: {
          backdropclose: false,
          animation: true,
          ondismiss: () => {
            setError('Payment cancelled. Your order was NOT placed.');
            showError('Payment cancelled.');
            setLoading(false);
            setCurrentStep(3);
          }
        }
      };

      setPaymentProcessing(false);

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        setError(`Payment failed: ${response.error.description}`);
        showError('Payment failed. Please try again.');
        setLoading(false);
        setCurrentStep(3);
      });
      rzp.open();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to initiate Razorpay payment.';
      setError(msg);
      showError(msg);
      setLoading(false);
      setPaymentProcessing(false);
      setCurrentStep(3);
    }
  };

  const handlePlaceOrder = async () => {
    setError('');
    setLoading(true);

    try {
      const shippingAddress = {
        name: formData.name,
        phone: formData.phone,
        street: `${formData.house}, ${formData.area}`,
        city: formData.city,
        state: formData.state,
        zipCode: formData.pincode,
        country: 'India'
      };

      const orderItems = selectedItems.map((item) => ({
        product: item.product._id,
        quantity: item.quantity
      }));

      if (formData.paymentMethod === 'Online Payment (Razorpay)') {
        await handleRazorpayPayment(orderItems, shippingAddress);
        return;
      }

      const orderData = {
        items: orderItems,
        shippingAddress,
        paymentMethod: formData.paymentMethod,
        paymentDetails: {}
      };

      const { data } = await API.post('/orders', orderData);

      if (data.success) {
        showLoader('Order placed! Preparing your confirmation…');
        setOrderSuccess(true);
        clearCartStateImmediately?.();
        localStorage.removeItem('cart');
        sessionStorage.removeItem('cart');
        window.dispatchEvent(new CustomEvent('order-placed'));
        setConfirmationData({
          order: data.order,
          items: data.order.items,
          totalAmount: data.order.totalAmount,
          paymentMethod: 'Cash on Delivery',
          paymentStatus: 'Pending'
        });
        setTimeout(() => {
          hideLoader();
          navigate('/order-confirmation', {
            state: {
              order: data.order,
              items: data.order.items,
              totalAmount: data.order.totalAmount,
              paymentMethod: 'Cash on Delivery',
              paymentStatus: 'Pending'
            }
          });
        }, 1300);
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
      <div className="co-page">
        <div className="co-container">
          <div className="co-header">
            <span className="co-header-icon">🛍️</span>
            <h1 className="co-title">Checkout</h1>
          </div>

          <div className="co-progress">
            {steps.map((label, idx) => {
              const stepIndex = idx + 1;
              const isDone = stepIndex < currentStep;
              const isActive = stepIndex === currentStep;
              return (
                <div className="co-progress-step" key={label}>
                  <div className={`co-progress-step ${isDone ? 'co-progress-step--done' : ''} ${isActive ? 'co-progress-step--active' : ''}`}>
                    <span className="co-progress-dot">{isDone ? '✓' : stepIndex}</span>
                    <span className="co-progress-label">{label}</span>
                  </div>
                  {stepIndex < steps.length && (
                    <span className={`co-progress-line ${isDone ? 'co-progress-line--done' : ''}`}></span>
                  )}
                </div>
              );
            })}
          </div>

          {error && <div className="co-error-banner">{error}</div>}

          <div className="co-grid">
            <div className="co-left">
              {currentStep === 1 && (
                <section className="co-card">
                  <h2 className="co-card-title">
                    <span className="co-card-title-icon">📍</span>
                    Delivery Address
                  </h2>

                  <div className="co-subsection-title">Contact Info</div>
                  <div className="co-field-row co-field-row--2">
                    <div className="co-field">
                      <label>Full Name <span className="co-required">*</span></label>
                      <div className="co-input-wrap">
                        <span className="co-input-icon">👤</span>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} onBlur={handleBlur} />
                      </div>
                      {fieldErrors.name && <p className="co-field-error">{fieldErrors.name}</p>}
                    </div>

                    <div className="co-field">
                      <label>Phone Number <span className="co-required">*</span></label>
                      <div className="co-input-wrap">
                        <span className="co-input-icon">📞</span>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} onBlur={handleBlur} />
                      </div>
                      {fieldErrors.phone && <p className="co-field-error">{fieldErrors.phone}</p>}
                    </div>
                  </div>

                  <div className="co-subsection-title">Address Info</div>
                  <div className="co-field-row co-field-row--2">
                    <div className="co-field">
                      <label>Pincode <span className="co-required">*</span></label>
                      <div className="co-input-wrap">
                        <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} onBlur={handleBlur} />
                      </div>
                      {fieldErrors.pincode && <p className="co-field-error">{fieldErrors.pincode}</p>}
                    </div>

                    <div className="co-field">
                      <label>House / Building <span className="co-required">*</span></label>
                      <div className="co-input-wrap">
                        <input type="text" name="house" value={formData.house} onChange={handleChange} onBlur={handleBlur} />
                      </div>
                      {fieldErrors.house && <p className="co-field-error">{fieldErrors.house}</p>}
                    </div>
                  </div>

                  <div className="co-field">
                    <label>Area / Street / Landmark <span className="co-required">*</span></label>
                    <div className="co-input-wrap">
                      <span className="co-input-icon">📍</span>
                      <input type="text" name="area" value={formData.area} onChange={handleChange} onBlur={handleBlur} />
                    </div>
                    {fieldErrors.area && <p className="co-field-error">{fieldErrors.area}</p>}
                  </div>

                  <div className="co-subsection-title">Location</div>
                  <div className="co-field-row co-field-row--2">
                    <div className="co-field">
                      <label>City <span className="co-required">*</span></label>
                      <div className="co-input-wrap">
                        <input type="text" name="city" value={formData.city} onChange={handleChange} onBlur={handleBlur} />
                      </div>
                      {fieldErrors.city && <p className="co-field-error">{fieldErrors.city}</p>}
                    </div>

                    <div className="co-field">
                      <label>State <span className="co-required">*</span></label>
                      <select className="co-select" name="state" value={formData.state} onChange={handleChange} onBlur={handleBlur}>
                        <option value="">Select State</option>
                        {INDIA_STATES.map((stateName) => (
                          <option key={stateName} value={stateName}>{stateName}</option>
                        ))}
                      </select>
                      {fieldErrors.state && <p className="co-field-error">{fieldErrors.state}</p>}
                    </div>
                  </div>

                  <div className="co-field-row co-field-row--2">
                    <div className="co-field">
                      <label>Address Type</label>
                      <div className="co-pill-group">
                        <button
                          type="button"
                          className={`co-pill ${formData.addressType === 'Home' ? 'co-pill--active' : ''}`}
                          onClick={() => setFormData((prev) => ({ ...prev, addressType: 'Home' }))}
                        >
                          Home
                        </button>
                        <button
                          type="button"
                          className={`co-pill ${formData.addressType === 'Work' ? 'co-pill--active' : ''}`}
                          onClick={() => setFormData((prev) => ({ ...prev, addressType: 'Work' }))}
                        >
                          Work
                        </button>
                      </div>
                    </div>

                    <div className="co-field co-field--align-end">
                      <label className="co-save-address">
                        <input type="checkbox" name="saveAddress" checked={formData.saveAddress} onChange={handleChange} />
                        <span>Save address</span>
                      </label>
                    </div>
                  </div>

                  <button className="co-place-btn" type="button" onClick={handleNext} disabled={!isAddressFormValid || loading}>
                    Deliver to this address →
                  </button>
                </section>
              )}

              {currentStep === 2 && (
                <section className="co-card">
                  <h2 className="co-card-title"><span className="co-card-title-icon">💳</span>Payment Method</h2>

                  <div className="co-payment-grid">
                    <button
                      type="button"
                      className={`co-payment-card ${formData.paymentMethod === 'Cash on Delivery' ? 'co-payment-card--active' : ''}`}
                      onClick={() => setFormData((p) => ({ ...p, paymentMethod: 'Cash on Delivery' }))}
                    >
                      <span className="co-payment-emoji">💵</span>
                      <span className="co-payment-info">
                        <span className="co-payment-title">Cash on Delivery</span>
                        <span className="co-payment-sub">Pay when your order arrives</span>
                      </span>
                      {formData.paymentMethod === 'Cash on Delivery' && <span className="co-payment-check">✓</span>}
                    </button>

                    <button
                      type="button"
                      className={`co-payment-card ${formData.paymentMethod === 'Online Payment (Razorpay)' ? 'co-payment-card--active' : ''}`}
                      onClick={() => setFormData((p) => ({ ...p, paymentMethod: 'Online Payment (Razorpay)' }))}
                    >
                      <span className="co-payment-emoji">🔐</span>
                      <span className="co-payment-info">
                        <span className="co-payment-title">Online Payment (Razorpay)</span>
                        <span className="co-payment-sub">UPI, Cards, Net Banking and Wallets</span>
                      </span>
                      {formData.paymentMethod === 'Online Payment (Razorpay)' && <span className="co-payment-check">✓</span>}
                    </button>
                  </div>

                  <div className="co-action-row">
                    <button className="co-btn-secondary" type="button" onClick={handleBack}>Back</button>
                    <button className="co-place-btn" type="button" onClick={handleNext}>Continue to Review</button>
                  </div>
                </section>
              )}

              {currentStep === 3 && (
                <section className="co-card">
                  <h2 className="co-card-title"><span className="co-card-title-icon">🧾</span>Review Order</h2>

                  <div className="co-review-block">
                    <h3 className="co-review-title">Deliver To</h3>
                    <p>{formData.name} • {formData.phone}</p>
                    <p>{formData.house}, {formData.area}</p>
                    <p>{formData.city}, {formData.state} - {formData.pincode}</p>
                    <p>Address Type: {formData.addressType}</p>
                  </div>

                  <div className="co-review-block">
                    <h3 className="co-review-title">Payment</h3>
                    <p>{formData.paymentMethod === 'Online Payment (Razorpay)' ? 'Razorpay (Online)' : 'Cash on Delivery'}</p>
                  </div>

                  <div className="co-action-row">
                    <button className="co-btn-secondary" type="button" onClick={handleBack}>Back</button>
                    <button className="co-place-btn" type="button" onClick={handlePlaceOrder} disabled={loading}>
                      {loading ? 'Placing Order...' : 'Place Order'}
                    </button>
                  </div>
                </section>
              )}


            </div>

            <aside className="co-card co-card--sticky">
              <h2 className="co-card-title"><span className="co-card-title-icon">📦</span>Order Summary</h2>
              <p className="co-summary-count">{selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}</p>

              <div className="co-summary-items">
                {selectedItems.map((item) => (
                  <div className="co-summary-item" key={item._id}>
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/56?text=Item';
                      }}
                    />
                    <div className="co-summary-item-info">
                      <p className="co-summary-item-name">{item.product.name}</p>
                      <p className="co-summary-item-qty">Qty: {item.quantity}</p>
                    </div>
                    <p className="co-summary-item-price">₹{((item.price || item.product.price) * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>

              <div className="co-summary-totals">
                <div className="co-summary-row"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
                <div className="co-summary-row"><span>GST</span><span>₹{gst.toLocaleString('en-IN')}</span></div>
                <div className="co-summary-row"><span>Shipping</span><span>{shipping > 0 ? `₹${shipping.toLocaleString('en-IN')}` : <span className="co-free">FREE</span>}</span></div>
                <div className="co-summary-divider"></div>
                <div className="co-summary-total"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
              </div>

              <div className="co-trust-row">
                <span>🔒 Secure Checkout</span>
                <span>🚚 Fast Delivery</span>
                <span>✅ Trusted Payments</span>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {paymentProcessing && (
        <div className="payment-processing-overlay" role="dialog" aria-live="polite" aria-label="Processing payment">
          <div className="payment-processing-modal">
            <div className="payment-spinner" aria-hidden="true"></div>
            <h3>Preparing Secure Payment</h3>
            <p>Opening Razorpay checkout. Please do not refresh or close this tab.</p>
            <div className="payment-trust-badges">
              <span>Secure</span>
              <span>Protected</span>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default Checkout;
