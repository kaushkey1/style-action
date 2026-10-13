import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, GripVertical, Lock, Check } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

/** Gap between the trigger and the popover. */
const POPOVER_GAP_PX = 6;
/** Margin kept between the popover and every viewport edge. */
const VIEWPORT_MARGIN_PX = 12;
/** Below this much room beneath the trigger, flip the popover upward (if there's more room above). */
const FLIP_THRESHOLD_PX = 280;
/** Never render the panel shorter than this (internal scroll handles the overflow). */
const MIN_PANEL_PX = 180;
/** Panel width (matches w-60). */
const PANEL_WIDTH_PX = 240;

interface PopoverPlacement {
  left: number;
  top: number | null;
  bottom: number | null;
  maxHeight: number;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ColumnItem {
  key: string;
  label: string;
  locked?: boolean;
}

interface ColumnFilterDropdownProps {
  /** All available columns (locked + unlocked) */
  columns: ColumnItem[];
  /** Currently visible column keys (ordered) */
  visibleKeys: string[];
  /** Called with new visible keys when Apply is clicked */
  onApply: (visibleKeys: string[]) => void;
  /** Default visible keys for Reset */
  defaultVisibleKeys: string[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ColumnFilterDropdown({
  columns,
  visibleKeys,
  onApply,
  defaultVisibleKeys,
}: ColumnFilterDropdownProps): React.ReactNode {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [draftKeys, setDraftKeys] = useState<string[]>(visibleKeys);
  const [dragItem, setDragItem] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // The panel is portaled to <body> with fixed positioning so it escapes every
  // ancestor stacking context / overflow clip (e.g. the fixed TopBar and sticky
  // filter bar). Position + height are derived from the room actually available
  // around the trigger, clamped to the viewport so it never spills off-screen.
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

    // Right-align the panel to the trigger, clamped within the viewport.
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

  // Re-measure when opening and whenever the page scrolls/resizes while open.
  useLayoutEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- measure-then-place: must read the trigger's layout after render to size/position the portaled popover (runs pre-paint, no flicker)
    updatePlacement();
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);
    return () => {
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [open, updatePlacement]);

  // Toggle handler that syncs draft keys when opening
  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      if (!prev) {
        // About to open — sync draft to current external state
        setDraftKeys(visibleKeys);
      }
      return !prev;
    });
  }, [visibleKeys]);

  // Close on click outside (the panel is portaled, so check it separately)
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent): void {
      const target = e.target as Node;
      const insideTrigger = ref.current?.contains(target);
      const insidePanel = panelRef.current?.contains(target);
      if (!insideTrigger && !insidePanel) {
        setOpen(false);
        setSearch('');
      }
    }
    function handleEscape(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
     
  }, [open]);

  const locked = columns.filter((c) => c.locked);
  const unlocked = columns.filter((c) => !c.locked);

  const visibleUnlocked = draftKeys.filter((k) => unlocked.some((c) => c.key === k));
  const hiddenUnlocked = unlocked.filter((c) => !draftKeys.includes(c.key)).map((c) => c.key);

  const query = search.trim().toLowerCase();
  const filterMatch = (key: string): boolean => {
    if (!query) return true;
    const col = columns.find((c) => c.key === key);
    return col ? col.label.toLowerCase().includes(query) : false;
  };

  const toggleColumn = useCallback((key: string) => {
    setDraftKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }, []);

  const handleApply = useCallback(() => {
    onApply(draftKeys);
    setOpen(false);
    setSearch('');
  }, [draftKeys, onApply]);

  const handleReset = useCallback(() => {
    setDraftKeys(defaultVisibleKeys);
  }, [defaultVisibleKeys]);

  // Drag and drop reorder within visible columns
  const handleDragStart = useCallback((key: string) => {
    setDragItem(key);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (!dragItem || dragItem === targetKey) return;
    setDraftKeys((prev) => {
      const without = prev.filter((k) => k !== dragItem);
      const targetIdx = without.indexOf(targetKey);
      if (targetIdx === -1) return prev;
      without.splice(targetIdx, 0, dragItem);
      return without;
    });
  }, [dragItem]);

  const handleDragEnd = useCallback(() => {
    setDragItem(null);
  }, []);

  const getLabel = (key: string): string => columns.find((c) => c.key === key)?.label ?? key;

  const activeCount = draftKeys.length;
  const hasChanges = JSON.stringify(draftKeys) !== JSON.stringify(visibleKeys);

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={cn(
          'inline-flex items-center gap-1.5 min-h-11 lg:min-h-8 h-8 px-3 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap',
          open
            ? 'border-primary bg-primary-50 text-primary'
            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
        )}
        aria-label="Toggle column visibility"
        aria-expanded={open}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        Columns
        {activeCount !== defaultVisibleKeys.length && (
          <span className="ml-0.5 text-xs text-primary font-semibold">({activeCount})</span>
        )}
      </button>

      {open && placement && createPortal(
        <div
          ref={panelRef}
          className="fixed z-50 w-60 rounded-lg border border-gray-200 bg-white shadow-lg flex flex-col animate-fadeInUp"
          /* eslint-disable-next-line no-restricted-syntax -- fixed position + max-height computed from the trigger's live viewport rect */
          style={{
            left: placement.left,
            top: placement.top ?? undefined,
            bottom: placement.bottom ?? undefined,
            maxHeight: placement.maxHeight,
          }}
        >
          {/* Search */}
          <div className="p-2 border-b border-gray-100 shrink-0">
            {/* eslint-disable-next-line no-restricted-syntax -- search input inside column filter dropdown, not a form field */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search columns..."
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 placeholder:text-gray-400 focus:outline-none focus-kb:border-primary focus-kb:ring-1 focus-kb:ring-primary"
            />
          </div>

          {/* Scrollable column list — onDragOver prevents scroll from capturing drag gesture */}
          { }
          <div className="flex-1 min-h-0 overflow-y-auto" onDragOver={(e) => e.preventDefault()}>
            {/* Locked columns */}
            {locked.length > 0 && (
              <div className="px-2 pt-2 pb-1">
                {locked.filter((c) => filterMatch(c.key)).map((col) => (
                  <div
                    key={col.key}
                    className="flex items-center gap-2 px-2 py-2 text-sm text-gray-400"
                  >
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>{col.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Visible (checked) columns */}
            {visibleUnlocked.filter(filterMatch).length > 0 && (
              <div className="px-2 pt-1 pb-1">
                <div className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Visible</div>
                {visibleUnlocked.filter(filterMatch).map((key) => (
                  <div
                    key={key}
                    draggable
                    onDragStart={() => handleDragStart(key)}
                    onDragOver={(e) => handleDragOver(e, key)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'flex items-center gap-2 px-2 py-2 rounded-lg text-sm cursor-grab active:cursor-grabbing transition-colors',
                      dragItem === key ? 'bg-primary-50 opacity-60' : 'hover:bg-gray-50',
                    )}
                  >
                    <GripVertical className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <button
                      type="button"
                      onClick={() => toggleColumn(key)}
                      className={cn(
                        'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                        'border-primary bg-primary',
                      )}
                    >
                      <Check className="w-3 h-3 text-white" />
                    </button>
                    <span className="text-gray-700">{getLabel(key)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Hidden (unchecked) columns */}
            {hiddenUnlocked.filter(filterMatch).length > 0 && (
              <div className="px-2 pt-1 pb-2">
                <div className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Hidden</div>
                {hiddenUnlocked.filter(filterMatch).map((key) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    <GripVertical className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <button
                      type="button"
                      onClick={() => toggleColumn(key)}
                      className="w-4 h-4 rounded border-2 border-gray-300 flex items-center justify-center shrink-0 transition-colors hover:border-gray-400"
                    />
                    <span className="text-gray-500">{getLabel(key)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sticky footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-2 py-2 flex items-center justify-end gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={!hasChanges}
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Apply
            </Button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
