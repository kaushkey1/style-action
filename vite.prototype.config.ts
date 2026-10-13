import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import fs from 'fs'
import type { Plugin } from 'vite'

const httpsConfig = (() => {
  try {
    const key = fs.readFileSync(resolve(__dirname, 'certs/key.pem'))
    const cert = fs.readFileSync(resolve(__dirname, 'certs/cert.pem'))
    return { key, cert }
  } catch {
    return false
  }
})()

/**
 * Serves prototype.html instead of index.html for all HTML requests.
 * Vite's dev server defaults to index.html — this plugin redirects to prototype.html.
 */
function servePrototypeHtml(): Plugin {
  return {
    name: 'serve-prototype-html',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === '/' || req.url === '/index.html') {
          req.url = '/prototype.html'
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), servePrototypeHtml()],
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
  server: {
    https: httpsConfig || undefined,
    port: 5174,
    host: '0.0.0.0',
  },
  build: {
    outDir: 'dist-prototype',
    rollupOptions: {
      input: resolve(__dirname, 'prototype.html'),
    },
  },
})
