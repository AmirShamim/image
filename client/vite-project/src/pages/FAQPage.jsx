import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './FAQPage.css';

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: 'Is ImageStudio free to use?',
      a: 'Yes! Core features are free with no signup required. Free users get limited AI upscales per day and unlimited resizing. Pro plans offer higher limits.'
    },
    {
      q: 'Do I need to create an account?',
      a: 'No, you can use most tools without an account. Signing up gives you higher limits and cloud storage for processed images.'
    },
    {
      q: 'What image formats are supported?',
      a: 'We support JPG, JPEG, PNG, WebP, GIF, BMP, TIFF, and AVIF formats.'
    },
    {
      q: 'Is my data secure?',
      a: 'Yes. All uploads are encrypted and automatically deleted after processing. We never share or sell your images.'
    },
    {
      q: 'How does AI upscaling work?',
      a: 'We use Real-ESRGAN, a deep learning model that intelligently enlarges images while adding detail and sharpness.'
    },
    {
      q: 'What\'s the maximum file size?',
      a: 'Free users can upload images up to 10MB. Pro users get 25MB, and Business users can process up to 100MB.'
    },
    {
      q: 'Can I cancel my subscription?',
      a: 'Yes, you can cancel anytime. You\'ll keep access until the end of your billing period.'
    },
    {
      q: 'Do you offer refunds?',
      a: 'We offer a 7-day money-back guarantee on all new subscriptions.'
    }
  ];

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-page">
      <Header />
      
      <div className="page-container">
        <div className="page-header">
          <h1>FAQ</h1>
          <p>Frequently asked questions</p>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`faq-item ${openIndex === index ? 'open' : ''}`}
            >
              <button 
                className="faq-question"
                onClick={() => toggleFaq(index)}
              >
                <span>{faq.q}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              <div className="faq-answer">
                <p>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="faq-contact">
          <h3>Still have questions?</h3>
          <p>We're here to help.</p>
          <Link to="/contact" className="contact-btn">Contact Us</Link>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default FAQPage;
