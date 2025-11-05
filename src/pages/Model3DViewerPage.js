import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config/axios';
import Model3DViewer from '../components/Model3DViewer';
import ARViewer from '../components/ARViewer';
import './Model3DViewerPage.css';

const TEXTURES = [
  { 
    name: 'Plywood', 
    folder: 'plywood', 
    baseColor: '/textures/plywood/basecolor.jpg',
    woodType: 'Plywood',
    finish: 'Plain'
  },
  { 
    name: 'Dark Wood', 
    folder: 'dark_wood', 
    baseColor: '/textures/dark_wood/basecolor.jpg',
    woodType: 'Dark Wood',
    finish: 'Varnished'
  },
  { 
    name: 'Oak Veneer', 
    folder: 'oak_veener', 
    baseColor: '/textures/oak_veener/basecolor.jpg',
    woodType: 'Oak Veneer',
    finish: 'Plain'
  },
  { 
    name: 'Plywood Varnished', 
    folder: 'plywood_varnished', 
    baseColor: '/textures/plywood_varnished/basecolor.jpg',
    woodType: 'Plywood',
    finish: 'Varnished'
  },
];

const Model3DViewerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('3d');
  const [quantity, setQuantity] = useState(1);
  const [currentWoodType, setCurrentWoodType] = useState('Plywood');
  const [currentFinish, setCurrentFinish] = useState('Plain');
  const [selectedTexture, setSelectedTexture] = useState(TEXTURES[0]);
  const [currentModelIndex, setCurrentModelIndex] = useState(0);

  useEffect(() => {
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
    
    fetchProduct();
  }, [id]);

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
    window.dispatchEvent(new Event('cartUpdated'));
    alert(`${quantity}x ${product.name} added to cart!`);
  };

  const handleCheckout = () => {
    handleAddToCart();
    navigate('/checkout');
  };

  const handleClose = () => {
    navigate(-1);
  };

  const handleTextureChange = (texture) => {
    setSelectedTexture(texture);
    setCurrentWoodType(texture.woodType);
    setCurrentFinish(texture.finish);
  };

  const handleMobileTextureChange = (texture) => {
    handleTextureChange(texture);
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
          {viewMode === '3d' ? (
            // 3D View Mode
            product.models && product.models.length > 0 ? (
              <Model3DViewer 
                models={product.models}
                className="fullscreen-viewer"
                onTextureChange={handleTextureChange}
                selectedModelIndex={currentModelIndex}
                onModelChange={setCurrentModelIndex}
                selectedTexture={selectedTexture}
              />
            ) : (
              <div className="no-model-placeholder">
                <div className="placeholder-icon">📦</div>
                <h3>3D Model View</h3>
                <p>Interactive 3D model of {product.name}</p>
                <small>3D model coming soon</small>
              </div>
            )
          ) : (
            // AR View Mode
            product.models && product.models.length > 0 ? (
              <ARViewer 
                models={product.models}
                selectedTexture={selectedTexture}
              />
            ) : (
              <div className="no-model-placeholder">
                <div className="placeholder-icon">🎯</div>
                <h3>AR View</h3>
                <p>AR experience for {product.name}</p>
                <small>3D model required for AR</small>
              </div>
            )
          )}
          
          {/* Controls Info - Only show in 3D mode */}
          {viewMode === '3d' && (
            <div className="controls-info">
              <span className="controls-icon">🔍</span>
              Drag to rotate • Scroll to zoom
            </div>
          )}
          
          {/* AR Instructions - Only show in AR mode */}
          {/* {viewMode === 'ar' && product.models && product.models.length > 0 && (
            <div className="ar-info-overlay">
              <div className="ar-info-content">
                <p>📱 Tap "Enter AR" to start the experience</p>
                <small>Point your camera at a flat surface and tap to place furniture</small>
              </div>
            </div>
          )} */}
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
              <p className="info-value">{currentWoodType}</p>
            </div>
            <div className="info-item">
              <p className="info-label">Finish</p>
              <p className="info-value">{currentFinish}</p>
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
          
        {/* Mobile Selectors */}
        <div className="mobile-selectors">
          {/* Model Selector */}
          {product.models && product.models.length > 1 && (
            <div className="mobile-model-selector">
              <label>Model Variant:</label>
              <select
                value={currentModelIndex}
                onChange={(e) => setCurrentModelIndex(parseInt(e.target.value))}
              >
                {product.models.map((model, index) => (
                  <option key={index} value={index}>
                    {model.variantName || `Model ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Texture Selector */}
          <div className="mobile-texture-selector">
            <p className="mobile-texture-selector-label">Wood Texture:</p>
            <div className="mobile-texture-options-wrapper">
              <div className="mobile-texture-options">
                {TEXTURES.map((texture, index) => (
                  <div
                    key={index}
                    className={`mobile-texture-option ${selectedTexture.folder === texture.folder ? 'selected' : ''}`}
                    onClick={() => handleMobileTextureChange(texture)}
                  >
                    <div className="mobile-texture-image-wrapper">
                      <img
                        src={texture.baseColor}
                        alt={texture.name}
                        className="mobile-texture-image"
                      />
                    </div>
                    <span className="mobile-texture-name">{texture.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
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
            <p className="mobile-label">{currentWoodType} Wood</p>
            <p className="mobile-text">{currentFinish}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Model3DViewerPage;
