import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';
import PageShell from '../components/PageShell';
import PageHero from '../components/PageHero';

const FAQPage = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = t('faq.questions', { returnObjects: true }) || [
    { question: 'What is AI upscaling?', answer: 'AI upscaling uses machine learning to enhance image resolution while maintaining or improving quality.' },
    { question: 'Is ImageStudio free?', answer: 'Yes! We offer a free tier with limited usage. Pro plans offer unlimited access.' },
    { question: 'What formats are supported?', answer: 'We support JPG, PNG, WebP, and GIF formats for most operations.' },
    { question: 'How is my data protected?', answer: 'Images are processed securely and automatically deleted within 1 hour.' },
    { question: 'What is the maximum file size?', answer: 'Free users can upload up to 10MB. Pro users can upload up to 50MB.' },
    { question: 'Can I use this for commercial projects?', answer: 'Yes, all processed images can be used for personal and commercial purposes.' }
  ];

  return (
    <PageShell>
      <SEO
        title="FAQ - Frequently Asked Questions | ImageStudio"
        description="Find answers to common questions about ImageStudio, AI upscaling, and image processing."
        path="/faq"
      />

      <PageHero
        badge="Support"
        title={t('faq.title')}
        subtitle={t('faq.subtitle')}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* FAQ List */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`glass-card overflow-hidden transition-all duration-300 ${
                openIndex === index ? 'border-[#00d4aa]/40 shadow-glass-lg' : ''
              }`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left"
              >
                <h3 className={`font-medium transition-colors ${openIndex === index ? 'text-[#00d4aa]' : 'text-white'}`}>
                  {faq.question}
                </h3>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                  openIndex === index ? 'bg-[#00d4aa] text-black rotate-45' : 'bg-white/[0.04] border border-white/10 text-zinc-300'
                }`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </button>

              <div className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-48' : 'max-h-0'}`}>
                <p className="px-5 pb-5 text-zinc-300/80 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="glass-card p-8 mt-10 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Still have questions?</h2>
          <p className="text-zinc-400 mb-6">We're here to help.</p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-cyan-400 text-black font-semibold rounded-xl hover:shadow-glow transition-all"
          >
            Contact Us
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </PageShell>
  );
};

export default FAQPage;

