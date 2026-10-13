import { useSyncExternalStore } from 'react';

function subscribe(query: string) {
  return (callback: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
  };
}

function getSnapshot(query: string) {
  return () => window.matchMedia(query).matches;
}

function getServerSnapshot() {
  return false;
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    subscribe(query),
    getSnapshot(query),
    getServerSnapshot,
  );
}

/** Below lg (1024px) — phones and tablets */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 1023px)');
}

/** Between md (768px) and lg (1024px) — tablets */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

/** Touch-primary device (phones, tablets, iPad Pro) regardless of screen width */
export function useIsTouch(): boolean {
  return useMediaQuery('(pointer: coarse)');
}

/** User has requested reduced motion — disable auto-advance and heavy transitions. */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
