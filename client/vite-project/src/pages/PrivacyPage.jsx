import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './LegalPage.css';

const PrivacyPage = () => {
  return (
    <div className="legal-page">
      <Header />
      
      <div className="legal-header">
        <Link to="/" className="back-link">← Back to Home</Link>
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last updated: January 2025</p>
      </div>

      <div className="legal-content">
        <section>
          <h2>1. Introduction</h2>
          <p>
            Welcome to Image Studio ("we," "our," or "us"). We are committed to protecting 
            your privacy and ensuring the security of your personal information. This Privacy 
            Policy explains how we collect, use, disclose, and safeguard your information when 
            you use our image processing services.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          
          <h3>2.1 Information You Provide</h3>
          <ul>
            <li><strong>Account Information:</strong> Email address, name, and password when you create an account</li>
            <li><strong>Payment Information:</strong> Billing details processed securely through Stripe</li>
            <li><strong>Images:</strong> Images you upload for processing</li>
            <li><strong>Communications:</strong> Messages you send to our support team</li>
          </ul>

          <h3>2.2 Automatically Collected Information</h3>
          <ul>
            <li><strong>Device Information:</strong> Browser type, operating system, device type</li>
            <li><strong>Usage Data:</strong> Pages visited, features used, processing history</li>
            <li><strong>IP Address:</strong> For security and fraud prevention</li>
            <li><strong>Cookies:</strong> See our Cookie Policy below</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <ul>
            <li>Provide and improve our image processing services</li>
            <li>Process your transactions and manage your account</li>
            <li>Send important updates about our services</li>
            <li>Respond to your inquiries and provide customer support</li>
            <li>Detect and prevent fraud and abuse</li>
            <li>Analyze usage patterns to improve our platform</li>
          </ul>
        </section>

        <section>
          <h2>4. Image Processing & Storage</h2>
          <div className="highlight-box">
            <h4>🔒 Your Images Are Safe</h4>
            <ul>
              <li>Images are processed on secure servers</li>
              <li>Uploaded images are automatically deleted after 1 hour</li>
              <li>We do not access, view, or share your images</li>
              <li>Images are never used for training AI models</li>
            </ul>
          </div>
        </section>

        <section>
          <h2>5. Data Sharing</h2>
          <p>We do not sell your personal information. We may share data with:</p>
          <ul>
            <li><strong>Service Providers:</strong> Cloud hosting (Cloudinary), payment processing (Stripe)</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            <li><strong>Business Transfers:</strong> In connection with mergers or acquisitions</li>
          </ul>
        </section>

        <section>
          <h2>6. Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Delete your data ("right to be forgotten")</li>
            <li>Export your data (data portability)</li>
            <li>Opt out of marketing communications</li>
            <li>Withdraw consent at any time</li>
          </ul>
          <p>To exercise these rights, contact us at <a href="mailto:privacy@imagestudio.app">privacy@imagestudio.app</a></p>
        </section>

        <section>
          <h2>7. Cookies</h2>
          <p>We use cookies to:</p>
          <ul>
            <li>Keep you signed in</li>
            <li>Remember your preferences (theme, language)</li>
            <li>Analyze site usage (Google Analytics)</li>
          </ul>
          <p>You can control cookies through your browser settings.</p>
        </section>

        <section>
          <h2>8. Security</h2>
          <p>
            We implement industry-standard security measures including:
          </p>
          <ul>
            <li>SSL/TLS encryption for all data transfers</li>
            <li>Encrypted storage for sensitive data</li>
            <li>Regular security audits</li>
            <li>Access controls and authentication</li>
          </ul>
        </section>

        <section>
          <h2>9. Children's Privacy</h2>
          <p>
            Our services are not directed to children under 13. We do not knowingly collect 
            personal information from children. If you believe we have collected information 
            from a child, please contact us immediately.
          </p>
        </section>

        <section>
          <h2>10. International Transfers</h2>
          <p>
            Your data may be processed in countries other than your own. We ensure appropriate 
            safeguards are in place for international data transfers.
          </p>
        </section>

        <section>
          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. We will notify you of significant 
            changes via email or through our platform.
          </p>
        </section>

        <section>
          <h2>12. Contact Us</h2>
          <p>For privacy-related questions or concerns:</p>
          <ul>
            <li>Email: <a href="mailto:privacy@imagestudio.app">privacy@imagestudio.app</a></li>
            <li>Address: 123 Tech Street, San Francisco, CA 94102</li>
          </ul>
        </section>
      </div>

      <div className="legal-footer">
        <p>See also: <Link to="/terms">Terms of Service</Link></p>
      </div>
      
      <Footer />
    </div>
  );
};

export default PrivacyPage;
