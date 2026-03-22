import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Private Route Component
 * Protects routes that require customer authentication
 * Only allows logged-in customers to access these routes
 */
const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="spinner"></div>;
  }

  // Only allow if user is logged in (not admin)
  return user ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
