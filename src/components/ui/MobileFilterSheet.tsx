import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { BottomSheet } from './BottomSheet';
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip';

// ─── Types ──────────────────────────────────────────────────────────────

export type FilterDef =
  | { type: 'select'; key: string; label: string; options: { value: string; label: string }[] }
  | { type: 'multiselect'; key: string; label: string; options: { value: string; label: string }[]; searchable?: boolean }
  | {
      type: 'daterange';
      key: string;
      label: string;
      presets?: { key: string; label: string }[];
      /** Latest selectable ISO date (inclusive). Defaults to today when allowFutureDates is false. */
      maxDate?: string;
      /** Earliest selectable ISO date (inclusive). */
      minDate?: string;
      /** When true, future dates are selectable. Defaults to false. */
      allowFutureDates?: boolean;
      /** Tooltip copy for days beyond maxDate. Defaults to the T-2 data-freshness message. */
      disabledFutureTooltip?: string;
      /** Tooltip copy for days before minDate. */
      disabledPastTooltip?: string;
    };

export interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterDef[];
  /** Current values keyed by filter key. multiselect = CSV string, daterange = 'from|to' */
  values: Record<string, string>;
  onApply: (values: Record<string, string>) => void;
  onClear: () => void;
}

// ─── Date helpers (reused from FilterBar) ───────────────────────────────

