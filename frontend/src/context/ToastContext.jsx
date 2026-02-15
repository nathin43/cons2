import { createContext, useState, useCallback } from 'react';

export const ToastContext = createContext();

/**
 * Toast Context Provider
 * Manages global toast/popup notifications
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  /**
   * Add a new toast notification
   * @param {string} message - Toast message text
   * @param {string} type - Toast type: 'success', 'error', 'info', 'warning'
   * @param {number} duration - Auto-dismiss duration in milliseconds (0 = no auto-dismiss)
   */
  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    
    const newToast = {
      id,
      message,
      type,
      duration
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss if duration is set
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  /**
   * Remove a toast notification
   */
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  /**
   * Shorthand methods for common toast types
   */
  const success = useCallback((message, duration = 3000) => {
    return addToast(message, 'success', duration);
  }, [addToast]);

  const error = useCallback((message, duration = 3000) => {
    return addToast(message, 'error', duration);
  }, [addToast]);

  const info = useCallback((message, duration = 3000) => {
    return addToast(message, 'info', duration);
  }, [addToast]);

  const warning = useCallback((message, duration = 3000) => {
    return addToast(message, 'warning', duration);
  }, [addToast]);

  const value = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

export default ToastContext;
