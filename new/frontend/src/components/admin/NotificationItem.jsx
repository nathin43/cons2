import React from 'react';
import {
  ShoppingBag,
  AlertTriangle,
  AlertCircle,
  ShoppingCart,
  XCircle,
  UserPlus,
  Mail,
  Undo2,
  X,
  Dot,
} from 'lucide-react';
import './NotificationItem.css';

const iconMap = {
  'shopping-bag': ShoppingBag,
  'alert-triangle': AlertTriangle,
  'alert-circle': AlertCircle,
  'shopping-cart': ShoppingCart,
  'x-circle': XCircle,
  'user-plus': UserPlus,
  mail: Mail,
  'undo-2': Undo2,
};

const colorClasses = {
  green: 'notification-item-green',
  orange: 'notification-item-orange',
  red: 'notification-item-red',
  blue: 'notification-item-blue',
  purple: 'notification-item-purple',
  yellow: 'notification-item-yellow',
  gray: 'notification-item-gray',
};

const NotificationItem = ({
  notification,
  onMarkAsRead,
  onDelete,
}) => {
  const IconComponent = iconMap[notification.icon] || Mail;
  const colorClass = colorClasses[notification.color] || colorClasses.gray;

  const handleMarkAsRead = (e) => {
    e.stopPropagation();
    if (!notification.read) {
      onMarkAsRead(notification._id);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(notification._id);
  };

  const formatTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  };

  return (
    <div className={`notification-item ${colorClass} ${!notification.read ? 'unread' : ''}`}>
      {/* Icon Container */}
      <div className="notification-icon-container">
        <IconComponent size={20} className="notification-icon" />
        {!notification.read && <Dot size={8} className="notification-dot" />}
      </div>

      {/* Content */}
      <div className="notification-content">
        <div className="notification-header">
          <h4 className="notification-title">{notification.title}</h4>
          <span className="notification-time">{formatTime(notification.createdAt)}</span>
        </div>
        <p className="notification-description">{notification.description}</p>
        {notification.data && (
          <div className="notification-data">
            {notification.data.productName && (
              <span className="data-item">📦 {notification.data.productName}</span>
            )}
            {notification.data.orderNumber && (
              <span className="data-item">🛒 Ord: {notification.data.orderNumber}</span>
            )}
            {notification.data.customerName && (
              <span className="data-item">👤 {notification.data.customerName}</span>
            )}
            {notification.data.amount && (
              <span className="data-item">₹{notification.data.amount.toLocaleString()}</span>
            )}
            {notification.data.stock !== undefined && (
              <span className="data-item">📈 Stock: {notification.data.stock}</span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="notification-actions">
        {!notification.read && (
          <button
            className="notification-action-btn unread-btn"
            onClick={handleMarkAsRead}
            title="Mark as read"
          >
            ✓
          </button>
        )}
        <button
          className="notification-action-btn delete-btn"
          onClick={handleDelete}
          title="Delete"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default NotificationItem;
