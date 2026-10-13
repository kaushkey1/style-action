import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePersonaStore } from '@/hooks/usePersonaStore';
import { fetchPersonaInsights, type InsightPersonaId, type Insight } from '@/modules/store-view/api/insightsApi';
import type { UnifiedItem } from '../data/mockReviewData';
import type { PersonaId } from '@/data/personaConfig';
import type { ReviewKpi } from '../data/mockReviewData';
import { PERSONA_KPIS } from '../data/mockReviewData';

export type { ApprovePayload, RejectPayload, SnoozePayload, BatchActionPayload } from './reviewApi';

// ─── Query key factory ─────────────────────────────────────────────────────

const reviewKeys = {
  all: ['review'] as const,
  items: (personaId: string) => [...reviewKeys.all, 'items', personaId] as const,
  kpis: (personaId: PersonaId) => [...reviewKeys.all, 'kpis', personaId] as const,
};

// ─── Return types ──────────────────────────────────────────────────────────

interface UseReviewItemsResult {
  data: UnifiedItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseReviewKpisResult {
  data: ReviewKpi[];
  loading: boolean;
}

interface UseReviewItemResult {
  data: UnifiedItem | undefined;
  loading: boolean;
}

// ─── Insight → UnifiedItem conversion ─────────────────────────────────────

function insightToUnifiedItem(i: Insight, lifecycleState: 'exception' | 'insight'): UnifiedItem {
  const status = i.status?.toLowerCase();
  let severity: UnifiedItem['severity'] = 'S2';
  if (status === 'red' || status === 'critical') severity = 'S1';
  else if (status === 'amber' || status === 'warning') severity = 'S2';
  else if (status === 'green' || status === 'grey') severity = 'S3';

  const ragStatus = (
    status === 'red' || status === 'critical' ? 'RED' :
    status === 'amber' || status === 'warning' ? 'AMBER' :
    'GREEN'
  ) as 'RED' | 'AMBER' | 'GREEN';

  const projectedImpactInr = i.value_at_stake_cr ? i.value_at_stake_cr * 10_000_000 : 0;
  const prefix = lifecycleState === 'exception' ? 'EXC' : 'INS';

  return {
    id: i.id,
    displayId: `${prefix}-${i.id.slice(0, 6).toUpperCase()}`,
    title: i.title || i.headline || 'Untitled',
    summary: i.description || i.detail || i.headline || '',
    lifecycleState,
    severity,
    domain: (i.domain ?? 'PLATFORM') as UnifiedItem['domain'],
    status: 'agent-reviewing',

    impactDescription: i.description || i.detail || '',
    projectedImpactInr,

    agentId: 'insight-agent',
    agentName: 'Insight Agent',
    confidenceBucket: ragStatus === 'RED' ? 'verified' : ragStatus === 'AMBER' ? 'likely' : 'review',
    ruleOrSignal: 'Persona Insights',

    metricName: i.metric_name ?? undefined,
    metricValue: i.metric_value ?? undefined,
    thresholdValue: i.threshold_value ?? undefined,
    breachPct: i.breach_pct ?? undefined,
    ragStatus,
    category: i.category ?? undefined,
    remediation: i.recommended_action ?? undefined,

    ownerId: '',
    ownerName: i.decision_owner ?? 'Unassigned',
    assignedPersona: 'ceo' as PersonaId,

    relatedEntityLabels: [
      ...(i.relevant_formats ?? []),
      ...(i.relevant_segments ?? []),
    ],

    timestamp: '',
    relativeTime: i.deadline_days != null && i.deadline_days > 0
      ? `${i.deadline_days}d to act`
      : i.deadline_days === 0 ? 'Overdue' : '-',
    isSnoozed: false,
    isResolved: false,

    conversationThread: [],
    auditLog: [],
    lineage: [],
  };
}

// ─── Hooks ─────────────────────────────────────────────────────────────────

export function useReviewItems(): UseReviewItemsResult {
  const personaId = usePersonaStore((s) => s.personaId);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: reviewKeys.items(personaId),
    queryFn: () => fetchPersonaInsights(personaId as InsightPersonaId, { includeStore: true }),
    staleTime: 5 * 60 * 1000,
  });

  const items = useMemo<UnifiedItem[]>(() => {
    const exceptions = (data?.exceptions ?? []).map((i) => insightToUnifiedItem(i, 'exception'));
    const insights = (data?.insights ?? []).map((i) => insightToUnifiedItem(i, 'insight'));
    return [...exceptions, ...insights];
  }, [data]);

  return {
    data: items,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    refetch,
  };
}

export function useReviewItem(id: string | null): UseReviewItemResult {
  const { data: allItems, loading } = useReviewItems();
  const item = useMemo(
    () =>
      id ? allItems.find((i) => i.id === id || i.displayId === id) : undefined,
    [id, allItems],
  );
  return { data: item, loading };
}

export function useReviewKpis(personaId: PersonaId): UseReviewKpisResult {
  const { data, isLoading } = useQuery({
    queryKey: reviewKeys.kpis(personaId),
    queryFn: () => Promise.resolve(PERSONA_KPIS[personaId] ?? []),
    staleTime: 30 * 60 * 1000,
  });
  return { data: data ?? [], loading: isLoading };
}
