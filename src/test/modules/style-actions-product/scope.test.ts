import { describe, expect, it } from 'vitest';

import {
  availabilityText,
  availableRankings,
  bandMix,
  bandText,
  coverText,
  dcTitle,
  matchesQuery,
  pageSlice,
  trueRosWorking,
  flagBreakdown,
  DC_RANKINGS_2A,
  RANKING_LABEL,
  dcOverviewHref,
  deltaDisplay,
  matrixCellTestId,
  matrixGrades,
  matrixRows,
  needsExtension,
  parseRanking,
  rankingFigure,
  rankingWorklist,
  readySnapshots,
  resolveDc,
  resolveSnapshot,
  snapshotMeta,
  storesOfDc,
} from '@/modules/style-actions-product/components/scope';

import type { Comparison, DcItem, OptionHealth, Snapshot, StoreBrickRow, StoreSummary } from '@/modules/style-actions-product/api/types';

function snap(id: string, overrides: Partial<Snapshot> = {}): Snapshot {
  return {
    snapshot_id: id,
    as_of: '2026-09-29',
    dcs: ['S3KG', 'V012'],
    focus_stores: ['8080', '5943'],
    status: 'ready',
    source: 'fixture',
    query_version: 'scope1-v1',
    created_at: '2026-10-05T09:00:00+00:00',
    built_at: '2026-10-05T09:00:00+00:00',
    bytes_processed: 0,
    row_counts: {},
    finding_counts: {},
    error: null,
    store_count: 5,
    content_version: 1,
    content_parts: { health: false, space: false },
    history_range: null,
    extension: null,
    ...overrides,
  };
}

function store(code: string, dc: string, overrides: Partial<StoreSummary> = {}): StoreSummary {
  return {
    store_code: code,
    name: `Store ${code}`,
    city: 'Mumbai',
    format: 'TRENDS',
    dc_code: dc,
    is_focus: false,
    options: 1,
    saleable_units: 1,
    transit_units: 0,
    sales_14d_units: 0,
    grade_mix: { Fashion: 1, Ultimate: 0, Core: 0, Unmapped: 0 },
    finding_count: 0,
    cohorts: {},
    finding_counts: {},
    has_data: true,
    units_short: 0,
    day90_units: 0,
    deltas: null,
    bands: null,
    space: null,
    ...overrides,
  };
}

function brick(segment: string | null, key: string, grade: StoreBrickRow['grade_class'], short: number, day90 = 0): StoreBrickRow {
  return {
    segment,
    brick: key,
    brick_key: key,
    grade_class: grade,
    options: 1,
    live_options: 1,
    units: 1,
    units_short: short,
    units_short_options: short > 0 ? 1 : 0,
    day90_units: day90,
    day90_options: day90 > 0 ? 1 : 0,
    bands: null,
    space: null,
  };
}

const DCS: DcItem[] = [
  { dc_code: 'S3KG', name: 'DC S3KG', stores: 4, stores_with_data: 3 },
  { dc_code: 'V012', name: 'DC V012', stores: 1, stores_with_data: 1 },
];
const STORES = [store('8080', 'S3KG'), store('5943', 'S3KG'), store('9592', 'S3KG', { has_data: false }), store('TX3X', 'V012')];

describe('readySnapshots', () => {
  it('keeps ready snapshots only, newest build first (S2-C8)', () => {
    const list = [
      snap('a', { built_at: '2026-10-01T00:00:00+00:00' }),
      snap('b', { status: 'building', built_at: null }),
      snap('c', { built_at: '2026-10-03T00:00:00+00:00' }),
      snap('d', { status: 'failed', built_at: null }),
    ];
    expect(readySnapshots(list).map((item) => item.snapshot_id)).toEqual(['c', 'a']);
  });

  it('orders equal build times by creation time, newest first', () => {
    const list = [snap('a', { created_at: '2026-10-01T00:00:00+00:00' }), snap('b', { created_at: '2026-10-02T00:00:00+00:00' })];
    expect(readySnapshots(list).map((item) => item.snapshot_id)).toEqual(['b', 'a']);
  });
});

