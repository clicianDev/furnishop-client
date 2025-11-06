import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';
import Toast from '../components/Toast';
import './AdminPaymentMethods.css';

const AdminPaymentMethods = () => {
  const navigate = useNavigate();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingMethod, setAddingMethod] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [methodForm, setMethodForm] = useState({
    serviceProvider: 'GCash',
    type: 'eWallet',
    accountNumber: '+63',
    accountName: '',
    qrImage: ''
  });

  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState('');
  const [uploadingQR, setUploadingQR] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const serviceProviders = ['GCash', 'PayMaya'];
  const types = ['eWallet'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (!token || role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchPaymentMethods();
  }, [navigate]);

  const fetchPaymentMethods = async () => {
    try {
      const response = await api.get('/api/payment-methods/all');
      setPaymentMethods(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      setLoading(false);
    }
  };

  const handleAddMethod = () => {
    setAddingMethod(true);
    setMethodForm({
      serviceProvider: 'GCash',
      type: 'eWallet',
      accountNumber: '+63',
      accountName: '',
      qrImage: ''
    });
    setQrFile(null);
    setQrPreview('');
  };

  const handleEdit = (method) => {
    setEditingMethod(method._id);
    setMethodForm({
      serviceProvider: method.serviceProvider,
      type: method.type,
      accountNumber: method.accountNumber,
      accountName: method.accountName,
      qrImage: method.qrImage,
      isActive: method.isActive
    });
    setQrPreview(method.qrImage);
  };

  const handleDelete = (method) => {
    setDeleteConfirm(method);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/api/payment-methods/${deleteConfirm._id}`);
      showToast('Payment method deleted successfully!', 'success');
      setDeleteConfirm(null);
      fetchPaymentMethods();
    } catch (error) {
      showToast('Failed to delete payment method: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Ensure account number always starts with +63
    if (name === 'accountNumber') {
      if (!value.startsWith('+63')) {
        setMethodForm({ ...methodForm, [name]: '+63' });
        return;
      }
      // Limit to +63 followed by 10 digits
      const digits = value.slice(3);
      if (digits.length <= 10 && /^\d*$/.test(digits)) {
        setMethodForm({ ...methodForm, [name]: value });
      }
    } else {
      setMethodForm({
        ...methodForm,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleQRFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
      const ext = file.name.split('.').pop().toLowerCase();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'heic', 'heif'];

      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
        showToast('Only JPG, JPEG, PNG, and HEIC/HEIF (iPhone) files are allowed!', 'error');
        e.target.value = '';
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('File size must be less than 5MB', 'error');
        e.target.value = '';
        return;
      }

      setQrFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadQRToS3 = async () => {
    if (!qrFile) {
      return methodForm.qrImage; // Return existing image URL if no new file
    }

    setUploadingQR(true);
    try {
      const formData = new FormData();
      formData.append('qrImage', qrFile);
      formData.append('serviceProvider', methodForm.serviceProvider);

      const response = await api.post('/api/payment-methods/upload-qr', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.qrImageUrl;
    } catch (error) {
      console.error('Error uploading QR code:', error);
      showToast('Failed to upload QR code: ' + (error.response?.data?.message || error.message), 'error');
      return null;
    } finally {
      setUploadingQR(false);
    }
  };

  const saveMethod = async (e) => {
    e.preventDefault();

    // Validate account number
    if (!/^\+63\d{10}$/.test(methodForm.accountNumber)) {
      showToast('Please enter a valid Philippine phone number (+63 followed by 10 digits)', 'error');
      return;
    }

    // Validate QR image
    if (!qrFile && !methodForm.qrImage) {
      showToast('Please upload a QR code image', 'error');
      return;
    }

    try {
      // Upload QR image if new file selected
      const qrImageUrl = await uploadQRToS3();
      if (!qrImageUrl) {
        return;
      }

      const methodData = {
        ...methodForm,
        qrImage: qrImageUrl
      };

      if (editingMethod) {
        await api.put(`/api/payment-methods/${editingMethod}`, methodData);
        showToast('Payment method updated successfully!', 'success');
      } else {
        await api.post('/api/payment-methods', methodData);
        showToast('Payment method added successfully!', 'success');
      }

      setAddingMethod(false);
      setEditingMethod(null);
      setMethodForm({
        serviceProvider: 'GCash',
        type: 'eWallet',
        accountNumber: '+63',
        accountName: '',
        qrImage: ''
      });
      setQrFile(null);
      setQrPreview('');
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error saving payment method:', error);
      showToast('Failed to save payment method: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const cancelEdit = () => {
    setEditingMethod(null);
    setAddingMethod(false);
    setMethodForm({
      serviceProvider: 'GCash',
      type: 'eWallet',
      accountNumber: '+63',
      accountName: '',
      qrImage: ''
    });
    setQrFile(null);
    setQrPreview('');
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-payment-methods-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Payment Methods</h1>
          <p className="page-subtitle">Manage eWallet payment options</p>
        </div>
        <button onClick={handleAddMethod} className="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Payment Method
        </button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-box">
          <p className="stat-box-label">Total Methods</p>
          <p className="stat-box-value">{paymentMethods.length}</p>
        </div>
        <div className="stat-box">
          <p className="stat-box-label">Active</p>
          <p className="stat-box-value stat-box-green">{paymentMethods.filter((m) => m.isActive).length}</p>
        </div>
        <div className="stat-box">
          <p className="stat-box-label">Inactive</p>
          <p className="stat-box-value stat-box-red">{paymentMethods.filter((m) => !m.isActive).length}</p>
        </div>
      </div>

      {/* Payment Methods Table */}
      <div className="table-card">
        <div className="table-container">
          <table className="payment-table">
            <thead>
              <tr>
                <th>Service Provider</th>
                <th>Type</th>
                <th>Account Number</th>
                <th>Account Name</th>
                <th>QR Image</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paymentMethods.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                      <line x1="2" y1="10" x2="22" y2="10"></line>
                    </svg>
                    <p>No payment methods yet</p>
                    <button onClick={handleAddMethod} className="btn btn-secondary btn-sm">
                      Add First Payment Method
                    </button>
                  </td>
                </tr>
              ) : (
                paymentMethods.map((method) => (
                  <tr key={method._id}>
                    <td>
                      <div className="provider-cell">
                        <span className={`provider-badge ${method.serviceProvider.toLowerCase()}`}>
                          {method.serviceProvider}
                        </span>
                      </div>
                    </td>
                    <td>{method.type}</td>
                    <td className="account-number">{method.accountNumber}</td>
                    <td>{method.accountName}</td>
                    <td>
                      <div className="qr-thumbnail-container">
                        <img 
                          src={method.qrImage} 
                          alt={`${method.serviceProvider} QR`}
                          className="qr-thumbnail"
                          onClick={() => window.open(method.qrImage, '_blank')}
                        />
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${method.isActive ? 'status-active' : 'status-inactive'}`}>
                        {method.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={() => handleEdit(method)} 
                          className="btn-icon btn-edit"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(method)} 
                          className="btn-icon btn-delete"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(addingMethod || editingMethod) && (
        <div className="modal-backdrop" onClick={cancelEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}</h2>
              <button onClick={cancelEdit} className="modal-close">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <form onSubmit={saveMethod} className="modal-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label>Service Provider *</label>
                  <select
                    name="serviceProvider"
                    value={methodForm.serviceProvider}
                    onChange={handleInputChange}
                    required
                  >
                    {serviceProviders.map((provider) => (
                      <option key={provider} value={provider}>{provider}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    name="type"
                    value={methodForm.type}
                    onChange={handleInputChange}
                    required
                  >
                    {types.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Account Number * (Philippine format)</label>
                <input
                  type="text"
                  name="accountNumber"
                  value={methodForm.accountNumber}
                  onChange={handleInputChange}
                  placeholder="+639123456789"
                  required
                />
                <small className="form-hint">Format: +63 followed by 10 digits</small>
              </div>

              <div className="form-group">
                <label>Account Name *</label>
                <input
                  type="text"
                  name="accountName"
                  value={methodForm.accountName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="form-group">
                <label>QR Code Image * (JPG, JPEG, PNG, HEIC)</label>
                <input
                  type="file"
                  name="qrFile"
                  onChange={handleQRFileChange}
                  accept=".jpg,.jpeg,.png,.heic,.heif"
                  className="file-input"
                />
                {qrPreview && (
                  <div className="qr-preview-container">
                    <p className="preview-label">QR Code Preview:</p>
                    <img src={qrPreview} alt="QR Preview" className="qr-preview" />
                  </div>
                )}
                {uploadingQR && <p className="upload-status">Uploading QR code...</p>}
              </div>

              {editingMethod && (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={methodForm.isActive}
                      onChange={handleInputChange}
                    />
                    <span>Active</span>
                  </label>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" onClick={cancelEdit} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploadingQR}>
                  {uploadingQR ? 'Uploading...' : (editingMethod ? 'Update Method' : 'Add Method')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Payment Method</h2>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete the {deleteConfirm.serviceProvider} payment method for "{deleteConfirm.accountName}"?</p>
              <p className="warning-text">This action cannot be undone and will delete the QR code from storage.</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setDeleteConfirm(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={confirmDelete} className="btn btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentMethods;
