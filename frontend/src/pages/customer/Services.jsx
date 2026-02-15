import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import API from "../../services/api";
import "./Services.css";

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Icon and features mapping for services
  const serviceDetailsMap = {
    "electrical installation": {
      icon: "⚡",
      features: [
        "New Construction Wiring",
        "Lighting Installation",
        "Panel Upgrades",
        "Outlet Installation"
      ]
    },
    "repair and maintenance": {
      icon: "🔧",
      features: [
        "Troubleshooting",
        "Circuit Repairs",
        "Appliance Repairs",
        "Emergency Repairs"
      ]
    },
    "wiring services": {
      icon: "🏠",
      features: [
        "Rewiring Services",
        "Data Cabling",
        "Phone Line Installation",
        "Network Wiring"
      ]
    },
    "safety inspections": {
      icon: "🛡️",
      features: [
        "Home Inspections",
        "Code Compliance Checks",
        "Safety Upgrades",
        "Risk Assessment"
      ]
    }
  };

  const getServiceDetails = (serviceName) => {
    const lowerName = serviceName.toLowerCase();
    
    // Try exact match first
    if (serviceDetailsMap[lowerName]) {
      return serviceDetailsMap[lowerName];
    }

    // Try partial match
    for (const [key, details] of Object.entries(serviceDetailsMap)) {
      if (lowerName.includes(key) || key.includes(lowerName)) {
        return details;
      }
    }

    // Default fallback
    return {
      icon: "⚡",
      features: [
        "Professional Service",
        "Expert Technicians",
        "Quality Work",
        "Customer Satisfaction"
      ]
    };
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data } = await API.get('/services');
      if (data.success) {
        setServices(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching services:", error);
      setLoading(false);
    }
  };

  const handleViewDetails = (serviceId) => {
    navigate(`/service/${serviceId}`);
  };

  const handleContactUs = () => {
    navigate("/contact");
  };

  if (loading) return <div className="loading">Loading services...</div>;

  return (
    <div className="services-page">
      <Navbar />
      {/* Hero Section */}
      <div className="services-hero">
        <h1>Our Professional Services</h1>
        <p className="services-subtitle">
          Expert electrical solutions for residential and commercial needs
        </p>
      </div>

      {/* Services Grid */}
      <div className="services-container">
        <div className="services-grid">
          {services.map((service) => {
            const details = getServiceDetails(service.name);
            return (
              <div key={service._id} className="service-card">
                <div className="service-icon">
                  {service.image ? (
                    <img
                      src={service.image}
                      alt={service.name}
                      className="service-image-icon"
                    />
                  ) : (
                    <span className="icon-emoji">{details.icon}</span>
                  )}
                </div>

                <div className="service-card-content">
                  <h3 className="service-title">{service.name}</h3>

                  <p className="service-description">{service.description}</p>

                  {/* Features List */}
                  {details.features && details.features.length > 0 && (
                    <ul className="service-features">
                      {details.features.map((feature, idx) => (
                        <li key={idx}>
                          <span className="feature-dot">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Additional Info */}
                  <div className="service-meta">
                    {service.price > 0 && (
                      <span className="service-price">
                        From ₹{service.price}
                      </span>
                    )}
                    {service.duration && (
                      <span className="service-duration">{service.duration}</span>
                    )}
                  </div>

                  <button
                    className="view-details-btn"
                    onClick={() => handleViewDetails(service._id)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {services.length === 0 && (
          <div className="no-services">No services available at the moment</div>
        )}
      </div>

      {/* CTA Section */}
      {services.length > 0 && (
        <div className="services-cta">
          <h2>Need Our Services?</h2>
          <p>Contact us today for a free consultation and quote</p>
          <button className="contact-btn" onClick={handleContactUs}>
            Contact Us
          </button>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Services;
