import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';
import './AdminTransactionsPage.css';

const AdminTransactionsPage = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [customOrders, setCustomOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' or 'custom'

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (!token || role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchTransactions();
    fetchCustomOrders();
  }, [navigate]);

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/api/transactions');
      setTransactions(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setLoading(false);
    }
  };

  const fetchCustomOrders = async () => {
    try {
      const response = await api.get('/api/custom-orders');
      setCustomOrders(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch custom orders:', error);
    }
  };

  const handleUpdateTransactionStatus = async (id, status) => {
    try {
      await api.put(`/api/transactions/${id}`, { status });
      alert('Transaction status updated!');
      fetchTransactions();
    } catch (error) {
      alert('Failed to update transaction status');
    }
  };

  const handleUpdateCustomOrderStatus = async (id, status) => {
    try {
      await api.put(`/api/custom-orders/${id}`, { status });
      alert('Custom order status updated!');
      fetchCustomOrders();
    } catch (error) {
      alert('Failed to update custom order status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
      case 'completed':
      case 'approved':
        return 'status-delivered';
      case 'processing':
      case 'reviewing':
      case 'in-production':
        return 'status-processing';
      case 'shipped':
        return 'status-shipped';
      case 'pending':
        return 'status-pending';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-transactions-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Order Management</h1>
          <p className="page-subtitle">Manage all orders and custom requests</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          Regular Orders
          {transactions.length > 0 && <span className="tab-count">{transactions.length}</span>}
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
          Custom Furniture Orders
          {customOrders.length > 0 && <span className="tab-count">{customOrders.length}</span>}
        </button>
      </div>

      {activeTab === 'transactions' && (
        <>
          <div className="stats-row">
            <div className="stat-box">
              <p className="stat-box-label">Total Orders</p>
              <p className="stat-box-value">{transactions.length}</p>
            </div>
            <div className="stat-box">
              <p className="stat-box-label">Pending</p>
              <p className="stat-box-value stat-box-amber">{transactions.filter((t) => t.status === 'pending').length}</p>
            </div>
            <div className="stat-box">
              <p className="stat-box-label">Delivered</p>
              <p className="stat-box-value stat-box-green">{transactions.filter((t) => t.status === 'delivered').length}</p>
            </div>
          </div>

          <div className="transactions-list">
            {transactions.length === 0 ? (
              <div className="empty-state">
                <p>No orders found</p>
              </div>
            ) : (
              transactions.map((transaction) => (
                <div key={transaction._id} className="transaction-card">
                  <div className="transaction-header">
                    <div>
                      <h3 className="transaction-id">Order #{transaction._id.substring(0, 8)}</h3>
                      <p className="transaction-date">{new Date(transaction.createdAt).toLocaleDateString()}</p>
                    </div>
                    <select
                      value={transaction.status}
                      onChange={(e) => handleUpdateTransactionStatus(transaction._id, e.target.value)}
                      className={`status-select ${getStatusColor(transaction.status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="transaction-body">
                    <div className="transaction-details-grid">
                      <div className="detail-item">
                        <p className="detail-label">Customer</p>
                        <p className="detail-value">{transaction.userId?.name || 'Guest'}</p>
                      </div>
                      <div className="detail-item">
                        <p className="detail-label">Total Amount</p>
                        <p className="detail-value">₱{transaction.totalAmount.toLocaleString()}</p>
                      </div>
                      <div className="detail-item">
                        <p className="detail-label">Items</p>
                        <p className="detail-value">{transaction.products.length} items</p>
                      </div>
                      <div className="detail-item">
                        <p className="detail-label">Payment Method</p>
                        <p className="detail-value">{transaction.paymentMethod?.provider || 'Cash on Delivery'}</p>
                      </div>
                    </div>
                    {transaction.paymentMethod?.provider && (
                      <div className="payment-info">
                        <p className="payment-info-label">Payment Details:</p>
                        {transaction.paymentMethod.screenshot ? (
                          <div className="payment-screenshot-section">
                            <p className="screenshot-label">Transaction Screenshot:</p>
                            <div className="screenshot-thumbnail-container">
                              <img 
                                src={transaction.paymentMethod.screenshot} 
                                alt="Transaction Screenshot"
                                className="transaction-screenshot-thumb"
                                onClick={() => window.open(transaction.paymentMethod.screenshot, '_blank')}
                              />
                            </div>
                            <small className="screenshot-hint">Click to view full size</small>
                          </div>
                        ) : (
                          <div className="payment-info-grid">
                            <div className="payment-detail">
                              <span className="payment-detail-label">Reference Number:</span>
                              <span className="payment-detail-value">{transaction.paymentMethod.referenceNumber}</span>
                            </div>
                            <div className="payment-detail">
                              <span className="payment-detail-label">Sender Number:</span>
                              <span className="payment-detail-value">{transaction.paymentMethod.senderNumber}</span>
                            </div>
                            <div className="payment-detail">
                              <span className="payment-detail-label">Sender Name:</span>
                              <span className="payment-detail-value">{transaction.paymentMethod.senderName}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {transaction.shippingAddress && (
                      <div className="shipping-address">
                        <p className="address-label">Shipping Address:</p>
                        <p className="address-text">
                          {transaction.shippingAddress.address}, {transaction.shippingAddress.city}
                          <br />
                          {transaction.shippingAddress.zipCode}, {transaction.shippingAddress.country}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'custom' && (
        <>
          <div className="stats-row">
            <div className="stat-box">
              <p className="stat-box-label">Total Custom Orders</p>
              <p className="stat-box-value">{customOrders.length}</p>
            </div>
            <div className="stat-box">
              <p className="stat-box-label">Pending Review</p>
              <p className="stat-box-value stat-box-amber">{customOrders.filter((o) => o.status === 'pending').length}</p>
            </div>
            <div className="stat-box">
              <p className="stat-box-label">In Production</p>
              <p className="stat-box-value stat-box-blue">{customOrders.filter((o) => o.status === 'in-production').length}</p>
            </div>
            <div className="stat-box">
              <p className="stat-box-label">Completed</p>
              <p className="stat-box-value stat-box-green">{customOrders.filter((o) => o.status === 'completed').length}</p>
            </div>
          </div>

          <div className="transactions-list">
            {customOrders.length === 0 ? (
              <div className="empty-state">
                <p>No custom furniture orders found</p>
              </div>
            ) : (
              customOrders.map((order) => (
                <div key={order._id} className="transaction-card custom-order-card">
                  <div className="transaction-header">
                    <div>
                      <div className="order-title-with-badge">
                        <h3 className="transaction-id">Custom Order #{order._id.substring(0, 8)}</h3>
                        <span className="custom-badge">CUSTOM REQUEST</span>
                      </div>
                      <p className="transaction-date">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateCustomOrderStatus(order._id, e.target.value)}
                      className={`status-select ${getStatusColor(order.status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewing">Reviewing</option>
                      <option value="approved">Approved</option>
                      <option value="in-production">In Production</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="transaction-body">
                    <div className="transaction-details-grid">
                      <div className="detail-item">
                        <p className="detail-label">Customer</p>
                        <p className="detail-value">{order.userId?.name || 'Guest'}</p>
                      </div>
                      <div className="detail-item">
                        <p className="detail-label">Email</p>
                        <p className="detail-value">{order.userId?.email || 'N/A'}</p>
                      </div>
                      <div className="detail-item">
                        <p className="detail-label">Total Amount</p>
                        <p className="detail-value">₱{order.totalPrice.toLocaleString()}</p>
                      </div>
                      <div className="detail-item">
                        <p className="detail-label">Furniture Type</p>
                        <p className="detail-value">{order.furnitureType}</p>
                      </div>
                    </div>

                    <div className="custom-order-specs">
                      <h4>Specifications:</h4>
                      <div className="specs-grid">
                        <div className="spec-item">
                          <span className="spec-label">Dimensions</span>
                          <span className="spec-value">{order.dimensions.width} × {order.dimensions.height} cm</span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Wood Type</span>
                          <span className="spec-value">{order.woodType}</span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Varnish Finish</span>
                          <span className="spec-value">{order.varnishType}</span>
                        </div>
                      </div>

                      {order.notes && (
                        <div className="customer-notes">
                          <p className="notes-label">Customer Notes:</p>
                          <p className="notes-text">{order.notes}</p>
                        </div>
                      )}

                      {order.images && order.images.length > 0 && (
                        <div className="order-images">
                          <p className="notes-label">Reference Images ({order.images.length}):</p>
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
                        <div className="admin-notes-section">
                          <p className="notes-label">Admin Notes:</p>
                          <p className="notes-text">{order.adminNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminTransactionsPage;
