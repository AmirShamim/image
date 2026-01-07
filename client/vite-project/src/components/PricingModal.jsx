import React, { useState, useEffect } from 'react';
import { getSubscriptionPlans } from '../services/auth';
import './PricingModal.css';

const PricingModal = ({ isOpen, onClose }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'

  useEffect(() => {
    if (isOpen) {
      loadPlans();
    }
  }, [isOpen]);

  const loadPlans = async () => {
    try {
      const response = await getSubscriptionPlans();
      setPlans(response.plans || []);
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (planName) => {
    // TODO: Integrate with Stripe
    alert(`Upgrade to ${planName} - Stripe integration coming soon!`);
  };

  if (!isOpen) return null;

  return (
    <div className="pricing-modal-overlay" onClick={onClose}>
      <div className="pricing-modal" onClick={(e) => e.stopPropagation()}>
        <button className="pricing-modal-close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="pricing-header">
          <h2>Choose Your Plan</h2>
          <p>Upgrade for unlimited AI upscaling and premium features</p>
        </div>

        <div className="billing-toggle">
          <button 
            className={billingCycle === 'monthly' ? 'active' : ''}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button 
            className={billingCycle === 'yearly' ? 'active' : ''}
            onClick={() => setBillingCycle('yearly')}
          >
            Yearly <span className="save-badge">Save 20%</span>
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading plans...</div>
        ) : (
          <div className="pricing-plans">
            {plans.filter(plan => plan.name !== 'guest').map((plan) => {
              const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
              const limits = plan.limits || {};
              const features = plan.features || [];
              
              return (
                <div key={plan.id} className={`pricing-card ${plan.name === 'pro' ? 'featured' : ''}`}>
                  {plan.name === 'pro' && <div className="featured-badge">Most Popular</div>}
                  
                  <h3>{plan.name.charAt(0).toUpperCase() + plan.name.slice(1)}</h3>
                  
                  <div className="price">
                    {price === 0 ? (
                      <span className="price-amount">Free</span>
                    ) : (
                      <>
                        <span className="price-currency">$</span>
                        <span className="price-amount">{price}</span>
                        <span className="price-period">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                      </>
                    )}
                  </div>
                  
                  <ul className="features-list">
                    <li>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                      </svg>
                      {limits.upscale_2x === -1 ? 'Unlimited' : limits.upscale_2x} 2x upscales/month
                    </li>
                    <li>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                      </svg>
                      {limits.upscale_4x === -1 ? 'Unlimited' : limits.upscale_4x} 4x upscales/month
                    </li>
                    {features.map((feature, idx) => (
                      <li key={idx}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <button 
                    className={`plan-button ${plan.name === 'pro' ? 'featured-button' : ''}`}
                    onClick={() => handleUpgrade(plan.name)}
                    disabled={plan.name === 'free'}
                  >
                    {plan.name === 'free' ? 'Current Plan' : 'Upgrade Now'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingModal;
