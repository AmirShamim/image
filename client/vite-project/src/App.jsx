import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import HomePage from './pages/HomePage';
import ToolsPage from './pages/ToolsPage';
import AboutPage from './pages/AboutPage';
import FAQPage from './pages/FAQPage';
import APIPage from './pages/APIPage';
import ContactPage from './pages/ContactPage';
import PricingPage from './pages/PricingPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import UpscalePage from './pages/UpscalePage';
import ResizePage from './pages/ResizePage';
import ComingSoonPage from './pages/ComingSoonPage';

// RTL languages
const rtlLanguages = ['ar', 'he', 'fa', 'ur'];

function AppContent() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const isRtl = rtlLanguages.includes(i18n.language);
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <div className="app">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/tools" element={<ToolsPage />} />
              <Route path="/upscale" element={<UpscalePage />} />
              <Route path="/resize" element={<ResizePage />} />
              <Route path="/compress" element={<ComingSoonPage />} />
              <Route path="/convert" element={<ComingSoonPage />} />
              <Route path="/crop" element={<ComingSoonPage />} />
              <Route path="/remove-background" element={<ComingSoonPage />} />
              <Route path="/watermark" element={<ComingSoonPage />} />
              <Route path="/batch" element={<ComingSoonPage />} />
              <Route path="/enhance" element={<ComingSoonPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/api" element={<APIPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
            </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
