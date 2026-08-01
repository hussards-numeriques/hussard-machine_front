import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: { exclude: ['onnxruntime-web'] },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': process.env.VITE_DEV_PROXY_TARGET || 'http://localhost:8000',
      '/ws': {
        target: (process.env.VITE_DEV_PROXY_TARGET || 'http://localhost:8000').replace(
          /^http/,
          'ws'
        ),
        ws: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    pool: 'forks',
    maxConcurrency: 1,
  },
});
