import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui';
import { AdminAOPConfigPage } from '@/modules/admin/pages/AdminAOPConfigPage';
import { aopAdminApi } from '@/modules/admin/api/aopAdminApi';
import { useAopAdminDraftStore } from '@/modules/admin/stores/useAopAdminDraftStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import { adminChannels, channelTemplate, planningConfiguration as configuration } from './aopFixtures';

vi.mock('@/modules/admin/api/aopAdminApi', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/modules/admin/api/aopAdminApi')>();
  return { ...original, aopAdminApi: { config: vi.fn(), parameters: vi.fn(), preview: vi.fn(), save: vi.fn(), metrics: vi.fn() } };
});
vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ success: vi.fn() }) }));

function showPage(): ReturnType<typeof render> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<MemoryRouter><QueryClientProvider client={client}><TooltipProvider><AdminAOPConfigPage /></TooltipProvider></QueryClientProvider></MemoryRouter>);
}

beforeEach(() => {
  vi.clearAllMocks();
  useAopAdminDraftStore.setState({ drafts: {} });
  useAuthStore.setState({ tenantId: 'tenant', resolvedOrgId: 'org' });
  vi.mocked(aopAdminApi.config).mockResolvedValue({ configuration: configuration(), can_write: true, channels: adminChannels, channel_defaults_template: channelTemplate });
  vi.mocked(aopAdminApi.metrics).mockResolvedValue({ items: [] });
  vi.mocked(aopAdminApi.preview).mockResolvedValue({ changes: [{ entity_type: 'planning_settings', entity_key: { field: 'initial_growth_pct' }, action: 'change', old_value: 10, new_value: 15 }], affected_cells: 0, affected_sites: 0, missing_cells: 0 });
  vi.mocked(aopAdminApi.save).mockResolvedValue({ configuration: { ...configuration(), version_no: 2, config_id: 'config-2' }, changes: [] });
});

async function previewChanges(): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  fireEvent.change(screen.getByLabelText('Reason for change'), { target: { value: 'Reviewed planning assumptions' } });
  await userEvent.click(screen.getByRole('button', { name: 'Preview changes' }));
  await screen.findByRole('button', { name: 'Confirm Save' });
}

