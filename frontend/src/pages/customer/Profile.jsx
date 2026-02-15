import { useState, useContext } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';
import UserReports from './UserReports';
import './Profile.css';

/**
 * Profile Page Component
 * View and update user profile
 */
const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [message, setMessage] = useState({ type: '', text: '' });

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const updateData = {
        name: profileData.name,
        phone: profileData.phone,
        address: {
          street: profileData.street,
          city: profileData.city,
          state: profileData.state,
          zipCode: profileData.zipCode,
          country: 'India'
        }
      };

      await API.put('/users/profile', updateData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditing(false);
      
      // Update local storage
      const updatedUser = { ...user, ...updateData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update profile'
      });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    try {
      await API.put('/users/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setChangingPassword(false);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update password'
      });
    }
  };

  return (
    <>
      <Navbar />

      <div className="profile-page">
        <div className="container">
          <h1>My Profile</h1>

          {/* Tabs */}
          <div className="profile-tabs">
            <button
              className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile Information
            </button>
            <button
              className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              My Reports
            </button>
          </div>

          {activeTab === 'profile' ? (
            <>
          {message.text && (
            <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'}`}>
              {message.text}
            </div>
          )}

          <div className="profile-grid">
            {/* Profile Information */}
            <div className="profile-card">
              <div className="card-header">
                <h2>Profile Information</h2>
                {!editing && (
                  <button onClick={() => setEditing(true)} className="btn btn-sm btn-primary">
                    Edit Profile
                  </button>
                )}
              </div>

              <div className="card-body">
                {editing ? (
                  <form onSubmit={handleProfileSubmit}>
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={profileData.name}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={user?.email}
                        disabled
                        className="disabled-input"
                      />
                      <small className="text-muted">Email cannot be changed</small>
                    </div>

                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        required
                        pattern="[0-9]{10}"
                      />
                    </div>

                    <h3 className="section-title">Address</h3>

                    <div className="form-group">
                      <label>Street</label>
                      <input
                        type="text"
                        name="street"
                        value={profileData.street}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>City</label>
                        <input
                          type="text"
                          name="city"
                          value={profileData.city}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>State</label>
                        <input
                          type="text"
                          name="state"
                          value={profileData.state}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Zip Code</label>
                        <input
                          type="text"
                          name="zipCode"
                          value={profileData.zipCode}
                          onChange={handleProfileChange}
                          required
                          pattern="[0-9]{6}"
                        />
                      </div>
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary">
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="profile-info">
                    <div className="info-row">
                      <span className="info-label">Name:</span>
                      <span className="info-value">{user?.name}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{user?.email}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Phone:</span>
                      <span className="info-value">{user?.phone}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Address:</span>
                      <span className="info-value">
                        {user?.address?.street}, {user?.address?.city}, {user?.address?.state} - {user?.address?.zipCode}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Change Password */}
            <div className="profile-card">
              <div className="card-header">
                <h2>Change Password</h2>
              </div>

              <div className="card-body">
                {!changingPassword ? (
                  <button
                    onClick={() => setChangingPassword(true)}
                    className="btn btn-outline"
                  >
                    Change Password
                  </button>
                ) : (
                  <form onSubmit={handlePasswordSubmit}>
                    <div className="form-group">
                      <label>Current Password</label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                        minLength={6}
                      />
                    </div>

                    <div className="form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        minLength={6}
                      />
                    </div>

                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        minLength={6}
                      />
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary">
                        Update Password
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setChangingPassword(false);
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          <div className="danger-zone">
            <h3>Account Actions</h3>
            <button onClick={logout} className="btn btn-danger">
              Logout from All Devices
            </button>
          </div>
            </>
          ) : (
            <UserReports />
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Profile;
