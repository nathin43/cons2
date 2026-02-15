import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";
import API from "../../services/api";
import "./EasyReturn.css";

const EasyReturn = () => {
  const { success, error } = useToast();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    orderId: "",
    reason: "defective",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch product categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await API.get('/products');
      
      if (data.products && Array.isArray(data.products)) {
        // Extract unique categories from products
        const uniqueCategories = [...new Set(data.products.map(p => p.category))].filter(Boolean);
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Fallback categories
      setCategories(["Fan", "Switch", "Lights", "Heater", "Wire & Cables", "Motors", "Pipes", "Other Electrical Items"]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      error("Please enter your name");
      return;
    }
    if (!formData.email.trim()) {
      error("Please enter your email");
      return;
    }
    if (!formData.phone.trim()) {
      error("Please enter your phone number");
      return;
    }
    if (!formData.category) {
      error("Please select a product category");
      return;
    }
    if (!formData.message.trim()) {
      error("Please enter a message");
      return;
    }

    setLoading(true);

    try {
      const { data } = await API.post('/returns', {
        ...formData,
        type: "easy-return",
      });

      if (data.success || response.ok) {
        setSubmitSuccess(true);
        success("Your return request has been submitted successfully!");
        
        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          category: "",
          orderId: "",
          reason: "defective",
          message: "",
        });

        // Close success message after 3 seconds
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 3000);
      } else {
        error(data.message || "Error submitting return request. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      error("Error submitting return request. Please try again.");
    }

    setLoading(false);
  };

  const returnReasons = [
    { value: "defective", label: "Defective / Not Working" },
    { value: "damaged", label: "Damaged on Arrival" },
    { value: "wrong-item", label: "Wrong Item Received" },
    { value: "poor-quality", label: "Poor Quality" },
    { value: "changed-mind", label: "Changed Mind" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="easy-return-page">
      <Navbar />
      
      <div className="easy-return-container">
        <div className="easy-return-header">
          <h1>Easy Return & Support</h1>
          <p>We make returns simple and hassle-free. Tell us about your issue.</p>
        </div>

        <div className="easy-return-content">
          {/* Left Side - Store Information */}
          <div className="return-info">
            <h2>Return Support</h2>
            
            <div className="info-item">
              <h3>📍 Address</h3>
              <p>Kunathur Road, Perundurai 638052</p>
            </div>

            <div className="info-item">
              <h3>📞 Phone</h3>
              <p>+91-9095399271</p>
            </div>

            <div className="info-item">
              <h3>✉️ Email</h3>
              <p>manielectricalshop@gmail.com</p>
            </div>

            <div className="info-item">
              <h3>⏰ Hours</h3>
              <div className="hours-list">
                <div className="hours-row">
                  <span className="day">Monday – Friday</span>
                  <span className="time">9:00 AM – 6:00 PM</span>
                </div>
                <div className="hours-row">
                  <span className="day">Saturday</span>
                  <span className="time">10:00 AM – 4:00 PM</span>
                </div>
                <div className="hours-row">
                  <span className="day">Sunday</span>
                  <span className="time closed">Closed</span>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h3>📦 Return Policy</h3>
              <ul>
                <li>7 days return window from delivery</li>
                <li>Product must be in original condition</li>
                <li>Free return shipping available</li>
                <li>Full refund within 5-7 business days</li>
              </ul>
            </div>
          </div>

          {/* Right Side - Return Request Form */}
          <div className="return-form-wrapper">
            <form onSubmit={handleSubmit} className="return-form">
              {submitSuccess && (
                <div className="success-message">
                  <span className="success-icon">✓</span>
                  <span>Your return request has been submitted successfully!</span>
                </div>
              )}

              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  maxLength="100"
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  maxLength="100"
                />
              </div>

              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91-9XXX-XXX-XXX"
                  maxLength="20"
                />
              </div>

              <div className="form-group">
                <label>Product Category * 🔧</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Order ID (Optional)</label>
                <input
                  type="text"
                  name="orderId"
                  value={formData.orderId}
                  onChange={handleChange}
                  placeholder="e.g., ORD-123456"
                  maxLength="50"
                />
              </div>

              <div className="form-group">
                <label>Reason for Return *</label>
                <select
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                >
                  {returnReasons.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Message / Description *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Please describe the issue in detail..."
                  rows="5"
                  maxLength="500"
                />
                <div className="char-count">
                  {formData.message.length}/500
                </div>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                <span className="btn-icon">📤</span>
                {loading ? "Submitting..." : "Submit Return Request"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EasyReturn;
