import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
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

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`/api/products/${id}`);
      setProduct(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load product');
      setLoading(false);
    }
  };

  const addToCart = () => {
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
        image: product.image
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Product added to cart!');
    navigate('/checkout');
  };

  if (loading) return <div className="container">Loading...</div>;
  if (error) return <div className="container">{error}</div>;
  if (!product) return <div className="container">Product not found</div>;

  return (
    <div className="product-page container">
      <div className="product-detail">
        <div className="product-image-container">
          {/* View Mode Toggle */}
          <div className="view-mode-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'image' ? 'active' : ''}`}
              onClick={() => setViewMode('image')}
            >
              📷 Image
            </button>
            <button 
              className={`toggle-btn ${viewMode === '3d' ? 'active' : ''}`}
              onClick={() => setViewMode('3d')}
            >
              🎲 3D View
            </button>
          </div>
          
          {/* Image or 3D View */}
          {viewMode === 'image' ? (
            <img src={product.image || 'https://via.placeholder.com/500'} alt={product.name} />
          ) : (
            <Model3DViewer 
              modelPath="/models/table_furniture.glb" 
              className="model-viewer-container"
            />
          )}
        </div>
        <div className="product-info">
          <h1>{product.name}</h1>
          <p className="product-price">${product.price.toFixed(2)}</p>
          <p className="product-category">Category: {product.category}</p>
          <p className="product-stock">
            Stock: {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
          </p>
          <p className="product-description">{product.description}</p>
          
          {product.stock > 0 && (
            <div className="purchase-section">
              <div className="quantity-selector">
                <label>Quantity:</label>
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              <button onClick={addToCart} className="btn btn-success btn-large">
                Add to Cart
              </button>
            </div>
          )}
          
          {product.stock === 0 && (
            <div className="out-of-stock">
              <p>This product is currently out of stock</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
