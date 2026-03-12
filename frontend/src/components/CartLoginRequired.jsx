import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CartLoginRequired.css';

const CartLoginRequired = ({ autoRedirect = true, redirectDelay = 4000 }) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(Math.floor(redirectDelay / 1000));

  useEffect(() => {
    if (!autoRedirect) return;

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(countdownInterval); return 0; }
        return prev - 1;
      });
    }, 1000);

    const redirectTimer = setTimeout(() => navigate('/login'), redirectDelay);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(redirectTimer);
    };
  }, [autoRedirect, redirectDelay, navigate]);

  return (
    <div className="clr-page">
      {/* Animated background */}
      <div className="clr-bg">
        <div className="clr-orb clr-orb--1"></div>
        <div className="clr-orb clr-orb--2"></div>
        <div className="clr-orb clr-orb--3"></div>
        <div className="clr-grid"></div>
      </div>

      {/* Floating particles */}
      <div className="clr-particles">
        {[...Array(12)].map((_, i) => (
          <div key={i} className={`clr-particle clr-particle--${i + 1}`}></div>
        ))}
      </div>

      <div className="clr-card">
        {/* Animated top bar */}
        <div className="clr-card__bar"></div>

        <div className="clr-card__body">
          {/* Floating icon */}
          <div className="clr-icon-wrap">
            <div className="clr-icon-ring"></div>
            <div className="clr-icon-bg">
              <svg className="clr-cart-svg" viewBox="0 0 24 24" fill="none">
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="21" r="1" fill="currentColor"/>
                <circle cx="20" cy="21" r="1" fill="currentColor"/>
              </svg>
              <div className="clr-lock-badge">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2.5"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Heading */}
          <h2 className="clr-title">Please Login to View Your Cart</h2>
          <p className="clr-desc">
            Sign in to access your shopping cart and continue your purchase.
          </p>

          {/* Feature chips */}
          <div className="clr-chips">
            <span className="clr-chip">🔒 Secure Login</span>
            <span className="clr-chip">⚡ Fast Checkout</span>
            <span className="clr-chip">🛍️ Save Cart</span>
          </div>

          {/* Buttons */}
          <div className="clr-actions">
            <button className="clr-btn clr-btn--primary" onClick={() => navigate('/login')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
              </svg>
              Login Now
              <span className="clr-btn__shimmer"></span>
            </button>
            <button className="clr-btn clr-btn--secondary" onClick={() => navigate('/products')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/>
              </svg>
              Continue Shopping
            </button>
          </div>

          {/* Redirect countdown with progress bar */}
          {autoRedirect && countdown > 0 && (
            <div className="clr-redirect">
              <div className="clr-redirect__header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>Redirecting to login in <strong>{countdown}</strong> {countdown === 1 ? 'second' : 'seconds'}</span>
              </div>
              <div className="clr-progress">
                <div
                  className="clr-progress__bar"
                  style={{ animationDuration: `${redirectDelay}ms` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartLoginRequired;
