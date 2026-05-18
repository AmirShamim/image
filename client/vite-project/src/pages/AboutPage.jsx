import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';
import { Zap, Lock, Target, Globe } from 'lucide-react';
import PageShell from '../components/PageShell';

const AboutPage = () => {
  const { t } = useTranslation();

  const features = [
    { icon: <Zap className="w-8 h-8 text-primary" />, title: 'Fast Processing', description: 'Process images in seconds with our optimized AI models.' },
    { icon: <Lock className="w-8 h-8 text-primary" />, title: 'Privacy First', description: 'Your images are processed securely and deleted automatically.' },
    { icon: <Target className="w-8 h-8 text-primary" />, title: 'High Quality', description: 'Advanced AI algorithms ensure the best possible results.' },
    { icon: <Globe className="w-8 h-8 text-primary" />, title: 'Global Access', description: 'Available worldwide with multiple language support.' }
  ];

  return (
    <PageShell>
      <SEO
        title="About ImageStudio - AI Image Processing"
        description="Learn about ImageStudio, our mission, and how we're making professional image tools accessible to everyone."
        path="/about"
      />
      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium mb-4 tracking-wide uppercase">
              About Us
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-6">{t('about.title')}</h1>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto leading-relaxed">
              {t('about.description')}
            </p>
          </div>

          {/* Mission */}
          <div className="glass-card p-8 md:p-12 mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="w-1 h-8 bg-gradient-to-b from-primary to-cyan-400 rounded-full" />
              {t('about.mission.title')}
            </h2>
            <p className="text-zinc-400 leading-relaxed text-lg">
              {t('about.mission.description')}
            </p>
          </div>

          {/* Features */}
          <div className="grid sm:grid-cols-2 gap-6 mb-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-card-hover p-6"
              >
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 mb-5">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="glass-card p-8 md:p-12 text-center bg-gradient-to-br from-primary/5 to-cyan-500/5">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-zinc-400 mb-6">Try our tools for free today.</p>
            <Link
              to="/tools"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-cyan-400 text-black font-semibold rounded-xl hover:shadow-glow hover:-translate-y-1 transition-all"
            >
              Explore Tools
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </main>    </PageShell>
  );
};

export default AboutPage;

