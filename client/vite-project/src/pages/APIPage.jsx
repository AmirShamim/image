import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const APIPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('curl');

  const codeExamples = {
    curl: `curl -X POST https://api.imagestudio.com/v1/upscale \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: multipart/form-data" \\
  -F "image=@photo.jpg" \\
  -F "scale=2"`,
    javascript: `const response = await fetch('https://api.imagestudio.com/v1/upscale', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
  },
  body: formData
});

const result = await response.json();`,
    python: `import requests

response = requests.post(
    'https://api.imagestudio.com/v1/upscale',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
    files={'image': open('photo.jpg', 'rb')},
    data={'scale': 2}
)

result = response.json()`
  };

  const endpoints = [
    { method: 'POST', path: '/v1/upscale', description: 'Upscale an image using AI models' },
    { method: 'POST', path: '/v1/resize', description: 'Resize an image to specific dimensions' },
    { method: 'GET', path: '/v1/usage', description: 'Get your API usage statistics' },
    { method: 'GET', path: '/v1/models', description: 'List available AI models' }
  ];

  const features = [
    { icon: '⚡', title: 'Fast & Reliable', description: 'Low latency API with 99.9% uptime guarantee' },
    { icon: '🔑', title: 'Simple Auth', description: 'Bearer token authentication for easy integration' },
    { icon: '📊', title: 'Webhooks', description: 'Get notified when processing completes' }
  ];

  return (
    <div className="min-h-screen bg-dark-900">
      <SEO
        title="API Documentation | ImageStudio"
        description="Integrate ImageStudio's powerful image processing capabilities into your applications with our REST API."
        path="/api"
      />
      <Header />

      <main className="pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-400 text-sm font-medium mb-4">
              Developer API
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{t('api.title')}</h1>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">{t('api.subtitle')}</p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {features.map((feature, index) => (
              <div key={index} className="glass-card-hover p-6 text-center">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Code Example */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white text-center mb-8">Quick Start</h2>

            <div className="flex gap-2 mb-4">
              {Object.keys(codeExamples).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-indigo-500 text-white'
                      : 'bg-dark-600 text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="relative glass-card p-6 overflow-x-auto">
              <pre className="text-sm text-zinc-300 font-mono whitespace-pre-wrap">
                {codeExamples[activeTab]}
              </pre>
              <button
                onClick={() => navigator.clipboard.writeText(codeExamples[activeTab])}
                className="absolute top-4 right-4 px-3 py-1.5 text-xs font-medium bg-dark-600 text-zinc-400 rounded-lg hover:text-white hover:border-indigo-500 border border-white/10 transition-colors"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Endpoints */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white text-center mb-8">Endpoints</h2>
            <div className="space-y-3">
              {endpoints.map((endpoint, index) => (
                <div key={index} className="glass-card p-5 flex flex-wrap items-center gap-4">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                    endpoint.method === 'POST' 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg text-sm font-mono">
                    {endpoint.path}
                  </code>
                  <span className="text-zinc-400 text-sm">{endpoint.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="glass-card p-8 text-center bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border-indigo-500/30">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to integrate?</h2>
            <p className="text-zinc-400 mb-6">Get your API key and start building.</p>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-500 text-white font-semibold rounded-xl hover:bg-indigo-600 hover:-translate-y-0.5 transition-all"
            >
              Get API Key
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default APIPage;

