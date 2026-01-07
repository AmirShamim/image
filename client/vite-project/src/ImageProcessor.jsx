import React, { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import './ImageProcessor.css';
import UserButton from './components/UserButton';

// In development, Vite proxy handles forwarding to backend
// In production, requests go to same origin
const API_URL = '';

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
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('resize'); // 'resize' or 'upscale'
  const [dragActive, setDragActive] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonPosition, setComparisonPosition] = useState(50);
  
  // Progress tracking
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState(''); // 'uploading', 'processing', 'downloading'
  
  // Image dimensions
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  
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
    setLoading(true);
    setProgress(0);
    setProgressStage('uploading');

    const formData = new FormData();
    formData.append('image', file);

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
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="title">
              <span className="title-icon">✨</span>
              Image Studio
            </h1>
            <p className="subtitle">Resize, compress, or upscale your images with ease</p>
          </div>
          <div className="header-right">
            <UserButton />
          </div>
        </div>
      </header>

      {/* Tab Switcher */}
      <div className="tab-container">
        <button 
          className={`tab ${activeTab === 'resize' ? 'active' : ''}`}
          onClick={() => setActiveTab('resize')}
        >
          <span className="tab-icon">📐</span>
          Resize / Shrink
        </button>
        <button 
          className={`tab ${activeTab === 'upscale' ? 'active' : ''}`}
          onClick={() => setActiveTab('upscale')}
        >
          <span className="tab-icon">🚀</span>
          AI Upscale (4x)
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
              <p>Drag & drop your image here</p>
              <span className="upload-or">or</span>
              <label className="upload-button">
                Browse Files
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  hidden 
                />
              </label>
              <p className="upload-hint">Supports JPG, PNG, WebP</p>
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
                <h3 className="options-title">Resize Options</h3>
                
                {/* Resize Type Toggle */}
                <div className="option-group">
                  <label className="option-label">Resize By</label>
                  <div className="toggle-group">
                    <button 
                      className={`toggle-btn ${resizeType === 'percentage' ? 'active' : ''}`}
                      onClick={() => setResizeType('percentage')}
                    >
                      Percentage
                    </button>
                    <button 
                      className={`toggle-btn ${resizeType === 'pixels' ? 'active' : ''}`}
                      onClick={() => setResizeType('pixels')}
                    >
                      Pixels
                    </button>
                  </div>
                </div>

                {resizeType === 'percentage' ? (
                  <div className="option-group">
                    <label className="option-label">
                      Scale: {percentage}%
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
                        <label>Width</label>
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
                          title="Maintain aspect ratio"
                        >
                          {maintainAspect ? '🔗' : '⛓️‍💥'}
                        </button>
                      </div>
                      <div className="dimension-input">
                        <label>Height</label>
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
                    Quality: {quality}%
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
                  <label className="option-label">Output Format</label>
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
                  <span className="dim-label">New size:</span>
                  <span className="dim-value">{newDimensions.width} × {newDimensions.height}px</span>
                </div>

                {loading && activeTab === 'resize' && (
                  <div className="progress-container">
                    <div className="progress-header">
                      <span className="progress-stage">
                        {progressStage === 'uploading' && '📤 Uploading...'}
                        {progressStage === 'processing' && '⚙️ Processing...'}
                        {progressStage === 'downloading' && '📥 Downloading...'}
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
                      Processing... {Math.round(progress)}%
                    </>
                  ) : (
                    <>
                      <span>📐</span>
                      Resize Image
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <h3 className="options-title">AI Upscale</h3>
                <div className="upscale-info">
                  <div className="info-icon">🤖</div>
                  <p>Using EDSR deep learning model to upscale your image by <strong>4x</strong> while preserving details.</p>
                  <div className="upscale-preview">
                    <div className="preview-box">
                      <span className="preview-label">Current</span>
                      <span className="preview-size">{originalDimensions.width} × {originalDimensions.height}</span>
                    </div>
                    <div className="arrow">→</div>
                    <div className="preview-box result">
                      <span className="preview-label">Result</span>
                      <span className="preview-size">{originalDimensions.width * 4} × {originalDimensions.height * 4}</span>
                    </div>
                  </div>
                  <p className="warning">⚠️ This may take a while for large images</p>
                </div>

                {loading && activeTab === 'upscale' && (
                  <div className="progress-container">
                    <div className="progress-header">
                      <span className="progress-stage">
                        {progressStage === 'uploading' && '📤 Uploading...'}
                        {progressStage === 'processing' && '🤖 AI Processing...'}
                        {progressStage === 'downloading' && '📥 Downloading...'}
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
                  className="process-button upscale"
                  onClick={handleUpscale}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Upscaling... {Math.round(progress)}%
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      Upscale 4x
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
              <h3 className="preview-title">👁️ Live Preview</h3>
              <span className="preview-note">Approximate preview at reduced resolution</span>
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
              <h3 className="result-title">✅ Result</h3>
              <button 
                className={`compare-toggle ${showComparison ? 'active' : ''}`}
                onClick={() => setShowComparison(!showComparison)}
              >
                {showComparison ? '🖼️ Show Result' : '⚖️ Compare'}
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
            
            <button className="download-button" onClick={handleDownload}>
              <span>⬇️</span>
              Download Image
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageProcessor;
