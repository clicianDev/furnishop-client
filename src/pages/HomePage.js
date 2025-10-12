import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Our E-Commerce Store</h1>
          <p>Discover amazing products at great prices</p>
          <Link to="/shop" className="btn btn-primary btn-large">
            Shop Now
          </Link>
        </div>
      </section>

      <section className="features-section container">
        <h2>Why Shop With Us</h2>
        <div className="grid grid-3">
          <div className="feature-card card">
            <h3>🚚 Free Shipping</h3>
            <p>Free shipping on orders over $50</p>
          </div>
          <div className="feature-card card">
            <h3>💳 Secure Payment</h3>
            <p>100% secure payment processing</p>
          </div>
          <div className="feature-card card">
            <h3>🔄 Easy Returns</h3>
            <p>30-day return policy</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>Start Shopping Today!</h2>
          <p>Join thousands of satisfied customers</p>
          <Link to="/shop" className="btn btn-success btn-large">
            Browse Products
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
