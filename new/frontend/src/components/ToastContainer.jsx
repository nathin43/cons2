import { useContext } from 'react';
import Toast from './Toast';
import { ToastContext } from '../context/ToastContext';
import './Toast.css';

/**
 * Toast Container — renders all active toast notifications.
 */
const ToastContainer = () => {
  const { toasts, removeToast } = useContext(ToastContext);

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={removeToast}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
