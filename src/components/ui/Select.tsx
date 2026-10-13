import React, { useState } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { BottomSheet } from './BottomSheet';

// ─── Mobile Select Context ──────────────────────────────────────────

interface MobileSelectContextValue {
  isMobile: boolean;
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
  value?: string;
  onValueChange?: (value: string) => void;
}

const MobileSelectContext = React.createContext<MobileSelectContextValue | null>(null);

// ─── Select Root (mobile-aware) ─────────────────────────────────────

function Select({ children, value, onValueChange, open, onOpenChange, ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>) {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    if (isMobile) {
      setSheetOpen(newOpen);
    }
    // Always notify the parent so open-gated logic (e.g. AssigneePicker's user
    // fetch via `enabled: open`) fires on mobile too. Radix itself stays closed
    // on mobile via the forced `open={false}` prop, so no desktop dropdown shows.
    onOpenChange?.(newOpen);
  };

  return (
    <MobileSelectContext.Provider value={{ isMobile, sheetOpen, setSheetOpen, value, onValueChange }}>
      <SelectPrimitive.Root
        {...props}
        value={value}
        onValueChange={onValueChange}
        open={isMobile ? false : open}
        onOpenChange={handleOpenChange}
      >
        {children}
      </SelectPrimitive.Root>
    </MobileSelectContext.Provider>
  );
}

// ─── SelectGroup / SelectValue ──────────────────────────────────────

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

// ─── SelectTrigger ──────────────────────────────────────────────────

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    size?: 'sm' | 'md' | 'lg';
  }
>(({ className, children, size = 'md', ...props }, ref) => {
  const sizeStyles = {
    sm: 'min-h-9 lg:h-8 px-2 text-base lg:text-xs',
    md: 'h-10 px-3 text-base lg:text-sm',
    lg: 'h-12 px-4 text-base',
  };

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white text-gray-900',
        'focus:outline-none focus-kb:ring-2 focus-kb:ring-primary/20 focus-visible:border-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'placeholder:text-gray-400',
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

// ─── Scroll Buttons ─────────────────────────────────────────────────

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn('flex items-center justify-center py-1 cursor-default', className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = 'SelectScrollUpButton';

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn('flex items-center justify-center py-1 cursor-default', className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = 'SelectScrollDownButton';

// ─── SelectContent (BottomSheet on mobile) ──────────────────────────

/** Recursively extract SelectItem props from children (handles SelectGroup nesting) */
function extractSelectOptions(nodes: React.ReactNode): { value: string; label: React.ReactNode; disabled?: boolean }[] {
  const options: { value: string; label: React.ReactNode; disabled?: boolean }[] = [];

  React.Children.forEach(nodes, (child) => {
    if (!React.isValidElement(child)) return;

    const childProps = child.props as Record<string, unknown>;

    // Direct SelectItem
    if (child.type === SelectItem) {
      options.push({
        value: childProps.value as string,
        label: childProps.children as React.ReactNode,
        disabled: childProps.disabled as boolean | undefined,
      });
    } else if (childProps.children != null) {
      // Recurse into groups, fragments, or wrappers
      options.push(...extractSelectOptions(childProps.children as React.ReactNode));
    }
  });

  return options;
}

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => {
  const ctx = React.useContext(MobileSelectContext);

  // Mobile: BottomSheet for picking, but Radix SelectContent must still mount SelectItems
  // (via Radix's closed-state collection portal) or SelectValue cannot resolve labels.
  if (ctx?.isMobile) {
    const options = extractSelectOptions(children);

    return (
      <>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            ref={ref}
            className={cn(
              'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              position === 'popper' &&
                'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
              className
            )}
            position={position}
            {...props}
          >
            <SelectScrollUpButton />
            <SelectPrimitive.Viewport
              className={cn(
                'p-1',
                position === 'popper' &&
                  'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
              )}
            >
              {children}
            </SelectPrimitive.Viewport>
            <SelectScrollDownButton />
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
        <BottomSheet isOpen={ctx.sheetOpen} onClose={() => ctx.setSheetOpen(false)} zIndex={60}>
          <div className="space-y-1 pb-4">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => {
                  ctx.onValueChange?.(opt.value);
                  ctx.setSheetOpen(false);
                }}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 rounded-lg text-left text-sm min-h-12 transition-colors',
                  ctx.value === opt.value
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-700 hover:bg-gray-50',
                  opt.disabled && 'opacity-50 cursor-not-allowed',
                )}
              >
                {opt.label}
                {ctx.value === opt.value && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </BottomSheet>
      </>
    );
  }

  // Desktop: existing Radix rendering
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          // Height clamps to Radix's measured space below/above the trigger so a
          // long list scrolls inside the popover instead of running offscreen.
          'relative z-50 max-h-[min(24rem,var(--radix-select-content-available-height))] min-w-[8rem] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' &&
              'max-h-[var(--radix-select-content-available-height)] w-full min-w-[var(--radix-select-trigger-width)]'
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});
SelectContent.displayName = 'SelectContent';

// ─── SelectLabel ────────────────────────────────────────────────────

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('px-2 py-1.5 text-xs font-semibold text-gray-500', className)}
    {...props}
  />
));
SelectLabel.displayName = 'SelectLabel';

// ─── SelectItem ─────────────────────────────────────────────────────

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-2 text-sm outline-none',
      'focus:bg-gray-100 focus:text-gray-900',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';

// ─── SelectSeparator ────────────────────────────────────────────────

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-gray-200', className)}
    {...props}
  />
));
SelectSeparator.displayName = 'SelectSeparator';

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
