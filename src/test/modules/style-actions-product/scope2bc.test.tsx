import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TooltipProvider } from '@/components/ui';
import DcOverviewPage from '@/modules/style-actions-product/pages/DcOverviewPage';
import WorkspacePage from '@/modules/style-actions-product/pages/WorkspacePage';
import { useScopeStore } from '@/modules/style-actions-product/stores/useScopeStore';

import type {
  BandCounts,
  OptionHealth,
  OptionStoreRow,
  Snapshot,
  SpaceCounts,
  SpaceFill,
  StoreBrickRow,
  StoreSummary,
} from '@/modules/style-actions-product/api/types';

// Mock-aided component checks for sub-step 2bc: fetch is stubbed with contract 0.3.3 shapes built from the fixture oracle
// (scope-2-contract.md §5.4). They prove wiring, states and URLs, not integrated behaviour.

vi.mock('@/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/environment')>();
  return { ...actual, default: { ...actual.default, API_BASE_URL: 'https://api.impetusz0.de', DEV_COOKIES: '' } };
});

const CURRENT = 'snap_fx0929';
const LEGACY = 'snap_legacy_0922';
const NO_BANDS: BandCounts = { supply_constrained: 0, over: 0, on_track: 0, watch: 0, under: 0, unmeasurable: 0, core: 0, no_gap: 0 };
const SPACE_8080: SpaceCounts = {
  groups: 5, planned_groups: 5, no_plan: 0, below_floor: 2, overfilled: 1, flagged: 3, in_band: 2, plan_options: 8, plan_qty: 74.25,
  planned_live_options: 6, planned_units: 77, options_fill: 0.75, units_fill: 1.037,
};

function snapshot(id: string, asOf: string, builtAt: string, version: number): Snapshot {
  return {
    snapshot_id: id, as_of: asOf, dcs: ['S3KG', 'V012'], focus_stores: ['8080', '5943'], status: 'ready', source: 'fixture',
    query_version: 'scope1-v1', created_at: builtAt, built_at: builtAt, bytes_processed: 0, row_counts: {}, finding_counts: {}, error: null,
    store_count: 5, content_version: version, content_parts: { health: version >= 2, space: version >= 3 }, history_range: null, extension: null,
  };
}

function store(code: string, dc: string, overrides: Partial<StoreSummary> = {}): StoreSummary {
  return {
    store_code: code, name: `Store ${code}`, city: 'Mumbai', format: 'TRENDS', dc_code: dc, is_focus: false, options: 2, saleable_units: 10,
    transit_units: 0, sales_14d_units: 2, grade_mix: { Fashion: 1, Ultimate: 1, Core: 0, Unmapped: 0 }, finding_count: 0, cohorts: { building: 2 },
    finding_counts: {}, has_data: true, units_short: 0, day90_units: 0, deltas: null, bands: null, space: null, ...overrides,
  };
}

function health(overrides: Partial<OptionHealth> = {}): OptionHealth {
  return {
    band: 'under', no_band_reason: null, availability_basis: 'observation', pivotal_sizes: ['M'], eligible_units: 10, qualified_units: 6,
    qualifying_days: 6, veto_valid_days: 14, true_ros_daily: 1, true_ros_30d: 30, unmeasurable_reason: null, availability_14d: 0.43,
    availability_life: null, life_coverage: null, life_unavailable_reason: null, first_seen: '2026-07-31', weeks_of_cover: 2.1, cover_reason: null,
    duplicate_rows: 0, ...overrides,
  };
}

function row(code: string, overrides: Partial<OptionStoreRow> = {}): OptionStoreRow {
  return {
    store_code: 'TX3X', option_code: code, option_name: null, brand: null, brick: 'SHIRT', grade_code: '0004', grade_class: 'Ultimate',
    first_grn: '2026-07-31', days_in_store: 60, lifecycle_age: 60, cohort: 'checkpoint', inward: 40, sold: 24, sell_through: 0.6, expected: 30,
    gap: 0.2, gap_reason: null, on_hand: 16, transit: 0, sales_14d: 8, curve_provisional: false, flags: [], health: health(), ...overrides,
  };
}

