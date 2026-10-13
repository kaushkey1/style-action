import type { ReactNode } from 'react';
import { ConfigCard, ReadOnlyRow } from '../shared/config/ConfigPrimitives';
import { AopNumberField, type EditProps } from './AopFields';
import { AopSiteParameters } from './AopSiteParameters';
import { draftPlanning } from '../../api/aopPlanningDraft';
import type { AdminChannel, Configuration } from '../../types/aopAdmin';

export function AopParametersTab({ config, channels, ...edit }: EditProps & { config: Configuration; channels: AdminChannel[] }): ReactNode {
  const settings = draftPlanning(config, edit.changes);
  const fields = [
    { title: 'Editing limits', label: 'Maximum cell increase', key: 'max_cell_increase_ratio' as const, min: 0, max: 1000, ratio: true, description: 'Maximum increase setting for store/month and channel/month values.' },
    { title: 'New-store defaults', label: 'Fallback gross margin', key: 'new_store_gm_fallback_pct' as const, min: 0, max: 100, description: 'Gross margin setting for new stores without a usable channel reference.' },
  ];
  return <div className="space-y-4">
    <ConfigCard title="Top-Down Growth Factor"><ReadOnlyRow label="Growth %" description="Initial growth assumption.">
      <AopNumberField {...edit} label="Initial growth%" value={settings.initial_growth_pct} min={-100} max={1000}
        operation={{ op: 'set_setting', section: 'planning_settings', path: 'initial_growth_pct', value: settings.initial_growth_pct }} />
    </ReadOnlyRow></ConfigCard>
    <AopSiteParameters config={config} channels={channels} planningSettings={settings} {...edit} />
    {fields.map((field) => <ConfigCard key={field.key} title={field.title}>
      <ReadOnlyRow label={field.label} description={field.description}>
        <AopNumberField {...edit} label={`${field.label}%`} value={settings[field.key]} min={field.min} max={field.max} ratio={field.ratio}
          operation={{ op: 'set_setting', section: 'planning_settings', path: field.key, value: settings[field.key] }} />
      </ReadOnlyRow>
    </ConfigCard>)}
  </div>;
}
