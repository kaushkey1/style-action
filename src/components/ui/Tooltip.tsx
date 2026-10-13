import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';
import { useIsTouch } from '@/hooks/useMediaQuery';

const TooltipProvider = TooltipPrimitive.Provider;

/**
 * Touch-aware Tooltip root.
 * - Mouse devices: standard Radix hover behavior (unchanged)
 * - Touch devices: controlled open state with tap-to-toggle
 */
function Tooltip({ children, ...props }: TooltipPrimitive.TooltipProps) {
  const isTouch = useIsTouch();
  const [open, setOpen] = React.useState(false);

  if (!isTouch) {
    return <TooltipPrimitive.Root disableHoverableContent {...props}>{children}</TooltipPrimitive.Root>;
  }

  return (
    <TooltipPrimitive.Root
      {...props}
      open={open}
      onOpenChange={setOpen}
      delayDuration={0}
    >
      {children}
    </TooltipPrimitive.Root>
  );
}

/**
 * Touch-aware Tooltip trigger.
 * On touch devices, tap toggles the tooltip open/closed.
 */
const TooltipTrigger = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>(({ onClick, ...props }, ref) => {
  const isTouch = useIsTouch();

  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isTouch) {
        e.preventDefault();
      }
      onClick?.(e);
    },
    [isTouch, onClick],
  );

  return <TooltipPrimitive.Trigger ref={ref} onClick={handleClick} {...props} />;
});
TooltipTrigger.displayName = 'TooltipTrigger';

const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 shadow-lg max-w-xs',
        'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
