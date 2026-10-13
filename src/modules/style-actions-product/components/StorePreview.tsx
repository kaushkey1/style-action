import { ArrowUpRight } from 'lucide-react';

import { Button, Card, EmptyState, MetricGrid, Skeleton } from '@/components/ui';

import { useOptionStores, useStoreBricks } from '../api/queries';
import { CohortBar } from './CohortBar';
import { Delta } from './Delta';
import { FINDING_LABEL, SELLING_COHORTS, findingCountRows, formatPercent, formatUnits, roundUnits } from './display';
import { matrixCellTestId } from './scope';

import type { Comparison, StoreSummary } from '../api/types';
import type { WorkspaceParam } from './display';

/** Rows per block: enough for a Distribution Centre lead to judge the store before opening it (S2-C48). */
const BLOCK_ROWS = 3;

/** Opens the store workspace, optionally at a brick cell, an option or a Data health code. */
export type OpenStoreAt = (storeCode: string, extra?: Partial<Record<WorkspaceParam, string | null>>) => void;

function Figure({ label, value, delta }: { readonly label: string; readonly value: number; readonly delta?: React.ReactNode }): React.ReactNode {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="flex flex-wrap items-baseline gap-x-1.5">
        <span className="text-base font-semibold tabular-nums text-gray-900">{formatUnits(value)}</span>
        {delta}
      </p>
    </div>
  );
}

function Block({ title, children }: { readonly title: string; readonly children: React.ReactNode }): React.ReactNode {
  return (
    <section className="space-y-1 border-t border-gray-100 pt-2">
      <h3 className="text-xs font-semibold text-gray-700">{title}</h3>
      {children}
    </section>
  );
}

function BlockRows({ count }: { readonly count: number }): React.ReactNode {
  return (
    <div className="space-y-1" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, index) => <Skeleton key={index} className="h-5 w-full" />)}
    </div>
  );
}

function BlockError({ onRetry }: { readonly onRetry: () => void }): React.ReactNode {
  return (
    <p className="text-xs text-red-700" role="alert">
      Could not load. <Button variant="ghost" size="sm" onClick={onRetry} className="min-h-11 md:min-h-0">Retry</Button>
    </p>
  );
}

interface RowButtonProps {
  readonly testid: string;
  readonly label: string;
  readonly meta?: string;
  readonly figure: string;
  readonly onClick: () => void;
  readonly ariaLabel: string;
}

function RowButton({ testid, label, meta, figure, onClick, ariaLabel }: RowButtonProps): React.ReactNode {
  return (
    <li>
      <Button variant="ghost" size="sm" data-testid={testid} aria-label={ariaLabel} onClick={onClick} className="h-auto min-h-11 w-full justify-start gap-2 px-1.5 py-1 text-left font-normal md:min-h-0">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-gray-900">{label}</span>
          {meta ? <span className="block truncate text-xs text-gray-500">{meta}</span> : null}
        </span>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">{figure}</span>
      </Button>
    </li>
  );
}

interface BlockProps {
  readonly snapshotId: string;
  readonly store: StoreSummary;
  readonly onOpenAt: OpenStoreAt;
}

/** The store's three worst brick groups by units short; each opens the workspace at that cell (getStoreBricks). */
function WorstBricks({ snapshotId, store, onOpenAt }: BlockProps): React.ReactNode {
  const bricks = useStoreBricks(snapshotId, store.store_code);
  let body: React.ReactNode;
  if (bricks.isLoading) body = <BlockRows count={BLOCK_ROWS} />;
  else if (bricks.error || !bricks.data) body = <BlockError onRetry={() => void bricks.refetch()} />;
  else {
    const worst = [...bricks.data.items].filter((item) => item.units_short > 0).sort((a, b) => b.units_short - a.units_short || b.day90_units - a.day90_units).slice(0, BLOCK_ROWS);
    body = worst.length ? (
      <ul className="-mx-1.5">
        {worst.map((item) => {
          const name = [item.segment, item.brick ?? item.brick_key, item.grade_class].filter(Boolean).join(' · ');
          return (
            <RowButton
              key={`${item.segment}-${item.brick_key}-${item.grade_class}`}
              testid={`dc-preview-brick-${matrixCellTestId(item).replace('matrix-cell-', '')}`}
              label={name}
              meta={item.day90_units > 0 ? `${formatUnits(item.day90_units)} units past day 90` : undefined}
              figure={`${formatUnits(item.units_short)} short`}
              ariaLabel={`${name}: ${formatUnits(item.units_short)} units short; open the store at this brick`}
              onClick={() => onOpenAt(store.store_code, { segment: item.segment, brick: item.brick_key, grade: item.grade_class, seg: 'all' })}
            />
          );
        })}
      </ul>
    ) : (
      <p className="text-xs text-gray-500">No brick group is behind the curve.</p>
    );
  }
  return <Block title="Worst brick groups">{body}</Block>;
}

