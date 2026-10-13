import { appApiFetch } from '@/lib/api';
import { PERSONA_KPIS } from '../data/mockReviewData';
import type { UnifiedItem, ReviewKpi, LifecycleState } from '../data/mockReviewData';
import type { ExceptionSeverity, ExceptionDomain, ExceptionStatus } from '@/modules/exceptions/data/mockExceptions';
import type { PersonaId } from '@/data/personaConfig';

// ─── API response types ────────────────────────────────────────────────────

interface ApiException {
  exception_id: string;
  exception_code: string;
  title: string;
  severity: string;
  domain: string;
  category: string;
  detection_type: string;
  metric_name: string;
  metric_value: number;
  threshold_value: number;
  breach_pct: number;
  rag_status: string;
  kpi_id: string;
  impact_narrative: string;
  remediation: string;
  dimension_segment: string | null;
  dimension_store: string | null;
  dimension_vendor: string | null;
  dimension_format: string | null;
  detected_at: string;
  data_date: string;
  status: string;
  source_query: string;
  priority_score: number;
  source_query_result: Record<string, unknown>[] | null;
}

interface ApiExceptionResponse {
  total: number;
  exceptions: ApiException[];
}

// ─── Filter params ─────────────────────────────────────────────────────────

export interface ReviewFilterParams {
  severity?: string;
  domain?: string[];
  category?: string;
  ragStatus?: string;
  status?: string;
  dataDate?: string;
}

// ─── Transformer ───────────────────────────────────────────────────────────

const COMMAND_CENTER_ROLE = 'ceo';

const SEVERITY_MAP: Record<string, ExceptionSeverity> = { S1: 'S1', S2: 'S2', S3: 'S3' };
const DOMAIN_MAP: Record<string, ExceptionDomain> = { BUY: 'BUY', MOVE: 'MOVE', SELL: 'SELL', PLAN: 'PLAN', MAKE: 'MAKE', MARKET: 'MARKET', PLATFORM: 'PLATFORM', LIQUIDATION: 'LIQUIDATION' };
const STATUS_MAP: Record<string, ExceptionStatus> = { new: 'agent-reviewing', acknowledged: 'investigating', resolved: 'resolved' };
const RAG_TO_CONFIDENCE: Record<string, 'verified' | 'likely' | 'review'> = { RED: 'verified', AMBER: 'likely', GREEN: 'review' };

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function parseImpactInr(narrative: string): number {
  const crMatch = narrative.match(/(?:Rs\.|₹)([\d,]+(?:\.\d+)?)\s*Cr/);
  if (crMatch?.[1]) {
    return parseFloat(crMatch[1].replace(/,/g, '')) * 10_000_000;
  }
  const lMatch = narrative.match(/(?:Rs\.|₹)([\d,]+(?:\.\d+)?)\s*L\b/);
  if (lMatch?.[1]) {
    return parseFloat(lMatch[1].replace(/,/g, '')) * 100_000;
  }
  return 0;
}

function buildDimensionLabels(raw: ApiException): string[] {
  const labels: string[] = [];
  if (raw.dimension_segment) labels.push(`Segment: ${raw.dimension_segment}`);
  if (raw.dimension_store) labels.push(`Store: ${raw.dimension_store}`);
  if (raw.dimension_vendor) labels.push(`Vendor: ${raw.dimension_vendor}`);
  if (raw.dimension_format) labels.push(`Format: ${raw.dimension_format}`);
  return labels;
}

function transformApiException(raw: ApiException): UnifiedItem {
  return {
    id: raw.exception_id,
    displayId: raw.exception_code,
    title: raw.title,
    summary: raw.impact_narrative,
    lifecycleState: 'exception' as LifecycleState,
    severity: SEVERITY_MAP[raw.severity] ?? 'S3',
    domain: (DOMAIN_MAP[raw.domain] ?? 'PLATFORM') as ExceptionDomain,
    status: STATUS_MAP[raw.status] ?? 'agent-reviewing',

    impactDescription: raw.impact_narrative,
    projectedImpactInr: parseImpactInr(raw.impact_narrative),

    agentId: raw.detection_type,
    agentName: raw.detection_type,
    confidenceBucket: RAG_TO_CONFIDENCE[raw.rag_status] ?? 'likely',
    ruleOrSignal: raw.detection_type,

    metricName: raw.metric_name,
    metricValue: raw.metric_value,
    thresholdValue: raw.threshold_value,
    breachPct: raw.breach_pct,
    ragStatus: raw.rag_status as 'RED' | 'AMBER' | 'GREEN',
    category: raw.category,
    priorityScore: raw.priority_score,
    sourceQueryResult: raw.source_query_result,
    remediation: raw.remediation,
    dimensionSegment: raw.dimension_segment,
    dimensionStore: raw.dimension_store,
    dimensionVendor: raw.dimension_vendor,
    dimensionFormat: raw.dimension_format,
    dataDate: raw.data_date,
    isFromApi: true,

    lineage: [
      { state: 'exception', date: raw.detected_at, actor: raw.detection_type },
    ],

    ownerId: '',
    ownerName: 'Unassigned',
    assignedPersona: 'ceo' as PersonaId,

    relatedEntityLabels: buildDimensionLabels(raw),

    timestamp: raw.detected_at,
    relativeTime: getRelativeTime(raw.detected_at),
    isSnoozed: false,
    isResolved: raw.status === 'resolved',

    conversationThread: [],
    auditLog: [],
  };
}

// ─── Read ──────────────────────────────────────────────────────────────────

export async function fetchReviewItems(filters?: ReviewFilterParams): Promise<UnifiedItem[]> {
  const params: Record<string, string | undefined> = {};
  if (filters?.severity) params.severity = filters.severity;
  if (filters?.domain?.length) params.domain = filters.domain.join(',');
  if (filters?.category) params.category = filters.category;
  if (filters?.ragStatus) params.rag_status = filters.ragStatus;
  if (filters?.status) params.status = filters.status;
  if (filters?.dataDate) params.data_date = filters.dataDate;

  const data = await appApiFetch<ApiExceptionResponse>(
    `/command-center-dashboard/${COMMAND_CENTER_ROLE}/exceptions`,
    params,
  );
  return (data.exceptions ?? []).map(transformApiException);
}

export async function fetchReviewItem(id: string): Promise<UnifiedItem | undefined> {
  const allItems = await fetchReviewItems();
  return allItems.find((item) => item.id === id);
}

export async function fetchReviewKpis(personaId: PersonaId): Promise<ReviewKpi[]> {
  return PERSONA_KPIS[personaId] ?? [];
}

// ─── Write (mutations) ─────────────────────────────────────────────────────

export interface ApprovePayload {
  itemId: string;
  modifications?: Record<string, unknown>;
  note?: string;
}

export interface RejectPayload {
  itemId: string;
  reasonCode: string;
  note?: string;
}

export interface SnoozePayload {
  itemId: string;
  snoozeUntil: string;
}

export interface BatchActionPayload {
  itemIds: string[];
  action: 'approve' | 'reject' | 'snooze';
  reasonCode?: string;
  snoozeUntil?: string;
}

export async function approveReviewItem(payload: ApprovePayload): Promise<{ success: boolean }> {
  void payload;
  return { success: true };
}

export async function rejectReviewItem(payload: RejectPayload): Promise<{ success: boolean }> {
  void payload;
  return { success: true };
}

export async function snoozeReviewItem(payload: SnoozePayload): Promise<{ success: boolean }> {
  void payload;
  return { success: true };
}

export async function batchReviewAction(payload: BatchActionPayload): Promise<{ success: boolean }> {
  void payload;
  return { success: true };
}
