import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import API from '../../services/api';
import { useToast } from '../../hooks/useToast';

/**
 * Admin Category Charges Page
 * MAIN_ADMIN page to view & edit GST % and shipping charges per product category.
 */
const AdminCategoryCharges = () => {
  const { success, error } = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ gst: '', shipping: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/categories');
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (err) {
      error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat._id);
    setEditValues({ gst: cat.gst, shipping: cat.shipping });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({ gst: '', shipping: '' });
  };

  const saveEdit = async (catId) => {
    const gst = parseFloat(editValues.gst);
    const shipping = parseFloat(editValues.shipping);

    if (isNaN(gst) || gst < 0 || gst > 100) {
      error('GST must be a number between 0 and 100');
      return;
    }
    if (isNaN(shipping) || shipping < 0) {
      error('Shipping must be a non-negative number');
      return;
    }

    try {
      setSaving(true);
      // PUT under /admin/ prefix ensures the API interceptor always sends adminToken
      const { data } = await API.put(`/admin/categories/update/${catId}`, { gst, shipping });
      if (data.success) {
        setCategories(prev =>
          prev.map(c => c._id === catId ? data.category : c)
        );
        success(`Updated "${data.category.name}" successfully`);
        cancelEdit();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary, #1a1a1a)' }}>
            Category Charges
          </h2>
          <p style={{ margin: '6px 0 0', color: 'var(--text-secondary, #666)', fontSize: '0.9rem' }}>
            Set GST percentage and flat shipping charge for each product category.
          </p>
        </div>

        {loading ? (
          <p style={{ color: '#666' }}>Loading categories…</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: '#fff',
              borderRadius: '10px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              overflow: 'hidden'
            }}>
              <thead>
                <tr style={{ background: 'var(--admin-primary, #f5f7fa)', textAlign: 'left' }}>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>GST (%)</th>
                  <th style={thStyle}>Shipping (₹)</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, index) => (
                  <tr key={cat._id} style={{ background: index % 2 === 0 ? '#fff' : '#fafafa', transition: 'background 0.15s' }}>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 600, color: '#333' }}>{cat.name}</span>
                    </td>

                    {editingId === cat._id ? (
                      <>
                        <td style={tdStyle}>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={editValues.gst}
                            onChange={e => setEditValues(v => ({ ...v, gst: e.target.value }))}
                            style={inputStyle}
                          />
                        </td>
                        <td style={tdStyle}>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={editValues.shipping}
                            onChange={e => setEditValues(v => ({ ...v, shipping: e.target.value }))}
                            style={inputStyle}
                          />
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <button
                            onClick={() => saveEdit(cat._id)}
                            disabled={saving}
                            style={{ ...btnStyle, background: '#22c55e', color: '#fff', marginRight: '8px' }}
                          >
                            {saving ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={saving}
                            style={{ ...btnStyle, background: '#e5e7eb', color: '#333' }}
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={tdStyle}>
                          <span style={tagStyle}>{cat.gst}%</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={tagStyle}>₹{cat.shipping}</span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <button
                            onClick={() => startEdit(cat)}
                            style={{ ...btnStyle, background: 'var(--admin-accent, #3b82f6)', color: '#fff' }}
                          >
                            Edit
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

const thStyle = {
  padding: '14px 18px',
  fontWeight: 600,
  fontSize: '0.85rem',
  color: 'var(--text-secondary, #555)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  borderBottom: '2px solid #e5e7eb'
};

const tdStyle = {
  padding: '14px 18px',
  borderBottom: '1px solid #f0f0f0',
  fontSize: '0.95rem',
  color: '#333',
  verticalAlign: 'middle'
};

const inputStyle = {
  width: '90px',
  padding: '7px 10px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '0.9rem',
  outline: 'none'
};

const btnStyle = {
  padding: '7px 16px',
  border: 'none',
  borderRadius: '6px',
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'opacity 0.15s'
};

const tagStyle = {
  display: 'inline-block',
  padding: '3px 10px',
  background: '#f0f4ff',
  color: '#3b5bdb',
  borderRadius: '20px',
  fontWeight: 600,
  fontSize: '0.88rem'
};

export default AdminCategoryCharges;
