import { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

/**
 * Cart Context Provider
 * Manages shopping cart state and operations
 * Supports both database and localStorage-based carts
 */
export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [useLocalStorage, setUseLocalStorage] = useState(false);
  const { isAuthenticated } = useContext(AuthContext);

  const STORAGE_KEY = 'electric_shop_cart';

  // Initialize cart on mount and when authentication changes
  useEffect(() => {
    initializeCart();
  }, [isAuthenticated]);

  // Initialize cart from localStorage or API
  const initializeCart = async () => {
    if (isAuthenticated) {
      // When user logs in, ALWAYS fetch from database
      // This restores their persistent cart from MongoDB
      await fetchCart();
    } else {
      // When user is not authenticated, show empty cart
      // Cart data is NOT cleared - it's stored in MongoDB tied to user ID
      loadLocalCart();
    }
  };

  // Load cart from localStorage
  const loadLocalCart = () => {
    try {
      // When not authenticated, always start with empty cart
      // Cart is only preserved when user is logged in
      setCart({ items: [], totalAmount: 0 });
      setUseLocalStorage(true);
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      setCart({ items: [], totalAmount: 0 });
    }
  };

  // Save cart to localStorage
  const saveToLocalStorage = (cartData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartData));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  };

  // Calculate total amount
  const calculateTotal = (items) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Fetch cart from API - MongoDB Persistent Cart
  const fetchCart = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/cart');
      if (data.cart) {
        // User cart restored from MongoDB
        setCart(data.cart);
        setUseLocalStorage(false);
      } else {
        // No cart found, show empty cart
        loadLocalCart();
      }
    } catch (error) {
      console.warn('Error fetching cart from API:', error.message);
      // If API fails, show empty cart instead of localStorage
      // Cart is persistent in MongoDB, but show empty on client if fetch fails
      loadLocalCart();
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart - MongoDB Persistent Cart
  const addToCart = async (productId, quantity = 1, product = null) => {
    try {
      // User must be authenticated to use cart
      if (!isAuthenticated) {
        return {
          success: false,
          message: 'Please log in to add items to cart'
        };
      }

      // Fetch product details if not provided
      let productDetails = product;
      if (!productDetails) {
        try {
          const { data } = await API.get(`/products/${productId}`);
          productDetails = data.product || data.data;
        } catch (error) {
          console.warn('Could not fetch product details:', error.message);
          productDetails = { _id: productId, name: 'Product', price: 0, brand: '', image: '' };
        }
      }

      // Add to cart via MongoDB persistent storage
      const { data } = await API.post('/cart/add', { productId, quantity });
      if (data.cart) {
        // Ensure cart items have proper product object structure
        const cartData = data.cart;
        if (cartData.items && Array.isArray(cartData.items)) {
          cartData.items = cartData.items.map(item => ({
            ...item,
            product: item.product || { _id: productId, name: 'Product', price: item.price }
          }));
        }
        setCart(cartData);
        setUseLocalStorage(false);
        return { success: true, message: data.message };
      }

      return {
        success: false,
        message: 'Failed to add item to cart'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to add to cart'
      };
    }
  };

  // Update cart item quantity - MongoDB Persistent Cart
  const updateCartItem = async (productId, quantity) => {
    try {
      // User must be authenticated
      if (!isAuthenticated) {
        return {
          success: false,
          message: 'Authentication required to update cart'
        };
      }

      // Update cart via MongoDB persistent storage
      const { data } = await API.put('/cart/update', { productId, quantity });
      if (data.cart) {
        // Ensure cart items have proper product object structure
        const cartData = data.cart;
        if (cartData.items && Array.isArray(cartData.items)) {
          cartData.items = cartData.items.map(item => ({
            ...item,
            product: item.product || { _id: productId, name: 'Product', price: item.price }
          }));
        }
        setCart(cartData);
        setUseLocalStorage(false);
        return { success: true };
      }

      return {
        success: false,
        message: 'Failed to update cart item'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update cart'
      };
    }
  };

  // Remove item from cart - MongoDB Persistent Cart
  const removeFromCart = async (productId) => {
    try {
      // User must be authenticated
      if (!isAuthenticated) {
        return {
          success: false,
          message: 'Authentication required to remove from cart'
        };
      }

      // Remove from cart via MongoDB persistent storage
      const { data } = await API.delete(`/cart/remove/${productId}`);
      if (data.cart) {
        // Ensure cart items have proper product object structure
        const cartData = data.cart;
        if (cartData.items && Array.isArray(cartData.items)) {
          cartData.items = cartData.items.map(item => ({
            ...item,
            product: item.product || { _id: productId, name: 'Product', price: item.price }
          }));
        }
        setCart(cartData);
        setUseLocalStorage(false);
        return { success: true, message: data.message };
      }

      return {
        success: false,
        message: 'Failed to remove item from cart'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to remove from cart'
      };
    }
  };

  // Clear cart - MongoDB Persistent Cart
  const clearCart = async () => {
    try {
      // User must be authenticated
      if (!isAuthenticated) {
        return {
          success: false,
          message: 'Authentication required to clear cart'
        };
      }

      // Clear cart via MongoDB persistent storage
      const { data } = await API.delete('/cart/clear');
      if (data.cart) {
        setCart(data.cart);
        setUseLocalStorage(false);
        return { success: true };
      }

      return {
        success: false,
        message: 'Failed to clear cart'
      };
    } catch (error) {
      return { 
        success: false,
        message: error.response?.data?.message || 'Failed to clear cart'
      };
    }
  };

  // Get cart item count
  const getCartCount = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cart,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    fetchCart,
    cartCount: getCartCount(),
    useLocalStorage
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
