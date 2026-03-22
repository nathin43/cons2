import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useToast } from '../../hooks/useToast';
import { useLoading } from '../../context/LoadingContext';
import API from '../../services/api';
import './Orders.css';

/**
 * Orders Page Component
 * View order history and status with 24-hour cancellation policy
 */
const Orders = () => {
  // ── COD: simple short list ─────────────────────────────────
  const codReasonOptions = [
    { label: 'Ordered by mistake', icon: '🤦' },
    { label: 'Found better price', icon: '💰' },
    { label: 'Delivery too slow', icon: '🐢' },
    { label: 'Other', icon: '✏️' },
  ];

  // ── Online: fuller list ─────────────────────────────────────
  const onlineReasonOptions = [
    { label: 'Ordered by mistake', icon: '🤦' },
    { label: 'Found better price', icon: '💰' },
    { label: 'Delivery too slow', icon: '🐢' },
    { label: 'Wrong item', icon: '📦' },
    { label: 'Want to change address', icon: '📍' },
    { label: 'Other', icon: '✏️' },
  ];


  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [refundMap, setRefundMap] = useState({});
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
    sendSupportMessage: false,
    supportMessage: '',
    validationError: ''
  });
  const [cancelling, setCancelling] = useState(false);
  const { success, error: showError } = useToast();
  const { showLoader, hideLoader } = useLoading();
  const navigate = useNavigate();

  const [showOrderSuccess, setShowOrderSuccess] = useState(!!location.state?.orderSuccess);
  const [dismissingSuccess, setDismissingSuccess] = useState(false);

  // Close overlay but stay on page
  const handleCloseOverlay = () => {
    setDismissingSuccess(true);
    setTimeout(() => {
      setShowOrderSuccess(false);
      setDismissingSuccess(false);
    }, 450);
  };

  // 'View My Orders' -> Loader then refresh view
  const handleViewOrdersFromOverlay = () => {
    handleCloseOverlay();
    showLoader('Loading your orders…');
    setTimeout(() => {
      hideLoader();
      fetchOrders();
    }, 2500);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    showLoader('Loading your orders…');
    try {
      setError('');
      // Fetch both orders and refunds simultaneously
      const [orderRes, refundRes] = await Promise.all([
        API.get('/orders/myorders'),
        API.get('/refunds/my/list').catch(() => ({ data: { refunds: [] } }))
      ]);

      const fetchedOrders = orderRes.data?.orders || [];
      const fetchedRefunds = refundRes.data?.refunds || [];

      // Build a map of orderId -> refund info
      const rMap = {};
      fetchedRefunds.forEach((r) => {
        if (r.order && r.order._id) {
          rMap[r.order._id] = r;
        } else if (typeof r.order === 'string') {
          rMap[r.order] = r;
        }
      });

      setOrders(fetchedOrders);
      setRefundMap(rMap);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Error fetching orders';
      console.error('Error fetching orders:', error);
      setError(errorMsg);
      setOrders([]);
      setRefundMap({});
    } finally {
      setLoading(false);
      hideLoader();
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
      sendSupportMessage: false,
      supportMessage: '',
      validationError: ''
    });
  };

  const isCodOrder = (cancelModal.paymentMethod || '').toLowerCase() === 'cash on delivery';
  const isRazorpayOrder = (cancelModal.paymentMethod || '').toLowerCase() === 'razorpay';

  // Pick reason list based on payment type
  const activeReasonOptions = isCodOrder ? codReasonOptions : onlineReasonOptions;

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
      await API.put(`/orders/${cancelModal.orderId}/cancel`, {
        cancelReason: cancelModal.cancelReason,
        customCancelReason: cancelModal.customCancelReason,
        supportMessage: (!isCodOrder && cancelModal.sendSupportMessage)
          ? cancelModal.supportMessage?.trim()
          : ''
      });

      // Toast message differs by payment method
      if (isCodOrder) {
        success('Order cancelled successfully. No refund applicable.');
      } else {
        success('Order cancelled successfully. Refund has been initiated.');
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

      <div className="orders-page">
        <div className="container">



          <div className="os-page-content">
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

            {orders.length === 0 && !loading ? (

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
                              {refundMap[order._id] && (
                                <div className="order-refund-details">
                                  <div className="order-refund-status">
                                    <span style={{color: '#475569', fontSize: '13px', fontWeight: 600}}>Refund Status:</span>
                                    <span className={`badge badge-${
                                      refundMap[order._id].refundStatus === 'approved' || refundMap[order._id].refundStatus === 'completed'
                                        ? 'success'
                                        : refundMap[order._id].refundStatus === 'rejected'
                                          ? 'danger'
                                          : 'warning'
                                    }`} style={{ marginLeft: '8px' }}>
                                      {refundMap[order._id].refundStatus.toUpperCase()}
                                    </span>
                                  </div>
                                  {refundMap[order._id].adminReply && (
                                    <div className="order-refund-reply" style={{ marginTop: '12px', padding: '12px', background: '#eff6ff', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
                                      <span style={{ display: 'block', fontSize: '12px', color: '#1d4ed8', fontWeight: 700, marginBottom: '4px' }}>Support Team Reply:</span>
                                      <p style={{ margin: 0, fontSize: '13px', color: '#1e3a8a', lineHeight: 1.5 }}>{refundMap[order._id].adminReply}</p>
                                    </div>
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

      {/* ══════════════════════════════════════════════════════
          Cancel Confirmation Modal — Redesigned
          ══════════════════════════════════════════════════════ */}
      {cancelModal.open && (
        <div className="cm-overlay" onClick={closeCancelModal} role="dialog" aria-modal="true">
          <div className="cm-card" onClick={(e) => e.stopPropagation()}>

            {/* ── Top accent bar */}
            <div className="cm-accent-bar" />

            {/* ── Header */}
            <div className="cm-header">
              <div className="cm-header-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="cm-header-text">
                <h3 className="cm-title">Cancel Order</h3>
                <p className="cm-subtitle">#{cancelModal.orderNumber}</p>
              </div>
              <button className="cm-close" onClick={closeCancelModal} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ── Order snapshot */}
            {cancelModal.orderItems.length > 0 && (
              <div className="cm-snapshot">
                <img
                  src={cancelModal.orderItems[0].image}
                  alt={cancelModal.orderItems[0].name}
                  className="cm-snapshot-img"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/56x56?text=📦'; }}
                />
                <div className="cm-snapshot-info">
                  <p className="cm-snapshot-name">
                    {cancelModal.orderItems[0].name}
                    {cancelModal.orderItems.length > 1 && (
                      <span className="cm-snapshot-more"> +{cancelModal.orderItems.length - 1} more</span>
                    )}
                  </p>
                  <div className="cm-snapshot-meta">
                    <span className="cm-meta-chip">
                      {isCodOrder ? '💵 COD' : isRazorpayOrder ? '💳 Razorpay' : '💳 Online'}
                    </span>
                    <span className="cm-meta-chip cm-meta-chip--amount">
                      ₹{Number(cancelModal.totalAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="cm-body">

              {/* ── Section 1: Cancel Reasons */}
              <div className="cm-section">
                <p className="cm-section-label">Why are you cancelling?</p>
                <div className={`cm-reasons-grid ${isCodOrder ? 'cm-reasons-grid--2col' : 'cm-reasons-grid--3col'}`}>
                  {activeReasonOptions.map(({ label, icon }) => (
                    <label
                      key={label}
                      className={`cm-reason${cancelModal.cancelReason === label ? ' cm-reason--active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="cmCancelReason"
                        value={label}
                        checked={cancelModal.cancelReason === label}
                        onChange={(e) => setCancelModal((prev) => ({
                          ...prev,
                          cancelReason: e.target.value,
                          customCancelReason: e.target.value !== 'Other' ? '' : prev.customCancelReason,
                          validationError: ''
                        }))}
                      />
                      <span className="cm-reason-icon">{icon}</span>
                      <span className="cm-reason-text">{label}</span>
                    </label>
                  ))}
                </div>

                {cancelModal.cancelReason === 'Other' && (
                  <textarea
                    className="cm-textarea"
                    placeholder="Please describe your reason..."
                    rows={2}
                    value={cancelModal.customCancelReason}
                    onChange={(e) => setCancelModal((prev) => ({
                      ...prev,
                      customCancelReason: e.target.value,
                      validationError: ''
                    }))}
                  />
                )}

                {cancelModal.validationError && (
                  <p className="cm-error">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {cancelModal.validationError}
                  </p>
                )}
              </div>

              {/* ── Section 2a: COD — no refund notice */}
              {isCodOrder && (
                <div className="cm-notice cm-notice--warning">
                  <span className="cm-notice-icon">⚠️</span>
                  <p>
                    No refund applicable for <strong>Cash on Delivery</strong> orders.
                    Your order will be cancelled immediately.
                  </p>
                </div>
              )}

              {/* ── Section 2b: Online payment — refund info + support message */}
              {!isCodOrder && (
                <>
                  <div className="cm-refund-box">
                    <div className="cm-refund-info-header">
                      <span className="cm-refund-info-icon">💳</span>
                      <div>
                        <p className="cm-refund-info-title">Refund will be initiated</p>
                        <p className="cm-refund-info-sub">
                          Paid amount will be refunded within <strong>5–7 business days</strong>
                        </p>
                      </div>
                      <span className="cm-paid-badge">PAID</span>
                    </div>
                    <div className="cm-refund-timeline">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                      Refund processed within <strong>5–7 business days</strong> via original payment method
                    </div>
                  </div>

                  {/* Contact Support for Refund */}
                  <div className="cm-support-box">
                    <label className="cm-support-toggle">
                      <input
                        type="checkbox"
                        checked={cancelModal.sendSupportMessage}
                        onChange={(e) => setCancelModal((prev) => ({
                          ...prev,
                          sendSupportMessage: e.target.checked,
                          supportMessage: e.target.checked ? prev.supportMessage : ''
                        }))}
                      />
                      <span className="cm-support-label">
                        <span>💬</span> Contact Support for refund assistance
                      </span>
                    </label>

                    {cancelModal.sendSupportMessage && (
                      <>
                        <textarea
                          className="cm-textarea cm-support-textarea"
                          placeholder="Describe your refund issue or any special instructions..."
                          rows={3}
                          value={cancelModal.supportMessage}
                          onChange={(e) => setCancelModal((prev) => ({ ...prev, supportMessage: e.target.value }))}
                        />
                        <p className="cm-support-note">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.77 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.68 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.85-.85a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 17z" />
                          </svg>
                          Your message will be sent to the admin along with your refund request.
                        </p>
                      </>
                    )}
                  </div>
                </>
              )}

            </div>{/* end cm-body */}

            {/* ── Footer Buttons */}
            <div className="cm-footer">
              <button
                className="cm-btn cm-btn--secondary"
                onClick={closeCancelModal}
                disabled={cancelling}
              >
                Keep Order
              </button>
              <button
                className="cm-btn cm-btn--danger"
                onClick={handleCancelOrder}
                disabled={cancelling || !isCancelReasonValid}
              >
                {cancelling ? (
                  <><span className="cm-btn-spinner" /> Cancelling...</>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="15" height="15">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" /><path d="M14 11v6" />
                    </svg>
                    Confirm Cancellation
                  </>
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