/** The three selling-life options most behind the curve; each opens its drawer (listOptionStores, shortfall_desc, 3). */
function BehindOptions({ snapshotId, store, onOpenAt }: BlockProps): React.ReactNode {
  const options = useOptionStores(previewOptionsQuery(snapshotId, store.store_code));
  let body: React.ReactNode;
  if (options.isLoading) body = <BlockRows count={BLOCK_ROWS} />;
  else if (options.error || !options.data) body = <BlockError onRetry={() => void options.refetch()} />;
  else {
    const rows = options.data.items.filter((row) => row.gap !== null && roundUnits(Math.max(0, (row.expected ?? 0) - (row.sold ?? 0))) > 0);
    body = rows.length ? (
      <ul className="-mx-1.5">
        {rows.map((row) => {
          const short = Math.max(0, (row.expected ?? 0) - (row.sold ?? 0));
          return (
            <RowButton
              key={row.option_code}
              testid={`dc-preview-option-${row.option_code}`}
              label={row.option_code}
              meta={[row.brick, `gap ${formatPercent(row.gap)}`, `${formatUnits(row.on_hand)} on hand`].filter(Boolean).join(' · ')}
              figure={`${formatUnits(short)} short`}
              ariaLabel={`${row.option_code}: ${formatUnits(short)} units short; open its detail in the store`}
              onClick={() => onOpenAt(store.store_code, { option: row.option_code })}
            />
          );
        })}
      </ul>
    ) : (
      <p className="text-xs text-gray-500">No selling-life option is behind the curve.</p>
    );
  }
  return <Block title="Most behind the curve">{body}</Block>;
}

