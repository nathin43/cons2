/**
 * Admin Dashboard Header Component with Notifications
 * Example integration of NotificationBell into admin dashboard
 */

import React from 'react';
import { Menu, LogOut, Settings } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { NotificationProvider } from '../../context/NotificationProvider';
import useNotificationSocket from '../../hooks/useNotificationSocket';
import './AdminHeader.css';

const AdminHeaderContent = () => {
  const { user, logout } = useAuth();
  
  // Initialize real-time notifications
  useNotificationSocket();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
      window.location.href = '/admin/login';
    }
  };

  return (
    <header className="admin-header">
      <div className="admin-header-container">
        {/* Left: Logo / Brand */}
        <div className="admin-header-left">
          <h1 className="admin-brand">Mani Electrical</h1>
        </div>

        {/* Center: Navigation (optional) */}
        <div className="admin-header-center">
          {/* Add navigation items if needed */}
        </div>

        {/* Right: Actions */}
        <div className="admin-header-right">
          {/* Notification Bell - Real-time async */}
          <NotificationBell />

          {/* Settings */}
          <button className="admin-header-btn" title="Settings">
            <Settings size={20} />
          </button>

          {/* User Profile Dropdown */}
          <div className="admin-user-profile">
            <img
              src={user?.avatar || '/default-avatar.png'}
              alt={user?.name || 'Admin'}
              className="admin-avatar"
            />
            <span className="admin-name">{user?.name}</span>
          </div>

          {/* Logout */}
          <button
            className="admin-header-btn logout-btn"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

// Main component with NotificationProvider
const AdminHeader = () => {
  return (
    <NotificationProvider>
      <AdminHeaderContent />
    </NotificationProvider>
  );
};

export default AdminHeader;

/**
 * Usage in Admin App.jsx or Layout:
 * 
 * import AdminHeader from './components/admin/AdminHeader';
 * 
 * function AdminLayout() {
 *   return (
 *     <>
 *       <AdminHeader />
 *       <main className="admin-main">
 *         {/* Admin content * /}
 *       </main>
 *     </>
 *   );
 * }
 */
