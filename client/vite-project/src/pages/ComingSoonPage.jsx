import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageShell from '../components/PageShell';
import PageHero from '../components/PageHero';
import SEO from '../components/SEO';
import { Sparkles, Bell } from 'lucide-react';

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
    <PageShell>
      <SEO
        title={`${toolInfo.title} — Coming Soon | ImageStudio`}
        description={toolInfo.description}
        path={location.pathname}
      />

      <PageHero
        badge="Coming Soon"
        title={toolInfo.title}
        subtitle={toolInfo.description}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Card */}
        <div className="glass-card p-8 md:p-12 text-center mb-10">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-6">
            {toolInfo.icon}
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Under Development
          </div>

          <h2 className="font-serif text-2xl md:text-3xl font-bold text-white mb-3">{toolInfo.title}</h2>
          <p className="text-zinc-400 text-lg max-w-lg mx-auto leading-relaxed mb-8">{toolInfo.description}</p>

          {/* Planned Features */}
          {toolInfo.features.length > 0 && (
            <div className="max-w-md mx-auto text-left mb-8">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4 text-center">Planned Features</h3>
              <ul className="space-y-3">
                {toolInfo.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-zinc-400 text-sm">
                    <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notify Section */}
          <div className="max-w-sm mx-auto">
            <p className="text-zinc-500 text-sm mb-3">Want to be notified when this tool launches?</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-dark-600 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-primary focus:outline-none transition-colors text-sm"
              />
              <button className="accent-button flex items-center gap-2 whitespace-nowrap">
                <Bell className="w-4 h-4" />
                Notify Me
              </button>
            </div>
          </div>
        </div>

        {/* Available Tools */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white mb-2">Available Tools</h2>
          <p className="text-zinc-400 text-sm">Try our existing tools while you wait</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {availableTools.map((tool) => (
            <Link
              to={tool.path}
              key={tool.path}
              className="glass-card-hover p-6 block group"
            >
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary transition-colors">{tool.name}</h3>
              <p className="text-sm text-zinc-400 mb-3">{tool.description}</p>
              <span className="text-primary text-sm font-medium flex items-center gap-1">
                Try Now
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
};

export default ComingSoonPage;
