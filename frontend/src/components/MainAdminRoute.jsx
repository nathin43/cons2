import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Main Admin Route Component
 * Protects routes that require MAIN_ADMIN role only
 * Used specifically for admin management features
 */
const MainAdminRoute = ({ children }) => {
  const { admin, isAdmin, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="spinner"></div>;
  }

  // If not authenticated as admin, redirect to login
  if (!isAdmin) {
    return <Navigate to="/admin/login" />;
  }

  // If admin but not MAIN_ADMIN role, redirect to dashboard
  if (admin?.role !== 'MAIN_ADMIN') {
    return <Navigate to="/admin/dashboard" />;
  }

  return children;
};

export default MainAdminRoute;
