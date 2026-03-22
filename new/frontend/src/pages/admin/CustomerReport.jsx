import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import DashboardSkeleton from '../../components/DashboardSkeleton';
import useAdminLoader from '../../hooks/useAdminLoader';
import useToast from '../../hooks/useToast';
import api from '../../services/api';
import './ReportStyles.css';
import { addShopHeader, addPageNumbers, loadUnicodeFonts, pdfRupee } from '../../utils/pdfUtils';

const CustomerReport = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  
  const { loading, run } = useAdminLoader();
  const [exporting, setExporting] = useState(false);
  const [customerData, setCustomerData] = useState([]);
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
  const [analytics, setAnalytics] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    newCustomersThisMonth: 0,
    averageOrders: 0,
    totalRevenue: 0,
    totalOrders: 0
  });

  useEffect(() => {
    run(fetchCustomerData);
  }, []);

  const fetchCustomerData = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        navigate('/admin/login');
        return;
      }

      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.accountStatus) params.append('accountStatus', filters.accountStatus);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.minOrders) params.append('minOrders', filters.minOrders);
      if (filters.maxOrders) params.append('maxOrders', filters.maxOrders);
      if (filters.minAmount) params.append('minAmount', filters.minAmount);
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);

      const queryString = params.toString();
      const endpoint = queryString ? `/admin/reports/customers?${queryString}` : '/admin/reports/customers';

      console.log('👥 Fetching customer report from:', endpoint);
      const response = await api.get(endpoint);
      
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format from server');
      }

      if (response.data.success) {
        const reportData = response.data.data || [];
        const summary = response.data.summary || {};
        
        setCustomerData(reportData);
        
        // Use summary data from API
        setAnalytics({
          totalCustomers: summary.totalCustomers || 0,
          activeCustomers: summary.activeCustomers || 0,
          newCustomersThisMonth: summary.newCustomers || 0,
          averageOrders: summary.averageOrdersPerCustomer || 0,
          totalRevenue: summary.totalRevenue || 0,
          totalOrders: reportData.reduce((sum, customer) => sum + (customer.totalOrders || 0), 0)
        });
        
        // Set pagination if using paginated endpoint
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalUsers: reportData.length
        });
        
        console.log(`✅ Successfully fetched ${reportData.length} customers`);
        console.log('📈 Summary:', summary);
      }
    } catch (err) {
      console.error('❌ Customer Report Error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        endpoint: '/admin/reports/customers'
      });
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        error('Authentication failed. Please login again.');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
        navigate('/admin/login');
      } else if (err.response?.status === 500) {
        error('Server error. Please try again later.');
      } else {
        error(err.response?.data?.message || 'Failed to fetch customer data');
      }
    } finally {
      // loading managed by run()
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    run(fetchCustomerData);
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

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF({ orientation: 'landscape' });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Load Unicode font for ₹ symbol
      const PDF_FONT = await loadUnicodeFonts(doc);

      let yPos = addShopHeader(doc, 'CUSTOMER REPORT', [139, 92, 246]);

      // Reset text style for content
      doc.setFont(PDF_FONT, 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);

      
      if (filters.search || filters.accountStatus || filters.dateFrom || filters.dateTo) {
        doc.text('Filters Applied:', 14, yPos);
        yPos += 5;
        if (filters.search) doc.text(`  • Search: ${filters.search}`, 14, yPos), yPos += 5;
        if (filters.accountStatus) doc.text(`  • Status: ${filters.accountStatus}`, 14, yPos), yPos += 5;
        if (filters.dateFrom) doc.text(`  • From: ${filters.dateFrom}`, 14, yPos), yPos += 5;
        if (filters.dateTo) doc.text(`  • To: ${filters.dateTo}`, 14, yPos), yPos += 5;
        yPos += 5;
      }
      
      // Analytics Summary
      doc.setFont(PDF_FONT, 'bold');
      doc.setFontSize(12);
      doc.setTextColor(139, 92, 246);
      doc.text('Customer Analytics', 14, yPos);
      doc.setFont(PDF_FONT, 'normal');
      doc.setTextColor(60, 60, 60);
      yPos += 8;
      
      doc.setFontSize(10);
      const summaryData = [
        ['Total Customers', analytics.totalCustomers.toString()],
        ['Active Customers', analytics.activeCustomers.toString()],
        ['Total Orders', analytics.totalOrders.toString()],
        ['Total Revenue', pdfRupee(analytics.totalRevenue)]
      ];
      
      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246], textColor: 255 },
        styles: { font: PDF_FONT },
        margin: { left: 14, right: 14 }
      });
      
      yPos = doc.lastAutoTable.finalY + 10;
      
      // Detailed Customer Data
      doc.setFont(PDF_FONT, 'bold');
      doc.setFontSize(12);
      doc.setTextColor(139, 92, 246);
      doc.text('Customer Details', 14, yPos);
      doc.setFont(PDF_FONT, 'normal');
      doc.setTextColor(60, 60, 60);
      yPos += 8;
      
      const tableData = customerData.map(customer => [
        customer.name || 'Unknown',
        customer.email || 'N/A',
        customer.phone || 'N/A',
        customer.address
          ? [customer.address.city, customer.address.state].filter(Boolean).join(', ') || 'N/A'
          : 'N/A',
        customer.actualStatus || customer.status || 'ACTIVE',
        (customer.totalOrders || 0).toString(),
        pdfRupee(customer.totalSpent || 0),
        formatDate(customer.lastOrderDate)
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Name', 'Email', 'Phone', 'City / State', 'Status', 'Orders', 'Total Spent', 'Last Order']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [139, 92, 246], textColor: 255 },
        styles: { font: PDF_FONT, fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 50 },
          2: { cellWidth: 28 },
          3: { cellWidth: 38 },
          4: { cellWidth: 22 },
          5: { cellWidth: 18 },
          6: { cellWidth: 28 },
          7: { cellWidth: 28 }
        },
        margin: { left: 14, right: 14 }
      });
      
      // Save PDF
      addPageNumbers(doc, [139, 92, 246]);
      const fileName = `customer-report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      success('Customer report exported as PDF successfully');
    } catch (err) {
      error('Failed to export PDF');
      console.error('PDF export error:', err);
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

  if (loading) {
    return (
      <AdminLayout>
        <DashboardSkeleton title="Loading Customer Report" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-report-page">
        {/* Header */}
        <div className="report-page-header">
          <button className="btn-back" onClick={() => navigate('/admin/reports')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Reports
          </button>
          <div className="header-content">
            <div className="header-left">
              <div className="header-icon" style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
                👥
              </div>
              <div>
                <h1>Customer Report</h1>
                <p className="subtitle">Analyze customer behavior and demographics</p>
              </div>
            </div>
            <div className="header-actions">
              <button className="btn-toggle-filters" onClick={() => setShowFilters(!showFilters)}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 4h14M5 9h8M7 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
              <button className="btn-export" onClick={handleExportPDF} disabled={exporting}>
                {exporting ? 'Generating PDF...' : 'Export PDF'}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 9v2a2 2 0 01-2 2H3a2 2 0 01-2-2V9M7 10V2M4 5l3-3 3 3"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Summary */}
        <div className="analytics-summary">
          <div className="analytics-card">
            <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
              👥
            </div>
            <div className="analytics-content">
              <p className="analytics-label">Total Customers</p>
              <h3 className="analytics-value">{analytics.totalCustomers}</h3>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
              ✅
            </div>
            <div className="analytics-content">
              <p className="analytics-label">Active Customers</p>
              <h3 className="analytics-value">{analytics.activeCustomers}</h3>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
              📈
            </div>
            <div className="analytics-content">
              <p className="analytics-label">New This Month</p>
              <h3 className="analytics-value">{analytics.newCustomersThisMonth}</h3>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
              🛒
            </div>
            <div className="analytics-content">
              <p className="analytics-label">Avg Orders</p>
              <h3 className="analytics-value">{analytics.averageOrders}</h3>
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

        {/* Customer Data Table */}
        <div className="report-table-container">
          <div className="table-info">
            <p>Showing {customerData.length} of {pagination.totalUsers} customers</p>
          </div>

          {customerData.length > 0 ? (
            <>
              <div className="table-wrapper">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Email</th>
                      <th>Account Status</th>
                      <th>Total Orders</th>
                      <th>Total Amount Spent</th>
                      <th>Last Order Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerData.map((customer) => (
                      <tr key={customer._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ 
                              width: '36px', 
                              height: '36px', 
                              borderRadius: '50%',
                              background: '#8B5CF6',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600,
                              fontSize: '14px',
                              flexShrink: 0
                            }}>
                              {customer.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span>{customer.name || 'Unknown User'}</span>
                          </div>
                        </td>
                        <td>{customer.email}</td>
                        <td>
                          <span className={`status-badge ${(customer.actualStatus || customer.status || 'ACTIVE').toLowerCase()}`}>
                            {customer.actualStatus || customer.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="text-center">{customer.totalOrders || 0}</td>
                        <td className="amount">{formatCurrency(customer.totalSpent || 0)}</td>
                        <td>{formatDate(customer.lastOrderDate)}</td>
                        <td>
                          <button 
                            onClick={() => handleViewReport(customer._id)}
                            style={{
                              padding: '7px 14px',
                              background: '#8B5CF6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '5px',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = '#7C3AED';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.3)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = '#8B5CF6';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            📊 View Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                    disabled={pagination.currentPage === 1}
                    style={{
                      padding: '8px 16px',
                      background: 'white',
                      border: '1.5px solid #e5e7eb',
                      borderRadius: '6px',
                      color: '#374151',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.min(pagination.totalPages, prev.currentPage + 1) }))}
                    disabled={pagination.currentPage === pagination.totalPages}
                    style={{
                      padding: '8px 16px',
                      background: 'white',
                      border: '1.5px solid #e5e7eb',
                      borderRadius: '6px',
                      color: '#374151',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
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
              <h3>No customer data found</h3>
              <p>Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default CustomerReport;
