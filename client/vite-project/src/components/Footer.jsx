import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Footer.css';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: t('tools.title'), path: '/tools' },
      { label: t('home.tools.upscale.title'), path: '/upscale' },
      { label: t('home.tools.resize.title'), path: '/resize' },
      { label: t('home.tools.compress.title'), path: '/compress' },
      { label: t('nav.pricing'), path: '/pricing' }
    ],
    resources: [
      { label: t('api.title'), path: '/api' },
      { label: t('nav.faq'), path: '/faq' },
      { label: t('nav.about'), path: '/about' },
      { label: t('nav.contact'), path: '/contact' }
    ],
    legal: [
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms of Service', path: '/terms' }
    ]
  };

  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <div className="logo-mark">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="28" height="28" rx="6" fill="url(#footer-logo-gradient)"/>
                  <path d="M8 20L12 14L16 18L22 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="22" cy="10" r="2" fill="white"/>
                  <defs>
                    <linearGradient id="footer-logo-gradient" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00C6A7"/>
                      <stop offset="1" stopColor="#0066FF"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="logo-text">ImageStudio</span>
            </Link>
            <p className="footer-tagline">
              {t('footer.tagline')}
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h4>{t('footer.product')}</h4>
              <ul>
                {footerLinks.product.map((link, index) => (
                  <li key={index}>
                    <Link to={link.path}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-column">
              <h4>{t('footer.resources')}</h4>
              <ul>
                {footerLinks.resources.map((link, index) => (
                  <li key={index}>
                    <Link to={link.path}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-column">
              <h4>{t('footer.legal')}</h4>
              <ul>
                {footerLinks.legal.map((link, index) => (
                  <li key={index}>
                    <Link to={link.path}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">
            {t('footer.copyright', { year: currentYear })}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
