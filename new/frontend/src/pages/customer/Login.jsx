import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import './Login.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * Customer Login Page Component
 */
const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, isAuthenticated } = useContext(AuthContext);
  const { success, error: showError, warning } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // If already logged in, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      success('Login Successful! Welcome back.');
      setTimeout(() => {
        navigate('/');
      }, 500);
    } else {
      showError(result.message || 'Login failed. Please try again.');
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
        success('Google Login Successful! Welcome back.');
        setTimeout(() => {
          navigate('/');
        }, 500);
      } else {
        showError(result.message || 'Google login failed');
        setError(result.message || 'Google login failed');
      }
    } catch (err) {
      showError('An error occurred during Google login');
      setError('An error occurred during Google login');
      console.error('Google login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    const errorMsg = 'Google login failed. Please try again.';
    showError(errorMsg);
    setError(errorMsg);
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
          className="auth-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Header */}
          <div className="auth-header">
            <div className="auth-icon-circle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="30" height="30">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <h1 className="auth-title">Login</h1>
            <p className="auth-subtitle">Sign in to your account</p>
          </div>

          {error && <div className="auth-alert">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="login-email">Email Address</label>
              <div className="input-icon-wrapper">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </span>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Password</label>
              <div className="input-icon-wrapper has-eye">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  minLength={6}
                />
                <button type="button" className="input-eye-btn" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                  {showPassword
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <div className="auth-forgot">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? (
                <><span className="btn-spinner"></span>Signing in...</>
              ) : 'Sign In'}
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
            <p>Don't have an account? <Link to="/register">Register</Link></p>
          </div>

          <div className="demo-credentials">
            <h4>Demo Credentials</h4>
            <p><strong>Email:</strong> john@example.com</p>
            <p><strong>Password:</strong> password123</p>
          </div>
        </motion.div>
      </div>

      <Footer />
    </GoogleOAuthProvider>
  );
};

export default Login;
