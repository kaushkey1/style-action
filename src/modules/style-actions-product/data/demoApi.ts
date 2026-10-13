/** Deterministic, local-only fixture API. Every total is derived from the same option/store rows. */
import type {
  BandCounts, Cohort, Comparison, DcItem, DcRanking, DcStock, DcSummary, DcTotals,
  Finding, GradeMix, Health, OptionHealth, OptionStoreAvailability, OptionStoreDetail,
  OptionStoreRow, Snapshot, SpaceCounts, StoreBrickRow, StoreDeltas, StoreSummary,
} from '../api/types';

type Query = Record<string, string | number | boolean | null | undefined>;
type Product = { code: string; name: string; segment: string; brick: string; grade: OptionStoreRow['grade_class'] };
type Store = { code: string; name: string; city: string; dc: string };
type Dataset = { snapshot: Snapshot; rows: OptionStoreRow[]; stores: StoreSummary[]; bricks: Map<string, StoreBrickRow[]>; findings: Finding[]; comparison: Comparison };

export const DEMO_SNAPSHOT_ID = 'snap_demo_20261008';
const DAY = 86_400_000;
const sum = <T,>(rows: readonly T[], value: (row: T) => number): number => rows.reduce((total, row) => total + value(row), 0);
const dateBefore = (date: string, days: number): string => new Date(Date.parse(`${date}T00:00:00Z`) - days * DAY).toISOString().slice(0, 10);
const tally = (values: string[]): Record<string, number> => values.reduce<Record<string, number>>((counts, value) => { counts[value] = (counts[value] ?? 0) + 1; return counts; }, {});
const shortfall = (row: OptionStoreRow): number => Math.max(0, (row.expected ?? 0) - (row.sold ?? 0));
const selling = (row: OptionStoreRow): boolean => !['core', 'unknown', 'exit'].includes(row.cohort);
const emptyBands = (): BandCounts => ({ supply_constrained: 0, over: 0, on_track: 0, watch: 0, under: 0, unmeasurable: 0, core: 0, no_gap: 0 });
const emptyMix = (): GradeMix => ({ Fashion: 0, Ultimate: 0, Core: 0, Unmapped: 0 });
const bandsFor = (rows: OptionStoreRow[]): BandCounts => rows.reduce((counts, row) => { counts[row.health?.band ?? row.health?.no_band_reason ?? 'unmeasurable'] += 1; return counts; }, emptyBands());
const gradeMix = (rows: OptionStoreRow[]): GradeMix => rows.reduce((counts, row) => { counts[row.grade_class] += 1; return counts; }, emptyMix());

const DCS: { code: string; name: string }[] = [
  { code: 'DCWEST', name: 'West Distribution Centre' },
  { code: 'DCNORTH', name: 'North Distribution Centre' },
  { code: 'DCSOUTH', name: 'South Distribution Centre' },
];
const STORES: Store[] = [
  { code: 'MUM01', name: 'Bandra High Street', city: 'Mumbai', dc: 'DCWEST' },
  { code: 'PUN01', name: 'Phoenix Marketcity', city: 'Pune', dc: 'DCWEST' },
  { code: 'AHM01', name: 'Ahmedabad One', city: 'Ahmedabad', dc: 'DCWEST' },
  { code: 'SUR01', name: 'VR Surat', city: 'Surat', dc: 'DCWEST' },
  { code: 'DEL01', name: 'Saket Citywalk', city: 'Delhi', dc: 'DCNORTH' },
  { code: 'GUR01', name: 'Ambience Mall', city: 'Gurugram', dc: 'DCNORTH' },
  { code: 'NOI01', name: 'Mall of India', city: 'Noida', dc: 'DCNORTH' },
  { code: 'JAI01', name: 'World Trade Park', city: 'Jaipur', dc: 'DCNORTH' },
  { code: 'BLR01', name: 'Indiranagar', city: 'Bengaluru', dc: 'DCSOUTH' },
  { code: 'CHE01', name: 'Express Avenue', city: 'Chennai', dc: 'DCSOUTH' },
  { code: 'HYD01', name: 'Inorbit Mall', city: 'Hyderabad', dc: 'DCSOUTH' },
  { code: 'KOC01', name: 'Lulu Mall', city: 'Kochi', dc: 'DCSOUTH' },
];
const CATEGORIES = [
  ['Menswear', 'SHIRTS', 'Linen shirt'], ['Menswear', 'JEANS', 'Straight jeans'],
  ['Menswear', 'TEES', 'Everyday tee'], ['Menswear', 'CHINOS', 'Stretch chino'],
  ['Womenswear', 'TOPS', 'Ribbed top'], ['Womenswear', 'DRESSES', 'Midi dress'],
  ['Womenswear', 'KURTAS', 'Printed kurta'], ['Kidswear', 'TEES', 'Graphic tee'],
] as const;
const COLOURS = ['Sand', 'Indigo', 'Black', 'White', 'Olive', 'Rose'] as const;
const PRODUCTS: Product[] = CATEGORIES.flatMap(([segment, brick, name], c) => Array.from({ length: 12 }, (_, v) => ({
  code: `${700000000 + c * 100 + v}_${COLOURS[v % COLOURS.length]!.toUpperCase()}`,
  name: `${name} · ${COLOURS[v % COLOURS.length]}${v >= 6 ? ' / relaxed fit' : ''}`,
  segment, brick, grade: v === 11 ? 'Core' : v === 10 ? 'Ultimate' : 'Fashion',
})));
const PRODUCT_MAP = new Map(PRODUCTS.map(p => [p.code, p]));

