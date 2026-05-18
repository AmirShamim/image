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
import { AlertTriangle, Paintbrush, Wand2, ArrowLeftRight, SplitSquareHorizontal, Brain, Clock, Download, Trash2, Crown, Package, Check, XCircle, Archive, Cloud } from 'lucide-react';
import { saveImageToHistory, getHistoryImages, deleteImageFromHistory, clearOldHistory } from '../utils/indexedDB';

// In production, bypass Vercel proxy by using absolute URL
const API_URL = import.meta.env.PROD ? 'https://image-studio-5yqqy.ondigitalocean.app' : '';

const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const UpscalePage = () => {
  const { t } = useTranslation();
  const { user, isAdmin, isPremium } = useAuth();

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
  const [modelType, setModelType] = useState('realesrgan-anime');

  // Usage tracking
  const [usage, setUsage] = useState({ upscale_2x: 0, upscale_4x: 0 });
  const [limits, setLimits] = useState({ upscale_2x: 10, upscale_4x: 5 });

  // Image dimensions
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });

  // Comparison view
  const [showComparison, setShowComparison] = useState(true);

  // Session History
  const [sessionHistory, setSessionHistory] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  // Keep object URLs alive for history items (keyed by item.id)
  const historyUrlsRef = useRef({});

  // Batch upscaling state (Pro/Business/Admin)
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchScale, setBatchScale] = useState('2x');
  const [batchModelType, setBatchModelType] = useState('realesrgan-anime');
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchDragActive, setBatchDragActive] = useState(false);
  const batchFileInputRef = useRef(null);
  const canUseBatch = isAdmin || isPremium || user?.subscription_tier === 'business';

  // Persistent batch history (stored in localStorage, URLs are Cloudinary so they persist)
  const [batchHistory, setBatchHistory] = useState([]);
  const [showBatchHistory, setShowBatchHistory] = useState(false);

  // Load batch history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('batch_upscale_history');
      if (saved) setBatchHistory(JSON.parse(saved));
    } catch (e) { /* ignore parse errors */ }
  }, []);

  // Persist batch history on change
  const saveBatchHistory = (history) => {
    setBatchHistory(history);
    try { localStorage.setItem('batch_upscale_history', JSON.stringify(history)); } catch (e) {}
  };

  // Clear old history on mount
  useEffect(() => {
    const initHistory = async () => {
      await clearOldHistory(30);
      const history = await getHistoryImages();
      setSessionHistory(history);
    };
    initHistory();
  }, []);

  // Size limits for upscaling (in pixels)
  const SIZE_LIMITS = {
    '2x': { maxWidth: 3840, maxHeight: 3840, label: '4K' },
    '4x': { maxWidth: 2048, maxHeight: 2048, label: '2K' }
  };

  // AI Model configurations (GPU only — 2 models)
  const AI_MODELS = {
    'realesrgan-anime': {
      name: 'Real-ESRGAN Anime',
      description: 'Great for anime, art & illustrations',
      icon: <Paintbrush className="w-6 h-6" />,
      scales: ['2x', '4x'],
      tier: 'free',
      speed: '~3-7s'
    },
    'realesrgan': {
      name: 'Real-ESRGAN Pro',
      description: 'Best quality for photos',
      icon: <Wand2 className="w-6 h-6" />,
      scales: ['2x', '4x'],
      tier: 'free',
      speed: '~3-7s'
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
          guest: { upscale_2x: 10, upscale_4x: 5 },
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
          setLimits(guestData.limits || { upscale_2x: 10, upscale_4x: 5 });
        } catch (guestErr) {
          console.error('Failed to load guest usage, using defaults:', guestErr);
          // Default guest limits - allow usage even if API fails
          setUsage({ upscale_2x: 0, upscale_4x: 0 });
          setLimits({ upscale_2x: 10, upscale_4x: 5 });
        }
      }
    } catch (err) {
      console.error('Failed to load usage:', err);
      // Default to guest limits on error
      setUsage({ upscale_2x: 0, upscale_4x: 0 });
      setLimits({ upscale_2x: 10, upscale_4x: 5 });
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
    // In development, allow all models
    if (window.location.hostname === 'localhost') return true;
    if (model.tier === 'pro') {
      const tier = user?.subscription_tier || 'guest';
      return tier === 'pro' || tier === 'business' || tier === 'admin';
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
      const response = await api.post('/api/upscale', formData, {
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded * 50) / e.total));
        },
        onDownloadProgress: (e) => {
          // JSON download is instant, but we keep this for UI smoothness
          setProgress(50 + Math.round((e.loaded * 50) / e.total));
        }
      });

      setProgress(100);
      const imageUrl = response.data.url;
      setResultImage(imageUrl);
      
      // Save to IndexedDB history in the background
      try {
        // Fetch the blob from the URL so we can save the actual image data locally
        const cloudBlobResponse = await fetch(imageUrl);
        const upscaledBlob = await cloudBlobResponse.blob();

        const savedImage = await saveImageToHistory({
          originalBlob: file,
          upscaledBlob: upscaledBlob,
          scale,
          modelType,
          originalWidth: originalDimensions.width,
          originalHeight: originalDimensions.height
        });
        
        setSessionHistory(prev => [savedImage, ...prev]);
        
        // Show Pro Upsell Toast
        setToastMessage({
          title: "Image saved locally!",
          description: "This image is stored temporarily in your browser and will be deleted in 30 minutes.",
          upsell: "Upgrade to Pro to save images securely in the cloud with faster processing."
        });
        
        setTimeout(() => setToastMessage(null), 8000);
      } catch (err) {
        console.error("Failed to save to local session:", err);
      }

      await loadUsageData();
    } catch (err) {
      console.error('Error uploading file', err);
      if (err.response?.status === 429) {
        setError('Daily limit reached. Please try again tomorrow or upgrade your plan.');
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Processing timed out. The GPU server may be warming up — please try again in a few seconds.');
      } else if (err.code === 'ERR_NETWORK' || err.message?.includes('ECONNRESET') || !err.response) {
        setError('Connection lost during processing. The GPU server may be starting up — please try again.');
      } else {
        setError(err.response?.data?.message || err.response?.data?.error || 'Error processing image. Please try again.');
      }
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleDownload = async () => {
    if (!resultImage) return;
    try {
      const response = await fetch(resultImage);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `upscaled_${modelType}_${scale}_${file?.name || 'image.png'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch (err) {
      console.error('Download failed:', err);
      // Fallback: open in new tab
      window.open(resultImage, '_blank');
    }
  };

  const resetAll = () => {
    setFile(null);
    setPreview(null);
    setResultImage(null);
    setError('');
    setOriginalDimensions({ width: 0, height: 0 });
  };

  const handleDownloadHistoryImage = async (blob, imgScale, imgModelType) => {
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `upscaled_${imgModelType}_${imgScale}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  };

  const handleDeleteHistoryImage = async (id) => {
    try {
      // Clean up cached URL for this item
      if (historyUrlsRef.current[id]) {
        URL.revokeObjectURL(historyUrlsRef.current[id]);
        delete historyUrlsRef.current[id];
      }
      await deleteImageFromHistory(id);
      setSessionHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Failed to delete history image:', err);
    }
  };

  // Batch upscaling handlers
  const handleBatchFiles = (files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    const newItems = imageFiles.map(f => ({
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      file: f,
      name: f.name,
      preview: URL.createObjectURL(f),
      status: 'pending',
      resultUrl: null,
      error: null
    }));
    setBatchFiles(prev => [...prev, ...newItems]);
  };

  const processBatch = async () => {
    if (!batchFiles.length || batchProcessing) return;
    setBatchProcessing(true);
    const newHistoryItems = [];
    for (const item of batchFiles) {
      if (item.status === 'done') continue;
      setBatchFiles(prev => prev.map(i => i.id === item.id ? { ...i, status: 'processing' } : i));
      try {
        const formData = new FormData();
        formData.append('image', item.file);
        formData.append('scale', batchScale);
        formData.append('modelType', batchModelType);
        const response = await api.post('/api/upscale', formData);
        const cloudUrl = response.data.url;
        setBatchFiles(prev => prev.map(i =>
          i.id === item.id ? { ...i, status: 'done', resultUrl: cloudUrl } : i
        ));
        // Save to persistent batch history (Cloudinary URL persists)
        newHistoryItems.push({
          id: item.id,
          name: item.name,
          cloudUrl,
          scale: batchScale,
          modelType: batchModelType,
          timestamp: Date.now()
        });
      } catch (err) {
        setBatchFiles(prev => prev.map(i =>
          i.id === item.id ? { ...i, status: 'error', error: err.response?.data?.error || 'Failed' } : i
        ));
      }
    }
    // Persist new results to batch history
    if (newHistoryItems.length > 0) {
      saveBatchHistory([...newHistoryItems, ...batchHistory]);
    }
    setBatchProcessing(false);
  };

  const downloadBatchItem = async (url, name) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `upscaled_${batchScale}_${name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  const downloadAllAsZip = async () => {
    const doneFiles = batchFiles.filter(i => i.status === 'done' && i.resultUrl);
    if (!doneFiles.length) return;
    const zip = new JSZip();
    for (const item of doneFiles) {
      try {
        const res = await fetch(item.resultUrl);
        const blob = await res.blob();
        const ext = item.resultUrl.match(/\.(png|jpg|jpeg|webp)/i)?.[1] || 'png';
        const baseName = item.name.replace(/\.[^/.]+$/, '');
        zip.file(`${baseName}_upscaled_${batchScale}.${ext}`, blob);
      } catch (e) {
        console.error('Failed to fetch for zip:', item.name, e);
      }
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const blobUrl = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `upscaled-batch-${batchModelType}-${batchScale}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  };

  const downloadHistoryItemsAsZip = async (items) => {
    if (!items.length) return;
    const zip = new JSZip();
    const model = items[0]?.modelType || 'realesrgan';
    const sc = items[0]?.scale || '2x';
    for (const item of items) {
      try {
        const res = await fetch(item.cloudUrl);
        const blob = await res.blob();
        const ext = item.cloudUrl.match(/\.(png|jpg|jpeg|webp)/i)?.[1] || 'png';
        const baseName = item.name.replace(/\.[^/.]+$/, '');
        zip.file(`${baseName}_upscaled_${item.scale}.${ext}`, blob);
      } catch (e) {
        console.error('Failed to fetch for zip:', item.name, e);
      }
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const blobUrl = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `upscaled-batch-${model}-${sc}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
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
        description="Upscale and enhance images with AI. Increase resolution 2x or 4x using GPU-accelerated Real-ESRGAN technology. Free, fast, no watermarks."
        keywords="AI image upscaler, upscale image, increase resolution, Real-ESRGAN, enhance photo quality, 4x upscale free"
        path="/upscale"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to Upscale Images with AI",
          "description": "Enlarge images up to 4x using AI-powered Real-ESRGAN technology",
          "step": [
            { "@type": "HowToStep", "name": "Upload Image", "text": "Drag and drop or click to upload your image" },
            { "@type": "HowToStep", "name": "Select Scale", "text": "Choose 2x or 4x upscaling factor" },
            { "@type": "HowToStep", "name": "Process", "text": "Click upscale and wait for GPU-accelerated AI processing" },
            { "@type": "HowToStep", "name": "Download", "text": "Download your enhanced high-resolution image" }
          ]
        }}
      />

      <PageHero
        badge="AI Upscaling"
        title="Image Upscaler"
        subtitle="Enhance image resolution up to 4x using neural upscaling. Great for prints, presentations, and professional work."
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* --- Toast Notification --- */}
        {toastMessage && (
          <div className="fixed bottom-4 right-4 z-50 bg-gray-900 border border-[#00d4aa]/30 rounded-xl p-4 shadow-2xl max-w-sm animate-in slide-in-from-bottom-5">
            <div className="flex gap-3">
              <Clock className="w-6 h-6 text-[#00d4aa] flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-white font-medium text-sm">{toastMessage.title}</h4>
                <p className="text-zinc-400 text-xs mt-1">{toastMessage.description}</p>
                <div className="mt-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-amber-500 font-medium text-xs mb-1">
                    <Crown className="w-3 h-3" /> Go Pro
                  </div>
                  <p className="text-zinc-300 text-xs">{toastMessage.upsell}</p>
                  <a href="/pricing" className="block text-amber-500 hover:text-amber-400 text-xs font-medium mt-2">
                    View Plans &rarr;
                  </a>
                </div>
              </div>
              <button onClick={() => setToastMessage(null)} className="text-zinc-500 hover:text-zinc-300">
                &times;
              </button>
            </div>
          </div>
        )}

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
                <div className="model-grid grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(AI_MODELS).map(([key, model]) => {
                    const isAvailable = canUseModel(key);
                    const isSelected = modelType === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`model-card relative p-4 rounded-2xl border transition-all duration-200 ease-in-out text-left ${isSelected
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
                        className={`scale-btn flex-1 rounded-2xl p-4 text-left border transition-all ${isSelected
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
                              <AlertTriangle className="w-3 h-3" /> Too large
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
                  <AlertTriangle className="w-5 h-5 inline mr-1 text-red-500" /> {error}
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
                  <><AlertTriangle className="w-4 h-4 inline mr-1" /> Image exceeds {getSizeLimitMessage(scale)} limit</>
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
                className={`view-mode-btn px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1 ${showComparison ? 'bg-[#00d4aa]/20 text-[#00d4aa]' : 'text-zinc-300 hover:text-white hover:bg-white/[0.04]'}`}
                onClick={() => setShowComparison(true)}
              >
                <ArrowLeftRight className="w-4 h-4" /> Compare
              </button>
              <button
                type="button"
                className={`view-mode-btn px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1 ${!showComparison ? 'bg-[#00d4aa]/20 text-[#00d4aa]' : 'text-zinc-300 hover:text-white hover:bg-white/[0.04]'}`}
                onClick={() => setShowComparison(false)}
              >
                <SplitSquareHorizontal className="w-4 h-4" /> Side-by-side
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

        {/* Session History Section */}
        {sessionHistory.length > 0 && (
          <div className="session-history-section mt-12 bg-black/20 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Local Session History
                </h3>
                <p className="text-sm text-zinc-400 mt-1">Images are stored locally in your browser and will be automatically deleted after 30 minutes.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {sessionHistory.map((item) => {
                // Keep URL alive in a ref so buttons can use it
                if (!historyUrlsRef.current[item.id]) {
                  historyUrlsRef.current[item.id] = URL.createObjectURL(item.upscaledBlob);
                }
                const url = historyUrlsRef.current[item.id];
                return (
                  <div key={item.id} className="relative group rounded-xl overflow-hidden border border-white/5 bg-zinc-900/50 aspect-square">
                    <img src={url} alt={`Upscaled ${item.scale}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md rounded px-2 py-1 text-[10px] font-mono text-primary font-bold border border-primary/20">
                      {item.scale}
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col justify-end p-3">
                      <div className="flex gap-2 justify-center">
                        <button 
                          onClick={() => handleDownloadHistoryImage(item.upscaledBlob, item.scale, item.modelType)}
                          className="p-2 bg-primary/20 hover:bg-primary/40 text-primary rounded-lg transition-colors"
                          title="Download"
                          type="button"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteHistoryImage(item.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors"
                          title="Delete"
                          type="button"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Batch Upscaling Section — Pro / Business / Admin only */}
        {canUseBatch && (
          <div className="mt-12 bg-black/20 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" /> Batch AI Upscaling
                  <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 uppercase font-bold">
                    {isAdmin ? 'Admin' : 'Pro'}
                  </span>
                </h3>
                <p className="text-sm text-zinc-400 mt-1">Upload multiple images and upscale them all at once.</p>
              </div>
              <div className="flex items-center gap-2">
                <select value={batchScale} onChange={e => setBatchScale(e.target.value)}
                  className="bg-white/5 border border-white/10 text-white text-sm rounded-lg px-2 py-1.5 outline-none">
                  <option value="2x">2x</option>
                  <option value="4x">4x</option>
                </select>
                <select value={batchModelType} onChange={e => setBatchModelType(e.target.value)}
                  className="bg-white/5 border border-white/10 text-white text-sm rounded-lg px-2 py-1.5 outline-none">
                  <option value="realesrgan-anime">Anime</option>
                  <option value="realesrgan">Pro</option>
                </select>
              </div>
            </div>

            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                batchDragActive ? 'border-primary/60 bg-primary/5' : 'border-white/20 hover:border-white/40'
              }`}
              onDragEnter={e => { e.preventDefault(); setBatchDragActive(true); }}
              onDragLeave={e => { e.preventDefault(); setBatchDragActive(false); }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); setBatchDragActive(false); handleBatchFiles(e.dataTransfer.files); }}
              onClick={() => batchFileInputRef.current?.click()}
            >
              <Package className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
              <p className="text-zinc-400 text-sm">Drop multiple images here or click to browse</p>
              <input ref={batchFileInputRef} type="file" accept="image/*" multiple hidden
                onChange={e => handleBatchFiles(e.target.files)} />
            </div>

            {/* Batch file list */}
            {batchFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {batchFiles.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <img src={item.preview} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    <span className="flex-1 text-sm text-white truncate">{item.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.status === 'done' ? 'bg-green-500/20 text-green-400' :
                      item.status === 'error' ? 'bg-red-500/20 text-red-400' :
                      item.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-white/10 text-zinc-400'
                    }`}>{item.status}</span>
                    {item.status === 'done' && item.resultUrl && (
                      <button onClick={() => downloadBatchItem(item.resultUrl, item.name)}
                        className="p-1.5 bg-primary/20 hover:bg-primary/40 text-primary rounded-lg transition-colors" type="button">
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                    {item.status === 'processing' && (
                      <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin flex-shrink-0" />
                    )}
                    <button onClick={() => setBatchFiles(prev => prev.filter(i => i.id !== item.id))}
                      className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors flex-shrink-0" type="button">
                      ✕
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={processBatch}
                    disabled={batchProcessing}
                    className="accent-button flex-1 flex items-center justify-center gap-2"
                    type="button"
                  >
                    {batchProcessing ? (
                      <><span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> Processing…</>
                    ) : (
                      <><Package className="w-4 h-4" /> Upscale All ({batchFiles.filter(i => i.status !== 'done').length})</>
                    )}
                  </button>
                  {batchFiles.some(i => i.status === 'done') && (
                    <button onClick={downloadAllAsZip}
                      className="glass-button text-white text-sm flex items-center gap-1.5" type="button">
                      <Archive className="w-4 h-4" /> Download ZIP
                    </button>
                  )}
                  <button onClick={() => setBatchFiles([])} className="glass-button text-white text-sm" type="button">Clear Queue</button>
                </div>
              </div>
            )}

            {/* Persistent Cloud Batch History */}
            {batchHistory.length > 0 && (
              <div className="mt-6 border-t border-white/10 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => setShowBatchHistory(!showBatchHistory)}
                    className="text-sm text-zinc-300 font-medium flex items-center gap-2 hover:text-white transition-colors" type="button">
                    <Cloud className="w-4 h-4 text-primary" />
                    Cloud Batch History ({batchHistory.length} images)
                    <span className="text-zinc-500 text-xs">{showBatchHistory ? '▲' : '▼'}</span>
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => downloadHistoryItemsAsZip(batchHistory)}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors" type="button">
                      <Archive className="w-3.5 h-3.5" /> Download All ZIP
                    </button>
                    <button onClick={() => { saveBatchHistory([]); }}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors" type="button">
                      Clear History
                    </button>
                  </div>
                </div>
                {showBatchHistory && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {batchHistory.map(item => (
                      <div key={item.id} className="relative group rounded-xl overflow-hidden border border-white/5 bg-zinc-900/50 aspect-square">
                        <img src={item.cloudUrl} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md rounded px-2 py-0.5 text-[10px] font-mono text-primary font-bold border border-primary/20">
                          {item.scale} • {item.modelType === 'realesrgan' ? 'Pro' : 'Anime'}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col justify-end p-3">
                          <p className="text-[11px] text-zinc-300 truncate mb-2">{item.name}</p>
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => downloadBatchItem(item.cloudUrl, item.name)}
                              className="p-2 bg-primary/20 hover:bg-primary/40 text-primary rounded-lg transition-colors" type="button" title="Download">
                              <Download className="w-4 h-4" />
                            </button>
                            <button onClick={() => saveBatchHistory(batchHistory.filter(h => h.id !== item.id))}
                              className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors" type="button" title="Remove">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="info-section mt-10">
          <h3 className="text-white font-semibold mb-4">How AI Upscaling Works</h3>
          <div className="info-grid grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="info-card glass-card p-5">
              <span className="info-icon flex items-center justify-center mb-2"><Brain className="w-8 h-8 text-primary" /></span>
              <h4 className="text-white font-semibold mt-2">Deep Learning</h4>
              <p className="text-zinc-400 text-sm mt-2">Uses neural networks trained on millions of images to predict and generate realistic details.</p>
            </div>
            <div className="info-card glass-card p-5">
              <span className="info-icon flex items-center justify-center mb-2"><Wand2 className="w-8 h-8 text-primary" /></span>
              <h4 className="text-white font-semibold mt-2">Detail Enhancement</h4>
              <p className="text-zinc-400 text-sm mt-2">Adds sharp edges, textures, and details that simple resizing cannot achieve.</p>
            </div>
            <div className="info-card glass-card p-5">
              <span className="info-icon flex items-center justify-center mb-2"><Paintbrush className="w-8 h-8 text-primary" /></span>
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
