import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './Refund.css';

const Refund = () => {
  return (
    <div className="refund-page">
      <Navbar />
      <div className="refund-page-container">

        {/* Header */}
        <div className="refund-page-header">
          <div className="refund-page-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
              fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M12 7v5l4 2"/>
            </svg>
          </div>
          <h1>Refund &amp; Cancellation Policy</h1>
          <p>Last updated: March 2026</p>
        </div>

        {/* Policy Cards */}
        <div className="refund-policy-grid">

          <div className="policy-card">
            <h2>🔁 Return Eligibility</h2>
            <ul>
              <li>Items must be returned within <strong>7 days</strong> of delivery.</li>
              <li>Products must be unused, in original packaging with all accessories.</li>
              <li>Damaged or defective items qualify for immediate replacement or refund.</li>
              <li>Items purchased during sale/clearance are non-returnable.</li>
            </ul>
          </div>

          <div className="policy-card">
            <h2>💳 Refund Process</h2>
            <ul>
              <li>Approved refunds are processed within <strong>5–7 business days</strong>.</li>
              <li>Refunds are credited to the original payment method.</li>
              <li>Cash on Delivery orders are refunded via bank transfer or UPI.</li>
              <li>Shipping charges are non-refundable unless the fault is ours.</li>
            </ul>
          </div>

          <div className="policy-card">
            <h2>❌ Order Cancellation</h2>
            <ul>
              <li>Orders can be cancelled before they are <strong>shipped</strong>.</li>
              <li>Once shipped, cancellation is not possible — initiate a return instead.</li>
              <li>To cancel, visit My Orders or contact our support team.</li>
              <li>Prepaid order cancellations are fully refunded.</li>
            </ul>
          </div>

          <div className="policy-card">
            <h2>🚫 Non-Refundable Items</h2>
            <ul>
              <li>Electrical components once installed.</li>
              <li>Custom or made-to-order products.</li>
              <li>Products with missing serial numbers or tampered packaging.</li>
              <li>Digital products or software licenses.</li>
            </ul>
          </div>

        </div>

        {/* Steps */}
        <div className="refund-steps-card">
          <h2>How to Request a Refund</h2>
          <div className="refund-steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-text">
                <strong>Contact Us</strong>
                <span>Reach out via the Contact page or email within 7 days of receiving the order.</span>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-text">
                <strong>Provide Details</strong>
                <span>Share your order number, product name, and reason for return with photos if applicable.</span>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-text">
                <strong>Ship the Product</strong>
                <span>We'll send you a return shipping label or guide you on how to return the item.</span>
              </div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-text">
                <strong>Receive Refund</strong>
                <span>Once we receive and inspect the item, your refund will be processed within 5–7 business days.</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="refund-cta">
          <p>Have more questions? Our support team is happy to help.</p>
          <Link to="/contact" className="refund-contact-btn">Contact Support</Link>
        </div>

      </div>
      <Footer />
    </div>
  );
};

export default Refund;