function allocate(total: number, weights: number[]): number[] {
  const result = weights.map(weight => Math.floor(total * weight / sum(weights, x => x)));
  const eligible = weights.flatMap((weight, i) => weight > 0 ? [i] : []);
  for (let i = 0, remaining = total - sum(result, x => x); i < remaining; i++) result[eligible[i % eligible.length]!]! += 1;
  return result;
}

function cohortFor(age: number, core: boolean): Cohort {
  if (core) return 'core';
  if (age < 14) return 'under_min';
  if (age < 60) return 'building';
  if (age < 70) return 'checkpoint';
  if (age < 81) return 'review';
  if (age < 90) return 'exit_window';
  return 'exit';
}

function availability(row: OptionStoreRow, asOf: string, snapshotId: string): OptionStoreAvailability {
  const constrained = row.health?.band === 'supply_constrained';
  const firstDay = 13 - (row.days_in_store ?? 14);
  const daily = allocate(row.sales_14d, Array.from({ length: 14 }, (_, d) => d < firstDay ? 0 : 1 + d % 3));
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'].map((size, i) => ({
    size, articles: [`${row.option_code}_${size}`], pivotal: i < 3, contribution_rank: i + 1,
    eligible_units: 0, prev_close_in_stock: daily.map((_, d) => d > firstDay && !(constrained && i === 1 && d < 6)), units: [] as number[],
  }));
  daily.forEach(units => allocate(units, [30, 30, 25, 10, 5]).forEach((count, i) => sizes[i]!.units.push(count)));
  sizes.forEach(size => { size.eligible_units = sum(size.units, x => x); });
  const days = daily.map((units, d) => ({ date: dateBefore(asOf, 13 - d), vetoed: false,
    qualifying: sizes.filter(size => size.pivotal).every(size => size.prev_close_in_stock[d]), units }));
  return { snapshot_id: snapshotId, as_of: asOf, store_code: row.store_code, option_code: row.option_code,
    observation_start: dateBefore(asOf, 13), observation_end: asOf, days, sizes, health: row.health! };
}

