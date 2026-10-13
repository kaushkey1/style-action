import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiFetch } from '@/lib/api';
import { CHART_STATUS } from '@/data/chartColors';
import { companionApi } from '@/modules/store-view/api/companionApi';
import { ProductHealthDashboard } from '@/modules/store-view/product-health/ProductHealthDashboard';
import { cx, discovery, overview, range } from './companionFixtures';
import { mockCompanionResponses, panel, renderCompanion } from './companionTestUtils';

vi.mock('@/lib/api', () => ({ apiFetch: vi.fn(), apiPost: vi.fn() }));
// Keep real navigation, tables, pagination, KPIs, gauges, funnels and hooks.
vi.mock('@/modules/store-view/business-health/bhKit', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/modules/store-view/business-health/bhKit')>(),
  TrendChart: () => null, Donut: () => null, VBarChart: () => null,
}));
vi.mock('@/modules/store-view/product-health/phKit', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/modules/store-view/product-health/phKit')>(),
  StackedBar: () => null,
}));

beforeEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
  mockCompanionResponses();
});

const sections = [
  ['Product Overview', 'productOverview', '/companion/product-overview', '7,731'],
  ['Journey & Funnel', 'journeyFunnel', '/companion/journey-funnel', '47'],
  ['Discovery & Catalogue', 'discoveryCatalogue', '/companion/discovery-catalogue', 'AR439409'],
  ['Customer Experience', 'productCx', '/companion/product-cx', '1,234'],
] as const;