function space(overrides: Partial<SpaceFill> = {}): SpaceFill {
  return {
    plan_brick: 'TOP', plan_options: 2, plan_qty: 20, plan_qty_source: 'planogram', depth: null, options_fill: 1, units_fill: 1.3,
    floor_rule: 'options_and_units', below_floor: false, overfilled: true, no_plan: false, ...overrides,
  };
}

function brick(segment: string, key: string, grade: StoreBrickRow['grade_class'], short: number, overrides: Partial<StoreBrickRow> = {}): StoreBrickRow {
  return {
    segment, brick: key, brick_key: key, grade_class: grade, options: 2, live_options: 2, units: 10, units_short: short, units_short_options: short ? 1 : 0,
    day90_units: 0, day90_options: 0, bands: null, space: null, ...overrides,
  };
}

const TX3X_BANDS: BandCounts = { supply_constrained: 1, over: 2, on_track: 2, watch: 1, under: 3, unmeasurable: 2, core: 0, no_gap: 0 };
const STORES = [
  store('8080', 'S3KG', { options: 7, finding_count: 7, finding_counts: { NEGATIVE_STOCK: 1, BLANK_OPTION: 1 }, units_short: 13, bands: { ...NO_BANDS, under: 1, watch: 1 }, space: SPACE_8080 }),
  store('5943', 'S3KG', { name: 'RRL Trends Infinity Mall Malad', units_short: 6, bands: NO_BANDS, space: SPACE_8080 }),
  store('9591', 'S3KG', { units_short: 3.75, finding_count: 2, finding_counts: { NO_PLANOGRAM: 1, MISSING_LEAD_TIME: 1 }, bands: NO_BANDS, space: SPACE_8080 }),
  store('9592', 'S3KG', { has_data: false, options: 0, bands: NO_BANDS, space: SPACE_8080 }),
  store('TX3X', 'V012', { options: 11, bands: TX3X_BANDS, space: SPACE_8080 }),
];
const MATRIX_8080 = [
  brick('WOMEN', 'TOP', 'Fashion', 10, { space: space() }),
  brick('MEN', 'SHIRT', 'Ultimate', 2, { space: space({ plan_brick: 'SHIRT', plan_qty_source: 'fallback_depth', depth: 9.25, below_floor: true, overfilled: false }) }),
  ...Array.from({ length: 11 }, (_, index) => brick('UNISEX', `BRICK${String(index).padStart(2, '0')}`, 'Core', 0)),
];

interface Mocked {
  status: number;
  body: unknown;
}

let calls: string[] = [];
let legacyExtension: 'none' | 'running' | 'succeeded' = 'none';
let isNewerBuilding = false;
const NEWER = 'snap_400a34515a4b';
function newerBuilding(): Snapshot {
  return { ...snapshot(NEWER, '2026-10-03', '2026-10-05T11:00:00+00:00', 3), status: 'building', built_at: null, store_count: null, created_at: '2026-10-05T11:00:00+00:00' };
}

function dcSummary(dc: string, ranking: string): unknown {
  const stores = STORES.filter((item) => item.dc_code === dc);
  return {
    snapshot_id: CURRENT, as_of: '2026-09-29', dc_code: dc, name: `DC ${dc}`, ranking,
    comparison: { status: 'no_previous', snapshot_id: null, as_of: null, built_at: null },
    totals: {
      stores: stores.length, stores_with_data: stores.filter((item) => item.has_data).length, stores_without_data: stores.filter((item) => !item.has_data).length,
      options: 10, saleable_units: 111, transit_units: 3, sales_14d_units: 21, grade_mix: { Fashion: 6, Ultimate: 2, Core: 1, Unmapped: 1 }, cohorts: { building: 4 },
      finding_count: 10, finding_counts: { NO_PLANOGRAM: 1 }, units_short: 22.75, day90_units: 3, bands: { ...NO_BANDS, under: 1, watch: 2, unmeasurable: 3 },
      space: { ...SPACE_8080, groups: 9, flagged: 6 },
    },
    deltas: null,
    stores,
  };
}