function makeRows(asOf: string): OptionStoreRow[] {
  const elapsed = Math.round((Date.parse('2026-10-08') - Date.parse(asOf)) / DAY);
  return STORES.flatMap((store, s) => PRODUCTS.map((product, i) => {
    const age = Math.max(1, [10, 24, 38, 48, 59, 64, 72, 78, 85, 96, 110, 124][(i + s * 3) % 12]! - elapsed);
    const core = product.grade === 'Core';
    const inward = 72 + (i * 17 + s * 23) % 160;
    const target = Math.min(age / 60, 1) * .75;
    const multiplier = [.45, .65, .82, .95, 1.18, .58, 1.05][(i + s) % 7]!;
    const sold = Math.min(inward - 4, Math.round(inward * target * multiplier));
    const transit = Math.min(inward - sold, i % 4 === 0 ? 6 + s % 3 * 3 : 0);
    const gapReason = core ? 'core' : age < 14 ? 'under_min_age' : null;
    const expected = gapReason ? null : Math.round(inward * target * 100) / 100;
    const gap = expected ? (expected - sold) / expected : null;
    const band = gap === null ? null : gap > .1 && (i + s) % 5 === 0 ? 'supply_constrained' : gap >= .3 ? 'under' : gap > .1 ? 'watch' : gap < -.1 ? 'over' : 'on_track';
    const row: OptionStoreRow = {
      store_code: store.code, option_code: product.code, option_name: product.name, brand: 'Demo Collection', brick: product.brick,
      grade_code: core ? 'CORE' : product.grade === 'Ultimate' ? 'ULT' : 'FSN', grade_class: product.grade,
      first_grn: dateBefore(asOf, age), days_in_store: age, lifecycle_age: core ? null : age, cohort: cohortFor(age, core),
      inward, sold, sell_through: sold / inward, expected, gap, gap_reason: gapReason,
      on_hand: inward - sold - transit, transit, sales_14d: Math.min(sold, Math.round(sold / Math.max(14, age) * 14)),
      curve_provisional: age > 60 && !core, flags: i === 2 ? ['INWARD_MISMATCH'] : [], health: null,
    };
    const health: OptionHealth = {
      band, no_band_reason: core ? 'core' : gapReason ? 'no_gap' : null,
      availability_basis: 'observation', pivotal_sizes: ['S', 'M', 'L'], eligible_units: row.sales_14d,
      qualified_units: 0, qualifying_days: 0, veto_valid_days: 14, true_ros_daily: 0, true_ros_30d: 0,
      unmeasurable_reason: null, availability_14d: 1, availability_life: null, life_coverage: null,
      life_unavailable_reason: null, first_seen: row.first_grn, weeks_of_cover: null, cover_reason: null, duplicate_rows: 0,
    };
    row.health = health;
    const grid = availability(row, asOf, '');
    const qualified = grid.days.filter(day => day.qualifying);
    health.qualified_units = sum(qualified, day => day.units);
    health.qualifying_days = qualified.length;
    health.availability_14d = qualified.length / 14;
    health.true_ros_daily = health.qualified_units / qualified.length;
    health.true_ros_30d = health.true_ros_daily * 30;
    health.weeks_of_cover = health.true_ros_daily ? (row.on_hand + row.transit) / (health.true_ros_daily * 7) : null;
    health.cover_reason = health.true_ros_daily ? null : 'zero_rate';
    return row;
  }));
}

function groupsFor(rows: OptionStoreRow[]): StoreBrickRow[] {
  const groups = new Map<string, OptionStoreRow[]>();
  rows.forEach(row => { const key = `${PRODUCT_MAP.get(row.option_code)!.segment}|${row.brick}|${row.grade_class}`; groups.set(key, [...(groups.get(key) ?? []), row]); });
  return [...groups.values()].map((group, i) => {
    const row = group[0]!, product = PRODUCT_MAP.get(row.option_code)!;
    const live = group.filter(r => r.on_hand + r.transit > 0).length;
    const units = sum(group, r => r.on_hand + r.transit);
    const planOptions = Math.max(1, group.length + (i % 3 === 0 ? 3 : -1));
    const planQty = planOptions * (i % 2 ? 100 : 80);
    const noPlan = i === 23;
    return {
      segment: product.segment, brick: product.brick, brick_key: product.brick.toLowerCase(), grade_class: row.grade_class,
      options: group.length, live_options: live, units,
      units_short: sum(group.filter(selling), shortfall), units_short_options: group.filter(r => selling(r) && shortfall(r) > 0).length,
      day90_units: sum(group.filter(r => r.cohort === 'exit'), r => r.on_hand + r.transit), day90_options: group.filter(r => r.cohort === 'exit').length,
      bands: bandsFor(group), space: {
        plan_brick: noPlan ? null : product.brick, plan_options: noPlan ? null : planOptions, plan_qty: noPlan ? null : planQty,
        plan_qty_source: noPlan ? null : 'planogram', depth: noPlan ? null : planQty / planOptions,
        options_fill: noPlan ? null : live / planOptions, units_fill: noPlan ? null : units / planQty,
        floor_rule: 'options_and_units', below_floor: !noPlan && (live / planOptions < .8 || units / planQty < .8),
        overfilled: !noPlan && units / planQty > 1.2, no_plan: noPlan,
      },
    };
  });
}

