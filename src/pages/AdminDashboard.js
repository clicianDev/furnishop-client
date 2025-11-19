import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../config/axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    customOrders: 0,
    repairRequests: 0
  });
  const [monthlyStats, setMonthlyStats] = useState({
    currentMonth: {
      sales: 0,
      orders: 0,
      customOrders: 0,
      repairRequests: 0,
      revenue: 0
    },
    previousMonth: {
      sales: 0,
      orders: 0,
      customOrders: 0,
      repairRequests: 0
    }
  });
  const [salesData, setSalesData] = useState([]);
  const [revenueBreakdown, setRevenueBreakdown] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentCustomOrders, setRecentCustomOrders] = useState([]);
  const [recentRepairRequests, setRecentRepairRequests] = useState([]);
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
      const [productsRes, usersRes, transactionsRes, customOrdersRes, repairRequestsRes] = await Promise.all([
        api.get('/api/products'),
        api.get('/api/users'),
        api.get('/api/transactions'),
        api.get('/api/custom-orders'),
        api.get('/api/repair-requests')
      ]);

      const products = Array.isArray(productsRes.data) ? productsRes.data : [];
      const users = Array.isArray(usersRes.data) ? usersRes.data : [];
      const transactions = Array.isArray(transactionsRes.data) ? transactionsRes.data : [];
      const customOrders = Array.isArray(customOrdersRes.data) ? customOrdersRes.data : [];
      const repairRequests = Array.isArray(repairRequestsRes.data) ? repairRequestsRes.data : [];

      // Calculate stats
      const totalSales = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      const customOrdersSales = customOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
      
      setStats({
        totalSales: totalSales + customOrdersSales,
        totalOrders: transactions.length,
        totalProducts: products.length,
        totalUsers: users.length,
        customOrders: customOrders.length,
        repairRequests: repairRequests.length
      });

      // Calculate monthly statistics
      calculateMonthlyStats(transactions, customOrders, repairRequests);
      
      // Generate sales data for charts
      generateSalesData(transactions, customOrders);
      
      // Calculate revenue breakdown
      calculateRevenueBreakdown(transactions, customOrders);

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
      
      // Get recent repair requests (last 4)
      const recentRepairs = repairRequests
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4)
        .map(r => ({
          id: r._id,
          customer: r.userId?.name || 'Guest',
          orderType: r.orderType === 'Transaction' ? 'Regular Order' : 'Custom Order',
          status: r.status,
          date: new Date(r.createdAt).toLocaleDateString(),
          description: r.description
        }));
      
      setRecentRepairRequests(recentRepairs);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  const calculateMonthlyStats = (transactions, customOrders, repairRequests) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Current month data
    const currentMonthTransactions = transactions.filter(t => {
      const date = new Date(t.createdAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    const currentMonthCustomOrders = customOrders.filter(o => {
      const date = new Date(o.createdAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const currentMonthRepairs = repairRequests.filter(r => {
      const date = new Date(r.createdAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    // Previous month data
    const previousMonthTransactions = transactions.filter(t => {
      const date = new Date(t.createdAt);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    });

    const previousMonthCustomOrders = customOrders.filter(o => {
      const date = new Date(o.createdAt);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    });

    const previousMonthRepairs = repairRequests.filter(r => {
      const date = new Date(r.createdAt);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    });

    const currentMonthSales = currentMonthTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0) +
                              currentMonthCustomOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    
    const previousMonthSales = previousMonthTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0) +
                               previousMonthCustomOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

    setMonthlyStats({
      currentMonth: {
        sales: currentMonthSales,
        orders: currentMonthTransactions.length,
        customOrders: currentMonthCustomOrders.length,
        repairRequests: currentMonthRepairs.length,
        revenue: currentMonthSales
      },
      previousMonth: {
        sales: previousMonthSales,
        orders: previousMonthTransactions.length,
        customOrders: previousMonthCustomOrders.length,
        repairRequests: previousMonthRepairs.length
      }
    });
  };

  const generateSalesData = (transactions, customOrders) => {
    // Get last 6 months of data
    const monthsData = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth();
      const year = date.getFullYear();
      const monthName = date.toLocaleString('default', { month: 'short' });

      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.createdAt);
        return tDate.getMonth() === month && tDate.getFullYear() === year;
      });

      const monthCustomOrders = customOrders.filter(o => {
        const oDate = new Date(o.createdAt);
        return oDate.getMonth() === month && oDate.getFullYear() === year;
      });

      const sales = monthTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      const customSales = monthCustomOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

      monthsData.push({
        month: monthName,
        regularSales: sales,
        customSales: customSales,
        totalSales: sales + customSales,
        orders: monthTransactions.length,
        customOrders: monthCustomOrders.length
      });
    }

    setSalesData(monthsData);
  };

  const calculateRevenueBreakdown = (transactions, customOrders) => {
    const regularOrdersRevenue = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const customOrdersRevenue = customOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

    const breakdown = [
      { name: 'Regular Orders', value: regularOrdersRevenue, color: '#3b82f6' },
      { name: 'Custom Orders', value: customOrdersRevenue, color: '#f97316' }
    ];

    setRevenueBreakdown(breakdown);
  };

  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
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

      {/* Monthly Summary Report */}
      <div className="monthly-summary-section">
        <h2 className="section-title">Monthly Summary Report</h2>
        <div className="monthly-summary-grid">
          <div className="summary-card">
            <div className="summary-header">
              <div className="summary-icon summary-icon-revenue">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <h3 className="summary-label">Monthly Revenue</h3>
            </div>
            <p className="summary-value">₱{monthlyStats.currentMonth.revenue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <div className="summary-change">
              {calculatePercentageChange(monthlyStats.currentMonth.sales, monthlyStats.previousMonth.sales) >= 0 ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="trend-icon trend-up">
                    <path d="M8 12V4M8 4L4 8M8 4L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="trend-positive">
                    +{calculatePercentageChange(monthlyStats.currentMonth.sales, monthlyStats.previousMonth.sales).toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="trend-icon trend-down">
                    <path d="M8 4V12M8 12L4 8M8 12L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="trend-negative">
                    {calculatePercentageChange(monthlyStats.currentMonth.sales, monthlyStats.previousMonth.sales).toFixed(1)}%
                  </span>
                </>
              )}
              <span className="trend-label">vs last month</span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-header">
              <div className="summary-icon summary-icon-orders">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              </div>
              <h3 className="summary-label">Total Orders</h3>
            </div>
            <p className="summary-value">{monthlyStats.currentMonth.orders}</p>
            <div className="summary-change">
              {calculatePercentageChange(monthlyStats.currentMonth.orders, monthlyStats.previousMonth.orders) >= 0 ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="trend-icon trend-up">
                    <path d="M8 12V4M8 4L4 8M8 4L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="trend-positive">
                    +{calculatePercentageChange(monthlyStats.currentMonth.orders, monthlyStats.previousMonth.orders).toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="trend-icon trend-down">
                    <path d="M8 4V12M8 12L4 8M8 12L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="trend-negative">
                    {calculatePercentageChange(monthlyStats.currentMonth.orders, monthlyStats.previousMonth.orders).toFixed(1)}%
                  </span>
                </>
              )}
              <span className="trend-label">vs last month</span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-header">
              <div className="summary-icon summary-icon-custom">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                  <path d="M2 17l10 5 10-5"></path>
                  <path d="M2 12l10 5 10-5"></path>
                </svg>
              </div>
              <h3 className="summary-label">Custom Orders</h3>
            </div>
            <p className="summary-value">{monthlyStats.currentMonth.customOrders}</p>
            <div className="summary-change">
              {calculatePercentageChange(monthlyStats.currentMonth.customOrders, monthlyStats.previousMonth.customOrders) >= 0 ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="trend-icon trend-up">
                    <path d="M8 12V4M8 4L4 8M8 4L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="trend-positive">
                    +{calculatePercentageChange(monthlyStats.currentMonth.customOrders, monthlyStats.previousMonth.customOrders).toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="trend-icon trend-down">
                    <path d="M8 4V12M8 12L4 8M8 12L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="trend-negative">
                    {calculatePercentageChange(monthlyStats.currentMonth.customOrders, monthlyStats.previousMonth.customOrders).toFixed(1)}%
                  </span>
                </>
              )}
              <span className="trend-label">vs last month</span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-header">
              <div className="summary-icon summary-icon-repairs">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
              </div>
              <h3 className="summary-label">Repair Requests</h3>
            </div>
            <p className="summary-value">{monthlyStats.currentMonth.repairRequests}</p>
            <div className="summary-change">
              {calculatePercentageChange(monthlyStats.currentMonth.repairRequests, monthlyStats.previousMonth.repairRequests) >= 0 ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="trend-icon trend-up">
                    <path d="M8 12V4M8 4L4 8M8 4L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="trend-positive">
                    +{calculatePercentageChange(monthlyStats.currentMonth.repairRequests, monthlyStats.previousMonth.repairRequests).toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="trend-icon trend-down">
                    <path d="M8 4V12M8 12L4 8M8 12L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="trend-negative">
                    {calculatePercentageChange(monthlyStats.currentMonth.repairRequests, monthlyStats.previousMonth.repairRequests).toFixed(1)}%
                  </span>
                </>
              )}
              <span className="trend-label">vs last month</span>
            </div>
          </div>
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

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon stat-icon-emerald">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
              </svg>
            </div>
          </div>
          <p className="stat-label">Repair Requests</p>
          <p className="stat-value">{stats.repairRequests}</p>
        </div>
      </div>

      {/* Sales Analysis Charts */}
      <div className="charts-section">
        <div className="chart-card sales-chart">
          <h2 className="card-title">Sales Analysis (Last 6 Months)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="month" stroke="#737373" />
              <YAxis stroke="#737373" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }}
                formatter={(value) => `₱${value.toLocaleString()}`}
              />
              <Legend />
              <Line type="monotone" dataKey="regularSales" stroke="#3b82f6" strokeWidth={2} name="Regular Sales" />
              <Line type="monotone" dataKey="customSales" stroke="#f97316" strokeWidth={2} name="Custom Sales" />
              <Line type="monotone" dataKey="totalSales" stroke="#16a34a" strokeWidth={2} name="Total Sales" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card orders-chart">
          <h2 className="card-title">Order Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="month" stroke="#737373" />
              <YAxis stroke="#737373" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="orders" fill="#3b82f6" name="Regular Orders" />
              <Bar dataKey="customOrders" fill="#f97316" name="Custom Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card revenue-chart">
          <h2 className="card-title">Revenue Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={revenueBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {revenueBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }}
                formatter={(value) => `₱${value.toLocaleString()}`}
              />
            </PieChart>
          </ResponsiveContainer>
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

        {/* Recent Repair Requests */}
        <div className="dashboard-card orders-card">
          <div className="card-header">
            <h2 className="card-title">Recent Repair Requests</h2>
            <Link to="/admin/transactions" className="view-all-link">View All</Link>
          </div>
          <div className="orders-list">
            {recentRepairRequests.length > 0 ? (
              recentRepairRequests.map((request) => (
                <div key={request.id} className="order-item repair-request-item">
                  <div className="order-info">
                    <div className="order-header-with-tag">
                      <p className="order-id">#{request.id.substring(0, 8)}</p>
                      <span className="repair-request-badge">Repair Request</span>
                    </div>
                    <p className="order-customer">{request.customer} - {request.orderType}</p>
                    <p className="repair-description-preview">{request.description.substring(0, 50)}{request.description.length > 50 ? '...' : ''}</p>
                  </div>
                  <div className="order-details">
                    <span className={`order-status repair-status-${request.status}`}>
                      {request.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No repair requests yet</p>
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
