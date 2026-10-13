import { describe, expect, it, beforeEach } from 'vitest';
import { draftRules, draftSeasons, effectiveValue, numberDraft, operationKey, ruleOperation, siteOperation, sourceLabel } from '@/modules/admin/api/aopAdminDraft';
import { monthRange } from '@/modules/admin/api/aopAdminCalendar';
import { useAopAdminDraftStore } from '@/modules/admin/stores/useAopAdminDraftStore';
import { configuration, rule, season, site } from './aopFixtures';

const operation = siteOperation(site, season, 'nsm_ratio', 8);

describe('AOP parameter editing', () => {
  it('resolves each parameter independently and preserves an explicit zero', () => {
    const rules = [rule(), rule({ parameter_key: 'sell_through_ratio', parameter_value: 0.6 }), rule({ scope_type: 'channel', channel_code: 'EBO', parameter_value: 0.7 }), rule({ scope_type: 'site', site_id: 'S1', parameter_value: 0.5 }), rule({ scope_type: 'site', site_id: 'S1', month_number: 8, parameter_value: 0 })];
    const result = effectiveValue(rules, site, season, 8, 'nsm_ratio');
    expect(result?.value).toBe(0);
    expect(sourceLabel(result)).toBe('Site/month override');
    expect(effectiveValue(rules, site, season, 8, 'sell_through_ratio')?.value).toBe(0.6);
    expect(effectiveValue(rules, { ...site, site_id: 'NEW' }, season, 8, 'nsm_ratio')?.value).toBe(0.7);
  });

  it('clears an override and reveals the seasonal default without modifying the base', () => {
    const base = configuration();
    const edit = { operation: { ...operation, value: 0 } };
    const added = draftRules(base, { [operationKey(operation)]: edit });
    expect(added).toHaveLength(3);
    expect(base.parameter_rules).toHaveLength(2);
    const removed = draftRules({ ...base, parameter_rules: added }, { [operationKey(operation)]: { operation: { ...operation, op: 'remove_parameter' } } });
    expect(effectiveValue(removed, site, season, 8, 'nsm_ratio')?.value).toBe(0.8);
  });

  it.each(['', ' ', 'NaN', 'Infinity', '-1', '101', '0.12345'])('rejects invalid percentage %j without changing effective values', (input) => {
    const draft = numberDraft(operation, input, true, 0, 100);
    expect(draft.error).toBeTruthy();
    expect(draftRules(configuration(), { key: draft })).toEqual(configuration().parameter_rules);
  });

  it.each([['0', 0], ['100', 1], ['62.5125', 0.625125]])('converts %s%% once into a fraction', (input, expected) => {
    const draft = numberDraft(operation, String(input), true, 0, 100);
    expect(draft.error).toBeUndefined();
    expect(draft.operation).toMatchObject({ value: expected });
  });

  it('separates planned-site UUIDs from identically named master sites', () => {
    const planned = { ...site, site_id: undefined, scope_type: 'planned_site' as const, added_store_id: 'planned-1', site_reference: 'planned:planned-1' };
    const plannedRule = rule({ scope_type: 'planned_site', added_store_id: 'planned-1', parameter_value: 0.2 });
    expect(effectiveValue([plannedRule], planned, season, 8, 'nsm_ratio')?.value).toBe(0.2);
    expect(effectiveValue([plannedRule], site, season, 8, 'nsm_ratio')).toBeNull();
    expect(ruleOperation(plannedRule).scope).toEqual({ type: 'planned_site', addedStoreId: 'planned-1' });
    expect(sourceLabel(null)).toBe('Configuration required');
  });

  it('handles season edits, removal and January rollover', () => {
    expect(monthRange(8, 1)).toEqual([8, 9, 10, 11, 12, 1]);
    expect(draftSeasons(configuration(), { remove: { operation: { op: 'remove_season', season: { code: 'AW' } } } })).toEqual([]);
    expect(operationKey({ op: 'set_season', season })).toBe(operationKey({ op: 'remove_season', season: { code: 'AW' } }));
  });
});

describe('AOP drafts across navigation', () => {
  beforeEach(() => useAopAdminDraftStore.setState({ drafts: {} }));
  it('isolates organisation drafts and preserves their original version until rebased', () => {
    const store = useAopAdminDraftStore.getState();
    store.edit('tenant:org1', configuration(), { operation: { ...operation, value: 0 } });
    store.edit('tenant:org2', { ...configuration(), config_id: 'other' }, { operation: { ...operation, value: 0.5 } });
    const drafts = useAopAdminDraftStore.getState().drafts;
    expect(drafts['tenant:org1']?.baseConfiguration.config_id).toBe('config-1');
    expect(drafts['tenant:org2']?.baseConfiguration.config_id).toBe('other');
    store.replace('tenant:org1', { ...configuration(), config_id: 'new' }, drafts['tenant:org1']?.changes);
    expect(Object.values(useAopAdminDraftStore.getState().drafts['tenant:org1']?.changes ?? {})).toHaveLength(1);
    store.replace('tenant:org1', configuration());
    expect(useAopAdminDraftStore.getState().drafts['tenant:org1']?.changes).toEqual({});
  });
});
