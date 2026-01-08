import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import './Header.css';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/tools', label: 'Tools' },
    { path: '/pricing', label: 'Pricing' },
    { path: '/api', label: 'API' },
    { path: '/about', label: 'About' },
    { path: '/faq', label: 'FAQ' },
    { path: '/contact', label: 'Contact' }
  ];

  const isActive = (path) => location.pathname === path;

  const openAuth = (mode) => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <>
      <header className="main-header">
        <div className="header-container">
          <Link to="/" className="logo">
            <div className="logo-mark">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="28" height="28" rx="6" fill="url(#logo-gradient)"/>
                <path d="M8 20L12 14L16 18L22 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="22" cy="10" r="2" fill="white"/>
                <defs>
                  <linearGradient id="logo-gradient" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00C6A7"/>
                    <stop offset="1" stopColor="#0066FF"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="logo-text">ImageStudio</span>
          </Link>

          <nav className={`main-nav ${menuOpen ? 'open' : ''}`}>
            <ul className="nav-links">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path} 
                    className={isActive(link.path) ? 'active' : ''}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header-actions">
            <button 
              className="theme-toggle" 
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            {user ? (
              <div className="user-menu">
                <div className="user-avatar">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <button onClick={logout} className="logout-btn">
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <button onClick={() => openAuth('login')} className="login-btn">
                  Sign In
                </button>
                <button onClick={() => openAuth('register')} className="signup-btn">
                  Get Started
                </button>
              </div>
            )}

            <button 
              className={`menu-toggle ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
};

export default Header;
