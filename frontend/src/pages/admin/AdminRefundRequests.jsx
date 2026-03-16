import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
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

const STATUS_OPTIONS = ['new', 'in-progress', 'approved', 'rejected', 'completed'];

const StatusBadge = ({ status }) => (
  <span className={`rr-status-badge rr-status-${status}`}>
    {status === 'new' ? 'Pending' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
  </span>
);

const AdminRefundRequests = () => {
  const [returns, setReturns] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [replyModal, setReplyModal] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyPhone, setReplyPhone] = useState('');
  const [replyStatus, setReplyStatus] = useState('approved');
  const [replySending, setReplySending] = useState(false);
  const { loading, run } = useAdminLoader();
  const { success, error: toastError, info } = useToast();

  const fetchReturns = useCallback(async () => {
    try {
      const { data } = await API.get('/returns');
      if (data.success) {
        setReturns(data.returns);
      }
    } catch (err) {
      console.error('Failed to fetch return requests:', err);
      toastError('Failed to load return requests.');
    }
  }, []);

  // Apply filters whenever returns / filters change
  useEffect(() => {
    let result = [...returns];

    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.orderId?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [returns, statusFilter, searchQuery]);

  // Initial fetch
  useEffect(() => {
    run(fetchReturns);
  }, []);

  // Real-time socket listener
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });

    socket.on('newReturnRequest', (data) => {
      info(
        `🔔 New Return Request from ${data.name}${data.orderId ? ` (Order #${data.orderId})` : ''}`,
        6000
      );
      // Refresh the list to show the new entry
      fetchReturns();
    });

    return () => socket.disconnect();
  }, [fetchReturns]);

  const pendingCount = returns.filter(r => r.status === 'new' || r.status === 'in-progress').length;

  const handleUpdateStatus = async (returnId, newStatus) => {
    setActionLoading(returnId + newStatus);
    try {
      const { data } = await API.put(`/returns/${returnId}`, {
        status: newStatus,
        adminNotes: selectedRequest?.returnId === returnId ? adminNotes : undefined,
      });
      if (data.success) {
        setReturns(prev => prev.map(r => r.returnId === returnId ? { ...r, status: newStatus, adminNotes: data.return?.adminNotes } : r));
        if (selectedRequest?.returnId === returnId) {
          setSelectedRequest(prev => ({ ...prev, status: newStatus }));
        }
        success(`Request ${newStatus === 'approved' ? 'approved' : newStatus === 'rejected' ? 'rejected' : 'updated'} successfully.`);
      }
    } catch (err) {
      toastError('Failed to update status. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveNotes = async (returnId) => {
    setActionLoading(returnId + 'notes');
    try {
      const { data } = await API.put(`/returns/${returnId}`, {
        status: selectedRequest.status,
        adminNotes,
      });
      if (data.success) {
        setReturns(prev => prev.map(r => r.returnId === returnId ? { ...r, adminNotes } : r));
        success('Notes saved successfully.');
      }
    } catch (err) {
      toastError('Failed to save notes.');
    } finally {
      setActionLoading(null);
    }
  };

  const openDetail = (req) => {
    setSelectedRequest(req);
    setAdminNotes(req.adminNotes || '');
  };

  const closeDetail = () => {
    setSelectedRequest(null);
    setAdminNotes('');
  };

  const openReplyModal = async (req) => {
    setReplyModal(req);
    setReplyText('');
    setReplyStatus(req.status === 'new' || req.status === 'in-progress' ? 'approved' : req.status);
    
    // Fetch user profile to get their current phone number from their account
    try {
      const { data } = await API.get(`/admin/user/${req.email}`);
      if (data.success && data.user?.phone) {
        setReplyPhone(data.user.phone);
      } else {
        setReplyPhone(req.phone || '');
      }
    } catch (err) {
      console.error('Failed to fetch user phone from profile:', err);
      setReplyPhone(req.phone || '');
    }
  };

  const closeReplyModal = () => {
    setReplyModal(null);
    setReplyText('');
    setReplyPhone('');
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setReplySending(true);
    try {
      const { data } = await API.post(`/returns/${replyModal.returnId}/reply`, {
        replyMessage: replyText,
        newStatus: replyStatus,
      });
      if (data.success) {
        setReturns(prev =>
          prev.map(r => r.returnId === replyModal.returnId ? { ...r, status: replyStatus } : r)
        );
        success('Reply sent and saved to Support Messages.');

        // Build the exact WhatsApp message per spec
        const statusLabel =
          replyStatus === 'approved'    ? 'Approved'    :
          replyStatus === 'rejected'    ? 'Rejected'    :
          replyStatus === 'in-progress' ? 'In Progress' :
          'Completed';

        const waText =
          `Hello ${replyModal.name},\n\n` +
          `Your refund request${replyModal.orderId ? ` for Order #${replyModal.orderId}` : ''} has been reviewed.\n\n` +
          `Status: ${statusLabel}\n\n` +
          `Message from Support:\n${replyText}\n\n` +
          `Thank you,\nMani Electricals Support Team`;

        // Prefer the verified phone returned by the server (from User record), fallback to edited replyPhone
        const rawPhone = (data.userPhone || replyPhone || replyModal.phone || '').replace(/\D/g, '');
        if (rawPhone) {
          window.open(`https://wa.me/${rawPhone}?text=${encodeURIComponent(waText)}`, '_blank');
        }
        closeReplyModal();
      }
    } catch (err) {
      toastError('Failed to send reply. Please try again.');
    } finally {
      setReplySending(false);
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  if (loading) return <AdminLayout><DashboardSkeleton /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="rr-page">

        {/* Header */}
        <div className="rr-header">
          <div className="rr-header-left">
            <h1 className="rr-title">
              Refund & Return Requests
              {pendingCount > 0 && (
                <span className="rr-pending-badge">{pendingCount} pending</span>
              )}
            </h1>
            <p className="rr-subtitle">Manage customer return and refund submissions</p>
          </div>

          <div className="rr-header-stats">
            {[
              { label: 'Total', count: returns.length, cls: '' },
              { label: 'Pending', count: returns.filter(r => r.status === 'new').length, cls: 'rr-stat-pending' },
              { label: 'In Progress', count: returns.filter(r => r.status === 'in-progress').length, cls: 'rr-stat-progress' },
              { label: 'Approved', count: returns.filter(r => r.status === 'approved').length, cls: 'rr-stat-approved' },
              { label: 'Rejected', count: returns.filter(r => r.status === 'rejected').length, cls: 'rr-stat-rejected' },
            ].map(({ label, count, cls }) => (
              <div key={label} className={`rr-stat-card ${cls}`}>
                <span className="rr-stat-count">{count}</span>
                <span className="rr-stat-label">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="rr-filters">
          <div className="rr-search-box">
            <span className="rr-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name, order ID, category…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="rr-search-input"
            />
            {searchQuery && (
              <button className="rr-search-clear" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>

          <div className="rr-status-tabs">
            {['all', 'new', 'in-progress', 'approved', 'rejected', 'completed'].map(s => (
              <button
                key={s}
                className={`rr-tab ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === 'all' ? 'All' : s === 'new' ? 'Pending' : s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="rr-empty">
            <span className="rr-empty-icon">📋</span>
            <p>No return requests found</p>
            {(statusFilter !== 'all' || searchQuery) && (
              <button className="rr-clear-btn" onClick={() => { setStatusFilter('all'); setSearchQuery(''); }}>
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
                {filtered.map(req => (
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
                    <td>
                      <span className="rr-category-pill">{req.category}</span>
                    </td>
                    <td>{REASON_LABELS[req.reason] || req.reason}</td>
                    <td>{formatDate(req.createdAt)}</td>
                    <td><StatusBadge status={req.status} /></td>
                    <td>
                      <div className="rr-actions">
                        <button
                          className="rr-btn rr-btn-view"
                          onClick={() => openDetail(req)}
                          title="View Details"
                        >
                          👁 View
                        </button>
                        <button
                          className="rr-btn rr-btn-reply"
                          onClick={() => openReplyModal(req)}
                          title="Reply to customer"
                        >
                          💬 Reply
                        </button>
                        {req.status !== 'approved' && (
                          <button
                            className="rr-btn rr-btn-approve"
                            disabled={actionLoading === req.returnId + 'approved'}
                            onClick={() => handleUpdateStatus(req.returnId, 'approved')}
                            title="Approve Refund"
                          >
                            {actionLoading === req.returnId + 'approved' ? '…' : '✔ Approve'}
                          </button>
                        )}
                        {req.status !== 'rejected' && (
                          <button
                            className="rr-btn rr-btn-reject"
                            disabled={actionLoading === req.returnId + 'rejected'}
                            onClick={() => handleUpdateStatus(req.returnId, 'rejected')}
                            title="Reject Request"
                          >
                            {actionLoading === req.returnId + 'rejected' ? '…' : '✕ Reject'}
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

        {/* Reply Modal */}
        {replyModal && (
          <div className="rr-modal-overlay" onClick={closeReplyModal}>
            <div className="rr-modal rr-reply-modal" onClick={e => e.stopPropagation()}>
              <div className="rr-modal-header">
                <div>
                  <h2 className="rr-modal-title">💬 Reply to Customer</h2>
                  <span className="rr-modal-id">{replyModal.name} — {replyModal.orderId ? `Order #${replyModal.orderId}` : 'No order ID'}</span>
                </div>
                <button className="rr-modal-close" onClick={closeReplyModal}>✕</button>
              </div>

              <div className="rr-modal-body">
                {/* Customer snapshot */}
                <div className="rr-reply-customer-info">
                  <div className="rr-reply-info-item">
                    <span className="rr-reply-info-label">📧 Email</span>
                    <span className="rr-reply-info-value">{replyModal.email}</span>
                  </div>
                  <div className="rr-reply-info-item">
                    <span className="rr-reply-info-label">📞 Phone</span>
                    <input
                      type="text"
                      className="rr-reply-info-input"
                      value={replyPhone}
                      onChange={e => setReplyPhone(e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="rr-reply-info-item">
                    <span className="rr-reply-info-label">📦 Category</span>
                    <span className="rr-reply-info-value">{replyModal.category}</span>
                  </div>
                  <div className="rr-reply-info-item">
                    <span className="rr-reply-info-label">❓ Reason</span>
                    <span className="rr-reply-info-value">{REASON_LABELS[replyModal.reason] || replyModal.reason}</span>
                  </div>
                </div>

                {/* Customer original message */}
                <div className="rr-reply-original">
                  <span className="rr-detail-label">Customer Message</span>
                  <p className="rr-reply-original-text">{replyModal.message}</p>
                </div>

                {/* Update decision status */}
                <div className="rr-reply-status-row">
                  <span className="rr-detail-label">Decision</span>
                  <select
                    className="rr-reply-status-select"
                    value={replyStatus}
                    onChange={e => setReplyStatus(e.target.value)}
                  >
                    <option value="in-progress">In Progress</option>
                    <option value="approved">Approved ✔</option>
                    <option value="rejected">Rejected ✕</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Reply message */}
                <div className="rr-reply-compose">
                  <span className="rr-detail-label">Your Reply <span className="rr-required">*</span></span>
                  <textarea
                    className="rr-notes-textarea rr-reply-textarea"
                    placeholder="Write your reply to the customer. This will appear in their Support Messages and can also be sent via WhatsApp."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    rows={5}
                  />
                </div>

                {/* Action buttons */}
                <div className="rr-reply-actions">
                  <button
                    className="rr-btn rr-btn-send-reply"
                    onClick={handleSendReply}
                    disabled={replySending || !replyText.trim()}
                  >
                    {replySending ? 'Sending…' : '✉ Send Reply + Open WhatsApp'}
                  </button>
                  <button className="rr-btn rr-btn-cancel" onClick={closeReplyModal}>
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

        {/* Detail Modal */}
        {selectedRequest && (
          <div className="rr-modal-overlay" onClick={closeDetail}>
            <div className="rr-modal" onClick={e => e.stopPropagation()}>
              <div className="rr-modal-header">
                <div>
                  <h2 className="rr-modal-title">Return Request Details</h2>
                  <span className="rr-modal-id">ID: {selectedRequest.returnId}</span>
                </div>
                <button className="rr-modal-close" onClick={closeDetail}>✕</button>
              </div>

              <div className="rr-modal-body">
                <div className="rr-detail-grid">
                  <div className="rr-detail-row">
                    <span className="rr-detail-label">Customer Name</span>
                    <span className="rr-detail-value">{selectedRequest.name}</span>
                  </div>
                  <div className="rr-detail-row">
                    <span className="rr-detail-label">Email</span>
                    <span className="rr-detail-value">{selectedRequest.email}</span>
                  </div>
                  <div className="rr-detail-row">
                    <span className="rr-detail-label">Phone</span>
                    <span className="rr-detail-value">{selectedRequest.phone}</span>
                  </div>
                  <div className="rr-detail-row">
                    <span className="rr-detail-label">Order ID</span>
                    <span className="rr-detail-value">{selectedRequest.orderId || '—'}</span>
                  </div>
                  <div className="rr-detail-row">
                    <span className="rr-detail-label">Product Category</span>
                    <span className="rr-detail-value">
                      <span className="rr-category-pill">{selectedRequest.category}</span>
                    </span>
                  </div>
                  <div className="rr-detail-row">
                    <span className="rr-detail-label">Reason</span>
                    <span className="rr-detail-value">{REASON_LABELS[selectedRequest.reason] || selectedRequest.reason}</span>
                  </div>
                  <div className="rr-detail-row">
                    <span className="rr-detail-label">Submitted</span>
                    <span className="rr-detail-value">{formatDate(selectedRequest.createdAt)}</span>
                  </div>
                  <div className="rr-detail-row">
                    <span className="rr-detail-label">Status</span>
                    <span className="rr-detail-value">
                      <StatusBadge status={selectedRequest.status} />
                    </span>
                  </div>
                </div>

                <div className="rr-detail-message">
                  <span className="rr-detail-label">Customer Message</span>
                  <p className="rr-message-text">{selectedRequest.message}</p>
                </div>

                <div className="rr-detail-notes">
                  <span className="rr-detail-label">Admin Notes</span>
                  <textarea
                    className="rr-notes-textarea"
                    placeholder="Add internal notes about this request…"
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                  <button
                    className="rr-btn rr-btn-save-notes"
                    onClick={() => handleSaveNotes(selectedRequest.returnId)}
                    disabled={actionLoading === selectedRequest.returnId + 'notes'}
                  >
                    {actionLoading === selectedRequest.returnId + 'notes' ? 'Saving…' : 'Save Notes'}
                  </button>
                </div>

                <div className="rr-modal-status-row">
                  <span className="rr-detail-label">Update Status</span>
                  <div className="rr-status-actions">
                    {STATUS_OPTIONS.filter(s => s !== selectedRequest.status).map(s => (
                      <button
                        key={s}
                        className={`rr-btn rr-btn-status rr-status-btn-${s}`}
                        disabled={!!actionLoading}
                        onClick={() => handleUpdateStatus(selectedRequest.returnId, s)}
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
      </div>
    </AdminLayout>
  );
};

export default AdminRefundRequests;
