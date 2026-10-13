import { useEffect, useRef } from 'react';
import environment from '@/environment';

/**
 * Google reCAPTCHA v2 ("I'm not a robot") checkbox.
 *
 * Renders the widget for `RECAPTCHA_SITE_KEY` and reports the response token via
 * `onChange` (empty string on expiry/error). Renders nothing when no site key is
 * configured, so callers can treat captcha as disabled for that environment.
 */

interface GrecaptchaV2 {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
    },
  ) => number;
  reset: (widgetId?: number) => void;
  getResponse: (widgetId?: number) => string;
}

declare global {
  interface Window {
    grecaptcha?: GrecaptchaV2;
  }
}

let loadPromise: Promise<void> | null = null;

/** Load the reCAPTCHA v2 API once and resolve when `grecaptcha.render` is available. */
function loadRecaptcha(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = new Promise<void>((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('document unavailable'));
      return;
    }
    const waitReady = () => {
      let tries = 0;
      const check = () => {
        if (typeof window.grecaptcha?.render === 'function') resolve();
        else if (tries++ > 100) reject(new Error('reCAPTCHA not ready'));
        else setTimeout(check, 50);
      };
      check();
    };
    if (typeof window.grecaptcha?.render === 'function') {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-recaptcha]');
    if (existing) {
      existing.addEventListener('load', waitReady, { once: true });
      waitReady();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.recaptcha = 'true';
    script.onload = waitReady;
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA'));
    document.head.appendChild(script);
  });
  return loadPromise;
}

interface RecaptchaCheckboxProps {
  onChange: (token: string) => void;
  /** Called when the widget can't load/render, so callers can degrade gracefully. */
  onError?: () => void;
  /** Change this value to reset the widget (e.g. after a failed submit). */
  resetSignal?: number;
}

export function RecaptchaCheckbox({ onChange, onError, resetSignal }: RecaptchaCheckboxProps): React.ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const siteKey = environment.RECAPTCHA_SITE_KEY;

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;
    loadRecaptcha()
      .then(() => {
        if (cancelled || !containerRef.current || widgetIdRef.current !== null) return;
        widgetIdRef.current = window.grecaptcha!.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => onChange(token),
          'expired-callback': () => onChange(''),
          'error-callback': () => onChange(''),
        });
      })
      .catch(() => {
        // Script blocked / failed to load — signal so the caller doesn't leave
        // the submit button permanently gated on a token that can't be produced.
        if (!cancelled) onError?.();
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- render once on mount
  }, []);

  useEffect(() => {
    if (resetSignal === undefined || widgetIdRef.current === null) return;
    window.grecaptcha?.reset(widgetIdRef.current);
    onChange('');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when the signal changes
  }, [resetSignal]);

  if (!siteKey) return null;
  return <div ref={containerRef} />;
}
