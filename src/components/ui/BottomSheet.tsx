import { useEffect, useCallback, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

/**
 * Single action for the BottomSheet footer.
 * Pass these via the `actions` prop to get the standard 2-button (50/50) or
 * single-button (full-width) layout for free.
 */
export interface BottomSheetAction {
  label: string;
  /** Defaults to 'primary' for the last action, 'outline' for others. */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'outline-destructive';
  onClick: () => void;
  disabled?: boolean;
}

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  maxHeight?: string;
  children: ReactNode;
  /**
   * Standard footer actions — preferred over `footer` for paired CTAs.
   * Auto-layout based on count:
   * • 1 action → full-width
   * • 2 actions → 50/50 grid with 12px gap; secondary on left, primary on right
   * • 3+ actions → stacked vertical full-width
   * All buttons render at `size="lg"` (48px) for proper tap target.
   */
  actions?: BottomSheetAction[];
  /** Sticky footer content rendered below the scrollable area. Prefer `actions` when possible. */
  footer?: ReactNode;
  /** Non-scrolling content pinned below the title, above the scroll area (e.g. a search box). */
  header?: ReactNode;
  className?: string;
  /** z-index for stacking nested sheets. Default 40, use 50 for child sheets. */
  zIndex?: number;
  /** Show close (X) button in the header. Default false. */
  showClose?: boolean;
  /** When set, renders a back chevron left of the title (for drill-in sheets). */
  onBack?: () => void;
}

// Ref-counted scroll lock so nested sheets don't prematurely re-enable scrolling
let scrollLockCount = 0;

