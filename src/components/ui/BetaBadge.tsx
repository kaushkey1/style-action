import { cn } from '@/lib/utils';

type BetaBadgeSize = 'xs' | 'sm';

interface BetaBadgeProps {
  /** `xs` for icon-corner overlays in nav (sidebar / bottom bar). `sm` for inline next to text. */
  size?: BetaBadgeSize;
  /** Pass-through for positioning (`absolute -top-1 -right-2`, `ml-2`, etc.). */
  className?: string;
}

const sizeStyles: Record<BetaBadgeSize, string> = {
  xs: 'text-[8px] px-0.5 py-px tracking-wide',
  sm: 'text-[10px] px-1 py-0.5 tracking-wider',
};

/**
 * Tiny amber pill that marks a feature as in beta. Used on Control Tower
 * across the sidebar, mobile bottom bar, mobile breadcrumb, and the page H1.
 */
export function BetaBadge({ size = 'sm', className }: BetaBadgeProps): React.ReactNode {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded uppercase font-semibold whitespace-nowrap',
        'bg-gray-100 text-gray-600 border border-gray-200',
        sizeStyles[size],
        className,
      )}
      aria-label="Beta feature"
    >
      BETA
    </span>
  );
}
