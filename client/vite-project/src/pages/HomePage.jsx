import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const HomePage = () => {
  const { t } = useTranslation();

  const tools = [
    {
      id: 'upscale',
      title: t('home.tools.upscale.title'),
      description: t('home.tools.upscale.description'),
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
      title: t('home.tools.resize.title'),
      description: t('home.tools.resize.description'),
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
      title: t('home.tools.compress.title'),
      description: t('home.tools.compress.description'),
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
      title: t('home.tools.removeBg.title'),
      description: t('home.tools.removeBg.description'),
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
      title: t('home.tools.convert.title'),
      description: t('home.tools.convert.description'),
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
      title: t('home.tools.crop.title'),
      description: t('home.tools.crop.description'),
      path: '/crop',
      available: false,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M7 21V3m14 4H3m4 14h14V7"/>
        </svg>
      )
    }
  ];

  const features = [
    {
      title: t('home.features.aiUpscale.title'),
      description: t('home.features.aiUpscale.description'),
      icon: '⚡'
    },
    {
      title: t('home.features.presets.title'),
      description: t('home.features.presets.description'),
      icon: '🎯'
    },
    {
      title: t('home.features.batch.title'),
      description: t('home.features.batch.description'),
      icon: '📦'
    },
    {
      title: t('home.features.privacy.title'),
      description: t('home.features.privacy.description'),
      icon: '🔒'
    }
  ];

  return (
    <div className="min-h-screen bg-dark-900">
      <SEO
        title={t('seo.home.title')}
        description={t('seo.home.description')}
        keywords="image upscaler, AI upscale, image resizer, photo enlarger, increase resolution, free image tools"
        path="/"
      />
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 gradient-bg" />
        <div className="absolute inset-0 grid-pattern opacity-30" />

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/15 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-float">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm text-zinc-400">AI-Powered Image Processing</span>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-gradient">Transform Your Images</span>
            <br />
            <span className="accent-gradient">With AI Magic</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('home.hero.description')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/upscale"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-cyan-400 text-black font-semibold rounded-xl transition-all duration-300 hover:shadow-glow-lg hover:-translate-y-1"
            >
              {t('home.hero.cta')}
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              to="/tools"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 glass-button text-white"
            >
              {t('home.hero.ctaSecondary')}
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-24 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Powerful Tools
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('home.tools.title')}</h2>
            <p className="text-zinc-400 max-w-lg mx-auto">{t('tools.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <Link
                key={tool.id}
                to={tool.path}
                className={`group relative glass-card p-6 transition-all duration-300 ${
                  tool.available 
                    ? 'hover:bg-white/[0.06] hover:border-primary/50 hover:-translate-y-2 hover:shadow-glow cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                {!tool.available && (
                  <span className="absolute top-4 right-4 px-2 py-1 text-xs font-medium rounded-md bg-zinc-800 text-zinc-500">
                    {t('tools.comingSoon')}
                  </span>
                )}

                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-cyan-400 p-3.5 mb-5 group-hover:shadow-glow transition-shadow">
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
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-dark-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Why Choose Us
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('home.features.title')}</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-card-hover p-6 text-center"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Use Cases
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Built for Everyone</h2>
            <p className="text-zinc-400">Whether you're a professional, student, or content creator</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '👨‍💼', title: 'Professionals', items: ['High-resolution prints', 'Marketing materials', 'Product photography', 'Client deliverables'] },
              { icon: '🎨', title: 'Content Creators', items: ['Social media optimized', 'YouTube thumbnails', 'Instagram & TikTok', 'Upscale screenshots'], featured: true },
              { icon: '📚', title: 'Students & Educators', items: ['Enhance images for reports', 'Presentation visuals', 'Academic projects', 'Free tier available'] }
            ].map((useCase, index) => (
              <div
                key={index}
                className={`relative glass-card p-8 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-glass-lg ${
                  useCase.featured ? 'border-primary/50 shadow-glow' : ''
                }`}
              >
                {useCase.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary to-cyan-400 text-black text-xs font-bold rounded-full">
                    Most Popular
                  </span>
                )}
                <div className="text-5xl mb-4">{useCase.icon}</div>
                <h3 className="text-xl font-bold text-white mb-4">{useCase.title}</h3>
                <ul className="space-y-3 text-left">
                  {useCase.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-zinc-400 text-sm">
                      <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-4 bg-dark-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '5+', label: 'AI Models' },
              { value: '4x', label: 'Max Upscale' },
              { value: '100%', label: 'Free to Start' },
              { value: '∞', label: 'No Watermarks' }
            ].map((stat, index) => (
              <div key={index} className="glass-card p-6 text-center group hover:border-primary/50 transition-colors">
                <div className="text-3xl md:text-4xl font-bold accent-gradient mb-2">{stat.value}</div>
                <div className="text-sm text-zinc-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] animate-pulse-slow" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Enhance Your Images?</h2>
          <p className="text-zinc-400 text-lg mb-8">Start with our free tier. No credit card required.</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/upscale"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-cyan-400 text-black font-semibold rounded-xl hover:shadow-glow-lg hover:-translate-y-1 transition-all"
            >
              Try AI Upscaling
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              to="/resize"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 glass-button text-white"
            >
              Resize Images
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;

