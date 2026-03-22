import React, { useState, useMemo, useEffect } from 'react';
import API from '../../services/api';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import './RevenueChart.css';

// ─── helpers ──────────────────────────────────────────────────────────────────

const getWeekBounds = (offset) => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { monday, sunday };
};

const formatWeekRange = (monday, sunday) => {
  const s = monday.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  const e = sunday.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${s} - ${e}`;
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label, mode }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const dayLabel = data.day || label;

  let headerLabel = dayLabel;
  let dateDisplay = '';

  if (mode === 'daily') {
    const d = new Date(data.date + 'T00:00:00');
    const fullDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    headerLabel = `${fullDate} - ${dayLabel}`;
  } else if (mode === 'monthly') {
    const d = new Date(data.date + 'T00:00:00');
    dateDisplay = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } else {
    const dateStr = data.date || '';
    const d = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
      ? new Date(dateStr + 'T00:00:00')
      : new Date(dateStr);
    dateDisplay = dateStr
      ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '';
  }

  return (
    <div className="revenue-chart-tooltip">
      <div className="revenue-tooltip-header">
        <strong>{headerLabel}</strong>
      </div>
      {dateDisplay && (
        <div className="revenue-tooltip-row">
          <span className="revenue-tooltip-label">Date:</span>
          <span className="revenue-tooltip-value">{dateDisplay}</span>
        </div>
      )}
      <div className="revenue-tooltip-row">
        <span className="revenue-tooltip-label">Sales:</span>
        <span className="revenue-tooltip-value">₹{(data.revenue || 0).toLocaleString('en-IN')}</span>
      </div>
      <div className="revenue-tooltip-row">
        <span className="revenue-tooltip-label">Orders:</span>
        <span className="revenue-tooltip-value">{data.orders || 0}</span>
      </div>
    </div>
  );
};

// ─── Custom Dot ───────────────────────────────────────────────────────────────

const CustomDot = (props) => {
  const { cx, cy, fill, payload, r = 5 } = props;
  if (payload.revenue === 0 || payload.revenue === null) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 4} fill={fill} fillOpacity="0.1" className="revenue-chart-dot-glow" />
      <circle
        cx={cx} cy={cy} r={r}
        fill={fill} stroke="white" strokeWidth={2.5}
        className="revenue-chart-dot"
        style={{ cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', filter: 'drop-shadow(0 2px 4px rgba(37, 99, 235, 0.15))' }}
      />
    </g>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const FILTERS = [
  { value: 'daily',   label: 'Daily' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const RevenueChart = ({ loading = false }) => {
  const [mode, setMode]               = useState('weekly');
  const [weekOffset, setWeekOffset]   = useState(0);
  const [fetchedData, setFetchedData] = useState([]);
  const [weekLoading, setWeekLoading] = useState(true);
  const [hoveredDataIndex, setHoveredDataIndex] = useState(null);

  const { monday, sunday } = useMemo(() => getWeekBounds(weekOffset), [weekOffset]);

  const buildUrl = () => {
    if (mode === 'daily') {
      const today = new Date().toLocaleDateString('en-CA');
      return `/admin/revenue-trend?mode=daily&date=${today}`;
    }
    if (mode === 'monthly') {
      const now = new Date();
      const ref = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      return `/admin/revenue-trend?mode=monthly&date=${ref}`;
    }
    return `/admin/revenue-trend?mode=weekly&startDate=${monday.toLocaleDateString('en-CA')}&endDate=${sunday.toLocaleDateString('en-CA')}`;
  };

  useEffect(() => {
    let cancelled = false;
    setWeekLoading(true);
    API.get(buildUrl())
      .then(({ data: resp }) => { if (!cancelled) setFetchedData(resp.salesTrendData || []); })
      .catch((err) => { console.error('Revenue Trend fetch error:', err); if (!cancelled) setFetchedData([]); })
      .finally(() => { if (!cancelled) setWeekLoading(false); });
    return () => { cancelled = true; };
  }, [mode, weekOffset]); // eslint-disable-line react-hooks/exhaustive-deps

  const chartData = useMemo(() => {
    if (!fetchedData || fetchedData.length === 0) return [];
    return fetchedData.map((item) => ({
      ...item,
      revenue: parseFloat(item.revenue || 0),
      orders:  parseInt(item.orders  || 0, 10),
    }));
  }, [fetchedData]);

  const hasRevenue = chartData.some((d) => d.revenue > 0);
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue || 0), 5000);
  const yAxisMax   = Math.ceil(maxRevenue / 5000) * 5000;
  const isLoading  = loading || weekLoading;

  const badgeLabel = mode === 'daily'
    ? "Today's hourly performance"
    : mode === 'monthly'
      ? `Monthly performance - ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`
      : 'Mon - Sun weekly performance';

  const filterBar = (
    <div className="revenue-filter-bar">
      <div className="revenue-filter-group">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`revenue-filter-btn${mode === f.value ? ' active' : ''}`}
            onClick={() => { setMode(f.value); setWeekOffset(0); }}
          >
            {f.label}
          </button>
        ))}
      </div>
      {mode === 'weekly' && (
        <div className="revenue-week-nav">
          <button className="revenue-nav-btn" onClick={() => setWeekOffset((p) => p - 1)}>
            &larr; Prev
          </button>
          <span className="revenue-week-range">{formatWeekRange(monday, sunday)}</span>
          <button
            className="revenue-nav-btn"
            disabled={weekOffset === 0}
            onClick={() => setWeekOffset(0)}
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <>
        {filterBar}
        <div className="revenue-chart-skeleton">
          <div className="revenue-chart-skeleton-bar" style={{ height: '260px' }} />
        </div>
      </>
    );
  }

  if (!hasRevenue || chartData.length === 0) {
    return (
      <>
        {filterBar}
        <div className="revenue-chart-empty">
          <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" width="48" height="48">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6"  y1="20" x2="6"  y2="14" />
          </svg>
          <p>No revenue data available</p>
          <small>Complete delivered orders to see the sales trend</small>
        </div>
      </>
    );
  }

  return (
    <div className="revenue-chart-container">
      {filterBar}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          onMouseMove={(state) => { if (state && state.activeTooltipIndex !== undefined) setHoveredDataIndex(state.activeTooltipIndex); }}
          onMouseLeave={() => setHoveredDataIndex(null)}
        >
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.4} />
              <stop offset="50%" stopColor="#2563eb" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="revenueGradientHover" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.5} />
              <stop offset="50%" stopColor="#2563eb" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.03} />
            </linearGradient>
            <filter id="revenueLineShadow">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.2" />
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} opacity={0.6} />
          <XAxis
            dataKey="day"
            tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            style={{ textAnchor: 'middle' }}
            interval={mode === 'daily' ? 2 : mode === 'monthly' ? 4 : 0}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            domain={[0, yAxisMax]}
            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            width={55}
          />
          <Tooltip
            content={<CustomTooltip mode={mode} />}
            cursor={{ fill: 'rgba(37, 99, 235, 0.08)', radius: 8 }}
            contentStyle={{ outline: 'none' }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            fill="url(#revenueGradient)"
            stroke="none"
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-in-out"
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#2563eb"
            strokeWidth={3.5}
            dot={<CustomDot fill="#2563eb" r={5} />}
            activeDot={{ r: 8, fill: '#1d4ed8', stroke: 'white', strokeWidth: 3, filter: 'drop-shadow(0 4px 12px rgba(37, 99, 235, 0.4))' }}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-in-out"
            filter="url(#revenueLineShadow)"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="revenue-chart-info">
        <div className="revenue-info-badge">
          <span className="revenue-info-dot" />
          {badgeLabel}
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;