function spaceCounts(groups: StoreBrickRow[]): SpaceCounts {
  const planned = groups.filter(g => !g.space?.no_plan);
  const planOptions = sum(planned, g => g.space?.plan_options ?? 0), planQty = sum(planned, g => g.space?.plan_qty ?? 0);
  const live = sum(planned, g => g.live_options), units = sum(planned, g => g.units);
  return { groups: groups.length, planned_groups: planned.length, no_plan: groups.length - planned.length,
    below_floor: planned.filter(g => g.space?.below_floor).length, overfilled: planned.filter(g => g.space?.overfilled).length,
    flagged: planned.filter(g => g.space?.below_floor || g.space?.overfilled).length,
    in_band: planned.filter(g => !g.space?.below_floor && !g.space?.overfilled).length,
    plan_options: planOptions, plan_qty: planQty, planned_live_options: live, planned_units: units,
    options_fill: planOptions ? live / planOptions : null, units_fill: planQty ? units / planQty : null };
}

function makeDataset(asOf: string, id: string, previous?: Dataset): Dataset {
  const rows = makeRows(asOf), bricks = new Map<string, StoreBrickRow[]>();
  const findings: Finding[] = STORES.flatMap(store => [
    { code: 'INWARD_MISMATCH', severity: 'warning', store_code: store.code, option_code: PRODUCTS[2]!.code,
      article: null, detail: 'Illustrative transfer reconciliation: issued quantity is 30% above inferred inward.', units: null },
    { code: 'NO_PLANOGRAM', severity: 'info', store_code: store.code, option_code: null,
      article: null, detail: 'Dummy Kidswear / TEES / Core group has no assigned space plan.', units: null },
  ]);
  const stores: StoreSummary[] = STORES.map(store => {
    const ownRows = rows.filter(r => r.store_code === store.code), groups = groupsFor(ownRows);
    bricks.set(store.code, groups);
    const counts = tally(findings.filter(f => f.store_code === store.code).map(f => f.code));
    const current: StoreSummary = { store_code: store.code, name: store.name, city: store.city, format: 'Demo fashion store', dc_code: store.dc,
      is_focus: store.code === 'MUM01', options: ownRows.length, saleable_units: sum(ownRows, r => r.on_hand),
      transit_units: sum(ownRows, r => r.transit), sales_14d_units: sum(ownRows, r => r.sales_14d), grade_mix: gradeMix(ownRows),
      finding_count: sum(Object.values(counts), x => x), finding_counts: counts, cohorts: tally(ownRows.map(r => r.cohort)), has_data: true,
      units_short: sum(groups, g => g.units_short), day90_units: sum(groups, g => g.day90_units), deltas: null,
      bands: bandsFor(ownRows), space: spaceCounts(groups) };
    const before = previous?.stores.find(s => s.store_code === store.code);
    if (before) current.deltas = {
      options: current.options - before.options, saleable_units: current.saleable_units - before.saleable_units,
      transit_units: current.transit_units - before.transit_units, sales_14d_units: current.sales_14d_units - before.sales_14d_units,
      finding_count: current.finding_count - before.finding_count,
      cohorts: Object.fromEntries([...new Set([...Object.keys(current.cohorts), ...Object.keys(before.cohorts)])].map(c => [c, (current.cohorts[c as Cohort] ?? 0) - (before.cohorts[c as Cohort] ?? 0)])),
    };
    return current;
  });
  const snapshot: Snapshot = { snapshot_id: id, as_of: asOf, dcs: DCS.map(d => d.code), focus_stores: ['MUM01'], status: 'ready', source: 'fixture',
    query_version: 'local-dummy-v1', created_at: `${asOf}T10:00:00Z`, built_at: `${asOf}T10:00:00Z`, bytes_processed: 0,
    row_counts: { option_stores: rows.length, stores: stores.length, product_variants: PRODUCTS.length },
    finding_counts: tally(findings.map(f => f.code)), error: null, store_count: stores.length, content_version: 3,
    content_parts: { health: true, space: true }, history_range: { start: dateBefore(asOf, 13), end: asOf }, extension: null };
  return { snapshot, rows, stores, bricks, findings, comparison: previous ? {
    status: 'compared', snapshot_id: previous.snapshot.snapshot_id, as_of: previous.snapshot.as_of, built_at: previous.snapshot.built_at,
  } : { status: 'no_previous', snapshot_id: null, as_of: null, built_at: null } };
}
const PREVIOUS = makeDataset('2026-10-01', 'snap_demo_20261001');
const CURRENT = makeDataset('2026-10-08', DEMO_SNAPSHOT_ID, PREVIOUS);
const DATASETS = [CURRENT, PREVIOUS];

