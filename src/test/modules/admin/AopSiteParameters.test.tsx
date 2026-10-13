import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui';
import { AdminAOPConfigPage } from '@/modules/admin/pages/AdminAOPConfigPage';
import { aopAdminApi } from '@/modules/admin/api/aopAdminApi';
import { useAopAdminDraftStore } from '@/modules/admin/stores/useAopAdminDraftStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import type { GridResponse } from '@/modules/admin/types/aopAdmin';
import { adminChannels, channelTemplate, planningConfiguration, rule, site } from './aopFixtures';

vi.mock('@/modules/admin/api/aopAdminApi', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/modules/admin/api/aopAdminApi')>();
  return { ...original, aopAdminApi: { config: vi.fn(), parameters: vi.fn(), preview: vi.fn(), save: vi.fn(), metrics: vi.fn() } };
});
vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ success: vi.fn() }) }));

const FISCAL_MONTH_NAMES = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];

function grid(count = 1): GridResponse {
  const months = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
  return { config_id: 'config-1', months, total: count, channels: [{ channel_code: 'EBO', total: count }], items: Array.from({ length: count }, (_, index) => ({
    ...site, site_reference: `master:S${index + 1}`, site_id: `S${index + 1}`, code: `S${index + 1}`, name: `Store ${index + 1}`,
    months: months.map((month_number) => ({ month_number, applicable: true })),
  })) };
}

function showPage(): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(<MemoryRouter><QueryClientProvider client={client}><TooltipProvider><AdminAOPConfigPage /></TooltipProvider></QueryClientProvider></MemoryRouter>);
}

async function setSelection(group: string, labels: string[]): Promise<void> {
  const controls = within(screen.getByRole('group', { name: group }));
  for (const label of labels) {
    const button = controls.getByRole('button', { name: label, exact: true });
    if (button.getAttribute('aria-pressed') !== 'true') await userEvent.click(button);
  }
  for (const button of controls.getAllByRole('button')) {
    const wanted = labels.includes(button.getAttribute('aria-label') ?? '');
    if ((button.getAttribute('aria-pressed') === 'true') !== wanted) await userEvent.click(button);
  }
}

async function selectParameters(parameters: string[], channel = 'EBO'): Promise<void> {
  await setSelection(`${channel} parameters`, parameters.map((parameter) => `${parameter} %`));
}

async function selectParameter(parameter: string, channel = 'EBO'): Promise<void> {
  await selectParameters([parameter], channel);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 3, 15));
  vi.clearAllMocks();
  useAopAdminDraftStore.setState({ drafts: {} });
  useAuthStore.setState({ tenantId: 'tenant', resolvedOrgId: 'org' });
  vi.mocked(aopAdminApi.config).mockResolvedValue({ configuration: planningConfiguration(), can_write: true, channels: adminChannels });
  vi.mocked(aopAdminApi.parameters).mockResolvedValue(grid());
  vi.mocked(aopAdminApi.metrics).mockResolvedValue({ items: [] });
});

afterEach(() => vi.useRealTimers());