export function BottomSheet({
  isOpen,
  onClose,
  title,
  maxHeight = '85vh',
  children,
  actions,
  footer,
  header,
  className,
  zIndex = 40,
  showClose = false,
  onBack,
}: BottomSheetProps) {
  // Dev-time guard: `actions` and `footer` are mutually exclusive
  if (import.meta.env.DEV && actions && footer) {
     
    console.warn(
      'BottomSheet: both `actions` and `footer` were provided. `actions` will be used.',
    );
  }

  const contentRef = useRef<HTMLDivElement>(null);
  // Swipe-to-dismiss is detected on the handle only — NOT Framer `drag` on the
  // whole sheet, which swallows touch gestures and blocks the inner list from
  // scrolling. Framer still owns the slide in/out via initial/animate/exit.
  const dragStartY = useRef(0);
  const dragging = useRef(false);
  const [contentOverflows, setContentOverflows] = useState(false);

  const handleDragDown = (e: React.PointerEvent): void => {
    dragging.current = true;
    dragStartY.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handleDragEnd = (e: React.PointerEvent): void => {
    if (!dragging.current) return;
    dragging.current = false;
    if (e.clientY - dragStartY.current > 80) onClose();
  };

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  // Lock body scroll when open (ref-counted for nesting)
  useEffect(() => {
    if (isOpen) {
      scrollLockCount++;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      if (isOpen) {
        scrollLockCount--;
        if (scrollLockCount === 0) {
          document.body.style.overflow = '';
        }
      }
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleEscape]);

  // A parent Radix Dialog (Modal) fights this body-portaled sheet two ways, both
  // via document-level listeners. Capture-phase guards fire before Radix's own
  // (bubble-phase) listeners and stop them for events inside this sheet:
  //   • FocusScope traps focus and yanks it out of the sheet (breaks the search
  //     input) — guard focusin/focusout.
  //   • react-remove-scroll preventDefaults touch/wheel outside its content
  //     (blocks the list from scrolling) — guard touchmove/wheel.
  useEffect(() => {
    if (!isOpen) return;
    const inSheet = (n: EventTarget | null): boolean =>
      n instanceof Element && n.closest('[data-bottom-sheet]') !== null;
    const focusGuard = (e: FocusEvent): void => {
      if (inSheet(e.target) || inSheet(e.relatedTarget)) e.stopImmediatePropagation();
    };
    const scrollGuard = (e: Event): void => {
      if (inSheet(e.target)) e.stopImmediatePropagation();
    };
    document.addEventListener('focusin', focusGuard, true);
    document.addEventListener('focusout', focusGuard, true);
    document.addEventListener('touchmove', scrollGuard, true);
    document.addEventListener('wheel', scrollGuard, true);
    return () => {
      document.removeEventListener('focusin', focusGuard, true);
      document.removeEventListener('focusout', focusGuard, true);
      document.removeEventListener('touchmove', scrollGuard, true);
      document.removeEventListener('wheel', scrollGuard, true);
    };
  }, [isOpen]);

  const hasFooter = (actions && actions.length > 0) || Boolean(footer);

  // Check if content overflows to conditionally show footer shadow
  useEffect(() => {
    if (!isOpen || !hasFooter) { setContentOverflows(false); return; }
    const el = contentRef.current;
    if (!el) return;
    const check = () => setContentOverflows(el.scrollHeight > el.clientHeight);
    // Check after animation settles
    const timer = setTimeout(check, 350);
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [isOpen, hasFooter, children]);

  // Render the standard footer layout when `actions` is provided.
  // Auto-applies the right pattern based on count:
  //   1 action  → full-width
  //   2 actions → 50/50 grid with gap-3 (secondary left, primary right)
  //   3+ actions → stacked vertical full-width
  const renderActions = (items: BottomSheetAction[]): ReactNode => {
    const layoutClass =
      items.length === 1
        ? 'flex'
        : items.length === 2
          ? 'grid grid-cols-2 gap-3'
          : 'flex flex-col gap-2';
    return (
      <div className={layoutClass}>
        {items.map((action, i) => {
          // Default: last action is primary, others are outline.
          const defaultVariant =
            items.length === 1
              ? 'outline'
              : i === items.length - 1
                ? 'primary'
                : 'outline';
          return (
            <Button
              key={`${action.label}-${i}`}
              variant={action.variant ?? defaultVariant}
              size="lg"
              onClick={action.onClick}
              disabled={action.disabled}
              className="w-full"
            >
              {action.label}
            </Button>
          );
        })}
      </div>
    );
  };

  // Portal to body to escape ancestor transforms that break fixed positioning
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        // `pointer-events-auto` + `data-bottom-sheet` let this work when nested
        // inside a Radix Dialog (Modal), which sets `pointer-events: none` on the
        // body and would otherwise dismiss the parent on outside interaction.
        <div data-bottom-sheet className="pointer-events-auto fixed inset-0" style={{ zIndex }} role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            className={cn(
              'absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl overflow-hidden flex flex-col',
              className,
            )}
            style={{ maxHeight }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Handle — the only swipe-to-dismiss affordance, so inner content scrolls freely */}
            <div
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none shrink-0"
              onPointerDown={handleDragDown}
              onPointerUp={handleDragEnd}
              onPointerCancel={handleDragEnd}
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            {(title || onBack) && (
              <div className="flex items-center gap-1 px-4 pb-3 shrink-0">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="-ml-2 min-w-10 min-h-10 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    aria-label="Back"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                {showClose && (
                  <button
                    onClick={onClose}
                    className="ml-auto min-w-10 min-h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Pinned (non-scrolling) header content, e.g. a search box */}
            {header && <div className="shrink-0 px-4 pb-3">{header}</div>}

            {/* Content — flex-1 + min-h-0 ensures it scrolls within maxHeight */}
            <div ref={contentRef} className={cn("flex-1 min-h-0 overflow-y-auto px-4", hasFooter ? "pb-4" : "pb-8")}>
              {children}
            </div>

            {/* Sticky footer — `actions` takes precedence over `footer` if both passed */}
            {hasFooter && (
              <div className={cn("shrink-0 px-4 pb-6 pt-3 bg-white", contentOverflows && "shadow-[0_-4px_12px_rgba(0,0,0,0.06)]")}>
                {actions && actions.length > 0 ? renderActions(actions) : footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
