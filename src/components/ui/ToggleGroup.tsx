import * as React from 'react';
import * as RadixToggleGroup from '@radix-ui/react-toggle-group';
import { cn } from '@/lib/utils';

export interface ToggleGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  'aria-label': string;
}

/** Single-select toggle group. Use ToggleGroupItem for each option. */
export const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  ({ value, onValueChange, children, className, ...rest }, ref) => (
    <RadixToggleGroup.Root
      ref={ref}
      type="single"
      value={value}
      onValueChange={(v) => v && onValueChange(v)}
      className={cn(
        'inline-flex items-center rounded-lg border border-gray-200 p-1 gap-1',
        className,
      )}
      {...rest}
    >
      {children}
    </RadixToggleGroup.Root>
  ),
);
ToggleGroup.displayName = 'ToggleGroup';

export interface ToggleGroupItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

export const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  ({ value, children, className, ...rest }, ref) => (
    <RadixToggleGroup.Item
      ref={ref}
      value={value}
      className={cn(
        'inline-flex items-center justify-center gap-2 h-8 px-3 rounded-md text-sm font-medium',
        'transition-colors',
        'text-gray-500 hover:bg-gray-50 hover:text-gray-700',
        'data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900',
        'focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2',
        className,
      )}
      {...rest}
    >
      {children}
    </RadixToggleGroup.Item>
  ),
);
ToggleGroupItem.displayName = 'ToggleGroupItem';
