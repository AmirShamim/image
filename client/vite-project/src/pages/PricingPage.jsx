import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

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
    <div className="min-h-screen bg-dark-900">
      <SEO
        title="Pricing - Free & Pro Plans | ImageStudio"
        description="Choose the perfect plan for your needs. Free tier with 5 upscales/day or Pro with unlimited access starting at $9/month."
        keywords="image upscaler pricing, pro image tools, premium upscaling, AI image pricing"
        path="/pricing"
      />
      <Header />

      <main className="pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Pricing Plans
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{t('pricing.title')}</h1>
            <p className="text-zinc-400 text-lg max-w-md mx-auto">{t('pricing.subtitle')}</p>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-zinc-500'}`}>
              {t('pricing.monthly')}
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-14 h-7 bg-dark-600 rounded-full border border-white/10 transition-colors hover:border-primary/50"
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-gradient-to-r from-primary to-cyan-400 rounded-full transition-all duration-300 ${
                  billingCycle === 'yearly' ? 'left-8' : 'left-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-white' : 'text-zinc-500'}`}>
              {t('pricing.yearly')}
            </span>
            {billingCycle === 'yearly' && (
              <span className="px-2.5 py-1 bg-gradient-to-r from-primary to-cyan-400 text-black text-xs font-bold rounded-full">
                Save 17%
              </span>
            )}
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative glass-card p-8 flex flex-col transition-all duration-300 hover:-translate-y-2 ${
                  plan.highlighted 
                    ? 'border-primary/50 shadow-glow scale-105' 
                    : 'hover:border-white/20'
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary to-cyan-400 text-black text-xs font-bold rounded-full whitespace-nowrap">
                    Most Popular
                  </span>
                )}

                <h2 className="text-xl font-bold text-white mb-2">{plan.name}</h2>

                <div className="flex items-baseline gap-1 mb-2">
                  <span className={`text-4xl font-bold ${plan.highlighted ? 'accent-gradient' : 'text-white'}`}>
                    {plan.price[billingCycle] === 0 ? 'Free' : `$${plan.price[billingCycle]}`}
                  </span>
                  {plan.price[billingCycle] > 0 && (
                    <span className="text-zinc-500 text-sm">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                  )}
                </div>

                <p className="text-sm text-zinc-400 mb-6">{plan.description}</p>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-zinc-400">
                      <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-primary to-cyan-400 text-black hover:shadow-glow hover:-translate-y-0.5'
                      : 'glass-button text-white hover:border-primary/50'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PricingPage;

