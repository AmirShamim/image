import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const ToolsPage = () => {
  const { t } = useTranslation();

  const tools = [
    {
      id: 'upscale',
      title: 'AI Upscaler',
      description: 'Enlarge images up to 4x with AI-powered enhancement.',
      path: '/upscale',
      available: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m-3-3h6"/>
        </svg>
      )
    },
    {
      id: 'resize',
      title: 'Image Resizer',
      description: 'Resize images to exact dimensions for any platform.',
      path: '/resize',
      available: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
        </svg>
      )
    },
    {
      id: 'compress',
      title: 'Compressor',
      description: 'Reduce file size without visible quality loss.',
      path: '/compress',
      available: false,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
      )
    },
    {
      id: 'remove-bg',
      title: 'Background Remover',
      description: 'Automatically remove backgrounds with AI precision.',
      path: '/remove-background',
      available: false,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L4.939 4.939M5 19l2.879-2.879m0 0a3 3 0 104.243-4.243 3 3 0 00-4.243 4.243z"/>
        </svg>
      )
    },
    {
      id: 'convert',
      title: 'Format Converter',
      description: 'Convert between JPG, PNG, WebP, and more formats.',
      path: '/convert',
      available: false,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
      )
    },
    {
      id: 'crop',
      title: 'Image Cropper',
      description: 'Crop images with preset or custom aspect ratios.',
      path: '/crop',
      available: false,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M7 21V3m14 4H3m4 14h14V7"/>
        </svg>
      )
    },
    {
      id: 'watermark',
      title: 'Watermark',
      description: 'Add text or image watermarks to protect photos.',
      path: '/watermark',
      available: false,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
        </svg>
      )
    },
    {
      id: 'batch',
      title: 'Batch Processing',
      description: 'Process multiple images at once with any tool.',
      path: '/batch',
      available: false,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-dark-900">
      <SEO
        title="Free Image Tools - AI Upscaler, Resizer & More | ImageStudio"
        description="Explore our free image tools: AI-powered upscaler, smart resizer, batch processor. No signup required."
        keywords="free image tools, online image editor, AI image tools, batch image processing"
        path="/tools"
      />
      <Header />

      <main className="pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              All Tools
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{t('tools.title')}</h1>
            <p className="text-zinc-400 text-lg max-w-lg mx-auto">{t('tools.subtitle')}</p>
          </div>

          {/* Tools Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {tools.map((tool) => (
              <Link
                key={tool.id}
                to={tool.available ? tool.path : '#'}
                className={`group relative glass-card p-6 transition-all duration-300 ${
                  tool.available 
                    ? 'hover:bg-white/[0.06] hover:border-primary/50 hover:-translate-y-2 hover:shadow-glow cursor-pointer' 
                    : 'opacity-40 cursor-not-allowed'
                }`}
                onClick={(e) => !tool.available && e.preventDefault()}
              >
                {!tool.available && (
                  <span className="absolute top-4 right-4 px-2 py-1 text-xs font-medium rounded-md bg-zinc-800 text-zinc-500">
                    {t('tools.comingSoon')}
                  </span>
                )}

                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-cyan-400 p-2.5 mb-4 group-hover:shadow-glow transition-shadow">
                  <div className="w-full h-full text-black">
                    {tool.icon}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2">{tool.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{tool.description}</p>

                {tool.available && (
                  <div className="mt-4 flex items-center gap-1 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Try now
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ToolsPage;

