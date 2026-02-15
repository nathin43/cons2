import { useState, useEffect, useContext } from 'react';
import AdminLayout from '../../components/AdminLayout';
import API from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import './AdminContactMessages.css';

/**
 * Admin Contact Messages Component
 * View and manage customer contact form submissions
 */
const AdminContactMessages = () => {
  const { success, error } = useContext(ToastContext);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [filter, setFilter] = useState('all'); // all, new, read, replied, resolved

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching contact messages from API...');
      const { data } = await API.get('/contact');
      
      console.log('📥 API Response:', data);
      
      if (data.success) {
        setMessages(data.data);
        console.log(`✅ Loaded ${data.data.length} contact messages`);
      } else {
        console.error('❌ API returned success: false');
        error('Failed to load contact messages');
      }
    } catch (err) {
      console.error('❌ Error fetching messages:', err);
      console.error('Error details:', err.response?.data);
      
      if (err.response?.status === 401) {
        error('Not authorized. Please log in as admin.');
      } else if (err.response?.status === 404) {
        error('Contact API endpoint not found');
      } else {
        error(err.response?.data?.message || 'Failed to load contact messages');
      }
    } finally {
      setLoading(false);
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
      new: { label: 'New', className: 'badge-new' },
      read: { label: 'Read', className: 'badge-read' },
      replied: { label: 'Replied', className: 'badge-replied' },
      resolved: { label: 'Resolved', className: 'badge-resolved' }
    };
    
    const badge = badges[status] || badges.new;
    return <span className={`status-badge ${badge.className}`}>{badge.label}</span>;
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
    if (filter === 'all') return true;
    return msg.status === filter;
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
        <div className="admin-contact-messages">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading messages...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-contact-messages">
        <div className="messages-header">
          <div className="header-content">
            <h1>Contact Messages</h1>
            <p className="header-subtitle">View and manage customer inquiries</p>
          </div>
          <button className="refresh-btn" onClick={fetchMessages}>
            🔄 Refresh
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card" onClick={() => setFilter('all')}>
            <div className="stat-icon total">📧</div>
            <div className="stat-info">
              <p className="stat-label">Total Messages</p>
              <h3 className="stat-value">{stats.total}</h3>
            </div>
          </div>
          <div className="stat-card" onClick={() => setFilter('new')}>
            <div className="stat-icon new">🔔</div>
            <div className="stat-info">
              <p className="stat-label">New</p>
              <h3 className="stat-value">{stats.new}</h3>
            </div>
          </div>
          <div className="stat-card" onClick={() => setFilter('read')}>
            <div className="stat-icon read">👁️</div>
            <div className="stat-info">
              <p className="stat-label">Read</p>
              <h3 className="stat-value">{stats.read}</h3>
            </div>
          </div>
          <div className="stat-card" onClick={() => setFilter('replied')}>
            <div className="stat-icon replied">💬</div>
            <div className="stat-info">
              <p className="stat-label">Replied</p>
              <h3 className="stat-value">{stats.replied}</h3>
            </div>
          </div>
          <div className="stat-card" onClick={() => setFilter('resolved')}>
            <div className="stat-icon resolved">✅</div>
            <div className="stat-info">
              <p className="stat-label">Resolved</p>
              <h3 className="stat-value">{stats.resolved}</h3>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({stats.total})
          </button>
          <button 
            className={`filter-tab ${filter === 'new' ? 'active' : ''}`}
            onClick={() => setFilter('new')}
          >
            New ({stats.new})
          </button>
          <button 
            className={`filter-tab ${filter === 'read' ? 'active' : ''}`}
            onClick={() => setFilter('read')}
          >
            Read ({stats.read})
          </button>
          <button 
            className={`filter-tab ${filter === 'replied' ? 'active' : ''}`}
            onClick={() => setFilter('replied')}
          >
            Replied ({stats.replied})
          </button>
          <button 
            className={`filter-tab ${filter === 'resolved' ? 'active' : ''}`}
            onClick={() => setFilter('resolved')}
          >
            Resolved ({stats.resolved})
          </button>
        </div>

        {/* Messages Table */}
        {filteredMessages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-illustration">
              <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="80" fill="#f3f4f6"/>
                <path d="M60 80h80v60H60z" fill="#e5e7eb"/>
                <path d="M60 80l40 30 40-30" stroke="#9ca3af" strokeWidth="3" fill="none"/>
                <circle cx="100" cy="60" r="25" fill="#dbeafe"/>
                <text x="100" y="70" textAnchor="middle" fill="#3b82f6" fontSize="30">📬</text>
              </svg>
            </div>
            <h3>No messages yet</h3>
            <p>Contact form submissions will appear here</p>
          </div>
        ) : (
          <div className="messages-table-container">
            <table className="messages-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Inquiry Type</th>
                  <th>Message Preview</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map((message) => (
                  <tr key={message._id} className={message.status === 'new' ? 'unread-row' : ''}>
                    <td>{getStatusBadge(message.status)}</td>
                    <td className="name-cell">{message.name}</td>
                    <td className="email-cell">{message.email}</td>
                    <td className="phone-cell">{message.phone}</td>
                    <td className="inquiry-cell">{getInquiryTypeLabel(message.inquiryType)}</td>
                    <td className="message-preview">
                      {message.message.substring(0, 40)}
                      {message.message.length > 40 && '...'}
                    </td>
                    <td className="date-cell">{formatDate(message.createdAt)}</td>
                    <td className="actions-cell">
                      <button 
                        className="action-btn view-btn"
                        onClick={() => handleViewMessage(message)}
                        title="View Details"
                      >
                        👁️
                      </button>
                      <button 
                        className="action-btn reply-btn"
                        onClick={() => handleOpenReplyModal(message)}
                        title="Reply to Customer"
                      >
                        💬
                      </button>
                      <button 
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(message._id)}
                        title="Delete Message"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Message Detail Modal */}
        {showModal && selectedMessage && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Message Details</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>
                  ✕
                </button>
              </div>
              
              <div className="modal-body">
                <div className="detail-row">
                  <label>Status:</label>
                  <div>{getStatusBadge(selectedMessage.status)}</div>
                </div>
                
                <div className="detail-row">
                  <label>Name:</label>
                  <div>{selectedMessage.name}</div>
                </div>
                
                <div className="detail-row">
                  <label>Email:</label>
                  <div>
                    <a href={`mailto:${selectedMessage.email}`}>{selectedMessage.email}</a>
                  </div>
                </div>
                
                <div className="detail-row">
                  <label>Phone:</label>
                  <div>
                    <a href={`tel:${selectedMessage.phone}`}>{selectedMessage.phone}</a>
                  </div>
                </div>
                
                <div className="detail-row">
                  <label>Inquiry Type:</label>
                  <div>{getInquiryTypeLabel(selectedMessage.inquiryType)}</div>
                </div>
                
                <div className="detail-row">
                  <label>Date:</label>
                  <div>{formatDate(selectedMessage.createdAt)}</div>
                </div>
                
                <div className="detail-row full-width">
                  <label>Message:</label>
                  <div className="message-full">{selectedMessage.message}</div>
                </div>
                
                {selectedMessage.replyMessage && (
                  <div className="detail-row full-width reply-section">
                    <label>Admin Reply:</label>
                    <div className="reply-content">{selectedMessage.replyMessage}</div>
                    {selectedMessage.repliedAt && (
                      <small className="reply-date">
                        Replied on: {formatDate(selectedMessage.repliedAt)}
                      </small>
                    )}
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                {selectedMessage.status === 'new' && (
                  <button 
                    className="modal-btn mark-read-btn"
                    onClick={() => markAsRead(selectedMessage._id)}
                  >
                    Mark as Read
                  </button>
                )}
                <button 
                  className="modal-btn delete-btn"
                  onClick={() => handleDelete(selectedMessage._id)}
                >
                  Delete Message
                </button>
                <button 
                  className="modal-btn close-btn"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reply Modal */}
        {showReplyModal && selectedMessage && (
          <div className="modal-overlay" onClick={() => setShowReplyModal(false)}>
            <div className="modal-content reply-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Reply to Customer</h2>
                <button className="modal-close" onClick={() => setShowReplyModal(false)}>
                  ✕
                </button>
              </div>
              
              <div className="modal-body">
                <div className="detail-row">
                  <label>Customer Name:</label>
                  <div className="readonly-field">{selectedMessage.name}</div>
                </div>
                
                <div className="detail-row">
                  <label>Customer Email:</label>
                  <div className="readonly-field">{selectedMessage.email}</div>
                </div>
                
                <div className="detail-row full-width">
                  <label>Original Message:</label>
                  <div className="readonly-message">{selectedMessage.message}</div>
                </div>

                {selectedMessage.replyMessage && (
                  <div className="detail-row full-width">
                    <label>Previous Reply:</label>
                    <div className="previous-reply">{selectedMessage.replyMessage}</div>
                  </div>
                )}
                
                <div className="detail-row full-width">
                  <label>Your Reply:</label>
                  <textarea
                    className="reply-textarea"
                    placeholder="Type your reply to the customer here..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows="6"
                    disabled={sendingReply}
                  />
                  <small className="reply-hint">
                    The customer will receive this reply via email at {selectedMessage.email}
                  </small>
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  className="modal-btn cancel-btn"
                  onClick={() => setShowReplyModal(false)}
                  disabled={sendingReply}
                >
                  Cancel
                </button>
                <button 
                  className="modal-btn send-reply-btn"
                  onClick={handleSendReply}
                  disabled={sendingReply || !replyMessage.trim()}
                >
                  {sendingReply ? '📧 Sending...' : '📧 Send Reply'}
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
