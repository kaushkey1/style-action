import { beforeEach, describe, expect, it } from 'vitest';
import { buildChannelResetPreview, buildContextFillPreview, buildPastePreview, gridColumns, GRID_PARAMETERS, type GridContext } from '@/modules/admin/api/aopGridDraft';
import { createParameterResolver, draftRules, numberDraft, operationKey, siteOperation } from '@/modules/admin/api/aopAdminDraft';
import { useAopAdminDraftStore } from '@/modules/admin/stores/useAopAdminDraftStore';
import type { SiteParameters } from '@/modules/admin/types/aopAdmin';
import { FISCAL_MONTHS } from '@/modules/admin/api/aopAdminCalendar';
import { planningConfiguration, rule, site } from './aopFixtures';

const config = planningConfiguration();
config.parameter_rules = config.season_definitions.flatMap((season) => [rule({ season_code: season.season_code }), rule({ season_code: season.season_code, parameter_key: 'sell_through_ratio', parameter_value: 0.6 })]);
const context: GridContext = { seasons: config.season_definitions, changes: {}, resolve: createParameterResolver(config.parameter_rules, config.planning_settings) };
const sites: SiteParameters[] = [1, 2].map((id) => ({ ...site, site_id: `S${id}`, site_reference: `master:S${id}`, code: `S${id}`, months: FISCAL_MONTHS.map((month_number) => ({ month_number, applicable: true })) }));
const columns = gridColumns([4, 5], ['nsm_ratio']);
const april = config.season_definitions.find((season) => season.months.includes(4))!;

