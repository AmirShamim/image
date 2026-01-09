import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './AboutPage.css';

const AboutPage = () => {
  const { t } = useTranslation();

  return (
    <div className="about-page">
      <Header />
      
      <div className="page-container">
        <div className="page-header">
          <h1>{t('about.title')}</h1>
          <p>{t('about.subtitle')}</p>
        </div>

        <section className="content-section">
          <h2>{t('about.mission.title')}</h2>
          <p>
            {t('about.mission.description')}
          </p>
        </section>

        <section className="content-section">
          <h2>{t('about.technology.title')}</h2>
          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m-3-3h6"/>
                </svg>
              </div>
              <div>
                <h3>{t('home.features.aiUpscale.title')}</h3>
                <p>{t('home.features.aiUpscale.description')}</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                </svg>
              </div>
              <div>
                <h3>{t('home.tools.resize.title')}</h3>
                <p>{t('home.tools.resize.description')}</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <div>
                <h3>{t('home.features.privacy.title')}</h3>
                <p>{t('home.features.privacy.description')}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="content-section">
          <h2>{t('about.technology.title')}</h2>
          <p>
            {t('about.technology.description')}
          </p>
        </section>

        <section className="cta-section">
          <h2>{t('header.getStarted')}</h2>
          <p>{t('home.hero.description')}</p>
          <div className="cta-buttons">
            <Link to="/upscale" className="cta-primary">{t('home.hero.cta')}</Link>
            <Link to="/tools" className="cta-secondary">{t('home.hero.ctaSecondary')}</Link>
          </div>
        </section>
      </div>
      
      <Footer />
    </div>
  );
};

export default AboutPage;
