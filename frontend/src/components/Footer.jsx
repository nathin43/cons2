import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import LightbulbIcon from './LightbulbIcon';
import './Footer.css';

/**
 * Footer Component
 * Site footer with links and information
 */
const Footer = () => {
  const powerEssentialsRef = useRef(null);
  const [powerEssentialsVisible, setPowerEssentialsVisible] = useState(false);

  useEffect(() => {
    const heading = powerEssentialsRef.current;
    if (!heading) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPowerEssentialsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(heading);
    return () => observer.disconnect();
  }, []);

  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Brand Section */}
        <div className="footer-section brand">
          <h3>
            <LightbulbIcon size={28} color="#8B5CF6" />
            Mani Electrical
          </h3>
          <p>Your trusted partner for premium electrical appliances and electronics. Quality products, reliable service, and expert support for all your electrical needs.</p>
        </div>

        {/* Explore Section */}
        <div className="footer-section">
          <h4>Explore</h4>
          <ul>
            <li><Link to="/products">Shop Products</Link></li>
            <li><Link to="/cart">My Cart</Link></li>
            <li><Link to="/orders">My Orders</Link></li>
            <li><Link to="/profile">My Profile</Link></li>
          </ul>
        </div>

        {/* Power Essentials Section */}
        <div className="footer-section">
          <h4
            ref={powerEssentialsRef}
            className={`footer-heading ${powerEssentialsVisible ? 'is-visible' : ''}`}
          >
            Power Essentials
          </h4>
          <ul>
            <li><Link to="/products?category=Wire & Cables">Wire & Cables</Link></li>
            <li><Link to="/products?category=Pipes">Pipes</Link></li>
            <li><Link to="/products?category=Heater">Heaters</Link></li>
            <li><Link to="/products?category=Motors">Motors</Link></li>
            <li><Link to="/products?category=Lights">Lights</Link></li>
          </ul>
        </div>

        {/* Contact Section */}
        <div className="footer-section contact">
          <h4>Contact</h4>

          <div className="contact-item">
            <div className="contact-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m2 7 10 7 10-7" />
              </svg>
            </div>
            <div className="contact-text">
              <a href="mailto:manielectricalshop@gmail.com">manielectricalshop@gmail.com</a>
            </div>
          </div>

          <div className="contact-item">
            <div className="contact-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div className="contact-text">
              <a href="tel:+919095399271">+91-9095399271</a>
            </div>
          </div>

          <div className="contact-item">
            <div className="contact-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="contact-text">
              Kunnathur Road, Perundurai 638052
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Mani Electrical. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
