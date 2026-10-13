import { type ReactNode, Children, isValidElement, useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Search, X, Check, ChevronDown, Loader2, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { BottomSheet } from "./BottomSheet";
import { Button } from "./Button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./Select";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

// ─── Viewport-aware dropdown positioning ────────────────────────────────

const VIEWPORT_GUTTER = 8;

/**
 * Clamp a portaled dropdown panel inside the viewport after it renders.
 * The open-time position is an estimate (panel width guessed, height unknown);
 * this re-measures the REAL panel box before paint and corrects both axes:
 * re-anchors horizontally, and flips above the trigger — or pins to the
 * viewport edge — when the panel would clip below. Every custom popover in
 * this file must use it (see ux-patterns.md "Overlays are viewport-aware").
 */
function useViewportClampedDropdown(
  isOpen: boolean,
  triggerRef: React.RefObject<HTMLElement | null>,
  panelRef: React.RefObject<HTMLElement | null>,
  pos: { top: number; left: number },
  setPos: (p: { top: number; left: number }) => void,
): void {
  useLayoutEffect(() => {
    if (!isOpen) return;
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;
    const t = trigger.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    // Horizontal — positional edge anchoring: a trigger on the right half of
    // the viewport anchors the menu's right edge to its own (menu grows left);
    // on the left half it anchors left edges (menu grows right). Only applies
    // when the menu is wider than the trigger. Gutter clamp as safety net.
    const anchorRight = t.left + t.width / 2 > window.innerWidth / 2 && p.width > t.width;
    let left = anchorRight ? t.right - p.width : t.left;
    left = Math.min(
      Math.max(left, VIEWPORT_GUTTER),
      Math.max(VIEWPORT_GUTTER, window.innerWidth - VIEWPORT_GUTTER - p.width),
    );
    // Vertical: below the trigger; flip above when it would clip; as a last
    // resort pin to the bottom viewport edge.
    let top = t.bottom + 4;
    if (top + p.height > window.innerHeight - VIEWPORT_GUTTER) {
      const flipped = t.top - 4 - p.height;
      top =
        flipped >= VIEWPORT_GUTTER
          ? flipped
          : Math.max(VIEWPORT_GUTTER, window.innerHeight - VIEWPORT_GUTTER - p.height);
    }
    // Sub-pixel guard stops the correct→rerender→correct loop.
    if (Math.abs(top - pos.top) > 1 || Math.abs(left - pos.left) > 1) {
      setPos({ top, left });
    }
  }, [isOpen, triggerRef, panelRef, pos, setPos]);
}

// ─── FilterBar (layout container) ──────────────────────────────────────

interface FilterBarProps {
  children: ReactNode;
  className?: string;
  /** @deprecated No longer used — filters are shown inline on mobile. */
  activeFilterCount?: number;
}

/**
 * Layout container for filter controls.
 * Renders filter icon + children in a horizontal scrollable row.
 * On mobile, individual filter components (FilterSelect, FilterMultiSelect, FilterDateRange)
 * open BottomSheets instead of dropdowns.
 */
export function FilterBar({ children, className }: FilterBarProps) {
  const childArray = Children.toArray(children);

  // Separate FilterSearch from other children
  const searchChildren: ReactNode[] = [];
  const filterChildren: ReactNode[] = [];

  childArray.forEach((child) => {
    if (isValidElement(child) && child.type === FilterSearch) {
      searchChildren.push(child);
    } else {
      filterChildren.push(child);
    }
  });

  return (
    <div
      className={cn(
        "flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide lg:flex-wrap lg:overflow-visible",
        className,
      )}
    >
      {filterChildren}
      {searchChildren.length > 0 && (
        <>
          <div className="hidden sm:block flex-1" />
          {searchChildren}
        </>
      )}
    </div>
  );
}

// ─── FilterPills ────────────────────────────────────────────────────────

interface FilterPillOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterPillsProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterPillOption[];
  className?: string;
  loading?: boolean;
}

/**
 * Pill-style toggle buttons for categorical filters with 2-5 options.
 */
export function FilterPills({ value, onChange, options, className, loading }: FilterPillsProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            disabled={loading}
            className={cn(
              "min-h-11 lg:min-h-8 h-8 px-3 text-sm lg:text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1.5",
              isActive ? "bg-primary/10 text-primary" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50",
              loading && "cursor-wait",
            )}
          >
            {loading && isActive && <Loader2 className="w-3 h-3 animate-spin" />}
            {option.label}
            {option.count !== undefined && <span className="ml-1 opacity-70">({option.count})</span>}
          </button>
        );
      })}
    </div>
  );
}

// ─── FilterSelect ───────────────────────────────────────────────────────

interface FilterSelectOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: FilterSelectOption[];
  className?: string;
  disabled?: boolean;
  /** Enable inline search within the dropdown. */
  searchable?: boolean;
  /** Auto-enable search when options exceed this count. Default: 6. */
  searchThreshold?: number;
  /**
   * Opt-in: classes merged onto the trigger's label (searchable dropdown and mobile sheet trigger).
   * Default caps the desktop label at `max-w-40`; pass e.g. `max-w-none` to show long labels in full.
   */
  labelClassName?: string;
  /** Opt-in: classes merged onto the searchable desktop dropdown panel (default width `w-56`). */
  panelClassName?: string;
  /** Opt-in: replaces the option label classes in the searchable dropdown and mobile sheet (default `truncate`). */
  optionLabelClassName?: string;
}