describe('resolveSnapshot', () => {
  const latest = snap('new', { built_at: '2026-10-05T10:00:00+00:00' });
  const legacy = snap('legacy', { as_of: '2026-09-22', built_at: '2026-10-05T08:00:00+00:00' });

  it('opens the latest ready snapshot when nothing was chosen', () => {
    expect(resolveSnapshot({ snapshots: [legacy, latest], urlSnap: null, savedSnap: null })).toEqual({ kind: 'ready', snapshot: latest, pendingId: null });
  });

  it('prefers the URL snapshot over the saved choice', () => {
    expect(resolveSnapshot({ snapshots: [legacy, latest], urlSnap: 'legacy', savedSnap: 'new' })).toMatchObject({ kind: 'ready', snapshot: legacy });
  });

  it('uses the saved choice when the URL names none', () => {
    expect(resolveSnapshot({ snapshots: [legacy, latest], urlSnap: null, savedSnap: 'legacy' })).toMatchObject({ kind: 'ready', snapshot: legacy });
  });

  it('keeps reading the latest ready snapshot while the chosen one builds', () => {
    const building = snap('b', { status: 'building', built_at: null });
    expect(resolveSnapshot({ snapshots: [building, latest], urlSnap: 'b', savedSnap: null })).toEqual({ kind: 'ready', snapshot: latest, pendingId: 'b' });
  });

  it('reports no snapshot, with the pending id, while the first build runs', () => {
    const building = snap('b', { status: 'building', built_at: null });
    expect(resolveSnapshot({ snapshots: [building], urlSnap: null, savedSnap: 'b' })).toEqual({ kind: 'none', pendingId: 'b' });
  });

  it('reports no snapshot when none is ready', () => {
    expect(resolveSnapshot({ snapshots: [], urlSnap: null, savedSnap: null })).toEqual({ kind: 'none', pendingId: null });
  });

  it('never switches silently away from a chosen snapshot that is no longer listed (S2-C7)', () => {
    expect(resolveSnapshot({ snapshots: [latest], urlSnap: 'gone', savedSnap: null })).toEqual({ kind: 'unlisted', requestedId: 'gone', latest });
    expect(resolveSnapshot({ snapshots: [latest], urlSnap: null, savedSnap: 'gone' })).toEqual({ kind: 'unlisted', requestedId: 'gone', latest });
  });

  it('reports a chosen snapshot whose build failed', () => {
    const failed = snap('f', { status: 'failed', built_at: null, error: 'boom' });
    expect(resolveSnapshot({ snapshots: [failed, latest], urlSnap: 'f', savedSnap: null })).toEqual({ kind: 'failed', snapshot: failed, latest });
  });
});

describe('resolveDc', () => {
  it('derives the DC from a store named in the URL, even against a different dc parameter', () => {
    expect(resolveDc({ dcs: DCS, stores: STORES, urlDc: 'S3KG', urlStore: 'TX3X', savedStore: null })).toEqual({ dcCode: 'V012', isInSnapshot: true });
  });

  it('uses the dc parameter when no listed store is named', () => {
    expect(resolveDc({ dcs: DCS, stores: STORES, urlDc: 'V012', urlStore: 'ZZZ9', savedStore: '8080' })).toEqual({ dcCode: 'V012', isInSnapshot: true });
  });

  it('flags a dc parameter that is not in the snapshot', () => {
    expect(resolveDc({ dcs: DCS, stores: STORES, urlDc: 'N4DC', urlStore: null, savedStore: null })).toEqual({ dcCode: 'N4DC', isInSnapshot: false });
  });

  it('falls back to the saved store, then the first DC with data, then the first DC', () => {
    expect(resolveDc({ dcs: DCS, stores: STORES, urlDc: null, urlStore: null, savedStore: 'TX3X' })).toEqual({ dcCode: 'V012', isInSnapshot: true });
    const noData: DcItem[] = [{ dc_code: 'A', name: null, stores: 1, stores_with_data: 0 }, { dc_code: 'B', name: null, stores: 1, stores_with_data: 1 }];
    expect(resolveDc({ dcs: noData, stores: [], urlDc: null, urlStore: null, savedStore: null })).toEqual({ dcCode: 'B', isInSnapshot: true });
    expect(resolveDc({ dcs: [{ dc_code: 'A', name: null, stores: 0, stores_with_data: 0 }], stores: [], urlDc: null, urlStore: null, savedStore: null })).toEqual({
      dcCode: 'A',
      isInSnapshot: true,
    });
  });

  it('returns no DC for a snapshot without DCs', () => {
    expect(resolveDc({ dcs: [], stores: [], urlDc: null, urlStore: null, savedStore: null })).toEqual({ dcCode: null, isInSnapshot: false });
  });
});

describe('storesOfDc', () => {
  it('keeps the chosen DC stores only', () => {
    expect(storesOfDc(STORES, 'S3KG').map((item) => item.store_code)).toEqual(['8080', '5943', '9592']);
    expect(storesOfDc(STORES, null)).toEqual([]);
  });
});

