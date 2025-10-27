import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config/axios';
import Model3DViewer from '../components/Model3DViewer';
import './Model3DViewerPage.css';

const Model3DViewerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('3d');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/api/products/${id}`);
      setProduct(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching product:', error);
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.productId === id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        productId: id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        image: product.image,
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`${quantity}x ${product.name} added to cart!`);
  };

  const handleCheckout = () => {
    handleAddToCart();
    navigate('/checkout');
  };

  const handleClose = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="model-viewer-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading 3D Model...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="model-viewer-page">
        <div className="error-container">
          <p>Product not found</p>
          <button onClick={handleClose} className="btn-back">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="model-viewer-page">
      {/* Header */}
      <div className="viewer-header">
        <div className="header-content">
          <div className="header-left">
            <button onClick={handleClose} className="btn-back-header">
              ← Back
            </button>
            <div className="header-divider"></div>
            <div className="product-header-info">
              <h2>{product.name}</h2>
              <p>{product.category}</p>
            </div>
          </div>
          <button onClick={handleClose} className="btn-close">✕</button>
        </div>
      </div>

      {/* 3D Viewer Content */}
      <div className="viewer-content">
        {/* 3D Model Display */}
        <div className="model-display">
          {product.models && product.models.length > 0 ? (
            <Model3DViewer 
              models={product.models}
              className="fullscreen-viewer"
            />
          ) : (
            <div className="no-model-placeholder">
              <div className="placeholder-icon">📦</div>
              <h3>3D Model View</h3>
              <p>Interactive 3D model of {product.name}</p>
              <small>3D model coming soon</small>
            </div>
          )}
          
          {/* Controls Info */}
          <div className="controls-info">
            <span className="controls-icon">🔍</span>
            Drag to rotate • Scroll to zoom
          </div>
        </div>

        {/* Side Info Panel (Desktop) */}
        <div className="side-info-panel">
          <h3>Product Details</h3>
          <div className="info-section">
            <div className="info-item">
              <p className="info-label">Price</p>
              <p className="info-value price">₱{product.price.toLocaleString()}</p>
            </div>
            <div className="info-item">
              <p className="info-label">Dimensions</p>
              <p className="info-value">180 × 75 × 90 cm</p>
            </div>
            <div className="info-item">
              <p className="info-label">Wood Type</p>
              <p className="info-value">{product.woodType || 'Gmelina'}</p>
            </div>
            <div className="info-item">
              <p className="info-label">Finish</p>
              <p className="info-value">{product.finish || 'Varnish (Semi-Gloss)'}</p>
            </div>
            <div className="info-item">
              <p className="info-label">Stock</p>
              <p className="info-value">{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="viewer-footer">
        <div className="footer-content">
          {/* View Mode Toggle */}
          <div className="view-mode-toggle">
            <button 
              className={`mode-btn ${viewMode === '3d' ? 'active' : ''}`}
              onClick={() => setViewMode('3d')}
            >
              📦 3D View
            </button>
            <button 
              className={`mode-btn ${viewMode === 'ar' ? 'active' : ''}`}
              onClick={() => setViewMode('ar')}
            >
              🎯 AR View
            </button>
          </div>

          {/* Quantity Selector */}
          <div className="quantity-section">
            <span className="qty-label">Quantity:</span>
            <div className="qty-selector">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="qty-btn"
              >
                -
              </button>
              <span className="qty-value">{quantity}</span>
              <button 
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="qty-btn"
              >
                +
              </button>
            </div>
          </div>

          <div className="spacer"></div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="btn-favorite">
              ❤️ <span className="btn-text">Favorites</span>
            </button>
            <button onClick={handleAddToCart} className="btn-add-cart">
              🛒 Add to Cart
            </button>
            <button onClick={handleCheckout} className="btn-checkout">
              💳 Checkout
            </button>
          </div>
        </div>

        {/* Mobile Product Info */}
        <div className="mobile-info">
          <div className="mobile-info-left">
            <p className="mobile-label">Price</p>
            <p className="mobile-price">₱{product.price.toLocaleString()}</p>
          </div>
          <div className="mobile-info-right">
            <p className="mobile-label">{product.woodType || 'Gmelina'} Wood</p>
            <p className="mobile-text">{product.finish || 'Varnish'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Model3DViewerPage;
