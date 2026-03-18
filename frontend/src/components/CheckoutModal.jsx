import { useState, useContext, useEffect, useRef } from 'react';
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

  const getInitialFormData = () => {
    const street = user?.address?.street || '';
    const [firstPart, ...restParts] = street.split(',').map((part) => part.trim()).filter(Boolean);

    return {
      name: user?.name || '',
      phone: user?.phone || '',
      pincode: user?.address?.zipCode || '',
      houseNo: firstPart || '',
      area: restParts.join(', ') || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      addressType: 'Home',
      makeDefaultAddress: false,
      paymentMethod: 'Cash on Delivery'
    };
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(getInitialFormData);

  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [error, setError] = useState('');
  const [checkoutStage, setCheckoutStage] = useState('FORM'); // FORM | PROCESSING | SUCCESS
  const [paymentResult, setPaymentResult] = useState({
    status: 'idle', // idle | success | failed
    message: '',
    details: null
  });
  const [paymentRetryContext, setPaymentRetryContext] = useState(null);
  const [confirmationData, setConfirmationData] = useState(null);
  const [redirectCountdown, setRedirectCountdown] = useState(7);
  const [fieldErrors, setFieldErrors] = useState({});
  const [pincodeLookupLoading, setPincodeLookupLoading] = useState(false);
  const [pincodeAutoFilled, setPincodeAutoFilled] = useState(false);
  const [pincodeHint, setPincodeHint] = useState('');
  const wasOpenRef = useRef(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    const openedNow = isOpen && !wasOpenRef.current;

    if (isOpen) {
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';

      // Reset flow ONLY when modal transitions from closed -> open.
      // This preserves step progression/results during payment success updates.
      if (openedNow) {
        setCheckoutStage('FORM');
        setCurrentStep(1);
        setLoading(false);
        setPaymentProcessing(false);
        setPaymentResult({ status: 'idle', message: '', details: null });
        setPaymentRetryContext(null);
        setConfirmationData(null);
        setRedirectCountdown(7);
        setFieldErrors({});
        setPincodeLookupLoading(false);
        setPincodeAutoFilled(false);
        setPincodeHint('');
        setError('');
        setFormData(getInitialFormData());
      }
    } else {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
    }

    wasOpenRef.current = isOpen;

    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
    };
  }, [isOpen, user]);

  useEffect(() => {
    if (checkoutStage !== 'FORM' || currentStep !== 4 || !confirmationData) return;

    setRedirectCountdown(7);

    const intervalId = setInterval(() => {
      setRedirectCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const timeoutId = setTimeout(() => {
      closeConfirmationAndNavigate('/orders');
    }, 7000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [checkoutStage, currentStep, confirmationData]);

  const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    let nextValue = type === 'checkbox' ? checked : value;

    if (name === 'phone') {
      nextValue = String(value).replace(/\D/g, '').slice(0, 10);
    }

    if (name === 'pincode') {
      nextValue = String(value).replace(/\D/g, '').slice(0, 6);
      if (String(nextValue).length < 6) {
        setPincodeAutoFilled(false);
        setPincodeHint('');
      }
    }

    setFormData((prev) => ({ ...prev, [name]: nextValue }));

    setFieldErrors((prev) => {
      const nextErrors = { ...prev, [name]: '' };
      if (name === 'pincode') {
        nextErrors.city = '';
        nextErrors.state = '';
      }
      return nextErrors;
    });
  };

  useEffect(() => {
    const pin = String(formData.pincode || '').trim();

    if (!/^\d{6}$/.test(pin)) {
      setPincodeLookupLoading(false);
      return;
    }

    let isCancelled = false;

    const lookupPincode = async () => {
      setPincodeLookupLoading(true);
      setPincodeHint('Detecting city and state...');

      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = await res.json();
        const entry = Array.isArray(data) ? data[0] : null;
        const office = entry?.PostOffice?.[0];

        if (isCancelled) return;

        if (entry?.Status === 'Success' && office) {
          setFormData((prev) => ({
            ...prev,
            city: office.District || prev.city,
            state: office.State || prev.state
          }));
          setPincodeAutoFilled(true);
          setPincodeHint('City and state auto-filled from pincode.');
          setFieldErrors((prev) => ({ ...prev, city: '', state: '', pincode: '' }));
        } else {
          setPincodeAutoFilled(false);
          setPincodeHint('Could not auto-detect city/state. Please enter manually.');
        }
      } catch {
        if (!isCancelled) {
          setPincodeAutoFilled(false);
          setPincodeHint('Could not auto-detect city/state. Please enter manually.');
        }
      } finally {
        if (!isCancelled) setPincodeLookupLoading(false);
      }
    };

    lookupPincode();

    return () => {
      isCancelled = true;
    };
  }, [formData.pincode]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (paymentProcessing || checkoutStage === 'PROCESSING') return;
    if (e.target.classList.contains('checkout-modal-overlay')) {
      onClose();
    }
  };

  // Step navigation handlers
  const validateStep1 = () => {
    const nextErrors = {};

    if (!String(formData.name || '').trim()) nextErrors.name = 'Full Name is required';
    if (!/^\d{10}$/.test(String(formData.phone || ''))) nextErrors.phone = 'Phone number must be 10 digits';
    if (!/^\d{6}$/.test(String(formData.pincode || ''))) nextErrors.pincode = 'Pincode must be 6 digits';
    if (!String(formData.houseNo || '').trim()) nextErrors.houseNo = 'House No / Building Name is required';
    if (!String(formData.area || '').trim()) nextErrors.area = 'Area / Street / Landmark is required';
    if (!String(formData.city || '').trim()) nextErrors.city = 'City is required';
    if (!String(formData.state || '').trim()) nextErrors.state = 'State is required';

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setError('Please correct the highlighted fields before proceeding.');
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

  const moveToConfirmationStep = (confirmationPayload) => {
    setConfirmationData(confirmationPayload);
    setCheckoutStage('FORM');
    setCurrentStep(4);
  };

  const closeConfirmationAndNavigate = async (path = '/products') => {
    window.dispatchEvent(new CustomEvent('order-placed'));
    await fetchCart();
    setConfirmationData(null);
    setCheckoutStage('FORM');
    setCurrentStep(1);
    onClose();
    navigate(path, { replace: true });
  };

  const failPaymentFlow = (message, shouldToast = true) => {
    setError(message);
    if (shouldToast) showError(message);
    setPaymentResult({
      status: 'failed',
      message,
      details: null
    });
    setCheckoutStage('FORM');
    setCurrentStep(3);
    setLoading(false);
    setPaymentProcessing(false);
  };

  const handleRazorpayPayment = async (orderItems, shippingAddress) => {
    setCurrentStep(4);
    setCheckoutStage('PROCESSING');
    setPaymentProcessing(true);
    setLoading(true);
    setPaymentResult({ status: 'idle', message: '', details: null });

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      failPaymentFlow('Failed to load Razorpay. Please check your internet connection.');
      return;
    }

    try {
      const { data } = await API.post('/razorpay/create-order', {
        items: orderItems,
        shippingAddress
      });

      if (!data.success) {
        failPaymentFlow(data.message || 'Could not initiate payment.');
        return;
      }

      const razorpayKey = (import.meta.env.VITE_RAZORPAY_TEST_KEY || data.keyId || '').trim();

      if (!razorpayKey) {
        failPaymentFlow('Razorpay key not configured. Please set test key and try again.');
        return;
      }

      if (!razorpayKey.startsWith('rzp_test_')) {
        failPaymentFlow('Please configure a Razorpay TEST key (rzp_test_...) for this environment.');
        return;
      }

      const options = {
        key: razorpayKey,
        amount: data.amount,
        currency: data.currency,
        name: 'Mani Electrical Shop',
        description: 'Order Payment',
        order_id: data.razorpayOrderId,
        handler: async (response) => {
          try {
            const {
              razorpay_order_id: razorpayOrderId,
              razorpay_payment_id: razorpayPaymentId,
              razorpay_signature: razorpaySignature
            } = response;

            const verifyRes = await API.post('/razorpay/verify-payment', {
              razorpayOrderId,
              razorpayPaymentId,
              razorpaySignature,
              items: data.validatedItems,
              shippingAddress: data.shippingAddress,
              subtotal: data.subtotal,
              gst: data.gst,
              shipping: data.shipping,
              totalAmount: data.totalAmount
            });

            if (verifyRes.data.success) {
              const confirmationPayload = {
                order: verifyRes.data.order,
                items: data.validatedItems,
                totalAmount: data.totalAmount,
                paymentId: razorpayPaymentId,
                razorpayOrderId,
                razorpaySignature,
                razorpayPaymentId,
                paidAmount: Number(data.amount || 0) / 100,
                paymentMethod: 'RAZORPAY',
                paymentStatus: 'paid',
                orderId: verifyRes.data.order._id
              };

              setPaymentResult({
                status: 'success',
                message: 'Payment successful!',
                details: confirmationPayload
              });
              setLoading(false);
              setPaymentProcessing(false);
              success('Payment successful! Order placed. 🎉');
              moveToConfirmationStep(confirmationPayload);
            } else {
              failPaymentFlow('Payment verification failed. Please contact support.');
            }
          } catch (verifyErr) {
            failPaymentFlow(verifyErr.response?.data?.message || 'Payment verification error.');
          } finally {
            setLoading(false);
            setPaymentProcessing(false);
          }
        },
        prefill: {
          name: shippingAddress.name,
          email: user?.email || '',
          contact: shippingAddress.phone
        },
        theme: { color: '#0f172a' },
        modal: {
          ondismiss: () => {
            failPaymentFlow('Payment cancelled. Your order was NOT placed.', false);
          }
        }
      };

      if (!window.Razorpay) {
        failPaymentFlow('Razorpay checkout failed to initialize. Please try again.');
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        failPaymentFlow(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to initiate Razorpay payment. Please try again.';
      failPaymentFlow(msg);
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
      if (!formData.name || !formData.phone || !formData.houseNo || !formData.area || !formData.city || !formData.state || !formData.pincode) {
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
        street: `${formData.houseNo}, ${formData.area}`,
        city: formData.city,
        state: formData.state,
        zipCode: formData.pincode,
        country: 'India'
      };

      const orderItems = selectedItems.map(item => ({
        product: item.product._id,
        quantity: item.quantity
      }));

      setPaymentRetryContext({ orderItems, shippingAddress });

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
          const confirmationPayload = {
            order: data.order,
            items: data.order.items,
            totalAmount: data.order.totalAmount,
            paymentMethod: 'Cash on Delivery',
            paymentStatus: 'pending',
            orderId: data.order._id
          };

          setPaymentResult({
            status: 'success',
            message: 'Order placed successfully!',
            details: confirmationPayload
          });
          setLoading(false);
          moveToConfirmationStep(confirmationPayload);
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
    <div
      className={`checkout-modal-overlay ${paymentProcessing || checkoutStage === 'PROCESSING' ? 'checkout-modal-overlay--processing' : ''}`}
      onClick={handleBackdropClick}
    >
      <div className={`checkout-modal ${paymentProcessing || checkoutStage === 'PROCESSING' ? 'checkout-modal--processing' : ''} ${checkoutStage === 'FORM' && currentStep === 4 && confirmationData ? 'checkout-modal--fit-content' : ''}`}>
        <button
          className="checkout-modal-close"
          onClick={currentStep === 4 && confirmationData ? () => closeConfirmationAndNavigate('/products') : onClose}
          aria-label="Close"
          disabled={paymentProcessing || checkoutStage === 'PROCESSING'}
        >
          ✕
        </button>

        <div className="checkout-modal-header">
          <h2>🛒 Complete Your Order</h2>
        </div>

        {/* Step Indicator */}
        {checkoutStage === 'FORM' && (
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
          <div className={`step-item ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
            <div className="step-circle">{currentStep > 3 ? '✓' : '3'}</div>
            <span className="step-label">Order Summary</span>
          </div>
          <div className="step-line"></div>
          <div className={`step-item ${currentStep >= 4 ? 'active' : ''}`}>
            <div className="step-circle">4</div>
            <span className="step-label">Confirmation</span>
          </div>
        </div>
        )}

        {error && !(checkoutStage === 'FORM' && currentStep === 1) && (
          <div className="checkout-modal-error">{error}</div>
        )}

        <div className={`checkout-modal-body ${checkoutStage === 'FORM' && currentStep === 4 && confirmationData ? 'checkout-modal-body--success' : ''}`}>
          <form onSubmit={handleSubmit}>
            
            {/* STEP 1: Customer Details */}
            {currentStep === 1 && (
              <div className="checkout-section step-content checkout-section--address">
                <div className="checkout-address-card">
                  <div className="checkout-address-head">
                    <div className="checkout-address-icon" aria-hidden="true">📍</div>
                    <div>
                      <h3 className="checkout-address-title">Delivery Address</h3>
                      <p className="checkout-address-subtitle">Where should we deliver your order?</p>
                    </div>
                  </div>

                <div className="checkout-address-section">
                  <p className="checkout-address-section-title">Contact Info</p>
                <div className="checkout-address-grid">
                  <div className="checkout-field">
                    <div className="checkout-float-input">
                      <input
                        id="checkout-name"
                        type="text"
                        name="name"
                        placeholder=" "
                        value={formData.name}
                        onChange={handleChange}
                        autoFocus
                        className={fieldErrors.name ? 'is-invalid' : ''}
                      />
                      <label htmlFor="checkout-name">Full Name <span className="required">*</span></label>
                    </div>
                    {fieldErrors.name && <p className="checkout-inline-error">{fieldErrors.name}</p>}
                  </div>

                  <div className="checkout-field">
                    <div className="checkout-float-input">
                      <input
                        id="checkout-phone"
                        type="tel"
                        name="phone"
                        placeholder=" "
                        value={formData.phone}
                        onChange={handleChange}
                        inputMode="numeric"
                        maxLength={10}
                        className={fieldErrors.phone ? 'is-invalid' : ''}
                      />
                      <label htmlFor="checkout-phone">Phone Number <span className="required">*</span></label>
                    </div>
                    {fieldErrors.phone && <p className="checkout-inline-error">{fieldErrors.phone}</p>}
                  </div>
                </div>
                </div>

                <div className="checkout-address-divider" aria-hidden="true"></div>

                <div className="checkout-address-section">
                  <p className="checkout-address-section-title">Address Info</p>
                  <div className="checkout-address-grid">

                  <div className="checkout-field checkout-field--full">
                    <div className="checkout-float-input checkout-float-input--status">
                      <input
                        id="checkout-pincode"
                        type="text"
                        name="pincode"
                        placeholder=" "
                        value={formData.pincode}
                        onChange={handleChange}
                        inputMode="numeric"
                        maxLength={6}
                        className={fieldErrors.pincode ? 'is-invalid' : ''}
                      />
                      <label htmlFor="checkout-pincode">Pincode <span className="required">*</span></label>
                      {pincodeLookupLoading && <span className="checkout-pin-loader" aria-hidden="true"></span>}
                    </div>
                    <p className="checkout-hint">
                      {pincodeHint || 'Enter pincode to auto-detect city and state.'}
                    </p>
                    {fieldErrors.pincode && <p className="checkout-inline-error">{fieldErrors.pincode}</p>}
                  </div>

                  <div className="checkout-field checkout-field--full">
                    <div className="checkout-float-input">
                      <input
                        id="checkout-house"
                        type="text"
                        name="houseNo"
                        placeholder=" "
                        value={formData.houseNo}
                        onChange={handleChange}
                        className={fieldErrors.houseNo ? 'is-invalid' : ''}
                      />
                      <label htmlFor="checkout-house">House / Building <span className="required">*</span></label>
                    </div>
                    {fieldErrors.houseNo && <p className="checkout-inline-error">{fieldErrors.houseNo}</p>}
                  </div>

                  <div className="checkout-field checkout-field--full">
                    <div className="checkout-float-input">
                      <input
                        id="checkout-area"
                        type="text"
                        name="area"
                        placeholder=" "
                        value={formData.area}
                        onChange={handleChange}
                        className={fieldErrors.area ? 'is-invalid' : ''}
                      />
                      <label htmlFor="checkout-area">Area / Street / Landmark <span className="required">*</span></label>
                    </div>
                    {fieldErrors.area && <p className="checkout-inline-error">{fieldErrors.area}</p>}
                  </div>
                  </div>
                </div>

                <div className="checkout-address-divider" aria-hidden="true"></div>

                <div className="checkout-address-section">
                  <p className="checkout-address-section-title">Location</p>
                  <div className="checkout-address-grid">

                  <div className="checkout-field">
                    <div className="checkout-float-input">
                      <input
                        id="checkout-city"
                        type="text"
                        name="city"
                        placeholder=" "
                        value={formData.city}
                        onChange={handleChange}
                        readOnly={pincodeAutoFilled}
                        disabled={pincodeAutoFilled}
                        className={fieldErrors.city ? 'is-invalid' : ''}
                      />
                      <label htmlFor="checkout-city">City <span className="required">*</span></label>
                    </div>
                    {fieldErrors.city && <p className="checkout-inline-error">{fieldErrors.city}</p>}
                  </div>

                  <div className="checkout-field">
                    <div className="checkout-float-input">
                      <input
                        id="checkout-state"
                        type="text"
                        name="state"
                        placeholder=" "
                        value={formData.state}
                        onChange={handleChange}
                        readOnly={pincodeAutoFilled}
                        disabled={pincodeAutoFilled}
                        className={fieldErrors.state ? 'is-invalid' : ''}
                      />
                      <label htmlFor="checkout-state">State <span className="required">*</span></label>
                    </div>
                    {fieldErrors.state && <p className="checkout-inline-error">{fieldErrors.state}</p>}
                  </div>
                  </div>
                </div>

                <div className="checkout-address-divider" aria-hidden="true"></div>

                <div className="checkout-address-footer-row">

                  <div className="checkout-field">
                    <label className="checkout-subsection-label">Address Type</label>
                    <div className="checkout-address-type">
                      <label className="checkout-radio-pill">
                        <input
                          type="radio"
                          name="addressType"
                          value="Home"
                          checked={formData.addressType === 'Home'}
                          onChange={handleChange}
                        />
                        <span className="checkout-radio-pill-text">Home</span>
                      </label>
                      <label className="checkout-radio-pill">
                        <input
                          type="radio"
                          name="addressType"
                          value="Work"
                          checked={formData.addressType === 'Work'}
                          onChange={handleChange}
                        />
                        <span className="checkout-radio-pill-text">Work</span>
                      </label>
                    </div>
                  </div>

                  <div className="checkout-field">
                    <label className="checkout-default-checkbox">
                      <input
                        type="checkbox"
                        name="makeDefaultAddress"
                        checked={formData.makeDefaultAddress}
                        onChange={handleChange}
                      />
                      <span>Save as default address</span>
                    </label>
                  </div>
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
            {checkoutStage === 'FORM' && currentStep === 3 && (
              <div className="checkout-section step-content">
                <h3>📦 Order Summary</h3>

                <div className="checkout-step3-grid">
                  <div className="checkout-step3-card">
                    <h4 className="checkout-step3-title">Order Summary</h4>
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

                  <div className="checkout-step3-card checkout-step3-card--payment">
                    <h4 className="checkout-step3-title">Payment Details</h4>
                    <div className="checkout-confirmation-row">
                      <span>Method</span>
                      <span>{formData.paymentMethod === 'Online Payment (Razorpay)' ? 'Razorpay' : 'Cash on Delivery'}</span>
                    </div>
                    <div className="checkout-confirmation-row">
                      <span>Status</span>
                      <span>{formData.paymentMethod === 'Online Payment (Razorpay)' ? 'Pending' : 'Pending'}</span>
                    </div>
                    <div className="checkout-confirmation-row checkout-confirmation-row--amount">
                      <span>Total Amount</span>
                      <span>₹{fmt(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PROCESSING STAGE */}
            {checkoutStage === 'PROCESSING' && (
              <div className="checkout-section step-content checkout-processing-view">
                <div className="checkout-processing-spinner" aria-hidden="true"></div>
                <h3>Processing Payment</h3>
                <p className="checkout-processing-text">Opening secure payment...</p>
                <p className="checkout-processing-subtext">Please wait and complete payment in Razorpay.</p>
              </div>
            )}

            {/* STEP 4: Confirmation */}
            {checkoutStage === 'FORM' && currentStep === 4 && confirmationData && (
              <div className="checkout-section step-content checkout-payment-result">
                <div className="checkout-success-check-wrap" aria-hidden="true">
                  <svg className="checkout-success-check-svg" viewBox="0 0 52 52">
                    <circle className="checkout-success-check-circle" cx="26" cy="26" r="25" />
                    <path className="checkout-success-check-path" d="M14 27l8 8 16-16" />
                  </svg>
                </div>

                <h3 className="checkout-success-title">Order Confirmed!</h3>
                <p className="checkout-success-subtitle">
                  Your order has been placed successfully
                </p>

                <div className="checkout-confirmation-ids checkout-inline-confirmation-block">
                  <p><strong>Order ID:</strong> {confirmationData.order?.orderNumber || confirmationData.orderId}</p>
                  {(confirmationData.razorpayPaymentId || confirmationData.paymentId) && (
                    <p><strong>Payment ID:</strong> {confirmationData.razorpayPaymentId || confirmationData.paymentId}</p>
                  )}
                </div>

                <div className="checkout-confirmation-summary checkout-inline-confirmation-block">
                  <h4>Payment Summary</h4>
                  <div className="checkout-confirmation-row">
                    <span>Method</span>
                    <span>{String(confirmationData.paymentMethod || '').toUpperCase() === 'RAZORPAY' ? 'Razorpay' : 'Cash on Delivery'}</span>
                  </div>
                  <div className="checkout-confirmation-row">
                    <span>Status</span>
                    <span>{String(confirmationData.paymentStatus || '').toLowerCase() === 'paid' ? 'Paid' : 'Pending'}</span>
                  </div>
                  <div className="checkout-confirmation-row">
                    <span>Amount</span>
                    <span>₹{fmt(confirmationData.paidAmount || confirmationData.totalAmount || 0)}</span>
                  </div>
                </div>

                <p className="checkout-redirect-countdown">Redirecting in {redirectCountdown} seconds...</p>

                <div className="checkout-confirmation-actions checkout-success-actions">
                  <button
                    type="button"
                    className="checkout-btn checkout-btn-place"
                    onClick={() => closeConfirmationAndNavigate('/orders')}
                  >
                    View My Orders
                  </button>
                  <button
                    type="button"
                    className="checkout-btn checkout-btn-secondary"
                    onClick={() => closeConfirmationAndNavigate('/products')}
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            {checkoutStage === 'FORM' && currentStep < 4 && (
            <div className={`checkout-actions ${currentStep === 1 ? 'checkout-actions--address' : ''}`}>
              {currentStep > 1 && currentStep < 4 && (
                <button
                  type="button"
                  className="checkout-btn checkout-btn-secondary"
                  onClick={handlePrevious}
                  disabled={loading || paymentProcessing}
                >
                  ← Previous
                </button>
              )}
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  className={`checkout-btn checkout-btn-primary ${currentStep === 1 ? 'checkout-btn-address' : ''}`}
                  onClick={handleNext}
                  disabled={loading || paymentProcessing}
                  style={currentStep === 1 ? undefined : { marginLeft: '0' }}
                >
                  {currentStep === 1 ? 'Deliver Here' : 'Next →'}
                </button>
              ) : currentStep === 3 ? (
                // Place Order button - triggers form submission
                // For COD: Order is placed ONLY when user clicks this button
                // For Razorpay: Opens payment gateway
                <button
                  type="submit"
                  className="checkout-btn checkout-btn-place"
                  disabled={loading || paymentProcessing}
                >
                  {loading || paymentProcessing ? 'Opening secure payment...' : '🔒 Place Order'}
                </button>
              ) : null}
            </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
