import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { useLoading } from '../context/LoadingContext';
import API from '../services/api';
import CheckoutAddressStep from './checkout/CheckoutAddressStep';
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

const ORDERS_NAVIGATION_DELAY_MS = 1500;
const CONFIRMATION_DELAY_MS = 1200;

const CheckoutModal = ({ isOpen, onClose, selectedItems, subtotal = 0, gst = 0, shipping = 0, total = 0, onOrderSuccess }) => {
  const navigate = useNavigate();
  const { clearCartStateImmediately } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { error: showError } = useToast();
  const { showLoader, hideLoader } = useLoading();

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

  const getSavedAddressesFromFormData = (data) => {
    const summary = [data.houseNo, data.area, data.city, data.state, data.pincode].filter(Boolean).join(', ');

    if (!summary) return [];

    return [
      {
        id: 'saved-home',
        type: data.addressType || 'Home',
        name: data.name || user?.name || 'My Address',
        phone: data.phone || user?.phone || '',
        summary,
        data: {
          ...data,
          makeDefaultAddress: data.makeDefaultAddress || false
        }
      }
    ];
  };

  const getDeliveryEstimate = (pin) => {
    if (!/^\d{6}$/.test(pin)) return 'Enter pincode to see delivery estimate';

    const firstDigit = Number(String(pin)[0]);
    if ([1, 2, 3].includes(firstDigit)) return 'Estimated delivery: Tomorrow - 2 days';
    if ([4, 5, 6].includes(firstDigit)) return 'Estimated delivery: 2 - 4 days';
    return 'Estimated delivery: 3 - 5 days';
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
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [ordersNavigationLoading, setOrdersNavigationLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [deliveryEstimate, setDeliveryEstimate] = useState('Enter pincode to see delivery estimate');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState('new');
  const [locationPreview, setLocationPreview] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const wasOpenRef = useRef(false);
  const modalBodyRef = useRef(null);

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
        setOrderSuccess(false);
        setOrdersNavigationLoading(false);
        setFieldErrors({});
        setDeliveryEstimate('Enter pincode to see delivery estimate');
        setLocationPreview(null);
        setLocationLoading(false);
        setError('');

        const initialForm = getInitialFormData();
        setFormData(initialForm);

        const initialSavedAddresses = getSavedAddressesFromFormData(initialForm);
        setSavedAddresses(initialSavedAddresses);
        setSelectedSavedAddressId(initialSavedAddresses[0]?.id || 'new');

        requestAnimationFrame(() => {
          if (modalBodyRef.current) modalBodyRef.current.scrollTop = 0;
        });
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

  const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    let nextValue = type === 'checkbox' ? checked : value;

    if (name === 'phone') {
      nextValue = String(value).replace(/\D/g, '').slice(0, 10);
    }

    if (name === 'pincode') {
      nextValue = String(value).replace(/\D/g, '').slice(0, 6);
      setDeliveryEstimate(getDeliveryEstimate(nextValue));
    }

    if (['name', 'phone', 'pincode', 'houseNo', 'area', 'city', 'state', 'addressType'].includes(name)) {
      setSelectedSavedAddressId('new');
    }

    setFormData((prev) => ({ ...prev, [name]: nextValue }));

    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSelectSavedAddress = (addressId) => {
    const selected = savedAddresses.find((address) => address.id === addressId);
    if (!selected) return;

    setSelectedSavedAddressId(addressId);
    setFormData(selected.data);
    setDeliveryEstimate(getDeliveryEstimate(selected.data.pincode));
    setFieldErrors({});
  };

  const handleAddNewAddress = () => {
    setSelectedSavedAddressId('new');
    setFormData((prev) => ({
      ...prev,
      houseNo: '',
      area: '',
      city: '',
      state: '',
      pincode: ''
    }));
    setDeliveryEstimate('Enter pincode to see delivery estimate');
    setFieldErrors({});
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocationPreview({ lat, lng });

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
          );
          const data = await response.json();
          const address = data?.address || {};

          setFormData((prev) => ({
            ...prev,
            city: address.city || address.town || address.village || prev.city,
            state: address.state || prev.state,
            pincode: address.postcode ? String(address.postcode).replace(/\D/g, '').slice(0, 6) : prev.pincode,
            area: address.suburb || address.neighbourhood || prev.area
          }));

          const normalizedPin = address.postcode ? String(address.postcode).replace(/\D/g, '').slice(0, 6) : formData.pincode;
          setDeliveryEstimate(getDeliveryEstimate(normalizedPin));
        } catch {
          // Keep manual address flow when reverse geocoding fails.
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleBackdropClick = (e) => {
    if (!isOpen) return;
    if (paymentProcessing || checkoutStage === 'PROCESSING' || ordersNavigationLoading) return;
    if (e.target.classList.contains('checkout-modal-overlay')) {
      if (currentStep === 4 && confirmationData) {
        handleConfirmedModalClose();
        return;
      }
      onClose();
    }
  };

  // Step navigation handlers
  const validateStep1 = () => {
    const nextErrors = {};

    if (!String(formData.name || '').trim()) nextErrors.name = 'Full Name is required';
    if (!/^\d{10}$/.test(String(formData.phone || ''))) nextErrors.phone = 'Phone number must be 10 digits';
    if (!/^\d{6}$/.test(String(formData.pincode || ''))) nextErrors.pincode = 'Pincode must be 6 digits';
    if (!String(formData.houseNo || '').trim()) nextErrors.houseNo = 'Address is required';
    if (!String(formData.city || '').trim()) nextErrors.city = 'City is required';
    if (!String(formData.state || '').trim()) nextErrors.state = 'State is required';

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setError('Please correct the highlighted fields before proceeding.');

      const fieldIdMap = {
        name: 'checkout-name',
        phone: 'checkout-phone',
        pincode: 'checkout-pincode',
        houseNo: 'checkout-house',
        city: 'checkout-city',
        state: 'checkout-state'
      };

      const firstInvalidKey = Object.keys(nextErrors)[0];
      const firstInvalidId = fieldIdMap[firstInvalidKey];

      if (firstInvalidId) {
        requestAnimationFrame(() => {
          const el = document.getElementById(firstInvalidId);
          if (el) {
            el.focus();
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      }

      return false;
    }

    setError('');
    return true;
  };

  const handleNext = (e) => {
    // Prevent any form submission when clicking Next
    e?.preventDefault?.();
    e?.stopPropagation?.();
    
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

  const moveToConfirmationStep = async (confirmationPayload) => {
    showLoader('Preparing confirmation...');
    await new Promise((resolve) => window.setTimeout(resolve, CONFIRMATION_DELAY_MS));
    hideLoader();
    setConfirmationData(confirmationPayload);
    setCheckoutStage('FORM');
    setCurrentStep(4);
  };

  const navigateWithFallback = (primaryPath = '/orders', fallbackPath = '/') => {
    try {
      navigate(primaryPath, { replace: true });

      // Fallback to home if primary route is unavailable.
      window.setTimeout(() => {
        if (window.location.pathname !== primaryPath) {
          navigate(fallbackPath, { replace: true });
        }
      }, 220);
    } catch {
      navigate(fallbackPath, { replace: true });
    }
  };

  const closeConfirmationAndNavigate = async (path = '/products', fallbackPath = '/') => {
    setOrdersNavigationLoading(false);
    hideLoader();
    setConfirmationData(null);
    setCheckoutStage('FORM');
    onClose();
    navigateWithFallback(path, fallbackPath);
  };

  const handleOrderSuccess = (confirmationPayload) => {
    setOrderSuccess(true);
    clearCartStateImmediately?.();
    localStorage.removeItem('cart');
    sessionStorage.removeItem('cart');
    window.dispatchEvent(new CustomEvent('order-placed'));
    onOrderSuccess?.(confirmationPayload);
  };

  const handleConfirmedModalClose = () => {
    if (ordersNavigationLoading) return;
    closeConfirmationAndNavigate('/orders', '/');
  };

  const handleViewMyOrders = () => {
    if (ordersNavigationLoading) return;

    showLoader('Opening your orders...');
    setOrdersNavigationLoading(true);
    window.setTimeout(() => {
      closeConfirmationAndNavigate('/orders');
    }, ORDERS_NAVIGATION_DELAY_MS);
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
              handleOrderSuccess(confirmationPayload);
              setLoading(false);
              setPaymentProcessing(false);
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

    const activeUserToken =
      localStorage.getItem('token') ||
      sessionStorage.getItem('token') ||
      localStorage.getItem('userToken') ||
      sessionStorage.getItem('userToken');

    if (!activeUserToken) {
      const authMessage = 'Please login to place your order.';
      setError(authMessage);
      showError(authMessage);
      onClose();
      navigate('/login', { replace: true });
      return;
    }
    
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
      if (!formData.name || !formData.phone || !formData.houseNo || !formData.city || !formData.state || !formData.pincode) {
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
        street: [formData.houseNo, formData.area].filter(Boolean).join(', '),
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
          handleOrderSuccess(confirmationPayload);
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
      className={`checkout-modal-overlay ${paymentProcessing || checkoutStage === 'PROCESSING' ? 'checkout-modal-overlay--processing' : ''} ${!isOpen ? 'checkout-modal-overlay--hidden' : ''}`}
      onClick={handleBackdropClick}
      aria-hidden={!isOpen}
    >
      <div className={`checkout-modal ${paymentProcessing || checkoutStage === 'PROCESSING' ? 'checkout-modal--processing' : ''}`}>
        <button
          className="checkout-modal-close"
          onClick={currentStep === 4 && confirmationData ? handleConfirmedModalClose : onClose}
          aria-label="Close"
          disabled={paymentProcessing || checkoutStage === 'PROCESSING' || ordersNavigationLoading}
        >
          ✕
        </button>

        <div className="checkout-modal-header">
          <h2>🛒 Complete Your Order</h2>
        </div>

        {/* Step Indicator */}
        {checkoutStage === 'FORM' && !orderSuccess && (
        <div className="checkout-steps-indicator">
          <div className={`step-item ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-circle">
              {currentStep > 1 ? '✓' : '1'}
            </div>
            <span className="step-label">Address</span>
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
            <span className="step-label">Review</span>
          </div>
          <div className="step-line"></div>
          <div className={`step-item ${currentStep >= 4 ? 'active' : ''}`}>
            <div className="step-circle">4</div>
            <span className="step-label">Done</span>
          </div>
        </div>
        )}

        {error && (
          <div className="checkout-modal-error">{error}</div>
        )}

        <div ref={modalBodyRef} className="checkout-modal-body">
          <form onSubmit={handleSubmit} className="checkout-form-shell">
            
            {/* STEP 1: Customer Details */}
            <div className={`checkout-section step-content checkout-section--address step-panel ${checkoutStage === 'FORM' && !orderSuccess && currentStep === 1 ? 'step-panel--active' : ''}`}>
                <CheckoutAddressStep
                  formData={formData}
                  fieldErrors={fieldErrors}
                  onChange={handleChange}
                  loading={loading}
                  paymentProcessing={paymentProcessing}
                  deliveryEstimate={deliveryEstimate}
                  savedAddresses={savedAddresses}
                  selectedSavedAddressId={selectedSavedAddressId}
                  onSelectSavedAddress={handleSelectSavedAddress}
                  onAddNewAddress={handleAddNewAddress}
                  onUseCurrentLocation={handleUseCurrentLocation}
                  locationPreview={locationPreview}
                  locationLoading={locationLoading}
                />
              </div>

            {/* STEP 2: Payment Method */}
            <div className={`checkout-section step-content step-panel ${checkoutStage === 'FORM' && !orderSuccess && currentStep === 2 ? 'step-panel--active' : ''}`}>
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

            {/* STEP 3: Order Summary */}
            <div className={`checkout-section step-content step-panel ${checkoutStage === 'FORM' && !orderSuccess && currentStep === 3 ? 'step-panel--active' : ''}`}>
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

            {/* PROCESSING STAGE */}
            <div className={`checkout-section step-content checkout-processing-view step-panel ${checkoutStage === 'PROCESSING' ? 'step-panel--active' : ''}`}>
                <div className="checkout-processing-spinner" aria-hidden="true"></div>
                <h3>Processing Payment</h3>
                <p className="checkout-processing-text">Opening secure payment...</p>
                <p className="checkout-processing-subtext">Please wait and complete payment in Razorpay.</p>
              </div>

            {/* STEP 4: Confirmation */}
            <div className={`checkout-section step-content checkout-payment-result step-panel ${checkoutStage === 'FORM' && currentStep === 4 && confirmationData ? 'step-panel--active' : ''}`}>
              {confirmationData && (
              <>
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

                <div className="checkout-success-banner" role="status" aria-live="polite">
                  <span className="checkout-success-banner__icon">✓</span>
                  <span>Order placed successfully!</span>
                </div>

                <div className="checkout-success-actions">
                  <button
                    type="button"
                    className="checkout-btn checkout-btn-primary"
                    onClick={handleViewMyOrders}
                    disabled={ordersNavigationLoading}
                  >
                    {ordersNavigationLoading ? 'Opening Orders...' : 'View My Orders'}
                  </button>
                  <button
                    type="button"
                    className="checkout-btn checkout-btn-secondary"
                    onClick={() => closeConfirmationAndNavigate('/products')}
                    disabled={ordersNavigationLoading}
                  >
                    Continue Shopping
                  </button>
                </div>
              </>
              )}
              </div>

            {/* Navigation Buttons */}
            {checkoutStage === 'FORM' && !orderSuccess && currentStep < 4 && (
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
                  className="checkout-btn checkout-btn-primary"
                  onClick={handleNext}
                  disabled={loading || paymentProcessing}
                  style={{ marginLeft: '0' }}
                >
                  Next →
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
