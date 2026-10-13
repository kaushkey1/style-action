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
  Skeleton,
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui';
import { cn } from '@/lib/utils';

import { StyleActionsApiError } from '../api/client';
import { useStoreBricks } from '../api/queries';
import { BAND_FILTERS, BAND_LABEL, BAND_SHORT, BAND_TONE, EMPTY, GLOSSARY, fallbackDepthText, formatPercent, formatUnits } from './display';
import { Term } from './Term';
import { ListSearch, Pager } from './ListControls';
import { ProvenanceChip } from './ProvenanceChip';
import { bandMix, matchesQuery, matrixCellTestId, matrixGrades, matrixRows, pageSlice } from './scope';

import type { BandFilter, ContentParts, SpaceFill, StoreBrickRow } from '../api/types';
import type { MatrixRow } from './scope';
import type { CellFilter, MatrixLens } from './useWorkspaceParams';

/** Rows per page: a store holds up to about 430 segment × brick rows on real data (S2-C44). */
const MATRIX_PAGE_SIZE = 10;
const PERCENT = 100;
const MIN_TABLE_WIDTH = 220;
const GRADE_COLUMN_WIDTH = 120;
/** The space lens draws two labelled fill bars per cell, so its grade columns need more room. */
const SPACE_COLUMN_WIDTH = 170;
/** Fill bars run 0–150% so the 100% and 90% floors and the 120% overfill line sit inside them (S2-D18). */
const FILL_SCALE = 1.5;
const OPTIONS_FLOOR = 1;
const UNITS_FLOOR = 0.9;
const OVERFILL = 1.2;
const LENS_HINT: Readonly<Record<MatrixLens, string>> = {
  scope1: 'Units short of the curve, with day 90+ units, by segment, brick and grade; worst first. Select a cell to filter the worklist.',
  bands: 'Options by health band in each group; select a band to filter the worklist to it. Supply-c. = Supply-constrained · Unmeas. = Unmeasurable · Gap n/c = Gap not computed.',
  space: 'Options and units fill against the space plan, with the 100% and 90% floors and the 120% overfill line.',
};

interface BrickMatrixProps {
  readonly snapshotId: string;
  readonly storeCode: string;
  readonly cell: CellFilter | null;
  readonly onCell: (cell: CellFilter, band?: BandFilter) => void;
  readonly lens: MatrixLens;
  readonly onLens: (lens: MatrixLens) => void;
  /** What the snapshot holds; the Bands and Space lenses appear only with it. */
  readonly contentParts: ContentParts;
  readonly query: string;
  readonly page: number | null;
  readonly onQuery: (query: string) => void;
  readonly onPage: (page: number) => void;
}

function sameCell(item: StoreBrickRow, cell: CellFilter | null): boolean {
  return Boolean(cell && cell.brick === item.brick_key && cell.grade === item.grade_class && (cell.segment ?? null) === item.segment);
}

function rowLabel(row: MatrixRow): string {
  return [row.segment, row.brick ?? row.brickKey].filter(Boolean).join(' · ');
}

function groupName(item: StoreBrickRow): string {
  return [item.segment, item.brick ?? item.brick_key, item.grade_class].filter(Boolean).join(' ');
}

interface CellProps {
  readonly item: StoreBrickRow;
  readonly isSelected: boolean;
  readonly onSelect: (band?: BandFilter) => void;
}