describe('Companion Product Health live sections', () => {
  it.each(sections)('renders %s using its API data and selected dates', async (label, _method, path, value) => {
    const user = userEvent.setup();
    renderCompanion(<ProductHealthDashboard />, range);
    await user.click(screen.getByRole('button', { name: label }));
    expect(await screen.findByText(value)).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledWith(path, range);
    expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'AI insights' })).toBeDisabled();
  });

  it.each(sections)('shows an error and retries %s without substituting mock KPIs', async (label, method, _path, value) => {
    vi.spyOn(companionApi, method).mockRejectedValueOnce(new Error('Unavailable'));
    const user = userEvent.setup();
    renderCompanion(<ProductHealthDashboard />, range);
    await user.click(screen.getByRole('button', { name: label }));
    expect(await screen.findByText('Couldn’t load Product Health')).toBeInTheDocument();
    expect(screen.queryByText(value)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText(value)).toBeInTheDocument();
    expect(screen.queryByText('Couldn’t load Product Health')).not.toBeInTheDocument();
  });

  it('shows loading until a response arrives, then shows the API value', async () => {
    let complete!: (data: typeof overview) => void;
    vi.spyOn(companionApi, 'productOverview').mockImplementationOnce(() => new Promise((resolve) => { complete = resolve; }));
    renderCompanion(<ProductHealthDashboard />);
    expect(screen.getByRole('status', { name: 'Loading Product Health' })).toBeInTheDocument();
    expect(screen.queryByText('Active users')).not.toBeInTheDocument();
    complete(overview);
    expect(await screen.findByText('7,731')).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Loading Product Health' })).not.toBeInTheDocument();
  });

  it('distinguishes an empty period from a service error', async () => {
    mockCompanionResponses({ '/companion/product-overview': { ...overview, hasData: false, overviewKpis: [] } });
    renderCompanion(<ProductHealthDashboard />);
    expect(await screen.findByText('No activity in this date range')).toBeInTheDocument();
    expect(screen.queryByText('Couldn’t load Product Health')).not.toBeInTheDocument();
    expect(screen.queryByText('7,731')).not.toBeInTheDocument();
  });

  it('switches session/user counts and marks unavailable diagnostics explicitly', async () => {
    const user = userEvent.setup();
    renderCompanion(<ProductHealthDashboard />);
    await user.click(screen.getByRole('button', { name: 'Journey & Funnel' }));
    await screen.findByText('Diagnostics unavailable');
    expect(panel('Companion funnel').getByText('302')).toBeInTheDocument();
    expect(panel('Companion funnel').getByText('−0 drop-off (0%)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'users' }));
    expect(panel('Companion funnel').getByText('202')).toBeInTheDocument();
    expect(panel('Companion funnel').queryByText('302')).not.toBeInTheDocument();
    expect(screen.getByText('Session paths, exit points and journey duration are not available yet.')).toBeInTheDocument();
    expect(panel('Scanner drop-off').getByText(/— of scanner-opened/)).toBeInTheDocument();
  });

  it('labels completed/missing products and displays SAP completion with the live AJIO CE context', async () => {
    mockCompanionResponses({ '/companion/discovery-catalogue': { ...discovery, catalogueCompletionPct: 52 } });
    const user = userEvent.setup();
    renderCompanion(<ProductHealthDashboard />, range);
    await user.click(screen.getByRole('button', { name: 'Discovery & Catalogue' }));
    await screen.findByText('Overall completion');
    expect(panel('Overall completion').getByText('28.45%')).toBeInTheDocument();
    expect(panel('Overall completion').getByText('Catalogue completion (SAP)')).toBeInTheDocument();
    expect(panel('Overall completion').getByText('SAP is 99%+ of total product volume — AJIO CE is separately ~99.6% complete')).toBeInTheDocument();
    expect(panel('Overall completion').queryByText('52%')).not.toBeInTheDocument();
    expect(screen.getByText('Completed Products')).toBeInTheDocument();
    expect(screen.getByText('Missing Products')).toBeInTheDocument();
    expect(screen.getByText('569', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('1,431', { selector: 'p' })).toBeInTheDocument();
    expect(screen.queryByText('Complete catalogue')).not.toBeInTheDocument();
    expect(screen.queryByText('Missing catalogue')).not.toBeInTheDocument();
    expect(panel('Overall completion').getByText('Snapshot: 2026-08-17T10:00:00')).toBeInTheDocument();
    expect(panel('Media coverage by pipeline').getByText('AJIO · video')).toBeInTheDocument();
    expect(screen.getByText('Missing EAN')).toBeInTheDocument();
    expect(screen.getByText('AR439409')).toBeInTheDocument();
  });

  it('does not substitute OVERALL or AJIO CE completion when SAP is unavailable', async () => {
    mockCompanionResponses({ '/companion/discovery-catalogue': {
      ...discovery, pipelineCompletion: [{ pipeline: 'AJIO CE', value: 99.58 }],
    } });
    const user = userEvent.setup();
    renderCompanion(<ProductHealthDashboard />);
    await user.click(screen.getByRole('button', { name: 'Discovery & Catalogue' }));
    await screen.findByText('SAP catalogue completion unavailable');
    expect(panel('Overall completion').queryByText('28.45%')).not.toBeInTheDocument();
    expect(panel('Pipeline overview').getByText('99.6%')).toBeInTheDocument();
    expect(screen.getByText('—', { selector: 'p' })).toHaveClass('text-gray-900');
  });

  it.each([
    [0, 'critical', 'text-red-600'],
    [28.45, 'critical', 'text-red-600'],
    [49.99, 'critical', 'text-red-600'],
    [50, 'warning', 'text-amber-600'],
    [79.99, 'warning', 'text-amber-600'],
    [80, 'success', 'text-green-600'],
    [100, 'success', 'text-green-600'],
  ] as const)('colors SAP completion at %s%% according to its value', async (value, status, textClass) => {
    mockCompanionResponses({ '/companion/discovery-catalogue': {
      ...discovery, pipelineCompletion: [{ pipeline: 'SAP', value }],
    } });
    const user = userEvent.setup();
    renderCompanion(<ProductHealthDashboard />);
    await user.click(screen.getByRole('button', { name: 'Discovery & Catalogue' }));
    const gauge = await screen.findByRole('img', { name: `Catalogue completion (SAP): ${value}% (${status})` });
    expect(gauge.querySelector('circle[stroke-dasharray]')).toHaveAttribute('stroke', CHART_STATUS[status]);
    expect(screen.getByText(`${value.toFixed(2)}%`, { selector: 'p' })).toHaveClass(textClass);
    expect(screen.getByText('569', { selector: 'p' })).toHaveClass('text-gray-900');
  });

  it.each(['85.3%', '0.0%'])('derives the AJIO CE subtitle from its pipeline overview percentage (%s)', async (pct) => {
    mockCompanionResponses({ '/companion/discovery-catalogue': {
      ...discovery,
      pipelineOverview: discovery.pipelineOverview.map((row) => row.pipeline === 'AJIO CE' ? { ...row, pct } : row),
    } });
    const user = userEvent.setup();
    renderCompanion(<ProductHealthDashboard />);
    await user.click(screen.getByRole('button', { name: 'Discovery & Catalogue' }));
    await screen.findByText(`SAP is 99%+ of total product volume — AJIO CE is separately ~${pct} complete`);
    expect(panel('Pipeline overview').getByText(pct)).toBeInTheDocument();
  });

  it('does not invent an AJIO CE completion percentage when its row is missing', async () => {
    mockCompanionResponses({ '/companion/discovery-catalogue': {
      ...discovery, pipelineOverview: discovery.pipelineOverview.filter((row) => row.pipeline !== 'AJIO CE'),
    } });
    const user = userEvent.setup();
    renderCompanion(<ProductHealthDashboard />);
    await user.click(screen.getByRole('button', { name: 'Discovery & Catalogue' }));
    await screen.findByText('SAP is 99%+ of total product volume — AJIO CE completion is unavailable');
    expect(panel('Overall completion').queryByText(/99\.6/)).not.toBeInTheDocument();
  });

  it.each(['Product Overview', 'Customer Experience'])('shows the CX quality warning in %s', async (label) => {
    const cxDataQuality = { trustworthy: false, responseIdsUnique: false, storeMatchCoveragePct: 60, note: 'Store-match coverage needs review.' };
    mockCompanionResponses({ '/companion/product-overview': { ...overview, cxDataQuality }, '/companion/product-cx': { ...cx, cxDataQuality } });
    const user = userEvent.setup();
    renderCompanion(<ProductHealthDashboard />);
    await user.click(screen.getByRole('button', { name: label }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Store-match coverage needs review.');
  });

  it('paginates CX feedback, resets on date change, and preserves deployment inventory', async () => {
    const user = userEvent.setup();
    const view = renderCompanion(<ProductHealthDashboard />, range);
    await user.click(screen.getByRole('button', { name: 'Customer Experience' }));
    await screen.findByText('Feedback store 1');
    const title = 'Rating & response comparison by store';
    expect(panel(title).getByText('1–20 of 25')).toBeInTheDocument();
    expect(panel(title).queryByText('Feedback store 21')).not.toBeInTheDocument();
    await user.click(panel(title).getByRole('button', { name: 'Next page' }));
    expect(panel(title).getByText('21–25 of 25')).toBeInTheDocument();
    expect(panel(title).getByText('Feedback store 21')).toBeInTheDocument();
    expect(panel(title).queryByText('Feedback store 1')).not.toBeInTheDocument();
    expect(panel(title).getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(panel('Survey deployment inventory').getByText('survey-a')).toBeInTheDocument();
    view.changeRange({ from: '2026-09-29', to: '2026-09-29' });
    await waitFor(() => expect(panel(title).getByText('1–20 of 25')).toBeInTheDocument());
    expect(apiFetch).toHaveBeenCalledWith('/companion/product-cx', { from: '2026-09-29', to: '2026-09-29' });
  });

  it('shows an empty store-feedback state instead of pagination over nonexistent rows', async () => {
    mockCompanionResponses({ '/companion/product-cx': { ...cx, hasData: false, cxFeedbackTable: [] } });
    const user = userEvent.setup();
    renderCompanion(<ProductHealthDashboard />);
    await user.click(screen.getByRole('button', { name: 'Customer Experience' }));
    await screen.findByText('No store feedback in this date range');
    expect(panel('Rating & response comparison by store').queryByRole('button', { name: 'Next page' })).not.toBeInTheDocument();
  });
});
