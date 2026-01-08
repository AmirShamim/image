import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './PricingPage.css';

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const { user } = useAuth();

  const plans = [
    {
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      description: 'For trying out ImageStudio',
      features: [
        '3 AI upscales per day',
        '2x upscaling',
        'Unlimited resizing',
        '10MB max file size',
      ],
      cta: 'Get Started',
      highlighted: false
    },
    {
      name: 'Pro',
      price: { monthly: 9, yearly: 90 },
      description: 'For power users',
      features: [
        '50 AI upscales per day',
        '2x and 4x upscaling',
        'All image tools',
        '25MB max file size',
        'Priority processing',
      ],
      cta: 'Upgrade to Pro',
      highlighted: true
    },
    {
      name: 'Business',
      price: { monthly: 29, yearly: 290 },
      description: 'For teams',
      features: [
        'Unlimited AI upscales',
        'All upscaling models',
        'API access',
        '100MB max file size',
        'Priority support',
      ],
      cta: 'Contact Sales',
      highlighted: false
    }
  ];

  return (
    <div className="pricing-page">
      <Header />
      
      <div className="page-container">
        <div className="page-header">
          <h1>Pricing</h1>
          <p>Simple, transparent pricing</p>
        </div>

        <div className="billing-toggle">
          <span className={billingCycle === 'monthly' ? 'active' : ''}>Monthly</span>
          <button 
            className="toggle-switch"
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
          >
            <span className={`toggle-thumb ${billingCycle === 'yearly' ? 'yearly' : ''}`}></span>
          </button>
          <span className={billingCycle === 'yearly' ? 'active' : ''}>Yearly</span>
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
