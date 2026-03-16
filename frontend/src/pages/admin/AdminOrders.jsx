import { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout';
import DashboardSkeleton from '../../components/DashboardSkeleton';
import useAdminLoader from '../../hooks/useAdminLoader';
import API from '../../services/api';
import './AdminOrders.css';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRangePreset, setDateRangePreset] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [pendingFrom, setPendingFrom] = useState('');
  const [pendingTo, setPendingTo] = useState('');
  const dateDropdownRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrders, setExpandedOrders] = useState({});
  const [cardFilter, setCardFilter] = useState('all'); // 'all' | 'active' | 'cancelled'
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'delivered' | 'cancelled'
  const { loading, run } = useAdminLoader();

  useEffect(() => {
    run(fetchOrders);
  }, []);

  // Close date dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target)) {
        setDateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getDateRangeLabel = () => {
    if (dateRangePreset === 'today') return 'Today';
    if (dateRangePreset === 'yesterday') return 'Yesterday';
    if (dateRangePreset === 'last7') return 'Last 7 Days';
    if (dateRangePreset === 'last30') return 'Last 30 Days';
    if (dateRangePreset === 'thisMonth') return 'This Month';
    if (dateRangePreset === 'custom' && customFrom && customTo) {
      const fmt = (s) =>
        new Date(s + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      return `${fmt(customFrom)} \u2013 ${fmt(customTo)}`;
    }
    return 'Date Range';
  };

  const fetchOrders = async () => {
    try {
      const { data } = await API.get('/orders');
      setOrders(data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const { data } = await API.put(`/orders/${orderId}/status`, { orderStatus: newStatus });
      if (data.success && data.order) {
        setOrders(prev => prev.map(o => (o._id === orderId ? data.order : o)));
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      fetchOrders();
    }
  };

  const handleCancelOrder = (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      handleStatusChange(orderId, 'cancelled');
    }
  };

  const getStatusBadgeClass = (status) => {
    const map = {
      pending: 'pending',
      confirmed: 'confirmed',
      processing: 'processing',
      shipped: 'shipped',
      delivered: 'delivered',
      cancelled: 'cancelled',
      refunded: 'refunded',
    };
    return map[status] || 'pending';
  };

  const getPaymentStatusBadgeClass = (status) => {
    const map = { pending: 'pending', paid: 'paid', failed: 'failed' };
    return map[status] || 'pending';
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const formatCancelledDate = (value) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(',', ' -');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateRangePreset('all');
    setCustomFrom('');
    setCustomTo('');
    setPendingFrom('');
    setPendingTo('');
    setDateDropdownOpen(false);
    setCardFilter('all');
    setActiveTab('all');
  };

  const handleCardClick = (filter) => {
    setCardFilter(prev => prev === filter ? 'all' : filter);
    setStatusFilter('all');
    setSearchQuery('');
    setDateRangePreset('all');
    setCustomFrom('');
    setCustomTo('');
    // Sync tab with card click
    const tabMap = { all: 'all', active: 'active', cancelled: 'cancelled' };
    setActiveTab(tabMap[filter] || 'all');
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setCardFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
    setDateRangePreset('all');
    setCustomFrom('');
    setCustomTo('');
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Tab filter takes highest priority, then card filter, then dropdown
    if (activeTab === 'active') {
      filtered = filtered.filter(o =>
        ['pending', 'confirmed', 'shipped'].includes(o.orderStatus)
      );
    } else if (activeTab === 'delivered') {
      filtered = filtered.filter(o => o.orderStatus === 'delivered');
    } else if (activeTab === 'cancelled') {
      filtered = filtered.filter(o => o.orderStatus === 'cancelled');
    } else if (cardFilter === 'active') {
      filtered = filtered.filter(o =>
        ['pending', 'confirmed', 'shipped'].includes(o.orderStatus)
      );
    } else if (cardFilter === 'cancelled') {
      filtered = filtered.filter(o => o.orderStatus === 'cancelled');
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.orderStatus === statusFilter);
    }

    if (dateRangePreset !== 'all') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (dateRangePreset === 'today') {
        filtered = filtered.filter(o => new Date(o.createdAt) >= todayStart);
      } else if (dateRangePreset === 'yesterday') {
        const yStart = new Date(todayStart);
        yStart.setDate(yStart.getDate() - 1);
        filtered = filtered.filter(o => {
          const d = new Date(o.createdAt);
          return d >= yStart && d < todayStart;
        });
      } else if (dateRangePreset === 'last7') {
        const cutoff = new Date(todayStart);
        cutoff.setDate(cutoff.getDate() - 6);
        filtered = filtered.filter(o => new Date(o.createdAt) >= cutoff);
      } else if (dateRangePreset === 'last30') {
        const cutoff = new Date(todayStart);
        cutoff.setDate(cutoff.getDate() - 29);
        filtered = filtered.filter(o => new Date(o.createdAt) >= cutoff);
      } else if (dateRangePreset === 'thisMonth') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = filtered.filter(o => new Date(o.createdAt) >= monthStart);
      } else if (dateRangePreset === 'custom' && customFrom && customTo) {
        const from = new Date(customFrom + 'T00:00:00');
        const to = new Date(customTo + 'T23:59:59');
        filtered = filtered.filter(o => {
          const d = new Date(o.createdAt);
          return d >= from && d <= to;
        });
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        o =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.user?.name?.toLowerCase().includes(q) ||
          o.user?.email?.toLowerCase().includes(q)
      );
    }

    return filtered;
  };

  const filteredOrders = filterOrders();

  const totalOrders = orders.length;
  const totalSales = orders.reduce((sum, o) => sum + (o.totalAmount || o.totalPrice || 0), 0);
  const activeOrders = orders.filter(o =>
    ['pending', 'confirmed', 'shipped'].includes(o.orderStatus)
  ).length;
  const deliveredOrders = orders.filter(o => o.orderStatus === 'delivered').length;
  const cancelledOrders = orders.filter(o => o.orderStatus === 'cancelled').length;

  const TABS = [
    { key: 'all',    label: 'All Orders',   count: totalOrders },
    { key: 'active', label: 'Active Orders', count: activeOrders },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <DashboardSkeleton title="Loading Orders" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="ao-container">

        {/* ── PAGE HEADER ── */}
        <div className="ao-header">
          <div className="ao-header-left">
            <h1 className="ao-title">Orders Management</h1>
            <p className="ao-subtitle">Manage and track all customer orders</p>
          </div>
          <div className="ao-header-right">
            <button className="ao-btn ao-btn-refresh" onClick={() => run(fetchOrders)}>
              <span className="ao-btn-icon">🔄</span>
              Refresh
            </button>
          </div>
        </div>

        {/* ── SUMMARY CARDS ── */}
        <div className="ao-metrics-grid">
          <div
            className={`ao-metric-card ao-metric-card--clickable${cardFilter === 'all' ? ' ao-metric-card--active' : ''}`}
            style={{ '--card-delay': '0s' }}
            onClick={() => handleCardClick('all')}
            title="Show all orders"
          >
            <div className="ao-metric-icon ao-icon-blue">📦</div>
            <div className="ao-metric-body">
              <span className="ao-metric-label">Total Orders</span>
              <span className="ao-metric-value">{totalOrders}</span>
            </div>
          </div>

          <div className="ao-metric-card" style={{ '--card-delay': '0.08s' }}>
            <div className="ao-metric-icon ao-icon-purple">💰</div>
            <div className="ao-metric-body">
              <span className="ao-metric-label">Total Sales</span>
              <span className="ao-metric-value">₹{totalSales.toLocaleString()}</span>
            </div>
          </div>

          <div
            className={`ao-metric-card ao-metric-card--clickable${cardFilter === 'active' ? ' ao-metric-card--active ao-metric-card--active-orange' : ''}`}
            style={{ '--card-delay': '0.16s' }}
            onClick={() => handleCardClick('active')}
            title="Show active orders"
          >
            <div className="ao-metric-icon ao-icon-orange">⏳</div>
            <div className="ao-metric-body">
              <span className="ao-metric-label">Active Orders</span>
              <span className="ao-metric-value">{activeOrders}</span>
            </div>
          </div>

          <div
            className={`ao-metric-card ao-metric-card--clickable${cardFilter === 'cancelled' ? ' ao-metric-card--active ao-metric-card--active-red' : ''}`}
            style={{ '--card-delay': '0.24s' }}
            onClick={() => handleCardClick('cancelled')}
            title="Show cancelled orders"
          >
            <div className="ao-metric-icon ao-icon-red">🚫</div>
            <div className="ao-metric-body">
              <span className="ao-metric-label">Cancelled Orders</span>
              <span className="ao-metric-value">{cancelledOrders}</span>
            </div>
          </div>
        </div>

        {/* ── FILTER TOOLBAR ── */}
        <div className="ao-filter-bar">
          <div className="ao-filter-search-wrap">
            <span className="ao-filter-search-icon">🔍</span>
            <input
              type="text"
              className="ao-search-input"
              placeholder="Search by Order ID or Customer Name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="ao-filter-right">
            <div className="ao-select-wrap">
              <span className="ao-select-icon">📋</span>
              <select
                className="ao-filter-select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div className="ao-date-dropdown-wrap" ref={dateDropdownRef}>
              <button
                type="button"
                className={`ao-date-dropdown-btn${dateRangePreset !== 'all' ? ' ao-date-dropdown-btn--active' : ''}`}
                onClick={() => setDateDropdownOpen(prev => !prev)}
              >
                <span className="ao-date-icon">📅</span>
                <span className="ao-date-btn-text">{getDateRangeLabel()}</span>
                <span className="ao-date-caret">{dateDropdownOpen ? '▲' : '▼'}</span>
              </button>

              {dateDropdownOpen && (
                <div className="ao-date-dropdown-menu">
                  <div className="ao-date-dropdown-header">Date Range</div>

                  {[
                    { key: 'all',       label: 'All Time' },
                    { key: 'today',     label: 'Today' },
                    { key: 'yesterday', label: 'Yesterday' },
                    { key: 'last7',     label: 'Last 7 Days' },
                    { key: 'last30',    label: 'Last 30 Days' },
                    { key: 'thisMonth', label: 'This Month' },
                    { key: 'custom',    label: 'Custom Range' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      className={`ao-date-option${dateRangePreset === opt.key ? ' ao-date-option--active' : ''}`}
                      onClick={() => {
                        if (opt.key !== 'custom') {
                          setDateRangePreset(opt.key);
                          setCustomFrom('');
                          setCustomTo('');
                          setDateDropdownOpen(false);
                        } else {
                          setDateRangePreset('custom');
                          setPendingFrom(customFrom);
                          setPendingTo(customTo);
                        }
                      }}
                    >
                      {opt.label}
                      {dateRangePreset === opt.key && <span className="ao-date-check">✓</span>}
                    </button>
                  ))}

                  {dateRangePreset === 'custom' && (
                    <div className="ao-date-custom-wrap">
                      <div className="ao-date-divider" />
                      <div className="ao-date-custom-row">
                        <label className="ao-date-custom-label">From</label>
                        <input
                          type="date"
                          className="ao-date-custom-input"
                          value={pendingFrom}
                          max={pendingTo || undefined}
                          onChange={e => setPendingFrom(e.target.value)}
                        />
                      </div>
                      <div className="ao-date-custom-row">
                        <label className="ao-date-custom-label">To</label>
                        <input
                          type="date"
                          className="ao-date-custom-input"
                          value={pendingTo}
                          min={pendingFrom || undefined}
                          onChange={e => setPendingTo(e.target.value)}
                        />
                      </div>
                      <div className="ao-date-custom-actions">
                        <button
                          type="button"
                          className="ao-date-apply-btn"
                          disabled={!pendingFrom || !pendingTo}
                          onClick={() => {
                            setCustomFrom(pendingFrom);
                            setCustomTo(pendingTo);
                            setDateDropdownOpen(false);
                          }}
                        >
                          Apply Filter
                        </button>
                        <button
                          type="button"
                          className="ao-date-cancel-btn"
                          onClick={() => {
                            setDateRangePreset('all');
                            setCustomFrom('');
                            setCustomTo('');
                            setPendingFrom('');
                            setPendingTo('');
                            setDateDropdownOpen(false);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button className="ao-btn-clear" onClick={clearFilters}>
              ✕ Clear Filters
            </button>
          </div>
        </div>

        {/* ── STATUS TABS ── */}
        <div className="ao-tabs">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`ao-tab${activeTab === tab.key ? ' ao-tab--active' : ''}`}
              onClick={() => handleTabClick(tab.key)}
            >
              {tab.label}
              <span className="ao-tab-count">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* ── RESULTS LABEL ── */}
        <div className="ao-results-bar">
          <p className="ao-results-count">
            <span className={`ao-filter-label ao-filter-label--${activeTab === 'all' ? 'blue' : activeTab === 'active' ? 'orange' : activeTab === 'delivered' ? 'green' : 'red'}`}>
              {activeTab === 'all' && '📦 All Orders'}
              {activeTab === 'active' && '⏳ Active Orders'}
              {activeTab === 'delivered' && '✅ Delivered'}
              {activeTab === 'cancelled' && '🚫 Cancelled'}
            </span>
            <span className="ao-results-text">— Showing <strong>{filteredOrders.length}</strong> of <strong>{totalOrders}</strong> orders</span>
          </p>
          {activeTab !== 'all' && (
            <button className="ao-btn-clear" onClick={clearFilters}>✕ Show All</button>
          )}
        </div>

        {/* ── ORDERS LIST ── */}
        <div className="ao-orders-list">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order, index) => (
              <div
                key={order._id}
                className={`ao-order-card${expandedOrders[order._id] ? ' ao-order-card--expanded' : ''}`}
                style={{ animationDelay: `${Math.min(index * 0.05, 0.5).toFixed(2)}s` }}
              >
                {/* Top row: Order ID + Status + Price */}
                <div className="ao-card-top">
                  <div className="ao-card-id-group">
                    <span className="ao-order-label">Order</span>
                    <span className="ao-order-number">#{order.orderNumber}</span>
                    <span className={`ao-badge ao-badge-${getStatusBadgeClass(order.orderStatus)}`}>
                      {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                    </span>
                  </div>
                  <span className="ao-card-price">
                    ₹{(order.totalAmount || order.totalPrice || 0).toLocaleString()}
                  </span>
                </div>

                {/* Second row: Meta info */}
                <div className="ao-card-meta">
                  <span className="ao-meta-item">
                    <span className="ao-meta-icon">👤</span>
                    {order.user?.name || 'Unknown Customer'}
                  </span>
                  <span className="ao-meta-item">
                    <span className="ao-meta-icon">📅</span>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="ao-meta-item">
                    <span className="ao-meta-icon">📦</span>
                    {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Action bar */}
                <div className="ao-card-actions">
                  <button
                    className="ao-action-btn ao-action-view"
                    onClick={() => toggleOrderExpand(order._id)}
                  >
                    <span>👁</span>
                    {expandedOrders[order._id] ? 'Hide Details' : 'View Order'}
                  </button>

                  {order.orderStatus !== 'cancelled' && order.orderStatus !== 'delivered' && order.orderStatus !== 'refunded' && (
                    <div className="ao-status-select-wrap">
                      <span className="ao-action-label">✏ Status:</span>
                      <select
                        className="ao-inline-status-select"
                        value={order.orderStatus}
                        onChange={e => handleStatusChange(order._id, e.target.value)}
                        onClick={e => e.stopPropagation()}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  )}

                  {order.orderStatus !== 'cancelled' && (
                    <button
                      className="ao-action-btn ao-action-cancel"
                      onClick={() => handleCancelOrder(order._id)}
                    >
                      <span>🗑</span> Cancel
                    </button>
                  )}
                </div>

                {/* ── EXPANDED DETAILS ── */}
                {expandedOrders[order._id] && (
                  <div className="ao-expanded">
                    <div className="ao-expanded-grid">

                      {/* Customer Details */}
                      <div className="ao-detail-section">
                        <h4 className="ao-section-title"><span>👤</span> Customer Details</h4>
                        <div className="ao-detail-item">
                          <span className="ao-detail-icon">📧</span>
                          <div>
                            <p className="ao-detail-label">Email</p>
                            <p className="ao-detail-value">{order.user?.email || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="ao-detail-item">
                          <span className="ao-detail-icon">📞</span>
                          <div>
                            <p className="ao-detail-label">Phone</p>
                            <p className="ao-detail-value">{order.user?.phone || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Shipping Address */}
                      <div className="ao-detail-section">
                        <h4 className="ao-section-title"><span>📍</span> Shipping Address</h4>
                        <div className="ao-address-box">
                          <p className="ao-address-name">{order.shippingAddress?.name}</p>
                          <p>{order.shippingAddress?.street}, {order.shippingAddress?.city}</p>
                          <p>{order.shippingAddress?.state} – {order.shippingAddress?.zipCode}</p>
                        </div>
                      </div>

                      {/* Payment Details */}
                      <div className="ao-detail-section">
                        <h4 className="ao-section-title"><span>💳</span> Payment Details</h4>
                        <div className="ao-detail-item">
                          <span className="ao-detail-icon">🏦</span>
                          <div>
                            <p className="ao-detail-label">Method</p>
                            <p className="ao-detail-value">{order.paymentMethod}</p>
                          </div>
                        </div>
                        <div className="ao-detail-item">
                          <span className="ao-detail-icon">✅</span>
                          <div>
                            <p className="ao-detail-label">Payment Status</p>
                            <span className={`ao-badge ao-pay-${getPaymentStatusBadgeClass(order.paymentStatus)}`}>
                              {order.paymentStatus?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        {order.paymentMethod === 'RAZORPAY' && order.razorpayPaymentId && (
                          <div className="ao-detail-item">
                            <span className="ao-detail-icon">🔗</span>
                            <div>
                              <p className="ao-detail-label">Payment ID</p>
                              <p className="ao-detail-value ao-mono">{order.razorpayPaymentId}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {order.orderStatus === 'cancelled' && (
                      <div className="ao-cancelled-info-box">
                        <h4 className="ao-cancelled-title"><span>🚫</span> Cancellation Details</h4>
                        <div className="ao-cancelled-grid">
                          <div className="ao-cancelled-row">
                            <span className="ao-cancelled-label">Order Status</span>
                            <span className="ao-cancelled-value ao-cancelled-value--status">Cancelled</span>
                          </div>
                          <div className="ao-cancelled-row">
                            <span className="ao-cancelled-label">Cancelled By</span>
                            <span className="ao-cancelled-value">{order.cancelledBy || 'User'}</span>
                          </div>
                          <div className="ao-cancelled-row">
                            <span className="ao-cancelled-label">Cancellation Reason</span>
                            <span className="ao-cancelled-value">{order.cancelReason || 'Not provided'}</span>
                          </div>
                          <div className="ao-cancelled-row">
                            <span className="ao-cancelled-label">Cancelled Date</span>
                            <span className="ao-cancelled-value">{formatCancelledDate(order.cancelledAt)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order Items */}
                    <div className="ao-items-section">
                      <h4 className="ao-section-title"><span>📦</span> Order Items</h4>
                      <div className="ao-items-list">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="ao-item-row">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="ao-item-img"
                              onError={e => {
                                e.target.src = 'https://via.placeholder.com/52x52?text=IMG';
                              }}
                            />
                            <div className="ao-item-info">
                              <p className="ao-item-name">{item.name}</p>
                              <p className="ao-item-qty">Qty: {item.quantity}</p>
                            </div>
                            <span className="ao-item-price">
                              ₹{(item.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="ao-items-total">
                        {order.subtotal > 0 && (
                          <>
                            <div className="ao-items-total-row">
                              <span>Subtotal</span>
                              <span>₹{(order.subtotal || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="ao-items-total-row">
                              <span>GST</span>
                              <span>₹{(order.gst || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="ao-items-total-row">
                              <span>Shipping</span>
                              <span>₹{(order.shipping || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                            </div>
                          </>
                        )}
                        <span>Total Amount</span>
                        <span className="ao-items-total-price">
                          ₹{(order.totalAmount || order.totalPrice || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="ao-empty">
              <div className="ao-empty-icon">📭</div>
              <p className="ao-empty-title">No orders found</p>
              <p className="ao-empty-sub">Try adjusting your filters or search query.</p>
              <button className="ao-btn-clear" onClick={clearFilters}>✕ Clear Filters</button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
