import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';
import './UserReports.css';

/**
 * User Reports Component
 * Displays user's generated reports with download capability
 */
const UserReports = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: ''
  });

  const tabs = [
    { key: 'orders', label: 'Orders', type: 'Order Report', icon: '🧾' },
    { key: 'payments', label: 'Payments', type: 'Payment Report', icon: '💳' },
    { key: 'invoices', label: 'Invoices', type: 'Invoice', icon: '🧾' },
    { key: 'reviews', label: 'Reviews', type: 'Review Report', icon: '⭐' }
  ];

  const statusOptions = {
    orders: ['Pending', 'Delivered', 'Cancelled'],
    payments: ['Paid', 'Pending', 'Failed'],
    invoices: ['Generated', 'Downloaded', 'Archived'],
    reviews: []
  };

  // Fetch user's reports
  const fetchUserReports = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      const activeType = tabs.find(tab => tab.key === activeTab)?.type;
      if (activeType) queryParams.append('type', activeType);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const response = await api.get(`/user/reports?${queryParams.toString()}`);
      if (response.data.success) {
        setReports(response.data.reports);
      }
    } catch (error) {
      toast.error('Failed to fetch reports');
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReviews = async () => {
    setReviewsLoading(true);
    try {
      const response = await api.get('/reviews/user/my-reviews');
      if (response.data.success) {
        setReviews(response.data.reviews || []);
      }
    } catch (error) {
      toast.error('Failed to fetch reviews');
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (!user?._id) return;
    if (activeTab === 'reviews') {
      fetchUserReviews();
      return;
    }
    fetchUserReports();
  }, [user?._id, activeTab, filters.startDate, filters.endDate]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: ''
    });
  };

  const handleApplyFilters = () => {
    fetchUserReports();
  };

  // Download report
  const handleDownloadReport = async (reportId) => {
    try {
      const response = await api.get(`/user/reports/download/${reportId}`);
      if (response.data.success) {
        toast.success('Report downloaded successfully');
        // Refresh reports
        fetchUserReports();
      }
    } catch (error) {
      toast.error('Failed to download report');
    }
  };

  const normalizeStatus = (status) => (status || '').toString().toLowerCase();

  const formatStatus = (status) => {
    if (!status) return 'N/A';
    return status
      .toString()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatPaymentMethod = (method) => {
    if (!method) return 'N/A';
    const value = method.toString().toLowerCase();
    if (value.includes('cod') || value.includes('cash')) return 'COD';
    if (value.includes('upi')) return 'UPI';
    if (value.includes('card')) return 'Card';
    return formatStatus(method);
  };

  const formatCurrency = (amount) => `₹${Number(amount || 0).toFixed(2)}`;

  const getStatusClass = (status) => {
    const normalized = normalizeStatus(status);
    if (['paid', 'completed', 'delivered', 'downloaded'].includes(normalized)) return 'status-success';
    if (['failed', 'cancelled', 'archived'].includes(normalized)) return 'status-danger';
    return 'status-warning';
  };

  const filteredReports = reports.filter(report => {
    if (!filters.status) return true;
    const statusValue = normalizeStatus(filters.status);
    if (activeTab === 'orders') return normalizeStatus(report.orderStatus) === statusValue;
    if (activeTab === 'payments') return normalizeStatus(report.paymentStatus) === statusValue;
    if (activeTab === 'invoices') return normalizeStatus(report.reportStatus) === statusValue;
    return normalizeStatus(report.reportStatus) === statusValue;
  });

  const filteredReviews = reviews.filter(review => {
    if (!filters.startDate && !filters.endDate) return true;
    const reviewDate = new Date(review.createdAt);
    if (filters.startDate && reviewDate < new Date(filters.startDate)) return false;
    if (filters.endDate && reviewDate > new Date(filters.endDate)) return false;
    return true;
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="user-reports-section">
      <div className="reports-header">
        <h3>📊 My Reports</h3>
        <p>View and manage your reports by category</p>
      </div>

      <div className="reports-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab.key);
              setFilters(prev => ({ ...prev, status: '' }));
            }}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="reports-filters">
        <div className="filter-group">
          <label>Status</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Status</option>
            {statusOptions[activeTab].map(option => (
              <option key={option} value={option.toLowerCase()}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>From Date</label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>To Date</label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>

        <div className="filter-actions">
          <button type="button" className="filter-btn clear" onClick={handleClearFilters}>
            Clear
          </button>
          <button type="button" className="filter-btn apply" onClick={handleApplyFilters}>
            Apply Filters
          </button>
        </div>
      </div>

      {/* Reports Cards */}
      <div className="reports-cards">
        {activeTab === 'reviews' ? (
          reviewsLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your reviews...</p>
            </div>
          ) : filteredReviews.length > 0 ? (
            filteredReviews.map(review => (
              <div key={review._id} className="report-card reviews">
                <div className="card-header">
                  <div className="card-title">
                    <span className="card-icon">⭐</span>
                    <div>
                      <h4>{review.product?.name || 'Product Review'}</h4>
                      <p>{formatDate(review.createdAt)}</p>
                    </div>
                  </div>
                  <span className="status-badge status-success">Reviewed</span>
                </div>

                <div className="card-body">
                  <div className="card-row">
                    <span>Rating</span>
                    <strong>{review.rating} ★</strong>
                  </div>
                  <div className="card-row">
                    <span>Comment</span>
                    <span>{review.feedback}</span>
                  </div>
                  <div className="card-row">
                    <span>Admin Reply</span>
                    <span>Not available yet</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No reports available for this category yet</p>
              <small>Product reviews will appear here once submitted.</small>
            </div>
          )
        ) : loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your reports...</p>
          </div>
        ) : filteredReports.length > 0 ? (
          filteredReports.map(report => (
            <div key={report._id} className={`report-card ${activeTab}`}>
              <div className="card-header">
                <div className="card-title">
                  <span className="card-icon">{tabs.find(tab => tab.key === activeTab)?.icon}</span>
                  <div>
                    <h4>
                      {activeTab === 'orders' && `Order ${report.order?.orderNumber || 'N/A'}`}
                      {activeTab === 'payments' && `Payment ${report.order?.orderNumber || 'N/A'}`}
                      {activeTab === 'invoices' && `Invoice ${report.order?.orderNumber || 'N/A'}`}
                      {activeTab === 'reviews' && 'Reviews & Feedback'}
                    </h4>
                    <p>{formatDate(report.orderDate || report.order?.createdAt || report.reportGeneratedAt)}</p>
                  </div>
                </div>
                <span className={`status-badge ${getStatusClass(
                  activeTab === 'orders'
                    ? report.orderStatus
                    : activeTab === 'payments'
                      ? report.paymentStatus
                      : report.reportStatus
                )}`}>
                  {formatStatus(
                    activeTab === 'orders'
                      ? report.orderStatus
                      : activeTab === 'payments'
                        ? report.paymentStatus
                        : report.reportStatus
                  )}
                </span>
              </div>

              <div className="card-body">
                {activeTab === 'orders' && (
                  <>
                    <div className="card-row">
                      <span>Products</span>
                      <div className="card-list">
                        {report.items?.map((item, index) => (
                          <div key={index} className="card-list-item">
                            {item.productName} × {item.quantity} ({formatCurrency(item.productPrice)})
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="card-row">
                      <span>Total Amount</span>
                      <strong>{formatCurrency(report.totalAmount)}</strong>
                    </div>
                  </>
                )}

                {activeTab === 'payments' && (
                  <>
                    <div className="card-row">
                      <span>Payment Method</span>
                      <strong>{formatPaymentMethod(report.paymentMethod)}</strong>
                    </div>
                    <div className="card-row">
                      <span>Transaction ID</span>
                      <span>{report.transactionId || 'N/A'}</span>
                    </div>
                    <div className="card-row">
                      <span>Paid Amount</span>
                      <strong>{formatCurrency(report.totalAmount)}</strong>
                    </div>
                    <div className="card-row">
                      <span>Payment Date</span>
                      <span>{formatDate(report.paymentDate)}</span>
                    </div>
                  </>
                )}

                {activeTab === 'invoices' && (
                  <>
                    <div className="card-row">
                      <span>Invoice Number</span>
                      <strong>INV-{report.order?.orderNumber || report.orderNumber || report._id.slice(-6)}</strong>
                    </div>
                    <div className="card-row">
                      <span>Order ID</span>
                      <span>{report.order?.orderNumber || report.orderNumber || 'N/A'}</span>
                    </div>
                    <div className="card-row">
                      <span>Invoice Date</span>
                      <span>{formatDate(report.reportGeneratedAt)}</span>
                    </div>
                  </>
                )}

                {activeTab === 'reviews' && (
                  <div className="empty-state">
                    <p>No reviews available for this category yet</p>
                    <small>Product reviews will appear here once submitted.</small>
                  </div>
                )}
              </div>

              <div className="card-actions">
                <button
                  type="button"
                  className="card-btn"
                  onClick={() => handleDownloadReport(report._id)}
                >
                  ⬇️ Download
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>No reports available for this category yet</p>
            <small>Your generated reports will appear here.</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserReports;
