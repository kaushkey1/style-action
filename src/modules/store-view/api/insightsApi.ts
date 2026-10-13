import { appApiFetch } from '@/lib/api';

// --- Types ---

export type InsightPersonaId =
  | 'ceo'
  | 'cat'
  | 'regional'
  | 'sourcing'
  | 'ops'
  | 'category'
  | 'category-director'
  | 'marketing'
  | 'admin'
  | 'otb-rbl'
  | 'otb-fnl';

export type InsightStatus = 'critical' | 'warning' | 'on-track' | 'red' | 'amber' | 'green' | 'grey';
export type InsightTag = 'needs-decision' | 'decision' | 'monitoring' | 'auto-handled';

export interface InsightCalc {
  what: string;
  plain: string;
  example: string;
}

export interface Insight {
  id: string;
  sub_domain: string | null;
  title: string | null;
  headline: string;
  description: string | null;
  detail: string;
  value: string | null;
  display_value: string | null;
  status: InsightStatus | null;
  metric: string | null;
  action: string | null;
  tag: InsightTag | null;
  delta: string | null;
  value_at_stake_cr: number | null;
  decision_owner: string | null;
  deadline_days: number | null;
  calc: InsightCalc | null;
  category: string | null;
  relevant_formats: string[];
  relevant_segments: string[];
  metric_name: string | null;
  metric_value: number | null;
  threshold_value: number | null;
  breach_pct: number | null;
  domain: string | null;
  recommended_action: string | null;
}

export interface AgentAction {
  agent_name: string;
  action: string;
  outcome: string;
}

export interface InsightData {
  insight_run_id: string;
  persona_id: InsightPersonaId;
  pending_approvals: number | null;
  s1_exceptions: number | null;
  s2_exceptions: number | null;
  morning_question: string;
  summary: string;
  insights: Insight[];
  exceptions: Insight[];
  agent_actions: AgentAction[];
}

// --- API ---

export async function fetchPersonaInsights(
  personaId: InsightPersonaId,
  options?: { includeStore?: boolean },
): Promise<InsightData> {
  const params: Record<string, string> = { persona_name: personaId };
  if (options?.includeStore) params.include_store = 'true';
  // Insights are non-critical chrome: a 403 for a role without access must NOT
  // redirect the whole app to /unauthorized — let the caller show an empty state
  // / hide the surface instead.
  return appApiFetch<InsightData>('/insights/persona', params, { skipForbiddenRedirect: true });
}

export async function fetchScopeInsights(
  scope: string,
): Promise<InsightData> {
  return appApiFetch<InsightData>('/insights/persona', { scope }, { skipForbiddenRedirect: true });
}