function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function fmtDate(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function fmtDisplay(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
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

type Preset = 'custom' | 'today' | 'yesterday' | 'wtd' | 'mtd' | 'qtd' | 'ytd';

const defaultPresets: { key: Preset; label: string }[] = [
  { key: 'custom', label: 'Custom' },
  { key: 'wtd', label: 'WTD' },
  { key: 'mtd', label: 'MTD' },
  { key: 'qtd', label: 'QTD' },
  { key: 'ytd', label: 'YTD' },
];

function getPresetRange(key: Preset, today: Date): [Date, Date] | null {
  switch (key) {
    case 'today': return [today, today];
    case 'yesterday': { const y = new Date(today); y.setDate(y.getDate() - 1); return [y, y]; }
    case 'wtd': return [getSunday(today), today];
    case 'mtd': return [new Date(today.getFullYear(), today.getMonth(), 1), today];
    case 'qtd': return [getQuarterStart(today), today];
    case 'ytd': return [new Date(today.getFullYear(), 0, 1), today];
    default: return null;
  }
}

// ─── Scroll lock ────────────────────────────────────────────────────────

let scrollLockCount = 0;

// ─── Component ──────────────────────────────────────────────────────────

export function MobileFilterSheet({
  isOpen,
  onClose,
  filters,
  values,
  onApply,
  onClear,
}: MobileFilterSheetProps) {
  // Draft state — buffer changes until Apply
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [activeIdx, setActiveIdx] = useState(0);
  const [search, setSearch] = useState('');

  // Sync draft from values when opening
  useEffect(() => {
    if (isOpen) {
      setDraft({ ...values });
      setActiveIdx(0);
      setSearch('');
    }
  }, [isOpen, values]);

  // Scroll lock + Escape
  const handleEscape = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      scrollLockCount++;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      if (isOpen) {
        scrollLockCount--;
        if (scrollLockCount === 0) document.body.style.overflow = '';
      }
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleEscape]);

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const handleClear = () => {
    onClear();
    onClose();
  };

  const setDraftValue = (key: string, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  // Clear just one filter's draft (daterange → '|', otherwise → 'all').
  const clearActiveFilter = (filter: FilterDef) => {
    setDraftValue(filter.key, filter.type === 'daterange' ? '|' : 'all');
  };

  const activeFilter = filters[activeIdx];

  // Count active selections per filter for left panel badges
  function getActiveCount(filter: FilterDef): number {
    const val = draft[filter.key];
    if (!val) return 0;
    if (filter.type === 'daterange') {
      const [from, to] = val.split('|');
      return (from || to) ? 1 : 0;
    }
    if (filter.type === 'multiselect') {
      return val && val !== 'all' ? val.split(',').length : 0;
    }
    if (filter.type === 'select') {
      return val && val !== 'all' ? 1 : 0;
    }
    return 0;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Filters">
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
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl overflow-hidden flex flex-col"
            style={{ height: '85vh' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.velocity.y > 500 || info.offset.y > 80) onClose();
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none shrink-0">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 shrink-0">
              <h2 className="text-base font-semibold text-gray-900">Filter</h2>
              <button
                onClick={onClose}
                className="min-w-10 min-h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split view */}
            <div className="flex flex-1 min-h-0 border-t border-gray-100">
              {/* Left panel — categories */}
              <div className="w-[35%] border-r border-gray-100 overflow-y-auto bg-gray-50/50">
                {filters.map((filter, idx) => {
                  const isActive = idx === activeIdx;
                  const count = getActiveCount(filter);
                  return (
                    <button
                      key={filter.key}
                      onClick={() => { setActiveIdx(idx); setSearch(''); }}
                      className={cn(
                        'flex items-start gap-1 w-full px-3 py-3 text-left text-sm transition-colors border-l-[3px]',
                        isActive
                          ? 'border-l-primary bg-white font-semibold text-gray-900'
                          : 'border-l-transparent text-gray-600 hover:bg-gray-50',
                      )}
                    >
                      <span className="flex-1 leading-snug">
                        {filter.label}
                        {count > 0 && (
                          <span className="ml-1 text-xs text-primary font-medium">({count})</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right panel — values */}
              <div className="w-[65%] overflow-y-auto">
                {activeFilter && (
                  <div className="p-3">
                    <div className="mb-3 flex min-h-11 items-center justify-between gap-2">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                        {activeFilter.label}
                      </p>
                      {getActiveCount(activeFilter) > 0 && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => clearActiveFilter(activeFilter)}
                          className="h-auto min-h-11 p-0 text-xs font-medium text-error hover:text-error-600"
                        >
                          Clear
                        </Button>
                      )}
                    </div>

                    {activeFilter.type === 'select' && (
                      <SelectPanel
                        options={activeFilter.options}
                        value={draft[activeFilter.key] ?? 'all'}
                        onChange={(v) => setDraftValue(activeFilter.key, v)}
                      />
                    )}

                    {activeFilter.type === 'multiselect' && (
                      <MultiSelectPanel
                        options={activeFilter.options}
                        value={draft[activeFilter.key] ?? 'all'}
                        onChange={(v) => setDraftValue(activeFilter.key, v)}
                        search={search}
                        onSearchChange={setSearch}
                        searchable={activeFilter.searchable}
                      />
                    )}

                    {activeFilter.type === 'daterange' && (
                      <DateRangePanel
                        value={draft[activeFilter.key] ?? '|'}
                        onChange={(v) => setDraftValue(activeFilter.key, v)}
                        maxDate={activeFilter.maxDate}
                        minDate={activeFilter.minDate}
                        allowFutureDates={activeFilter.allowFutureDates}
                        disabledFutureTooltip={activeFilter.disabledFutureTooltip}
                        disabledPastTooltip={activeFilter.disabledPastTooltip}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer — 50/50 split per BottomSheet `actions` standard:
                secondary (Clear) left, primary (Apply) right, 12px gap,
                size=lg (48px) for proper mobile tap targets. */}
            <div className="grid grid-cols-2 gap-3 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] border-t border-gray-100 shrink-0">
              <Button
                variant="outline-destructive"
                size="lg"
                onClick={handleClear}
                className="w-full"
              >
                Clear All Filters
              </Button>
              <Button
                size="lg"
                onClick={handleApply}
                className="w-full"
              >
                Apply
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ─── Sub-panels ─────────────────────────────────────────────────────────

function SelectPanel({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <ul className="space-y-0.5">
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <li key={opt.value}>
            <button
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                'flex items-center justify-between w-full min-h-11 px-3 py-2.5 text-sm rounded-lg transition-colors',
                isActive ? 'bg-primary/5 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50',
              )}
            >
              <span>{opt.label}</span>
              {isActive && <Check className="w-4 h-4 text-primary shrink-0" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function MultiSelectPanel({
  options,
  value,
  onChange,
  search,
  onSearchChange,
  searchable = true,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  searchable?: boolean;
}) {
  const selected = value && value !== 'all' ? value.split(',') : [];
  const isAllSelected = options.length > 0 && selected.length === options.length;

  function toggle(val: string) {
    const next = selected.includes(val)
      ? selected.filter((v) => v !== val)
      : [...selected, val];
    onChange(next.length ? next.join(',') : 'all');
  }

  // Mirrors the desktop FilterMultiSelect "Select All": selects every option
  // (regardless of the current search filter), or clears back to "all" (no filter).
  function toggleSelectAll() {
    onChange(isAllSelected ? 'all' : options.map((o) => o.value).join(','));
  }

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <>
      {/* Search — rendered unless the filter opts out with searchable={false} */}
      {searchable && (
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search..."
            className="w-full min-h-10 pl-10 pr-3 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Select All — mirrors the desktop FilterMultiSelect dropdown */}
      <button
        type="button"
        onClick={toggleSelectAll}
        className={cn(
          'flex items-center gap-3 w-full min-h-11 px-3 py-2.5 text-sm rounded-lg text-left transition-colors',
          isAllSelected ? 'bg-primary/5 text-gray-900' : 'text-gray-600 hover:bg-gray-50',
        )}
      >
        <span className={cn(
          'flex items-center justify-center w-5 h-5 rounded border shrink-0',
          isAllSelected ? 'bg-primary border-primary text-white' : 'border-gray-300',
        )}>
          {isAllSelected && <Check className="w-3.5 h-3.5" />}
        </span>
        <span className="font-medium">Select All</span>
      </button>
      <div className="my-1 border-t border-gray-100" />

      {/* Options */}
      <ul className="space-y-0.5">
        {filtered.length === 0 && (
          <li className="px-3 py-3 text-sm text-gray-400 text-center">No results</li>
        )}
        {filtered.map((opt) => {
          const isSelected = selected.includes(opt.value);
          return (
            <li key={opt.value}>
              <button
                type="button"
                onClick={() => toggle(opt.value)}
                className={cn(
                  'flex items-center gap-3 w-full min-h-11 px-3 py-2.5 text-sm rounded-lg text-left transition-colors',
                  isSelected ? 'bg-primary/5 text-gray-900' : 'text-gray-600 hover:bg-gray-50',
                )}
              >
                <span className={cn(
                  'flex items-center justify-center w-5 h-5 rounded border shrink-0',
                  isSelected ? 'bg-primary border-primary text-white' : 'border-gray-300',
                )}>
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </span>
                <span>{opt.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function DateRangePanel({
  value,
  onChange,
  maxDate,
  minDate,
  allowFutureDates = false,
  disabledFutureTooltip,
  disabledPastTooltip,
}: {
  value: string;
  onChange: (v: string) => void;
  maxDate?: string;
  minDate?: string;
  allowFutureDates?: boolean;
  disabledFutureTooltip?: string;
  disabledPastTooltip?: string;
}) {
  const parts = value.split('|');
  const fromValue = parts[0] ?? '';
  const toValue = parts[1] ?? '';
  const [selecting, setSelecting] = useState<'from' | 'to'>('from');
  const [activePreset, setActivePreset] = useState<Preset>('custom');
  const [calendarOpen, setCalendarOpen] = useState(false);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const effectivePreset: Preset = (!fromValue && !toValue) ? 'custom' : activePreset;

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const startOffset = firstDayOfWeek;

  const monthLabel = new Date(viewYear, viewMonth).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const todayIso = fmtDate(today);

  // Selectable bounds. Mirrors FilterDateRange: explicit maxDate wins, else
  // future dates are blocked (cap = today) unless allowFutureDates is set.
  function parseIso(s: string): Date | null {
    const p = s.split('-').map(Number);
    const y = p[0], m = p[1], d = p[2];
    return y && m && d ? new Date(y, m - 1, d) : null;
  }
  const resolvedMaxDate: Date | null = maxDate
    ? parseIso(maxDate)
    : allowFutureDates
      ? null
      : (() => { const c = new Date(); c.setHours(23, 59, 59, 999); return c; })();
  const maxDateIso: string | null = resolvedMaxDate ? fmtDate(resolvedMaxDate) : null;
  const resolvedMinDate: Date | null = minDate ? parseIso(minDate) : null;
  const minDateIso: string | null = resolvedMinDate ? fmtDate(resolvedMinDate) : null;

  const futureTooltipText =
    disabledFutureTooltip ??
    (maxDateIso
      ? `Data is available only up to ${fmtDisplay(maxDateIso)} (T-2 cycle). Today and yesterday haven't refreshed yet.`
      : "This date isn't available yet.");
  const pastTooltipText =
    disabledPastTooltip ??
    (minDateIso ? `Data not available before ${fmtDisplay(minDateIso)}.` : "This date isn't available.");

  function setFrom(v: string) { onChange(`${v}|${toValue ?? ''}`); }
  function setTo(v: string) { onChange(`${fromValue ?? ''}|${v}`); }

  function handleDayClick(day: number) {
    const iso = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
    if (maxDateIso && iso > maxDateIso) return;
    if (minDateIso && iso < minDateIso) return;
    setActivePreset('custom');
    if (selecting === 'from') {
      setFrom(iso);
      if (toValue && iso > toValue) setTo('');
      setSelecting('to');
    } else {
      if (fromValue && iso < fromValue) {
        setTo(fromValue);
        setFrom(iso);
      } else {
        setTo(iso);
      }
      setSelecting('from');
    }
  }

  function handlePresetClick(key: Preset) {
    setActivePreset(key);
    if (key === 'custom') {
      onChange('|');
      setSelecting('from');
      return;
    }
    const range = getPresetRange(key, resolvedMaxDate ?? today);
    if (range) {
      const from = resolvedMinDate && range[0] < resolvedMinDate ? resolvedMinDate : range[0];
      onChange(`${fmtDate(from)}|${fmtDate(range[1])}`);
      setSelecting('from');
    }
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  function isDayInRange(day: number): boolean {
    if (!fromValue || !toValue) return false;
    const iso = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
    return iso >= fromValue && iso <= toValue;
  }

  function isDaySelected(day: number): boolean {
    const iso = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
    return iso === fromValue || iso === toValue;
  }

  return (
    <>
      {/* Preset pills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {defaultPresets.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => handlePresetClick(p.key)}
            className={cn(
              'min-h-9 px-3 text-sm font-medium rounded-lg transition-colors',
              effectivePreset === p.key
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-gray-600 border border-gray-200 hover:bg-gray-50',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* From / To tappable cards */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => { setSelecting('from'); setCalendarOpen(true); }}
          className={cn(
            'flex-1 text-sm px-3 py-3 rounded-lg border text-center',
            selecting === 'from' ? 'border-primary bg-primary/5 text-gray-900' : 'border-gray-200 text-gray-500',
          )}
        >
          <span className="block text-xs text-gray-400 mb-0.5">From</span>
          <span className="font-semibold">{fmtDisplay(fromValue) || '\u2014'}</span>
          <span className="block text-xs text-primary mt-1">Tap to pick</span>
        </button>
        <button
          type="button"
          onClick={() => { setSelecting('to'); setCalendarOpen(true); }}
          className={cn(
            'flex-1 text-sm px-3 py-3 rounded-lg border text-center',
            selecting === 'to' ? 'border-primary bg-primary/5 text-gray-900' : 'border-gray-200 text-gray-500',
          )}
        >
          <span className="block text-xs text-gray-400 mb-0.5">To</span>
          <span className="font-semibold">{fmtDisplay(toValue) || '\u2014'}</span>
          <span className="block text-xs text-primary mt-1">Tap to pick</span>
        </button>
      </div>

      {/* Secondary BottomSheet with full-width calendar */}
      <BottomSheet isOpen={calendarOpen} onClose={() => setCalendarOpen(false)} title={`Select ${selecting === 'from' ? 'From' : 'To'} Date`} zIndex={50}>
        {/* Month nav */}
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={prevMonth} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 text-lg">&lsaquo;</button>
          <span className="text-sm font-semibold text-gray-800">{monthLabel}</span>
          <button type="button" onClick={nextMonth} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 text-lg">&rsaquo;</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <span key={d} className="text-xs text-gray-400 text-center font-medium py-2">{d}</span>
          ))}
        </div>

        {/* Day grid — full width, 44px+ cells */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startOffset }).map((_, i) => (
            <span key={`blank-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const daySelected = isDaySelected(day);
            const inRange = isDayInRange(day);
            const isoDay = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
            const isToday = isoDay === todayIso;
            const isFuture = maxDateIso ? isoDay > maxDateIso : false;
            const isPast = minDateIso ? isoDay < minDateIso : false;
            const isDisabled = isFuture || isPast;

            // aria-disabled (not the HTML `disabled` attr) so the tap still
            // fires the touch Tooltip; handleDayClick early-returns on range.
            const dayButton = (
              <button
                type="button"
                onClick={() => { if (isDisabled) return; handleDayClick(day); setCalendarOpen(false); }}
                aria-disabled={isDisabled || undefined}
                className={cn(
                  'w-full min-h-[44px] flex items-center justify-center text-sm font-medium rounded-lg transition-colors',
                  daySelected
                    ? 'bg-primary text-white font-semibold'
                    : inRange
                      ? 'bg-primary/10 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-100',
                  isToday && !daySelected && 'ring-1 ring-gray-300',
                  isDisabled && 'text-gray-300 bg-transparent cursor-not-allowed hover:bg-transparent',
                )}
              >
                {day}
              </button>
            );

            if (!isDisabled) return <div key={day}>{dayButton}</div>;
            return (
              <Tooltip key={day}>
                <TooltipTrigger asChild>{dayButton}</TooltipTrigger>
                <TooltipContent side="top">{isFuture ? futureTooltipText : pastTooltipText}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
}
