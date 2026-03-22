import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import NotificationPanel from './NotificationPanel';
import './NotificationBell.css';

const NotificationBell = () => {
  const { unreadCount, fetchUnreadCount, fetchNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  // Poll for unread count updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Optional: Play sound on new notification
  useEffect(() => {
    if (unreadCount > 0 && isOpen === false) {
      // You can add sound notification here
      // playNotificationSound();
    }
  }, [unreadCount, isOpen]);

  const handleToggle = () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening) {
      fetchNotifications();
    }
  };

  return (
    <div className="notification-bell-container">
      {/* Bell Icon Button */}
      <button
        className={`notification-bell-btn ${isOpen ? 'active' : ''}`}
        onClick={handleToggle}
        aria-label="Notifications"
        title="View notifications"
      >
        <Bell size={20} />
        
        {/* Badge with unread count */}
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      <NotificationPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
};

export default NotificationBell;
