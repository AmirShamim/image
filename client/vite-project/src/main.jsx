import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './i18n'

// Set initial language direction
const language = localStorage.getItem('language') || 'en';
document.documentElement.setAttribute('lang', language);
document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
