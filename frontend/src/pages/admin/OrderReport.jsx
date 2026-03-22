import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

const OrderReport = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  
  const { loading, run } = useAdminLoader();
  const [exporting, setExporting] = useState(false);
  const [allOrderData, setAllOrderData] = useState([]);
  const [orderData, setOrderData] = useState([]);
  const [selectedRange, setSelectedRange] = useState('monthly');
  const [periodAnchor, setPeriodAnchor] = useState(new Date());
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [backendChart, setBackendChart] = useState(null);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [dateRangeLabel, setDateRangeLabel] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const initialRange = getRangeDates('monthly');
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateFrom: formatDateInput(initialRange.from),
    dateTo: formatDateInput(initialRange.to),
    paymentMethod: ''
  });
  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    pending: 0,
    processing: 0,
    delivered: 0
  });

  const isFetchingRef = useRef(false);
  const cacheRef = useRef(null);
  const cacheTimeRef = useRef(0);
  const chartRef = useRef(null);
  const CACHE_DURATION = 30000;
  const orderTimelineData = useMemo(() => {
    if (backendChart?.labels?.length && backendChart?.data?.length) {
      return backendChart.labels.map((label, index) => ({
        label,
        value: Number(backendChart.data[index] || 0),
      }));
    }

    const timeline = getTimelinePoints(selectedRange, filters.dateFrom, filters.dateTo);
    return mapSeriesToTimeline(timeline, orderData, {
      getBucketKey: (item) => bucketKeyForDate(item.createdAt, selectedRange),
      getValue: () => 1,
    });
  }, [backendChart, orderData, selectedRange, filters.dateFrom, filters.dateTo]);
  const showNoDataHint = !hasAnyNonZero(orderTimelineData);

  const fetchOrderData = useCallback(async (forceRefresh = false, rangeOverride = selectedRange, filtersOverride = null) => {
    const activeFilters = filtersOverride || filters;
    if (isFetchingRef.current && !forceRefresh) {
      console.log('📋 Order fetch already in progress, skipping...');
      return;
    }

    if (!forceRefresh && cacheRef.current && (Date.now() - cacheTimeRef.current < CACHE_DURATION)) {
      console.log('📋 Using cached order data');
      setAllOrderData(cacheRef.current.data);
      return; // run() handles loading=false
    }
    
    isFetchingRef.current = true;
    // loading managed by useAdminLoader's run()
    setErrorMessage('');

    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        navigate('/admin/login');
        return;
      }

      const params = new URLSearchParams();
      if (activeFilters.search) params.append('search', activeFilters.search);
      if (activeFilters.status) params.append('status', activeFilters.status);
      if (activeFilters.dateFrom) params.append('dateFrom', activeFilters.dateFrom);
      if (activeFilters.dateTo) params.append('dateTo', activeFilters.dateTo);
      if (activeFilters.paymentMethod) params.append('paymentMethod', activeFilters.paymentMethod);
      params.append('range', rangeOverride);

      const queryString = params.toString();
      const endpoint = queryString ? `/admin/reports/orders?${queryString}` : '/admin/reports/orders';
      
      console.log('📋 Fetching order report from:', endpoint);
      const response = await api.get(endpoint);
      
      if (response.data?.success) {
        const reportData = response.data.data || [];
        const summary = response.data.summary || {};
        const chart = response.data.chart || null;

        setAllOrderData(reportData);
        setBackendChart(chart);
        setComparison(summary.comparison || null);
        if (summary.dateRange?.from && summary.dateRange?.to) {
          setDateRangeLabel(`${formatDateLabel(summary.dateRange.from)} - ${formatDateLabel(summary.dateRange.to)}`);
        } else {
          setDateRangeLabel('');
        }

        cacheRef.current = { data: reportData };
        cacheTimeRef.current = Date.now();
        
        console.log(`✅ Order report loaded: ${reportData.length} records`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('❌ Error fetching orders:', err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
        navigate('/admin/login');
        return;
      }
      
      const errorMsg = err.response?.data?.message || 'Failed to load order report. Please try again.';
      setErrorMessage(errorMsg);
      setBackendChart(null);
      setComparison(null);
      setStatusDistribution([]);
      error(errorMsg);
    } finally {
      isFetchingRef.current = false;
      // loading managed by run()
    }
  }, [filters, navigate, error, selectedRange]);

  useEffect(() => {
    let mounted = true;
    run(async () => {
      await fetchOrderData(true, selectedRange);
    }).finally(() => {
      if (mounted) setIsInitialLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const filtered = filterByDateRange(
      allOrderData,
      selectedRange,
      'createdAt',
      filters.dateFrom,
      filters.dateTo
    );

    setOrderData(filtered);

    const counts = filtered.reduce(
      (acc, item) => {
        const status = String(item.orderStatus || item.status || '').toLowerCase();
        acc.totalOrders += 1;
        if (status === 'pending') acc.pending += 1;
        if (status === 'processing') acc.processing += 1;
        if (status === 'delivered' || status === 'completed') acc.delivered += 1;
        acc.distribution[status] = (acc.distribution[status] || 0) + 1;
        return acc;
      },
      { totalOrders: 0, pending: 0, processing: 0, delivered: 0, distribution: {} }
    );

    setAnalytics({
      totalOrders: counts.totalOrders,
      pending: counts.pending,
      processing: counts.processing,
      delivered: counts.delivered,
    });

    const distribution = Object.entries(counts.distribution).map(([name, value]) => ({
      name,
      value,
    }));
    setStatusDistribution(distribution);
  }, [allOrderData, selectedRange, filters.dateFrom, filters.dateTo]);

  useReportAutoRefresh(
    () => fetchOrderData(true, selectedRange, filters),
    { intervalMs: 10000 }
  );

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
    cacheRef.current = null;
    setIsUpdating(true);
    try {
      await fetchOrderData(true, range, nextFilters);
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
    cacheRef.current = null;
    setIsUpdating(true);
    try {
      await fetchOrderData(true, selectedRange, nextFilters);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = async () => {
    cacheRef.current = null;
    setIsUpdating(true);
    try {
      await fetchOrderData(true, selectedRange);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearFilters = () => {
    const currentRange = getRangeDates(selectedRange);
    setFilters({
      search: '',
      status: '',
      dateFrom: formatDateInput(currentRange.from),
      dateTo: formatDateInput(currentRange.to),
      paymentMethod: ''
    });
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const html2canvas = (await import('html2canvas')).default;
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Load Unicode font for ₹ symbol
      const PDF_FONT = await loadUnicodeFonts(doc);

      let yPos = addShopHeader(doc, 'ORDER REPORT', [236, 72, 153]);

      doc.setFont(PDF_FONT, 'bold');
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text(`${getRangeTitle(selectedRange)} Order Report`, 14, yPos);
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

      
      if (filters.search || filters.status || filters.dateFrom || filters.dateTo || filters.paymentMethod) {
        doc.text('Filters Applied:', 14, yPos);
        yPos += 5;
        if (filters.search) doc.text(`  • Search: ${filters.search}`, 14, yPos), yPos += 5;
        if (filters.status) doc.text(`  • Status: ${filters.status}`, 14, yPos), yPos += 5;
        if (filters.dateFrom) doc.text(`  • From: ${filters.dateFrom}`, 14, yPos), yPos += 5;
        if (filters.dateTo) doc.text(`  • To: ${filters.dateTo}`, 14, yPos), yPos += 5;
        if (filters.paymentMethod) doc.text(`  • Payment: ${filters.paymentMethod}`, 14, yPos), yPos += 5;
        yPos += 5;
      }
      
      // Analytics Summary
      doc.setFont(PDF_FONT, 'bold');
      doc.setFontSize(12);
      doc.setTextColor(236, 72, 153);
      doc.text('Order Summary', 14, yPos);
      doc.setFont(PDF_FONT, 'normal');
      doc.setTextColor(60, 60, 60);
      yPos += 8;
      
      doc.setFontSize(10);
      const summaryData = [
        ['Total Orders', analytics.totalOrders.toString()],
        ['Pending Orders', analytics.pending.toString()],
        ['Processing Orders', analytics.processing.toString()],
        ['Delivered Orders', analytics.delivered.toString()]
      ];
      
      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [236, 72, 153], textColor: 255 },
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
        const chartHeight = Math.min((canvas.height * chartWidth) / canvas.width, 75);

        if (yPos + chartHeight + 14 > doc.internal.pageSize.getHeight()) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFont(PDF_FONT, 'bold');
        doc.setFontSize(12);
        doc.setTextColor(236, 72, 153);
        doc.text('Order Timeline Graph', 14, yPos);
        yPos += 6;

        doc.addImage(imgData, 'PNG', 14, yPos, chartWidth, chartHeight);
        yPos += chartHeight + 8;
      }
      
      // Detailed Order Data
      doc.setFont(PDF_FONT, 'bold');
      doc.setFontSize(12);
      doc.setTextColor(236, 72, 153);
      doc.text('Order Details', 14, yPos);
      doc.setFont(PDF_FONT, 'normal');
      doc.setTextColor(60, 60, 60);
      yPos += 8;
      
      const tableData = orderData.map(order => [
        order.orderId || order._id?.slice(-8).toUpperCase() || 'N/A',
        order.user?.name || 'N/A',
        formatDate(order.createdAt),
        pdfRupee(order.totalAmount),
        order.paymentMethod || 'N/A',
        order.status || 'Pending',
        (order.items?.length || 0).toString()
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Order ID', 'Customer', 'Date', 'Amount', 'Payment', 'Status', 'Items']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [236, 72, 153], textColor: 255 },
        styles: { font: PDF_FONT, fontSize: 8 },
        margin: { left: 14, right: 14 }
      });
      
      // Save PDF
      addPageNumbers(doc, [236, 72, 153]);
      const fileName = `orders-report-${selectedRange}.pdf`;
      doc.save(fileName);
      
      success('Order report exported as PDF successfully');
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

  if (loading && isInitialLoading) {
    return (
      <AdminLayout>
        <DashboardSkeleton title="Loading Order Report" />
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
              <div className="header-icon" style={{ background: 'linear-gradient(135deg, #EC4899, #DB2777)' }}>
                📋
              </div>
              <div>
                <h1>Order Report</h1>
                <p className="subtitle">View order history, status, and fulfillment</p>
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
            <h3 className="report-chart-title">Orders Timeline</h3>
            {comparison && (
              <span className={`report-comparison-chip ${comparison.isUp ? 'up' : 'down'}`}>
                {comparison.isUp ? '↑' : '↓'} {Math.abs(comparison.growthPercent || 0).toFixed(1)}%
              </span>
            )}
          </div>
          <div className="report-chart-box" ref={chartRef}>
            <ModernReportChart
              type="line"
              data={orderTimelineData}
              xKey="label"
              valueKey="value"
              title="Order Trend"
              description="Clear daily/weekly/monthly order movement"
              colors={['#ec4899', '#3b82f6']}
              seriesLabel="Orders"
              showArea
              showPeakLow
              animationDuration={800}
            />
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
              📊
            </div>
            <div className="analytics-content">
              <p className="analytics-label">Total Orders</p>
              <h3 className="analytics-value">{analytics.totalOrders}</h3>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
              ⏳
            </div>
            <div className="analytics-content">
              <p className="analytics-label">Pending Orders</p>
              <h3 className="analytics-value">{analytics.pending}</h3>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
              🔄
            </div>
            <div className="analytics-content">
              <p className="analytics-label">Processing</p>
              <h3 className="analytics-value">{analytics.processing}</h3>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
              ✅
            </div>
            <div className="analytics-content">
              <p className="analytics-label">Delivered</p>
              <h3 className="analytics-value">{analytics.delivered}</h3>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filters-grid">
              <div className="filter-item">
                <label>Search Order</label>
                <input 
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Order ID or customer..."
                />
              </div>
              <div className="filter-item">
                <label>Order Status</label>
                <select name="status" value={filters.status} onChange={handleFilterChange}>
                  <option value="">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
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
                <label>Payment Method</label>
                <select name="paymentMethod" value={filters.paymentMethod} onChange={handleFilterChange}>
                  <option value="">All</option>
                  <option value="COD">Cash on Delivery</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Net Banking">Net Banking</option>
                </select>
              </div>
            </div>
            <div className="filter-actions">
              <button className="btn-apply" onClick={handleApplyFilters}>Apply Filters</button>
              <button className="btn-clear" onClick={handleClearFilters}>Clear All</button>
            </div>
          </div>
        )}

        {/* Order Data Table */}
        <div className="report-table-container">
          <div className="table-info">
            <p>Showing {orderData.length} orders</p>
          </div>

          {orderData.length > 0 ? (
            <div className="table-wrapper">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Items</th>
                    <th>Payment</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orderData.map((order) => (
                    <tr key={order._id}>
                      <td className="order-id">{order.orderId || order._id.slice(-8).toUpperCase()}</td>
                      <td>{order.user?.name || 'N/A'}</td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td className="amount">{formatCurrency(order.totalAmount)}</td>
                      <td className="text-center">{order.items?.length || 0}</td>
                      <td>{order.paymentMethod || 'N/A'}</td>
                      <td>
                        <span className={`status-badge ${order.status?.toLowerCase() || 'pending'}`}>
                          {order.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="30" fill="#f3f4f6"/>
                <path d="M32 20v16M32 44h.01" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              <h3>No order data found</h3>
              <p>Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrderReport;
