import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Agentation } from 'agentation'
import Clarity from '@microsoft/clarity'
import zipy from 'zipyai'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'
import App from './App.tsx'
import environment from './environment'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
})

interface UsersnapAPI {
  init: (options?: { projectKey?: string }) => void;
}

declare global {
  interface Window {
    onUsersnapCXLoad?: (api: UsersnapAPI) => void;
  }
}

if (environment.ENV === 'production') {
  zipy.init('5a0d32ab')
  Clarity.init(environment.CLARITY_PROJECT_ID)
}

// Usersnap feedback widget — production only
if (environment.ENV === 'production') {
  window.onUsersnapCXLoad = (api: UsersnapAPI) => {
    api.init({ projectKey: 'a21b7c5b-e665-4455-a7f9-8d21d7eee4ca' });
  };
  const script = document.createElement('script');
  script.defer = true;
  script.src =
    'https://widget.usersnap.com/global/load/fa174eb3-40d8-4e30-92d3-1af5ada83c58?onload=onUsersnapCXLoad';
  document.head.appendChild(script);
}

// Editable elements match :focus-visible on mouse click too (browser heuristic),
// so track the last input modality on <html>. index.css uses this to keep focus
// rings keyboard-only (Tab), never on pointer interaction.
window.addEventListener(
  'keydown',
  (e) => {
    if (e.key === 'Tab') document.documentElement.dataset.focusSource = 'keyboard'
  },
  true,
)
window.addEventListener(
  'pointerdown',
  () => {
    document.documentElement.dataset.focusSource = 'pointer'
  },
  true,
)

// Clean up old PWA service worker and Workbox caches (safe to remove after all users have loaded this version)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    if (registrations) {
      registrations.forEach(r => {
        const url = r.active?.scriptURL ?? '';
        if (url.includes('/sw.js') || url.includes('/dev-sw.js')) {
          r.unregister();
        }
      });
    }
  }).catch(() => {});
  if (typeof caches !== 'undefined') {
    caches.keys().then(keys => {
      if (keys) {
        keys
          .filter(k => k.startsWith('workbox-'))
          .forEach(k => caches.delete(k));
      }
    }).catch(() => {});
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </QueryClientProvider>
    {import.meta.env.DEV && <Agentation />}
  </StrictMode>,
)
