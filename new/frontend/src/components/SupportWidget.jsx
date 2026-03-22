import { useState } from 'react';
import { Link } from 'react-router-dom';
import './SupportWidget.css';

const SupportWidget = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="sw-root">
      {/* Popup Panel */}
      {open && (
        <div className="sw-panel">
          <div className="sw-panel-header">
            <span className="sw-panel-title">Customer Support</span>
            <button className="sw-close" onClick={() => setOpen(false)} aria-label="Close support panel">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="sw-options">
            {/* WhatsApp Option */}
            <div className="sw-option">
              <div className="sw-option-icon sw-wa-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#25d366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                </svg>
              </div>
              <div className="sw-option-body">
                <p className="sw-option-title">WhatsApp Support</p>
                <a
                  href="https://wa.me/919360486952?text=Hello%20I%20need%20support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sw-btn sw-btn-wa"
                  onClick={() => setOpen(false)}
                >
                  Chat on WhatsApp
                </a>
              </div>
            </div>

            <div className="sw-divider" />

            {/* Return Support Option */}
            <div className="sw-option">
              <div className="sw-option-icon sw-return-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 16h5v5" />
                </svg>
              </div>
              <div className="sw-option-body">
                <p className="sw-option-title">Return &amp; Support</p>
                <p className="sw-option-desc">Submit a return request for your product.</p>
                <Link
                  to="/easy-return"
                  className="sw-btn sw-btn-return"
                  onClick={() => setOpen(false)}
                >
                  Go to Return Page
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        className={`sw-fab ${open ? 'sw-fab-active' : ''}`}
        onClick={() => setOpen(prev => !prev)}
        aria-label="Open support"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default SupportWidget;
