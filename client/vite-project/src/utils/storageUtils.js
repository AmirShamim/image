/**
 * Storage Utilities for Batch Processing
 * Handles rate limiting, caching processed images, and localStorage management
 */

const STORAGE_KEYS = {
  PROCESSED_IMAGES: 'imageStudio_processedImages',
  PROCESSING_COUNT: 'imageStudio_processingCount',
  LAST_RESET_DATE: 'imageStudio_lastResetDate',
  BATCH_IN_PROGRESS: 'imageStudio_batchInProgress',
  USER_TIER: 'imageStudio_userTier',
};

// Daily limits based on user tier
const TIER_LIMITS = {
  free: 20,
  pro: 100,
  enterprise: 500,
  admin: Infinity, // Unlimited for admin
};

// Default daily limit for free tier users
const DAILY_LIMIT = 20;

// Maximum images to cache in localStorage (to prevent storage overflow)
const MAX_CACHED_IMAGES = 15;

/**
 * Get today's date string for comparison (YYYY-MM-DD format)
 */
const getTodayString = () => new Date().toISOString().split('T')[0];

/**
 * Set user tier for rate limiting
 * @param {string} tier - User tier ('free', 'pro', 'enterprise', 'admin')
 */
export const setUserTier = (tier) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_TIER, tier);
  } catch (error) {
    console.error('Error setting user tier:', error);
  }
};

/**
 * Get current user tier
 * @returns {string} User tier
 */
export const getUserTier = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.USER_TIER) || 'free';
  } catch {
    return 'free';
  }
};

/**
 * Get daily limit based on user tier
 * @param {string} tier - Optional tier override
 * @returns {number} Daily processing limit
 */
export const getDailyLimit = (tier = null) => {
  const userTier = tier || getUserTier();
  return TIER_LIMITS[userTier] || DAILY_LIMIT;
};

/**
 * Check if user is admin (bypasses all limits)
 * @returns {boolean}
 */
export const isAdminUser = () => {
  return getUserTier() === 'admin';
};

/**
 * Check and reset daily count if it's a new day
 */
const checkAndResetDailyCount = () => {
  try {
    const lastReset = localStorage.getItem(STORAGE_KEYS.LAST_RESET_DATE);
    const today = getTodayString();

    if (lastReset !== today) {
      localStorage.setItem(STORAGE_KEYS.PROCESSING_COUNT, '0');
      localStorage.setItem(STORAGE_KEYS.LAST_RESET_DATE, today);
      return true; // Was reset
    }
    return false;
  } catch (error) {
    console.error('Error checking daily count:', error);
    return false;
  }
};

/**
 * Get current processing count for today
 * @returns {number} Number of images processed today
 */
export const getProcessingCount = () => {
  checkAndResetDailyCount();
  try {
    return parseInt(localStorage.getItem(STORAGE_KEYS.PROCESSING_COUNT) || '0', 10);
  } catch {
    return 0;
  }
};

/**
 * Increment processing count by specified amount
 * @param {number} count - Number to increment by (default: 1)
 * @returns {number} New total count
 */
export const incrementProcessingCount = (count = 1) => {
  checkAndResetDailyCount();
  try {
    const current = getProcessingCount();
    const newCount = current + count;
    localStorage.setItem(STORAGE_KEYS.PROCESSING_COUNT, String(newCount));
    return newCount;
  } catch {
    return count;
  }
};

/**
 * Check if user can process more images
 * @param {number} requestedCount - Number of images user wants to process
 * @returns {boolean} True if user can process the requested amount
 */
export const canProcessImages = (requestedCount = 1) => {
  // Admin users can always process
  if (isAdminUser()) {
    return true;
  }
  const current = getProcessingCount();
  const limit = getDailyLimit();
  return current + requestedCount <= limit;
};

/**
 * Get remaining processing count for today
 * @returns {number} Number of images user can still process today
 */
export const getRemainingCount = () => {
  // Admin users have unlimited
  if (isAdminUser()) {
    return Infinity;
  }
  const limit = getDailyLimit();
  return Math.max(0, limit - getProcessingCount());
};

/**
 * Mark batch processing as in progress
 */
export const setBatchInProgress = (inProgress) => {
  try {
    if (inProgress) {
      localStorage.setItem(STORAGE_KEYS.BATCH_IN_PROGRESS, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.BATCH_IN_PROGRESS);
    }
  } catch (error) {
    console.error('Error setting batch progress state:', error);
  }
};

/**
 * Check if a batch is currently in progress
 * @returns {boolean}
 */
export const isBatchInProgress = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.BATCH_IN_PROGRESS) === 'true';
  } catch {
    return false;
  }
};

/**
 * Save processed images to localStorage
 * Stores image metadata and base64 data for persistence
 * @param {Array} images - Array of processed image objects
 * @returns {boolean} Success status
 */
export const saveProcessedImages = (images) => {
  try {
    const existing = getProcessedImages();
    const updated = [...existing, ...images];
    // Keep only the most recent images to manage storage
    const trimmed = updated.slice(-MAX_CACHED_IMAGES);
    localStorage.setItem(STORAGE_KEYS.PROCESSED_IMAGES, JSON.stringify(trimmed));
    return true;
  } catch (error) {
    console.error('Failed to save images to localStorage:', error);
    // Storage might be full - try with fewer images
    if (error.name === 'QuotaExceededError') {
      try {
        // Clear existing and save only the new ones (limited)
        localStorage.removeItem(STORAGE_KEYS.PROCESSED_IMAGES);
        const limited = images.slice(-5);
        localStorage.setItem(STORAGE_KEYS.PROCESSED_IMAGES, JSON.stringify(limited));
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
};

/**
 * Get processed images from localStorage
 * @returns {Array} Array of cached processed images
 */
export const getProcessedImages = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PROCESSED_IMAGES);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Clear all cached processed images
 */
export const clearProcessedImages = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.PROCESSED_IMAGES);
  } catch (error) {
    console.error('Error clearing processed images:', error);
  }
};

/**
 * Check if there are cached processed images
 * @returns {boolean}
 */
export const hasCachedImages = () => {
  return getProcessedImages().length > 0;
};

/**
 * Convert blob to base64 string for localStorage storage
 * @param {Blob} blob - Image blob
 * @returns {Promise<string>} Base64 encoded string
 */
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Convert base64 string back to blob
 * @param {string} base64 - Base64 encoded string
 * @returns {Promise<Blob>} Blob object
 */
export const base64ToBlob = async (base64) => {
  try {
    const response = await fetch(base64);
    return await response.blob();
  } catch (error) {
    console.error('Error converting base64 to blob:', error);
    return null;
  }
};

/**
 * Get storage usage info
 * @returns {Object} Storage usage information
 */
export const getStorageInfo = () => {
  try {
    let totalSize = 0;
    for (const key of Object.values(STORAGE_KEYS)) {
      const item = localStorage.getItem(key);
      if (item) {
        totalSize += item.length * 2; // UTF-16 uses 2 bytes per character
      }
    }
    return {
      usedBytes: totalSize,
      usedMB: (totalSize / (1024 * 1024)).toFixed(2),
      cachedImageCount: getProcessedImages().length,
    };
  } catch {
    return { usedBytes: 0, usedMB: '0', cachedImageCount: 0 };
  }
};

/**
 * Clear all storage data (for debugging/reset purposes)
 */
export const clearAllStorageData = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing storage data:', error);
  }
};

