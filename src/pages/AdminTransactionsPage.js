import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';
import './AdminTransactionsPage.css';

const AdminTransactionsPage = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (!token || role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchTransactions();
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

  const handleUpdateTransactionStatus = async (id, status) => {
    try {
      await api.put(`/api/transactions/${id}`, { status });
      alert('Transaction status updated!');
      fetchTransactions();
    } catch (error) {
      alert('Failed to update transaction status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'status-delivered';
      case 'processing':
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
          <h1 className="page-title">Transaction Management</h1>
          <p className="page-subtitle">Manage orders and transactions</p>
        </div>
      </div>

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
        {transactions.map((transaction) => (
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
                  <p className="detail-value">{transaction.paymentMethod || 'Cash on Delivery'}</p>
                </div>
              </div>
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
        ))}
      </div>
    </div>
  );
};

export default AdminTransactionsPage;
