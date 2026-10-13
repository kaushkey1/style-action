import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ListItemCardProps {
  variant?: 'card' | 'row';
  selected?: boolean;
  onClick?: () => void;
  header?: ReactNode;
  headerRight?: ReactNode;
  title: string;
  metadata?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

const variantStyles = {
  card: {
    base: 'bg-white rounded-lg border border-gray-200 p-4',
    selected: 'ring-1 ring-primary/20 border-primary',
    hover: 'hover:shadow-sm hover:border-gray-300',
  },
  row: {
    base: 'p-4 border-b border-gray-100',
    selected: 'bg-primary-50/50 border-l-2 border-l-primary',
    hover: 'hover:bg-gray-50',
  },
} as const;

/**
 * Selectable list item with standardized selection, hover, and content slots.
 * Two variants: "card" (rounded with ring selection) and "row" (flat with left-border selection).
 */
export function ListItemCard({
  variant = 'card',
  selected,
  onClick,
  header,
  headerRight,
  title,
  metadata,
  actions,
  children,
  className,
}: ListItemCardProps) {
  const styles = variantStyles[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left transition-[border-color,box-shadow,background-color] duration-200',
        styles.base,
        selected ? styles.selected : styles.hover,
        className
      )}
    >
      {children ?? (
        <>
          {(header || headerRight) && (
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">{header}</div>
              {headerRight}
            </div>
          )}
          <p className="text-sm font-medium text-gray-900 mb-1">{title}</p>
          {metadata && <div className="text-xs text-gray-500 mb-2">{metadata}</div>}
          {actions && <div>{actions}</div>}
        </>
      )}
    </button>
  );
}
