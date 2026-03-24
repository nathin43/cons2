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
  buildZeroSeriesForRange,
} from '../../utils/reportChartTimeline';
import ModernReportChart from '../../components/admin/ModernReportChart';
import useReportAutoRefresh from '../../hooks/useReportAutoRefresh';
import { filterByDateRange } from '../../utils/reportDataSync';

const SalesReport = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  
  const { loading, run } = useAdminLoader();
  const [exporting, setExporting] = useState(false);
  const [allSalesData, setAllSalesData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [selectedRange, setSelectedRange] = useState('monthly');
  const [periodAnchor, setPeriodAnchor] = useState(new Date());
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [dateRangeLabel, setDateRangeLabel] = useState('');
  const initialRange = useMemo(() => getRangeDates('monthly'), []);
  const [filters, setFilters] = useState({
    dateFrom: formatDateInput(initialRange.from),
    dateTo: formatDateInput(initialRange.to),
    minAmount: '',
    maxAmount: '',
    status: ''
  });
  const [analytics, setAnalytics] = useState({
    totalSales: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    completedOrders: 0
  });

  // Refs to prevent duplicate calls
  const isFetchingRef = useRef(false);
  const chartRef = useRef(null);

  // Memoized fetch function
  const fetchSalesData = useCallback(async (forceRefresh = false, rangeOverride = selectedRange, filtersOverride = null) => {
    const activeFilters = filtersOverride || filters;
    // Prevent duplicate simultaneous calls
    if (isFetchingRef.current && !forceRefresh) {
      console.log('📊 Sales fetch already in progress, skipping...');
      return;
    }

    isFetchingRef.current = true;
    setIsDataLoading(true);
    // loading is managed by useAdminLoader’s run()
    setErrorMessage('');

    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        navigate('/admin/login');
        return;
      }

      const params = new URLSearchParams();
      if (rangeOverride === 'daily') {
        const todayRange = getRangeDates('daily', new Date());
        params.append('dateFrom', formatDateInput(todayRange.from));
        params.append('dateTo', formatDateInput(todayRange.to));
      } else {
        if (activeFilters.dateFrom) params.append('dateFrom', activeFilters.dateFrom);
        if (activeFilters.dateTo) params.append('dateTo', activeFilters.dateTo);
      }
      if (activeFilters.minAmount) params.append('minAmount', activeFilters.minAmount);
      if (activeFilters.maxAmount) params.append('maxAmount', activeFilters.maxAmount);
      if (activeFilters.status) params.append('status', activeFilters.status);
      params.append('range', rangeOverride);

      const queryString = params.toString();
      const endpoint = queryString ? `/admin/reports/sales?${queryString}` : '/admin/reports/sales';
      
      console.log('📊 Fetching sales report from:', endpoint);
      const response = await api.get(endpoint);
      
      if (response.data?.success) {
        const reportData = response.data.data || [];
        const summary = response.data.summary || {};
        // Update state
        setAllSalesData(reportData);
        setComparison(summary.comparison || null);
        setLastUpdatedAt(new Date());

        if (summary.dateRange?.from && summary.dateRange?.to) {
          setDateRangeLabel(`${formatDateLabel(summary.dateRange.from)} - ${formatDateLabel(summary.dateRange.to)}`);
        } else {
          setDateRangeLabel('');
        }

        console.log(`✅ Sales report loaded: ${reportData.length} records`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('❌ Error fetching sales:', err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
        navigate('/admin/login');
        return;
      }
      
      const defaultErrorMessage = rangeOverride === 'daily'
        ? "Unable to fetch today's sales"
        : 'Failed to load sales report. Please try again.';
      const errorMsg = err.response?.data?.message || defaultErrorMessage;
      const messageToDisplay = rangeOverride === 'daily' ? "Unable to fetch today's sales" : errorMsg;
      setErrorMessage(messageToDisplay);
      setComparison(null);
      error(messageToDisplay);
    } finally {
      isFetchingRef.current = false;
      setIsDataLoading(false);
      // loading state managed by useAdminLoader's run()
    }
  }, [filters, navigate, error, selectedRange]);

  useEffect(() => {
    let mounted = true;
    run(async () => {
      await fetchSalesData(true, selectedRange);
    }).finally(() => {
      if (mounted) setIsInitialLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const todayRange = getRangeDates('daily', new Date());
    const effectiveDateFrom = selectedRange === 'daily' ? formatDateInput(todayRange.from) : filters.dateFrom;
    const effectiveDateTo = selectedRange === 'daily' ? formatDateInput(todayRange.to) : filters.dateTo;

    const filtered = filterByDateRange(
      allSalesData,
      selectedRange,
      'createdAt',
      effectiveDateFrom,
      effectiveDateTo
    );

    setSalesData(filtered);

    const totalRevenue = filtered.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
    const totalSales = filtered.length;
    const completedOrders = filtered.filter((item) => {
      const status = String(item.orderStatus || item.status || '').toLowerCase();
      return status === 'delivered' || status === 'completed';
    }).length;

    setAnalytics({
      totalSales,
      totalRevenue,
      averageOrderValue: totalSales ? totalRevenue / totalSales : 0,
      completedOrders,
    });

  }, [allSalesData, selectedRange, filters.dateFrom, filters.dateTo]);

  useReportAutoRefresh(
    () => fetchSalesData(true, selectedRange, filters),
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
    await fetchSalesData(true, range, nextFilters);
  };

  const handleShiftPeriod = async (direction) => {
    if (selectedRange === 'daily') return;

    const nextAnchor = shiftRangeAnchor(selectedRange, periodAnchor, direction);
    const next = getRangeDates(selectedRange, nextAnchor);
    const nextFilters = {
      ...filters,
      dateFrom: formatDateInput(next.from),
      dateTo: formatDateInput(next.to),
    };

    setPeriodAnchor(nextAnchor);
    setFilters(nextFilters);
    await fetchSalesData(true, selectedRange, nextFilters);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = async () => {
    await fetchSalesData(true, selectedRange);
  };

  const handleClearFilters = () => {
    const currentRange = getRangeDates(selectedRange);
    setFilters({
      dateFrom: formatDateInput(currentRange.from),
      dateTo: formatDateInput(currentRange.to),
      minAmount: '',
      maxAmount: '',
      status: ''
    });
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const html2canvas = (await import('html2canvas')).default;

      // ── Palette ───────────────────────────────────────────────────────────
      const ACCENT  = [59, 130, 246];          // blue accent
      const HDR_BG  = [22, 58, 138];           // deep navy for table header
      const TEXT    = [25, 25, 25];
      const SUBTEXT = [130, 140, 155];

      // Landscape A4: 297 × 210 mm
      const doc        = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
      const pageWidth  = doc.internal.pageSize.getWidth();   // 297 mm
      const pageHeight = doc.internal.pageSize.getHeight();  // 210 mm
      const MARGIN     = 14;
      const CONTENT_W  = pageWidth - MARGIN * 2;             // 269 mm

      // Load Unicode font for ₹ symbol
      const PDF_FONT = await loadUnicodeFonts(doc);

      // Indian rupee formatter — ₹ renders correctly once NotoSans is embedded
      const rupee = (amount) => '\u20B9' + Math.round(Number(amount || 0)).toLocaleString('en-IN');

      // ── 1. Shop letterhead ────────────────────────────────────────────────
      let y = addShopHeader(doc, 'SALES REPORT', ACCENT);
      const exportTitle = `${getRangeTitle(selectedRange)} Sales Report`;
      const exportRangeLabel =
        dateRangeLabel || `${formatDateLabel(filters.dateFrom)} - ${formatDateLabel(filters.dateTo)}`;

      doc.setFont(PDF_FONT, 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...TEXT);
      doc.text(exportTitle, MARGIN, y);
      y += 5;
      if (exportRangeLabel) {
        doc.setFont(PDF_FONT, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...SUBTEXT);
        doc.text(`Range: ${exportRangeLabel}`, MARGIN, y);
        y += 5;
      }

      // ── 2. Active filters (shown only when filters are applied) ───────────
      const activeFilters = [
        filters.dateFrom  && `From: ${filters.dateFrom}`,
        filters.dateTo    && `To: ${filters.dateTo}`,
        filters.status    && `Status: ${filters.status}`,
        filters.minAmount && `Min: ${rupee(filters.minAmount)}`,
        filters.maxAmount && `Max: ${rupee(filters.maxAmount)}`,
      ].filter(Boolean);

      if (activeFilters.length) {
        doc.setFont(PDF_FONT, 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...SUBTEXT);
        doc.text('Filters applied: ' + activeFilters.join('   |   '), MARGIN, y);
        y += 6;
      }

      // ── 3. Summary KPI cards ──────────────────────────────────────────────
      const kpis = [
        { label: 'Total Orders',     value: String(analytics.totalSales || 0),          clr: [59, 130, 246]  },
        { label: 'Total Revenue',    value: rupee(analytics.totalRevenue),               clr: [16, 150, 95]   },
        { label: 'Avg. Order Value', value: rupee(analytics.averageOrderValue),          clr: [218, 128, 10]  },
        { label: 'Completed Orders', value: String(analytics.completedOrders || 0),      clr: [110, 55, 200]  },
      ];
      const cardGap = 5;
      const cardW   = (CONTENT_W - cardGap * 3) / 4;
      const cardH   = 17;

      kpis.forEach((kpi, i) => {
        const cx = MARGIN + i * (cardW + cardGap);
        doc.setFillColor(...kpi.clr);
        doc.roundedRect(cx, y, cardW, cardH, 2.5, 2.5, 'F');

        // Label
        doc.setFont(PDF_FONT, 'normal');
        doc.setFontSize(6);
        doc.setTextColor(210, 230, 255);
        doc.text(kpi.label.toUpperCase(), cx + cardW / 2, y + 5.5, { align: 'center' });

        // Value
        doc.setFont(PDF_FONT, 'bold');
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.text(kpi.value, cx + cardW / 2, y + 13.5, { align: 'center' });
      });

      y += cardH + 6;

      if (chartRef.current) {
        const canvas = await html2canvas(chartRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
        });
        const imgData = canvas.toDataURL('image/png');
        const chartW = CONTENT_W;
        const chartH = Math.min((canvas.height * chartW) / canvas.width, 70);

        doc.setFillColor(...ACCENT);
        doc.rect(MARGIN, y, 3, 7, 'F');
        doc.setFont(PDF_FONT, 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(...ACCENT);
        doc.text('TREND CHART', MARGIN + 6, y + 5.2);
        y += 9;

        doc.addImage(imgData, 'PNG', MARGIN, y, chartW, chartH);
        y += chartH + 7;
      }

      // ── 4. Section heading ────────────────────────────────────────────────
      doc.setFillColor(...ACCENT);
      doc.rect(MARGIN, y, 3, 7, 'F');
      doc.setFont(PDF_FONT, 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...ACCENT);
      doc.text('ORDER DETAILS', MARGIN + 6, y + 5.2);

      const totalRowCount = salesData.reduce((s, o) => s + Math.max(o.items?.length || 0, 1), 0);
      doc.setFont(PDF_FONT, 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...SUBTEXT);
      doc.text(
        `${salesData.length} order(s)   ·   ${totalRowCount} product line(s)`,
        pageWidth - MARGIN, y + 5.2, { align: 'right' }
      );

      y += 11;

      // ── 5. Build table rows ───────────────────────────────────────────────
      // RULE: every product row is fully populated — no blank cells anywhere.
      // If an order has multiple products, each product gets its own complete row.
      //
      // 8 columns summing to 269 mm (CONTENT_W):
      // Order ID | Product Name | Customer | Date | Qty | Amount | Payment Method | Status
      //    30    |      66      |    38    |  27  |  12 |   32   |       38       |  26   = 269
      const colWidths = [30, 66, 38, 27, 12, 32, 38, 26];

      const tableRows    = [];
      let grandTotalAmt  = 0;
      let grandTotalQty  = 0;

      salesData.forEach((order) => {
        const orderId    = order.orderNumber || order._id?.toString().slice(-8).toUpperCase() || '—';
        const customer   = order.user?.name || 'N/A';
        const date       = formatDate(order.createdAt);
        const rawPayment = (order.paymentMethod || 'N/A');
        // Normalise common payment method strings
        const payment    = rawPayment === 'cod'      ? 'Cash on Delivery'
                         : rawPayment === 'razorpay' ? 'Razorpay'
                         : rawPayment === 'online'   ? 'Online'
                         : rawPayment;
        const rawStatus  = order.status || order.orderStatus || 'pending';
        const statusDisp = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
        const items      = order.items?.length > 0 ? order.items : null;

        if (items) {
          items.forEach((item) => {
            const name      = item.product?.name || item.name || 'Unknown Product';
            const qty       = Number(item.quantity) || 1;
            const unitPrice = Number(item.price) || Number(item.product?.price) || 0;
            const lineAmt   = qty * unitPrice;
            grandTotalAmt  += lineAmt;
            grandTotalQty  += qty;

            tableRows.push([
              orderId,          // ← repeated on every row: no blank cells
              name,
              customer,
              date,
              qty.toString(),
              rupee(lineAmt),
              payment,
              statusDisp,
            ]);
          });
        } else {
          // Order with no item detail — show order-level total
          const amt       = Number(order.totalAmount) || 0;
          grandTotalAmt  += amt;
          grandTotalQty  += 1;
          tableRows.push([orderId, '—', customer, date, '—', rupee(amt), payment, statusDisp]);
        }
      });

      if (tableRows.length === 0) {
        tableRows.push(['—', 'No records for selected filter', '—', '—', '—', rupee(0), '—', '—']);
      }

      // ── 6. autoTable ──────────────────────────────────────────────────────
      autoTable(doc, {
        startY: y,
        head: [['Order ID', 'Product Name', 'Customer', 'Date', 'Qty', 'Amount', 'Payment Method', 'Status']],
        body: tableRows,
        theme: 'grid',
        margin: { left: MARGIN, right: MARGIN },

        // Base styles applied to every cell (head + body)
        styles: {
          font: PDF_FONT,
          fontSize: 7.5,
          valign: 'middle',
          cellPadding: { top: 2.8, bottom: 2.8, left: 3, right: 3 },
          lineColor: [205, 215, 232],
          lineWidth: 0.22,
          minCellHeight: 8,
          overflow: 'ellipsize',
          textColor: TEXT,
        },

        headStyles: {
          fillColor: HDR_BG,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
          cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
          lineColor: [10, 35, 90],
          lineWidth: 0.25,
        },

        // Subtle blue-tinted zebra rows
        alternateRowStyles: {
          fillColor: [244, 248, 255],
        },

        columnStyles: {
          0: { halign: 'left',   cellWidth: colWidths[0], fontStyle: 'bold'     },  // Order ID
          1: { halign: 'left',   cellWidth: colWidths[1], overflow: 'linebreak'  },  // Product Name (wraps)
          2: { halign: 'left',   cellWidth: colWidths[2]                         },  // Customer
          3: { halign: 'center', cellWidth: colWidths[3]                         },  // Date
          4: { halign: 'center', cellWidth: colWidths[4]                         },  // Qty
          5: { halign: 'center', cellWidth: colWidths[5], fontStyle: 'bold'      },  // Amount ₹
          6: { halign: 'left',   cellWidth: colWidths[6]                         },  // Payment Method
          7: { halign: 'center', cellWidth: colWidths[7]                         },  // Status
        },

        // Status colour coding
        didParseCell(data) {
          if (data.section !== 'body' || data.column.index !== 7) return;
          const v = (data.cell.raw || '').toLowerCase();
          if      (v === 'delivered')  { data.cell.styles.textColor = [14, 142, 55];  data.cell.styles.fontStyle = 'bold'; }
          else if (v === 'cancelled')  { data.cell.styles.textColor = [205, 28, 28];  data.cell.styles.fontStyle = 'bold'; }
          else if (v === 'pending')    { data.cell.styles.textColor = [165, 75, 0];   data.cell.styles.fontStyle = 'bold'; }
          else if (v === 'shipped')    { data.cell.styles.textColor = [20, 90, 218];  data.cell.styles.fontStyle = 'bold'; }
          else if (v === 'processing') { data.cell.styles.textColor = [100, 28, 198]; data.cell.styles.fontStyle = 'bold'; }
        },
      });

      // ── 7. Grand total footer bar ─────────────────────────────────────────
      const tableBottom = doc.lastAutoTable.finalY;

      if (tableBottom + 13 < pageHeight - 18) {
        const barH = 9;
        const barY = tableBottom + 3;

        doc.setFillColor(...HDR_BG);
        doc.roundedRect(MARGIN, barY, CONTENT_W, barH, 1.5, 1.5, 'F');

        doc.setFont(PDF_FONT, 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);

        // Label
        doc.text('GRAND TOTAL', MARGIN + 4, barY + 6);

        // Total qty — aligned to right edge of Qty column (index 4)
        const qtyRightEdge = MARGIN
          + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] - 3;
        doc.text(grandTotalQty.toString(), qtyRightEdge, barY + 6, { align: 'right' });

        // Grand total — aligned to right edge of Amount column (index 5)
        const amtRightEdge = qtyRightEdge + colWidths[5];
        doc.text(rupee(grandTotalAmt), amtRightEdge, barY + 6, { align: 'right' });
      }

      // ── 8. Page numbers ───────────────────────────────────────────────────
      addPageNumbers(doc, ACCENT);
      doc.save(`sales-report-${selectedRange}.pdf`);
      success('Sales report exported successfully');
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

  const formatLastUpdated = (date) => {
    if (!date) return '--:--';
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const chartData = useMemo(() => {
    const timeline = getTimelinePoints(selectedRange, filters.dateFrom, filters.dateTo);
    return mapSeriesToTimeline(timeline, salesData, {
      getBucketKey: (item) => bucketKeyForDate(item.createdAt, selectedRange),
      getValue: (item) => Number(item.totalAmount || 0),
    });
  }, [salesData, selectedRange, filters.dateFrom, filters.dateTo]);
  const fallbackFlatChartData = useMemo(
    () => buildZeroSeriesForRange(selectedRange, filters.dateFrom, filters.dateTo),
    [selectedRange, filters.dateFrom, filters.dateTo]
  );
  const salesChartRenderData = chartData.length > 0 ? chartData : fallbackFlatChartData;
  const isTodaySelected = selectedRange === 'daily';
  const showTodaySkeleton = isTodaySelected && isDataLoading && salesData.length === 0;
  const showTodayError = isTodaySelected && !showTodaySkeleton && !!errorMessage;
  const showTodayEmpty = isTodaySelected && !showTodaySkeleton && !errorMessage && salesData.length === 0;
  const showReportDashboard = !isTodaySelected || (!showTodaySkeleton && !showTodayError && salesData.length > 0);

  // Show identical Dashboard skeleton while loading (initial or filter refresh)
  if (loading && isInitialLoading) {
    return (
      <AdminLayout>
        <DashboardSkeleton title="Loading Sales Report" />
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
              <div className="header-icon">💰</div>
              <div>
                <h1>Sales Report</h1>
                <p className="subtitle">Track revenue, sales trends, and performance metrics</p>
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
              <button
                type="button"
                className="period-nav-btn"
                onClick={() => handleShiftPeriod(-1)}
                disabled={isTodaySelected}
              >
                ← Prev
              </button>
              <span className="period-nav-current">{getRangePeriodLabel(selectedRange, periodAnchor)}</span>
              <button
                type="button"
                className="period-nav-btn"
                onClick={() => handleShiftPeriod(1)}
                disabled={isTodaySelected}
              >
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

        {isTodaySelected && (
          <div className="sales-last-updated">
            Last updated: {formatLastUpdated(lastUpdatedAt)}
          </div>
        )}

        {!isTodaySelected && errorMessage && (
          <div className="report-inline-error">{errorMessage}</div>
        )}

        {showTodaySkeleton && (
          <div className="sales-today-state sales-state-animated">
            <div className="sales-today-skeleton-card">
              <div className="sales-today-skeleton-line short" />
              <div className="sales-today-skeleton-line medium" />
              <div className="sales-today-skeleton-grid">
                <div className="sales-today-skeleton-box" />
                <div className="sales-today-skeleton-box" />
                <div className="sales-today-skeleton-box" />
                <div className="sales-today-skeleton-box" />
              </div>
            </div>
          </div>
        )}

        {showTodayError && (
          <div className="sales-today-state sales-state-animated">
            <div className="sales-today-empty-card is-error">
              <div className="sales-today-empty-icon" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path d="M12 8v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="16.5" r="1" fill="currentColor" />
                  <path d="M10.3 3.6L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.6a2 2 0 00-3.4 0z" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </div>
              <h3>Unable to fetch today&apos;s sales</h3>
              <p>Please refresh or try again in a moment.</p>
            </div>
          </div>
        )}

        {showTodayEmpty && (
          <div className="sales-today-state sales-state-animated">
            <div className="sales-today-empty-card">
              <div className="sales-today-empty-icon" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M12 10v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="7.5" r="1" fill="currentColor" />
                </svg>
              </div>
              <h3>No sales today</h3>
              <p>Sales have not started yet for today</p>
            </div>
          </div>
        )}

        {showReportDashboard && (
          <>
        <div className="report-chart-panel sales-state-animated">
          <div className="report-chart-header">
            <h3 className="report-chart-title">Daily Sales Trend</h3>
            {comparison && (
              <span className={`report-comparison-chip ${comparison.isUp ? 'up' : 'down'}`}>
                {comparison.isUp ? '↑' : '↓'} {Math.abs(comparison.growthPercent || 0).toFixed(1)}%
              </span>
            )}
          </div>
          <div className="report-chart-box" ref={chartRef}>
            <ModernReportChart
              type="line"
              data={salesChartRenderData}
              xKey="label"
              valueKey="value"
              title="Revenue Trend"
              description="Smooth revenue movement with highlighted peak and low days"
              colors={['#2563eb', '#1d4ed8']}
              seriesLabel="Revenue"
              valuePrefix="₹"
              showArea
              showPeakLow
              animationDuration={800}
            />
          </div>
        </div>

        {/* Analytics Summary */}
        <div className="analytics-summary sales-state-animated">
          <div className="analytics-card">
            <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
              📊
            </div>
            <div className="analytics-content">
              <p className="analytics-label">Total Sales</p>
              <h3 className="analytics-value">{analytics.totalSales}</h3>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
              💰
            </div>
            <div className="analytics-content">
              <p className="analytics-label">Total Revenue</p>
              <h3 className="analytics-value">{formatCurrency(analytics.totalRevenue)}</h3>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
              📈
            </div>
            <div className="analytics-content">
              <p className="analytics-label">Avg Order Value</p>
              <h3 className="analytics-value">{formatCurrency(analytics.averageOrderValue)}</h3>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
              ✅
            </div>
            <div className="analytics-content">
              <p className="analytics-label">Completed Orders</p>
              <h3 className="analytics-value">{analytics.completedOrders}</h3>
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
            </div>
            <div className="filter-actions">
              <button className="btn-apply" onClick={handleApplyFilters}>Apply Filters</button>
              <button className="btn-clear" onClick={handleClearFilters}>Clear All</button>
            </div>
          </div>
        )}

        {/* Sales Data Table */}
        <div className="report-table-container sales-state-animated">
          <div className="table-info">
            <p>Showing {salesData.length} sales records</p>
          </div>

          {salesData.length > 0 ? (
            <div className="table-wrapper">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Product Name</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.map((order) => (
                    <tr key={order._id}>
                      <td className="order-id">{order.orderNumber || order.orderId || order._id?.slice(-8).toUpperCase()}</td>
                      <td>
                        {order.items && order.items.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {order.items.map((item, idx) => (
                              <span key={idx} style={{ fontSize: '13px' }}>
                                {item.product?.name || item.name || 'Unknown Product'}
                                {item.quantity > 1 && (
                                  <span style={{ color: '#6b7280', fontSize: '11px', marginLeft: '4px' }}>
                                    ×{item.quantity}
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>—</span>
                        )}
                      </td>
                      <td>{order.user?.name || 'N/A'}</td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td className="amount">{formatCurrency(order.totalAmount)}</td>
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
              <h3>No sales data found</h3>
              <p>Try adjusting your filters or date range</p>
            </div>
          )}
        </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default SalesReport;
