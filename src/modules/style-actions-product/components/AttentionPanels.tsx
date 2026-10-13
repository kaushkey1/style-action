import { Button, Card, Skeleton } from '@/components/ui';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

import { useLifecycle, useOptionStores } from '../api/queries';
import { ColourOnlyChip } from './ColourOnlyChip';
import { EMPTY, FINDING_LABEL, SELLING_COHORTS, findingCountRows, formatDay, formatPercent, formatUnits, isColourOnlyCode, roundUnits } from './display';

import type { OptionSort, OptionStoreRow, Snapshot, StoreSummary } from '../api/types';
import type { Segment } from './display';

const ATTENTION_ROWS = 5;
/**
 * Beside the brick matrix (1024 px and up) the band is a narrow column and below md it stacks under the matrix;
 * both show fewer rows so the matrix and the worklist stay within reach (S2-C39, S2-C40).
 */
const ATTENTION_ROWS_COMPACT = 3;
const MD_QUERY = '(min-width: 768px)';
const LG_QUERY = '(min-width: 1024px)';

/** Units the option is short of the curve (exact; shown whole); 0 when it has no gap or is on the curve. */
function shortfall(row: OptionStoreRow): number {
  if (row.gap === null || row.expected === null || row.sold === null) return 0;
  return Math.max(0, row.expected - row.sold);
}

interface ColumnProps {
  readonly title: string;
  readonly headline: React.ReactNode;
  readonly caption: string;
  readonly footer?: React.ReactNode;
  readonly children: React.ReactNode;
}

/** One column of the attention band: what it ranks, the headline figure, then the ranked rows. */
function AttentionColumn({ title, headline, caption, footer, children }: ColumnProps): React.ReactNode {
  return (
    <div className="flex min-w-0 flex-col py-3 first:pt-0 last:pb-0 md:flex-1 md:px-4 md:py-0 md:first:pl-0 md:last:pr-0 lg:flex-none lg:px-0 lg:py-3 lg:first:pt-0 lg:last:pb-0">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-0.5 text-lg font-semibold leading-6 tabular-nums">{headline}</p>
      <p className="mb-2 text-xs text-gray-500">{caption}</p>
      <div className="flex-1">{children}</div>
      {footer ? <div className="mt-1">{footer}</div> : null}
    </div>
  );
}

function RowsSkeleton(): React.ReactNode {
  return (
    <div className="space-y-1.5" aria-busy="true" aria-label="Loading">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-6 w-full" />
      ))}
    </div>
  );
}

function Quiet({ children }: { readonly children: React.ReactNode }): React.ReactNode {
  return <p className="py-2 text-xs text-gray-500">{children}</p>;
}

function LoadError({ onRetry }: { readonly onRetry: () => void }): React.ReactNode {
  return (
    <p className="text-xs text-red-700" role="alert">
      Could not load. <Button variant="ghost" size="sm" onClick={onRetry}>Retry</Button>
    </p>
  );
}

interface RankedButtonProps {
  readonly rank: number;
  readonly testid: string;
  readonly onClick: () => void;
  readonly label: React.ReactNode;
  readonly meta?: string;
  readonly figure: string;
  readonly isStatus?: boolean;
}

function RankedButton({ rank, testid, onClick, label, meta, figure, isStatus }: RankedButtonProps): React.ReactNode {
  return (
    <li>
      <Button
        variant="ghost"
        size="sm"
        data-testid={testid}
        onClick={onClick}
        className="h-auto min-h-11 w-full justify-start gap-2 px-1.5 py-1 text-left font-normal md:min-h-0"
      >
        <span className="w-4 shrink-0 text-right text-xs tabular-nums text-gray-500">{rank}</span>
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-gray-900">{label}</span>
          {meta ? <span className="block truncate text-xs text-gray-500">{meta}</span> : null}
        </span>
        <span className={cn('shrink-0 text-sm font-semibold tabular-nums', isStatus ? 'text-amber-700' : 'text-gray-900')}>{figure}</span>
      </Button>
    </li>
  );
}

function OptionLabel({ code }: { readonly code: string }): React.ReactNode {
  return (
    <>
      <span className="truncate">{code}</span>
      {isColourOnlyCode(code) ? <ColourOnlyChip /> : null}
    </>
  );
}

