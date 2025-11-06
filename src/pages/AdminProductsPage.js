import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';
import Toast from '../components/Toast';
import './AdminProductsPage.css';

const AdminProductsPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingProduct, setEditingProduct] = useState(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Tables',
    stock: '',
    image: '',
    models: []
  });

  const [currentModel, setCurrentModel] = useState({
    modelUrl: '',
    price: '',
    description: '',
    variantName: ''
  });

  // File upload states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [modelFile, setModelFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingModel, setUploadingModel] = useState(false);
  const [modelCounter, setModelCounter] = useState(1);
  const [imageCounter, setImageCounter] = useState(1);
  const [toast, setToast] = useState(null);

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const categories = ['all', 'Sofas', 'Beds', 'Chairs', 'Tables', 'Cabinets', 'Wardrobes', 'Doors'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (!token || role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchProducts();
  }, [navigate]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/products');
      setProducts(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setLoading(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (product) => {
    setEditingProduct(product._id);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      stock: product.stock,
      image: product.image || '',
      models: product.models || []
    });
    setImagePreview(product.image || '');
    setModelCounter((product.models || []).length + 1);
  };

  const handleAddProduct = () => {
    setAddingProduct(true);
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: 'Tables',
      stock: '',
      image: '',
      models: []
    });
    setCurrentModel({
      modelUrl: '',
      price: '',
      description: '',
      variantName: ''
    });
    setImageFile(null);
    setImagePreview('');
    setModelFile(null);
    setModelCounter(1);
    setImageCounter(1);
  };

  const handleDelete = (product) => {
    setDeleteConfirm(product);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/api/products/${deleteConfirm._id}`);
      showToast('Product deleted successfully!', 'success');
      setDeleteConfirm(null);
      fetchProducts();
    } catch (error) {
      showToast('Failed to delete product', 'error');
    }
  };

  const handleProductInputChange = (e) => {
    setProductForm({
      ...productForm,
      [e.target.name]: e.target.value
    });
  };

  const handleModelInputChange = (e) => {
    setCurrentModel({
      ...currentModel,
      [e.target.name]: e.target.value
    });
  };

  // Handle image file selection
  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        showToast('Only JPG, JPEG, and PNG files are allowed!', 'error');
        e.target.value = '';
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        showToast('File size must be less than 10MB', 'error');
        e.target.value = '';
        return;
      }

      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle model file selection
  const handleModelFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const ext = file.name.split('.').pop().toLowerCase();
      if (ext !== 'glb') {
        showToast('Only GLB files are allowed for 3D models!', 'error');
        e.target.value = '';
        return;
      }

      // Validate file size (50MB)
      if (file.size > 50 * 1024 * 1024) {
        showToast('File size must be less than 50MB', 'error');
        e.target.value = '';
        return;
      }

      setModelFile(file);
    }
  };

  // Upload image to S3
  const uploadImageToS3 = async () => {
    if (!imageFile || !productForm.name) {
      showToast('Please enter product name and select an image file', 'error');
      return null;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('name', productForm.name);
      formData.append('imageIndex', imageCounter.toString());

      const response = await api.post('/api/products/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setImageCounter(imageCounter + 1);
      return response.data.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast('Failed to upload image: ' + (error.response?.data?.message || error.message), 'error');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Upload model to S3
  const uploadModelToS3 = async () => {
    if (!modelFile || !productForm.name) {
      showToast('Please enter product name and select a model file', 'error');
      return null;
    }

    setUploadingModel(true);
    try {
      const formData = new FormData();
      formData.append('model', modelFile);
      formData.append('productName', productForm.name);
      formData.append('modelIndex', modelCounter.toString());

      const response = await api.post('/api/products/upload-model', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setModelCounter(modelCounter + 1);
      return response.data.modelUrl;
    } catch (error) {
      console.error('Error uploading model:', error);
      showToast('Failed to upload model: ' + (error.response?.data?.message || error.message), 'error');
      return null;
    } finally {
      setUploadingModel(false);
    }
  };

  const handleAddModel = async () => {
    if (!currentModel.price || !currentModel.description || !currentModel.variantName) {
      showToast('Please fill all model fields', 'error');
      return;
    }

    if (!modelFile) {
      showToast('Please select a GLB model file', 'error');
      return;
    }

    // Upload model file first
    const modelUrl = await uploadModelToS3();
    if (!modelUrl) {
      return;
    }
    
    setProductForm({
      ...productForm,
      models: [...productForm.models, { 
        ...currentModel, 
        modelUrl,
        price: parseFloat(currentModel.price) 
      }]
    });
    
    setCurrentModel({
      modelUrl: '',
      price: '',
      description: '',
      variantName: ''
    });
    setModelFile(null);
    // Reset file input
    const fileInput = document.querySelector('input[name="modelFile"]');
    if (fileInput) fileInput.value = '';
  };

  const handleRemoveModel = (index) => {
    const updatedModels = productForm.models.filter((_, i) => i !== index);
    setProductForm({
      ...productForm,
      models: updatedModels
    });
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    
    if (!productForm.name || !productForm.price || !productForm.category) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      let imageUrl = productForm.image;

      // Upload image if a new file is selected
      if (imageFile) {
        imageUrl = await uploadImageToS3();
        if (!imageUrl) {
          return;
        }
      }

      const productData = {
        ...productForm,
        image: imageUrl
      };

      if (editingProduct) {
        await api.put(`/api/products/${editingProduct}`, productData);
        showToast('Product updated successfully!', 'success');
      } else {
        await api.post('/api/products', productData);
        showToast('Product added successfully!', 'success');
      }
      
      setAddingProduct(false);
      setEditingProduct(null);
      setProductForm({ name: '', description: '', price: '', category: 'Tables', stock: '', image: '', models: [] });
      setCurrentModel({ modelUrl: '', price: '', description: '', variantName: '' });
      setImageFile(null);
      setImagePreview('');
      setModelFile(null);
      setModelCounter(1);
      setImageCounter(1);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      showToast('Failed to save product: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setAddingProduct(false);
    setProductForm({ name: '', description: '', price: '', category: 'Tables', stock: '', image: '', models: [] });
    setCurrentModel({ modelUrl: '', price: '', description: '', variantName: '' });
    setImageFile(null);
    setImagePreview('');
    setModelFile(null);
    setModelCounter(1);
    setImageCounter(1);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-products-page">
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
          <h1 className="page-title">Product Management</h1>
          <p className="page-subtitle">Manage your furniture inventory</p>
        </div>
        <button onClick={handleAddProduct} className="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="filters-card">
        <div className="filters-grid">
          <div className="filter-col-2">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-col-1">
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-box">
          <p className="stat-box-label">Total Products</p>
          <p className="stat-box-value">{products.length}</p>
        </div>
        <div className="stat-box">
          <p className="stat-box-label">In Stock</p>
          <p className="stat-box-value stat-box-green">{products.filter((p) => p.stock > 0).length}</p>
        </div>
        <div className="stat-box">
          <p className="stat-box-label">Out of Stock</p>
          <p className="stat-box-value stat-box-red">{products.filter((p) => p.stock === 0).length}</p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="products-grid">
        {filteredProducts.map((product) => (
          <div key={product._id} className="product-card">
            <div className="product-image-container">
              {product.image ? (
                <img src={product.image} alt={product.name} className="product-image" />
              ) : (
                <div className="product-image-placeholder">No Image</div>
              )}
              {product.stock === 0 && (
                <div className="out-of-stock-badge">Out of Stock</div>
              )}
              {product.models && product.models.length > 0 && (
                <div className="model-3d-badge">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  </svg>
                  3D
                </div>
              )}
            </div>
            <div className="product-info">
              <div className="product-header">
                <h3 className="product-name">{product.name}</h3>
                <div className="product-actions-dropdown">
                  <button className="dropdown-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="1"></circle>
                      <circle cx="12" cy="5" r="1"></circle>
                      <circle cx="12" cy="19" r="1"></circle>
                    </svg>
                  </button>
                  <div className="dropdown-content">
                    <button onClick={() => handleEdit(product)} className="dropdown-item">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Edit Product
                    </button>
                    <button onClick={() => handleDelete(product)} className="dropdown-item dropdown-item-danger">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                      Delete Product
                    </button>
                  </div>
                </div>
              </div>
              <p className="product-category">{product.category}</p>
              <div className="product-footer">
                <span className="product-price">₱{product.price.toLocaleString()}</span>
                <span className={`stock-badge ${product.stock > 0 ? 'stock-badge-success' : 'stock-badge-danger'}`}>
                  {product.stock > 0 ? `Stock: ${product.stock}` : 'Out of Stock'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Product Modal */}
      {(addingProduct || editingProduct) && (
        <div className="modal-backdrop" onClick={cancelEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={cancelEdit} className="modal-close">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <form onSubmit={saveProduct} className="modal-form">
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={productForm.name}
                  onChange={handleProductInputChange}
                  placeholder="e.g., Mahogany Dining Table"
                  required
                />
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Price *</label>
                  <input
                    type="number"
                    name="price"
                    value={productForm.price}
                    onChange={handleProductInputChange}
                    placeholder="0"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={productForm.category}
                    onChange={handleProductInputChange}
                    required
                  >
                    {categories.slice(1).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Stock</label>
                <input
                  type="number"
                  name="stock"
                  value={productForm.stock}
                  onChange={handleProductInputChange}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={productForm.description}
                  onChange={handleProductInputChange}
                  rows="4"
                  placeholder="Describe the product..."
                />
              </div>
              <div className="form-group">
                <label>Product Image * (JPG, JPEG, PNG only)</label>
                <input
                  type="file"
                  name="imageFile"
                  onChange={handleImageFileChange}
                  accept=".jpg,.jpeg,.png"
                  className="file-input"
                />
                {imagePreview && (
                  <div className="image-preview-container">
                    <img src={imagePreview} alt="Preview" className="image-preview" />
                  </div>
                )}
                {uploadingImage && <p className="upload-status">Uploading image...</p>}
              </div>

              {/* 3D Models Section */}
              <div className="models-section">
                <h3>3D Model Variants</h3>
                <div className="model-input-group">
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Variant Name</label>
                      <input
                        type="text"
                        name="variantName"
                        value={currentModel.variantName}
                        onChange={handleModelInputChange}
                        placeholder="e.g., Cabinet Style 1"
                      />
                    </div>
                    <div className="form-group">
                      <label>3D Model File (.glb only)</label>
                      <input
                        type="file"
                        name="modelFile"
                        onChange={handleModelFileChange}
                        accept=".glb"
                        className="file-input"
                      />
                      {modelFile && <p className="file-selected">Selected: {modelFile.name}</p>}
                    </div>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Variant Price</label>
                      <input
                        type="number"
                        name="price"
                        value={currentModel.price}
                        onChange={handleModelInputChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Variant Description</label>
                      <textarea
                        name="description"
                        value={currentModel.description}
                        onChange={handleModelInputChange}
                        placeholder="Description for this variant"
                        rows="2"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddModel}
                    className="btn btn-secondary"
                    disabled={uploadingModel}
                  >
                    {uploadingModel ? 'Uploading...' : 'Add Model Variant'}
                  </button>
                </div>

                {productForm.models.length > 0 && (
                  <div className="models-list">
                    <h4>Added Models ({productForm.models.length})</h4>
                    {productForm.models.map((model, index) => (
                      <div key={index} className="model-item">
                        <div className="model-item-content">
                          <div>
                            <strong>{model.variantName}</strong>
                            <p>Price: ₱{model.price}</p>
                            <p className="model-desc">{model.description}</p>
                            <p className="model-url">{model.modelUrl}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveModel(index)}
                            className="btn btn-danger btn-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" onClick={cancelEdit} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Update Product' : 'Add Product'}
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
              <h2 className="modal-title">Delete Product</h2>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.</p>
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

export default AdminProductsPage;
