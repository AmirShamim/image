import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import UserProfile from './UserProfile';
import LanguageSelector from './LanguageSelector';
import './Header.css';

const Header = () => {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/tools', label: t('nav.tools') },
    { path: '/pricing', label: t('nav.pricing') },
    { path: '/api', label: t('nav.api') },
    { path: '/about', label: t('nav.about') },
    { path: '/faq', label: t('nav.faq') },
    { path: '/contact', label: t('nav.contact') }
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
            <LanguageSelector />
            
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
              <div className="user-menu" ref={dropdownRef}>
                <button 
                  className="user-avatar-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                >
                  {user.profile_picture ? (
                    <img 
                      src={user.profile_picture} 
                      alt={user.username || 'Profile'} 
                      className="user-avatar-img"
                    />
                  ) : (
                    <div className="user-avatar">
                      {(user.username || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <svg className={`dropdown-arrow ${userDropdownOpen ? 'open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                
                {userDropdownOpen && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <span className="user-dropdown-name">{user.username || 'User'}</span>
                      <span className="user-dropdown-email">{user.email}</span>
                      <span className="user-dropdown-tier">{user.subscription_tier || 'Free'} Plan</span>
                    </div>
                    <div className="user-dropdown-divider" />
                    <button 
                      className="user-dropdown-item"
                      onClick={() => {
                        setProfileModalOpen(true);
                        setUserDropdownOpen(false);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      {t('header.profile')}
                    </button>
                    <Link 
                      to="/pricing" 
                      className="user-dropdown-item"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5"/>
                        <path d="M2 12l10 5 10-5"/>
                      </svg>
                      {t('header.upgradePlan')}
                    </Link>
                    <div className="user-dropdown-divider" />
                    <button 
                      className="user-dropdown-item logout"
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      {t('header.signOut')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <button onClick={() => openAuth('login')} className="login-btn">
                  {t('header.signIn')}
                </button>
                <button onClick={() => openAuth('register')} className="signup-btn">
                  {t('header.getStarted')}
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

      <UserProfile
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </>
  );
};

export default Header;