describe('deltaDisplay', () => {
  const compared: Comparison = { status: 'compared', snapshot_id: 'legacy', as_of: '2026-09-22', built_at: '2026-10-05T08:00:00+00:00' };

  it('signs a compared change with plus or U+2212 minus, and 0 for no change', () => {
    expect(deltaDisplay(10, compared).text).toBe('+10');
    expect(deltaDisplay(-4, compared).text).toBe('−4');
    expect(deltaDisplay(0, compared).text).toBe('0');
    expect(deltaDisplay(1234, compared).text).toBe('+1,234');
    expect(deltaDisplay(10, compared).reason).toBe('Change since the Sep 22, 2026 snapshot');
  });

  it('rounds a delta before signing it, so a sub-unit change reads 0, never +0 or −0 (S2-C42)', () => {
    expect(deltaDisplay(0.4, compared).text).toBe('0');
    expect(deltaDisplay(-0.4, compared).text).toBe('0');
    expect(deltaDisplay(5.25, compared).text).toBe('+5');
    expect(deltaDisplay(-17.7, compared).text).toBe('−18');
  });

  it('shows an em dash with the reason when there is nothing to compare', () => {
    expect(deltaDisplay(null, { status: 'no_previous', snapshot_id: null, as_of: null, built_at: null })).toEqual({
      text: '—',
      reason: 'No earlier snapshot of these DCs is kept',
    });
    expect(deltaDisplay(3, { ...compared, status: 'same_as_of' })).toEqual({ text: '—', reason: 'The previous snapshot has the same as-of date' });
    expect(deltaDisplay(null, compared)).toEqual({ text: '—', reason: 'Not in the Sep 22, 2026 snapshot' });
    expect(deltaDisplay(5, null)).toEqual({ text: '—', reason: 'No comparison loaded' });
  });

  it('appends a note to the reason of a compared change', () => {
    expect(deltaDisplay(1, compared, 'Counts may cross content versions').reason).toBe('Change since the Sep 22, 2026 snapshot. Counts may cross content versions');
  });
});

describe('rankings', () => {
  it('offers the three 2a rankings with their labels', () => {
    expect(DC_RANKINGS_2A).toEqual(['units_short', 'day90_stock', 'data_gaps']);
    expect(RANKING_LABEL.data_gaps).toBe('Data gaps');
    expect(RANKING_LABEL.day90_stock).toBe('Day 90+ stock');
  });

  it('parses a ranking parameter, defaulting to units short', () => {
    expect(parseRanking('data_gaps')).toBe('data_gaps');
    expect(parseRanking('worst_fill')).toBe('worst_fill');
    expect(parseRanking('bogus')).toBe('units_short');
    expect(parseRanking(null)).toBe('units_short');
  });

  it('reads the ranked figure of a store, null where the snapshot lacks it', () => {
    const item = store('8080', 'S3KG', { units_short: 13, day90_units: 3, finding_count: 7 });
    expect(rankingFigure(item, 'units_short')).toBe(13);
    expect(rankingFigure(item, 'day90_stock')).toBe(3);
    expect(rankingFigure(item, 'data_gaps')).toBe(7);
    expect(rankingFigure(item, 'most_under')).toBeNull();
    expect(rankingFigure(item, 'worst_fill')).toBeNull();
    const rich = store('8080', 'S3KG', {
      bands: { supply_constrained: 0, over: 0, on_track: 0, watch: 1, under: 2, unmeasurable: 0, core: 0, no_gap: 0 },
      space: { groups: 5, planned_groups: 5, no_plan: 0, below_floor: 2, overfilled: 1, flagged: 3, in_band: 2, plan_options: 8, plan_qty: 74.25, planned_live_options: 6, planned_units: 77, options_fill: 0.75, units_fill: 1.037 },
    });
    expect(rankingFigure(rich, 'most_under')).toBe(2);
    expect(rankingFigure(rich, 'worst_fill')).toBe(3);
  });

  it('opens the store workspace sorted to match the ranking', () => {
    expect(rankingWorklist('units_short')).toEqual({ seg: null, sort: 'shortfall_desc' });
    expect(rankingWorklist('day90_stock')).toEqual({ seg: 'exit', sort: 'on_hand_desc' });
    expect(rankingWorklist('data_gaps')).toEqual({ panel: 'health', scope: 'store' });
    expect(rankingWorklist('most_under')).toEqual({ band: 'under' });
    expect(rankingWorklist('worst_fill')).toEqual({ lens: 'space' });
  });
});

