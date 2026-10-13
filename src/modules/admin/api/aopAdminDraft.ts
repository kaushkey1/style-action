import type { Configuration, DraftChange, EffectiveValue, Operation, ParameterOperation, ParameterRule, Season, Site } from '../types/aopAdmin';

export function operationKey(operation: Operation): string {
  if (operation.op === 'add_channel') return `channel:${operation.channel}`;
  if (operation.op === 'set_channel_setting') return `channel:${operation.channel}:${operation.field}`;
  if (operation.op === 'set_setting') return `${operation.section}:${Array.isArray(operation.path) ? JSON.stringify(operation.path) : operation.path}`;
  if (operation.op === 'set_season') return `season:${operation.season.season_code}`;
  if (operation.op === 'remove_season') return `season:${operation.season.code}`;
  return [operation.scope.type, operation.scope.channelCode ?? '', operation.scope.siteId ?? '',
    operation.scope.addedStoreId ?? '', operation.monthNumber ? '' : operation.season.code,
    operation.monthNumber ?? '', operation.parameter].join(':');
}

export function ruleOperation(rule: ParameterRule): ParameterOperation {
  return { op: 'set_parameter', scope: { type: rule.scope_type,
    ...(rule.channel_code ? { channelCode: rule.channel_code } : {}),
    ...(rule.site_id ? { siteId: rule.site_id } : {}),
    ...(rule.added_store_id ? { addedStoreId: rule.added_store_id } : {}),
  }, season: { code: rule.season_code },
  ...(rule.month_number ? { monthNumber: rule.month_number } : {}), parameter: rule.parameter_key, value: rule.parameter_value };
}

export function siteOperation(site: Site, season: Season, parameter: ParameterRule['parameter_key'], month?: number): ParameterOperation {
  return { op: 'set_parameter', scope: { type: site.scope_type,
    ...(site.site_id ? { siteId: site.site_id } : {}), ...(site.added_store_id ? { addedStoreId: site.added_store_id } : {}) },
  season: { code: season.season_code }, parameter, ...(month ? { monthNumber: month } : {}) };
}

export function draftRules(config: Configuration, changes: Record<string, DraftChange>): ParameterRule[] {
  const rules = new Map(config.parameter_rules.map((rule) => [operationKey(ruleOperation(rule)), rule]));
  for (const change of Object.values(changes)) {
    const operation = change.operation;
    if (change.error || (operation.op !== 'set_parameter' && operation.op !== 'remove_parameter')) continue;
    const key = operationKey(operation);
    if (operation.op === 'remove_parameter') { rules.delete(key); continue; }
    if (operation.value === undefined) continue;
    rules.set(key, { rule_id: null, scope_type: operation.scope.type,
      channel_code: operation.scope.channelCode ?? null, site_id: operation.scope.siteId ?? null,
      added_store_id: operation.scope.addedStoreId ?? null, season_code: operation.season.code,
      month_number: operation.monthNumber ?? null,
      parameter_key: operation.parameter, parameter_value: operation.value });
  }
  const result = [...rules.values()];
  if (!Object.values(changes).some(({ operation }) => operation.op === 'set_season')) return result;
  const seasons = draftSeasons(config, changes);
  return result.map((rule) => {
    const season = rule.month_number ? seasons.find((item) => item.months.includes(rule.month_number ?? 0)) : undefined;
    return season ? { ...rule, season_code: season.season_code } : rule;
  });
}

export function draftSeasons(config: Configuration, changes: Record<string, DraftChange>): Season[] {
  const seasons = new Map(config.season_definitions.map((season) => [season.season_code, season]));
  for (const { operation } of Object.values(changes)) {
    if (operation.op === 'set_season') seasons.set(operation.season.season_code, operation.season);
    if (operation.op === 'remove_season') seasons.delete(operation.season.code);
  }
  return [...seasons.values()].sort((left, right) => (left.months[0] ?? 1) - (right.months[0] ?? 1));
}

