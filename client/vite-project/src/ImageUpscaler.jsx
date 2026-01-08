import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import { getGuestUsage } from './services/auth';
import { getOrCreateFingerprint } from './utils/fingerprint';

// Available AI models for upscaling
const AI_MODELS = {
  fsrcnn: { name: 'FSRCNN', description: 'Fast (Lite)', scales: [2, 3, 4], tier: 'free' },
  espcn: { name: 'ESPCN', description: 'Balanced', scales: [2, 3, 4], tier: 'free' },
  edsr: { name: 'EDSR', description: 'High Quality (Pro)', scales: [2, 4], tier: 'pro' }
};

const ImageUpscaler = () => {
  const [file, setFile] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scale, setScale] = useState('2x');
  const [modelType, setModelType] = useState('fsrcnn');
  const [usage, setUsage] = useState({ upscale_2x: 0, upscale_4x: 0 });
  const [limits, setLimits] = useState({ upscale_2x: 5, upscale_4x: 3 });
  const { user } = useAuth();

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

  const canUseModel = (selectedScale) => {
    const modelKey = `upscale_${selectedScale}`;
    const limit = limits[modelKey];
    const used = usage[modelKey] || 0;
    if (limit === -1) return true;
    return used < limit;
  };

  const getRemainingUses = (selectedScale) => {
    const modelKey = `upscale_${selectedScale}`;
    const limit = limits[modelKey];
    const used = usage[modelKey] || 0;
    if (limit === -1) return '∞';
    return Math.max(0, limit - used);
  };

  const canUseModelType = (type) => {
    const modelInfo = AI_MODELS[type];
    if (!modelInfo) return false;
    if (modelInfo.tier === 'pro') {
      const tier = user?.subscription_tier || 'guest';
      return tier === 'pro' || tier === 'business';
    }
    return true;
  };

  const getAvailableScales = () => {
    return AI_MODELS[modelType]?.scales || [2, 4];
  };

  const validateImageDimensions = (file, selectedScale) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const width = img.width;
        const height = img.height;
        const scaleNum = parseInt(selectedScale);
        const limits = scaleNum <= 2 
          ? { width: 5120, height: 2880, name: '5K' }
          : { width: 3840, height: 2160, name: '4K' };
        
        if (width > limits.width || height > limits.height) {
          reject(new Error(`Image resolution too large for ${selectedScale}x upscaling. Maximum allowed is ${limits.name} (${limits.width}x${limits.height}). Your image is ${width}x${height}.`));
        } else {
          resolve({ width, height });
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };

      img.src = objectUrl;
    });
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setError('');
    setFile(null);

    try {
      await validateImageDimensions(selectedFile, scale);
      setFile(selectedFile);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    const scaleNum = scale.replace('x', '');
    if (!canUseModel(scaleNum)) {
      setError(`You've reached your limit for ${scale} upscaling. ${user ? 'Upgrade your plan for more uses!' : 'Please register for more uses!'}`);
      return;
    }

    if (!canUseModelType(modelType)) {
      setError(`${AI_MODELS[modelType].name} requires a Pro or Business subscription.`);
      return;
    }
    
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', file);
    formData.append('scale', scale);
    formData.append('modelType', modelType);
    if (!user) {
      formData.append('fingerprint', getOrCreateFingerprint());
    }

    try {
      const token = localStorage.getItem('auth_token');
      const config = {
        responseType: 'blob',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      };
      
      const response = await axios.post('/upscale', formData, config);
      const imageUrl = URL.createObjectURL(response.data);
      setResultImage(imageUrl);
      await loadUsage();
    } catch (error) {
      console.error("Error uploading file", error);
      setError(error.response?.data?.message || 'Error processing image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upscaler-container">
      {/* AI Model Type Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
          AI Model:
        </label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {Object.entries(AI_MODELS).map(([key, model]) => {
            const isAvailable = canUseModelType(key);
            return (
              <label
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 15px',
                  border: modelType === key ? '2px solid var(--primary-color, #4a90d9)' : '1px solid #ccc',
                  borderRadius: '8px',
                  cursor: isAvailable ? 'pointer' : 'not-allowed',
                  opacity: isAvailable ? 1 : 0.5,
                  backgroundColor: modelType === key ? 'var(--background-secondary, #f0f8ff)' : 'transparent'
                }}
              >
                <input
                  type="radio"
                  value={key}
                  checked={modelType === key}
                  onChange={(e) => {
                    setModelType(e.target.value);
                    // Reset scale if not available for this model
                    const availableScales = AI_MODELS[e.target.value].scales;
                    const currentScaleNum = parseInt(scale);
                    if (!availableScales.includes(currentScaleNum)) {
                      setScale(`${availableScales[0]}x`);
                    }
                  }}
                  disabled={!isAvailable}
                  style={{ marginRight: '8px' }}
                />
                <div>
                  <div style={{ fontWeight: 'bold' }}>{model.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {model.description}
                    {!isAvailable && ' 🔒'}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Scale Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
          Upscale Factor:
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          {getAvailableScales().map((scaleOption) => {
            const scaleKey = `${scaleOption}x`;
            const remaining = getRemainingUses(scaleOption);
            const canUse = canUseModel(scaleOption);
            return (
              <label
                key={scaleOption}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 20px',
                  border: scale === scaleKey ? '2px solid var(--primary-color, #4a90d9)' : '1px solid #ccc',
                  borderRadius: '8px',
                  cursor: canUse ? 'pointer' : 'not-allowed',
                  opacity: canUse ? 1 : 0.5,
                  backgroundColor: scale === scaleKey ? 'var(--background-secondary, #f0f8ff)' : 'transparent'
                }}
              >
                <input
                  type="radio"
                  value={scaleKey}
                  checked={scale === scaleKey}
                  onChange={(e) => setScale(e.target.value)}
                  disabled={!canUse}
                  style={{ marginRight: '8px' }}
                />
                <div>
                  <div style={{ fontWeight: 'bold' }}>{scaleOption}x</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {remaining} uses left
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* File Upload */}
      <div style={{ marginBottom: '20px' }}>
        <input type="file" onChange={handleFileChange} accept="image/*" />
      </div>

      {/* Upload Button */}
      <button 
        onClick={handleUpload} 
        disabled={loading || !file || !canUseModel(scale.replace('x', '')) || !canUseModelType(modelType)}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          cursor: loading ? 'wait' : 'pointer'
        }}
      >
        {loading ? 'Processing...' : `Upscale with ${AI_MODELS[modelType].name} (${scale})`}
      </button>

      {error && (
        <div style={{ color: 'red', marginTop: '15px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {resultImage && (
        <div style={{ marginTop: '20px' }}>
          <h3>Result:</h3>
          <img src={resultImage} alt="Upscaled" style={{ maxWidth: '100%', borderRadius: '8px' }} />
          <div style={{ marginTop: '10px' }}>
            <a href={resultImage} download={`upscaled_${modelType}_${scale}.jpg`}>
              <button>Download Image</button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpscaler;