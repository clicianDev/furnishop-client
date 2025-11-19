import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';
import Toast from '../components/Toast';
import './UserDashboard.css';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [customOrders, setCustomOrders] = useState([]);
  const [repairRequests, setRepairRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'custom'
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderType, setSelectedOrderType] = useState(null);
  const [repairDescription, setRepairDescription] = useState('');
  const [repairMedia, setRepairMedia] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [submittingRepair, setSubmittingRepair] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUserData();
    fetchOrders();
    fetchCustomOrders();
    fetchRepairRequests();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.get('/api/users/profile');
      setUser(response.data);
      setProfileFormData({
        name: response.data.name,
        email: response.data.email,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/transactions/my-orders');
      setOrders(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setLoading(false);
    }
  };

  const fetchCustomOrders = async () => {
    try {
      const response = await api.get('/api/custom-orders');
      setCustomOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch custom orders:', error);
    }
  };

  const fetchRepairRequests = async () => {
    try {
      const response = await api.get('/api/repair-requests/my-requests');
      setRepairRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch repair requests:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'status-success';
      case 'pending':
        return 'status-pending';
      case 'reviewing':
      case 'processing':
      case 'in-production':
        return 'status-processing';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const handleOpenRepairModal = (orderId, orderType) => {
    setSelectedOrder(orderId);
    setSelectedOrderType(orderType);
    setShowRepairModal(true);
    setRepairDescription('');
    setRepairMedia([]);
  };

  const handleCloseRepairModal = () => {
    setShowRepairModal(false);
    setSelectedOrder(null);
    setSelectedOrderType(null);
    setRepairDescription('');
    setRepairMedia([]);
    setTermsAccepted(false);
  };

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingMedia(true);
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('media', file);
      });

      const response = await api.post('/api/repair-requests/upload-media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setRepairMedia([...repairMedia, ...response.data.mediaUrls]);
    } catch (error) {
      console.error('Failed to upload media:', error);
      showToast('Failed to upload media. Please try again.', 'error');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSubmitRepairRequest = async (e) => {
    e.preventDefault();
    
    if (!repairDescription.trim()) {
      showToast('Please provide a description of the issue', 'error');
      return;
    }

    if (!termsAccepted) {
      showToast('Please accept the Terms and Conditions to proceed', 'error');
      return;
    }

    setSubmittingRepair(true);
    try {
      await api.post('/api/repair-requests', {
        orderId: selectedOrder,
        orderType: selectedOrderType,
        description: repairDescription,
        media: repairMedia,
        termsAccepted: true
      });

      showToast('Repair request submitted successfully!', 'success');
      handleCloseRepairModal();
      fetchRepairRequests(); // Refresh repair requests to update button states
    } catch (error) {
      console.error('Failed to submit repair request:', error);
      showToast('Failed to submit repair request. Please try again.', 'error');
    } finally {
      setSubmittingRepair(false);
    }
  };

  const removeMedia = (index) => {
    setRepairMedia(repairMedia.filter((_, i) => i !== index));
  };

  const hasRepairRequest = (orderId) => {
    return repairRequests.some(req => req.orderId === orderId || req.orderId?._id === orderId);
  };

  const handleOpenEditProfile = () => {
    setShowEditProfileModal(true);
  };

  const handleCloseEditProfile = () => {
    setShowEditProfileModal(false);
    // Reset password fields
    setProfileFormData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    }));
  };

  const handleProfileInputChange = (e) => {
    setProfileFormData({
      ...profileFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    // Validate password change if attempting
    if (profileFormData.newPassword || profileFormData.currentPassword) {
      if (!profileFormData.currentPassword) {
        showToast('Please enter your current password', 'error');
        return;
      }
      if (profileFormData.newPassword !== profileFormData.confirmNewPassword) {
        showToast('New passwords do not match', 'error');
        return;
      }
      if (profileFormData.newPassword.length < 6) {
        showToast('New password must be at least 6 characters', 'error');
        return;
      }
    }

    setUpdatingProfile(true);
    try {
      const updateData = {
        name: profileFormData.name,
        email: profileFormData.email
      };

      // Only include password fields if user is changing password
      if (profileFormData.currentPassword && profileFormData.newPassword) {
        updateData.currentPassword = profileFormData.currentPassword;
        updateData.newPassword = profileFormData.newPassword;
      }

      await api.put('/api/users/profile', updateData);
      
      showToast('Profile updated successfully!', 'success');
      fetchUserData(); // Refresh user data
      handleCloseEditProfile();
    } catch (error) {
      console.error('Failed to update profile:', error);
      showToast(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="user-dashboard container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <h1>User Dashboard</h1>

      <div className="dashboard-grid">
        <div className="user-info card">
          <h2>Profile Information</h2>
          {user && (
            <div className="profile-details">
              <div className="profile-avatar">
                <div className="avatar-circle">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Member Since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
              <div className="profile-actions">
                <button className="btn-edit-profile" onClick={handleOpenEditProfile}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Edit Profile
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="orders-main-section">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              My Orders
              {orders.length > 0 && <span className="tab-count">{orders.length}</span>}
            </button>
            <button
              className={`tab-button ${activeTab === 'custom' ? 'active' : ''}`}
              onClick={() => setActiveTab('custom')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 7h-9"></path>
                <path d="M14 17H5"></path>
                <circle cx="17" cy="17" r="3"></circle>
                <circle cx="7" cy="7" r="3"></circle>
              </svg>
              My Custom Furniture Requests
              {customOrders.length > 0 && <span className="tab-count">{customOrders.length}</span>}
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'orders' && (
              <div className="orders-section">
                {orders.length === 0 ? (
                  <div className="empty-state card">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                    <h3>No orders yet</h3>
                    <p>Start shopping to see your orders here!</p>
                    <button 
                      className="btn-primary"
                      onClick={() => navigate('/shop')}
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="orders-list">
                    {orders.map(order => (
                      <div key={order._id} className="order-card card">
                        <div className="order-header">
                          <h3>Order #{order._id.substring(0, 8)}</h3>
                          <span className={`status ${order.status}`}>{order.status}</span>
                        </div>
                        <div className="order-details">
                          <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                          <p><strong>Total:</strong> ₱{order.totalAmount.toFixed(2)}</p>
                          <p><strong>Items:</strong> {order.products.length}</p>
                        </div>
                        <div className="order-shipping">
                          <p><strong>Shipping Address:</strong></p>
                          <p>{order.shippingAddress.address}, {order.shippingAddress.city}</p>
                          <p>{order.shippingAddress.zipCode}, {order.shippingAddress.country}</p>
                        </div>
                        <div className="order-products">
                          <h4>Products:</h4>
                          {order.products.map((product, index) => (
                            <div key={index} className="order-product-item">
                              <p>Product ID: {product.productId}</p>
                              <p>Quantity: {product.quantity} × ₱{product.price.toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                        <div className="order-actions">
                          <button 
                            className="btn-repair-request"
                            onClick={() => handleOpenRepairModal(order._id, 'Transaction')}
                            disabled={hasRepairRequest(order._id)}
                            title={hasRepairRequest(order._id) ? "Repair already requested" : "Request repair for this order"}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                            </svg>
                            {hasRepairRequest(order._id) ? 'Repair Requested' : 'Request Repair'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'custom' && (
              <div className="custom-orders-section">
                {customOrders.length === 0 ? (
                  <div className="empty-state card">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 7h-9"></path>
                      <path d="M14 17H5"></path>
                      <circle cx="17" cy="17" r="3"></circle>
                      <circle cx="7" cy="7" r="3"></circle>
                    </svg>
                    <h3>No custom furniture requests yet</h3>
                    <p>Create your dream furniture with custom specifications!</p>
                    <button 
                      className="btn-create-custom"
                      onClick={() => navigate('/custom-furniture')}
                    >
                      Create Custom Furniture
                    </button>
                  </div>
                ) : (
                  <div className="orders-list">
                    {customOrders.map(order => (
                      <div key={order._id} className="custom-order-card card">
                        <div className="order-header">
                          <div className="order-title-with-badge">
                            <h3>Custom Order #{order._id.substring(0, 8)}</h3>
                            <span className="custom-badge">CUSTOM REQUEST</span>
                          </div>
                          <span className={`status ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="order-details">
                          <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                          <p><strong>Total:</strong> ₱{order.totalPrice.toLocaleString()}</p>
                        </div>
                        <div className="custom-order-specs">
                          <h4>Specifications:</h4>
                          <div className="specs-grid">
                            <div className="spec-item">
                              <span className="spec-label">Furniture Type:</span>
                              <span className="spec-value">{order.furnitureType}</span>
                            </div>
                            <div className="spec-item">
                              <span className="spec-label">Dimensions:</span>
                              <span className="spec-value">{order.dimensions.width} × {order.dimensions.height} cm</span>
                            </div>
                            <div className="spec-item">
                              <span className="spec-label">Wood Type:</span>
                              <span className="spec-value">{order.woodType}</span>
                            </div>
                            <div className="spec-item">
                              <span className="spec-label">Varnish Finish:</span>
                              <span className="spec-value">{order.varnishType}</span>
                            </div>
                          </div>
                          {order.notes && (
                            <div className="order-notes">
                              <p><strong>Notes:</strong> {order.notes}</p>
                            </div>
                          )}
                          {order.images && order.images.length > 0 && (
                            <div className="order-images">
                              <p><strong>Reference Images:</strong></p>
                              <div className="images-preview">
                                {order.images.map((image, index) => (
                                  <img 
                                    key={index} 
                                    src={`${image}`} 
                                    alt={`Reference ${index + 1}`}
                                    className="reference-image"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {order.adminNotes && (
                            <div className="admin-notes">
                              <p><strong>Admin Response:</strong></p>
                              <p className="admin-notes-text">{order.adminNotes}</p>
                            </div>
                          )}
                        </div>
                        <div className="order-actions">
                          <button 
                            className="btn-repair-request"
                            onClick={() => handleOpenRepairModal(order._id, 'CustomOrder')}
                            disabled={hasRepairRequest(order._id)}
                            title={hasRepairRequest(order._id) ? "Repair already requested" : "Request repair for this custom order"}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                            </svg>
                            {hasRepairRequest(order._id) ? 'Repair Requested' : 'Request Repair'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Repair Request Modal */}
      {showRepairModal && (
        <div className="modal-overlay" onClick={handleCloseRepairModal}>
          <div className="modal-content repair-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request Repair</h2>
              <button className="modal-close" onClick={handleCloseRepairModal}>×</button>
            </div>
            <form onSubmit={handleSubmitRepairRequest}>
              {/* Important Notice */}
              <div className="important-notice">
                <h3>Important Notice:</h3>
                <ul>
                  <li>Only FurniShop furniture is eligible for repair services</li>
                  <li>Minor damage repairs may be provided at no cost</li>
                  <li>Admin will review and approve/deny based on eligibility</li>
                  <li>You will be notified of the decision via email</li>
                </ul>
              </div>
              
              <div className="form-group">
                <label htmlFor="repairDescription">Description of Issue *</label>
                <textarea
                  id="repairDescription"
                  value={repairDescription}
                  onChange={(e) => setRepairDescription(e.target.value)}
                  placeholder="Please describe the issue you're experiencing with your order..."
                  rows="5"
                  required
                  maxLength="1000"
                />
                <small>{repairDescription.length}/1000 characters</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="repairMedia">Upload Images/Videos (Optional)</label>
                <input
                  type="file"
                  id="repairMedia"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaUpload}
                  disabled={uploadingMedia}
                />
                <small>You can upload up to 5 images or videos (max 20MB each)</small>
              </div>

              {uploadingMedia && (
                <div className="upload-progress">
                  <p>Uploading media...</p>
                </div>
              )}

              {repairMedia.length > 0 && (
                <div className="media-preview">
                  <p><strong>Uploaded Media:</strong></p>
                  <div className="media-grid">
                    {repairMedia.map((url, index) => (
                      <div key={index} className="media-item">
                        {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img src={url} alt={`Upload ${index + 1}`} />
                        ) : (
                          <video src={url} controls />
                        )}
                        <button 
                          type="button" 
                          className="remove-media"
                          onClick={() => removeMedia(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Terms and Conditions */}
              <div className="form-group terms-agreement">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                  />
                  <span>
                    I have read and agree to the{' '}
                    <button
                      type="button"
                      className="terms-link"
                      onClick={() => setShowTermsModal(true)}
                    >
                      Terms and Conditions
                    </button>
                    {' '}for repair services *
                  </span>
                </label>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={handleCloseRepairModal}
                  disabled={submittingRepair}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submittingRepair || uploadingMedia}
                >
                  {submittingRepair ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div className="modal-overlay" onClick={() => setShowTermsModal(false)}>
          <div className="modal-content terms-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Repair Service Terms and Conditions</h2>
              <button className="modal-close" onClick={() => setShowTermsModal(false)}>×</button>
            </div>
            <div className="terms-content">
              <section>
                <h3>1. Eligibility</h3>
                <ul>
                  <li>Repair services are only available for furniture purchased directly from FurniShop.</li>
                  <li>Valid proof of purchase (order number) is required for all repair requests.</li>
                  <li>Furniture must be within the warranty period or eligible for post-warranty repair services.</li>
                </ul>
              </section>

              <section>
                <h3>2. Request Review Process</h3>
                <ul>
                  <li>All repair requests will be reviewed by our admin team within 24-48 hours.</li>
                  <li>We reserve the right to approve or deny any repair request based on eligibility criteria.</li>
                  <li>Additional information or images may be requested for assessment.</li>
                </ul>
              </section>

              <section>
                <h3>3. Repair Services</h3>
                <ul>
                  <li>Minor damage repairs may be provided at no cost for eligible furniture within warranty.</li>
                  <li>Major repairs or post-warranty repairs may incur charges, which will be communicated before proceeding.</li>
                  <li>Repair timelines will be provided upon approval of the request.</li>
                  <li>FurniShop is not responsible for damages caused by misuse, neglect, or accidents.</li>
                </ul>
              </section>

              <section>
                <h3>4. Customer Responsibilities</h3>
                <ul>
                  <li>Provide accurate and complete information about the damage.</li>
                  <li>Submit clear photos showing the damaged area from multiple angles.</li>
                  <li>Make the furniture accessible for inspection or pickup if required.</li>
                  <li>Follow any care instructions provided after repair completion.</li>
                </ul>
              </section>

              <section>
                <h3>5. Exclusions</h3>
                <ul>
                  <li>Normal wear and tear is not covered under free repair services.</li>
                  <li>Damage from improper assembly, modification, or unauthorized repairs.</li>
                  <li>Damage from natural disasters, fire, water, or environmental conditions.</li>
                  <li>Cosmetic issues that do not affect functionality.</li>
                </ul>
              </section>

              <section>
                <h3>6. Privacy and Data</h3>
                <ul>
                  <li>Information provided will be used solely for processing your repair request.</li>
                  <li>Images and descriptions may be retained for quality control and record-keeping.</li>
                  <li>Your data will be handled in accordance with our Privacy Policy.</li>
                </ul>
              </section>

              <section>
                <h3>7. Limitation of Liability</h3>
                <p>
                  FurniShop shall not be liable for any indirect, incidental, or consequential damages 
                  arising from repair services. Our liability is limited to the repair or replacement 
                  of the damaged furniture component.
                </p>
              </section>

              <section>
                <h3>8. Agreement</h3>
                <p>
                  By submitting a repair request, you acknowledge that you have read, understood, and 
                  agree to be bound by these Terms and Conditions. You confirm that all information 
                  provided is accurate and complete to the best of your knowledge.
                </p>
              </section>
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-primary"
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTermsModal(false);
                }}
              >
                Accept Terms
              </button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setShowTermsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="modal-overlay" onClick={handleCloseEditProfile}>
          <div className="modal-content edit-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button className="modal-close" onClick={handleCloseEditProfile}>×</button>
            </div>
            <form onSubmit={handleUpdateProfile}>
              <div className="edit-profile-form">
                <div className="form-group">
                  <label htmlFor="profileName">Name *</label>
                  <input
                    type="text"
                    id="profileName"
                    name="name"
                    value={profileFormData.name}
                    onChange={handleProfileInputChange}
                    required
                    placeholder="Enter your name"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="profileEmail">Email *</label>
                  <input
                    type="email"
                    id="profileEmail"
                    name="email"
                    value={profileFormData.email}
                    onChange={handleProfileInputChange}
                    required
                    placeholder="Enter your email"
                  />
                </div>

                <div className="password-section">
                  <h3>Change Password (Optional)</h3>
                  <p className="password-hint">Leave blank to keep your current password</p>
                  
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={profileFormData.currentPassword}
                      onChange={handleProfileInputChange}
                      placeholder="Enter current password"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={profileFormData.newPassword}
                      onChange={handleProfileInputChange}
                      placeholder="Enter new password"
                      minLength="6"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="confirmNewPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmNewPassword"
                      name="confirmNewPassword"
                      value={profileFormData.confirmNewPassword}
                      onChange={handleProfileInputChange}
                      placeholder="Confirm new password"
                      minLength="6"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={handleCloseEditProfile}
                  disabled={updatingProfile}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={updatingProfile}
                >
                  {updatingProfile ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
