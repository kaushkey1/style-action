import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePersonaStore } from '@/hooks/usePersonaStore';
import { fetchPersonaInsights, type InsightPersonaId, type Insight } from '@/modules/store-view/api/insightsApi';
import type { Severity, Tone, EndState } from '../components/register/registerTokens';

export interface RegisterRow {
  id: string;
  kind: 'exception' | 'insight';
  code: string;
  title: string;
  severity: Severity | null;
  tone: Tone | null;
  domain: string;
  category: string;
  valueInr: number | null;
  sla: string | null;
  slaBreached?: boolean;
  agent: string;
  age: string;
  endState: EndState;
  owner: string | null;
}

export interface RegisterException {
  id: string;
  code: string;
  title: string;
  severity: Severity;
  domain: string;
  category: string;
  aiSummary: string;
  impactDescription: string;
  remediation: string;
  scope: string[];
  valueInr: number;
  sla: string | null;
  agent: string;
  age: string;
  relatedEntityLabels: string[];
  metricName?: string;
  metricValue?: number;
  thresholdValue?: number;
  breachPct?: number;
}

export interface RegisterInsight {
  id: string;
  code: string;
  title: string;
  tone: Tone | null;
  domain: string;
  category: string;
  summary: string;
  metricName: string | null;
  metricValue: number | null;
  thresholdValue: number | null;
  breachPct: number | null;
  valueAtStakeInr: number | null;
  agent: string;
  age: string;
  calc: { what: string; plain: string; example: string } | null;
}

function ragStatusToTone(status: string | null | undefined): Tone | null {
  if (!status) return null;
  const s = status.toLowerCase();
  if (s === 'red' || s === 'critical') return 'critical';
  if (s === 'amber' || s === 'warning') return 'warning';
  if (s === 'monitoring') return 'monitoring';
  if (s === 'green' || s === 'on-track') return 'on-track';
  return null;
}

function insightToRegisterRow(i: Insight): RegisterRow {
  const status = i.status?.toLowerCase();
  let tone: Tone | null = null;
  if (status === 'critical' || status === 'red') tone = 'critical';
  else if (status === 'warning' || status === 'amber') tone = 'warning';
  else if (status === 'monitoring') tone = 'monitoring';
  else if (status === 'on-track' || status === 'green') tone = 'on-track';

  const valueInr = i.value_at_stake_cr ? i.value_at_stake_cr * 10000000 : null;

  return {
    id: i.id,
    kind: 'insight',
    code: `INS-${i.id.slice(0, 6)}`,
    title: i.title || i.headline || 'Untitled insight',
    severity: null,
    tone,
    domain: i.domain || i.sub_domain || 'General',
    category: i.category || 'General',
    valueInr,
    sla: null,
    slaBreached: false,
    agent: 'Insight Agent',
    age: '-',
    endState: 'open',
    owner: null,
  };
}

function insightToRegisterInsight(i: Insight): RegisterInsight {
  const summary = i.detail || i.description || i.headline || 'No summary available.';

  let calc: RegisterInsight['calc'] = null;
  if (i.calc) {
    calc = {
      what: i.calc.what || '',
      plain: i.calc.plain || '',
      example: i.calc.example || '',
    };
  }

  return {
    id: i.id,
    code: `INS-${i.id.slice(0, 6)}`,
    title: i.title || i.headline || 'Untitled insight',
    tone: ragStatusToTone(i.status),
    domain: i.domain || i.sub_domain || 'General',
    category: i.category || 'General',
    summary,
    metricName: i.metric_name,
    metricValue: i.metric_value,
    thresholdValue: i.threshold_value,
    breachPct: i.breach_pct,
    valueAtStakeInr: i.value_at_stake_cr ? i.value_at_stake_cr * 10000000 : null,
    agent: 'Insight Agent',
    age: '-',
    calc,
  };
}

