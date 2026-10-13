import { Children, isValidElement, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

interface DashboardKpiGridProps {
  children: ReactNode;
  /** Max cards visible at <430px before "View more" appears. Default 4. */
  smallMobileCap?: number;
  /** Max cards visible at 430-1023px before "View more" appears. Default 8. */
  largeMobileCap?: number;
  className?: string;
}

export function DashboardKpiGrid({
  children,
  smallMobileCap = 4,
  largeMobileCap = 8,
  className,
}: DashboardKpiGridProps) {
  const allChildren = useMemo(
    () => Children.toArray(children).filter(isValidElement),
    [children],
  );
  const count = allChildren.length;

  const isSmallMobile = useMediaQuery('(max-width: 429px)');
  const isMobile = useMediaQuery('(max-width: 1023px)');

  const [isExpanded, setExpanded] = useState(false);

  const activeMobileCap = isSmallMobile ? smallMobileCap : largeMobileCap;
  const overCapOnMobile = isMobile && count > activeMobileCap;

  const visibleChildren =
    overCapOnMobile && !isExpanded
      ? allChildren.slice(0, activeMobileCap)
      : allChildren;

  return (
    <div className={cn('mb-4', className)}>
      <div
        className={cn(
          'grid grid-cols-1 xs:grid-cols-2 gap-3 lg:grid-cols-4',
          // 4-col max on desktop is the documented rule (ux-patterns.md §20).
          // 5 cards intentionally wrap to row 1: 4 × 1/4, row 2: 1 × 1/4 (left-aligned).
        )}
      >
        {visibleChildren}
      </div>
      {overCapOnMobile && (
        <div className="lg:hidden flex justify-center mt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-primary"
          >
            {isExpanded ? 'View less' : `View more (+${count - activeMobileCap})`}
          </Button>
        </div>
      )}
    </div>
  );
}
