import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './LegalPage.css';

const TermsPage = () => {
  return (
    <div className="legal-page">
      <Header />
      
      <div className="legal-header">
        <Link to="/" className="back-link">← Back to Home</Link>
        <h1>Terms of Service</h1>
        <p className="last-updated">Last updated: January 2025</p>
      </div>

      <div className="legal-content">
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Image Studio ("Service"), you agree to be bound by these 
            Terms of Service ("Terms"). If you do not agree to these Terms, please do not 
            use our Service.
          </p>
        </section>

        <section>
          <h2>2. Description of Service</h2>
          <p>
            Image Studio provides online image processing tools including but not limited to:
          </p>
          <ul>
            <li>AI-powered image upscaling</li>
            <li>Image compression and optimization</li>
            <li>Format conversion</li>
            <li>Background removal</li>
            <li>Resizing and cropping</li>
            <li>Batch processing</li>
          </ul>
        </section>

        <section>
          <h2>3. User Accounts</h2>
          <h3>3.1 Registration</h3>
          <p>
            Some features require account registration. You agree to provide accurate 
            information and keep your account credentials secure.
          </p>
          
          <h3>3.2 Account Responsibility</h3>
          <p>
            You are responsible for all activities under your account. Notify us immediately 
            of any unauthorized use.
          </p>
        </section>

        <section>
          <h2>4. Acceptable Use</h2>
          <p>You agree NOT to use our Service to:</p>
          <ul>
            <li>Upload illegal, harmful, or offensive content</li>
            <li>Infringe on intellectual property rights</li>
            <li>Distribute malware or harmful code</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Use automated tools to scrape or abuse our Service</li>
            <li>Resell or redistribute our Service without permission</li>
            <li>Process images depicting child exploitation (CSAM)</li>
          </ul>
          <div className="warning-box">
            <p>⚠️ Violations may result in immediate account termination and legal action.</p>
          </div>
        </section>

        <section>
          <h2>5. Content Ownership</h2>
          <h3>5.1 Your Content</h3>
          <p>
            You retain all rights to images you upload. By using our Service, you grant us 
            a limited license to process your images solely to provide the Service.
          </p>
          
          <h3>5.2 Our Content</h3>
          <p>
            All software, design, and content of Image Studio is owned by us and protected 
            by intellectual property laws.
          </p>
        </section>

        <section>
          <h2>6. Subscription Plans</h2>
          <h3>6.1 Free Tier</h3>
          <ul>
            <li>Limited daily processing quota</li>
            <li>Basic features</li>
            <li>Subject to usage restrictions</li>
          </ul>

          <h3>6.2 Paid Plans</h3>
          <ul>
            <li>Pro ($4.99/month): Enhanced limits and features</li>
            <li>Business ($14.99/month): Unlimited processing, API access</li>
          </ul>

          <h3>6.3 Billing</h3>
          <ul>
            <li>Subscriptions are billed monthly via Stripe</li>
            <li>Prices may change with 30 days notice</li>
            <li>You may cancel anytime from your account settings</li>
          </ul>
        </section>

        <section>
          <h2>7. Refunds</h2>
          <p>
            We offer refunds within 7 days of purchase if you're unsatisfied with our Service. 
            Contact <a href="mailto:support@imagestudio.app">support@imagestudio.app</a> for 
            refund requests.
          </p>
        </section>

        <section>
          <h2>8. API Terms</h2>
          <p>If you use our API:</p>
          <ul>
            <li>You must have a valid Business or Enterprise subscription</li>
            <li>Rate limits must be respected</li>
            <li>API keys must be kept confidential</li>
            <li>You may not exceed your plan's quota</li>
          </ul>
        </section>

        <section>
          <h2>9. Service Availability</h2>
          <p>
            We strive for 99.9% uptime but do not guarantee uninterrupted service. We may:
          </p>
          <ul>
            <li>Perform scheduled maintenance (with notice when possible)</li>
            <li>Modify or discontinue features</li>
            <li>Suspend service for violations of these Terms</li>
          </ul>
        </section>

        <section>
          <h2>10. Disclaimer of Warranties</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL 
            WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY AND FITNESS FOR A 
            PARTICULAR PURPOSE.
          </p>
        </section>

        <section>
          <h2>11. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, IMAGE STUDIO SHALL NOT BE LIABLE FOR ANY 
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF 
            PROFITS OR REVENUES.
          </p>
          <p>
            Our total liability shall not exceed the amount paid by you in the 12 months 
            preceding the claim.
          </p>
        </section>

        <section>
          <h2>12. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless Image Studio from any claims arising 
            from your use of the Service or violation of these Terms.
          </p>
        </section>

        <section>
          <h2>13. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of California, USA. Any disputes 
            shall be resolved in the courts of San Francisco County.
          </p>
        </section>

        <section>
          <h2>14. Changes to Terms</h2>
          <p>
            We may update these Terms at any time. Continued use of the Service after changes 
            constitutes acceptance of the new Terms.
          </p>
        </section>

        <section>
          <h2>15. Contact</h2>
          <p>For questions about these Terms:</p>
          <ul>
            <li>Email: <a href="mailto:legal@imagestudio.app">legal@imagestudio.app</a></li>
            <li>Address: 123 Tech Street, San Francisco, CA 94102</li>
          </ul>
        </section>
      </div>

      <div className="legal-footer">
        <p>See also: <Link to="/privacy">Privacy Policy</Link></p>
      </div>
      
      <Footer />
    </div>
  );
};

export default TermsPage;
