import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

/** Presentation shared by the authenticated console and the local Buying entry. */
export function ConsoleFrame({ topBar, sidebar, panels, overlays, children }: { topBar: ReactNode; sidebar: ReactNode; panels?: ReactNode; overlays?: ReactNode; children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null); const location = useLocation();
  useEffect(() => { if (contentRef.current) contentRef.current.scrollTop = 0; }, [location.pathname, location.search]);
  return <div className="h-dvh overflow-hidden bg-[#141414]">
    <a href="#main-content" onClick={e => { e.preventDefault(); document.getElementById('main-content')?.focus(); }} className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-20 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:text-sm">Skip to main content</a>
    <div className="fixed top-0 left-0 right-0 z-50">{topBar}</div>
    {sidebar}
    <div className="pt-[calc(3.5rem+env(safe-area-inset-top,0px))] h-dvh transition-[margin-left] duration-200 overflow-hidden lg:ml-[76px]">
      <div className="flex flex-col lg:flex-row overflow-hidden rounded-t-xl h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px))] relative">
        {panels}
        <div ref={contentRef} className="flex-1 min-w-0 bg-gray-50 overflow-y-auto overscroll-none">
          <main id="main-content" tabIndex={-1} className="mx-auto max-w-[1536px] p-4 pb-20 lg:pt-6 lg:pb-4">{children}</main>
        </div>
      </div>
    </div>
    {overlays}
  </div>;
}