describe('AOP contextual fill', () => {
  it('resets every available month and parameter in the channel, including added stores, without touching other channels', () => {
    const added = { ...sites[0], scope_type: 'planned_site' as const, site_id: undefined, added_store_id: 'added-1', site_reference: 'added:added-1' };
    const mbo = { ...sites[0], site_id: 'M1', site_reference: 'master:M1', channel_code: 'MBO' };
    const monthlyRules = FISCAL_MONTHS.flatMap((month_number) => GRID_PARAMETERS.map(({ key }) => rule({ scope_type: 'site', site_id: 'S1',
      season_code: config.season_definitions.find((season) => season.months.includes(month_number))!.season_code,
      month_number, parameter_key: key, parameter_value: .8 })));
    const rules = [...config.parameter_rules, ...monthlyRules,
      rule({ scope_type: 'planned_site', added_store_id: 'added-1', season_code: 'SS', month_number: 4, parameter_value: .95 }),
      rule({ scope_type: 'site', site_id: 'M1', season_code: 'SS', month_number: 4, parameter_value: .95 }),
    ];
    const unavailable = { ...sites[1], months: [] };
    const preview = buildChannelResetPreview({ ...context, resolve: createParameterResolver(rules, config.planning_settings) }, 'EBO', [...sites, added, mbo, unavailable]);
    expect(preview.errors).toEqual([]);
    expect(preview.cells).toHaveLength(49);
    expect(new Set(preview.cells.map((cell) => cell.month))).toEqual(new Set(FISCAL_MONTHS));
    expect(new Set(preview.cells.map((cell) => cell.parameter))).toEqual(new Set(GRID_PARAMETERS.map((metric) => metric.key)));
    expect(preview.cells.every((cell) => cell.site.channel_code === 'EBO' && cell.change.operation.op === 'remove_parameter')).toBe(true);
    expect(preview.cells.at(-1)?.change.operation).toMatchObject({ scope: { type: 'planned_site', addedStoreId: 'added-1' } });
    expect(preview.skipped).toBe(48);
  });

  it('resets only monthly overrides, including explicit values equal to their default', () => {
    const rules = [...config.parameter_rules, rule({ scope_type: 'site', site_id: 'S1', season_code: 'SS', month_number: 4, parameter_value: .8 })];
    const withOverride = { ...context, resolve: createParameterResolver(rules, config.planning_settings) };
    const preview = buildContextFillPreview(withOverride, sites, columns, { kind: 'reset' });
    expect(preview.errors).toEqual([]);
    expect(preview.cells).toHaveLength(1);
    expect(preview.cells[0]).toMatchObject({ before: '80', after: '80', change: { operation: { op: 'remove_parameter', monthNumber: 4, scope: { siteId: 'S1' } } } });
    expect(preview.cells[0].change.operation).not.toHaveProperty('value');
    expect(preview.cells[0].change).not.toHaveProperty('input');
    expect(preview.unchanged).toBe(3);
  });

  it('restores the inherited value without altering a legacy site-season rule or fabricating a missing default', () => {
    const monthly = rule({ scope_type: 'site', site_id: 'S1', season_code: 'SS', month_number: 4, parameter_value: .9 });
    const seasonal = rule({ scope_type: 'site', site_id: 'S1', season_code: 'SS', parameter_value: .7 });
    const inherited = { ...context, resolve: createParameterResolver([...config.parameter_rules, monthly, seasonal]) };
    const preview = buildContextFillPreview(inherited, sites, columns, { kind: 'reset' });
    expect(preview.cells).toHaveLength(1);
    expect(preview.cells[0]).toMatchObject({ month: 4, before: '90', after: '70' });
    const missing = { ...context, resolve: createParameterResolver([monthly]) };
    expect(buildContextFillPreview(missing, sites, columns, { kind: 'reset' }).cells[0].after).toBe('Not set');
  });

  it('resets invalid draft input to current channel defaults and skips already reset cells', () => {
    const change = numberDraft(siteOperation(sites[0], april, 'nsm_ratio', 4), 'invalid', true, 0, 100);
    const channel = numberDraft({ op: 'set_parameter', scope: { type: 'channel', channelCode: 'EBO' }, season: { code: 'SS' }, parameter: 'nsm_ratio' }, '0', true, 0, 100);
    const changes = { [operationKey(change.operation)]: change, [operationKey(channel.operation)]: channel };
    const edited = { ...context, changes, resolve: createParameterResolver(draftRules(config, changes), config.planning_settings) };
    const preview = buildContextFillPreview(edited, sites, columns, { kind: 'reset' });
    expect(preview.errors).toEqual([]);
    expect(preview.cells[0]).toMatchObject({ before: 'invalid', after: '0' });
    const reset = preview.cells[0].change;
    const resetChanges = { ...changes, [operationKey(reset.operation)]: reset };
    expect(buildContextFillPreview({ ...edited, changes: resetChanges }, sites, columns, { kind: 'reset' }).cells).toEqual([]);
  });

  it('fills only the supplied scope and skips matching values', () => {
    const preview = buildContextFillPreview(context, [sites[1]], [columns[0]], { kind: 'value', value: '90%' });
    expect(preview.errors).toEqual([]);
    expect(preview.cells.map((cell) => [cell.site.code, cell.month, cell.after])).toEqual([['S2', 4, '90']]);
    expect(buildContextFillPreview(context, sites, columns, { kind: 'value', value: '80.0000' })).toMatchObject({ cells: [], unchanged: 4 });
  });

  it('rejects unavailable targets', () => {
    const unavailable = { ...sites[0], months: [] };
    expect(buildContextFillPreview(context, [unavailable], columns, { kind: 'value', value: '90' }).errors).toHaveLength(2);
  });

  it('enforces each parameter’s limits and the pending edit limit', () => {
    expect(buildContextFillPreview(context, sites, gridColumns([4], ['discount_ratio']), { kind: 'value', value: '100' }).errors).toHaveLength(2);
    expect(buildContextFillPreview(context, sites, gridColumns([4], ['aop_achievement_ratio']), { kind: 'value', value: '125' }).cells).toHaveLength(2);
    const change = numberDraft(siteOperation(sites[0], april, 'nsm_ratio', 4), '90', true, 0, 100);
    const many = Object.fromEntries(Array.from({ length: 10_000 }, (_, index) => [`other${index}`, change]));
    expect(buildContextFillPreview({ ...context, changes: many }, sites, columns, { kind: 'value', value: '95' }).errors[0]).toContain('10,000');
  });
});

