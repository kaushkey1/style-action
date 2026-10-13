import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MetricGridProps {
  columns?: 2 | 3 | 4 | 5;
  children: ReactNode;
  className?: string;
}

/**
 * Grid container for MetricCard rows.
 * Enforces consistent column count, gap, and bottom margin.
 */
export function MetricGrid({ columns = 4, children, className }: MetricGridProps) {
  const colClass =
    columns === 5
      ? 'grid-cols-1 xs:grid-cols-2 lg:grid-cols-5'
      : columns === 2
        ? 'grid-cols-1 xs:grid-cols-2'
      : columns === 3
        ? 'grid-cols-1 xs:grid-cols-2 lg:grid-cols-3'
        : 'grid-cols-1 xs:grid-cols-2 lg:grid-cols-4';
  return (
    <div className={cn('grid gap-3 mb-4', colClass, className)}>
      {children}
    </div>
  );
}
