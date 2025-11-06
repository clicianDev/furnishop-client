import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';
import Toast from '../components/Toast';
import './AdminUsersPage.css';

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (!token || role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/users');
      setUsers(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await api.delete(`/api/users/${deleteConfirm._id}`);
      showToast('User deleted successfully!', 'success');
      setDeleteConfirm(null);
      fetchUsers();
    } catch (error) {
      showToast('Failed to delete user', 'error');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-users-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage registered users</p>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <p className="stat-box-label">Total Users</p>
          <p className="stat-box-value">{users.length}</p>
        </div>
        <div className="stat-box">
          <p className="stat-box-label">Admins</p>
          <p className="stat-box-value stat-box-amber">{users.filter((u) => u.role === 'admin').length}</p>
        </div>
        <div className="stat-box">
          <p className="stat-box-label">Regular Users</p>
          <p className="stat-box-value stat-box-blue">{users.filter((u) => u.role === 'user').length}</p>
        </div>
      </div>

      <div className="users-table-card">
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge role-badge-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => setDeleteConfirm(user)}
                      className="btn btn-danger btn-sm"
                      disabled={user.role === 'admin'}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete User</h2>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete user "{deleteConfirm.name}"? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setDeleteConfirm(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleDeleteUser} className="btn btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
