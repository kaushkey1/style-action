import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui';
import { AdminAOPConfigPage } from '@/modules/admin/pages/AdminAOPConfigPage';
import { aopAdminApi } from '@/modules/admin/api/aopAdminApi';
import { FISCAL_MONTHS } from '@/modules/admin/api/aopAdminCalendar';
import { useAopAdminDraftStore } from '@/modules/admin/stores/useAopAdminDraftStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import { adminChannels, channelTemplate, planningConfiguration, rule, site } from './aopFixtures';

vi.mock('@/modules/admin/api/aopAdminApi', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/modules/admin/api/aopAdminApi')>(),
  aopAdminApi: { config: vi.fn(), parameters: vi.fn(), preview: vi.fn(), save: vi.fn(), metrics: vi.fn() },
}));
const toastSuccess = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ success: toastSuccess }) }));

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe(): void {} unobserve(): void {} disconnect(): void {} });
  vi.clearAllMocks();
  useAopAdminDraftStore.setState({ drafts: {} });
  useAuthStore.setState({ tenantId: 'tenant', resolvedOrgId: 'org' });
  const config = planningConfiguration();
  config.parameter_rules = config.season_definitions.map((season) => rule({ season_code: season.season_code }));
  vi.mocked(aopAdminApi.config).mockResolvedValue({ configuration: config, channels: adminChannels, can_write: true, channel_defaults_template: channelTemplate });
  vi.mocked(aopAdminApi.parameters).mockResolvedValue({ config_id: config.config_id, total: 3, months: [...FISCAL_MONTHS], channels: [{ channel_code: 'EBO', total: 3 }],
    items: [1, 2, 3].map((id) => ({ ...site, code: `S${id}`, site_id: `S${id}`, site_reference: `master:S${id}`, name: `Store ${id}`, months: FISCAL_MONTHS.map((month_number) => ({ month_number, applicable: true })) })) });
  vi.mocked(aopAdminApi.metrics).mockResolvedValue({ items: [] });
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
});
afterEach(() => vi.unstubAllGlobals());

async function openGrid(): Promise<void> {
  render(<MemoryRouter><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
    <TooltipProvider><AdminAOPConfigPage /></TooltipProvider>
  </QueryClientProvider></MemoryRouter>);
  await userEvent.click(await screen.findByRole('button', { name: 'EBO monthly site parameters' }));
  await screen.findByRole('textbox', { name: 'S1 April NSM%' });
}
const field = (site = 'S1', month = 'April'): HTMLElement => screen.getByRole('textbox', { name: `${site} ${month} NSM%` });
const pending = (): number => Object.keys(useAopAdminDraftStore.getState().drafts['tenant:org']?.changes ?? {}).length;
async function apply(): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: 'Apply to draft' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
}

