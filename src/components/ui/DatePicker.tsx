import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { BottomSheet } from './BottomSheet';

/**
 * DatePicker — single-date sibling of `FilterDateRange`. Same calendar surface,
 * but selects one date. Desktop: portaled popover (flips above when near the
 * viewport bottom). Mobile: BottomSheet. Returns/accepts ISO `YYYY-MM-DD`.
 */
interface DatePickerProps {
  /** Selected date as ISO `YYYY-MM-DD`, or '' when empty. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Heading for the mobile picker sheet (e.g. the field's label). Defaults to "Select date". */
  label?: string;
  className?: string;
  id?: string;
  /** Trigger height — matches the Select sizes. Defaults to `md` (h-10). */
  size?: 'sm' | 'md' | 'lg';
  /** Earliest selectable ISO date (inclusive). */
  minDate?: string;
  /** Latest selectable ISO date (inclusive). */
  maxDate?: string;
  disabled?: boolean;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
function fmtDisplay(v: string): string {
  if (!v) return '';
  const [y, m, d] = v.split('-');
  return `${d}/${m}/${y}`;
}

const TRIGGER_SIZE: Record<NonNullable<DatePickerProps['size']>, string> = {
  sm: 'min-h-9 lg:h-8 px-2 text-base lg:text-xs',
  md: 'h-10 px-3 text-base lg:text-sm',
  lg: 'h-12 px-4 text-base',
};

export function DatePicker({
  value, onChange, placeholder = 'Select date', label, className, id, size = 'md',
  minDate, maxDate, disabled,
}: DatePickerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; placement: 'top' | 'bottom' }>({ top: 0, left: 0, placement: 'bottom' });

  const initial = value ? new Date(`${value}T00:00:00`) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const updatePos = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const GAP = 6;
    const MARGIN = 8;
    // Measure the live popover when available; fall back to known dimensions
    // (w-72 = 288px) before the first measurement so the very first frame is
    // already close to its final spot.
    const popH = popRef.current?.offsetHeight ?? 360;
    const popW = popRef.current?.offsetWidth ?? 288;
    const below = window.innerHeight - r.bottom;
    const placement: 'top' | 'bottom' = below < popH + GAP && r.top > below ? 'top' : 'bottom';
    // Anchor numerically (no positioning transform) so the entrance animation's
    // own transform can't clobber placement — matches the DS dropdown overlays.
    const top = placement === 'bottom' ? r.bottom + GAP : r.top - GAP - popH;
    const maxLeft = window.innerWidth - popW - MARGIN;
    const left = Math.max(MARGIN, Math.min(r.left, maxLeft));
    setPos({ left, top, placement });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePos();
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [open]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const pick = (day: number) => {
    onChange(iso(viewYear, viewMonth, day));
    setOpen(false);
    setMobileOpen(false);
  };

  const monthLabel = new Date(viewYear, viewMonth).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const startOffset = new Date(viewYear, viewMonth, 1).getDay();
  const count = daysInMonth(viewYear, viewMonth);

  const calendar = (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={prevMonth} aria-label="Previous month" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-gray-900">{monthLabel}</span>
        <button type="button" onClick={nextMonth} aria-label="Next month" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7">
        {WEEKDAYS.map((w) => (
          <span key={w} className="flex h-7 items-center justify-center text-[11px] font-medium text-gray-400">{w}</span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: startOffset }).map((_, i) => <span key={`b-${i}`} />)}
        {Array.from({ length: count }, (_, i) => i + 1).map((day) => {
          const d = iso(viewYear, viewMonth, day);
          const selected = d === value;
          const isDisabled = (minDate ? d < minDate : false) || (maxDate ? d > maxDate : false);
          return (
            <button
              key={day}
              type="button"
              onClick={() => !isDisabled && pick(day)}
              aria-disabled={isDisabled || undefined}
              aria-pressed={selected}
              className={cn(
                'flex aspect-square w-full items-center justify-center rounded text-sm transition-colors',
                selected ? 'bg-primary font-semibold text-white' : 'text-gray-700 hover:bg-gray-100',
                isDisabled && 'cursor-not-allowed bg-transparent text-gray-300 hover:bg-transparent',
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => (isMobile ? setMobileOpen(true) : setOpen((o) => !o))}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white transition-colors',
          'focus:outline-none focus-kb:ring-2 focus-kb:ring-primary/20 focus-visible:border-primary',
          'disabled:cursor-not-allowed disabled:bg-gray-50',
          (open || mobileOpen) && 'ring-2 ring-primary/20 border-primary',
          TRIGGER_SIZE[size],
          className,
        )}
        aria-haspopup="dialog"
        aria-expanded={open || mobileOpen}
      >
        <span className={cn('tabular-nums', value ? 'text-gray-900' : 'text-gray-500')}>
          {value ? fmtDisplay(value) : placeholder}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 text-gray-400" />
      </button>

      {isMobile ? (
        <BottomSheet isOpen={mobileOpen} onClose={() => setMobileOpen(false)} title={label ?? 'Select date'} zIndex={60}>
          {calendar}
        </BottomSheet>
      ) : (
        open && createPortal(
          <div
            ref={popRef}
             
            style={{ position: 'fixed', top: pos.top, left: pos.left }}
            className={cn(
              'z-50 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg',
              'animate-in fade-in-0 zoom-in-95',
              pos.placement === 'top' ? 'origin-bottom' : 'origin-top',
            )}
          >
            {calendar}
          </div>,
          document.body,
        )
      )}
    </>
  );
}

export default DatePicker;
