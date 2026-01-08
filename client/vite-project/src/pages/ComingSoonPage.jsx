import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './ComingSoonPage.css';

const TOOL_INFO = {
  '/compress': {
    title: 'Image Compressor',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
    description: 'Reduce image file sizes by up to 90% without visible quality loss. Perfect for web optimization.',
    features: ['Smart compression algorithms', 'Batch processing', 'Quality control slider', 'Multiple format support']
  },
  '/convert': {
    title: 'Format Converter',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="16 3 21 3 21 8"/>
        <line x1="4" y1="20" x2="21" y2="3"/>
        <polyline points="21 16 21 21 16 21"/>
        <line x1="15" y1="15" x2="21" y2="21"/>
        <line x1="4" y1="4" x2="9" y2="9"/>
      </svg>
    ),
    description: 'Convert images between formats including JPG, PNG, WebP, AVIF, GIF, and more.',
    features: ['10+ supported formats', 'Quality settings', 'Metadata preservation', 'Batch conversion']
  },
  '/crop': {
    title: 'Image Cropper',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"/>
        <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"/>
      </svg>
    ),
    description: 'Crop images with precision. Use preset aspect ratios or custom selections.',
    features: ['Social media presets', 'Custom aspect ratios', 'Free-form cropping', 'Grid overlay']
  },
  '/remove-background': {
    title: 'Background Remover',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/>
        <path d="M8 12l2 2 4-4"/>
      </svg>
    ),
    description: 'Remove backgrounds from images automatically using AI. Get transparent PNG exports.',
    features: ['AI-powered detection', 'Transparent PNG output', 'Edge refinement', 'Batch processing']
  },
  '/watermark': {
    title: 'Watermark Tool',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    description: 'Add text or image watermarks to protect your work. Customize position and opacity.',
    features: ['Text & image watermarks', 'Position control', 'Opacity settings', 'Batch application']
  },
  '/batch': {
    title: 'Batch Processor',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    description: 'Process multiple images at once. Apply the same operations to hundreds of files.',
    features: ['Multi-file upload', 'Consistent processing', 'ZIP download', 'Progress tracking']
  },
  '/enhance': {
    title: 'Photo Enhancer',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    description: 'Automatically enhance photo quality with AI-powered color correction and sharpening.',
    features: ['Auto color correction', 'Sharpening', 'Noise reduction', 'Exposure adjustment']
  }
};

const ComingSoonPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const toolInfo = TOOL_INFO[location.pathname] || {
    title: 'Tool',
    icon: null,
    description: 'This tool is under development.',
    features: []
  };

  const availableTools = [
    { path: '/upscale', name: 'AI Upscaler', description: 'Enhance resolution up to 4x' },
    { path: '/resize', name: 'Image Resizer', description: 'Resize to any dimension' }
  ];

  return (
    <div className="coming-soon-page">
      <Header />
      
      <main className="coming-soon-main">
        <div className="coming-soon-container">
          <div className="coming-soon-card">
            <div className="tool-icon">
              {toolInfo.icon}
            </div>
            
            <div className="status-badge">Coming Soon</div>
            
            <h1>{toolInfo.title}</h1>
            <p className="tool-description">{toolInfo.description}</p>
            
            {toolInfo.features.length > 0 && (
              <div className="planned-features">
                <h3>Planned Features</h3>
                <ul>
                  {toolInfo.features.map((feature, index) => (
                    <li key={index}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="notify-section">
              <p>Want to be notified when this tool launches?</p>
              <div className="notify-form">
                <input type="email" placeholder="Enter your email" />
                <button>Notify Me</button>
              </div>
            </div>
          </div>
          
          <div className="available-tools">
            <h2>Available Tools</h2>
            <p>Try our existing tools while you wait</p>
            
            <div className="tools-grid">
              {availableTools.map((tool) => (
                <Link to={tool.path} key={tool.path} className="tool-card">
                  <h3>{tool.name}</h3>
                  <p>{tool.description}</p>
                  <span className="try-now">Try Now →</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ComingSoonPage;
