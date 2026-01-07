import React, { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import './ImageProcessor.css';
import UserButton from './components/UserButton';
import BatchProcessor from './components/BatchProcessor';
import UsageMeter from './components/UsageMeter';
import LanguageSelector from './components/LanguageSelector';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import { getGuestUsage } from './services/auth';
import { getOrCreateFingerprint } from './utils/fingerprint';

// In development, Vite proxy handles forwarding to backend
// In production, requests go to same origin
const API_URL = '';

// Preset sizes for quick selection
const PRESET_SIZES = {
  social: [
    { name: 'Instagram', width: 1080, height: 1080, icon: '📸' },
    { name: 'Facebook', width: 1200, height: 630, icon: '🌐' },
    { name: 'Twitter', width: 1200, height: 675, icon: '🐦' },
    { name: 'YouTube', width: 1280, height: 720, icon: '▶️' },
  ],
  devices: [
    { name: 'HD', width: 1920, height: 1080, icon: '🖥️' },
    { name: '4K', width: 3840, height: 2160, icon: '📺' },
    { name: 'Mobile', width: 1080, height: 1920, icon: '📱' },
  ],
  web: [
    { name: 'Thumb', width: 150, height: 150, icon: '🖼️' },
    { name: 'Small', width: 320, height: 240, icon: '🖼️' },
    { name: 'Medium', width: 800, height: 600, icon: '🖼️' },
  ]
};

// Create axios instance with auth interceptor
const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const ImageProcessor = () => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('resize'); // 'resize' or 'upscale'
  const [dragActive, setDragActive] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonPosition, setComparisonPosition] = useState(50);
  const [showBatchProcessor, setShowBatchProcessor] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Progress tracking
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState(''); // 'uploading', 'processing', 'downloading'
  
  // Image dimensions
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  
  // Upscale model selection and usage tracking
  const [upscaleModel, setUpscaleModel] = useState('4x');
  const [usage, setUsage] = useState({ upscale_2x: 0, upscale_4x: 0 });
  const [limits, setLimits] = useState({ upscale_2x: 5, upscale_4x: 3 });
  
  // Upscale validation
  const [upscaleError, setUpscaleError] = useState('');
  
  // Load usage data on mount and when user changes
  useEffect(() => {
    loadUsageData();
  }, [user]);
  
  const loadUsageData = async () => {
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
  
  const getResolutionLimits = () => {
    return upscaleModel === '2x'
      ? { width: 5120, height: 2880, name: '5K' }
      : { width: 3840, height: 2160, name: '4K' };
  };
  
  const canUseUpscaleModel = () => {
    const modelKey = `upscale_${upscaleModel}`;
    const limit = limits[modelKey];
    const used = usage[modelKey] || 0;
    if (limit === -1) return true;
    return used < limit;
  };
  
  const getRemainingUses = () => {
    const modelKey = `upscale_${upscaleModel}`;
    const limit = limits[modelKey];
    const used = usage[modelKey] || 0;
    if (limit === -1) return '∞';
    return Math.max(0, limit - used);
  };
  
  // Live preview
  const [livePreview, setLivePreview] = useState(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  
  // Resize options
  const [resizeType, setResizeType] = useState('percentage'); // 'percentage' or 'pixels'
  const [percentage, setPercentage] = useState(50);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [quality, setQuality] = useState(90);
  const [format, setFormat] = useState('jpg');

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setResultImage(null);
    setUpscaleError(''); // Reset upscale error
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);
    
    // Get original dimensions
    const img = new Image();
    img.onload = () => {
      setOriginalDimensions({ width: img.width, height: img.height });
      setWidth(img.width);
      setHeight(img.height);
      imageRef.current = img;
      
      // Check if image exceeds limits for selected upscale model
      const limits = getResolutionLimits();
      if (img.width > limits.width || img.height > limits.height) {
        setUpscaleError(`Image resolution (${img.width}x${img.height}) exceeds ${limits.name} limit (${limits.width}x${limits.height}). AI upscaling with ${upscaleModel} model is disabled.`);
      }
    };
    img.src = URL.createObjectURL(selectedFile);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleWidthChange = (newWidth) => {
    setWidth(newWidth);
    if (maintainAspect && originalDimensions.width > 0) {
      const ratio = originalDimensions.height / originalDimensions.width;
      setHeight(Math.round(newWidth * ratio));
    }
  };

  const handleHeightChange = (newHeight) => {
    setHeight(newHeight);
    if (maintainAspect && originalDimensions.height > 0) {
      const ratio = originalDimensions.width / originalDimensions.height;
      setWidth(Math.round(newHeight * ratio));
    }
  };

  const calculateNewDimensions = useCallback(() => {
    if (resizeType === 'percentage') {
      return {
        width: Math.round(originalDimensions.width * percentage / 100),
        height: Math.round(originalDimensions.height * percentage / 100)
      };
    }
    return { width, height };
  }, [resizeType, percentage, originalDimensions, width, height]);

  // Generate live preview when settings change
  useEffect(() => {
    if (!imageRef.current || !preview || activeTab !== 'resize') {
      setLivePreview(null);
      return;
    }

    const generatePreview = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const dims = calculateNewDimensions();
      
      // Limit preview size for performance
      const maxPreviewSize = 400;
      let previewW = dims.width;
      let previewH = dims.height;
      
      if (previewW > maxPreviewSize || previewH > maxPreviewSize) {
        const scale = maxPreviewSize / Math.max(previewW, previewH);
        previewW = Math.round(previewW * scale);
        previewH = Math.round(previewH * scale);
      }
      
      canvas.width = previewW;
      canvas.height = previewH;
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(imageRef.current, 0, 0, previewW, previewH);
      
      setLivePreview(canvas.toDataURL('image/jpeg', quality / 100));
    };

    // Debounce preview generation
    const timeout = setTimeout(generatePreview, 150);
    return () => clearTimeout(timeout);
  }, [preview, percentage, width, height, quality, resizeType, activeTab, calculateNewDimensions]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+V to paste from clipboard
      if (e.ctrlKey && e.key === 'v' && !e.target.closest('input, textarea')) {
        handlePaste();
      }
      // Ctrl+S to save/download (when result available)
      if (e.ctrlKey && e.key === 's' && resultImage) {
        e.preventDefault();
        handleDownload();
      }
      // Escape to clear
      if (e.key === 'Escape' && (preview || resultImage)) {
        clearAll();
      }
      // Tab to switch modes (when not in input)
      if (e.key === 'Tab' && !e.target.closest('input, textarea, select') && preview && !resultImage) {
        e.preventDefault();
        setActiveTab(prev => prev === 'resize' ? 'upscale' : 'resize');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resultImage, preview]);

  // Handle paste from clipboard
  const handlePaste = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const file = new File([blob], `pasted_image.${type.split('/')[1]}`, { type });
            handleFileSelect(file);
            return;
          }
        }
      }
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      console.log('Clipboard access not available');
    }
  };

  // Copy result to clipboard
  const copyToClipboard = async () => {
    if (!resultImage) return;
    try {
      const response = await fetch(resultImage);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Apply preset size
  const applyPreset = (preset) => {
    setResizeType('pixels');
    setWidth(preset.width);
    setHeight(preset.height);
    setShowPresets(false);
  };

  const handleResize = async () => {
    if (!file) return;
    setLoading(true);
    setProgress(0);
    setProgressStage('uploading');

    const formData = new FormData();
    formData.append('image', file);
    formData.append('resizeType', resizeType);
    formData.append('percentage', percentage);
    formData.append('width', width);
    formData.append('height', height);
    formData.append('maintainAspect', maintainAspect);
    formData.append('quality', quality);
    formData.append('format', format);

    try {
      const response = await api.post('/resize', formData, {
        responseType: 'blob',
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted * 0.4); // Upload is 0-40%
          if (percentCompleted === 100) {
            setProgressStage('processing');
            setProgress(50);
          }
        },
        onDownloadProgress: (progressEvent) => {
          setProgressStage('downloading');
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(60 + percentCompleted * 0.4); // Download is 60-100%
          } else {
            setProgress(80);
          }
        }
      });

      setProgress(100);
      const imageUrl = URL.createObjectURL(response.data);
      setResultImage(imageUrl);
    } catch (error) {
      console.error("Error processing file", error);
      alert('Error processing image. Please try again.');
    } finally {
      setLoading(false);
      setProgress(0);
      setProgressStage('');
    }
  };

  const handleUpscale = async () => {
    if (!file) return;
    
    // Check usage limits
    if (!canUseUpscaleModel()) {
      alert(`You've reached your limit for ${upscaleModel} upscaling. ${user ? 'Upgrade your plan for more uses!' : 'Please register for more uses!'}`);
      return;
    }
    
    setLoading(true);
    setProgress(0);
    setProgressStage('uploading');

    const formData = new FormData();
    formData.append('image', file);
    formData.append('model', upscaleModel);
    
    // Add fingerprint for guest users
    if (!user) {
      formData.append('fingerprint', getOrCreateFingerprint());
    }

    try {
      const response = await api.post('/upscale', formData, {
        responseType: 'blob',
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted * 0.2); // Upload is 0-20% (upscaling takes longer)
          if (percentCompleted === 100) {
            setProgressStage('processing');
            // Simulate processing progress for upscaling
            simulateProcessingProgress();
          }
        },
        onDownloadProgress: (progressEvent) => {
          setProgressStage('downloading');
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(80 + percentCompleted * 0.2); // Download is 80-100%
          } else {
            setProgress(90);
          }
        }
      });

      setProgress(100);
      const imageUrl = URL.createObjectURL(response.data);
      setResultImage(imageUrl);
      
      // Reload usage after successful upscale
      await loadUsageData();
    } catch (error) {
      console.error("Error uploading file", error);
      alert('Error upscaling image. Please try again.');
    } finally {
      setLoading(false);
      setProgress(0);
      setProgressStage('');
    }
  };

  // Simulate processing progress for upscaling (since we can't get real progress from Python)
  const simulateProcessingProgress = () => {
    let currentProgress = 20;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 5;
      if (currentProgress >= 75) {
        clearInterval(interval);
        setProgress(75);
      } else {
        setProgress(currentProgress);
      }
    }, 500);
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `processed_image.${format}`;
    link.click();
  };

  const clearAll = () => {
    setFile(null);
    setPreview(null);
    setResultImage(null);
    setLivePreview(null);
    setShowComparison(false);
    setOriginalDimensions({ width: 0, height: 0 });
    imageRef.current = null;
  };

  const handleComparisonMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = (x / rect.width) * 100;
    setComparisonPosition(Math.min(100, Math.max(0, percent)));
  };

  const newDimensions = calculateNewDimensions();

  return (
    <div className="processor-container">
      {/* Fixed Sign In Button */}
      <div className="fixed-auth-btn">
        <UserButton />
      </div>

      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="title">
              <span className="title-icon">✨</span>
              {t('app.title')}
            </h1>
            <p className="subtitle">{t('app.description')}</p>
          </div>
          <div className="header-right">
            <button 
              className="menu-toggle"
              onClick={() => setShowHeaderMenu(!showHeaderMenu)}
              aria-label="Toggle menu"
            >
              {showHeaderMenu ? '✕' : '☰'}
            </button>
            <div className={`header-menu ${showHeaderMenu ? 'show' : ''}`}>
              <LanguageSelector />
              <button 
                className="icon-button batch-btn"
                onClick={() => setShowBatchProcessor(true)}
                title={t('header.batch')}
              >
                📦
              </button>
              <button 
                className="icon-button theme-toggle"
                onClick={toggleTheme}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <UsageMeter />
            </div>
          </div>
        </div>
        <div className="keyboard-hints">
          <span title="Paste image from clipboard">Ctrl+V: {t('shortcuts.paste')}</span>
          <span title="Download result">Ctrl+S: {t('shortcuts.save')}</span>
          <span title="Clear current image">Esc: {t('shortcuts.clear')}</span>
        </div>
      </header>

      {/* Batch Processor Modal */}
      <BatchProcessor 
        isOpen={showBatchProcessor} 
        onClose={() => setShowBatchProcessor(false)} 
      />

      {/* Tab Switcher */}
      <div className="tab-container">
        <button 
          className={`tab ${activeTab === 'resize' ? 'active' : ''}`}
          onClick={() => setActiveTab('resize')}
        >
          <span className="tab-icon">📐</span>
          {t('tabs.resize')}
        </button>
        <button 
          className={`tab ${activeTab === 'upscale' ? 'active' : ''}`}
          onClick={() => setActiveTab('upscale')}
        >
          <span className="tab-icon">🚀</span>
          {t('tabs.upscale')}
        </button>
      </div>

      <div className="main-content">
        {/* Upload Area */}
        <div 
          className={`upload-area glass ${dragActive ? 'drag-active' : ''} ${preview ? 'has-image' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {!preview ? (
            <div className="upload-placeholder">
              <div className="upload-icon">🖼️</div>
              <p>{t('upload.dragDrop')}</p>
              <span className="upload-or">{t('upload.or')}</span>
              <div className="upload-actions">
                <label className="upload-button">
                  {t('upload.browse')}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    hidden 
                  />
                </label>
                <button className="paste-button" onClick={handlePaste}>
                  📋 {t('shortcuts.paste')}
                </button>
              </div>
              <p className="upload-hint">{t('upload.formats')}</p>
            </div>
          ) : (
            <div className="preview-container">
              <img src={preview} alt="Preview" className="preview-image" />
              <div className="image-info">
                <span>{originalDimensions.width} × {originalDimensions.height}px</span>
                <button className="clear-button" onClick={clearAll}>✕</button>
              </div>
            </div>
          )}
        </div>

        {/* Options Panel */}
        {preview && (
          <div className="options-panel glass">
            {activeTab === 'resize' ? (
              <>
                <h3 className="options-title">{t('resize.settings')}</h3>
                
                {/* Quick Preset Sizes */}
                <div className="option-group">
                  <div className="preset-header">
                    <label className="option-label">{t('resize.preset')}</label>
                    <button 
                      className="preset-expand-btn"
                      onClick={() => setShowPresets(!showPresets)}
                    >
                      {showPresets ? '▲ Hide' : '▼ Show All'}
                    </button>
                  </div>
                  <div className="quick-presets">
                    {PRESET_SIZES.web.map(preset => (
                      <button 
                        key={preset.name}
                        className={`quick-preset-btn ${width === preset.width && height === preset.height ? 'active' : ''}`}
                        onClick={() => applyPreset(preset)}
                        title={`${preset.width}×${preset.height}`}
                      >
                        {preset.icon} {preset.name}
                      </button>
                    ))}
                  </div>
                  {showPresets && (
                    <div className="preset-categories">
                      <div className="preset-category">
                        <span className="category-label">📱 Social Media</span>
                        <div className="category-presets">
                          {PRESET_SIZES.social.map(preset => (
                            <button 
                              key={preset.name}
                              className={`quick-preset-btn ${width === preset.width && height === preset.height ? 'active' : ''}`}
                              onClick={() => applyPreset(preset)}
                              title={`${preset.width}×${preset.height}`}
                            >
                              {preset.icon} {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="preset-category">
                        <span className="category-label">🖥️ Devices</span>
                        <div className="category-presets">
                          {PRESET_SIZES.devices.map(preset => (
                            <button 
                              key={preset.name}
                              className={`quick-preset-btn ${width === preset.width && height === preset.height ? 'active' : ''}`}
                              onClick={() => applyPreset(preset)}
                              title={`${preset.width}×${preset.height}`}
                            >
                              {preset.icon} {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Resize Type Toggle */}
                <div className="option-group">
                  <label className="option-label">{t('resize.type')}</label>
                  <div className="toggle-group">
                    <button 
                      className={`toggle-btn ${resizeType === 'percentage' ? 'active' : ''}`}
                      onClick={() => setResizeType('percentage')}
                    >
                      {t('resize.percentage')}
                    </button>
                    <button 
                      className={`toggle-btn ${resizeType === 'pixels' ? 'active' : ''}`}
                      onClick={() => setResizeType('pixels')}
                    >
                      {t('resize.pixels')}
                    </button>
                  </div>
                </div>

                {resizeType === 'percentage' ? (
                  <div className="option-group">
                    <label className="option-label">
                      {t('resize.percentage')}: {percentage}%
                    </label>
                    <input 
                      type="range" 
                      min="1" 
                      max="200" 
                      value={percentage}
                      onChange={(e) => setPercentage(parseInt(e.target.value))}
                      className="range-slider"
                    />
                    <div className="preset-buttons">
                      {[25, 50, 75, 100, 150, 200].map(p => (
                        <button 
                          key={p}
                          className={`preset-btn ${percentage === p ? 'active' : ''}`}
                          onClick={() => setPercentage(p)}
                        >
                          {p}%
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="option-group">
                    <div className="dimension-inputs">
                      <div className="dimension-input">
                        <label>{t('resize.width')}</label>
                        <input 
                          type="number" 
                          value={width}
                          onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                          min="1"
                        />
                        <span className="unit">px</span>
                      </div>
                      <div className="dimension-link">
                        <button 
                          className={`link-btn ${maintainAspect ? 'active' : ''}`}
                          onClick={() => setMaintainAspect(!maintainAspect)}
                          title={t('resize.maintainAspect')}
                        >
                          {maintainAspect ? '🔗' : '⛓️‍💥'}
                        </button>
                      </div>
                      <div className="dimension-input">
                        <label>{t('resize.height')}</label>
                        <input 
                          type="number" 
                          value={height}
                          onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                          min="1"
                        />
                        <span className="unit">px</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quality Slider */}
                <div className="option-group">
                  <label className="option-label">
                    {t('resize.quality')}: {quality}%
                  </label>
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={quality}
                    onChange={(e) => setQuality(parseInt(e.target.value))}
                    className="range-slider"
                  />
                </div>

                {/* Format Selection */}
                <div className="option-group">
                  <label className="option-label">{t('resize.format')}</label>
                  <div className="format-buttons">
                    {['jpg', 'png', 'webp'].map(f => (
                      <button 
                        key={f}
                        className={`format-btn ${format === f ? 'active' : ''}`}
                        onClick={() => setFormat(f)}
                      >
                        {f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* New Dimensions Preview */}
                <div className="dimensions-preview">
                  <span className="dim-label">{t('resize.newSize')}:</span>
                  <span className="dim-value">{newDimensions.width} × {newDimensions.height}px</span>
                </div>

                {loading && activeTab === 'resize' && (
                  <div className="progress-container">
                    <div className="progress-header">
                      <span className="progress-stage">
                        {progressStage === 'uploading' && `📤 ${t('progress.uploading')}`}
                        {progressStage === 'processing' && `⚙️ ${t('progress.processing')}`}
                        {progressStage === 'downloading' && `📥 ${t('progress.downloading')}`}
                      </span>
                      <span className="progress-percent">{Math.round(progress)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <button 
                  className="process-button"
                  onClick={handleResize}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      {t('progress.processing')}... {Math.round(progress)}%
                    </>
                  ) : (
                    <>
                      <span>📐</span>
                      {t('resize.button')}
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <h3 className="options-title">{t('tabs.upscale')}</h3>
                
                {upscaleError && (
                  <div className="upscale-error">
                    <span className="error-icon">⚠️</span>
                    <p>{upscaleError}</p>
                  </div>
                )}
                
                <div className={`upscale-info ${upscaleError ? 'disabled' : ''}`}>
                  <div className="info-icon">🤖</div>
                  
                  <div className="model-selection">
                    <label>{t('upscale.selectModel')}:</label>
                    <div className="model-buttons">
                      <button
                        className={`model-btn ${upscaleModel === '2x' ? 'active' : ''}`}
                        onClick={() => setUpscaleModel('2x')}
                        disabled={loading}
                      >
                        <div className="model-name">2x</div>
                        <div className="model-uses">
                          {getRemainingUses()} {limits.upscale_2x === -1 ? t('upscale.unlimited') : t('upscale.usesLeft')}
                        </div>
                      </button>
                      <button
                        className={`model-btn ${upscaleModel === '4x' ? 'active' : ''}`}
                        onClick={() => setUpscaleModel('4x')}
                        disabled={loading}
                      >
                        <div className="model-name">4x</div>
                        <div className="model-uses">
                          {upscaleModel === '4x' ? getRemainingUses() : limits.upscale_4x === -1 ? '∞' : (limits.upscale_4x - (usage.upscale_4x || 0))} {limits.upscale_4x === -1 ? t('upscale.unlimited') : t('upscale.usesLeft')}
                        </div>
                      </button>
                    </div>
                  </div>
                  
                  <p>{t('upscale.description', { model: upscaleModel })}</p>
                  <div className="upscale-preview">
                    <div className="preview-box">
                      <span className="preview-label">{t('upscale.current')}</span>
                      <span className="preview-size">{originalDimensions.width} × {originalDimensions.height}</span>
                    </div>
                    <div className="arrow">→</div>
                    <div className="preview-box result">
                      <span className="preview-label">{t('upscale.result')}</span>
                      <span className="preview-size">{originalDimensions.width * (upscaleModel === '2x' ? 2 : 4)} × {originalDimensions.height * (upscaleModel === '2x' ? 2 : 4)}</span>
                    </div>
                  </div>
                  <p className="warning">⚠️ {t('upscale.warning')}</p>
                </div>

                {loading && activeTab === 'upscale' && (
                  <div className="progress-container">
                    <div className="progress-header">
                      <span className="progress-stage">
                        {progressStage === 'uploading' && `📤 ${t('progress.uploading')}`}
                        {progressStage === 'processing' && `🤖 ${t('progress.processing')}`}
                        {progressStage === 'downloading' && `📥 ${t('progress.downloading')}`}
                      </span>
                      <span className="progress-percent">{Math.round(progress)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill upscale"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <button 
                  className={`process-button upscale ${upscaleError ? 'disabled-error' : ''} ${!canUseUpscaleModel() ? 'disabled-limit' : ''}`}
                  onClick={handleUpscale}
                  disabled={loading || !!upscaleError || !canUseUpscaleModel()}
                  title={upscaleError || !canUseUpscaleModel() ? 'No remaining upscales for this model' : `Upscale image ${upscaleModel} using AI`}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      {t('progress.processing')} {upscaleModel}... {Math.round(progress)}%
                    </>
                  ) : upscaleError ? (
                    <>
                      <span>🚫</span>
                      {t('upscale.resolutionError')}
                    </>
                  ) : !canUseUpscaleModel() ? (
                    <>
                      <span>📊</span>
                      {t('upscale.noUses')}
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      {t('upscale.button', { model: upscaleModel })}
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {/* Live Preview */}
        {livePreview && activeTab === 'resize' && !resultImage && (
          <div className="preview-panel glass">
            <div className="preview-header">
              <h3 className="preview-title">👁️ {t('result.livePreview')}</h3>
              <span className="preview-note">{t('result.previewNote')}</span>
            </div>
            <div className="live-preview-container">
              <img src={livePreview} alt="Live Preview" className="live-preview-image" />
            </div>
          </div>
        )}

        {/* Result */}
        {resultImage && (
          <div className="result-panel glass">
            <div className="result-header">
              <h3 className="result-title">✅ {t('result.title')}</h3>
              <button 
                className={`compare-toggle ${showComparison ? 'active' : ''}`}
                onClick={() => setShowComparison(!showComparison)}
              >
                {showComparison ? `🖼️ ${t('result.showResult')}` : `⚖️ ${t('result.compare')}`}
              </button>
            </div>
            
            {showComparison ? (
              <div 
                className="comparison-container"
                onMouseMove={handleComparisonMove}
                onTouchMove={(e) => {
                  const touch = e.touches[0];
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = touch.clientX - rect.left;
                  const percent = (x / rect.width) * 100;
                  setComparisonPosition(Math.min(100, Math.max(0, percent)));
                }}
              >
                <div className="comparison-wrapper">
                  <img src={resultImage} alt="Processed" className="comparison-image" />
                  <div 
                    className="comparison-overlay"
                    style={{ clipPath: `inset(0 ${100 - comparisonPosition}% 0 0)` }}
                  >
                    <img src={preview} alt="Original" className="comparison-image" />
                  </div>
                  <div 
                    className="comparison-slider"
                    style={{ left: `${comparisonPosition}%` }}
                  >
                    <div className="slider-line"></div>
                    <div className="slider-handle">
                      <span>◀ ▶</span>
                    </div>
                  </div>
                </div>
                <div className="comparison-labels">
                  <span>Original</span>
                  <span>Processed</span>
                </div>
              </div>
            ) : (
              <div className="result-image-container">
                <img src={resultImage} alt="Processed" className="result-image" />
              </div>
            )}
            
            <div className="result-actions">
              <button className="download-button" onClick={handleDownload}>
                <span>⬇️</span>
                {t('result.download')}
              </button>
              <button 
                className={`copy-button ${copySuccess ? 'success' : ''}`} 
                onClick={copyToClipboard}
              >
                <span>{copySuccess ? '✓' : '📋'}</span>
                {copySuccess ? t('result.copied') : t('result.copyClipboard')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageProcessor;
