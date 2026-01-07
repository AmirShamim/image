import React, { useState } from 'react';
import { verifyEmail, resendVerification } from '../services/auth';
import './Auth.css';

const VerificationModal = ({ isOpen, onClose, email, onVerified }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (code.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      const response = await verifyEmail(email, code);
      setSuccess('Email verified successfully!');
      
      // Store token if provided
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      
      setTimeout(() => {
        onVerified && onVerified(response);
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setResendLoading(true);
    
    try {
      await resendVerification(email);
      setSuccess('Verification code resent! Check your email.');
    } catch (err) {
      const errorData = err.response?.data;
      const errorMsg = errorData?.error || 'Failed to resend code';
      const errorType = errorData?.errorType;
      
      // Add helpful context based on error type
      if (errorType === 'DNS_ERROR' || errorType === 'CONNECTION_ERROR') {
        setError(`${errorMsg} Please try again in a few moments.`);
      } else if (errorType === 'CONFIG_ERROR') {
        setError('Email service is currently unavailable. Please contact support.');
      } else if (errorType === 'RATE_LIMIT') {
        setError('Too many attempts. Please wait a few minutes before trying again.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setResendLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="auth-modal-header">
          <h2>Verify Your Email</h2>
          <p>We sent a 6-digit code to <strong>{email}</strong></p>
        </div>

        <form onSubmit={handleVerify} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <div className="form-group">
            <label>Verification Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              maxLength={6}
              required
              style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading || code.length !== 6}>
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            onClick={handleResend} 
            disabled={resendLoading}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--primary-color)', 
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {resendLoading ? 'Sending...' : 'Resend Code'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;
