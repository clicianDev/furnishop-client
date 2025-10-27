import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/axios';
import './ShopPage.css';

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [selectedCategory, searchTerm, products]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/products');
      const productsData = Array.isArray(response.data) ? response.data : [];
      setProducts(productsData);
      
      // Extract unique categories
      const uniqueCategories = ['All', ...new Set(productsData.map(p => p.category))];
      setCategories(uniqueCategories);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      console.error('Response:', error.response?.data);
      setProducts([]);
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  if (loading) {
    return (
      <div className="shop-page">
        <div className="container">
          <div className="loading-state">Loading wooden furniture...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-page">
      <div className="container">
        <h1>Wooden Furniture Collection</h1>
        <p>Discover premium handcrafted furniture pieces for your home</p>
      
        <div className="filters">
          <input
            type="text"
            placeholder="Search for furniture..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-4">
          {(filteredProducts.length > 0 ? filteredProducts : products).map(product => (
            <div key={product._id} className="product-card">
              <Link to={`/product/${product._id}`}>
                <img 
                  src={product.image || 'https://via.placeholder.com/300'} 
                  alt={product.name}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300?text=Wooden+Furniture';
                  }}
                />
                <h3>{product.name}</h3>
                <p className="product-price">₱{product.price.toFixed(2)}</p>
                <p className="product-description">
                  {product.description.substring(0, 100)}...
                </p>
              </Link>
              <Link to={`/product/${product._id}`} className="btn btn-primary">
                View Details
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShopPage;