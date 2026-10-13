/* Month picker for the AOP converged page. Mirrors the FilterDateRange date-picker
   look: 32px trigger + portaled popover on desktop, BottomSheet on mobile. */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, BottomSheet } from "@/components/ui";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface MonthPickerProps {
  /** Selected month as "YYYY-MM". */
  value: string;
  onChange: (value: string) => void;
  /** Latest selectable month "YYYY-MM" (inclusive); later months are disabled. */
  maxMonth?: string;
  /** Earliest selectable month "YYYY-MM" (inclusive); earlier months are disabled. */
  minMonth?: string;
  className?: string;
}

const pad2 = (n: number): string => String(n).padStart(2, "0");

export function MonthPicker({ value, onChange, maxMonth, minMonth, className }: MonthPickerProps): ReactNode {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const selYear = value ? Number(value.slice(0, 4)) : 0;
  const selMonth = value ? Number(value.slice(5, 7)) : 0; // 1-12
  const [viewYear, setViewYear] = useState(selYear || new Date().getFullYear());

  const maxYear = maxMonth ? Number(maxMonth.slice(0, 4)) : null;
  const maxMon = maxMonth ? Number(maxMonth.slice(5, 7)) : null; // 1-12
  const minYear = minMonth ? Number(minMonth.slice(0, 4)) : null;
  const minMon = minMonth ? Number(minMonth.slice(5, 7)) : null; // 1-12

  const triggerLabel = selYear && selMonth ? `${MONTH_FULL[selMonth - 1]} ${selYear}` : "Select month";

  // Same "data not available" copy as the daily date picker (FilterDateRange).
  const disabledTooltip = minMonth
    ? `Data not available before 01/${minMonth.slice(5, 7)}/${minMonth.slice(0, 4)}.`
    : null;

  // Right-align to the trigger when a left-aligned popover would overflow (desktop only).
  const updatePos = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const estWidth = 248;
    const fits = rect.left + estWidth <= window.innerWidth - 8;
    const left = fits ? rect.left : Math.max(8, rect.right - estWidth);
    setPos({ top: rect.bottom + 4, left });
  }, []);

  // Desktop popover only: outside-click / scroll / resize / escape handling.
  // On mobile the BottomSheet manages its own dismissal.
  useEffect(() => {
    if (!open || isMobile) return;
    const onDown = (e: PointerEvent): void => {
      const t = e.target as Node;
      if (ref.current && !ref.current.contains(t) && (!dropdownRef.current || !dropdownRef.current.contains(t))) {
        setOpen(false);
      }
    };
    const onScroll = (e: Event): void => {
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", updatePos);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", updatePos);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, isMobile, updatePos]);

  const nextYearDisabled = maxYear != null && viewYear >= maxYear;
  const prevYearDisabled = minYear != null && viewYear <= minYear;

  const isMonthDisabled = (m: number): boolean => {
    if (maxYear != null && maxMon != null && (viewYear > maxYear || (viewYear === maxYear && m > maxMon))) return true;
    if (minYear != null && minMon != null && (viewYear < minYear || (viewYear === minYear && m < minMon))) return true;
    return false;
  };

  const handlePick = (m: number): void => {
    if (isMonthDisabled(m)) return;
    onChange(`${viewYear}-${pad2(m)}`);
    setOpen(false);
  };

  // Shared content — year nav + 3×4 month grid. Month buttons get 44px targets on mobile.
  const gridContent = (
    <>
      {/* eslint-disable-next-line design-system/prefer-section-header -- month picker year navigation, not a section header */}
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous year"
          onClick={() => setViewYear((y) => y - 1)}
          disabled={prevYearDisabled}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded text-sm lg:h-6 lg:w-6",
            prevYearDisabled ? "cursor-not-allowed text-gray-400" : "text-gray-500 hover:bg-gray-100",
          )}
        >
          &lsaquo;
        </button>
        <span className="text-sm font-semibold text-gray-800 lg:text-xs">{viewYear}</span>
        <button
          type="button"
          aria-label="Next year"
          onClick={() => setViewYear((y) => y + 1)}
          disabled={nextYearDisabled}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded text-sm lg:h-6 lg:w-6",
            nextYearDisabled ? "cursor-not-allowed text-gray-400" : "text-gray-500 hover:bg-gray-100",
          )}
        >
          &rsaquo;
        </button>
      </div>
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- month picker calendar grid, not metric cards */}
      <div className="grid grid-cols-3 gap-1.5 lg:gap-1">
        {MONTH_SHORT.map((lbl, i) => {
          const m = i + 1;
          const selected = viewYear === selYear && m === selMonth;
          const disabled = isMonthDisabled(m);
          // aria-disabled (not `disabled`) keeps pointer events alive so the Tooltip can attach.
          const monthButton = (
            <button
              type="button"
              onClick={() => handlePick(m)}
              aria-disabled={disabled || undefined}
              className={cn(
                "min-h-11 w-full rounded py-2 text-sm font-medium transition-colors lg:min-h-0 lg:text-xs",
                selected
                  ? "bg-primary text-white"
                  : disabled
                    ? "cursor-not-allowed text-gray-400"
                    : "text-gray-700 hover:bg-gray-100",
              )}
            >
              {lbl}
            </button>
          );
          if (!disabled || !disabledTooltip) return <div key={lbl}>{monthButton}</div>;
          return (
            <Tooltip key={lbl}>
              <TooltipTrigger asChild>{monthButton}</TooltipTrigger>
              <TooltipContent side="top">{disabledTooltip}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </>
  );

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-label="Month"
        onClick={() => {
          if (!open && !isMobile) updatePos();
          setOpen((o) => !o);
        }}
        className={cn(
          "flex w-36 items-center justify-between gap-1.5 min-h-11 lg:min-h-8 h-8 px-3 text-base lg:text-xs rounded-lg border border-gray-300 bg-white transition-colors hover:bg-gray-50",
          value ? "text-gray-900" : "text-gray-500",
          open && "ring-2 ring-primary/20 border-primary",
        )}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown className={cn("h-3 w-3 shrink-0 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>

      {/* Desktop: portaled popover */}
      {open && !isMobile && createPortal(
        // eslint-disable-next-line no-restricted-syntax -- dynamic popover position computed from getBoundingClientRect
        <div ref={dropdownRef} style={{ top: pos.top, left: pos.left }} onPointerDown={(e) => e.stopPropagation()} className="fixed z-50 w-[248px] rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          {gridContent}
        </div>,
        document.body,
      )}

      {/* Mobile: bottom sheet */}
      <BottomSheet isOpen={open && isMobile} onClose={() => setOpen(false)} title="Select month">
        <div className="px-1 pb-2">{gridContent}</div>
      </BottomSheet>
    </div>
  );
}
