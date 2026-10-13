import type { KeyboardEvent } from 'react';

import {
  Badge,
  Button,
  Card,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  EmptyState,
  FilterSelect,
  ListItemCard,
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui';
import { X } from 'lucide-react';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

import { useLifecycle, useOptionStores } from '../api/queries';
import {
  BUCKETS,
  COHORT_LABEL,
  COHORT_SHORT,
  DEFAULT_SORT,
  EMPTY,
  GAP_REASON_LABEL,
  BAND_BADGE,
  BAND_LABEL,
  BAND_MEANING,
  GLOSSARY,
  OPTION_SORTS_HEALTH,
  OPTION_SORTS_SCOPE1,
  SELLING_COHORTS,
  UNMEASURABLE_LABEL,
  formatPercent,
  formatUnits,
  formatWholeUnits,
  isColourOnlyCode,
  segmentCohorts,
} from './display';
import { ColourOnlyChip } from './ColourOnlyChip';
import { ListSearch, Pager } from './ListControls';
import { Term } from './Term';
import { ErrorBlock, LoadingBlock } from './QueryStates';
import { availabilityText, bandOf, bandText, coverText } from './scope';

import type { BandFilter, Cohort, Lifecycle, OptionSort, OptionStoreRow } from '../api/types';
import type { Segment } from './display';
import type { CellFilter } from './useWorkspaceParams';

const PAGE_SIZE = 50;
const BEHIND_THRESHOLD = 0.1;
const PERCENT = 100;
const TABLE_QUERY = '(min-width: 768px)';

const SORT_LABEL: Readonly<Record<OptionSort, string>> = {
  shortfall_desc: 'Most units behind first',
  gap_desc: 'Highest gap % first',
  gap_asc: 'Most ahead first',
  age_desc: 'Oldest first (nearest exit)',
  age_asc: 'Newest first',
  sold_desc: 'Most sold first',
  on_hand_desc: 'Most stock first',
  option_asc: 'Option code',
  true_ros_desc: 'Highest True ROS first',
  true_ros_asc: 'Lowest True ROS first',
  cover_asc: 'Least cover first',
  cover_desc: 'Most cover first',
};

function bucketCount(lifecycle: Lifecycle | undefined, segment: Segment): number | null {
  if (!lifecycle) return null;
  const cohorts = segmentCohorts(segment);
  return lifecycle.cohorts.filter((item) => !cohorts || cohorts.includes(item.cohort)).reduce((sum, item) => sum + item.options, 0);
}

function isBehind(row: OptionStoreRow): boolean {
  return row.gap !== null && row.gap > BEHIND_THRESHOLD;
}

/** Sell-through drawn against the curve: the fill is actual, the tick is where the curve expects it. */
function SellThroughBar({ row }: { readonly row: OptionStoreRow }): React.ReactNode {
  if (row.sell_through === null) return <span className="text-xs text-gray-500">{EMPTY}</span>;
  const actual = Math.min(1, Math.max(0, row.sell_through));
  const expected = row.expected !== null && row.inward ? Math.min(1, row.expected / row.inward) : null;
  return (
    <span className="inline-flex items-center justify-end gap-2">
      <span className="relative h-1.5 w-16 rounded-full bg-gray-100" aria-hidden>
        {/* eslint-disable-next-line no-restricted-syntax -- fill width is this option's sell-through */}
        <span className="absolute inset-y-0 left-0 rounded-full bg-gray-500" style={{ width: `${actual * PERCENT}%` }} />
        {expected === null ? null : (
          // eslint-disable-next-line no-restricted-syntax -- tick position is the curve's expected sell-through for this option's age
          <span className="absolute -inset-y-0.5 w-0.5 bg-gray-900" style={{ left: `calc(${expected * PERCENT}% - 1px)` }} />
        )}
      </span>
      <span className="w-9 text-right tabular-nums">{formatPercent(row.sell_through)}</span>
    </span>
  );
}

function GapValue({ row }: { readonly row: OptionStoreRow }): React.ReactNode {
  if (row.gap === null) {
    return <span className="text-xs text-gray-500" title={GAP_REASON_LABEL[row.gap_reason ?? ''] ?? undefined}>{EMPTY}</span>;
  }
  return (
    <span className={cn('tabular-nums font-medium', isBehind(row) ? 'text-amber-700' : 'text-gray-900')}>
      {formatPercent(row.gap)}
      {row.curve_provisional ? <span className="ml-1 text-xs font-normal text-gray-500" title="Curve after day 60 is provisional">prov.</span> : null}
      <span className="sr-only">{isBehind(row) ? ' behind the curve' : ' on or ahead of the curve'}</span>
    </span>
  );
}

function handleRowKey(event: KeyboardEvent<HTMLElement>, onActivate: () => void): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onActivate();
  }
}

