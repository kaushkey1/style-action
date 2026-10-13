import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// jsdom does not implement window.matchMedia — stub it so hooks like
// useMediaQuery / useIsTouch / useIsMobile (used by Tooltip, etc.) don't crash.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// jsdom does not implement Element.scrollTo — stub it so components that auto-scroll
// (e.g. Tabs centering the active trigger via MutationObserver) don't throw.
if (typeof Element !== 'undefined' && Element.prototype.scrollTo === undefined) {
  Element.prototype.scrollTo = vi.fn() as unknown as Element['scrollTo'];
}

// jsdom's localStorage can be a partial/broken stub in this environment (missing
// setItem/clear), which breaks zustand `persist`. Provide a working in-memory one.
if (typeof localStorage === 'undefined' || typeof localStorage.setItem !== 'function') {
  const mem = new Map<string, string>();
  const storage = {
    getItem: (k: string) => (mem.has(k) ? (mem.get(k) as string) : null),
    setItem: (k: string, v: string) => {
      mem.set(k, String(v));
    },
    removeItem: (k: string) => {
      mem.delete(k);
    },
    clear: () => {
      mem.clear();
    },
    key: (i: number) => Array.from(mem.keys())[i] ?? null,
    get length() {
      return mem.size;
    },
  };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
}