function insightToRegisterException(i: Insight): RegisterException {
  const valueInr = i.value_at_stake_cr ? i.value_at_stake_cr * 10_000_000 : 0;
  const status = i.status?.toLowerCase();
  let severity: Severity = 'S2';
  if (status === 'red' || status === 'critical') severity = 'S1';
  else if (status === 'amber' || status === 'warning') severity = 'S2';

  return {
    id: i.id,
    code: `EXC-${i.id.slice(0, 6).toUpperCase()}`,
    title: i.title || i.headline || 'Untitled exception',
    severity,
    domain: i.domain || i.sub_domain || 'General',
    category: i.category || 'General',
    aiSummary: i.description || i.detail || i.headline || 'No summary available.',
    impactDescription: i.description || i.detail || '',
    remediation: i.recommended_action || 'No action recommended.',
    scope: [...(i.relevant_formats ?? []), ...(i.relevant_segments ?? [])],
    valueInr,
    sla: i.deadline_days != null && i.deadline_days > 0 ? `${i.deadline_days}d` : null,
    agent: 'Insight Agent',
    age: '-',
    relatedEntityLabels: [...(i.relevant_formats ?? []), ...(i.relevant_segments ?? [])],
    metricName: i.metric_name ?? undefined,
    metricValue: i.metric_value ?? undefined,
    thresholdValue: i.threshold_value ?? undefined,
    breachPct: i.breach_pct ?? undefined,
  };
}

function insightExceptionToRegisterRow(i: Insight): RegisterRow {
  const status = i.status?.toLowerCase();
  let severity: Severity = 'S2';
  if (status === 'red' || status === 'critical') severity = 'S1';
  else if (status === 'amber' || status === 'warning') severity = 'S2';
  else if (status === 'green' || status === 'grey') severity = 'S3';

  const valueInr = i.value_at_stake_cr ? i.value_at_stake_cr * 10_000_000 : null;
  const sla = i.deadline_days != null && i.deadline_days > 0 ? `${i.deadline_days}d` : null;
  const slaBreached = i.deadline_days != null && i.deadline_days <= 0;

  return {
    id: i.id,
    kind: 'exception',
    code: `EXC-${i.id.slice(0, 6).toUpperCase()}`,
    title: i.title || i.headline || 'Untitled exception',
    severity,
    tone: null,
    domain: i.domain || i.sub_domain || 'General',
    category: i.category || 'General',
    valueInr,
    sla,
    slaBreached,
    agent: 'Insight Agent',
    age: '-',
    endState: 'open',
    owner: i.decision_owner || null,
  };
}

export interface UseRegisterRowsResult {
  rows: RegisterRow[];
  loading: boolean;
  error: string | null;
  getException: (id: string) => RegisterException | undefined;
  getInsight: (id: string) => RegisterInsight | undefined;
}

export function useRegisterRows(): UseRegisterRowsResult {
  const personaId = usePersonaStore((s) => s.personaId);
  const { data: insightsData, isLoading: loadingInsights, error: insightsError } = useQuery({
    queryKey: ['insights', personaId, 'with-store'],
    queryFn: () => fetchPersonaInsights(personaId as InsightPersonaId, { includeStore: true }),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const exceptionList = useMemo<Insight[]>(() => insightsData?.exceptions ?? [], [insightsData]);
  const insightList = useMemo<Insight[]>(() => insightsData?.insights ?? [], [insightsData]);

  const rows = useMemo(() => {
    const exceptionRows = exceptionList.map(insightExceptionToRegisterRow);
    const insightRows = insightList.map(insightToRegisterRow);
    return [...exceptionRows, ...insightRows];
  }, [exceptionList, insightList]);

  const exceptionMap = useMemo(() => {
    const map = new Map<string, RegisterException>();
    exceptionList.forEach(i => {
      map.set(i.id, insightToRegisterException(i));
    });
    return map;
  }, [exceptionList]);

  const insightMap = useMemo(() => {
    const map = new Map<string, RegisterInsight>();
    insightList.forEach(i => {
      map.set(i.id, insightToRegisterInsight(i));
    });
    return map;
  }, [insightList]);

  const loading = loadingInsights;
  const error = insightsError instanceof Error ? insightsError.message : null;

  return {
    rows,
    loading,
    error,
    getException: (id) => exceptionMap.get(id),
    getInsight: (id) => insightMap.get(id),
  };
}