/** Units short lens: a bar scaled to the store's worst cell, the figure, and day 90+ units beneath. */
function UnitsShortCell({ item, isSelected, onSelect, maxShort }: CellProps & { readonly maxShort: number }): React.ReactNode {
  const share = maxShort > 0 ? (item.units_short / maxShort) * PERCENT : 0;
  const label = [
    `${groupName(item)}:`,
    `${formatUnits(item.units_short)} units short over ${formatUnits(item.units_short_options)} options,`,
    `${formatUnits(item.day90_units)} units past day 90 over ${formatUnits(item.day90_options)} options.`,
    isSelected ? 'Filtering the worklist.' : 'Filter the worklist.',
  ].join(' ');
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-pressed={isSelected}
      aria-label={label}
      onClick={() => onSelect()}
      className={cn('h-auto min-h-11 w-full flex-col items-stretch gap-1 px-2 py-1.5 text-left font-normal', isSelected && 'bg-primary/10 hover:bg-primary/10')}
    >
      <span className="flex items-center gap-2">
        <span className="relative h-1.5 flex-1 rounded-full bg-gray-100" aria-hidden>
          {/* eslint-disable-next-line no-restricted-syntax -- bar length is this group's units short against the store's worst group */}
          <span className="absolute inset-y-0 left-0 rounded-full bg-gray-500" style={{ width: `${share}%` }} />
        </span>
        <span data-testid={matrixCellTestId(item)} className="w-10 text-right text-sm font-semibold tabular-nums text-gray-900">
          {formatUnits(item.units_short)}
        </span>
      </span>
      <span className="text-xs tabular-nums text-gray-500">{item.day90_units > 0 ? `${formatUnits(item.day90_units)} day 90+` : 'No day 90+'}</span>
    </Button>
  );
}

