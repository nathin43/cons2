import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./ServiceDetails.css";

const ServiceDetails = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServiceDetails();
  }, [serviceId]);

  const fetchServiceDetails = async () => {
    try {
      const { data } = await API.get(`/services/${serviceId}`);
      if (data.success) {
        setService(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching service details:", error);
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading service details...</div>;

  if (!service)
    return <div className="loading">Service not found</div>;

  return (
    <div className="service-details-container">
      <button className="back-btn" onClick={() => navigate("/services")}>
        ← Back to Services
      </button>

      <div className="service-details-content">
        {service.image && (
          <div className="service-details-image">
            <img src={service.image} alt={service.name} />
          </div>
        )}

        <div className="service-details-info">
          <h1>{service.name}</h1>

          <div className="service-meta">
            {service.price > 0 && (
              <span className="price-badge">
                Starting at ${service.price}
              </span>
            )}
            {service.duration && (
              <span className="duration-badge">{service.duration}</span>
            )}
          </div>

          <div className="service-description-full">
            <h3>Description</h3>
            <p>{service.description}</p>
          </div>

          {service.features && service.features.length > 0 && (
            <div className="service-features">
              <h3>Features</h3>
              <ul>
                {service.features.map((feature, idx) => (
                  <li key={idx}>✓ {feature}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="service-actions">
            <button className="book-btn">Book Service</button>
            <button className="inquiry-btn" onClick={() => navigate("/contact")}>
              Send Inquiry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;
