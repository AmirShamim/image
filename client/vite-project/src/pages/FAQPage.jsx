import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './FAQPage.css';

const FAQPage = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState(null);

  const faqKeys = ['free', 'aiUpscaling', 'formats', 'privacy', 'maxSize', 'batch', 'api', 'quality'];

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-page">
      <Header />
      
      <div className="page-container">
        <div className="page-header">
          <h1>{t('faq.title')}</h1>
          <p>{t('faq.subtitle')}</p>
        </div>

        <div className="faq-list">
          {faqKeys.map((key, index) => (
            <div 
              key={key} 
              className={`faq-item ${openIndex === index ? 'open' : ''}`}
            >
              <button 
                className="faq-question"
                onClick={() => toggleFaq(index)}
              >
                <span>{t(`faq.questions.${key}.q`)}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              <div className="faq-answer">
                <p>{t(`faq.questions.${key}.a`)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="faq-contact">
          <h3>{t('nav.contact')}</h3>
          <p>{t('contact.subtitle')}</p>
          <Link to="/contact" className="contact-btn">{t('nav.contact')}</Link>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default FAQPage;
