import React, { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import JSZip from 'jszip';
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
          guest: { resize: -1 }, // Unlimited resize for all
          free: { resize: -1 },
          pro: { resize: -1 },
          business: { resize: -1 }
        };
        setLimits(tierLimits[user.subscription_tier] || tierLimits.free);
      } else {
        // Guests get unlimited resize - no need to check usage
        setUsage({ resize: 0 });
        setLimits({ resize: -1 }); // -1 means unlimited
      }
    } catch (err) {
      console.error('Failed to load usage:', err);
      // Default to unlimited on error
      setLimits({ resize: -1 });
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
    <PageShell>
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

      <PageHero
        badge="Free Resize"
        title="Image Resizer"
        subtitle="Resize images to any dimensions with presets, quality control, and batch export."
        right={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setProcessingMode('single')}
              className={`glass-button text-sm text-white ${processingMode === 'single' ? 'ring-1 ring-[#00d4aa]/50' : ''}`}
            >
              Single
            </button>
            <button
              type="button"
              onClick={() => setProcessingMode('batch')}
              className={`glass-button text-sm text-white ${processingMode === 'batch' ? 'ring-1 ring-[#00d4aa]/50' : ''}`}
            >
              Batch
            </button>
          </div>
        }
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
            <span>⚠️</span>
            {error}
          </div>
        )}

        {/* ===== SINGLE MODE ===== */}
        {processingMode === 'single' && (
          <>
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

                <p className="text-xs text-zinc-500 mt-4">JPG, PNG, WebP supported</p>
              </div>
            )}

            {/* Preview & Settings */}
            {preview && !resultImage && (
            <div className="resize-workspace grid lg:grid-cols-2 gap-6">
              {/* Image Preview */}
              <div className="preview-section glass-card p-6">
                <div className="preview-header flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Original</h3>
                  <button className="reset-btn glass-button text-sm text-white" onClick={resetAll}>Remove</button>
                </div>
                <div className="preview-image-container rounded-2xl overflow-hidden border border-white/10 bg-black/20">
                  <img src={preview} alt="Preview" className="preview-image w-full h-auto block" />
                </div>
                <div className="image-info mt-3 flex items-center justify-between text-xs text-zinc-400">
                  <span>{originalDimensions.width} × {originalDimensions.height} px</span>
                  <span>{(file?.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
              
              {/* Settings Panel */}
              <div className="settings-section glass-card p-6">
                <h3 className="text-white font-semibold mb-4">Resize Settings</h3>

                {/* Mode Tabs */}
                <div className="mode-tabs flex items-center gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/10 mb-4">
                  <button
                    className={`mode-tab flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${resizeMode === 'dimensions' ? 'bg-[#00d4aa]/20 text-[#00d4aa]' : 'text-zinc-300 hover:text-white hover:bg-white/[0.04]'}`}
                    onClick={() => setResizeMode('dimensions')}
                  >
                    Dimensions
                  </button>
                  <button 
                    className={`mode-tab flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${resizeMode === 'percentage' ? 'bg-[#00d4aa]/20 text-[#00d4aa]' : 'text-zinc-300 hover:text-white hover:bg-white/[0.04]'}`}
                    onClick={() => setResizeMode('percentage')}
                  >
                    Percent
                  </button>
                  <button 
                    className={`mode-tab flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${resizeMode === 'preset' ? 'bg-[#00d4aa]/20 text-[#00d4aa]' : 'text-zinc-300 hover:text-white hover:bg-white/[0.04]'}`}
                    onClick={() => setResizeMode('preset')}
                  >
                    Presets
                  </button>
                </div>
                
                {/* Dimensions Mode */}
                {resizeMode === 'dimensions' && (
                  <div className="dimensions-input grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                    <div className="input-group">
                      <label className="block text-xs text-zinc-400 mb-1">Width (px)</label>
                      <input
                        className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#00d4aa]/40"
                        type="number"
                        value={width}
                        onChange={(e) => handleWidthChange(e.target.value)}
                        placeholder="Width"
                      />
                    </div>
                    
                    <button 
                      className={`link-btn h-11 w-11 rounded-xl border border-white/10 bg-white/[0.04] text-white grid place-items-center transition-all ${maintainAspectRatio ? 'ring-2 ring-[#00d4aa]/30' : ''}`}
                      onClick={() => setMaintainAspectRatio(!maintainAspectRatio)}
                      title="Maintain aspect ratio"
                      type="button"
                    >
                      {maintainAspectRatio ? '🔗' : '⛓️‍💥'}
                    </button>
                    
                    <div className="input-group">
                      <label className="block text-xs text-zinc-400 mb-1">Height (px)</label>
                      <input
                        className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#00d4aa]/40"
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
                    <div className="percentage-slider flex items-center gap-3">
                      <input
                        className="w-full accent-[#00d4aa]"
                        type="range"
                        min="10" 
                        max="200" 
                        value={percentage}
                        onChange={(e) => setPercentage(parseInt(e.target.value))}
                      />
                      <span className="percentage-value text-sm font-semibold text-white w-16 text-right">{percentage}%</span>
                    </div>
                    <div className="percentage-presets flex flex-wrap gap-2 mt-3">
                      {[25, 50, 75, 100, 150, 200].map(p => (
                        <button 
                          key={p}
                          type="button"
                          className={`preset-btn px-3 py-1.5 rounded-lg text-xs border transition-colors ${percentage === p ? 'bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/30' : 'bg-white/[0.03] text-zinc-300 border-white/10 hover:text-white'}`}
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
                  <div className="presets-grid grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {PRESETS.map((preset) => (
                      <button
                        type="button"
                        key={preset.name}
                        className={`preset-card text-left p-3 rounded-2xl border transition-all ${width == preset.width && height == preset.height ? 'bg-[#00d4aa]/15 border-[#00d4aa]/30' : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.05]'}`}
                        onClick={() => applyPreset(preset)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="preset-icon text-xl">{preset.icon}</span>
                          <span className="preset-name text-sm text-white font-medium">{preset.name}</span>
                        </div>
                        <div className="preset-size text-xs text-zinc-400 mt-1">{preset.width}×{preset.height}</div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Quality & Format */}
                <div className="extra-settings mt-5 pt-5 border-t border-white/10 space-y-4">
                  <div className="setting-row">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-white">Quality</label>
                      <span className="text-sm text-zinc-300">{quality}%</span>
                    </div>
                    <div className="quality-slider mt-2">
                      <input
                        className="w-full accent-[#00d4aa]"
                        type="range"
                        min="10" 
                        max="100" 
                        value={quality}
                        onChange={(e) => setQuality(parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div className="setting-row">
                    <label className="text-sm text-white">Format</label>
                    <div className="format-buttons flex gap-2 mt-2">
                      {['jpeg', 'png', 'webp'].map(fmt => (
                        <button 
                          type="button"
                          key={fmt}
                          className={`format-btn flex-1 px-3 py-2 rounded-xl border text-sm transition-colors ${outputFormat === fmt ? 'bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/30' : 'bg-white/[0.03] text-zinc-300 border-white/10 hover:text-white'}`}
                          onClick={() => setOutputFormat(fmt)}
                        >
                          {fmt.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Output Preview */}
                <div className="output-preview mt-5">
                  <div className="preview-comparison flex items-center justify-between rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                    <div className="size-box original">
                      <div className="size-label text-xs text-zinc-400">Current</div>
                      <div className="size-value text-sm font-semibold text-white">{originalDimensions.width} × {originalDimensions.height}</div>
                    </div>
                    <span className="arrow text-zinc-500">→</span>
                    <div className="size-box result text-right">
                      <div className="size-label text-xs text-zinc-400">Result</div>
                      <div className="size-value text-sm font-semibold text-white">{getOutputDimensions().width} × {getOutputDimensions().height}</div>
                    </div>
                  </div>
                </div>
                
                {/* Error Message */}
                {error && (
                  <div className="error-message mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2">
                    <span>⚠️</span> {error}
                  </div>
                )}
                
                {/* Resize Button */}
                <button 
                  className="resize-btn mt-4 w-full accent-button text-center"
                  onClick={handleResize}
                  disabled={loading || !canResize()}
                  type="button"
                >
                  {loading ? (
                    <span>Processing… {progress}%</span>
                  ) : (
                    <span>Resize to {getOutputDimensions().width} × {getOutputDimensions().height}</span>
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
          {processingMode === 'single' && resultImage && (
            <div className="result-section glass-card p-6">
              <div className="result-header flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Resized</h3>
                <div className="result-actions flex items-center gap-2">
                  <button className="action-btn primary accent-button" onClick={handleDownload} type="button">
                    Download
                  </button>
                  <button className="action-btn secondary glass-button text-white" onClick={resetAll} type="button">
                    Resize Another
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
                <div className="comparison-slider-container">
                  <ImageComparison
                    beforeImage={preview}
                    afterImage={resultImage}
                    beforeLabel={`Original (${originalDimensions.width}×${originalDimensions.height})`}
                    afterLabel={`Resized (${getOutputDimensions().width}×${getOutputDimensions().height})`}
                    className="resize-comparison"
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
                      <div className="text-xs text-zinc-400">Resized</div>
                      <div className="text-sm font-semibold text-white">{getOutputDimensions().width} × {getOutputDimensions().height}</div>
                    </div>
                    <div className="comparison-card-image">
                      <img src={resultImage} alt="Resized" className="w-full h-auto block" />
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
            <div className="batch-section space-y-6">
              {/* Batch Upload Area */}
              <div 
                className={`upload-zone batch-upload glass-card-hover p-8 sm:p-10 text-center ${dragActive ? 'ring-1 ring-[#00d4aa]/60' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleBatchDrop}
              >
                <div className="upload-content">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 text-2xl">
                    📦
                  </div>
                  <h3 className="text-xl font-semibold text-white">Drop multiple images here</h3>
                  <p className="text-zinc-400 mt-1">or click to browse</p>
                  <input
                    ref={batchFileInputRef}
                    type="file" 
                    accept="image/*" 
                    multiple
                    onChange={(e) => handleBatchFiles(e.target.files)}
                    className="file-input hidden"
                  />
                  <button
                    type="button"
                    className="browse-btn accent-button mt-6"
                    onClick={() => batchFileInputRef.current?.click()}
                  >
                    Select Images
                  </button>
                </div>
                <p className="upload-info text-xs text-zinc-500 mt-4">Select multiple files • Supports JPG, PNG, WebP, GIF</p>
              </div>

              {/* Batch Settings */}
              {batchImages.length > 0 && (
                <div className="batch-workspace grid lg:grid-cols-[420px_1fr] gap-6 items-start">
                  <div className="batch-settings-panel glass-card p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-white font-semibold">Batch Settings</h3>
                        <p className="batch-settings-info text-sm text-zinc-400 mt-1">These settings apply to all images</p>
                      </div>
                      <span className="text-xs text-zinc-400">{batchImages.length} files</span>
                    </div>

                    {/* Mode Tabs */}
                    <div className="mode-tabs flex items-center gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/10 mt-4">
                      <button
                        type="button"
                        className={`mode-tab flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${resizeMode === 'dimensions' ? 'bg-[#00d4aa]/20 text-[#00d4aa]' : 'text-zinc-300 hover:text-white hover:bg-white/[0.04]'}`}
                        onClick={() => setResizeMode('dimensions')}
                      >
                        Dimensions
                      </button>
                      <button 
                        type="button"
                        className={`mode-tab flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${resizeMode === 'percentage' ? 'bg-[#00d4aa]/20 text-[#00d4aa]' : 'text-zinc-300 hover:text-white hover:bg-white/[0.04]'}`}
                        onClick={() => setResizeMode('percentage')}
                      >
                        Percent
                      </button>
                    </div>
                    
                    {resizeMode === 'dimensions' && (
                      <div className="dimensions-input batch-dims grid grid-cols-[1fr_auto_1fr] items-end gap-3 mt-4">
                        <div className="input-group">
                          <label className="block text-xs text-zinc-400 mb-1">Width (px)</label>
                          <input
                            className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#00d4aa]/40"
                            type="number"
                            value={width}
                            onChange={(e) => setWidth(e.target.value)}
                            placeholder="Width"
                          />
                        </div>
                        <span className="dims-x text-zinc-500 pb-3">×</span>
                        <div className="input-group">
                          <label className="block text-xs text-zinc-400 mb-1">Height (px)</label>
                          <input
                            className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#00d4aa]/40"
                            type="number"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            placeholder="Height"
                          />
                        </div>
                      </div>
                    )}
                    
                    {resizeMode === 'percentage' && (
                      <div className="percentage-slider batch-percent mt-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-white">Scale</label>
                          <span className="text-sm text-zinc-300">{percentage}%</span>
                        </div>
                        <input
                          className="w-full mt-2 accent-[#00d4aa]"
                          type="range"
                          min="10"
                          max="200"
                          value={percentage}
                          onChange={(e) => setPercentage(parseInt(e.target.value))}
                        />
                      </div>
                    )}
                    
                    {/* Quick Presets */}
                    <div className="batch-presets mt-5 pt-5 border-t border-white/10">
                      <label className="block text-sm text-white mb-2">Quick Presets</label>
                      <div className="preset-buttons grid grid-cols-2 gap-2">
                        {PRESETS.slice(0, 4).map((preset) => (
                          <button 
                            type="button"
                            key={preset.name}
                            className="preset-quick-btn glass-button text-sm text-white px-3 py-2"
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
                    <div className="batch-output-options mt-5 pt-5 border-t border-white/10 space-y-4">
                      <div className="input-group">
                        <label className="block text-sm text-white mb-2">Format</label>
                        <select
                          className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#00d4aa]/40"
                          value={outputFormat}
                          onChange={(e) => setOutputFormat(e.target.value)}
                        >
                          <option value="jpeg">JPEG</option>
                          <option value="png">PNG</option>
                          <option value="webp">WebP</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-white">Quality</label>
                          <span className="text-sm text-zinc-300">{quality}%</span>
                        </div>
                        <input
                          className="w-full mt-2 accent-[#00d4aa]"
                          type="range"
                          min="10"
                          max="100"
                          value={quality}
                          onChange={(e) => setQuality(parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                    
                    {/* Batch Actions */}
                    <div className="batch-actions mt-5 pt-5 border-t border-white/10 space-y-2">
                      <button
                        type="button"
                        className="process-batch-btn w-full accent-button"
                        onClick={processBatch}
                        disabled={batchProcessing || batchImages.length === 0}
                      >
                        {batchProcessing ? (
                          <>Processing {batchProgress.current}/{batchProgress.total}…</>
                        ) : (
                          <>Process {batchImages.length} Images</>
                        )}
                      </button>
                      
                      {batchImages.some(i => i.status === 'done') && (
                        <button 
                          type="button"
                          className="download-all-btn w-full glass-button text-white"
                          onClick={downloadBatchAll}
                        >
                          Download All (ZIP)
                        </button>
                      )}
                      
                      <button 
                        type="button"
                        className="clear-batch-btn w-full glass-button text-white"
                        onClick={clearBatch}
                        disabled={batchProcessing}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  
                  {/* Batch Image List */}
                  <div className="batch-images-list glass-card p-6">
                    <div className="batch-list-header flex items-center justify-between mb-4">
                      <h4 className="text-white font-semibold">{batchImages.length} Images</h4>
                      <span className="batch-stats text-sm text-zinc-400">
                        {batchImages.filter(i => i.status === 'done').length} completed
                      </span>
                    </div>
                    
                    <div className="batch-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {batchImages.map((img) => (
                        <div key={img.id} className={`batch-image-card ${img.status} rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03]`}>
                          <div className="batch-thumb relative">
                            <img src={img.preview} alt={img.name} className="w-full h-44 object-cover" />
                            {img.status === 'processing' && (
                              <div className="batch-overlay processing absolute inset-0 bg-black/50 grid place-items-center text-white">
                                <div className="mini-spinner animate-spin rounded-full border-2 border-white/20 border-t-white h-6 w-6"></div>
                                <span className="mt-2 text-sm">{img.progress}%</span>
                              </div>
                            )}
                            {img.status === 'done' && (
                              <div className="batch-overlay done absolute top-3 right-3 w-8 h-8 rounded-xl bg-[#00d4aa] text-black grid place-items-center">
                                ✓
                              </div>
                            )}
                            {img.status === 'error' && (
                              <div className="batch-overlay error absolute top-3 right-3 w-8 h-8 rounded-xl bg-red-500/80 text-white grid place-items-center">
                                ✕
                              </div>
                            )}
                          </div>
                          
                          <div className="batch-card-info p-4">
                            <div className="batch-card-name text-sm font-medium text-white truncate" title={img.name}>
                              {img.name}
                            </div>
                            <div className="batch-card-meta text-xs text-zinc-400 mt-1">
                              {img.dimensions.width}×{img.dimensions.height} • {formatFileSize(img.size)}
                            </div>
                          </div>
                          
                          <div className="batch-card-actions px-4 pb-4 flex items-center justify-end gap-2">
                            {img.status === 'done' && (
                              <button 
                                type="button"
                                className="batch-card-btn download glass-button text-white px-3 py-2"
                                onClick={() => downloadSingleBatch(img)}
                                title="Download"
                              >
                                Download
                              </button>
                            )}
                            <button 
                              type="button"
                              className="batch-card-btn remove glass-button text-white px-3 py-2"
                              onClick={() => removeBatchImage(img.id)}
                              disabled={batchProcessing}
                              title="Remove"
                            >
                              Remove
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
    </PageShell>
  );
};

export default ResizePage;
