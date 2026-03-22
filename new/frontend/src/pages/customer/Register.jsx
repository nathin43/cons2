import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import './Login.css';
import './Register.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * Customer Registration Page Component
 */
const Register = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle, isAuthenticated } = useContext(AuthContext);
  const { success, error: showError, warning } = useToast();

  // If already logged in, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [validationErrors, setValidationErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [passwordStrength, setPasswordStrength] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
    phone: false
  });

  /**
   * Validation Functions
   */
  const validateName = (value) => {
    if (!value.trim()) {
      return 'Full name is required';
    }
    if (!/^[a-zA-Z\s]+$/.test(value)) {
      return 'Full name can only contain letters and spaces';
    }
    if (value.trim().length < 2) {
      return 'Full name must be at least 2 characters';
    }
    return '';
  };

  const validateEmail = (value) => {
    if (!value.trim()) {
      return 'Email address is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address (example@domain.com)';
    }
    return '';
  };

  const validatePhone = (value) => {
    if (!value.trim()) {
      return 'Phone number is required';
    }
    if (!/^[6-9][0-9]{9}$/.test(value)) {
      return 'Phone number must be 10 digits and cannot start with 0';
    }
    return '';
  };

  const getPasswordStrength = (value) => {
    if (value.length === 0) return '';
    
    const hasLowerCase = /[a-z]/.test(value);
    const hasUpperCase = /[A-Z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
    
    if (value.length >= 8 && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar) {
      return 'Excellent';
    }
    if (value.length >= 6 && hasLowerCase && hasNumber) {
      return 'Strong';
    }
    return 'Poor';
  };

  const validatePassword = (value) => {
    if (!value) {
      return 'Password is required';
    }
    if (value.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  };

  const validateConfirmPassword = (value, password) => {
    if (!value) {
      return 'Please confirm your password';
    }
    if (value !== password) {
      return 'Passwords do not match';
    }
    return '';
  };

  /**
   * Check if all validations pass
   */
  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.password.trim() !== '' &&
      formData.confirmPassword.trim() !== '' &&
      formData.phone.trim() !== '' &&
      !validationErrors.name &&
      !validationErrors.email &&
      !validationErrors.password &&
      !validationErrors.confirmPassword &&
      !validationErrors.phone
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    // Auto-convert email to lowercase
    if (name === 'email') {
      finalValue = value.toLowerCase();
    }

    // Restrict phone to digits only and max 10
    if (name === 'phone') {
      finalValue = value.replace(/[^\d]/g, '').slice(0, 10);
    }

    setFormData({ ...formData, [name]: finalValue });

    // Real-time validation
    let fieldError = '';
    if (name === 'name') {
      fieldError = validateName(finalValue);
    } else if (name === 'email') {
      fieldError = validateEmail(finalValue);
    } else if (name === 'phone') {
      fieldError = validatePhone(finalValue);
    } else if (name === 'password') {
      fieldError = validatePassword(finalValue);
      setPasswordStrength(getPasswordStrength(finalValue));
    } else if (name === 'confirmPassword') {
      fieldError = validateConfirmPassword(finalValue, formData.password);
    }

    setValidationErrors({
      ...validationErrors,
      [name]: fieldError
    });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Mark all fields as touched for validation display
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      phone: true
    });

    if (!isFormValid()) {
      setError('Please fix all validation errors before submitting');
      return;
    }

    setLoading(true);

    const userData = {
      name: formData.name.trim(),
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
      phone: formData.phone
    };

    const result = await register(userData);

    if (result.success) {
      success('Account created successfully');
      setTimeout(() => {
        navigate('/login');
      }, 500);
    } else {
      showError(result.message || 'Registration failed. Please try again.');
      setError(result.message);
    }

    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const result = await loginWithGoogle(credentialResponse.credential);

      if (result.success) {
        success('Google Registration Successful! Welcome.');
        setTimeout(() => {
          navigate('/');
        }, 500);
      } else {
        showError(result.message || 'Google registration failed');
        setError(result.message || 'Google registration failed');
      }
    } catch (err) {
      showError('An error occurred during Google registration');
      setError('An error occurred during Google registration');
      console.error('Google registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    const errorMsg = 'Google registration failed. Please try again.';
    showError(errorMsg);
    setError(errorMsg);
  };

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 'Excellent':
        return '#10b981'; // green
      case 'Strong':
        return '#f59e0b'; // amber
      case 'Poor':
        return '#ef4444'; // red
      default:
        return '#d1d5db'; // gray
    }
  };

  if (!googleClientId || googleClientId === 'dummy') {
    return (
      <>
        <Navbar />
        <div className="auth-page">
          <div className="auth-card">
            <div className="auth-alert">
              Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {/* Full-Screen Background Animation Layer */}
      <div className="auth-fullscreen-bg">
        {/* Animated Background Elements */}
        <div className="auth-bg-effects">
          {/* Floating Blobs */}
          <div className="auth-blob auth-blob-1"></div>
          <div className="auth-blob auth-blob-2"></div>
          <div className="auth-blob auth-blob-3"></div>
          
          {/* Floating Bubbles */}
          <div className="auth-bubbles">
            {[...Array(35)].map((_, i) => (
              <div key={i} className={`auth-bubble auth-bubble-${i + 1}`}></div>
            ))}
          </div>
          
          {/* Animated Wave Effect */}
          <div className="auth-wave auth-wave-1"></div>
          <div className="auth-wave auth-wave-2"></div>
          <div className="auth-wave auth-wave-3"></div>
          
          {/* Mesh Grid */}
          <div className="auth-mesh-grid"></div>
        </div>
      </div>

      <Navbar />

      <div className="auth-page">

        <motion.div
          className="auth-card auth-card--register"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Header */}
          <div className="auth-header">
            <div className="auth-icon-circle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                <path d="M15 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm-9-2v-3H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z"/>
              </svg>
            </div>
            <h1 className="auth-title">Register</h1>
            <p className="auth-subtitle">Create your account to start shopping</p>
          </div>

          {error && <div className="auth-alert">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Row 1: Full Name + Email */}
            <div className="form-grid-2">
              <div className="auth-field">
                <label>Full Name</label>
                <div className="input-icon-wrapper">
                  <span className="input-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="John Doe"
                    className={touched.name && validationErrors.name ? 'input-error' : ''}
                  />
                </div>
                {touched.name && validationErrors.name && (
                  <div className="validation-error">✗ {validationErrors.name}</div>
                )}
              </div>
              <div className="auth-field">
                <label>Email Address</label>
                <div className="input-icon-wrapper">
                  <span className="input-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="you@example.com"
                    autoCapitalize="none"
                    autoCorrect="off"
                    className={touched.email && validationErrors.email ? 'input-error' : ''}
                  />
                </div>
                {touched.email && validationErrors.email && (
                  <div className="validation-error">✗ {validationErrors.email}</div>
                )}
              </div>
            </div>

            {/* Row 2: Phone + Password */}
            <div className="form-grid-2">
              <div className="auth-field">
                <label>Phone Number</label>
                <div className={`phone-prefix-wrapper${touched.phone && validationErrors.phone ? ' phone-prefix-wrapper--error' : ''}`}>
                  <span className="phone-prefix">+91</span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="10-digit number"
                    maxLength={10}
                    pattern="[6-9]{1}[0-9]{9}"
                    inputMode="numeric"
                  />
                </div>
                {touched.phone && validationErrors.phone && (
                  <div className="validation-error">✗ {validationErrors.phone}</div>
                )}
              </div>
              <div className="auth-field">
                <label>Password</label>
                <div className="input-icon-wrapper has-eye">
                  <span className="input-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Min 6 characters"
                    className={touched.password && validationErrors.password ? 'input-error' : ''}
                  />
                  <button type="button" className="input-eye-btn" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                    {showPassword
                      ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                {formData.password && (
                  <div className="password-strength-container">
                    <span className="password-strength-dot" style={{ backgroundColor: getStrengthColor() }}></span>
                    <span className={`password-strength-text ${passwordStrength.toLowerCase()}`}>{passwordStrength}</span>
                  </div>
                )}
                {touched.password && validationErrors.password && (
                  <div className="validation-error">✗ {validationErrors.password}</div>
                )}
              </div>
            </div>

            {/* Row 3: Confirm Password — full width */}
            <div className="auth-field auth-field--full">
              <label>Confirm Password</label>
              <div className="input-icon-wrapper has-eye">
                <span className="input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Re-enter your password"
                  className={touched.confirmPassword && validationErrors.confirmPassword ? 'input-error' : ''}
                />
                <button type="button" className="input-eye-btn" onClick={() => setShowConfirmPassword(v => !v)} tabIndex={-1}>
                  {showConfirmPassword
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {touched.confirmPassword && validationErrors.confirmPassword && (
                <div className="validation-error">✗ {validationErrors.confirmPassword}</div>
              )}
              {touched.confirmPassword && !validationErrors.confirmPassword && formData.confirmPassword && (
                <div className="validation-success">✓ Passwords match</div>
              )}
            </div>

            <button
              type="submit"
              className="auth-btn-primary"
              disabled={loading || !isFormValid()}
            >
              {loading ? (
                <><span className="btn-spinner"></span>Creating account...</>
              ) : 'Create Account'}
            </button>
          </form>

          <div className="auth-divider"><span>or continue with</span></div>

          <div className="auth-social">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              auto_select={false}
              itp_supported={false}
            />
          </div>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Login</Link></p>
          </div>
        </motion.div>
      </div>

      <Footer />
    </GoogleOAuthProvider>
  );
};

export default Register;
