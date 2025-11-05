import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';
import './UserDashboard.css';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [customOrders, setCustomOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUserData();
    fetchOrders();
    fetchCustomOrders();
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

        <div className="orders-section">
          <h2>My Orders</h2>
          {orders.length === 0 ? (
            <div className="card">
              <p>No orders yet. Start shopping!</p>
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
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="custom-orders-section">
          <h2>My Custom Furniture Requests</h2>
          {customOrders.length === 0 ? (
            <div className="card">
              <p>No custom furniture requests yet.</p>
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
                              src={`${api.defaults.baseURL}/${image}`} 
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
