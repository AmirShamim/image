import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ar from './locales/ar.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import zh from './locales/zh.json';
import hi from './locales/hi.json';

// Supported languages
const supportedLanguages = ['en', 'ar', 'es', 'fr', 'de', 'zh', 'hi'];

// Detect browser language
const detectBrowserLanguage = () => {
  // Check localStorage first
  const savedLang = localStorage.getItem('language');
  if (savedLang && supportedLanguages.includes(savedLang)) {
    return savedLang;
  }

  // Get browser language
  const browserLang = navigator.language || navigator.userLanguage;
  const shortLang = browserLang.split('-')[0]; // 'en-US' -> 'en'

  // Check if browser language is supported
  if (supportedLanguages.includes(shortLang)) {
    return shortLang;
  }

  // Fallback to English
  return 'en';
};

const detectedLanguage = detectBrowserLanguage();

// Set document attributes for RTL support
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('lang', detectedLanguage);
  document.documentElement.setAttribute('dir', detectedLanguage === 'ar' ? 'rtl' : 'ltr');
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
      es: { translation: es },
      fr: { translation: fr },
      de: { translation: de },
      zh: { translation: zh },
      hi: { translation: hi }
    },
    lng: detectedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
