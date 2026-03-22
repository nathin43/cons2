import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import AdminLayout from '../../components/AdminLayout';
import DashboardSkeleton from '../../components/DashboardSkeleton';
import useAdminLoader from '../../hooks/useAdminLoader';
import API from '../../services/api';
import { useToast } from '../../hooks/useToast';
import './AdminManagement.css';

/**
 * Admin Management Page
 * MAIN_ADMIN only page for managing admin users
 */
const AdminManagement = () => {
  const { admin } = useContext(AuthContext);
  const navigate = useNavigate();
  const showToast = useToast();

  const [admins, setAdmins] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SUB_ADMIN',
    status: 'Active'
  });
  const [formError, setFormError] = useState('');
  const { loading, run } = useAdminLoader();

  // Redirect if not MAIN_ADMIN (check role)
  useEffect(() => {
    if (admin && admin.role !== 'MAIN_ADMIN') {
      navigate('/admin/dashboard');
      showToast('Access denied. Only MAIN_ADMIN can access this page', 'error');
    }
  }, [admin, navigate, showToast]);

  // Fetch all admins
  useEffect(() => {
    run(fetchAdmins);
  }, []);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const { data } = await API.get('/admin-management/admins', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setAdmins(data.admins);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch admins';
      if (error.response?.status === 403) {
        showToast('Access denied. Admin management is restricted.', 'error');
        navigate('/admin/dashboard');
        return;
      }
      showToast(errorMessage, 'error');
    }
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'SUB_ADMIN',
      status: 'Active'
    });
    setFormError('');
    setSelectedAdmin(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (adminData) => {
    // Prevent editing MAIN_ADMIN account details
    if (adminData.role === 'MAIN_ADMIN') {
      showToast('MAIN_ADMIN account details cannot be edited', 'error');
      return;
    }

    setModalMode('edit');
    setSelectedAdmin(adminData);
    setFormData({
      name: adminData.name,
      email: adminData.email,
      password: '', // Don't show password
      role: adminData.role,
      status: adminData.status
    });
    setFormError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAdmin(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      status: 'Active'
    });
    setFormError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveAdmin = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validate
    if (!formData.name || !formData.email) {
      setFormError('Please fill in all required fields');
      return;
    }

    if (modalMode === 'add' && !formData.password) {
      setFormError('Password is required for new admin');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };

      if (modalMode === 'add') {
        // Create new admin
        const { data } = await API.post('/admin-management/admins', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          status: formData.status
        }, { headers });
        if (data.success) {
          showToast('Admin created successfully', 'success');
          handleCloseModal();
          fetchAdmins();
        }
      } else {
        // Update existing admin
        const updateData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          status: formData.status
        };
        // Only include password if provided
        if (formData.password) {
          updateData.password = formData.password;
        }

        const { data } = await API.put(`/admin-management/admins/${selectedAdmin._id}`, updateData, { headers });
        if (data.success) {
          showToast('Admin updated successfully', 'success');
          handleCloseModal();
          fetchAdmins();
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to save admin';
      
      // Handle 403 Forbidden
      if (error.response?.status === 403) {
        setFormError('Access denied. Admin management is restricted.');
        navigate('/admin/dashboard');
        return;
      }
      
      setFormError(errorMessage);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const { data } = await API.delete(`/admin-management/admins/${adminId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        showToast('Admin deleted successfully', 'success');
        fetchAdmins();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete admin';
      
      // Handle 403 Forbidden
      if (error.response?.status === 403) {
        showToast('Access denied. Admin management is restricted.', 'error');
        navigate('/admin/dashboard');
        return;
      }
      
      showToast(errorMessage, 'error');
    }
  };

  const mainAdminCount = admins.filter(a => a.role === 'MAIN_ADMIN').length;
  const subAdminCount = admins.filter(a => a.role === 'SUB_ADMIN').length;

  if (loading) {
    return (
      <AdminLayout>
        <DashboardSkeleton title="Loading Admin Management" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-management-container">
        <div className="admin-management-header">
          <h2>Admin Management</h2>
          {admin?.role === 'MAIN_ADMIN' && (
            <button className="add-admin-btn" onClick={handleOpenAddModal}>
              <span>✚</span> Add New Admin
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="admin-list-stats">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <h4>Total Admins</h4>
            <p>{admins.length}</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👑</div>
            <h4>Main Admins</h4>
            <p>{mainAdminCount}</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔐</div>
            <h4>Sub Admins</h4>
            <p>{subAdminCount}</p>
          </div>
        </div>

        {/* Admin List */}
        <div className="admin-management-content">
          {admins.length === 0 ? (
            <div className="no-admins">
              <p>📭 No admins found</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(adminItem => (
                  <tr key={adminItem._id}>
                    <td>
                      <div className="admin-name">{adminItem.name}</div>
                      <div className="admin-email">{adminItem.email}</div>
                    </td>
                    <td>{adminItem.email}</td>
                    <td>
                      <span className={`role-badge ${adminItem.role === 'MAIN_ADMIN' ? 'main-admin' : 'sub-admin'}`}>
                        {adminItem.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${adminItem.status === 'Active' ? 'active' : 'disabled'}`}>
                        {adminItem.status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="action-btn edit"
                          onClick={() => handleOpenEditModal(adminItem)}
                          disabled={adminItem.role === 'MAIN_ADMIN'}
                          data-tooltip={adminItem.role === 'MAIN_ADMIN' ? 'Cannot edit' : 'Edit Admin'}
                          title={adminItem.role === 'MAIN_ADMIN' ? 'Cannot edit MAIN_ADMIN' : 'Edit admin'}
                        >
                          ✎
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDeleteAdmin(adminItem._id)}
                          disabled={adminItem.role === 'MAIN_ADMIN'}
                          data-tooltip={adminItem.role === 'MAIN_ADMIN' ? 'Cannot delete' : 'Delete Admin'}
                          title={adminItem.role === 'MAIN_ADMIN' ? 'Cannot delete MAIN_ADMIN' : 'Delete admin'}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{modalMode === 'add' ? 'Add New Admin' : 'Edit Admin'}</h3>
                <p>{modalMode === 'add' ? 'Create a new admin account' : 'Update admin details'}</p>
              </div>

              {formError && <div className="alert error">{formError}</div>}

              <form onSubmit={handleSaveAdmin}>
                <div className="form-group">
                  <label htmlFor="name">Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter admin name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="Enter admin email"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">
                    Password {modalMode === 'edit' && '(Leave blank to keep current)'}
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleFormChange}
                    placeholder={modalMode === 'add' ? 'Enter password' : 'Leave blank to keep current'}
                    required={modalMode === 'add'}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role">Role *</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="SUB_ADMIN">SUB_ADMIN</option>
                    <option value="MAIN_ADMIN">MAIN_ADMIN</option>
                  </select>
                  <small>MAIN_ADMIN: Full access to all admin features | SUB_ADMIN: Limited access</small>
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status *</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {modalMode === 'add' ? 'Create Admin' : 'Update Admin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminManagement;
