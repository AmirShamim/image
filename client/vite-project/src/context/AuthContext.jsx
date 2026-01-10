import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/auth';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const response = await authService.getMe();
          setUser(response.user);
        } catch (err) {
          // Token is invalid or expired
          localStorage.removeItem('auth_token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const response = await authService.login(email, password);
      
      // Check if verification is required
      if (response.requiresVerification) {
        return response; // Return without setting user/token
      }
      
      localStorage.setItem('auth_token', response.token);
      setUser(response.user);
      return response;
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed';
      setError(message);
      throw err; // Throw original error with response data
    }
  }, []);

  const register = useCallback(async (email, username, password) => {
    setError(null);
    try {
      const response = await authService.register(email, username, password);
      
      // Check if verification is required
      if (response.requiresVerification) {
        return response; // Return without setting user/token
      }
      
      localStorage.setItem('auth_token', response.token);
      setUser(response.user);
      return response;
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed';
      setError(message);
      throw err; // Throw original error
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      // Ignore errors on logout
    } finally {
      localStorage.removeItem('auth_token');
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (data) => {
    setError(null);
    try {
      const response = await authService.updateProfile(data);
      setUser(response.user);
      return response;
    } catch (err) {
      const message = err.response?.data?.error || 'Update failed';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    setError(null);
    try {
      const response = await authService.changePassword(currentPassword, newPassword);
      return response;
    } catch (err) {
      const message = err.response?.data?.error || 'Password change failed';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const deleteAccount = useCallback(async (password) => {
    setError(null);
    try {
      await authService.deleteAccount(password);
      localStorage.removeItem('auth_token');
      setUser(null);
    } catch (err) {
      const message = err.response?.data?.error || 'Account deletion failed';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const uploadProfilePicture = useCallback(async (file) => {
    setError(null);
    try {
      const response = await authService.uploadProfilePicture(file);
      setUser(response.user);
      return response;
    } catch (err) {
      const message = err.response?.data?.error || 'Profile picture upload failed';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const deleteProfilePicture = useCallback(async () => {
    setError(null);
    try {
      const response = await authService.deleteProfilePicture();
      setUser(response.user);
      return response;
    } catch (err) {
      const message = err.response?.data?.error || 'Profile picture deletion failed';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Admin and Premium role helpers
  const isAdmin = user?.role === 'admin' || user?.email === 'amirshamim312@gmail.com';
  const isPremium = user?.subscription_tier === 'pro' || user?.subscription_tier === 'enterprise' || isAdmin;
  const canBypassLimits = isAdmin || isPremium;

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin,
    isPremium,
    canBypassLimits,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
    uploadProfilePicture,
    deleteProfilePicture,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