function legacySnapshot(): Snapshot {
  const base = snapshot(LEGACY, '2026-09-22', '2026-10-05T08:00:00+00:00', legacyExtension === 'succeeded' ? 3 : 1);
  if (legacyExtension === 'none') return base;
  return {
    ...base,
    extension: { status: legacyExtension, from_version: 1, to_version: 3, started_at: '2026-10-05T10:00:00+00:00', finished_at: legacyExtension === 'succeeded' ? '2026-10-05T10:01:00+00:00' : null, error: null },
  };
}

function respond(url: URL, method: string): Mocked {
  const path = url.pathname.replace('/service/application/style-action', '');
  const params = url.searchParams;
  if (path === '/v1/health') {
    return { status: 200, body: { status: 'ok', build_id: 'b', postgres: true, source: { kind: 'fixture', reachable: true }, data_dates: { stock_latest: '2026-09-29', sales_latest: '2026-09-29' }, latest_snapshot: null, can_build_snapshot: true, default_scope: { dcs: ['S3KG', 'V012'], focus_stores: ['8080'], as_of: '2026-09-29' }, content_version: 3 } };
  }
  if (path === '/v1/snapshots') {
    const items = [snapshot(CURRENT, '2026-09-29', '2026-10-05T09:00:00+00:00', 3), legacySnapshot()];
    return { status: 200, body: { items: isNewerBuilding ? [newerBuilding(), ...items] : items } };
  }
  if (path === `/v1/snapshots/${NEWER}`) return { status: 200, body: { ...newerBuilding(), queries: [] } };
  if (path === `/v1/snapshots/${LEGACY}/extend` && method === 'POST') {
    legacyExtension = 'running';
    return { status: 202, body: legacySnapshot() };
  }
  if (path === `/v1/snapshots/${LEGACY}`) {
    const body = { ...legacySnapshot(), queries: [] };
    if (legacyExtension === 'running') legacyExtension = 'succeeded';
    return { status: 200, body };
  }
  if (path.endsWith('/findings')) return { status: 200, body: { items: [], total: 0, page: 1, page_size: 50 } };
  if (path.startsWith('/v1/snapshots/')) return { status: 200, body: { ...snapshot(CURRENT, '2026-09-29', '2026-10-05T09:00:00+00:00', 3), queries: [] } };
  if (path === '/v1/dcs') return { status: 200, body: { snapshot_id: params.get('snapshot_id'), as_of: '2026-09-29', items: [{ dc_code: 'S3KG', name: 'DC S3KG', stores: 4, stores_with_data: 3 }, { dc_code: 'V012', name: null, stores: 1, stores_with_data: 1 }] } };
  if (path === '/v1/dcs/S3KG' || path === '/v1/dcs/V012') return { status: 200, body: dcSummary(path.slice(8), params.get('ranking') ?? 'units_short') };
  if (path.startsWith('/v1/dcs/') && path.endsWith('/stock')) {
    return { status: 200, body: { snapshot_id: CURRENT, as_of: '2026-09-29', dc_code: 'S3KG', attributes_source: 'dc_rows', totals: { options: 2, units: 65 }, items: [{ brick: 'KURTA', grade_class: 'Fashion', options: 1, units: 60 }, { brick: 'TOP', grade_class: 'Fashion', options: 1, units: 5 }], unclassified: { options: 0, units: 0 } } };
  }
  if (path === '/v1/stores') {
    const isLegacy = params.get('snapshot_id') === LEGACY && legacyExtension !== 'succeeded';
    const items = isLegacy ? STORES.map((item) => ({ ...item, bands: null, space: null })) : STORES;
    return { status: 200, body: { snapshot_id: params.get('snapshot_id'), as_of: '2026-09-29', items, comparison: { status: 'no_previous', snapshot_id: null, as_of: null, built_at: null } } };
  }
  if (path === '/v1/stores/8080/bricks') return { status: 200, body: { snapshot_id: CURRENT, as_of: '2026-09-29', store_code: '8080', content_parts: { health: true, space: true }, items: MATRIX_8080 } };
  if (path === '/v1/stores/5943/bricks') return { status: 200, body: { snapshot_id: CURRENT, as_of: '2026-09-29', store_code: '5943', content_parts: { health: true, space: true }, items: [brick('MEN', 'SHIRT', 'Ultimate', 5), brick('WOMEN', 'KURTA', 'Fashion', 1)] } };
  if (path.startsWith('/v1/stores/') && path.endsWith('/bricks')) {
    const bands = { ...NO_BANDS, under: 1, over: 1 };
    return { status: 200, body: { snapshot_id: CURRENT, as_of: '2026-09-29', store_code: path.split('/')[3], content_parts: { health: true, space: true }, items: [brick('MEN', 'SHIRT', 'Ultimate', 3, { bands })] } };
  }
  if (path === '/v1/lifecycle') return { status: 200, body: { snapshot_id: CURRENT, as_of: '2026-09-29', store_code: params.get('store_code'), total_options: 11, cohorts: [], curve_provisional: false } };
  if (path === '/v1/option-stores') {
    if (params.get('store_code') === '9591') return { status: 200, body: { items: [row('700000002_RED', { store_code: '9591', expected: 5.225, sold: 2 })], total: 1, page: 1, page_size: 3 } };
    const items = [
      row('710000007_LIL', { health: health({ band: 'supply_constrained' }) }),
      row('710000008_BRG', { health: health({ band: null, no_band_reason: 'unmeasurable', unmeasurable_reason: 'no_pivotal_set', true_ros_30d: null, true_ros_daily: null }) }),
      row('700000001_BLU', { health: health({ weeks_of_cover: null, cover_reason: 'zero_rate', true_ros_30d: 0, true_ros_daily: 0 }) }),
    ];
    return { status: 200, body: { items, total: items.length, page: 1, page_size: 50 } };
  }
  if (path === '/v1/option-stores/TX3X/710000009_CRL') {
    const detailRow = row('710000009_CRL', { health: health({ band: 'over', qualifying_days: 3, qualified_units: 15, true_ros_daily: 5, true_ros_30d: 150, availability_basis: 'life', availability_life: 0.2857, life_coverage: 1, first_seen: '2026-09-14' }) });
    return { status: 200, body: { snapshot_id: CURRENT, as_of: '2026-09-29', row: detailRow, store_name: 'Store TX3X', hierarchy: { segment: 'WOMEN', family: null, class: null, brick: 'TOP', season: null }, mrp: 1000, last_grn: null, sto_issued: null, inward_mismatch: false, sizes: [], curve: [], weekly_sales: [], findings: [], provenance: {}, shelf: brick('WOMEN', 'TOP', 'Fashion', 0, { space: space() }) } };
  }
  if (path === '/v1/option-stores/TX3X/710000009_CRL/availability') {
    const days = Array.from({ length: 14 }, (_, index) => ({ date: `2026-09-${String(16 + index).padStart(2, '0')}`, vetoed: index === 13, qualifying: index >= 9 && index <= 11, units: index }));
    const sizes = [{ size: 'M', articles: ['710000009002'], pivotal: true, contribution_rank: 1, eligible_units: 12, prev_close_in_stock: days.map((_, index) => index >= 9), units: days.map(() => 1) }];
    return { status: 200, body: { snapshot_id: CURRENT, as_of: '2026-09-29', store_code: 'TX3X', option_code: '710000009_CRL', observation_start: '2026-09-16', observation_end: '2026-09-29', days, sizes, health: health({ band: 'over' }) } };
  }
  return { status: 404, body: { code: 'not_found', message: `No mock for ${path}` } };
}

