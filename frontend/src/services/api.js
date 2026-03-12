import axios from 'axios';

/**
 * API Service Configuration
 * Base configuration for all API calls
 * Uses dynamic port detection for development environments
 */

// Determine the backend URL based on environment
const getBackendURL = () => {
  // In development, use the current host and the Vite proxy
  if (import.meta.env.DEV) {
    // This will use the Vite proxy configured in vite.config.js
    return '/api';
  }
  // In production, use the full URL
  return `${import.meta.env.VITE_API_URL || 'https://manielectrical-backend.onrender.com'}/api`;
};

const API = axios.create({
  baseURL: getBackendURL(),
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false,
  timeout: 15000  // 15 second timeout for requests
});

// Add token to requests if available
API.interceptors.request.use((config) => {
  // Determine which token to use based on the route
  let token = null;
  const adminToken = localStorage.getItem('adminToken');
  const userToken  = localStorage.getItem('token');

  // Admin-only routes — always use admin token
  if (config.url.includes('/admin') || config.url.includes('/admin-management') || config.url.startsWith('/returns')) {
    token = adminToken;
  }
  // Customer-only routes — ONLY use user token, never fall back to adminToken
  // This prevents an admin's token being sent to customer APIs,
  // which causes "User not found" because the admin ID doesn't exist in Users collection.
  else if (
    config.url.includes('/razorpay')             ||
    config.url.includes('/cart')                 ||
    config.url.includes('/orders/myorders')      ||  // customer: view own orders
    (config.url === '/orders' && config.method.toLowerCase() === 'post') || // customer: place order
    (config.url.includes('/orders/') && config.url.includes('/cancel')) || // customer: cancel own order
    config.url.includes('/contact/my-messages')  ||
    config.url.includes('/user/notifications')   ||  // customer: notification bell
    config.url.includes('/users/profile')        ||  // customer: profile page
    config.url.includes('/auth/logout')              // customer logout (token cleared before call)
  ) {
    token = userToken; // intentionally no adminToken fallback
  }
  // Other contact routes — admin token for read/update/delete (POST is public)
  else if (config.url.includes('/contact') && config.method.toLowerCase() !== 'post') {
    token = adminToken;
  }
  // /orders (admin: list all, update status, view by user) — use admin token
  else if (config.url.startsWith('/orders') && adminToken) {
    token = adminToken;
  }
  // Everything else (user profile, products, etc.) — use user token
  else {
    token = userToken;
  }

  // Generic fallback ONLY for non-customer-critical routes
  // (customer-only routes already returned above without this fallback)
  const isCustomerOnlyRoute =
    config.url.includes('/razorpay')           ||
    config.url.includes('/cart')               ||
    config.url.includes('/orders/myorders')    ||
    (config.url === '/orders' && config.method.toLowerCase() === 'post') ||
    (config.url.includes('/orders/') && config.url.includes('/cancel')) ||
    config.url.includes('/user/notifications') ||
    config.url.includes('/users/profile')      ||
    config.url.includes('/auth/logout');
  if (!token && !isCustomerOnlyRoute) {
    token = adminToken || userToken;
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('API Request:', config.method.toUpperCase(), config.url, token ? '(with auth)' : '(no auth)');
  return config;
});

// Handle responses and clear invalid tokens
API.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    const url = error.config?.url || '';
    const status = error.response?.status;
    const message = error.response?.data?.message || '';
    
    console.log('API Error:', status, url, message);

    // Handle 401/403 authentication errors
    if (status === 401 || status === 403) {

      // Logout routes — clear everything
      if (url.includes('logout')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      // Admin login failures — don't clear tokens, just log
      else if (url.includes('/auth/admin/login')) {
        console.log('Admin login failed - invalid credentials');
      }
      // Admin panel routes — clear admin token on auth failure
      else if (url.includes('/admin') || url.includes('/admin-management')) {
        const adminToken = localStorage.getItem('adminToken');
        if (adminToken) {
          console.warn('Admin authentication failed, clearing token');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('admin');
          // Don't redirect here - let components handle it to avoid loops
        }
      }
      // Customer routes — 401 means token is expired/invalid; clear it so the
      // login guard redirects the user to sign in again.
      // Guard: only clear the user token if the request actually used the user token
      // (prevents clearing a valid user token when an admin token was mistakenly sent).
      else if (status === 401) {
        const sentToken = error.config?.headers?.Authorization?.replace('Bearer ', '');
        const userToken = localStorage.getItem('token');
        // Only clear if the token that was sent matches the stored user token
        if (userToken && sentToken === userToken) {
          console.warn('Customer session expired or invalid, clearing token');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.dispatchEvent(new CustomEvent('auth:user-session-expired'));
        }
      }
    }

    return Promise.reject(error);
  }
);

export default API;
