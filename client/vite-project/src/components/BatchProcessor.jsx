import React, { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import JSZip from 'jszip';
import './BatchProcessor.css';

const API_URL = '';

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

// Preset sizes for quick selection
const PRESET_SIZES = {
  social: [
    { name: 'Instagram Post', width: 1080, height: 1080, icon: '📸' },
    { name: 'Instagram Story', width: 1080, height: 1920, icon: '📱' },
    { name: 'Facebook Cover', width: 820, height: 312, icon: '🌐' },
    { name: 'Twitter Post', width: 1200, height: 675, icon: '🐦' },
    { name: 'LinkedIn Banner', width: 1584, height: 396, icon: '💼' },
    { name: 'YouTube Thumbnail', width: 1280, height: 720, icon: '▶️' },
  ],
  devices: [
    { name: 'Desktop HD', width: 1920, height: 1080, icon: '🖥️' },
    { name: 'Desktop 4K', width: 3840, height: 2160, icon: '🖥️' },
    { name: 'Mobile Portrait', width: 1080, height: 1920, icon: '📱' },
    { name: 'Tablet', width: 1024, height: 768, icon: '📱' },
  ],
  web: [
    { name: 'Thumbnail', width: 150, height: 150, icon: '🖼️' },
    { name: 'Small', width: 320, height: 240, icon: '🖼️' },
    { name: 'Medium', width: 800, height: 600, icon: '🖼️' },
    { name: 'Large', width: 1200, height: 900, icon: '🖼️' },
  ]
};

const BatchProcessor = ({ isOpen, onClose }) => {
  const [images, setImages] = useState([]);
  const [globalSettings, setGlobalSettings] = useState({
    resizeType: 'percentage',
    percentage: 50,
    width: 800,
    height: 600,
    maintainAspect: true,
    quality: 85,
    format: 'jpg'
  });
  const [processing, setProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [presetCategory, setPresetCategory] = useState('social');
  const fileInputRef = useRef(null);

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
    
    if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFiles = (files) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    const newImages = imageFiles.map(file => {
      const id = Date.now() + Math.random().toString(36).substr(2, 9);
      const preview = URL.createObjectURL(file);
      
      // Get dimensions
      const img = new Image();
      img.src = preview;
      
      return {
        id,
        file,
        preview,
        name: file.name,
        size: file.size,
        dimensions: { width: 0, height: 0 },
        useCustomSettings: false,
        customSettings: { ...globalSettings },
        status: 'pending', // pending, processing, done, error
        result: null,
        progress: 0
      };
    });

    // Load dimensions for each image
    newImages.forEach((imgData, index) => {
      const img = new Image();
      img.onload = () => {
        setImages(prev => prev.map(item => 
          item.id === imgData.id 
            ? { 
                ...item, 
                dimensions: { width: img.width, height: img.height },
                customSettings: {
                  ...item.customSettings,
                  width: img.width,
                  height: img.height
                }
              } 
            : item
        ));
      };
      img.src = imgData.preview;
    });

    setImages(prev => [...prev, ...newImages]);
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const toggleCustomSettings = (id) => {
    setImages(prev => prev.map(img => 
      img.id === id 
        ? { ...img, useCustomSettings: !img.useCustomSettings }
        : img
    ));
  };

  const updateImageSettings = (id, settings) => {
    setImages(prev => prev.map(img => 
      img.id === id 
        ? { ...img, customSettings: { ...img.customSettings, ...settings } }
        : img
    ));
  };

  const applyPreset = (preset, imageId = null) => {
    if (imageId) {
      // Apply to specific image
      updateImageSettings(imageId, {
        resizeType: 'pixels',
        width: preset.width,
        height: preset.height
      });
    } else {
      // Apply to global settings
      setGlobalSettings(prev => ({
        ...prev,
        resizeType: 'pixels',
        width: preset.width,
        height: preset.height
      }));
    }
    setShowPresets(false);
  };

  const processImages = async () => {
    setProcessing(true);
    setProcessedCount(0);

    const zip = new JSZip();
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const settings = img.useCustomSettings ? img.customSettings : globalSettings;
      
      setImages(prev => prev.map(item => 
        item.id === img.id ? { ...item, status: 'processing' } : item
      ));

      try {
        const formData = new FormData();
        formData.append('image', img.file);
        formData.append('resizeType', settings.resizeType);
        formData.append('percentage', settings.percentage);
        formData.append('width', settings.width);
        formData.append('height', settings.height);
        formData.append('maintainAspect', settings.maintainAspect);
        formData.append('quality', settings.quality);
        formData.append('format', settings.format);

        const response = await api.post('/resize', formData, {
          responseType: 'blob',
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setImages(prev => prev.map(item => 
              item.id === img.id ? { ...item, progress: percent * 0.5 } : item
            ));
          },
          onDownloadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setImages(prev => prev.map(item => 
                item.id === img.id ? { ...item, progress: 50 + percent * 0.5 } : item
              ));
            }
          }
        });

        const resultUrl = URL.createObjectURL(response.data);
        const fileName = img.name.replace(/\.[^/.]+$/, '') + `_resized.${settings.format}`;
        
        // Add to zip
        const arrayBuffer = await response.data.arrayBuffer();
        zip.file(fileName, arrayBuffer);

        setImages(prev => prev.map(item => 
          item.id === img.id 
            ? { ...item, status: 'done', result: resultUrl, progress: 100 } 
            : item
        ));
        setProcessedCount(prev => prev + 1);

      } catch (error) {
        console.error('Error processing image:', error);
        setImages(prev => prev.map(item => 
          item.id === img.id ? { ...item, status: 'error', progress: 0 } : item
        ));
      }
    }

    setProcessing(false);
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    
    for (const img of images.filter(i => i.status === 'done')) {
      const response = await fetch(img.result);
      const blob = await response.blob();
      const settings = img.useCustomSettings ? img.customSettings : globalSettings;
      const fileName = img.name.replace(/\.[^/.]+$/, '') + `_resized.${settings.format}`;
      zip.file(fileName, blob);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'batch_processed_images.zip';
    link.click();
  };

  const downloadSingle = (img) => {
    if (!img.result) return;
    const settings = img.useCustomSettings ? img.customSettings : globalSettings;
    const link = document.createElement('a');
    link.href = img.result;
    link.download = img.name.replace(/\.[^/.]+$/, '') + `_resized.${settings.format}`;
    link.click();
  };

  const clearAll = () => {
    images.forEach(img => {
      if (img.preview) URL.revokeObjectURL(img.preview);
      if (img.result) URL.revokeObjectURL(img.result);
    });
    setImages([]);
    setProcessedCount(0);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (!isOpen) return null;

  return (
    <div className="batch-overlay" onClick={onClose}>
      <div className="batch-modal" onClick={e => e.stopPropagation()}>
        <div className="batch-header">
          <h2>📦 Batch Processing</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="batch-content">
          {/* Left Panel - Image List */}
          <div className="batch-images-panel">
            <div 
              className={`batch-upload-area ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="upload-icon">📁</span>
              <p>Drop images here or click to browse</p>
              <span className="upload-hint">Select multiple files</span>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handleFileChange}
                hidden 
              />
            </div>

            {images.length > 0 && (
              <div className="batch-image-list">
                {images.map((img, index) => (
                  <div key={img.id} className={`batch-image-item ${img.status}`}>
                    <div className="image-preview-thumb">
                      <img src={img.preview} alt={img.name} />
                      {img.status === 'processing' && (
                        <div className="processing-overlay">
                          <div className="mini-spinner"></div>
                        </div>
                      )}
                      {img.status === 'done' && (
                        <div className="done-overlay">✓</div>
                      )}
                      {img.status === 'error' && (
                        <div className="error-overlay">✕</div>
                      )}
                    </div>
                    
                    <div className="image-info">
                      <span className="image-name" title={img.name}>
                        {img.name.length > 20 ? img.name.substring(0, 20) + '...' : img.name}
                      </span>
                      <span className="image-meta">
                        {img.dimensions.width}×{img.dimensions.height} • {formatFileSize(img.size)}
                      </span>
                      
                      {img.status === 'processing' && (
                        <div className="mini-progress">
                          <div className="mini-progress-fill" style={{ width: `${img.progress}%` }}></div>
                        </div>
                      )}
                    </div>

                    <div className="image-actions">
                      <button 
                        className={`custom-toggle ${img.useCustomSettings ? 'active' : ''}`}
                        onClick={() => toggleCustomSettings(img.id)}
                        title={img.useCustomSettings ? 'Using custom settings' : 'Using global settings'}
                      >
                        {img.useCustomSettings ? '⚙️' : '🔗'}
                      </button>
                      {img.status === 'done' && (
                        <button 
                          className="download-single-btn"
                          onClick={() => downloadSingle(img)}
                          title="Download"
                        >
                          ⬇️
                        </button>
                      )}
                      <button 
                        className="remove-btn"
                        onClick={() => removeImage(img.id)}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Custom Settings Panel */}
                    {img.useCustomSettings && (
                      <div className="custom-settings-panel">
                        <div className="custom-settings-row">
                          <label>Size:</label>
                          <input 
                            type="number" 
                            value={img.customSettings.width}
                            onChange={(e) => updateImageSettings(img.id, { 
                              width: parseInt(e.target.value) || 0,
                              resizeType: 'pixels'
                            })}
                            className="small-input"
                          />
                          <span>×</span>
                          <input 
                            type="number" 
                            value={img.customSettings.height}
                            onChange={(e) => updateImageSettings(img.id, { 
                              height: parseInt(e.target.value) || 0,
                              resizeType: 'pixels'
                            })}
                            className="small-input"
                          />
                        </div>
                        <div className="custom-settings-row">
                          <label>Quality:</label>
                          <input 
                            type="range" 
                            min="1" 
                            max="100" 
                            value={img.customSettings.quality}
                            onChange={(e) => updateImageSettings(img.id, { quality: parseInt(e.target.value) })}
                            className="small-range"
                          />
                          <span>{img.customSettings.quality}%</span>
                        </div>
                        <div className="custom-settings-row">
                          <label>Format:</label>
                          <select 
                            value={img.customSettings.format}
                            onChange={(e) => updateImageSettings(img.id, { format: e.target.value })}
                            className="small-select"
                          >
                            <option value="jpg">JPG</option>
                            <option value="png">PNG</option>
                            <option value="webp">WebP</option>
                          </select>
                        </div>
                        <div className="preset-quick-btns">
                          {PRESET_SIZES.web.slice(0, 3).map(preset => (
                            <button 
                              key={preset.name}
                              className="mini-preset-btn"
                              onClick={() => applyPreset(preset, img.id)}
                            >
                              {preset.icon} {preset.width}×{preset.height}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel - Global Settings */}
          <div className="batch-settings-panel">
            <h3>Global Settings</h3>
            <p className="settings-hint">Applied to images without custom settings</p>

            {/* Preset Sizes */}
            <div className="preset-section">
              <button 
                className="preset-toggle-btn"
                onClick={() => setShowPresets(!showPresets)}
              >
                📐 Quick Presets {showPresets ? '▲' : '▼'}
              </button>
              
              {showPresets && (
                <div className="preset-dropdown">
                  <div className="preset-tabs">
                    {Object.keys(PRESET_SIZES).map(cat => (
                      <button 
                        key={cat}
                        className={`preset-tab ${presetCategory === cat ? 'active' : ''}`}
                        onClick={() => setPresetCategory(cat)}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="preset-grid">
                    {PRESET_SIZES[presetCategory].map(preset => (
                      <button 
                        key={preset.name}
                        className="preset-item"
                        onClick={() => applyPreset(preset)}
                      >
                        <span className="preset-icon">{preset.icon}</span>
                        <span className="preset-name">{preset.name}</span>
                        <span className="preset-size">{preset.width}×{preset.height}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Resize Type */}
            <div className="setting-group">
              <label>Resize By</label>
              <div className="toggle-buttons">
                <button 
                  className={globalSettings.resizeType === 'percentage' ? 'active' : ''}
                  onClick={() => setGlobalSettings(prev => ({ ...prev, resizeType: 'percentage' }))}
                >
                  Percentage
                </button>
                <button 
                  className={globalSettings.resizeType === 'pixels' ? 'active' : ''}
                  onClick={() => setGlobalSettings(prev => ({ ...prev, resizeType: 'pixels' }))}
                >
                  Pixels
                </button>
              </div>
            </div>

            {globalSettings.resizeType === 'percentage' ? (
              <div className="setting-group">
                <label>Scale: {globalSettings.percentage}%</label>
                <input 
                  type="range" 
                  min="1" 
                  max="200" 
                  value={globalSettings.percentage}
                  onChange={(e) => setGlobalSettings(prev => ({ ...prev, percentage: parseInt(e.target.value) }))}
                />
                <div className="percentage-presets">
                  {[25, 50, 75, 100, 150].map(p => (
                    <button 
                      key={p}
                      className={globalSettings.percentage === p ? 'active' : ''}
                      onClick={() => setGlobalSettings(prev => ({ ...prev, percentage: p }))}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="setting-group">
                <label>Dimensions</label>
                <div className="dimension-inputs">
                  <input 
                    type="number" 
                    value={globalSettings.width}
                    onChange={(e) => setGlobalSettings(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                    placeholder="Width"
                  />
                  <span>×</span>
                  <input 
                    type="number" 
                    value={globalSettings.height}
                    onChange={(e) => setGlobalSettings(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                    placeholder="Height"
                  />
                </div>
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={globalSettings.maintainAspect}
                    onChange={(e) => setGlobalSettings(prev => ({ ...prev, maintainAspect: e.target.checked }))}
                  />
                  Maintain aspect ratio
                </label>
              </div>
            )}

            {/* Quality */}
            <div className="setting-group">
              <label>Quality: {globalSettings.quality}%</label>
              <input 
                type="range" 
                min="1" 
                max="100" 
                value={globalSettings.quality}
                onChange={(e) => setGlobalSettings(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
              />
            </div>

            {/* Format */}
            <div className="setting-group">
              <label>Output Format</label>
              <div className="format-buttons">
                {['jpg', 'png', 'webp'].map(f => (
                  <button 
                    key={f}
                    className={globalSettings.format === f ? 'active' : ''}
                    onClick={() => setGlobalSettings(prev => ({ ...prev, format: f }))}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="batch-actions">
              <div className="batch-stats">
                <span>{images.length} image{images.length !== 1 ? 's' : ''}</span>
                {processedCount > 0 && (
                  <span className="done-count">• {processedCount} done</span>
                )}
              </div>
              
              <button 
                className="process-all-btn"
                onClick={processImages}
                disabled={images.length === 0 || processing}
              >
                {processing ? (
                  <>
                    <span className="spinner"></span>
                    Processing... ({processedCount}/{images.length})
                  </>
                ) : (
                  <>
                    ⚡ Process All
                  </>
                )}
              </button>

              {images.some(i => i.status === 'done') && (
                <button className="download-all-btn" onClick={downloadAll}>
                  📥 Download All as ZIP
                </button>
              )}

              {images.length > 0 && (
                <button className="clear-all-btn" onClick={clearAll}>
                  🗑️ Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchProcessor;
