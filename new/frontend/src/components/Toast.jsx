import { useContext } from 'react';
import { ToastContext } from '../context/ToastContext';

/**
 * Individual Toast Notification Component
 * Supports enter + exit animation via the `exiting` set in ToastContext.
 */
const ICONS = {
  success: (
    <svg className="toast-icon" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="8 12 11 15 16 9" />
    </svg>
  ),
  error: (
    <svg className="toast-icon" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9"  y2="15" />
      <line x1="9"  y1="9" x2="15" y2="15" />
    </svg>
  ),
  warning: (
    <svg className="toast-icon" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9"  x2="12"   y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg className="toast-icon" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12"   y2="12" />
      <line x1="12" y1="8"  x2="12.01" y2="8" />
    </svg>
  ),
};

const CLOSE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6"  y2="18" />
    <line x1="6"  y1="6" x2="18" y2="18" />
  </svg>
);

const Toast = ({ id, message, type = 'info', duration = 3500 }) => {
  const { exiting, removeToast } = useContext(ToastContext);
  const isExiting = exiting?.has(id);

  const stateClass = isExiting ? 'toast--exit' : 'toast--enter';

  return (
    <div
      className={`toast toast-${type} ${stateClass}`}
      role="alert"
      aria-live="assertive"
      /* pass duration as CSS variable so the progress bar matches */
      style={{ '--toast-duration': `${duration}ms` }}
    >
      {/* Animated left accent stripe */}
      <div className="toast-stripe" />

      {/* Icon circle */}
      <div className="toast-icon-wrapper">
        <div className="toast-icon-pulse" />
        {ICONS[type] ?? ICONS.info}
      </div>

      {/* Message */}
      <div className="toast-message">{message}</div>

      {/* Close */}
      <button
        className="toast-close"
        onClick={() => removeToast(id)}
        aria-label="Dismiss notification"
      >
        {CLOSE_ICON}
      </button>

      {/* Countdown progress bar */}
      {duration > 0 && <div className="toast-progress" />}
    </div>
  );
};

export default Toast;
