import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui';
import { apiGet, StyleActionsApiError } from '@/modules/style-actions-product/api/client';
import { demoResponse, demoEngineInputs, DEMO_SNAPSHOT_ID } from '@/modules/style-actions-product/data/demoApi';
import { loadEngineDecision, loadStoreEngine, engineOptions, filterEngineOptions, movementQuantity, validateStoreEngine, type StoreEngineBundle } from '@/modules/style-actions-product/components/engine/storeEngineData';
import { makeDemoOptionEngine } from '@/modules/style-actions-product/data/demoOptionEngine';
import WorkspacePage from '@/modules/style-actions-product/pages/WorkspacePage';
import { useScopeStore } from '@/modules/style-actions-product/stores/useScopeStore';

vi.mock('@/modules/style-actions-product/api/demoMode', () => ({ STYLE_ACTIONS_DEMO: true }));
vi.mock('@/modules/style-actions-product/api/client', async original => ({ ...await original<typeof import('@/modules/style-actions-product/api/client')>(), apiGet: vi.fn() }));
const inputs = demoEngineInputs(DEMO_SNAPSHOT_ID, 'PUN01');
const demo = inputs.map(makeDemoOptionEngine);
const fixture: StoreEngineBundle = { run: demo[0]!.run, lines: demo.flatMap(bundle => bundle.lines), decisions: demo.flatMap(bundle => bundle.gate ? [bundle.gate] : []), demo: true };
const readDemo = async (path: string, query?: Record<string, string | number | boolean | null | undefined>) => {
  const response = demoResponse('GET', path, query);
  if (!response.ok) throw new StyleActionsApiError(response.status, await response.json());
  return response.json();
};
beforeEach(() => {
  vi.mocked(apiGet).mockReset().mockImplementation(readDemo);
  useScopeStore.setState({ storeCode: null, snapshotId: null });
});
function renderView(query = '&view=engines') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><TooltipProvider><MemoryRouter initialEntries={[`/style-actions-product?snap=${DEMO_SNAPSHOT_ID}&dc=DCWEST&store=PUN01${query}`]}><WorkspacePage /></MemoryRouter></TooltipProvider></QueryClientProvider>);
}
function mockLive(bundle = fixture) {
  vi.mocked(apiGet).mockImplementation(async path => {
    if (path === '/v1/engine/runs') return { items: [{ ...bundle.run, run_id: 'wrong', snapshot_id: 'other', finished_at: '2030-01-01' }, bundle.run] };
    if (path.endsWith('/lines')) return { items: bundle.lines, total: bundle.lines.length };
    if (path.endsWith('/gates')) return { items: bundle.decisions, total: bundle.decisions?.length };
    return bundle.run;
  });
}

