import { Badge, Button } from '@/components/ui';

import { useHealth } from '../api/queries';
import { STYLE_ACTIONS_DEMO } from '../api/demoMode';
import { formatDay, formatUnits } from './display';

import type { Snapshot } from '../api/types';

const STATUS_LABEL: Readonly<Record<Snapshot['status'], string>> = { building: 'Building', ready: 'Ready', failed: 'Failed' };
const STATUS_VARIANT = { building: 'warning', ready: 'success', failed: 'error' } as const;

interface HealthStripProps {
  readonly snapshot: Snapshot | null;
  readonly onOpen: () => void;
}

/** One line of trust: backend and source, data dates, snapshot status and findings; opens the Data health drawer. */
export function HealthStrip({ snapshot, onOpen }: HealthStripProps): React.ReactNode {
  const health = useHealth();
  const findingTotal = snapshot ? Object.values(snapshot.finding_counts).reduce((sum, count) => sum + count, 0) : null;
  let backend: React.ReactNode;
  if (STYLE_ACTIONS_DEMO) backend = (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Badge variant="warning" size="sm"><span data-testid="backend-status">Dummy data</span></Badge>
      <span className="text-gray-600">Local demo · 12 stores · 96 product variants · no live backend</span>
    </span>
  );
  else if (health.isLoading) backend = <span className="text-gray-500">Checking backend…</span>;
  else if (health.error || !health.data) {
    backend = (
      <span className="inline-flex items-center gap-1.5 text-gray-600">
        <Badge variant="error" size="sm" dot>
          <span data-testid="backend-status">Not connected</span>
        </Badge>
        <span>Style Actions backend is unreachable</span>
      </span>
    );
  } else {
    const { data } = health;
    const sourceOk = data.source.reachable;
    backend = (
      <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
        <Badge variant={sourceOk ? 'success' : 'warning'} size="sm" dot>
          <span data-testid="backend-status">{sourceOk ? 'Connected' : 'Source unreachable'}</span>
        </Badge>
        <span className="text-gray-600">
          {data.source.kind === 'fixture' ? 'Test fixture data' : 'BigQuery'} · Source holds stock to {formatDay(data.data_dates.stock_latest)} · sales to{' '}
          {formatDay(data.data_dates.sales_latest)}
          {snapshot ? ` · viewing the snapshot as of ${formatDay(snapshot.as_of)}` : ''}
        </span>
      </span>
    );
  }
  return (
    <div
      role="status"
      className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        {backend}
        <span className="inline-flex items-center gap-1.5 text-gray-600">
          Snapshot
          <Badge variant={snapshot ? STATUS_VARIANT[snapshot.status] : 'default'} size="sm">
            <span data-testid="snapshot-status">{snapshot ? STATUS_LABEL[snapshot.status] : 'None'}</span>
          </Badge>
        </span>
        {findingTotal === null ? null : (
          <span className={findingTotal ? 'tabular-nums text-amber-700' : 'text-gray-600'}>
            {findingTotal ? `${formatUnits(findingTotal)} data gaps in this snapshot` : 'No data gaps in this snapshot'}
          </span>
        )}
      </div>
      <Button variant="outline" size="sm" onClick={onOpen} data-testid="open-health" className="min-h-11 shrink-0 md:h-7 md:min-h-0 lg:min-h-7 text-xs">
        Data health
      </Button>
    </div>
  );
}
