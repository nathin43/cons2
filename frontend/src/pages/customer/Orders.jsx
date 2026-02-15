import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useToast } from '../../hooks/useToast';
import API from '../../services/api';
import './Orders.css';

/**
 * Orders Page Component
 * View order history and status with 24-hour cancellation policy
 */
const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelModal, setCancelModal] = useState({ open: false, orderId: null, orderNumber: null });
  const [cancelling, setCancelling] = useState(false);
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
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

  const openCancelModal = (orderId, orderNumber) => {
    setCancelModal({ open: true, orderId, orderNumber });
  };

  const closeCancelModal = () => {
    setCancelModal({ open: false, orderId: null, orderNumber: null });
  };

  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      await API.put(`/orders/${cancelModal.orderId}/cancel`);
      success('Order cancelled successfully. Refund will be processed within 5-7 business days.');
      closeCancelModal();
      fetchOrders();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="orders-page">
          <div className="container">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading your orders...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="orders-page">
        <div className="container">
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

          {orders.length === 0 ? (
            <div className="no-orders">
              <div className="no-orders-icon">📦</div>
              <h2>No orders yet</h2>
              <p>Start shopping to see your orders here</p>
              <Link to="/products" className="btn-shop-now">Browse Products</Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => {
                const canCancel = order.orderStatus === 'pending' && isWithinCancellationWindow(order.createdAt);
                const hoursRemaining = getHoursRemaining(order.createdAt);
                const isPending = order.orderStatus === 'pending';

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
                        {isPending && canCancel && (
                          <>
                            <div className="cancel-time-remaining">
                              <span className="time-icon">⏰</span>
                              <span>{hoursRemaining > 0 ? `${hoursRemaining}h remaining to cancel` : 'Less than 1 hour to cancel'}</span>
                            </div>
                            <button
                              onClick={() => openCancelModal(order._id, order.orderNumber)}
                              className="btn-cancel-order"
                            >
                              Cancel Order
                            </button>
                          </>
                        )}

                        {isPending && !canCancel && (
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
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelModal.open && (
        <div className="modal-overlay" onClick={closeCancelModal}>
          <div className="cancel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cancel Order</h3>
              <button className="modal-close" onClick={closeCancelModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="warning-icon">⚠️</div>
              <p className="modal-message">
                Are you sure you want to cancel <strong>Order #{cancelModal.orderNumber}</strong>?
              </p>

              <div className="cancellation-terms">
                <h4>Cancellation Terms:</h4>
                <ul>
                  <li>Once cancelled, this action cannot be undone.</li>
                  <li>Refunds will be processed within 5-7 business days.</li>
                  <li>Refund will be credited to the original payment method.</li>
                  <li>You will receive a confirmation email once the cancellation is processed.</li>
                </ul>
              </div>
            </div>

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
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
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
