import React from 'react';
import './AboutPage.css';

const AboutPage = () => {
  return (
    <div className="about-page">
      <div className="container">
        {/* Hero Section */}
        <section className="about-hero">
          <h1>About FurniShop</h1>
          <p className="hero-subtitle">Quality Furniture, Crafted with Care</p>
        </section>

        {/* Our Story */}
        <section className="about-section">
          <h2>Our Story</h2>
          <p>
            FurniShop is a family-owned furniture business based in Barangay Sampaloc 2, Sariaya, Quezon, Philippines. 
            We specialize in crafting high-quality, handmade furniture that combines traditional craftsmanship with 
            modern design.
          </p>
          <p>
            What started as a small workshop has grown into a trusted name in furniture making. We take pride in every 
            piece we create, ensuring that each item meets our high standards of quality and durability.
          </p>
        </section>

        {/* What We Do */}
        <section className="about-section">
          <h2>What We Do</h2>
          <div className="features-grid">
            <div className="feature-box">
              <div className="feature-icon">🪑</div>
              <h3>Custom Furniture</h3>
              <p>We create made-to-order furniture tailored to your specific needs and preferences.</p>
            </div>
            <div className="feature-box">
              <div className="feature-icon">🏠</div>
              <h3>Home Furnishing</h3>
              <p>From living rooms to bedrooms, we provide complete furniture solutions for your home.</p>
            </div>
            <div className="feature-box">
              <div className="feature-icon">🛠️</div>
              <h3>Quality Craftsmanship</h3>
              <p>Every piece is handcrafted by skilled artisans using premium materials.</p>
            </div>
            <div className="feature-box">
              <div className="feature-icon">🚚</div>
              <h3>Delivery Service</h3>
              <p>We deliver our furniture safely to your doorstep across the Philippines.</p>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="about-section">
          <h2>Why Choose Us</h2>
          <ul className="benefits-list">
            <li>✓ High-quality materials and construction</li>
            <li>✓ Affordable prices without compromising quality</li>
            <li>✓ Custom designs to match your style</li>
            <li>✓ 2-year warranty on all furniture</li>
            <li>✓ Free delivery on orders over ₱25,000</li>
            <li>✓ Excellent customer service</li>
          </ul>
        </section>

        {/* Location */}
        <section className="about-section location-section">
          <h2>Visit Our Workshop</h2>
          <div className="location-box">
            <div className="location-icon">📍</div>
            <div className="location-info">
              <h3>FurniShop</h3>
              <p>Barangay Sampaloc 2, Sariaya, Quezon, Philippines</p>
              <p className="location-hours">Open Monday - Friday, 9:00 AM - 6:00 PM</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
