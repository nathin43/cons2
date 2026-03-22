import React, { useState, useEffect } from 'react';
import './Loading.css';

const Loading = ({ 
  showProgress = false, 
  progress = 0,
  showSkeletonCards = false 
}) => {
  const [mounted, setMounted] = useState(false);
  const [dots, setDots] = useState('');

  useEffect(() => {
    setMounted(true);
    
    // Animated ellipsis
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  // Generate rising water bubbles - different sizes and speeds
  const bubbles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    size: Math.random() * 25 + 12, // 12-37px
    left: Math.random() * 90 + 5, // 5-95%
    delay: Math.random() * 5, // 0-5s
    duration: Math.random() * 2.5 + 3, // 3-5.5s
    opacity: Math.random() * 0.4 + 0.4, // 0.4-0.8
  }));

  return (
    <div className={`dashboard-loading-wrapper ${mounted ? 'mounted' : ''}`}>
      {/* Soft Purple-Blue Gradient Background */}
      <div className="dashboard-loading-bg"></div>
      
      {/* Centered Glass Card */}
      <div className="dashboard-glass-card">
        {/* Water Effect - Rising Bubbles Container */}
        <div className="water-bubbles-container">
          {bubbles.map((bubble) => (
            <div
              key={bubble.id}
              className="water-bubble"
              style={{
                width: `${bubble.size}px`,
                height: `${bubble.size}px`,
                left: `${bubble.left}%`,
                animationDelay: `${bubble.delay}s`,
                animationDuration: `${bubble.duration}s`,
                opacity: bubble.opacity,
              }}
            >
              <div className="bubble-glow"></div>
            </div>
          ))}
        </div>
        
        {/* Loading Text Content */}
        <div className="dashboard-loading-content">
          <h2 className="dashboard-loading-title">
            Loading Dashboard<span className="ellipsis-dots">{dots}</span>
          </h2>
          <p className="dashboard-loading-subtitle">Please wait a moment...</p>
        </div>
      </div>
    </div>
  );
};

export default Loading;