const DEFAULT_SEARCH_THRESHOLD = 6;

/**
 * Dropdown filter for categorical filters.
 * When searchable, renders a custom dropdown with inline search input.
 * Desktop: Radix Select (non-searchable) or custom popover (searchable).
 * Mobile: BottomSheet with optional search input at top.
 */
export function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
  className,
  disabled,
  searchable,
  searchThreshold = DEFAULT_SEARCH_THRESHOLD,
  labelClassName,
  panelClassName,
  optionLabelClassName,
}: FilterSelectProps) {
  // Filter out any options with empty string values to prevent Radix UI errors
  const validOptions = options.filter((option) => option.value !== "");

  const isSearchEnabled = searchable === true || (searchable !== false && validOptions.length > searchThreshold);

  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const selectedLabel = options.find((o) => o.value === value)?.label;

  const filtered = search
    ? validOptions.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : validOptions;

  // Calculate dropdown position from trigger element. Right-align the popover
  // when left-aligning would overflow the viewport (same as FilterDateRange).
  const updateDropdownPos = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const estWidth = 224; // panel is w-56
    const anchorRight = rect.left + rect.width / 2 > window.innerWidth / 2 && estWidth > rect.width;
    const left = anchorRight ? Math.max(8, rect.right - estWidth) : rect.left;
    setDropdownPos({ top: rect.bottom + 4, left });
  }, []);

  // Correct the estimate against the rendered panel — flips up / clamps when
  // the viewport would cut the menu.
  useViewportClampedDropdown(desktopOpen, ref, dropdownRef, dropdownPos, setDropdownPos);

  // Close desktop dropdown on outside click, scroll, resize + auto-focus search
  useEffect(() => {
    if (!desktopOpen) return;
    // Focus after a tick so the portal has rendered
    requestAnimationFrame(() => searchRef.current?.focus());
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        ref.current && !ref.current.contains(target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      ) {
        setDesktopOpen(false);
        setSearch("");
        setHighlightIndex(-1);
      }
    }
    function onScroll(e: Event) {
      // Don't close when scrolling inside the dropdown list
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setDesktopOpen(false);
      setSearch("");
      setHighlightIndex(-1);
    }
    document.addEventListener("mousedown", onMouseDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", updateDropdownPos);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", updateDropdownPos);
    };
  }, [desktopOpen, updateDropdownPos]);

  function closeDropdown() {
    setDesktopOpen(false);
    setMobileOpen(false);
    setSearch("");
    setHighlightIndex(-1);
  }

  function handleSearchChange(newSearch: string) {
    setSearch(newSearch);
    setHighlightIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isSearchEnabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === "Enter" && highlightIndex >= 0 && highlightIndex < filtered.length) {
      e.preventDefault();
      const opt = filtered[highlightIndex];
      if (opt) {
        onChange(opt.value);
        closeDropdown();
      }
    } else if (e.key === "Escape") {
      closeDropdown();
    }
  }

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[highlightIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex]);

  // ─── Mobile ───
  if (isMobile) {
    return (
      <div className={cn(className)}>
        <button
          type="button"
          onClick={() => {
            if (!disabled) setMobileOpen(true);
          }}
          className={cn(
            "flex items-center justify-between gap-1.5 w-full min-h-11 px-3 text-base rounded-lg border border-gray-300 bg-white transition-colors hover:bg-gray-50",
            selectedLabel ? "text-gray-900" : "text-gray-500",
            disabled && "opacity-60 cursor-not-allowed",
          )}
        >
          <span className={cn("truncate", labelClassName)}>{selectedLabel || placeholder}</span>
          <ChevronDown className="w-4 h-4 shrink-0 text-gray-400" />
        </button>
        <BottomSheet isOpen={mobileOpen} onClose={closeDropdown} title={placeholder} zIndex={50}>
          {isSearchEnabled && (
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search..."
                aria-label={`Search ${placeholder ?? "options"}`}
                className="w-full min-h-[44px] pl-10 pr-10 text-base rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus-kb:ring-2 focus-kb:ring-primary/20 focus-kb:border-primary"
              />
              {search && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          <ul className="space-y-1" role="listbox" aria-label={placeholder}>
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-gray-400 text-center" role="status">
                No matching options
              </li>
            )}
            {filtered.map((opt, idx) => {
              const isActive = value === opt.value;
              const isHighlighted = highlightIndex === idx;
              return (
                <li key={opt.value} role="option" aria-selected={isActive}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      closeDropdown();
                    }}
                    className={cn(
                      "flex items-center justify-between w-full min-h-12 px-4 py-3 text-base rounded-lg transition-colors",
                      isActive ? "bg-primary/5 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-50",
                      isHighlighted && !isActive && "bg-gray-50",
                    )}
                  >
                    <span className={optionLabelClassName ?? "truncate"}>{opt.label}</span>
                    {isActive && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
          {isSearchEnabled && filtered.length > 0 && (
            <p className="sr-only" aria-live="polite">{filtered.length} options available</p>
          )}
        </BottomSheet>
      </div>
    );
  }

  // ─── Desktop: Searchable custom dropdown ───
  if (isSearchEnabled) {
    return (
      <div ref={ref} className={cn("relative", className)}>
        <button
          type="button"
          onClick={() => {
            if (!disabled) {
              if (desktopOpen) {
                closeDropdown();
              } else {
                updateDropdownPos();
                setDesktopOpen(true);
                setSearch("");
                setHighlightIndex(-1);
              }
            }
          }}
          className={cn(
            "flex items-center gap-1.5 w-full min-h-11 lg:min-h-8 h-8 px-3 text-base lg:text-xs rounded-lg border border-gray-300 bg-white transition-colors hover:bg-gray-50",
            selectedLabel ? "text-gray-900" : "text-gray-500",
            desktopOpen && "ring-2 ring-primary/20 border-primary",
            disabled && "opacity-60 cursor-not-allowed",
          )}
        >
          <span className={cn("truncate max-w-40", labelClassName)}>{selectedLabel || placeholder}</span>
          <ChevronDown
            className={cn("w-3 h-3 shrink-0 text-gray-400 transition-transform", desktopOpen && "rotate-180")}
          />
        </button>
        {desktopOpen && createPortal(
          <div
            ref={dropdownRef}
            className={cn("fixed z-50 w-56 rounded-lg border border-gray-200 bg-white shadow-lg", panelClassName)}
            style={{ top: dropdownPos.top, left: dropdownPos.left }}
          >
            <div className="p-1.5">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search..."
                  aria-label={`Search ${placeholder ?? "options"}`}
                  className="w-full h-7 pl-7 pr-2 text-xs rounded border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus-kb:ring-1 focus-kb:ring-primary/30"
                />
              </div>
            </div>
            <ul
              ref={listRef}
              className="max-h-48 overflow-y-auto px-1 pb-1.5"
              role="listbox"
              aria-label={placeholder}
            >
              {filtered.length === 0 && (
                <li className="px-2 py-3 text-xs text-gray-400 text-center" role="status">
                  No matching options
                </li>
              )}
              {filtered.map((opt, idx) => {
                const isActive = value === opt.value;
                const isHighlighted = highlightIndex === idx;
                return (
                  <li key={opt.value} role="option" aria-selected={isActive}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        closeDropdown();
                      }}
                      className={cn(
                        "flex items-center justify-between w-full px-2 py-1.5 text-xs rounded text-left transition-colors",
                        isActive ? "bg-primary/5 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-50",
                        isHighlighted && !isActive && "bg-gray-100",
                      )}
                    >
                      <span className={optionLabelClassName ?? "truncate"}>{opt.label}</span>
                      {isActive && <Check className="w-3 h-3 text-primary shrink-0" />}
                    </button>
                  </li>
                );
              })}
            </ul>
            {filtered.length > 0 && (
              <p className="sr-only" aria-live="polite">
                {filtered.length} options available
              </p>
            )}
          </div>,
          document.body,
        )}
      </div>
    );
  }

  // ─── Desktop: Non-searchable Radix Select (original behavior) ───
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        size="sm"
        // Match FilterMultiSelect / FilterDateRange trigger height exactly (sm's min-h-9
        // isn't overridden at lg → 36px; force 44px touch / 32px desktop like the others).
        className={cn("min-w-[8rem] w-auto min-h-11 lg:min-h-8 lg:h-8", disabled && "opacity-60 cursor-not-allowed", className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {validOptions.map((option) => (
          <SelectItem key={option.value || "empty"} value={option.value || "none"}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── FilterSearch ───────────────────────────────────────────────────────

interface FilterSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Fires on Enter — for searches with a deeper submit action beyond
      live filtering (e.g. Knowledge Base deep content search). */
  onSubmit?: () => void;
}

/**
 * Search input for free-text filtering. Always positioned at the far right
 * of the FilterBar via automatic spacer injection.
 */
export function FilterSearch({ value, onChange, placeholder = "Search...", className, onSubmit }: FilterSearchProps) {
  return (
    <div className={cn("relative w-full sm:w-auto", className)}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit?.();
        }}
        placeholder={placeholder}
        className="w-full min-h-11 lg:min-h-8 h-8 pl-8 pr-3 text-base lg:text-xs rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus-kb:ring-2 focus-kb:ring-primary/20 focus-kb:border-primary transition-colors"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── FilterMultiSelect ──────────────────────────────────────────────────

interface FilterMultiSelectOption {
  value: string;
  label: string;
}

interface FilterMultiSelectProps {
  /** CSV string of selected values, or 'all' for none */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: FilterMultiSelectOption[];
  className?: string;
  /** Show the search box (default true). Set false for short option lists. */
  searchable?: boolean;
  /** Disable the control (e.g. a cascading child before its parent is set). */
  disabled?: boolean;
}

/**
 * Multi-select dropdown for filters. Searchable by default; pass
 * searchable={false} for short lists where the search box isn't warranted.
 * Desktop: absolute dropdown. Mobile: BottomSheet with checkable list.
 */
export function FilterMultiSelect({
  value,
  onChange,
  placeholder = "Select",
  options,
  className,
  searchable = true,
  disabled = false,
}: FilterMultiSelectProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [draftSelected, setDraftSelected] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  // The store's 'all' sentinel ("no filter applied") renders as nothing
  // checked — clearer default state for users. Apply behavior in applyDraft
  // treats "none selected" and "all selected" identically (both → 'all'),
  // so this is semantically equivalent to having all checked.
  const selected = value && value !== "all" ? value.split(",") : [];

  // Calculate dropdown position from trigger element so the portaled popover
  // anchors below the chip even when ancestors have overflow clipping.
  // Right-align the popover when left-aligning would overflow the viewport
  // (same as FilterDateRange) — e.g. a filter docked to the row's right.
  const updateDropdownPos = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const estWidth = Math.min(324, window.innerWidth * 0.88); // w-[20.25rem] capped by max-w-[88vw]
    const anchorRight = rect.left + rect.width / 2 > window.innerWidth / 2 && estWidth > rect.width;
    const left = anchorRight ? Math.max(8, rect.right - estWidth) : rect.left;
    setDropdownPos({ top: rect.bottom + 4, left });
  }, []);

  // Correct the estimate against the rendered panel — flips up / clamps when
  // the viewport would cut the menu.
  useViewportClampedDropdown(open, ref, dropdownRef, dropdownPos, setDropdownPos);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => searchRef.current?.focus());
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        ref.current && !ref.current.contains(target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      ) {
        setOpen(false);
      }
    }
    function onScroll(e: Event) {
      // Don't close when scrolling inside the dropdown list itself.
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", updateDropdownPos);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", updateDropdownPos);
    };
  }, [open, updateDropdownPos]);

  useEffect(() => {
    if (!open || isMobile) return;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open, isMobile]);

  function toggleDraft(val: string) {
    setDraftSelected((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]));
  }

  function selectAll() {
    setDraftSelected(options.map((o) => o.value));
  }

  const isAllSelected = options.length > 0 && draftSelected.length === options.length;

  function toggleSelectAll() {
    if (isAllSelected) {
      clearDraft();
      return;
    }
    selectAll();
  }

  function clearDraft() {
    setDraftSelected([]);
  }

  function applyDraft() {
    const value = draftSelected.length === 0 ? "all" : draftSelected.join(",");
    onChange(value);
    setOpen(false);
    setMobileOpen(false);
  }

  const filtered = search ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase())) : options;

  const label = selected.length ? `${placeholder} (${selected.length})` : placeholder;

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          if (isMobile) {
            setMobileOpen(true);
            setSearch("");
            setDraftSelected(selected);
          } else if (open) {
            setOpen(false);
          } else {
            updateDropdownPos();
            setDraftSelected(selected);
            setSearch("");
            setOpen(true);
          }
        }}
        className={cn(
          "flex items-center gap-1.5 min-h-11 lg:min-h-8 h-8 px-3 text-base lg:text-xs rounded-lg border border-gray-300 bg-white transition-colors hover:bg-gray-50",
          selected.length ? "text-gray-900" : "text-gray-500",
          (open || mobileOpen) && "ring-2 ring-primary/20 border-primary",
          disabled && "opacity-50 cursor-not-allowed hover:bg-white",
        )}
      >
        <span className="truncate max-w-[10rem]">{label}</span>
        <ChevronDown className={cn("w-3 h-3 shrink-0 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>

      {isMobile ? (
        <BottomSheet isOpen={mobileOpen} onClose={() => setMobileOpen(false)} title={placeholder} zIndex={50}>
          {searchable && (
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full min-h-10 pl-10 pr-3 text-base rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus-kb:ring-2 focus-kb:ring-primary/20 focus-kb:border-primary"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          <ul className="space-y-1">
            {filtered.length === 0 && <li className="px-4 py-3 text-sm text-gray-400 text-center">No results</li>}
            {filtered.map((opt) => {
              const isSelected = draftSelected.includes(opt.value);
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => toggleDraft(opt.value)}
                    className={cn(
                        "cursor-pointer flex items-center gap-3 w-full min-h-12 px-4 py-3 text-base rounded-lg text-left transition-colors",
                      isSelected ? "bg-primary/5 text-gray-900" : "text-gray-600 hover:bg-gray-50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex items-center justify-center w-5 h-5 rounded border shrink-0",
                        isSelected ? "bg-primary border-primary text-white" : "border-gray-300",
                      )}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <span>{opt.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
            <Button
              variant="outline-destructive"
              size="sm"
              onClick={clearDraft}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={applyDraft}
            >
              Apply
            </Button>
          </div>
        </BottomSheet>
      ) : (
        open && createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-50 w-[20.25rem] max-w-[88vw] rounded-xl border border-gray-200 bg-white shadow-lg"
            style={{ top: dropdownPos.top, left: dropdownPos.left }}
          >
            {searchable && (
              <div className="p-2 pb-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full h-9 pl-10 pr-3 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus-kb:ring-1 focus-kb:ring-primary/30"
                  />
                </div>
              </div>
            )}
            <div className="px-1 py-1">
              <button
                type="button"
                onClick={toggleSelectAll}
                className={cn(
                  "cursor-pointer flex items-center gap-2.5 w-full px-3.5 py-1 text-sm rounded-lg text-left transition-colors",
                  isAllSelected ? "bg-primary/5 text-gray-900" : "text-gray-600 hover:bg-gray-50",
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center w-4.5 h-4.5 rounded border shrink-0",
                    isAllSelected ? "bg-primary border-primary text-white" : "border-gray-300",
                  )}
                >
                  {isAllSelected && <Check className="w-2.5 h-2.5" />}
                </span>
                <span className="truncate font-medium">Select All</span>
              </button>
            </div>
            <ul
              onWheel={(e) => e.stopPropagation()}
              className="max-h-44 overflow-y-auto overscroll-contain px-1 pb-1 border-t border-gray-100"
            >
              {filtered.length === 0 && <li className="px-2 py-3 text-xs text-gray-400 text-center">No results</li>}
              {filtered.map((opt) => {
                const isSelected = draftSelected.includes(opt.value);
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => toggleDraft(opt.value)}
                      className={cn(
                        "cursor-pointer flex items-center gap-2.5 w-full px-3.5 py-1 text-sm rounded-lg text-left transition-colors",
                        isSelected ? "bg-primary/5 text-gray-900" : "text-gray-600 hover:bg-gray-50",
                      )}
                    >
                      <span
                        className={cn(
                          "flex items-center justify-center w-4.5 h-4.5 rounded border shrink-0",
                          isSelected ? "bg-primary border-primary text-white" : "border-gray-300",
                        )}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                      </span>
                      <span className="truncate">{opt.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-end gap-4">
              <Button
                variant="outline-destructive"
                size="sm"
                onClick={clearDraft}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={applyDraft}
              >
                Apply
              </Button>
            </div>
          </div>,
          document.body,
        )
      )}
    </div>
  );
}

// ─── FilterDateRange ─────────────────────────────────────────────────────

interface FilterDateRangeProps {
  fromValue: string; // 'YYYY-MM-DD' or ''
  toValue: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  className?: string;
  /** Optional max selectable date in YYYY-MM-DD (inclusive). Defaults to today when allowFutureDates is false. */
  maxDate?: string;
  /** When true, future dates are selectable. Defaults to false. */
  allowFutureDates?: boolean;
  /** Optional earliest selectable date in YYYY-MM-DD (inclusive). Dates before this are disabled. */
  minDate?: string;
  /**
   * Tooltip copy shown when the user hovers/taps a date beyond `maxDate`.
   * Defaults to the T-2 data-freshness message, formatted with the cap date.
   */
  disabledFutureTooltip?: string;
  /**
   * Tooltip copy shown when the user hovers/taps a date before `minDate`.
   * Defaults to "Data not available before <minDate>".
   */
  disabledPastTooltip?: string;
  /** Single-date mode — pick one date instead of a range. Implies hidePresets. */
  single?: boolean;
  /** Hide the preset sidebar/pills (WTD/MTD/QTD/YTD). */
  hidePresets?: boolean;
}

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}
function fmtDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function fmtDisplay(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getSunday(d: Date): Date {
  const day = d.getDay();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
}

function getQuarterStart(d: Date): Date {
  const q = Math.floor(d.getMonth() / 3) * 3;
  return new Date(d.getFullYear(), q, 1);
}

type RangeEnd = "from" | "to";
type Preset = "custom" | "today" | "yesterday" | "wtd" | "mtd" | "qtd" | "ytd";

const presets: { key: Preset; label: string }[] = [
  { key: "custom", label: "Custom" },
  { key: "wtd", label: "WTD" },
  { key: "mtd", label: "MTD" },
  { key: "qtd", label: "QTD" },
  { key: "ytd", label: "YTD" },
];

function getPresetRange(key: Preset, today: Date): [Date, Date] | null {
  switch (key) {
    case "today":
      return [today, today];
    case "yesterday": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return [y, y];
    }
    case "wtd":
      return [getSunday(today), today];
    case "mtd":
      return [new Date(today.getFullYear(), today.getMonth(), 1), today];
    case "qtd":
      return [getQuarterStart(today), today];
    case "ytd":
      return [new Date(today.getFullYear(), 0, 1), today];
    default:
      return null;
  }
}

/**
 * Date range picker with sidebar presets and calendar.
 * Desktop: absolute dropdown with sidebar + calendar. Mobile: BottomSheet with vertical layout.
 */
export function FilterDateRange({
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  className,
  maxDate,
  allowFutureDates = false,
  minDate,
  disabledFutureTooltip,
  disabledPastTooltip,
  single = false,
  hidePresets = false,
}: FilterDateRangeProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectingRaw, setSelecting] = useState<RangeEnd>("from");
  const selecting: RangeEnd = !fromValue && !toValue ? "from" : selectingRaw;
  const [activePreset, setActivePreset] = useState<Preset>("custom");
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const updateDropdownPos = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    // Right-align the popover to the trigger when left-aligning would overflow the
    // viewport (e.g. a date picker docked to the right of a toolbar). Left-docked
    // triggers (the dashboards) keep their original left-aligned behavior.
    const estWidth = single || hidePresets ? 312 : 412;
    const anchorRight = rect.left + rect.width / 2 > window.innerWidth / 2 && estWidth > rect.width;
    const left = anchorRight ? Math.max(8, rect.right - estWidth) : rect.left;
    setDropdownPos({ top: rect.bottom + 4, left });
  }, [single, hidePresets]);

  // Correct the estimate against the rendered panel — flips up / clamps when
  // the viewport would cut the menu.
  useViewportClampedDropdown(open, ref, dropdownRef, dropdownPos, setDropdownPos);

  const today = useMemo(() => new Date(), []);

  // null means no upper bound — all future dates are selectable (when allowFutureDates is true).
  const resolvedMaxDate = useMemo((): Date | null => {
    if (maxDate) {
      const parts = maxDate.split("-").map(Number);
      const y = parts[0], m = parts[1], d = parts[2];
      if (y && m && d) return new Date(y, m - 1, d);
    }
    if (allowFutureDates) return null;
    // Default: cap to today so future dates are not selectable.
    const cap = new Date();
    cap.setHours(23, 59, 59, 999);
    return cap;
  }, [maxDate, allowFutureDates]);
  const maxDateIso: string | null = resolvedMaxDate ? fmtDate(resolvedMaxDate) : null;

  const resolvedMinDate = useMemo((): Date | null => {
    if (!minDate) return null;
    const parts = minDate.split("-").map(Number);
    const y = parts[0], m = parts[1], d = parts[2];
    if (y && m && d) return new Date(y, m - 1, d);
    return null;
  }, [minDate]);
  const minDateIso: string | null = resolvedMinDate ? fmtDate(resolvedMinDate) : null;

  // Tooltip copy for disabled day cells. T-2 default surfaces the cap date
  // and explains the data-freshness policy. Callers can override.
  const futureTooltipText =
    disabledFutureTooltip ??
    (maxDateIso
      ? `Data is available only up to ${fmtDisplay(maxDateIso)} (T-2 cycle). Today and yesterday haven't refreshed yet.`
      : "This date isn't available yet.");
  const pastTooltipText =
    disabledPastTooltip ??
    (minDateIso
      ? `Data not available before ${fmtDisplay(minDateIso)}.`
      : "This date isn't available.");

  const [viewYear, setViewYear] = useState((resolvedMaxDate ?? today).getFullYear());
  const [viewMonth, setViewMonth] = useState((resolvedMaxDate ?? today).getMonth());

  useEffect(() => {
    if (!open) return;
    /** pointerdown covers touch + mouse; mousedown alone can mis-fire on iOS Safari for in-popover taps. */
    function onPointerDownOutside(e: PointerEvent) {
      const target = e.target as Node;
      if (
        ref.current && !ref.current.contains(target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      ) {
        setOpen(false);
      }
    }
    function onScroll(e: Event) {
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDownOutside);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", updateDropdownPos);
    return () => {
      document.removeEventListener("pointerdown", onPointerDownOutside);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", updateDropdownPos);
    };
  }, [open, updateDropdownPos]);

  // Reset preset to custom when both dates are cleared
  const effectivePreset: Preset = !fromValue && !toValue ? "custom" : activePreset;

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const startOffset = firstDayOfWeek; // Sun=0
  const totalCells = startOffset + daysInMonth;
  const trailingDays = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);

  function handleDayClick(day: number) {
    setActivePreset("custom");
    const iso = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
    if (maxDateIso && iso > maxDateIso) return;
    if (minDateIso && iso < minDateIso) return;
    if (single) {
      // Single-date mode: select one day, mirror it to both ends, and close.
      onFromChange(iso);
      onToChange(iso);
      setOpen(false);
      setMobileOpen(false);
      return;
    }
    if (selecting === "from") {
      onFromChange(iso);
      if (toValue && iso > toValue) onToChange("");
      setSelecting("to");
    } else {
      if (fromValue && iso < fromValue) {
        onToChange(fromValue);
        onFromChange(iso);
      } else {
        onToChange(iso);
      }
      setSelecting("from");
    }
  }

  function handlePresetClick(key: Preset) {
    setActivePreset(key);
    if (key === "custom") {
      onFromChange("");
      onToChange("");
      setSelecting("from");
      return;
    }
    const range = getPresetRange(key, resolvedMaxDate ?? today);
    if (range) {
      const clampedFrom = resolvedMinDate && range[0] < resolvedMinDate ? resolvedMinDate : range[0];
      onFromChange(fmtDate(clampedFrom));
      onToChange(fmtDate(range[1]));
      setSelecting("from");
    }
  }

  function clearDateRange(e?: React.PointerEvent | React.MouseEvent) {
    e?.stopPropagation();
    setActivePreset("custom");
    onFromChange("");
    onToChange("");
    setSelecting("from");
  }

  const prevMonth = () => {
    if (
      resolvedMinDate &&
      (viewYear < resolvedMinDate.getFullYear() ||
        (viewYear === resolvedMinDate.getFullYear() &&
          viewMonth <= resolvedMinDate.getMonth()))
    ) {
      return;
    }
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (
      resolvedMaxDate &&
      (viewYear > resolvedMaxDate.getFullYear() ||
        (viewYear === resolvedMaxDate.getFullYear() &&
          viewMonth >= resolvedMaxDate.getMonth()))
    ) {
      return;
    }
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else setViewMonth(viewMonth + 1);
  };

  const monthLabel = new Date(viewYear, viewMonth).toLocaleString("en-US", { month: "long", year: "numeric" });
  const isAtCurrentMonth = resolvedMaxDate
    ? viewYear === resolvedMaxDate.getFullYear() && viewMonth === resolvedMaxDate.getMonth()
    : false;
  const isAtMinMonth = resolvedMinDate
    ? viewYear === resolvedMinDate.getFullYear() && viewMonth === resolvedMinDate.getMonth()
    : false;

  const hasRange = fromValue || toValue;
  const presetsHidden = hidePresets || single;
  const triggerLabel = single
    ? fmtDisplay(fromValue) || "Select date"
    : hasRange
      ? `${fmtDisplay(fromValue) || "..."} – ${fmtDisplay(toValue) || "..."}`
      : "Date Range";

  function isDayInRange(day: number): boolean {
    if (single || !fromValue || !toValue) return false;
    const iso = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
    return iso >= fromValue && iso <= toValue;
  }

  function isDaySelected(day: number): boolean {
    const iso = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
    return iso === fromValue || iso === toValue;
  }

  // Day grid renderer — shared logic, different sizing per context
  function renderDayGrid(textSize: string) {
    return (
      <div className="grid grid-cols-7">
        {Array.from({ length: startOffset }).map((_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const iso = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
          const daySelected = isDaySelected(day);
          const inRange = isDayInRange(day);
          const isFuture = maxDateIso ? iso > maxDateIso : false;
          const isPast = minDateIso ? iso < minDateIso : false;
          const isDisabled = isFuture || isPast;

          // Use aria-disabled (not the HTML `disabled` attribute) so pointer
          // events still fire — Radix Tooltip can't attach to a disabled
          // button. handleDayClick is already an early-return on out-of-range.
          const dayButton = (
            <button
              type="button"
              onClick={() => handleDayClick(day)}
              aria-disabled={isDisabled || undefined}
              className={cn(
                `w-full aspect-square flex items-center justify-center ${textSize} rounded transition-colors`,
                daySelected
                  ? "bg-primary text-white font-semibold"
                  : inRange
                    ? "bg-primary/10 text-gray-900"
                    : "text-gray-700 hover:bg-gray-100",
                isDisabled && "text-gray-300 bg-transparent cursor-not-allowed hover:bg-transparent",
              )}
            >
              {day}
            </button>
          );

          if (!isDisabled) {
            return <div key={day}>{dayButton}</div>;
          }

          return (
            <Tooltip key={day}>
              <TooltipTrigger asChild>{dayButton}</TooltipTrigger>
              <TooltipContent side="top">
                {isFuture ? futureTooltipText : pastTooltipText}
              </TooltipContent>
            </Tooltip>
          );
        })}
        {Array.from({ length: trailingDays }, (_, i) => (
          <span
            key={`trail-${i}`}
            className={`w-full aspect-square flex items-center justify-center ${textSize} text-gray-300`}
          >
            {i + 1}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => {
          if (isMobile) setMobileOpen(true);
          else if (open) setOpen(false);
          else {
            updateDropdownPos();
            setOpen(true);
          }
        }}
        className={cn(
          "flex items-center gap-1.5 min-h-11 lg:min-h-8 h-8 px-3 text-base lg:text-xs rounded-lg border border-gray-300 bg-white transition-colors hover:bg-gray-50",
          hasRange ? "text-gray-900" : "text-gray-500",
          (open || mobileOpen) && "ring-2 ring-primary/20 border-primary",
        )}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown className={cn("w-3 h-3 shrink-0 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>

      {isMobile ? (
        <BottomSheet isOpen={mobileOpen} onClose={() => setMobileOpen(false)} title={single ? "Select date" : "Date Range"} zIndex={50}>
          {/* Preset pills — horizontal wrap */}
          {!presetsHidden && (
          <div className="flex flex-wrap gap-2 mb-4">
            {presets.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => handlePresetClick(p.key)}
                className={cn(
                  "min-h-11 px-4 text-sm font-medium rounded-lg transition-colors",
                  effectivePreset === p.key
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-gray-600 border border-gray-200 hover:bg-gray-50",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          )}

          {/* From / To indicators */}
          {!single && (
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setSelecting("from")}
              className={cn(
                "flex-1 text-sm px-3 py-2 rounded-lg border text-center",
                selecting === "from" ? "border-primary bg-primary/5 text-gray-900" : "border-gray-200 text-gray-500",
              )}
            >
              <span className="block text-xs text-gray-400 mb-0.5">From</span>
              {fmtDisplay(fromValue) || "—"}
            </button>
            <button
              type="button"
              onClick={() => setSelecting("to")}
              className={cn(
                "flex-1 text-sm px-3 py-2 rounded-lg border text-center",
                selecting === "to" ? "border-primary bg-primary/5 text-gray-900" : "border-gray-200 text-gray-500",
              )}
            >
              <span className="block text-xs text-gray-400 mb-0.5">To</span>
              {fmtDisplay(toValue) || "—"}
            </button>
          </div>
          )}

          {/* Month nav */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={prevMonth}
              disabled={isAtMinMonth}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded text-base",
                isAtMinMonth ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-100 text-gray-500",
              )}
            >
              &lsaquo;
            </button>
            <span className="text-sm font-semibold text-gray-800">{monthLabel}</span>
            <button
              type="button"
              onClick={nextMonth}
              disabled={isAtCurrentMonth}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded text-base",
                isAtCurrentMonth ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-100 text-gray-500",
              )}
            >
              &rsaquo;
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <span key={d} className="text-xs text-gray-400 text-center font-medium">
                {d}
              </span>
            ))}
          </div>

          {renderDayGrid("text-sm")}

          {/* Done button */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Button
                variant="outline-destructive"
                size="sm"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => clearDateRange(e)}
              >
                Clear
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setMobileOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </BottomSheet>
      ) : (
        open && createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-50 rounded-xl border border-gray-200 bg-white shadow-lg flex overflow-hidden"
            style={{ top: dropdownPos.top, left: dropdownPos.left }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Preset sidebar */}
            {!presetsHidden && (
            <div className="flex flex-col py-2 pr-0 border-r border-gray-200 min-w-[100px]">
              {presets.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handlePresetClick(p.key)}
                  className={cn(
                    "text-left px-4 py-1.5 text-xs transition-colors",
                    effectivePreset === p.key
                      ? "text-primary font-semibold bg-primary/5 border-l-2 border-primary"
                      : "text-gray-600 hover:bg-gray-50 border-l-2 border-transparent",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            )}

            {/* Calendar side */}
            <div className="p-3 flex flex-col" style={{ width: 280 }}>
              {/* From / To indicators */}
              {!single && (
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setSelecting("from")}
                  className={cn(
                    "flex-1 text-xs px-2 py-1.5 rounded-lg border text-center",
                    selecting === "from"
                      ? "border-primary bg-primary/5 text-gray-900"
                      : "border-gray-200 text-gray-500",
                  )}
                >
                  <span className="block text-xs text-gray-400 mb-0.5">From</span>
                  {fmtDisplay(fromValue) || "—"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelecting("to")}
                  className={cn(
                    "flex-1 text-xs px-2 py-1.5 rounded-lg border text-center",
                    selecting === "to" ? "border-primary bg-primary/5 text-gray-900" : "border-gray-200 text-gray-500",
                  )}
                >
                  <span className="block text-xs text-gray-400 mb-0.5">To</span>
                  {fmtDisplay(toValue) || "—"}
                </button>
              </div>
              )}

              {/* Month nav */}
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={prevMonth}
                  disabled={isAtMinMonth}
                  className={cn(
                    "w-6 h-6 flex items-center justify-center rounded text-sm",
                    isAtMinMonth ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-100 text-gray-500",
                  )}
                >
                  &lsaquo;
                </button>
                <span className="text-xs font-semibold text-gray-800">{monthLabel}</span>
                <button
                  type="button"
                  onClick={nextMonth}
                  disabled={isAtCurrentMonth}
                  className={cn(
                    "w-6 h-6 flex items-center justify-center rounded text-sm",
                    isAtCurrentMonth ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-100 text-gray-500",
                  )}
                >
                  &rsaquo;
                </button>
              </div>

              {/* Day headers — Sun first */}
              <div className="grid grid-cols-7 mb-1">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <span key={d} className="text-xs text-gray-400 text-center font-medium">
                    {d}
                  </span>
                ))}
              </div>

              {renderDayGrid("text-xs")}

              {/* Done button */}
              <div className="flex justify-end mt-3 pt-2 border-t border-gray-100">
                <Button
                  variant="outline-destructive"
                  size="sm"
                  className="mr-2"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => clearDateRange(e)}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => setOpen(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )
      )}
    </div>
  );
}

// ─── MobileFilterTrigger ─────────────────────────────────────────────────

interface MobileFilterTriggerProps {
  activeCount: number;
  onOpen: () => void;
  className?: string;
}

/**
 * "Filter (N)" button shown on mobile to open the split-view MobileFilterSheet.
 */
export function MobileFilterTrigger({ activeCount, onOpen, className }: MobileFilterTriggerProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "inline-flex items-center gap-1.5 min-h-11 px-3 text-sm font-medium rounded-lg border transition-colors active:scale-[0.97]",
        activeCount > 0
          ? "border-primary/30 bg-primary/5 text-primary"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
        className,
      )}
    >
      <SlidersHorizontal className="w-4 h-4" />
      <span>Filter{activeCount > 0 ? ` (${activeCount})` : ""}</span>
    </button>
  );
}

// ─── FilterClear ────────────────────────────────────────────────────────

interface FilterClearProps {
  onClear: () => void;
  className?: string;
}

/**
 * "Clear filters" button. Rendered by the page when any filter is active.
 */
export function FilterClear({ onClear, className }: FilterClearProps) {
  return (
    <Button
      variant="outline-destructive"
      size="sm"
      onClick={onClear}
      className={className}
    >
      <X className="w-3 h-3 mr-1" />
      Clear filters
    </Button>
  );
}
