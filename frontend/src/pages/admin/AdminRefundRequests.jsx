import { useState, useEffect, useMemo, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import DashboardSkeleton from '../../components/DashboardSkeleton';
import useAdminLoader from '../../hooks/useAdminLoader';
import { useToast } from '../../hooks/useToast';
import API from '../../services/api';
import './AdminRefundRequests.css';

const REASON_LABELS = {
  defective: 'Defective Product',
  damaged: 'Damaged on Arrival',
  'wrong-item': 'Wrong Item Received',
  'poor-quality': 'Poor Quality',
  'changed-mind': 'Changed Mind',
  other: 'Other',
};

const TAB_KEYS = {
  RETURNS: 'returns',
  REFUNDS: 'refunds',
};

const StatusBadge = ({ status }) => {
  const normalized = String(status || '').toLowerCase();
  const mapped = normalized === 'pending' || normalized === 'in-progress' ? 'new' : normalized;
  const label = mapped === 'new' ? 'Pending' : mapped.charAt(0).toUpperCase() + mapped.slice(1).replace('-', ' ');
  return (
    <span className={`rr-status-badge rr-status-${mapped}`}>
      <span className="rr-status-dot" aria-hidden="true"></span>
      {label}
    </span>
  );
};

const PaymentBadge = ({ paymentStatus }) => {
  const normalized = String(paymentStatus || '').toLowerCase();
  if (!normalized) {
    return <span className="rr-payment-badge rr-payment-unknown">N/A</span>;
  }

  return (
    <span className={`rr-payment-badge ${normalized === 'paid' ? 'rr-payment-paid' : 'rr-payment-other'}`}>
      {normalized === 'paid' ? 'PAID' : normalized.toUpperCase()}
    </span>
  );
};

const StatsCard = ({ icon, label, value, tone = 'blue' }) => (
  <div className={`rr-stat-card rr-stat-card-modern rr-stat-${tone}`}>
    <span className="rr-stat-icon" aria-hidden="true">{icon}</span>
    <div>
      <span className="rr-stat-label">{label}</span>
      <strong className="rr-stat-value">{value}</strong>
    </div>
  </div>
);

const StatsCarousel = ({ stats }) => (
  <div className="rr-stats-carousel" role="region" aria-label="Return and refund overview">
    <StatsCard
      icon={(
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      )}
      label="Total Returns"
      value={stats.totalReturns}
      tone="blue"
    />
    <StatsCard
      icon={(
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )}
      label="Pending Returns"
      value={stats.pendingReturns}
      tone="amber"
    />
    <StatsCard
      icon={(
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      )}
      label="Total Refunds"
      value={stats.totalRefunds}
      tone="green"
    />
    <StatsCard
      icon={(
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
      )}
      label="Pending Refunds"
      value={stats.pendingRefunds}
      tone="purple"
    />
  </div>
);

const FilterBar = ({
  searchQuery,
  onSearch,
  statusFilter,
  statusOptions,
  onStatus,
  fromDate,
  toDate,
  onFromDate,
  onToDate,
  onClear,
}) => (
  <div className="rr-toolbar rr-toolbar-sticky">
    <div className="rr-search-box">
      <span className="rr-search-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7"></circle>
          <line x1="20" y1="20" x2="16.65" y2="16.65"></line>
        </svg>
      </span>
      <input
        type="text"
        placeholder="Search by Order ID or Customer"
        value={searchQuery}
        onChange={(e) => onSearch(e.target.value)}
        className="rr-search-input"
      />
      {searchQuery && (
        <button className="rr-search-clear" onClick={() => onSearch('')} aria-label="Clear search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}
    </div>

    <div className="rr-status-tabs rr-status-pills">
      {statusOptions.map((status) => (
        <button
          key={status}
          className={`rr-tab ${statusFilter === status ? 'active' : ''}`}
          onClick={() => onStatus(status)}
        >
          {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
        </button>
      ))}
    </div>

    <div className="rr-date-filters">
      <input type="date" className="rr-date-input" value={fromDate} onChange={(e) => onFromDate(e.target.value)} />
      <input type="date" className="rr-date-input" value={toDate} onChange={(e) => onToDate(e.target.value)} />
      <button className="rr-clear-btn" onClick={onClear}>Clear</button>
    </div>
  </div>
);

const ActionHoverMenu = ({
  status,
  canReply,
  hasNewMessage,
  loadingApprove,
  loadingReject,
  onView,
  onReply,
  onApprove,
  onReject,
}) => {
  const normalized = String(status || '').toLowerCase();
  const isApprovedLike = ['approved', 'completed'].includes(normalized);
  const isRejected = normalized === 'rejected';

  return (
    <div className="rr-action-buttons" role="toolbar" aria-label="Request actions">
      <button className="rr-action-btn rr-action-view" title="View" onClick={onView}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>
      <button
        className={`rr-action-btn rr-action-reply ${hasNewMessage ? 'rr-action-has-dot' : ''}`}
        title={canReply ? 'Reply' : 'Reply unavailable'}
        onClick={onReply}
        disabled={!canReply}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </button>
      <button
        className="rr-action-btn rr-action-approve"
        title="Approve"
        onClick={onApprove}
        disabled={isApprovedLike || isRejected || loadingApprove}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
      </button>
      <button
        className="rr-action-btn rr-action-reject"
        title="Reject"
        onClick={onReject}
        disabled={isApprovedLike || isRejected || loadingReject}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
};

const ReturnCard = ({
  type,
  entry,
  actionLoading,
  onViewReturn,
  onViewRefund,
  onOpenWhatsApp,
  onOpenChat,
  onApproveReturn,
  onRejectReturn,
  onApproveRefund,
  onRejectRefund,
}) => {
  const isReturn = type === TAB_KEYS.RETURNS;
  const phoneMeta = normalizeIndianPhone(isReturn ? entry.phone : entry.customerPhone);
  const canUseWhatsApp = phoneMeta.hasValue && phoneMeta.isValid;
  const hasNewMessage = entry.lastMessageSender === 'USER';
  const statusValue = isReturn ? entry.normalizedStatus : entry.refundStatus;
  const reasonText = isReturn ? entry.returnReason : (REASON_LABELS[entry.reason] || entry.reason || 'N/A');
  const conditionTag = isReturn ? entry.conditionLabel : entry.typeLabel;
  const productText = isReturn ? entry.productLabel : (entry.product || 'N/A');
  const mailText = isReturn ? (entry.email || 'N/A') : (entry.customerEmail || 'N/A');
  const customerText = isReturn ? entry.customerName : (entry.customerName || 'Customer');

  if (isReturn) {
    return (
      <article className={`rr-request-card ${entry.normalizedStatus === 'pending' ? 'rr-row-new' : ''}`}>
        <div className="rr-card-main">
          <div className="rr-card-top">
            <span className="rr-order-id">{entry.orderId ? `#${entry.orderId}` : '—'}</span>
            <div className="rr-card-meta-right">
              <span className="rr-card-date">{formatDate(entry.createdAt)}</span>
              <StatusBadge status={statusValue} />
            </div>
          </div>

          <div className="rr-card-grid">
            <div className="rr-card-col">
              <span className="rr-card-label">Customer</span>
              <div className="rr-customer">
                <span className="rr-customer-name">{customerText}</span>
                <span className="rr-customer-email">{mailText}</span>
              </div>
            </div>

            <div className="rr-card-col">
              <span className="rr-card-label">Product</span>
              <p className="rr-card-value">{productText}</p>
            </div>

            <div className="rr-card-col rr-card-col-wide">
              <span className="rr-card-label">Reason</span>
              <p className="rr-card-value rr-card-reason">{reasonText}</p>
            </div>

            <div className="rr-card-col rr-card-tags-col">
              <span className="rr-card-label">Tags</span>
              <div className="rr-card-tags">
                <span className="rr-category-pill">{conditionTag}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rr-card-actions-wrap">
          <ActionHoverMenu
            status={entry.normalizedStatus}
            canReply={canUseWhatsApp}
            hasNewMessage={hasNewMessage}
            loadingApprove={actionLoading === `return-${entry.returnId}-approved`}
            loadingReject={actionLoading === `return-${entry.returnId}-rejected`}
            onView={() => onViewReturn(entry)}
            onReply={() => onOpenWhatsApp(TAB_KEYS.RETURNS, entry)}
            onApprove={() => onApproveReturn(entry.returnId)}
            onReject={() => onRejectReturn(entry.returnId)}
          />
        </div>
      </article>
    );
  }

  return (
    <article className={`rr-request-card ${entry.refundStatus === 'pending' ? 'rr-row-new' : ''}`}>
      <div className="rr-card-main">
        <div className="rr-card-top">
          <span className="rr-order-id">{entry.orderId ? `#${entry.orderId}` : '—'}</span>
          <div className="rr-card-meta-right">
            <span className="rr-card-date">{formatDate(entry.createdAt)}</span>
            <StatusBadge status={statusValue} />
          </div>
        </div>

        <div className="rr-card-grid">
          <div className="rr-card-col">
            <span className="rr-card-label">Customer</span>
            <div className="rr-customer">
              <span className="rr-customer-name">{customerText}</span>
              <span className="rr-customer-email">{mailText}</span>
            </div>
          </div>

          <div className="rr-card-col">
            <span className="rr-card-label">Product</span>
            <p className="rr-card-value">{productText}</p>
          </div>

          <div className="rr-card-col rr-card-col-wide">
            <span className="rr-card-label">Reason</span>
            <p className="rr-card-value rr-card-reason">{reasonText}</p>
          </div>

          <div className="rr-card-col rr-card-tags-col">
            <span className="rr-card-label">Tags</span>
            <div className="rr-card-tags rr-card-tags-refund">
              <span className="rr-category-pill">{conditionTag}</span>
              <PaymentBadge paymentStatus={entry.paymentStatus} />
              {String(entry.paymentMethod || '').trim() && (
                <span className="rr-payment-note">{String(entry.paymentMethod)}</span>
              )}
              <span className="rr-refund-amount">{typeof entry.amount === 'number' ? `Rs ${entry.amount.toLocaleString('en-IN')}` : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rr-card-actions-wrap">
        <ActionHoverMenu
          status={entry.refundStatus}
          canReply={true}
          hasNewMessage={hasNewMessage}
          loadingApprove={actionLoading === `refund-${entry.refundId}-approved`}
          loadingReject={actionLoading === `refund-${entry.refundId}-rejected`}
          onView={() => onViewRefund(entry)}
          onReply={() => onOpenChat(entry)}
          onApprove={() => onApproveRefund(entry.refundId)}
          onReject={() => onRejectRefund(entry.refundId)}
        />
      </div>
    </article>
  );
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const normalizeIndianPhone = (phone) => {
  const raw = String(phone || '').trim();
  if (!raw) {
    return { hasValue: false, isValid: false, formatted: '', digits: '' };
  }

  let digits = raw.replace(/\D/g, '');

  if (raw.startsWith('+91')) {
    digits = digits.startsWith('91') ? digits : `91${digits}`;
  } else if (digits.length === 10) {
    digits = `91${digits}`;
  } else if (!digits.startsWith('91')) {
    digits = `91${digits}`;
  }

  const isValid = /^91\d{10}$/.test(digits);
  return {
    hasValue: true,
    isValid,
    formatted: isValid ? `+${digits}` : '',
    digits: isValid ? digits : '',
  };
};

const getAutoFillMessageByStatus = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'approved' || normalized === 'completed') {
    return 'Your request has been approved.';
  }
  if (normalized === 'rejected') {
    return 'Your request has been rejected.';
  }
  return 'Your request is currently being processed.';
};

const getStatusLabel = (status) => {
  const raw = String(status || '').toLowerCase();
  if (raw === 'approved' || raw === 'completed') return 'Approved';
  if (raw === 'rejected') return 'Rejected';
  return 'Processing';
};

const buildWhatsAppTemplate = ({ customerName, orderId, adminMessage, status }) => {
  const safeName = customerName || 'Customer';
  const safeOrder = orderId || 'N/A';
  const safeMessage = String(adminMessage || '').trim();
  const statusLabel = getStatusLabel(status);

  return `Hello ${safeName},\n\nRegarding your order (#${safeOrder}),\n\n${safeMessage}\n\nStatus: ${statusLabel}\n\nThank you,\nMani Electrical`;
};

const isWithinDateRange = (date, fromDate, toDate) => {
  if (!fromDate && !toDate) return true;
  const current = new Date(date);
  if (Number.isNaN(current.getTime())) return false;

  if (fromDate) {
    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);
    if (current < from) return false;
  }

  if (toDate) {
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);
    if (current > to) return false;
  }

  return true;
};

const AdminRefundRequests = () => {
  const [activeTab, setActiveTab] = useState(TAB_KEYS.RETURNS);
  const [returns, setReturns] = useState([]);
  const [refunds, setRefunds] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [selectedReturn, setSelectedReturn] = useState(null);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [actionLoading, setActionLoading] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const [chatModal, setChatModal] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatText, setChatText] = useState('');
  const [chatStatus, setChatStatus] = useState('pending');
  const [chatSending, setChatSending] = useState(false);

  const [whatsAppModal, setWhatsAppModal] = useState(null);
  const [whatsAppMessage, setWhatsAppMessage] = useState('');
  const [whatsAppStatus, setWhatsAppStatus] = useState('pending');
  const [whatsAppSending, setWhatsAppSending] = useState(false);

  const { loading, run } = useAdminLoader();
  const { success, error: toastError } = useToast();

  const loadData = useCallback(async () => {
    try {
      const [returnsRes, refundsRes] = await Promise.all([
        API.get('/returns'),
        API.get('/refunds'),
      ]);

      if (returnsRes.data?.success) {
        setReturns(returnsRes.data.returns || []);
      }

      if (refundsRes.data?.success) {
        setRefunds(refundsRes.data.refunds || []);
      }
    } catch (error) {
      toastError('Failed to load returns and refunds.');
    }
  }, []);

  useEffect(() => {
    run(loadData);
  }, []);

  const returnStatusOptions = ['all', 'pending', 'approved', 'rejected'];
  const refundStatusOptions = ['all', 'pending', 'approved', 'rejected'];
  const currentStatusOptions = activeTab === TAB_KEYS.RETURNS ? returnStatusOptions : refundStatusOptions;

  const normalizedReturns = useMemo(
    () =>
      returns.map((entry) => ({
        ...entry,
        normalizedStatus: ['new', 'in-progress', 'pending'].includes(String(entry.status || '').toLowerCase())
          ? 'pending'
          : String(entry.status || '').toLowerCase(),
        returnReason: String(entry.message || '').trim() || (REASON_LABELS[entry.reason] || entry.reason || 'N/A'),
        conditionLabel: REASON_LABELS[entry.reason] || entry.reason || 'N/A',
        productLabel: entry.product || entry.category || 'N/A',
        customerName: entry.name || 'Customer',
      })),
    [returns]
  );

  const filteredReturns = useMemo(() => {
    let list = [...normalizedReturns];
    if (statusFilter !== 'all') {
      list = list.filter((entry) => entry.normalizedStatus === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((entry) =>
        String(entry.orderId || '').toLowerCase().includes(q) ||
        String(entry.customerName || '').toLowerCase().includes(q)
      );
    }

    list = list.filter((entry) => isWithinDateRange(entry.createdAt, fromDate, toDate));
    return list;
  }, [normalizedReturns, statusFilter, searchQuery, fromDate, toDate]);

  const filteredRefunds = useMemo(() => {
    let list = [...refunds];

    if (statusFilter !== 'all') {
      list = list.filter((entry) => String(entry.refundStatus || '').toLowerCase() === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((entry) =>
        String(entry.orderId || '').toLowerCase().includes(q) ||
        String(entry.customerName || '').toLowerCase().includes(q)
      );
    }

    list = list.filter((entry) => isWithinDateRange(entry.createdAt, fromDate, toDate));
    return list;
  }, [refunds, statusFilter, searchQuery, fromDate, toDate]);

  const stats = useMemo(() => ({
    totalReturns: normalizedReturns.length,
    pendingReturns: normalizedReturns.filter((entry) => entry.normalizedStatus === 'pending').length,
    totalRefunds: refunds.length,
    pendingRefunds: refunds.filter((entry) => String(entry.refundStatus || '').toLowerCase() === 'pending').length,
  }), [normalizedReturns, refunds]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setFromDate('');
    setToDate('');
  };

  const openReturnDetail = (entry) => {
    setSelectedReturn(entry);
    setAdminNotes(entry.adminNotes || '');
  };

  const closeReturnDetail = () => {
    setSelectedReturn(null);
    setAdminNotes('');
  };

  const openRefundDetail = (entry) => {
    setSelectedRefund(entry);
    setAdminNotes(entry.adminNotes || '');
  };

  const closeRefundDetail = () => {
    setSelectedRefund(null);
    setAdminNotes('');
  };

  const notifyMissingPhone = () => {
    window.alert('Customer phone number not available');
    toastError('Customer phone number not available');
  };

  const openWhatsAppModal = (section, entry) => {
    const phone = section === TAB_KEYS.RETURNS ? entry.phone : entry.customerPhone;
    const normalizedPhone = normalizeIndianPhone(phone);
    if (!normalizedPhone.hasValue) {
      notifyMissingPhone();
      return;
    }

    if (!normalizedPhone.isValid) {
      toastError('Invalid phone number');
      return;
    }

    const baseStatus = section === TAB_KEYS.RETURNS ? entry.normalizedStatus : entry.refundStatus;
    const suggestedMessage = getAutoFillMessageByStatus(baseStatus);

    setWhatsAppModal({
      section,
      customerName: section === TAB_KEYS.RETURNS ? entry.customerName : (entry.customerName || 'Customer'),
      phone: normalizedPhone.formatted,
      phoneDigits: normalizedPhone.digits,
      orderId: entry.orderId,
      returnId: entry.returnId,
      refundId: entry.refundId,
    });
    setWhatsAppStatus(section === TAB_KEYS.RETURNS ? entry.normalizedStatus : entry.refundStatus);
    setWhatsAppMessage(suggestedMessage);
  };

  const closeWhatsAppModal = () => {
    setWhatsAppModal(null);
    setWhatsAppMessage('');
    setWhatsAppStatus('pending');
    setWhatsAppSending(false);
  };

  const sendWhatsAppMessage = ({ phone, customerName, orderId, adminMessage, status }) => {
    const normalizedPhone = normalizeIndianPhone(phone);
    if (!normalizedPhone.hasValue) {
      notifyMissingPhone();
      return false;
    }

    if (!normalizedPhone.isValid) {
      toastError('Invalid phone number');
      return false;
    }

    const text = buildWhatsAppTemplate({
      customerName,
      orderId,
      adminMessage,
      status,
    });

    const waUrl = `https://wa.me/${normalizedPhone.digits}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    success('Message opened in WhatsApp');
    return true;
  };

  const triggerStatusWhatsApp = ({ section, entry, nextStatus }) => {
    const phone = section === TAB_KEYS.RETURNS ? entry.phone : entry.customerPhone;
    const customerName = section === TAB_KEYS.RETURNS ? entry.customerName : (entry.customerName || 'Customer');
    sendWhatsAppMessage({
      phone,
      customerName,
      orderId: entry.orderId,
      adminMessage: getAutoFillMessageByStatus(nextStatus),
      status: nextStatus,
    });
  };

  const whatsAppPreview = useMemo(() => {
    if (!whatsAppModal) return '';
    return buildWhatsAppTemplate({
      customerName: whatsAppModal.customerName,
      orderId: whatsAppModal.orderId,
      adminMessage: whatsAppMessage,
      status: whatsAppStatus,
    });
  }, [whatsAppModal, whatsAppMessage, whatsAppStatus]);

  const copyWhatsAppPreview = async () => {
    if (!whatsAppPreview.trim()) return;
    try {
      await navigator.clipboard.writeText(whatsAppPreview);
      success('Message copied');
    } catch (error) {
      toastError('Unable to copy message');
    }
  };

  const handleReturnStatus = async (returnId, nextStatus) => {
    if (['approved', 'rejected'].includes(nextStatus)) {
      const ok = window.confirm(`Are you sure you want to ${nextStatus} this return request?`);
      if (!ok) return;
    }
    setActionLoading(`return-${returnId}-${nextStatus}`);
    try {
      const { data } = await API.put(`/returns/${returnId}`, { status: nextStatus });
      if (data.success) {
        success(nextStatus === 'approved' ? 'Return approved. Added to Refund Requests.' : 'Return status updated.');
        const currentEntry = normalizedReturns.find((entry) => entry.returnId === returnId);
        if (currentEntry && ['approved', 'rejected'].includes(nextStatus)) {
          triggerStatusWhatsApp({ section: TAB_KEYS.RETURNS, entry: currentEntry, nextStatus });
        }
        await loadData();
        if (nextStatus === 'approved') {
          setActiveTab(TAB_KEYS.REFUNDS);
        }
      }
    } catch (error) {
      toastError('Failed to update return status.');
    } finally {
      setActionLoading('');
    }
  };

  const handleSaveReturnNotes = async (returnId, status) => {
    setActionLoading(`return-${returnId}-notes`);
    try {
      const { data } = await API.put(`/returns/${returnId}`, {
        status,
        adminNotes,
      });
      if (data.success) {
        success('Return notes saved.');
        await loadData();
      }
    } catch (error) {
      toastError('Failed to save return notes.');
    } finally {
      setActionLoading('');
    }
  };

  const handleRefundStatus = async (refundId, nextStatus) => {
    if (['approved', 'rejected'].includes(nextStatus)) {
      const ok = window.confirm(`Are you sure you want to ${nextStatus} this refund request?`);
      if (!ok) return;
    }
    setActionLoading(`refund-${refundId}-${nextStatus}`);
    try {
      const { data } = await API.put(`/refunds/${refundId}`, { refundStatus: nextStatus });
      if (data.success) {
        success('Refund status updated.');
        const currentEntry = refunds.find((entry) => entry.refundId === refundId);
        if (currentEntry && ['approved', 'rejected'].includes(nextStatus)) {
          triggerStatusWhatsApp({ section: TAB_KEYS.REFUNDS, entry: currentEntry, nextStatus });
        }
        await loadData();
      }
    } catch (error) {
      toastError('Failed to update refund status.');
    } finally {
      setActionLoading('');
    }
  };

  const handleSaveRefundNotes = async (refundId, status) => {
    setActionLoading(`refund-${refundId}-notes`);
    try {
      const { data } = await API.put(`/refunds/${refundId}`, {
        refundStatus: status,
        adminNotes,
      });
      if (data.success) {
        success('Refund notes saved.');
        await loadData();
      }
    } catch (error) {
      toastError('Failed to save refund notes.');
    } finally {
      setActionLoading('');
    }
  };

  const openChat = async (refundEntry) => {
    setChatModal(refundEntry);
    setChatLoading(true);
    setChatMessages([]);
    setChatText('');
    setChatStatus(refundEntry.refundStatus || 'pending');
    try {
      const { data } = await API.get(`/refunds/${refundEntry.refundId}/messages/admin`);
      if (data.success) {
        setChatMessages(data.messages || []);
        if (data.status) {
          setChatStatus(data.status);
        }
      }
    } catch (error) {
      toastError('Failed to load chat conversation.');
    } finally {
      setChatLoading(false);
    }
  };

  const closeChat = () => {
    setChatModal(null);
    setChatMessages([]);
    setChatText('');
  };

  const sendChatMessage = async () => {
    if (!chatModal || !chatText.trim()) return;

    setChatSending(true);
    try {
      const { data } = await API.post(`/refunds/${chatModal.refundId}/messages/admin`, {
        message: chatText,
        newStatus: chatStatus,
      });

      if (data.success) {
        setChatText('');
        await loadData();
        const refreshed = await API.get(`/refunds/${chatModal.refundId}/messages/admin`);
        if (refreshed.data?.success) {
          setChatMessages(refreshed.data.messages || []);
          if (refreshed.data.status) setChatStatus(refreshed.data.status);
        }
        success('Reply sent successfully.');
      }
    } catch (error) {
      toastError('Failed to send chat message.');
    } finally {
      setChatSending(false);
    }
  };

  const currentRows = activeTab === TAB_KEYS.RETURNS ? filteredReturns : filteredRefunds;

  if (loading) {
    return (
      <AdminLayout>
        <DashboardSkeleton text="Loading Returns & Refunds..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="rr-page">
        <div className="rr-header">
          <div className="rr-header-left">
            <p className="rr-breadcrumb">Return &amp; Refund</p>
            <h1 className="rr-title">Return &amp; Refund</h1>
            <p className="rr-subtitle">Single workflow with clear internal tabs for returns and refunds</p>
          </div>

          <StatsCarousel stats={stats} />
        </div>

        <div className="rr-status-tabs rr-section-tabs">
          <button
            className={`rr-tab ${activeTab === TAB_KEYS.RETURNS ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(TAB_KEYS.RETURNS);
              setStatusFilter('all');
            }}
          >
            Return Requests
          </button>
          <button
            className={`rr-tab ${activeTab === TAB_KEYS.REFUNDS ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(TAB_KEYS.REFUNDS);
              setStatusFilter('all');
            }}
          >
            Refund Requests
          </button>
        </div>

        <FilterBar
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          statusFilter={statusFilter}
          statusOptions={currentStatusOptions}
          onStatus={setStatusFilter}
          fromDate={fromDate}
          toDate={toDate}
          onFromDate={setFromDate}
          onToDate={setToDate}
          onClear={clearFilters}
        />

        <div className="rr-section-panel" key={activeTab}>
          {currentRows.length === 0 ? (
            <div className="rr-empty">
              <div className="rr-empty-illustration" aria-hidden="true">
                <svg viewBox="0 0 240 140" fill="none">
                  <rect x="30" y="28" width="180" height="84" rx="14" fill="#EEF2FF" stroke="#C7D2FE" />
                  <rect x="52" y="48" width="82" height="10" rx="5" fill="#A5B4FC" />
                  <rect x="52" y="66" width="130" height="8" rx="4" fill="#C7D2FE" />
                  <rect x="52" y="80" width="108" height="8" rx="4" fill="#C7D2FE" />
                  <circle cx="188" cy="62" r="16" fill="#E0E7FF" />
                  <path d="M180 62l5 5 10-10" stroke="#4F46E5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>No {activeTab === TAB_KEYS.RETURNS ? 'return' : 'refund'} requests found</h3>
              <p>Try adjusting search, status, or date range.</p>
            </div>
          ) : (
            <div className="rr-cards-list">
              {currentRows.map((entry) => (
                <ReturnCard
                  key={activeTab === TAB_KEYS.RETURNS ? entry.returnId : entry.refundId}
                  type={activeTab}
                  entry={entry}
                  actionLoading={actionLoading}
                  onViewReturn={openReturnDetail}
                  onViewRefund={openRefundDetail}
                  onOpenWhatsApp={openWhatsAppModal}
                  onOpenChat={openChat}
                  onApproveReturn={(returnId) => handleReturnStatus(returnId, 'approved')}
                  onRejectReturn={(returnId) => handleReturnStatus(returnId, 'rejected')}
                  onApproveRefund={(refundId) => handleRefundStatus(refundId, 'approved')}
                  onRejectRefund={(refundId) => handleRefundStatus(refundId, 'rejected')}
                />
              ))}
            </div>
          )}
        </div>

        {selectedReturn && (
          <div className="rr-modal-overlay" onClick={closeReturnDetail}>
            <div className="rr-modal" onClick={(e) => e.stopPropagation()}>
              <div className="rr-modal-header">
                <div>
                  <h2 className="rr-modal-title">Return Request Details</h2>
                  <span className="rr-modal-id">ID: {selectedReturn.returnId}</span>
                </div>
                <button className="rr-modal-close" onClick={closeReturnDetail}>✕</button>
              </div>

              <div className="rr-modal-body">
                <div className="rr-detail-grid">
                  <div className="rr-detail-row"><span className="rr-detail-label">Customer</span><span className="rr-detail-value">{selectedReturn.customerName}</span></div>
                  <div className="rr-detail-row"><span className="rr-detail-label">Email</span><span className="rr-detail-value">{selectedReturn.email || 'N/A'}</span></div>
                  <div className="rr-detail-row"><span className="rr-detail-label">Phone</span><span className="rr-detail-value">{selectedReturn.phone || 'N/A'}</span></div>
                  <div className="rr-detail-row"><span className="rr-detail-label">Order ID</span><span className="rr-detail-value">{selectedReturn.orderId || '—'}</span></div>
                  <div className="rr-detail-row"><span className="rr-detail-label">Product</span><span className="rr-detail-value">{selectedReturn.productLabel}</span></div>
                  <div className="rr-detail-row"><span className="rr-detail-label">Condition</span><span className="rr-detail-value">{selectedReturn.conditionLabel}</span></div>
                  <div className="rr-detail-row"><span className="rr-detail-label">Status</span><span className="rr-detail-value"><StatusBadge status={selectedReturn.normalizedStatus} /></span></div>
                  <div className="rr-detail-row"><span className="rr-detail-label">Date</span><span className="rr-detail-value">{formatDate(selectedReturn.createdAt)}</span></div>
                </div>

                <div className="rr-detail-message">
                  <span className="rr-detail-label">Return Reason</span>
                  <p className="rr-message-text">{selectedReturn.returnReason}</p>
                </div>

                <div className="rr-detail-notes">
                  <span className="rr-detail-label">Admin Notes</span>
                  <textarea
                    className="rr-notes-textarea"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                  <button
                    className="rr-btn rr-btn-save-notes"
                    onClick={() => handleSaveReturnNotes(selectedReturn.returnId, selectedReturn.status)}
                    disabled={actionLoading === `return-${selectedReturn.returnId}-notes`}
                  >
                    {actionLoading === `return-${selectedReturn.returnId}-notes` ? 'Saving…' : 'Save Notes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedRefund && (
          <div className="rr-modal-overlay" onClick={closeRefundDetail}>
            <div className="rr-modal" onClick={(e) => e.stopPropagation()}>
              <div className="rr-modal-header">
                <div>
                  <h2 className="rr-modal-title">Refund Request Details</h2>
                  <span className="rr-modal-id">ID: {selectedRefund.refundId}</span>
                </div>
                <button className="rr-modal-close" onClick={closeRefundDetail}>✕</button>
              </div>

              <div className="rr-modal-body">
                <div className="rr-detail-grid">
                  <div className="rr-detail-row"><span className="rr-detail-label">Customer</span><span className="rr-detail-value">{selectedRefund.customerName || 'Customer'}</span></div>
                  <div className="rr-detail-row"><span className="rr-detail-label">Email</span><span className="rr-detail-value">{selectedRefund.customerEmail || 'N/A'}</span></div>
                  <div className="rr-detail-row"><span className="rr-detail-label">Order ID</span><span className="rr-detail-value">{selectedRefund.orderId || '—'}</span></div>
                  <div className="rr-detail-row"><span className="rr-detail-label">Type</span><span className="rr-detail-value">{selectedRefund.typeLabel}</span></div>
                  <div className="rr-detail-row"><span className="rr-detail-label">Product</span><span className="rr-detail-value">{selectedRefund.product || 'N/A'}</span></div>
                  <div className="rr-detail-row"><span className="rr-detail-label">Amount</span><span className="rr-detail-value">{typeof selectedRefund.amount === 'number' ? `Rs ${selectedRefund.amount.toLocaleString('en-IN')}` : 'N/A'}</span></div>
                  <div className="rr-detail-row"><span className="rr-detail-label">Payment</span><span className="rr-detail-value">{selectedRefund.paymentMethod || 'N/A'}</span></div>
                  <div className="rr-detail-row"><span className="rr-detail-label">Status</span><span className="rr-detail-value"><StatusBadge status={selectedRefund.refundStatus} /></span></div>
                </div>

                <div className="rr-detail-message">
                  <span className="rr-detail-label">Reason</span>
                  <p className="rr-message-text">{REASON_LABELS[selectedRefund.reason] || selectedRefund.reason || 'N/A'}</p>
                </div>

                <div className="rr-detail-notes">
                  <span className="rr-detail-label">Admin Notes</span>
                  <textarea
                    className="rr-notes-textarea"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                  <button
                    className="rr-btn rr-btn-save-notes"
                    onClick={() => handleSaveRefundNotes(selectedRefund.refundId, selectedRefund.refundStatus)}
                    disabled={actionLoading === `refund-${selectedRefund.refundId}-notes`}
                  >
                    {actionLoading === `refund-${selectedRefund.refundId}-notes` ? 'Saving…' : 'Save Notes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {chatModal && (
          <div className="rr-modal-overlay" onClick={closeChat}>
            <div className="rr-modal rr-reply-modal" onClick={(e) => e.stopPropagation()}>
              <div className="rr-modal-header">
                <div>
                  <h2 className="rr-modal-title">💬 Refund Chat</h2>
                  <span className="rr-modal-id">{chatModal.customerName || 'Customer'} - {chatModal.orderId ? `Order #${chatModal.orderId}` : 'No order ID'}</span>
                </div>
                <button className="rr-modal-close" onClick={closeChat}>✕</button>
              </div>

              <div className="rr-modal-body">
                <div className="rr-chat-thread">
                  {chatLoading ? (
                    <p className="rr-chat-empty">Loading conversation...</p>
                  ) : chatMessages.length === 0 ? (
                    <p className="rr-chat-empty">No messages yet. Send first admin reply.</p>
                  ) : (
                    chatMessages.map((message) => (
                      <div
                        key={`${message._id}-${message.createdAt}`}
                        className={`rr-chat-bubble ${message.sender === 'ADMIN' ? 'rr-chat-admin' : 'rr-chat-user'}`}
                      >
                        <p>{message.message}</p>
                        <span>{new Date(message.createdAt).toLocaleString('en-IN')}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="rr-reply-status-row">
                  <span className="rr-detail-label">Status</span>
                  <select className="rr-reply-status-select" value={chatStatus} onChange={(e) => setChatStatus(e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="rr-reply-compose">
                  <span className="rr-detail-label">Reply</span>
                  <textarea
                    className="rr-notes-textarea rr-reply-textarea"
                    rows={4}
                    placeholder="Write a message for customer..."
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                  />
                </div>

                <div className="rr-reply-actions">
                  <button className="rr-btn rr-btn-send-reply" disabled={chatSending || !chatText.trim()} onClick={sendChatMessage}>
                    {chatSending ? 'Sending…' : 'Send Message'}
                  </button>
                  <button className="rr-btn rr-btn-cancel" onClick={closeChat}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {whatsAppModal && (
          <div className="rr-modal-overlay" onClick={closeWhatsAppModal}>
            <div className="rr-modal rr-whatsapp-modal" onClick={(e) => e.stopPropagation()}>
              <div className="rr-modal-header">
                <div>
                  <h2 className="rr-modal-title rr-wa-modal-title">💬 WhatsApp Reply</h2>
                  <span className="rr-modal-id">
                    {whatsAppModal.section === TAB_KEYS.RETURNS ? 'Return Request' : 'Refund Request'}
                  </span>
                </div>
                <button className="rr-modal-close" onClick={closeWhatsAppModal}>✕</button>
              </div>

              <div className="rr-modal-body">
                <div className="rr-detail-notes">
                  <span className="rr-detail-label">Customer Name</span>
                  <input
                    className="rr-input-readonly"
                    value={whatsAppModal.customerName}
                    readOnly
                  />
                </div>

                <div className="rr-detail-notes">
                  <span className="rr-detail-label">Phone Number</span>
                  <input
                    className="rr-input-readonly"
                    value={whatsAppModal.phone || 'N/A'}
                    readOnly
                  />
                </div>

                <div className="rr-reply-status-row">
                  <span className="rr-detail-label">Status</span>
                  <select
                    className="rr-reply-status-select"
                    value={whatsAppStatus}
                    onChange={(e) => setWhatsAppStatus(e.target.value)}
                  >
                    <option value="pending">Processing</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="rr-detail-notes">
                  <span className="rr-detail-label">Message Input</span>
                  <textarea
                    className="rr-notes-textarea"
                    rows={5}
                    placeholder="Type your message..."
                    value={whatsAppMessage}
                    onChange={(e) => setWhatsAppMessage(e.target.value)}
                  />
                </div>

                <div className="rr-detail-message">
                  <span className="rr-detail-label">Preview</span>
                  <pre className="rr-wa-preview">{whatsAppPreview}</pre>
                  <button className="rr-btn rr-btn-copy" onClick={copyWhatsAppPreview}>Copy</button>
                </div>

                <div className="rr-reply-actions">
                  <button
                    className="rr-btn rr-btn-whatsapp-send"
                    onClick={async () => {
                      setWhatsAppSending(true);
                      const opened = sendWhatsAppMessage({
                        phone: whatsAppModal.phone,
                        customerName: whatsAppModal.customerName,
                        orderId: whatsAppModal.orderId,
                        adminMessage: whatsAppMessage,
                        status: whatsAppStatus,
                      });
                      setWhatsAppSending(false);
                      if (opened) closeWhatsAppModal();
                    }}
                    disabled={!whatsAppMessage.trim() || whatsAppSending}
                  >
                    {whatsAppSending ? 'Opening...' : 'Send via WhatsApp'}
                  </button>
                  <button className="rr-btn rr-btn-cancel" onClick={closeWhatsAppModal}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRefundRequests;