describe('dcOverviewHref', () => {
  it('links to the DC with snapshot, ranking and the row to return to', () => {
    expect(dcOverviewHref('S3KG', { snap: 'snap_1', ranking: 'data_gaps', store: '9591' })).toBe('/style-actions-product/dc/S3KG?snap=snap_1&ranking=data_gaps&store=9591');
    expect(dcOverviewHref('S 3', { ranking: 'units_short' })).toBe('/style-actions-product/dc/S%203');
  });
});

describe('snapshot picker facts', () => {
  it('describes a snapshot by DCs, stores and build time', () => {
    expect(snapshotMeta(snap('a'))).toMatch(/^Distribution Centres S3KG, V012 · 5 stores · built Oct 05, 2026/);
    expect(snapshotMeta(snap('a', { store_count: 1, built_at: null }))).toBe('Distribution Centres S3KG, V012 · 1 store');
    expect(snapshotMeta(snap('a', { dcs: ['S3KG'], store_count: 4, built_at: null }))).toBe('Distribution Centre S3KG · 4 stores');
    expect(snapshotMeta(snap('a', { store_count: null }))).toMatch(/^Distribution Centres S3KG, V012 · built/);
  });

  it('marks a snapshot older than what the server computes', () => {
    expect(needsExtension(snap('a', { content_version: 1 }), 2)).toBe(true);
    expect(needsExtension(snap('a', { content_version: 2 }), 2)).toBe(false);
    expect(needsExtension(snap('a'), null)).toBe(false);
  });
});

describe('brick matrix', () => {
  const items = [
    brick('MEN', 'SHIRT', 'Ultimate', 2),
    brick('WOMEN', 'TOP', 'Fashion', 8, 1),
    brick('WOMEN', 'TOP', 'Core', 0, 4),
    brick(null, 'BAG', 'Unmapped', 0),
    brick('MEN', 'JEANS', 'Fashion', 2, 3),
  ];

  it('groups by segment and brick, worst units short first, then day 90+ units', () => {
    const rows = matrixRows(items);
    expect(rows.map((row) => row.key)).toEqual(['WOMEN|TOP', 'MEN|JEANS', 'MEN|SHIRT', '|BAG']);
    expect(rows[0]?.unitsShort).toBe(8);
    expect(rows[0]?.day90Units).toBe(5);
    expect(rows[0]?.cells.Core?.day90_units).toBe(4);
  });

  it('lists only the grade classes present, in grade order', () => {
    expect(matrixGrades(items)).toEqual(['Fashion', 'Ultimate', 'Core', 'Unmapped']);
    expect(matrixGrades([brick('MEN', 'SHIRT', 'Core', 1)])).toEqual(['Core']);
  });

  it('names cells for the journeys, with "none" for a missing segment', () => {
    expect(matrixCellTestId(brick('WOMEN', 'TOP', 'Fashion', 1))).toBe('matrix-cell-WOMEN-TOP-Fashion');
    expect(matrixCellTestId(brick(null, 'BAG', 'Unmapped', 0))).toBe('matrix-cell-none-BAG-Unmapped');
  });
});

function health(overrides: Partial<OptionHealth> = {}): OptionHealth {
  return {
    band: 'over',
    no_band_reason: null,
    availability_basis: 'life',
    pivotal_sizes: ['M', 'L'],
    eligible_units: 24,
    qualified_units: 15,
    qualifying_days: 3,
    veto_valid_days: 13,
    true_ros_daily: 5,
    true_ros_30d: 150,
    unmeasurable_reason: null,
    availability_14d: 0.2308,
    availability_life: 0.2857,
    life_coverage: 1,
    life_unavailable_reason: null,
    first_seen: '2026-09-14',
    weeks_of_cover: 0.97,
    cover_reason: null,
    duplicate_rows: 0,
    ...overrides,
  };
}

describe('paging and search over loaded lists (S2-C44)', () => {
  const items = Array.from({ length: 23 }, (_, index) => index);

  it('opens the first page by default, the selected item\'s page when there is one, and an explicit page over both', () => {
    expect(pageSlice(items, 10, null, -1)).toEqual({ items: items.slice(0, 10), page: 1, pages: 3, total: 23 });
    expect(pageSlice(items, 10, null, 21).page).toBe(3);
    expect(pageSlice(items, 10, 2, 21).page).toBe(2);
    expect(pageSlice(items, 10, 9, -1).page).toBe(3);
    expect(pageSlice([], 10, null, -1)).toEqual({ items: [], page: 1, pages: 1, total: 0 });
  });

  it('matches any field, ignoring case and blank queries', () => {
    expect(matchesQuery(['WOMEN', 'TOP'], 'top')).toBe(true);
    expect(matchesQuery(['8080', 'RRL Trends', 'Mumbai'], 'mum')).toBe(true);
    expect(matchesQuery(['MEN', null], 'kurta')).toBe(false);
    expect(matchesQuery(['MEN'], '  ')).toBe(true);
  });
});