interface OptionColumnProps {
  readonly snapshotId: string;
  readonly storeCode: string;
  readonly rowLimit: number;
  readonly onOpen: (optionCode: string) => void;
  readonly onSeeAll: (segment: Segment, sort: OptionSort) => void;
}

function BehindColumn({ snapshotId, storeCode, rowLimit, onOpen, onSeeAll }: OptionColumnProps): React.ReactNode {
  const options = useOptionStores({ snapshotId, storeCode, cohorts: SELLING_COHORTS, sort: 'shortfall_desc', page: 1, pageSize: ATTENTION_ROWS });
  const rows = (options.data?.items ?? []).filter((row) => roundUnits(shortfall(row)) > 0).slice(0, rowLimit);
  const shortTotal = rows.reduce((sum, row) => sum + shortfall(row), 0);
  let body: React.ReactNode;
  if (options.isLoading) body = <RowsSkeleton />;
  else if (options.error || !options.data) body = <LoadError onRetry={() => void options.refetch()} />;
  else if (!rows.length) body = <Quiet>No selling-life option is behind the curve.</Quiet>;
  else {
    body = (
      <ol className="-mx-1.5 divide-y divide-gray-100">
        {rows.map((row, index) => (
          <RankedButton
            key={row.option_code}
            rank={index + 1}
            testid={`attention-behind-${row.option_code}`}
            onClick={() => onOpen(row.option_code)}
            label={<OptionLabel code={row.option_code} />}
            meta={[row.brick, `gap ${formatPercent(row.gap)}`, `${formatUnits(row.on_hand)} on hand`, `day ${row.days_in_store ?? EMPTY}`].filter(Boolean).join(' · ')}
            figure={`${formatUnits(shortfall(row))} short`}
            isStatus
          />
        ))}
      </ol>
    );
  }
  return (
    <AttentionColumn
      title="Most behind the curve"
      headline={<span className="text-amber-700">{rows.length ? `${formatUnits(shortTotal)} units short` : EMPTY}</span>}
      caption={rows.length ? `Across the ${rows.length} selling-life options furthest below the 75%-by-day-60 curve` : 'Selling-life options by units short of the curve'}
      footer={
        <Button variant="ghost" size="sm" onClick={() => onSeeAll('selling', 'shortfall_desc')} className="min-h-11 px-1.5 text-xs md:min-h-0">
          Rank the whole worklist this way
        </Button>
      }
    >
      {body}
    </AttentionColumn>
  );
}

function ExitColumn({ snapshotId, storeCode, rowLimit, onOpen, onSeeAll }: OptionColumnProps): React.ReactNode {
  const options = useOptionStores({ snapshotId, storeCode, cohorts: ['exit'], sort: 'on_hand_desc', page: 1, pageSize: ATTENTION_ROWS });
  const lifecycle = useLifecycle(snapshotId, storeCode);
  const exitRows = lifecycle.data?.cohorts.filter((item) => item.cohort === 'exit') ?? [];
  const exitOptions = exitRows.reduce((sum, item) => sum + item.options, 0);
  const exitUnits = exitRows.reduce((sum, item) => sum + item.units, 0);
  const rows = (options.data?.items ?? []).slice(0, rowLimit);
  let body: React.ReactNode;
  if (options.isLoading) body = <RowsSkeleton />;
  else if (options.error || !options.data) body = <LoadError onRetry={() => void options.refetch()} />;
  else if (!rows.length) body = <Quiet>No option is past day 90.</Quiet>;
  else {
    body = (
      <ol className="-mx-1.5 divide-y divide-gray-100">
        {rows.map((row, index) => (
          <RankedButton
            key={row.option_code}
            rank={index + 1}
            testid={`attention-exit-${row.option_code}`}
            onClick={() => onOpen(row.option_code)}
            label={<OptionLabel code={row.option_code} />}
            meta={[row.brick, `day ${row.days_in_store ?? EMPTY}`, `sold ${formatUnits(row.sold)}`].filter(Boolean).join(' · ')}
            figure={`${formatUnits(row.on_hand)} on hand`}
          />
        ))}
      </ol>
    );
  }
  return (
    <AttentionColumn
      title="Day 90+, most stock"
      headline={<span className="text-amber-700">{lifecycle.data ? `${formatUnits(exitOptions)} ${exitOptions === 1 ? 'option' : 'options'}` : EMPTY}</span>}
      caption={lifecycle.data ? `${formatUnits(exitUnits)} units on hand past day 90 since first GRN` : 'Past day 90 since first GRN'}
      footer={
        options.data && options.data.total > rowLimit ? (
          <Button variant="ghost" size="sm" onClick={() => onSeeAll('exit', 'on_hand_desc')} className="min-h-11 px-1.5 text-xs md:min-h-0">
            See all {formatUnits(options.data.total)} in the worklist
          </Button>
        ) : undefined
      }
    >
      {body}
    </AttentionColumn>
  );
}

