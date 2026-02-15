import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
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
  const { login, loginWithGoogle } = useContext(AuthContext);
  const { success, error: showError, warning } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
          <div className="container">
            <div className="auth-card">
              <div className="alert alert-danger">
                Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Navbar />

      <div className="auth-page">
        <div className="container">
          <div className="auth-card">
            <h1>Login</h1>
            <p className="auth-subtitle">Welcome back! Please login to your account.</p>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <div className="forgot-password-link">
                <Link to="/forgot-password">
                  Forgot Password?
                </Link>
              </div>
            </form>

            <div style={{ textAlign: 'center', margin: '24px 0', padding: '20px 0', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
              <p style={{ color: '#5f6368', fontSize: '14px', fontWeight: '500', marginBottom: '16px' }}>or continue with</p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  auto_select={false}
                  itp_supported={false}
                />
              </div>
            </div>

            <div className="auth-footer">
              <p>Don't have an account? <Link to="/register">Register here</Link></p>
            </div>

            {/* Demo Credentials */}
            <div className="demo-credentials">
              <h4>Demo Credentials:</h4>
              <p><strong>Email:</strong> john@example.com</p>
              <p><strong>Password:</strong> password123</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </GoogleOAuthProvider>
  );
};

export default Login;
