import { useState, type ReactNode } from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  BottomSheet,
} from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

interface ChartCardOption {
  value: string;
  label: string;
}

interface ChartCardProps {
  /** Chart title */
  title: string;
  /** Muted description below title */
  description?: string;
  /** Tooltip text explaining the chart/metric — shown on ⓘ hover */
  infoTooltip?: string;
  /** Dropdown filter options — rendered in header right */
  filterOptions?: ChartCardOption[];
  /** Currently selected filter value */
  filterValue?: string;
  /** Called when filter changes */
  onFilterChange?: (value: string) => void;
  /** Optional second filter, rendered immediately to the right of the primary
   *  dropdown (or as a stacked BottomSheet trigger on mobile). Use when a
   *  chart needs both a metric toggle and an axis-style filter (e.g. category). */
  secondaryFilterOptions?: ChartCardOption[];
  secondaryFilterValue?: string;
  onSecondaryFilterChange?: (value: string) => void;
  /** Chart content */
  children: ReactNode;
  /** Additional class on outer card */
  className?: string;
  /** Optional header-right action (e.g. a drill menu). Rendered after any filters. */
  headerAction?: ReactNode;
}

export function ChartCard({
  title,
  description,
  infoTooltip,
  filterOptions,
  filterValue,
  onFilterChange,
  secondaryFilterOptions,
  secondaryFilterValue,
  onSecondaryFilterChange,
  children,
  className,
  headerAction,
}: ChartCardProps) {
  const isMobile = useIsMobile();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [secondarySheetOpen, setSecondarySheetOpen] = useState(false);

  const hasFilter = filterOptions && filterOptions.length > 0 && onFilterChange;
  const selectedLabel = filterOptions?.find((o) => o.value === filterValue)?.label;
  const hasSecondaryFilter = secondaryFilterOptions && secondaryFilterOptions.length > 0 && onSecondaryFilterChange;
  const selectedSecondaryLabel = secondaryFilterOptions?.find((o) => o.value === secondaryFilterValue)?.label;

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 overflow-hidden', className)}>
      {/* Header — title + info + dropdown */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            {infoTooltip && (
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors shrink-0" aria-label="Chart info">
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  {infoTooltip}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>

        {/* Filter row — primary + optional secondary. Both render as Selects
            on desktop and as BottomSheet triggers on mobile. */}
        {(hasFilter || hasSecondaryFilter || headerAction) && (
          <div className="flex items-center gap-2 shrink-0">
            {hasFilter && (
              isMobile ? (
                <>
                  <button
                    onClick={() => setFilterSheetOpen(true)}
                    className="flex items-center gap-1 h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 hover:bg-gray-50 transition-colors shrink-0"
                  >
                    {selectedLabel ?? 'Select'}
                    <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <BottomSheet isOpen={filterSheetOpen} onClose={() => setFilterSheetOpen(false)} title={title}>
                    <div className="space-y-1 pb-4">
                      {filterOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { onFilterChange(opt.value); setFilterSheetOpen(false); }}
                          className={cn(
                            'w-full flex items-center justify-between px-4 py-3 rounded-lg text-left text-sm min-h-12 transition-colors',
                            filterValue === opt.value ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700 hover:bg-gray-50',
                          )}
                        >
                          {opt.label}
                          {filterValue === opt.value && <span className="text-primary">✓</span>}
                        </button>
                      ))}
                    </div>
                  </BottomSheet>
                </>
              ) : (
                <Select value={filterValue} onValueChange={onFilterChange}>
                  <SelectTrigger size="sm" className="w-auto min-w-[100px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {filterOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            )}
            {hasSecondaryFilter && (
              isMobile ? (
                <>
                  <button
                    onClick={() => setSecondarySheetOpen(true)}
                    className="flex items-center gap-1 h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 hover:bg-gray-50 transition-colors shrink-0"
                  >
                    {selectedSecondaryLabel ?? 'Select'}
                    <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <BottomSheet isOpen={secondarySheetOpen} onClose={() => setSecondarySheetOpen(false)} title={title}>
                    <div className="space-y-1 pb-4">
                      {secondaryFilterOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { onSecondaryFilterChange(opt.value); setSecondarySheetOpen(false); }}
                          className={cn(
                            'w-full flex items-center justify-between px-4 py-3 rounded-lg text-left text-sm min-h-12 transition-colors',
                            secondaryFilterValue === opt.value ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700 hover:bg-gray-50',
                          )}
                        >
                          {opt.label}
                          {secondaryFilterValue === opt.value && <span className="text-primary">✓</span>}
                        </button>
                      ))}
                    </div>
                  </BottomSheet>
                </>
              ) : (
                <Select value={secondaryFilterValue} onValueChange={onSecondaryFilterChange}>
                  <SelectTrigger size="sm" className="w-auto min-w-[100px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {secondaryFilterOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            )}
            {headerAction}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100" />

      {/* Chart content */}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
