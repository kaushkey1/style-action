import { Button, Card, MetricGrid } from '@/components/ui';

import { BandMixBar, SpaceLine } from './BandMix';
import { CohortBar } from './CohortBar';
import { Delta } from './Delta';
import { formatUnits } from './display';
import { ProvenanceChip } from './ProvenanceChip';

import type { DcSummary } from '../api/types';

/** Finding-count deltas can compare snapshots computed to different content versions (S2-C22). */
const FINDINGS_DELTA_NOTE = 'Snapshots computed to different content versions may count different finding codes';

interface TotalProps {
  readonly label: string;
  readonly value: number;
  readonly testid: string;
  readonly delta: React.ReactNode;
  readonly hint?: string;
}

function Total({ label, value, testid, delta, hint }: TotalProps): React.ReactNode {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="flex flex-wrap items-baseline gap-x-1.5">
        <span data-testid={testid} className="text-lg font-semibold leading-6 tabular-nums text-gray-900">{formatUnits(value)}</span>
        {delta}
      </p>
      {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

interface DcTotalsStripProps {
  readonly summary: DcSummary;
  readonly onOpenHealth: () => void;
}

/** What the DC's stores hold and sell, each figure the sum of its stores, with the change since the previous snapshot (S2-R2, R4). */
export function DcTotalsStrip({ summary, onOpenHealth }: DcTotalsStripProps): React.ReactNode {
  const { totals, deltas, comparison } = summary;
  return (
    <Card className="min-w-0 space-y-3 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900">Distribution Centre {summary.dc_code} totals</h2>
          <p className="text-xs text-gray-500">The sum of its stores. Options count each option once per store that holds it.</p>
        </div>
        <ProvenanceChip provenance="derived" note="Sums of the stores' stock on the snapshot date and net sales in the last 14 days" />
      </div>
      <MetricGrid columns={5} className="mb-0 grid-cols-2 xs:grid-cols-2">
        <Total
          label="Stores"
          value={totals.stores}
          testid="dc-total-stores"
          delta={<Delta value={deltas?.stores} comparison={comparison} testid="dc-delta-stores" />}
          hint={`${formatUnits(totals.stores_with_data)} with data · ${formatUnits(totals.stores_without_data)} without`}
        />
        <Total label="Options" value={totals.options} testid="dc-total-options" delta={<Delta value={deltas?.options} comparison={comparison} testid="dc-delta-options" />} />
        <Total label="On shelf" value={totals.saleable_units} testid="dc-total-saleable" delta={<Delta value={deltas?.saleable_units} comparison={comparison} testid="dc-delta-saleable" />} />
        <Total label="In transit" value={totals.transit_units} testid="dc-total-transit" delta={<Delta value={deltas?.transit_units} comparison={comparison} testid="dc-delta-transit" />} />
        <Total label="Sold, 14 days" value={totals.sales_14d_units} testid="dc-total-sold" delta={<Delta value={deltas?.sales_14d_units} comparison={comparison} testid="dc-delta-sold" />} />
      </MetricGrid>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-gray-100 pt-2 text-xs text-gray-600">
        <span>
          Units short <span data-testid="dc-total-units-short" className="font-semibold tabular-nums text-gray-900">{formatUnits(totals.units_short)}</span>
        </span>
        <span>
          Day 90+ <span data-testid="dc-total-day90" className="font-semibold tabular-nums text-gray-900">{formatUnits(totals.day90_units)}</span> units
        </span>
        <span className="inline-flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenHealth}
            data-testid="dc-open-health"
            aria-label={`${formatUnits(totals.finding_count)} data findings in Distribution Centre ${summary.dc_code}, open Data health`}
            className="-mx-1.5 h-auto min-h-11 gap-1 px-1.5 py-0.5 text-xs font-normal text-gray-600 md:min-h-0"
          >
            Data gaps <span data-testid="dc-total-findings" className="font-semibold tabular-nums text-gray-900">{formatUnits(totals.finding_count)}</span>
          </Button>
          <Delta value={deltas?.finding_count} comparison={comparison} testid="dc-delta-findings" note={FINDINGS_DELTA_NOTE} />
        </span>
      </div>
      <CohortBar cohorts={totals.cohorts} deltas={deltas?.cohorts ?? null} comparison={comparison} />
      {totals.bands ? <BandMixBar counts={totals.bands} countPrefix="dc-band" /> : null}
      {totals.space ? <SpaceLine space={totals.space} flaggedTestid="dc-space-flagged" /> : null}
    </Card>
  );
}
