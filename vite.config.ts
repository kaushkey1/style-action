import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import { resolve, join } from "path";
import { createRequire } from "module";
import fs from "fs";
import type { Plugin } from "vite";

const require = createRequire(import.meta.url);
const { getBrowserConfig, get } = require("./config.cjs");
const CONFIG_BLOCK_PATTERN =
  /<!-- <script>\s*{{#configJS}} \{\{\{configJS\}\}\} \{\{\/configJS\}\}\s*<\/script> -->/;
const ENV_CONFIG_SCRIPT_PATTERN =
  /<script>\s*var baseDomain = window\.location\.origin;\s*document\.write\([^)]+\);\s*<\/script>/;

function serveLayouts(): Plugin {
  const layoutsDir = join(process.env.HOME || "", "Desktop/dg2n-layouts/html");
  return {
    name: "serve-layouts",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith("/layouts/")) {
          const file = req.url.replace("/layouts/", "");
          const filePath = join(layoutsDir, file);
          if (fs.existsSync(filePath)) {
            res.setHeader("Content-Type", "text/html");
            res.end(fs.readFileSync(filePath, "utf-8"));
            return;
          }
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const browserConfig = getBrowserConfig(env);
  const runtimeConfig = get(env);

  // Dev-only override: route just the warehouse-backed store endpoints to a
  // separate backend (e.g. a local impetus-agentic-central). Falls back to the
  // normal API target, so production behaviour is unchanged.
  const storeDataTarget = env.STORE_DATA_API_TARGET || runtimeConfig.API_PROXY_TARGET

  return {
    plugins: [
      react(),
      tailwindcss(),
      serveLayouts(),
      {
        name: "html-runtime-config",
        transformIndexHtml(html, context) {
          // Dev server: inject config via mustache block replacement
          if (context?.server) {
            return html
              .replace(ENV_CONFIG_SCRIPT_PATTERN, "")
              .replace(
                CONFIG_BLOCK_PATTERN,
                () => `<script>\nwindow._conf=${JSON.stringify(browserConfig).replace(/</g, "\\u003c")};\n</script>`,
              );
          }

          // Capacitor build: replace the /env-config script with inline window._conf
          // (Capacitor has no server to serve /env-config at runtime)
          if (mode.startsWith("capacitor")) {
            return html.replace(
              ENV_CONFIG_SCRIPT_PATTERN,
              `<script>\nwindow._conf=${JSON.stringify(browserConfig)};\n</script>`,
            );
          }

          // Web production build: keep /env-config as-is (server injects at runtime)
          return html;
        },
      },
    ],
    preview: {
      allowedHosts: true,
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
      "/v1": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
    // Vite's dep scanner crawls every .html under the root. The exported
    // offline Buying artefacts in deliverables/ are build *outputs*, not
    // entries — scanning them fails on imports that only exist inside the
    // bundle and disables dependency pre-bundling for the whole dev server.
    optimizeDeps: {
      entries: ["index.html"],
    },
    server: {
      // HTTPS by default (the team's mkcert certificate). Set DEV_HTTP=1 to
      // serve plain HTTP — needed on any machine that does not have the mkcert
      // CA installed, where Chrome refuses the certificate outright.
      ...(process.env.DEV_HTTP
        ? {}
        : {
            https: {
              key: fs.readFileSync(resolve(__dirname, "certs/key.pem")),
              cert: fs.readFileSync(resolve(__dirname, "certs/cert.pem")),
            },
          }),
      host: "0.0.0.0",
      port: 5173,
      allowedHosts: true,
      proxy: {
        // Separate Impetus Design application, including its own assets and API proxies.
        // Preserve the prefix: its Vite base and router basename are /design-app/.
        '/design-app': {
          target: env.DESIGN_APP_PROXY_TARGET || 'http://127.0.0.1:3001',
          changeOrigin: true,
          ws: true,
        },
        // Warehouse-backed store endpoints (audit, sales, Google reviews).
        //
        // These must be listed before the generic
        // /service/application/impetus-agentic/v1.0 rule below, because Vite
        // matches proxy keys by prefix in insertion order. That ordering also
        // keeps them off the generic rule's /v1 rewrite, which does not apply
        // to these routes.
        //
        // By default they follow API_PROXY_TARGET like everything else. Set
        // STORE_DATA_API_TARGET to point only these routes at a locally running
        // impetus-agentic-central, without diverting the rest of the app.
        //
        // The rewrite strips only the service prefix, leaving /v1.0/store-*,
        // which is what impetus-agentic-central's routers expose. Note this
        // deliberately differs from the two rules below, which rewrite to /v1
        // for this branch's backend.
        ...Object.fromEntries(
          ["store-audit", "store-sales", "store-reviews"].map((resource) => [
            `/service/application/impetus-agentic/v1.0/store-view/${resource}`,
            {
              target: storeDataTarget,
              changeOrigin: true,
              secure: false,
              rewrite: (path: string) =>
                path.replace(/^\/service\/application\/impetus-agentic/, ""),
            },
          ]),
        ),
        "/service/public/impetus-agentic/v1.0": {
          target: runtimeConfig.API_PROXY_TARGET,
          changeOrigin: true,
          secure: false,
          rewrite: (path) =>
            path.replace(/^\/service\/public\/impetus-agentic\/v1\.0/, "/v1"),
          cookieDomainRewrite: { "*": "" },
        },
        "/service/application/impetus-agentic/v1.0": {
          target: runtimeConfig.API_PROXY_TARGET,
          changeOrigin: true,
          secure: false,
          rewrite: (path) =>
            path.replace(
              /^\/service\/application\/impetus-agentic\/v1\.0/,
              "/v1",
            ),
          cookieDomainRewrite: { "*": "" },
        },
        "/api/style-bank": {
          target: "https://api.create.sit.fyndx1.de",
          changeOrigin: true,
          rewrite: (path) =>
            path.replace(
              /^\/api\/style-bank/,
              "/service/public/create-costing-agent/api/design/style-bank/reliance-brands",
            ),
        },
        "/gbrain-api": {
          target: "https://api.create.sit.fyndx1.de",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/gbrain-api/, "/service/public/create-costing-agent"),
        },
        "/api": {
          target: runtimeConfig.API_PROXY_TARGET,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
          cookieDomainRewrite: { "*": "" },
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-radix": [
              "@radix-ui/react-dialog",
              "@radix-ui/react-select",
              "@radix-ui/react-tabs",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-toast",
              "@radix-ui/react-tooltip",
              "@radix-ui/react-checkbox",
              "@radix-ui/react-label",
              "@radix-ui/react-slot",
              "@radix-ui/react-switch",
            ],
            "vendor-charts": ["recharts"],
            "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
          },
        },
      },
    },
  };
});
