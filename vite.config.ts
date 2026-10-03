import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react-swc';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const MOBILE_OUT_DIR = 'dist-mobile';

const WEB_ONLY_PUBLIC_FILES = [
  'robots.txt',
  'sitemap.xml',
  'manifest.json',
  'og-image.png',
  'favicon.ico',
  'favicon.svg',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'mascot',
];

const WEB_ONLY_HEAD_TAGS =
  /<(?:link|meta)\b[^>]*(?:rel="(?:icon|apple-touch-icon|manifest|canonical)"|property="og:|name="twitter:)[^>]*>\s*/g;

const stripWebOnlyFiles = (): Plugin => ({
  name: 'strip-web-only-files',
  apply: 'build',
  transformIndexHtml: (html) => html.replace(WEB_ONLY_HEAD_TAGS, ''),
  closeBundle: async () => {
    await Promise.all(
      WEB_ONLY_PUBLIC_FILES.map((file) =>
        rm(resolve(MOBILE_OUT_DIR, file), { force: true, recursive: true })
      )
    );
  },
});

export default defineConfig(({ mode }) => ({
  plugins: [react(), mode === 'mobile' && stripWebOnlyFiles()],
  optimizeDeps: { exclude: ['onnxruntime-web'] },
  build: mode === 'mobile' ? { outDir: MOBILE_OUT_DIR } : {},
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
}));