describe('AOP grid draft operations', () => {
  it('imports only selected parameters from a full 91-site, four-parameter workbook', () => {
    const catalogue = Array.from({ length: 91 }, (_, index) => ({ ...sites[0], code: `S${index + 1}`, site_id: `S${index + 1}`, site_reference: `master:S${index + 1}` }));
    const workbookColumns = gridColumns(FISCAL_MONTHS, GRID_PARAMETERS.map((metric) => metric.key));
    const headers = workbookColumns.map(({ month, parameter }) => `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month - 1]} · ${GRID_PARAMETERS.find((metric) => metric.key === parameter)!.label} %`);
    const values = { nsm_ratio: '90', sell_through_ratio: '65', discount_ratio: '25', aop_achievement_ratio: '110' };
    const text = [['Site', 'Site code', ...headers].join('\t'), ...catalogue.map((site) =>
      [site.name, site.code, ...workbookColumns.map(({ parameter }) => values[parameter])].join('\t'))].join('\n');
    const preview = buildPastePreview(context, catalogue, gridColumns(FISCAL_MONTHS, ['nsm_ratio', 'discount_ratio']), 0, 0, text);
    expect(preview.errors).toEqual([]);
    expect(preview.cells).toHaveLength(2184);
    expect(new Set(preview.cells.map((cell) => cell.parameter))).toEqual(new Set(['nsm_ratio', 'discount_ratio']));
    expect(preview).toMatchObject({ filteredOut: 2184, unchanged: 0 });
  });

  it('filters workbook columns by month and parameter before checking their values', () => {
    const text = 'Site\tSite code\tMay · NSM %\tApr · Sell-through %\tApr · NSM %\nStore 1\tS1\tinvalid\t101\t90';
    const preview = buildPastePreview(context, sites, [columns[0]], 0, 0, text);
    expect(preview.errors).toEqual([]);
    expect(preview.cells.map((cell) => [cell.month, cell.parameter, cell.after])).toEqual([[4, 'nsm_ratio', '90']]);
    expect(preview).toMatchObject({ filteredOut: 2 });
    const noMatch = buildPastePreview(context, sites, gridColumns([6], ['discount_ratio']), 0, 0, text);
    expect(noMatch).toMatchObject({ cells: [], errors: [], filteredOut: 3 });
  });

  it('counts only the changed cell when the full 91-site, 12-month sheet is pasted', () => {
    const catalogue = Array.from({ length: 91 }, (_, index) => ({ ...sites[0], code: `S${index + 1}`, site_id: `S${index + 1}`, site_reference: `master:S${index + 1}` }));
    const headers = FISCAL_MONTHS.map((month) => `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month - 1]} · NSM %`);
    const text = [['Site', 'Site code', ...headers].join('\t'), ...catalogue.map((site, row) =>
      [site.name, site.code, ...FISCAL_MONTHS.map((_month, col) => row === 4 && col === 3 ? '95' : '80.0000%')].join('\t'))].join('\n');
    const preview = buildPastePreview(context, catalogue, gridColumns(FISCAL_MONTHS, ['nsm_ratio']), 0, 0, text);
    expect(preview.errors).toEqual([]);
    expect(preview.cells).toHaveLength(1);
    expect(preview.cells[0]).toMatchObject({ site: { code: 'S5' }, month: 7, after: '95', before: '80' });
    expect(preview.unchanged).toBe(1091);
  });

  it('skips identical numeric values, keeps zero distinct from unset and compares against pending edits', () => {
    expect(buildPastePreview(context, sites, columns, 0, 0, '80\t80.0000%').cells).toEqual([]);
    const unset = { ...context, resolve: () => null };
    expect(buildPastePreview(unset, sites, columns, 0, 0, '0').cells).toHaveLength(1);
    const change = numberDraft(siteOperation(sites[0], april, 'nsm_ratio', 4), '95', true, 0, 100);
    const pending = { ...context, changes: { [operationKey(change.operation)]: change } };
    expect(buildPastePreview(pending, sites, columns, 0, 0, '95').cells).toEqual([]);
  });

  it('pastes an exported sheet by site code and column headers regardless of row order or focused cell', () => {
    const text = 'Site\tSite code\tMay · AOP Achievement %\tApr · NSM %\r\nStore 2\tS2\t125\t90\r\nStore 1\tS1\t\t0\r\n';
    const preview = buildPastePreview(context, sites, gridColumns([4, 5], ['nsm_ratio', 'aop_achievement_ratio']), 1, 1, text);
    expect(preview.errors).toEqual([]);
    expect(preview.skipped).toBe(1);
    expect(preview.cells.map((cell) => [cell.site.code, cell.month, cell.parameter, cell.after])).toEqual([
      ['S2', 5, 'aop_achievement_ratio', '125'], ['S2', 4, 'nsm_ratio', '90'], ['S1', 4, 'nsm_ratio', '0'],
    ]);
  });

  it('preserves text site codes and handles quoted Excel names with tabs, newlines and quotes', () => {
    const coded = [{ ...sites[0], code: '00123', site_id: '00123', site_reference: 'master:00123' }];
    const preview = buildPastePreview(context, coded, columns, 0, 0,
      'Site\tSite code\tApr · NSM %\n"Store\tOne\n""North"""\t00123\t95\n');
    expect(preview.errors).toEqual([]);
    expect(preview.cells).toHaveLength(1);
    expect(preview.cells[0].site.code).toBe('00123');
  });

  it.each([
    'Site\tSite code\tApr · NSM %\nUnknown\tS9\t90',
    'Site\tSite code\tApr · NSM %\nOne\tS1\t90\nTwo\tS1\t80',
    'Site\tSite code\tApr · Unknown %\nOne\tS1\t90',
    'Site\tSite code\tApr · NSM %\tApr · NSM %\nOne\tS1\t90\t80',
    'Site\tSite code\tApr · Discount %\nOne\tS1\t100',
  ])('rejects invalid exported data without dropping the identity columns positionally: %j', (text) => {
    expect(buildPastePreview(context, sites, gridColumns([4, 5], ['nsm_ratio', 'discount_ratio']), 0, 0, text).errors.length).toBeGreaterThan(0);
  });

  it('pastes in visible row/column order, handles Excel percentages and CRLF, and skips blanks', () => {
    const preview = buildPastePreview(context, [...sites].reverse(), columns, 0, 0, '90%\t0\r\n\t85.1234\r\n');
    expect(preview.errors).toEqual([]);
    expect(preview.skipped).toBe(1);
    expect(preview.cells.map((cell) => [cell.site.code, cell.month, cell.after])).toEqual([['S2', 4, '90'], ['S2', 5, '0'], ['S1', 5, '85.1234']]);
    expect(preview.cells[2].change.operation).toMatchObject({ value: 0.851234 });
  });

  it.each(['1\t2\n3', '1\t2\t3', '1\n2\n3', '=SUM(A1)\t2', '90\t101', 'NaN', 'Infinity', '1e2', '25.00001', '%'])('rejects an invalid pasted block %j', (text) => {
    expect(buildPastePreview(context, sites, columns, 0, 0, text).errors.length).toBeGreaterThan(0);
  });

  it('uses the correct mixed-parameter column bounds, including at a paste offset', () => {
    const mixed = gridColumns([4, 5], ['discount_ratio', 'aop_achievement_ratio']);
    const preview = buildPastePreview(context, sites, mixed, 1, 1, '125\t20\t150');
    expect(preview.errors).toEqual([]);
    expect(preview.cells.map((cell) => [cell.month, cell.parameter, cell.after])).toEqual([[4, 'aop_achievement_ratio', '125'], [5, 'aop_achievement_ratio', '150']]);
    expect(preview.unchanged).toBe(1); // The existing May discount was already 20%.
  });

  it('rejects nonblank paste into unavailable cells', () => {
    const unavailable = { ...sites[0], months: [{ month_number: 4, applicable: false }] };
    expect(buildPastePreview(context, [unavailable], columns, 0, 0, '90').errors).toHaveLength(1);
  });

  it('limits total pending edits, counts overwritten draft cells once and bounds clipboard input', () => {
    const change = numberDraft(siteOperation(sites[0], april, 'nsm_ratio', 4), '90', true, 0, 100);
    const many = Object.fromEntries(Array.from({ length: 9999 }, (_, i) => [`other${i}`, change]));
    expect(buildPastePreview({ ...context, changes: many }, sites, columns, 0, 0, '90\t90\n90\t90').errors[0]).toContain('10,000');
    expect(buildPastePreview({ ...context, changes: { ...many, [operationKey(change.operation)]: change } }, [sites[0]], [columns[0]], 0, 0, '90').errors).toEqual([]);
    expect(buildPastePreview(context, sites, columns, 0, 0, '1'.repeat(1_000_001)).errors).toHaveLength(1);
    expect(buildPastePreview(context, sites, columns, 0, 0, Array(5001).fill('90\t90').join('\n')).errors).toHaveLength(1);
  });

});

