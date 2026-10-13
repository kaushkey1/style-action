import type { ComponentProps } from 'react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

/** Dense workspace controls; touch input retains a comfortable target. */
export function CompactButton({ className, size = 'sm', ...props }: ComponentProps<typeof Button>) {
  return <Button {...props} size={size} className={cn(
    size === 'icon'
      ? 'h-8 w-8 min-h-8 min-w-8 lg:min-h-8 lg:min-w-8 [@media(pointer:coarse)]:min-w-11'
      : 'h-8 min-h-8 lg:min-h-8 px-2.5 text-xs',
    '[@media(pointer:coarse)]:min-h-11', className,
  )} />;
}
