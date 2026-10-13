import { formatDateTime } from '@/lib/utils';

import { BAND_LABEL, BASE_PATH, DC_LABEL, DC_LABEL_PLURAL, EMPTY, GRADE_CLASSES, formatDay, formatPercent, formatUnits, roundUnits } from './display';

import type { BandFilter, Comparison, ContentParts, DcItem, SpaceCounts, DcRanking, GradeClass, OptionHealth, OptionSort, Snapshot, StoreBrickRow, StoreSummary } from '../api/types';
import type { WorkspaceParam } from './display';

/** Scope 2a pure rules: which snapshot, DC and store a view reads, deltas, rankings and the brick matrix. */

const byNewest = (a: string | null, b: string | null): number => (b ?? '').localeCompare(a ?? '');

/** Ready snapshots, newest build first, then newest creation (S2-C8: "latest" orders by built_at). */
export function readySnapshots(snapshots: readonly Snapshot[]): Snapshot[] {
  return snapshots
    .filter((item) => item.status === 'ready')
    .sort((a, b) => byNewest(a.built_at, b.built_at) || byNewest(a.created_at, b.created_at));
}

export type SnapshotResolution =
  /** `pendingId` names a chosen snapshot that is still building while the ready one is read. */
  | { kind: 'ready'; snapshot: Snapshot; pendingId: string | null }
  | { kind: 'none'; pendingId: string | null }
  /** A chosen or linked snapshot that the list no longer holds: never switch silently (S2-C7). */
  | { kind: 'unlisted'; requestedId: string; latest: Snapshot | null }
  | { kind: 'failed'; snapshot: Snapshot; latest: Snapshot | null };

interface SnapshotChoice {
  readonly snapshots: readonly Snapshot[];
  readonly urlSnap: string | null;
  readonly savedSnap: string | null;
}

/** The URL's snapshot wins, then the user's saved choice, then the latest ready one (S2-R3). */
export function resolveSnapshot({ snapshots, urlSnap, savedSnap }: SnapshotChoice): SnapshotResolution {
  const ready = readySnapshots(snapshots);
  const latest = ready[0] ?? null;
  const requested = urlSnap ?? savedSnap;
  const listed = requested ? snapshots.find((item) => item.snapshot_id === requested) : undefined;
  if (requested && !listed) return { kind: 'unlisted', requestedId: requested, latest };
  if (listed?.status === 'ready') return { kind: 'ready', snapshot: listed, pendingId: null };
  if (listed?.status === 'failed') return { kind: 'failed', snapshot: listed, latest };
  const pendingId = listed?.status === 'building' ? listed.snapshot_id : null;
  return latest ? { kind: 'ready', snapshot: latest, pendingId } : { kind: 'none', pendingId };
}

interface DcChoice {
  readonly dcs: readonly DcItem[];
  readonly stores: readonly StoreSummary[];
  readonly urlDc: string | null;
  readonly urlStore: string | null;
  readonly savedStore: string | null;
}

/**
 * The DC a view opens on (S2-K35): the DC of a store named in the URL (links without `dc` derive it from
 * the store, and a store always wins), else the `dc` parameter, else the saved store's DC, else the first
 * DC with data, else the first DC.
 */
export function resolveDc({ dcs, stores, urlDc, urlStore, savedStore }: DcChoice): { dcCode: string | null; isInSnapshot: boolean } {
  const storeDc = (code: string | null): string | null => stores.find((item) => item.store_code === code)?.dc_code ?? null;
  const inSnapshot = (code: string): boolean => dcs.some((item) => item.dc_code === code);
  const fromUrlStore = storeDc(urlStore);
  if (fromUrlStore) return { dcCode: fromUrlStore, isInSnapshot: inSnapshot(fromUrlStore) };
  if (urlDc) return { dcCode: urlDc, isInSnapshot: inSnapshot(urlDc) };
  const fromSaved = storeDc(savedStore);
  if (fromSaved && inSnapshot(fromSaved)) return { dcCode: fromSaved, isInSnapshot: true };
  const fallback = dcs.find((item) => item.stores_with_data > 0) ?? dcs[0];
  return fallback ? { dcCode: fallback.dc_code, isInSnapshot: true } : { dcCode: null, isInSnapshot: false };
}

