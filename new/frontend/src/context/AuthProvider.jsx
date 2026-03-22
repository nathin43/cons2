import { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import LogoutTransition from '../components/LogoutTransition';
import { AuthContext } from './AuthContext';

/**
 * Authentication Context Provider
 * Manages user authentication state and operations
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutCallback, setLogoutCallback] = useState(null);
  const [logoutType, setLogoutType] = useState(null); // 'user' | 'admin'

  // React to token-cleared events dispatched by the API response interceptor.
  // When a 401 clears localStorage.token outside of React, this keeps
  // isAuthenticated in sync so polling (bell, etc.) stops immediately.
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
    };
    window.addEventListener('auth:user-session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:user-session-expired', handleSessionExpired);
  }, []);

  // Restore session from localStorage on component mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // sessionStorage flag acts as a "session active" gate.
        // sessionStorage is cleared when the browser tab/window is closed,
        // so a fresh browser open always starts as guest.
        const sessionActive = sessionStorage.getItem('sessionActive');

        if (!sessionActive) {
          // No active session — clear any stale localStorage data and stay as guest
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('admin');
          return;
        }

        // Snapshot tokens BEFORE any async call so we can detect if a
        // concurrent login replaced them while validation was in-flight.
        const snapshotToken = localStorage.getItem('token');
        const snapshotAdminToken = localStorage.getItem('adminToken');

        // Validate customer token against the backend
        if (snapshotToken) {
          try {
            const { data } = await API.get('/auth/me');
            // Only act if the token hasn't been replaced by a concurrent login
            if (localStorage.getItem('token') === snapshotToken) {
              if (data.success && data.user) {
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
              } else {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
              }
            }
          } catch {
            // 401 or network error — only clear if no concurrent login replaced the token
            if (localStorage.getItem('token') === snapshotToken) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
            }
          }
        }

        // Validate admin token against the backend
        if (snapshotAdminToken) {
          try {
            const { data } = await API.get('/auth/admin/me');
            // Only act if the token hasn't been replaced by a concurrent login
            if (localStorage.getItem('adminToken') === snapshotAdminToken) {
              if (data.success && data.admin) {
                setAdmin(data.admin);
                localStorage.setItem('admin', JSON.stringify(data.admin));
              } else {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('admin');
              }
            }
          } catch {
            // 401 or network error — only clear if no concurrent login replaced the token
            if (localStorage.getItem('adminToken') === snapshotAdminToken) {
              localStorage.removeItem('adminToken');
              localStorage.removeItem('admin');
            }
          }
        }
      } catch (error) {
        console.error('Error restoring session:', error);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Customer Login
  const login = async (email, password) => {
    try {
      const { data } = await API.post('/auth/login', { email, password });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      sessionStorage.setItem('sessionActive', 'true');
      setUser(data.user);

      return { success: true, message: data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  // Customer Register with OTP (DEPRECATED - OTP removed from system)
  const registerWithOTP = async (userData) => {
    console.warn('registerWithOTP is deprecated. OTP verification has been removed from the system.');
    return { success: false, message: 'OTP verification is no longer available' };
  };

  // Verify OTP and complete registration (DEPRECATED - OTP removed from system)
  const verifyOTP = async (email, otp) => {
    console.warn('verifyOTP is deprecated. OTP verification has been removed from the system.');
    return { success: false, message: 'OTP verification is no longer available' };
  };

  // Resend OTP (DEPRECATED - OTP removed from system)
  const resendOTP = async (email) => {
    console.warn('resendOTP is deprecated. OTP verification has been removed from the system.');
    return { success: false, message: 'OTP verification is no longer available' };
  };

  // Customer Register (Old method - kept for backward compatibility)
  const register = async (userData) => {
    try {
      const { data } = await API.post('/auth/register', userData);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      sessionStorage.setItem('sessionActive', 'true');
      setUser(data.user);

      return { success: true, message: data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  // Refresh user profile from server
  const refreshUser = async () => {
    try {
      const { data } = await API.get('/users/profile');

      if (!data.success) {
        console.error('Refresh user: Backend returned failure');
        return { success: false, message: data.message || 'Failed to refresh profile' };
      }

      if (!data.user) {
        console.error('Refresh user: No user data in response');
        return { success: false, message: 'No user data received' };
      }

      if (!data.user._id || !data.user.email) {
        console.error('Refresh user: Invalid user object structure');
        return { success: false, message: 'Invalid user data received' };
      }

      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));

      return { success: true, user: data.user, timestamp: data.timestamp };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to refresh profile';
      console.error('❌ Error refreshing user profile:', errorMessage);

      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }

      return { success: false, message: errorMessage };
    }
  };

  // Customer Logout
  const logout = async (callback) => {
    if (isLoggingOut) return;

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('sessionActive');
    setUser(null);

    setLogoutType('user');
    setIsLoggingOut(true);

    if (callback) {
      setLogoutCallback(() => callback);
    }
  };

  // Handle logout completion after animation
  const handleLogoutComplete = async () => {
    try {
      await API.post('/auth/logout');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoggingOut(false);
      if (logoutCallback) {
        logoutCallback();
        setLogoutCallback(null);
      }
    }
  };

  // Admin Login
  const adminLogin = async (email, password) => {
    try {
      const { data } = await API.post('/auth/admin/login', { email, password });

      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('admin', JSON.stringify(data.admin));
      sessionStorage.setItem('sessionActive', 'true');
      setAdmin(data.admin);

      return { success: true, message: data.message };
    } catch (error) {
      console.error('Admin login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Admin login failed'
      };
    }
  };

  // Admin Logout
  const adminLogout = async (callback) => {
    if (isLoggingOut) return;

    const tokenToInvalidate = localStorage.getItem('adminToken');

    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    sessionStorage.removeItem('sessionActive');
    setAdmin(null);

    setLogoutType('admin');
    setIsLoggingOut(true);

    if (callback) {
      setLogoutCallback(() => callback);
    }
    window.__adminLogoutToken = tokenToInvalidate;
  };

  // Handle admin logout completion after animation
  const handleAdminLogoutComplete = async () => {
    try {
      const token = window.__adminLogoutToken;
      delete window.__adminLogoutToken;
      if (token) {
        await API.post('/auth/admin/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Error during admin logout:', error);
    } finally {
      setIsLoggingOut(false);
      if (logoutCallback) {
        logoutCallback();
        setLogoutCallback(null);
      }
    }
  };

  // Login with Google
  const loginWithGoogle = async (credential) => {
    try {
      const { data } = await API.post('/auth/google', { credential });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      sessionStorage.setItem('sessionActive', 'true');
      setUser(data.user);

      return { success: true, message: data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Google authentication failed'
      };
    }
  };

  const value = {
    user,
    admin,
    loading,
    login,
    register,
    registerWithOTP,
    verifyOTP,
    resendOTP,
    refreshUser,
    logout,
    loginWithGoogle,
    adminLogin,
    adminLogout,
    isAuthenticated: !!user,
    isAdmin: !!admin
  };

  const handleLogoutAnimationComplete = () => {
    setLogoutType(null);
    if (logoutType === 'admin') {
      handleAdminLogoutComplete();
    } else {
      handleLogoutComplete();
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LogoutTransition
        isActive={isLoggingOut}
        onComplete={handleLogoutAnimationComplete}
      />
    </AuthContext.Provider>
  );
};
