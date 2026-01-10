import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import './ContactPage.css';

const ContactPage = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="contact-page">
      <SEO 
        title="Contact Us - Get Help & Support | ImageStudio"
        description="Have questions about ImageStudio? Contact our support team for help with AI upscaling, pricing, or technical issues."
        keywords="contact ImageStudio, image upscaler support, customer service, help"
        path="/contact"
      />
      <Header />
      
      <div className="page-container">
        <div className="page-header">
          <h1>{t('contact.title')}</h1>
          <p>{t('contact.subtitle')}</p>
        </div>

        {submitted ? (
          <div className="success-message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <h3>{t('contact.form.success')}</h3>
            <p>{t('contact.info.response')}</p>
            <button 
              className="btn-secondary"
              onClick={() => {
                setSubmitted(false);
                setFormData({ name: '', email: '', subject: '', message: '' });
              }}
            >
              {t('common.back')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">{t('contact.form.name')}</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder={t('contact.form.name')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">{t('contact.form.email')}</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="subject">{t('contact.form.subject')}</label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
              >
                <option value="">Select a topic</option>
                <option value="general">General Inquiry</option>
                <option value="support">Technical Support</option>
                <option value="billing">Billing Question</option>
                <option value="feature">Feature Request</option>
                <option value="bug">Report a Bug</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="message">{t('contact.form.message')}</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="5"
                placeholder={t('contact.form.message')}
              ></textarea>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? t('contact.form.sending') : t('contact.form.submit')}
            </button>
          </form>
        )}

        <div className="contact-info">
          <p>
            {t('contact.info.email')}: <a href="mailto:support@imagestudio.app">support@imagestudio.app</a>
          </p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ContactPage;
