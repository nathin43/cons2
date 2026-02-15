import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Admin Route Component
 * Protects routes that require admin authentication
 * Redirects customers to home page
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

  return isAdmin ? children : <Navigate to="/admin/login" />;
};

export default AdminRoute;
