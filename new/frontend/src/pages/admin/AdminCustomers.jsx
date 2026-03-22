import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, RefreshCcw, TrendingUp, TrendingDown,
  Search, Plus, Eye, Trash2, X,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  SlidersHorizontal, Filter, Package,
  Star, Activity, Clock, UserCheck, Zap, CalendarDays, Award, Crown,
  Mail, Phone, MapPin,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import DashboardSkeleton from '../../components/DashboardSkeleton';
import useAdminLoader from '../../hooks/useAdminLoader';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import './AdminCustomers.css';

/* ─── helpers ────────────────────────────────────────────────── */
const initials = n => n.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#7c3aed,#a78bfa)',
  'linear-gradient(135deg,#2563eb,#60a5fa)',
  'linear-gradient(135deg,#0891b2,#22d3ee)',
  'linear-gradient(135deg,#059669,#34d399)',
  'linear-gradient(135deg,#db2777,#f472b6)',
  'linear-gradient(135deg,#d97706,#fbbf24)',
];
const avatarColor = n => AVATAR_GRADIENTS[n.charCodeAt(0) % AVATAR_GRADIENTS.length];

const osMeta = s => ({
  pending:    'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed:  'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped:    'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled:  'bg-red-50 text-red-700 border-red-200',
}[s] ?? 'bg-slate-50 text-slate-700 border-slate-200');

const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtAmt  = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/* ─── Animated counter hook ──────────────────────────────────── */
const useCountUp = (target, duration = 950) => {
  const [val, setVal] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    if (typeof target !== 'number' || isNaN(target)) { setVal(target); return; }
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return val;
};

