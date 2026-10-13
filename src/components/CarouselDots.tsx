import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CarouselDotsProps {
  /** Ref to the horizontal scroll container whose children are the slides. */
  scrollRef: React.RefObject<HTMLDivElement | null>;
  /** Number of slides. Dots are hidden when <= 1. */
  count: number;
  className?: string;
}

/**
 * Pagination dots for a horizontal snap carousel. Tracks the slide nearest the
 * container's left edge as the active dot, and scrolls to a slide on tap.
 * Mobile-only (`sm:hidden`) — the desktop layouts render a grid/row, not a scroll.
 */
export function CarouselDots({ scrollRef, count, className }: CarouselDotsProps): React.ReactNode {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = (): void => {
      const elLeft = el.getBoundingClientRect().left;
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < el.children.length; i += 1) {
        const child = el.children[i] as HTMLElement;
        const dist = Math.abs(child.getBoundingClientRect().left - elLeft);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      }
      setActive(best);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollRef, count]);

  const scrollToSlide = useCallback(
    (index: number): void => {
      const el = scrollRef.current;
      const child = el?.children[index] as HTMLElement | undefined;
      if (!el || !child) return;
      const left = el.scrollLeft + child.getBoundingClientRect().left - el.getBoundingClientRect().left;
      el.scrollTo({ left, behavior: 'smooth' });
    },
    [scrollRef],
  );

  if (count <= 1) return null;

  return (
    <div
      className={cn('mt-2.5 flex justify-center gap-1.5 sm:hidden', className)}
      role="tablist"
      aria-label="Carousel pagination"
    >
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={active === i}
          aria-label={`Go to item ${i + 1}`}
          onClick={() => scrollToSlide(i)}
          className={cn(
            'h-1.5 rounded-full transition-all duration-200',
            active === i ? 'w-4 bg-primary' : 'w-1.5 bg-gray-300 hover:bg-gray-400',
          )}
        />
      ))}
    </div>
  );
}
