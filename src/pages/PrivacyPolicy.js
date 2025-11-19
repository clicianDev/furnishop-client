import React from 'react';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-policy-page container">
      <div className="privacy-policy-content">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last Updated: November 7, 2025</p>

        <section className="policy-section">
          <h2>1. Introduction</h2>
          <p>
            Welcome to FurniShop. We respect your privacy and are committed to protecting your personal data. 
            This privacy policy will inform you about how we look after your personal data when you visit our 
            website and tell you about your privacy rights and how the law protects you.
          </p>
        </section>

        <section className="policy-section">
          <h2>2. Information We Collect</h2>
          <p>We may collect, use, store and transfer different kinds of personal data about you:</p>
          <ul>
            <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier</li>
            <li><strong>Contact Data:</strong> includes email address, telephone numbers, and delivery addresses</li>
            <li><strong>Transaction Data:</strong> includes details about payments to and from you and other details of products and services you have purchased from us</li>
            <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location</li>
            <li><strong>Usage Data:</strong> includes information about how you use our website, products and services</li>
          </ul>
        </section>

        <section className="policy-section">
          <h2>3. How We Use Your Information</h2>
          <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
          <ul>
            <li>To process and deliver your orders</li>
            <li>To manage your account and provide customer support</li>
            <li>To send you marketing communications (with your consent)</li>
            <li>To improve our website, products, and services</li>
            <li>To protect our business and your account from fraud and other illegal activities</li>
          </ul>
        </section>

        <section className="policy-section">
          <h2>4. Data Security</h2>
          <p>
            We have put in place appropriate security measures to prevent your personal data from being 
            accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, 
            we limit access to your personal data to those employees, agents, contractors and other third 
            parties who have a business need to know.
          </p>
        </section>

        <section className="policy-section">
          <h2>5. Data Retention</h2>
          <p>
            We will only retain your personal data for as long as necessary to fulfill the purposes we 
            collected it for, including for the purposes of satisfying any legal, accounting, or reporting 
            requirements.
          </p>
        </section>

        <section className="policy-section">
          <h2>6. Your Legal Rights</h2>
          <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:</p>
          <ul>
            <li>Request access to your personal data</li>
            <li>Request correction of your personal data</li>
            <li>Request erasure of your personal data</li>
            <li>Object to processing of your personal data</li>
            <li>Request restriction of processing your personal data</li>
            <li>Request transfer of your personal data</li>
            <li>Right to withdraw consent</li>
          </ul>
        </section>

        <section className="policy-section">
          <h2>7. Cookies</h2>
          <p>
            Our website uses cookies to distinguish you from other users of our website. This helps us to 
            provide you with a good experience when you browse our website and also allows us to improve our site.
          </p>
        </section>

        <section className="policy-section">
          <h2>8. Third-Party Links</h2>
          <p>
            Our website may include links to third-party websites, plug-ins and applications. Clicking on those 
            links or enabling those connections may allow third parties to collect or share data about you. We do 
            not control these third-party websites and are not responsible for their privacy statements.
          </p>
        </section>

        <section className="policy-section">
          <h2>9. Changes to This Privacy Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any changes by posting 
            the new privacy policy on this page and updating the "Last Updated" date at the top of this policy.
          </p>
        </section>

        <section className="policy-section">
          <h2>10. Contact Us</h2>
          <p>
            If you have any questions about this privacy policy or our privacy practices, please contact us at:
          </p>
          <div className="contact-info">
            <p><strong>Email:</strong> fpbernasfurnitureshop@gmail.com</p>
            <p><strong>Phone:</strong> +63 951 8644 486</p>
            <p><strong>Address:</strong> Barangay Sampaloc 2, Sariaya, Quezon, Philippines</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