describe('AOP atomic draft history', () => {
  beforeEach(() => useAopAdminDraftStore.setState({ drafts: {} }));
  it('clears unsaved overrides but retains saved removals as one undoable reset batch', () => {
    const saved = { ...config, parameter_rules: [...config.parameter_rules, rule({ scope_type: 'site', site_id: 'S1', season_code: 'SS', month_number: 4, parameter_value: .9 })] };
    const store = useAopAdminDraftStore.getState();
    const scope = 'tenant:org';
    const earlier = numberDraft(siteOperation(sites[0], april, 'sell_through_ratio', 4), '65', true, 0, 100);
    const unsaved = numberDraft(siteOperation(sites[1], april, 'nsm_ratio', 4), '95', true, 0, 100);
    store.edit(scope, saved, earlier);
    store.edit(scope, saved, unsaved);
    const changes = useAopAdminDraftStore.getState().drafts[scope].changes;
    const reset = buildContextFillPreview({ ...context, changes, resolve: createParameterResolver(draftRules(saved, changes), saved.planning_settings) }, sites, [columns[0]], { kind: 'reset' });
    store.editBatch(scope, saved, reset.cells.map((cell) => cell.change), reset.label);
    const after = useAopAdminDraftStore.getState().drafts[scope].changes;
    expect(Object.keys(after)).toHaveLength(2);
    expect(after[operationKey(unsaved.operation)]).toBeUndefined();
    expect(after[operationKey(siteOperation(sites[0], april, 'nsm_ratio', 4))].operation.op).toBe('remove_parameter');
    store.undo(scope);
    expect(useAopAdminDraftStore.getState().drafts[scope].changes).toEqual(changes);
    store.redo(scope);
    expect(useAopAdminDraftStore.getState().drafts[scope].changes).toEqual(after);
  });

  it('undoes and redoes a batch atomically while retaining earlier edits, then clears redo on a new edit', () => {
    const store = useAopAdminDraftStore.getState();
    const scope = 'tenant:org';
    const earlier = numberDraft(siteOperation(sites[0], april, 'nsm_ratio', 4), '83', true, 0, 100);
    store.edit(scope, config, earlier);
    store.editBatch(scope, config, buildPastePreview(context, sites, columns, 0, 0, '90\t90\n90\t90').cells.map((cell) => cell.change), 'Paste from Excel');
    expect(Object.keys(useAopAdminDraftStore.getState().drafts[scope].changes)).toHaveLength(4);
    store.undo(scope);
    expect(useAopAdminDraftStore.getState().drafts[scope].changes).toEqual({ [operationKey(earlier.operation)]: earlier });
    store.redo(scope);
    expect(Object.values(useAopAdminDraftStore.getState().drafts[scope].changes).map((change) => change.input)).toEqual(['90', '90', '90', '90']);
    store.undo(scope);
    store.edit(scope, config, numberDraft(earlier.operation, '85', true, 0, 100));
    expect(useAopAdminDraftStore.getState().drafts[scope].future).toEqual([]);
    store.undo('another:org');
    store.replace(scope, config);
    store.redo(scope);
    expect(useAopAdminDraftStore.getState().drafts[scope]).toMatchObject({ changes: {}, past: [], future: [] });
  });

  it('coalesces consecutive keystrokes in a cell without swallowing an earlier batch', () => {
    const store = useAopAdminDraftStore.getState();
    const scope = 'tenant:org';
    store.editBatch(scope, config, buildPastePreview(context, sites, columns, 0, 0, '90\t90\n90\t90').cells.map((cell) => cell.change), 'Paste from Excel');
    for (const text of ['', '8', '85']) store.edit(scope, config, numberDraft(siteOperation(sites[0], april, 'nsm_ratio', 4), text, true, 0, 100));
    expect(useAopAdminDraftStore.getState().drafts[scope].past).toHaveLength(2);
    store.undo(scope);
    expect(Object.values(useAopAdminDraftStore.getState().drafts[scope].changes).map((change) => change.input)).toEqual(['90', '90', '90', '90']);
    store.undo(scope);
    expect(useAopAdminDraftStore.getState().drafts[scope].changes).toEqual({});
  });
});