interface RowsProps {
  readonly rows: readonly OptionStoreRow[];
  readonly selected: string | null;
  readonly onOpen: (optionCode: string) => void;
  readonly storeCode: string;
  /** The snapshot holds health: band, True ROS, availability and cover columns show (S2-R11). */
  readonly hasHealth: boolean;
}

/** The option's band, or why it has none ("Unmeasurable" with its reason in the tooltip); never 0. */
function BandValue({ row }: { readonly row: OptionStoreRow }): React.ReactNode {
  const health = row.health;
  if (!health) return <span className="text-xs text-gray-500" data-testid={`worklist-band-${row.option_code}`}>{EMPTY}</span>;
  const band = bandOf(health);
  const reason = health.unmeasurable_reason ? UNMEASURABLE_LABEL[health.unmeasurable_reason] : band ? BAND_MEANING[band] : undefined;
  return (
    <span title={reason} className="inline-flex">
      <Badge variant={band ? BAND_BADGE[band] : 'outline'} size="sm">
        <span data-testid={`worklist-band-${row.option_code}`}>{bandText(health)}</span>
      </Badge>
      {reason ? <span className="sr-only">: {reason}</span> : null}
    </span>
  );
}

function HealthCells({ row }: { readonly row: OptionStoreRow }): React.ReactNode {
  const health = row.health;
  return (
    <>
      <DataTableCell className="py-1.5"><BandValue row={row} /></DataTableCell>
      <DataTableCell align="right" className="py-1.5 tabular-nums" title={health?.unmeasurable_reason ? UNMEASURABLE_LABEL[health.unmeasurable_reason] : undefined}>
        {health && health.true_ros_30d !== null ? formatUnits(health.true_ros_30d) : EMPTY}
      </DataTableCell>
      <DataTableCell align="right" className="py-1.5 tabular-nums">{health ? availabilityText(health) : EMPTY}</DataTableCell>
      <DataTableCell align="right" className="py-1.5 tabular-nums">
        <span data-testid={`worklist-cover-${row.option_code}`}>{health ? coverText(health) : EMPTY}</span>
      </DataTableCell>
    </>
  );
}

function OptionTable({ rows, selected, onOpen, storeCode, hasHealth }: RowsProps): React.ReactNode {
  return (
    <DataTable className="relative" minWidth={hasHealth ? '1180px' : '900px'}>
      <caption className="sr-only">Options at store {storeCode}; select a row to open its detail</caption>
      <DataTableHeader>
        <DataTableHead>Option</DataTableHead>
        <DataTableHead>Grade</DataTableHead>
        <DataTableHead align="right">Days</DataTableHead>
        <DataTableHead>Stage</DataTableHead>
        <DataTableHead align="right">Inward</DataTableHead>
        <DataTableHead align="right">Sold</DataTableHead>
        <DataTableHead align="right" title="Bar fill is actual sell-through; the tick is where the curve expects it">Sell-through vs curve</DataTableHead>
        <DataTableHead align="right">Expected</DataTableHead>
        <DataTableHead align="right">Gap</DataTableHead>
        <DataTableHead align="right">On hand</DataTableHead>
        {hasHealth ? (
          <>
            <DataTableHead>Band</DataTableHead>
            <DataTableHead align="right"><Term help={GLOSSARY.trueRos}>True ROS / 30d</Term></DataTableHead>
            <DataTableHead align="right" title="Share of veto-valid days its pivotal sizes were all in stock">Availability</DataTableHead>
            <DataTableHead align="right">Cover</DataTableHead>
          </>
        ) : null}
      </DataTableHeader>
      <DataTableBody>
        {rows.map((row) => {
          const activate = (): void => onOpen(row.option_code);
          const isSelected = row.option_code === selected;
          return (
            <DataTableRow
              key={row.option_code}
              data-testid={`option-row-${row.option_code}`}
              onClick={activate}
              onKeyDown={(event) => handleRowKey(event, activate)}
              tabIndex={0}
              aria-label={`${row.option_code}, open detail`}
              aria-current={isSelected ? 'true' : undefined}
              className={cn('focus-kb:outline-none focus-kb:ring-2 focus-kb:ring-inset focus-kb:ring-primary', isSelected && 'bg-primary/10 hover:bg-primary/10')}
            >
              <DataTableCell className="max-w-72 py-1.5">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate font-medium text-gray-900">{row.option_code}</span>
                  {isColourOnlyCode(row.option_code) ? <ColourOnlyChip /> : null}
                </span>
                <span className="block truncate text-xs text-gray-500">{[row.option_name, row.brand, row.brick].filter(Boolean).join(' · ') || EMPTY}</span>
              </DataTableCell>
              <DataTableCell className="py-1.5">{row.grade_class}</DataTableCell>
              <DataTableCell align="right" className="py-1.5 tabular-nums">{row.days_in_store ?? EMPTY}</DataTableCell>
              <DataTableCell className="py-1.5 text-xs text-gray-700">{COHORT_SHORT[row.cohort]}</DataTableCell>
              <DataTableCell align="right" className="py-1.5 tabular-nums">{formatUnits(row.inward)}</DataTableCell>
              <DataTableCell align="right" className="py-1.5 tabular-nums">{formatUnits(row.sold)}</DataTableCell>
              <DataTableCell align="right" className="py-1.5"><SellThroughBar row={row} /></DataTableCell>
              <DataTableCell align="right" className="py-1.5 tabular-nums">{formatWholeUnits(row.expected)}</DataTableCell>
              <DataTableCell align="right" className="py-1.5"><GapValue row={row} /></DataTableCell>
              <DataTableCell align="right" className="py-1.5 tabular-nums">{formatUnits(row.on_hand)}</DataTableCell>
              {hasHealth ? <HealthCells row={row} /> : null}
            </DataTableRow>
          );
        })}
      </DataTableBody>
    </DataTable>
  );
}

