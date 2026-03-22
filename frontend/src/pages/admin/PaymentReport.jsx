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

const PaymentReport = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  
  const { loading, run } = useAdminLoader();
  const [exporting, setExporting] = useState(false);
  const [allPaymentData, setAllPaymentData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);
  const [selectedRange, setSelectedRange] = useState('monthly');
  const [periodAnchor, setPeriodAnchor] = useState(new Date());
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [backendChart, setBackendChart] = useState(null);
  const [paymentMethodBreakdown, setPaymentMethodBreakdown] = useState([]);
  const [dateRangeLabel, setDateRangeLabel] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const initialRange = getRangeDates('monthly');
  const [filters, setFilters] = useState({
    dateFrom: formatDateInput(initialRange.from),
    dateTo: formatDateInput(initialRange.to),
    paymentMethod: '',
    minAmount: '',
    maxAmount: ''
  });
  const [analytics, setAnalytics] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    codPayments: 0,
    onlinePayments: 0
  });

  // Refs to prevent duplicate calls and enable caching
  const isFetchingRef = useRef(false);
  const cacheRef = useRef(null);
  const cacheTimeRef = useRef(0);
  const chartRef = useRef(null);
  const CACHE_DURATION = 30000; // 30 seconds
  const paymentTimelineData = useMemo(() => {
    if (backendChart?.labels?.length && backendChart?.data?.length) {
      return backendChart.labels.map((label, index) => ({
        label,
        value: Number(backendChart.data[index] || 0),
      }));
    }

    const timeline = getTimelinePoints(selectedRange, filters.dateFrom, filters.dateTo);
    return mapSeriesToTimeline(timeline, paymentData, {
      getBucketKey: (item) => bucketKeyForDate(item.createdAt, selectedRange),
      getValue: (item) => Number(item.totalAmount || 0),
    });
  }, [backendChart, paymentData, selectedRange, filters.dateFrom, filters.dateTo]);
  const paymentMethodPieData = useMemo(() => {
    if (!paymentMethodBreakdown || paymentMethodBreakdown.length === 0) {
      return [
        { name: 'COD', value: 0 },
        { name: 'Online', value: 0 },
      ];
    }
    return paymentMethodBreakdown;
  }, [paymentMethodBreakdown]);
  const showNoDataHint = !hasAnyNonZero(paymentTimelineData);

  const fetchPaymentData = useCallback(async (forceRefresh = false, rangeOverride = selectedRange, filtersOverride = null) => {
    const activeFilters = filtersOverride || filters;
    if (isFetchingRef.current && !forceRefresh) {
      console.log('💳 Payment fetch already in progress, skipping...');
      return;
    }

    if (!forceRefresh && cacheRef.current && (Date.now() - cacheTimeRef.current < CACHE_DURATION)) {
      console.log('💳 Using cached payment data');
      setAllPaymentData(cacheRef.current.data);
      return;
    }
    
    isFetchingRef.current = true;
    setErrorMessage('');

    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        navigate('/admin/login');
        return;
      }

      const params = new URLSearchParams();
      if (activeFilters.dateFrom) params.append('dateFrom', activeFilters.dateFrom);
      if (activeFilters.dateTo) params.append('dateTo', activeFilters.dateTo);
      if (activeFilters.paymentMethod) params.append('paymentMethod', activeFilters.paymentMethod);
      if (activeFilters.minAmount) params.append('minAmount', activeFilters.minAmount);
      if (activeFilters.maxAmount) params.append('maxAmount', activeFilters.maxAmount);
      params.append('range', rangeOverride);

      const queryString = params.toString();
      const endpoint = queryString ? `/admin/reports/payments?${queryString}` : '/admin/reports/payments';
      
      console.log('💳 Fetching payment report from:', endpoint);
      const response = await api.get(endpoint);
      
      if (response.data?.success) {
        const reportData = response.data.data || [];
        const summary = response.data.summary || {};
        const chart = response.data.chart || null;

        setAllPaymentData(reportData);
        setBackendChart(chart);
        setComparison(summary.comparison || null);
        if (summary.dateRange?.from && summary.dateRange?.to) {
          setDateRangeLabel(`${formatDateLabel(summary.dateRange.from)} - ${formatDateLabel(summary.dateRange.to)}`);
        } else {
          setDateRangeLabel('');
        }

        cacheRef.current = { data: reportData };
        cacheTimeRef.current = Date.now();
        
        console.log(`✅ Payment report loaded: ${reportData.length} records`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('❌ Error fetching payments:', err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
        navigate('/admin/login');
        return;
      }
      
      const errorMsg = err.response?.data?.message || 'Failed to load payment report. Please try again.';
      setErrorMessage(errorMsg);
      setBackendChart(null);
      setComparison(null);
      setPaymentMethodBreakdown([]);
      error(errorMsg);
    } finally {
      isFetchingRef.current = false;
    }
  }, [filters, navigate, error, selectedRange]);

  useEffect(() => {
    let mounted = true;
    
    if (mounted) {
      run(async () => {
        await fetchPaymentData(true, selectedRange);
      }).finally(() => {
        if (mounted) setIsInitialLoading(false);
      });
    }

    return () => {
      mounted = false;
    };
  }, []); // Only run once on mount

  useEffect(() => {
    const filtered = filterByDateRange(
      allPaymentData,
      selectedRange,
      'createdAt',
      filters.dateFrom,
      filters.dateTo
    );

    setPaymentData(filtered);

    const totals = filtered.reduce(
      (acc, item) => {
        const amount = Number(item.totalAmount || 0);
        const method = String(item.paymentMethod || '').toLowerCase();
        acc.totalTransactions += 1;
        acc.totalAmount += amount;
        if (method === 'cod') {
          acc.codPayments += 1;
        } else {
          acc.onlinePayments += 1;
        }
        acc.breakdown[method || 'unknown'] = (acc.breakdown[method || 'unknown'] || 0) + 1;
        return acc;
      },
      {
        totalTransactions: 0,
        totalAmount: 0,
        codPayments: 0,
        onlinePayments: 0,
        breakdown: {},
      }
    );

    setAnalytics({
      totalTransactions: totals.totalTransactions,
      totalAmount: totals.totalAmount,
      codPayments: totals.codPayments,
      onlinePayments: totals.onlinePayments,
    });

    const methodBreakdown = Object.entries(totals.breakdown).map(([name, value]) => ({
      name: name.toUpperCase(),
      value,
    }));
    setPaymentMethodBreakdown(methodBreakdown);
  }, [allPaymentData, selectedRange, filters.dateFrom, filters.dateTo]);

  useReportAutoRefresh(
    () => fetchPaymentData(true, selectedRange, filters),
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
      await fetchPaymentData(true, range, nextFilters);
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
      await fetchPaymentData(true, selectedRange, nextFilters);
    } finally {
      setIsUpdating(false);
    }
  };

  // Removed old fetchPaymentData - now using optimized version above

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = async () => {
    cacheRef.current = null;
    setIsUpdating(true);
    try {
      await fetchPaymentData(true, selectedRange);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearFilters = () => {
    const currentRange = getRangeDates(selectedRange);
    setFilters({
      dateFrom: formatDateInput(currentRange.from),
      dateTo: formatDateInput(currentRange.to),
      paymentMethod: '',
      minAmount: '',
      maxAmount: ''
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

      let yPos = addShopHeader(doc, 'PAYMENT REPORT', [245, 158, 11]);

      doc.setFont(PDF_FONT, 'bold');
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text(`${getRangeTitle(selectedRange)} Payment Report`, 14, yPos);
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

      
      if (filters.dateFrom || filters.dateTo || filters.paymentMethod || filters.minAmount || filters.maxAmount) {
        doc.text('Filters Applied:', 14, yPos);
        yPos += 5;
        if (filters.dateFrom) doc.text(`  • From: ${filters.dateFrom}`, 14, yPos), yPos += 5;
        if (filters.dateTo) doc.text(`  • To: ${filters.dateTo}`, 14, yPos), yPos += 5;
        if (filters.paymentMethod) doc.text(`  • Method: ${filters.paymentMethod}`, 14, yPos), yPos += 5;
        if (filters.minAmount) doc.text(`  • Min Amount: ₹${filters.minAmount}`, 14, yPos), yPos += 5;
        if (filters.maxAmount) doc.text(`  • Max Amount: ₹${filters.maxAmount}`, 14, yPos), yPos += 5;
        yPos += 5;
      }
      
      // Analytics Summary
      doc.setFont(PDF_FONT, 'bold');
      doc.setFontSize(12);
      doc.setTextColor(245, 158, 11);
      doc.text('Payment Summary', 14, yPos);
      doc.setFont(PDF_FONT, 'normal');
      doc.setTextColor(60, 60, 60);
      yPos += 8;
      
      doc.setFontSize(10);
      const summaryData = [
        ['Total Transactions', analytics.totalTransactions.toString()],
        ['Total Amount', pdfRupee(analytics.totalAmount)],
        ['COD Payments', pdfRupee(analytics.codPayments)],
        ['Online Payments', pdfRupee(analytics.onlinePayments)]
      ];
      
      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [245, 158, 11], textColor: 255 },
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
        const chartHeight = Math.min((canvas.height * chartWidth) / canvas.width, 80);

        if (yPos + chartHeight + 14 > doc.internal.pageSize.getHeight()) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFont(PDF_FONT, 'bold');
        doc.setFontSize(12);
        doc.setTextColor(245, 158, 11);
        doc.text('Payment Charts', 14, yPos);
        yPos += 6;

        doc.addImage(imgData, 'PNG', 14, yPos, chartWidth, chartHeight);
        yPos += chartHeight + 8;
      }
      
      // Detailed Payment Data
      doc.setFont(PDF_FONT, 'bold');
      doc.setFontSize(12);
      doc.setTextColor(245, 158, 11);
      doc.text('Transaction Details', 14, yPos);
      doc.setFont(PDF_FONT, 'normal');
      doc.setTextColor(60, 60, 60);
      yPos += 8;
      
      const tableData = paymentData.map(payment => [
        payment._id?.slice(-8).toUpperCase() || 'N/A',
        payment.user?.name || 'N/A',
        formatDate(payment.createdAt),
        pdfRupee(payment.totalAmount),
        payment.paymentMethod || 'N/A',
        payment.status || 'Pending'
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Trans. ID', 'Customer', 'Date', 'Amount', 'Method', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [245, 158, 11], textColor: 255 },
        styles: { font: PDF_FONT, fontSize: 8 },
        margin: { left: 14, right: 14 }
      });
      
      // Save PDF
      addPageNumbers(doc, [245, 158, 11]);
      const fileName = `payments-report-${selectedRange}.pdf`;
      doc.save(fileName);
      
      success('Payment report exported as PDF successfully');
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
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading && isInitialLoading) {
    return (
      <AdminLayout>
        <DashboardSkeleton title="Loading Payment Report" />
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
              <div className="header-icon" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
                💳
              </div>
              <div>
                <h1>Payment Report</h1>
                <p className="subtitle">Review payment transactions and methods</p>
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
            <h3 className="report-chart-title">Payment Analytics</h3>
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
                data={paymentTimelineData}
                xKey="label"
                valueKey="value"
                title="Payment Trend"
                description="Orange trend line with smooth area reveal"
                colors={['#f59e0b', '#f97316']}
                seriesLabel="Amount"
                valuePrefix="₹"
                showArea
                showPeakLow
                animationDuration={800}
              />
              <ModernReportChart
                type="pie"
                data={paymentMethodPieData}
                xKey="name"
                valueKey="value"
                title="COD vs Online"
                description="Animated payment split with percentage labels"
                colors={['#f59e0b', '#3b82f6', '#f97316']}
                seriesLabel="Transactions"
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
              📊
            </div>
            <div className="analytics-content">
              <p className="analytics-label">Total Transactions</p>
              <h3 className="analytics-value">{analytics.totalTransactions}</h3>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
              💰
            </div>
            <div className="analytics-content">
              <p className="analytics-label">Total Amount</p>
              <h3 className="analytics-value">{formatCurrency(analytics.totalAmount)}</h3>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
              💵
            </div>
            <div className="analytics-content">
              <p className="analytics-label">COD Payments</p>
              <h3 className="analytics-value">{analytics.codPayments}</h3>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
              💳
            </div>
            <div className="analytics-content">
              <p className="analytics-label">Online Payments</p>
              <h3 className="analytics-value">{analytics.onlinePayments}</h3>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filters-grid">
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

        {/* Payment Data Table */}
        <div className="report-table-container">
          <div className="table-info">
            <p>Showing {paymentData.length} transactions</p>
          </div>

          {paymentData.length > 0 ? (
            <div className="table-wrapper">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Customer</th>
                    <th>Date & Time</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentData.map((payment) => (
                    <tr key={payment._id}>
                      <td className="order-id">{payment._id.slice(-8).toUpperCase()}</td>
                      <td>{payment.user?.name || 'N/A'}</td>
                      <td>{formatDate(payment.createdAt)}</td>
                      <td className="amount">{formatCurrency(payment.totalAmount)}</td>
                      <td>
                        <span style={{ 
                          padding: '4px 10px', 
                          background: '#f3f4f6', 
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 600
                        }}>
                          {payment.paymentMethod || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${payment.status?.toLowerCase() || 'pending'}`}>
                          {payment.status || 'Pending'}
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
              <h3>No payment data found</h3>
              <p>Try adjusting your filters or date range</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default PaymentReport;