describe('store engine outputs', () => {
  it('uses the exact same demo action lines and gates as each option drawer', async () => {
    const result = await loadStoreEngine(DEMO_SNAPSHOT_ID, 'PUN01', true);
    expect(result).toEqual(fixture);
    const options = engineOptions(result!, inputs.map(input => input.row));
    expect(options).toHaveLength(96);
    expect(filterEngineOptions(options, { action: 'all' })).toHaveLength(35);
    expect(filterEngineOptions(options, { action: 'decisions' })).toHaveLength(61);
    expect(movementQuantity(result!.lines)).toEqual({ known: 1535, missing: 0, lines: 24 });
  });
  it('does not double count options across lines, sum price changes as units or classify filtered-out actions as no action', () => {
    const movement = fixture.lines.find(line => line.line_type === 'lifecycle_end')!;
    const markdown = { ...fixture.lines.find(line => line.line_type === 'markdown')!, option_code: movement.option_code, line_id: 'same-option-price' };
    const unknownQuantity = { ...movement, line_id: 'quantity-missing', quantity: null };
    const bundle = { ...fixture, lines: [movement, markdown, unknownQuantity], decisions: fixture.decisions!.filter(gate => gate.option_code === movement.option_code) };
    const options = engineOptions(bundle, inputs.map(input => input.row));
    expect(options).toHaveLength(1);
    expect(options[0]!.lines).toHaveLength(3);
    expect(movementQuantity(bundle.lines)).toEqual({ known: movement.quantity, missing: 1, lines: 2 });
    expect(filterEngineOptions(options, { action: 'decisions', status: 'in_review' })).toHaveLength(0);
    expect(filterEngineOptions(options, { action: 'price' })[0]!.lines).toEqual([markdown]);
  });
  it('retains unknown engines and options missing from the inventory response', () => {
    const line = { ...fixture.lines[0]!, option_code: 'NEW_OPTION', line_type: 'new_engine' };
    const options = engineOptions({ ...fixture, lines: [line], decisions: null }, []);
    expect(options[0]).toMatchObject({ code: 'NEW_OPTION', name: 'NEW_OPTION', brick: 'UNCLASSIFIED', lines: [line] });
    expect(filterEngineOptions(options, { action: 'other' })).toHaveLength(1);
    expect(filterEngineOptions(options, { action: 'all' })).toHaveLength(1);
    expect(filterEngineOptions(options, { action: 'decisions' })).toHaveLength(0);
  });
  it('loads every page from the matching completed run and verifies the scope', async () => {
    mockLive();
    const original = vi.mocked(apiGet).getMockImplementation()!;
    vi.mocked(apiGet).mockImplementation(async (path, query) => path.endsWith('/lines') ? { items: query?.page === 2 ? fixture.lines.slice(20) : fixture.lines.slice(0,20), total: fixture.lines.length, page_size: 20, page: query?.page ?? 1 } : original(path, query));
    const result = await loadStoreEngine(DEMO_SNAPSHOT_ID, 'PUN01', false);
    expect(result?.lines).toHaveLength(35);
    expect(result?.run.run_id).toBe(fixture.run.run_id);
    expect(apiGet).toHaveBeenCalledWith(`/v1/engine/runs/${fixture.run.run_id}/lines`, { store_code: 'PUN01', page: 2, page_size: 20 });
    expect(() => validateStoreEngine({ ...fixture, lines: [{ ...fixture.lines[0]!, store_code: 'OTHER' }] }, DEMO_SNAPSHOT_ID, 'PUN01')).toThrow('do not match');
    expect(() => validateStoreEngine({ ...fixture, lines: [{ ...fixture.lines[0]!, run_id: 'OTHER' }] }, DEMO_SNAPSHOT_ID, 'PUN01')).toThrow('do not match');
    expect(() => validateStoreEngine({ ...fixture, lines: [fixture.lines[0]!, fixture.lines[0]!] }, DEMO_SNAPSHOT_ID, 'PUN01')).toThrow('Duplicate');
  });
  it('rejects partial pages and distinguishes missing decision data from no actions', async () => {
    mockLive();
    const original = vi.mocked(apiGet).getMockImplementation()!;
    vi.mocked(apiGet).mockImplementation(async (path, query) => path.endsWith('/lines') ? { items: fixture.lines.slice(0,5), total: 35 } : original(path, query));
    await expect(loadStoreEngine(DEMO_SNAPSHOT_ID, 'PUN01', false)).rejects.toThrow('incomplete');
    vi.mocked(apiGet).mockImplementation(async (path, query) => {
      if (path.endsWith('/gates')) throw new StyleActionsApiError(404, { code: 'not_found', message: 'Unavailable' });
      return original(path, query);
    });
    expect((await loadStoreEngine(DEMO_SNAPSHOT_ID, 'PUN01', false))?.decisions).toBeNull();
    vi.mocked(apiGet).mockResolvedValue({ items: [{ ...fixture.run, status: 'running' }] });
    expect(await loadStoreEngine(DEMO_SNAPSHOT_ID, 'PUN01', false)).toBeNull();
  });
  it('pins the detail query to the parent run and rejects evidence from another option', async () => {
    const gate = fixture.decisions![0]!;
    vi.mocked(apiGet).mockResolvedValue(gate);
    expect(await loadEngineDecision(fixture.run.run_id, 'PUN01', gate.option_code)).toEqual(gate);
    expect(apiGet).toHaveBeenCalledWith(`/v1/engine/runs/${fixture.run.run_id}/gates/PUN01/${gate.option_code}`);
    await expect(loadEngineDecision(fixture.run.run_id, 'PUN01', 'ANOTHER')).rejects.toThrow('does not match');
  });
});

