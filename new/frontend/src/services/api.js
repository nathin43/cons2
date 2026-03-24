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
  timeout: 30000  // 30 second timeout for requests
});

const getStoredAdminToken = () =>
  localStorage.getItem('adminToken') ||
  sessionStorage.getItem('adminToken') ||
  localStorage.getItem('admintoken') ||
  sessionStorage.getItem('admintoken');

const getStoredUserToken = () =>
  localStorage.getItem('token') ||
  sessionStorage.getItem('token') ||
  localStorage.getItem('userToken') ||
  sessionStorage.getItem('userToken') ||
  localStorage.getItem('usertoken') ||
  sessionStorage.getItem('usertoken');

const clearStoredUserAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userToken');
  localStorage.removeItem('usertoken');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('userToken');
  sessionStorage.removeItem('usertoken');
};

// Add token to requests if available
API.interceptors.request.use((config) => {
  // Determine which token to use based on the route
  let token = null;
  const adminToken = getStoredAdminToken();
  const userToken = getStoredUserToken();
  const url = String(config.url || '');
  const method = String(config.method || '').toLowerCase();
  const isUserReturnsRoute =
    url.startsWith('/returns/my/refunds') ||
    /^\/returns\/[^/]+\/messages$/.test(url);
  const isAdminReturnsRoute =
    url.startsWith('/returns') && !isUserReturnsRoute;
  const isUserRefundsRoute =
    url.startsWith('/refunds/my/list') ||
    /^\/refunds\/[^/]+\/messages$/.test(url);
  const isAdminRefundsRoute =
    url.startsWith('/refunds') && !isUserRefundsRoute;

  // Admin-only routes — always use admin token
  if (
    url.includes('/admin') ||
    url.includes('/admin-management') ||
    isAdminReturnsRoute ||
    isAdminRefundsRoute
  ) {
    token = adminToken;
  }
  // Customer-only routes — ONLY use user token, never fall back to adminToken
  // This prevents an admin's token being sent to customer APIs,
  // which causes "User not found" because the admin ID doesn't exist in Users collection.
  else if (
    url.includes('/razorpay')             ||
    url.includes('/cart')                 ||
    url.includes('/reviews')              ||
    url.includes('/orders/myorders')      ||
    (url === '/orders' && method === 'post') ||
    (url.includes('/orders/') && url.includes('/cancel')) ||
    url.includes('/contact/my-messages')  ||
    url.includes('/user/notifications')   ||
    url.includes('/users/profile')        ||
    url.includes('/auth/logout')          ||
    isUserReturnsRoute                    ||
    isUserRefundsRoute
  ) {
    token = userToken; // intentionally no adminToken fallback
  }
  // Other contact routes — admin token for read/update/delete (POST is public)
  else if (url.includes('/contact') && method !== 'post') {
    token = adminToken;
  }
  // /orders (admin: list all, update status, view by user) — use admin token
  else if (url.startsWith('/orders') && adminToken) {
    token = adminToken;
  }
  // Everything else (user profile, products, etc.) — use user token
  else {
    token = userToken;
  }

  // Generic fallback ONLY for non-customer-critical routes
  // (customer-only routes already returned above without this fallback)
  const isCustomerOnlyRoute =
    url.includes('/razorpay')           ||
    url.includes('/cart')               ||
    url.includes('/reviews')            ||
    url.includes('/orders/myorders')    ||
    (url === '/orders' && method === 'post') ||
    (url.includes('/orders/') && url.includes('/cancel')) ||
    url.includes('/user/notifications') ||
    url.includes('/users/profile')      ||
    url.includes('/auth/logout')        ||
    isUserReturnsRoute                  ||
    isUserRefundsRoute;
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
        clearStoredUserAuth();
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
        const userToken = getStoredUserToken();
        // Only clear if the token that was sent matches the stored user token
        if (userToken && sentToken === userToken) {
          console.warn('Customer session expired or invalid, clearing token');
          clearStoredUserAuth();
          window.dispatchEvent(new CustomEvent('auth:user-session-expired'));
        }
      }
    }

    return Promise.reject(error);
  }
);

export default API;