function OptionCards({ rows, selected, onOpen, hasHealth }: RowsProps): React.ReactNode {
  return (
    <ul className="-mx-3 border-t border-gray-100">
      {rows.map((row) => (
        <li key={row.option_code} data-testid={`option-row-${row.option_code}`}>
          <ListItemCard variant="row" selected={row.option_code === selected} onClick={() => onOpen(row.option_code)} title={row.option_code} className="py-3">
            <span className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-sm font-medium text-gray-900">{row.option_code}</span>
                {isColourOnlyCode(row.option_code) ? <ColourOnlyChip /> : null}
              </span>
              <GapValue row={row} />
            </span>
            <span className="mt-0.5 block truncate text-xs text-gray-600">{[row.option_name, row.brick].filter(Boolean).join(' · ') || EMPTY}</span>
            <span className="mt-1 flex flex-wrap items-center gap-x-2 text-xs tabular-nums text-gray-600">
              <span>{row.grade_class} · {COHORT_SHORT[row.cohort]} · day {row.days_in_store ?? EMPTY}</span>
              <SellThroughBar row={row} />
              <span>{formatUnits(row.on_hand)} on hand</span>
            </span>
            {hasHealth && row.health ? (
              <span className="mt-1 flex flex-wrap items-center gap-x-2 text-xs tabular-nums text-gray-600">
                <BandValue row={row} />
                <span>True ROS {row.health.true_ros_30d === null ? EMPTY : formatUnits(row.health.true_ros_30d)} / 30d</span>
                <span>Avail. {availabilityText(row.health)}</span>
                <span>Cover <span data-testid={`worklist-cover-${row.option_code}`}>{coverText(row.health)}</span></span>
              </span>
            ) : null}
          </ListItemCard>
        </li>
      ))}
    </ul>
  );
}

interface WorklistProps {
  readonly snapshotId: string;
  readonly storeCode: string;
  readonly segment: Segment;
  readonly q: string;
  readonly sort: OptionSort;
  readonly page: number;
  readonly selected: string | null;
  /** Brick matrix cell filter (segment, brick, grade), shown as a clearable chip. */
  readonly cell: CellFilter | null;
  readonly onClearCell: () => void;
  readonly hasHealth: boolean;
  /** Band filter from the band-mix bar or the bands lens. */
  readonly bands: readonly BandFilter[];
  readonly onClearBands: () => void;
  readonly onSegment: (segment: Segment) => void;
  readonly onSearch: (q: string) => void;
  readonly onSort: (sort: OptionSort) => void;
  readonly onPage: (page: number) => void;
  readonly onOpen: (optionCode: string) => void;
}

/** The selling-life stage picked from the mix bar, when the segment is not one of the buckets. */
function stageOf(segment: Segment): Cohort | null {
  if (BUCKETS.some((bucket) => bucket.id === segment)) return null;
  return SELLING_COHORTS.find((cohort) => cohort === segment) ?? null;
}