/** Bulk fixture input for the engine view; uses exactly the same rows and prices as the option drawer. */
export function demoEngineInputs(snapshotId: string, storeCode: string): Pick<OptionStoreDetail, 'row' | 'snapshot_id' | 'as_of' | 'mrp'>[] {
  const data = DATASETS.find(item => item.snapshot.snapshot_id === snapshotId);
  if (!data || !data.stores.some(store => store.store_code === storeCode)) throw new Error('Demo engine scope unavailable');
  return data.rows.filter(row => row.store_code === storeCode).map(row => ({ row, snapshot_id: snapshotId, as_of: data.snapshot.as_of,
    mrp: row.brick === 'DRESSES' ? 2499 : row.brick === 'TEES' ? 699 : 1499 }));
}

function detailFor(data: Dataset, row: OptionStoreRow): OptionStoreDetail {
  const product = PRODUCT_MAP.get(row.option_code)!, store = STORES.find(s => s.code === row.store_code)!;
  const hand = allocate(row.on_hand, [15, 25, 30, 20, 10]), transit = allocate(row.transit, [15, 25, 30, 20, 10]), sold = allocate(row.sold ?? 0, [30, 30, 25, 10, 5]);
  const age = row.days_in_store!;
  const shelf = data.bricks.get(row.store_code)!.find(g => g.segment === product.segment && g.brick === row.brick && g.grade_class === row.grade_class)!;
  const weeks = Math.max(1, Math.ceil(age / 7)), weekly = allocate(row.sold ?? 0, Array.from({ length: weeks }, () => 1));
  return { snapshot_id: data.snapshot.snapshot_id, as_of: data.snapshot.as_of, row, store_name: store.name,
    hierarchy: { segment: product.segment, family: 'Apparel', class: product.brick, brick: product.brick, season: 'Autumn 2026 · demo' },
    mrp: row.brick === 'DRESSES' ? 2499 : row.brick === 'TEES' ? 699 : 1499, last_grn: row.first_grn,
    sto_issued: row.flags.includes('INWARD_MISMATCH') ? Math.ceil(row.inward! * 1.3) : row.inward, inward_mismatch: row.flags.includes('INWARD_MISMATCH'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'].map((size, i) => ({ size, article: `${row.option_code}_${size}`, on_hand: hand[i]!, transit: transit[i]!, sold: sold[i]! })),
    curve: Array.from(new Set([0, ...Array.from({ length: Math.floor(age / 7) }, (_, i) => (i + 1) * 7), age])).map(day => ({
      day, date: dateBefore(data.snapshot.as_of, age - day), expected_pct: row.grade_class === 'Core' ? null : Math.min(day / 60, 1) * .75,
      actual_pct: row.sell_through! * day / age,
    })),
    weekly_sales: weekly.map((units, i) => {
      const date = dateBefore(data.snapshot.as_of, (weeks - 1 - i) * 7);
      return { week_start: dateBefore(date, (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7), units };
    }),
    findings: data.findings.filter(f => f.store_code === row.store_code && f.option_code === row.option_code),
    provenance: { days_in_store: 'derived', inward: 'derived', sold: 'observed', sell_through: 'derived',
      expected: row.curve_provisional ? 'provisional' : 'derived', gap: row.curve_provisional ? 'provisional' : 'derived', sto_issued: 'observed' }, shelf };
}

function dcSummary(data: Dataset, dc: DcItem, ranking: DcRanking): DcSummary {
  const stores = data.stores.filter(s => s.dc_code === dc.dc_code), codes = new Set(stores.map(s => s.store_code));
  const rows = data.rows.filter(r => codes.has(r.store_code)), groups = stores.flatMap(s => data.bricks.get(s.store_code)!);
  const totals: DcTotals = { stores: stores.length, stores_with_data: stores.length, stores_without_data: 0,
    options: rows.length, saleable_units: sum(rows, r => r.on_hand), transit_units: sum(rows, r => r.transit), sales_14d_units: sum(rows, r => r.sales_14d),
    grade_mix: gradeMix(rows), cohorts: tally(rows.map(r => r.cohort)), finding_count: sum(stores, s => s.finding_count),
    finding_counts: tally(data.findings.filter(f => codes.has(f.store_code ?? '')).map(f => f.code)), units_short: sum(stores, s => s.units_short),
    day90_units: sum(stores, s => s.day90_units), bands: bandsFor(rows), space: spaceCounts(groups) };
  const metric = (s: StoreSummary): number => ranking === 'day90_stock' ? s.day90_units : ranking === 'data_gaps' ? s.finding_count : ranking === 'most_under' ? s.bands?.under ?? 0 : ranking === 'worst_fill' ? -(s.space?.units_fill ?? 0) : s.units_short;
  const deltas: StoreDeltas = { options: 0, saleable_units: 0, transit_units: 0, sales_14d_units: 0, finding_count: 0, cohorts: {} };
  for (const s of stores) if (s.deltas) {
    for (const key of ['options', 'saleable_units', 'transit_units', 'sales_14d_units', 'finding_count'] as const) deltas[key] += s.deltas[key];
    for (const [key, value] of Object.entries(s.deltas.cohorts)) deltas.cohorts[key] = (deltas.cohorts[key] ?? 0) + value;
  }
  return { snapshot_id: data.snapshot.snapshot_id, as_of: data.snapshot.as_of, dc_code: dc.dc_code, name: dc.name, ranking,
    comparison: data.comparison, totals, deltas: data.comparison.status === 'compared' ? { ...deltas, stores: 0, stores_with_data: 0 } : null,
    stores: [...stores].sort((a, b) => metric(b) - metric(a) || a.store_code.localeCompare(b.store_code)) };
}

function dcStock(data: Dataset, dcCode: string): DcStock {
  const group = new Map<string, { brick: string; grade_class: Product['grade']; options: number; units: number }>();
  PRODUCTS.forEach((p, i) => { const key = `${p.brick}/${p.grade}`, current = group.get(key) ?? { brick: p.brick, grade_class: p.grade, options: 0, units: 0 };
    current.options++; current.units += 80 + (i * 29 + dcCode.length) % 220; group.set(key, current); });
  const items = [...group.values()];
  return { snapshot_id: data.snapshot.snapshot_id, as_of: data.snapshot.as_of, dc_code: dcCode, attributes_source: 'dc_rows',
    totals: { options: sum(items, i => i.options), units: sum(items, i => i.units) }, items, unclassified: { options: 0, units: 0 } };
}

const csv = (value: Query[string]): string[] => String(value ?? '').split(',').filter(Boolean);
const normalized = (value: string): string => value.trim().toLowerCase();
const response = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const missing = (kind: string): Response => response({ code: `${kind}_not_found`, message: `This ${kind} is not in the local dummy dataset.` }, 404);
function page<T>(items: T[], query: Query): unknown {
  const size = Math.max(1, Math.min(200, Number(query.page_size) || 50)), number = Math.max(1, Number(query.page) || 1);
  return { items: items.slice((number - 1) * size, number * size), total: items.length, page: number, page_size: size };
}
function listOptions(data: Dataset, query: Query): OptionStoreRow[] {
  const cohorts = csv(query.cohort), bands = csv(query.band), q = normalized(String(query.q ?? ''));
  const rows = data.rows.filter(row => {
    const p = PRODUCT_MAP.get(row.option_code)!;
    return (!query.store_code || row.store_code === query.store_code)
      && (!query.grade_class || row.grade_class === query.grade_class)
      && (!cohorts.length || cohorts.includes(row.cohort))
      && (!bands.length || bands.includes(row.health?.band ?? row.health?.no_band_reason ?? 'unmeasurable'))
      && (!query.segment || normalized(p.segment) === normalized(String(query.segment)))
      && (!query.brick || normalized(p.brick) === normalized(String(query.brick)))
      && (!q || normalized(`${row.option_code} ${row.option_name} ${row.brand} ${row.brick}`).includes(q));
  });
  const sort = String(query.sort ?? 'age_desc');
  if (sort === 'option_asc') return rows.sort((a, b) => a.option_code.localeCompare(b.option_code));
  const metric = (row: OptionStoreRow): number | null => sort.startsWith('true_ros') ? row.health?.true_ros_daily ?? null : sort.startsWith('cover') ? row.health?.weeks_of_cover ?? null : sort.startsWith('shortfall') ? shortfall(row) : sort.startsWith('gap') ? row.gap : sort.startsWith('sold') ? row.sold : sort.startsWith('on_hand') ? row.on_hand : row.days_in_store;
  return rows.sort((a, b) => { const av = metric(a), bv = metric(b); if (av === null || bv === null) return av === bv ? 0 : av === null ? 1 : -1;
    return (sort.endsWith('_asc') ? av - bv : bv - av) || a.option_code.localeCompare(b.option_code); });
}

/** The same API paths as the real client, including filtering, sorting, paging and drilldowns. */
export function demoResponse(method: string, path: string, query: Query = {}): Response {
  if (method !== 'GET') return response({ code: 'demo_read_only', message: 'Dummy data is read-only. No production action was sent.' }, 405);
  if (path === '/v1/health') {
    const health: Health = { status: 'ok', build_id: 'local-dummy-data', postgres: false, source: { kind: 'fixture', reachable: true, message: 'Local generated dummy data; no live backend.' },
      data_dates: { stock_latest: CURRENT.snapshot.as_of, sales_latest: CURRENT.snapshot.as_of }, latest_snapshot: CURRENT.snapshot,
      can_build_snapshot: false, default_scope: { dcs: CURRENT.snapshot.dcs, focus_stores: ['MUM01'], as_of: CURRENT.snapshot.as_of }, content_version: 3 };
    return response(health);
  }
  if (path === '/v1/snapshots') return response({ items: DATASETS.map(d => d.snapshot) });
  const parts = path.split('/').filter(Boolean);
  const snapshotId = parts[1] === 'snapshots' ? parts[2] : query.snapshot_id;
  const data = DATASETS.find(d => d.snapshot.snapshot_id === (snapshotId || DEMO_SNAPSHOT_ID));
  if (!data) return missing('snapshot');
  const stamp = { snapshot_id: data.snapshot.snapshot_id, as_of: data.snapshot.as_of };
  if (parts[1] === 'snapshots') {
    if (parts[3] === 'findings') return response(page(data.findings.filter(f => (!query.code || f.code === query.code) && (!query.store_code || f.store_code === query.store_code)
      && (!query.dc_code || STORES.find(s => s.code === f.store_code)?.dc === query.dc_code)), query));
    if (parts.length === 3) return response({ ...data.snapshot, queries: [] });
  }
  const dcs: DcItem[] = DCS.map(dc => ({ dc_code: dc.code, name: dc.name, stores: data.stores.filter(s => s.dc_code === dc.code).length, stores_with_data: data.stores.filter(s => s.dc_code === dc.code && s.has_data).length }));
  if (path === '/v1/dcs') return response({ ...stamp, items: dcs });
  if (parts[1] === 'dcs' && parts[2]) {
    const dc = dcs.find(d => d.dc_code === parts[2]); if (!dc) return missing('dc');
    if (parts[3] === 'stock') return response(dcStock(data, dc.dc_code));
    if (parts.length === 3) return response(dcSummary(data, dc, String(query.ranking ?? 'units_short') as DcRanking));
  }
  if (path === '/v1/stores') return response({ ...stamp, items: data.stores, comparison: data.comparison });
  if (parts[1] === 'stores' && parts[3] === 'bricks') {
    const items = data.bricks.get(parts[2]!); if (!items) return missing('store');
    return response({ ...stamp, store_code: parts[2], content_parts: data.snapshot.content_parts, items });
  }
  if (path === '/v1/option-stores' || path === '/v1/lifecycle') {
    if (query.store_code && !data.stores.some(s => s.store_code === query.store_code)) return missing('store');
    const rows = listOptions(data, query);
    if (path === '/v1/option-stores') return response(page(rows, query));
    const cohorts = new Map<string, { cohort: Cohort; grade_class: OptionStoreRow['grade_class']; options: number; units: number }>();
    rows.forEach(row => { const key = `${row.cohort}/${row.grade_class}`, group = cohorts.get(key) ?? { cohort: row.cohort, grade_class: row.grade_class, options: 0, units: 0 };
      group.options++; group.units += row.on_hand + row.transit; cohorts.set(key, group); });
    return response({ ...stamp, store_code: query.store_code, total_options: rows.length, cohorts: [...cohorts.values()], curve_provisional: true });
  }
  if (parts[1] === 'option-stores' && parts[2] && parts[3]) {
    const row = data.rows.find(r => r.store_code === parts[2] && r.option_code === parts[3]); if (!row) return missing('option_store');
    if (parts[4] === 'availability') return response(availability(row, data.snapshot.as_of, data.snapshot.snapshot_id));
    if (parts.length === 4) return response(detailFor(data, row));
  }
  return missing('endpoint');
}
