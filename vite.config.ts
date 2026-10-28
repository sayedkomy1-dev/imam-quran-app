import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    base: './',
    build: {
      rollupOptions: {
        output: {
          entryFileNames: 'assets/app.js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name && assetInfo.name.endsWith('.css')) {
              return 'assets/app.css';
            }
            return 'assets/[name][extname]';
          },
        },
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'sw-push.js',
          'assets/aistudio/favicon_3bce66e2.png',
          'assets/aistudio/icon-96_3bce66e2.png',
          'assets/aistudio/icon-192_29a1c2ce.png',
          'assets/aistudio/icon-512_0f792e6f.png',
          'assets/aistudio/icon-maskable_0f792e6f.png',
        ],
        manifest: {
          id: '/',
          name: 'أكاديمية الإمام لتحفيظ القرآن الكريم — بالقرآن نحيا',
          short_name: 'أكاديمية الإمام',
          description:
            'نظام ويب تقدمي متكامل (Offline-First PWA) لإدارة حلقات تحفيظ القرآن الكريم، محرك التسميع الخماسي، السبورة الذكية، الاختبارات والإجازات، والمالية وبوابة ولي الأمر.',
          theme_color: '#145a3a',
          background_color: '#f6f7f2',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          dir: 'rtl',
          lang: 'ar',
          icons: [
            {
              src: '/assets/aistudio/icon-96_3bce66e2.png',
              sizes: '96x96',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/assets/aistudio/icon-192_29a1c2ce.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/assets/aistudio/icon-512_0f792e6f.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/assets/aistudio/icon-maskable_0f792e6f.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
          importScripts: ['/sw-push.js'],
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json}'],
          globIgnores: ['**/*.zip', '**/index-github-pages.html', '**/static-build/**'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/api\.alquran\.cloud\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'quran-api-cache',
                expiration: {
                  maxEntries: 120,
                  maxAgeSeconds: 60 * 60 * 24 * 90,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/everyayah\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'quran-audio-cache',
                expiration: {
                  maxEntries: 300,
                  maxAgeSeconds: 60 * 60 * 24 * 60,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
