import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import DashboardSkeleton from '../../components/DashboardSkeleton';
import useAdminLoader from '../../hooks/useAdminLoader';
import API from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import './AdminContactMessages.css';

/**
 * Admin Contact Messages Component
 * View and manage customer contact form submissions
 */
const AdminContactMessages = () => {
  const navigate = useNavigate();
  const { success, error } = useContext(ToastContext);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [inquiryFilter, setInquiryFilter] = useState('all');
  const { loading, run } = useAdminLoader();

  useEffect(() => {
    run(fetchMessages);
  }, []);

  const fetchMessages = async () => {
    try {
      console.log('ðŸ”„ Fetching contact messages from API...');
      const { data } = await API.get('/contact');
      console.log('ðŸ“¥ API Response:', data);
      if (data.success) {
        setMessages(data.data);
        console.log(`âœ… Loaded ${data.data.length} contact messages`);
      } else {
        console.error('âŒ API returned success: false');
        error('Failed to load contact messages');
      }
    } catch (err) {
      console.error('âŒ Error fetching messages:', err);
      console.error('Error details:', err.response?.data);
      if (err.response?.status === 401) {
        error('Not authorized. Please log in as admin.');
      } else if (err.response?.status === 404) {
        error('Contact API endpoint not found');
      } else {
        error(err.response?.data?.message || 'Failed to load contact messages');
      }
    }
  };

  const handleViewMessage = (message) => {
    setSelectedMessage(message);
    setShowModal(true);
    
    // Mark as read if it's new
    if (message.status === 'new') {
      markAsRead(message._id);
    }
  };

  const markAsRead = async (id) => {
    try {
      const { data } = await API.put(`/contact/${id}/mark-read`);
      
      if (data.success) {
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg._id === id ? { ...msg, status: 'read' } : msg
          )
        );
        if (selectedMessage?._id === id) {
          setSelectedMessage({ ...selectedMessage, status: 'read' });
        }
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const { data } = await API.delete(`/contact/${id}`);
      
      if (data.success) {
        success('Message deleted successfully');
        setMessages(prevMessages => prevMessages.filter(msg => msg._id !== id));
        setShowModal(false);
        setSelectedMessage(null);
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      error('Failed to delete message');
    }
  };

  const handleOpenReplyModal = (message) => {
    setSelectedMessage(message);
    setReplyMessage('');
    setShowReplyModal(true);
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      error('Please enter a reply message');
      return;
    }

    try {
      setSendingReply(true);
      const { data } = await API.put(`/contact/${selectedMessage._id}/reply`, {
        replyMessage: replyMessage.trim()
      });

      if (data.success) {
        success('Reply sent successfully! Customer will receive an email notification.');
        
        // Update the message in the list
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg._id === selectedMessage._id 
              ? { ...msg, status: 'replied', replyMessage: replyMessage.trim(), repliedAt: new Date() }
              : msg
          )
        );

        setShowReplyModal(false);
        setReplyMessage('');
        setSelectedMessage(null);
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      error(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      new:      { label: 'New',      cls: 'acm-badge-new' },
      read:     { label: 'Read',     cls: 'acm-badge-read' },
      replied:  { label: 'Replied',  cls: 'acm-badge-replied' },
      resolved: { label: 'Resolved', cls: 'acm-badge-resolved' },
    };
    const b = badges[status] || badges.new;
    return <span className={`acm-badge ${b.cls}`}>{b.label}</span>;
  };

  const getInquiryTypeLabel = (type) => {
    const labels = {
      'general-question': 'General Question',
      'product-info': 'Product Information',
      'order-issue': 'Order Issue',
      'return-replacement': 'Return/Replacement',
      'warranty': 'Warranty Support',
      'technical': 'Technical Assistance'
    };
    return labels[type] || type;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredMessages = messages.filter(msg => {
    const statusMatch = filter === 'all' || msg.status === filter;
    const inquiryMatch = inquiryFilter === 'all' || msg.inquiryType === inquiryFilter;
    const q = search.toLowerCase();
    const searchMatch = !q ||
      msg.name?.toLowerCase().includes(q) ||
      msg.email?.toLowerCase().includes(q) ||
      msg.message?.toLowerCase().includes(q);
    return statusMatch && inquiryMatch && searchMatch;
  });

  const stats = {
    total: messages.length,
    new: messages.filter(m => m.status === 'new').length,
    read: messages.filter(m => m.status === 'read').length,
    replied: messages.filter(m => m.status === 'replied').length,
    resolved: messages.filter(m => m.status === 'resolved').length
  };

  if (loading) {
    return (
      <AdminLayout>
        <DashboardSkeleton title="Loading Messages" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="acm-page">

        {/* â”€â”€ Header â”€â”€ */}
        <div className="acm-header">
          <div className="acm-header-left">
            <h1 className="acm-title">Contact Messages</h1>
            <p className="acm-subtitle">Manage and respond to customer inquiries.</p>
          </div>
          <div className="acm-header-right">
            <button className="acm-btn acm-btn-outline" onClick={fetchMessages}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
              Refresh
            </button>
            <button className="acm-btn acm-btn-primary" onClick={() => navigate('/')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              View Site
            </button>
          </div>
        </div>

        {/* â”€â”€ Stat Cards â”€â”€ */}
        <div className="acm-stats">
          {[
            { key: 'all',      label: 'Total Messages', value: stats.total,    color: 'blue',   icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
            { key: 'new',      label: 'New',            value: stats.new,     color: 'orange', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
            { key: 'read',     label: 'Read',           value: stats.read,    color: 'green',  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
            { key: 'replied',  label: 'Replied',        value: stats.replied, color: 'purple', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
            { key: 'resolved', label: 'Resolved',       value: stats.resolved,color: 'teal',   icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
          ].map(s => (
            <div key={s.key} className={`acm-stat-card acm-stat-${s.color} ${filter === s.key ? 'acm-stat-active' : ''}`} onClick={() => setFilter(s.key)}>
              <div className={`acm-stat-icon acm-icon-${s.color}`}>{s.icon}</div>
              <div className="acm-stat-body">
                <span className="acm-stat-label">{s.label}</span>
                <span className="acm-stat-value">{s.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* â”€â”€ Toolbar: Search + Tabs + Inquiry Filter â”€â”€ */}
        <div className="acm-toolbar">
          <div className="acm-search-wrap">
            <svg className="acm-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              className="acm-search"
              type="text"
              placeholder="Search by name, email, or message..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="acm-inquiry-select" value={inquiryFilter} onChange={e => setInquiryFilter(e.target.value)}>
            <option value="all">All Types</option>
            <option value="general-question">General Question</option>
            <option value="product-info">Product Information</option>
            <option value="order-issue">Order Issue</option>
            <option value="return-replacement">Return / Replacement</option>
            <option value="warranty">Warranty Support</option>
            <option value="technical">Technical Assistance</option>
          </select>
        </div>

        {/* â”€â”€ Pill Tabs â”€â”€ */}
        <div className="acm-tabs">
          {[{k:'all',l:'All'},{k:'new',l:'New'},{k:'read',l:'Read'},{k:'replied',l:'Replied'},{k:'resolved',l:'Resolved'}].map(t => (
            <button key={t.k} className={`acm-tab ${filter === t.k ? 'acm-tab-active' : ''}`} onClick={() => setFilter(t.k)}>
              {t.l} <span className="acm-tab-count">{t.k === 'all' ? stats.total : stats[t.k]}</span>
            </button>
          ))}
        </div>

        {/* â”€â”€ Table or Empty State â”€â”€ */}
        {filteredMessages.length === 0 ? (
          <div className="acm-empty">

            <h3>No messages found</h3>
            <p>{search || inquiryFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Contact form submissions will appear here.'}</p>
          </div>
        ) : (
          <div className="acm-table-wrap">
            <table className="acm-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Type</th>
                  <th>Message</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map(msg => (
                  <tr key={msg._id} className={msg.status === 'new' ? 'acm-row-new' : ''}>
                    <td>{getStatusBadge(msg.status)}</td>
                    <td className="acm-name">{msg.name}</td>
                    <td className="acm-email">{msg.email}</td>
                    <td className="acm-phone">{msg.phone}</td>
                    <td><span className="acm-type-chip">{getInquiryTypeLabel(msg.inquiryType)}</span></td>
                    <td>
                      <span className="acm-preview" title={msg.message}>
                        {msg.message.length > 45 ? msg.message.substring(0, 45) + '...' : msg.message}
                      </span>
                    </td>
                    <td className="acm-date">{formatDate(msg.createdAt)}</td>
                    <td>
                      <div className="acm-actions">
                        <button className="acm-icon-btn acm-view" onClick={() => handleViewMessage(msg)} title="View">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button className="acm-icon-btn acm-reply" onClick={() => handleOpenReplyModal(msg)} title="Reply">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        </button>
                        <button className="acm-icon-btn acm-delete" onClick={() => handleDelete(msg._id)} title="Delete">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* â”€â”€ View Modal â”€â”€ */}
        {showModal && selectedMessage && (
          <div className="acm-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="acm-modal" onClick={e => e.stopPropagation()}>
              <div className="acm-modal-header">
                <h2>Message Details</h2>
                <button className="acm-modal-close" onClick={() => setShowModal(false)}>&times;</button>
              </div>
              <div className="acm-modal-body">
                <div className="acm-detail-grid">
                  <div className="acm-detail-item">
                    <span className="acm-detail-label">Status</span>
                    <span>{getStatusBadge(selectedMessage.status)}</span>
                  </div>
                  <div className="acm-detail-item">
                    <span className="acm-detail-label">Name</span>
                    <span>{selectedMessage.name}</span>
                  </div>
                  <div className="acm-detail-item">
                    <span className="acm-detail-label">Email</span>
                    <a href={`mailto:${selectedMessage.email}`} className="acm-link">{selectedMessage.email}</a>
                  </div>
                  <div className="acm-detail-item">
                    <span className="acm-detail-label">Phone</span>
                    <a href={`tel:${selectedMessage.phone}`} className="acm-link">{selectedMessage.phone}</a>
                  </div>
                  <div className="acm-detail-item">
                    <span className="acm-detail-label">Type</span>
                    <span>{getInquiryTypeLabel(selectedMessage.inquiryType)}</span>
                  </div>
                  <div className="acm-detail-item">
                    <span className="acm-detail-label">Date</span>
                    <span>{formatDate(selectedMessage.createdAt)}</span>
                  </div>
                </div>
                <div className="acm-detail-block">
                  <span className="acm-detail-label">Message</span>
                  <div className="acm-message-box">{selectedMessage.message}</div>
                </div>
                {selectedMessage.replyMessage && (
                  <div className="acm-detail-block">
                    <span className="acm-detail-label">Admin Reply</span>
                    <div className="acm-reply-box">{selectedMessage.replyMessage}</div>
                    {selectedMessage.repliedAt && (
                      <small className="acm-reply-date">Replied on: {formatDate(selectedMessage.repliedAt)}</small>
                    )}
                  </div>
                )}
              </div>
              <div className="acm-modal-footer">
                {selectedMessage.status === 'new' && (
                  <button className="acm-btn acm-btn-outline" onClick={() => markAsRead(selectedMessage._id)}>Mark as Read</button>
                )}
                <button className="acm-btn acm-btn-danger" onClick={() => handleDelete(selectedMessage._id)}>Delete</button>
                <button className="acm-btn acm-btn-primary" onClick={() => { setShowModal(false); handleOpenReplyModal(selectedMessage); }}>Reply</button>
                <button className="acm-btn acm-btn-outline" onClick={() => setShowModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* â”€â”€ Reply Modal â”€â”€ */}
        {showReplyModal && selectedMessage && (
          <div className="acm-modal-overlay" onClick={() => setShowReplyModal(false)}>
            <div className="acm-modal" onClick={e => e.stopPropagation()}>
              <div className="acm-modal-header">
                <h2>Reply to Customer</h2>
                <button className="acm-modal-close" onClick={() => setShowReplyModal(false)}>&times;</button>
              </div>
              <div className="acm-modal-body">
                <div className="acm-detail-grid">
                  <div className="acm-detail-item">
                    <span className="acm-detail-label">Customer</span>
                    <span>{selectedMessage.name}</span>
                  </div>
                  <div className="acm-detail-item">
                    <span className="acm-detail-label">Email</span>
                    <span>{selectedMessage.email}</span>
                  </div>
                </div>
                <div className="acm-detail-block">
                  <span className="acm-detail-label">Original Message</span>
                  <div className="acm-message-box">{selectedMessage.message}</div>
                </div>
                {selectedMessage.replyMessage && (
                  <div className="acm-detail-block">
                    <span className="acm-detail-label">Previous Reply</span>
                    <div className="acm-reply-box">{selectedMessage.replyMessage}</div>
                  </div>
                )}
                <div className="acm-detail-block">
                  <span className="acm-detail-label">Your Reply</span>
                  <textarea
                    className="acm-textarea"
                    placeholder="Type your reply to the customer here..."
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    rows="5"
                    disabled={sendingReply}
                  />
                  <small className="acm-hint">Customer will receive this reply via email at {selectedMessage.email}</small>
                </div>
              </div>
              <div className="acm-modal-footer">
                <button className="acm-btn acm-btn-outline" onClick={() => setShowReplyModal(false)} disabled={sendingReply}>Cancel</button>
                <button className="acm-btn acm-btn-primary" onClick={handleSendReply} disabled={sendingReply || !replyMessage.trim()}>
                  {sendingReply ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminContactMessages;
