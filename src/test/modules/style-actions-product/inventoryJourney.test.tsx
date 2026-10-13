import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui';
import { apiGet } from '@/modules/style-actions-product/api/client';
import { demoResponse, DEMO_SNAPSHOT_ID } from '@/modules/style-actions-product/data/demoApi';
import { groupInventory, inventoryBalance } from '@/modules/style-actions-product/components/journey/inventoryJourney';
import { loadJourneyInventory } from '@/modules/style-actions-product/components/journey/useJourneyInventory';
import WorkspacePage from '@/modules/style-actions-product/pages/WorkspacePage';
import { useScopeStore } from '@/modules/style-actions-product/stores/useScopeStore';
import type { OptionStoreRow, Page } from '@/modules/style-actions-product/api/types';

vi.mock('@/modules/style-actions-product/api/demoMode', () => ({ STYLE_ACTIONS_DEMO: true }));
vi.mock('@/modules/style-actions-product/api/client', async (original) => ({
  ...await original<typeof import('@/modules/style-actions-product/api/client')>(), apiGet: vi.fn(),
}));
const readDemo = async (path: string, query?: Record<string, string | number | boolean | null | undefined>) => {
  const response = demoResponse('GET', path, query);
  if (!response.ok) throw new Error('Demo request failed');
  return response.json();
};
beforeEach(() => {
  vi.mocked(apiGet).mockReset().mockImplementation(readDemo);
  useScopeStore.setState({ storeCode: null, snapshotId: null });
});
function renderJourney(query = '') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><TooltipProvider><MemoryRouter initialEntries={[`/style-actions-product?snap=${DEMO_SNAPSHOT_ID}&dc=DCWEST&store=PUN01${query}`]}><WorkspacePage /></MemoryRouter></TooltipProvider></QueryClientProvider>);
}

describe('inventory journey data', () => {
  it('reconciles each position independently and retains returns in net sales', async () => {
    const rows = await loadJourneyInventory(DEMO_SNAPSHOT_ID, 'PUN01');
    const balance = inventoryBalance(rows);
    expect(balance.stock + balance.transit + (balance.sold ?? 0)).toBe(rows.reduce((sum, row) => sum + (row.inward ?? 0), 0));
    expect(groupInventory(rows, 'sold', 'life').reduce((sum, group) => sum + group.units, 0)).toBe(balance.sold);
    expect(inventoryBalance([{ ...rows[0], sold: null }]).sold).toBeNull();
    rows[0] = { ...rows[0], sales_14d: -4 };
    for (const [position, field] of [['stock','on_hand'],['transit','transit'],['sold','sales_14d']] as const) {
      const groups = groupInventory(rows, position);
      expect(groups.reduce((sum, group) => sum + group.units, 0)).toBe(rows.reduce((sum, row) => sum + row[field], 0));
      expect(groups.flatMap((group) => group.rows).every((row) => row[field] !== 0)).toBe(true);
    }
    expect(groupInventory(rows, 'sold').flatMap((group) => group.rows)).toContain(rows[0]);
  });
  it('collects every API page and fails closed when a later page is incomplete', async () => {
    const fixture = await readDemo('/v1/option-stores', { snapshot_id: DEMO_SNAPSHOT_ID, store_code: 'PUN01' }) as Page<OptionStoreRow>;
    const rows = Array.from({ length: 405 }, (_, i) => ({ ...fixture.items[0], option_code: `OPT_${i}` }));
    vi.mocked(apiGet).mockImplementation(async (_path, query) => ({ items: rows.slice((Number(query?.page) - 1) * 200, Number(query?.page) * 200), total: rows.length, page: Number(query?.page), page_size: 200 }));
    expect(await loadJourneyInventory('snap', 'STORE')).toHaveLength(405);
    expect(vi.mocked(apiGet).mock.calls.map((call) => call[1]?.page)).toEqual([1,2,3]);
    vi.mocked(apiGet).mockImplementation(async () => ({ items: rows.slice(0, 200), total: rows.length, page: 1, page_size: 200 }));
    await expect(loadJourneyInventory('snap', 'STORE')).rejects.toThrow('complete inventory');
  });
});

