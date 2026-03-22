import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import API from '../../services/api';
import { useToast } from '../../hooks/useToast';
import './ForgotPassword.css';

/**
 * Password strength calculator
 */
const calculatePasswordStrength = (password) => {
  if (!password) return { strength: '', label: '', color: '' };
  
  let score = 0;
  
  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Character variety checks
  if (/[a-z]/.test(password)) score++; // lowercase
  if (/[A-Z]/.test(password)) score++; // uppercase
  if (/[0-9]/.test(password)) score++; // numbers
  if (/[^a-zA-Z0-9]/.test(password)) score++; // special chars
  
  // Determine strength
  if (score <= 2) {
    return { strength: 'weak', label: 'Weak', color: '#DC2626', percentage: 33 };
  } else if (score <= 4) {
    return { strength: 'good', label: 'Good', color: '#F59E0B', percentage: 66 };
  } else {
    return { strength: 'excellent', label: 'Excellent', color: '#10B981', percentage: 100 };
  }
};

/**
 * Forgot Password Page Component
 */
const ForgotPassword = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ strength: '', label: '', color: '', percentage: 0 });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Update password strength when password changes
    if (name === 'newPassword') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match on frontend
    if (formData.newPassword !== formData.confirmPassword) {
      const errorMsg = 'Passwords do not match';
      setError(errorMsg);
      showError(errorMsg);
      return;
    }

    // Validate password length on frontend
    if (formData.newPassword.length < 8) {
      const errorMsg = 'Password must be at least 8 characters';
      setError(errorMsg);
      showError(errorMsg);
      return;
    }

    setLoading(true);

    try {
      const { data } = await API.post('/auth/forgot-password', {
        email: formData.email,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });

      if (data.success) {
        success('Password reset successfully. Please login with your new password.');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Password reset failed';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/login');
  };

  return (
    <>
      <Navbar />
      <div className="auth-page">
        <div className="container">
          <div className="auth-card">
            <h1>Forgot Password</h1>
            <p className="auth-subtitle">
              Enter your registered email address and set a new password to regain access to your account.
            </p>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>
                  <i className="icon-email">✉</i> Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your registered email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <i className="icon-lock">🔒</i> New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  placeholder="Create a new password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  minLength={8}
                />
                {formData.newPassword && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div 
                        className={`strength-fill strength-${passwordStrength.strength}`}
                        style={{ 
                          width: `${passwordStrength.percentage}%`,
                          backgroundColor: passwordStrength.color
                        }}
                      ></div>
                    </div>
                    <div className="strength-text" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>
                  <i className="icon-lock">🔒</i> Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Re-enter new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={8}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-block"
                disabled={loading}
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>

              <button 
                type="button" 
                className="btn btn-secondary btn-block"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Remember your password?{' '}
                <Link to="/login">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ForgotPassword;
