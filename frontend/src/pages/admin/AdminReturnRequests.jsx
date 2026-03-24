import { useState, useEffect, useCallback } from 'react';
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

const StatusBadge = ({ status }) => (
  <span className={`rr-status-badge rr-status-${status}`}>
    {status === 'new' ? 'Pending' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
  </span>
);

const AdminReturnRequests = () => {
  const [returns, setReturns] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const { loading, run } = useAdminLoader();
  const { success, error: toastError } = useToast();

  const fetchReturns = useCallback(async () => {
    try {
      const { data } = await API.get('/returns');
      if (data.success) {
        setReturns(data.returns || []);
      }
    } catch (err) {
      toastError('Failed to load return requests.');
    }
  }, []);

  useEffect(() => {
    run(fetchReturns);
  }, []);

  useEffect(() => {
    let result = [...returns];

    if (statusFilter !== 'all') {
      result = result.filter((entry) => entry.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((entry) =>
        String(entry.name || '').toLowerCase().includes(q) ||
        String(entry.email || '').toLowerCase().includes(q) ||
        String(entry.orderId || '').toLowerCase().includes(q) ||
        String(entry.reason || '').toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [returns, statusFilter, searchQuery]);

  const pendingCount = returns.filter((entry) => ['new', 'in-progress'].includes(entry.status)).length;

  const handleUpdateStatus = async (returnId, newStatus) => {
    setActionLoading(`${returnId}-${newStatus}`);
    try {
      const { data } = await API.put(`/returns/${returnId}`, {
        status: newStatus,
        adminNotes: selectedRequest?.returnId === returnId ? adminNotes : undefined,
      });

      if (data.success) {
        setReturns((prev) => prev.map((entry) =>
          entry.returnId === returnId
            ? { ...entry, status: newStatus, adminNotes: data.return?.adminNotes || entry.adminNotes }
            : entry
        ));
        if (selectedRequest?.returnId === returnId) {
          setSelectedRequest((prev) => ({ ...prev, status: newStatus }));
        }

        if (newStatus === 'approved') {
          success('Return approved and moved to Refund Requests.');
        } else {
          success('Return request updated successfully.');
        }
      }
    } catch (err) {
      toastError('Failed to update return request.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedRequest) return;

    setActionLoading(`${selectedRequest.returnId}-notes`);
    try {
      const { data } = await API.put(`/returns/${selectedRequest.returnId}`, {
        status: selectedRequest.status,
        adminNotes,
      });
      if (data.success) {
        setReturns((prev) => prev.map((entry) =>
          entry.returnId === selectedRequest.returnId ? { ...entry, adminNotes } : entry
        ));
        success('Notes saved successfully.');
      }
    } catch (err) {
      toastError('Failed to save notes.');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

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
            <h1 className="rr-title">
              Return Requests
              {pendingCount > 0 && <span className="rr-pending-badge">{pendingCount} pending</span>}
            </h1>
            <p className="rr-subtitle">Handle product return approvals. Approved returns auto-create refund requests.</p>
          </div>
        </div>

        <div className="rr-filters">
          <div className="rr-search-box">
            <span className="rr-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by customer, order ID, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rr-search-input"
            />
            {searchQuery && (
              <button className="rr-search-clear" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>

          <div className="rr-status-tabs">
            {['all', 'new', 'in-progress', 'approved', 'rejected', 'completed'].map((status) => (
              <button
                key={status}
                className={`rr-tab ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' ? 'All' : status === 'new' ? 'Pending' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rr-empty">
            <span className="rr-empty-icon">📦</span>
            <p>No return requests found</p>
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
                {filtered.map((entry) => (
                  <tr key={entry.returnId} className={entry.status === 'new' ? 'rr-row-new' : ''}>
                    <td><span className="rr-order-id">{entry.orderId ? `#${entry.orderId}` : '—'}</span></td>
                    <td>
                      <div className="rr-customer">
                        <span className="rr-customer-name">{entry.name}</span>
                        <span className="rr-customer-email">{entry.email}</span>
                      </div>
                    </td>
                    <td><span className="rr-category-pill">{entry.category}</span></td>
                    <td>{REASON_LABELS[entry.reason] || entry.reason}</td>
                    <td>{formatDate(entry.createdAt)}</td>
                    <td><StatusBadge status={entry.status} /></td>
                    <td>
                      <div className="rr-actions">
                        <button className="rr-btn rr-btn-view" onClick={() => { setSelectedRequest(entry); setAdminNotes(entry.adminNotes || ''); }}>
                          👁 View
                        </button>
                        {entry.status !== 'approved' && (
                          <button
                            className="rr-btn rr-btn-approve"
                            disabled={actionLoading === `${entry.returnId}-approved`}
                            onClick={() => handleUpdateStatus(entry.returnId, 'approved')}
                          >
                            {actionLoading === `${entry.returnId}-approved` ? '…' : '✔ Approve'}
                          </button>
                        )}
                        {entry.status !== 'rejected' && (
                          <button
                            className="rr-btn rr-btn-reject"
                            disabled={actionLoading === `${entry.returnId}-rejected`}
                            onClick={() => handleUpdateStatus(entry.returnId, 'rejected')}
                          >
                            {actionLoading === `${entry.returnId}-rejected` ? '…' : '✕ Reject'}
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

        {selectedRequest && (
          <div className="rr-modal-overlay" onClick={() => setSelectedRequest(null)}>
            <div className="rr-modal" onClick={(e) => e.stopPropagation()}>
              <div className="rr-modal-header">
                <div>
                  <h2 className="rr-modal-title">Return Request Details</h2>
                  <span className="rr-modal-id">ID: {selectedRequest.returnId}</span>
                </div>
                <button className="rr-modal-close" onClick={() => setSelectedRequest(null)}>✕</button>
              </div>

              <div className="rr-modal-body">
                <div className="rr-detail-grid">
                  <div className="rr-detail-row"><span className="rr-detail-label">Customer</span><span className="rr-detail-value">{selectedRequest.name}</span></div>
                  <div className="rr-detail-row"><span className="rr-detail-label">Email</span><span className="rr-detail-value">{selectedRequest.email}</span></div>
                  <div className="rr-detail-row"><span className="rr-detail-label">Phone</span><span className="rr-detail-value">{selectedRequest.phone}</span></div>
                  <div className="rr-detail-row"><span className="rr-detail-label">Order ID</span><span className="rr-detail-value">{selectedRequest.orderId || '—'}</span></div>
                  <div className="rr-detail-row"><span className="rr-detail-label">Status</span><span className="rr-detail-value"><StatusBadge status={selectedRequest.status} /></span></div>
                </div>

                <div className="rr-detail-message">
                  <span className="rr-detail-label">Customer Message</span>
                  <p className="rr-message-text">{selectedRequest.message}</p>
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
                    onClick={handleSaveNotes}
                    disabled={actionLoading === `${selectedRequest.returnId}-notes`}
                  >
                    {actionLoading === `${selectedRequest.returnId}-notes` ? 'Saving…' : 'Save Notes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReturnRequests;
