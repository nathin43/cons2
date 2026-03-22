import React, { useEffect, useRef } from 'react';
import { ChevronUp, Trash2, Check } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import NotificationFilterBar from './NotificationFilterBar';
import NotificationItem from './NotificationItem';
import './NotificationPanel.css';

const NotificationPanel = ({ isOpen, onClose }) => {
  const {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    fetchNotifications,
  } = useNotifications();

  const panelRef = useRef(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // Prevent body scroll when panel is open
  // NOTE: Removed overflow:hidden — admin needs to keep scrolling while panel is open

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      await clearAllNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleScroll = (e) => {
    const element = e.target;
    // Implement infinite scroll if needed
    if (element.scrollHeight - element.scrollTop === element.clientHeight) {
      // Load more notifications
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className={`notification-backdrop ${isOpen ? 'active' : ''}`} onClick={onClose} />

      {/* Panel */}
      <div
        className={`notification-panel ${isOpen ? 'open' : ''}`}
        ref={panelRef}
      >
        {/* Header */}
        <div className="notification-panel-header">
          <h3 className="notification-panel-title">Notifications</h3>
          <button
            className="notification-panel-close"
            onClick={onClose}
            aria-label="Close"
          >
            <ChevronUp size={20} />
          </button>
        </div>

        {/* Filter Bar */}
        <NotificationFilterBar />

        {/* Toolbar */}
        {notifications.length > 0 && (
          <div className="notification-panel-toolbar">
            <button
              className="notification-toolbar-btn mark-all-btn"
              onClick={handleMarkAllRead}
              title="Mark all as read"
            >
              <Check size={16} />
              Mark All Read
            </button>
            <button
              className="notification-toolbar-btn clear-all-btn"
              onClick={handleClearAll}
              title="Clear all notifications"
            >
              <Trash2 size={16} />
              Clear All
            </button>
          </div>
        )}

        {/* Content */}
        <div className="notification-panel-content" onScroll={handleScroll}>
          {loading && notifications.length === 0 ? (
            <div className="notification-empty-state">
              <div className="loading-spinner" />
              <p>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty-state">
              <div className="empty-icon">🔔</div>
              <h4>No notifications</h4>
              <p>You're all caught up!</p>
            </div>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="notification-panel-footer">
            <span className="notification-count">
              {notifications.filter((n) => !n.read).length} unread
            </span>
            <button
              className="notification-footer-btn"
              onClick={() => fetchNotifications()}
            >
              Refresh
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationPanel;