describe('AOP financial configuration', () => {
  it('opens with three tabs, AOP defaults and no site parameter requests', async () => {
    showPage();
    expect(await screen.findByRole('textbox', { name: 'Initial growth%' })).toHaveValue('10');
    expect(screen.getByRole('textbox', { name: 'Maximum cell increase%' })).toHaveValue('40');
    expect(screen.getByRole('textbox', { name: 'Fallback gross margin%' })).toHaveValue('12');
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Planning Parameters', 'Planning & Seasons', 'KPI Metrics & Formulae']);
    expect(screen.queryByText(/Version History|Audit Log|Initialise from OTB/)).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByText('Category allocation defaults')).not.toBeInTheDocument();
    expect(screen.queryByRole('table', { name: 'Channel planning defaults' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add Channel' })).not.toBeInTheDocument();
    expect(aopAdminApi.parameters).not.toHaveBeenCalled();
    expect(screen.getByText(/do not affect AOP plans or calculations/)).toBeVisible();
  });

  it('ignores retained drafts for removed fields when saving the remaining settings', async () => {
    useAopAdminDraftStore.getState().edit('tenant:org', configuration(), {
      operation: { op: 'set_setting', section: 'planning_settings', path: ['category_allocation_defaults', 'EBO', 'Shirt'], value: 20 },
    });
    useAopAdminDraftStore.getState().edit('tenant:org', configuration(), {
      operation: { op: 'set_setting', section: 'planning_settings', path: ['monthly_phasing_defaults', 'apr'], value: 20 },
    });
    useAopAdminDraftStore.getState().edit('tenant:org', configuration(), {
      operation: { op: 'set_channel_setting', channel: 'EBO', field: 'gm_pct_target', value: 30 },
    });
    useAopAdminDraftStore.getState().edit('tenant:org', configuration(), {
      operation: { op: 'set_channel_setting', channel: 'EBO', field: 'discount_pct', value: 99 },
    });
    useAopAdminDraftStore.getState().edit('tenant:org', configuration(), {
      operation: { op: 'set_setting', section: 'planning_settings', path: ['channel_planning_defaults', 'EBO', 'growth_pct'], value: 30 },
    });
    useAopAdminDraftStore.getState().edit('tenant:org', configuration(), {
      operation: { op: 'add_channel', channel: 'Marketplace', settings: { ...channelTemplate, gsv_target: 5 } },
    });
    useAopAdminDraftStore.getState().edit('tenant:org', configuration(), {
      operation: { op: 'set_season', season: { season_code: 'SS', season_name: 'Spring/Summer', months: [3, 4, 5, 6] } },
    });
    useAopAdminDraftStore.getState().edit('tenant:org', configuration(), {
      operation: { op: 'remove_season', season: { code: 'AW' } },
    });
    showPage();
    const growth = await screen.findByRole('textbox', { name: 'Initial growth%' });
    expect(screen.queryByText('Category allocation defaults')).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'GM target %' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'EBO monthly site parameters' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('textbox', { name: 'EBO NSM%' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'EBO Discount%' })).toHaveValue('20');
    expect(screen.queryByText('Marketplace')).not.toBeInTheDocument();
    fireEvent.change(growth, { target: { value: '15' } });
    await previewChanges();
    expect(vi.mocked(aopAdminApi.preview).mock.calls[0]?.[0].operations).toEqual([
      { op: 'set_setting', section: 'planning_settings', path: 'initial_growth_pct', value: 15 },
    ]);
  });

  it('validates and saves planning settings after review', async () => {
    showPage();
    fireEvent.change(await screen.findByRole('textbox', { name: 'Initial growth%' }), { target: { value: '15' } });
    await previewChanges();
    expect(aopAdminApi.save).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Save' }));
    await waitFor(() => expect(aopAdminApi.save).toHaveBeenCalledOnce());
    expect(vi.mocked(aopAdminApi.save).mock.calls[0]?.[0]).toMatchObject({
      baseConfigId: 'config-1', baseVersion: 1,
      operations: [{ op: 'set_setting', section: 'planning_settings', path: 'initial_growth_pct', value: 15 }],
    });
  });

  it('retries a failed save with the same request and keeps pending values', async () => {
    vi.mocked(aopAdminApi.save).mockRejectedValueOnce(new Error('Connection interrupted'));
    showPage();
    fireEvent.change(await screen.findByRole('textbox', { name: 'Initial growth%' }), { target: { value: '15' } });
    await previewChanges();
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Save' }));
    expect(await screen.findByText('Connection interrupted')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Save' }));
    await waitFor(() => expect(aopAdminApi.save).toHaveBeenCalledTimes(2));
    expect(vi.mocked(aopAdminApi.save).mock.calls[0]?.[0]).toEqual(vi.mocked(aopAdminApi.save).mock.calls[1]?.[0]);
  });

  it('allows removing a saved setting and reset restores its value', async () => {
    showPage();
    const field = await screen.findByRole('textbox', { name: 'Initial growth%' });
    fireEvent.change(field, { target: { value: '' } });
    expect(screen.queryByText('Enter a number')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled();
    expect(Object.values(useAopAdminDraftStore.getState().drafts['tenant:org'].changes)[0].operation).toMatchObject({ value: null });
    await userEvent.click(screen.getByRole('button', { name: 'Reset Changes' }));
    expect(field).toHaveValue('10');
  });

  it('renders unconfigured fields blank and saves the first edit without seeding values', async () => {
    const empty = configuration();
    empty.config_id = null; empty.version_no = 0;
    empty.planning_settings = { initial_growth_pct: null, max_cell_increase_ratio: null, new_store_gm_fallback_pct: null, channel_planning_defaults: {}, aop_achievement_ratio: null };
    empty.kpi_settings = { growth: { warning_min_pct: null, warning_max_pct: null }, high_growth: { threshold_pct: null }, steep_decline: { threshold_pct: null }, quarterly_phasing: { deviation_pp: null } };
    vi.mocked(aopAdminApi.config).mockResolvedValue({ configuration: empty, can_write: true, channels: adminChannels, channel_defaults_template: { ...channelTemplate, discount_pct: null, lc_mrp_multiple: null } });
    showPage();
    expect(await screen.findByRole('textbox', { name: 'Initial growth%' })).toHaveValue('');
    for (const label of ['Maximum cell increase%', 'Fallback gross margin%', 'EBO NSM%', 'EBO Sell-through%', 'EBO Discount%', 'EBO AOP Achievement%']) {
      expect(screen.getByRole('textbox', { name: label })).toHaveValue('');
    }
    expect(aopAdminApi.save).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('tab', { name: 'KPI Metrics & Formulae' }));
    expect(screen.getByRole('textbox', { name: 'Growth warning maximum' })).toHaveValue('');
    fireEvent.change(screen.getByRole('textbox', { name: 'Growth warning maximum' }), { target: { value: '25' } });
    await previewChanges();
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Save' }));
    await waitFor(() => expect(aopAdminApi.save).toHaveBeenCalledOnce());
    expect(vi.mocked(aopAdminApi.save).mock.calls[0]?.[0]).toMatchObject({ baseConfigId: null, baseVersion: 0,
      operations: [{ op: 'set_setting', section: 'kpi_settings', path: 'growth.warning_max_pct', value: 25 }] });
  });

  it('shows saved season and fiscal calendars as read-only with planning rules', async () => {
    showPage();
    await userEvent.click(await screen.findByRole('tab', { name: 'Planning & Seasons' }));
    expect(screen.getByRole('heading', { name: 'Season Calendar' })).toBeVisible();
    expect(screen.getByText('February–July')).toBeVisible();
    expect(screen.getByText('August–January')).toBeVisible();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add season|Remove/ })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/year/i)).not.toBeInTheDocument();
    expect(screen.getByText('April–March')).toBeVisible();
    expect(screen.queryByText('Monthly phasing defaults')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('Partial-history stores:')).toBeVisible();
  });

  it('shows formula accordions and validates the growth warning range', async () => {
    vi.mocked(aopAdminApi.metrics).mockResolvedValue({ items: [
      { key: 'gm', group: 'Sales and margin', name: 'Gross margin', formula: 'NSV − COGS', unit: 'crore', inputs: ['nsv', 'cogs'] },
    ] });
    showPage();
    await userEvent.click(await screen.findByRole('tab', { name: 'KPI Metrics & Formulae' }));
    const group = await screen.findByRole('button', { name: 'Sales and margin 1' });
    expect(screen.getByText('NSV − COGS')).toBeVisible();
    await userEvent.click(group);
    await waitFor(() => expect(screen.queryByText('NSV − COGS')).not.toBeInTheDocument());
    fireEvent.change(screen.getByRole('textbox', { name: 'Growth warning minimum' }), { target: { value: '30' } });
    expect(screen.getByRole('alert')).toHaveTextContent('Growth warning minimum must not exceed the maximum.');
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
  });

  it('shows database errors and permits retry without fabricated defaults', async () => {
    vi.mocked(aopAdminApi.config).mockRejectedValueOnce(new Error('Database unavailable'));
    showPage();
    expect(await screen.findByText('Database unavailable')).toBeVisible();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('textbox', { name: 'Initial growth%' })).toBeVisible();
  });

  it('disables fields for read-only access', async () => {
    vi.mocked(aopAdminApi.config).mockResolvedValue({ configuration: configuration(), can_write: false, channels: adminChannels, channel_defaults_template: channelTemplate });
    showPage();
    expect(await screen.findByRole('textbox', { name: 'Initial growth%' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'EBO NSM%' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Save Changes' })).not.toBeInTheDocument();
  });
});
