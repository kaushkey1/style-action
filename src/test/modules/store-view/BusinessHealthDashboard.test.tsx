import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiFetch } from '@/lib/api';
import { BusinessHealthDashboard } from '@/modules/store-view/business-health/BusinessHealthDashboard';
import { range, storeRow } from './companionFixtures';
import { mockCompanionResponses, panel, renderCompanion } from './companionTestUtils';

vi.mock('@/lib/api', () => ({ apiFetch: vi.fn(), apiPost: vi.fn() }));
// Keep the real table, row selection, hooks, API client and currency rendering.
// Browser layout and Leaflet rendering are outside these regressions.
vi.mock('@/modules/store-view/business-health/bhKit', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/modules/store-view/business-health/bhKit')>(),
  StoreMap: () => null, TrendChart: () => null, Donut: () => null, VBarChart: () => null, ScatterCompare: () => null,
}));

beforeEach(() => {
  vi.resetAllMocks();
  mockCompanionResponses();
});

describe('Companion Business Health regressions', () => {
  it('selects a directory row by numeric UID, preserves dates, and clears the filter', async () => {
    const user = userEvent.setup();
    renderCompanion(<BusinessHealthDashboard />, range);
    await user.click(screen.getByRole('button', { name: 'Store Performance' }));
    await user.click(await screen.findByRole('cell', { name: 'TEA3' }));
    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/companion/store-detail', { uid: '1234', ...range }));
    expect(apiFetch).not.toHaveBeenCalledWith('/companion/store-detail', expect.objectContaining({ uid: 'TEA3' }));
    await screen.findByText('Daily orders & e-GMV');
    expect(screen.queryByText('Couldn’t load this data')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear RRL Trends Dehradun filter' }));
    expect(screen.getByText('Store locations')).toBeInTheDocument();
  });

  it('does not request store details when a directory row has no numeric UID', async () => {
    mockCompanionResponses({ '/companion/store-directory': { rows: [{ ...storeRow, uid: null }], total: 1 } });
    const user = userEvent.setup();
    renderCompanion(<BusinessHealthDashboard />);
    await user.click(screen.getByRole('button', { name: 'Store Performance' }));
    await user.click(await screen.findByRole('cell', { name: 'TEA3' }));
    expect(screen.getByText('Store filter')).toBeInTheDocument();
    expect(vi.mocked(apiFetch).mock.calls.filter(([path]) => path === '/companion/store-detail')).toEqual([]);
  });

  it('renders delivery-state revenue from the sales API using raw rupees', async () => {
    const user = userEvent.setup();
    renderCompanion(<BusinessHealthDashboard />, range);
    await user.click(await screen.findByRole('button', { name: 'Show more' }));
    await screen.findByText('Revenue by delivery state');
    expect(panel('Revenue by delivery state').getByText('Maharashtra')).toBeInTheDocument();
    expect(panel('Revenue by delivery state').getByText('₹55.00 L')).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledWith('/companion/sales-detail', range);
  });
});
