import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Product form state
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Sofas',
    stock: '',
    image: ''
  });
  const [editingProductId, setEditingProductId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (!token || role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (activeTab === 'users') {
        const response = await axios.get('/api/users', { headers });
        setUsers(response.data);
      } else if (activeTab === 'products') {
        const response = await axios.get('/api/products');
        setProducts(response.data);
      } else if (activeTab === 'transactions') {
        const response = await axios.get('/api/transactions', { headers });
        setTransactions(response.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data');
      setLoading(false);
    }
  };

  // Product Management
  const handleProductInputChange = (e) => {
    setProductForm({
      ...productForm,
      [e.target.name]: e.target.value
    });
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      if (editingProductId) {
        await axios.put(`/api/products/${editingProductId}`, productForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Product updated successfully!');
      } else {
        await axios.post('/api/products', productForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Product created successfully!');
      }
      
      setProductForm({ name: '', description: '', price: '', category: 'Sofas', stock: '', image: '' });
      setEditingProductId(null);
      fetchData();
    } catch (error) {
      alert('Failed to save product');
    }
  };

  const handleEditProduct = (product) => {
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      stock: product.stock,
      image: product.image || ''
    });
    setEditingProductId(product._id);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Product deleted successfully!');
      fetchData();
    } catch (error) {
      alert('Failed to delete product');
    }
  };

  // User Management
  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('User deleted successfully!');
      fetchData();
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  // Transaction Management
  const handleUpdateTransactionStatus = async (id, status) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`/api/transactions/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Transaction status updated!');
      fetchData();
    } catch (error) {
      alert('Failed to update transaction status');
    }
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="admin-dashboard container">
      <h1>Admin Dashboard</h1>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Products
        </button>
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'products' && (
          <div className="products-management">
            <div className="card">
              <h2>{editingProductId ? 'Edit Product' : 'Add New Product'}</h2>
              <form onSubmit={handleProductSubmit}>
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={productForm.name}
                    onChange={handleProductInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={productForm.description}
                    onChange={handleProductInputChange}
                    required
                    rows="4"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price</label>
                    <input
                      type="number"
                      name="price"
                      value={productForm.price}
                      onChange={handleProductInputChange}
                      required
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      name="category"
                      value={productForm.category}
                      onChange={handleProductInputChange}
                      required
                    >
                      <option value="Sofas">Sofas</option>
                      <option value="Beds">Beds</option>
                      <option value="Chairs">Chairs</option>
                      <option value="Tables">Tables</option>
                      <option value="Cabinets">Cabinets</option>
                      <option value="Wardrobes">Wardrobes</option>
                      <option value="Doors">Doors</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Stock</label>
                    <input
                      type="number"
                      name="stock"
                      value={productForm.stock}
                      onChange={handleProductInputChange}
                      required
                      min="0"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Image URL</label>
                  <input
                    type="url"
                    name="image"
                    value={productForm.image}
                    onChange={handleProductInputChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    {editingProductId ? 'Update Product' : 'Add Product'}
                  </button>
                  {editingProductId && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setEditingProductId(null);
                        setProductForm({ name: '', description: '', price: '', category: 'Sofas', stock: '', image: '' });
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="products-list">
              <h2>All Products</h2>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product._id}>
                        <td>{product.name}</td>
                        <td>{product.category}</td>
                        <td>₱{product.price.toFixed(2)}</td>
                        <td>{product.stock}</td>
                        <td className="action-buttons">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="btn btn-secondary btn-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="btn btn-danger btn-sm"
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
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-management">
            <h2>All Users</h2>
            <div className="table-container card">
              <table>
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
                  {users.map(user => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td><span className={`role-badge ${user.role}`}>{user.role}</span></td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="action-buttons">
                        <button
                          onClick={() => handleDeleteUser(user._id)}
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
        )}

        {activeTab === 'transactions' && (
          <div className="transactions-management">
            <h2>All Transactions</h2>
            <div className="transactions-list">
              {transactions.map(transaction => (
                <div key={transaction._id} className="transaction-card card">
                  <div className="transaction-header">
                    <h3>Order #{transaction._id.substring(0, 8)}</h3>
                    <select
                      value={transaction.status}
                      onChange={(e) => handleUpdateTransactionStatus(transaction._id, e.target.value)}
                      className="status-select"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="transaction-details">
                    <p><strong>User ID:</strong> {transaction.userId}</p>
                    <p><strong>Date:</strong> {new Date(transaction.createdAt).toLocaleDateString()}</p>
                    <p><strong>Total:</strong> ₱{transaction.totalAmount.toFixed(2)}</p>
                    <p><strong>Items:</strong> {transaction.products.length}</p>
                  </div>
                  <div className="transaction-address">
                    <strong>Shipping Address:</strong>
                    <p>{transaction.shippingAddress.address}, {transaction.shippingAddress.city}</p>
                    <p>{transaction.shippingAddress.zipCode}, {transaction.shippingAddress.country}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
