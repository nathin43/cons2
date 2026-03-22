import { useEffect, useState } from 'react';
import './LogoutTransition.css';

/**
 * LogoutTransition Component
 * Centered card popup with smooth animations for logout experience
 */
const LogoutTransition = ({ isActive, onComplete }) => {
  const [phase, setPhase] = useState('loading'); // 'loading' | 'success'

  useEffect(() => {
    if (isActive) {
      document.body.style.overflow = 'hidden';
      setPhase('loading');

      // After 1s switch to success message
      const successTimer = setTimeout(() => {
        setPhase('success');
      }, 1000);

      // After 2s complete and redirect
      const completeTimer = setTimeout(() => {
        onComplete();
        document.body.style.overflow = '';
      }, 2000);

      return () => {
        clearTimeout(successTimer);
        clearTimeout(completeTimer);
        document.body.style.overflow = '';
      };
    } else {
      setPhase('loading');
    }
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <div className="lt-overlay">
      <div className="lt-card">
        {/* Icon area */}
        <div className={`lt-icon-wrap ${phase === 'success' ? 'lt-icon-wrap--success' : ''}`}>
          {phase === 'loading' ? (
            <div className="lt-spinner-ring" />
          ) : (
            <svg className="lt-checkmark" viewBox="0 0 52 52" fill="none">
              <circle className="lt-checkmark-circle" cx="26" cy="26" r="24" stroke="#22c55e" strokeWidth="3" fill="none" />
              <path className="lt-checkmark-path" d="M14 26l8 8 16-16" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          )}
        </div>

        {/* Text */}
        <div className="lt-text-wrap">
          {phase === 'loading' ? (
            <>
              <p className="lt-title">Logging you out...</p>
              <p className="lt-subtitle">Please wait a moment</p>
            </>
          ) : (
            <>
              <p className="lt-title lt-title--success">Logout successful</p>
              <p className="lt-subtitle">You have been logged out successfully.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogoutTransition;
