import { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpDown, ArrowUp, ArrowDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { FilterSearch } from './FilterBar';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SortColumn {
  key: string;
  label: string;
}

export interface TableToolbarProps {
  /** Search input value. Omit together with onSearchChange for a sort-only toolbar. */
  search?: string;
  /** Search change handler. When omitted, the search input is not rendered. */
  onSearchChange?: (value: string) => void;
  /** Placeholder for the search input */
  searchPlaceholder?: string;
  /** Available columns to sort by */
  sortColumns: SortColumn[];
  /** Currently active sort column key (null = no sort) */
  sortKey: string | null;
  /** Current sort direction */
  sortDir: 'asc' | 'desc';
  /** Called when sort changes. key=null means clear sort. */
  onSortChange: (key: string | null, dir: 'asc' | 'desc') => void;
  /** Additional className for the toolbar container */
  className?: string;
}

// ---------------------------------------------------------------------------
// Sort Content (shared between desktop popover and mobile BottomSheet)
// ---------------------------------------------------------------------------

function SortContent({
  columns,
  activeKey,
  activeDir,
  onApply,
  onClear,
}: {
  columns: SortColumn[];
  activeKey: string | null;
  activeDir: 'asc' | 'desc';
  onApply: (key: string | null, dir: 'asc' | 'desc') => void;
  onClear: () => void;
}): React.ReactNode {
  const [selectedKey, setSelectedKey] = useState<string | null>(activeKey);
  const [selectedDir, setSelectedDir] = useState<'asc' | 'desc'>(activeDir);

  return (
    <div className="flex flex-col gap-1 min-h-0 flex-1">
      {/* Column selection — scrolls when the list is long; direction + actions stay pinned below */}
      <div className="space-y-0.5 overflow-y-auto min-h-0 flex-1">
        {columns.map((col) => (
          <button
            key={col.key}
            type="button"
            className={cn(
              'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm text-left transition-colors',
              selectedKey === col.key
                ? 'bg-primary-50 text-primary-700 font-medium'
                : 'text-gray-700 hover:bg-gray-50',
            )}
            onClick={() => setSelectedKey(col.key)}
          >
            <span
              className={cn(
                'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                selectedKey === col.key
                  ? 'border-primary-600 bg-primary-600'
                  : 'border-gray-300',
              )}
            >
              {selectedKey === col.key && (
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </span>
            {col.label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 my-1 shrink-0" />

      {/* Direction */}
      <div className="space-y-0.5 shrink-0">
        <button
          type="button"
          className={cn(
            'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm text-left transition-colors',
            selectedDir === 'asc'
              ? 'bg-primary-50 text-primary-700 font-medium'
              : 'text-gray-700 hover:bg-gray-50',
          )}
          onClick={() => setSelectedDir('asc')}
        >
          <ArrowUp className="w-4 h-4 shrink-0" />
          Low to High
        </button>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm text-left transition-colors',
            selectedDir === 'desc'
              ? 'bg-primary-50 text-primary-700 font-medium'
              : 'text-gray-700 hover:bg-gray-50',
          )}
          onClick={() => setSelectedDir('desc')}
        >
          <ArrowDown className="w-4 h-4 shrink-0" />
          High to Low
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 my-1 shrink-0" />

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 px-1 pb-1 shrink-0">
        <Button
          variant="outline-destructive"
          size="sm"
          onClick={onClear}
        >
          Reset
        </Button>
        <Button
          size="sm"
          onClick={() => onApply(selectedKey, selectedDir)}
        >
          <Check className="w-3.5 h-3.5 mr-1" />
          Apply
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desktop popover (no external dependency — plain div + click-outside)
// ---------------------------------------------------------------------------

/** Gap between the trigger and the popover. */
const POPOVER_GAP_PX = 6;
/** Margin kept between the popover and every viewport edge. */
const VIEWPORT_MARGIN_PX = 12;
/** Below this much room beneath the trigger, flip the popover upward (if there's more room above). */
const FLIP_THRESHOLD_PX = 280;
/** Never render the panel shorter than this (internal scroll handles the overflow). */
const MIN_PANEL_PX = 180;
/** Panel width (matches w-56). */
const PANEL_WIDTH_PX = 224;

interface PopoverPlacement {
  left: number;
  top: number | null;
  bottom: number | null;
  maxHeight: number;
}

/**
 * Sort popover. The panel is portaled to <body> with fixed positioning so it
 * escapes every ancestor stacking context / overflow clip (e.g. the fixed TopBar
 * and sticky filter bar). Position + height are derived from the room actually
 * available around the trigger, clamped to the viewport so it never spills
 * off-screen; a long column list scrolls internally with the actions pinned.
 */
function SortPopover({
  trigger,
  open,
  onOpenChange,
  children,
}: {
  trigger: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}): React.ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<PopoverPlacement | null>(null);

  const updatePlacement = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const spaceBelow = vh - rect.bottom - POPOVER_GAP_PX - VIEWPORT_MARGIN_PX;
    const spaceAbove = rect.top - POPOVER_GAP_PX - VIEWPORT_MARGIN_PX;
    const openUp = spaceBelow < FLIP_THRESHOLD_PX && spaceAbove > spaceBelow;
    const available = openUp ? spaceAbove : spaceBelow;
    const maxHeight = Math.max(MIN_PANEL_PX, Math.round(available));
    const left = Math.min(
      Math.max(rect.right - PANEL_WIDTH_PX, VIEWPORT_MARGIN_PX),
      vw - PANEL_WIDTH_PX - VIEWPORT_MARGIN_PX,
    );
    setPlacement(
      openUp
        ? { left, top: null, bottom: Math.round(vh - rect.top + POPOVER_GAP_PX), maxHeight }
        : { left, top: Math.round(rect.bottom + POPOVER_GAP_PX), bottom: null, maxHeight },
    );
  }, []);

  // Measure-then-place on open, and re-measure on scroll/resize while open.
  useLayoutEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- measure-then-place: read trigger layout after render to size/position the portaled popover (pre-paint, no flicker)
    updatePlacement();
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);
    return () => {
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [open, updatePlacement]);

  // Close on click outside (the panel is portaled, so check it separately) + Escape.
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent): void {
      const target = e.target as Node;
      if (!ref.current?.contains(target) && !panelRef.current?.contains(target)) {
        onOpenChange(false);
      }
    }
    function handleEscape(e: KeyboardEvent): void {
      if (e.key === 'Escape') onOpenChange(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={ref} className="relative">
      <button ref={triggerRef} type="button" className="appearance-none" onClick={() => onOpenChange(!open)}>{trigger}</button>
      {open && placement && createPortal(
        <div
          ref={panelRef}
          className="fixed z-50 w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-lg flex flex-col animate-fadeInUp"
           
          style={{
            left: placement.left,
            top: placement.top ?? undefined,
            bottom: placement.bottom ?? undefined,
            maxHeight: placement.maxHeight,
          }}
        >
          {children}
        </div>,
        document.body,
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TableToolbar
// ---------------------------------------------------------------------------

export function TableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  sortColumns,
  sortKey,
  sortDir,
  onSortChange,
  className,
}: TableToolbarProps): React.ReactNode {
  const isMobile = useIsMobile();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeLabel = sortKey
    ? sortColumns.find((c) => c.key === sortKey)?.label
    : null;

  const hasSortColumns = sortColumns.length > 0;

  const handleApply = useCallback((key: string | null, dir: 'asc' | 'desc'): void => {
    onSortChange(key, dir);
    setPopoverOpen(false);
    setSheetOpen(false);
  }, [onSortChange]);

  const defaultKey = sortColumns[0]?.key ?? null;

  const handleClear = useCallback((): void => {
    onSortChange(defaultKey, 'desc');
    setPopoverOpen(false);
    setSheetOpen(false);
  }, [onSortChange, defaultKey]);

  const sortButton = (
    <button
      type="button"
      className={cn(
        // Mirrors Button.tsx canonical responsive pattern: 44px mobile tap target, 32px desktop
        'inline-flex items-center gap-1.5 min-h-11 lg:min-h-8 h-8 px-3 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap',
        sortKey
          ? 'border-gray-200 bg-white text-gray-700'
          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
      )}
      aria-label={activeLabel ? `Sorted by ${activeLabel}` : 'Sort table'}
    >
      <ArrowUpDown className="w-3.5 h-3.5" />
      {activeLabel ? (
        <>
          {activeLabel}
          {sortDir === 'asc' ? (
            <ArrowUp className="w-3 h-3" />
          ) : (
            <ArrowDown className="w-3 h-3" />
          )}
        </>
      ) : (
        'Sort'
      )}
    </button>
  );

  return (
    <div className={cn('flex items-center gap-2 w-full', !onSearchChange && 'justify-end', className)}>
      {onSearchChange && (
        <div className="flex-1 min-w-0">
          <FilterSearch
            value={search ?? ''}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            className="w-full"
          />
        </div>
      )}

      {hasSortColumns && !isMobile && (
        <SortPopover
          trigger={sortButton}
          open={popoverOpen}
          onOpenChange={setPopoverOpen}
        >
          <SortContent
            columns={sortColumns}
            activeKey={sortKey}
            activeDir={sortDir}
            onApply={handleApply}
            onClear={handleClear}
          />
        </SortPopover>
      )}

      {hasSortColumns && isMobile && (
        <>
          <button type="button" className="appearance-none" onClick={() => setSheetOpen(true)}>{sortButton}</button>
          <BottomSheet
            isOpen={sheetOpen}
            onClose={() => setSheetOpen(false)}
            title="Sort By"
          >
            <SortContent
              columns={sortColumns}
              activeKey={sortKey}
              activeDir={sortDir}
              onApply={handleApply}
              onClear={handleClear}
            />
          </BottomSheet>
        </>
      )}
    </div>
  );
}
