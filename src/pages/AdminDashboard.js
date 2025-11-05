import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../config/axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    customOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentCustomOrders, setRecentCustomOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (!token || role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      // Fetch all data concurrently
      const [productsRes, usersRes, transactionsRes, customOrdersRes] = await Promise.all([
        api.get('/api/products'),
        api.get('/api/users'),
        api.get('/api/transactions'),
        api.get('/api/custom-orders')
      ]);

      const products = Array.isArray(productsRes.data) ? productsRes.data : [];
      const users = Array.isArray(usersRes.data) ? usersRes.data : [];
      const transactions = Array.isArray(transactionsRes.data) ? transactionsRes.data : [];
      const customOrders = Array.isArray(customOrdersRes.data) ? customOrdersRes.data : [];

      // Calculate stats
      const totalSales = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      const customOrdersSales = customOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
      
      setStats({
        totalSales: totalSales + customOrdersSales,
        totalOrders: transactions.length,
        totalProducts: products.length,
        totalUsers: users.length,
        customOrders: customOrders.length
      });

      // Get recent orders (last 4)
      const recent = transactions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4)
        .map(t => ({
          id: t._id,
          customer: t.userId?.name || 'Guest',
          amount: t.totalAmount,
          status: t.status,
          date: new Date(t.createdAt).toLocaleDateString(),
          isCustom: false
        }));
      
      setRecentOrders(recent);

      // Get recent custom orders (last 4)
      const recentCustom = customOrders
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4)
        .map(o => ({
          id: o._id,
          customer: o.userId?.name || 'Guest',
          furnitureType: o.furnitureType,
          amount: o.totalPrice,
          status: o.status,
          date: new Date(o.createdAt).toLocaleDateString(),
          isCustom: true
        }));
      
      setRecentCustomOrders(recentCustom);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
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

  if (loading) return <div className="dashboard-loading">Loading...</div>;

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back! Here's what's happening today.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon stat-icon-green">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
          </div>
          <p className="stat-label">Total Sales</p>
          <p className="stat-value">₱{stats.totalSales.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon stat-icon-blue">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
            </div>
          </div>
          <p className="stat-label">Total Orders</p>
          <p className="stat-value">{stats.totalOrders}</p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon stat-icon-orange">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
            </div>
          </div>
          <p className="stat-label">Custom Orders</p>
          <p className="stat-value">{stats.customOrders}</p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon stat-icon-amber">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
          </div>
          <p className="stat-label">Products</p>
          <p className="stat-value">{stats.totalProducts}</p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon stat-icon-purple">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
          </div>
          <p className="stat-label">Customers</p>
          <p className="stat-value">{stats.totalUsers}</p>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Recent Orders */}
        <div className="dashboard-card orders-card">
          <div className="card-header">
            <h2 className="card-title">Recent Orders</h2>
            <Link to="/admin/transactions" className="view-all-link">View All</Link>
          </div>
          <div className="orders-list">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className="order-item">
                  <div className="order-info">
                    <p className="order-id">#{order.id.substring(0, 8)}</p>
                    <p className="order-customer">{order.customer}</p>
                  </div>
                  <div className="order-details">
                    <p className="order-amount">₱{order.amount.toLocaleString()}</p>
                    <span className={`order-status ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No recent orders</p>
            )}
          </div>
        </div>

        {/* Recent Custom Orders */}
        <div className="dashboard-card orders-card">
          <div className="card-header">
            <h2 className="card-title">Recent Custom Orders</h2>
            <Link to="/admin/transactions" className="view-all-link">View All</Link>
          </div>
          <div className="orders-list">
            {recentCustomOrders.length > 0 ? (
              recentCustomOrders.map((order) => (
                <div key={order.id} className="order-item">
                  <div className="order-info">
                    <div className="order-header-with-tag">
                      <p className="order-id">#{order.id.substring(0, 8)}</p>
                      <span className="custom-request-tag">Custom Request</span>
                    </div>
                    <p className="order-customer">{order.customer} - {order.furnitureType}</p>
                  </div>
                  <div className="order-details">
                    <p className="order-amount">₱{order.amount.toLocaleString()}</p>
                    <span className={`order-status ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No custom orders yet</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card actions-card">
          <h2 className="card-title">Quick Actions</h2>
          <div className="actions-list">
            <Link to="/admin/products" className="action-item">
              <div className="action-icon action-icon-amber">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </div>
              <span className="action-label">Manage Products</span>
            </Link>

            <Link to="/admin/transactions" className="action-item">
              <div className="action-icon action-icon-blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              </div>
              <span className="action-label">Manage Orders</span>
            </Link>

            <Link to="/admin/users" className="action-item">
              <div className="action-icon action-icon-purple">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <span className="action-label">View Users</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
