import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import ImageComparison from '../components/ImageComparison';
import { useAuth } from '../context/AuthContext';
import { getGuestUsage } from '../services/auth';
import { getOrCreateFingerprint } from '../utils/fingerprint';
import './UpscalePage.css';

const API_URL = '';

const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const UpscalePage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // File state
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  // Model settings
  const [scale, setScale] = useState('4x');
  const [modelType, setModelType] = useState('realesrgan-fast');
  
  // Usage tracking
  const [usage, setUsage] = useState({ upscale_2x: 0, upscale_4x: 0 });
  const [limits, setLimits] = useState({ upscale_2x: 10, upscale_4x: 5 });
  
  // Image dimensions
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  
  // Comparison view
  const [showComparison, setShowComparison] = useState(true);

  // Size limits for upscaling (in pixels)
  const SIZE_LIMITS = {
    '2x': { maxWidth: 2048, maxHeight: 2048, label: '2K' },
    '3x': { maxWidth: 1536, maxHeight: 1536, label: '1.5K' },
    '4x': { maxWidth: 1024, maxHeight: 1024, label: '1K' }
  };
  
  // AI Model configurations
  const AI_MODELS = {
    'realesrgan-fast': { 
      name: 'Real-ESRGAN Fast', 
      description: 'Good quality, very fast', 
      icon: '⚡', 
      scales: ['2x', '3x', '4x'], 
      tier: 'free',
      speed: '~1s'
    },
    'realesrgan': { 
      name: 'Real-ESRGAN Pro', 
      description: 'Best quality for photos', 
      icon: '✨', 
      scales: ['4x'], 
      tier: 'pro',
      speed: '~3s'
    },
    'realesrgan-anime': { 
      name: 'Real-ESRGAN Anime', 
      description: 'Optimized for anime/art', 
      icon: '🎨', 
      scales: ['2x', '4x'], 
      tier: 'free',
      speed: '~2s'
    }
  };
  
  useEffect(() => {
    loadUsageData();
  }, [user]);
  
  const loadUsageData = async () => {
    try {
      if (user) {
        if (user.usage) setUsage(user.usage);
        const tierLimits = {
          guest: { upscale_2x: 5, upscale_4x: 3 },
          free: { upscale_2x: 10, upscale_4x: 5 },
          pro: { upscale_2x: -1, upscale_4x: 100 },
          business: { upscale_2x: -1, upscale_4x: -1 },
          admin: { upscale_2x: -1, upscale_4x: -1 }
        };
        setLimits(tierLimits[user.subscription_tier] || tierLimits.free);
      } else {
        // Guest user - try to get usage from server
        try {
          const fingerprint = getOrCreateFingerprint();
          const guestData = await getGuestUsage(fingerprint);
          setUsage(guestData.usage || { upscale_2x: 0, upscale_4x: 0 });
          setLimits(guestData.limits || { upscale_2x: 5, upscale_4x: 3 });
        } catch (guestErr) {
          console.error('Failed to load guest usage, using defaults:', guestErr);
          // Default guest limits - allow usage even if API fails
          setUsage({ upscale_2x: 0, upscale_4x: 0 });
          setLimits({ upscale_2x: 5, upscale_4x: 3 });
        }
      }
    } catch (err) {
      console.error('Failed to load usage:', err);
      // Default to guest limits on error
      setUsage({ upscale_2x: 0, upscale_4x: 0 });
      setLimits({ upscale_2x: 5, upscale_4x: 3 });
    }
  };
  
  const canUseScale = (scaleValue) => {
    const scaleNum = scaleValue.replace('x', '');
    const key = `upscale_${scaleNum}x`;
    const limit = limits[key] ?? limits.upscale_4x;
    const used = usage[key] || 0;
    if (limit === -1) return true;
    return used < limit;
  };
  
  const isImageTooLarge = (scaleValue) => {
    if (!originalDimensions.width || !originalDimensions.height) return false;
    const sizeLimit = SIZE_LIMITS[scaleValue];
    if (!sizeLimit) return false;
    return originalDimensions.width > sizeLimit.maxWidth || originalDimensions.height > sizeLimit.maxHeight;
  };
  
  const getSizeLimitMessage = (scaleValue) => {
    const sizeLimit = SIZE_LIMITS[scaleValue];
    if (!sizeLimit) return '';
    return `Max ${sizeLimit.label} (${sizeLimit.maxWidth}×${sizeLimit.maxHeight})`;
  };
  
  const canUseModel = (type) => {
    const model = AI_MODELS[type];
    if (!model) return false;
    if (model.tier === 'pro') {
      const tier = user?.subscription_tier || 'guest';
      return tier === 'pro' || tier === 'business';
    }
    return true;
  };
  
  const getRemainingUses = (scaleValue) => {
    const scaleNum = scaleValue.replace('x', '');
    const key = `upscale_${scaleNum}x`;
    const limit = limits[key] ?? limits.upscale_4x;
    const used = usage[key] || 0;
    if (limit === -1) return '∞';
    return Math.max(0, limit - used);
  };
  
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);
  
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);
  
  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };
  
  const handleFile = (selectedFile) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    setFile(selectedFile);
    setError('');
    setResultImage(null);
    
    // Create preview and get dimensions
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(selectedFile);
  };
  
  const handleUpscale = async () => {
    if (!file) return;
    
    if (!canUseScale(scale)) {
      setError(`Daily limit reached for ${scale} upscaling. Upgrade for more!`);
      return;
    }
    
    if (isImageTooLarge(scale)) {
      const limit = SIZE_LIMITS[scale];
      setError(`Image too large for ${scale} upscaling. Max size: ${limit.maxWidth}×${limit.maxHeight}px. Try a smaller scale or resize your image first.`);
      return;
    }
    
    if (!canUseModel(modelType)) {
      setError(`${AI_MODELS[modelType].name} requires Pro subscription.`);
      return;
    }
    
    setLoading(true);
    setProgress(0);
    setError('');
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('scale', scale);
    formData.append('modelType', modelType);
    if (!user) {
      formData.append('fingerprint', getOrCreateFingerprint());
    }
    
    try {
      const response = await api.post('/upscale', formData, {
        responseType: 'blob',
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded * 50) / e.total));
        },
        onDownloadProgress: (e) => {
          setProgress(50 + Math.round((e.loaded * 50) / e.total));
        }
      });
      
      setProgress(100);
      const imageUrl = URL.createObjectURL(response.data);
      setResultImage(imageUrl);
      await loadUsageData();
    } catch (err) {
      console.error('Error uploading file', err);
      if (err.response?.status === 429) {
        setError('Daily limit reached. Please try again tomorrow or upgrade your plan.');
      } else {
        setError(err.response?.data?.message || 'Error processing image. Please try again.');
      }
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };
  
  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `upscaled_${modelType}_${scale}_${file?.name || 'image.jpg'}`;
    link.click();
  };
  
  const resetAll = () => {
    setFile(null);
    setPreview(null);
    setResultImage(null);
    setError('');
    setOriginalDimensions({ width: 0, height: 0 });
  };
  
  const getResultDimensions = () => {
    const scaleNum = parseInt(scale);
    return {
      width: originalDimensions.width * scaleNum,
      height: originalDimensions.height * scaleNum
    };
  };

  return (
    <div className="upscale-page">
      <SEO 
        title="Free AI Image Upscaler - Enhance Resolution up to 4x | ImageStudio"
        description="Upscale and enhance images with AI. Increase resolution 2x, 3x or 4x using Real-ESRGAN technology. Free, fast, no watermarks."
        keywords="AI image upscaler, upscale image, increase resolution, Real-ESRGAN, enhance photo quality, 4x upscale free"
        path="/upscale"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to Upscale Images with AI",
          "description": "Enlarge images up to 4x using AI-powered Real-ESRGAN technology",
          "step": [
            {"@type": "HowToStep", "name": "Upload Image", "text": "Drag and drop or click to upload your image"},
            {"@type": "HowToStep", "name": "Select Scale", "text": "Choose 2x, 3x, or 4x upscaling factor"},
            {"@type": "HowToStep", "name": "Process", "text": "Click upscale and wait for AI processing"},
            {"@type": "HowToStep", "name": "Download", "text": "Download your enhanced high-resolution image"}
          ]
        }}
      />
      <Header />
      
      <main className="upscale-main">
        <div className="upscale-container">
          {/* Hero Section */}
          <div className="upscale-hero">
            <div className="hero-badge">AI-Powered</div>
            <h1>Image Upscaler</h1>
            <p>Enhance image resolution up to 4x using state-of-the-art neural networks. Perfect for prints, presentations, and professional work.</p>
          </div>
          
          {/* Upload Section */}
          {!preview && (
            <div 
              className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="upload-content">
                <div className="upload-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <h3>Drop your image here</h3>
                <p>or click to browse files</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileInput}
                  className="file-input"
                />
                <button className="browse-btn">Select Image</button>
              </div>
              <p className="upload-info">JPG, PNG, WebP supported • Max 10MB</p>
            </div>
          )}
          
          {/* Preview & Settings */}
          {preview && !resultImage && (
            <div className="upscale-workspace">
              {/* Image Preview */}
              <div className="preview-section">
                <div className="preview-header">
                  <h3>📷 Original Image</h3>
                  <button className="reset-btn" onClick={resetAll}>✕ Remove</button>
                </div>
                <div className="preview-image-container">
                  <img src={preview} alt="Preview" className="preview-image" />
                </div>
                <div className="image-info">
                  <span>{originalDimensions.width} × {originalDimensions.height} px</span>
                  <span>{(file?.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
              
              {/* Settings Panel */}
              <div className="settings-section">
                <h3>⚙️ Upscale Settings</h3>
                
                {/* AI Model Selection */}
                <div className="setting-group">
                  <label>AI Model</label>
                  <div className="model-grid">
                    {Object.entries(AI_MODELS).map(([key, model]) => {
                      const isAvailable = canUseModel(key);
                      return (
                        <button
                          key={key}
                          className={`model-card ${modelType === key ? 'active' : ''} ${!isAvailable ? 'locked' : ''}`}
                          onClick={() => {
                            if (isAvailable) {
                              setModelType(key);
                              if (!model.scales.includes(scale)) {
                                setScale(model.scales[0]);
                              }
                            }
                          }}
                          disabled={!isAvailable}
                        >
                          <span className="model-icon">{model.icon}</span>
                          <span className="model-name">{model.name}</span>
                          <span className="model-desc">{model.description}</span>
                          <span className="model-speed">{model.speed}</span>
                          {!isAvailable && <span className="lock-badge">🔒 Pro</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Scale Selection */}
                <div className="setting-group">
                  <label>Upscale Factor</label>
                  <div className="scale-buttons">
                    {AI_MODELS[modelType]?.scales.map((s) => {
                      const tooLarge = isImageTooLarge(s);
                      const noUsage = !canUseScale(s);
                      const isDisabled = tooLarge || noUsage;
                      return (
                        <button
                          key={s}
                          className={`scale-btn ${scale === s ? 'active' : ''} ${isDisabled ? 'disabled' : ''} ${tooLarge ? 'size-exceeded' : ''}`}
                          onClick={() => !isDisabled && setScale(s)}
                          disabled={isDisabled}
                          title={tooLarge ? `Image exceeds ${getSizeLimitMessage(s)}` : ''}
                        >
                          <span className="scale-value">{s}</span>
                          <span className="scale-limit">{getSizeLimitMessage(s)}</span>
                          {tooLarge ? (
                            <span className="scale-warning">⚠️ Too large</span>
                          ) : (
                            <span className="scale-uses">{getRemainingUses(s)} left</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Output Preview */}
                <div className="output-preview">
                  <div className="preview-comparison">
                    <div className="size-box original">
                      <span className="size-label">Current</span>
                      <span className="size-value">{originalDimensions.width} × {originalDimensions.height}</span>
                    </div>
                    <span className="arrow">→</span>
                    <div className="size-box result">
                      <span className="size-label">Result</span>
                      <span className="size-value">{getResultDimensions().width} × {getResultDimensions().height}</span>
                    </div>
                  </div>
                </div>
                
                {/* Error Message */}
                {error && (
                  <div className="error-message">
                    <span>⚠️</span> {error}
                  </div>
                )}
                
                {/* Upscale Button */}
                <button 
                  className="upscale-btn"
                  onClick={handleUpscale}
                  disabled={loading || !canUseScale(scale) || !canUseModel(modelType) || isImageTooLarge(scale)}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Processing... {progress}%
                    </>
                  ) : isImageTooLarge(scale) ? (
                    <>
                      ⚠️ Image exceeds {getSizeLimitMessage(scale)} limit
                    </>
                  ) : (
                    <>
                      🚀 Upscale with {AI_MODELS[modelType]?.name} ({scale})
                    </>
                  )}
                </button>
                
                {loading && (
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Result Section */}
          {resultImage && (
            <div className="result-section">
              <div className="result-header">
                <h3>✨ Upscaled Result</h3>
                <div className="result-actions">
                  <button className="action-btn primary" onClick={handleDownload}>
                    📥 Download
                  </button>
                  <button className="action-btn secondary" onClick={resetAll}>
                    🔄 Upscale Another
                  </button>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="view-mode-toggle">
                <button
                  className={`view-mode-btn ${showComparison ? 'active' : ''}`}
                  onClick={() => setShowComparison(true)}
                >
                  <span className="view-icon">↔️</span>
                  <span>Comparison Slider</span>
                </button>
                <button
                  className={`view-mode-btn ${!showComparison ? 'active' : ''}`}
                  onClick={() => setShowComparison(false)}
                >
                  <span className="view-icon">🔀</span>
                  <span>Side by Side</span>
                </button>
              </div>

              {showComparison ? (
                <div className="comparison-slider-container">
                  <ImageComparison
                    beforeImage={preview}
                    afterImage={resultImage}
                    beforeLabel={`Original (${originalDimensions.width}×${originalDimensions.height})`}
                    afterLabel={`Upscaled ${scale} (${getResultDimensions().width}×${getResultDimensions().height})`}
                    className="upscale-comparison"
                  />
                  <p className="comparison-hint">👆 Drag the slider left and right to compare</p>
                </div>
              ) : (
                <div className="result-comparison-grid">
                  <div className="comparison-card">
                    <div className="comparison-card-header">
                      <span className="comparison-badge original">Original</span>
                      <span className="comparison-dimensions">{originalDimensions.width} × {originalDimensions.height}</span>
                    </div>
                    <div className="comparison-card-image">
                      <img src={preview} alt="Original" />
                    </div>
                  </div>
                  <div className="comparison-arrow-container">
                    <div className="comparison-arrow-icon">→</div>
                  </div>
                  <div className="comparison-card">
                    <div className="comparison-card-header">
                      <span className="comparison-badge processed">Upscaled {scale}</span>
                      <span className="comparison-dimensions">{getResultDimensions().width} × {getResultDimensions().height}</span>
                    </div>
                    <div className="comparison-card-image">
                      <img src={resultImage} alt="Upscaled" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Info Section */}
          <div className="info-section">
            <h3>How AI Upscaling Works</h3>
            <div className="info-grid">
              <div className="info-card">
                <span className="info-icon">🧠</span>
                <h4>Deep Learning</h4>
                <p>Uses neural networks trained on millions of images to predict and generate realistic details.</p>
              </div>
              <div className="info-card">
                <span className="info-icon">✨</span>
                <h4>Detail Enhancement</h4>
                <p>Adds sharp edges, textures, and details that simple resizing cannot achieve.</p>
              </div>
              <div className="info-card">
                <span className="info-icon">🎨</span>
                <h4>Color Preservation</h4>
                <p>Maintains accurate colors while enhancing image quality and sharpness.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default UpscalePage;
