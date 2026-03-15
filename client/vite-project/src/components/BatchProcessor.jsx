import React, { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import JSZip from 'jszip';
import ImageComparison from './ImageComparison';
import { useAuth } from '../context/AuthContext';
import {
  incrementProcessingCount,
  canProcessImages,
  getRemainingCount,
  getDailyLimit,
  saveProcessedImages,
  getProcessedImages,
  clearProcessedImages,
  hasCachedImages,
  setBatchInProgress,
  isBatchInProgress,
  blobToBase64,
  setUserTier,
} from '../utils/storageUtils';
import { resizeImageClientSide } from '../utils/imageUtils';
import {
  Camera, Smartphone, Monitor, Tv, Image as ImageIcon, Briefcase,
  Package, X, Save, Download, AlertTriangle, FolderUp,
  Check, XCircle, Settings, Link2, Search, Zap, Trash2, Shield
} from 'lucide-react';

// In production, bypass Vercel proxy by using absolute URL
const API_URL = import.meta.env.PROD ? 'https://image-studio-5yqqy.ondigitalocean.app' : '';

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
    { name: 'Instagram Post', width: 1080, height: 1080, icon: <Camera className="w-4 h-4" /> },
    { name: 'Instagram Story', width: 1080, height: 1920, icon: <Smartphone className="w-4 h-4" /> },
    { name: 'Facebook Cover', width: 820, height: 312, icon: <Monitor className="w-4 h-4" /> },
    { name: 'Twitter Post', width: 1200, height: 675, icon: <Monitor className="w-4 h-4" /> },
    { name: 'LinkedIn Banner', width: 1584, height: 396, icon: <Briefcase className="w-4 h-4" /> },
    { name: 'YouTube Thumbnail', width: 1280, height: 720, icon: <Tv className="w-4 h-4" /> },
  ],
  devices: [
    { name: 'Desktop HD', width: 1920, height: 1080, icon: <Monitor className="w-4 h-4" /> },
    { name: 'Desktop 4K', width: 3840, height: 2160, icon: <Tv className="w-4 h-4" /> },
    { name: 'Mobile Portrait', width: 1080, height: 1920, icon: <Smartphone className="w-4 h-4" /> },
    { name: 'Tablet', width: 1024, height: 768, icon: <Smartphone className="w-4 h-4" /> },
  ],
  web: [
    { name: 'Thumbnail', width: 150, height: 150, icon: <ImageIcon className="w-4 h-4" /> },
    { name: 'Small', width: 320, height: 240, icon: <ImageIcon className="w-4 h-4" /> },
    { name: 'Medium', width: 800, height: 600, icon: <ImageIcon className="w-4 h-4" /> },
    { name: 'Large', width: 1200, height: 900, icon: <ImageIcon className="w-4 h-4" /> },
  ]
};

