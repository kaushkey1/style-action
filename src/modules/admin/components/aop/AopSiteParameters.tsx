import { useMemo, type ReactNode } from 'react';
import { ConfigCard } from '../shared/config/ConfigPrimitives';
import { AopNumberField, type EditProps } from './AopFields';
import { AopSiteChannel } from './AopSiteChannel';
import { createParameterResolver, draftRules, draftSeasons } from '../../api/aopAdminDraft';
import type { AdminChannel, Configuration, ParameterKey, ParameterOperation, ParameterRule, Season } from '../../types/aopAdmin';

const SITE_MONTHLY_CHANNELS = new Set(['EBO', 'MBO', 'SIS']);

const COLUMNS = [
  { key: 'nsm_ratio', label: 'NSM', max: 100 },
  { key: 'sell_through_ratio', label: 'Sell-through', max: 100 },
  { key: 'discount_ratio', label: 'Discount', max: 99.9999 },
  // Match the monthly fields and the NUMERIC(12,6) ratio stored by the API.
  { key: 'aop_achievement_ratio', label: 'AOP Achievement', max: 99_999_999.9999 },
] as const;

export function AopSiteParameters({ config, channels: catalogue, planningSettings, ...edit }: EditProps & { config: Configuration; channels: AdminChannel[]; planningSettings: Configuration['planning_settings'] }): ReactNode {
  const rules = useMemo(() => draftRules(config, edit.changes), [config, edit.changes]);
  const seasons = useMemo(() => draftSeasons(config, edit.changes), [config, edit.changes]);
  const resolve = useMemo(() => createParameterResolver(rules, planningSettings), [rules, planningSettings]);
  const channels = catalogue.map(({ code }) => code);
  const siteChannels = channels.map((channel) => ({ channel, configurable: SITE_MONTHLY_CHANNELS.has(channel.trim().toUpperCase()) }))
    .sort((left, right) => Number(right.configurable) - Number(left.configurable));
  return <div className="space-y-4">
    <ConfigCard title="Season Defaults" description="Channel defaults are shared by AW and SS. Site/month overrides take precedence.">
      <div className="overflow-x-auto">
        <table aria-label="Shared season defaults" className="w-full min-w-[864px] table-fixed text-sm">
          <colgroup><col />{COLUMNS.map(({ key }) => <col key={key} className="w-44" />)}</colgroup>
          <thead><tr className="border-b border-gray-200">
            <th scope="col" className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Channel</th>
            {COLUMNS.map(({ key, label }) => <th scope="col" key={key} className="px-2 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{label} %</th>)}
          </tr></thead>
          <tbody>{channels.map((channel) => <tr key={channel} className="border-b border-gray-100 last:border-b-0">
            <th scope="row" className="px-2 py-5 text-left align-top font-medium text-gray-900">{channel}</th>
            {COLUMNS.map(({ key, label, max }) => <td key={key} className="px-2 py-3 align-top"><div className="flex justify-end">
              <ChannelDefault {...edit} channel={channel} parameter={key} label={label} max={max} rules={rules} seasons={seasons} planningSettings={planningSettings} />
            </div></td>)}
          </tr>)}</tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-500">Each monthly percentage is independent; these rates do not need to total 100% across the year.</p>
    </ConfigCard>
    <ConfigCard title="Site Monthly Parameters" description="Select parameters, then search for a site. Values inherit Season Defaults unless overridden. Months repeat annually.">
      <div className="space-y-3">
        {siteChannels.map(({ channel, configurable }) => <AopSiteChannel key={channel} channel={channel} configurable={configurable}
          configId={config.config_id} seasons={seasons} resolve={resolve} {...edit} />)}
      </div>
    </ConfigCard>
  </div>;
}

function ChannelDefault({ channel, parameter, label, max, rules, seasons, planningSettings, ...edit }: EditProps & {
  channel: string; parameter: ParameterKey; label: string; max: number; rules: ParameterRule[]; seasons: Season[]; planningSettings: Configuration['planning_settings'];
}): ReactNode {
  const channelSettings = planningSettings.channel_planning_defaults[channel];
  const fallback = parameter === 'discount_ratio' && channelSettings?.discount_pct != null ? channelSettings.discount_pct / 100
    : parameter === 'aop_achievement_ratio' ? planningSettings.aop_achievement_ratio ?? null : null;
  const values = seasons.map((season) => {
    const matching = rules.filter((rule) => rule.season_code === season.season_code && rule.parameter_key === parameter);
    return (matching.find((rule) => rule.scope_type === 'channel' && rule.channel_code === channel)
      ?? matching.find((rule) => rule.scope_type === 'organisation'))?.parameter_value ?? fallback;
  });
  const mixed = new Set(values).size > 1;
  const value = values[0] ?? null;
  const operations: ParameterOperation[] = seasons.map((season) => ({
    op: 'set_parameter', scope: { type: 'channel', channelCode: channel }, season: { code: season.season_code }, parameter,
  }));
  const first = operations[0];
  if (!first) return null;
  return <div className="w-29 shrink-0">
    <AopNumberField {...edit} operation={first} value={mixed ? null : value} ratio max={max} label={`${channel} ${label}%`} placeholder={mixed ? 'Varies' : 'Not set'}
      onChange={(change) => {
        if (change.operation.op !== 'set_parameter') return;
        const value = change.operation.value;
        const batch = operations.map((operation) => ({ ...change, operation: { ...operation, value } }));
        if (edit.onBatchChange) edit.onBatchChange(batch, `Edit ${channel} ${label} season defaults`);
        else batch.forEach(edit.onChange);
      }} />
    {mixed && <p className="mt-1 text-right text-xs text-gray-500">Different season values</p>}
  </div>;
}
