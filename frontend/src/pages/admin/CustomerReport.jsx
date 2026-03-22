import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import DashboardSkeleton from '../../components/DashboardSkeleton';
import useAdminLoader from '../../hooks/useAdminLoader';
import useToast from '../../hooks/useToast';
import api from '../../services/api';
import './ReportStyles.css';
import { addShopHeader, addPageNumbers, loadUnicodeFonts, pdfRupee } from '../../utils/pdfUtils';
import {
  REPORT_RANGE_OPTIONS,
  getRangeTitle,
  getRangeDates,
  shiftRangeAnchor,
  getRangePeriodLabel,
  formatDateInput,
  formatDateLabel,
} from '../../utils/reportRange';
import {
  getTimelinePoints,
  mapSeriesToTimeline,
  bucketKeyForDate,
  hasAnyNonZero,
} from '../../utils/reportChartTimeline';
import ModernReportChart from '../../components/admin/ModernReportChart';
import useReportAutoRefresh from '../../hooks/useReportAutoRefresh';
import { filterByDateRange } from '../../utils/reportDataSync';

const CustomerReport = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  
  const { loading, run } = useAdminLoader();
  const [exporting, setExporting] = useState(false);
  const [allCustomerData, setAllCustomerData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [selectedRange, setSelectedRange] = useState('monthly');
  const [periodAnchor, setPeriodAnchor] = useState(new Date());
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [backendChart, setBackendChart] = useState(null);
  const [growthTrend, setGrowthTrend] = useState([]);
  const [dateRangeLabel, setDateRangeLabel] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const initialRange = getRangeDates('monthly');
  const [filters, setFilters] = useState({
    search: '',
    accountStatus: '',
    dateFrom: formatDateInput(initialRange.from),
    dateTo: formatDateInput(initialRange.to),
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
  const chartRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    run(async () => {
      await fetchCustomerData(selectedRange, null);
    }).finally(() => {
      if (mounted) setIsInitialLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const fetchCustomerData = async (rangeOverride = selectedRange, filtersOverride = null) => {
    const activeFilters = filtersOverride || filters;
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        navigate('/admin/login');
        return;
      }

      const params = new URLSearchParams();
      if (activeFilters.search) params.append('search', activeFilters.search);
      if (activeFilters.accountStatus) params.append('accountStatus', activeFilters.accountStatus);
      if (activeFilters.dateFrom) params.append('dateFrom', activeFilters.dateFrom);
      if (activeFilters.dateTo) params.append('dateTo', activeFilters.dateTo);
      if (activeFilters.minOrders) params.append('minOrders', activeFilters.minOrders);
      if (activeFilters.maxOrders) params.append('maxOrders', activeFilters.maxOrders);
      if (activeFilters.minAmount) params.append('minAmount', activeFilters.minAmount);
      if (activeFilters.maxAmount) params.append('maxAmount', activeFilters.maxAmount);
      params.append('range', rangeOverride);

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
        const chart = response.data.chart || null;

        setAllCustomerData(reportData);
        setBackendChart(chart);
        setComparison(summary.comparison || null);
        if (summary.dateRange?.from && summary.dateRange?.to) {
          setDateRangeLabel(`${formatDateLabel(summary.dateRange.from)} - ${formatDateLabel(summary.dateRange.to)}`);
        } else {
          setDateRangeLabel('');
        }
        
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
        setComparison(null);
        setBackendChart(null);
        setGrowthTrend([]);
        error(err.response?.data?.message || 'Failed to fetch customer data');
      }
    } finally {
      // loading managed by run()
    }
  };

  useEffect(() => {
    const filtered = filterByDateRange(
      allCustomerData,
      selectedRange,
      'createdAt',
      filters.dateFrom,
      filters.dateTo
    );

    setCustomerData(filtered);

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const totals = filtered.reduce(
      (acc, customer) => {
        const orders = Number(customer.totalOrders || 0);
        const amount = Number(customer.totalAmount || customer.totalSpent || 0);
        const status = String(customer.accountStatus || customer.status || '').toLowerCase();
        const createdAt = new Date(customer.createdAt || customer.joinedAt || 0);

        acc.totalOrders += orders;
        acc.totalRevenue += amount;
        if (status === 'active') {
          acc.activeCustomers += 1;
        }
        if (!Number.isNaN(createdAt.getTime()) && createdAt >= thirtyDaysAgo) {
          acc.newCustomersThisMonth += 1;
        }
        return acc;
      },
      {
        activeCustomers: 0,
        newCustomersThisMonth: 0,
        totalRevenue: 0,
        totalOrders: 0,
      }
    );

    const totalCustomers = filtered.length;
    setAnalytics({
      totalCustomers,
      activeCustomers: totals.activeCustomers,
      newCustomersThisMonth: totals.newCustomersThisMonth,
      averageOrders: totalCustomers ? totals.totalOrders / totalCustomers : 0,
      totalRevenue: totals.totalRevenue,
      totalOrders: totals.totalOrders,
    });

    const timeline = getTimelinePoints(selectedRange, filters.dateFrom, filters.dateTo);
    const trend = mapSeriesToTimeline(timeline, filtered, {
      getBucketKey: (item) => bucketKeyForDate(item.createdAt || item.joinedAt, selectedRange),
      getValue: () => 1,
    });
    setGrowthTrend(trend);

    setPagination((prev) => ({
      ...prev,
      totalUsers: totalCustomers,
      totalPages: 1,
    }));
  }, [allCustomerData, selectedRange, filters.dateFrom, filters.dateTo]);

  useReportAutoRefresh(
    () => fetchCustomerData(selectedRange, filters),
    { intervalMs: 10000 }
  );

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = async () => {
    setIsUpdating(true);
    try {
      await fetchCustomerData(selectedRange, filters);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRangeChange = async (range) => {
    if (range === selectedRange) return;
    const nextAnchor = new Date();
    const next = getRangeDates(range, nextAnchor);
    const nextFilters = {
      ...filters,
      dateFrom: formatDateInput(next.from),
      dateTo: formatDateInput(next.to),
    };
    setPeriodAnchor(nextAnchor);
    setSelectedRange(range);
    setFilters(nextFilters);
    setIsUpdating(true);
    try {
      await fetchCustomerData(range, nextFilters);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleShiftPeriod = async (direction) => {
    const nextAnchor = shiftRangeAnchor(selectedRange, periodAnchor, direction);
    const next = getRangeDates(selectedRange, nextAnchor);
    const nextFilters = {
      ...filters,
      dateFrom: formatDateInput(next.from),
      dateTo: formatDateInput(next.to),
    };

    setPeriodAnchor(nextAnchor);
    setFilters(nextFilters);
    setIsUpdating(true);
    try {
      await fetchCustomerData(selectedRange, nextFilters);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearFilters = () => {
    const currentRange = getRangeDates(selectedRange);
    setFilters({
      search: '',
      accountStatus: '',
      dateFrom: formatDateInput(currentRange.from),
      dateTo: formatDateInput(currentRange.to),
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
      const html2canvas = (await import('html2canvas')).default;
      
      const doc = new jsPDF({ orientation: 'landscape' });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Load Unicode font for ₹ symbol
      const PDF_FONT = await loadUnicodeFonts(doc);

      let yPos = addShopHeader(doc, 'CUSTOMER REPORT', [139, 92, 246]);

      doc.setFont(PDF_FONT, 'bold');
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text(`${getRangeTitle(selectedRange)} Customer Report`, 14, yPos);
      yPos += 5;
      if (dateRangeLabel) {
        doc.setFont(PDF_FONT, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(`Range: ${dateRangeLabel}`, 14, yPos);
        yPos += 5;
      }

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

      if (chartRef.current) {
        const canvas = await html2canvas(chartRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
        });
        const imgData = canvas.toDataURL('image/png');
        const chartWidth = pageWidth - 28;
        const chartHeight = Math.min((canvas.height * chartWidth) / canvas.width, 85);

        if (yPos + chartHeight + 14 > doc.internal.pageSize.getHeight()) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFont(PDF_FONT, 'bold');
        doc.setFontSize(12);
        doc.setTextColor(139, 92, 246);
        doc.text('Customer Graphs', 14, yPos);
        yPos += 6;

        doc.addImage(imgData, 'PNG', 14, yPos, chartWidth, chartHeight);
        yPos += chartHeight + 8;
      }
      
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
      const fileName = `customers-report-${selectedRange}.pdf`;
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

  const customerChartData = useMemo(() => {
    if (backendChart?.labels?.length && backendChart?.data?.length) {
      return backendChart.labels.map((label, index) => ({
        label,
        value: Number(backendChart.data[index] || 0),
      }));
    }

    const timeline = getTimelinePoints(selectedRange, filters.dateFrom, filters.dateTo);
    return mapSeriesToTimeline(timeline, growthTrend, {
      getBucketKey: (item) => bucketKeyForDate(item.date || item.name, selectedRange),
      getValue: (item) => Number(item.users || item.value || 0),
    });
  }, [backendChart, growthTrend, selectedRange, filters.dateFrom, filters.dateTo]);
  const showNoDataHint = !hasAnyNonZero(customerChartData);
  const topCustomersData = useMemo(() => {
    const ranked = [...customerData]
      .sort((a, b) => Number(b.totalSpent || 0) - Number(a.totalSpent || 0))
      .slice(0, 5);

    if (ranked.length === 0) {
      return [
        { name: 'C1', amount: 0 },
        { name: 'C2', amount: 0 },
        { name: 'C3', amount: 0 },
        { name: 'C4', amount: 0 },
        { name: 'C5', amount: 0 },
      ];
    }

    return ranked.map((customer) => ({
      name: customer.name?.split(' ')[0] || 'User',
      amount: Number(customer.totalSpent || 0),
    }));
  }, [customerData]);

  if (loading && isInitialLoading) {
    return (
      <AdminLayout>
        <DashboardSkeleton title="Loading Customer Report" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={`admin-report-page ${isUpdating ? 'is-updating' : ''}`}>
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
                {comparison && (
                  <span className={`report-comparison-chip ${comparison.isUp ? 'up' : 'down'}`}>
                    {comparison.isUp ? '↑' : '↓'} {Math.abs(comparison.growthPercent || 0).toFixed(1)}% vs previous period
                  </span>
                )}
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
          <div className="report-controls">
            <div className="report-period-nav">
              <button type="button" className="period-nav-btn" onClick={() => handleShiftPeriod(-1)}>
                ← Prev
              </button>
              <span className="period-nav-current">{getRangePeriodLabel(selectedRange, periodAnchor)}</span>
              <button type="button" className="period-nav-btn" onClick={() => handleShiftPeriod(1)}>
                Next →
              </button>
            </div>
            <div className="report-range-group">
              {REPORT_RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`report-range-btn ${selectedRange === opt.value ? 'is-active' : ''}`}
                  onClick={() => handleRangeChange(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="report-chart-panel">
          <div className="report-chart-header">
            <h3 className="report-chart-title">Customer Analytics</h3>
            {comparison && (
              <span className={`report-comparison-chip ${comparison.isUp ? 'up' : 'down'}`}>
                {comparison.isUp ? '↑' : '↓'} {Math.abs(comparison.growthPercent || 0).toFixed(1)}%
              </span>
            )}
          </div>
          <div className="report-chart-box" ref={chartRef}>
            <div className="report-chart-grid two-col">
              <ModernReportChart
                type="line"
                data={customerChartData}
                xKey="label"
                valueKey="value"
                title="User Growth Curve"
                description="Smooth onboarding curve with trend markers"
                colors={['#8b5cf6', '#6d28d9']}
                seriesLabel="Users"
                showArea
                showPeakLow
                animationDuration={800}
              />
              <ModernReportChart
                type="bar"
                data={topCustomersData}
                xKey="name"
                valueKey="amount"
                title="Top Customers"
                description="Horizontal spend leaderboard for quick comparison"
                colors={['#8b5cf6', '#6d28d9']}
                seriesLabel="Spent"
                valuePrefix="₹"
                horizontal
                showPeakLow
                animationDuration={800}
              />
            </div>
            {showNoDataHint && (
              <div className="report-chart-overlay">
                <span className="report-chart-overlay__text">No sales recorded</span>
              </div>
            )}
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
