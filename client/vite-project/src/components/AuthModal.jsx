import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import VerificationModal from './VerificationModal';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const { login, register, setUser } = useAuth();

  const resetForm = () => {
    setEmail('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        const response = await register(email, username, password);

        if (response.requiresVerification) {
          setRegisteredEmail(response.email || email);
          if (response.emailError) {
            setError(response.emailError);
            setSuccess('Account created! Click "Resend Code" to try sending verification email again.');
          } else {
            setSuccess('Registration successful! Please check your email for verification code.');
          }
          setTimeout(() => setShowVerification(true), 1500);
        } else {
          setSuccess('Account created successfully!');
          setTimeout(() => onClose(), 1000);
        }
      } else {
        const response = await login(email, password);
        if (response.requiresVerification) {
          setRegisteredEmail(response.email || email);
          setError('Please verify your email before logging in');
          setTimeout(() => setShowVerification(true), 1500);
        } else {
          setSuccess('Login successful!');
          setTimeout(() => onClose(), 500);
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      if (errorMsg.includes('verify') && err.response?.data?.requiresVerification) {
        setRegisteredEmail(err.response.data.email || email);
        setError(errorMsg);
        setTimeout(() => setShowVerification(true), 1500);
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerified = (response) => {
    if (response.user && response.token) {
      setUser(response.user);
      setSuccess('Email verified! Logging you in...');
      setTimeout(() => onClose(), 500);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-md glass-card p-8 shadow-glass-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-1">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-zinc-400 text-sm">
              {mode === 'login'
                ? 'Sign in to your account'
                : 'Create your free account. No credit card required.'}
            </p>
          </div>

          {mode === 'register' && (
            <div className="glass mb-6 rounded-xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">You’ll get</p>
              <ul className="grid grid-cols-1 gap-2 text-sm text-zinc-300">
                {[
                  'Free image resizing (unlimited)',
                  'AI upscaling with daily limits',
                  'Image history (when logged in)',
                  'Access to premium plans later'
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 inline-block w-1.5 h-1.5 rounded-full bg-[#00d4aa]" />
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-dark-600 rounded-xl mb-6">
            <button
              onClick={() => switchMode('login')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-primary text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => switchMode('register')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-primary text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {mode === 'login' ? (
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Email or Username</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email or username"
                  required
                  className="w-full px-4 py-3 bg-dark-600 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3 bg-dark-600 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  required
                  pattern="[a-zA-Z0-9_]{3,30}"
                  className="w-full px-4 py-3 bg-dark-600 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-3 bg-dark-600 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 bg-dark-600 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-primary to-cyan-400 text-black font-semibold rounded-xl hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-zinc-400">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button onClick={() => switchMode('register')} className="text-primary hover:underline font-medium">
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button onClick={() => switchMode('login')} className="text-primary hover:underline font-medium">
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      <VerificationModal
        isOpen={showVerification}
        onClose={() => setShowVerification(false)}
        email={registeredEmail}
        onVerified={handleVerified}
      />
    </>
  );
};

export default AuthModal;