describe('AOP site monthly parameters', () => {
  it.each([0, 8, 11])('opens with all Apr–Mar months and only NSM selected regardless of the current month (%s)', async (month) => {
    vi.setSystemTime(new Date(2026, month, 15));
    showPage();
    await userEvent.click(await screen.findByRole('button', { name: 'EBO monthly site parameters' }));
    const table = within(await screen.findByRole('table', { name: 'EBO monthly values' }));
    expect(screen.queryByRole('group', { name: 'EBO months' })).not.toBeInTheDocument();
    expect(table.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Site', ...FISCAL_MONTH_NAMES.map((name, index) => `${name}${[0, 1, 2, 3, 10, 11].includes(index) ? 'SS' : 'AW'}`)]);
    expect(table.queryByText('NSM%', { exact: true })).not.toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: 'EBO parameters' })).getAllByRole('button', { pressed: true }).map((button) => button.getAttribute('aria-label'))).toEqual(['NSM %']);
    expect(within(screen.getByRole('table', { name: 'EBO monthly values' })).getAllByRole('textbox').map((input) => input.getAttribute('aria-label'))).toEqual(FISCAL_MONTH_NAMES.map((label) => `S1 ${label} NSM%`));
    expect(screen.getByRole('button', { name: 'Clear EBO filters' })).toBeDisabled();
  });

  it('saves shared Discount and Achievement defaults for both seasons while preserving site overrides', async () => {
    const config = planningConfiguration();
    config.parameter_rules = [
      rule({ scope_type: 'site', site_id: 'S1', season_code: 'SS', month_number: 4, parameter_key: 'discount_ratio', parameter_value: 0 }),
      rule({ scope_type: 'site', site_id: 'S1', season_code: 'AW', month_number: 8, parameter_key: 'aop_achievement_ratio', parameter_value: 1.25 }),
    ];
    vi.mocked(aopAdminApi.config).mockResolvedValue({ configuration: config, can_write: true, channels: adminChannels, channel_defaults_template: channelTemplate });
    vi.mocked(aopAdminApi.preview).mockResolvedValue({ changes: [], affected_cells: 0, affected_sites: 0, missing_cells: 0 });
    vi.mocked(aopAdminApi.save).mockResolvedValue({ configuration: config, changes: [] });
    showPage();
    const defaults = within(await screen.findByRole('table', { name: 'Shared season defaults' }));
    const discount = defaults.getByRole('textbox', { name: 'EBO Discount%' });
    const achievement = defaults.getByRole('textbox', { name: 'EBO AOP Achievement%' });
    expect(discount).toHaveValue('20');
    expect(achievement).toHaveValue('100');
    expect(aopAdminApi.parameters).not.toHaveBeenCalled();
    fireEvent.change(discount, { target: { value: '100' } });
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
    fireEvent.change(discount, { target: { value: '30' } });
    fireEvent.change(achievement, { target: { value: '-1' } });
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
    fireEvent.change(achievement, { target: { value: '110' } });
    await userEvent.click(screen.getByRole('button', { name: 'EBO monthly site parameters' }));
    await selectParameter('Discount');
    expect(await screen.findByRole('textbox', { name: 'S1 April Discount%' })).toHaveValue('0');
    await selectParameter('AOP Achievement');
    expect(screen.getByRole('textbox', { name: 'S1 April AOP Achievement%' })).toHaveValue('110');
    await selectParameter('Discount');
    expect(screen.getByRole('textbox', { name: 'S1 May Discount%' })).toHaveValue('30');
    expect(screen.getByRole('textbox', { name: 'S1 August Discount%' })).toHaveValue('30');
    await selectParameter('AOP Achievement');
    expect(screen.getByRole('textbox', { name: 'S1 August AOP Achievement%' })).toHaveValue('125');
    expect(defaults.getByRole('textbox', { name: 'Omni Discount%' })).toHaveValue('20');
    expect(defaults.getByRole('textbox', { name: 'Omni AOP Achievement%' })).toHaveValue('100');
    await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    fireEvent.change(screen.getByLabelText('Reason for change'), { target: { value: 'Reviewed shared rates' } });
    await userEvent.click(screen.getByRole('button', { name: 'Preview changes' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Confirm Save' }));
    await waitFor(() => expect(aopAdminApi.save).toHaveBeenCalledOnce());
    expect(vi.mocked(aopAdminApi.save).mock.calls[0]?.[0].operations).toEqual([
      ...['SS', 'AW'].map((code) => ({ op: 'set_parameter', scope: { type: 'channel', channelCode: 'EBO' }, season: { code }, parameter: 'discount_ratio', value: 0.3 })),
      ...['SS', 'AW'].map((code) => ({ op: 'set_parameter', scope: { type: 'channel', channelCode: 'EBO' }, season: { code }, parameter: 'aop_achievement_ratio', value: 1.1 })),
    ]);
  });

  it('shows mixed season values and keeps saved zero defaults ahead of fallbacks', async () => {
    const config = planningConfiguration();
    config.parameter_rules = [
      rule({ scope_type: 'channel', channel_code: 'EBO', season_code: 'AW', parameter_key: 'discount_ratio', parameter_value: 0 }),
      ...['SS', 'AW'].map((season_code) => rule({ scope_type: 'channel', channel_code: 'EBO', season_code, parameter_key: 'aop_achievement_ratio', parameter_value: 0 })),
    ];
    vi.mocked(aopAdminApi.config).mockResolvedValue({ configuration: config, can_write: true, channels: adminChannels, channel_defaults_template: channelTemplate });
    showPage();
    const defaults = within(await screen.findByRole('table', { name: 'Shared season defaults' }));
    const discount = defaults.getByRole('textbox', { name: 'EBO Discount%' });
    expect(discount).toHaveAttribute('placeholder', 'Varies');
    expect(defaults.getByRole('textbox', { name: 'EBO AOP Achievement%' })).toHaveValue('0');
    fireEvent.change(discount, { target: { value: '0' } });
    expect(discount).toHaveValue('0');
    expect(defaults.queryByText('Different season values')).not.toBeInTheDocument();
  });

  // This test drives ~20 sequential userEvent interactions plus several
  // findBy/waitFor cycles; under full-suite CPU contention it can exceed the
  // 5s default (it runs ~2.2s in isolation). Give it explicit headroom rather
  // than relying on the global timeout, so a busy CI machine doesn't flake it.
  it('inherits channel discount and 100% achievement, saves independent site/month overrides and reloads them', async () => {
    const config = planningConfiguration();
    const saved = { ...config, config_id: 'config-2', version_no: 2, parameter_rules: [
      rule({ scope_type: 'site', site_id: 'S1', season_code: 'SS', month_number: 4, parameter_key: 'discount_ratio', parameter_value: 0 }),
      rule({ scope_type: 'site', site_id: 'S1', season_code: 'SS', month_number: 4, parameter_key: 'aop_achievement_ratio', parameter_value: 1.234567 }),
    ] };
    vi.mocked(aopAdminApi.config).mockResolvedValueOnce({ configuration: config, can_write: true, channels: adminChannels, channel_defaults_template: channelTemplate })
      .mockResolvedValue({ configuration: saved, can_write: true, channels: adminChannels, channel_defaults_template: channelTemplate });
    vi.mocked(aopAdminApi.parameters).mockResolvedValue(grid(2));
    vi.mocked(aopAdminApi.preview).mockResolvedValue({ changes: [{ entity_type: 'parameter_rule', entity_key: { parameter_key: 'aop_achievement_ratio' }, action: 'add', old_value: null, new_value: 1.234567 }], affected_cells: 0, affected_sites: 0, missing_cells: 0 });
    vi.mocked(aopAdminApi.save).mockResolvedValue({ configuration: saved, changes: [] });
    showPage();
    const toggle = await screen.findByRole('button', { name: 'EBO monthly site parameters' });
    await userEvent.click(toggle);
    await selectParameter('Discount');
    const discount = await screen.findByRole('textbox', { name: 'S1 April Discount%' });
    expect(discount).toHaveValue('20');
    fireEvent.change(discount, { target: { value: '0' } });
    await selectParameter('AOP Achievement');
    const achievement = screen.getByRole('textbox', { name: 'S1 April AOP Achievement%' });
    expect(achievement).toHaveValue('100');
    fireEvent.change(achievement, { target: { value: '123.4567' } });
    expect(screen.getByRole('textbox', { name: 'S2 April AOP Achievement%' })).toHaveValue('100');
    await selectParameter('Discount');
    expect(screen.getByRole('textbox', { name: 'S1 May Discount%' })).toHaveValue('20');
    await selectParameter('AOP Achievement');
    await userEvent.click(toggle);
    await userEvent.click(toggle);
    expect(screen.getByRole('textbox', { name: 'S1 April AOP Achievement%' })).toHaveValue('123.4567');
    await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    fireEvent.change(screen.getByLabelText('Reason for change'), { target: { value: 'Reviewed site monthly rates' } });
    await userEvent.click(screen.getByRole('button', { name: 'Preview changes' }));
    await screen.findByRole('button', { name: 'Confirm Save' });
    expect(screen.getByText('AOP Achievement%')).toBeVisible();
    expect(screen.getByText('Inherited / unset → 123.4567%')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Save' }));
    await waitFor(() => expect(aopAdminApi.save).toHaveBeenCalledOnce());
    expect(vi.mocked(aopAdminApi.save).mock.calls[0]?.[0].operations).toEqual([
      { op: 'set_parameter', scope: { type: 'site', siteId: 'S1' }, season: { code: 'SS' }, monthNumber: 4, parameter: 'discount_ratio', value: 0 },
      { op: 'set_parameter', scope: { type: 'site', siteId: 'S1' }, season: { code: 'SS' }, monthNumber: 4, parameter: 'aop_achievement_ratio', value: 1.234567 },
    ]);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled());
    expect(screen.getByRole('textbox', { name: 'S1 April AOP Achievement%' })).toHaveValue('123.4567');
    await selectParameter('Discount');
    expect(screen.getByRole('textbox', { name: 'S1 April Discount%' })).toHaveValue('0');
  }, 15000);

  it('validates monthly rates and updates inherited discount without overwriting a site override', async () => {
    showPage();
    await userEvent.click(await screen.findByRole('button', { name: 'EBO monthly site parameters' }));
    await selectParameter('Discount');
    const discount = await screen.findByRole('textbox', { name: 'S1 April Discount%' });
    fireEvent.change(discount, { target: { value: '100' } });
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
    fireEvent.change(discount, { target: { value: '5' } });
    await selectParameter('AOP Achievement');
    const achievement = screen.getByRole('textbox', { name: 'S1 April AOP Achievement%' });
    fireEvent.change(achievement, { target: { value: '-1' } });
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
    fireEvent.change(achievement, { target: { value: '0' } });
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled();
    fireEvent.change(screen.getByRole('textbox', { name: 'EBO Discount%' }), { target: { value: '25' } });
    expect(achievement).toHaveValue('0');
    await selectParameter('Discount');
    expect(screen.getByRole('textbox', { name: 'S1 April Discount%' })).toHaveValue('5');
    expect(screen.getByRole('textbox', { name: 'S1 May Discount%' })).toHaveValue('25');
  });

  it('leaves unknown defaults unset and shares edits across AW/SS', async () => {
    showPage();
    const input = await screen.findByRole('textbox', { name: 'EBO NSM%' });
    expect(input).toHaveValue('');
    expect(input).toHaveAttribute('placeholder', 'Not set');
    expect(screen.getByRole('textbox', { name: 'EBO Sell-through%' })).toHaveValue('');
    expect(aopAdminApi.parameters).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '90' } });
    expect(input).toHaveValue('90');
    expect(screen.queryByRole('columnheader', { name: 'OSM %' })).not.toBeInTheDocument();
    const drafts = Object.values(useAopAdminDraftStore.getState().drafts)[0];
    expect(Object.values(drafts?.changes ?? {}).map(({ operation }) => operation)).toEqual([
      { op: 'set_parameter', scope: { type: 'channel', channelCode: 'EBO' }, season: { code: 'SS' }, parameter: 'nsm_ratio', value: .9 },
      { op: 'set_parameter', scope: { type: 'channel', channelCode: 'EBO' }, season: { code: 'AW' }, parameter: 'nsm_ratio', value: .9 },
    ]);
  });

  it('loads only the expanded channel, uses a skeleton and retains overrides across collapse', async () => {
    let resolveGrid!: (response: GridResponse) => void;
    vi.mocked(aopAdminApi.parameters).mockImplementationOnce(() => new Promise((resolve) => { resolveGrid = resolve; }));
    showPage();
    const ebo = await screen.findByRole('button', { name: 'EBO monthly site parameters' });
    expect(ebo).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getAllByRole('button', { name: /monthly site parameters$/ }).map((button) => button.getAttribute('aria-label'))).toEqual([
      'EBO monthly site parameters', 'MBO monthly site parameters', 'SIS monthly site parameters',
      'Distribution monthly site parameters', 'Omni monthly site parameters', 'Others monthly site parameters', 'Superdry.in monthly site parameters',
    ]);
    expect(screen.queryByRole('table', { name: 'EBO monthly values' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'EBO NSM%' }), { target: { value: '90' } });
    await userEvent.click(ebo);
    await waitFor(() => expect(screen.getByRole('status', { name: 'Loading EBO sites' })).toBeVisible());
    expect(aopAdminApi.parameters).toHaveBeenCalledExactlyOnceWith('config-1', expect.objectContaining({ channel: 'EBO', all_sites: true, include_resolved: false }));
    resolveGrid(grid());
    const april = await screen.findByRole('textbox', { name: 'S1 April NSM%' });
    expect(april).toHaveValue('90');
    expect(screen.queryByRole('columnheader', { name: 'OSM %' })).not.toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Loading EBO sites' })).not.toBeInTheDocument();
    fireEvent.change(april, { target: { value: '0' } });
    await selectParameter('Sell-through');
    fireEvent.change(screen.getByRole('textbox', { name: 'S1 April Sell-through%' }), { target: { value: '60' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'S1 May Sell-through%' }), { target: { value: '20' } });
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled();
    await userEvent.click(ebo);
    expect(screen.queryByRole('region', { name: 'EBO monthly site parameters' })).not.toBeInTheDocument();
    await userEvent.click(ebo);
    expect(screen.getByRole('textbox', { name: 'S1 May Sell-through%' })).toHaveValue('20');
    await selectParameter('NSM');
    expect(screen.getByRole('textbox', { name: 'S1 May NSM%' })).toHaveValue('90');
    expect(screen.getByRole('textbox', { name: 'S1 April NSM%' })).toHaveValue('0');
    for (const channel of ['Distribution', 'Omni', 'Others', 'Superdry.in']) {
      const toggle = screen.getByRole('button', { name: `${channel} monthly site parameters` });
      expect(toggle).toBeDisabled();
      expect(within(toggle).getByText('Not applicable')).toBeVisible();
      await userEvent.click(toggle);
      expect(screen.queryByRole('table', { name: `${channel} monthly values` })).not.toBeInTheDocument();
    }
    expect(screen.queryByRole('button', { name: 'Channel mapping required monthly site parameters' })).not.toBeInTheDocument();
    for (const channel of ['MBO', 'SIS']) {
      const toggle = screen.getByRole('button', { name: `${channel} monthly site parameters` });
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await userEvent.click(toggle);
      await waitFor(() => expect(screen.getByRole('table', { name: `${channel} monthly values` })).toBeVisible());
    }
    expect(vi.mocked(aopAdminApi.parameters).mock.calls.map(([, filters]) => filters.channel)).toEqual(['EBO', 'MBO', 'SIS']);
    expect(screen.queryByRole('button', { name: /Next|Previous|Bulk|Copy/ })).not.toBeInTheDocument();
  });

  it('preserves saved site overrides when channel defaults change and saves monthly fractions', async () => {
    const config = planningConfiguration();
    config.parameter_rules = [rule({ season_code: 'SS', scope_type: 'site', site_id: 'S1', month_number: 4, parameter_value: 1 })];
    vi.mocked(aopAdminApi.config).mockResolvedValue({ configuration: config, can_write: true, channels: adminChannels });
    vi.mocked(aopAdminApi.preview).mockResolvedValue({ changes: [{ entity_type: 'parameter_rule', entity_key: {}, action: 'add', old_value: null, new_value: .65 }], affected_cells: 0, affected_sites: 0, missing_cells: 0 });
    vi.mocked(aopAdminApi.save).mockResolvedValue({ configuration: { ...config, config_id: 'config-2' }, changes: [] });
    showPage();
    fireEvent.change(await screen.findByRole('textbox', { name: 'EBO NSM%' }), { target: { value: '90' } });
    await userEvent.click(screen.getByRole('button', { name: 'EBO monthly site parameters' }));
    expect(await screen.findByRole('textbox', { name: 'S1 April NSM%' })).toHaveValue('100');
    expect(screen.getByRole('textbox', { name: 'S1 May NSM%' })).toHaveValue('90');
    await selectParameter('Sell-through');
    fireEvent.change(screen.getByRole('textbox', { name: 'S1 April Sell-through%' }), { target: { value: '65' } });
    await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    fireEvent.change(screen.getByLabelText('Reason for change'), { target: { value: 'Reviewed rates' } });
    await userEvent.click(screen.getByRole('button', { name: 'Preview changes' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Confirm Save' }));
    await waitFor(() => expect(aopAdminApi.save).toHaveBeenCalledOnce());
    expect(vi.mocked(aopAdminApi.save).mock.calls[0]?.[0].operations).toContainEqual({
      op: 'set_parameter', scope: { type: 'site', siteId: 'S1' }, season: { code: 'SS' }, monthNumber: 4, parameter: 'sell_through_ratio', value: .65,
    });
  });

  it('shows all returned sites and keeps errors/retry inside the channel', async () => {
    vi.mocked(aopAdminApi.parameters).mockRejectedValueOnce(new Error('Site source unavailable')).mockResolvedValue(grid(26));
    showPage();
    await userEvent.click(await screen.findByRole('button', { name: 'EBO monthly site parameters' }));
    await waitFor(() => expect(screen.getByText('Site source unavailable')).toBeVisible());
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    fireEvent.change(await screen.findByRole('searchbox', { name: 'Search EBO sites' }), { target: { value: 'S26' } });
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'S26 April NSM%' })).toBeVisible());
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });

  // Another interaction-heavy test (~2.4s isolated); same rationale as above —
  // give explicit timeout headroom so full-suite CPU contention can't flake it.
  it('keeps independent edits and validation across months, metrics, search and collapse', async () => {
    vi.mocked(aopAdminApi.parameters).mockResolvedValue(grid(3));
    showPage();
    const toggle = await screen.findByRole('button', { name: 'EBO monthly site parameters' });
    await userEvent.click(toggle);
    const search = await screen.findByRole('searchbox', { name: 'Search EBO sites' });
    expect(screen.queryByRole('textbox', { name: 'S1 April Discount%' })).not.toBeInTheDocument();
    await selectParameter('NSM');
    expect(within(screen.getByRole('table', { name: 'EBO monthly values' })).getAllByRole('textbox').map((input) => input.getAttribute('aria-label'))).toEqual(
      [1, 2, 3].flatMap((site) => FISCAL_MONTH_NAMES.map((month) => `S${site} ${month} NSM%`)));
    await selectParameters([]);
    const nsmFilter = within(screen.getByRole('group', { name: 'EBO parameters' })).getByRole('button', { name: 'NSM %', exact: true });
    expect(nsmFilter).toHaveAttribute('aria-disabled', 'true');
    nsmFilter.focus();
    await userEvent.keyboard('{Enter} ');
    expect(nsmFilter).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('table', { name: 'EBO monthly values' })).toBeVisible();
    expect(screen.queryByText('Choose parameters')).not.toBeInTheDocument();
    await selectParameters(['NSM', 'Discount']);
    const table = within(screen.getByRole('table', { name: 'EBO monthly values' }));
    expect(table.getAllByRole('textbox')).toHaveLength(72);
    expect(table.getAllByText('NSM%', { exact: true })).toHaveLength(12);
    expect(table.getAllByText('Discount%', { exact: true })).toHaveLength(12);
    fireEvent.change(screen.getByRole('textbox', { name: 'S1 January NSM%' }), { target: { value: '95' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'S1 April Discount%' }), { target: { value: '100' } });
    fireEvent.change(search, { target: { value: ' S2 ' } });
    expect(screen.queryByRole('textbox', { name: 'S1 April Discount%' })).not.toBeInTheDocument();
    expect(screen.getByText('1 of 3 sites')).toBeVisible();
    await selectParameter('AOP Achievement');
    fireEvent.change(screen.getByRole('textbox', { name: 'S2 January AOP Achievement%' }), { target: { value: '125' } });
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
    await userEvent.click(toggle);
    await userEvent.click(toggle);
    expect(screen.getByRole('searchbox', { name: 'Search EBO sites' })).toHaveValue(' S2 ');
    expect(within(screen.getByRole('table', { name: 'EBO monthly values' })).getAllByRole('columnheader')).toHaveLength(13);
    expect(within(screen.getByRole('table', { name: 'EBO monthly values' })).queryByText('Achievement%', { exact: true })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'S2 January AOP Achievement%' })).toHaveValue('125');
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search EBO sites' }), { target: { value: 'missing site' } });
    expect(screen.getByText('No matching sites')).toBeVisible();
    expect(screen.getByText('0 of 3 sites')).toBeVisible();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search EBO sites' }), { target: { value: 'STORE 1' } });
    await selectParameter('Discount');
    expect(screen.getByRole('textbox', { name: 'S1 April Discount%' })).toHaveValue('100');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a value from 0 to 99.9999');
    fireEvent.change(screen.getByRole('textbox', { name: 'S1 April Discount%' }), { target: { value: '25' } });
    await selectParameter('NSM');
    expect(screen.getByRole('textbox', { name: 'S1 January NSM%' })).toHaveValue('95');
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled();
    expect(aopAdminApi.parameters).toHaveBeenCalledOnce();
    const draft = useAopAdminDraftStore.getState().drafts['tenant:org'];
    expect(Object.values(draft?.changes ?? {}).map(({ operation }) => operation)).toEqual([
      { op: 'set_parameter', scope: { type: 'site', siteId: 'S1' }, season: { code: 'AW' }, monthNumber: 1, parameter: 'nsm_ratio', value: 0.95 },
      { op: 'set_parameter', scope: { type: 'site', siteId: 'S1' }, season: { code: 'SS' }, monthNumber: 4, parameter: 'discount_ratio', value: 0.25 },
      { op: 'set_parameter', scope: { type: 'site', siteId: 'S2' }, season: { code: 'AW' }, monthNumber: 1, parameter: 'aop_achievement_ratio', value: 1.25 },
    ]);
    await userEvent.click(screen.getByRole('button', { name: 'Clear EBO filters' }));
    expect(screen.getByRole('searchbox', { name: 'Search EBO sites' })).toHaveValue('');
    expect(within(screen.getByRole('table', { name: 'EBO monthly values' })).getAllByRole('columnheader')).toHaveLength(13);
    expect(within(screen.getByRole('group', { name: 'EBO parameters' })).getAllByRole('button', { pressed: true }).map((button) => button.getAttribute('aria-label'))).toEqual(['NSM %']);
    expect(screen.getByRole('button', { name: 'Clear EBO filters' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'S1 January NSM%' })).toHaveValue('95');
    await selectParameter('Discount');
    expect(screen.getByRole('textbox', { name: 'S1 April Discount%' })).toHaveValue('25');
    expect(screen.getByRole('textbox', { name: 'S3 April Discount%' })).toBeInTheDocument();
    expect(useAopAdminDraftStore.getState().drafts['tenant:org']).toEqual(draft);
    expect(aopAdminApi.parameters).toHaveBeenCalledOnce();
  }, 15000);

  it('disables both default and monthly fields for read-only users', async () => {
    vi.mocked(aopAdminApi.config).mockResolvedValue({ configuration: planningConfiguration(), can_write: false, channels: adminChannels });
    showPage();
    expect(await screen.findByRole('textbox', { name: 'EBO NSM%' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'EBO Discount%' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'EBO AOP Achievement%' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'EBO monthly site parameters' }));
    expect(await screen.findByRole('textbox', { name: 'S1 April NSM%' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reset EBO to default', exact: true })).toBeDisabled();
    await selectParameter('Discount');
    expect(screen.getByRole('textbox', { name: 'S1 April Discount%' })).toBeDisabled();
    await selectParameter('AOP Achievement');
    expect(screen.getByRole('textbox', { name: 'S1 April AOP Achievement%' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Save Changes' })).not.toBeInTheDocument();
  });
});
