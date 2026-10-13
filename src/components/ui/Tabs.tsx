import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

type TabsVariant = 'default' | 'pills' | 'underline';

/** Lets <TabsList> pass its variant down to its <TabsTrigger>s, so callers set the
 *  variant once on the list. An explicit `variant` on a trigger always overrides. */
const TabsVariantContext = React.createContext<TabsVariant>('default');

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  variant?: TabsVariant;
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant = 'default', ...props }, ref) => {
  // wrapperRef is the actual scroll container — TabsList itself can be
  // intrinsically sized (e.g. variant="underline" uses w-fit so the bottom
  // border doesn't extend past the rightmost tab). The wrapper applies
  // overflow-x-auto + min-w-0 so it can shrink inside flex parents and clip
  // the inner list. This keeps page-level scroll bleed from happening — the
  // browser sees a real scrollable ancestor here and stops walking the tree.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll]);

  // Re-check scroll bounds when children render (async) AND auto-center the
  // active trigger horizontally whenever its data-state flips to "active".
  //
  // We deliberately AVOID `scrollIntoView({ inline: 'center' })` because it
  // bubbles up to every scrollable ancestor — including the document — which
  // yanks the whole page sideways when the active tab is near a viewport edge.
  // Instead we compute the target scrollLeft and apply it only to the wrapper.
  // Re-check after children render (tabs may load async) + auto-scroll active tab into view
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const centerActive = (behavior: ScrollBehavior = 'smooth') => {
      const active = el.querySelector<HTMLElement>('[data-state="active"]');
      if (!active) return;

      const wrapperRect = el.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      const activeLeftInWrapper =
        activeRect.left - wrapperRect.left + el.scrollLeft;
      const targetScrollLeft =
        activeLeftInWrapper + activeRect.width / 2 - el.clientWidth / 2;

      // Browser clamps scrollLeft to [0, scrollWidth - clientWidth] automatically.
      el.scrollTo({ left: targetScrollLeft, behavior });
    };

    const handleMutation = () => {
      checkScroll();
      centerActive();
    };

    // Center the initially-active tab on mount. When a non-first tab is active from
    // the start (e.g. deep-linked like /store/:id/product), no data-state mutation
    // fires, so the observer alone would leave it scrolled out of view. Instant
    // (not smooth) so it's already in place on first paint.
    centerActive('auto');

    const observer = new MutationObserver(handleMutation);
    observer.observe(el, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state'],
    });
    return () => observer.disconnect();
  }, [checkScroll]);

  const variantStyles = {
    default: 'bg-gray-100 p-1 rounded-lg',
    pills: 'gap-2',
    underline: 'border-b border-gray-200 gap-4 w-fit',
  };

  // Background-agnostic scroll affordance: fade the actual tab content's
  // alpha at the overflowing edges via mask-image, instead of overlaying a
  // hardcoded-color gradient div. This works on white, gray-50, or any
  // page background without producing a visible colored sliver.
  const maskImage =
    canScrollLeft || canScrollRight
      ? `linear-gradient(to right, ${
          canScrollLeft ? 'transparent 0, black 32px' : 'black 0'
        }, ${
          canScrollRight ? 'black calc(100% - 32px), transparent 100%' : 'black 100%'
        })`
      : undefined;

   
  const wrapperStyle: React.CSSProperties | undefined = maskImage
    ? { maskImage, WebkitMaskImage: maskImage }
    : undefined;

  return (
    <TabsVariantContext.Provider value={variant}>
      <div
        ref={wrapperRef}
        onScroll={checkScroll}
        className="relative min-w-0 max-w-full overflow-x-auto scrollbar-hide"
        style={wrapperStyle}
      >
        <TabsPrimitive.List
          ref={ref}
          className={cn(
            'flex items-center',
            variantStyles[variant],
            className
          )}
          {...props}
        />
      </div>
    </TabsVariantContext.Provider>
  );
});
TabsList.displayName = 'TabsList';

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  variant?: TabsVariant;
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant: variantProp, ...props }, ref) => {
  // Inherit the variant from the enclosing <TabsList> unless this trigger sets its own.
  const inheritedVariant = React.useContext(TabsVariantContext);
  const variant = variantProp ?? inheritedVariant;
  const variantStyles = {
    default: cn(
      'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
      'text-gray-600 hover:text-gray-900',
      'data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm'
    ),
    pills: cn(
      'px-2.5 py-1 text-xs font-medium rounded-full border border-gray-200 bg-white transition-colors',
      'text-gray-500 hover:text-gray-900 hover:border-gray-300',
      'data-[state=active]:bg-primary-50 data-[state=active]:border-primary data-[state=active]:text-gray-900 data-[state=active]:font-semibold'
    ),
    underline: cn(
      // pt-3.5 lg:pt-0 → mobile tap target ~44px; desktop unchanged at ~30px
      'pt-3.5 lg:pt-0 pb-2.5 text-sm font-medium border-b-2 border-transparent transition-colors',
      'text-gray-600 hover:text-gray-900',
      'data-[state=active]:text-primary data-[state=active]:border-primary'
    ),
  };

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        // shrink-0 + whitespace-nowrap: keep each tab at its natural width on one
        // line so a too-narrow row overflows into the TabsList scroll wrapper
        // instead of shrinking tabs and wrapping their labels.
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap focus:outline-none focus-kb:ring-2 focus-kb:ring-primary/20',
        'disabled:pointer-events-none disabled:opacity-50',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-4 focus:outline-none',
      'data-[state=inactive]:hidden',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';

// ---------------------------------------------------------------------------
// SwipableTabs — wraps tab content with horizontal swipe gesture (mobile/tablet)
// ---------------------------------------------------------------------------

interface SwipableTabsProps {
  /** Ordered list of tab values */
  tabValues: string[];
  /** Current active tab */
  activeTab: string;
  /** Called when swipe changes the tab */
  onTabChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrap TabsContent elements with this to enable horizontal swipe navigation.
 * Only active on touch devices — desktop mouse drag is ignored.
 */
function SwipableTabs({ tabValues, activeTab, onTabChange, children, className }: SwipableTabsProps) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Don't capture swipe if the touch started inside a horizontally scrollable container
    // (e.g. filter pills, horizontal scroll areas) — those need their own horizontal scroll
    let el = e.target as HTMLElement | null;
    while (el && el !== e.currentTarget) {
      if (el.scrollWidth > el.clientWidth && getComputedStyle(el).overflowX !== 'visible') {
        isDragging.current = false;
        return;
      }
      el = el.parentElement;
    }

    const touch = e.touches[0];
    if (!touch) return;
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    isDragging.current = true;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    // Only trigger if horizontal swipe is dominant and > 50px
    if (Math.abs(deltaX) < 50 || Math.abs(deltaY) > Math.abs(deltaX)) return;

    const currentIndex = tabValues.indexOf(activeTab);
    if (currentIndex === -1) return;

    if (deltaX < 0 && currentIndex < tabValues.length - 1) {
      // Swipe left → next tab
      onTabChange(tabValues[currentIndex + 1]!);
    } else if (deltaX > 0 && currentIndex > 0) {
      // Swipe right → previous tab
      onTabChange(tabValues[currentIndex - 1]!);
    }
  }, [tabValues, activeTab, onTabChange]);

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, SwipableTabs };