const BatchProcessor = ({ isOpen, onClose }) => {
  const { user, isAdmin, isPremium, canBypassLimits } = useAuth();
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

  // Rate limiting and caching state
  const [remainingCount, setRemainingCount] = useState(getRemainingCount());
  const [showCachedNotice, setShowCachedNotice] = useState(false);
  const [cachedImages, setCachedImages] = useState([]);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonImage, setComparisonImage] = useState(null);
  const [showCachedView, setShowCachedView] = useState(false);

  // Sync user tier with storage for rate limiting
  useEffect(() => {
    if (user) {
      if (isAdmin) {
        setUserTier('admin');
      } else if (user.subscription_tier === 'enterprise') {
        setUserTier('enterprise');
      } else if (user.subscription_tier === 'pro' || isPremium) {
        setUserTier('pro');
      } else {
        setUserTier('free');
      }
    } else {
      setUserTier('free');
    }
  }, [user, isAdmin, isPremium]);

  // Load cached images and check limits on mount
  useEffect(() => {
    if (!isOpen) return;

    // Use a single batched update to avoid cascading renders
    const initializeState = () => {
      // Admin/Premium users bypass limits
      const remaining = canBypassLimits ? Infinity : getRemainingCount();
      const reachedLimit = canBypassLimits ? false : getRemainingCount() === 0;

      // Batch state updates
      setRemainingCount(remaining);
      setHasReachedLimit(reachedLimit);

      if (hasCachedImages()) {
        const cached = getProcessedImages();
        setCachedImages(cached);
        setShowCachedNotice(true);
      }

      // Check if a batch was interrupted
      if (isBatchInProgress()) {
        setBatchInProgress(false);
      }
    };

    // Use requestAnimationFrame to batch updates outside of effect
    const frameId = requestAnimationFrame(initializeState);
    return () => cancelAnimationFrame(frameId);
  }, [isOpen, canBypassLimits]);

  const handleFiles = useCallback((files) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    const newImages = imageFiles.map(file => {
      const id = Date.now() + Math.random().toString(36).substr(2, 9);
      const preview = URL.createObjectURL(file);

      return {
        id,
        file,
        preview,
        name: file.name,
        size: file.size,
        dimensions: { width: 0, height: 0 },
        useCustomSettings: false,
        customSettings: { ...globalSettings },
        status: 'pending',
        result: null,
        progress: 0
      };
    });

    // Load dimensions for each image
    newImages.forEach((imgData) => {
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
  }, [globalSettings]);

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
  }, [handleFiles]);

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
    // Prevent processing if already in progress
    if (processing) {
      return;
    }

    // Check rate limit before processing (admins/premium users bypass)
    if (!canBypassLimits && !canProcessImages(images.length)) {
      setHasReachedLimit(true);
      alert(`Daily limit reached! You can only process ${getDailyLimit()} images per day. You have ${getRemainingCount()} remaining.`);
      return;
    }

    setProcessing(true);
    setBatchInProgress(true);
    setProcessedCount(0);

    const zip = new JSZip();
    const processedResults = [];

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const settings = img.useCustomSettings ? img.customSettings : globalSettings;

      setImages(prev => prev.map(item =>
        item.id === img.id ? { ...item, status: 'processing' } : item
      ));

      try {
        // Calculate dimensions if using percentage
        let outWidth, outHeight;
        if (settings.resizeType === 'percentage') {
          outWidth = Math.round(img.dimensions.width * settings.percentage / 100);
          outHeight = Math.round(img.dimensions.height * settings.percentage / 100);
        } else {
          outWidth = parseInt(settings.width);
          outHeight = parseInt(settings.height);
        }

        // Simulate progress start
        setImages(prev => prev.map(item =>
          item.id === img.id ? { ...item, progress: 30 } : item
        ));

        const resizedFile = await resizeImageClientSide(img.file, {
          width: outWidth,
          height: outHeight,
          maintainAspectRatio: settings.maintainAspect
        });

        // Simulate progress near end
        setImages(prev => prev.map(item =>
          item.id === img.id ? { ...item, progress: 80 } : item
        ));

        const resultUrl = URL.createObjectURL(resizedFile);
        const fileName = img.name.replace(/\.[^/.]+$/, '') + `_resized.${settings.format}`;

        // Add to zip
        const arrayBuffer = await resizedFile.arrayBuffer();
        zip.file(fileName, arrayBuffer);

        // Convert to base64 for caching
        const base64Data = await blobToBase64(resizedFile);

        processedResults.push({
          id: img.id,
          originalName: img.name,
          originalPreview: img.preview,
          processedBase64: base64Data,
          fileName: fileName,
          timestamp: new Date().toISOString(),
          settings: { ...settings },
        });

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

    // Update rate limit count
    const successfulCount = processedResults.length;
    if (successfulCount > 0) {
      incrementProcessingCount(successfulCount);
      setRemainingCount(getRemainingCount());

      // Save to localStorage for recovery
      saveProcessedImages(processedResults);
      setCachedImages(prev => [...prev, ...processedResults]);
    }

    setProcessing(false);
    setBatchInProgress(false);

    // Check if limit reached after processing
    if (getRemainingCount() === 0) {
      setHasReachedLimit(true);
    }
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

  const clearCachedImages = () => {
    clearProcessedImages();
    setCachedImages([]);
    setShowCachedNotice(false);
  };

  const openComparison = (img) => {
    if (img.preview && img.result) {
      setComparisonImage({
        before: img.preview,
        after: img.result,
        name: img.name,
      });
      setShowComparison(true);
    }
  };

  const closeComparison = () => {
    setShowComparison(false);
    setComparisonImage(null);
  };

  const downloadCachedImage = (cachedImg) => {
    if (!cachedImg.processedBase64) return;
    const link = document.createElement('a');
    link.href = cachedImg.processedBase64;
    link.download = cachedImg.fileName || `processed_${cachedImg.originalName}`;
    link.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[1000] p-4" onClick={onClose}>
      <div className="liquid-panel w-full max-w-[1100px] max-h-[90vh] overflow-hidden flex flex-col shadow-[0_20px_40px_rgba(0,0,0,0.5)] pt-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="flex items-center gap-2 m-0 text-white text-[22px] font-bold font-serif">
              <Package className="w-5 h-5 text-zinc-300" /> Batch Processing
            </h2>
            {canBypassLimits ? (
              <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold tracking-wider uppercase text-emerald-400">
                {isAdmin ? <><Shield className="w-3.5 h-3.5 inline mr-1" /> Admin</> : <><Zap className="w-3.5 h-3.5 inline mr-1 text-yellow-400" /> Premium</>} • Unlimited
              </div>
            ) : (
              <div className={`px-2.5 py-1 rounded-full border text-[11px] font-bold tracking-wider uppercase ${hasReachedLimit ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-white/5 border-white/10 text-zinc-400'}`}>
                {remainingCount}/{getDailyLimit()} remaining today
              </div>
            )}
          </div>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl liquid-button !p-0" onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 p-6 overflow-auto max-h-[calc(90vh-[80px])] custom-scrollbar">
          {/* Left Panel - Image List */}
          <div className="flex flex-col gap-4">
            {/* Cached Images Notice */}
            {showCachedNotice && cachedImages.length > 0 && (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0"><Save className="w-5 h-5" /></span>
                  <div className="flex flex-col">
                    <strong className="text-sm text-blue-100 font-semibold">Previously processed images found!</strong>
                    <span className="text-xs text-blue-200/70">{cachedImages.length} image(s) recovered from your last session</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    className="h-8 px-3 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-semibold hover:bg-blue-500/30 transition-colors"
                    onClick={() => setShowCachedView(!showCachedView)}
                  >
                    {showCachedView ? 'Hide' : 'View'}
                  </button>
                  <button
                    className="h-8 px-3 rounded-lg border border-blue-500/30 text-blue-300 text-xs hover:bg-blue-500/10 transition-colors"
                    onClick={clearCachedImages}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Cached Images View */}
            {showCachedView && cachedImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-3 rounded-xl bg-black/20 border border-white/5">
                {cachedImages.map((cachedImg) => (
                  <div key={cachedImg.id} className="relative group rounded-lg overflow-hidden border border-white/10 bg-white/5 aspect-square">
                    <img src={cachedImg.processedBase64} alt={cachedImg.originalName} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                      <span className="text-[10px] text-zinc-300 truncate w-full text-center mb-2">{cachedImg.originalName}</span>
                      <button
                        className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                        onClick={() => downloadCachedImage(cachedImg)}
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Limit Reached Warning */}
            {hasReachedLimit && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                <span className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5 text-yellow-500" /></span>
                <div className="flex flex-col">
                  <strong className="text-sm text-yellow-100 font-semibold">Daily limit reached!</strong>
                  <span className="text-xs text-yellow-200/70">You've used all {getDailyLimit()} free processes for today. Come back tomorrow!</span>
                </div>
              </div>
            )}

            <div
              className={`p-8 border-2 border-dashed rounded-[18px] text-center cursor-pointer transition-all duration-200 ${dragActive ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/20 bg-white/5 hover:border-yellow-500/50 hover:bg-white/10'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-800/20 text-yellow-500 flex items-center justify-center shadow-[inset_0_0_0_1px_rgba(212,175,55,0.2)]">
                <FolderUp className="w-8 h-8" />
              </div>
              <p className="text-zinc-200 font-semibold">Drop images here or click to browse</p>
              <span className="text-xs text-zinc-500 block mt-1">Select multiple files</span>
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
              <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {images.map((img) => (
                  <div key={img.id} className={`flex flex-col p-3 rounded-2xl bg-white/5 border transition-all ${img.status === 'done' ? 'border-emerald-500/30 shadow-[inset_4px_0_0_0_rgba(16,185,129,0.5)]' : img.status === 'error' ? 'border-red-500/30 shadow-[inset_4px_0_0_0_rgba(239,68,68,0.5)]' : img.status === 'processing' ? 'border-yellow-500/30 shadow-[inset_4px_0_0_0_rgba(234,179,8,0.5)]' : 'border-white/10 hover:bg-white/10'}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-[50px] h-[50px] shrink-0 rounded-[12px] overflow-hidden relative bg-black/40">
                        <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
                        {img.status === 'processing' && (
                          <div className="absolute inset-0 bg-black/60 grid place-items-center">
                            <div className="w-5 h-5 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
                          </div>
                        )}
                        {img.status === 'done' && (
                          <div className="absolute inset-0 bg-emerald-500/70 text-white grid place-items-center"><Check className="w-4 h-4" /></div>
                        )}
                        {img.status === 'error' && (
                          <div className="absolute inset-0 bg-red-500/70 text-white grid place-items-center"><XCircle className="w-4 h-4" /></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="block text-[13px] font-semibold text-white truncate" title={img.name}>
                          {img.name.length > 25 ? img.name.substring(0, 25) + '...' : img.name}
                        </span>
                        <span className="block text-[11px] text-zinc-400 mt-1">
                          {img.dimensions.width}×{img.dimensions.height} • {formatFileSize(img.size)}
                        </span>

                        {img.status === 'processing' && (
                          <div className="h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-200 transition-all duration-300" style={{ width: `${img.progress}%` }}></div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${img.useCustomSettings ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-500' : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'}`}
                          onClick={() => toggleCustomSettings(img.id)}
                          title={img.useCustomSettings ? 'Using custom settings' : 'Using global settings'}
                        >
                          {img.useCustomSettings ? <Settings className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                        </button>
                        {img.status === 'done' && (
                          <>
                            <button
                              className="w-8 h-8 rounded-xl border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center"
                              onClick={() => openComparison(img)}
                              title="Compare before/after"
                            >
                              <Search className="w-4 h-4" />
                            </button>
                            <button
                              className="w-8 h-8 rounded-xl border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center"
                              onClick={() => downloadSingle(img)}
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          className="w-8 h-8 rounded-xl border border-white/10 bg-white/5 text-zinc-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all flex items-center justify-center"
                          onClick={() => removeImage(img.id)}
                          title="Remove"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Custom Settings Panel */}
                    {img.useCustomSettings && (
                      <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Size</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={img.customSettings.width}
                              onChange={(e) => updateImageSettings(img.id, {
                                width: parseInt(e.target.value) || 0,
                                resizeType: 'pixels'
                              })}
                              className="w-full h-8 bg-black/20 border border-white/10 rounded-lg text-xs text-white px-2 focus:border-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500/50"
                            />
                            <span className="text-zinc-500 text-xs">×</span>
                            <input
                              type="number"
                              value={img.customSettings.height}
                              onChange={(e) => updateImageSettings(img.id, {
                                height: parseInt(e.target.value) || 0,
                                resizeType: 'pixels'
                              })}
                              className="w-full h-8 bg-black/20 border border-white/10 rounded-lg text-xs text-white px-2 focus:border-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500/50"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold flex justify-between">
                            <span>Quality</span>
                            <span className="text-yellow-500">{img.customSettings.quality}%</span>
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="100"
                            value={img.customSettings.quality}
                            onChange={(e) => updateImageSettings(img.id, { quality: parseInt(e.target.value) })}
                            className="w-full h-1.5 bg-black/30 rounded-full appearance-none outline-none overflow-hidden [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-yellow-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[-100vw_0_0_100vw_rgba(234,179,8,0.5)]"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Format</label>
                          <select
                            value={img.customSettings.format}
                            onChange={(e) => updateImageSettings(img.id, { format: e.target.value })}
                            className="w-full h-8 bg-black/20 border border-white/10 rounded-lg text-xs text-white px-2 outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50"
                          >
                            <option value="jpg">JPG</option>
                            <option value="png">PNG</option>
                            <option value="webp">WebP</option>
                          </select>
                        </div>
                        <div className="col-span-1 sm:col-span-3 flex flex-wrap gap-2 mt-1">
                          {PRESET_SIZES.web.slice(0, 3).map(preset => (
                            <button
                              key={preset.name}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
                              onClick={() => applyPreset(preset, img.id)}
                            >
                              <span className="opacity-70">{preset.icon}</span> {preset.width}×{preset.height}
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
          <div className="liquid-card p-5 h-full overflow-y-auto custom-scrollbar border border-white/5 flex flex-col gap-6 rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-wider text-yellow-500/90">Global Settings</h3>
              <p className="text-[11px] text-zinc-400">Applied to images without custom settings</p>
            </div>

            {/* Preset Sizes */}
            <div className="flex flex-col gap-2">
              <button
                className="flex items-center justify-between w-full p-3 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold hover:bg-white/10 hover:border-white/20 transition-all text-zinc-300"
                onClick={() => setShowPresets(!showPresets)}
              >
                <span>📐 Quick Presets</span>
                <span className="text-zinc-500">{showPresets ? '▲' : '▼'}</span>
              </button>

              {showPresets && (
                <div className="flex flex-col gap-3 p-3 rounded-xl bg-black/20 border border-white/5 animate-in slide-in-from-top-2">
                  <div className="flex bg-white/5 p-1 rounded-lg gap-1 border border-white/5">
                    {Object.keys(PRESET_SIZES).map(cat => (
                      <button
                        key={cat}
                        className={`flex-1 text-[10px] font-semibold py-1.5 rounded-md transition-all ${presetCategory === cat ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}`}
                        onClick={() => setPresetCategory(cat)}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_SIZES[presetCategory].map(preset => (
                      <button
                        key={preset.name}
                        className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-yellow-500/10 hover:border-yellow-500/30 transition-all group"
                        onClick={() => applyPreset(preset)}
                      >
                        <span className="text-zinc-400 group-hover:text-yellow-500/70">{preset.icon}</span>
                        <span className="text-[10px] font-medium text-zinc-300 text-center leading-tight">{preset.name}</span>
                        <span className="text-[9px] text-zinc-500 bg-black/30 px-1.5 py-0.5 rounded uppercase">{preset.width}×{preset.height}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Resize Type */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Resize By</label>
              <div className="flex border border-white/10 rounded-xl p-1 bg-black/20">
                <button
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${globalSettings.resizeType === 'percentage' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                  onClick={() => setGlobalSettings(prev => ({ ...prev, resizeType: 'percentage' }))}
                >
                  Percentage
                </button>
                <button
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${globalSettings.resizeType === 'pixels' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                  onClick={() => setGlobalSettings(prev => ({ ...prev, resizeType: 'pixels' }))}
                >
                  Pixels
                </button>
              </div>
            </div>

            {globalSettings.resizeType === 'percentage' ? (
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex justify-between">
                  <span>Scale</span>
                  <span className="text-yellow-500">{globalSettings.percentage}%</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="200"
                  value={globalSettings.percentage}
                  onChange={(e) => setGlobalSettings(prev => ({ ...prev, percentage: parseInt(e.target.value) }))}
                  className="w-full h-1.5 bg-black/30 rounded-full appearance-none outline-none overflow-hidden [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-yellow-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[-100vw_0_0_100vw_rgba(234,179,8,0.5)]"
                />
                <div className="flex flex-wrap gap-2 mt-1">
                  {[25, 50, 75, 100, 150].map(p => (
                    <button
                      key={p}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${globalSettings.percentage === p ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-500' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'}`}
                      onClick={() => setGlobalSettings(prev => ({ ...prev, percentage: p }))}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Dimensions</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={globalSettings.width}
                    onChange={(e) => setGlobalSettings(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                    placeholder="W"
                    className="flex-1 h-10 bg-black/20 border border-white/10 rounded-xl text-sm text-white px-3 focus:border-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500/50"
                  />
                  <span className="text-zinc-500">×</span>
                  <input
                    type="number"
                    value={globalSettings.height}
                    onChange={(e) => setGlobalSettings(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                    placeholder="H"
                    className="flex-1 h-10 bg-black/20 border border-white/10 rounded-xl text-sm text-white px-3 focus:border-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500/50"
                  />
                </div>
                <label className="flex items-center gap-2 mt-1 cursor-pointer group w-max">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={globalSettings.maintainAspect}
                      onChange={(e) => setGlobalSettings(prev => ({ ...prev, maintainAspect: e.target.checked }))}
                      className="peer appearance-none w-4 h-4 rounded-[4px] border border-white/20 bg-black/20 checked:bg-yellow-500 checked:border-yellow-500 transition-colors cursor-pointer"
                    />
                    <Check className="w-3 h-3 text-[var(--bg-dark-base)] absolute opacity-0 peer-checked:opacity-100 pointer-events-none stroke-[3]" />
                  </div>
                  <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">Maintain aspect ratio</span>
                </label>
              </div>
            )}

            {/* Quality */}
            <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex justify-between">
                <span>Quality</span>
                <span className="text-yellow-500">{globalSettings.quality}%</span>
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={globalSettings.quality}
                onChange={(e) => setGlobalSettings(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
                className="w-full h-1.5 bg-black/30 rounded-full appearance-none outline-none overflow-hidden [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-yellow-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[-100vw_0_0_100vw_rgba(234,179,8,0.5)]"
              />
            </div>

            {/* Format */}
            <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Output Format</label>
              <div className="flex gap-2">
                {['jpg', 'png', 'webp'].map(f => (
                  <button
                    key={f}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold tracking-wider border transition-all ${globalSettings.format === f ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-500' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'}`}
                    onClick={() => setGlobalSettings(prev => ({ ...prev, format: f }))}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-6 mt-auto border-t border-white/5">
              <div className="flex items-center justify-between text-xs font-semibold px-1">
                <span className="text-zinc-400">{images.length} image{images.length !== 1 ? 's' : ''}</span>
                {processedCount > 0 && (
                  <span className="text-emerald-400 flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> {processedCount} done</span>
                )}
              </div>

              <button
                className="accent-button w-full flex items-center justify-center gap-2 mx-auto disabled:opacity-50 disabled:pointer-events-none h-[46px]"
                onClick={processImages}
                disabled={images.length === 0 || processing || (!canBypassLimits && (hasReachedLimit || !canProcessImages(images.length)))}
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    Processing... ({processedCount}/{images.length})
                  </>
                ) : !canBypassLimits && hasReachedLimit ? (
                  <>
                    <XCircle className="w-4 h-4 inline" /> Limit Reached
                  </>
                ) : !canBypassLimits && !canProcessImages(images.length) ? (
                  <>
                    <AlertTriangle className="w-4 h-4 inline" /> Exceeds Limit ({images.length} &gt; {remainingCount})
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 inline text-yellow-900" /> Process All
                  </>
                )}
              </button>

              {images.some(i => i.status === 'done') && (
                <button className="liquid-button w-full flex items-center justify-center gap-2 h-[46px] mt-1" onClick={downloadAll}>
                  <Download className="w-4 h-4 inline" /> Download All as ZIP
                </button>
              )}

              {images.length > 0 && (
                <button className="w-full h-10 mt-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-500 hover:text-red-400 text-xs font-bold transition-colors flex items-center justify-center gap-2" onClick={clearAll}>
                  <Trash2 className="w-4 h-4 inline" /> Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Comparison Modal */}
        {showComparison && comparisonImage && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={closeComparison}>
            <div className="liquid-panel w-full max-w-[90vw] max-h-[90vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/10 rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0 bg-black/40">
                <div className="flex items-center gap-3">
                  <h3 className="text-white font-bold font-serif text-lg">Before / After Comparison</h3>
                  <span className="px-2 py-0.5 rounded-md bg-white/10 text-[11px] text-zinc-300 truncate max-w-[200px]">{comparisonImage.name}</span>
                </div>
                <button className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors" onClick={closeComparison}><X className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxwYXRoIGZpbGw9IiMzMzMzMzMiIGQ9Ik0wLDBIMTBWMTBIMHoiLz4KPHBhdGggZmlsbD0iIzM1MzUzNSIgZD0iTTEwLDBIMjBWMTBIMTB6Ii8+CjxwYXRoIGZpbGw9IiMzMzMzMzMiIGQ9Ik0xMCwxMEgyMFYyMEgxMHoiLz4KPHBhdGggZmlsbD0iIzM1MzUzNSIgZD0iTTAsMTBIMTBWMjBIMHoiLz4KPC9zdmc+')] overflow-auto custom-scrollbar p-6 min-h-[500px]">
                <ImageComparison
                  beforeImage={comparisonImage.before}
                  afterImage={comparisonImage.after}
                  beforeLabel="Original"
                  afterLabel="Processed"
                  position={50}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchProcessor;