export function storesOfDc(stores: readonly StoreSummary[], dcCode: string | null): StoreSummary[] {
  return dcCode ? stores.filter((item) => item.dc_code === dcCode) : [];
}

export interface DeltaDisplay {
  text: string;
  reason: string;
}

/**
 * A headline figure's change vs the comparison snapshot (S2-R4): "+N", "−N" (U+2212) or "0"; an em dash
 * with the reason when there is no earlier snapshot, it has the same as-of date, or the row is absent there.
 */
export function deltaDisplay(value: number | null | undefined, comparison: Comparison | null, note?: string): DeltaDisplay {
  if (!comparison) return { text: EMPTY, reason: 'No comparison loaded' };
  if (comparison.status === 'no_previous') return { text: EMPTY, reason: 'No earlier snapshot of these DCs is kept' };
  if (comparison.status === 'same_as_of') return { text: EMPTY, reason: 'The previous snapshot has the same as-of date' };
  const date = formatDay(comparison.as_of);
  if (value === null || value === undefined) return { text: EMPTY, reason: `Not in the ${date} snapshot` };
  const reason = `Change since the ${date} snapshot${note ? `. ${note}` : ''}`;
  // Round first, sign after: +0.4 reads "0", never "+0" (S2-C42).
  const rounded = roundUnits(value);
  if (rounded === 0) return { text: '0', reason };
  return { text: rounded > 0 ? `+${formatUnits(rounded)}` : formatUnits(rounded), reason };
}

/** Rankings the 2a backend answers; Most Under (2b) and Worst fill (2c) need snapshot content. */
export const DC_RANKINGS_2A: readonly DcRanking[] = ['units_short', 'day90_stock', 'data_gaps'];
const DC_RANKINGS: readonly DcRanking[] = [...DC_RANKINGS_2A, 'most_under', 'worst_fill'];

export const RANKING_LABEL: Readonly<Record<DcRanking, string>> = {
  units_short: 'Units short',
  day90_stock: 'Day 90+ stock',
  data_gaps: 'Data gaps',
  most_under: 'Most Under',
  worst_fill: 'Worst fill',
};

/** What the ranked figure counts, for the row's accessible label and the column caption. */
export const RANKING_UNIT: Readonly<Record<DcRanking, string>> = {
  units_short: 'units short of the curve',
  day90_stock: 'units past day 90',
  data_gaps: 'data findings',
  most_under: 'options in Under',
  worst_fill: 'flagged space groups',
};

/** Rankings the snapshot can answer: Most Under needs health, Worst fill needs space (409 otherwise, §2.4). */
export function availableRankings(parts: ContentParts): DcRanking[] {
  return [...DC_RANKINGS_2A, ...(parts.health ? (['most_under'] as const) : []), ...(parts.space ? (['worst_fill'] as const) : [])];
}

export function parseRanking(value: string | null): DcRanking {
  return DC_RANKINGS.find((item) => item === value) ?? 'units_short';
}

/** The store's figure for a ranking; null where the snapshot does not hold it. */
export function rankingFigure(store: StoreSummary, ranking: DcRanking): number | null {
  switch (ranking) {
    case 'units_short':
      return store.units_short;
    case 'day90_stock':
      return store.day90_units;
    case 'data_gaps':
      return store.finding_count;
    case 'most_under':
      return store.bands?.under ?? null;
    case 'worst_fill':
      return store.space?.flagged ?? null;
    default: {
      const exhaustive: never = ranking;
      return exhaustive;
    }
  }
}

/**
 * Workspace parameters that open a store matching the Distribution Centre ranking it was picked from (S2-R2, S2-C67 M2):
 * units short sorts the worklist by shortfall; day 90+ opens the Day 90+ bucket by stock; Most Under filters the band;
 * Worst fill opens the space lens; data gaps opens Data health on This store.
 */
