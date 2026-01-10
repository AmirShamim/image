import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: t('tools.title'), path: '/tools' },
      { label: t('home.tools.upscale.title'), path: '/upscale' },
      { label: t('home.tools.resize.title'), path: '/resize' },
      { label: t('home.tools.compress.title'), path: '/compress' },
      { label: t('nav.pricing'), path: '/pricing' },
    ],
    resources: [
      { label: t('api.title'), path: '/api' },
      { label: t('nav.faq'), path: '/faq' },
      { label: t('nav.about'), path: '/about' },
      { label: t('nav.contact'), path: '/contact' },
    ],
    legal: [
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms of Service', path: '/terms' },
    ],
  };

  return (
    <footer className="border-t border-white/[0.06] bg-black/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="w-8 h-8">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="28" height="28" rx="6" fill="url(#footer-logo-gradient)" />
                  <path d="M8 20L12 14L16 18L22 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="22" cy="10" r="2" fill="white" />
                  <defs>
                    <linearGradient id="footer-logo-gradient" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00d4aa" />
                      <stop offset="1" stopColor="#00a8cc" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="text-lg font-semibold text-white group-hover:text-primary transition-colors">ImageStudio</span>
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed">{t('footer.tagline')}</p>
          </div>

          {/* Links */}
          <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-4">{t('footer.product')}</h4>
              <ul className="space-y-3">
                {footerLinks.product.map((link, index) => (
                  <li key={index}>
                    <Link to={link.path} className="text-sm text-zinc-400 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-4">{t('footer.resources')}</h4>
              <ul className="space-y-3">
                {footerLinks.resources.map((link, index) => (
                  <li key={index}>
                    <Link to={link.path} className="text-sm text-zinc-400 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-4">{t('footer.legal')}</h4>
              <ul className="space-y-3">
                {footerLinks.legal.map((link, index) => (
                  <li key={index}>
                    <Link to={link.path} className="text-sm text-zinc-400 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.06]">
          <p className="text-sm text-zinc-600 text-center">{t('footer.copyright', { year: currentYear })}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

