import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import AdminLayout from '../../components/AdminLayout';
import DashboardSkeleton from '../../components/DashboardSkeleton';
import useAdminLoader from '../../hooks/useAdminLoader';
import { useToast } from '../../hooks/useToast';
import API from '../../services/api';
import './AdminRefundRequests.css';

/* ─────────────────────────────────────────────────
   RETURN REQUESTS (EasyReturn form submissions)
───────────────────────────────────────────────── */

const REASON_LABELS = {
  defective: 'Defective Product',
  damaged: 'Damaged on Arrival',
  'wrong-item': 'Wrong Item Received',
  'poor-quality': 'Poor Quality',
  'changed-mind': 'Changed Mind',
  other: 'Other',
};

const RETURN_STATUS_OPTIONS = ['new', 'in-progress', 'approved', 'rejected', 'completed'];

const StatusBadge = ({ status }) => (
  <span className={`rr-status-badge rr-status-${status}`}>
    {status === 'new' ? 'Pending' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
  </span>
);

/* ─────────────────────────────────────────────────
   REFUND STATUS BADGE
───────────────────────────────────────────────── */
const RefundStatusBadge = ({ status }) => {
  const map = {
    pending:    { label: 'Pending',    cls: 'rr-status-new' },
    processing: { label: 'Processing', cls: 'rr-status-in-progress' },
    approved:   { label: 'Approved',   cls: 'rr-status-approved' },
    completed:  { label: 'Completed',  cls: 'rr-status-completed' },
    rejected:   { label: 'Rejected',   cls: 'rr-status-rejected' },
  };
  const entry = map[status] || { label: status, cls: 'rr-status-new' };
  return <span className={`rr-status-badge ${entry.cls}`}>{entry.label}</span>;
};

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
const AdminRefundRequests = () => {
  // Tab: 'returns' | 'refunds'
  const [activeTab, setActiveTab] = useState('refunds');

  /* ── Return Requests state ── */
  const [returns, setReturns] = useState([]);
  const [returnFiltered, setReturnFiltered] = useState([]);
  const [returnStatusFilter, setReturnStatusFilter] = useState('all');
  const [returnSearch, setReturnSearch] = useState('');
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [returnActionLoading, setReturnActionLoading] = useState(null);
  const [returnAdminNotes, setReturnAdminNotes] = useState('');
  const [returnReplyModal, setReturnReplyModal] = useState(null);
  const [returnReplyText, setReturnReplyText] = useState('');
  const [returnReplyPhone, setReturnReplyPhone] = useState('');
  const [returnReplyStatus, setReturnReplyStatus] = useState('approved');
  const [returnReplySending, setReturnReplySending] = useState(false);

  /* ── Order Cancellation Refunds state ── */
  const [refunds, setRefunds] = useState([]);
  const [refundFiltered, setRefundFiltered] = useState([]);
  const [refundStatusFilter, setRefundStatusFilter] = useState('all');
  const [refundSearch, setRefundSearch] = useState('');
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [refundActionLoading, setRefundActionLoading] = useState(null);
  const [refundReplyModal, setRefundReplyModal] = useState(null);
  const [refundReplyText, setRefundReplyText] = useState('');
  const [refundReplyStatus, setRefundReplyStatus] = useState('approved');
  const [refundReplySending, setRefundReplySending] = useState(false);

  const { loading, run } = useAdminLoader();
  const { success, error: toastError, info } = useToast();

  /* ────────────────────────────────────────
     FETCH — Returns
  ──────────────────────────────────────── */
  const fetchReturns = useCallback(async () => {
    try {
      const { data } = await API.get('/returns');
      if (data.success) setReturns(data.returns);
    } catch (err) {
      console.error('Failed to fetch return requests:', err);
      toastError('Failed to load return requests.');
    }
  }, []);

  /* ────────────────────────────────────────
     FETCH — Refunds (order cancellations)
  ──────────────────────────────────────── */
  const fetchRefunds = useCallback(async () => {
    try {
      const { data } = await API.get('/refunds?source=order_cancellation');
      if (data.success) setRefunds(data.refunds);
    } catch (err) {
      console.error('Failed to fetch refund requests:', err);
      toastError('Failed to load cancellation refund requests.');
    }
  }, []);

  /* ────────────────────────────────────────
     FILTER — Returns
  ──────────────────────────────────────── */
  useEffect(() => {
    let result = [...returns];
    if (returnStatusFilter !== 'all') result = result.filter(r => r.status === returnStatusFilter);
    if (returnSearch.trim()) {
      const q = returnSearch.toLowerCase();
      result = result.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.orderId?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q)
      );
    }
    setReturnFiltered(result);
  }, [returns, returnStatusFilter, returnSearch]);

  /* ────────────────────────────────────────
     FILTER — Refunds
  ──────────────────────────────────────── */
  useEffect(() => {
    let result = [...refunds];
    if (refundStatusFilter !== 'all') result = result.filter(r => r.refundStatus === refundStatusFilter);
    if (refundSearch.trim()) {
      const q = refundSearch.toLowerCase();
      result = result.filter(r =>
        r.user?.name?.toLowerCase().includes(q) ||
        r.user?.email?.toLowerCase().includes(q) ||
        r.order?.orderNumber?.toLowerCase().includes(q) ||
        r.cancelReason?.toLowerCase().includes(q)
      );
    }
    setRefundFiltered(result);
  }, [refunds, refundStatusFilter, refundSearch]);

  /* ────────────────────────────────────────
     INITIAL FETCH
  ──────────────────────────────────────── */
  useEffect(() => {
    run(() => Promise.all([fetchReturns(), fetchRefunds()]));
  }, []);

  /* ────────────────────────────────────────
     SOCKET — Real-time
  ──────────────────────────────────────── */
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });
    socket.on('newReturnRequest', (data) => {
      info(`🔔 New Return Request from ${data.name}${data.orderId ? ` (Order #${data.orderId})` : ''}`, 6000);
      fetchReturns();
    });
    socket.on('newRefundRequest', (data) => {
      info(`🔔 New Refund Request from ${data.customerName || 'Customer'} (Order #${data.orderNumber || ''})`, 6000);
      fetchRefunds();
    });
    return () => socket.disconnect();
  }, [fetchReturns, fetchRefunds]);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  /* ════════════════════════════════════════
     RETURN REQUEST HANDLERS
  ════════════════════════════════════════ */
  const handleReturnUpdateStatus = async (returnId, newStatus) => {
    setReturnActionLoading(returnId + newStatus);
    try {
      const { data } = await API.put(`/returns/${returnId}`, {
        status: newStatus,
        adminNotes: selectedReturn?.returnId === returnId ? returnAdminNotes : undefined,
      });
      if (data.success) {
        setReturns(prev => prev.map(r => r.returnId === returnId ? { ...r, status: newStatus, adminNotes: data.return?.adminNotes } : r));
        if (selectedReturn?.returnId === returnId) setSelectedReturn(prev => ({ ...prev, status: newStatus }));
        success(`Request ${newStatus === 'approved' ? 'approved' : newStatus === 'rejected' ? 'rejected' : 'updated'} successfully.`);
      }
    } catch (err) {
      toastError('Failed to update status. Please try again.');
    } finally {
      setReturnActionLoading(null);
    }
  };

  const handleReturnSaveNotes = async (returnId) => {
    setReturnActionLoading(returnId + 'notes');
    try {
      const { data } = await API.put(`/returns/${returnId}`, { status: selectedReturn.status, adminNotes: returnAdminNotes });
      if (data.success) {
        setReturns(prev => prev.map(r => r.returnId === returnId ? { ...r, adminNotes: returnAdminNotes } : r));
        success('Notes saved successfully.');
      }
    } catch (err) {
      toastError('Failed to save notes.');
    } finally {
      setReturnActionLoading(null);
    }
  };

  const openReturnReplyModal = async (req) => {
    setReturnReplyModal(req);
    setReturnReplyText('');
    setReturnReplyStatus(req.status === 'new' || req.status === 'in-progress' ? 'approved' : req.status);
    try {
      const { data } = await API.get(`/admin/user/${req.email}`);
      setReturnReplyPhone(data.success && data.user?.phone ? data.user.phone : (req.phone || ''));
    } catch {
      setReturnReplyPhone(req.phone || '');
    }
  };

  const handleReturnSendReply = async () => {
    if (!returnReplyText.trim()) return;
    setReturnReplySending(true);
    try {
      const { data } = await API.post(`/returns/${returnReplyModal.returnId}/reply`, {
        replyMessage: returnReplyText,
        newStatus: returnReplyStatus,
      });
      if (data.success) {
        setReturns(prev => prev.map(r => r.returnId === returnReplyModal.returnId ? { ...r, status: returnReplyStatus } : r));
        success('Reply sent and saved to Support Messages.');
        const statusLabel = returnReplyStatus === 'approved' ? 'Approved' : returnReplyStatus === 'rejected' ? 'Rejected' : returnReplyStatus === 'in-progress' ? 'In Progress' : 'Completed';
        const waText = `Hello ${returnReplyModal.name},\n\nYour refund request${returnReplyModal.orderId ? ` for Order #${returnReplyModal.orderId}` : ''} has been reviewed.\n\nStatus: ${statusLabel}\n\nMessage from Support:\n${returnReplyText}\n\nThank you,\nMani Electricals Support Team`;
        const rawPhone = (data.userPhone || returnReplyPhone || returnReplyModal.phone || '').replace(/\D/g, '');
        if (rawPhone) window.open(`https://wa.me/${rawPhone}?text=${encodeURIComponent(waText)}`, '_blank');
        setReturnReplyModal(null);
        setReturnReplyText('');
        setReturnReplyPhone('');
      }
    } catch {
      toastError('Failed to send reply. Please try again.');
    } finally {
      setReturnReplySending(false);
    }
  };

  /* ════════════════════════════════════════
     CANCELLATION REFUND HANDLERS
  ════════════════════════════════════════ */
  const handleRefundUpdateStatus = async (refundId, newStatus) => {
    setRefundActionLoading(refundId + newStatus);
    try {
      const { data } = await API.put(`/refunds/${refundId}`, { refundStatus: newStatus });
      if (data.success) {
        setRefunds(prev => prev.map(r => r._id === refundId ? { ...r, refundStatus: newStatus } : r));
        if (selectedRefund?._id === refundId) setSelectedRefund(prev => ({ ...prev, refundStatus: newStatus }));
        if (newStatus === 'approved') {
          success('Refund approved successfully. Refund processed successfully.');
        } else if (newStatus === 'rejected') {
          success('Refund request rejected.');
        } else {
          success('Refund status updated.');
        }
      }
    } catch (err) {
      toastError('Failed to update refund status.');
    } finally {
      setRefundActionLoading(null);
    }
  };

  const openRefundReplyModal = (refund) => {
    setRefundReplyModal(refund);
    setRefundReplyText('');
    setRefundReplyStatus(
      refund.refundStatus === 'pending' || refund.refundStatus === 'processing' ? 'approved' : refund.refundStatus
    );
  };

  const handleRefundSendReply = async () => {
    if (!refundReplyText.trim()) return;
    setRefundReplySending(true);
    try {
      const { data } = await API.post(`/refunds/${refundReplyModal._id}/reply`, {
        replyMessage: refundReplyText,
        newStatus: refundReplyStatus,
      });
      if (data.success) {
        setRefunds(prev => prev.map(r => r._id === refundReplyModal._id ? { ...r, refundStatus: refundReplyStatus, adminReply: refundReplyText } : r));
        success('Reply sent to customer successfully.');
        // WhatsApp
        const statusLabel = refundReplyStatus === 'approved' ? 'Approved ✔' : refundReplyStatus === 'rejected' ? 'Rejected ✕' : refundReplyStatus === 'processing' ? 'In Progress' : 'Completed';
        const customerName = refundReplyModal.user?.name || 'Customer';
        const orderNum = refundReplyModal.order?.orderNumber || '';
        const waText = `Hello ${customerName},\n\nYour refund request${orderNum ? ` for Order #${orderNum}` : ''} has been reviewed.\n\nStatus: ${statusLabel}\n\nMessage from Support:\n${refundReplyText}\n\nThank you,\nMani Electricals Support Team`;
        const rawPhone = (data.userPhone || refundReplyModal.user?.phone || '').replace(/\D/g, '');
        if (rawPhone) window.open(`https://wa.me/${rawPhone}?text=${encodeURIComponent(waText)}`, '_blank');
        setRefundReplyModal(null);
        setRefundReplyText('');
      }
    } catch {
      toastError('Failed to send reply. Please try again.');
    } finally {
      setRefundReplySending(false);
    }
  };

  /* ════════════════════════════════════════
     DERIVED COUNTS
  ════════════════════════════════════════ */
  const returnPendingCount = returns.filter(r => r.status === 'new' || r.status === 'in-progress').length;
  const refundPendingCount = refunds.filter(r => r.refundStatus === 'pending' || r.refundStatus === 'processing').length;
  const totalPending = returnPendingCount + refundPendingCount;

  if (loading) return <AdminLayout><DashboardSkeleton /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="rr-page">

        {/* ── Header */}
        <div className="rr-header">
          <div className="rr-header-left">
            <h1 className="rr-title">
              Refund &amp; Return Requests
              {totalPending > 0 && (
                <span className="rr-pending-badge">{totalPending} pending</span>
              )}
            </h1>
            <p className="rr-subtitle">Manage customer return and refund submissions</p>
          </div>

          <div className="rr-header-stats">
            {[
              { label: 'Cancellation Refunds', count: refunds.length, cls: '' },
              { label: 'Refund Pending', count: refundPendingCount, cls: 'rr-stat-pending' },
              { label: 'Refund Approved', count: refunds.filter(r => r.refundStatus === 'approved' || r.refundStatus === 'completed').length, cls: 'rr-stat-approved' },
              { label: 'Returns', count: returns.length, cls: '' },
              { label: 'Returns Pending', count: returnPendingCount, cls: 'rr-stat-pending' },
            ].map(({ label, count, cls }) => (
              <div key={label} className={`rr-stat-card ${cls}`}>
                <span className="rr-stat-count">{count}</span>
                <span className="rr-stat-label">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main Tabs */}
        <div className="rr-main-tabs">
          <button
            className={`rr-main-tab ${activeTab === 'refunds' ? 'active' : ''}`}
            onClick={() => setActiveTab('refunds')}
          >
            💳 Order Cancellation Refunds
            {refundPendingCount > 0 && <span className="rr-tab-badge">{refundPendingCount}</span>}
          </button>
          <button
            className={`rr-main-tab ${activeTab === 'returns' ? 'active' : ''}`}
            onClick={() => setActiveTab('returns')}
          >
            📦 Product Return Requests
            {returnPendingCount > 0 && <span className="rr-tab-badge">{returnPendingCount}</span>}
          </button>
        </div>

        {/* ══════════════════════════════════════════
            TAB: ORDER CANCELLATION REFUNDS
        ══════════════════════════════════════════ */}
        {activeTab === 'refunds' && (
          <div className="rr-tab-content">
            {/* Filters */}
            <div className="rr-filters">
              <div className="rr-search-box">
                <span className="rr-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search by name, email, order ID, reason…"
                  value={refundSearch}
                  onChange={e => setRefundSearch(e.target.value)}
                  className="rr-search-input"
                />
                {refundSearch && (
                  <button className="rr-search-clear" onClick={() => setRefundSearch('')}>✕</button>
                )}
              </div>
              <div className="rr-status-tabs">
                {['all', 'pending', 'processing', 'approved', 'rejected', 'completed'].map(s => (
                  <button
                    key={s}
                    className={`rr-tab ${refundStatusFilter === s ? 'active' : ''}`}
                    onClick={() => setRefundStatusFilter(s)}
                  >
                    {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            {refundFiltered.length === 0 ? (
              <div className="rr-empty">
                <span className="rr-empty-icon">💳</span>
                <p>No cancellation refund requests found</p>
                {(refundStatusFilter !== 'all' || refundSearch) && (
                  <button className="rr-clear-btn" onClick={() => { setRefundStatusFilter('all'); setRefundSearch(''); }}>
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="rr-table-wrapper">
                <table className="rr-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Reason</th>
                      <th>User Message</th>
                      <th>Amount</th>
                      <th>Payment</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refundFiltered.map(req => (
                      <tr
                        key={req._id}
                        className={`${req.refundStatus === 'pending' ? 'rr-row-new' : ''} ${req.refundStatus === 'approved' ? 'rr-row-approved' : ''}`}
                      >
                        <td>
                          <span className="rr-order-id">
                            {req.order?.orderNumber ? `#${req.order.orderNumber}` : '—'}
                          </span>
                        </td>
                        <td>
                          <div className="rr-customer">
                            <span className="rr-customer-name">{req.user?.name || '—'}</span>
                            <span className="rr-customer-email">{req.user?.email || '—'}</span>
                          </div>
                        </td>
                        <td>
                          <span className="rr-cancel-reason">{req.cancelReason || '—'}</span>
                        </td>
                        <td>
                          {req.userMessage ? (
                            <span className="rr-user-msg" title={req.userMessage}>
                              {req.userMessage.length > 40 ? req.userMessage.slice(0, 40) + '…' : req.userMessage}
                            </span>
                          ) : (
                            <span className="rr-no-msg">—</span>
                          )}
                        </td>
                        <td>
                          <strong className="rr-amount">₹{req.amount?.toLocaleString('en-IN')}</strong>
                        </td>
                        <td>
                          <span className="rr-paid-badge">PAID</span>
                        </td>
                        <td>{formatDate(req.createdAt)}</td>
                        <td><RefundStatusBadge status={req.refundStatus} /></td>
                        <td>
                          <div className="rr-actions">
                            <button
                              className="rr-btn rr-btn-view"
                              onClick={() => setSelectedRefund(req)}
                            >
                              👁 View
                            </button>
                            <button
                              className="rr-btn rr-btn-reply"
                              onClick={() => openRefundReplyModal(req)}
                            >
                              💬 Reply
                            </button>
                            {req.refundStatus !== 'approved' && req.refundStatus !== 'completed' && (
                              <button
                                className="rr-btn rr-btn-approve"
                                disabled={!!refundActionLoading}
                                onClick={() => handleRefundUpdateStatus(req._id, 'approved')}
                              >
                                {refundActionLoading === req._id + 'approved' ? '…' : '✔ Approve'}
                              </button>
                            )}
                            {req.refundStatus !== 'rejected' && (
                              <button
                                className="rr-btn rr-btn-reject"
                                disabled={!!refundActionLoading}
                                onClick={() => handleRefundUpdateStatus(req._id, 'rejected')}
                              >
                                {refundActionLoading === req._id + 'rejected' ? '…' : '✕ Reject'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: PRODUCT RETURN REQUESTS
        ══════════════════════════════════════════ */}
        {activeTab === 'returns' && (
          <div className="rr-tab-content">
            {/* Filters */}
            <div className="rr-filters">
              <div className="rr-search-box">
                <span className="rr-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search by name, order ID, category…"
                  value={returnSearch}
                  onChange={e => setReturnSearch(e.target.value)}
                  className="rr-search-input"
                />
                {returnSearch && (
                  <button className="rr-search-clear" onClick={() => setReturnSearch('')}>✕</button>
                )}
              </div>
              <div className="rr-status-tabs">
                {['all', 'new', 'in-progress', 'approved', 'rejected', 'completed'].map(s => (
                  <button
                    key={s}
                    className={`rr-tab ${returnStatusFilter === s ? 'active' : ''}`}
                    onClick={() => setReturnStatusFilter(s)}
                  >
                    {s === 'all' ? 'All' : s === 'new' ? 'Pending' : s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            {returnFiltered.length === 0 ? (
              <div className="rr-empty">
                <span className="rr-empty-icon">📋</span>
                <p>No return requests found</p>
                {(returnStatusFilter !== 'all' || returnSearch) && (
                  <button className="rr-clear-btn" onClick={() => { setReturnStatusFilter('all'); setReturnSearch(''); }}>
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="rr-table-wrapper">
                <table className="rr-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Category</th>
                      <th>Reason</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnFiltered.map(req => (
                      <tr key={req.returnId} className={req.status === 'new' ? 'rr-row-new' : ''}>
                        <td>
                          <span className="rr-order-id">
                            {req.orderId ? `#${req.orderId}` : '—'}
                          </span>
                        </td>
                        <td>
                          <div className="rr-customer">
                            <span className="rr-customer-name">{req.name}</span>
                            <span className="rr-customer-email">{req.email}</span>
                          </div>
                        </td>
                        <td><span className="rr-category-pill">{req.category}</span></td>
                        <td>{REASON_LABELS[req.reason] || req.reason}</td>
                        <td>{formatDate(req.createdAt)}</td>
                        <td><StatusBadge status={req.status} /></td>
                        <td>
                          <div className="rr-actions">
                            <button className="rr-btn rr-btn-view" onClick={() => { setSelectedReturn(req); setReturnAdminNotes(req.adminNotes || ''); }}>
                              👁 View
                            </button>
                            <button className="rr-btn rr-btn-reply" onClick={() => openReturnReplyModal(req)}>
                              💬 Reply
                            </button>
                            {req.status !== 'approved' && (
                              <button
                                className="rr-btn rr-btn-approve"
                                disabled={returnActionLoading === req.returnId + 'approved'}
                                onClick={() => handleReturnUpdateStatus(req.returnId, 'approved')}
                              >
                                {returnActionLoading === req.returnId + 'approved' ? '…' : '✔ Approve'}
                              </button>
                            )}
                            {req.status !== 'rejected' && (
                              <button
                                className="rr-btn rr-btn-reject"
                                disabled={returnActionLoading === req.returnId + 'rejected'}
                                onClick={() => handleReturnUpdateStatus(req.returnId, 'rejected')}
                              >
                                {returnActionLoading === req.returnId + 'rejected' ? '…' : '✕ Reject'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            MODAL: CANCELLATION REFUND — View Details
        ══════════════════════════════════════════ */}
        {selectedRefund && (
          <div className="rr-modal-overlay" onClick={() => setSelectedRefund(null)}>
            <div className="rr-modal" onClick={e => e.stopPropagation()}>
              <div className="rr-modal-header">
                <div>
                  <h2 className="rr-modal-title">💳 Cancellation Refund Details</h2>
                  <span className="rr-modal-id">Order #{selectedRefund.order?.orderNumber || '—'}</span>
                </div>
                <button className="rr-modal-close" onClick={() => setSelectedRefund(null)}>✕</button>
              </div>

              <div className="rr-modal-body">
                {/* Payment status highlight */}
                <div className="rr-refund-highlight">
                  <div className="rr-refund-highlight-left">
                    <span className="rr-refund-highlight-label">Payment Status</span>
                    <span className="rr-paid-badge rr-paid-badge--lg">ALREADY PAID</span>
                  </div>
                  <div className="rr-refund-highlight-right">
                    <span className="rr-refund-highlight-label">Refund Amount</span>
                    <span className="rr-refund-amount-big">₹{selectedRefund.amount?.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="rr-detail-grid">
                  <div className="rr-detail-row">
                    <span className="rr-detail-label">Customer Name</span>
                    <span className="rr-detail-value">{selectedRefund.user?.name || '—'}</span>
                  </div>
                  <div className="rr-detail-row">
                    <span className="rr-detail-label">Email</span>
                    <span className="rr-detail-value">{selectedRefund.user?.email || '—'}</span>
                  </div>
                  <div className="rr-detail-row">
                    <span className="rr-detail-label">Phone</span>
                    <span className="rr-detail-value">{selectedRefund.user?.phone || '—'}</span>
                  </div>
                  <div className="rr-detail-row">
                    <span className="rr-detail-label">Order ID</span>
                    <span className="rr-detail-value">#{selectedRefund.order?.orderNumber || '—'}</span>
                  </div>
                  <div className="rr-detail-row">
                    <span className="rr-detail-label">Payment Method</span>
                    <span className="rr-detail-value">{selectedRefund.paymentMethod || selectedRefund.order?.paymentMethod || '—'}</span>
                  </div>
                  <div className="rr-detail-row">
                    <span className="rr-detail-label">Cancel Reason</span>
                    <span className="rr-detail-value">{selectedRefund.cancelReason || '—'}</span>
                  </div>
                  <div className="rr-detail-row">
                    <span className="rr-detail-label">Submitted</span>
                    <span className="rr-detail-value">{formatDate(selectedRefund.createdAt)}</span>
                  </div>
                  <div className="rr-detail-row">
                    <span className="rr-detail-label">Status</span>
                    <span className="rr-detail-value">
                      <RefundStatusBadge status={selectedRefund.refundStatus} />
                    </span>
                  </div>
                </div>

                {/* User message */}
                {selectedRefund.userMessage && (
                  <div className="rr-detail-message">
                    <span className="rr-detail-label">Customer Message</span>
                    <p className="rr-message-text">{selectedRefund.userMessage}</p>
                  </div>
                )}

                {/* Admin reply (if already sent) */}
                {selectedRefund.adminReply && (
                  <div className="rr-detail-message">
                    <span className="rr-detail-label">Admin Reply (sent)</span>
                    <p className="rr-message-text rr-admin-reply-text">{selectedRefund.adminReply}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="rr-modal-status-row">
                  <span className="rr-detail-label">Actions</span>
                  <div className="rr-status-actions">
                    {selectedRefund.refundStatus !== 'approved' && selectedRefund.refundStatus !== 'completed' && (
                      <button
                        className="rr-btn rr-btn-status rr-status-btn-approved"
                        disabled={!!refundActionLoading}
                        onClick={() => handleRefundUpdateStatus(selectedRefund._id, 'approved')}
                      >
                        ✔ Approve Refund
                      </button>
                    )}
                    {selectedRefund.refundStatus !== 'rejected' && (
                      <button
                        className="rr-btn rr-btn-status rr-status-btn-rejected"
                        disabled={!!refundActionLoading}
                        onClick={() => handleRefundUpdateStatus(selectedRefund._id, 'rejected')}
                      >
                        ✕ Reject
                      </button>
                    )}
                    <button
                      className="rr-btn rr-btn-reply"
                      onClick={() => { setSelectedRefund(null); openRefundReplyModal(selectedRefund); }}
                    >
                      💬 Reply to Customer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            MODAL: CANCELLATION REFUND — Reply
        ══════════════════════════════════════════ */}
        {refundReplyModal && (
          <div className="rr-modal-overlay" onClick={() => setRefundReplyModal(null)}>
            <div className="rr-modal rr-reply-modal" onClick={e => e.stopPropagation()}>
              <div className="rr-modal-header">
                <div>
                  <h2 className="rr-modal-title">💬 Reply to Customer</h2>
                  <span className="rr-modal-id">
                    {refundReplyModal.user?.name} — Order #{refundReplyModal.order?.orderNumber || '—'}
                  </span>
                </div>
                <button className="rr-modal-close" onClick={() => setRefundReplyModal(null)}>✕</button>
              </div>

              <div className="rr-modal-body">
                {/* Payment highlight */}
                <div className="rr-refund-highlight rr-refund-highlight--sm">
                  <span className="rr-paid-badge">ALREADY PAID</span>
                  <span className="rr-refund-amount-sm">Refund: ₹{refundReplyModal.amount?.toLocaleString('en-IN')}</span>
                </div>

                {/* Customer info */}
                <div className="rr-reply-customer-info">
                  <div className="rr-reply-info-item">
                    <span className="rr-reply-info-label">📧 Email</span>
                    <span className="rr-reply-info-value">{refundReplyModal.user?.email}</span>
                  </div>
                  <div className="rr-reply-info-item">
                    <span className="rr-reply-info-label">📞 Phone</span>
                    <span className="rr-reply-info-value">{refundReplyModal.user?.phone || '—'}</span>
                  </div>
                  <div className="rr-reply-info-item">
                    <span className="rr-reply-info-label">🛒 Cancel Reason</span>
                    <span className="rr-reply-info-value">{refundReplyModal.cancelReason || '—'}</span>
                  </div>
                </div>

                {/* Customer message */}
                {refundReplyModal.userMessage && (
                  <div className="rr-reply-original">
                    <span className="rr-detail-label">Customer Message</span>
                    <p className="rr-reply-original-text">{refundReplyModal.userMessage}</p>
                  </div>
                )}

                {/* Decision */}
                <div className="rr-reply-status-row">
                  <span className="rr-detail-label">Decision</span>
                  <select
                    className="rr-reply-status-select"
                    value={refundReplyStatus}
                    onChange={e => setRefundReplyStatus(e.target.value)}
                  >
                    <option value="processing">Processing</option>
                    <option value="approved">Approved ✔ — Refund Processed</option>
                    <option value="rejected">Rejected ✕</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Reply compose */}
                <div className="rr-reply-compose">
                  <span className="rr-detail-label">Your Reply <span className="rr-required">*</span></span>
                  <textarea
                    className="rr-notes-textarea rr-reply-textarea"
                    placeholder="Write your reply to the customer about their refund…"
                    value={refundReplyText}
                    onChange={e => setRefundReplyText(e.target.value)}
                    rows={5}
                  />
                </div>

                <div className="rr-reply-actions">
                  <button
                    className="rr-btn rr-btn-send-reply"
                    onClick={handleRefundSendReply}
                    disabled={refundReplySending || !refundReplyText.trim()}
                  >
                    {refundReplySending ? 'Sending…' : '✉ Send Reply + Open WhatsApp'}
                  </button>
                  <button className="rr-btn rr-btn-cancel" onClick={() => setRefundReplyModal(null)}>
                    Cancel
                  </button>
                </div>
                <p className="rr-reply-hint">Reply is saved to customer's Support Messages. WhatsApp will open with pre-filled message.</p>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            MODAL: RETURN REQUEST — View Details
        ══════════════════════════════════════════ */}
        {selectedReturn && (
          <div className="rr-modal-overlay" onClick={() => setSelectedReturn(null)}>
            <div className="rr-modal" onClick={e => e.stopPropagation()}>
              <div className="rr-modal-header">
                <div>
                  <h2 className="rr-modal-title">Return Request Details</h2>
                  <span className="rr-modal-id">ID: {selectedReturn.returnId}</span>
                </div>
                <button className="rr-modal-close" onClick={() => setSelectedReturn(null)}>✕</button>
              </div>

              <div className="rr-modal-body">
                <div className="rr-detail-grid">
                  <div className="rr-detail-row">
                    <span className="rr-detail-label">Customer Name</span>
                    <span className="rr-detail-value">{selectedReturn.name}</span>
                  </div>
                  <div className="rr-detail-row">
                    <span className="rr-detail-label">Email</span>
                    <span className="rr-detail-value">{selectedReturn.email}</span>
                  </div>
                  <div className="rr-detail-row">
                    <span className="rr-detail-label">Phone</span>
                    <span className="rr-detail-value">{selectedReturn.phone}</span>
                  </div>
                  <div className="rr-detail-row">
                    <span className="rr-detail-label">Order ID</span>
                    <span className="rr-detail-value">{selectedReturn.orderId || '—'}</span>
                  </div>
                  <div className="rr-detail-row">
                    <span className="rr-detail-label">Product Category</span>
                    <span className="rr-detail-value">
                      <span className="rr-category-pill">{selectedReturn.category}</span>
                    </span>
                  </div>
                  <div className="rr-detail-row">
                    <span className="rr-detail-label">Reason</span>
                    <span className="rr-detail-value">{REASON_LABELS[selectedReturn.reason] || selectedReturn.reason}</span>
                  </div>
                  <div className="rr-detail-row">
                    <span className="rr-detail-label">Submitted</span>
                    <span className="rr-detail-value">{formatDate(selectedReturn.createdAt)}</span>
                  </div>
                  <div className="rr-detail-row">
                    <span className="rr-detail-label">Status</span>
                    <span className="rr-detail-value">
                      <StatusBadge status={selectedReturn.status} />
                    </span>
                  </div>
                </div>

                <div className="rr-detail-message">
                  <span className="rr-detail-label">Customer Message</span>
                  <p className="rr-message-text">{selectedReturn.message}</p>
                </div>

                <div className="rr-detail-notes">
                  <span className="rr-detail-label">Admin Notes</span>
                  <textarea
                    className="rr-notes-textarea"
                    placeholder="Add internal notes about this request…"
                    value={returnAdminNotes}
                    onChange={e => setReturnAdminNotes(e.target.value)}
                    rows={3}
                  />
                  <button
                    className="rr-btn rr-btn-save-notes"
                    onClick={() => handleReturnSaveNotes(selectedReturn.returnId)}
                    disabled={returnActionLoading === selectedReturn.returnId + 'notes'}
                  >
                    {returnActionLoading === selectedReturn.returnId + 'notes' ? 'Saving…' : 'Save Notes'}
                  </button>
                </div>

                <div className="rr-modal-status-row">
                  <span className="rr-detail-label">Update Status</span>
                  <div className="rr-status-actions">
                    {RETURN_STATUS_OPTIONS.filter(s => s !== selectedReturn.status).map(s => (
                      <button
                        key={s}
                        className={`rr-btn rr-btn-status rr-status-btn-${s}`}
                        disabled={!!returnActionLoading}
                        onClick={() => handleReturnUpdateStatus(selectedReturn.returnId, s)}
                      >
                        {s === 'new' ? 'Reset to Pending'
                          : s === 'in-progress' ? 'Mark In Progress'
                          : s === 'approved' ? '✔ Approve'
                          : s === 'rejected' ? '✕ Reject'
                          : 'Mark Completed'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            MODAL: RETURN REQUEST — Reply
        ══════════════════════════════════════════ */}
        {returnReplyModal && (
          <div className="rr-modal-overlay" onClick={() => setReturnReplyModal(null)}>
            <div className="rr-modal rr-reply-modal" onClick={e => e.stopPropagation()}>
              <div className="rr-modal-header">
                <div>
                  <h2 className="rr-modal-title">💬 Reply to Customer</h2>
                  <span className="rr-modal-id">{returnReplyModal.name} — {returnReplyModal.orderId ? `Order #${returnReplyModal.orderId}` : 'No order ID'}</span>
                </div>
                <button className="rr-modal-close" onClick={() => setReturnReplyModal(null)}>✕</button>
              </div>

              <div className="rr-modal-body">
                <div className="rr-reply-customer-info">
                  <div className="rr-reply-info-item">
                    <span className="rr-reply-info-label">📧 Email</span>
                    <span className="rr-reply-info-value">{returnReplyModal.email}</span>
                  </div>
                  <div className="rr-reply-info-item">
                    <span className="rr-reply-info-label">📞 Phone</span>
                    <input
                      type="text"
                      className="rr-reply-info-input"
                      value={returnReplyPhone}
                      onChange={e => setReturnReplyPhone(e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="rr-reply-info-item">
                    <span className="rr-reply-info-label">📦 Category</span>
                    <span className="rr-reply-info-value">{returnReplyModal.category}</span>
                  </div>
                  <div className="rr-reply-info-item">
                    <span className="rr-reply-info-label">❓ Reason</span>
                    <span className="rr-reply-info-value">{REASON_LABELS[returnReplyModal.reason] || returnReplyModal.reason}</span>
                  </div>
                </div>

                <div className="rr-reply-original">
                  <span className="rr-detail-label">Customer Message</span>
                  <p className="rr-reply-original-text">{returnReplyModal.message}</p>
                </div>

                <div className="rr-reply-status-row">
                  <span className="rr-detail-label">Decision</span>
                  <select
                    className="rr-reply-status-select"
                    value={returnReplyStatus}
                    onChange={e => setReturnReplyStatus(e.target.value)}
                  >
                    <option value="in-progress">In Progress</option>
                    <option value="approved">Approved ✔</option>
                    <option value="rejected">Rejected ✕</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="rr-reply-compose">
                  <span className="rr-detail-label">Your Reply <span className="rr-required">*</span></span>
                  <textarea
                    className="rr-notes-textarea rr-reply-textarea"
                    placeholder="Write your reply to the customer. This will appear in their Support Messages and can also be sent via WhatsApp."
                    value={returnReplyText}
                    onChange={e => setReturnReplyText(e.target.value)}
                    rows={5}
                  />
                </div>

                <div className="rr-reply-actions">
                  <button
                    className="rr-btn rr-btn-send-reply"
                    onClick={handleReturnSendReply}
                    disabled={returnReplySending || !returnReplyText.trim()}
                  >
                    {returnReplySending ? 'Sending…' : '✉ Send Reply + Open WhatsApp'}
                  </button>
                  <button className="rr-btn rr-btn-cancel" onClick={() => setReturnReplyModal(null)}>
                    Cancel
                  </button>
                </div>
                <p className="rr-reply-hint">
                  The reply will be saved in the customer&apos;s Support Messages and WhatsApp will open with a pre-filled message.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminRefundRequests;
