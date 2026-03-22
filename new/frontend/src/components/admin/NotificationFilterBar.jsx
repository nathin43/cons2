import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import './NotificationFilterBar.css';

const NotificationFilterBar = () => {
  const { filters, setStatusFilter, setTypeFilter, resetFilters } = useNotifications();

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'read', label: 'Read' },
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'orders', label: 'Orders' },
    { value: 'refunds', label: 'Refunds' },
    { value: 'customers', label: 'Customers' },
    { value: 'messages', label: 'Messages' },
    { value: 'stock', label: 'Stock Alerts' },
  ];

  const hasActiveFilters = filters.status !== 'all' || filters.type !== 'all';

  return (
    <div className="notification-filter-bar">
      {/* Status Filters */}
      <div className="notification-filter-group">
        <div className="notification-filter-label">Status</div>
        <div className="notification-filter-buttons">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              className={`notification-filter-btn status-btn ${
                filters.status === option.value ? 'active' : ''
              }`}
              onClick={() => setStatusFilter(option.value)}
              title={`Filter by ${option.label}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Type Filters */}
      <div className="notification-filter-group">
        <div className="notification-filter-label">Type</div>
        <div className="notification-filter-buttons">
          {typeOptions.map((option) => (
            <button
              key={option.value}
              className={`notification-filter-btn type-btn ${
                filters.type === option.value ? 'active' : ''
              }`}
              onClick={() => setTypeFilter(option.value)}
              title={`Filter by ${option.label}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reset Filters Button */}
      {hasActiveFilters && (
        <div className="notification-filter-reset">
          <button
            className="notification-filter-reset-btn"
            onClick={resetFilters}
            title="Clear all filters"
          >
            ✕ Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationFilterBar;