export function rankingWorklist(ranking: DcRanking): Partial<Record<WorkspaceParam, string | null>> {
  switch (ranking) {
    case 'units_short':
      return { seg: null, sort: 'shortfall_desc' satisfies OptionSort };
    case 'day90_stock':
      return { seg: 'exit', sort: 'on_hand_desc' satisfies OptionSort };
    case 'most_under':
      return { band: 'under' };
    case 'worst_fill':
      return { lens: 'space' };
    case 'data_gaps':
      return { panel: 'health', scope: 'store' };
    default: {
      const exhaustive: never = ranking;
      return exhaustive;
    }
  }
}

/** DC overview link; the default ranking is left out of the URL. */
export function dcOverviewHref(dcCode: string, params: { snap?: string | null; ranking?: DcRanking; store?: string | null }): string {
  const search = new URLSearchParams();
  if (params.snap) search.set('snap', params.snap);
  if (params.ranking && params.ranking !== 'units_short') search.set('ranking', params.ranking);
  if (params.store) search.set('store', params.store);
  const query = search.toString();
  return `${BASE_PATH}/dc/${encodeURIComponent(dcCode)}${query ? `?${query}` : ''}`;
}

/** Workspace parameters a link into the store carries from the DC overview. */
export function storeLinkParams(snap: string, dcCode: string, storeCode: string, ranking: DcRanking): Partial<Record<WorkspaceParam, string | null>> {
  return { snap, dc: dcCode, store: storeCode, ranking: ranking === 'units_short' ? null : ranking, ...rankingWorklist(ranking) };
}

/** The picker's second line: DCs, stores and build time. */
export function snapshotMeta(snapshot: Snapshot): string {
  const parts = [`${snapshot.dcs.length === 1 ? DC_LABEL : DC_LABEL_PLURAL} ${snapshot.dcs.join(', ')}`];
  if (snapshot.store_count !== null) parts.push(`${formatUnits(snapshot.store_count)} ${snapshot.store_count === 1 ? 'store' : 'stores'}`);
  if (snapshot.built_at) parts.push(`built ${formatDateTime(snapshot.built_at)}`);
  return parts.join(' · ');
}

/** True when the server computes more than the snapshot holds (health or space not yet computed, S2-R20). */
export function needsExtension(snapshot: Snapshot, serverVersion: number | null): boolean {
  return serverVersion !== null && snapshot.content_version < serverVersion;
}

export interface MatrixRow {
  key: string;
  segment: string | null;
  brick: string | null;
  brickKey: string;
  cells: Partial<Record<GradeClass, StoreBrickRow>>;
  unitsShort: number;
  day90Units: number;
}

/** Store groups as matrix rows (segment × brick, a cell per grade), worst units short first, then day 90+ units. */
export function matrixRows(items: readonly StoreBrickRow[]): MatrixRow[] {
  const rows = new Map<string, MatrixRow>();
  items.forEach((item) => {
    const key = `${item.segment ?? ''}|${item.brick_key}`;
    const row = rows.get(key) ?? { key, segment: item.segment, brick: item.brick, brickKey: item.brick_key, cells: {}, unitsShort: 0, day90Units: 0 };
    row.cells[item.grade_class] = item;
    row.unitsShort += item.units_short;
    row.day90Units += item.day90_units;
    rows.set(key, row);
  });
  return [...rows.values()].sort(
    (a, b) => b.unitsShort - a.unitsShort || b.day90Units - a.day90Units || (a.segment ?? '').localeCompare(b.segment ?? '') || a.brickKey.localeCompare(b.brickKey),
  );
}

/** Grade classes present among the groups, in grade order. */
export function matrixGrades(items: readonly StoreBrickRow[]): GradeClass[] {
  return GRADE_CLASSES.filter((grade) => items.some((item) => item.grade_class === grade));
}

/** Journey test id of a Scope 1 cell (contract §12): `matrix-cell-<segment>-<brick_key>-<grade>`, segment `none` when null. */
export function matrixCellTestId(item: StoreBrickRow): string {
  return `matrix-cell-${item.segment ?? 'none'}-${item.brick_key}-${item.grade_class}`;
}

