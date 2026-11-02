import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function githubPagesDeployHelperPlugin() {
  return {
    name: 'github-pages-deploy-helper',
    closeBundle() {
      try {
        const distDir = path.resolve(__dirname, 'dist');
        if (fs.existsSync(distDir)) {
          fs.writeFileSync(path.join(distDir, 'CNAME'), 'welivequranacademy.online\n', 'utf-8');
          fs.writeFileSync(path.join(distDir, '.nojekyll'), '', 'utf-8');
          fs.writeFileSync(path.join(distDir, '_redirects'), '/* /index.html 200\n', 'utf-8');

          const indexPath = path.join(distDir, 'index.html');
          if (fs.existsSync(indexPath)) {
            fs.copyFileSync(indexPath, path.join(distDir, '404.html'));

            // Create physical portal route directories so GitHub Pages returns HTTP 200 OK
            // for every direct portal URL and PWA installation works 100% natively
            const portalRoutes = [
              'student',
              'Student',
              'guardian',
              'Guardian',
              'owner',
              'Owner',
              'general',
              'General',
              'almushaf',
              'AlMushaf',
              'sadaqa',
              'Sadaqa',
            ];
            for (const route of portalRoutes) {
              const routeDir = path.join(distDir, route);
              fs.mkdirSync(routeDir, {recursive: true});
              fs.copyFileSync(indexPath, path.join(routeDir, 'index.html'));
            }
          }

          // Also mirror compiled assets/app.js and assets/app.css into root /assets/
          // so GitHub Pages works 100% whether configured as "GitHub Actions" (dist/)
          // OR "Deploy from a branch: main / (root)"
          const rootAssetsDir = path.resolve(__dirname, 'assets');
          fs.mkdirSync(rootAssetsDir, {recursive: true});
          const builtJs = path.join(distDir, 'assets', 'app.js');
          const builtCss = path.join(distDir, 'assets', 'app.css');
          if (fs.existsSync(builtJs)) {
            fs.copyFileSync(builtJs, path.join(rootAssetsDir, 'app.js'));
          }
          if (fs.existsSync(builtCss)) {
            fs.copyFileSync(builtCss, path.join(rootAssetsDir, 'app.css'));
          }
          const publicSwPush = path.resolve(__dirname, 'public', 'sw-push.js');
          if (fs.existsSync(publicSwPush)) {
            fs.copyFileSync(publicSwPush, path.join(distDir, 'sw-push.js'));
            fs.copyFileSync(publicSwPush, path.resolve(__dirname, 'sw-push.js'));
          }
        }
      } catch {
        // non-blocking in development
      }
    },
  };
}

export default defineConfig(() => {
  return {
    base: '/',
    build: {
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
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
      githubPagesDeployHelperPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'sw-push.js',
          'icon.svg',
          'mushaf-corner.svg',
          'mushaf-title-ornament.svg',
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
