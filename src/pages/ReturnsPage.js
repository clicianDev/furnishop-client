import React from 'react';
import './ReturnsPage.css';

const ReturnsPage = () => {
  return (
    <div className="returns-page">
      <div className="container">
        <div className="returns-header">
          <h1>Returns & Exchanges Policy</h1>
          <p className="subtitle">We want you to love your furniture. If you're not completely satisfied, we're here to help.</p>
        </div>

        <div className="returns-content">
          {/* 30-Day Return Policy */}
          <section className="returns-section">
            <div className="section-icon">🔄</div>
            <h2>30-Day Return Window</h2>
            <p>
              We offer a 30-day return policy on most items. If you're not satisfied with your purchase, 
              you can return unused items within 30 days of delivery for a full refund or exchange.
            </p>
            <div className="highlight-box">
              <strong>Important:</strong> Items must be in original condition, unassembled, and in original packaging.
            </div>
          </section>

          {/* Return Requirements */}
          <section className="returns-section">
            <div className="section-icon">📋</div>
            <h2>Return Requirements</h2>
            <ul className="requirements-list">
              <li>
                <strong>Original Condition:</strong> Products must be unused, unassembled, and undamaged
              </li>
              <li>
                <strong>Original Packaging:</strong> All original packaging materials must be intact
              </li>
              <li>
                <strong>Proof of Purchase:</strong> Original receipt or order confirmation required
              </li>
              <li>
                <strong>All Components:</strong> All parts, hardware, and accessories must be included
              </li>
              <li>
                <strong>No Modifications:</strong> Products must not have been altered or customized
              </li>
            </ul>
          </section>

          {/* How to Return */}
          <section className="returns-section">
            <div className="section-icon">📦</div>
            <h2>How to Return an Item</h2>
            <div className="steps-container">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Contact Us</h3>
                  <p>Email us at <a href="mailto:fpbernasfurnitureshop@gmail.com">fpbernasfurnitureshop@gmail.com</a> or call <a href="tel:+639518644486">+63 951 8644 486</a></p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Provide Details</h3>
                  <p>Include your order number, reason for return, and photos of the item if damaged</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Get Authorization</h3>
                  <p>We'll review your request and provide return authorization within 2-3 business days</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>Ship the Item</h3>
                  <p>Pack securely and ship using the provided return instructions</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">5</div>
                <div className="step-content">
                  <h3>Receive Refund</h3>
                  <p>Refund processed within 7-14 business days after we receive and inspect the item</p>
                </div>
              </div>
            </div>
          </section>

          {/* Exchange Policy */}
          <section className="returns-section">
            <div className="section-icon">🔁</div>
            <h2>Exchange Policy</h2>
            <p>
              If you'd like to exchange an item for a different size, color, or model, we're happy to help! 
              Exchanges follow the same process as returns.
            </p>
            <div className="info-box">
              <h4>Exchange Process:</h4>
              <ul>
                <li>Contact us to initiate an exchange</li>
                <li>Return the original item following the return process</li>
                <li>We'll ship the replacement item once we receive the original</li>
                <li>Price differences will be charged or refunded accordingly</li>
              </ul>
            </div>
          </section>

          {/* Shipping Costs */}
          <section className="returns-section">
            <div className="section-icon">🚚</div>
            <h2>Return Shipping Costs</h2>
            <div className="shipping-info">
              <div className="shipping-card">
                <h4>Customer Responsibility</h4>
                <p>If returning due to change of mind or order error, customer covers return shipping costs.</p>
              </div>
              <div className="shipping-card highlight">
                <h4>Our Responsibility</h4>
                <p>If item is defective, damaged in transit, or we shipped wrong item, we cover all return shipping costs.</p>
              </div>
            </div>
          </section>

          {/* Non-Returnable Items */}
          <section className="returns-section">
            <div className="section-icon">❌</div>
            <h2>Non-Returnable Items</h2>
            <p>The following items cannot be returned or exchanged:</p>
            <ul className="non-returnable-list">
              <li>Custom or made-to-order furniture</li>
              <li>Assembled products</li>
              <li>Items marked as "Final Sale" or "Clearance"</li>
              <li>Products that have been used or damaged</li>
              <li>Items without original packaging</li>
              <li>Products returned after 30 days from delivery</li>
            </ul>
          </section>

          {/* Refund Information */}
          <section className="returns-section">
            <div className="section-icon">💰</div>
            <h2>Refund Information</h2>
            <div className="refund-details">
              <p><strong>Processing Time:</strong> 7-14 business days after receiving the returned item</p>
              <p><strong>Refund Method:</strong> Original payment method used for purchase</p>
              <p><strong>Inspection:</strong> All returns are inspected upon receipt. Items not meeting return requirements may be refused or subject to restocking fees.</p>
              <p><strong>Notification:</strong> You'll receive email confirmation once your refund is processed</p>
            </div>
          </section>

          {/* Damaged or Defective Items */}
          <section className="returns-section">
            <div className="section-icon">🛡️</div>
            <h2>Damaged or Defective Items</h2>
            <p>
              If you receive a damaged or defective item, please contact us immediately:
            </p>
            <div className="urgent-box">
              <h4>Report Within 48 Hours</h4>
              <p>Inspect your items upon delivery and report any damage or defects within 48 hours</p>
              <ul>
                <li>Take photos of the damage and packaging</li>
                <li>Keep all original packaging materials</li>
                <li>Contact us with your order number and photos</li>
                <li>We'll arrange for pickup and replacement or full refund</li>
              </ul>
            </div>
          </section>

          {/* Contact Section */}
          <section className="returns-section contact-section">
            <div className="section-icon">📞</div>
            <h2>Questions About Returns?</h2>
            <p>Our customer service team is here to help with your return or exchange.</p>
            <div className="contact-cards">
              <div className="contact-card">
                <h4>Email Us</h4>
                <a href="mailto:fpbernasfurnitureshop@gmail.com">fpbernasfurnitureshop@gmail.com</a>
              </div>
              <div className="contact-card">
                <h4>Call Us</h4>
                <a href="tel:+639518644486">+63 951 8644 486</a>
              </div>
              <div className="contact-card">
                <h4>Business Hours</h4>
                <p>Monday-Friday<br />9:00 AM - 6:00 PM (PHT)</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ReturnsPage;
