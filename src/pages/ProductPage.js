import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../config/axios';
import Model3DViewer from '../components/Model3DViewer';
import './ProductPage.css';

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [viewMode, setViewMode] = useState('image'); // 'image' or '3d'
  const [selectedModelIndex, setSelectedModelIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/api/products/${id}`);
      setProduct(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Failed to load product');
      setLoading(false);
    }
  };

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.productId === id);
    
    const selectedModel = product.models && product.models.length > 0 ? product.models[selectedModelIndex] : null;
    const finalPrice = selectedModel ? selectedModel.price : product.price;
    const variantName = selectedModel ? selectedModel.variantName : '';
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        productId: id,
        name: product.name + (variantName ? ` - ${variantName}` : ''),
        price: finalPrice,
        quantity: quantity,
        image: product.image,
        modelIndex: selectedModelIndex
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`${quantity}x ${product.name} added to cart!`);
  };

  const handleModelChange = (index) => {
    setSelectedModelIndex(index);
  };

  const getCurrentVariant = () => {
    if (product && product.models && product.models.length > 0) {
      return product.models[selectedModelIndex] || product.models[0];
    }
    return null;
  };

  const currentVariant = getCurrentVariant();
  const displayPrice = currentVariant ? currentVariant.price : product?.price;
  const displayDescription = currentVariant ? currentVariant.description : product?.description;

  // Generate mock images for thumbnail display
  const productImages = product ? [
    product.image,
    product.image, // In real app, you'd have multiple images
  ] : [];

  if (loading) {
    return (
      <div className="product-page">
        <div className="container">
          <div className="loading-state">Loading product...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-page">
        <div className="container">
          <div className="error-state">{error}</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-page">
        <div className="container">
          <div className="error-state">Product not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-page">
      {/* Breadcrumb */}
      <div className="breadcrumb-section">
        <div className="container">
          <button onClick={() => navigate(-1)} className="back-button">
            ← Back
          </button>
        </div>
      </div>

      <div className="container">
        <div className="product-detail">
          {/* Left Side - Images */}
          <div className="product-images">
            {/* Main Image */}
            <div className="main-image-container">
              {viewMode === 'image' ? (
                <img 
                  src={productImages[selectedImageIndex] || 'https://via.placeholder.com/600'} 
                  alt={product.name}
                  className="main-image"
                />
              ) : (
                <Model3DViewer 
                  models={product.models || []}
                  className="model-viewer-3d"
                  onModelChange={handleModelChange}
                  selectedModelIndex={selectedModelIndex}
                />
              )}
            </div>

            {/* Thumbnail Gallery */}
            {viewMode === 'image' && productImages.length > 1 && (
              <div className="thumbnail-gallery">
                {productImages.slice(0, 2).map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`thumbnail ${selectedImageIndex === index ? 'active' : ''}`}
                  >
                    <img src={img} alt={`${product.name} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Side - Product Info */}
          <div className="product-info">
            {/* Category Badge */}
            <p className="product-category-badge">{product.category}</p>

            {/* Product Name */}
            <h1 className="product-title">{product.name}</h1>

            {/* Rating */}
            <div className="product-rating">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="star filled">★</span>
                ))}
              </div>
              <span className="rating-text">4.9 (89 reviews)</span>
            </div>

            {/* Price */}
            <div className="price-section">
              <p className="product-price">₱{displayPrice ? displayPrice.toLocaleString() : '0'}</p>
              {product.stock > 0 ? (
                <p className="stock-status in-stock">In Stock</p>
              ) : (
                <p className="stock-status out-of-stock">Out of Stock</p>
              )}
            </div>

            {/* Description */}
            <div className="description-section">
              <h2 className="section-heading">Description</h2>
              <p className="product-description">{displayDescription}</p>
            </div>

            {/* Specifications */}
            <div className="specs-section">
              <div className="spec-item">
                <p className="spec-label">Wood Type</p>
                <p className="spec-value">{product.woodType || 'Gmelina'}</p>
              </div>
              <div className="spec-item">
                <p className="spec-label">Finish</p>
                <p className="spec-value">{product.finish || 'Varnish (Semi-Gloss)'}</p>
              </div>
              <div className="spec-item full-width">
                <p className="spec-label">Dimensions (W × H × D)</p>
                <p className="spec-value">180cm × 75cm × 90cm</p>
              </div>
            </div>

            {/* 3D/AR View Buttons */}
            <div className="view-buttons-container">
              <button
                onClick={() => setViewMode(viewMode === 'image' ? '3d' : 'image')}
                className="btn-3d-view"
                disabled={!product.models || product.models.length === 0}
              >
                🎲 {viewMode === 'image' ? 'View in 3D' : 'View Image'}
              </button>
              <button
                onClick={() => navigate(`/3d-viewer/${id}`)}
                className="btn-fullscreen-3d"
                disabled={!product.models || product.models.length === 0}
              >
                🎯 Fullscreen 3D / AR View
              </button>
            </div>

            {/* Quantity & Add to Cart */}
            {product.stock > 0 && (
              <div className="purchase-actions">
                <div className="quantity-selector">
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
                <button onClick={addToCart} className="btn-add-cart">
                  🛒 Add to Cart
                </button>
                <button className="btn-wishlist">❤️</button>
              </div>
            )}

            {product.stock === 0 && (
              <div className="out-of-stock-message">
                <p>This product is currently out of stock</p>
              </div>
            )}

            {/* Features */}
            <div className="features-grid">
              <div className="feature-item">
                <span className="feature-icon">🚚</span>
                <div>
                  <p className="feature-title">Free Delivery</p>
                  <p className="feature-subtitle">Over ₱25,000</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🛡️</span>
                <div>
                  <p className="feature-title">2-Year Warranty</p>
                  <p className="feature-subtitle">Quality assured</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📦</span>
                <div>
                  <p className="feature-title">Easy Assembly</p>
                  <p className="feature-subtitle">Instructions included</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📏</span>
                <div>
                  <p className="feature-title">Custom Size</p>
                  <p className="feature-subtitle">Available on request</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* You May Also Like Section */}
        <div className="related-products">
          <h2 className="section-title">You May Also Like</h2>
          <div className="related-grid">
            <div className="related-product-card">
              <div className="related-badge">Dining Set</div>
              <img src="https://images.unsplash.com/photo-1601887639858-e99fdd5ab4ac?w=300&q=80" alt="Dining Set" />
              <h3>Mahogany Dining Set</h3>
              <div className="related-rating">
                <span className="star filled">★</span>
                <span>4.9 (31)</span>
              </div>
              <p className="related-price">₱48,999</p>
              <Link to="/product/9" className="btn-related">+</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
