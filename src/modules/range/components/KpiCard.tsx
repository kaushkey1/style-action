/* eslint-disable design-system/prefer-section-header -- KpiCard is the metric primitive itself */
import { cn } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import { type Status } from '../data/types/rangeArchitecture';

interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  status?: Status;
  target?: string;
  from?: string;
  progressValue?: number;
  footnote?: string;
  subFootnote?: string;
  className?: string;
}

export function KpiCard({
  label,
  value,
  unit,
  status,
  target,
  from,
  progressValue,
  footnote,
  subFootnote,
  className
}: KpiCardProps) {
  // Determine progress bar color
  const getProgressColor = () => {
    if (!progressValue) return 'bg-gray-200';
    if (progressValue >= 80) return 'bg-green-500';
    if (progressValue >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getFootnoteColor = () => {
    if (!progressValue) return 'text-gray-500';
    if (progressValue >= 80) return 'text-green-700';
    if (progressValue >= 50) return 'text-amber-700';
    return 'text-red-700';
  };

  return (
    <div className={cn(
      "bg-white border border-gray-200 rounded-lg px-5 py-4 flex flex-col gap-2",
      className
    )}>
      {/* Row 1: Label and Status */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        {status && <StatusBadge status={status} />}
      </div>

      {/* Row 2: Value and Unit */}
      <div className="flex items-baseline">
        <span className="text-2xl font-bold text-gray-900 tracking-tight">{value}</span>
        {unit && <span className="text-sm text-gray-400 ml-1.5">{unit}</span>}
      </div>

      {/* Row 3: Target and From */}
      {(target || from) && (
        <div className="text-xs text-gray-500">
          {target && <div>{target}</div>}
          {from && <div>{from}</div>}
        </div>
      )}

      {/* Row 4: Progress Bar */}
      {progressValue !== undefined && (
        <div
          className="w-full h-[3px] bg-gray-200 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={progressValue}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn("h-full rounded-full transition-all", getProgressColor())}
            // eslint-disable-next-line no-restricted-syntax -- Dynamic width needed for progress bar
            style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
          />
        </div>
      )}

      {/* Row 5: Footnote */}
      {footnote && (
        <div className={cn("text-xs font-medium", getFootnoteColor())}>
          {footnote}
        </div>
      )}

      {/* Row 6: Sub-footnote */}
      {subFootnote && (
        <div className="text-[10px] text-gray-400 mt-0.5">
          {subFootnote}
        </div>
      )}
    </div>
  );
}