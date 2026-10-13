import { sourcingInsights } from '../data/mockSourcingData';
import { InsightsBanner } from '@/modules/store-view/components/InsightsBanner';
import type { Insight, InsightData } from '@/modules/store-view/api/insightsApi';
import type { PersonaInsight } from '@/modules/dashboard/data/mockPersonaDashboards';

/** Map a sourcing mock PersonaInsight onto the shared Insight shape. */
function toInsight(p: PersonaInsight): Insight {
  return {
    id: p.id,
    sub_domain: null,
    title: null,
    headline: p.headline,
    description: null,
    detail: p.detail,
    value: null,
    display_value: p.metric ?? null,
    status: p.status,
    metric: p.metric ?? null,
    action: p.action ?? null,
    tag: null,
    delta: null,
    value_at_stake_cr: null,
    decision_owner: null,
    deadline_days: null,
    calc: null,
    category: null,
    relevant_formats: [],
    relevant_segments: [],
    metric_name: null,
    metric_value: null,
    threshold_value: null,
    breach_pct: null,
    domain: 'Vendor',
    recommended_action: p.action ?? null,
  };
}

/**
 * Sourcing briefing — adapts the sourcing mock data onto the shared InsightsBanner
 * so it matches every other persona's briefing. The persona-insights API doesn't
 * serve sourcing, so data stays mock; cards are non-clickable (no onOpenInsight)
 * and there's no "View all" (sourcing has no /review insights surface).
 */
export function SourcingMorningBriefing(): React.ReactNode {
  const data: InsightData = {
    insight_run_id: 'sourcing-mock',
    persona_id: 'sourcing',
    pending_approvals: null,
    s1_exceptions: null,
    s2_exceptions: null,
    morning_question: sourcingInsights.morningQuestion,
    summary: sourcingInsights.summary,
    insights: sourcingInsights.insights.map(toInsight),
    exceptions: [],
    agent_actions: [],
  };

  if (data.insights.length === 0) return null;
  return <InsightsBanner data={data} />;
}
