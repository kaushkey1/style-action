import { Button, Card, MetricGrid, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';

import { useLifecycle } from '../api/queries';
import { BandMixBar, SpaceLine } from './BandMix';
import { Delta } from './Delta';
import { COHORT_LABEL, COHORT_SHORT, COHORT_TONE, COHORTS, DC_LABEL, GRADE_CLASSES, formatUnits } from './display';
import { ProvenanceChip } from './ProvenanceChip';

import type { BandFilter, Cohort, Comparison, Lifecycle, StoreSummary } from '../api/types';
import type { Segment } from './display';

const PERCENT = 100;


interface CohortTotal {
  cohort: Cohort;
  options: number;
  grades: string;
}

function cohortTotals(lifecycle: Lifecycle): CohortTotal[] {
  return COHORTS.map((cohort) => {
    const rows = lifecycle.cohorts.filter((item) => item.cohort === cohort);
    const grades = GRADE_CLASSES.map((grade) => {
      const count = rows.find((row) => row.grade_class === grade)?.options;
      return count ? `${grade} ${formatUnits(count)}` : null;
    })
      .filter(Boolean)
      .join(' · ');
    return { cohort, options: rows.reduce((sum, item) => sum + item.options, 0), grades };
  }).filter((item) => item.options > 0);
}

interface LifecycleMixProps {
  readonly snapshotId: string;
  readonly storeCode: string;
  readonly segment: Segment;
  readonly onSegment: (segment: Segment) => void;
}

function LifecycleMix({ snapshotId, storeCode, segment, onSegment }: LifecycleMixProps): React.ReactNode {
  const lifecycle = useLifecycle(snapshotId, storeCode);
  if (lifecycle.isLoading) return <Skeleton className="h-10 w-full" />;
  if (lifecycle.error || !lifecycle.data) {
    return (
      <p className="text-xs text-red-700" role="alert">
        Lifecycle mix could not be loaded.{' '}
        <Button variant="ghost" size="sm" onClick={() => void lifecycle.refetch()}>Retry</Button>
      </p>
    );
  }
  const totals = cohortTotals(lifecycle.data);
  const total = lifecycle.data.total_options;
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="flex items-center justify-between gap-2 text-xs text-gray-500">
        <span>
          Lifecycle of <span data-testid="lifecycle-total" className="font-medium tabular-nums text-gray-900">{formatUnits(total)}</span> options · days from first GRN
        </span>
        <ProvenanceChip provenance="derived" note={lifecycle.data.curve_provisional ? 'Core ages from last GRN; curve after day 60 is provisional' : 'Core ages from last GRN'} />
      </p>
      <div className="flex h-3 gap-px overflow-hidden rounded-full bg-gray-100" aria-hidden>
        {totals.map((item) => (
          // eslint-disable-next-line no-restricted-syntax -- segment width is this stage's share of the store's options
          <span key={item.cohort} className={cn('first:rounded-l-full last:rounded-r-full', COHORT_TONE[item.cohort])} style={{ width: `${(item.options / total) * PERCENT}%` }} />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-1 gap-y-0.5" aria-label="Filter the worklist by lifecycle stage">
        {totals.map((item) => (
          <li key={item.cohort}>
            <Button
              variant="ghost"
              size="sm"
              data-testid={`mix-${item.cohort}`}
              aria-pressed={segment === item.cohort}
              title={`${COHORT_LABEL[item.cohort]}${item.grades ? ` — ${item.grades}` : ''}`}
              onClick={() => onSegment(segment === item.cohort ? 'selling' : item.cohort)}
              className={cn('h-auto min-h-11 gap-1 px-1.5 py-0.5 text-xs font-normal text-gray-600 md:min-h-0', segment === item.cohort && 'bg-gray-100 text-gray-900')}
            >
              <span aria-hidden className={cn('size-2 rounded-full', COHORT_TONE[item.cohort])} />
              {COHORT_SHORT[item.cohort]}
              <span className="font-medium tabular-nums text-gray-900">{formatUnits(item.options)}</span>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface FigureProps {
  readonly label: string;
  readonly value: string;
  readonly testid?: string;
  readonly delta?: React.ReactNode;
}

function Figure({ label, value, testid, delta }: FigureProps): React.ReactNode {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="flex flex-wrap items-baseline gap-x-1.5">
        <span className="text-lg font-semibold leading-6 tabular-nums text-gray-900" data-testid={testid}>{value}</span>
        {delta}
      </p>
    </div>
  );
}

/** Finding-count deltas can compare snapshots computed to different content versions (S2-C22). */
const FINDINGS_DELTA_NOTE = 'Snapshots computed to different content versions may count different finding codes';

interface StoreStripProps {
  readonly snapshotId: string;
  readonly store: StoreSummary;
  /** The listStores comparison; deltas read "—" with the reason when nothing is compared (S2-R4). */
  readonly comparison: Comparison | null;
  readonly segment: Segment;
  readonly onSegment: (segment: Segment) => void;
  /** Opens Data health on This store. */
  readonly onOpenGaps: () => void;
  /** Band filter on the worklist; the band-mix segments toggle it (S2-R11). */
  readonly bands: readonly BandFilter[];
  readonly onBand: (band: BandFilter) => void;
}

/** What the store holds and sells with the change since the previous snapshot, where it is behind, and its lifecycle mix. */
export function StoreStrip({ snapshotId, store, comparison, segment, onSegment, onOpenGaps, bands, onBand }: StoreStripProps): React.ReactNode {
  const deltas = store.deltas;
  return (
    <Card className="grid min-w-0 grid-cols-1 gap-3 p-3 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-center lg:gap-6">
      <div className="min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-gray-900">{store.name}</h2>
            <p className="text-xs text-gray-500">
              {store.store_code} · {store.city ?? 'City not recorded'} · {DC_LABEL} {store.dc_code}
            </p>
          </div>
          <ProvenanceChip provenance="observed" note="Stock on the snapshot date and net sales in the last 14 days" />
        </div>
        <MetricGrid columns={4} className="mb-0 grid-cols-2 xs:grid-cols-2">
          <Figure
            label="Options"
            value={formatUnits(store.options)}
            testid={`store-options-${store.store_code}`}
            delta={<Delta value={deltas?.options} comparison={comparison} testid="store-delta-options" />}
          />
          <Figure label="On shelf" value={formatUnits(store.saleable_units)} delta={<Delta value={deltas?.saleable_units} comparison={comparison} testid="store-delta-saleable" />} />
          <Figure label="In transit" value={formatUnits(store.transit_units)} delta={<Delta value={deltas?.transit_units} comparison={comparison} testid="store-delta-transit" />} />
          <Figure label="Sold, 14 days" value={formatUnits(store.sales_14d_units)} delta={<Delta value={deltas?.sales_14d_units} comparison={comparison} testid="store-delta-sold" />} />
        </MetricGrid>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-100 pt-2 text-xs text-gray-600">
          <span>
            Units short <span data-testid="store-units-short" className="font-semibold tabular-nums text-gray-900">{formatUnits(store.units_short)}</span>
          </span>
          <span>
            Day 90+ <span data-testid="store-day90-units" className="font-semibold tabular-nums text-gray-900">{formatUnits(store.day90_units)}</span> units
          </span>
          <span className="inline-flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenGaps}
              aria-label={`${formatUnits(store.finding_count)} data findings at store ${store.store_code}, open Data health`}
              className="-mx-1.5 h-auto min-h-11 gap-1 px-1.5 py-0.5 text-xs font-normal text-gray-600 md:min-h-0"
            >
              Data gaps <span data-testid="gap-total" className="font-semibold tabular-nums text-gray-900">{formatUnits(store.finding_count)}</span>
            </Button>
            <Delta value={deltas?.finding_count} comparison={comparison} testid="store-delta-findings" note={FINDINGS_DELTA_NOTE} />
          </span>
        </div>
      </div>
      <div className="min-w-0 space-y-3">
        <LifecycleMix snapshotId={snapshotId} storeCode={store.store_code} segment={segment} onSegment={onSegment} />
        {store.bands ? <BandMixBar counts={store.bands} active={bands} onBand={onBand} countPrefix="band-mix" /> : null}
        {store.space ? <SpaceLine space={store.space} flaggedTestid="store-space-flagged" /> : null}
      </div>
    </Card>
  );
}
