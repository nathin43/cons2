import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import useToast from '../../hooks/useToast';
import api from '../../services/api';
import './AdminReportsNewStyle.css';

const AdminReports = () => {
  const { admin } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    accountStatus: '',
    dateFrom: '',
    dateTo: '',
    minOrders: '',
    maxOrders: '',
    minAmount: '',
    maxAmount: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.currentPage, filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.currentPage);
      params.append('limit', 15);
      
      if (filters.search) params.append('search', filters.search);
      if (filters.accountStatus) params.append('accountStatus', filters.accountStatus);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.minOrders) params.append('minOrders', filters.minOrders);
      if (filters.maxOrders) params.append('maxOrders', filters.maxOrders);
      if (filters.minAmount) params.append('minAmount', filters.minAmount);
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);

      const response = await api.get(`/admin/reports/users?${params.toString()}`);
      if (response.data.success) {
        setUsers(response.data.users);
        setPagination({
          currentPage: response.data.currentPage,
          totalPages: response.data.totalPages,
          totalUsers: response.data.totalUsers
        });
      }
    } catch (err) {
      error('Failed to fetch user reports');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleApplyFilters = () => {
    fetchUsers();
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      accountStatus: '',
      dateFrom: '',
      dateTo: '',
      minOrders: '',
      maxOrders: '',
      minAmount: '',
      maxAmount: ''
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleViewReport = (userId) => {
    navigate(`/admin/reports/user/${userId}`);
  };

  const buildExportParams = () => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.accountStatus) params.append('accountStatus', filters.accountStatus);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.minOrders) params.append('minOrders', filters.minOrders);
    if (filters.maxOrders) params.append('maxOrders', filters.maxOrders);
    if (filters.minAmount) params.append('minAmount', filters.minAmount);
    if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);
    return params.toString();
  };

  const downloadBlob = (blob, fileName) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const params = buildExportParams();
      const response = await api.get(`/admin/reports/export/csv${params ? `?${params}` : ''}`, {
        responseType: 'blob'
      });
      downloadBlob(response.data, `user-reports-${new Date().toISOString().split('T')[0]}.csv`);
      success('CSV exported successfully');
    } catch (err) {
      error('Failed to export CSV');
      console.error('CSV export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const params = buildExportParams();
      const response = await api.get(`/admin/reports/export/excel${params ? `?${params}` : ''}`, {
        responseType: 'blob'
      });
      downloadBlob(response.data, `user-reports-${new Date().toISOString().split('T')[0]}.xlsx`);
      success('Excel exported successfully');
    } catch (err) {
      error('Failed to export Excel');
      console.error('Excel export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', { 
      year: 'numeric', month: 'short', day: 'numeric' 
    });
  };

  return (
    <AdminLayout>
      <div className="admin-reports">
        {/* Header */}
        <div className="reports-header">
          <div className="header-left">
            <h1>User Reports</h1>
            <p className="subtitle">View and analyze user order reports</p>
          </div>
          <div className="header-actions">
            <button className="btn-toggle-filters" onClick={() => setShowFilters(!showFilters)}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 4h14M5 9h8M7 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <div className="export-dropdown">
              <button className="btn-export" disabled={exporting}>
                {exporting ? 'Exporting...' : 'Export'}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <div className="export-menu">
                <button onClick={handleExportCSV} disabled={exporting}>Export as CSV</button>
                <button onClick={handleExportExcel} disabled={exporting}>Export as Excel</button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filters-grid">
              <div className="filter-item">
                <label>Search User</label>
                <input 
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Name or email..."
                />
              </div>

              <div className="filter-item">
                <label>Account Status</label>
                <select name="accountStatus" value={filters.accountStatus} onChange={handleFilterChange}>
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="filter-item">
                <label>Date From</label>
                <input 
                  type="date"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="filter-item">
                <label>Date To</label>
                <input 
                  type="date"
                  name="dateTo"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="filter-item">
                <label>Min Orders</label>
                <input 
                  type="number"
                  name="minOrders"
                  value={filters.minOrders}
                  onChange={handleFilterChange}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="filter-item">
                <label>Max Orders</label>
                <input 
                  type="number"
                  name="maxOrders"
                  value={filters.maxOrders}
                  onChange={handleFilterChange}
                  placeholder="100"
                  min="0"
                />
              </div>

              <div className="filter-item">
                <label>Min Amount</label>
                <input 
                  type="number"
                  name="minAmount"
                  value={filters.minAmount}
                  onChange={handleFilterChange}
                  placeholder="₹0"
                  min="0"
                />
              </div>

              <div className="filter-item">
                <label>Max Amount</label>
                <input 
                  type="number"
                  name="maxAmount"
                  value={filters.maxAmount}
                  onChange={handleFilterChange}
                  placeholder="₹100000"
                  min="0"
                />
              </div>
            </div>

            <div className="filter-actions">
              <button className="btn-apply" onClick={handleApplyFilters}>Apply Filters</button>
              <button className="btn-clear" onClick={handleClearFilters}>Clear All</button>
            </div>
          </div>
        )}

        {/* Reports Table */}
        <div className="reports-table-container">
          <div className="table-info">
            <p>Showing {users.length} of {pagination.totalUsers} users</p>
          </div>

          {loading ? (
            <div className="table-loading">
              <div className="spinner"></div>
              <p>Loading user reports...</p>
            </div>
          ) : users.length > 0 ? (
            <>
              <div className="table-wrapper">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>User Name</th>
                      <th>Email</th>
                      <th>Account Status</th>
                      <th>Total Orders</th>
                      <th>Total Amount Spent</th>
                      <th>Last Order Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">
                              {user.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span>{user.name || 'Unknown User'}</span>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <div className="status-container">
                            <span 
                              className={`status-badge ${(user.actualStatus || user.status || 'ACTIVE').toLowerCase()}`}
                              title={user.actualStatusReason || user.statusReason || ''}
                            >
                              {user.actualStatus || user.status || 'ACTIVE'}
                            </span>
                            {(user.actualStatusReason || user.statusReason) && (
                              <div className="status-tooltip">
                                <div className="tooltip-header">
                                  {user.actualStatus || user.status}
                                </div>
                                <div className="tooltip-body">
                                  <p><strong>Reason:</strong> {user.actualStatusReason || user.statusReason}</p>
                                  {user.actualStatusChangedBy && (
                                    <p><strong>By:</strong> {user.actualStatusChangedBy}</p>
                                  )}
                                  {user.actualStatusChangedAt && (
                                    <p><strong>Date:</strong> {formatDate(user.actualStatusChangedAt)}</p>
                                  )}
                                  {user.actualSuspensionUntil && (
                                    <p><strong>Until:</strong> {formatDate(user.actualSuspensionUntil)}</p>
                                  )}
                                  {user.lastLoginAt && (user.actualStatus === 'INACTIVE' || user.status === 'INACTIVE') && (
                                    <p><strong>Last Login:</strong> {formatDate(user.lastLoginAt)}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="text-center">{user.totalOrders || 0}</td>
                        <td className="amount">{formatCurrency(user.totalAmountSpent || 0)}</td>
                        <td>{formatDate(user.lastOrder)}</td>
                        <td>
                          <button 
                            className="btn-view-report"
                            onClick={() => handleViewReport(user._id)}
                          >
                            View Full Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                    disabled={pagination.currentPage === 1}
                    className="page-btn"
                  >
                    Previous
                  </button>
                  <span className="page-info">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.min(pagination.totalPages, prev.currentPage + 1) }))}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="page-btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="30" fill="#f3f4f6"/>
                <path d="M32 20v16M32 44h.01" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              <h3>No user reports found</h3>
              <p>Try adjusting your filters or search criteria</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
