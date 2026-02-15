import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import API from '../../services/api';
import './AdminDashboard.css';

/**
 * Modern Professional Admin Dashboard
 * Premium SaaS-style interface with real-time data
 */
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);
  const [orderDist, setOrderDist] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState('daily');

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('🔍 Fetching dashboard data...');
      const { data } = await API.get('/admin/dashboard');
      
      console.log('📊 Dashboard response:', data);
      
      if (data.success) {
        console.log('✅ Dashboard stats:', data.stats);
        console.log('📈 Sales trend data:', data.salesTrendData);
        console.log('🍩 Order distribution:', data.orderDistribution);
        console.log('📦 Recent orders:', data.recentOrders);
        
        setStats(data.stats);
        setSalesTrend(data.salesTrendData || []);
        setOrderDist(data.orderDistribution);
        setRecentOrders(data.recentOrders || []);
        setLastUpdated(new Date());
      } else {
        console.error('❌ Dashboard request failed:', data.message);
      }
    } catch (error) {
      console.error('❌ Dashboard Error:', error);
      console.error('Error response:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString('en-IN')}`;
  };

  const formatTrend = (value) => {
    const num = parseFloat(value) || 0;
    const isPositive = num >= 0;
    return {
      value: Math.abs(num).toFixed(1),
      isPositive,
      symbol: isPositive ? '↑' : '↓',
      color: isPositive ? '#10b981' : '#ef4444'
    };
  };

  const getMaxValue = (data, key) => {
    if (!data || data.length === 0) return 100;
    return Math.max(...data.map(item => item[key] || 0));
  };

  const getStatusColor = (status) => {
    const colors = {
      delivered: '#10b981',
      shipped: '#3b82f6',
      pending: '#f59e0b',
      cancelled: '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="premium-dashboard">
          <div className="loading-overlay">
            <div className="loading-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
            <p className="loading-text">Loading Dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const trend = formatTrend(stats?.salesGrowth);

  return (
    <AdminLayout>
      <div className="premium-dashboard">
        
        {/* Hero KPI Cards with Glassmorphism */}
        <div className="kpi-hero-grid">
          
          {/* Total Sales with Sparkline */}
          <div className="glass-kpi-card sales-card">
            <div className="kpi-top">
              <div className="kpi-icon-circle sales-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="kpi-tag">Revenue</span>
            </div>
            <h2 className="kpi-big-value">{formatCurrency(stats?.totalSales || 0)}</h2>
            <div className="kpi-bottom">
              <div className={`growth-indicator ${trend.isPositive ? 'positive' : 'negative'}`}>
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d={trend.isPositive ? "M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" : "M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z"} clipRule="evenodd" />
                </svg>
                <span>{trend.value || 0}%</span>
              </div>
              <span className="kpi-description">vs last week</span>
            </div>
            <div className="sparkline">
              {salesTrend && salesTrend.length > 0 
                ? salesTrend.slice(0, 7).map((item, i) => {
                    const maxRevenue = Math.max(...salesTrend.map(t => t.revenue || 0), 1);
                    const height = ((item.revenue || 0) / maxRevenue) * 80 + 20;
                    return <div key={i} className="spark-bar" style={{ height: `${height}%` }}></div>;
                  })
                : [1,2,3,4,5,6,7].map((i) => (
                    <div key={i} className="spark-bar" style={{ height: `${20 + Math.random() * 60}%`, opacity: 0.3 }}></div>
                  ))
              }
            </div>
          </div>

          {/* Total Orders */}
          <div className="glass-kpi-card orders-card">
            <div className="kpi-top">
              <div className="kpi-icon-circle orders-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <span className="kpi-tag">Orders</span>
            </div>
            <h2 className="kpi-big-value">{stats?.totalOrders || 0}</h2>
            <div className="kpi-bottom">
              <div className="info-pill today">
                <span className="pill-dot"></span>
                <span>{stats?.todayOrders || 0} today</span>
              </div>
              <span className="kpi-description">Total placed</span>
            </div>
          </div>

          {/* Active Products */}
          <div className="glass-kpi-card products-card">
            <div className="kpi-top">
              <div className="kpi-icon-circle products-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="kpi-tag">Products</span>
            </div>
            <h2 className="kpi-big-value">{stats?.activeProducts || 0}</h2>
            <div className="kpi-bottom">
              {stats?.inactiveProducts > 0 && (
                <div className="info-pill inactive">
                  <span className="pill-dot"></span>
                  <span>{stats.inactiveProducts} inactive</span>
                </div>
              )}
              {stats?.lowStockItems > 0 && (
                <div className="info-pill warning">
                  <span className="pill-dot"></span>
                  <span>{stats.lowStockItems} low stock</span>
                </div>
              )}
              <span className="kpi-description">Active in catalog</span>
            </div>
          </div>

          {/* Total Users */}
          <div className="glass-kpi-card users-card">
            <div className="kpi-top">
              <div className="kpi-icon-circle users-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="kpi-tag">Users</span>
            </div>
            <h2 className="kpi-big-value">{stats?.totalUsers || 0}</h2>
            <div className="kpi-bottom">
              <div className="info-pill success">
                <span className="pill-dot"></span>
                <span>{stats?.newUsersToday || 0} new</span>
              </div>
              <span className="kpi-description">Registered</span>
            </div>
          </div>
        </div>

        {/* Analytics Cards with Charts */}
        <div className="charts-grid">
          
          {/* Sales Performance Chart - Large */}
          <div className="analytics-card large-chart">
            <div className="card-header">
              <div className="header-text">
                <h3 className="card-title">Sales Performance</h3>
                <p className="card-subtitle">Revenue trend analysis</p>
              </div>
              <div className="pill-toggle-group">
                <button 
                  className={`toggle-pill ${chartView === 'daily' ? 'active' : ''}`} 
                  onClick={() => setChartView('daily')}
                >
                  Daily
                </button>
                <button 
                  className={`toggle-pill ${chartView === 'weekly' ? 'active' : ''}`} 
                  onClick={() => setChartView('weekly')}
                >
                  Weekly
                </button>
                <button 
                  className={`toggle-pill ${chartView === 'monthly' ? 'active' : ''}`} 
                  onClick={() => setChartView('monthly')}
                >
                  Monthly
                </button>
              </div>
            </div>
            <div className="card-body">
              {salesTrend && salesTrend.length > 0 ? (
                <div className="gradient-line-chart">
                  {salesTrend.map((item, idx) => {
                    const maxRevenue = getMaxValue(salesTrend, 'revenue');
                    const height = maxRevenue > 0 ? Math.max((item.revenue / maxRevenue) * 100, 5) : 5;
                    
                    return (
                      <div key={idx} className="bar-column">
                        <div className="hover-tooltip">
                          <div className="tooltip-value">{formatCurrency(item.revenue || 0)}</div>
                          <div className="tooltip-label">{item.orders || 0} orders</div>
                          <div className="tooltip-label">{item.day}</div>
                        </div>
                        <div className="gradient-bar" style={{ height: `${height}%` }}></div>
                        <div className="bar-label">{item.day}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p>No sales data available yet</p>
                  <span style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '8px' }}>
                    Data will appear once orders are delivered
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Order Distribution Donut */}
          <div className="analytics-card donut-chart-card">
            <div className="card-header">
              <div className="header-text">
                <h3 className="card-title">Order Distribution</h3>
                <p className="card-subtitle">By status</p>
              </div>
            </div>
            <div className="card-body donut-body">
              {orderDist && (
                <div className="donut-wrapper">
                  <div className="modern-donut">
                    <svg viewBox="0 0 200 200" className="donut-svg">
                      <circle cx="100" cy="100" r="80" fill="none" stroke="#e2e8f0" strokeWidth="30" />
                      <circle cx="100" cy="100" r="80" fill="none" stroke="#10b981" strokeWidth="30" 
                        strokeDasharray="502" strokeDashoffset="0" transform="rotate(-90 100 100)" />
                    </svg>
                    <div className="donut-center-label">
                      <div className="center-number">{stats?.totalOrders || 0}</div>
                      <div className="center-text">Total Orders</div>
                    </div>
                  </div>
                  <div className="donut-legend-list">
                    <div className="legend-row">
                      <div className="legend-marker delivered"></div>
                      <span className="legend-name">Delivered</span>
                      <span className="legend-number">{orderDist.delivered || 0}</span>
                    </div>
                    <div className="legend-row">
                      <div className="legend-marker shipped"></div>
                      <span className="legend-name">Shipped</span>
                      <span className="legend-number">{orderDist.shipped || 0}</span>
                    </div>
                    <div className="legend-row">
                      <div className="legend-marker pending"></div>
                      <span className="legend-name">Pending</span>
                      <span className="legend-number">{orderDist.pending || 0}</span>
                    </div>
                    <div className="legend-row">
                      <div className="legend-marker cancelled"></div>
                      <span className="legend-name">Cancelled</span>
                      <span className="legend-number">{orderDist.cancelled || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alert Insight Cards */}
        <div className="alert-cards-grid">
          <div className="alert-card yellow">
            <div className="alert-icon-wrap">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="alert-content">
              <h4 className="alert-number">{stats?.pendingOrders || 0}</h4>
              <p className="alert-label">Active Orders</p>
              <span className="alert-action">Needs attention</span>
            </div>
          </div>
          
          <div className="alert-card red">
            <div className="alert-icon-wrap">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="alert-content">
              <h4 className="alert-number">{stats?.lowStockItems || 0}</h4>
              <p className="alert-label">Low Stock</p>
              <span className="alert-action">Restock soon</span>
            </div>
          </div>
          
          <div className="alert-card darkred">
            <div className="alert-icon-wrap">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="alert-content">
              <h4 className="alert-number">{stats?.outOfStock || 0}</h4>
              <p className="alert-label">Out of Stock</p>
              <span className="alert-action">Urgent action</span>
            </div>
          </div>
          
          <div className="alert-card green">
            <div className="alert-icon-wrap">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div className="alert-content">
              <h4 className="alert-number">{(stats?.avgRating || 0).toFixed(1)}</h4>
              <p className="alert-label">Average Rating</p>
              <span className="alert-action">Excellent</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="quick-actions-card">
          <h3 className="section-heading">Quick Actions</h3>
          <div className="action-buttons-grid">
            <Link to="/admin/products/add" className="action-button blue">
              <div className="action-button-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="action-button-text">Add Product</span>
            </Link>
            
            <Link to="/admin/orders" className="action-button purple">
              <div className="action-button-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="action-button-text">View Orders</span>
            </Link>
            
            <Link to="/admin/products" className="action-button orange">
              <div className="action-button-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="action-button-text">Manage Inventory</span>
            </Link>
            
            <Link to="/admin/customers" className="action-button teal">
              <div className="action-button-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="action-button-text">Customers</span>
            </Link>
          </div>
        </div>

        {/* Recent Orders Table */}
        {recentOrders && recentOrders.length > 0 && (
          <div className="table-card">
            <div className="table-card-header">
              <h3 className="section-heading">Recent Orders</h3>
              <Link to="/admin/orders" className="view-all-button">
                View All
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
            <div className="table-responsive">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.slice(0, 5).map((order) => (
                    <tr key={order._id}>
                      <td className="font-mono order-id-cell">#{order.orderNumber}</td>
                      <td className="customer-cell">{order.user?.name || 'Guest'}</td>
                      <td>
                        <span className={`modern-badge badge-${order.orderStatus}`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="date-cell">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="amount-cell text-right">{formatCurrency(order.totalAmount || order.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
