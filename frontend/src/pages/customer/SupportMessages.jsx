import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import './SupportMessages.css';

/**
 * Customer Support Messages Component
 * Chat-style view of customer's contact form submissions and admin replies
 */
const SupportMessages = () => {
  const navigate = useNavigate();
  const { success, error } = useContext(ToastContext);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      error('Please login to view support messages');
      navigate('/login');
      return;
    }
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching customer support messages...');
      const { data } = await API.get('/contact/my-messages');

      if (data.success) {
        setMessages(data.data);
        console.log(`✅ Loaded ${data.data.length} support messages`);
        
        // Auto-select first message if available
        if (data.data.length > 0 && !selectedConversation) {
          setSelectedConversation(data.data[0]);
        }
      }
    } catch (err) {
      console.error('❌ Error fetching support messages:', err);
      
      // Handle different error scenarios
      if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        error('Cannot connect to server. Please ensure the backend is running.');
      } else if (err.response?.status === 401) {
        error('Session expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 404) {
        error('Support messages endpoint not found');
      } else {
        error(err.response?.data?.message || 'Failed to load support messages');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      new: { label: 'Pending', className: 'status-pending', icon: '⏳' },
      read: { label: 'Seen', className: 'status-seen', icon: '👁️' },
      replied: { label: 'Replied', className: 'status-replied', icon: '💬' },
      resolved: { label: 'Resolved', className: 'status-resolved', icon: '✅' }
    };
    
    const badge = badges[status] || badges.new;
    return (
      <span className={`support-status-badge ${badge.className}`}>
        <span className="badge-icon">{badge.icon}</span>
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatFullDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="support-messages-page">
        <div className="container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your messages...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="support-messages-page">
      <div className="container">
        <div className="support-header">
          <div className="header-left">
            <button className="btn-back" onClick={() => navigate(-1)} title="Go back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back
            </button>
            <div className="header-titles">
              <h1>Support Messages</h1>
              <p className="subtitle">View your inquiries and replies from our support team</p>
            </div>
          </div>
          <button className="btn-new-message" onClick={() => navigate('/contact')}>
            ➕ New Message
          </button>
        </div>

        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h2>No Support Messages</h2>
            <p>You haven't sent any messages to our support team yet.</p>
            <button className="btn-primary" onClick={() => navigate('/contact')}>
              Contact Support
            </button>
          </div>
        ) : (
          <div className="support-layout">
            {/* Sidebar - Message List */}
            <div className="messages-sidebar">
              <h3 className="sidebar-title">Your Conversations</h3>
              <div className="message-list">
                {messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`message-item ${selectedConversation?._id === msg._id ? 'active' : ''}`}
                    onClick={() => setSelectedConversation(msg)}
                  >
                    <div className="message-item-header">
                      <span className="message-subject">
                        {msg.inquiryType?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className="message-time">{formatDate(msg.createdAt)}</span>
                    </div>
                    <p className="message-preview">
                      {msg.message.substring(0, 60)}
                      {msg.message.length > 60 && '...'}
                    </p>
                    {getStatusBadge(msg.status)}
                  </div>
                ))}
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="chat-area">
              {selectedConversation ? (
                <>
                  <div className="chat-header">
                    <div>
                      <h2 className="chat-title">
                        {selectedConversation.inquiryType?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h2>
                      <p className="chat-subtitle">
                        Started on {formatFullDate(selectedConversation.createdAt)}
                      </p>
                    </div>
                    {getStatusBadge(selectedConversation.status)}
                  </div>

                  <div className="chat-messages">
                    {/* Customer's Original Message */}
                    <div className="message-bubble customer-bubble">
                      <div className="bubble-header">
                        <div className="bubble-avatar customer-avatar">You</div>
                        <span className="bubble-name">Your Message</span>
                      </div>
                      <div className="bubble-content">
                        {selectedConversation.message}
                      </div>
                      <div className="bubble-footer">
                        <span className="bubble-time">
                          {formatFullDate(selectedConversation.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Admin's Reply */}
                    {selectedConversation.replyMessage && (
                      <div className="message-bubble admin-bubble">
                        <div className="bubble-header">
                          <div className="bubble-avatar admin-avatar">
                            {selectedConversation.repliedBy?.charAt(0) || 'A'}
                          </div>
                          <span className="bubble-name">
                            {selectedConversation.repliedBy || 'Support Team'}
                          </span>
                        </div>
                        <div className="bubble-content">
                          {selectedConversation.replyMessage}
                        </div>
                        <div className="bubble-footer">
                          <span className="bubble-time">
                            {formatFullDate(selectedConversation.repliedAt)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Waiting for Reply Message */}
                    {!selectedConversation.replyMessage && (
                      <div className="waiting-message">
                        <div className="waiting-icon">⏳</div>
                        <p>
                          {selectedConversation.status === 'new' 
                            ? 'Your message has been received. Our support team will respond soon.'
                            : 'Our support team is reviewing your message.'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="chat-info">
                    <div className="info-card">
                      <span className="info-label">Need more help?</span>
                      <p className="info-text">
                        You can send a new message or call us at <strong>+91 9095399271</strong>
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="no-selection">
                  <div className="no-selection-icon">💬</div>
                  <p>Select a conversation to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportMessages;
