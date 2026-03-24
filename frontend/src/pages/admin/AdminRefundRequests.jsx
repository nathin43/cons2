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
  return <span className={`rr-status-badge rr-status-${mapped}`}>{label}</span>;
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
        <DashboardSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="rr-page">
        <div className="rr-header">
          <div className="rr-header-left">
            <h1 className="rr-title">Returns & Refunds</h1>
            <p className="rr-subtitle">Single workflow with clear internal tabs for returns and refunds</p>
          </div>

          <div className="rr-header-stats">
            <div className="rr-stat-card">
              <span className="rr-stat-count">{stats.totalReturns}</span>
              <span className="rr-stat-label">Total Returns</span>
            </div>
            <div className="rr-stat-card rr-stat-pending">
              <span className="rr-stat-count">{stats.pendingReturns}</span>
              <span className="rr-stat-label">Pending Returns</span>
            </div>
            <div className="rr-stat-card">
              <span className="rr-stat-count">{stats.totalRefunds}</span>
              <span className="rr-stat-label">Total Refunds</span>
            </div>
            <div className="rr-stat-card rr-stat-pending">
              <span className="rr-stat-count">{stats.pendingRefunds}</span>
              <span className="rr-stat-label">Pending Refunds</span>
            </div>
          </div>
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

        <div className="rr-filters">
          <div className="rr-search-box">
            <span className="rr-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by Order ID or Customer"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rr-search-input"
            />
            {searchQuery && <button className="rr-search-clear" onClick={() => setSearchQuery('')}>✕</button>}
          </div>

          <div className="rr-status-tabs">
            {currentStatusOptions.map((status) => (
              <button
                key={status}
                className={`rr-tab ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>

          <div className="rr-date-filters">
            <input
              type="date"
              className="rr-date-input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <input
              type="date"
              className="rr-date-input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
            <button className="rr-clear-btn" onClick={clearFilters}>Clear</button>
          </div>
        </div>

        <div className="rr-section-panel" key={activeTab}>
          {currentRows.length === 0 ? (
            <div className="rr-empty">
              <span className="rr-empty-icon">📋</span>
              <p>No {activeTab === TAB_KEYS.RETURNS ? 'return' : 'refund'} requests found</p>
            </div>
          ) : (
            <div className="rr-table-wrapper">
              {activeTab === TAB_KEYS.RETURNS ? (
                <table className="rr-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Product</th>
                      <th>Return Reason</th>
                      <th>Condition</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReturns.map((entry) => (
                      (() => {
                        const phoneMeta = normalizeIndianPhone(entry.phone);
                        const canUseWhatsApp = phoneMeta.hasValue && phoneMeta.isValid;
                        const hasNewMessage = entry.lastMessageSender === 'USER';
                        return (
                      <tr key={entry.returnId} className={entry.normalizedStatus === 'pending' ? 'rr-row-new' : ''}>
                        <td><span className="rr-order-id">{entry.orderId ? `#${entry.orderId}` : '—'}</span></td>
                        <td>
                          <div className="rr-customer">
                            <span className="rr-customer-name">{entry.customerName}</span>
                            <span className="rr-customer-email">{entry.email || 'N/A'}</span>
                          </div>
                        </td>
                        <td>{entry.productLabel}</td>
                        <td>{entry.returnReason}</td>
                        <td><span className="rr-category-pill">{entry.conditionLabel}</span></td>
                        <td>{formatDate(entry.createdAt)}</td>
                        <td><StatusBadge status={entry.normalizedStatus} /></td>
                        <td>
                          <div className="rr-actions">
                            <button className="rr-btn rr-btn-view" onClick={() => openReturnDetail(entry)}>👁 View</button>
                            <button
                              className="rr-btn rr-btn-whatsapp"
                              title={canUseWhatsApp ? 'Send WhatsApp Reply' : 'Phone number not available'}
                              disabled={!canUseWhatsApp}
                              onClick={() => openWhatsAppModal(TAB_KEYS.RETURNS, entry)}
                            >
                              <span className="rr-wa-btn-content">
                                <span className="rr-wa-icon" aria-hidden="true">💬</span>
                                <span>Reply</span>
                                {hasNewMessage && <span className="rr-wa-new-badge">New Message</span>}
                              </span>
                            </button>
                            {entry.normalizedStatus !== 'approved' && (
                              <button
                                className="rr-btn rr-btn-approve"
                                disabled={actionLoading === `return-${entry.returnId}-approved`}
                                onClick={() => handleReturnStatus(entry.returnId, 'approved')}
                              >
                                {actionLoading === `return-${entry.returnId}-approved` ? '…' : '✔ Approve Return'}
                              </button>
                            )}
                            {entry.normalizedStatus !== 'rejected' && (
                              <button
                                className="rr-btn rr-btn-reject"
                                disabled={actionLoading === `return-${entry.returnId}-rejected`}
                                onClick={() => handleReturnStatus(entry.returnId, 'rejected')}
                              >
                                {actionLoading === `return-${entry.returnId}-rejected` ? '…' : '✕ Reject Return'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                        );
                      })()
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="rr-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Type</th>
                      <th>Product</th>
                      <th>Reason</th>
                      <th>Payment</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRefunds.map((entry) => (
                      (() => {
                        const phoneMeta = normalizeIndianPhone(entry.customerPhone);
                        const canUseWhatsApp = phoneMeta.hasValue && phoneMeta.isValid;
                        const hasNewMessage = entry.lastMessageSender === 'USER';
                        return (
                      <tr key={entry.refundId} className={entry.refundStatus === 'pending' ? 'rr-row-new' : ''}>
                        <td><span className="rr-order-id">{entry.orderId ? `#${entry.orderId}` : '—'}</span></td>
                        <td>
                          <div className="rr-customer">
                            <span className="rr-customer-name">{entry.customerName || 'Customer'}</span>
                            <span className="rr-customer-email">{entry.customerEmail || 'N/A'}</span>
                          </div>
                        </td>
                        <td><span className="rr-category-pill">{entry.typeLabel}</span></td>
                        <td>{entry.product || 'N/A'}</td>
                        <td>{REASON_LABELS[entry.reason] || entry.reason || 'N/A'}</td>
                        <td>
                          <div className="rr-payment-cell">
                            <PaymentBadge paymentStatus={entry.paymentStatus} />
                            {String(entry.paymentMethod || '').trim() && (
                              <span className="rr-payment-note">{String(entry.paymentMethod)}</span>
                            )}
                          </div>
                        </td>
                        <td>{typeof entry.amount === 'number' ? `Rs ${entry.amount.toLocaleString('en-IN')}` : 'N/A'}</td>
                        <td>{formatDate(entry.createdAt)}</td>
                        <td><StatusBadge status={entry.refundStatus} /></td>
                        <td>
                          <div className="rr-actions">
                            <button className="rr-btn rr-btn-view" onClick={() => openRefundDetail(entry)}>👁 View</button>
                            <button className="rr-btn rr-btn-reply" onClick={() => openChat(entry)}>💬 Chat</button>
                            <button
                              className="rr-btn rr-btn-whatsapp"
                              title={canUseWhatsApp ? 'Send WhatsApp Reply' : 'Phone number not available'}
                              disabled={!canUseWhatsApp}
                              onClick={() => openWhatsAppModal(TAB_KEYS.REFUNDS, entry)}
                            >
                              <span className="rr-wa-btn-content">
                                <span className="rr-wa-icon" aria-hidden="true">💬</span>
                                <span>Reply</span>
                                {hasNewMessage && <span className="rr-wa-new-badge">New Message</span>}
                              </span>
                            </button>
                            {entry.refundStatus !== 'approved' && (
                              <button
                                className="rr-btn rr-btn-approve"
                                disabled={actionLoading === `refund-${entry.refundId}-approved`}
                                onClick={() => handleRefundStatus(entry.refundId, 'approved')}
                              >
                                {actionLoading === `refund-${entry.refundId}-approved` ? '…' : '✔ Approve Refund'}
                              </button>
                            )}
                            {entry.refundStatus !== 'rejected' && (
                              <button
                                className="rr-btn rr-btn-reject"
                                disabled={actionLoading === `refund-${entry.refundId}-rejected`}
                                onClick={() => handleRefundStatus(entry.refundId, 'rejected')}
                              >
                                {actionLoading === `refund-${entry.refundId}-rejected` ? '…' : '✕ Reject Refund'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                        );
                      })()
                    ))}
                  </tbody>
                </table>
              )}
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
