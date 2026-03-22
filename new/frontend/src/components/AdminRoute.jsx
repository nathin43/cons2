import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationProvider';

/**
 * Admin Route Component
 * Protects routes that require admin authentication
 * Redirects customers to home page
 * Wraps with NotificationProvider for real-time notification support
 */
const AdminRoute = ({ children }) => {
  const { isAdmin, isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="spinner"></div>;
  }

  // If customer tries to access admin routes, redirect to home
  if (isAuthenticated && !isAdmin) {
    return <Navigate to="/" />;
  }

  return isAdmin ? (
    <NotificationProvider>
      {children}
    </NotificationProvider>
  ) : (
    <Navigate to="/admin/login" />
  );
};

export default AdminRoute;