describe('parallel engine actions view', () => {
  it.each(['engines', 'journey'])('shows outputs with expandable logic and no separate check panels in the %s option drawer', async view => {
    const user = userEvent.setup();
    renderView(`&view=${view}&position=stock&option=700000206_SAND`);
    const drawer = await screen.findByRole('dialog');
    expect(await within(drawer).findByRole('button', { name: 'Inventory & sizes', exact: true })).toBeInTheDocument();
    const outputs = await within(drawer).findByRole('button', { name: 'Engine outputs', exact: true });
    expect(outputs).toHaveAttribute('aria-expanded', 'false');
    expect(within(drawer).queryByRole('table', { name: 'Outputs by engine for this option and store' })).not.toBeInTheDocument();
    await user.click(outputs);
    expect(within(drawer).getByRole('table', { name: 'Outputs by engine for this option and store' })).toBeInTheDocument();
    expect(within(drawer).getByRole('button', { name: 'History', exact: true })).toBeInTheDocument();
    expect(within(drawer).getByRole('button', { name: 'View in store for this option' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(drawer).queryByRole('button', { name: 'View inventory', exact: true })).not.toBeInTheDocument();
    const gates = within(drawer).getByRole('region', { name: 'Decision gates' });
    expect(within(gates).getByRole('heading', { name: 'G0 · Eligibility', exact: true })).toBeInTheDocument();
    expect(within(gates).getByText('Exit day')).toBeInTheDocument();
    expect(within(gates).queryByRole('button', { name: 'G0 Eligibility Exit' })).not.toBeInTheDocument();
    expect(within(drawer).queryByRole('button', { name: /^G[1-4] / })).not.toBeInTheDocument();
    expect(within(drawer).queryByRole('table', { name: 'Engine inputs compared to option snapshot evidence' })).not.toBeInTheDocument();
    expect(within(drawer).queryByRole('region', { name: 'Replenishment evaluation' })).not.toBeInTheDocument();
    expect(within(drawer).queryByRole('button', { name: 'Inspect Replenishment checks' })).not.toBeInTheDocument();
    expect(within(drawer).queryByRole('button', { name: /^Cross-check/ })).not.toBeInTheDocument();
    expect(within(drawer).queryByRole('region', { name: 'Engine logic explorer' })).not.toBeInTheDocument();
    expect(within(drawer).getByRole('button', { name: 'Engine logic', exact: true })).toHaveAttribute('aria-expanded', 'false');
    await user.click(within(drawer).getByRole('button', { name: 'Engine logic', exact: true }));
    expect(await within(drawer).findByRole('group', { name: 'Whole engine workflow flowchart' })).toBeInTheDocument();
    expect(within(drawer).getByRole('table', { name: 'Outputs by engine for this option and store' })).toBeInTheDocument();
    await user.click(within(drawer).getByRole('button', { name: 'Engine logic', exact: true }));
    expect(within(drawer).queryByRole('region', { name: 'Engine logic explorer' })).not.toBeInTheDocument();
    expect(within(drawer).getByRole('table', { name: 'Outputs by engine for this option and store' })).toBeInTheDocument();
    await user.click(outputs);
    expect(outputs).toHaveAttribute('aria-expanded', 'false');
    expect(within(drawer).queryByRole('table', { name: 'Outputs by engine for this option and store' })).not.toBeInTheDocument();
  });
  it('opens full inventory details from engine outputs and keeps the filtered engine list on close', async () => {
    const user = userEvent.setup();
    renderView();
    expect(await screen.findByRole('button', { name: 'All actions · 35 lines' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Engine actions', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('Inventory age in store')).not.toBeInTheDocument();
    const legend = () => within(screen.getByRole('group', { name: 'Engine output mix' }));
    expect(legend().getAllByRole('button', { name: /^Filter Engine output mix by / })).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Explore Move stock' }));
    expect(legend().getAllByRole('button', { name: /^Filter Engine output mix by / })).toHaveLength(1);
    expect(legend().queryByRole('button', { name: /Filter Engine output mix by (Replenishment|Broken sizes|Consolidation|Overfill|Replacement)/ })).not.toBeInTheDocument();
    expect(legend().queryByRole('button', { name: 'Filter Engine output mix by Markdown' })).not.toBeInTheDocument();
    expect(legend().getByRole('button', { name: 'Engine output mix · Lifecycle exit: 24' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Explore Change price' }));
    expect(legend().getAllByRole('button', { name: /^Filter Engine output mix by / })).toHaveLength(1);
    expect(legend().getByRole('button', { name: 'Filter Engine output mix by Markdown' })).toBeInTheDocument();
    expect(legend().getByRole('button', { name: 'Engine output mix · Markdown: 11' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Explore engine outputs for Chinos' }));
    expect(legend().getAllByRole('button', { name: /^Filter Engine output mix by / })).toHaveLength(1);
    expect(screen.getByRole('table', { name: 'Produced engine actions by option' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Shadow · 1', exact: true })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Inspect 700000305_ROSE' }));
    const drawer = await screen.findByRole('dialog');
    expect(await within(drawer).findByText('Engine outputs')).toBeInTheDocument();
    const inventoryTab = await within(drawer).findByRole('button', { name: 'Inventory & sizes', exact: true });
    expect(within(drawer).getByText('G4 · Deciding')).toBeInTheDocument();
    await user.click(inventoryTab);
    expect(within(drawer).getByRole('table', { name: /Sizes of 700000305_ROSE/ })).toBeInTheDocument();
    expect(within(drawer).getByRole('group', { name: 'Option age' })).toBeInTheDocument();
    await user.click(within(drawer).getByRole('button', { name: 'View in transit for this option' }));
    expect(inventoryTab).toHaveAttribute('aria-pressed', 'true');
    expect(within(drawer).getByRole('group', { name: 'Option direction' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close', exact: true }));
    expect(screen.getByRole('button', { name: 'Engine actions', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Chinos', exact: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Shadow · 1', exact: true })).toBeInTheDocument();
  });
  it('shows recorded no-line decisions and preserves inventory drill-down when switching views', async () => {
    const user = userEvent.setup();
    renderView('&jbrick=TEES&jage=age_90_plus');
    await user.click(await screen.findByRole('button', { name: 'Engine actions', exact: true }));
    await user.click(await screen.findByRole('button', { name: 'Explore No action lines' }));
    expect(screen.getByText('61 recorded decisions · no emitted action line')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'All options', exact: true }));
    expect(screen.getByRole('table', { name: 'Recorded engine decisions without action lines' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Inventory journey', exact: true }));
    expect(await screen.findByRole('heading', { name: 'Tees', exact: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filter Tees overview age by 90+ days' })).toHaveAttribute('aria-pressed', 'true');
  });
  it('restores linked engine, brick and search filters', async () => {
    renderView('&view=engines&eaction=price&eengine=markdown&ebrick=CHINOS&eq=700000305');
    expect(await screen.findByRole('button', { name: 'Inspect 700000305_ROSE' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Inspect / })).toHaveLength(1);
    expect(screen.getByRole('textbox', { name: 'Search engine outputs' })).toHaveValue('700000305');
  });
});


it('keeps emitted outputs and their drawer visible when inventory evidence is unavailable', async () => {
  vi.mocked(apiGet).mockImplementation(async (path, query) => {
    if (path.startsWith('/v1/option-stores')) throw new Error('Inventory unavailable');
    return readDemo(path, query);
  });
  const user = userEvent.setup();
  renderView();
  expect(await screen.findByRole('button', { name: 'All actions · 35 lines' })).toBeInTheDocument();
  expect(screen.getByText('Product labels unavailable. Outputs are shown by option code.')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'All options', exact: true }));
  await user.click(screen.getByRole('button', { name: `Inspect ${fixture.lines[0]!.option_code}` }));
  const drawer = await screen.findByRole('dialog');
  expect(await within(drawer).findByText('Engine outputs')).toBeInTheDocument();
  await user.click(within(drawer).getByRole('button', { name: 'Engine outputs', exact: true }));
  expect(within(drawer).getByRole('table', { name: 'Outputs by engine for this option and store' })).toBeInTheDocument();
  await user.click(within(drawer).getByRole('button', { name: 'Engine logic', exact: true }));
  expect(within(drawer).getByRole('group', { name: 'Whole engine workflow flowchart' })).toBeInTheDocument();
});
