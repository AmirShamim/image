import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getGuestUsage } from '../services/auth';
import { getOrCreateFingerprint } from '../utils/fingerprint';
import PricingModal from './PricingModal';

const UsageMeter = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [usage, setUsage] = useState({ upscale_2x: 0, upscale_4x: 0 });
  const [limits, setLimits] = useState({ upscale_2x: 5, upscale_4x: 3 });
  const [showPricing, setShowPricing] = useState(false);

  useEffect(() => {
    loadUsage();
  }, [user]);

  const loadUsage = async () => {
    try {
      if (user) {
        if (user.usage) {
          setUsage(user.usage);
        }
        const tierLimits = {
          guest: { upscale_2x: 5, upscale_4x: 3 },
          free: { upscale_2x: 10, upscale_4x: 3 },
          pro: { upscale_2x: -1, upscale_4x: 100 },
          business: { upscale_2x: -1, upscale_4x: -1 }
        };
        setLimits(tierLimits[user.subscription_tier] || tierLimits.free);
      } else {
        const fingerprint = getOrCreateFingerprint();
        const guestData = await getGuestUsage(fingerprint);
        setUsage(guestData.usage);
        setLimits(guestData.limits);
      }
    } catch (err) {
      console.error('Failed to load usage:', err);
    }
  };

  const getPercentage = (used, limit) => {
    if (limit === -1) return 0; // unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const formatLimit = (limit) => {
    return limit === -1 ? '∞' : limit;
  };

  return (
    <>
      <div style={{
        background: 'var(--card-background, white)',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid var(--border-color, #e5e7eb)',
        minWidth: '200px',
        maxWidth: '100%'
      }}>
        <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary, #666)' }}>
          {t('usage.title')}
        </div>
        
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
            <span>2x: {usage.upscale_2x}/{formatLimit(limits.upscale_2x)}</span>
            <span>{limits.upscale_2x === -1 ? t('upscale.unlimited') : `${Math.max(0, limits.upscale_2x - usage.upscale_2x)} ${t('usage.remaining')}`}</span>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            background: 'var(--border-color, #e5e7eb)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${getPercentage(usage.upscale_2x, limits.upscale_2x)}%`,
              height: '100%',
              background: getPercentage(usage.upscale_2x, limits.upscale_2x) > 80 ? '#ef4444' : '#10b981',
              transition: 'width 0.3s'
            }}></div>
          </div>
        </div>
        
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
            <span>4x: {usage.upscale_4x}/{formatLimit(limits.upscale_4x)}</span>
            <span>{limits.upscale_4x === -1 ? t('upscale.unlimited') : `${Math.max(0, limits.upscale_4x - usage.upscale_4x)} ${t('usage.remaining')}`}</span>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            background: 'var(--border-color, #e5e7eb)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${getPercentage(usage.upscale_4x, limits.upscale_4x)}%`,
              height: '100%',
              background: getPercentage(usage.upscale_4x, limits.upscale_4x) > 80 ? '#ef4444' : '#3b82f6',
              transition: 'width 0.3s'
            }}></div>
          </div>
        </div>

        {(usage.upscale_2x >= limits.upscale_2x || usage.upscale_4x >= limits.upscale_4x) && limits.upscale_2x !== -1 && (
          <button
            onClick={() => setShowPricing(true)}
            style={{
              marginTop: '10px',
              width: '100%',
              padding: '6px 12px',
              background: 'var(--primary-color, #007bff)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            {t('usage.upgrade')}
          </button>
        )}
      </div>

      <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />
    </>
  );
};

export default UsageMeter;
