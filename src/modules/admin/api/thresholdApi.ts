import { appApiFetch, appApiPut, appApiPost } from '@/lib/api';

export interface KpiThreshold {
  id: number;
  kpi_code: string;
  display_name: string;
  sub_domain: string | null;
  green_value: number;
  amber_value: number;
  default_green: number;
  default_amber: number;
  direction: 'higher-is-better' | 'lower-is-better';
  unit: string | null;
  target_display: string | null;
  is_active: boolean;
  updated_at: string | null;
  updated_by: string | null;
  formula: string | null;
  formula_description: string | null;
  refresh: string | null;
  config_status: string;
  exception_on_amber: boolean;
  exception_on_red: boolean;
  amber_severity: string;
  red_severity: string;
}

interface ThresholdsResponse {
  total: number;
  thresholds: KpiThreshold[];
}

export async function fetchThresholds(
  subDomain?: string,
): Promise<KpiThreshold[]> {
  const params: Record<string, string> = {};
  if (subDomain) params.sub_domain = subDomain;
  const resp = await appApiFetch<ThresholdsResponse>(
    '/insights/thresholds',
    params,
  );
  return resp.thresholds;
}

export async function updateThreshold(
  kpiCode: string,
  greenValue: number,
  amberValue: number,
): Promise<KpiThreshold> {
  return appApiPut<KpiThreshold>(`/insights/thresholds/${kpiCode}`, {
    green_value: greenValue,
    amber_value: amberValue,
  });
}

export async function resetAllThresholds(): Promise<void> {
  await appApiPost<unknown>('/insights/thresholds/reset');
}

export async function resetOneThreshold(
  kpiCode: string,
): Promise<KpiThreshold> {
  return appApiPost<KpiThreshold>(`/insights/thresholds/${kpiCode}/reset`);
}

export async function updateKpiConfig(
  kpiCode: string,
  updates: Partial<Pick<KpiThreshold,
    'display_name' | 'formula' | 'formula_description' |
    'refresh' | 'config_status' |
    'exception_on_amber' | 'exception_on_red' | 'amber_severity' | 'red_severity'
  >>,
): Promise<KpiThreshold> {
  return appApiPut<KpiThreshold>(`/insights/thresholds/${kpiCode}/config`, updates);
}

// ── KPI Groups ──

export interface KpiGroupItem {
  id: string;
  name: string;
  assigned_to: string | null;
  kpi_count: number;
  kpi_codes: string[];
  sort_order: number;
}

interface GroupsResponse {
  total: number;
  groups: KpiGroupItem[];
}

export async function fetchKpiGroups(): Promise<KpiGroupItem[]> {
  const resp = await appApiFetch<GroupsResponse>('/insights/kpi-groups');
  return resp.groups;
}
