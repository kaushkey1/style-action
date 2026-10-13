import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Keep actions at the viewport bottom, outside the page's animated transform. */
export function CategoryWorkbenchActionBar({ children }: { children: ReactNode }) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const [position, setPosition] = useState<{ left: number; width: number } | null>(null);
  const [height, setHeight] = useState(80);
  const mounted = position !== null;

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const align = () => {
      const { left, width } = anchor.getBoundingClientRect();
      setPosition(previous => previous?.left === left && previous.width === width ? previous : { left, width });
    };
    align();
    const observer = new ResizeObserver(align);
    observer.observe(anchor);
    window.addEventListener('resize', align);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', align);
    };
  }, []);

  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const reserveSpace = () => setHeight(bar.getBoundingClientRect().height);
    reserveSpace();
    const observer = new ResizeObserver(reserveSpace);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [mounted]);

  return <>
    {/* Reserve the bar's actual height so the last card can scroll above it. */}
    {/* eslint-disable-next-line no-restricted-syntax -- measured height tracks wrapped actions */}
    <div ref={anchorRef} aria-hidden="true" style={{ height }} />
    {position && createPortal(
      <section ref={barRef} aria-label="Buy plan actions"
        // eslint-disable-next-line design-system/prefer-section-header -- pinned workflow actions, not a section heading
        className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem)] lg:bottom-4 z-30 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg sm:flex-row sm:items-center sm:justify-between"
        // eslint-disable-next-line no-restricted-syntax -- align the portal with the page, including sidebar and responsive margins
        style={position}>
        {children}
      </section>, document.body,
    )}
  </>;
}
