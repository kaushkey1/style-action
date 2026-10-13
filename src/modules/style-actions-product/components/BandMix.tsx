import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

import { BAND_FILTERS, BAND_LABEL, BAND_MEANING, BAND_TONE, formatPercent, formatUnits } from './display';
import { bandMix, flagBreakdown } from './scope';

import type { BandCounts, BandFilter, SpaceCounts } from '../api/types';

const PERCENT = 100;

interface BandMixBarProps {
  readonly counts: BandCounts;
  /** Bands filtering the worklist; with onBand, each segment is a filter button (band-seg-*). */
  readonly active?: readonly BandFilter[];
  readonly onBand?: (band: BandFilter) => void;
  /** Test id prefix for the counts: `band-mix` in the store strip, `dc-band` in the Distribution Centre totals. */
  readonly countPrefix: string;
}

/** Options by health band: one bar of shares and a legend of counts, each count a filter when onBand is given (S2-R11). */
export function BandMixBar({ counts, active = [], onBand, countPrefix }: BandMixBarProps): React.ReactNode {
  const mix = bandMix(counts, BAND_FILTERS);
  const total = mix.reduce((sum, entry) => sum + entry.count, 0);
  if (!total) return <p className="text-xs text-gray-500">No options with a band in this snapshot.</p>;
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="text-xs text-gray-500">Health band of {formatUnits(total)} options</p>
      <div className="flex h-2.5 gap-px overflow-hidden rounded-full bg-gray-100" aria-hidden>
        {mix.map((entry) => (
          // eslint-disable-next-line no-restricted-syntax -- segment width is this band's share of the options
          <span key={entry.band} className={cn('first:rounded-l-full last:rounded-r-full', BAND_TONE[entry.band])} style={{ width: `${(entry.count / total) * PERCENT}%` }} />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-1 gap-y-0.5" aria-label={onBand ? 'Filter the worklist by health band' : 'Options by health band'}>
        {mix.map((entry) => {
          const content = (
            <>
              <span aria-hidden className={cn('size-2 rounded-full', BAND_TONE[entry.band])} />
              {BAND_LABEL[entry.band]}
              <span data-testid={`${countPrefix}-${entry.band}`} className="font-medium tabular-nums text-gray-900">{formatUnits(entry.count)}</span>
            </>
          );
          if (!onBand) {
            return (
              <li key={entry.band} className="inline-flex items-center gap-1 px-1.5 text-xs text-gray-600" title={BAND_MEANING[entry.band]}>
                {content}
              </li>
            );
          }
          const isActive = active.includes(entry.band);
          return (
            <li key={entry.band}>
              <Button
                variant="ghost"
                size="sm"
                data-testid={`band-seg-${entry.band}`}
                aria-pressed={isActive}
                title={BAND_MEANING[entry.band]}
                onClick={() => onBand(entry.band)}
                className={cn('h-auto min-h-11 gap-1 px-1.5 py-0.5 text-xs font-normal text-gray-600 md:min-h-0', isActive && 'bg-gray-100 text-gray-900')}
              >
                {content}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface SpaceLineProps {
  readonly space: SpaceCounts;
  /** Test id of the flagged count: `store-space-flagged` or `dc-space-flagged`. */
  readonly flaggedTestid: string;
}

/** One line of space: flagged groups (below floor or overfilled), in band, no plan, and the fills of the planned groups (S2-R15). */
export function SpaceLine({ space, flaggedTestid }: SpaceLineProps): React.ReactNode {
  return (
    <p className="text-xs text-gray-600">
      Space: <span data-testid={flaggedTestid} className="font-semibold tabular-nums text-gray-900">{formatUnits(space.flagged)}</span> of{' '}
      {formatUnits(space.planned_groups)} planned groups flagged ({flagBreakdown(space)}) · {formatUnits(space.in_band)} within plan ·{' '}
      {formatUnits(space.no_plan)} without a plan · options fill {formatPercent(space.options_fill)} · units fill {formatPercent(space.units_fill)}
    </p>
  );
}
