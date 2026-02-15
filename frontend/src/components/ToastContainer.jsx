import { useContext } from 'react';
import Toast from './Toast';
import { ToastContext } from '../context/ToastContext';
import './Toast.css';

/**
 * Toast Container Component
 * Renders all active toast notifications
 */
const ToastContainer = () => {
  const { toasts, removeToast } = useContext(ToastContext);

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={removeToast}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
