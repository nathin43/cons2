import React, { useState, useContext } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import API from "../../services/api";
import { ToastContext } from "../../context/ToastContext";
import "./Contact.css";

const Contact = () => {
  const { success, error } = useContext(ToastContext);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    inquiryType: "general-question",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const inquiryTypes = [
    { value: "general-question", label: "General Question" },
    { value: "product-info", label: "Product Information" },
    { value: "order-issue", label: "Order Issue" },
    { value: "return-replacement", label: "Return / Replacement" },
    { value: "warranty", label: "Warranty Support" },
    { value: "technical", label: "Technical Assistance" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.email || !formData.phone || !formData.message) {
      error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const { data } = await API.post('/contact', formData);

      if (data.success) {
        success("Message sent successfully! We'll get back to you soon.");
        setFormData({
          name: "",
          email: "",
          phone: "",
          inquiryType: "general-question",
          message: "",
        });
      } else {
        error(data.message || "Failed to send message. Please try again.");
      }
    } catch (err) {
      console.error("Contact submission error:", err);
      error(err.response?.data?.message || "Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <Navbar />
      <div className="contact-container">
        <div className="contact-header">
          <h1>Contact Us</h1>
          <p>We're here to help! Get in touch with our team.</p>
        </div>

        <div className="contact-card">
          <div className="contact-content">
            {/* LEFT SIDE - GET IN TOUCH */}
            <div className="contact-info">
              <h2>Get in Touch</h2>

              {/* ADDRESS CARD */}
              <div className="info-card">
                <div className="info-icon-circle address-icon">
                  <span>📍</span>
                </div>
                <div className="info-content">
                  <h3>Address</h3>
                  <p>Kunathur Road, Perundurai 638052</p>
                </div>
              </div>

              {/* PHONE CARD */}
              <div className="info-card">
                <div className="info-icon-circle phone-icon">
                  <span>📞</span>
                </div>
                <div className="info-content">
                  <h3>Phone</h3>
                  <p>+91-9095399271</p>
                </div>
              </div>

              {/* EMAIL CARD */}
              <div className="info-card">
                <div className="info-icon-circle email-icon">
                  <span>✉️</span>
                </div>
                <div className="info-content">
                  <h3>Email</h3>
                  <p>manielectricalshop@gmail.com</p>
                </div>
              </div>

              {/* HOURS CARD */}
              <div className="info-card">
                <div className="info-icon-circle hours-icon">
                  <span>⏰</span>
                </div>
                <div className="info-content">
                  <h3>Business Hours</h3>
                  <div className="hours-list">
                    <div className="hour-item">
                      <span className="day">Monday – Friday</span>
                      <span className="time">9:00 AM – 6:00 PM</span>
                    </div>
                    <div className="hour-item">
                      <span className="day">Saturday</span>
                      <span className="time">10:00 AM – 4:00 PM</span>
                    </div>
                    <div className="hour-item">
                      <span className="day">Sunday</span>
                      <span className="time closed">Closed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE - CONTACT FORM */}
            <div className="contact-form-section">
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label htmlFor="name">Name *</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Your full name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your@email.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone *</label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+91 (555) 123-4567"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="inquiryType">Inquiry Type *</label>
                  <select
                    id="inquiryType"
                    name="inquiryType"
                    value={formData.inquiryType}
                    onChange={handleChange}
                    required
                  >
                    {inquiryTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder="Please provide detailed information about your inquiry..."
                    rows="8"
                  />
                </div>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Contact Support"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
