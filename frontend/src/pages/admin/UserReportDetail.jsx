import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import AdminLayout from '../../components/AdminLayout';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';
import './UserReportDetail.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const UserReportDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [analytics, setAnalytics] = useState({
    activity: null,
    purchases: null,
    demographics: null,
    payment: null,
    engagement: null
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchUserReport();
  }, [userId, dateRange]);

  const fetchUserReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange !== 'all') params.append('range', dateRange);
      if (dateRange === 'custom' && customDateRange.start && customDateRange.end) {
        params.append('startDate', customDateRange.start);
        params.append('endDate', customDateRange.end);
      }

      const response = await api.get(`/reports/user/${userId}/detailed?${params.toString()}`);
      if (response.data.success) {
        setUserData(response.data.user);
        setAnalytics(response.data.analytics);
      }
    } catch (error) {
      toast.error('Failed to fetch user report');
      console.error('Error fetching user report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await api.get(`/reports/user/${userId}/export/${format}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `user-report-${userId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { 
    year: 'numeric', month: 'short', day: 'numeric' 
  });
  const formatDateTime = (date) => new Date(date).toLocaleString('en-IN', { 
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="user-report-loading">
          <div className="loading-spinner"></div>
          <p>Loading user report...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!userData) {
    return (
      <AdminLayout>
        <div className="user-report-error">
          <h2>User not found</h2>
          <button onClick={() => navigate('/admin/reports')} className="btn-back">
            Back to Reports
          </button>
        </div>
      </AdminLayout>
    );
  }

  // Chart data
  const deviceUsageData = {
    labels: ['Desktop', 'Mobile', 'Tablet'],
    datasets: [{
      data: [
        analytics.demographics?.deviceUsage?.desktop || 0,
        analytics.demographics?.deviceUsage?.mobile || 0,
        analytics.demographics?.deviceUsage?.tablet || 0
      ],
      backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6'],
      borderWidth: 0
    }]
  };

  const categoryPreferenceData = {
    labels: analytics.purchases?.topCategories?.map(c => c.name) || [],
    datasets: [{
      label: 'Orders',
      data: analytics.purchases?.topCategories?.map(c => c.count) || [],
      backgroundColor: '#6366f1',
      borderRadius: 6
    }]
  };

  const monthlySpendingData = {
    labels: analytics.purchases?.monthlySpending?.map(m => m.month) || [],
    datasets: [{
      label: 'Spending (₹)',
      data: analytics.purchases?.monthlySpending?.map(m => m.amount) || [],
      backgroundColor: '#14b8a6',
      borderRadius: 6
    }]
  };

  return (
    <AdminLayout>
      <div className="user-report-detail">
        {/* Header */}
        <div className="report-header">
          <div className="header-left">
            <button onClick={() => navigate('/admin/reports')} className="btn-back-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="header-info">
              <h1>User Report: {userData.name}</h1>
              <p className="user-email">{userData.email}</p>
            </div>
          </div>
          <div className="header-actions">
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="date-range-select"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </select>
            <div className="export-dropdown">
              <button className="btn-export">
                Export
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="export-menu">
                <button onClick={() => handleExport('pdf')}>Export as PDF</button>
                <button onClick={() => handleExport('excel')}>Export as Excel</button>
                <button onClick={() => handleExport('csv')}>Export as CSV</button>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Date Range */}
        {dateRange === 'custom' && (
          <div className="custom-date-range">
            <input 
              type="date" 
              value={customDateRange.start}
              onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
              placeholder="Start Date"
            />
            <span>to</span>
            <input 
              type="date" 
              value={customDateRange.end}
              onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
              placeholder="End Date"
            />
            <button onClick={fetchUserReport} className="btn-apply">Apply</button>
          </div>
        )}

        {/* Quick Stats Overview */}
        <div className="quick-stats-grid">
          <div className="stat-card blue">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M16 21V5C16 3.89543 16.8954 3 18 3C19.1046 3 20 3.89543 20 5V21M12 21V9C12 7.89543 12.8954 7 14 7C15.1046 7 16 7.89543 16 9V21M8 21V13C8 11.8954 8.89543 11 10 11C11.1046 11 12 11.8954 12 13V21M4 21V17C4 15.8954 4.89543 15 6 15C7.10457 15 8 15.8954 8 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Orders</p>
              <h3 className="stat-value">{analytics.purchases?.totalOrders || 0}</h3>
              <p className="stat-change positive">+12% vs last period</p>
            </div>
          </div>

          <div className="stat-card green">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Spent</p>
              <h3 className="stat-value">{formatCurrency(analytics.purchases?.totalSpent || 0)}</h3>
              <p className="stat-change positive">+8% vs last period</p>
            </div>
          </div>

          <div className="stat-card purple">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <p className="stat-label">Avg Order Value</p>
              <h3 className="stat-value">{formatCurrency(analytics.purchases?.avgOrderValue || 0)}</h3>
              <p className="stat-change neutral">~2% vs last period</p>
            </div>
          </div>

          <div className="stat-card teal">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <p className="stat-label">Active Sessions</p>
              <h3 className="stat-value">{analytics.activity?.totalSessions || 0}</h3>
              <p className="stat-change positive">+5 this week</p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="tabs-navigation">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            Activity
          </button>
          <button 
            className={`tab-btn ${activeTab === 'purchases' ? 'active' : ''}`}
            onClick={() => setActiveTab('purchases')}
          >
            Purchases
          </button>
          <button 
            className={`tab-btn ${activeTab === 'demographics' ? 'active' : ''}`}
            onClick={() => setActiveTab('demographics')}
          >
            Demographics
          </button>
          <button 
            className={`tab-btn ${activeTab === 'engagement' ? 'active' : ''}`}
            onClick={() => setActiveTab('engagement')}
          >
            Engagement
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="overview-grid">
                {/* User Information Card */}
                <div className="info-card">
                  <div className="card-header">
                    <h3>User Information</h3>
                  </div>
                  <div className="card-body">
                    <div className="info-row">
                      <span className="info-label">Name</span>
                      <span className="info-value">{userData.name}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Email</span>
                      <span className="info-value">{userData.email}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Phone</span>
                      <span className="info-value">{userData.mobile || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Registered</span>
                      <span className="info-value">{formatDate(userData.createdAt)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Status</span>
                      <span className={`status-badge ${userData.isActive ? 'active' : 'inactive'}`}>
                        {userData.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Last Login</span>
                      <span className="info-value">{formatDateTime(analytics.activity?.lastLogin || userData.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Device Usage Chart */}
                <div className="info-card">
                  <div className="card-header">
                    <h3>Device Usage</h3>
                  </div>
                  <div className="card-body chart-container">
                    <Pie data={deviceUsageData} options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      plugins: {
                        legend: { position: 'bottom', labels: { padding: 15, font: { size: 12 } } }
                      }
                    }} />
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="info-card full-width">
                  <div className="card-header">
                    <h3>Recent Activity</h3>
                  </div>
                  <div className="card-body">
                    <div className="activity-timeline">
                      {analytics.activity?.recentActivities?.slice(0, 5).map((activity, index) => (
                        <div key={index} className="timeline-item">
                          <div className="timeline-dot"></div>
                          <div className="timeline-content">
                            <p className="timeline-action">{activity.action}</p>
                            <p className="timeline-date">{formatDateTime(activity.timestamp)}</p>
                          </div>
                        </div>
                      )) || <p className="no-data">No recent activity</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="activity-tab">
              <div className="activity-grid">
                <div className="info-card">
                  <div className="card-header">
                    <h3>Login Activity</h3>
                  </div>
                  <div className="card-body">
                    <div className="metric-row">
                      <span className="metric-label">Total Logins</span>
                      <span className="metric-value">{analytics.activity?.totalLogins || 0}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Last Login</span>
                      <span className="metric-value">{formatDateTime(analytics.activity?.lastLogin)}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Avg Session Duration</span>
                      <span className="metric-value">{analytics.activity?.avgSessionDuration || '0m'}</span>
                    </div>
                  </div>
                </div>

                <div className="info-card">
                  <div className="card-header">
                    <h3>Browsing Behavior</h3>
                  </div>
                  <div className="card-body">
                    <div className="metric-row">
                      <span className="metric-label">Pages Viewed</span>
                      <span className="metric-value">{analytics.activity?.totalPageViews || 0}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Products Viewed</span>
                      <span className="metric-value">{analytics.activity?.productsViewed || 0}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Search Queries</span>
                      <span className="metric-value">{analytics.activity?.searchQueries || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="info-card">
                  <div className="card-header">
                    <h3>Cart Activity</h3>
                  </div>
                  <div className="card-body">
                    <div className="metric-row">
                      <span className="metric-label">Items Added</span>
                      <span className="metric-value">{analytics.activity?.cartItemsAdded || 0}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Items Removed</span>
                      <span className="metric-value">{analytics.activity?.cartItemsRemoved || 0}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Cart Abandonment Rate</span>
                      <span className="metric-value">{analytics.activity?.cartAbandonmentRate || '0%'}</span>
                    </div>
                  </div>
                </div>

                {/* Activity History Table */}
                <div className="info-card full-width">
                  <div className="card-header">
                    <h3>Activity History</h3>
                  </div>
                  <div className="card-body">
                    <div className="table-container">
                      <table className="activity-table">
                        <thead>
                          <tr>
                            <th>Date & Time</th>
                            <th>Action</th>
                            <th>Details</th>
                            <th>Device</th>
                            <th>IP Address</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.activity?.activityHistory?.map((activity, index) => (
                            <tr key={index}>
                              <td>{formatDateTime(activity.timestamp)}</td>
                              <td><span className="activity-badge">{activity.action}</span></td>
                              <td>{activity.details || '-'}</td>
                              <td>{activity.device || 'Desktop'}</td>
                              <td>{activity.ipAddress || '-'}</td>
                            </tr>
                          )) || <tr><td colSpan="5" className="no-data">No activity data</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Purchases Tab */}
          {activeTab === 'purchases' && (
            <div className="purchases-tab">
              <div className="purchases-grid">
                <div className="info-card">
                  <div className="card-header">
                    <h3>Purchase Summary</h3>
                  </div>
                  <div className="card-body">
                    <div className="metric-row">
                      <span className="metric-label">Total Orders</span>
                      <span className="metric-value">{analytics.purchases?.totalOrders || 0}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Total Spent</span>
                      <span className="metric-value">{formatCurrency(analytics.purchases?.totalSpent || 0)}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Average Order Value</span>
                      <span className="metric-value">{formatCurrency(analytics.purchases?.avgOrderValue || 0)}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Highest Order</span>
                      <span className="metric-value">{formatCurrency(analytics.purchases?.highestOrder || 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="info-card">
                  <div className="card-header">
                    <h3>Order Status</h3>
                  </div>
                  <div className="card-body">
                    <div className="metric-row">
                      <span className="metric-label">Completed</span>
                      <span className="metric-value status-success">{analytics.purchases?.orderStatus?.completed || 0}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Pending</span>
                      <span className="metric-value status-warning">{analytics.purchases?.orderStatus?.pending || 0}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Cancelled</span>
                      <span className="metric-value status-danger">{analytics.purchases?.orderStatus?.cancelled || 0}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Returned</span>
                      <span className="metric-value status-neutral">{analytics.purchases?.orderStatus?.returned || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Category Preferences Chart */}
                <div className="info-card full-width">
                  <div className="card-header">
                    <h3>Category Preferences</h3>
                  </div>
                  <div className="card-body chart-container">
                    <Bar data={categoryPreferenceData} options={{
                      responsive: true,
                      plugins: {
                        legend: { display: false },
                        title: { display: false }
                      },
                      scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1 } }
                      }
                    }} />
                  </div>
                </div>

                {/* Monthly Spending Chart */}
                <div className="info-card full-width">
                  <div className="card-header">
                    <h3>Monthly Spending Trend</h3>
                  </div>
                  <div className="card-body chart-container">
                    <Bar data={monthlySpendingData} options={{
                      responsive: true,
                      plugins: {
                        legend: { display: false },
                        title: { display: false }
                      },
                      scales: {
                        y: { beginAtZero: true }
                      }
                    }} />
                  </div>
                </div>

                {/* Order History Table */}
                <div className="info-card full-width">
                  <div className="card-header">
                    <h3>Order History</h3>
                  </div>
                  <div className="card-body">
                    <div className="table-container">
                      <table className="orders-table">
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Items</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Payment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.purchases?.orderHistory?.map((order, index) => (
                            <tr key={index}>
                              <td className="order-id">#{order.orderNumber || order._id?.slice(-8)}</td>
                              <td>{formatDate(order.createdAt)}</td>
                              <td>{order.items?.length || 0} items</td>
                              <td className="amount">{formatCurrency(order.totalAmount)}</td>
                              <td><span className={`status-badge ${order.orderStatus?.toLowerCase()}`}>{order.orderStatus}</span></td>
                              <td><span className={`status-badge ${order.paymentStatus?.toLowerCase()}`}>{order.paymentStatus}</span></td>
                            </tr>
                          )) || <tr><td colSpan="6" className="no-data">No order history</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Demographics Tab */}
          {activeTab === 'demographics' && (
            <div className="demographics-tab">
              <div className="demographics-grid">
                <div className="info-card">
                  <div className="card-header">
                    <h3>Location Details</h3>
                  </div>
                  <div className="card-body">
                    <div className="info-row">
                      <span className="info-label">Country</span>
                      <span className="info-value">{analytics.demographics?.location?.country || 'India'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">State</span>
                      <span className="info-value">{analytics.demographics?.location?.state || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">City</span>
                      <span className="info-value">{analytics.demographics?.location?.city || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Pincode</span>
                      <span className="info-value">{analytics.demographics?.location?.pincode || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="info-card">
                  <div className="card-header">
                    <h3>Device Information</h3>
                  </div>
                  <div className="card-body">
                    <div className="info-row">
                      <span className="info-label">Primary Device</span>
                      <span className="info-value">{analytics.demographics?.primaryDevice || 'Desktop'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Browser</span>
                      <span className="info-value">{analytics.demographics?.browser || 'Chrome'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Operating System</span>
                      <span className="info-value">{analytics.demographics?.os || 'Windows'}</span>
                    </div>
                  </div>
                </div>

                <div className="info-card">
                  <div className="card-header">
                    <h3>Preferred Categories</h3>
                  </div>
                  <div className="card-body">
                    {analytics.demographics?.preferredCategories?.map((cat, index) => (
                      <div key={index} className="category-preference">
                        <span className="category-name">{cat.name}</span>
                        <div className="category-bar">
                          <div className="category-fill" style={{ width: `${cat.percentage}%` }}></div>
                        </div>
                        <span className="category-percentage">{cat.percentage}%</span>
                      </div>
                    )) || <p className="no-data">No category preferences</p>}
                  </div>
                </div>

                <div className="info-card">
                  <div className="card-header">
                    <h3>Shopping Patterns</h3>
                  </div>
                  <div className="card-body">
                    <div className="info-row">
                      <span className="info-label">Most Active Day</span>
                      <span className="info-value">{analytics.demographics?.mostActiveDay || 'Sunday'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Preferred Time</span>
                      <span className="info-value">{analytics.demographics?.preferredTime || '6 PM - 9 PM'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Shopping Frequency</span>
                      <span className="info-value">{analytics.demographics?.shoppingFrequency || 'Monthly'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Engagement Tab */}
          {activeTab === 'engagement' && (
            <div className="engagement-tab">
              <div className="engagement-grid">
                <div className="info-card">
                  <div className="card-header">
                    <h3>Engagement Metrics</h3>
                  </div>
                  <div className="card-body">
                    <div className="metric-row">
                      <span className="metric-label">Engagement Score</span>
                      <span className="metric-value highlight">{analytics.engagement?.score || 0}/100</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Conversion Rate</span>
                      <span className="metric-value">{analytics.engagement?.conversionRate || '0%'}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Repeat Purchase Rate</span>
                      <span className="metric-value">{analytics.engagement?.repeatPurchaseRate || '0%'}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Customer Lifetime Value</span>
                      <span className="metric-value">{formatCurrency(analytics.engagement?.lifetimeValue || 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="info-card">
                  <div className="card-header">
                    <h3>Interaction Metrics</h3>
                  </div>
                  <div className="card-body">
                    <div className="metric-row">
                      <span className="metric-label">Wishlist Items</span>
                      <span className="metric-value">{analytics.engagement?.wishlistItems || 0}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Reviews Given</span>
                      <span className="metric-value">{analytics.engagement?.reviewsGiven || 0}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Average Rating</span>
                      <span className="metric-value">{analytics.engagement?.avgRating || '0.0'} ⭐</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Support Tickets</span>
                      <span className="metric-value">{analytics.engagement?.supportTickets || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="info-card">
                  <div className="card-header">
                    <h3>Payment Behavior</h3>
                  </div>
                  <div className="card-body">
                    <div className="info-row">
                      <span className="info-label">Preferred Payment Method</span>
                      <span className="info-value">{analytics.payment?.preferredMethod || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Payment Success Rate</span>
                      <span className="info-value">{analytics.payment?.successRate || '0%'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Failed Payments</span>
                      <span className="info-value">{analytics.payment?.failedPayments || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="info-card">
                  <div className="card-header">
                    <h3>Loyalty Indicators</h3>
                  </div>
                  <div className="card-body">
                    <div className="metric-row">
                      <span className="metric-label">Customer Since</span>
                      <span className="metric-value">{formatDate(userData.createdAt)}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Days Active</span>
                      <span className="metric-value">{analytics.engagement?.daysActive || 0} days</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Referrals Made</span>
                      <span className="metric-value">{analytics.engagement?.referrals || 0}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Loyalty Tier</span>
                      <span className={`tier-badge ${analytics.engagement?.loyaltyTier?.toLowerCase() || 'bronze'}`}>
                        {analytics.engagement?.loyaltyTier || 'Bronze'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default UserReportDetail;
