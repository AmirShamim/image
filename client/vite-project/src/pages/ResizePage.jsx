import React, { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import JSZip from 'jszip';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import ImageComparison from '../components/ImageComparison';
import { useAuth } from '../context/AuthContext';
import { getGuestUsage } from '../services/auth';
import { getOrCreateFingerprint } from '../utils/fingerprint';
import './ResizePage.css';

const API_URL = '';

const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const ResizePage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const batchFileInputRef = useRef(null);
  
  // Mode: single or batch
  const [processingMode, setProcessingMode] = useState('single'); // 'single' or 'batch'
  
  // File state (single mode)
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  // Batch mode state
  const [batchImages, setBatchImages] = useState([]);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  
  // Resize settings
  const [resizeMode, setResizeMode] = useState('dimensions'); // dimensions, percentage, preset
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [percentage, setPercentage] = useState(50);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [quality, setQuality] = useState(90);
  const [outputFormat, setOutputFormat] = useState('jpeg');
  
  // Image dimensions
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const aspectRatio = originalDimensions.width / originalDimensions.height;
  
  // Comparison slider view
  const [showComparison, setShowComparison] = useState(true);

  // Usage tracking
  const [usage, setUsage] = useState({ resize: 0 });
  const [limits, setLimits] = useState({ resize: 50 });
  
  // Presets
  const PRESETS = [
    { name: 'Instagram Post', width: 1080, height: 1080, icon: '📸' },
    { name: 'Instagram Story', width: 1080, height: 1920, icon: '📱' },
    { name: 'Facebook Cover', width: 820, height: 312, icon: '📘' },
    { name: 'Twitter Header', width: 1500, height: 500, icon: '🐦' },
    { name: 'YouTube Thumbnail', width: 1280, height: 720, icon: '📺' },
    { name: 'HD 1080p', width: 1920, height: 1080, icon: '🖥️' },
    { name: '4K UHD', width: 3840, height: 2160, icon: '📽️' },
    { name: 'Passport Photo', width: 600, height: 600, icon: '🪪' },
  ];
  
  useEffect(() => {
    loadUsageData();
  }, [user]);
  
  const loadUsageData = async () => {
    try {
      if (user) {
        if (user.usage) setUsage(user.usage);
        const tierLimits = {
          guest: { resize: 20 },
          free: { resize: 50 },
          pro: { resize: -1 },
          business: { resize: -1 }
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
  
  const canResize = () => {
    const limit = limits.resize;
    const used = usage.resize || 0;
    if (limit === -1) return true;
    return used < limit;
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
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
        setWidth(img.width.toString());
        setHeight(img.height.toString());
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(selectedFile);
  };
  
  const handleWidthChange = (value) => {
    setWidth(value);
    if (maintainAspectRatio && value && aspectRatio) {
      setHeight(Math.round(parseInt(value) / aspectRatio).toString());
    }
  };
  
  const handleHeightChange = (value) => {
    setHeight(value);
    if (maintainAspectRatio && value && aspectRatio) {
      setWidth(Math.round(parseInt(value) * aspectRatio).toString());
    }
  };
  
  const applyPreset = (preset) => {
    setWidth(preset.width.toString());
    setHeight(preset.height.toString());
    setMaintainAspectRatio(false);
  };
  
  const getOutputDimensions = () => {
    if (resizeMode === 'percentage') {
      return {
        width: Math.round(originalDimensions.width * percentage / 100),
        height: Math.round(originalDimensions.height * percentage / 100)
      };
    }
    return {
      width: parseInt(width) || originalDimensions.width,
      height: parseInt(height) || originalDimensions.height
    };
  };
  
  const handleResize = async () => {
    if (!file) return;
    
    if (!canResize()) {
      setError('Daily resize limit reached. Upgrade for more!');
      return;
    }
    
    setLoading(true);
    setProgress(0);
    setError('');
    
    const outputDims = getOutputDimensions();
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('resizeType', resizeMode === 'percentage' ? 'percentage' : 'pixels');
    formData.append('width', outputDims.width);
    formData.append('height', outputDims.height);
    formData.append('percentage', percentage);
    formData.append('maintainAspect', maintainAspectRatio);
    formData.append('quality', quality);
    formData.append('format', outputFormat);
    if (!user) {
      formData.append('fingerprint', getOrCreateFingerprint());
    }
    
    try {
      const response = await api.post('/resize', formData, {
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
      console.error('Error resizing image', err);
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
    const dims = getOutputDimensions();
    link.download = `resized_${dims.width}x${dims.height}_${file?.name || 'image.jpg'}`;
    link.click();
  };
  
  const resetAll = () => {
    setFile(null);
    setPreview(null);
    setResultImage(null);
    setError('');
    setWidth('');
    setHeight('');
    setOriginalDimensions({ width: 0, height: 0 });
  };

  // ===== BATCH PROCESSING FUNCTIONS =====
  
  const handleBatchFiles = (files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    const newImages = imageFiles.map(file => {
      const id = Date.now() + Math.random().toString(36).substr(2, 9);
      const previewUrl = URL.createObjectURL(file);
      
      return {
        id,
        file,
        preview: previewUrl,
        name: file.name,
        size: file.size,
        dimensions: { width: 0, height: 0 },
        status: 'pending',
        result: null,
        progress: 0
      };
    });

    // Load dimensions for each image
    newImages.forEach((imgData) => {
      const img = new Image();
      img.onload = () => {
        setBatchImages(prev => prev.map(item => 
          item.id === imgData.id 
            ? { ...item, dimensions: { width: img.width, height: img.height } } 
            : item
        ));
      };
      img.src = imgData.preview;
    });

    setBatchImages(prev => [...prev, ...newImages]);
  };

  const handleBatchDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleBatchFiles(e.dataTransfer.files);
    }
  }, []);

  const removeBatchImage = (id) => {
    setBatchImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img?.preview) URL.revokeObjectURL(img.preview);
      if (img?.result) URL.revokeObjectURL(img.result);
      return prev.filter(i => i.id !== id);
    });
  };

  const clearBatch = () => {
    batchImages.forEach(img => {
      if (img.preview) URL.revokeObjectURL(img.preview);
      if (img.result) URL.revokeObjectURL(img.result);
    });
    setBatchImages([]);
    setBatchProgress({ current: 0, total: 0 });
  };

  const processBatch = async () => {
    if (batchImages.length === 0) return;
    
    setBatchProcessing(true);
    setBatchProgress({ current: 0, total: batchImages.length });

    for (let i = 0; i < batchImages.length; i++) {
      const img = batchImages[i];
      
      setBatchImages(prev => prev.map(item => 
        item.id === img.id ? { ...item, status: 'processing' } : item
      ));

      try {
        const formData = new FormData();
        formData.append('image', img.file);
        
        // Calculate output dimensions
        let outWidth, outHeight;
        if (resizeMode === 'percentage') {
          outWidth = Math.round(img.dimensions.width * percentage / 100);
          outHeight = Math.round(img.dimensions.height * percentage / 100);
        } else if (width && height) {
          outWidth = parseInt(width);
          outHeight = parseInt(height);
        } else {
          outWidth = img.dimensions.width;
          outHeight = img.dimensions.height;
        }
        
        formData.append('resizeType', resizeMode === 'percentage' ? 'percentage' : 'pixels');
        formData.append('width', outWidth);
        formData.append('height', outHeight);
        formData.append('percentage', percentage);
        formData.append('maintainAspect', 'false'); // Batch uses exact dimensions
        formData.append('quality', quality);
        formData.append('format', outputFormat);
        if (!user) {
          formData.append('fingerprint', getOrCreateFingerprint());
        }

        const response = await api.post('/resize', formData, {
          responseType: 'blob',
          onUploadProgress: (e) => {
            const percent = Math.round((e.loaded * 50) / e.total);
            setBatchImages(prev => prev.map(item => 
              item.id === img.id ? { ...item, progress: percent } : item
            ));
          }
        });

        const resultUrl = URL.createObjectURL(response.data);
        
        setBatchImages(prev => prev.map(item => 
          item.id === img.id 
            ? { ...item, status: 'done', result: resultUrl, progress: 100 } 
            : item
        ));
        
        setBatchProgress(prev => ({ ...prev, current: prev.current + 1 }));

      } catch (error) {
        console.error('Error processing image:', error);
        setBatchImages(prev => prev.map(item => 
          item.id === img.id ? { ...item, status: 'error', progress: 0 } : item
        ));
        setBatchProgress(prev => ({ ...prev, current: prev.current + 1 }));
      }
    }

    setBatchProcessing(false);
    await loadUsageData();
  };

  const downloadBatchAll = async () => {
    const doneImages = batchImages.filter(i => i.status === 'done' && i.result);
    if (doneImages.length === 0) return;

    const zip = new JSZip();
    
    for (const img of doneImages) {
      try {
        const response = await fetch(img.result);
        const blob = await response.blob();
        const fileName = img.name.replace(/\.[^/.]+$/, '') + `_resized.${outputFormat}`;
        zip.file(fileName, blob);
      } catch (err) {
        console.error('Error adding to zip:', err);
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'batch_resized_images.zip';
    link.click();
  };

  const downloadSingleBatch = (img) => {
    if (!img.result) return;
    const link = document.createElement('a');
    link.href = img.result;
    link.download = img.name.replace(/\.[^/.]+$/, '') + `_resized.${outputFormat}`;
    link.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="resize-page">
      <SEO 
        title="Free Image Resizer - Resize for Social Media & Web | ImageStudio"
        description="Resize images to exact dimensions for Instagram, YouTube, Facebook, Twitter. Batch processing, custom sizes, social media presets. Free, no signup."
        keywords="image resizer, resize image online, Instagram size, YouTube thumbnail, Facebook cover, social media image dimensions"
        path="/resize"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to Resize Images Online",
          "description": "Resize images to any dimension using ImageStudio's free online tool",
          "step": [
            {"@type": "HowToStep", "name": "Upload Image", "text": "Drag and drop or click to upload your image"},
            {"@type": "HowToStep", "name": "Select Dimensions", "text": "Choose from presets or enter custom width and height"},
            {"@type": "HowToStep", "name": "Download", "text": "Click resize and download your perfectly sized image"}
          ]
        }}
      />
      <Header />
      
      <main className="resize-main">
        <div className="resize-container">
          {/* Hero Section */}
          <div className="resize-hero">
            <h1>📐 Image Resizer</h1>
            <p>Resize your images to any dimension. Perfect for social media, websites, or printing.</p>
            
            {/* Mode Toggle */}
            <div className="processing-mode-toggle">
              <button 
                className={`mode-toggle-btn ${processingMode === 'single' ? 'active' : ''}`}
                onClick={() => setProcessingMode('single')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                Single Image
              </button>
              <button 
                className={`mode-toggle-btn ${processingMode === 'batch' ? 'active' : ''}`}
                onClick={() => setProcessingMode('batch')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
                Batch Process
              </button>
            </div>
          </div>
          
          {error && (
            <div className="error-message">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {error}
            </div>
          )}

          {/* ===== SINGLE MODE ===== */}
          {processingMode === 'single' && (
            <>
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
                    <div className="upload-icon">📤</div>
                    <h3>Drop your image here</h3>
                    <p>or click to browse</p>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileInput}
                      className="file-input"
                    />
                    <button className="browse-btn">Select Image</button>
                  </div>
                  <p className="upload-info">Supports JPG, PNG, WebP, GIF • Max 25MB</p>
                </div>
              )}
          
              {/* Preview & Settings */}
              {preview && !resultImage && (
            <div className="resize-workspace">
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
                <h3>⚙️ Resize Settings</h3>
                
                {/* Mode Tabs */}
                <div className="mode-tabs">
                  <button 
                    className={`mode-tab ${resizeMode === 'dimensions' ? 'active' : ''}`}
                    onClick={() => setResizeMode('dimensions')}
                  >
                    📏 Dimensions
                  </button>
                  <button 
                    className={`mode-tab ${resizeMode === 'percentage' ? 'active' : ''}`}
                    onClick={() => setResizeMode('percentage')}
                  >
                    📊 Percentage
                  </button>
                  <button 
                    className={`mode-tab ${resizeMode === 'preset' ? 'active' : ''}`}
                    onClick={() => setResizeMode('preset')}
                  >
                    📱 Presets
                  </button>
                </div>
                
                {/* Dimensions Mode */}
                {resizeMode === 'dimensions' && (
                  <div className="dimensions-input">
                    <div className="input-group">
                      <label>Width (px)</label>
                      <input 
                        type="number" 
                        value={width}
                        onChange={(e) => handleWidthChange(e.target.value)}
                        placeholder="Width"
                      />
                    </div>
                    
                    <button 
                      className={`link-btn ${maintainAspectRatio ? 'active' : ''}`}
                      onClick={() => setMaintainAspectRatio(!maintainAspectRatio)}
                      title="Maintain aspect ratio"
                    >
                      {maintainAspectRatio ? '🔗' : '⛓️‍💥'}
                    </button>
                    
                    <div className="input-group">
                      <label>Height (px)</label>
                      <input 
                        type="number" 
                        value={height}
                        onChange={(e) => handleHeightChange(e.target.value)}
                        placeholder="Height"
                      />
                    </div>
                  </div>
                )}
                
                {/* Percentage Mode */}
                {resizeMode === 'percentage' && (
                  <div className="percentage-input">
                    <div className="percentage-slider">
                      <input 
                        type="range" 
                        min="10" 
                        max="200" 
                        value={percentage}
                        onChange={(e) => setPercentage(parseInt(e.target.value))}
                      />
                      <span className="percentage-value">{percentage}%</span>
                    </div>
                    <div className="percentage-presets">
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
                )}
                
                {/* Presets Mode */}
                {resizeMode === 'preset' && (
                  <div className="presets-grid">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        className={`preset-card ${width == preset.width && height == preset.height ? 'active' : ''}`}
                        onClick={() => applyPreset(preset)}
                      >
                        <span className="preset-icon">{preset.icon}</span>
                        <span className="preset-name">{preset.name}</span>
                        <span className="preset-size">{preset.width}×{preset.height}</span>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Quality & Format */}
                <div className="extra-settings">
                  <div className="setting-row">
                    <label>Quality</label>
                    <div className="quality-slider">
                      <input 
                        type="range" 
                        min="10" 
                        max="100" 
                        value={quality}
                        onChange={(e) => setQuality(parseInt(e.target.value))}
                      />
                      <span>{quality}%</span>
                    </div>
                  </div>
                  
                  <div className="setting-row">
                    <label>Format</label>
                    <div className="format-buttons">
                      {['jpeg', 'png', 'webp'].map(fmt => (
                        <button 
                          key={fmt}
                          className={`format-btn ${outputFormat === fmt ? 'active' : ''}`}
                          onClick={() => setOutputFormat(fmt)}
                        >
                          {fmt.toUpperCase()}
                        </button>
                      ))}
                    </div>
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
                      <span className="size-value">{getOutputDimensions().width} × {getOutputDimensions().height}</span>
                    </div>
                  </div>
                </div>
                
                {/* Error Message */}
                {error && (
                  <div className="error-message">
                    <span>⚠️</span> {error}
                  </div>
                )}
                
                {/* Resize Button */}
                <button 
                  className="resize-btn"
                  onClick={handleResize}
                  disabled={loading || !canResize()}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Processing... {progress}%
                    </>
                  ) : (
                    <>
                      📐 Resize to {getOutputDimensions().width} × {getOutputDimensions().height}
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
          {processingMode === 'single' && resultImage && (
            <div className="result-section">
              <div className="result-header">
                <h3>✅ Resized Image</h3>
                <div className="result-actions">
                  <button className="action-btn primary" onClick={handleDownload}>
                    📥 Download
                  </button>
                  <button className="action-btn secondary" onClick={resetAll}>
                    🔄 Resize Another
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
                    afterLabel={`Resized (${getOutputDimensions().width}×${getOutputDimensions().height})`}
                    className="resize-comparison"
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
                      <span className="comparison-badge processed">Resized</span>
                      <span className="comparison-dimensions">{getOutputDimensions().width} × {getOutputDimensions().height}</span>
                    </div>
                    <div className="comparison-card-image">
                      <img src={resultImage} alt="Resized" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Single Mode Presets Showcase */}
          {processingMode === 'single' && !preview && (
            <div className="presets-showcase">
              <h3>Popular Size Presets</h3>
              <div className="showcase-grid">
                {PRESETS.slice(0, 4).map((preset) => (
                  <div key={preset.name} className="showcase-card">
                    <span className="showcase-icon">{preset.icon}</span>
                    <span className="showcase-name">{preset.name}</span>
                    <span className="showcase-size">{preset.width}×{preset.height}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
            </>
          )}

          {/* ===== BATCH MODE ===== */}
          {processingMode === 'batch' && (
            <div className="batch-section">
              {/* Batch Upload Area */}
              <div 
                className={`upload-zone batch-upload ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleBatchDrop}
              >
                <div className="upload-content">
                  <div className="upload-icon">📦</div>
                  <h3>Drop multiple images here</h3>
                  <p>or click to browse</p>
                  <input 
                    ref={batchFileInputRef}
                    type="file" 
                    accept="image/*" 
                    multiple
                    onChange={(e) => handleBatchFiles(e.target.files)}
                    className="file-input"
                  />
                  <button className="browse-btn">Select Images</button>
                </div>
                <p className="upload-info">Select multiple files • Supports JPG, PNG, WebP, GIF</p>
              </div>

              {/* Batch Settings */}
              {batchImages.length > 0 && (
                <div className="batch-workspace">
                  <div className="batch-settings-panel">
                    <h3>⚙️ Batch Settings</h3>
                    <p className="batch-settings-info">These settings apply to all images</p>
                    
                    {/* Mode Tabs */}
                    <div className="mode-tabs">
                      <button 
                        className={`mode-tab ${resizeMode === 'dimensions' ? 'active' : ''}`}
                        onClick={() => setResizeMode('dimensions')}
                      >
                        📏 Dimensions
                      </button>
                      <button 
                        className={`mode-tab ${resizeMode === 'percentage' ? 'active' : ''}`}
                        onClick={() => setResizeMode('percentage')}
                      >
                        📊 Percentage
                      </button>
                    </div>
                    
                    {resizeMode === 'dimensions' && (
                      <div className="dimensions-input batch-dims">
                        <div className="input-group">
                          <label>Width (px)</label>
                          <input 
                            type="number" 
                            value={width}
                            onChange={(e) => setWidth(e.target.value)}
                            placeholder="Width"
                          />
                        </div>
                        <span className="dims-x">×</span>
                        <div className="input-group">
                          <label>Height (px)</label>
                          <input 
                            type="number" 
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            placeholder="Height"
                          />
                        </div>
                      </div>
                    )}
                    
                    {resizeMode === 'percentage' && (
                      <div className="percentage-slider batch-percent">
                        <label>Scale: {percentage}%</label>
                        <input 
                          type="range"
                          min="10"
                          max="200"
                          value={percentage}
                          onChange={(e) => setPercentage(parseInt(e.target.value))}
                        />
                      </div>
                    )}
                    
                    {/* Quick Presets */}
                    <div className="batch-presets">
                      <label>Quick Presets</label>
                      <div className="preset-buttons">
                        {PRESETS.slice(0, 4).map((preset) => (
                          <button 
                            key={preset.name}
                            className="preset-quick-btn"
                            onClick={() => {
                              setWidth(preset.width.toString());
                              setHeight(preset.height.toString());
                              setResizeMode('dimensions');
                            }}
                          >
                            {preset.icon} {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Output Options */}
                    <div className="batch-output-options">
                      <div className="input-group">
                        <label>Format</label>
                        <select 
                          value={outputFormat} 
                          onChange={(e) => setOutputFormat(e.target.value)}
                        >
                          <option value="jpeg">JPEG</option>
                          <option value="png">PNG</option>
                          <option value="webp">WebP</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label>Quality: {quality}%</label>
                        <input 
                          type="range"
                          min="10"
                          max="100"
                          value={quality}
                          onChange={(e) => setQuality(parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                    
                    {/* Batch Actions */}
                    <div className="batch-actions">
                      <button 
                        className="process-batch-btn"
                        onClick={processBatch}
                        disabled={batchProcessing || batchImages.length === 0}
                      >
                        {batchProcessing ? (
                          <>Processing {batchProgress.current}/{batchProgress.total}...</>
                        ) : (
                          <>🚀 Process {batchImages.length} Images</>
                        )}
                      </button>
                      
                      {batchImages.some(i => i.status === 'done') && (
                        <button 
                          className="download-all-btn"
                          onClick={downloadBatchAll}
                        >
                          📥 Download All (ZIP)
                        </button>
                      )}
                      
                      <button 
                        className="clear-batch-btn"
                        onClick={clearBatch}
                        disabled={batchProcessing}
                      >
                        🗑️ Clear All
                      </button>
                    </div>
                  </div>
                  
                  {/* Batch Image List */}
                  <div className="batch-images-list">
                    <div className="batch-list-header">
                      <h4>{batchImages.length} Images</h4>
                      <span className="batch-stats">
                        {batchImages.filter(i => i.status === 'done').length} completed
                      </span>
                    </div>
                    
                    <div className="batch-grid">
                      {batchImages.map((img) => (
                        <div key={img.id} className={`batch-image-card ${img.status}`}>
                          <div className="batch-thumb">
                            <img src={img.preview} alt={img.name} />
                            {img.status === 'processing' && (
                              <div className="batch-overlay processing">
                                <div className="mini-spinner"></div>
                                <span>{img.progress}%</span>
                              </div>
                            )}
                            {img.status === 'done' && (
                              <div className="batch-overlay done">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              </div>
                            )}
                            {img.status === 'error' && (
                              <div className="batch-overlay error">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="18" y1="6" x2="6" y2="18"/>
                                  <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                              </div>
                            )}
                          </div>
                          
                          <div className="batch-card-info">
                            <span className="batch-card-name" title={img.name}>
                              {img.name.length > 20 ? img.name.substring(0, 17) + '...' : img.name}
                            </span>
                            <span className="batch-card-meta">
                              {img.dimensions.width}×{img.dimensions.height} • {formatFileSize(img.size)}
                            </span>
                          </div>
                          
                          <div className="batch-card-actions">
                            {img.status === 'done' && (
                              <button 
                                className="batch-card-btn download"
                                onClick={() => downloadSingleBatch(img)}
                                title="Download"
                              >
                                📥
                              </button>
                            )}
                            <button 
                              className="batch-card-btn remove"
                              onClick={() => removeBatchImage(img.id)}
                              disabled={batchProcessing}
                              title="Remove"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ResizePage;