/** The store's top data-gap codes from the summary already loaded (no request); each opens Data health at that code. */
function TopGaps({ store, onOpenAt }: Omit<BlockProps, 'snapshotId'>): React.ReactNode {
  const rows = findingCountRows(store.finding_counts).slice(0, BLOCK_ROWS);
  return (
    <Block title="Data gaps">
      {rows.length ? (
        <ul className="-mx-1.5">
          {rows.map((row) => (
            <RowButton
              key={row.code}
              testid={`dc-preview-gap-${row.code}`}
              label={FINDING_LABEL[row.code] ?? row.code}
              figure={formatUnits(row.count)}
              ariaLabel={`${FINDING_LABEL[row.code] ?? row.code}: ${formatUnits(row.count)}; open Data health at the store`}
              onClick={() => onOpenAt(store.store_code, { panel: 'health', scope: 'store', code: row.code })}
            />
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-500">No data gaps at this store in this snapshot.</p>
      )}
    </Block>
  );
}

interface StorePreviewProps {
  readonly snapshotId: string;
  readonly store: StoreSummary | null;
  readonly comparison: Comparison;
  readonly onOpen: (storeCode: string) => void;
  readonly onOpenAt: OpenStoreAt;
}

/**
 * The selected store at its natural height beside the ranked list (S2-C48, S2-C49): its figures with deltas, the worst
 * brick groups, the options most behind the curve, its data gaps and lifecycle mix. The name and a compact icon button
 * open the store workspace; every row opens it at that brick, option or data-gap code.
 */
export function StorePreview({ snapshotId, store, comparison, onOpen, onOpenAt }: StorePreviewProps): React.ReactNode {
  if (!store) {
    return (
      <Card className="min-w-0 p-3">
        <EmptyState title="Select a store" description="Its figures appear here before you open its workspace." />
      </Card>
    );
  }
  return <SelectedPreview snapshotId={snapshotId} store={store} comparison={comparison} onOpen={onOpen} onOpenAt={onOpenAt} />;
}

/** The query for the preview's options block; shared so the readiness signal reads the same cached request. */
function previewOptionsQuery(snapshotId: string, storeCode: string): Parameters<typeof useOptionStores>[0] {
  return { snapshotId, storeCode, cohorts: SELLING_COHORTS, sort: 'shortfall_desc', page: 1, pageSize: BLOCK_ROWS };
}

function SelectedPreview({ snapshotId, store, comparison, onOpen, onOpenAt }: StorePreviewProps & { readonly store: StoreSummary }): React.ReactNode {
  const deltas = store.deltas;
  // Same query keys as the blocks below, so these read the cache and add no request.
  const bricks = useStoreBricks(store.has_data ? snapshotId : null, store.store_code);
  const options = useOptionStores(store.has_data ? previewOptionsQuery(snapshotId, store.store_code) : null);
  // Journeys wait on this before choosing another row (S2-C68): present only once this store's blocks have settled.
  const isReady = !store.has_data || ((bricks.isSuccess || bricks.isError) && (options.isSuccess || options.isError) && !options.isPlaceholderData);
  return (
    <Card className="min-w-0 space-y-2 p-3" data-testid="dc-store-preview">
      {isReady ? (
        <span data-testid="dc-preview-ready" aria-hidden className="sr-only">
          {store.store_code}
        </span>
      ) : null}
      <div className="flex items-start gap-1">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-gray-900">
            <Button variant="ghost" size="sm" onClick={() => onOpen(store.store_code)} className="-ml-1.5 h-auto max-w-full px-1.5 py-0.5 text-sm font-semibold text-gray-900 hover:underline">
              <span className="truncate">{store.name}</span>
            </Button>
          </h2>
          <p className="text-xs text-gray-500">
            <span data-testid="dc-preview-store" className="font-medium tabular-nums text-gray-700">{store.store_code}</span>
            {[store.city, store.format].filter(Boolean).map((part) => ` · ${part}`).join('')}
            {store.has_data ? '' : ' · no stock or sales rows in this snapshot'}
          </p>
        </div>
        <Button variant="ghost" size="sm" data-testid="dc-open-store" aria-label={`Open store workspace for ${store.name}`} onClick={() => onOpen(store.store_code)} className="size-11 shrink-0 p-0 md:size-8">
          <ArrowUpRight className="size-4" aria-hidden />
        </Button>
      </div>
      <MetricGrid columns={3} className="mb-0 gap-2">
        <Figure label="Units short" value={store.units_short} />
        <Figure label="Day 90+ units" value={store.day90_units} />
        <Figure label="Data gaps" value={store.finding_count} delta={<Delta value={deltas?.finding_count} comparison={comparison} />} />
        <Figure label="Options" value={store.options} delta={<Delta value={deltas?.options} comparison={comparison} />} />
        <Figure label="On shelf" value={store.saleable_units} delta={<Delta value={deltas?.saleable_units} comparison={comparison} testid="dc-preview-delta-saleable" />} />
        <Figure label="Sold, 14 days" value={store.sales_14d_units} delta={<Delta value={deltas?.sales_14d_units} comparison={comparison} />} />
      </MetricGrid>
      {store.has_data ? (
        <>
          <WorstBricks snapshotId={snapshotId} store={store} onOpenAt={onOpenAt} />
          <BehindOptions snapshotId={snapshotId} store={store} onOpenAt={onOpenAt} />
        </>
      ) : null}
      <TopGaps store={store} onOpenAt={onOpenAt} />
      <div className="border-t border-gray-100 pt-2">
        <CohortBar cohorts={store.cohorts} />
      </div>
    </Card>
  );
}
