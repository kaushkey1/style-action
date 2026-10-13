import { useRef, useEffect, useCallback } from 'react';

interface CoreContext {
  type: 'CORE_CONTEXT';
  payload: {
    tenant_id: string;
    org_id: string;
    theme: 'light';
    locale: string;
  };
}

interface ExtensionIframeProps {
  src: string;
  title: string;
  onNavigate?: (path: string) => void;
  onResize?: (height: number) => void;
  onNotification?: (message: string, level: 'info' | 'success' | 'warning' | 'error') => void;
}

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-popups';

function getOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}

export function ExtensionIframe({
  src,
  title,
  onNavigate,
  onResize,
  onNotification,
}: ExtensionIframeProps): React.ReactNode {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const expectedOrigin = getOrigin(src);

  const handleLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    const context: CoreContext = {
      type: 'CORE_CONTEXT',
      payload: {
        tenant_id: 'fnl',
        org_id: '5331f8af-2bba-40ec-8bab-7ab3e0bb9075',
        theme: 'light',
        locale: navigator.language,
      },
    };

    iframe.contentWindow.postMessage(context, expectedOrigin);
  }, [expectedOrigin]);

  useEffect(() => {
    function handleMessage(event: MessageEvent): void {
      if (!expectedOrigin || event.origin !== expectedOrigin) return;

      const data = event.data as Record<string, unknown> | undefined;
      if (!data || typeof data.type !== 'string') return;

      switch (data.type) {
        case 'EXT_NAVIGATE': {
          const path = data.path;
          if (typeof path === 'string' && onNavigate) {
            onNavigate(path);
          }
          break;
        }
        case 'EXT_RESIZE': {
          const height = data.height;
          if (typeof height === 'number' && onResize) {
            onResize(height);
          }
          break;
        }
        case 'EXT_NOTIFICATION': {
          const message = data.message;
          const level = data.level;
          if (
            typeof message === 'string' &&
            typeof level === 'string' &&
            (level === 'info' || level === 'success' || level === 'warning' || level === 'error') &&
            onNotification
          ) {
            onNotification(message, level);
          }
          break;
        }
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [expectedOrigin, onNavigate, onResize, onNotification]);

  return (
    <iframe
      ref={iframeRef}
      src={src}
      title={title}
      sandbox={SANDBOX}
      referrerPolicy="no-referrer"
      onLoad={handleLoad}
      className="w-full border-0 min-h-[400px] h-full"
    />
  );
}
