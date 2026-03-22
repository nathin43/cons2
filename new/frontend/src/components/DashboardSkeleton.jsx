import { useEffect } from 'react';
import './DashboardSkeleton.css';

/**
 * DashboardSkeleton / AdminLoader
 * Single shared loading component used across ALL admin pages.
 * Accepts an optional `title` prop so each section can show a
 * contextual message while keeping identical animation timing.
 *
 * Animation constants (same for every admin page):
 *   fadeIn       : 0.3s ease-out
 *   scaleIn      : 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)
 *   spinRotate   : 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite
 *   spinReverse  : 1.2s linear infinite
 *   pulse        : 2s ease-in-out infinite
 *   bounce       : 1.4s ease-in-out infinite
 */
const DashboardSkeleton = ({ title = 'Loading Dashboard' }) => {
  // Prevent scroll inside content area while loading
  useEffect(() => {
    const contentArea = document.querySelector('.dash-content, .admin-page-content');
    if (contentArea) contentArea.style.overflow = 'hidden';
    return () => {
      if (contentArea) contentArea.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="dash-skeleton-wrapper">
      {/* Centered Loader Overlay - Inside Content Area Only */}
      <div className="dash-skeleton-overlay">
        <div className="dash-skeleton-loader-card">
          <div className="dash-skeleton-spinner">
            <div className="dash-skeleton-spinner-circle"></div>
            <div className="dash-skeleton-spinner-inner"></div>
          </div>
          <h3 className="dash-skeleton-title">{title}</h3>
          <div className="dash-skeleton-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