describe('AOP spreadsheet workflow', () => {
  it.each(['channel', 'month', 'site'])('refreshes %s resets locally without a toast or API call', async (scope) => {
    await openGrid();
    fireEvent.change(field(), { target: { value: '95' } });
    const calls = { config: vi.mocked(aopAdminApi.config).mock.calls.length, parameters: vi.mocked(aopAdminApi.parameters).mock.calls.length };
    if (scope === 'channel') await userEvent.click(screen.getByRole('button', { name: 'Reset EBO to default', exact: true }));
    else {
      await userEvent.click(screen.getByRole('button', { name: scope === 'month' ? 'EBO April NSM% fill options' : 'Store 1 (S1) fill options', exact: true }));
      await userEvent.click(screen.getByRole('button', { name: 'Reset to default', exact: true }));
    }
    await waitFor(() => expect(field()).toHaveValue('80'));
    expect(screen.getByRole('region', { name: 'EBO monthly values', exact: true })).toHaveAttribute('aria-busy', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(pending()).toBe(0);
    expect(aopAdminApi.config).toHaveBeenCalledTimes(calls.config);
    expect(aopAdminApi.parameters).toHaveBeenCalledTimes(calls.parameters);
    expect(aopAdminApi.save).not.toHaveBeenCalled();
    expect(aopAdminApi.preview).not.toHaveBeenCalled();
  });

  it('resets the whole channel regardless of filters and keeps defaults and other channels intact with atomic undo/redo', async () => {
    const config = planningConfiguration();
    config.parameter_rules = [...config.season_definitions.map((season) => rule({ season_code: season.season_code })),
      rule({ scope_type: 'site', site_id: 'S1', season_code: 'SS', month_number: 4, parameter_value: .95 }),
      rule({ scope_type: 'site', site_id: 'S1', season_code: 'SS', month_number: 5, parameter_key: 'sell_through_ratio', parameter_value: .6 }),
      rule({ scope_type: 'site', site_id: 'S2', season_code: 'SS', month_number: 3, parameter_key: 'discount_ratio', parameter_value: .3 }),
      rule({ scope_type: 'site', site_id: 'S3', season_code: 'AW', month_number: 1, parameter_key: 'aop_achievement_ratio', parameter_value: 1.25 }),
      rule({ scope_type: 'site', site_id: 'M1', season_code: 'SS', month_number: 4, parameter_value: .97 }),
    ];
    vi.mocked(aopAdminApi.config).mockResolvedValue({ configuration: config, channels: adminChannels, can_write: true, channel_defaults_template: channelTemplate });
    await openGrid();
    fireEvent.change(field(), { target: { value: 'invalid' } });
    fireEvent.change(field('S2', 'January'), { target: { value: '85' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'EBO NSM%' }), { target: { value: '90' } });
    const store = useAopAdminDraftStore.getState();
    act(() => store.edit('tenant:org', config, { operation: { op: 'set_parameter', scope: { type: 'site', siteId: 'M1' }, season: { code: 'SS' }, monthNumber: 4, parameter: 'nsm_ratio', value: .98 }, input: '98' }));
    const before = useAopAdminDraftStore.getState().drafts['tenant:org'].changes;
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search EBO sites' }), { target: { value: 'no matches' } });
    await userEvent.click(within(screen.getByRole('group', { name: 'EBO parameters' })).getByRole('button', { name: 'NSM %', exact: true }));
    const reset = screen.getByRole('button', { name: 'Reset EBO to default', exact: true });
    expect(reset).toBeEnabled();
    await userEvent.click(reset);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(reset).toBeDisabled();
    const after = useAopAdminDraftStore.getState().drafts['tenant:org'].changes;
    const operations = Object.values(after).map(({ operation }) => operation);
    expect(operations.filter((operation) => operation.op === 'remove_parameter')).toHaveLength(4);
    expect(operations).toContainEqual({ op: 'set_parameter', scope: { type: 'site', siteId: 'M1' }, season: { code: 'SS' }, monthNumber: 4, parameter: 'nsm_ratio', value: .98 });
    expect(operations.filter((operation) => operation.op === 'set_parameter' && operation.scope.type === 'channel')).toHaveLength(2);
    expect(pending()).toBe(7);
    fireEvent.keyDown(reset, { key: 'z', ctrlKey: true });
    expect(useAopAdminDraftStore.getState().drafts['tenant:org'].changes).toEqual(before);
    fireEvent.keyDown(reset, { key: 'z', ctrlKey: true, shiftKey: true });
    expect(useAopAdminDraftStore.getState().drafts['tenant:org'].changes).toEqual(after);
    await userEvent.click(screen.getByRole('button', { name: 'Clear EBO filters' }));
    expect(field()).toHaveValue('90');
    expect(field('S2', 'January')).toHaveValue('90');
    expect(screen.getByRole('textbox', { name: 'EBO NSM%' })).toHaveValue('90');
    const parameters = within(screen.getByRole('group', { name: 'EBO parameters' }));
    for (const name of ['Sell-through %', 'Discount %', 'AOP Achievement %']) await userEvent.click(parameters.getByRole('button', { name, exact: true }));
    expect(screen.getByRole('textbox', { name: 'S1 May Sell-through%' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'S2 March Discount%' })).toHaveValue('20');
    expect(screen.getByRole('textbox', { name: 'S3 January AOP Achievement%' })).toHaveValue('100');
    expect(aopAdminApi.save).not.toHaveBeenCalled();
  });

  it('disables channel reset without overrides and clears draft-only overrides without adding pending deletions', async () => {
    await openGrid();
    const reset = screen.getByRole('button', { name: 'Reset EBO to default', exact: true });
    expect(reset).toBeDisabled();
    fireEvent.change(field(), { target: { value: '95' } });
    fireEvent.change(field('S2', 'March'), { target: { value: '96' } });
    expect(reset).toBeEnabled();
    await userEvent.click(reset);
    expect(pending()).toBe(0);
    expect(field()).toHaveValue('80');
    expect(field('S2', 'March')).toHaveValue('80');
    expect(reset).toBeDisabled();
    expect(aopAdminApi.save).not.toHaveBeenCalled();
  });

  it('resets a saved override to inheritance and sends a removal through the save flow', async () => {
    const config = planningConfiguration();
    config.parameter_rules = [...config.season_definitions.map((season) => rule({ season_code: season.season_code })),
      rule({ scope_type: 'site', site_id: 'S1', season_code: 'SS', month_number: 4, parameter_value: .95 })];
    vi.mocked(aopAdminApi.config).mockResolvedValue({ configuration: config, channels: adminChannels, can_write: true, channel_defaults_template: channelTemplate });
    vi.mocked(aopAdminApi.preview).mockResolvedValue({ changes: [{ entity_type: 'parameter_rule', entity_key: { parameter_key: 'nsm_ratio' }, action: 'remove', old_value: .95, new_value: null }], affected_cells: 1, affected_sites: 1, missing_cells: 0 });
    await openGrid();
    expect(field()).toHaveValue('95');
    await userEvent.click(screen.getByRole('button', { name: 'EBO April NSM% fill options' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reset to default', exact: true }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(field()).toHaveValue('80');
    expect(pending()).toBe(1);
    fireEvent.change(screen.getByRole('textbox', { name: 'EBO NSM%' }), { target: { value: '90' } });
    expect(field()).toHaveValue('90');
    await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    fireEvent.change(screen.getByLabelText('Reason for change'), { target: { value: 'Restore inheritance' } });
    await userEvent.click(screen.getByRole('button', { name: 'Preview changes' }));
    await screen.findByRole('button', { name: 'Confirm Save' });
    expect(vi.mocked(aopAdminApi.preview).mock.calls[0][0].operations).toContainEqual({
      op: 'remove_parameter', scope: { type: 'site', siteId: 'S1' }, season: { code: 'SS' }, monthNumber: 4, parameter: 'nsm_ratio',
    });
    expect(aopAdminApi.save).not.toHaveBeenCalled();
  });

  it('resets only matching sites in a column and clears unsaved overrides with atomic undo/redo', async () => {
    await openGrid();
    fireEvent.change(field(), { target: { value: '95' } });
    fireEvent.change(field('S1', 'May'), { target: { value: '96' } });
    fireEvent.change(field('S2'), { target: { value: '97' } });
    const search = screen.getByRole('searchbox', { name: 'Search EBO sites' });
    fireEvent.change(search, { target: { value: 'Store 1' } });
    await userEvent.click(screen.getByRole('button', { name: 'EBO April NSM% fill options' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reset to default', exact: true }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(field()).toHaveValue('80');
    expect(field('S1', 'May')).toHaveValue('96');
    expect(pending()).toBe(2);
    fireEvent.keyDown(field(), { key: 'z', metaKey: true });
    expect(field()).toHaveValue('95');
    expect(pending()).toBe(3);
    fireEvent.keyDown(field(), { key: 'z', metaKey: true, shiftKey: true });
    expect(field()).toHaveValue('80');
    expect(pending()).toBe(2);
    await userEvent.click(screen.getByRole('button', { name: 'EBO April NSM% fill options' }));
    expect(screen.getByRole('button', { name: 'Reset to default', exact: true })).toBeDisabled();
    await userEvent.keyboard('{Escape}');
    fireEvent.change(search, { target: { value: '' } });
    expect(field('S2')).toHaveValue('97');
    expect(aopAdminApi.save).not.toHaveBeenCalled();
  });

  it('resets a site’s selected parameters across all months, including invalid input and missing defaults, while retaining hidden parameters', async () => {
    await openGrid();
    await userEvent.click(within(screen.getByRole('group', { name: 'EBO parameters' })).getByRole('button', { name: 'Sell-through %', exact: true }));
    fireEvent.change(field(), { target: { value: 'invalid' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'S1 April Sell-through%' }), { target: { value: '60' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'S1 May Sell-through%' }), { target: { value: '61' } });
    const parameters = within(screen.getByRole('group', { name: 'EBO parameters' }));
    await userEvent.click(parameters.getByRole('button', { name: 'Discount %', exact: true }));
    fireEvent.change(screen.getByRole('textbox', { name: 'S1 April Discount%' }), { target: { value: '25' } });
    await userEvent.click(parameters.getByRole('button', { name: 'Discount %', exact: true }));
    await userEvent.click(screen.getByRole('button', { name: 'Store 1 (S1) fill options' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reset to default', exact: true }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(field()).toHaveValue('80');
    expect(screen.getByRole('textbox', { name: 'S1 April Sell-through%' })).toHaveValue('');
    expect(pending()).toBe(1);
    expect(screen.getByRole('textbox', { name: 'S1 May Sell-through%' })).toHaveValue('');
    await userEvent.click(parameters.getByRole('button', { name: 'Discount %', exact: true }));
    expect(screen.getByRole('textbox', { name: 'S1 April Discount%' })).toHaveValue('25');
  });

  it('previews and applies only the two selected parameters from a four-parameter sheet', async () => {
    await openGrid();
    await userEvent.click(within(screen.getByRole('group', { name: 'EBO parameters' })).getByRole('button', { name: 'Discount %', exact: true }));
    const monthNames = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const text = [['Site', 'Site code', ...monthNames.flatMap((month) => ['NSM', 'Sell-through', 'Discount', 'AOP Achievement'].map((parameter) => `${month} · ${parameter} %`))].join('\t'),
      ...[1, 2, 3].map((id) => [`Store ${id}`, `S${id}`, ...monthNames.flatMap(() => ['90', '65', '25', '150'])].join('\t'))].join('\n');
    fireEvent.paste(field(), { clipboardData: { getData: () => text } });
    expect(screen.getByText('3 sites · 12 months · 72 cells')).toBeInTheDocument();
    expect(screen.getByText('72 cells from unselected parameters skipped.')).toBeInTheDocument();
    await apply();
    expect(pending()).toBe(72);
    expect(field()).toHaveValue('90');
    expect(screen.getByRole('textbox', { name: 'S1 April Discount%' })).toHaveValue('25');
    const parameters = within(screen.getByRole('group', { name: 'EBO parameters' }));
    await userEvent.click(parameters.getByRole('button', { name: 'Sell-through %', exact: true }));
    await userEvent.click(parameters.getByRole('button', { name: 'AOP Achievement %', exact: true }));
    expect(screen.getByRole('textbox', { name: 'S1 April Sell-through%' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'S1 April AOP Achievement%' })).toHaveValue('100');
    expect(pending()).toBe(72);
    fireEvent.keyDown(field(), { key: 'z', ctrlKey: true });
    expect(pending()).toBe(0);
    expect(aopAdminApi.save).not.toHaveBeenCalled();
  });

  it('fills a searched column as one undo step without saving or changing other sites', async () => {
    await openGrid();
    fireEvent.change(field('S1', 'May'), { target: { value: '83' } });
    const search = screen.getByRole('searchbox', { name: 'Search EBO sites' });
    fireEvent.change(search, { target: { value: 'Store 1' } });
    await userEvent.click(screen.getByRole('button', { name: 'EBO April NSM% fill options' }));
    expect(screen.getByText('1 matching site')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Fill action' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy month', exact: true })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Value (%)'), { target: { value: '90' } });
    expect(screen.getByText('1 cell will change.')).toBeInTheDocument();
    await apply();
    expect(field()).toHaveValue('90');
    expect(pending()).toBe(2);
    fireEvent.change(search, { target: { value: '' } });
    expect(field('S2')).toHaveValue('80');
    fireEvent.keyDown(field(), { key: 'z', metaKey: true });
    expect(field()).toHaveValue('80');
    expect(field('S1', 'May')).toHaveValue('83');
    fireEvent.keyDown(field(), { key: 'z', metaKey: true, shiftKey: true });
    expect(field()).toHaveValue('90');
    expect(aopAdminApi.save).not.toHaveBeenCalled();
  });

  it('fills all twelve months for a site’s selected parameters without offering copy actions', async () => {
    await openGrid();
    await userEvent.click(screen.getByRole('button', { name: 'Store 1 (S1) fill options' }));
    expect(screen.getByText('12 months · NSM%')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy site pattern', exact: true })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Fill action' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Value (%)'), { target: { value: '85' } });
    expect(screen.getByText('12 cells will change.')).toBeInTheDocument();
    await apply();
    expect(pending()).toBe(12);
    expect(field()).toHaveValue('85');
    expect(field('S2')).toHaveValue('80');
    expect(field('S3')).toHaveValue('80');
    expect(field('S1', 'May')).toHaveValue('85');
    expect(field('S2', 'May')).toHaveValue('80');
    await userEvent.click(within(screen.getByRole('group', { name: 'EBO parameters' })).getByRole('button', { name: 'Sell-through %', exact: true }));
    expect(screen.getByRole('textbox', { name: 'S1 April Sell-through%' })).toHaveValue('');
  });

  it('validates fills, does not intercept value-field paste, and cancels without draft changes', async () => {
    await openGrid();
    const trigger = screen.getByRole('button', { name: 'EBO April NSM% fill options' });
    await userEvent.click(trigger);
    const value = screen.getByLabelText('Value (%)');
    fireEvent.paste(value, { clipboardData: { getData: () => '90' } });
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.queryByText('Preview: Paste from Excel')).not.toBeInTheDocument();
    for (const invalid of ['101', '-1', 'abc']) {
      fireEvent.change(value, { target: { value: invalid } });
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Apply to draft' })).toBeDisabled();
    }
    fireEvent.change(value, { target: { value: '80' } });
    expect(screen.getByText('No values changed.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply to draft' })).toBeDisabled();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    expect(pending()).toBe(0);
  });

  it('adds one pending change when only one value in the exported sheet changed', async () => {
    await openGrid();
    const names = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
    const text = [['Site', 'Site code', ...names.map((month) => `${month} · NSM %`)].join('\t'),
      ...[1,2,3].map((id) => [`Store ${id}`, `S${id}`, ...names.map((_month, index) => id === 2 && index === 3 ? '95' : '80')].join('\t'))].join('\n');
    fireEvent.paste(field(), { clipboardData: { getData: () => text } });
    expect(screen.getByText('1 site · 1 month · 1 cell')).toBeInTheDocument();
    expect(screen.getByText('35 unchanged cells skipped.')).toBeInTheDocument();
    await apply();
    expect(pending()).toBe(1);
    expect(screen.getByText('1 pending change across tabs')).toBeInTheDocument();
    expect(field('S2', 'July')).toHaveValue('95');
    fireEvent.paste(field(), { clipboardData: { getData: () => text } });
    expect(screen.getByText('No values changed.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply to draft' })).toBeDisabled();
    expect(pending()).toBe(1);
  });

  it('pastes the whole exported sheet with headers and identity columns even after searching or sorting Excel rows', async () => {
    await openGrid();
    await userEvent.click(within(screen.getByRole('group', { name: 'EBO parameters' })).getByRole('button', { name: 'AOP Achievement %', exact: true }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search EBO sites' }), { target: { value: 'Store 1' } });
    fireEvent.paste(screen.getByRole('region', { name: 'EBO monthly values' }), { clipboardData: { getData: () =>
      'Site\tSite code\tApr · NSM %\tMar · AOP Achievement %\r\nStore 2\tS2\t90\t125\r\nStore 1\tS1\t85\t110\r\n' } });
    expect(screen.getByText('2 sites · 2 months · 4 cells')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply to draft' })).toBeEnabled();
    await apply();
    expect(pending()).toBe(4);
    expect(field()).toHaveValue('85');
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search EBO sites' }), { target: { value: '' } });
    expect(field('S2')).toHaveValue('90');
    const operations = Object.values(useAopAdminDraftStore.getState().drafts['tenant:org'].changes).map((change) => change.operation);
    expect(operations).toContainEqual({ op: 'set_parameter', scope: { type: 'site', siteId: 'S2' }, season: { code: 'SS' }, monthNumber: 3, parameter: 'aop_achievement_ratio', value: 1.25 });
    fireEvent.keyDown(field(), { key: 'z', metaKey: true });
    expect(pending()).toBe(0);
    expect(aopAdminApi.save).not.toHaveBeenCalled();
  });

  it('previews pasted values and uses keyboard-only atomic undo/redo without Smart Fill controls', async () => {
    await openGrid();
    expect(screen.queryByRole('button', { name: /^(Undo|Redo)$/ })).not.toBeInTheDocument();
    fireEvent.change(field(), { target: { value: '83' } });
    expect(screen.queryByRole('button', { name: 'Smart Fill' })).not.toBeInTheDocument();
    expect(within(screen.getByRole('table', { name: 'EBO monthly values' })).queryByRole('checkbox')).not.toBeInTheDocument();
    const block = Array.from({ length: 2 }, () => Array(12).fill('90').join('\t')).join('\n');
    fireEvent.paste(field(), { clipboardData: { getData: () => block } });
    expect(screen.getByText('2 sites · 12 months · 24 cells')).toBeInTheDocument();
    expect(within(screen.getByRole('table', { name: 'Preview cell changes' })).getByText('83')).toBeInTheDocument();
    expect(pending()).toBe(1);
    await apply();
    expect(pending()).toBe(24);
    expect(field('S2', 'March')).toHaveValue('90');
    expect(field('S3')).toHaveValue('80');
    field().focus();
    fireEvent.keyDown(field(), { key: 'z', ctrlKey: true });
    expect(pending()).toBe(1);
    expect(field()).toHaveValue('83');
    expect(field('S2')).toHaveValue('80');
    fireEvent.keyDown(field(), { key: 'Z', metaKey: true, shiftKey: true });
    expect(pending()).toBe(24);
    fireEvent.keyDown(field(), { key: 'z', metaKey: true });
    fireEvent.keyDown(field(), { key: 'y', ctrlKey: true });
    expect(pending()).toBe(24);
    const search = screen.getByRole('searchbox', { name: 'Search EBO sites' });
    fireEvent.keyDown(search, { key: 'z', ctrlKey: true });
    expect(pending()).toBe(24);
    expect(aopAdminApi.save).not.toHaveBeenCalled();
  });

  it('previews rectangular paste and rejects the whole invalid block', async () => {
    await openGrid();
    fireEvent.paste(field(), { clipboardData: { getData: () => '90%\t85\n0\t75' } });
    expect(screen.getByText('2 sites · 2 months · 4 cells')).toBeInTheDocument();
    expect(pending()).toBe(0);
    await apply();
    expect(field()).toHaveValue('90');
    expect(field('S2', 'May')).toHaveValue('75');
    fireEvent.paste(field(), { clipboardData: { getData: () => '95\t101' } });
    expect(screen.getByRole('button', { name: 'Apply to draft' })).toBeDisabled();
    expect(screen.getByText(/Nothing will be applied/)).toBeInTheDocument();
    expect(pending()).toBe(4);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(field()).toHaveValue('90');
  });

  it('navigates visible cells with Tab, Enter and Shift', async () => {
    await openGrid();
    field().focus();
    fireEvent.keyDown(field(), { key: 'Tab' });
    expect(field('S1', 'May')).toHaveFocus();
    fireEvent.keyDown(field('S1', 'May'), { key: 'Enter' });
    expect(field('S2', 'May')).toHaveFocus();
    fireEvent.keyDown(field('S2', 'May'), { key: 'Enter', shiftKey: true });
    expect(field('S1', 'May')).toHaveFocus();
    fireEvent.keyDown(field('S1', 'May'), { key: 'Tab', shiftKey: true });
    expect(field()).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Excel template' })).not.toBeInTheDocument();
  });

  it('keeps read-only access read-only', async () => {
    vi.mocked(aopAdminApi.config).mockResolvedValue({ configuration: planningConfiguration(), channels: adminChannels, can_write: false, channel_defaults_template: channelTemplate });
    await openGrid();
    expect(field()).toBeDisabled();
    expect(screen.queryByRole('button', { name: /fill options/ })).not.toBeInTheDocument();
    fireEvent.paste(field(), { clipboardData: { getData: () => '90' } });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Excel template' })).not.toBeInTheDocument();
    expect(pending()).toBe(0);
  });

});
