// fingerprint.js - Generate browser fingerprint for guest users
export const generateFingerprint = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('fingerprint', 2, 2);
  
  const canvasData = canvas.toDataURL();
  
  const data = {
    canvas: canvasData,
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    colorDepth: screen.colorDepth,
    deviceMemory: navigator.deviceMemory || 'unknown',
    hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
  };
  
  // Simple hash function
  const hash = JSON.stringify(data).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return `fp_${Math.abs(hash).toString(36)}`;
};

export const getOrCreateFingerprint = () => {
  let fingerprint = localStorage.getItem('browser_fingerprint');
  if (!fingerprint) {
    fingerprint = generateFingerprint();
    localStorage.setItem('browser_fingerprint', fingerprint);
  }
  return fingerprint;
};