/** Every option at the store, by lifecycle bucket, searchable and sortable, opening into the option drawer. */
export function Worklist(props: WorklistProps): React.ReactNode {
  const { snapshotId, storeCode, segment, q, sort, page, selected, cell, onClearCell, hasHealth, bands, onClearBands, onSegment, onSearch, onSort, onPage, onOpen } = props;
  // Health sorts and the band filter need health (409 otherwise); a linked URL on an older snapshot falls back.
  const effectiveSort = !hasHealth && OPTION_SORTS_HEALTH.includes(sort) ? DEFAULT_SORT : sort;
  const effectiveBands = hasHealth ? bands : [];
  const isTable = useMediaQuery(TABLE_QUERY);
  const lifecycle = useLifecycle(snapshotId, storeCode);
  const options = useOptionStores({
    snapshotId,
    storeCode,
    cohorts: segmentCohorts(segment),
    q: q || undefined,
    segment: cell?.segment ?? undefined,
    brick: cell?.brick,
    gradeClass: cell?.grade ?? undefined,
    bands: effectiveBands.length ? effectiveBands : undefined,
    sort: effectiveSort,
    page,
    pageSize: PAGE_SIZE,
  });
  const cellLabel = cell ? [cell.segment, cell.brick, cell.grade].filter(Boolean).join(' · ') : null;
  const sortChoices = hasHealth ? [...OPTION_SORTS_SCOPE1, ...OPTION_SORTS_HEALTH] : OPTION_SORTS_SCOPE1;

  let body: React.ReactNode;
  if (options.isLoading) body = <LoadingBlock label="Loading options" />;
  else if (options.error || !options.data) body = <ErrorBlock error={options.error} onRetry={() => void options.refetch()} />;
  else if (!options.data.items.length) {
    const description = cellLabel
      ? `No option in ${cellLabel} matches this segment and search in the snapshot.`
      : 'No option at this store matches this segment and search in the snapshot.';
    body = <EmptyState title="No options match" description={description} />;
  } else {
    const rows = options.data.items;
    const pages = Math.max(1, Math.ceil(options.data.total / PAGE_SIZE));
    body = (
      <>
        {isTable ? (
          <OptionTable rows={rows} selected={selected} onOpen={onOpen} storeCode={storeCode} hasHealth={hasHealth} />
        ) : (
          <OptionCards rows={rows} selected={selected} onOpen={onOpen} storeCode={storeCode} hasHealth={hasHealth} />
        )}
        <Pager page={page} pages={pages} onPage={onPage} />
      </>
    );
  }

  const stage = stageOf(segment);
  return (
    <Card className="min-w-0 space-y-2 p-3">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-900">
            Worklist · <span data-testid="options-total" className="tabular-nums">{options.data ? formatUnits(options.data.total) : EMPTY}</span> options
          </h2>
          <ToggleGroup value={stage ? '' : segment} onValueChange={(value) => onSegment(BUCKETS.find((bucket) => bucket.id === value)?.id ?? 'selling')} aria-label="Lifecycle bucket" className="max-w-full flex-wrap">
            {BUCKETS.map((bucket) => {
              const count = bucketCount(lifecycle.data, bucket.id);
              return (
                <ToggleGroupItem key={bucket.id} value={bucket.id} data-testid={`seg-${bucket.id}`} className="h-7 min-h-11 whitespace-nowrap px-2 text-xs md:min-h-0">
                  {bucket.label}
                  {count === null ? null : <span className="tabular-nums text-gray-500">{formatUnits(count)}</span>}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
          {stage ? (
            <Button variant="outline" size="sm" onClick={() => onSegment('selling')} aria-label={`Clear stage filter ${COHORT_LABEL[stage]}`} className="h-7 min-h-11 text-xs md:min-h-0">
              Stage: {COHORT_LABEL[stage]}
              <X className="size-3.5" aria-hidden />
            </Button>
          ) : null}
          {effectiveBands.length ? (
            <Button variant="outline" size="sm" onClick={onClearBands} data-testid="worklist-band-filter" aria-label={`Clear band filter ${effectiveBands.map((band) => BAND_LABEL[band]).join(', ')}`} className="h-7 min-h-11 text-xs md:min-h-0">
              Band: {effectiveBands.map((band) => BAND_LABEL[band]).join(', ')}
              <X className="size-3.5" aria-hidden />
            </Button>
          ) : null}
          {cellLabel ? (
            <Button variant="outline" size="sm" onClick={onClearCell} data-testid="worklist-cell-filter" aria-label={`Clear brick filter ${cellLabel}`} className="h-7 min-h-11 text-xs md:min-h-0">
              Brick: {cellLabel}
              <X className="size-3.5" aria-hidden />
            </Button>
          ) : null}
        </div>
        {/* The worklist's control row: search and sort beside the buckets, aligned to the card edge (S2-C64). */}
        <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center xl:justify-end">
          <ListSearch value={q} onSearch={onSearch} placeholder="Search options" testid="worklist-search" />
          <FilterSelect
            value={effectiveSort}
            onChange={(value) => onSort(sortChoices.find((item) => item === value) ?? DEFAULT_SORT)}
            options={sortChoices.map((value) => ({ value, label: SORT_LABEL[value] }))}
          />
        </div>
      </div>
      <p className="text-xs text-gray-500">
        {segment === 'selling' ? `In selling life: ${SELLING_COHORTS.map((cohort) => COHORT_SHORT[cohort]).join(', ')} days. ` : ''}
        Gap = (expected − sold) ÷ expected on the 75%-by-day-60 curve; “prov.” marks the provisional curve after day 60.
      </p>
      {body}
    </Card>
  );
}
