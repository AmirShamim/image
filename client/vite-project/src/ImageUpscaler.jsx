import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import { getGuestUsage } from './services/auth';
import { getOrCreateFingerprint } from './utils/fingerprint';

const ImageUpscaler = () => {
  const [file, setFile] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [model, setModel] = useState('4x');
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

  const canUseModel = (selectedModel) => {
    const modelKey = `upscale_${selectedModel}`;
    const limit = limits[modelKey];
    const used = usage[modelKey] || 0;
    if (limit === -1) return true;
    return used < limit;
  };

  const getRemainingUses = (selectedModel) => {
    const modelKey = `upscale_${selectedModel}`;
    const limit = limits[modelKey];
    const used = usage[modelKey] || 0;
    if (limit === -1) return '∞';
    return Math.max(0, limit - used);
  };

  const validateImageDimensions = (file, selectedModel) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const width = img.width;
        const height = img.height;
        const limits = selectedModel === '2x' 
          ? { width: 5120, height: 2880, name: '5K' }
          : { width: 3840, height: 2160, name: '4K' };
        
        if (width > limits.width || height > limits.height) {
          reject(new Error(`Image resolution too large for ${selectedModel} upscaling. Maximum allowed is ${limits.name} (${limits.width}x${limits.height}). Your image is ${width}x${height}.`));
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
      await validateImageDimensions(selectedFile, model);
      setFile(selectedFile);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    if (!canUseModel(model)) {
      setError(`You've reached your limit for ${model} upscaling. ${user ? 'Upgrade your plan for more uses!' : 'Please register for more uses!'}`);
      return;
    }
    
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', file);
    formData.append('model', model);
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
    <div>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ marginRight: '15px', fontWeight: 'bold' }}>AI Model:</label>
        <label style={{ marginRight: '15px' }}>
          <input
            type="radio"
            value="2x"
            checked={model === '2x'}
            onChange={(e) => setModel(e.target.value)}
            style={{ marginRight: '5px' }}
          />
          2x Upscale ({getRemainingUses('2x')} uses left)
        </label>
        <label>
          <input
            type="radio"
            value="4x"
            checked={model === '4x'}
            onChange={(e) => setModel(e.target.value)}
            style={{ marginRight: '5px' }}
          />
          4x Upscale ({getRemainingUses('4x')} uses left)
        </label>
      </div>

      <input type="file" onChange={handleFileChange} accept="image/*" />
      <button 
        onClick={handleUpload} 
        disabled={loading || !file || !canUseModel(model)}
        title={!canUseModel(model) ? `No ${model} uses remaining` : ''}
      >
        {loading ? 'Processing...' : `Upscale Image (${model})`}
      </button>

      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          {error}
        </div>
      )}

      {resultImage && (
        <div>
          <h3>Result:</h3>
          <img src={resultImage} alt="Upscaled" style={{ maxWidth: '100%' }} />
        </div>
      )}
    </div>
  );
};

export default ImageUpscaler;