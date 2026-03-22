import { useEffect, useRef } from 'react';
import './LoadingOverlay.css';

/**
 * GlobalLoader  — full-page fixed overlay driven by LoadingContext.
 * Drop this once inside App.jsx. Call showLoader / hideLoader anywhere.
 *
 * Also works as a standalone prop-driven loader:
 *   <LoadingOverlay visible message="Placing order…" />
 */
const LoadingOverlay = ({ visible = true, message = 'Loading…' }) => {
  const overlayRef = useRef(null);

  /* Trap scroll while visible */
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="glo-overlay" ref={overlayRef} role="dialog" aria-live="polite" aria-label="Loading">
      <div className="glo-card">
        {/* ── Concentric spinning rings ── */}
        <div className="glo-rings">
          <div className="glo-ring glo-ring--1" />
          <div className="glo-ring glo-ring--2" />
          <div className="glo-ring glo-ring--3" />

          {/* Center icon */}
          <div className="glo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
        </div>

        {/* ── Message ── */}
        <p className="glo-message">{message}</p>

        {/* ── Bouncing dots ── */}
        <div className="glo-dots">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
