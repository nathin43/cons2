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
  return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;
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
  const userToken = localStorage.getItem('token');

  // Admin routes - always use admin token
  if (config.url.includes('/admin') || config.url.includes('/admin-management')) {
    token = adminToken;
  } 
  // Customer's own messages - use user token
  else if (config.url.includes('/contact/my-messages')) {
    token = userToken;
  }
  // Other contact routes - use admin token for GET/PUT/DELETE (POST is public)
  else if (config.url.includes('/contact') && config.method.toLowerCase() !== 'post') {
    token = adminToken;
  }
  // For /orders GET requests, prefer admin token if it exists (fetching all orders)
  else if (config.url === '/orders' && config.method.toLowerCase() === 'get' && adminToken) {
    token = adminToken;
  }
  // For /orders/:id/status PUT requests, use admin token
  else if (config.url.match(/\/orders\/.*\/status/) && adminToken) {
    token = adminToken;
  }
  // User routes or public routes - use user token
  else {
    token = userToken;
  }

  // If no appropriate token found, try the other one as fallback
  if (!token) {
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
    console.log('API Error:', error.response?.status, error.response?.data?.message || error.message);

    // ONLY clear tokens on explicit authentication failures on LOGIN/MANAGEMENT routes
    // Do NOT clear tokens on any other route (orders, products, etc.)
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const message = error.response?.data?.message || '';

      // Only logout admin if trying to access admin login or management pages
      // NOT on order/product/general API calls
      if (url.includes('/auth/admin/login')) {
        // Invalid admin credentials - stay on login page, don't force logout
        console.log('Admin login failed - invalid credentials');
      } else if (url.includes('/admin-management') && message === 'Access denied') {
        // Admin trying to access restricted area - they may have lost access
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
        window.location.href = '/admin/login';
      } else if (url.includes('/auth') && url.includes('logout')) {
        // Expected 401 on logout - clear tokens
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      // For all other routes (orders, products, etc.), do NOT clear tokens
    }

    return Promise.reject(error);
  }
);

export default API;
