import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useToast } from '../../hooks/useToast';
import LoadingOverlay from '../../components/LoadingOverlay';
import API from '../../services/api';
import './Orders.css';

/**
 * Orders Page Component
 * View order history and status with 24-hour cancellation policy
 */
const Orders = () => {
  const codCancellationReasonOptions = [
    'Ordered by mistake',
    'Found better price',
    'Delivery too slow',
    'Other'
  ];

  const onlineCancellationReasonOptions = [
    'Ordered by mistake',
    'Found better price',
    'Delivery too slow',
    'Payment issue',
    'Other'
  ];

  const location = useLocation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelModal, setCancelModal] = useState({
    open: false,
    orderId: null,
    orderNumber: null,
    orderItems: [],
    totalAmount: 0,
    paymentMethod: '',
    paymentStatus: '',
    paymentId: '',
    paidAmount: 0,
    cancelReason: '',
    customCancelReason: '',
    refundMethod: 'original',
    refundUpiId: '',
    refundBankAccountName: '',
    refundBankAccountNumber: '',
    refundBankIfsc: '',
    refundBankName: '',
    sendSupportMessage: false,
    supportMessage: '',
    validationError: ''
  });
  const [cancelling, setCancelling] = useState(false);
  const [refundMap, setRefundMap] = useState({});
  const [refundInputMap, setRefundInputMap] = useState({});
  const [sendingRefundFor, setSendingRefundFor] = useState('');
  const [showOrderSuccess, setShowOrderSuccess] = useState(!!location.state?.orderSuccess);
  const [dismissingSuccess, setDismissingSuccess] = useState(false);
  const { success, error: showError } = useToast();

  const dismissSuccessOverlay = () => {
    setDismissingSuccess(true);
    setTimeout(() => {
      setShowOrderSuccess(false);
      setDismissingSuccess(false);
    }, 420);
  };

  // Auto-dismiss success overlay after 3 seconds
  useEffect(() => {
    if (!showOrderSuccess) return;
    const timer = setTimeout(() => dismissSuccessOverlay(), 3000);
    return () => clearTimeout(timer);
  }, [showOrderSuccess]);

  useEffect(() => {
    fetchOrders();
    fetchMyRefundConversations();

    const pollTimer = setInterval(() => {
      fetchMyRefundConversations();
    }, 15000);

    return () => clearInterval(pollTimer);
  }, []);

  const fetchOrders = async () => {
    const activeUserToken =
      localStorage.getItem('token') ||
      sessionStorage.getItem('token') ||
      localStorage.getItem('userToken') ||
      sessionStorage.getItem('userToken');

    if (!activeUserToken) {
      setError('Please login to view your orders.');
      setOrders([]);
      setLoading(false);
      navigate('/login', { replace: true });
      return;
    }

    setLoading(true);
    try {
      setError('');
      const { data } = await API.get('/orders/myorders');
      setOrders(data.orders || []);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Error fetching orders';
      console.error('Error fetching orders:', error);
      setError(errorMsg);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRefundConversations = async () => {
    const activeUserToken =
      localStorage.getItem('token') ||
      sessionStorage.getItem('token') ||
      localStorage.getItem('userToken') ||
      sessionStorage.getItem('userToken');

    if (!activeUserToken) {
      return;
    }

    try {
      const { data } = await API.get('/refunds/my/list');
      if (!data?.success) return;

      const nextMap = {};
      (data.refunds || []).forEach((refund) => {
        if (!refund?.orderId) return;
        nextMap[String(refund.orderId)] = refund;
      });

      setRefundMap(nextMap);
    } catch (err) {
      // Avoid noisy toasts during polling if refunds are not available.
      console.debug('Refund conversation fetch skipped:', err?.response?.status || err.message);
    }
  };

  const handleSendRefundMessage = async (refundId, orderNumber) => {
    const inputKey = String(orderNumber);
    const text = String(refundInputMap[inputKey] || '').trim();
    if (!text) return;

    setSendingRefundFor(refundId);
    try {
      const { data } = await API.post(`/refunds/${refundId}/messages`, { message: text });
      if (data?.success) {
        setRefundInputMap((prev) => ({ ...prev, [inputKey]: '' }));
        await fetchMyRefundConversations();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Unable to send message right now.');
    } finally {
      setSendingRefundFor('');
    }
  };

  // Check if order is within 24-hour cancellation window
  const isWithinCancellationWindow = (orderDate) => {
    const orderTime = new Date(orderDate).getTime();
    const currentTime = Date.now();
    const hoursDiff = (currentTime - orderTime) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  };

  // Get hours remaining for cancellation
  const getHoursRemaining = (orderDate) => {
    const orderTime = new Date(orderDate).getTime();
    const currentTime = Date.now();
    const hoursDiff = (currentTime - orderTime) / (1000 * 60 * 60);
    const remaining = Math.max(0, 24 - hoursDiff);
    return Math.floor(remaining);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'primary',
      processing: 'primary',
      shipped: 'primary',
      delivered: 'success',
      cancelled: 'danger'
    };
    return colors[status] || 'primary';
  };

  const openCancelModal = (order) => {
    setCancelModal({
      open: true,
      orderId: order._id,
      orderNumber: order.orderNumber,
      orderItems: order.items || [],
      totalAmount: order.totalAmount || order.totalPrice || 0,
      paymentMethod: order.paymentMethod || '',
      paymentStatus: order.paymentStatus || '',
      paymentId:
        order.razorpayPaymentId ||
        order.paymentDetails?.paymentId ||
        order.paymentDetails?.transactionId ||
        order.paymentDetails?.razorpayPaymentId ||
        '',
      paidAmount: order.totalAmount || order.totalPrice || 0,
      cancelReason: '',
      customCancelReason: '',
      refundMethod: 'original',
      refundUpiId: '',
      refundBankAccountName: '',
      refundBankAccountNumber: '',
      refundBankIfsc: '',
      refundBankName: '',
      sendSupportMessage: false,
      supportMessage: '',
      validationError: ''
    });
  };

  const closeCancelModal = () => {
    setCancelModal({
      open: false,
      orderId: null,
      orderNumber: null,
      orderItems: [],
      totalAmount: 0,
      paymentMethod: '',
      paymentStatus: '',
      paymentId: '',
      paidAmount: 0,
      cancelReason: '',
      customCancelReason: '',
      refundMethod: 'original',
      refundUpiId: '',
      refundBankAccountName: '',
      refundBankAccountNumber: '',
      refundBankIfsc: '',
      refundBankName: '',
      sendSupportMessage: false,
      supportMessage: '',
      validationError: ''
    });
  };

  const paymentMethodLower = (cancelModal.paymentMethod || '').toLowerCase();
  const isCodOrder = paymentMethodLower === 'cash on delivery' || paymentMethodLower === 'cod';
  const isOnlinePaymentOrder = !isCodOrder;
  const cancellationReasonOptions = isCodOrder ? codCancellationReasonOptions : onlineCancellationReasonOptions;

  const isCancelReasonValid = Boolean(
    cancelModal.cancelReason &&
    (cancelModal.cancelReason !== 'Other' || cancelModal.customCancelReason.trim())
  );

  const handleCancelOrder = async () => {
    const selectedReason = cancelModal.cancelReason?.trim();
    const customReason = cancelModal.customCancelReason?.trim();
    const hasValidReason = selectedReason && (selectedReason !== 'Other' || customReason);

    if (!hasValidReason) {
      setCancelModal((prev) => ({
        ...prev,
        validationError: 'Please select a cancellation reason before cancelling the order.'
      }));
      return;
    }

    setCancelling(true);
    try {
      const payload = {
        cancelReason: cancelModal.cancelReason,
        customCancelReason: cancelModal.customCancelReason,
        supportMessage: ''
      };

      if (isOnlinePaymentOrder) {
        payload.refundMethod = 'original';
      }

      const { data } = await API.put(`/orders/${cancelModal.orderId}/cancel`, payload);

      if (isCodOrder) {
        success('Order cancelled successfully. No refund is applicable for Cash on Delivery orders.');
      } else {
        success(data?.message || 'Order cancelled. Refund request submitted for admin review.');
      }
      closeCancelModal();
      fetchOrders();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <Navbar />
      <LoadingOverlay visible={loading} message="Loading your orders..." />

      <div className="orders-page">
        <div className="container">

          {/* ── Order Success Banner ── */}
          {showOrderSuccess && (
            <div className={`os-overlay${dismissingSuccess ? ' os-overlay--out' : ''}`} onClick={dismissSuccessOverlay}>
              <div className="os-card" onClick={e => e.stopPropagation()}>
                <div className="os-icon-wrap">
                  <div className="os-icon-ring"></div>
                  <div className="os-icon-bg">
                    <svg className="os-check-svg" viewBox="0 0 52 52" fill="none">
                      <circle className="os-check-circle" cx="26" cy="26" r="24" />
                      <path className="os-check-path" d="M14 27l8 8 16-16" />
                    </svg>
                  </div>
                </div>
                <h2 className="os-title">Order Placed Successfully!</h2>
                <p className="os-desc">Your order has been placed and will be processed shortly.</p>
                <div className="os-chips">
                  <span className="os-chip">📦 Processing</span>
                  <span className="os-chip">🚚 Delivery Soon</span>
                  <span className="os-chip">✅ Confirmed</span>
                </div>
                <button className="os-btn" onClick={dismissSuccessOverlay}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                  </svg>
                  View My Orders
                  <span className="os-btn__shimmer"></span>
                </button>
                <div className="os-progress">
                  <div className="os-progress__bar"></div>
                </div>
              </div>
            </div>
          )}

          <div className={`os-page-content${showOrderSuccess && !dismissingSuccess ? ' os-page-content--hidden' : ''}`}>
            <div className="orders-header">
              <h1>My Orders</h1>
              <p className="orders-subtitle">Track and manage your order history</p>
            </div>

          {/* Cancellation Policy Notice */}
          <div className="cancellation-policy-banner">
            <div className="policy-icon">ℹ️</div>
            <div className="policy-content">
              <h4>Order Cancellation Policy</h4>
              <p>
                Orders can be cancelled online within <strong>24 hours</strong> of placing the order.
                After 24 hours, please contact our support team for assistance.
              </p>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger">
              <strong>Error:</strong> {error}
            </div>
          )}

          {loading ? null : orders.length === 0 ? (
            <div className="no-orders">
              <div className="no-orders-icon">📦</div>
              <h2>No orders yet</h2>
              <p>Start shopping to see your orders here</p>
              <Link to="/products" className="btn-shop-now">Browse Products</Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => {
                const isCancellableStatus = ['pending', 'confirmed'].includes((order.orderStatus || '').toLowerCase());
                const canCancel = isCancellableStatus && isWithinCancellationWindow(order.createdAt);
                const hoursRemaining = getHoursRemaining(order.createdAt);
                const orderPaymentMethodLower = String(order.paymentMethod || '').toLowerCase();
                const isOrderCod = orderPaymentMethodLower === 'cash on delivery' || orderPaymentMethodLower === 'cod';
                const refundConversation = refundMap[String(order.orderNumber)] || null;
                const refundMessages = refundConversation?.messages || [];
                const lastRefundMessage = refundMessages.length > 0 ? refundMessages[refundMessages.length - 1] : null;
                const waitingForAdminReply = lastRefundMessage && lastRefundMessage.sender === 'USER';
                const unreadFromAdmin = lastRefundMessage && lastRefundMessage.sender === 'ADMIN';

                return (
                  <div key={order._id} className="order-card">
                    <div className="order-header">
                      <div>
                        <h3>Order #{order.orderNumber}</h3>
                        <p className="order-date">
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <span className={`badge badge-${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus.toUpperCase()}
                      </span>
                    </div>

                    <div className="order-items">
                      {order.items.map((item, index) => (
                        <div key={index} className="order-item">
                          <img
                            src={item.image}
                            alt={item.name}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/80x80?text=Product';
                            }}
                          />
                          <div className="order-item-info">
                            <p className="item-name">{item.name}</p>
                            <p className="item-qty">Quantity: {item.quantity}</p>
                          </div>
                          <div className="item-price">
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="order-summary">
                      <div className="summary-row">
                        <span>Items Total:</span>
                        <span>₹{(order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)).toLocaleString()}</span>
                      </div>
                      <div className="summary-total">
                        <span>Total Amount:</span>
                        <span>₹{order.totalAmount?.toLocaleString() || order.totalPrice?.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="order-footer">
                      <div className="order-details">
                        <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                        <p><strong>Payment Status:</strong>
                          <span className={`badge badge-${order.paymentStatus === 'paid' ? 'success' : 'warning'}`}>
                            {order.paymentStatus.toUpperCase()}
                          </span>
                        </p>
                      </div>

                      {/* Cancellation Section */}
                      <div className="cancellation-section">
                        {canCancel && (
                          <>
                            <div className="cancel-time-remaining">
                              <span className="time-icon">⏰</span>
                              <span>{hoursRemaining > 0 ? `${hoursRemaining}h remaining to cancel` : 'Less than 1 hour to cancel'}</span>
                            </div>
                            <button
                              onClick={() => openCancelModal(order)}
                              className="btn-cancel-order"
                            >
                              Cancel Order
                            </button>
                          </>
                        )}

                        {isCancellableStatus && !canCancel && (
                          <div className="cancellation-expired">
                            <p className="expired-message">
                              Online cancellation is no longer available for this order.
                            </p>
                            <p className="support-info">
                              For cancellation requests after 24 hours, please{' '}
                              <Link to="/contact" className="contact-link">contact our support team</Link>.
                            </p>
                            <div className="support-options">
                              <span>📞 +91-9095399271</span>
                              <span>✉️ manielectricalshop@gmail.com</span>
                            </div>
                          </div>
                        )}

                        {order.orderStatus === 'cancelled' && (
                          <div className="order-cancelled-info">
                            <span className="cancelled-badge">Order Cancelled</span>
                            {order.cancelReason && (
                              <p className="order-cancelled-reason">Reason: {order.cancelReason}</p>
                            )}
                            {order.cancelledAt && (
                              <p className="order-cancelled-date">
                                Cancelled on {new Date(order.cancelledAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}

                            {!isOrderCod && (
                              <div className="refund-conversation-box">
                                <div className="refund-conversation-header">
                                  <h4>Refund Conversation</h4>
                                  {unreadFromAdmin && <span className="refund-badge refund-badge-new">New reply</span>}
                                  {waitingForAdminReply && <span className="refund-badge refund-badge-wait">Waiting for admin</span>}
                                </div>

                                {!refundConversation ? (
                                  <p className="refund-conversation-empty">
                                    Refund request is being prepared. Please check back shortly.
                                  </p>
                                ) : (
                                  <>
                                    <div className="refund-chat-thread">
                                      {refundMessages.length === 0 ? (
                                        <p className="refund-conversation-empty">No messages yet.</p>
                                      ) : (
                                        refundMessages.map((msg) => (
                                          <div
                                            key={`${msg._id}-${msg.createdAt}`}
                                            className={`refund-chat-bubble ${msg.sender === 'USER' ? 'refund-chat-user' : 'refund-chat-admin'}`}
                                          >
                                            <p>{msg.message}</p>
                                            <span>{new Date(msg.createdAt).toLocaleString('en-IN')}</span>
                                          </div>
                                        ))
                                      )}
                                    </div>

                                    <div className="refund-chat-compose">
                                      <textarea
                                        rows={2}
                                        placeholder="Write a message to support about this refund..."
                                        value={refundInputMap[String(order.orderNumber)] || ''}
                                        onChange={(e) => setRefundInputMap((prev) => ({
                                          ...prev,
                                          [String(order.orderNumber)]: e.target.value,
                                        }))}
                                      />
                                      <button
                                        type="button"
                                        className="refund-chat-send"
                                        disabled={sendingRefundFor === refundConversation.refundId || !String(refundInputMap[String(order.orderNumber)] || '').trim()}
                                        onClick={() => handleSendRefundMessage(refundConversation.refundId, order.orderNumber)}
                                      >
                                        {sendingRefundFor === refundConversation.refundId ? 'Sending...' : 'Send'}
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>{/* end os-page-content */}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelModal.open && (
        <div className="modal-overlay" onClick={closeCancelModal}>
          <div className="cancel-modal" onClick={(e) => e.stopPropagation()}>

            {/* Header — amber warning theme */}
            <div className="modal-header">
              <div className="modal-warning-icon-circle">
                <span className="modal-warning-icon-symbol">⚠</span>
              </div>
              <div className="modal-header-text">
                <h3 className="modal-header-title">
                  <span>Cancel Order</span>
                </h3>
                <p className="modal-header-subtitle">Order ID: #{cancelModal.orderNumber}</p>
              </div>
              <button className="modal-close" onClick={closeCancelModal} aria-label="Close">×</button>
            </div>

            {/* Body */}
            <div className="modal-body">
              <div className="modal-section modal-order-summary-card">
                <h4 className="modal-section-title">Product</h4>
                {cancelModal.orderItems.length > 0 && (
                  <div className="modal-order-summary-content">
                    <img
                      src={cancelModal.orderItems[0].image}
                      alt={cancelModal.orderItems[0].name}
                      className="modal-order-image"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/72x72?text=Product';
                      }}
                    />
                    <div className="modal-order-meta">
                      <p className="modal-order-product-line">
                        <strong>{cancelModal.orderItems[0].name}</strong>
                        {cancelModal.orderItems.length > 1 && ` +${cancelModal.orderItems.length - 1} more`}
                        <span className="modal-order-qty-divider">|</span>
                        Qty {cancelModal.orderItems.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                        <span className="modal-order-qty-divider">|</span>
                        ₹{Number(cancelModal.totalAmount || 0).toLocaleString('en-IN')}
                      </p>
                      <p className="modal-order-payment-line">
                        Payment: {isCodOrder ? 'COD' : 'RAZORPAY'} ({(cancelModal.paymentStatus || (isCodOrder ? 'pending' : 'paid')).toUpperCase()})
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-section cancel-reason-section">
                <h4 className="modal-section-title">Cancel Reason</h4>
                <div className="cancel-reason-radio-group">
                  {cancellationReasonOptions.map((reason) => (
                    <label
                      key={reason}
                      className={`cancel-reason-radio-label${cancelModal.cancelReason === reason ? ' cancel-reason-radio-label--selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="cancelReason"
                        value={reason}
                        checked={cancelModal.cancelReason === reason}
                        onChange={(e) => {
                          const nextReason = e.target.value;
                          setCancelModal((prev) => ({
                            ...prev,
                            cancelReason: nextReason,
                            customCancelReason: nextReason === 'Other' ? prev.customCancelReason : '',
                            validationError: ''
                          }));
                        }}
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>

                {cancelModal.cancelReason === 'Other' && (
                  <textarea
                    className="cancel-reason-textarea"
                    placeholder="Please tell us more"
                    rows={3}
                    value={cancelModal.customCancelReason}
                    onChange={(e) => setCancelModal((prev) => ({
                      ...prev,
                      customCancelReason: e.target.value,
                      validationError: ''
                    }))}
                  />
                )}

                {cancelModal.validationError && (
                  <p className="cancel-reason-error">
                    {cancelModal.validationError}
                  </p>
                )}
              </div>

              {isCodOrder ? (
                <div className="modal-section cod-info-box">
                  <p className="cod-info-text">
                    No refund applicable for Cash on Delivery orders.
                  </p>
                </div>
              ) : (
                <div className="modal-section refund-info-box refund-info-inline">
                  <p className="refund-inline-primary">Refund will be processed to your original payment method</p>
                  <p className="refund-inline-secondary">Refund will be credited within 5-7 business days</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button
                className="btn-modal-secondary"
                onClick={closeCancelModal}
                disabled={cancelling}
              >
                Keep Order
              </button>
              <button
                className="btn-modal-danger"
                onClick={handleCancelOrder}
                disabled={cancelling || !isCancelReasonValid}
              >
                {cancelling ? (
                  <>
                    <span className="btn-spinner"></span>
                    Cancelling...
                  </>
                ) : (
                  'Confirm Cancellation'
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default Orders;