function LocationProbe(): React.ReactNode {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function renderAt(entry: string): void {
  // These cases exercise the retained diagnostic workspace. Journey interactions have a separate suite.
  if (!entry.includes('/dc/')) entry += `${entry.includes('?') ? '&' : '?'}view=analysis`;
  const client = new QueryClient({ defaultOptions: { queries: { retry: 0, refetchOnWindowFocus: false } } });
  render(
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <MemoryRouter initialEntries={[entry]}>
          <Routes>
            <Route path="/style-actions-product" element={<WorkspacePage />} />
            <Route path="/style-actions-product/dc/:dcCode" element={<DcOverviewPage />} />
          </Routes>
          <LocationProbe />
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

function location(): string {
  return screen.getByTestId('location').textContent ?? '';
}

beforeEach(() => {
  calls = [];
  legacyExtension = 'none';
  isNewerBuilding = false;
  useScopeStore.setState({ snapshotId: null, storeCode: null });
  vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
    matches: query.includes('min-width'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string, init?: RequestInit) => {
      const url = new URL(input, 'http://localhost');
      calls.push(`${init?.method ?? 'GET'} ${url.pathname.replace('/service/application/style-action', '')}${url.search}`);
      const mocked = respond(url, init?.method ?? 'GET');
      return Promise.resolve(new Response(JSON.stringify(mocked.body), { status: mocked.status, headers: { 'Content-Type': 'application/json' } }));
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('store workspace health (S2-R11)', () => {
  it('shows the band mix and the health columns, never 0 for an unmeasurable option', async () => {
    renderAt('/style-actions-product?dc=V012&store=TX3X');
    expect(await screen.findByTestId('band-mix-under')).toHaveTextContent('3');
    expect(await screen.findByTestId('worklist-band-710000007_LIL')).toHaveTextContent('Supply-constrained');
    expect(screen.getByTestId('worklist-band-710000008_BRG')).toHaveTextContent('Unmeasurable');
    expect(screen.getByTestId('worklist-cover-700000001_BLU')).toHaveTextContent('No sales');
  });

  it('filters the worklist by band from the band mix', async () => {
    const user = userEvent.setup();
    renderAt('/style-actions-product?dc=V012&store=TX3X');
    await user.click(await screen.findByTestId('band-seg-under'));
    await waitFor(() => expect(calls.some((call) => call.includes('/v1/option-stores?') && call.includes('band=under'))).toBe(true));
    expect(location()).toContain('band=under');
    expect(screen.getByTestId('worklist-band-filter')).toHaveTextContent('Band: Under');
  });

  it('filters by a band of a matrix cell in the bands lens', async () => {
    const user = userEvent.setup();
    renderAt('/style-actions-product?dc=V012&store=TX3X&lens=bands');
    await user.click(await screen.findByTestId('matrix-cell-MEN-SHIRT-Ultimate-under'));
    expect(location()).toContain('band=under');
    expect(location()).toContain('brick=SHIRT');
    await waitFor(() => expect(calls.some((call) => call.includes('segment=MEN') && call.includes('band=under') && call.includes('grade_class=Ultimate'))).toBe(true));
  });

  it('shows space flags in words and the store space line', async () => {
    renderAt('/style-actions-product?dc=S3KG&store=8080&lens=space');
    expect(await screen.findByTestId('space-flag-WOMEN-TOP-Fashion')).toHaveTextContent(/^Overfilled$/);
    expect(screen.getByTestId('space-flag-MEN-SHIRT-Ultimate')).toHaveTextContent('Below floor');
    expect(screen.getByText('Plan qty estimated (9.25 per option)')).toBeInTheDocument();
    expect(screen.getByTestId('store-space-flagged')).toHaveTextContent('3');
    expect(screen.getByTestId('lens-space')).toBeInTheDocument();
  });

  it('discloses numeric history and size evidence in the option drawer', async () => {
    renderAt('/style-actions-product?dc=V012&store=TX3X&option=710000009_CRL');
    await userEvent.setup().click(await screen.findByRole('button', { name: 'History', exact: true }));
    expect(await screen.findByTestId('drawer-band')).toHaveTextContent(/^Over$/);
    expect(screen.getByTestId('drawer-qualifying-days')).toHaveTextContent('3');
    expect(screen.getByText('Qualified units')).toBeInTheDocument();
    expect(screen.getByText(/Overfilled/)).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Inventory & sizes', exact: true }));
    expect(await screen.findByRole('table', { name: /Sizes by day/ })).toBeInTheDocument();
  });
});

describe('not-computed snapshots and extending (S2-R20)', () => {
  it('says health and space are not computed, extends from the drawer and reports Extended', async () => {
    const user = userEvent.setup();
    renderAt(`/style-actions-product?snap=${LEGACY}&dc=S3KG&store=8080&panel=health`);
    expect(await screen.findByTestId('content-not-computed')).toHaveTextContent('Health and space not yet computed for this snapshot');
    expect(screen.queryByTestId('band-mix-under')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('extend-snapshot'));
    expect(calls).toContain(`POST /v1/snapshots/${LEGACY}/extend`);
    await waitFor(() => expect(screen.getByTestId('extension-status')).toHaveTextContent('Extended'), { timeout: 6000 });
  }, 10000);

  it('keeps the matrix on Units short when the snapshot has no health, even if the link asks for bands', async () => {
    renderAt(`/style-actions-product?snap=${LEGACY}&dc=S3KG&store=8080&lens=bands`);
    expect(await screen.findByTestId('lens-scope1')).toBeInTheDocument();
    expect(screen.queryByTestId('lens-bands')).not.toBeInTheDocument();
    expect(screen.getByTestId('content-not-computed')).toBeInTheDocument();
  });
});

describe('brick matrix paging and search (S2-C44)', () => {
  it('pages ten rows at a time, worst first, and searches segment or brick with a clear action', async () => {
    const user = userEvent.setup();
    renderAt('/style-actions-product?dc=S3KG&store=8080');
    expect(await screen.findByTestId('brick-matrix-pager')).toHaveTextContent('Page 1 of 2');
    expect(screen.getByTestId('matrix-cell-WOMEN-TOP-Fashion')).toHaveTextContent('10');
    await user.click(screen.getByTestId('brick-matrix-pager-next'));
    expect(location()).toContain('bpage=2');
    expect(screen.queryByTestId('matrix-cell-WOMEN-TOP-Fashion')).not.toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('Search bricks'), 'zzz');
    expect(await screen.findByText('No brick matches "zzz"')).toBeInTheDocument();
    expect(screen.getByText(/13 groups · 12 units short/)).toBeInTheDocument();
    await user.click(screen.getByTestId('brick-matrix-clear-search'));
    expect(await screen.findByTestId('matrix-cell-WOMEN-TOP-Fashion')).toBeInTheDocument();
  });
});

describe('header and store picker (S2-C45, S2-C46, S2-C50)', () => {
  it('titles each page and roots the breadcrumb in Style Actions', async () => {
    renderAt('/style-actions-product?dc=S3KG&store=8080');
    await waitFor(() => expect(screen.getByTestId('page-title')).toHaveTextContent('Store · Store 8080'));
    expect(screen.getByTestId('breadcrumb-root')).toHaveTextContent('Style Actions');
    expect(screen.getByTestId('breadcrumb-dc')).toHaveTextContent(/^S3KG$/);
  });

  it('keeps the store count, hint and no-data switch inside the picker; the switch keeps it open and the trigger closes it', async () => {
    const user = userEvent.setup();
    renderAt('/style-actions-product?dc=S3KG&store=8080');
    await user.click(await screen.findByTestId('store-picker'));
    expect(await screen.findByTestId('store-count')).toHaveTextContent('3 stores with data · 1 without');
    expect(screen.queryByTestId('store-option-9592')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('store-no-data-toggle'));
    expect(screen.getByTestId('store-no-data-toggle')).toHaveTextContent('Hide stores with no data');
    expect(screen.getByTestId('store-option-9592')).toBeInTheDocument();
    await user.click(screen.getByTestId('store-picker'));
    await waitFor(() => expect(screen.queryByTestId('store-count')).not.toBeInTheDocument());
  });

  it('searches stores inside the picker', async () => {
    const user = userEvent.setup();
    renderAt('/style-actions-product?dc=S3KG&store=8080');
    await user.click(await screen.findByTestId('store-picker'));
    await user.type(await screen.findByRole('textbox', { name: 'Search stores' }), 'malad');
    expect(screen.getByTestId('store-option-5943')).toBeInTheDocument();
    expect(screen.queryByTestId('store-option-8080')).not.toBeInTheDocument();
  });
});

describe('Distribution Centre overview in 2bc', () => {
  it('shows band and space totals and offers Most Under and Worst fill', async () => {
    const user = userEvent.setup();
    renderAt('/style-actions-product/dc/S3KG');
    expect(await screen.findByTestId('page-title')).toHaveTextContent('Distribution Centre · S3KG');
    expect(await screen.findByTestId('dc-band-under')).toHaveTextContent('1');
    expect(screen.getByTestId('dc-space-flagged')).toHaveTextContent('6');
    await user.click(screen.getByTestId('dc-ranking-most_under'));
    await waitFor(() => expect(calls.some((call) => call.includes('/v1/dcs/S3KG?') && call.includes('ranking=most_under'))).toBe(true));
    expect(screen.getByTestId('dc-ranking-worst_fill')).toBeInTheDocument();
  });

  it('searches the ranked stores and clears an empty search', async () => {
    const user = userEvent.setup();
    renderAt('/style-actions-product/dc/S3KG');
    await user.type(await screen.findByPlaceholderText('Search stores'), 'malad');
    await waitFor(() => expect(screen.queryByTestId('dc-store-row-8080')).not.toBeInTheDocument());
    expect(screen.getByTestId('dc-store-row-5943')).toBeInTheDocument();
    expect(location()).toContain('sq=malad');
  });

  it('searches the Distribution Centre stock by brick or grade', async () => {
    const user = userEvent.setup();
    renderAt('/style-actions-product/dc/S3KG');
    const stock = await screen.findByTestId('dc-stock');
    await user.type(await within(stock).findByPlaceholderText('Search stock'), 'none');
    expect(await within(stock).findByText('No brick or grade matches "none"')).toBeInTheDocument();
    await user.click(within(stock).getByTestId('dc-stock-clear-search'));
    expect(await within(stock).findByText('KURTA')).toBeInTheDocument();
  });

  it('previews a store with its worst bricks, options behind the curve and data gaps, each opening the workspace there', async () => {
    const user = userEvent.setup();
    renderAt('/style-actions-product/dc/S3KG');
    await user.click(await screen.findByTestId('dc-store-row-5943'));
    expect(screen.getByTestId('dc-preview-store')).toHaveTextContent('5943');
    expect(await screen.findByTestId('dc-preview-brick-MEN-SHIRT-Ultimate')).toHaveTextContent('5 short');
    expect(screen.getByTestId('dc-preview-brick-WOMEN-KURTA-Fashion')).toHaveTextContent('1 short');
    await user.click(screen.getByTestId('dc-store-row-9591'));
    expect(await screen.findByTestId('dc-preview-option-700000002_RED')).toHaveTextContent('3 short');
    await user.click(screen.getByTestId('dc-preview-gap-NO_PLANOGRAM'));
    expect(location()).toContain('store=9591');
    expect(location()).toContain('panel=health');
    expect(location()).toContain('code=NO_PLANOGRAM');
  });

  it('opens the store from the preview icon button', async () => {
    const user = userEvent.setup();
    renderAt('/style-actions-product/dc/S3KG');
    const open = await screen.findByTestId('dc-open-store');
    expect(open).toHaveAccessibleName('Open store workspace for Store 8080');
    await user.click(open);
    await user.click(await screen.findByRole('button', { name: 'Detailed analysis' }));
    expect(await screen.findByTestId('store-options-8080')).toHaveTextContent('7');
  });

  it('signals when the selected store\'s preview has loaded, for journeys (S2-C68)', async () => {
    const user = userEvent.setup();
    renderAt('/style-actions-product/dc/S3KG');
    await waitFor(() => expect(screen.getByTestId('dc-preview-ready')).toHaveTextContent('8080'));
    await user.click(screen.getByTestId('dc-store-row-5943'));
    await waitFor(() => expect(screen.getByTestId('dc-preview-ready')).toHaveTextContent('5943'));
    expect(screen.getByTestId('dc-preview-brick-MEN-SHIRT-Ultimate')).toBeInTheDocument();
  });

  it('never requests a path built from an invalid code (S2-C66 L7)', async () => {
    renderAt('/style-actions-product?dc=V012&store=TX3X&option=..');
    expect(await screen.findByText('This option code is not valid.')).toBeInTheDocument();
    expect(calls.some((call) => call.includes('/v1/option-stores/TX3X/'))).toBe(false);
  });

  it('shows a snapshot id that is not a valid code as unavailable, without requesting it', async () => {
    renderAt('/style-actions-product/dc/S3KG?snap=..%2Fx');
    expect(await screen.findByTestId('snapshot-not-kept')).toHaveTextContent('This snapshot code is not valid.');
    expect(calls.some((call) => call.startsWith('GET /v1/snapshots/'))).toBe(false);
  });

  it('reads one snapshot detail when a snapshot is chosen (S2-C68)', async () => {
    renderAt(`/style-actions-product?snap=${LEGACY}&dc=S3KG&store=8080`);
    expect(await screen.findByTestId('content-not-computed')).toBeInTheDocument();
    await waitFor(() => expect(calls.filter((call) => call.startsWith('GET /v1/snapshots/')).length).toBe(1));
    expect(calls.filter((call) => call.startsWith('GET /v1/snapshots/'))[0]).toBe(`GET /v1/snapshots/${LEGACY}`);
  });

  it('describes the viewed snapshot in Data health and shows a newer build as its own line (S2-C69)', async () => {
    isNewerBuilding = true;
    renderAt(`/style-actions-product?snap=${CURRENT}&dc=S3KG&store=8080&panel=health`);
    const newer = await screen.findByTestId('newer-build');
    expect(newer).toHaveTextContent('A newer snapshot (as of Oct 03, 2026) is being built.');
    expect(screen.getByTestId('newer-build-status')).toHaveTextContent('Building');
    const facts = screen.getByText('Status').closest('div')?.parentElement as HTMLElement;
    expect(within(facts).getByText('Ready')).toBeInTheDocument();
    expect(within(facts).getByText('Sep 29, 2026')).toBeInTheDocument();
    expect(within(facts).queryByText('Building')).not.toBeInTheDocument();
    expect(within(facts).queryByText('Oct 03, 2026')).not.toBeInTheDocument();
    expect(calls).toContain(`GET /v1/snapshots/${CURRENT}`);
  });

  it('reads no extra snapshot detail when nothing is building', async () => {
    renderAt(`/style-actions-product?snap=${CURRENT}&dc=S3KG&store=8080&panel=health`);
    await screen.findByText('Sep 29, 2026', { selector: 'div' });
    await waitFor(() => expect(calls.filter((call) => call.startsWith('GET /v1/snapshots/')).length).toBe(1));
    expect(screen.queryByTestId('newer-build')).not.toBeInTheDocument();
  });
});