/** Case- and accent-insensitive "contains" over a row's searchable fields (S2-C44 client-side search). */
export function matchesQuery(fields: readonly (string | null | undefined)[], query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((field) => field?.toLowerCase().includes(needle));
}

export interface PageSlice<T> {
  items: T[];
  page: number;
  pages: number;
  total: number;
}

/**
 * One page of an already-loaded list. The page shown is the explicit page when given (clamped), else the page holding
 * the selected item, else page 1, so a selected cell or store stays visible (S2-C44, S2-C46).
 */
export function pageSlice<T>(items: readonly T[], size: number, explicitPage: number | null, selectedIndex: number): PageSlice<T> {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const fromSelection = selectedIndex >= 0 ? Math.floor(selectedIndex / size) + 1 : 1;
  const page = Math.min(pages, Math.max(1, explicitPage ?? fromSelection));
  return { items: items.slice((page - 1) * size, page * size), page, pages, total: items.length };
}

/** The band an option shows, or why it has none: "Unmeasurable", "Core", "No gap" (S2-D16, S2-C17). */
export function bandOf(health: OptionHealth): BandFilter | null {
  if (health.band) return health.band;
  return health.no_band_reason;
}

export function bandText(health: OptionHealth): string {
  const band = bandOf(health);
  return band ? BAND_LABEL[band] : EMPTY;
}

/** Weeks of cover: "No sales" for a measurable zero rate (S2-C13), an em dash when the rate is unmeasurable. */
export function coverText(health: OptionHealth): string {
  if (health.cover_reason === 'zero_rate') return 'No sales';
  if (health.weeks_of_cover === null) return EMPTY;
  return `${health.weeks_of_cover.toFixed(1)} wk`;
}

/** The availability the band used: whole life when its coverage is enough, else the 14 days (S2-D15). */
export function basisAvailability(health: OptionHealth): { value: number | null; basis: 'life' | 'observation' | null } {
  if (health.availability_basis === 'life') return { value: health.availability_life, basis: 'life' };
  if (health.availability_basis === 'observation') return { value: health.availability_14d, basis: 'observation' };
  return { value: null, basis: null };
}

export function availabilityText(health: OptionHealth): string {
  return formatPercent(basisAvailability(health).value);
}

/**
 * "15 units ÷ 3 days × 30 = 150 per 30 days": whole units only (S2-C42) and no rounded daily rate, so the working adds
 * up (S2-C67 M3); null when unmeasurable.
 */
export function trueRosWorking(health: OptionHealth): string | null {
  if (health.true_ros_30d === null) return null;
  const units = health.qualified_units;
  const days = health.qualifying_days;
  return `${formatUnits(units)} ${roundUnits(units) === 1 ? 'unit' : 'units'} ÷ ${days} ${days === 1 ? 'day' : 'days'} × 30 = ${formatUnits(health.true_ros_30d)} per 30 days`;
}

/** Ordered band counts for a mix bar, zero counts left out. */
export function bandMix(counts: Readonly<Record<BandFilter, number>>, order: readonly BandFilter[]): { band: BandFilter; count: number }[] {
  return order.map((band) => ({ band, count: counts[band] })).filter((item) => item.count > 0);
}

/** The Distribution Centre title: its name, or the code when the name is null or only "DC {code}" (S2-C50). */
export function dcTitle(dcCode: string, name: string | null | undefined): string {
  if (!name || name.trim() === `DC ${dcCode}` || name.trim() === dcCode) return dcCode;
  return name.trim();
}

/**
 * "31 below floor only, 55 overfilled only, 19 both": a group can be both, so the parts are counted exclusively and add
 * up to the flagged total (S2-C67 M6).
 */
export function flagBreakdown(space: SpaceCounts): string {
  const both = Math.max(0, space.below_floor + space.overfilled - space.flagged);
  if (!both) return `${formatUnits(space.below_floor)} below floor, ${formatUnits(space.overfilled)} overfilled`;
  return `${formatUnits(space.below_floor - both)} below floor only, ${formatUnits(space.overfilled - both)} overfilled only, ${formatUnits(both)} both`;
}

