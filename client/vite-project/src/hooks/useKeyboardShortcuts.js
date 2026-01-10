import { useEffect, useCallback } from 'react';

/**
 * Custom hook for handling keyboard shortcuts
 * @param {Object} shortcuts - Object mapping key combinations to handlers
 * @param {boolean} enabled - Whether shortcuts are enabled
 *
 * Key format examples:
 * - 'ctrl+s' - Ctrl + S
 * - 'ctrl+shift+p' - Ctrl + Shift + P
 * - 'escape' - Escape key
 * - 'enter' - Enter key
 */
export const useKeyboardShortcuts = (shortcuts, enabled = true) => {
  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in inputs
    const target = event.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Allow Escape to work in inputs
      if (event.key !== 'Escape') return;
    }

    const keys = [];
    if (event.ctrlKey || event.metaKey) keys.push('ctrl');
    if (event.shiftKey) keys.push('shift');
    if (event.altKey) keys.push('alt');

    const key = event.key.toLowerCase();
    if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
      keys.push(key);
    }

    const combo = keys.join('+');

    if (shortcuts[combo]) {
      event.preventDefault();
      shortcuts[combo](event);
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

/**
 * Common keyboard shortcuts for the application
 */
export const COMMON_SHORTCUTS = {
  SAVE: 'ctrl+s',
  UNDO: 'ctrl+z',
  REDO: 'ctrl+shift+z',
  ESCAPE: 'escape',
  ENTER: 'enter',
  DELETE: 'delete',
  SELECT_ALL: 'ctrl+a',
  DOWNLOAD: 'ctrl+d',
  PROCESS: 'ctrl+enter',
  TOGGLE_THEME: 'ctrl+shift+t',
};

export default useKeyboardShortcuts;