describe('progressive disclosure', () => {
  it('starts with positions and bricks, reveals options and sizes, then returns to the same brick', async () => {
    const user = userEvent.setup();
    renderJourney();
    expect(await screen.findByRole('button', { name: 'In store: 6,866 units' })).toHaveAttribute('aria-pressed','true');
    await user.click(await screen.findByRole('button', { name: /^Explore Shirts,/ }));
    await user.click(await screen.findByRole('button', { name: 'Explore 700000004_OLIVE' }));
    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('Engine outputs')).toBeInTheDocument();
    expect(within(dialog).queryByText('The story so far')).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('table', { name: /Sizes of/ })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Cross-check', exact: true })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Inventory mix', exact: true })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Sizes', exact: true })).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Inventory & sizes', exact: true }));
    expect(await within(dialog).findByRole('table', { name: /Sizes of/ })).toBeInTheDocument();
    expect(within(dialog).getByRole('group', { name: 'Option age' })).toBeInTheDocument();
    expect(within(dialog).getByRole('group', { name: 'Option price' })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'View in transit for this option' }));
    expect(within(dialog).getByRole('button', { name: 'Inventory & sizes' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(dialog).getByRole('group', { name: 'Option direction' })).toBeInTheDocument();
    expect(within(dialog).getByRole('table', { name: /Sizes of/ })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Back to Shirts' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Shirts', exact: true })).toBeInTheDocument();
  });
  it('switches to incoming goods and sales without inventing arrival or buying-purpose evidence', async () => {
    const user = userEvent.setup();
    renderJourney();
    await user.click(await screen.findByRole('button', { name: /^Store inventory balance · In transit:/ }));
    await user.click(await screen.findByRole('button', { name: /^Explore Shirts,/ }));
    await user.click((await screen.findAllByRole('button', { name: /^Explore 700/ }))[0]);
    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('Engine outputs')).toBeInTheDocument();
    expect(within(dialog).getByText('Illustrative · no execution')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'View sold for this option' }));
    expect(await within(dialog).findByText('Engine outputs')).toBeInTheDocument();
    expect(within(dialog).queryByText('Did it fulfil the buying objective?')).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Close', exact: true }));
    expect(screen.getByRole('button', { name: 'Sold: 7,398 units since first receipt' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Last 14 days', exact: true }));
    expect(screen.getByRole('columnheader', { name: 'Sold / 14 days', exact: true })).toBeInTheDocument();
  });
  it('restores a linked brick and search and can clear to the full inventory', async () => {
    const user = userEvent.setup();
    renderJourney('&position=stock&jbrick=SHIRTS&jq=700000004');
    expect(await screen.findByRole('button', { name: 'Explore 700000004_OLIVE' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Explore 700/ })).toHaveLength(1);
    await user.clear(screen.getByRole('textbox', { name: 'Search bricks or options' }));
    expect(await screen.findByText(/12 style-colour options/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'All bricks', exact: true }));
    expect(await screen.findAllByRole('button', { name: /^Explore .* options$/ })).toHaveLength(7);
  });
});


describe('stage drill-down', () => {
  it('opens a brick from a stage, combines age and price, and clears incompatible filters on position change', async () => {
    const user = userEvent.setup();
    renderJourney();
    await user.click(await screen.findByRole('button', { name: /^Shirts age · 90[+] days:/ }));
    expect(await screen.findByRole('heading', { name: 'Shirts', exact: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filter Shirts overview age by 90+ days' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Filter Shirts overview price by Liquidation' }));
    expect(screen.getByRole('columnheader', { name: 'Matching units' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filter Shirts overview price by Liquidation' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'In transit: 319 units', exact: true }));
    expect(await screen.findByRole('button', { name: /^Store direction · Coming to store: 216 units/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Store direction · Going from store: 103 units/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reset stages' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Filter Store direction by Going from store' }));
    expect(screen.getByRole('heading', { name: /^103 matching units/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'All options', exact: true }));
    expect(screen.getByRole('columnheader', { name: 'Matching units' })).toBeInTheDocument();
    // An option with outgoing units and no inbound units is still included.
    const outgoingOnly = (await loadJourneyInventory(DEMO_SNAPSHOT_ID, 'PUN01')).find((row) => row.transit === 0 && screen.queryByRole('button', { name: `Explore ${row.option_code}` }));
    expect(outgoingOnly).toBeDefined();
  });
  it('restores linked stage selections and keeps them when switching the sales period', async () => {
    const user = userEvent.setup();
    renderJourney('&position=sold&jage=age_90_plus&jprice=liquidation');
    expect(await screen.findByRole('button', { name: 'Filter Store age by 90+ days' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Filter Store price by Liquidation' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Inventory age at sale')).toBeInTheDocument();
    expect(screen.getByText('Price stage at sale')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Last 14 days', exact: true }));
    expect(screen.getByRole('button', { name: 'Filter Store age by 90+ days' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Filter Store price by Liquidation' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Reset stages' }));
    expect(screen.getByRole('heading', { name: /^1,639 net units sold/ })).toBeInTheDocument();
  });
});
