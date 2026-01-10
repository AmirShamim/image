import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import './PricingPage.css';

const PricingPage = () => {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const { user } = useAuth();

  const plans = [
    {
      name: t('pricing.plans.free.name'),
      price: { monthly: 0, yearly: 0 },
      description: t('pricing.plans.free.description'),
      features: t('pricing.plans.free.features', { returnObjects: true }),
      cta: t('pricing.getStarted'),
      highlighted: false
    },
    {
      name: t('pricing.plans.pro.name'),
      price: { monthly: 9, yearly: 90 },
      description: t('pricing.plans.pro.description'),
      features: t('pricing.plans.pro.features', { returnObjects: true }),
      cta: t('header.upgradePlan'),
      highlighted: true
    },
    {
      name: t('pricing.plans.business.name'),
      price: { monthly: 29, yearly: 290 },
      description: t('pricing.plans.business.description'),
      features: t('pricing.plans.business.features', { returnObjects: true }),
      cta: t('nav.contact'),
      highlighted: false
    }
  ];

  return (
    <div className="pricing-page">
      <SEO 
        title="Pricing - Free & Pro Plans | ImageStudio"
        description="Choose the perfect plan for your needs. Free tier with 5 upscales/day or Pro with unlimited access starting at $9/month."
        keywords="image upscaler pricing, pro image tools, premium upscaling, AI image pricing"
        path="/pricing"
      />
      <Header />
      
      <div className="page-container">
        <div className="page-header">
          <h1>{t('pricing.title')}</h1>
          <p>{t('pricing.subtitle')}</p>
        </div>

        <div className="billing-toggle">
          <span className={billingCycle === 'monthly' ? 'active' : ''}>{t('pricing.monthly')}</span>
          <button 
            className="toggle-switch"
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
          >
            <span className={`toggle-thumb ${billingCycle === 'yearly' ? 'yearly' : ''}`}></span>
          </button>
          <span className={billingCycle === 'yearly' ? 'active' : ''}>{t('pricing.yearly')}</span>
        </div>

        <div className="plans-grid">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`plan-card ${plan.highlighted ? 'highlighted' : ''}`}
            >
              <h2 className="plan-name">{plan.name}</h2>
              <div className="plan-price">
                <span className="price-amount">
                  {plan.price[billingCycle] === 0 ? 'Free' : `$${plan.price[billingCycle]}`}
                </span>
                {plan.price[billingCycle] > 0 && (
                  <span className="price-period">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                )}
              </div>
              <p className="plan-description">{plan.description}</p>
              
              <ul className="plan-features">
                {plan.features.map((feature, idx) => (
                  <li key={idx}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button className={`plan-cta ${plan.highlighted ? 'primary' : 'secondary'}`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PricingPage;
