import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import UserProfile from './UserProfile';
import './Auth.css';

const UserButton = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  if (loading) {
    return (
      <div className="user-section">
        <div className="login-btn" style={{ opacity: 0.5 }}>
          <span className="auth-spinner" style={{ width: 16, height: 16 }}></span>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="user-section">
        <button className="user-btn" onClick={() => setShowProfile(true)}>
          <span className="user-avatar">
            {user.profile_picture ? (
              <img 
                src={user.profile_picture} 
                alt={user.username} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            ) : (
              user.username?.[0]?.toUpperCase() || 'U'
            )}
          </span>
          <span>{user.username}</span>
        </button>
        <UserProfile 
          isOpen={showProfile} 
          onClose={() => setShowProfile(false)} 
        />
      </div>
    );
  }

  return (
    <div className="user-section">
      <button className="login-btn" onClick={() => setShowAuthModal(true)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        Sign In
      </button>
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
};

export default UserButton;
