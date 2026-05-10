import React, { useState } from 'react';
import { verifyEmail, resendVerification } from '../services/auth';

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
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md glass-card p-8 shadow-glass-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">Verify Your Email</h2>
          <p className="text-zinc-400 text-sm">We sent a 6-digit code to <strong className="text-white">{email}</strong></p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Verification Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              required
              className="w-full px-4 py-3 bg-dark-600 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-primary focus:outline-none transition-colors text-center text-2xl tracking-[0.5em]"
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-3.5 bg-gradient-to-r from-primary to-cyan-400 text-black font-semibold rounded-xl hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              'Verify Email'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-400">
          <button 
            onClick={handleResend} 
            disabled={resendLoading}
            className="text-primary hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {resendLoading ? 'Sending...' : 'Resend Code'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;
