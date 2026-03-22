import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import DashboardSkeleton from '../../components/DashboardSkeleton';
import useAdminLoader from '../../hooks/useAdminLoader';
import useToast from '../../hooks/useToast';
import api from '../../services/api';
import './ReportStyles.css';
import { addShopHeader, addPageNumbers, loadUnicodeFonts, pdfRupee } from '../../utils/pdfUtils';
import { formatDateLabel } from '../../utils/reportRange';
import ModernReportChart from '../../components/admin/ModernReportChart';
import useReportAutoRefresh from '../../hooks/useReportAutoRefresh';

const StockReport = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  
  const { loading, run } = useAdminLoader();
  const [exporting, setExporting] = useState(false);
  const [allStockData, setAllStockData] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [backendChart, setBackendChart] = useState(null);
  const [dateRangeLabel, setDateRangeLabel] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    brand: '',
    stockStatus: '',
    dateFrom: '',
    dateTo: '',
  });
  const [analytics, setAnalytics] = useState({
    totalProducts: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0
  });
  const chartRef = useRef(null);
  const stockMovementData = useMemo(() => {
    if (backendChart?.labels?.length) {
      return backendChart.labels.map((label, index) => ({
        name: label,
        openingStock: Number(backendChart.openingStock?.[index] || 0),
        addedStock: Number(backendChart.addedStock?.[index] || 0),
        soldStock: Number(backendChart.soldStock?.[index] || 0),
        closingStock: Number(backendChart.closingStock?.[index] || 0),
      }));
    }

    return [
      { name: 'Week 1', openingStock: 0, addedStock: 0, soldStock: 0, closingStock: 0 },
      { name: 'Week 2', openingStock: 0, addedStock: 0, soldStock: 0, closingStock: 0 },
      { name: 'Week 3', openingStock: 0, addedStock: 0, soldStock: 0, closingStock: 0 },
      { name: 'Week 4', openingStock: 0, addedStock: 0, soldStock: 0, closingStock: 0 },
    ];
  }, [backendChart]);

  const stockMovementSummary = useMemo(() => {
    return stockMovementData.reduce(
      (acc, item, index) => {
        if (index === 0) {
          acc.openingStock = Number(item.openingStock || 0);
        }
        acc.addedStock += Number(item.addedStock || 0);
        acc.soldStock += Number(item.soldStock || 0);
        acc.closingStock = Number(item.closingStock || 0);
        return acc;
      },
      {
        openingStock: 0,
        addedStock: 0,
        soldStock: 0,
        closingStock: 0,
      }
    );
  }, [stockMovementData]);

  const showNoMovementHint = useMemo(
    () => stockMovementSummary.addedStock === 0 && stockMovementSummary.soldStock === 0,
    [stockMovementSummary]
  );

  const stockStatusChartData = useMemo(
    () => [
      { name: 'In Stock', value: analytics.inStock },
      { name: 'Low Stock', value: analytics.lowStock },
      { name: 'Out of Stock', value: analytics.outOfStock },
    ],
    [analytics]
  );

  const productWiseStockData = useMemo(
    () =>
      [...stockData]
        .sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0))
        .slice(0, 8)
        .map((item) => ({
          name: item.name || 'Product',
          stock: Number(item.stock || 0),
        })),
    [stockData]
  );

  useEffect(() => {
    let mounted = true;
    run(async () => {
      await fetchStockData(null);
    }).finally(() => {
      if (mounted) setIsInitialLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const fetchStockData = async (filtersOverride = null) => {
    const activeFilters = filtersOverride || filters;
    // loading managed by useAdminLoader's run()
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        navigate('/admin/login');
        return;
      }

      const params = new URLSearchParams();
      if (activeFilters.search) params.append('search', activeFilters.search);
      if (activeFilters.category) params.append('category', activeFilters.category);
      if (activeFilters.brand) params.append('brand', activeFilters.brand);
      if (activeFilters.stockStatus) params.append('stockStatus', activeFilters.stockStatus);
      if (activeFilters.dateFrom) params.append('dateFrom', activeFilters.dateFrom);
      if (activeFilters.dateTo) params.append('dateTo', activeFilters.dateTo);

      const queryString = params.toString();
      const endpoint = queryString ? `/admin/reports/stock?${queryString}` : '/admin/reports/stock';

      console.log('📦 Fetching stock report from:', endpoint);
      const response = await api.get(endpoint);
      
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format from server');
      }

      if (response.data.success) {
        const reportData = response.data.data || [];
        const summary = response.data.summary || {};
        const chart = response.data.chart || null;

        setAllStockData(reportData);
        setBackendChart(chart);
        if (summary.dateRange?.from && summary.dateRange?.to) {
          setDateRangeLabel(`${formatDateLabel(summary.dateRange.from)} - ${formatDateLabel(summary.dateRange.to)}`);
        } else {
          setDateRangeLabel('');
        }
        
        console.log(`✅ Successfully fetched ${reportData.length} products`);
        console.log('📈 Summary:', summary);
      }
    } catch (err) {
      console.error('❌ Stock Report Error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        endpoint: '/admin/reports/stock'
      });
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        error('Authentication failed. Please login again.');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
        navigate('/admin/login');
      } else if (err.response?.status === 500) {
        error('Server error. Please try again later.');
      } else {
        setBackendChart(null);
        error(err.response?.data?.message || 'Failed to fetch stock data');
      }
    } finally {
      // loading managed by run()
    }
  };

  useEffect(() => {
    const filtered = allStockData;

    setStockData(filtered);

    const totals = filtered.reduce(
      (acc, item) => {
        const stock = Number(item.stock || 0);
        acc.totalProducts += 1;
        if (stock <= 0) {
          acc.outOfStock += 1;
        } else if (stock <= 10) {
          acc.lowStock += 1;
        } else {
          acc.inStock += 1;
        }
        return acc;
      },
      {
        totalProducts: 0,
        inStock: 0,
        lowStock: 0,
        outOfStock: 0,
      }
    );

    setAnalytics({
      totalProducts: totals.totalProducts,
      inStock: totals.inStock,
      lowStock: totals.lowStock,
      outOfStock: totals.outOfStock,
    });

  }, [allStockData]);

  useReportAutoRefresh(
    () => fetchStockData(filters),
    { intervalMs: 10000 }
  );

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = async () => {
    setIsUpdating(true);
    try {
      await fetchStockData(filters);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      category: '',
      brand: '',
      stockStatus: '',
      dateFrom: '',
      dateTo: '',
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

      let yPos = addShopHeader(doc, 'STOCK REPORT', [16, 185, 129]);

      doc.setFont(PDF_FONT, 'bold');
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text('Stock Report', 14, yPos);
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

      
      if (filters.search || filters.category || filters.brand || filters.stockStatus) {
        doc.text('Filters Applied:', 14, yPos);
        yPos += 5;
        if (filters.search) doc.text(`  • Search: ${filters.search}`, 14, yPos), yPos += 5;
        if (filters.category) doc.text(`  • Category: ${filters.category}`, 14, yPos), yPos += 5;
        if (filters.brand) doc.text(`  • Brand: ${filters.brand}`, 14, yPos), yPos += 5;
        if (filters.stockStatus) doc.text(`  • Status: ${filters.stockStatus}`, 14, yPos), yPos += 5;
        yPos += 5;
      }
      
      // Analytics Summary
      doc.setFont(PDF_FONT, 'bold');
      doc.setFontSize(12);
      doc.setTextColor(16, 185, 129);
      doc.text('Inventory Summary', 14, yPos);
      doc.setFont(PDF_FONT, 'normal');
      doc.setTextColor(60, 60, 60);
      yPos += 8;
      
      doc.setFontSize(10);
      const summaryData = [
        ['Total Products', analytics.totalProducts.toString()],
        ['In Stock', analytics.inStock.toString()],
        ['Low Stock', analytics.lowStock.toString()],
        ['Out of Stock', analytics.outOfStock.toString()]
      ];
      
      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129], textColor: 255 },
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
        doc.setTextColor(16, 185, 129);
        doc.text('Stock Charts', 14, yPos);
        yPos += 6;

        doc.addImage(imgData, 'PNG', 14, yPos, chartWidth, chartHeight);
        yPos += chartHeight + 8;
      }
      
      // Detailed Stock Data
      doc.setFont(PDF_FONT, 'bold');
      doc.setFontSize(12);
      doc.setTextColor(16, 185, 129);
      doc.text('Detailed Stock Data', 14, yPos);
      doc.setFont(PDF_FONT, 'normal');
      doc.setTextColor(60, 60, 60);
      yPos += 8;
      
      const tableData = stockData.map(product => [
        product.name,
        product.category || 'N/A',
        pdfRupee(product.price),
        product.stock.toString(),
        pdfRupee(product.stockValue || (product.price * product.stock) || 0),
        product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock',
        product.createdAt ? new Date(product.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Product Name', 'Category', 'Price', 'Stock Qty', 'Stock Value', 'Status', 'Date Added']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: 255 },
        styles: { font: PDF_FONT, fontSize: 9 },
        margin: { left: 14, right: 14 }
      });
      
      // Save PDF
      addPageNumbers(doc, [16, 185, 129]);
      const fileName = 'stock-report.pdf';
      doc.save(fileName);
      
      success('Stock report exported as PDF successfully');
    } catch (err) {
      error('Failed to export PDF');
      console.error('PDF export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

  const getStockStatus = (stock) => {
    if (stock > 10) return { status: 'In Stock', class: 'in-stock' };
    if (stock > 0) return { status: 'Low Stock', class: 'low-stock' };
    return { status: 'Out of Stock', class: 'out-of-stock' };
  };

  if (loading && isInitialLoading) {
    return (
      <AdminLayout>
        <DashboardSkeleton title="Loading Stock Report" />
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
              <div className="header-icon" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                📦
              </div>
              <div>
                <h1>Stock Report</h1>
                <p className="subtitle">Monitor inventory levels and stock movements</p>
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

        <div className="report-chart-panel" ref={chartRef}>
          <div className="report-chart-header">
            <h3 className="report-chart-title">Stock Dashboard</h3>
          </div>

          {showNoMovementHint ? (
            <div className="report-chart-empty-state">
              <span className="report-chart-empty-state__icon" aria-hidden="true">
                📦
              </span>
              <h4 className="report-chart-empty-state__title">No Stock Movement</h4>
              <p className="report-chart-empty-state__subtitle">No stock movement is available for this selection.</p>
            </div>
          ) : (
            <div className="report-chart-grid two-col">
              <ModernReportChart
                type="pie"
                data={stockStatusChartData}
                xKey="name"
                valueKey="value"
                title="Stock Status"
                description="Current product distribution by stock level"
                colors={['#16a34a', '#f59e0b', '#ef4444']}
                seriesLabel="Products"
                animationDuration={900}
              />

              {productWiseStockData.length > 0 && (
                <ModernReportChart
                  type="bar"
                  data={productWiseStockData}
                  xKey="name"
                  valueKey="stock"
                  title="Product-wise Stock"
                  description="Top products by available stock"
                  colors={['#2563eb', '#60a5fa']}
                  seriesLabel="Stock"
                  valueSuffix=" units"
                  showPeakLow={false}
                  animationDuration={900}
                />
              )}
            </div>
          )}
        </div>

        {/* Analytics Summary */}
        <div className="analytics-summary">
          <div className="analytics-card">
            <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
              📥
            </div>
            <div className="analytics-content">
              <p className="analytics-label">Opening Stock</p>
              <h3 className="analytics-value">{stockMovementSummary.openingStock}</h3>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
              ➕
            </div>
            <div className="analytics-content">
              <p className="analytics-label">Added Stock</p>
              <h3 className="analytics-value">{stockMovementSummary.addedStock}</h3>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
              📤
            </div>
            <div className="analytics-content">
              <p className="analytics-label">Sold Stock</p>
              <h3 className="analytics-value">{stockMovementSummary.soldStock}</h3>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}>
              📦
            </div>
            <div className="analytics-content">
              <p className="analytics-label">Closing Stock</p>
              <h3 className="analytics-value">{stockMovementSummary.closingStock}</h3>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filters-grid">
              <div className="filter-item">
                <label>Search Product</label>
                <input 
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Product name..."
                />
              </div>
              <div className="filter-item">
                <label>Category</label>
                <input 
                  type="text"
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  placeholder="Category..."
                />
              </div>
              <div className="filter-item">
                <label>Brand</label>
                <input 
                  type="text"
                  name="brand"
                  value={filters.brand}
                  onChange={handleFilterChange}
                  placeholder="Brand..."
                />
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
            </div>
            <div className="filter-actions">
              <button className="btn-apply" onClick={handleApplyFilters}>Apply Filters</button>
              <button className="btn-clear" onClick={handleClearFilters}>Clear All</button>
            </div>
          </div>
        )}

        {/* Stock Data Table */}
        <div className="report-table-container">
          <div className="table-info">
            <p>Showing {stockData.length} products</p>
          </div>

          {stockData.length > 0 ? (
            <div className="table-wrapper">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th>Price</th>
                    <th>Stock Quantity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stockData.map((product) => {
                    const stockStatus = getStockStatus(product.stock);
                    return (
                      <tr key={product._id}>
                        <td>{product.name}</td>
                        <td>{product.category}</td>
                        <td>{product.brand}</td>
                        <td className="amount">{formatCurrency(product.price)}</td>
                        <td className="text-center" style={{ fontWeight: 600 }}>{product.stock}</td>
                        <td>
                          <span className={`status-badge ${stockStatus.class}`}>
                            {stockStatus.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="30" fill="#f3f4f6"/>
                <path d="M32 20v16M32 44h.01" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              <h3>No stock data found</h3>
              <p>Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default StockReport;