/* ─── AdminCustomers ─────────────────────────────────────────── */
const AdminCustomers = () => {
  const { admin }   = useAuth();
  const navigate    = useNavigate();

  const [customers, setCustomers]               = useState([]);
  const [topBuyers, setTopBuyers]               = useState([]);
  const [purchaseInsights, setPurchaseInsights] = useState({ customersWithOrders: 0, avgProducts: 0 });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders]     = useState([]);
  const [searchQuery, setSearchQuery]           = useState('');
  const [filterStatus, setFilterStatus]         = useState('all');
  const [sortBy, setSortBy]                     = useState('newest');
  const [currentPage, setCurrentPage]           = useState(1);
  const itemsPerPage = 10;
  const { loading, run } = useAdminLoader();

  useEffect(() => {
    document.body.style.overflow = selectedCustomer ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedCustomer]);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape' && selectedCustomer) { setSelectedCustomer(null); setCustomerOrders([]); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedCustomer]);

  useEffect(() => { run(fetchCustomers); fetchTopBuyers(); }, []);

  const fetchCustomers = async () => {
    try {
      const { data } = await API.get('/admin/customers');
      setCustomers(data.customers);
    } catch (e) { console.error(e); }
  };

  const fetchTopBuyers = async () => {
    try {
      const { data } = await API.get('/admin/customers/top-buyers');
      setTopBuyers(data.topBuyers || []);
      if (data.insights) setPurchaseInsights(data.insights);
    } catch (e) { console.error('top-buyers fetch failed', e); }
  };

  const fetchCustomerDetails = async id => {
    try {
      const { data } = await API.get(`/admin/customers/${id}`);
      setSelectedCustomer(data.customer);
      setCustomerOrders(data.orders);
    } catch { alert('Failed to load customer details'); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete customer "${name}"? This cannot be undone.`)) return;
    try {
      await API.delete(`/admin/customers/${id}`);
      fetchCustomers();
      if (selectedCustomer?._id === id) { setSelectedCustomer(null); setCustomerOrders([]); }
    } catch (e) { alert(e.response?.data?.message || 'Delete failed'); }
  };

  /* ── derived stats ──────────────────────────────────────────── */
  const now = new Date();

  const thisMonth = useMemo(() => customers.filter(c => {
    const d = new Date(c.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length, [customers]);

  const lastMonth = useMemo(() => customers.filter(c => {
    const d = new Date(c.createdAt);
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  }).length, [customers]);

  const returning = useMemo(() => customers.filter(c =>
    new Date(c.createdAt) < new Date(now.getFullYear(), now.getMonth(), 1)
  ).length, [customers]);

  const growthRaw      = lastMonth > 0 ? (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1) : null;
  const growthStr      = growthRaw !== null ? `${Number(growthRaw) >= 0 ? '+' : ''}${growthRaw}%` : 'N/A';
  const growthPositive = growthRaw === null || Number(growthRaw) >= 0;

  /* ── animated counters ──────────────────────────────────────── */
  const [mounted, setMounted] = useState(false);
  useEffect(() => { if (customers.length > 0 && !mounted) setMounted(true); }, [customers.length]);
  const cntTotal     = useCountUp(mounted ? customers.length : 0);
  const cntNew       = useCountUp(mounted ? thisMonth : 0);
  const cntReturning = useCountUp(mounted ? returning : 0);

  /* ── panel data ──────────────────────────────────────────────── */
  const maxProducts = useMemo(() =>
    topBuyers.length > 0 ? topBuyers[0].totalProducts : 1
  , [topBuyers]);

  const timelineEvents = useMemo(() =>
    [...customers]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(c => ({ id: c._id, name: c.name, date: c.createdAt }))
  , [customers]);

  const todayJoins = useMemo(() => {
    const t = new Date();
    return customers.filter(c => {
      const d = new Date(c.createdAt);
      return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
    }).length;
  }, [customers]);

  const weekJoins = useMemo(() => {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return customers.filter(c => new Date(c.createdAt) >= weekAgo).length;
  }, [customers]);

  const withPhone   = useMemo(() => customers.filter(c => c.phone).length, [customers]);
  const withAddress = useMemo(() => customers.filter(c => c.address?.city).length, [customers]);

  /* ── filter + sort ──────────────────────────────────────────── */
  const filtered = useMemo(() => customers
    .filter(c => {
      const q = searchQuery.toLowerCase();
      const match = c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
      if (filterStatus === 'new') {
        const d = new Date(c.createdAt);
        return match && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return match;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'name')   return a.name.localeCompare(b.name);
      return 0;
    }), [customers, searchQuery, filterStatus, sortBy]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated  = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  /* ────────────────────────────────────────────────────────────── */
  if (loading) return <AdminLayout><DashboardSkeleton title="Loading Customers" /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="acs-page">

        {/* ══ HEADER ══════════════════════════════════════════════ */}
        <header className="acs-header">
          <div className="acs-header__left">
            <h1 className="acs-header__title">Customers</h1>
            <p className="acs-header__sub">Manage and monitor registered users</p>
          </div>
          <button className="acs-add-btn">
            <Plus size={15} strokeWidth={2.5} />
            Add Customer
          </button>
        </header>

        {/* ══ STAT CARDS ══════════════════════════════════════════ */}
        <div className="acs-stats">

          <div className="acs-stat acs-stat--saffron">
            <div className="acs-stat__icon">
              <Users size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <div className="acs-stat__body">
              <div className="acs-stat__top">
                <div className="acs-stat__num">{cntTotal}</div>
                <span className="acs-stat__badge">All time</span>
              </div>
              <div className="acs-stat__name">Total Customers</div>
              <div className="acs-stat__desc">All registered users</div>
            </div>
          </div>

          <div className="acs-stat acs-stat--royal">
            <div className="acs-stat__icon">
              <UserPlus size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <div className="acs-stat__body">
              <div className="acs-stat__top">
                <div className="acs-stat__num">{cntNew}</div>
                <span className="acs-stat__badge">{growthStr}</span>
              </div>
              <div className="acs-stat__name">New This Month</div>
              <div className="acs-stat__desc">Joined this month</div>
            </div>
          </div>

          <div className="acs-stat acs-stat--forest">
            <div className="acs-stat__icon">
              <RefreshCcw size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <div className="acs-stat__body">
              <div className="acs-stat__top">
                <div className="acs-stat__num">{cntReturning}</div>
                <span className="acs-stat__badge">Loyal</span>
              </div>
              <div className="acs-stat__name">Returning</div>
              <div className="acs-stat__desc">Before this month</div>
            </div>
          </div>

          <div className={`acs-stat ${growthPositive ? 'acs-stat--ember' : 'acs-stat--rose'}`}>
            <div className="acs-stat__icon">
              {growthPositive
                ? <TrendingUp size={16} color="#fff" strokeWidth={2.5} />
                : <TrendingDown size={16} color="#fff" strokeWidth={2.5} />
              }
            </div>
            <div className="acs-stat__body">
              <div className="acs-stat__top">
                <div className="acs-stat__num">{growthStr}</div>
                <span className="acs-stat__badge">vs last mo</span>
              </div>
              <div className="acs-stat__name">Growth Rate</div>
              <div className="acs-stat__desc">Month-over-month</div>
            </div>
          </div>

        </div>

        {/* ══ INFO PANELS ══════════════════════════════════════════ */}
        <div className="acs-panels">

          {/* Top Customers by Products Purchased */}
          <div className="acs-panel">
            <div className="acs-panel__head">
              <div className="acs-panel__hicon" style={{ background: 'linear-gradient(135deg,#FF7A18,#FFB347)' }}>
                <Package size={13} color="#fff" strokeWidth={2.5} />
              </div>
              <div>
                <div className="acs-panel__title">Top Customers</div>
                <div className="acs-panel__sub">Highest product purchases</div>
              </div>
            </div>

            {/* Purchase Insights strip */}
            <div className="acs-pi-strip">
              <div className="acs-pi-item">
                <div className="acs-pi-icon acs-pi-icon--orange"><Crown size={11} color="#FF7A18" /></div>
                <div className="acs-pi-text">
                  <span className="acs-pi-val">{topBuyers[0]?.name ?? '—'}</span>
                  <span className="acs-pi-label">Most Active</span>
                </div>
              </div>
              <div className="acs-pi-divider" />
              <div className="acs-pi-item">
                <div className="acs-pi-icon acs-pi-icon--blue"><Package size={11} color="#2563eb" /></div>
                <div className="acs-pi-text">
                  <span className="acs-pi-val">{purchaseInsights.avgProducts}</span>
                  <span className="acs-pi-label">Avg Products</span>
                </div>
              </div>
              <div className="acs-pi-divider" />
              <div className="acs-pi-item">
                <div className="acs-pi-icon acs-pi-icon--green"><UserCheck size={11} color="#0F9D58" /></div>
                <div className="acs-pi-text">
                  <span className="acs-pi-val">{purchaseInsights.customersWithOrders}</span>
                  <span className="acs-pi-label">With Orders</span>
                </div>
              </div>
            </div>

            <div className="acs-panel__list">
              {topBuyers.length === 0
                ? <div className="acs-panel__empty"><Package size={22} color="#cbd5e1" /><span>No order data yet</span></div>
                : topBuyers.map((c, i) => {
                  const BAR_GRADS = [
                    'linear-gradient(90deg,#FF7A18,#FFB347)',
                    'linear-gradient(90deg,#2563eb,#60a5fa)',
                    'linear-gradient(90deg,#0F9D58,#34d399)',
                    'linear-gradient(90deg,#7c3aed,#a78bfa)',
                    'linear-gradient(90deg,#0891b2,#22d3ee)',
                  ];
                  const RANK_COLORS   = ['#FF7A18','#2563eb','#0F9D58','#64748b','#64748b'];
                  const MEDAL_LABELS  = ['🥇','🥈','🥉'];
                  const ROW_BG        = ['rgba(255,122,24,0.04)','rgba(37,99,235,0.035)','rgba(15,157,88,0.035)'];
                  const TAG_COLORS    = [
                    { bg: 'rgba(255,122,24,0.1)',  color: '#c2410c' },
                    { bg: 'rgba(37,99,235,0.09)',  color: '#1d4ed8' },
                    { bg: 'rgba(15,157,88,0.09)',  color: '#059669' },
                    { bg: 'rgba(124,58,237,0.09)', color: '#6d28d9' },
                    { bg: 'rgba(8,145,178,0.09)',  color: '#0e7490' },
                  ];
                  const tagStyle   = TAG_COLORS[i] ?? TAG_COLORS[3];
                  const pct        = Math.max(6, Math.round((c.totalProducts / maxProducts) * 100));
                  const names      = (c.productNames || []).filter(Boolean);
                  const showTags   = names.slice(0, 3);
                  const extraCount = names.length - showTags.length;
                  return (
                    <div
                      key={c._id}
                      className="acs-tb-row"
                      style={{ animationDelay: `${i * 0.09}s`, background: ROW_BG[i] ?? 'transparent' }}
                    >
                      {/* Left: medal + avatar */}
                      <div className="acs-tb-left">
                        <div className="acs-tb-medal">
                          {i < 3
                            ? <span className="acs-tb-medal-emoji">{MEDAL_LABELS[i]}</span>
                            : <span className="acs-tb-medal-num" style={{ color: RANK_COLORS[i] }}>#{i + 1}</span>
                          }
                        </div>
                        <div className="acs-avatar-sm" style={{ background: avatarColor(c.name) }}>{initials(c.name)}</div>
                        <div className="acs-tb-meta">
                          <span className="acs-tb-name">{c.name}</span>
                          <span className="acs-tb-count" style={{ color: RANK_COLORS[i] }}>
                            {c.totalProducts}<span className="acs-tb-unit"> products</span>
                          </span>
                        </div>
                      </div>

                      {/* Right: tags + bar */}
                      <div className="acs-tb-right">
                        {names.length > 0 && (
                          <div className="acs-tb-tags">
                            {showTags.map((n, t) => (
                              <span key={t} className="acs-tb-tag" style={{ background: tagStyle.bg, color: tagStyle.color }}>
                                {n}
                              </span>
                            ))}
                            {extraCount > 0 && (
                              <span className="acs-tb-tag acs-tb-tag--more">+{extraCount} more</span>
                            )}
                          </div>
                        )}
                        <div className="acs-tb-track">
                          <div
                            className="acs-tb-fill"
                            style={{ width: `${pct}%`, background: BAR_GRADS[i], animationDelay: `${0.25 + i * 0.1}s` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="acs-panel">
            <div className="acs-panel__head">
              <div className="acs-panel__hicon" style={{ background: 'linear-gradient(135deg,#2563eb,#60a5fa)' }}>
                <Activity size={13} color="#fff" strokeWidth={2.5} />
              </div>
              <div>
                <div className="acs-panel__title">Activity Timeline</div>
                <div className="acs-panel__sub">Recent registrations</div>
              </div>
            </div>
            <div className="acs-timeline">
              <div className="acs-timeline-scroll">
              {timelineEvents.length === 0
                ? <div className="acs-panel__empty"><Activity size={22} color="#cbd5e1" /><span>No activity yet</span></div>
                : timelineEvents.map((e, i) => (
                  <div key={e.id} className="acs-tl-item" style={{ animationDelay: `${i * 0.08}s` }}>
                    <div className="acs-tl-spine">
                      <div className={`acs-tl-dot${i === 0 ? ' acs-tl-dot--pulse' : ''}`} />
                      {i < timelineEvents.length - 1 && <div className="acs-tl-line" />}
                    </div>
                    <div className="acs-tl-body">
                      <div className="acs-tl-row">
                        <div className="acs-tl-icon-wrap">
                          <UserPlus size={10} strokeWidth={2.5} color="#2563eb" />
                        </div>
                        <div className="acs-tl-content">
                          <div className="acs-tl-event">
                            <span className="acs-tl-name">{e.name}</span>
                            <span className="acs-tl-verb"> joined</span>
                          </div>
                          <div className="acs-tl-time"><Clock size={9} />{fmtDate(e.date)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* ══ QUICK INSIGHTS ═══════════════════════════════════════ */}
        <div className="acs-insights">

          <div className="acs-insight acs-insight--orange">
            <div className="acs-insight__icon"><CalendarDays size={15} color="#FF7A18" /></div>
            <div className="acs-insight__num">{todayJoins}</div>
            <div className="acs-insight__label">Joined Today</div>
          </div>

          <div className="acs-insight acs-insight--blue">
            <div className="acs-insight__icon"><Zap size={15} color="#2563EB" /></div>
            <div className="acs-insight__num">{weekJoins}</div>
            <div className="acs-insight__label">This Week</div>
          </div>

          <div className="acs-insight acs-insight--green">
            <div className="acs-insight__icon"><UserCheck size={15} color="#0F9D58" /></div>
            <div className="acs-insight__num">{withPhone}</div>
            <div className="acs-insight__label">Have Phone</div>
          </div>

          <div className="acs-insight acs-insight--purple">
            <div className="acs-insight__icon"><Award size={15} color="#7c3aed" /></div>
            <div className="acs-insight__num">{withAddress}</div>
            <div className="acs-insight__label">Have Address</div>
          </div>

        </div>

        {/* ══ TOOLBAR ═════════════════════════════════════════════ */}
        <div className="acs-toolbar">
          <div className="acs-search">
            <Search size={15} className="acs-search__icon" />
            <input
              className="acs-search__input"
              placeholder="Search customers by name or email…"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
            {searchQuery && (
              <button className="acs-search__clear" onClick={() => { setSearchQuery(''); setCurrentPage(1); }}>
                <X size={11} />
              </button>
            )}
          </div>

          <div className="acs-toolbar__controls">
            <div className="acs-filter-select">
              <Filter size={13} className="acs-filter-select__icon" />
              <select
                value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">All Customers</option>
                <option value="active">Active</option>
                <option value="new">New This Month</option>
              </select>
            </div>

            <div className="acs-filter-select">
              <SlidersHorizontal size={13} className="acs-filter-select__icon" />
              <select
                value={sortBy}
                onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>

            <div className="acs-count-badge">
              <span className="acs-count-badge__num">{filtered.length}</span>
              <span className="acs-count-badge__text">results</span>
            </div>
          </div>
        </div>

        {/* ══ CUSTOMER LIST ══════════════════════════════════════ */}
        <div className="acs-clist-card">
          <div className="acs-clist">
            {paginated.length > 0 ? paginated.map((c, i) => (
              <div key={c._id} className="acs-ccard" style={{ animationDelay: `${i * 0.04}s` }}>

                {/* Identity */}
                <div className="acs-ccard__identity">
                  <div className="acs-ccard__avatar" style={{ background: avatarColor(c.name) }}>
                    {initials(c.name)}
                  </div>
                  <div>
                    <div className="acs-ccard__name">{c.name}</div>
                    <div className="acs-ccard__id">#{c._id.slice(-6).toUpperCase()}</div>
                  </div>
                </div>

                {/* Contact */}
                <div className="acs-ccard__contact">
                  <div className="acs-ccard__crow"><Mail size={11} /><span>{c.email}</span></div>
                  <div className="acs-ccard__crow"><Phone size={11} /><span>{c.phone || '—'}</span></div>
                  <div className="acs-ccard__crow">
                    <MapPin size={11} />
                    <span>
                      {c.address?.city && c.address?.state
                        ? `${c.address.city}, ${c.address.state}`
                        : c.address?.city || c.address?.state || '—'}
                    </span>
                  </div>
                </div>

                {/* Meta */}
                <div className="acs-ccard__meta">
                  <div className="acs-ccard__joined"><CalendarDays size={11} />{fmtDate(c.createdAt)}</div>
                  <span className="acs-badge acs-badge--active"><span className="acs-badge__dot" />Active</span>
                </div>

                {/* Actions */}
                <div className="acs-ccard__actions">
                  <button className="acs-act-btn acs-act-btn--blue" title="View Details" onClick={() => fetchCustomerDetails(c._id)}><Eye size={14} /></button>
                  <button className="acs-act-btn acs-act-btn--red" title="Delete Customer" onClick={() => handleDelete(c._id, c.name)}><Trash2 size={14} /></button>
                </div>

              </div>
            )) : (
              <div className="acs-empty">
                <div className="acs-empty__icon"><Users size={32} color="#cbd5e1" /></div>
                <div className="acs-empty__title">No customers found</div>
                <div className="acs-empty__sub">
                  {searchQuery ? 'Try a different search or clear filters.' : 'No customers registered yet.'}
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="acs-pagination">
              <span className="acs-pagination__info">
                Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
              </span>
              <div className="acs-pagination__btns">
                <button className="acs-pg-btn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft size={13} /></button>
                <button className="acs-pg-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft size={13} /></button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let p;
                  if (totalPages <= 7)                  { p = i + 1; }
                  else if (currentPage <= 4)             { p = i + 1; if (i === 6) p = totalPages; }
                  else if (currentPage >= totalPages - 3){ p = totalPages - 6 + i; }
                  else { p = [1, currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2, totalPages][i]; }
                  return (
                    <button
                      key={i}
                      className={`acs-pg-btn ${p === currentPage ? 'acs-pg-btn--active' : ''}`}
                      onClick={() => setCurrentPage(p)}
                    >{p}</button>
                  );
                })}
                <button className="acs-pg-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight size={13} /></button>
                <button className="acs-pg-btn" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}><ChevronsRight size={13} /></button>
              </div>
            </div>
          )}
        </div>

        {/* ══ CUSTOMER DETAIL MODAL ═══════════════════════════════ */}
        {selectedCustomer && createPortal(
          <div className="acs-overlay" onClick={() => { setSelectedCustomer(null); setCustomerOrders([]); }}>
            <div className="acs-modal" onClick={e => e.stopPropagation()}>

              {/* ── HEADER ── */}
              <div className="acs-modal__head">
                <div className="acs-modal__head-bg" />
                <div className="acs-modal__avatar" style={{ background: avatarColor(selectedCustomer.name) }}>
                  {initials(selectedCustomer.name)}
                </div>
                <div className="acs-modal__meta">
                  <h2 className="acs-modal__name">{selectedCustomer.name}</h2>
                  <div className="acs-modal__meta-row">
                    <span className="acs-badge acs-badge--active"><span className="acs-badge__dot" />Active</span>
                    <span className="acs-modal__sep">•</span>
                    <span className="acs-modal__id">ID #{selectedCustomer._id.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="acs-modal__hstats">
                    <div className="acs-modal__hstat">
                      <span className="acs-modal__hstat-val">{customerOrders.length}</span>
                      <span className="acs-modal__hstat-lbl">Orders</span>
                    </div>
                    <div className="acs-modal__hstat-div" />
                    <div className="acs-modal__hstat">
                      <span className="acs-modal__hstat-val">{fmtDate(selectedCustomer.createdAt)}</span>
                      <span className="acs-modal__hstat-lbl">Member Since</span>
                    </div>
                  </div>
                </div>
                <button className="acs-modal__close" onClick={() => { setSelectedCustomer(null); setCustomerOrders([]); }}>
                  <X size={14} />
                </button>
              </div>

              {/* ── BODY ── */}
              <div className="acs-modal__body">

                {/* Personal Info */}
                <div className="acs-modal__section">
                  <div className="acs-modal__section-head">
                    <div className="acs-modal__sicon acs-modal__sicon--blue"><Mail size={11} /></div>
                    <span>Personal Information</span>
                  </div>
                  <div className="acs-info-grid">
                    {[
                      { label: 'Full Name',    value: selectedCustomer.name },
                      { label: 'Email',        value: selectedCustomer.email },
                      { label: 'Phone',        value: selectedCustomer.phone || '—' },
                      { label: 'Member Since', value: fmtDate(selectedCustomer.createdAt) },
                    ].map((f, i) => (
                      <div className="acs-info-item" key={i}>
                        <span className="acs-info-item__label">{f.label}</span>
                        <span className="acs-info-item__value">{f.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Address Info */}
                <div className="acs-modal__section">
                  <div className="acs-modal__section-head">
                    <div className="acs-modal__sicon acs-modal__sicon--green"><MapPin size={11} /></div>
                    <span>Address Information</span>
                  </div>
                  <div className="acs-info-grid">
                    {[
                      { label: 'Street',   value: selectedCustomer.address?.street  || '—' },
                      { label: 'City',     value: selectedCustomer.address?.city    || '—' },
                      { label: 'State',    value: selectedCustomer.address?.state   || '—' },
                      { label: 'PIN Code', value: selectedCustomer.address?.zipCode || '—' },
                    ].map((f, i) => (
                      <div className="acs-info-item" key={i}>
                        <span className="acs-info-item__label">{f.label}</span>
                        <span className="acs-info-item__value">{f.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order History */}
                <div className="acs-modal__section acs-modal__section--last">
                  <div className="acs-modal__section-head">
                    <div className="acs-modal__sicon acs-modal__sicon--purple"><Package size={11} /></div>
                    <span>Order History</span>
                    <span className="acs-modal__section-badge">{customerOrders.length}</span>
                  </div>
                  {customerOrders.length === 0 ? (
                    <div className="acs-modal__empty">
                      <Package size={28} color="#cbd5e1" />
                      <span>No orders placed yet</span>
                    </div>
                  ) : (
                    <div className="acs-orders-scroll">
                      <div className="acs-orders">
                        {customerOrders.map(order => (
                          <div className="acs-order" key={order._id}>
                            <div className="acs-order__icon"><Package size={13} color="#2563eb" /></div>
                            <div className="acs-order__info">
                              <div className="acs-order__num">#{order.orderNumber}</div>
                              <div className="acs-order__date">{fmtDate(order.createdAt)}</div>
                            </div>
                            <div className="acs-order__amt">{fmtAmt(order.totalAmount || order.totalPrice)}</div>
                            <span className={`acs-order__status border ${osMeta(order.orderStatus)}`}>
                              {order.orderStatus}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* ── FOOTER ── */}
              <div className="acs-modal__foot">
                <button
                  className="acs-modal__del"
                  onClick={() => { handleDelete(selectedCustomer._id, selectedCustomer.name); setSelectedCustomer(null); setCustomerOrders([]); }}
                >
                  <Trash2 size={14} /> Delete Customer
                </button>
                <button className="acs-modal__close-btn" onClick={() => { setSelectedCustomer(null); setCustomerOrders([]); }}>
                  Close
                </button>
              </div>

            </div>
          </div>,
          document.body
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminCustomers;
