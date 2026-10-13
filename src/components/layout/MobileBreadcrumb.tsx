import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BetaBadge } from '@/components/ui';
import type { L0Product, L1Module } from '@/data/navigationConfig';

interface MobileBreadcrumbProps {
  activeProduct: L0Product | null;
  activeL1Module: L1Module | null;
  className?: string;
}

interface Segment {
  label: string;
  route?: string;
  beta?: boolean;
}

export function MobileBreadcrumb({ activeProduct, activeL1Module, className }: MobileBreadcrumbProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const segments: Segment[] = [{ label: 'Home', route: '/home' }];

  if (activeProduct) {
    segments.push({
      label: activeProduct.label,
      route: activeL1Module ? activeProduct.defaultRoute : undefined,
    });
  }

  if (activeL1Module) {
    segments.push({ label: activeL1Module.label, beta: activeL1Module.beta });
  }

  // Auto-scroll to rightmost segment
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [activeProduct?.id, activeL1Module?.id]);

  // Don't render if we're at Home with no product
  if (!activeProduct) return null;

  return (
    <div
      ref={scrollRef}
      className={cn(
        'h-11 flex items-center gap-1.5 px-4 bg-white border-b border-gray-100',
        'overflow-x-auto scrollbar-hide whitespace-nowrap lg:hidden',
        className,
      )}
      aria-label="Breadcrumb"
      role="navigation"
    >
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        const isClickable = !!seg.route && !isLast;

        return (
          <span key={i} className="flex items-center gap-1.5 shrink-0">
            {i > 0 && <span className="text-sm text-gray-400">/</span>}
            {isClickable ? (
              <button
                onClick={() => navigate(seg.route!)}
                className="text-sm text-primary hover:text-primary-700 transition-colors min-h-11 px-1 flex items-center"
              >
                {seg.label}
              </button>
            ) : (
              <span className={cn(
                'text-sm min-h-11 px-1 flex items-center gap-1.5',
                isLast ? 'text-gray-700 font-medium' : 'text-gray-500',
              )}>
                {seg.label}
                {seg.beta && <BetaBadge size="sm" />}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
