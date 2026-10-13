import { cn } from '@/lib/utils';

import { COHORT_LABEL, COHORT_SHORT, COHORT_TONE, COHORTS, formatUnits } from './display';
import { Delta } from './Delta';

import type { Cohort, Comparison } from '../api/types';

const PERCENT = 100;


interface CohortBarProps {
  /** Options per lifecycle stage (StoreSummary.cohorts or DcTotals.cohorts). */
  readonly cohorts: Partial<Record<Cohort, number>>;
  /** Per-stage change vs the comparison snapshot; omit to show counts only. */
  readonly deltas?: Readonly<Record<string, number>> | null;
  readonly comparison?: Comparison | null;
  readonly className?: string;
}

/** A read-only lifecycle mix: one bar of stage shares and a legend of counts, with each stage's delta when given. */
export function CohortBar({ cohorts, deltas, comparison, className }: CohortBarProps): React.ReactNode {
  const stages = COHORTS.map((cohort) => ({ cohort, options: cohorts[cohort] ?? 0 })).filter((item) => item.options > 0);
  const total = stages.reduce((sum, item) => sum + item.options, 0);
  if (!total) return <p className={cn('text-xs text-gray-500', className)}>No options in this snapshot.</p>;
  return (
    <div className={cn('min-w-0 space-y-1.5', className)}>
      <div className="flex h-2.5 gap-px overflow-hidden rounded-full bg-gray-100" aria-hidden>
        {stages.map((item) => (
          // eslint-disable-next-line no-restricted-syntax -- segment width is this stage's share of the options
          <span key={item.cohort} className={cn('first:rounded-l-full last:rounded-r-full', COHORT_TONE[item.cohort])} style={{ width: `${(item.options / total) * PERCENT}%` }} />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-600" aria-label="Options by lifecycle stage">
        {stages.map((item) => (
          <li key={item.cohort} className="inline-flex items-center gap-1" title={COHORT_LABEL[item.cohort]}>
            <span aria-hidden className={cn('size-2 rounded-full', COHORT_TONE[item.cohort])} />
            {COHORT_SHORT[item.cohort]}
            <span className="font-medium tabular-nums text-gray-900">{formatUnits(item.options)}</span>
            {comparison !== undefined ? <Delta value={deltas ? (deltas[item.cohort] ?? 0) : null} comparison={comparison ?? null} /> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