export function effectiveValue(rules: ParameterRule[], site: Site, season: Season, month: number, parameter: ParameterRule['parameter_key']): EffectiveValue | null {
  const candidates = rules.filter((rule) => rule.season_code === season.season_code && rule.parameter_key === parameter);
  const isSite = (rule: ParameterRule): boolean => rule.scope_type === site.scope_type &&
    (site.scope_type === 'site' ? rule.site_id === site.site_id : rule.added_store_id === site.added_store_id);
  const source = candidates.find((rule) => isSite(rule) && rule.month_number === month)
    ?? candidates.find((rule) => isSite(rule) && rule.month_number === null)
    ?? candidates.find((rule) => rule.scope_type === 'channel' && rule.channel_code === site.channel_code)
    ?? candidates.find((rule) => rule.scope_type === 'organisation');
  return source ? { value: source.parameter_value, source } : null;
}

export function sourceLabel(value: EffectiveValue | null): string {
  if (!value) return 'Configuration required';
  if (value.source.setting_path) return 'Saved setting';
  if (value.source.scope_type === 'organisation') return 'Organisation season default';
  if (value.source.scope_type === 'channel') return 'Channel season default';
  return value.source.month_number ? 'Site/month override' : 'Site season override';
}

export type ParameterResolver = (site: Site, season: Season, month: number, parameter: ParameterRule['parameter_key'], inherit?: boolean) => EffectiveValue | null;

export function createParameterResolver(rules: ParameterRule[], settings?: Configuration['planning_settings']): ParameterResolver {
  const indexed = new Map(rules.map((rule) => [operationKey(ruleOperation(rule)), rule]));
  return (site, season, month, parameter, inherit = false) => {
    const candidates: ParameterOperation[] = [
      ...inherit ? [] : [siteOperation(site, season, parameter, month)],
      siteOperation(site, season, parameter),
      { op: 'set_parameter', scope: { type: 'channel', channelCode: site.channel_code ?? '' }, season: { code: season.season_code }, parameter },
      { op: 'set_parameter', scope: { type: 'organisation' }, season: { code: season.season_code }, parameter },
    ];
    const source = candidates.map((op) => indexed.get(operationKey(op))).find((rule) => rule !== undefined);
    if (source) return { value: source.parameter_value, source };
    const channel = site.channel_code ? settings?.channel_planning_defaults[site.channel_code] : undefined;
    const value = parameter === 'discount_ratio' && channel?.discount_pct != null ? channel.discount_pct / 100
      : parameter === 'aop_achievement_ratio' ? settings?.aop_achievement_ratio : null;
    if (value === undefined || value === null) return null;
    return { value, source: {
      rule_id: null, scope_type: parameter === 'discount_ratio' ? 'channel' : 'organisation',
      season_code: season.season_code, channel_code: parameter === 'discount_ratio' ? site.channel_code : null,
      site_id: null, added_store_id: null, month_number: null, parameter_key: parameter, parameter_value: value,
      setting_path: parameter === 'discount_ratio' ? ['planning_settings', 'channel_planning_defaults', site.channel_code ?? '', 'discount_pct']
        : ['planning_settings', 'aop_achievement_ratio'],
    } };
  };
}

export function numberDraft(operation: Operation, input: string, ratio: boolean, min: number, max: number): DraftChange {
  const numeric = Number(input);
  let error: string | undefined;
  if (!input.trim() || !Number.isFinite(numeric)) error = 'Enter a number';
  else if (numeric < min || numeric > max) error = `Enter a value from ${min} to ${max}`;
  else if (ratio && !/^-?\d*(?:\.\d{0,4})?$/.test(input)) error = 'Use up to four decimal places';
  const value = ratio ? Number((numeric / 100).toFixed(6)) : numeric;
  if (operation.op === 'set_parameter' || operation.op === 'set_setting' || operation.op === 'set_channel_setting') return { operation: { ...operation, value }, input, error };
  return { operation, input, error };
}
