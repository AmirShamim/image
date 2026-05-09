import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load only VITE_ variables (prevents accidentally pulling in secrets)
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  // In dev, proxy requests to the backend.
  // Prefer VITE_API_URL locally; fallback keeps current behavior.
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5000';

  console.log(`Using Proxy Target: ${apiTarget}`);

  // GPU upscaling can take 30-120s (cold start + inference + base64 transfer).
  // Vite's default proxy timeout is too short and causes ECONNRESET on long requests.
  const PROXY_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          timeout: PROXY_TIMEOUT_MS,
          proxyTimeout: PROXY_TIMEOUT_MS,
        },
        '/profile_pictures': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        '/processed': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})