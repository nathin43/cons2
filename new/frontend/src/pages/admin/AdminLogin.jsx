import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import './AdminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { adminLogin } = useContext(AuthContext);
  const { success, error: showError } = useToast();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!formData.email.trim() || !formData.password.trim()) {
      const msg = 'Please enter both email and password';
      showError(msg);
      setError(msg);
      setLoading(false);
      return;
    }
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const result = await adminLogin(formData.email, formData.password);
      if (result.success) {
        success('Admin Login Successful! Welcome to dashboard.');
        setTimeout(() => navigate('/admin/dashboard'), 500);
      } else {
        showError(result.message || 'Login failed. Please check your credentials.');
        setError(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      showError('An unexpected error occurred. Please try again.');
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="al-page">
      <div className="al-bg">
        <div className="al-orb al-orb--1"></div>
        <div className="al-orb al-orb--2"></div>
        <div className="al-orb al-orb--3"></div>
        <div className="al-grid"></div>
      </div>

      <div className="al-particles">
        {[...Array(18)].map((_, i) => (
          <div key={i} className={`al-particle al-particle--${i + 1}`}></div>
        ))}
      </div>

      <div className="al-container">
        <div className="al-brand">
          <div className="al-brand__bolt">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <span className="al-brand__name">Mani Electricals</span>
        </div>

        <div className="al-card">
          <div className="al-card__glow-bar"></div>

          <div className="al-card__body">
            <div className="al-icon">
              <div className="al-icon__ring"></div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>

            <h1 className="al-title">Admin Portal</h1>
            <p className="al-subtitle">Secure access to store management</p>

            {error && <div className="al-error">{error}</div>}

            <form onSubmit={handleSubmit} className="al-form">
              <div className="al-field">
                <label className="al-field__label">Email Address</label>
                <div className="al-field__wrap">
                  <span className="al-field__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="admin@manielectricals.com"
                    className="al-field__input"
                  />
                </div>
              </div>

              <div className="al-field">
                <label className="al-field__label">Password</label>
                <div className="al-field__wrap">
                  <span className="al-field__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your password"
                    minLength={6}
                    className="al-field__input"
                  />
                  <button
                    type="button"
                    className="al-field__eye"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="al-btn" disabled={loading}>
                <span className="al-btn__shimmer"></span>
                {loading ? (
                  <>
                    <span className="al-btn__spinner"></span>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                      <polyline points="10 17 15 12 10 7"/>
                      <line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                    Sign In to Admin Panel
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="al-card__footer">
            <a href="/" className="al-back">Back to Store</a>
            <span className="al-secure">Secure Login</span>
          </div>
        </div>

        <p className="al-copyright">{new Date().getFullYear()} Mani Electricals. All rights reserved.</p>
      </div>
    </div>
  );
};

export default AdminLogin;
