import { createContext, useState, useCallback, useRef } from 'react';

export const ToastContext = createContext();

/**
 * Toast Context Provider
 * Manages global toast/popup notifications with enter + exit animations.
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts]       = useState([]);
  const [exiting, setExiting]     = useState(new Set());
  const timersRef                 = useRef({});        // auto-dismiss timers

  /**
   * Add a new toast notification.
   * Returns the toast id so callers can close it manually.
   */
  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);

    // Auto-dismiss
    if (duration > 0) {
      timersRef.current[id] = setTimeout(() => removeToast(id), duration);
    }

    return id;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Begin exit animation, then remove from state after 380 ms.
   */
  const removeToast = useCallback((id) => {
    // Clear any pending auto-dismiss timer
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }

    // Mark as exiting → CSS exit animation plays
    setExiting(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    // Remove from DOM after animation completes (matches CSS duration)
    setTimeout(() => {
      setToasts(prev  => prev.filter(t => t.id !== id));
      setExiting(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 400);
  }, []);

  /* ── Shorthand helpers ── */
  const success = useCallback((msg, dur = 3500) => addToast(msg, 'success', dur), [addToast]);
  const error   = useCallback((msg, dur = 3500) => addToast(msg, 'error',   dur), [addToast]);
  const info    = useCallback((msg, dur = 3500) => addToast(msg, 'info',    dur), [addToast]);
  const warning = useCallback((msg, dur = 3500) => addToast(msg, 'warning', dur), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, exiting, addToast, removeToast, success, error, info, warning }}>
      {children}
    </ToastContext.Provider>
  );
};

export default ToastContext;
