import React from 'react';
import './WarrantyPolicy.css';

const WarrantyPolicy = ({ isModal = false, onClose = null }) => {
  const content = (
    <div className={`warranty-policy ${isModal ? 'modal-content' : 'inline-content'}`}>
      <div className="policy-header">
        <h2>Return & Warranty Policy</h2>
        {isModal && (
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      <div className="policy-body">
        <section className="policy-section">
          <h3>🛡️ Warranty Coverage</h3>
          <p>All FurniShop products come with comprehensive warranty protection:</p>
          <ul>
            <li><strong>2-Year Structural Warranty:</strong> Covers manufacturing defects in materials and workmanship</li>
            <li><strong>1-Year Finish Warranty:</strong> Protection against peeling, cracking, or fading under normal use</li>
            <li><strong>Hardware Warranty:</strong> All hardware components (hinges, screws, handles) covered for 1 year</li>
            <li><strong>Free Repair Service:</strong> Complimentary repair within warranty period</li>
          </ul>
        </section>

        <section className="policy-section">
          <h3>🔄 Return Policy</h3>
          <p>We want you to be completely satisfied with your purchase:</p>
          <ul>
            <li><strong>30-Day Return Window:</strong> Return unused items within 30 days of delivery</li>
            <li><strong>Condition Requirements:</strong> Items must be in original packaging, unassembled, and undamaged</li>
            <li><strong>Return Process:</strong> Contact customer service to initiate return and receive instructions</li>
            <li><strong>Refund Timeline:</strong> Refunds processed within 7-14 business days after inspection</li>
            <li><strong>Return Shipping:</strong> Customer responsible for return shipping costs unless item is defective</li>
          </ul>
        </section>

        <section className="policy-section">
          <h3>📦 Eligible for Return/Warranty</h3>
          <ul>
            <li>Manufacturing defects discovered within warranty period</li>
            <li>Wrong item delivered or damaged during shipping</li>
            <li>Structural issues not caused by misuse or accidents</li>
            <li>Items that don't match product description</li>
          </ul>
        </section>

        <section className="policy-section">
          <h3>❌ Not Covered</h3>
          <ul>
            <li>Damage from misuse, abuse, or accidents</li>
            <li>Normal wear and tear from everyday use</li>
            <li>Damage from improper assembly or installation</li>
            <li>Products modified or repaired by unauthorized parties</li>
            <li>Custom or made-to-order items (unless defective)</li>
            <li>Clearance or final sale items</li>
          </ul>
        </section>

        <section className="policy-section">
          <h3>📝 How to Make a Claim</h3>
          <ol>
            <li><strong>Contact Us:</strong> Email fpbernasfurnitureshop@gmail.com or call customer service</li>
            <li><strong>Provide Details:</strong> Include order number, photos of issue, and description</li>
            <li><strong>Assessment:</strong> Our team will review and respond within 2-3 business days</li>
            <li><strong>Resolution:</strong> Approved claims will receive repair, replacement, or refund</li>
          </ol>
        </section>

        <section className="policy-section">
          <h3>🚚 Delivery Inspection</h3>
          <p>Important steps when receiving your order:</p>
          <ul>
            <li>Inspect all items immediately upon delivery</li>
            <li>Check for visible damage to packaging or products</li>
            <li>Report any issues within 48 hours of delivery</li>
            <li>Keep all original packaging for potential returns</li>
          </ul>
        </section>

        <section className="policy-section">
          <h3>💡 Care & Maintenance</h3>
          <p>To maintain warranty coverage:</p>
          <ul>
            <li>Follow assembly instructions carefully</li>
            <li>Clean furniture with recommended products only</li>
            <li>Avoid excessive moisture or direct sunlight exposure</li>
            <li>Use furniture for its intended purpose</li>
            <li>Retain your purchase receipt as proof of purchase</li>
          </ul>
        </section>

        <section className="policy-section contact-section">
          <h3>📞 Need Help?</h3>
          <p>Our customer service team is here to assist you:</p>
          <div className="contact-details">
            <p><strong>Email:</strong> fpbernasfurnitureshop@gmail.com</p>
            <p><strong>Phone:</strong> +63 951 8644 486</p>
            <p><strong>Hours:</strong> Monday-Friday, 9:00 AM - 6:00 PM (PHT)</p>
          </div>
        </section>

        <div className="policy-footer">
          <p className="disclaimer">
            This warranty policy is effective as of the date of purchase. FurniShop reserves the right to 
            modify this policy at any time. For the most current version, please visit our website.
          </p>
          <p className="last-updated">Last Updated: November 2025</p>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="warranty-modal-overlay" onClick={onClose}>
        <div className="warranty-modal" onClick={(e) => e.stopPropagation()}>
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default WarrantyPolicy;
