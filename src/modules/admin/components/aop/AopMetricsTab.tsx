import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/components/ui';
import { aopAdminApi, aopError } from '../../api/aopAdminApi';
import { useAopAdminContext } from '../../api/useAopAdminConfig';
import { ConfigCard, ConfigLoadingState, ReadOnlyRow } from '../shared/config/ConfigPrimitives';
import { KpiFormulaAccordion } from '../shared/config/KpiFormulaAccordion';
import { AopErrorState, AopNumberField, type EditProps } from './AopFields';
import type { Configuration } from '../../types/aopAdmin';

export function AopMetricsTab({ config, ...edit }: EditProps & { config: Configuration }): ReactNode {
  const context = useAopAdminContext();
  const query = useQuery({ queryKey: [...context.key, 'metrics'], queryFn: aopAdminApi.metrics, staleTime: 30 * 60_000 });
  const groups = [...new Set(query.data?.items.map((metric) => metric.group) ?? [])];
  const fields = [
    { path: 'growth.warning_min_pct', label: 'Growth warning minimum', value: config.kpi_settings.growth.warning_min_pct, min: -100, max: 1000 },
    { path: 'growth.warning_max_pct', label: 'Growth warning maximum', value: config.kpi_settings.growth.warning_max_pct, min: -100, max: 1000 },
    { path: 'high_growth.threshold_pct', label: 'High growth exception', value: config.kpi_settings.high_growth.threshold_pct, min: 0, max: 1000 },
    { path: 'steep_decline.threshold_pct', label: 'Steep decline exception', value: config.kpi_settings.steep_decline.threshold_pct, min: -100, max: 0 },
    { path: 'quarterly_phasing.deviation_pp', label: 'Quarterly phasing deviation (percentage points)', value: config.kpi_settings.quarterly_phasing.deviation_pp, min: 0, max: 100 },
  ];
  return <div className="space-y-4">
    <ConfigCard title="Exception Thresholds" description="Thresholds are saved for reference and do not affect AOP warnings or exceptions. Formula definitions are read-only.">
      {fields.map((field) => <ReadOnlyRow key={field.path} label={field.label}><AopNumberField {...edit} operation={{ op: 'set_setting', section: 'kpi_settings', path: field.path, value: field.value }} value={field.value} label={field.label} min={field.min} max={field.max} suffix={field.path.endsWith('_pp') ? 'pp' : '%'} /></ReadOnlyRow>)}
    </ConfigCard>
    {query.isPending && <ConfigLoadingState label="Loading KPI metrics and formulae…" />}{query.isError && <AopErrorState message={aopError(query.error)} onRetry={() => void query.refetch()} />}
    {query.isSuccess && !groups.length && <EmptyState title="No metric definitions" description="The metric registry has no entries." />}
    {groups.map((group) => <KpiFormulaAccordion key={group} animated title={group} items={query.data?.items.filter((metric) => metric.group === group) ?? []} />)}
  </div>;
}