interface GapColumnProps {
  readonly store: StoreSummary;
  readonly rowLimit: number;
  readonly onOpen: (code: string) => void;
  readonly onOpenHealth: () => void;
}

/** Data gaps from the store summary already loaded with the store list: no request of its own (Scope 1a R2). */
function GapColumn({ store, rowLimit, onOpen, onOpenHealth }: GapColumnProps): React.ReactNode {
  const present = findingCountRows(store.finding_counts);
  const total = present.reduce((sum, item) => sum + item.count, 0);
  const body = present.length ? (
    <ol className="-mx-1.5 divide-y divide-gray-100">
      {present.slice(0, rowLimit).map((item, index) => (
        <RankedButton
          key={item.code}
          rank={index + 1}
          testid={`gap-code-${item.code}`}
          onClick={() => onOpen(item.code)}
          label={<span className="truncate">{FINDING_LABEL[item.code] ?? item.code}</span>}
          figure={formatUnits(item.count)}
        />
      ))}
    </ol>
  ) : (
    <Quiet>No data gaps at this store in this snapshot.</Quiet>
  );
  return (
    <AttentionColumn
      title="Data gaps at this store"
      headline={<span className="text-gray-900" data-testid="attention-gap-total">{formatUnits(total)}</span>}
      caption={present.length ? `Data-quality findings across ${present.length} ${present.length === 1 ? 'check' : 'checks'}` : 'Data-quality findings from the snapshot build'}
      footer={
        <Button variant="ghost" size="sm" onClick={onOpenHealth} className="min-h-11 px-1.5 text-xs md:min-h-0">
          Open data health
        </Button>
      }
    >
      {body}
    </AttentionColumn>
  );
}

interface AttentionPanelsProps {
  readonly snapshot: Snapshot;
  readonly store: StoreSummary;
  readonly onOpenOption: (optionCode: string) => void;
  readonly onOpenFinding: (code: string) => void;
  readonly onOpenHealth: () => void;
  readonly onSeeAll: (segment: Segment, sort: OptionSort) => void;
}

/**
 * The store's attention, ranked (Scope 1a band, restored by S2-C39 beside the brick matrix): most behind the curve,
 * day 90+ with the most stock, and the store's data gaps. Scope 1 measures only, so it works on every snapshot.
 */
export function AttentionPanels({ snapshot, store, onOpenOption, onOpenFinding, onOpenHealth, onSeeAll }: AttentionPanelsProps): React.ReactNode {
  const isMd = useMediaQuery(MD_QUERY);
  const isLg = useMediaQuery(LG_QUERY);
  const rowLimit = isMd && !isLg ? ATTENTION_ROWS : ATTENTION_ROWS_COMPACT;
  return (
    <section aria-labelledby="attention-heading" data-testid="attention-band" className="min-w-0">
      <Card className="min-w-0 p-3">
        <div className="mb-3 border-b border-gray-100 pb-2">
          <h2 id="attention-heading" className="text-sm font-semibold text-gray-900">Needs attention at {store.name}</h2>
          <p className="text-xs text-gray-500">Ranked from the snapshot of {formatDay(snapshot.as_of)} · select a row to open it</p>
        </div>
        <div className="flex flex-col divide-y divide-gray-100 md:flex-row md:divide-x md:divide-y-0 lg:flex-col lg:divide-x-0 lg:divide-y">
          <BehindColumn snapshotId={snapshot.snapshot_id} storeCode={store.store_code} rowLimit={rowLimit} onOpen={onOpenOption} onSeeAll={onSeeAll} />
          <ExitColumn snapshotId={snapshot.snapshot_id} storeCode={store.store_code} rowLimit={rowLimit} onOpen={onOpenOption} onSeeAll={onSeeAll} />
          <GapColumn store={store} rowLimit={rowLimit} onOpen={onOpenFinding} onOpenHealth={onOpenHealth} />
        </div>
      </Card>
    </section>
  );
}
