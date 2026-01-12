import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load only VITE_ variables (prevents accidentally pulling in secrets)
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  // In dev, proxy requests to the backend.
  // Prefer VITE_API_URL locally; fallback keeps current behavior.
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5000';

  console.log(`Using Proxy Target: ${apiTarget}`);

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        '/upscale': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        '/resize': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        '/get-dimensions': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
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