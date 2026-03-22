import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import userNotificationApi from '../services/userNotificationApi';
import './UserNotificationBell.css';

// ─── Bell SVG ────────────────────────────────────────────────────────────────
const BellIcon = ({ hasUnread }) => (
  <svg
    className={`notif-bell-svg ${hasUnread ? 'notif-bell-ring' : ''}`}
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill={hasUnread ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

// ─── Type config ─────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  order: {
    label: 'Order',
    color: '#2563eb',
    bg: '#dbeafe',
    emoji: '📦',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  product: {
    label: 'Product',
    color: '#7c3aed',
    bg: '#ede9fe',
    emoji: '🛒',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
  },
  offer: {
    label: 'Offer',
    color: '#d97706',
    bg: '#fef3c7',
    emoji: '🏷️',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
  payment: {
    label: 'Payment',
    color: '#059669',
    bg: '#d1fae5',
    emoji: '💳',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  refund: {
    label: 'Refund',
    color: '#dc2626',
    bg: '#fee2e2',
    emoji: '💰',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
      </svg>
    ),
  },
  account: {
    label: 'Account',
    color: '#475569',
    bg: '#f1f5f9',
    emoji: '👤',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  shipping: {
    label: 'Shipping',
    color: '#0891b2',
    bg: '#cffafe',
    emoji: '🚚',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ─── Component ────────────────────────────────────────────────────────────────

const POLL_INTERVAL = 30000; // 30 seconds

const hasCustomerToken = () => !!localStorage.getItem('token');

export default function UserNotificationBell() {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const dropdownRef = useRef(null);
  const pollRef = useRef(null);
  const modalRef = useRef(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalFilter, setModalFilter] = useState('all');

  // ── Fetch full list (used when dropdown opens) ────────────────────────────
  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    if (!isAuthenticated || !hasCustomerToken()) return;
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const timestamp = Date.now();
      const data = await userNotificationApi.getNotifications(pageNum, 20, timestamp);
      
      console.log('Notification Fetch Data:', data);
      
      if (data && data.success) {
        const newNotifs = Array.isArray(data.notifications) ? data.notifications : [];
        setNotifications((prev) =>
          append ? [...prev, ...newNotifs] : newNotifs
        );
        if (data.unreadCount !== undefined) setUnreadCount(data.unreadCount);
        setHasMore(pageNum < (data.pages || 1));
        setPage(pageNum);
      } else {
        console.warn('Notification fetch returned unsuccessful data:', data);
      }
    } catch (err) {
      console.error('Error fetching user notifications:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [isAuthenticated]);

  // ── Poll unread count only (lightweight) ─────────────────────────────────
  const pollUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !hasCustomerToken()) return;
    try {
      const data = await userNotificationApi.getUnreadCount();
      if (data.success) setUnreadCount(data.unreadCount);
    } catch (err) {
      if (err?.response?.status === 401) {
        setUnreadCount(0);
      }
      // silent
    }
  }, [isAuthenticated]);

  // Start polling on mount
  useEffect(() => {
    if (!isAuthenticated || !hasCustomerToken()) return;
    pollUnreadCount();
    pollRef.current = setInterval(pollUnreadCount, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [isAuthenticated, pollUnreadCount]);

  // Refresh immediately when an order is placed anywhere in the app
  useEffect(() => {
    const handler = () => {
      pollUnreadCount();
      if (open) fetchNotifications(1, false);
    };
    window.addEventListener('order-placed', handler);
    return () => window.removeEventListener('order-placed', handler);
  }, [pollUnreadCount, fetchNotifications, open]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (modalOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [modalOpen]);

  // Close modal on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setModalOpen(false); };
    if (modalOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [modalOpen]);

  // Load full list when dropdown opens
  useEffect(() => {
    if (open) fetchNotifications(1, false);
  }, [open, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      const data = await userNotificationApi.markAsRead(id);
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(data.unreadCount);
      }
    } catch { /* silent */ }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await userNotificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const handleClearAll = async () => {
    try {
      await userNotificationApi.clearAll();
      setNotifications([]);
      setUnreadCount(0);
      setHasMore(false);
    } catch { /* silent */ }
  };

  const handleDeleteOne = async (e, id) => {
    e.stopPropagation();
    try {
      const data = await userNotificationApi.deleteOne(id);
      if (data.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        setUnreadCount(data.unreadCount);
      }
    } catch { /* silent */ }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        const data = await userNotificationApi.markAsRead(notif._id);
        if (data.success) {
          setNotifications((prev) =>
            prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
          );
          setUnreadCount(data.unreadCount);
        }
      } catch { /* silent */ }
    }
    setOpen(false);
    if (notif.actionUrl) navigate(notif.actionUrl);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) fetchNotifications(page + 1, true);
  };

  // ── Don't render for guests ───────────────────────────────────────────────
  if (!isAuthenticated) return null;

  const cfg = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.account;

  const MODAL_CATEGORIES = [
    { key: 'all',      label: 'All' },
    { key: 'order',    label: 'Orders' },
    { key: 'shipping', label: 'Shipping' },
    { key: 'offer',    label: 'Offers' },
    { key: 'product',  label: 'Product Updates' },
  ];

  const filteredNotifs = modalFilter === 'all'
    ? notifications
    : notifications.filter((n) => n.type === modalFilter);

  return (
    <div className="notif-bell-wrapper" ref={dropdownRef}>

      {/* ── Bell Button ─────────────────────────────── */}
      <button
        className={`notif-bell-btn ${open ? 'notif-bell-btn--open' : ''}`}
        onClick={() => setOpen((p) => !p)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        title="Notifications"
      >
        <div className="notif-bell-icon-wrap">
          <div className="notif-bell-icon-bg">
            <BellIcon hasUnread={unreadCount > 0} />
          </div>
          {unreadCount > 0 && (
            <span className="notif-badge" key={unreadCount}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </button>

      {/* ── Dropdown ────────────────────────────────── */}
      {open && (
        <div className="notif-dropdown" role="dialog" aria-label="Notifications">

          {/* Caret arrow */}
          <div className="notif-caret" aria-hidden="true" />

          {/* Header */}
          <div className="notif-header">
            <div className="notif-header-left">
              <div className="notif-header-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h3 className="notif-header-title">Notifications</h3>
                <p className="notif-header-sub">
                  {unreadCount > 0
                    ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                    : 'You\'re all caught up'}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <span className="notif-count-pill">{unreadCount}</span>
            )}
          </div>

          {/* Action bar */}
          {notifications.length > 0 && (
            <div className="notif-action-bar">
              {unreadCount > 0 && (
                <button className="notif-bar-btn" onClick={handleMarkAllAsRead}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Mark all as read
                </button>
              )}
              <button className="notif-bar-btn notif-bar-btn--danger" onClick={handleClearAll}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                </svg>
                Clear all
              </button>
            </div>
          )}

          {/* Body */}
          <div className="notif-body">
            {loading ? (
              <div className="notif-state-box">
                <div className="notif-spinner" />
                <p className="notif-state-primary">Loading notifications…</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notif-state-box">
                <div className="notif-empty-illo">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#c7d2fe" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <p className="notif-state-primary">No new notifications</p>
                <p className="notif-state-secondary">We'll notify you when something arrives</p>
              </div>
            ) : (
              <>
                {notifications.map((notif) => {
                  const { icon, color, bg, label } = cfg(notif.type);
                  return (
                    <div
                      key={notif._id}
                      className={`notif-item ${!notif.isRead ? 'notif-item--unread' : ''}`}
                      onClick={() => handleNotificationClick(notif)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(notif)}
                    >
                      {/* Unread left bar */}
                      {!notif.isRead && <span className="notif-item-bar" />}

                      {/* Icon bubble */}
                      <div className="notif-item-bubble" style={{ background: bg, color }}>
                        {icon}
                      </div>

                      {/* Content */}
                      <div className="notif-item-body">
                        <div className="notif-item-top">
                          <span className="notif-item-type-chip" style={{ color, background: bg }}>
                            {label}
                          </span>
                          <span className="notif-item-time">{timeAgo(notif.createdAt)}</span>
                        </div>
                        <p className="notif-item-title">{notif.title}</p>
                        <p className="notif-item-message">&ldquo;{notif.message}&rdquo;</p>
                      </div>

                      {/* Side controls */}
                      <div className="notif-item-controls">
                        {!notif.isRead && (
                          <button
                            className="notif-unread-dot"
                            onClick={(e) => handleMarkAsRead(e, notif._id)}
                            title="Mark as read"
                            aria-label="Mark as read"
                          />
                        )}
                        <button
                          className="notif-dismiss-btn"
                          onClick={(e) => handleDeleteOne(e, notif._id)}
                          title="Dismiss"
                          aria-label="Dismiss notification"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {hasMore && (
                  <button
                    className="notif-load-more"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading…' : 'Show older notifications'}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="notif-footer">
            <button
              className="notif-footer-btn"
              onClick={() => { setOpen(false); setModalFilter('all'); setModalOpen(true); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              View All Notifications
            </button>
          </div>

        </div>
      )}

      {/* ── Full Notifications Modal ──────────────────────────────────────── */}
      {modalOpen && createPortal(
        <div
          className="notif-modal-overlay"
          onClick={(e) => { if (!modalRef.current?.contains(e.target)) setModalOpen(false); }}
          aria-modal="true"
          role="presentation"
        >
          <div className="notif-modal" ref={modalRef} role="dialog" aria-label="All Notifications">

            {/* Modal Header */}
            <div className="notif-modal-header">
              <div className="notif-modal-header-left">
                <div className="notif-modal-header-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <div>
                  <h2 className="notif-modal-title">All Notifications</h2>
                  <p className="notif-modal-subtitle">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                  </p>
                </div>
              </div>
              <div className="notif-modal-header-btns">
                {unreadCount > 0 && (
                  <button
                    className="notif-modal-btn notif-modal-btn--mark"
                    onClick={handleMarkAllAsRead}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Mark all read
                  </button>
                )}
                <button
                  className="notif-modal-btn notif-modal-btn--clear"
                  onClick={handleClearAll}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                  Clear all
                </button>
                <button
                  className="notif-modal-close"
                  onClick={() => setModalOpen(false)}
                  aria-label="Close notifications"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="notif-modal-tabs" role="tablist">
              {MODAL_CATEGORIES.map(({ key, label }) => {
                const count = key === 'all'
                  ? notifications.length
                  : notifications.filter((n) => n.type === key).length;
                return (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={modalFilter === key}
                    className={`notif-modal-tab ${modalFilter === key ? 'notif-modal-tab--active' : ''}`}
                    onClick={() => setModalFilter(key)}
                  >
                    {label}
                    {count > 0 && (
                      <span className="notif-modal-tab-badge">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className="notif-modal-body">
              {loading ? (
                <div className="notif-state-box">
                  <div className="notif-spinner" />
                  <p className="notif-state-primary">Loading notifications…</p>
                </div>
              ) : filteredNotifs.length === 0 ? (
                <div className="notif-state-box">
                  <div className="notif-empty-illo">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#c7d2fe" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  <p className="notif-state-primary">No notifications</p>
                  <p className="notif-state-secondary">
                    {modalFilter === 'all' ? "We'll notify you when something arrives" : `No ${MODAL_CATEGORIES.find(c => c.key === modalFilter)?.label ?? ''} notifications`}
                  </p>
                </div>
              ) : (
                <>
                  {filteredNotifs.map((notif) => {
                    const { icon, color, bg, label, emoji } = cfg(notif.type);
                    return (
                      <div
                        key={notif._id}
                        className={`notif-modal-item ${!notif.isRead ? 'notif-modal-item--unread' : ''}`}
                        onClick={() => { handleNotificationClick(notif); setModalOpen(false); }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { handleNotificationClick(notif); setModalOpen(false); }
                        }}
                      >
                        {/* Unread left accent bar */}
                        {!notif.isRead && <span className="notif-item-bar" />}

                        {/* Icon bubble */}
                        <div className="notif-item-bubble" style={{ background: bg, color }}>
                          {icon}
                        </div>

                        {/* Content */}
                        <div className="notif-item-body">
                          <div className="notif-item-top">
                            <span className="notif-item-type-chip" style={{ color, background: bg }}>
                              {emoji} {label}
                            </span>
                            {!notif.isRead && (
                              <span className="notif-modal-unread-dot" title="Unread" />
                            )}
                            <span className="notif-item-time">{timeAgo(notif.createdAt)}</span>
                          </div>
                          <p className="notif-item-title">{notif.title}</p>
                          <p className="notif-modal-item-msg">{notif.message}</p>
                        </div>

                        {/* Controls */}
                        <div className="notif-item-controls">
                          {!notif.isRead && (
                            <button
                              className="notif-unread-dot"
                              onClick={(e) => handleMarkAsRead(e, notif._id)}
                              title="Mark as read"
                              aria-label="Mark as read"
                            />
                          )}
                          <button
                            className="notif-dismiss-btn"
                            onClick={(e) => handleDeleteOne(e, notif._id)}
                            title="Dismiss"
                            aria-label="Dismiss notification"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {hasMore && (
                    <button
                      className="notif-load-more"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? 'Loading…' : 'Show older notifications'}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="notif-modal-footer">
              <button
                className="notif-modal-footer-btn"
                onClick={() => setModalOpen(false)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                View All Notifications
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
