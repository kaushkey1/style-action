import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TooltipProvider } from '@/components/ui';
import DcOverviewPage from '@/modules/style-actions-product/pages/DcOverviewPage';
import WorkspacePage from '@/modules/style-actions-product/pages/WorkspacePage';
import { useWorkspaceParams } from '@/modules/style-actions-product/components/useWorkspaceParams';
import { useScopeStore } from '@/modules/style-actions-product/stores/useScopeStore';

import type { Comparison, DcSummary, OptionStoreRow, Snapshot, StoreBrickRow, StoreSummary } from '@/modules/style-actions-product/api/types';

// Mock-aided component checks: fetch is stubbed with contract-shaped bodies taken from the Scope 2 fixture oracle
// (scope-2-contract.md §2.11, §5.4). They prove wiring, states and request counts, not integrated behaviour.

vi.mock('@/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/environment')>();
  return { ...actual, default: { ...actual.default, API_BASE_URL: 'https://api.impetusz0.de', DEV_COOKIES: '' } };
});

const LEGACY = 'snap_legacy_0922';
const CURRENT = 'snap_fx0929';
const COMPARED: Comparison = { status: 'compared', snapshot_id: LEGACY, as_of: '2026-09-22', built_at: '2026-10-05T08:00:00+00:00' };
const NO_PREVIOUS: Comparison = { status: 'no_previous', snapshot_id: null, as_of: null, built_at: null };

function snapshot(id: string, asOf: string, builtAt: string): Snapshot {
  return {
    snapshot_id: id,
    as_of: asOf,
    dcs: ['S3KG', 'V012'],
    focus_stores: ['8080', '5943'],
    status: 'ready',
    source: 'fixture',
    query_version: 'scope1-v1',
    created_at: builtAt,
    built_at: builtAt,
    bytes_processed: 0,
    row_counts: {},
    finding_counts: { NEGATIVE_STOCK: 1 },
    error: null,
    store_count: 5,
    content_version: 1,
    content_parts: { health: false, space: false },
    history_range: null,
    extension: null,
  };
}