/** Bands lens: the group's band mix as one bar, then a button per band present that filters the worklist to it. */
function BandsCell({ item, isSelected, onSelect }: CellProps): React.ReactNode {
  if (!item.bands) return <span className="px-2 text-xs text-gray-500">{EMPTY}</span>;
  const mix = bandMix(item.bands, BAND_FILTERS);
  const total = mix.reduce((sum, entry) => sum + entry.count, 0);
  if (!total) return <span className="px-2 text-xs text-gray-500">No options</span>;
  return (
    <div className={cn('space-y-1 rounded-lg px-2 py-1.5', isSelected && 'bg-primary/10')}>
      <div className="flex h-1.5 gap-px overflow-hidden rounded-full bg-gray-100" aria-hidden>
        {mix.map((entry) => (
          // eslint-disable-next-line no-restricted-syntax -- segment width is this band's share of the group's options
          <span key={entry.band} className={BAND_TONE[entry.band]} style={{ width: `${(entry.count / total) * PERCENT}%` }} />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-1 gap-y-0.5" aria-label={`${groupName(item)} by band`}>
        {mix.map((entry) => (
          <li key={entry.band}>
            <Button
              variant="ghost"
              size="sm"
              data-testid={`${matrixCellTestId(item)}-${entry.band}`}
              aria-label={`${groupName(item)}: ${formatUnits(entry.count)} ${BAND_LABEL[entry.band]}; filter the worklist`}
              onClick={() => onSelect(entry.band)}
              className="h-auto min-h-11 gap-1 px-1 py-0.5 text-xs font-normal text-gray-700 md:min-h-0"
            >
              <span aria-hidden className={cn('size-2 rounded-full', BAND_TONE[entry.band])} />
              <span title={BAND_LABEL[entry.band]}>{BAND_SHORT[entry.band]}</span>
              <span className="font-medium tabular-nums text-gray-900">{formatUnits(entry.count)}</span>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The space flag a group carries; a group can be both below floor and overfilled (§2.8). */
function spaceFlag(space: SpaceFill): { label: string; tone: 'error' | 'warning' | 'success' | 'outline'; also: string | null } {
  if (space.no_plan) return { label: 'No plan', tone: 'outline', also: null };
  if (space.below_floor) return { label: 'Below floor', tone: 'warning', also: space.overfilled ? 'Overfilled' : null };
  if (space.overfilled) return { label: 'Overfilled', tone: 'error', also: null };
  return { label: 'Within plan', tone: 'success', also: null };
}

function FillBar({ label, value, floor }: { readonly label: string; readonly value: number | null; readonly floor: number }): React.ReactNode {
  const width = value === null ? 0 : Math.min(1, value / FILL_SCALE) * PERCENT;
  return (
    <span className="flex items-center gap-1.5 text-xs tabular-nums text-gray-600">
      <span className="w-11 shrink-0">{label}</span>
      <span className="relative h-1.5 min-w-12 flex-1 rounded-full bg-gray-100" aria-hidden>
        {/* eslint-disable-next-line no-restricted-syntax -- fill bar length is this group's fill on a 0-150% scale */}
        <span className="absolute inset-y-0 left-0 rounded-full bg-gray-500" style={{ width: `${width}%` }} />
        {/* eslint-disable-next-line no-restricted-syntax -- marker position is the floor on the same scale */}
        <span className="absolute -inset-y-0.5 w-px bg-gray-900" style={{ left: `${(floor / FILL_SCALE) * PERCENT}%` }} />
        {/* eslint-disable-next-line no-restricted-syntax -- marker position is the 120% overfill line on the same scale */}
        <span className="absolute -inset-y-0.5 w-px bg-gray-400" style={{ left: `${(OVERFILL / FILL_SCALE) * PERCENT}%` }} />
      </span>
      <span className="w-9 shrink-0 text-right">{formatPercent(value)}</span>
    </span>
  );
}

/** Space lens: options and units fill with their floors and the overfill line, and the flag in words. */
function SpaceCell({ item, isSelected, onSelect }: CellProps): React.ReactNode {
  if (!item.space) return <span className="px-2 text-xs text-gray-500" title="Unmapped groups have no space plan">{EMPTY}</span>;
  const flag = spaceFlag(item.space);
  const flagId = `space-flag-${item.segment ?? 'none'}-${item.brick_key}-${item.grade_class}`;
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-pressed={isSelected}
      onClick={() => onSelect()}
      aria-label={`${groupName(item)}: ${flag.label}${flag.also ? ` and ${flag.also}` : ''}, options fill ${formatPercent(item.space.options_fill)}, units fill ${formatPercent(item.space.units_fill)}. Filter the worklist.`}
      className={cn('h-auto min-h-11 w-full flex-col items-stretch gap-1 whitespace-normal px-2 py-1.5 text-left font-normal', isSelected && 'bg-primary/10 hover:bg-primary/10')}
    >
      <span className="flex flex-wrap items-center gap-1">
        <Badge variant={flag.tone} size="sm">
          <span data-testid={flagId}>{flag.label}</span>
        </Badge>
        {flag.also ? <Badge variant="error" size="sm">{flag.also}</Badge> : null}
      </span>
      {item.space.no_plan ? null : (
        <>
          {item.space.floor_rule === 'units_only' ? null : <FillBar label="Options" value={item.space.options_fill} floor={OPTIONS_FLOOR} />}
          <FillBar label="Units" value={item.space.units_fill} floor={UNITS_FLOOR} />
          {item.space.plan_qty_source === 'fallback_depth' ? <span className="text-xs text-gray-500">{fallbackDepthText(item.space.depth)}</span> : null}
        </>
      )}
    </Button>
  );
}

function MatrixError({ error, onRetry }: { readonly error: unknown; readonly onRetry: () => void }): React.ReactNode {
  const message = error instanceof StyleActionsApiError ? `${error.message} (${error.code})` : 'The Style Actions backend could not be reached.';
  return (
    <div role="alert" data-testid="brick-matrix-error" className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-gray-200 px-3 py-3 text-xs text-gray-600">
      <span>Brick view could not be loaded: {message}</span>
      <Button variant="outline" size="sm" onClick={onRetry} className="min-h-11 md:min-h-0">Retry</Button>
    </div>
  );
}

function rowTotal(row: MatrixRow, lens: MatrixLens): React.ReactNode {
  const cells = Object.values(row.cells).filter((item): item is StoreBrickRow => Boolean(item));
  if (lens === 'space') {
    const flagged = cells.filter((item) => item.space && (item.space.below_floor || item.space.overfilled)).length;
    return <span className="block font-semibold text-gray-900">{flagged ? `${formatUnits(flagged)} flagged` : EMPTY}</span>;
  }
  if (lens === 'bands') {
    const options = cells.reduce((sum, item) => sum + item.options, 0);
    return <span className="block font-semibold text-gray-900">{formatUnits(options)} {options === 1 ? 'option' : 'options'}</span>;
  }
  return (
    <>
      <span className="block font-semibold text-gray-900">{formatUnits(row.unitsShort)}</span>
      {row.day90Units > 0 ? <span className="block">{formatUnits(row.day90Units)} day 90+</span> : null}
    </>
  );
}

/** The footer describes the whole list in the lens being read (S2-C67 L2). */
function lensTotals(lens: MatrixLens, items: readonly StoreBrickRow[], groups: number, totalShort: number, totalDay90: number): string {
  const head = `${formatUnits(groups)} ${groups === 1 ? 'group' : 'groups'}`;
  if (lens === 'bands') {
    const sums = BAND_FILTERS.map((band) => ({ band, count: items.reduce((sum, item) => sum + (item.bands?.[band] ?? 0), 0) })).filter((entry) => entry.count > 0);
    return [head, ...sums.map((entry) => `${formatUnits(entry.count)} ${BAND_LABEL[entry.band]}`)].join(' · ');
  }
  if (lens === 'space') {
    const spaced = items.filter((item) => item.space);
    const flagged = spaced.filter((item) => item.space && !item.space.no_plan && (item.space.below_floor || item.space.overfilled)).length;
    const noPlan = spaced.filter((item) => item.space?.no_plan).length;
    const within = spaced.length - flagged - noPlan;
    return `${head} · ${formatUnits(flagged)} flagged · ${formatUnits(within)} within plan · ${formatUnits(noPlan)} without a plan`;
  }
  return `${head} · ${formatUnits(totalShort)} units short · ${formatUnits(totalDay90)} day 90+ units in all`;
}

interface LensSwitchProps {
  readonly lens: MatrixLens;
  readonly onLens: (lens: MatrixLens) => void;
  readonly contentParts: ContentParts;
}

/** Units short on every snapshot; Bands and Space only when the snapshot holds them (S2-C27 condition, S2-C28). */
function LensSwitch({ lens, onLens, contentParts }: LensSwitchProps): React.ReactNode {
  return (
    <ToggleGroup value={lens} onValueChange={(value) => onLens(value === 'bands' || value === 'space' ? value : 'scope1')} aria-label="Matrix lens">
      <ToggleGroupItem value="scope1" data-testid="lens-scope1" className="h-7 min-h-11 px-2 text-xs md:min-h-0">Units short</ToggleGroupItem>
      {contentParts.health ? <ToggleGroupItem value="bands" data-testid="lens-bands" className="h-7 min-h-11 px-2 text-xs md:min-h-0">Bands</ToggleGroupItem> : null}
      {contentParts.space ? <ToggleGroupItem value="space" data-testid="lens-space" className="h-7 min-h-11 px-2 text-xs md:min-h-0">Space</ToggleGroupItem> : null}
    </ToggleGroup>
  );
}

/**
 * The store's segment × brick × grade matrix, worst first; it leads the workspace (S2-C27). Units short works on every
 * snapshot; Bands and Space join when the snapshot holds them. Search and paging run over the loaded groups (S2-C44).
 */
export function BrickMatrix(props: BrickMatrixProps): React.ReactNode {
  const { snapshotId, storeCode, cell, onCell, lens: requestedLens, onLens, contentParts, query, page, onQuery, onPage } = props;
  const bricks = useStoreBricks(snapshotId, storeCode);
  const isLensMissing = (requestedLens === 'bands' && !contentParts.health) || (requestedLens === 'space' && !contentParts.space);
  const lens: MatrixLens = isLensMissing ? 'scope1' : requestedLens;
  let body: React.ReactNode;
  let footer: React.ReactNode = null;
  if (bricks.isLoading) {
    body = (
      <div className="space-y-1.5" aria-busy="true" aria-label="Loading brick view">
        {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-9 w-full" />)}
      </div>
    );
  } else if (bricks.error || !bricks.data) {
    body = <MatrixError error={bricks.error} onRetry={() => void bricks.refetch()} />;
  } else if (!bricks.data.items.length) {
    body = <EmptyState title="No brick groups" description={`Store ${storeCode} has no options grouped by brick in this snapshot.`} />;
  } else {
    const items = bricks.data.items;
    const allRows = matrixRows(items);
    const rows = allRows.filter((row) => matchesQuery([row.segment, row.brick, row.brickKey], query));
    const grades = matrixGrades(items);
    const maxShort = Math.max(0, ...items.map((item) => item.units_short));
    const selectedIndex = rows.findIndex((row) => Object.values(row.cells).some((item) => item && sameCell(item, cell)));
    const slice = pageSlice(rows, MATRIX_PAGE_SIZE, page, selectedIndex);
    const totalShort = items.reduce((sum, item) => sum + item.units_short, 0);
    const totalDay90 = items.reduce((sum, item) => sum + item.day90_units, 0);
    footer = (
      <p className="text-xs tabular-nums text-gray-500">
        {lensTotals(lens, items, allRows.length, totalShort, totalDay90)}
        {query ? ` · showing ${formatUnits(rows.length)} of ${formatUnits(allRows.length)} groups` : ''}
      </p>
    );
    if (!rows.length) {
      body = (
        <EmptyState
          title={`No brick matches "${query}"`}
          description="Search looks at segment and brick names."
          action={
            <Button variant="outline" size="sm" data-testid="brick-matrix-clear-search" onClick={() => onQuery('')} className="min-h-11 md:min-h-0">
              Clear search
            </Button>
          }
        />
      );
    } else {
      body = (
        <>
          <DataTable className="relative" minWidth={`${MIN_TABLE_WIDTH + (lens === 'space' ? SPACE_COLUMN_WIDTH : GRADE_COLUMN_WIDTH) * grades.length}px`}>
            <caption className="sr-only">{`${LENS_HINT[lens]} Store ${storeCode}.`}</caption>
            <DataTableHeader>
              <DataTableHead>Segment · brick</DataTableHead>
              {grades.map((grade) => (
                <DataTableHead key={grade}>{grade === 'Unmapped' ? <Term help={GLOSSARY.unmapped}>Unmapped</Term> : grade}</DataTableHead>
              ))}
              <DataTableHead align="right">Row total</DataTableHead>
            </DataTableHeader>
            <DataTableBody>
              {slice.items.map((row) => (
                <DataTableRow key={row.key} className="hover:bg-transparent">
                  <DataTableCell className="py-1.5 font-medium text-gray-900">{rowLabel(row)}</DataTableCell>
                  {grades.map((grade) => {
                    const item = row.cells[grade];
                    if (!item) {
                      return (
                        <DataTableCell key={grade} className="px-1 py-1">
                          <span className="sr-only">No {grade} options</span>
                        </DataTableCell>
                      );
                    }
                    const isSelected = sameCell(item, cell);
                    const select = (band?: BandFilter): void => onCell({ segment: item.segment, brick: item.brick_key, grade: item.grade_class }, band);
                    return (
                      <DataTableCell key={grade} className="px-1 py-1">
                        {lens === 'scope1' ? <UnitsShortCell item={item} isSelected={isSelected} onSelect={select} maxShort={maxShort} /> : null}
                        {lens === 'bands' ? <BandsCell item={item} isSelected={isSelected} onSelect={select} /> : null}
                        {lens === 'space' ? <SpaceCell item={item} isSelected={isSelected} onSelect={select} /> : null}
                      </DataTableCell>
                    );
                  })}
                  <DataTableCell align="right" className="py-1.5 text-xs tabular-nums text-gray-600">{rowTotal(row, lens)}</DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
          <Pager page={slice.page} pages={slice.pages} onPage={onPage} testid="brick-matrix-pager" />
        </>
      );
    }
  }
  return (
    <Card className="min-w-0 space-y-2 p-3" data-testid="brick-matrix">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 xl:flex-1">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            Brick health
            <ProvenanceChip provenance="derived" note="Sums of the option measures in each group; the groups add up to the store figures" />
          </h2>
          <p className="text-xs text-gray-500">{LENS_HINT[lens]}</p>
        </div>
        {/* The section's one control row: search beside the lens switch, no row of its own (S2-C64). */}
        <div className="flex min-w-0 flex-col-reverse gap-2 md:flex-row md:items-center md:justify-between xl:shrink-0 xl:justify-end">
          {bricks.data?.items.length ? <ListSearch value={query} onSearch={onQuery} placeholder="Search bricks" testid="brick-matrix-search" /> : null}
          <LensSwitch lens={lens} onLens={onLens} contentParts={contentParts} />
        </div>
      </div>
      {body}
      {footer}
    </Card>
  );
}
