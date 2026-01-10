import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';
import ImageComparison from '../components/ImageComparison';
import { useAuth } from '../context/AuthContext';
import { getGuestUsage } from '../services/auth';
import { getOrCreateFingerprint } from '../utils/fingerprint';
import PageShell from '../components/PageShell';
import PageHero from '../components/PageHero';

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
    <PageShell>
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

      <PageHero
        badge="AI Upscaling"
        title="Image Upscaler"
        subtitle="Enhance image resolution up to 4x using neural upscaling. Great for prints, presentations, and professional work."
        right={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowComparison((v) => !v)}
              className="glass-button text-sm text-white"
            >
              {showComparison ? 'Hide comparison' : 'Show comparison'}
            </button>
          </div>
        }
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Upload Section */}
        {!preview && (
          <div
            className={`glass-card-hover p-8 sm:p-10 text-center ${dragActive ? 'ring-1 ring-[#00d4aa]/60' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="mx-auto w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>

            <h3 className="text-xl font-semibold text-white">Drop your image here</h3>
            <p className="text-zinc-400 mt-1">or click to browse files</p>

            <label className="inline-flex items-center justify-center mt-6 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
              <span className="accent-button">Select Image</span>
            </label>

            <p className="text-xs text-zinc-500 mt-4">JPG, PNG, WebP supported • Max 10MB</p>
          </div>
        )}

        {/* Preview & Settings */}
        {preview && !resultImage && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Preview */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Original</h3>
                <button className="glass-button text-sm text-white" onClick={resetAll}>Remove</button>
              </div>
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/20">
                <img src={preview} alt="Preview" className="w-full h-auto block" />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
                <span>{originalDimensions.width} × {originalDimensions.height} px</span>
                <span>{(file?.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>

            {/* Settings */}
            <div className="glass-card p-6">
              <h3 className="text-white font-semibold mb-4">Upscale Settings</h3>

              {/* AI Model Selection */}
              <div className="setting-group mb-4">
                <label className="text-sm text-white mb-2">AI Model</label>
                <div className="model-grid grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.entries(AI_MODELS).map(([key, model]) => {
                    const isAvailable = canUseModel(key);
                    const isSelected = modelType === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`model-card relative p-4 rounded-2xl border transition-all duration-200 ease-in-out text-left ${
                          isSelected
                            ? 'bg-[#00d4aa]/15 border-[#00d4aa]/30'
                            : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
                        } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        <div className="flex items-start justify-between gap-2">
                          <span className="model-icon text-2xl">{model.icon}</span>
                          {!isAvailable && (
                            <span className="lock-badge text-[10px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-zinc-200">
                              Pro
                            </span>
                          )}
                        </div>
                        <span className="model-name block font-semibold text-white mt-2">{model.name}</span>
                        <span className="model-desc block text-xs text-zinc-400 mt-1">{model.description}</span>
                        <span className="model-speed block text-xs text-zinc-500 mt-2">{model.speed}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scale Selection */}
              <div className="setting-group mb-4">
                <label className="text-sm text-white mb-2">Upscale Factor</label>
                <div className="scale-buttons flex flex-col sm:flex-row gap-2">
                  {AI_MODELS[modelType]?.scales.map((s) => {
                    const tooLarge = isImageTooLarge(s);
                    const noUsage = !canUseScale(s);
                    const isDisabled = tooLarge || noUsage;
                    const isSelected = scale === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        className={`scale-btn flex-1 rounded-2xl p-4 text-left border transition-all ${
                          isSelected
                            ? 'bg-[#00d4aa]/15 border-[#00d4aa]/30'
                            : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
                        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${tooLarge ? 'ring-1 ring-red-500/40' : ''}`}
                        onClick={() => !isDisabled && setScale(s)}
                        disabled={isDisabled}
                        title={tooLarge ? `Image exceeds ${getSizeLimitMessage(s)}` : ''}
                      >
                        <div className="flex items-center justify-between">
                          <span className="scale-value text-lg font-semibold text-white">{s}</span>
                          <span className="scale-limit text-[11px] text-zinc-400">{getSizeLimitMessage(s)}</span>
                        </div>
                        <div className="mt-2">
                          {tooLarge ? (
                            <span className="scale-warning text-red-300 text-xs flex items-center gap-1">
                              ⚠️ Too large
                            </span>
                          ) : (
                            <span className="scale-uses text-xs text-zinc-400">{getRemainingUses(s)} left</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Output Preview */}
              <div className="output-preview mb-4">
                <div className="preview-comparison flex items-center justify-between rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                  <div className="size-box original text-sm">
                    <span className="size-label text-zinc-400">Current</span>
                    <span className="size-value font-semibold text-white block">{originalDimensions.width} × {originalDimensions.height}</span>
                  </div>
                  <span className="arrow text-zinc-500">→</span>
                  <div className="size-box result text-sm text-right">
                    <span className="size-label text-zinc-400">Result</span>
                    <span className="size-value font-semibold text-white block">{getResultDimensions().width} × {getResultDimensions().height}</span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="error-message mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}

              {/* Upscale Button */}
              <button
                type="button"
                className={`upscale-btn w-full accent-button text-center flex items-center justify-center gap-2 ${loading ? 'opacity-90' : ''}`}
                onClick={handleUpscale}
                disabled={loading || !canUseScale(scale) || !canUseModel(modelType) || isImageTooLarge(scale)}
              >
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full border-2 border-black/20 border-t-black h-4 w-4"></span>
                    Processing… {progress}%
                  </>
                ) : isImageTooLarge(scale) ? (
                  <>⚠️ Image exceeds {getSizeLimitMessage(scale)} limit</>
                ) : (
                  <>Upscale with {AI_MODELS[modelType]?.name} ({scale})</>
                )}
              </button>

              {loading && (
                <div className="progress-bar mt-4 h-2 rounded-full bg-white/10">
                  <div className="progress-fill h-2 rounded-full bg-[#00d4aa]" style={{ width: `${progress}%` }}></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Result Section */}
        {resultImage && (
          <div className="result-section glass-card p-6">
            <div className="result-header flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Upscaled Result</h3>
              <div className="result-actions flex items-center gap-2">
                <button className="action-btn primary accent-button" onClick={handleDownload} type="button">
                  Download
                </button>
                <button className="action-btn secondary glass-button text-white" onClick={resetAll} type="button">
                  Upscale Another
                </button>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="view-mode-toggle flex gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/10 mb-4 w-fit">
              <button
                type="button"
                className={`view-mode-btn px-3 py-2 rounded-lg text-sm transition-colors ${showComparison ? 'bg-[#00d4aa]/20 text-[#00d4aa]' : 'text-zinc-300 hover:text-white hover:bg-white/[0.04]'}`}
                onClick={() => setShowComparison(true)}
              >
                ↔ Compare
              </button>
              <button
                type="button"
                className={`view-mode-btn px-3 py-2 rounded-lg text-sm transition-colors ${!showComparison ? 'bg-[#00d4aa]/20 text-[#00d4aa]' : 'text-zinc-300 hover:text-white hover:bg-white/[0.04]'}`}
                onClick={() => setShowComparison(false)}
              >
                🔀 Side-by-side
              </button>
            </div>

            {showComparison ? (
              <div className="comparison-slider-container mb-4">
                <ImageComparison
                  beforeImage={preview}
                  afterImage={resultImage}
                  beforeLabel={`Original (${originalDimensions.width}×${originalDimensions.height})`}
                  afterLabel={`Upscaled ${scale} (${getResultDimensions().width}×${getResultDimensions().height})`}
                  className="upscale-comparison"
                />
                <p className="comparison-hint text-center text-xs text-zinc-400 mt-2">Drag the slider to compare</p>
              </div>
            ) : (
              <div className="result-comparison-grid grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                <div className="comparison-card rounded-2xl overflow-hidden border border-white/10 bg-black/20">
                  <div className="comparison-card-header p-4 bg-white/[0.04] border-b border-white/10">
                    <div className="text-xs text-zinc-400">Original</div>
                    <div className="text-sm font-semibold text-white">{originalDimensions.width} × {originalDimensions.height}</div>
                  </div>
                  <div className="comparison-card-image">
                    <img src={preview} alt="Original" className="w-full h-auto block" />
                  </div>
                </div>
                <div className="comparison-arrow-container hidden lg:flex items-center justify-center">
                  <div className="comparison-arrow-icon text-3xl text-zinc-500">→</div>
                </div>
                <div className="comparison-card rounded-2xl overflow-hidden border border-white/10 bg-black/20">
                  <div className="comparison-card-header p-4 bg-white/[0.04] border-b border-white/10">
                    <div className="text-xs text-zinc-400">Upscaled {scale}</div>
                    <div className="text-sm font-semibold text-white">{getResultDimensions().width} × {getResultDimensions().height}</div>
                  </div>
                  <div className="comparison-card-image">
                    <img src={resultImage} alt="Upscaled" className="w-full h-auto block" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="info-section mt-10">
          <h3 className="text-white font-semibold mb-4">How AI Upscaling Works</h3>
          <div className="info-grid grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="info-card glass-card p-5">
              <span className="info-icon text-3xl">🧠</span>
              <h4 className="text-white font-semibold mt-2">Deep Learning</h4>
              <p className="text-zinc-400 text-sm mt-2">Uses neural networks trained on millions of images to predict and generate realistic details.</p>
            </div>
            <div className="info-card glass-card p-5">
              <span className="info-icon text-3xl">✨</span>
              <h4 className="text-white font-semibold mt-2">Detail Enhancement</h4>
              <p className="text-zinc-400 text-sm mt-2">Adds sharp edges, textures, and details that simple resizing cannot achieve.</p>
            </div>
            <div className="info-card glass-card p-5">
              <span className="info-icon text-3xl">🎨</span>
              <h4 className="text-white font-semibold mt-2">Color Preservation</h4>
              <p className="text-zinc-400 text-sm mt-2">Maintains accurate colors while enhancing image quality and sharpness.</p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default UpscalePage;
