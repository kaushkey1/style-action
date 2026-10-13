import { useQuery } from '@tanstack/react-query';
import { appApiFetch } from '@/lib/api';
import type { Task, TaskPriority, TaskStatus } from '@/modules/tasks/types/task.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CategoryInsight {
  id: string;
  sub_domain: string | null;
  title: string | null;
  headline: string;
  description: string | null;
  detail: string;
  value: string | null;
  display_value: string | null;
  status: 'red' | 'amber' | 'green' | 'grey' | null;
  tag: 'needs-decision' | 'monitoring' | 'auto-handled' | null;
  delta: string | null;
  value_at_stake_cr: number | null;
  decision_owner: string | null;
  deadline_days: number | null;
  calc: { what: string; plain: string; example: string } | null;
  category: string | null;
  metric_name: string | null;
  metric_value: number | null;
  threshold_value: number | null;
  breach_pct: number | null;
  domain: string | null;
  recommended_action: string | null;
  scope: string | null;
  created_at: string;
}

type WirePriority = 'low' | 'medium' | 'high' | 'critical';

const PRIORITY_FROM_WIRE: Record<WirePriority, TaskPriority> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

interface ApiTaskItem {
  id: string;
  title: string;
  description: string | null;
  priority: WirePriority;
  status: TaskStatus;
  assigned_to: string | null;
  created_by: string;
  exception_id: string | null;
  source: string;
  scope: string | null;
  due_date: string | null;
  unread_by_assignee: boolean;
  subscribers: string[];
  created_at: string;
  updated_at: string;
}

export interface CategoryInsightsData {
  insight_run_id: string;
  category_code: string;
  summary: string;
  s1_exceptions: number;
  s2_exceptions: number;
  insights: CategoryInsight[];
  exceptions: CategoryInsight[];
  top_tasks: Task[];
  total_tasks: number;
}

interface ApiCategoryInsightsResponse {
  data: {
    insight_run_id: string;
    category_code: string;
    summary: string;
    s1_exceptions: number;
    s2_exceptions: number;
    insights: CategoryInsight[];
    exceptions: CategoryInsight[];
    top_tasks: ApiTaskItem[];
    total_tasks: number;
  };
}

// ─── Adapters ─────────────────────────────────────────────────────────────────

function fromApiTaskItem(api: ApiTaskItem): Task {
  return {
    id: api.id,
    title: api.title,
    description: api.description ?? '',
    status: api.status,
    priority: PRIORITY_FROM_WIRE[api.priority] ?? 'Low',
    assigned_to: api.assigned_to ?? '',
    assignor: api.created_by,
    exception_id: api.exception_id,
    source: api.source ?? 'manual',
    scope: api.scope ?? null,
    due_date: api.due_date,
    created_at: api.created_at,
    updated_at: api.updated_at,
    unread_by_assignee: api.unread_by_assignee,
    subscribers: api.subscribers,
  };
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const categoryInsightKeys = {
  all: ['category-insights'] as const,
  detail: (categoryCode: string) => [...categoryInsightKeys.all, categoryCode] as const,
};

// ─── Fetch function ───────────────────────────────────────────────────────────

async function fetchCategoryInsights(categoryCode: string): Promise<CategoryInsightsData> {
  const encodedCode = encodeURIComponent(categoryCode);
  const d = await appApiFetch<ApiCategoryInsightsResponse['data']>(
    `/insights/categories/${encodedCode}/insights`,
  );
  return {
    insight_run_id: d.insight_run_id,
    category_code: d.category_code,
    summary: d.summary,
    s1_exceptions: d.s1_exceptions,
    s2_exceptions: d.s2_exceptions,
    insights: d.insights,
    exceptions: d.exceptions,
    top_tasks: d.top_tasks.map(fromApiTaskItem),
    total_tasks: d.total_tasks,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCategoryInsights(categoryCode: string | undefined): ReturnType<
  typeof useQuery<CategoryInsightsData>
> {
  return useQuery<CategoryInsightsData>({
    queryKey: categoryInsightKeys.detail(categoryCode ?? ''),
    queryFn: () => fetchCategoryInsights(categoryCode!),
    enabled: !!categoryCode,
    staleTime: 5 * 60 * 1000,
  });
}
