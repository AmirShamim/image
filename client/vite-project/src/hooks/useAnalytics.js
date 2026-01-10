/**
 * Analytics Hook for ImageStudio
 *
 * Tracks page views and tool usage on the frontend
 * Privacy-friendly: no cookies, fingerprint-based
 */

import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const API_URL = '';

// Generate a session ID that persists for the browser session
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

/**
 * Track a page view
 */
export const trackPageView = async (path, title) => {
  try {
    await fetch(`${API_URL}/api/analytics/pageview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: path || window.location.pathname,
        title: title || document.title,
        referrer: document.referrer,
        sessionId: getSessionId()
      })
    });
  } catch (error) {
    // Silently fail - analytics shouldn't break the app
    console.debug('Analytics pageview error:', error.message);
  }
};

/**
 * Track tool usage
 */
export const trackToolUsage = async (options) => {
  try {
    await fetch(`${API_URL}/api/analytics/tool`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolName: options.toolName,
        toolAction: options.toolAction || 'process',
        inputFileSize: options.inputFileSize,
        outputFileSize: options.outputFileSize,
        processingTimeMs: options.processingTimeMs,
        settings: options.settings || {},
        success: options.success !== false,
        errorMessage: options.errorMessage || null
      })
    });
  } catch (error) {
    console.debug('Analytics tool tracking error:', error.message);
  }
};

/**
 * Hook to automatically track page views on route changes
 */
export const usePageTracking = () => {
  const location = useLocation();
  const lastTracked = useRef('');

  useEffect(() => {
    // Avoid duplicate tracking
    const currentPath = location.pathname + location.search;
    if (currentPath === lastTracked.current) return;
    lastTracked.current = currentPath;

    // Track after a small delay to ensure title is updated
    const timer = setTimeout(() => {
      trackPageView(location.pathname);
    }, 100);

    return () => clearTimeout(timer);
  }, [location]);
};

/**
 * Hook to track tool usage with timing
 */
export const useToolTracking = () => {
  const startTimeRef = useRef(null);

  const startTracking = useCallback(() => {
    startTimeRef.current = Date.now();
  }, []);

  const endTracking = useCallback(async (options) => {
    const processingTimeMs = startTimeRef.current
      ? Date.now() - startTimeRef.current
      : null;

    await trackToolUsage({
      ...options,
      processingTimeMs
    });

    startTimeRef.current = null;
  }, []);

  return { startTracking, endTracking };
};

export default {
  trackPageView,
  trackToolUsage,
  usePageTracking,
  useToolTracking
};

