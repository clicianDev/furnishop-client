import React, { useState } from 'react';
import Toast from '../components/Toast';
import './ContactPage.css';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [toast, setToast] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.name || !formData.email || !formData.message) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    // Show success message
    setToast({ message: 'Thank you! We will get back to you soon.', type: 'success' });
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: ''
    });
  };

  return (
    <div className="contact-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="container">
        {/* Hero Section */}
        <section className="contact-hero">
          <h1>Get In Touch</h1>
          <p className="hero-subtitle">We'd love to hear from you</p>
        </section>

        <div className="contact-content">
          {/* Contact Form */}
          <div className="contact-form-section">
            <h2>Send Us a Message</h2>
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+63 XXX XXX XXXX"
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us how we can help you..."
                  rows="5"
                  required
                ></textarea>
              </div>

              <button type="submit" className="btn-submit">
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="contact-info-section">
            <h2>Contact Information</h2>
            
            <div className="info-card">
              <div className="info-icon">📍</div>
              <div className="info-content">
                <h3>Address</h3>
                <p>Barangay Sampaloc 2, Sariaya, Quezon, Philippines</p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">📞</div>
              <div className="info-content">
                <h3>Phone</h3>
                <p><a href="tel:+639518644486">+63 951 8644 486</a></p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">📧</div>
              <div className="info-content">
                <h3>Email</h3>
                <p><a href="mailto:fpbernasfurnitureshop@gmail.com">fpbernasfurnitureshop@gmail.com</a></p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">🕒</div>
              <div className="info-content">
                <h3>Business Hours</h3>
                <p>Monday - Friday<br />9:00 AM - 6:00 PM (PHT)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
