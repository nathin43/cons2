import { useEffect, useState } from 'react';
import './LoadingOverlay.css';

const FADE_OUT_MS = 220;

const LoadingOverlay = ({ visible = true, message = 'Loading...' }) => {
  const [shouldRender, setShouldRender] = useState(visible);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      setIsExiting(false);
      document.body.style.overflow = 'hidden';
      return undefined;
    }

    setIsExiting(true);
    const timer = window.setTimeout(() => {
      setShouldRender(false);
      setIsExiting(false);
      document.body.style.overflow = '';
    }, FADE_OUT_MS);

    return () => window.clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <div className={`glo-overlay${isExiting ? ' glo-overlay--exit' : ''}`} role="dialog" aria-live="polite" aria-label="Loading">
      <div className={`glo-card${isExiting ? ' glo-card--exit' : ''}`}>
        <div className="glo-rings" aria-hidden="true">
          <div className="glo-ring glo-ring--1" />
          <div className="glo-ring glo-ring--2" />
          <div className="glo-ring glo-ring--3" />

          <div className="glo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
        </div>

        <p className="glo-message">{message}</p>

        <div className="glo-dots" aria-hidden="true">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