function store(code: string, dc: string, overrides: Partial<StoreSummary>): StoreSummary {
  return {
    store_code: code,
    name: `Store ${code}`,
    city: 'Mumbai',
    format: 'TRENDS',
    dc_code: dc,
    is_focus: code === '8080',
    options: 1,
    saleable_units: 1,
    transit_units: 0,
    sales_14d_units: 0,
    grade_mix: { Fashion: 1, Ultimate: 0, Core: 0, Unmapped: 0 },
    finding_count: 0,
    cohorts: { building: 1 },
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

const DELTA_8080 = { options: 0, saleable_units: 10, transit_units: 0, sales_14d_units: 3, finding_count: 1, cohorts: { review: 1, checkpoint: -1 } };
const STORES_0929 = [
  store('8080', 'S3KG', {
    options: 7, saleable_units: 78, transit_units: 3, sales_14d_units: 16, finding_count: 7, units_short: 13, day90_units: 3, deltas: DELTA_8080,
    finding_counts: { NEGATIVE_STOCK: 1, BLANK_OPTION: 1, NO_FIRST_GRN: 1, UNMAPPED_GRADE: 1, SALES_WITHOUT_STOCK_ROW: 1, INWARD_MISMATCH: 1, SALES_WINDOW_SHORT: 1 },
  }),
  store('5943', 'S3KG', { options: 2, saleable_units: 24, units_short: 6 }),
  store('9591', 'S3KG', { options: 1, saleable_units: 9, finding_count: 2, units_short: 3.75 }),
  store('9592', 'S3KG', { options: 0, saleable_units: 0, has_data: false, finding_count: 1 }),
  store('TX3X', 'V012', { options: 11, saleable_units: 207 }),
];

function brick(segment: string, key: string, grade: StoreBrickRow['grade_class'], short: number, day90: number): StoreBrickRow {
  return { segment, brick: key, brick_key: key, grade_class: grade, options: 2, live_options: 2, units: 10, units_short: short, units_short_options: 1, day90_units: day90, day90_options: day90 ? 1 : 0, bands: null, space: null };
}

function dcSummary(ranking: DcSummary['ranking']): DcSummary {
  const s3kg = STORES_0929.filter((item) => item.dc_code === 'S3KG');
  const order = ranking === 'data_gaps' ? ['8080', '9591', '9592', '5943'] : ['8080', '5943', '9591', '9592'];
  return {
    snapshot_id: CURRENT,
    as_of: '2026-09-29',
    dc_code: 'S3KG',
    name: 'DC S3KG',
    ranking,
    comparison: COMPARED,
    totals: {
      stores: 4, stores_with_data: 3, stores_without_data: 1, options: 10, saleable_units: 111, transit_units: 3, sales_14d_units: 21,
      grade_mix: { Fashion: 6, Ultimate: 2, Core: 1, Unmapped: 1 }, cohorts: { building: 4, review: 1, exit: 1 },
      finding_count: 10, finding_counts: { NO_PLANOGRAM: 1, NEGATIVE_STOCK: 1 }, units_short: 22.75, day90_units: 3, bands: null, space: null,
    },
    deltas: { stores: 0, stores_with_data: 0, options: 0, saleable_units: 10, transit_units: 0, sales_14d_units: 3, finding_count: 1, cohorts: { building: -1, review: 1 } },
    stores: order.map((code) => s3kg.find((item) => item.store_code === code) as StoreSummary),
  };
}

interface Route_ {
  status: number;
  body: unknown;
}

let calls: string[] = [];
let snapshotsList: Snapshot[] = [];
let canBuild = false;
let optionStoresFail = false;

function optionRow(code: string, cohort: OptionStoreRow['cohort'], onHand: number, sold: number, expected: number): OptionStoreRow {
  return {
    store_code: '8080', option_code: code, option_name: null, brand: null, brick: 'TOP', grade_code: '0002', grade_class: 'Fashion', first_grn: '2026-07-31',
    days_in_store: 60, lifecycle_age: 60, cohort, inward: 40, sold, sell_through: 0.5, expected, gap: (expected - sold) / expected, gap_reason: null,
    on_hand: onHand, transit: 0, sales_14d: 2, curve_provisional: false, flags: [], health: null,
  };
}
let builtDetailCalls = 0;
const BUILT = snapshot('snap_new0929', '2026-09-29', '2026-10-05T10:00:00+00:00');

function respond(url: URL, method: string): Route_ {
  const path = url.pathname.replace('/service/application/style-action', '');
  const snap = url.searchParams.get('snapshot_id');
  if (path === '/v1/health') {
    return { status: 200, body: { status: 'ok', build_id: 'b', postgres: true, source: { kind: 'fixture', reachable: true }, data_dates: { stock_latest: '2026-09-29', sales_latest: '2026-09-29' }, latest_snapshot: null, can_build_snapshot: canBuild, default_scope: { dcs: ['S3KG', 'V012'], focus_stores: ['8080'], as_of: '2026-09-29' }, content_version: 1 } };
  }
  if (path === '/v1/snapshots' && method === 'POST') {
    const building: Snapshot = { ...BUILT, status: 'building', built_at: null, store_count: null };
    snapshotsList = [building, ...snapshotsList];
    return { status: 202, body: building };
  }
  if (path === '/v1/snapshots') return { status: 200, body: { items: snapshotsList } };
  if (path === '/v1/snapshots/snap_gone') return { status: 404, body: { code: 'snapshot_not_kept', message: 'Snapshot snap_gone is no longer kept', detail: { snapshot_id: 'snap_gone', as_of: '2026-09-15', deleted_at: '2026-10-06T08:00:00+00:00' } } };
  if (path === '/v1/snapshots/snap_new0929') {
    builtDetailCalls += 1;
    if (builtDetailCalls < 2) return { status: 200, body: { ...BUILT, status: 'building', built_at: null, store_count: null, queries: [] } };
    snapshotsList = [BUILT, ...snapshotsList.filter((item) => item.snapshot_id !== BUILT.snapshot_id)];
    return { status: 200, body: { ...BUILT, queries: [] } };
  }
  if (path.endsWith('/findings')) return { status: 200, body: { items: [], total: 0, page: 1, page_size: 50 } };
  if (path.startsWith('/v1/snapshots/')) return { status: 200, body: { ...snapshotsList[0], queries: [] } };
  if (path === '/v1/dcs') return { status: 200, body: { snapshot_id: snap, as_of: '2026-09-29', items: [{ dc_code: 'S3KG', name: 'DC S3KG', stores: 4, stores_with_data: 3 }, { dc_code: 'V012', name: 'DC V012', stores: 1, stores_with_data: 1 }] } };
  if (path === '/v1/dcs/V012') {
    return { status: 200, body: { ...dcSummary('units_short'), dc_code: 'V012', name: 'DC V012', comparison: NO_PREVIOUS, deltas: null, stores: STORES_0929.filter((item) => item.dc_code === 'V012') } };
  }
  if (path === '/v1/dcs/S3KG') return { status: 200, body: dcSummary((url.searchParams.get('ranking') as DcSummary['ranking'] | null) ?? 'units_short') };
  if (path === '/v1/dcs/V012/stock') return { status: 200, body: { snapshot_id: snap, as_of: '2026-09-22', dc_code: 'V012', attributes_source: 'store_rows', totals: { options: 3, units: 62 }, items: [{ brick: 'KURTA', grade_class: 'Fashion', options: 1, units: 30 }], unclassified: { options: 1, units: 20 } } };
  if (path === '/v1/dcs/S3KG/stock') return { status: 200, body: { snapshot_id: snap, as_of: '2026-09-29', dc_code: 'S3KG', attributes_source: 'dc_rows', totals: { options: 2, units: 40 }, items: [{ brick: 'TOP', grade_class: 'Fashion', options: 2, units: 40 }], unclassified: { options: 0, units: 0 } } };
  if (path === '/v1/stores') {
    const isLegacy = snap === LEGACY;
    const items = isLegacy ? STORES_0929.map((item) => ({ ...item, deltas: null, saleable_units: item.store_code === '8080' ? 68 : item.saleable_units })) : STORES_0929;
    return { status: 200, body: { snapshot_id: snap, as_of: isLegacy ? '2026-09-22' : '2026-09-29', items, comparison: isLegacy ? NO_PREVIOUS : COMPARED } };
  }
  if (path === '/v1/stores/8080/bricks') {
    return { status: 200, body: { snapshot_id: snap, as_of: '2026-09-29', store_code: '8080', content_parts: { health: false, space: false }, items: [brick('MEN', 'SHIRT', 'Ultimate', 2, 0), brick('WOMEN', 'TOP', 'Fashion', 10, 3)] } };
  }
  if (path === '/v1/lifecycle') return { status: 200, body: { snapshot_id: snap, as_of: '2026-09-29', store_code: '8080', total_options: 7, cohorts: [], curve_provisional: false } };
  if (path === '/v1/option-stores') {
    if (optionStoresFail) return { status: 500, body: { code: 'internal', message: 'Option list failed' } };
    const cohort = url.searchParams.get('cohort');
    if (url.searchParams.get('store_code') !== '8080') return { status: 200, body: { items: [], total: 0, page: 1, page_size: 5 } };
    const sort = url.searchParams.get('sort');
    if (cohort === 'exit' && sort === 'on_hand_desc') return { status: 200, body: { items: [optionRow('700000005_GRN', 'exit', 3, 8, 6)], total: 1, page: 1, page_size: 5 } };
    if (sort === 'shortfall_desc' && url.searchParams.get('page_size') === '5') {
      return { status: 200, body: { items: [optionRow('700000002_RED', 'checkpoint', 20, 18, 28.5), optionRow('700000001_BLU', 'building', 50, 7, 7.3)], total: 2, page: 1, page_size: 5 } };
    }
    return { status: 200, body: { items: [], total: 0, page: 1, page_size: 50 } };
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

function setDesktop(isDesktop: boolean): void {
  vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
    matches: isDesktop && query.includes('min-width'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function countOf(path: string): number {
  return calls.filter((call) => call === path).length;
}

beforeEach(() => {
  calls = [];
  snapshotsList = [snapshot(CURRENT, '2026-09-29', '2026-10-05T09:00:00+00:00'), snapshot(LEGACY, '2026-09-22', '2026-10-05T08:00:00+00:00')];
  useScopeStore.setState({ snapshotId: null, storeCode: null });
  canBuild = false;
  optionStoresFail = false;
  builtDetailCalls = 0;
  setDesktop(true);
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string, init?: RequestInit) => {
      const url = new URL(input, 'http://localhost');
      calls.push(url.pathname.replace('/service/application/style-action', ''));
      const route = respond(url, init?.method ?? 'GET');
      return Promise.resolve(new Response(JSON.stringify(route.body), { status: route.status, headers: { 'Content-Type': 'application/json' } }));
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('DC overview (SAPR-11)', () => {
  it('shows the DC totals with deltas, the ranking and the selected store preview', async () => {
    renderAt('/style-actions-product/dc/S3KG');
    expect(await screen.findByTestId('dc-total-options')).toHaveTextContent('10');
    expect(screen.getByTestId('dc-total-saleable')).toHaveTextContent('111');
    expect(screen.getByTestId('dc-delta-saleable')).toHaveTextContent('+10');
    expect(screen.getByTestId('dc-ranking-current')).toHaveTextContent('Units short');
    expect(screen.getByTestId('snapshot-current')).toHaveTextContent('Sep 29, 2026');
    expect(within(screen.getByTestId('dc-store-preview')).getByText('Store 8080')).toBeInTheDocument();
    expect(await screen.findByTestId('dc-stock-total-units')).toHaveTextContent('40');
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(`snap=${CURRENT}`));
  });

  it('makes one request per bound operation on page load', async () => {
    renderAt('/style-actions-product/dc/S3KG');
    await screen.findByTestId('dc-stock-total-units');
    for (const path of ['/v1/health', '/v1/snapshots', '/v1/dcs', '/v1/dcs/S3KG', '/v1/dcs/S3KG/stock']) expect(countOf(path), path).toBe(1);
    expect(countOf('/v1/stores')).toBe(0);
  });

  it('ranks by data gaps, previews a store, opens it sorted and returns by the breadcrumb to the same ranking and row', async () => {
    const user = userEvent.setup();
    renderAt('/style-actions-product/dc/S3KG');
    await user.click(await screen.findByTestId('dc-ranking-data_gaps'));
    await waitFor(() => expect(screen.getByTestId('dc-ranking-current')).toHaveTextContent('Data gaps'));
    await user.click(screen.getByTestId('dc-store-row-9591'));
    expect(within(screen.getByTestId('dc-store-preview')).getByText('Store 9591')).toBeInTheDocument();
    await user.click(screen.getByTestId('dc-open-store'));
    expect(screen.getByTestId('location')).toHaveTextContent('ranking=data_gaps');
    // A store opened from the data-gaps ranking opens on Data health for that store (S2-C67 M2).
    expect(screen.getByTestId('location')).toHaveTextContent('panel=health');
    expect(screen.getByTestId('location')).toHaveTextContent('scope=store');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.getByTestId('location')).not.toHaveTextContent('panel=health'));
    await user.click(await screen.findByRole('button', { name: 'Detailed analysis' }));
    expect(await screen.findByTestId('store-options-9591')).toHaveTextContent('1');
    expect(screen.getByTestId('breadcrumb-dc')).toHaveTextContent('S3KG');
    await user.click(screen.getByTestId('breadcrumb-dc'));
    expect(await screen.findByTestId('dc-ranking-current')).toHaveTextContent('Data gaps');
    expect(screen.getByTestId('location')).toHaveTextContent('store=9591');
  });

  it('opens the store directly from a row below 1024 px, with no preview', async () => {
    setDesktop(false);
    const user = userEvent.setup();
    renderAt('/style-actions-product/dc/S3KG');
    await user.click(await screen.findByTestId('dc-store-row-5943'));
    await user.click(await screen.findByRole('button', { name: 'Detailed analysis' }));
    expect(screen.queryByTestId('dc-store-preview')).not.toBeInTheDocument();
    expect(await screen.findByTestId('store-options-5943')).toHaveTextContent('2');
    expect(screen.getByTestId('location')).toHaveTextContent('sort=shortfall_desc');
  });

  it('says a DC is not in the snapshot instead of showing zeros', async () => {
    renderAt('/style-actions-product/dc/N4DC');
    expect(await screen.findByText('Distribution Centre N4DC is not in this snapshot')).toBeInTheDocument();
    expect(countOf('/v1/dcs/N4DC')).toBe(0);
  });

  it('shows the legacy DC stock bucket of options held at no store', async () => {
    renderAt(`/style-actions-product/dc/V012?snap=${LEGACY}`);
    expect(await screen.findByTestId('dc-stock-unclassified-units')).toHaveTextContent('20');
    expect(screen.getByText('Not stocked at any store (attributes pending extend)')).toBeInTheDocument();
  });

  it('never switches silently away from a snapshot that is no longer kept', async () => {
    renderAt('/style-actions-product/dc/S3KG?snap=snap_gone');
    expect(await screen.findByText('This snapshot is no longer kept')).toBeInTheDocument();
    expect(screen.getByTestId('open-latest-snapshot')).toHaveTextContent('Open the latest snapshot (as of Sep 29, 2026)');
    expect(countOf('/v1/dcs/S3KG')).toBe(0);
  });
});

describe('Store workspace (SAPR-10) in Scope 2a', () => {
  it('derives the DC from the store, shows the breadcrumb, deltas and the brick matrix lens', async () => {
    renderAt('/style-actions-product?store=8080');
    expect(await screen.findByTestId('store-options-8080')).toHaveTextContent('7');
    expect(screen.getByTestId('breadcrumb-dc')).toHaveTextContent('S3KG');
    expect(screen.getByTestId('store-delta-saleable')).toHaveTextContent('+10');
    expect(screen.getByTestId('gap-total')).toHaveTextContent('7');
    await userEvent.setup().click(screen.getByTestId('store-picker'));
    expect(await screen.findByTestId('store-count')).toHaveTextContent('3 stores with data · 1 without');
    expect(await screen.findByTestId('matrix-cell-WOMEN-TOP-Fashion')).toHaveTextContent(/^10$/);
    expect(screen.getByTestId('lens-scope1')).toHaveTextContent('Units short');
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('dc=S3KG'));
  });

  it('makes one request per bound operation on page load, except three option lists', async () => {
    renderAt('/style-actions-product?store=8080');
    await screen.findByTestId('matrix-cell-WOMEN-TOP-Fashion');
    await screen.findByTestId('attention-exit-700000005_GRN');
    for (const path of ['/v1/health', '/v1/snapshots', '/v1/dcs', '/v1/stores', '/v1/stores/8080/bricks', '/v1/lifecycle']) expect(countOf(path), path).toBe(1);
    // The worklist plus the band's two option lists (S2-C40 accepts three listOptionStores calls, as in Scope 1a).
    expect(countOf('/v1/option-stores')).toBe(3);
  });

  it('filters the worklist by a matrix cell', async () => {
    const user = userEvent.setup();
    renderAt('/style-actions-product?store=8080');
    await user.click(await screen.findByTestId('matrix-cell-WOMEN-TOP-Fashion'));
    expect(await screen.findByTestId('worklist-cell-filter')).toHaveTextContent('Brick: WOMEN · TOP · Fashion');
    expect(screen.getByTestId('location')).toHaveTextContent('brick=TOP');
    await user.click(screen.getByTestId('worklist-cell-filter'));
    expect(screen.queryByTestId('worklist-cell-filter')).not.toBeInTheDocument();
  });

  it('switches snapshot from the picker, keeping the store and showing no delta on the earliest snapshot', async () => {
    const user = userEvent.setup();
    renderAt('/style-actions-product?store=8080');
    expect(await screen.findByTestId('store-delta-saleable')).toHaveTextContent('+10');
    await user.click(screen.getByTestId('snapshot-picker'));
    await user.click(await screen.findByTestId(`snapshot-option-${LEGACY}`));
    await waitFor(() => expect(screen.getByTestId('snapshot-current')).toHaveTextContent('Sep 22, 2026'));
    expect(await screen.findByTestId('store-delta-saleable')).toHaveTextContent('—');
    expect(screen.getByTestId('store-options-8080')).toHaveTextContent('7');
    expect(screen.getByTestId('location')).toHaveTextContent(`snap=${LEGACY}`);
  });

  it('opens on the first store of a DC chosen by link', async () => {
    renderAt('/style-actions-product?dc=V012');
    expect(await screen.findByTestId('store-options-TX3X')).toHaveTextContent('11');
    await userEvent.setup().click(screen.getByTestId('store-picker'));
    expect(await screen.findByTestId('store-count')).toHaveTextContent('1 store with data');
  });

  it('says a DC is not in the snapshot', async () => {
    renderAt('/style-actions-product?dc=N4DC');
    expect(await screen.findByText('Distribution Centre N4DC is not in this snapshot')).toBeInTheDocument();
  });

  it('waits on the new snapshot by name after a build: snapshot-current moves from the legacy date to the new one', async () => {
    canBuild = true;
    snapshotsList = [snapshot(LEGACY, '2026-09-22', '2026-10-05T08:00:00+00:00')];
    const user = userEvent.setup();
    renderAt('/style-actions-product?panel=health&store=ZZZ9');
    expect(await screen.findByTestId('snapshot-current')).toHaveTextContent('Sep 22, 2026');
    await user.click(await screen.findByTestId('build-snapshot'));
    await waitFor(() => expect(screen.getByTestId('snapshot-current')).toHaveTextContent('Sep 29, 2026'), { timeout: 6000 });
    expect(screen.getByTestId('location')).toHaveTextContent('snap=snap_new0929');
  }, 10000);

  it('brings back the attention band beside the matrix: behind the curve, day 90+ and data gaps (S2-C39)', async () => {
    renderAt('/style-actions-product?store=8080');
    const band = await screen.findByTestId('attention-band');
    expect(within(band).getByText('Needs attention at Store 8080')).toBeInTheDocument();
    expect(await screen.findByTestId('attention-behind-700000002_RED')).toHaveTextContent('11 short');
    expect(screen.getByTestId('attention-exit-700000005_GRN')).toHaveTextContent('3 on hand');
    expect(screen.getByTestId('gap-code-NEGATIVE_STOCK')).toBeInTheDocument();
    expect(screen.getByTestId('attention-gap-total')).toHaveTextContent('7');
    expect(screen.getAllByTestId('gap-total')).toHaveLength(1);
  });

  it('opens the option drawer from a band row and Data health from a gap row', async () => {
    const user = userEvent.setup();
    renderAt('/style-actions-product?store=8080');
    await user.click(await screen.findByTestId('attention-behind-700000002_RED'));
    expect(screen.getByTestId('location')).toHaveTextContent('option=700000002_RED');
    await user.keyboard('{Escape}');
    await user.click(screen.getByTestId('gap-code-BLANK_OPTION'));
    expect(screen.getByTestId('location')).toHaveTextContent('panel=health');
    expect(screen.getByTestId('location')).toHaveTextContent('code=BLANK_OPTION');
    expect(screen.getByTestId('location')).toHaveTextContent('scope=store');
  });

  it('shows the band error with a retry when its option lists fail, keeping the data gaps', async () => {
    optionStoresFail = true;
    renderAt('/style-actions-product?store=8080');
    const band = await screen.findByTestId('attention-band');
    await waitFor(() => expect(within(band).getAllByText(/Could not load/)).toHaveLength(2));
    expect(within(band).getByTestId('gap-code-NEGATIVE_STOCK')).toBeInTheDocument();
  });

  it('shows the band empty states when nothing is behind or past day 90', async () => {
    renderAt('/style-actions-product?store=5943');
    const band = await screen.findByTestId('attention-band');
    expect(await within(band).findByText('No selling-life option is behind the curve.')).toBeInTheDocument();
    expect(within(band).getByText('No option is past day 90.')).toBeInTheDocument();
    expect(within(band).getByText('No data gaps at this store in this snapshot.')).toBeInTheDocument();
  });

  it('shows matrix units whole, in the cell and in its label (S2-C42)', async () => {
    renderAt('/style-actions-product?store=8080');
    const cell = await screen.findByTestId('matrix-cell-MEN-SHIRT-Ultimate');
    expect(cell).toHaveTextContent(/^2$/);
    expect(screen.getByRole('button', { name: /MEN SHIRT Ultimate: 2 units short/ })).toBeInTheDocument();
  });
});

describe('DC overview selection (S2-C43)', () => {
  it('updates the preview in the same render as the row click', async () => {
    const user = userEvent.setup();
    renderAt('/style-actions-product/dc/S3KG');
    expect(await screen.findByTestId('dc-preview-store')).toHaveTextContent('8080');
    await user.click(screen.getByTestId('dc-store-row-9591'));
    expect(screen.getByTestId('dc-preview-store')).toHaveTextContent('9591');
  });

  it('rounds unit figures whole in the ranked rows and their labels (S2-C42)', async () => {
    renderAt('/style-actions-product/dc/S3KG');
    const row = await screen.findByTestId('dc-store-row-9591');
    expect(row).toHaveTextContent(/4$/);
    expect(row).toHaveAccessibleName(/9591 Store 9591: 4 units short of the curve/);
    expect(screen.getByTestId('dc-total-units-short')).toHaveTextContent('23');
  });
});

describe('URL state (S2-C43)', () => {
  it('keeps both of two changes made in the same tick, e.g. a ranking click then a row click', () => {
    const wrapper = ({ children }: { readonly children: React.ReactNode }): React.ReactNode => (
      <MemoryRouter initialEntries={['/style-actions-product/dc/S3KG?snap=s1']}>{children}</MemoryRouter>
    );
    const { result } = renderHook(() => ({ params: useWorkspaceParams(), location: useLocation() }), { wrapper });
    act(() => {
      result.current.params.update({ ranking: 'data_gaps' });
      result.current.params.update({ store: '9591' });
      result.current.params.fill({ snap: 's2', dc: 'S3KG' });
    });
    expect(result.current.location.search).toBe('?snap=s1&ranking=data_gaps&store=9591&dc=S3KG');
  });
});
