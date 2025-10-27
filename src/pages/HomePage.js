import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/axios';
import './HomePage.css';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await api.get('/api/products');
      const productsData = Array.isArray(response.data) ? response.data : [];
      // Get first 4 products or all products if less than 4
      setFeaturedProducts(productsData.slice(0, 4));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setFeaturedProducts([]);
      setLoading(false);
    }
  };

  const testimonials = [
    {
      name: "Maria Santos",
      location: "Manila",
      review: "The quality is outstanding! My new sofa is not only beautiful but incredibly comfortable. Best furniture purchase I've ever made.",
      rating: 5
    },
    {
      name: "John Cruz",
      location: "Quezon City",
      review: "Fast delivery and excellent customer service. The dining set exceeded my expectations. Highly recommend FurniShop!",
      rating: 5
    },
    {
      name: "Sarah Reyes",
      location: "Makati",
      review: "Beautiful, modern designs at great prices. The AR feature helped me visualize perfectly. My home office looks amazing now!",
      rating: 5
    }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <img
          src="https://images.unsplash.com/photo-1667584523543-d1d9cc828a15?w=1920&q=80"
          alt="Modern living room"
          className="hero-background"
        />
        <div className="hero-content">
          <div className="hero-badge">New Collection 2025</div>
          <h1>
            Transform Your
            <span className="hero-highlight">Living Space</span>
          </h1>
          <p>
            Discover premium, handcrafted furniture designed for modern living. Quality pieces that turn houses into homes.
          </p>
          <div className="hero-buttons">
            <Link to="/shop" className="btn btn-primary">
              Shop Now
              <span className="arrow">→</span>
            </Link>
            <Link to="/about" className="btn btn-secondary">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <h2>Featured Collection</h2>
            <p>Handpicked pieces that combine timeless design with exceptional comfort</p>
          </div>

          {loading ? (
            <div className="loading-state">Loading products...</div>
          ) : (
            <>
              <div className="products-grid">
                {featuredProducts.map((product) => (
                  <Link to={`/product/${product._id}`} key={product._id} className="product-card">
                    <div className="product-image">
                      <img 
                        src={product.image || 'https://via.placeholder.com/300'} 
                        alt={product.name}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300?text=Furniture';
                        }}
                      />
                      <div className="product-badge">Featured</div>
                    </div>
                    <div className="product-info">
                      <p className="product-category">{product.category}</p>
                      <h3 className="product-name">{product.name}</h3>
                      <div className="product-rating">
                        <span className="star">★</span>
                        <span className="rating-value">4.8</span>
                        <span className="rating-count">(100+)</span>
                      </div>
                      <div className="product-footer">
                        <p className="product-price">₱{product.price.toLocaleString()}</p>
                        <button className="btn-cart">🛒</button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="section-footer">
                <Link to="/shop" className="btn btn-outline">
                  View All Products
                  <span className="arrow">→</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Shop by Room */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <h2>Shop by Room</h2>
            <p>Find the perfect furniture for every space in your home</p>
          </div>

          <div className="categories-grid">
            <Link to="/shop?category=Living Room" className="category-card">
              <img
                src="https://images.unsplash.com/photo-1667584523543-d1d9cc828a15?w=640&q=80"
                alt="Living Room"
              />
              <div className="category-overlay"></div>
              <div className="category-content">
                <h3>Living Room</h3>
                <p>Shop Now <span className="arrow">→</span></p>
              </div>
            </Link>

            <Link to="/shop?category=Bedroom" className="category-card">
              <img
                src="https://images.unsplash.com/photo-1724582586413-6b69e1c94a17?w=640&q=80"
                alt="Bedroom"
              />
              <div className="category-overlay"></div>
              <div className="category-content">
                <h3>Bedroom</h3>
                <p>Shop Now <span className="arrow">→</span></p>
              </div>
            </Link>

            <Link to="/shop?category=Dining Room" className="category-card">
              <img
                src="https://images.unsplash.com/photo-1617806118233-18e1de247200?w=640&q=80"
                alt="Dining Room"
              />
              <div className="category-overlay"></div>
              <div className="category-content">
                <h3>Dining Room</h3>
                <p>Shop Now <span className="arrow">→</span></p>
              </div>
            </Link>

            <Link to="/shop?category=Office" className="category-card">
              <img
                src="https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=640&q=80"
                alt="Office"
              />
              <div className="category-overlay"></div>
              <div className="category-content">
                <h3>Office</h3>
                <p>Shop Now <span className="arrow">→</span></p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2>What Our Customers Say</h2>
            <p>Join thousands of happy customers who transformed their homes</p>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-stars">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="star">★</span>
                  ))}
                </div>
                <p className="testimonial-text">{testimonial.review}</p>
                <div className="testimonial-author">
                  <div className="author-avatar"></div>
                  <div>
                    <p className="author-name">{testimonial.name}</p>
                    <p className="author-location">{testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Transform Your Space?</h2>
          <p>Browse our complete collection and find the perfect pieces for your home</p>
          <Link to="/shop" className="btn btn-white">
            Start Shopping
            <span className="arrow">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
