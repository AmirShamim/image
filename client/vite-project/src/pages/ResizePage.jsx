import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
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
  
  // File state
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
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
    formData.append('width', outputDims.width);
    formData.append('height', outputDims.height);
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

  return (
    <div className="resize-page">
      <Header />
      
      <main className="resize-main">
        <div className="resize-container">
          {/* Hero Section */}
          <div className="resize-hero">
            <h1>📐 Image Resizer</h1>
            <p>Resize your images to any dimension. Perfect for social media, websites, or printing.</p>
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
          {resultImage && (
            <div className="result-section">
              <div className="result-header">
                <h3>✅ Resized Image</h3>
                <div className="result-actions">
                  <button className="action-btn" onClick={handleDownload}>
                    📥 Download
                  </button>
                  <button className="action-btn secondary" onClick={resetAll}>
                    🔄 Resize Another
                  </button>
                </div>
              </div>
              
              <div className="result-comparison">
                <div className="comparison-item">
                  <h4>Original</h4>
                  <img src={preview} alt="Original" />
                  <span>{originalDimensions.width} × {originalDimensions.height}</span>
                </div>
                <div className="comparison-arrow">→</div>
                <div className="comparison-item">
                  <h4>Resized</h4>
                  <img src={resultImage} alt="Resized" />
                  <span>{getOutputDimensions().width} × {getOutputDimensions().height}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Presets Showcase */}
          {!preview && (
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
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ResizePage;
