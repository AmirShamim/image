import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import './HomePage.css';

const HomePage = () => {
  const { t } = useTranslation();

  const tools = [
    {
      id: 'upscale',
      title: t('home.tools.upscale.title'),
      description: t('home.tools.upscale.description'),
      path: '/upscale',
      available: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m-3-3h6"/>
        </svg>
      )
    },
    {
      id: 'resize',
      title: t('home.tools.resize.title'),
      description: t('home.tools.resize.description'),
      path: '/resize',
      available: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
        </svg>
      )
    },
    {
      id: 'compress',
      title: t('home.tools.compress.title'),
      description: t('home.tools.compress.description'),
      path: '/compress',
      available: false,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
      )
    },
    {
      id: 'remove-bg',
      title: t('home.tools.removeBg.title'),
      description: t('home.tools.removeBg.description'),
      path: '/remove-background',
      available: false,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L4.939 4.939M5 19l2.879-2.879m0 0a3 3 0 104.243-4.243 3 3 0 00-4.243 4.243z"/>
        </svg>
      )
    },
    {
      id: 'convert',
      title: t('home.tools.convert.title'),
      description: t('home.tools.convert.description'),
      path: '/convert',
      available: false,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
      )
    },
    {
      id: 'crop',
      title: t('home.tools.crop.title'),
      description: t('home.tools.crop.description'),
      path: '/crop',
      available: false,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
      )
    }
  ];

  const features = [
    {
      title: t('home.features.aiUpscale.title'),
      description: t('home.features.aiUpscale.description'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      )
    },
    {
      title: t('home.features.presets.title'),
      description: t('home.features.presets.description'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
      )
    },
    {
      title: t('home.features.batch.title'),
      description: t('home.features.batch.description'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      )
    },
    {
      title: t('home.features.privacy.title'),
      description: t('home.features.privacy.description'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
        </svg>
      )
    }
  ];
  return (
    <div className="home-page">
      <SEO 
        title={t('seo.home.title')}
        description={t('seo.home.description')}
        keywords="image upscaler, AI upscale, image resizer, photo enlarger, increase resolution, free image tools"
        path="/"
      />
      <Header />
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            {t('home.hero.title')}<br />
            <span className="accent-text">{t('home.hero.subtitle')}</span>
          </h1>
          <p className="hero-subtitle">
            {t('home.hero.description')}
          </p>
          <div className="hero-cta">
            <Link to="/upscale" className="cta-primary">
              {t('home.hero.cta')}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
            <Link to="/tools" className="cta-secondary">
              {t('home.hero.ctaSecondary')}
            </Link>
          </div>
        </div>
      </section>

      {/* Tools Grid Section */}
      <section className="tools-section">
        <div className="section-header">
          <h2>{t('home.tools.title')}</h2>
          <p>{t('tools.subtitle')}</p>
        </div>
        <div className="tools-grid">
          {tools.map((tool) => (
            <Link 
              to={tool.path} 
              key={tool.id} 
              className={`tool-card ${!tool.available ? 'coming-soon' : ''}`}
            >
              {!tool.available && <span className="tool-badge">{t('tools.comingSoon')}</span>}
              <div className="tool-icon">{tool.icon}</div>
              <h3 className="tool-title">{tool.title}</h3>
              <p className="tool-description">{tool.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2>{t('home.features.title')}</h2>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>{t('home.hero.cta')}</h2>
          <p>{t('home.hero.description')}</p>
          <Link to="/upscale" className="cta-button">
            {t('header.getStarted')}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
