import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';
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
      alert('Failed to upload media. Please try again.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSubmitRepairRequest = async (e) => {
    e.preventDefault();
    
    if (!repairDescription.trim()) {
      alert('Please provide a description of the issue');
      return;
    }

    setSubmittingRepair(true);
    try {
      await api.post('/api/repair-requests', {
        orderId: selectedOrder,
        orderType: selectedOrderType,
        description: repairDescription,
        media: repairMedia
      });

      alert('Repair request submitted successfully!');
      handleCloseRepairModal();
      fetchRepairRequests(); // Refresh repair requests to update button states
    } catch (error) {
      console.error('Failed to submit repair request:', error);
      alert('Failed to submit repair request. Please try again.');
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

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="user-dashboard container">
      <h1>User Dashboard</h1>

      <div className="dashboard-grid">
        <div className="user-info card">
          <h2>Profile Information</h2>
          {user && (
            <div className="profile-details">
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Member Since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
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
    </div>
  );
};

export default UserDashboard;
