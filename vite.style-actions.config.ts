import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import { createRequire } from 'module';
import type { Plugin } from 'vite';

const require = createRequire(import.meta.url);
const { getBrowserConfig } = require('./config.cjs');

/**
 * Dev/test-only host for the Style Actions product module (style-actions.html).
 * Serves the module without the app shell so integrated journeys see only this
 * frontend and the Style Actions backend. Not used by `npm run build`.
 *
 *   STYLE_ACTIONS_HOST_BUILD=<id> API_BASE_URL=https://api.impetusz0.de \
 *     npx vite --config vite.style-actions.config.ts
 */
function styleActionsHost(browserConfig: Record<string, string>): Plugin {
  return {
    name: 'style-actions-host',
    transformIndexHtml() {
      return [{ tag: 'script', children: `window._conf=${JSON.stringify(browserConfig)};`, injectTo: 'head-prepend' }];
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/__build') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ build_id: process.env.STYLE_ACTIONS_HOST_BUILD ?? 'dev' }));
          return;
        }
        const path = (req.url ?? '/').split('?')[0];
        const isPage = req.headers.accept?.includes('text/html') && !path.includes('.');
        if (path === '/' || isPage) req.url = '/style-actions.html';
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const browserConfig = getBrowserConfig(loadEnv(mode, process.cwd(), ''));
  return {
    plugins: [react(), tailwindcss(), styleActionsHost(browserConfig)],
    resolve: { alias: { '@': resolve(__dirname, './src') } },
    server: { host: '127.0.0.1', port: 5195, strictPort: true },
  };
});
