import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { L1Module } from '@/data/navigationConfig';

interface MobileL2ChipsProps {
  activeL1Module: L1Module | null;
  className?: string;
}

export function MobileL2Chips({ activeL1Module, className }: MobileL2ChipsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll]);

  if (!activeL1Module?.l2Features?.length) return null;

  const fullPath = location.pathname + location.search;

  return (
    <div className={cn('relative lg:hidden', className)}>
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="px-4 py-2 bg-white border-b border-gray-100 chip-scroll"
        role="navigation"
        aria-label="Sub-features"
      >
        {activeL1Module.l2Features.map((feature) => {
          const isActive = feature.route.includes('?')
            ? fullPath === feature.route
            : (location.pathname === feature.route || location.pathname.startsWith(feature.route + '/'));

          return (
            <button
              key={feature.id}
              onClick={() => navigate(feature.route)}
              className={cn(
                'min-h-9 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                'focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2',
                isActive
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 active:bg-gray-200',
              )}
            >
              {feature.label}
            </button>
          );
        })}
      </div>
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
      )}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
      )}
    </div>
  );
}
