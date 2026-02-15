import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import API from '../../services/api';
import './AdminCustomers.css';

/**
 * Admin Customers Page
 * View and manage customers
 */
const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, name
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Disable body scroll when modal is open
  useEffect(() => {
    if (selectedCustomer) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedCustomer]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data } = await API.get('/admin/customers');
      setCustomers(data.customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (customerId) => {
    try {
      const { data } = await API.get(`/admin/customers/${customerId}`);
      setSelectedCustomer(data.customer);
      setCustomerOrders(data.orders);
    } catch (error) {
      alert('Failed to fetch customer details');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete customer "${name}"?`)) {
      return;
    }

    try {
      await API.delete(`/admin/customers/${id}`);
      alert('Customer deleted successfully');
      fetchCustomers();
      if (selectedCustomer?._id === id) {
        setSelectedCustomer(null);
        setCustomerOrders([]);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete customer');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="spinner"></div>
      </AdminLayout>
    );
  }

  // Filter and sort customers
  const filteredCustomers = customers
    .filter(customer =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIdx, startIdx + itemsPerPage);

  // Generate customer initials
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get avatar color based on name
  const getAvatarColor = (name) => {
    const colors = ['#4279a3', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const charCode = name.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  return (
    <AdminLayout>
      <div className="admin-customers">
        {/* Modern Header Section */}
        <div className="customers-header">
          <div className="header-gradient">
            <div className="header-content">
              <div className="header-text">
                <h1>Customers</h1>
                <p className="header-subtitle">Manage and view all registered customers</p>
              </div>
              <div className="stats-card">
                <div className="stats-icon">
                  <span className="icon-emoji">👥</span>
                </div>
                <div className="stats-info">
                  <div className="stats-label">Total Customers</div>
                  <div className="stats-value">{customers.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Search & Filter Toolbar */}
        <div className="customers-toolbar">
          <div className="search-container">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder="Search customers by name or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="search-input"
            />
          </div>
          
          <div className="toolbar-actions">
            <select 
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
            </select>
            
            <div className="customer-count">
              <span className="count-number">{filteredCustomers.length}</span>
              <span className="count-label">Customers</span>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="table-card">
          <table className="customers-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th className="text-center">Phone</th>
                <th className="text-center">Joined</th>
                <th>Address</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.length > 0 ? (
                paginatedCustomers.map((customer, idx) => (
                  <tr key={customer._id} className={idx % 2 === 0 ? 'even-row' : ''}>
                    <td>
                      <div className="customer-name-cell">
                        <div 
                          className="avatar"
                          style={{ backgroundColor: getAvatarColor(customer.name) }}
                        >
                          {getInitials(customer.name)}
                        </div>
                        <span className="customer-name">{customer.name}</span>
                      </div>
                    </td>
                    <td className="email-cell">{customer.email}</td>
                    <td className="text-center">{customer.phone || '—'}</td>
                    <td className="text-center date-cell">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="address-cell">
                      {customer.address?.city || customer.address?.state ? (
                        `${customer.address?.city || ''}${customer.address?.city && customer.address?.state ? ', ' : ''}${customer.address?.state || ''}`
                      ) : '—'}
                    </td>
                    <td className="text-center">
                      <div className="action-buttons">
                        <button
                          onClick={() => fetchCustomerDetails(customer._id)}
                          className="btn-icon btn-view"
                          title="View Details"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(customer._id, customer.name)}
                          className="btn-icon btn-delete"
                          title="Delete Customer"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">
                    {searchQuery ? 'No customers found matching your search' : 'No customers available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              ← Previous
            </button>
            <div className="pagination-info">
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Next →
            </button>
          </div>
        )}

        {/* Customer Details Modal */}
        {selectedCustomer && (
          <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Customer Details</h2>
                <button onClick={() => setSelectedCustomer(null)} className="close-btn">
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="customer-info-section">
                  <h3>Personal Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Name:</span>
                      <span className="info-value">{selectedCustomer.name}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{selectedCustomer.email}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Phone:</span>
                      <span className="info-value">{selectedCustomer.phone}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Address:</span>
                      <span className="info-value">
                        {selectedCustomer.address?.street}, {selectedCustomer.address?.city},
                        {selectedCustomer.address?.state} - {selectedCustomer.address?.zipCode}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="customer-orders-section">
                  <h3>Order History ({customerOrders.length} orders)</h3>
                  
                  {customerOrders.length === 0 ? (
                    <p className="no-orders">No orders yet</p>
                  ) : (
                    <div className="orders-list">
                      {customerOrders.map((order) => (
                        <div key={order._id} className="order-item">
                          <div className="order-info">
                            <span className="order-number">#{order.orderNumber}</span>
                            <span className="order-date">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="order-details">
                            <span className="order-amount">
                              ₹{(order.totalAmount || order.totalPrice || 0).toLocaleString()}
                            </span>
                            <span className={`badge badge-${getStatusColor(order.orderStatus)}`}>
                              {order.orderStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
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

export default AdminCustomers;