describe('health display (S2-R11)', () => {
  it('names the band, or why there is none', () => {
    expect(bandText(health())).toBe('Over');
    expect(bandText(health({ band: null, no_band_reason: 'unmeasurable' }))).toBe('Unmeasurable');
    expect(bandText(health({ band: null, no_band_reason: 'core' }))).toBe('Core');
    expect(bandText(health({ band: null, no_band_reason: null }))).toBe('—');
  });

  it('shows cover in weeks, "No sales" for a zero rate and an em dash when unmeasurable', () => {
    expect(coverText(health())).toBe('1.0 wk');
    expect(coverText(health({ weeks_of_cover: null, cover_reason: 'zero_rate' }))).toBe('No sales');
    expect(coverText(health({ weeks_of_cover: null, cover_reason: 'unmeasurable_rate' }))).toBe('—');
  });

  it('shows the availability the band used', () => {
    expect(availabilityText(health())).toBe('29%');
    expect(availabilityText(health({ availability_basis: 'observation' }))).toBe('23%');
    expect(availabilityText(health({ availability_basis: null }))).toBe('—');
  });

  it('writes the True ROS working in whole units (S2-C42)', () => {
    expect(trueRosWorking(health())).toBe('15 units ÷ 3 days × 30 = 150 per 30 days');
    expect(trueRosWorking(health({ qualified_units: 4, qualifying_days: 1, true_ros_daily: 4, true_ros_30d: 120 }))).toBe('4 units ÷ 1 day × 30 = 120 per 30 days');
    // The case the review found: no rounded daily rate, so the working adds up (S2-C67 M3).
    expect(trueRosWorking(health({ qualified_units: 1, qualifying_days: 3, true_ros_daily: 0.3333, true_ros_30d: 10 }))).toBe('1 unit ÷ 3 days × 30 = 10 per 30 days');
    expect(trueRosWorking(health({ true_ros_daily: null, true_ros_30d: null }))).toBeNull();
  });

  it('orders band counts and leaves out empty bands', () => {
    const counts = { supply_constrained: 1, over: 2, on_track: 0, watch: 1, under: 3, unmeasurable: 2, core: 0, no_gap: 0 };
    expect(bandMix(counts, ['supply_constrained', 'under', 'watch', 'on_track', 'over', 'unmeasurable', 'core', 'no_gap']).map((entry) => entry.band)).toEqual([
      'supply_constrained',
      'under',
      'watch',
      'over',
      'unmeasurable',
    ]);
  });
});

describe('Distribution Centre titles and rankings (S2-C50, §2.4)', () => {
  it('titles a Distribution Centre by its name, or its code when the name is null or only "DC {code}"', () => {
    expect(dcTitle('S3KG', null)).toBe('S3KG');
    expect(dcTitle('S3KG', 'DC S3KG')).toBe('S3KG');
    expect(dcTitle('V012', 'Virar Distribution Centre')).toBe('Virar Distribution Centre');
  });

  it('offers Most Under with health and Worst fill with space', () => {
    expect(availableRankings({ health: false, space: false })).toEqual(['units_short', 'day90_stock', 'data_gaps']);
    expect(availableRankings({ health: true, space: true })).toEqual(['units_short', 'day90_stock', 'data_gaps', 'most_under', 'worst_fill']);
  });
});

describe('space flag breakdown (S2-C67 M6)', () => {
  const base = { groups: 0, planned_groups: 120, no_plan: 0, in_band: 34, plan_options: 0, plan_qty: 0, planned_live_options: 0, planned_units: 0, options_fill: null, units_fill: null };

  it('counts groups that are both below floor and overfilled once, so the parts add up', () => {
    expect(flagBreakdown({ ...base, flagged: 86, below_floor: 31, overfilled: 74 })).toBe('12 below floor only, 55 overfilled only, 19 both');
    expect(flagBreakdown({ ...base, flagged: 3, below_floor: 2, overfilled: 1 })).toBe('2 below floor, 1 overfilled');
  });
});
