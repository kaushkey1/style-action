import type { ExceptionSeverity, ExceptionDomain, ExceptionStatus } from '@/modules/exceptions/data/mockExceptions';
import type { AuditEntry } from '@/modules/exceptions/data/mockHumanGates';
import type { PersonaId } from '@/data/personaConfig';

// ─── Core types ────────────────────────────────────────────────────────────

export type LifecycleState = 'insight' | 'exception' | 'approval';
export type ConfidenceBucket = 'verified' | 'likely' | 'review';

export interface LineageEntry {
  state: LifecycleState;
  date: string;
  actor: string;
}

export interface ActionStep {
  description: string;
  impactInr: number;
  isReversible: boolean;
  targetSystem?: string;
}

export interface ModifiableField {
  key: string;
  label: string;
  currentValue: string | number;
  inputType: 'text' | 'number' | 'select' | 'multi-select';
  options?: string[];
}

export interface AlternateScenario {
  label: string;
  impactInr: number;
  riskLevel: 'low' | 'medium' | 'high';
  summary: string;
}

export interface ConversationMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorType: 'human' | 'agent' | 'system';
  authorAvatar?: string;
  timestamp: string;
  content: string;
  mentionedUserIds?: string[];
}

export interface UnifiedItem {
  id: string;
  displayId: string;
  title: string;
  summary: string;
  lifecycleState: LifecycleState;
  severity: ExceptionSeverity;
  domain: ExceptionDomain;
  status: ExceptionStatus;

  impactDescription: string;
  projectedImpactInr: number;

  agentId: string;
  agentName: string;
  confidenceBucket: ConfidenceBucket;
  ruleOrSignal: string;
  alternateScenarios?: AlternateScenario[];

  metricName?: string;
  metricValue?: number;
  thresholdValue?: number;
  breachPct?: number;
  ragStatus?: 'RED' | 'AMBER' | 'GREEN';
  category?: string;
  priorityScore?: number;
  sourceQueryResult?: Record<string, unknown>[] | null;
  remediation?: string;
  dimensionSegment?: string | null;
  dimensionStore?: string | null;
  dimensionVendor?: string | null;
  dimensionFormat?: string | null;
  dataDate?: string;
  isFromApi?: boolean;

  lineage: LineageEntry[];

  approvalContext?: {
    proposedAction: string;
    steps: ActionStep[];
    isReversible: boolean;
    modifiableFields?: ModifiableField[];
  };

  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  assignedPersona: PersonaId;

  slaDeadline?: string;
  slaHours?: number;

  relatedEntityIds?: string[];
  relatedEntityLabels?: string[];

  timestamp: string;
  relativeTime: string;
  isSnoozed: boolean;
  snoozeUntil?: string;
  isResolved: boolean;
  resolvedAt?: string;

  linkedItemId?: string;

  conversationThread: ConversationMessage[];
  auditLog: AuditEntry[];
}

// ─── Split-inbox tab type ──────────────────────────────────────────────────

export type ReviewTab = 'allOpen' | 'aiHandled' | 'resolved';

// ─── Reason codes for reject ───────────────────────────────────────────────

export const REJECT_REASON_CODES: Record<string, string[]> = {
  PLAN: [
    'Insufficient data to support recommendation',
    'Impact estimate too optimistic',
    'Conflicts with planned promotion',
    'Timing not appropriate',
  ],
  BUY: [
    'Vendor relationship concern',
    'Better alternative available',
    'Budget constraint',
    'Needs counter-offer',
  ],
  SELL: [
    'Campaign conflict',
    'Creative not approved',
    'Target audience mismatch',
    'ROAS threshold not met',
  ],
  _common: [
    'Needs broader stakeholder input',
    'Other',
  ],
};

export function getRejectReasonCodes(domain: ExceptionDomain): string[] {
  const domainCodes = REJECT_REASON_CODES[domain] ?? [];
  const commonCodes = REJECT_REASON_CODES._common ?? [];
  return [...domainCodes, ...commonCodes];
}

// ─── Persona KPI configuration ────────────────────────────────────────────

export interface ReviewKpi {
  id: string;
  label: string;
  value: string;
  trend?: string;
  target?: string;
  status: 'on-track' | 'warning' | 'critical';
  filterKey?: string;
  filterValue?: string;
}

export const PERSONA_KPIS: Record<PersonaId, ReviewKpi[]> = {
  apex: [
    { id: 'aop-progress', label: 'AOP Progress', value: '94%', trend: '+2.1%', target: 'vs 100%', status: 'warning' },
    { id: 'gm-pct', label: 'GM%', value: '46.2%', trend: '-1.8%', target: 'vs 48%', status: 'warning' },
    { id: 'open-s1', label: 'Open S1', value: '3', status: 'critical', filterKey: 'severity', filterValue: 'S1' },
    { id: 'agent-autonomy', label: 'Agent Autonomy', value: '78%', trend: '+5%', status: 'on-track' },
  ],
  ceo: [
    { id: 'aop-progress', label: 'AOP Progress', value: '94%', trend: '+2.1%', target: 'vs 100%', status: 'warning' },
    { id: 'revenue-mom', label: 'Revenue MoM', value: '₹20.8 Cr', trend: '+3%', target: 'vs ₹19.5 Cr', status: 'on-track' },
    { id: 'gm-pct', label: 'GM%', value: '46.2%', trend: '-1.8%', target: 'vs 48%', status: 'warning' },
    { id: 'approvals-waiting', label: 'Approvals >4h', value: '2', target: 'total: 7', status: 'critical', filterKey: 'lifecycle', filterValue: 'approval' },
  ],
  category: [
    { id: 'cat-gm', label: 'Category GM%', value: '52.1%', trend: '+0.8%', status: 'on-track' },
    { id: 'sell-through', label: 'Sell-Through', value: '68%', trend: '+2.1%', status: 'on-track' },
    { id: 'aged-stock', label: 'Aged Stock', value: '5.2%', trend: '+0.4%', target: 'vs 5%', status: 'warning' },
    { id: 'open-exceptions', label: 'Open Exceptions', value: '12', status: 'warning', filterKey: 'lifecycle', filterValue: 'exception' },
  ],
  'category-director': [
    { id: 'cat-gm', label: 'Category GM%', value: '49.8%', trend: '+0.4%', status: 'on-track' },
    { id: 'sell-through', label: 'Full-Price ST%', value: '64%', trend: '+1.6%', status: 'on-track' },
    { id: 'aged-stock', label: 'Aged Stock', value: '6.1%', trend: '+0.7%', target: 'vs 5%', status: 'warning' },
    { id: 'open-exceptions', label: 'Open Exceptions', value: '9', status: 'warning', filterKey: 'lifecycle', filterValue: 'exception' },
  ],
  sourcing: [
    { id: 'po-fill', label: 'PO Fill Rate', value: '91%', trend: '-2%', status: 'warning' },
    { id: 'vendor-sla', label: 'Vendor SLA Breaches', value: '4', status: 'critical' },
    { id: 'vendor-exceptions', label: 'Open Vendor Exc.', value: '8', status: 'warning' },
    { id: 'committed', label: '₹ Committed', value: '₹142 Cr', status: 'on-track' },
  ],
  marketing: [
    { id: 'roas', label: 'Campaign ROAS', value: '3.2x', trend: '+0.4x', status: 'on-track' },
    { id: 'ctr', label: 'CTR', value: '2.8%', trend: '+0.3%', status: 'on-track' },
    { id: 'campaign-exc', label: 'Campaign Exc.', value: '3', status: 'warning' },
    { id: 'approvals', label: 'Approvals Waiting', value: '2', status: 'warning' },
  ],
  regional: [
    { id: 'sell-through', label: 'Region Sell-Through', value: '34.7%', status: 'warning' },
    { id: 'stockout', label: 'Stockout Count', value: '8', status: 'critical' },
    { id: 'at-risk', label: 'Stores at Risk', value: '4', status: 'warning' },
    { id: 'open-items', label: 'Open Items', value: '12', status: 'warning' },
  ],
  ops: [
    { id: 'dc-fill', label: 'DC Fill Rate', value: '87%', trend: '-3%', status: 'warning' },
    { id: 'transfer-status', label: 'Transfer Status', value: '42 pending', status: 'warning' },
    { id: 'ops-approvals', label: 'Pending Approvals', value: '18', status: 'warning' },
    { id: 'auto-approved', label: 'Auto-Approved Today', value: '34', status: 'on-track' },
  ],
  admin: [
    { id: 'agent-actions', label: 'Agent Actions (24h)', value: '156', status: 'on-track' },
    { id: 'false-positive', label: 'False-Positive Rate', value: '3.2%', trend: '-0.4%', target: 'vs <5%', status: 'on-track' },
    { id: 'auto-approval', label: 'Auto-Approval %', value: '78%', trend: '+5%', target: 'vs 70%', status: 'on-track' },
    { id: 'noise-score', label: 'Noise Score', value: '12', trend: '-3', target: 'vs <20', status: 'on-track' },
  ],
};

// ─── Persona default view configuration ────────────────────────────────────

export interface PersonaViewConfig {
  defaultTab: ReviewTab;
  defaultSeverity?: ExceptionSeverity[];
  defaultDomain?: ExceptionDomain[];
  defaultSort: 'impact-desc' | 'severity-desc' | 'sla-asc' | 'recency';
}

export const PERSONA_DEFAULTS: Record<PersonaId, PersonaViewConfig> = {
  apex: { defaultTab: 'allOpen', defaultSeverity: ['S1'], defaultSort: 'impact-desc' },
  ceo: { defaultTab: 'allOpen', defaultSeverity: ['S1', 'S2'], defaultSort: 'impact-desc' },
  category: { defaultTab: 'allOpen', defaultDomain: ['BUY', 'PLAN', 'SELL'], defaultSort: 'impact-desc' },
  'category-director': { defaultTab: 'allOpen', defaultDomain: ['BUY', 'PLAN', 'SELL'], defaultSort: 'impact-desc' },
  sourcing: { defaultTab: 'allOpen', defaultDomain: ['BUY'], defaultSort: 'sla-asc' },
  marketing: { defaultTab: 'allOpen', defaultDomain: ['SELL', 'MARKET'], defaultSort: 'severity-desc' },
  regional: { defaultTab: 'allOpen', defaultDomain: ['PLAN', 'SELL', 'PLATFORM'], defaultSort: 'severity-desc' },
  ops: { defaultTab: 'allOpen', defaultDomain: ['PLAN', 'PLATFORM'], defaultSort: 'impact-desc' },
  admin: { defaultTab: 'aiHandled', defaultSort: 'recency' },
};

// ─── Mock data ─────────────────────────────────────────────────────────────

export const mockReviewItems: UnifiedItem[] = [
  // ── S1 Approvals ──────────────────────────────────────────────────────
  {
    id: 'rev-001',
    displayId: 'REV-001',
    title: 'Aged inventory 6.7% — ₹82.9 Cr trapped >180d',
    summary: 'Pricing Agent proposes 22% markdown on 14 SKUs to recover ₹11.4 Cr. Three scenarios modeled — this is middle-risk, 85% confidence. Historical sell-through data from similar clearance events in FY25-26 supports the recommended approach.',
    lifecycleState: 'approval',
    linkedItemId: 'rev-002',
    severity: 'S1',
    domain: 'PLAN',
    status: 'awaiting-approval',
    impactDescription: '₹82.9 Cr trapped in aged inventory >180 days',
    projectedImpactInr: 829000000,
    agentId: 'pricing-agent-v2',
    agentName: 'Pricing Agent',
    confidenceBucket: 'likely',
    ruleOrSignal: 'aged_inventory_threshold',
    alternateScenarios: [
      { label: 'Conservative (15%)', impactInr: 72000000, riskLevel: 'low', summary: '15% markdown on same SKUs. Lower recovery but minimal brand dilution.' },
      { label: 'Recommended (22%)', impactInr: 114000000, riskLevel: 'medium', summary: '22% markdown optimized for recovery-to-risk ratio.' },
      { label: 'Aggressive (30%)', impactInr: 141000000, riskLevel: 'high', summary: '30% markdown for maximum clearance. Higher brand dilution risk.' },
    ],
    lineage: [
      { state: 'insight', date: '2026-04-18T07:00:00Z', actor: 'Pricing Agent' },
      { state: 'exception', date: '2026-04-20T06:00:00Z', actor: 'Pricing Agent' },
      { state: 'approval', date: '2026-04-22T10:00:00Z', actor: 'Pricing Agent' },
    ],
    approvalContext: {
      proposedAction: 'Markdown 22% on 14 SKUs across 3 categories',
      steps: [
        { description: 'Apply 22% markdown on 14 SKUs', impactInr: 114000000, isReversible: false, targetSystem: 'SAP' },
        { description: 'Update pricing in Fynd OMS', impactInr: 0, isReversible: true, targetSystem: 'Fynd OMS' },
      ],
      isReversible: false,
      modifiableFields: [
        { key: 'markdownPct', label: 'Markdown %', currentValue: 22, inputType: 'number' },
        { key: 'skuList', label: 'Remove SKUs', currentValue: '', inputType: 'multi-select', options: ['SKU-4521', 'SKU-4522', 'SKU-4523', 'SKU-4524', 'SKU-4525'] },
        { key: 'note', label: 'Note', currentValue: '', inputType: 'text' },
      ],
    },
    ownerId: 'priya-shah',
    ownerName: 'Priya Shah',
    assignedPersona: 'ceo',
    slaDeadline: '2026-04-22T18:00:00Z',
    slaHours: 8,
    relatedEntityIds: ['sku-cluster-001'],
    relatedEntityLabels: ['17 SKUs', '2 DCs', '3 POs'],
    timestamp: '2026-04-22T10:15:00Z',
    relativeTime: '2h ago',
    isSnoozed: false,
    isResolved: false,
    conversationThread: [
      { id: 'msg-001', authorId: 'pricing-agent-v2', authorName: 'Pricing Agent', authorType: 'agent', timestamp: '2026-04-22T10:15:00Z', content: 'Action drafted: markdown 22% on 14 SKUs. Three scenarios modeled — middle-risk selected based on historical sell-through data.' },
      { id: 'msg-002', authorId: 'rahul-kumar', authorName: 'Rahul Kumar', authorType: 'human', timestamp: '2026-04-22T10:42:00Z', content: 'Assigned to @Priya Shah — approve by EOD, update me.', mentionedUserIds: ['priya-shah'] },
    ],
    auditLog: [
      { timestamp: '2026-04-18T07:00:00Z', actor: 'Pricing Agent', action: 'Insight created' },
      { timestamp: '2026-04-20T06:00:00Z', actor: 'Pricing Agent', action: 'Escalated to exception — threshold breached at 6.7%' },
      { timestamp: '2026-04-22T10:00:00Z', actor: 'Pricing Agent', action: 'Action drafted — markdown proposal' },
    ],
  },

  {
    id: 'rev-002',
    displayId: 'REV-002',
    linkedItemId: 'rev-001',
    title: 'Vendor SLA breach — 4 POs worth ₹18 Cr',
    summary: 'Vendor Acme has missed delivery SLA on 4 purchase orders totaling ₹18 Cr. Historical SLA compliance has declined from 94% to 78% over 3 months. Backup vendor Beta has confirmed capacity for 3 of 4 affected POs.',
    lifecycleState: 'exception',
    severity: 'S1',
    domain: 'BUY',
    status: 'investigating',
    impactDescription: '₹18 Cr across 4 purchase orders at risk',
    projectedImpactInr: 180000000,
    agentId: 'vendor-agent-v3',
    agentName: 'Vendor Agent',
    confidenceBucket: 'verified',
    ruleOrSignal: 'vendor_sla_breach_consecutive',
    lineage: [
      { state: 'exception', date: '2026-04-20T06:00:00Z', actor: 'Vendor Agent' },
    ],
    ownerId: 'sourcing-director',
    ownerName: 'Sourcing Director',
    assignedPersona: 'sourcing',
    slaDeadline: '2026-04-20T14:00:00Z',
    slaHours: 8,
    relatedEntityIds: ['po-4472', 'po-4481', 'po-4499', 'po-4512'],
    relatedEntityLabels: ['4 POs', 'Vendor Acme', '3 DCs'],
    timestamp: '2026-04-20T06:00:00Z',
    relativeTime: '4h ago',
    isSnoozed: false,
    isResolved: false,
    conversationThread: [
      { id: 'msg-003', authorId: 'vendor-agent-v3', authorName: 'Vendor Agent', authorType: 'agent', timestamp: '2026-04-20T06:00:00Z', content: 'SLA breach detected on POs 4472, 4481, 4499, 4512. Vendor Acme OTIF declined from 94% to 78% over 3 months.' },
    ],
    auditLog: [
      { timestamp: '2026-04-20T06:00:00Z', actor: 'Vendor Agent', action: 'Exception created — consecutive SLA breach' },
    ],
  },

  // ── S2 Items ──────────────────────────────────────────────────────────

  {
    id: 'rev-003',
    displayId: 'REV-003',
    title: 'GM% declined 1.8 pts MoM — revenue +1.3%',
    summary: 'Gross margin dropped from 48.0% to 46.2% month-over-month. However, gross revenue increased 1.3%, suggesting the margin compression is driven by promotional activity rather than structural cost issues. No threshold breached.',
    lifecycleState: 'insight',
    severity: 'S2',
    domain: 'SELL',
    status: 'agent-reviewing',
    impactDescription: 'No direct ₹ impact — margin observation',
    projectedImpactInr: 0,
    agentId: 'margin-agent-v1',
    agentName: 'Margin Agent',
    confidenceBucket: 'verified',
    ruleOrSignal: 'margin_trend_deviation',
    lineage: [
      { state: 'insight', date: '2026-04-18T07:00:00Z', actor: 'Margin Agent' },
    ],
    ownerId: '',
    ownerName: 'Unassigned',
    assignedPersona: 'ceo',
    relatedEntityLabels: ['5 Categories', '12 Promos'],
    timestamp: '2026-04-18T07:00:00Z',
    relativeTime: '1d ago',
    isSnoozed: false,
    isResolved: false,
    conversationThread: [
      { id: 'msg-004', authorId: 'margin-agent-v1', authorName: 'Margin Agent', authorType: 'agent', timestamp: '2026-04-18T07:00:00Z', content: 'Trend deviation detected: GM% -1.8pts vs 3mo avg. Revenue up 1.3% — promotional activity likely cause.' },
    ],
    auditLog: [
      { timestamp: '2026-04-18T07:00:00Z', actor: 'Margin Agent', action: 'Insight created — margin trend deviation' },
    ],
  },

  {
    id: 'rev-004',
    displayId: 'REV-004',
    linkedItemId: 'rev-012',
    title: 'Fabric delay cascade — approve alt vendor',
    summary: 'Fabric delay from primary vendor V-2847 impacts 50 stores with ₹2.1 Cr revenue at risk. Supply Agent identified backup vendor V-234 with 5-day lead time. Partial allocation to top 20 stores recommended as interim measure.',
    lifecycleState: 'approval',
    severity: 'S2',
    domain: 'MAKE',
    status: 'awaiting-approval',
    impactDescription: '₹2.1 Cr across 50 stores at risk from fabric delay',
    projectedImpactInr: 21000000,
    agentId: 'supply-agent-v2',
    agentName: 'Supply Agent',
    confidenceBucket: 'likely',
    ruleOrSignal: 'cascade_risk_fabric_delay',
    alternateScenarios: [
      { label: 'Wait for primary vendor', impactInr: 0, riskLevel: 'high', summary: 'Wait 14 more days. Risk: full ₹2.1 Cr loss if vendor fails again.' },
      { label: 'Partial switch (recommended)', impactInr: 18000000, riskLevel: 'medium', summary: 'Switch 60% to backup vendor. 5-day lead time, 8% cost premium.' },
      { label: 'Full switch', impactInr: 21000000, riskLevel: 'low', summary: 'Switch 100% to backup. Highest cost but eliminates risk.' },
    ],
    lineage: [
      { state: 'exception', date: '2026-04-19T08:00:00Z', actor: 'Supply Agent' },
      { state: 'approval', date: '2026-04-21T10:00:00Z', actor: 'Supply Agent' },
    ],
    approvalContext: {
      proposedAction: 'Switch 60% allocation to backup vendor V-234',
      steps: [
        { description: 'Reroute to backup vendor V-234', impactInr: 18000000, isReversible: true },
        { description: 'Partial allocation to top 20 stores', impactInr: 0, isReversible: true },
      ],
      isReversible: true,
      modifiableFields: [
        { key: 'allocationPct', label: 'Allocation %', currentValue: 60, inputType: 'number' },
        { key: 'storeCount', label: 'Stores', currentValue: 20, inputType: 'number' },
      ],
    },
    ownerId: 'ops-head',
    ownerName: 'Operations Head',
    assignedPersona: 'ops',
    slaDeadline: '2026-04-21T18:00:00Z',
    slaHours: 8,
    relatedEntityLabels: ['50 Stores', '1 Vendor', '3 POs'],
    timestamp: '2026-04-21T10:00:00Z',
    relativeTime: '6h ago',
    isSnoozed: false,
    isResolved: false,
    conversationThread: [],
    auditLog: [
      { timestamp: '2026-04-19T08:00:00Z', actor: 'Supply Agent', action: 'Exception created — fabric delay detected' },
      { timestamp: '2026-04-21T10:00:00Z', actor: 'Supply Agent', action: 'Action drafted — vendor switch proposal' },
    ],
  },

  {
    id: 'rev-005',
    displayId: 'REV-005',
    title: 'Campaign budget reallocation — ₹2.1 Cr digital shift',
    summary: 'Marketing Agent proposes shifting ₹2.1 Cr from underperforming print campaign to digital channels. ROAS data shows digital at 4.2x vs print at 1.1x. Campaign is mid-flight with 3 weeks remaining.',
    lifecycleState: 'approval',
    severity: 'S2',
    domain: 'MARKET',
    status: 'awaiting-approval',
    impactDescription: '₹2.1 Cr budget reallocation from print to digital',
    projectedImpactInr: 21000000,
    agentId: 'marketing-agent-v1',
    agentName: 'Marketing Agent',
    confidenceBucket: 'verified',
    ruleOrSignal: 'campaign_performance_deviation',
    lineage: [
      { state: 'insight', date: '2026-04-15T09:00:00Z', actor: 'Marketing Agent' },
      { state: 'approval', date: '2026-04-20T11:00:00Z', actor: 'Marketing Agent' },
    ],
    approvalContext: {
      proposedAction: 'Shift ₹2.1 Cr from print to digital channels',
      steps: [
        { description: 'Reduce print spend by ₹2.1 Cr', impactInr: 21000000, isReversible: true },
        { description: 'Increase digital spend proportionally', impactInr: 0, isReversible: true },
      ],
      isReversible: true,
      modifiableFields: [
        { key: 'digitalPct', label: 'Digital Allocation %', currentValue: 100, inputType: 'number' },
        { key: 'note', label: 'Reason', currentValue: '', inputType: 'text' },
      ],
    },
    ownerId: 'marketing-head',
    ownerName: 'Marketing Head',
    assignedPersona: 'marketing',
    relatedEntityLabels: ['3 Campaigns', '5 Channels'],
    timestamp: '2026-04-20T11:00:00Z',
    relativeTime: '3h ago',
    isSnoozed: false,
    isResolved: false,
    conversationThread: [],
    auditLog: [],
  },

  // ── S3 Items ──────────────────────────────────────────────────────────

  {
    id: 'rev-006',
    displayId: 'REV-006',
    title: 'Slow-moving styles flagged in 3 categories',
    summary: 'Style Optimizer identified 42 slow-moving styles across Menswear Casual, Womenswear Western, and Kidswear. Average sell-through at 28% vs 55% benchmark at Week 8. No immediate action required but monitoring recommended.',
    lifecycleState: 'insight',
    severity: 'S3',
    domain: 'PLAN',
    status: 'agent-reviewing',
    impactDescription: '42 styles below sell-through benchmark',
    projectedImpactInr: 0,
    agentId: 'style-optimizer-v2',
    agentName: 'Style Optimizer',
    confidenceBucket: 'verified',
    ruleOrSignal: 'slow_moving_cluster_detection',
    lineage: [
      { state: 'insight', date: '2026-04-16T07:00:00Z', actor: 'Style Optimizer' },
    ],
    ownerId: '',
    ownerName: 'Unassigned',
    assignedPersona: 'category',
    relatedEntityLabels: ['42 Styles', '3 Categories'],
    timestamp: '2026-04-16T07:00:00Z',
    relativeTime: '2d ago',
    isSnoozed: false,
    isResolved: false,
    conversationThread: [],
    auditLog: [],
  },

  {
    id: 'rev-007',
    displayId: 'REV-007',
    linkedItemId: 'rev-014',
    title: 'DC-Bhiwandi stock transfer for Denim Festival',
    summary: 'Regional Manager flagged 4 stores in Mumbai below safety stock on Denim Festival SKUs. Replenishment Engine proposes stock transfer from DC-Bhiwandi. Truck schedule available, ₹42L impact.',
    lifecycleState: 'approval',
    severity: 'S3',
    domain: 'MOVE',
    status: 'awaiting-approval',
    impactDescription: '₹42L — 4 stores below safety stock',
    projectedImpactInr: 4200000,
    agentId: 'replenishment-v2',
    agentName: 'Replenishment Engine',
    confidenceBucket: 'verified',
    ruleOrSignal: 'safety_stock_breach',
    lineage: [
      { state: 'exception', date: '2026-04-21T06:00:00Z', actor: 'Replenishment Engine' },
      { state: 'approval', date: '2026-04-21T09:00:00Z', actor: 'Replenishment Engine' },
    ],
    approvalContext: {
      proposedAction: 'Stock transfer from DC-Bhiwandi to 4 Mumbai stores',
      steps: [
        { description: 'Transfer 1,200 units from DC-Bhiwandi', impactInr: 4200000, isReversible: true },
      ],
      isReversible: true,
    },
    ownerId: 'regional-mgr',
    ownerName: 'Regional Manager',
    assignedPersona: 'regional',
    relatedEntityLabels: ['4 Stores', '1 DC', '8 SKUs'],
    timestamp: '2026-04-21T09:00:00Z',
    relativeTime: '8h ago',
    isSnoozed: false,
    isResolved: false,
    conversationThread: [],
    auditLog: [],
  },

  {
    id: 'rev-008',
    displayId: 'REV-008',
    linkedItemId: 'rev-020',
    title: 'Cross-POD OTB reallocation — ₹33 Cr MW Pod',
    summary: 'MW Pod 3 at 107% utilization with 23 blocked POs. WWW Pod 1 at 52% with ₹48 Cr uncommitted. OTB Guardian recommends ₹33 Cr reallocation to unblock production.',
    lifecycleState: 'approval',
    severity: 'S2',
    domain: 'PLAN',
    status: 'awaiting-approval',
    impactDescription: '₹33 Cr reallocation — 23 POs blocked',
    projectedImpactInr: 330000000,
    agentId: 'otb-guardian-v1',
    agentName: 'OTB Guardian',
    confidenceBucket: 'likely',
    ruleOrSignal: 'pod_utilization_imbalance',
    lineage: [
      { state: 'exception', date: '2026-04-19T14:00:00Z', actor: 'OTB Guardian' },
      { state: 'approval', date: '2026-04-20T09:00:00Z', actor: 'OTB Guardian' },
    ],
    approvalContext: {
      proposedAction: 'Reallocate ₹33 Cr from WWW Pod 1 to MW Pod 3',
      steps: [
        { description: 'Debit ₹33 Cr from WWW Pod 1 OTB', impactInr: 330000000, isReversible: true },
        { description: 'Credit ₹33 Cr to MW Pod 3 OTB', impactInr: 0, isReversible: true },
        { description: 'Unblock 23 pending POs', impactInr: 0, isReversible: true },
      ],
      isReversible: true,
      modifiableFields: [
        { key: 'amount', label: 'Reallocation Amount (Cr)', currentValue: 33, inputType: 'number' },
      ],
    },
    ownerId: 'planning-head',
    ownerName: 'Head of Planning',
    assignedPersona: 'ceo',
    slaDeadline: '2026-04-21T09:00:00Z',
    slaHours: 24,
    relatedEntityLabels: ['23 POs', '2 Pods'],
    timestamp: '2026-04-20T09:00:00Z',
    relativeTime: '12h ago',
    isSnoozed: false,
    isResolved: false,
    conversationThread: [],
    auditLog: [],
  },

  // ── S4 & resolved items ───────────────────────────────────────────────

  {
    id: 'rev-009',
    displayId: 'REV-009',
    title: 'Dashboard load time increased 200ms',
    summary: 'Platform Agent detected a 200ms increase in dashboard load time over the past 48 hours. Root cause traced to a new analytics query joining 3 tables without an index. No business impact yet.',
    lifecycleState: 'exception',
    severity: 'S4',
    domain: 'PLATFORM',
    status: 'agent-reviewing',
    impactDescription: '200ms latency increase — no business impact',
    projectedImpactInr: 0,
    agentId: 'platform-agent-v1',
    agentName: 'Platform Agent',
    confidenceBucket: 'verified',
    ruleOrSignal: 'latency_threshold_warning',
    lineage: [
      { state: 'exception', date: '2026-04-15T22:00:00Z', actor: 'Platform Agent' },
    ],
    ownerId: '',
    ownerName: 'Unassigned',
    assignedPersona: 'admin',
    timestamp: '2026-04-15T22:00:00Z',
    relativeTime: '5d ago',
    isSnoozed: false,
    isResolved: false,
    conversationThread: [],
    auditLog: [],
  },

  {
    id: 'rev-010',
    displayId: 'REV-010',
    title: 'Chase order approved — Style MWC-4521',
    summary: 'Chase order for 3,500 units of Menswear Casual Shirt auto-approved by system. Sell-through at 92% with ROS 4.2x. Vendor confirmed 14-day lead time.',
    lifecycleState: 'approval',
    severity: 'S3',
    domain: 'BUY',
    status: 'resolved',
    impactDescription: '₹28L additional revenue captured via chase',
    projectedImpactInr: 2800000,
    agentId: 'replenishment-v2',
    agentName: 'Replenishment Engine',
    confidenceBucket: 'verified',
    ruleOrSignal: 'winner_signal_chase',
    lineage: [
      { state: 'insight', date: '2026-04-12T14:00:00Z', actor: 'Replenishment Engine' },
      { state: 'approval', date: '2026-04-14T14:00:00Z', actor: 'Replenishment Engine' },
    ],
    ownerId: 'system',
    ownerName: 'Auto-Approved',
    assignedPersona: 'category',
    timestamp: '2026-04-14T14:00:00Z',
    relativeTime: '4d ago',
    isSnoozed: false,
    isResolved: true,
    resolvedAt: '2026-04-14T14:00:05Z',
    conversationThread: [],
    auditLog: [
      { timestamp: '2026-04-14T14:00:05Z', actor: 'System (Auto-Approve Rule)', action: 'Auto-approved — ST 92% > 85%, ROS 4.2x > 3x' },
    ],
  },

  // ── More diversity items ──────────────────────────────────────────────

  {
    id: 'rev-011',
    displayId: 'REV-011',
    title: 'Below-cost markdown — Winter Outerwear batch',
    summary: '850 units of winter outerwear at 120+ days in stock. Avg cost ₹1,412, proposed sale at ₹980 (31% below cost). Total write-off value ₹12L. Dual sign-off required from Finance Head and CEO.',
    lifecycleState: 'approval',
    severity: 'S1',
    domain: 'LIQUIDATION',
    status: 'awaiting-approval',
    impactDescription: '₹12L write-off — below-cost markdown',
    projectedImpactInr: 1200000,
    agentId: 'liquidation-trigger-v1',
    agentName: 'Liquidation Trigger',
    confidenceBucket: 'likely',
    ruleOrSignal: 'below_cost_markdown_threshold',
    lineage: [
      { state: 'insight', date: '2026-04-01T07:00:00Z', actor: 'Liquidation Trigger' },
      { state: 'exception', date: '2026-04-10T07:00:00Z', actor: 'Liquidation Trigger' },
      { state: 'approval', date: '2026-04-19T09:00:00Z', actor: 'Liquidation Trigger' },
    ],
    approvalContext: {
      proposedAction: 'Below-cost markdown at 55% off MRP for 14-day clearance',
      steps: [
        { description: 'Apply 55% off MRP on 850 units', impactInr: 1200000, isReversible: false, targetSystem: 'SAP' },
      ],
      isReversible: false,
    },
    ownerId: 'ceo-user',
    ownerName: 'CEO',
    assignedPersona: 'ceo',
    slaDeadline: '2026-04-20T09:00:00Z',
    slaHours: 24,
    relatedEntityLabels: ['850 Units', '1 Batch'],
    timestamp: '2026-04-19T09:00:00Z',
    relativeTime: '1d ago',
    isSnoozed: false,
    isResolved: false,
    conversationThread: [],
    auditLog: [],
  },

  {
    id: 'rev-012',
    displayId: 'REV-012',
    linkedItemId: 'rev-004',
    title: 'Vendor compliance trending down — V-3891',
    summary: 'Vendor V-3891 compliance score dropped from 88% to 71% over 4 weeks. Three quality incidents reported. Sourcing Co-pilot recommends adding to watch list and reducing next season allocation by 20%.',
    lifecycleState: 'exception',
    severity: 'S2',
    domain: 'BUY',
    status: 'investigating',
    impactDescription: 'Vendor compliance 71% — below 80% threshold',
    projectedImpactInr: 50000000,
    agentId: 'sourcing-copilot-v1',
    agentName: 'Sourcing Co-pilot',
    confidenceBucket: 'verified',
    ruleOrSignal: 'vendor_compliance_decline',
    lineage: [
      { state: 'insight', date: '2026-04-05T07:00:00Z', actor: 'Sourcing Co-pilot' },
      { state: 'exception', date: '2026-04-12T07:00:00Z', actor: 'Sourcing Co-pilot' },
    ],
    ownerId: 'sourcing-director',
    ownerName: 'Sourcing Director',
    assignedPersona: 'sourcing',
    relatedEntityLabels: ['1 Vendor', '12 POs', '3 Quality Issues'],
    timestamp: '2026-04-12T07:00:00Z',
    relativeTime: '8d ago',
    isSnoozed: false,
    isResolved: false,
    conversationThread: [],
    auditLog: [],
  },

  {
    id: 'rev-013',
    displayId: 'REV-013',
    title: 'Store TRS-0142 space reallocation — Formal to Casual',
    summary: 'Space Optimizer recommends 15% space reallocation at Inorbit Mall, Hyderabad. Formal sell-through at 42% vs Casual at 81%. Projected revenue uplift of ₹18L/quarter from better space productivity.',
    lifecycleState: 'approval',
    severity: 'S3',
    domain: 'SELL',
    status: 'awaiting-approval',
    impactDescription: '₹18L/quarter revenue uplift from space reallocation',
    projectedImpactInr: 1800000,
    agentId: 'space-optimizer-v1',
    agentName: 'Space Optimizer',
    confidenceBucket: 'verified',
    ruleOrSignal: 'space_productivity_imbalance',
    lineage: [
      { state: 'approval', date: '2026-04-19T08:00:00Z', actor: 'Space Optimizer' },
    ],
    approvalContext: {
      proposedAction: 'Reallocate 15% floor space from Formal to Casual at TRS-0142',
      steps: [
        { description: 'Reduce Formal from 30% to 20%', impactInr: 0, isReversible: true },
        { description: 'Increase Casual from 25% to 35%', impactInr: 1800000, isReversible: true },
      ],
      isReversible: true,
    },
    ownerId: 'ops-head',
    ownerName: 'Operations Head',
    assignedPersona: 'ops',
    relatedEntityLabels: ['1 Store', 'Inorbit Mall'],
    timestamp: '2026-04-19T08:00:00Z',
    relativeTime: '1d ago',
    isSnoozed: false,
    isResolved: false,
    conversationThread: [],
    auditLog: [],
  },

  {
    id: 'rev-014',
    displayId: 'REV-014',
    linkedItemId: 'rev-007',
    title: 'Regional stockout alert — 8 stores below safety stock',
    summary: 'Eight stores in Western region are below safety stock on core NOOS items. Replenishment Engine has flagged the issue but no automated transfer is available due to DC capacity constraints.',
    lifecycleState: 'exception',
    severity: 'S2',
    domain: 'MOVE',
    status: 'agent-reviewing',
    impactDescription: '₹1.2 Cr daily revenue at risk from stockouts',
    projectedImpactInr: 12000000,
    agentId: 'replenishment-v2',
    agentName: 'Replenishment Engine',
    confidenceBucket: 'likely',
    ruleOrSignal: 'regional_stockout_cluster',
    lineage: [
      { state: 'exception', date: '2026-04-20T05:00:00Z', actor: 'Replenishment Engine' },
    ],
    ownerId: 'regional-mgr',
    ownerName: 'Regional Manager',
    assignedPersona: 'regional',
    relatedEntityLabels: ['8 Stores', '2 DCs', '24 SKUs'],
    timestamp: '2026-04-20T05:00:00Z',
    relativeTime: '1d ago',
    isSnoozed: false,
    isResolved: false,
    conversationThread: [],
    auditLog: [],
  },

  {
    id: 'rev-015',
    displayId: 'REV-015',
    title: 'Creative swap recommendation — hero banner A/B test',
    summary: 'Marketing Agent recommends replacing hero banner based on A/B test data. Variant B shows 42% higher CTR and 18% higher conversion rate. Campaign has 2 weeks remaining.',
    lifecycleState: 'approval',
    severity: 'S3',
    domain: 'MARKET',
    status: 'awaiting-approval',
    impactDescription: '42% CTR improvement opportunity',
    projectedImpactInr: 5000000,
    agentId: 'marketing-agent-v1',
    agentName: 'Marketing Agent',
    confidenceBucket: 'verified',
    ruleOrSignal: 'ab_test_significant_result',
    lineage: [
      { state: 'insight', date: '2026-04-17T10:00:00Z', actor: 'Marketing Agent' },
      { state: 'approval', date: '2026-04-19T10:00:00Z', actor: 'Marketing Agent' },
    ],
    approvalContext: {
      proposedAction: 'Replace hero banner with Variant B across all channels',
      steps: [
        { description: 'Swap hero banner creative', impactInr: 5000000, isReversible: true },
      ],
      isReversible: true,
    },
    ownerId: 'marketing-head',
    ownerName: 'Marketing Head',
    assignedPersona: 'marketing',
    relatedEntityLabels: ['1 Campaign', '3 Channels'],
    timestamp: '2026-04-19T10:00:00Z',
    relativeTime: '1d ago',
    isSnoozed: false,
    isResolved: false,
    conversationThread: [],
    auditLog: [],
  },

  // ── Snoozed item ──────────────────────────────────────────────────────

  {
    id: 'rev-016',
    displayId: 'REV-016',
    title: 'Low-priority regional stock transfer',
    summary: 'Minor stock transfer request between two regional DCs. Deferred to Monday as it has no urgency and the logistics window is favorable next week.',
    lifecycleState: 'approval',
    severity: 'S4',
    domain: 'MOVE',
    status: 'awaiting-approval',
    impactDescription: '₹8L stock transfer',
    projectedImpactInr: 800000,
    agentId: 'replenishment-v2',
    agentName: 'Replenishment Engine',
    confidenceBucket: 'verified',
    ruleOrSignal: 'routine_transfer_suggestion',
    lineage: [
      { state: 'approval', date: '2026-04-18T09:00:00Z', actor: 'Replenishment Engine' },
    ],
    approvalContext: {
      proposedAction: 'Transfer 400 units from DC-Pune to DC-Nagpur',
      steps: [
        { description: 'Schedule transfer', impactInr: 800000, isReversible: true },
      ],
      isReversible: true,
    },
    ownerId: 'ceo-user',
    ownerName: 'CEO',
    assignedPersona: 'ceo',
    timestamp: '2026-04-18T09:00:00Z',
    relativeTime: '2d ago',
    isSnoozed: true,
    snoozeUntil: '2026-04-28T09:00:00Z',
    isResolved: false,
    conversationThread: [],
    auditLog: [
      { timestamp: '2026-04-20T10:00:00Z', actor: 'CEO', action: 'Snoozed until Monday 28 Apr' },
    ],
  },

  // ── AI-handled items ──────────────────────────────────────────────────

  {
    id: 'rev-017',
    displayId: 'REV-017',
    title: 'Auto-approved: NOOS replenishment batch #R-4892',
    summary: 'Replenishment Engine auto-approved 42 NOOS replenishment orders worth ₹4.8 Cr. All within pre-configured thresholds: <₹10L per order, verified confidence, standard lead times.',
    lifecycleState: 'approval',
    severity: 'S4',
    domain: 'BUY',
    status: 'resolved',
    impactDescription: '₹4.8 Cr routine replenishment — auto-handled',
    projectedImpactInr: 48000000,
    agentId: 'replenishment-v2',
    agentName: 'Replenishment Engine',
    confidenceBucket: 'verified',
    ruleOrSignal: 'noos_replenishment_auto',
    lineage: [
      { state: 'approval', date: '2026-04-20T06:00:00Z', actor: 'Replenishment Engine' },
    ],
    ownerId: 'system',
    ownerName: 'Auto-Approved',
    assignedPersona: 'ops',
    timestamp: '2026-04-20T06:00:00Z',
    relativeTime: '1d ago',
    isSnoozed: false,
    isResolved: true,
    resolvedAt: '2026-04-20T06:00:05Z',
    conversationThread: [],
    auditLog: [
      { timestamp: '2026-04-20T06:00:05Z', actor: 'System (Auto-Approve Rule)', action: 'Auto-approved — within policy thresholds' },
    ],
  },

  {
    id: 'rev-018',
    displayId: 'REV-018',
    title: 'Auto-handled: pricing update for 8 seasonal SKUs',
    summary: 'Pricing Agent auto-applied seasonal pricing adjustments for 8 SKUs based on pre-approved pricing rules. All changes within ±5% of planned MRP.',
    lifecycleState: 'approval',
    severity: 'S4',
    domain: 'SELL',
    status: 'resolved',
    impactDescription: 'Routine pricing update — within policy',
    projectedImpactInr: 0,
    agentId: 'pricing-agent-v2',
    agentName: 'Pricing Agent',
    confidenceBucket: 'verified',
    ruleOrSignal: 'seasonal_pricing_auto',
    lineage: [
      { state: 'approval', date: '2026-04-19T22:00:00Z', actor: 'Pricing Agent' },
    ],
    ownerId: 'system',
    ownerName: 'Auto-Approved',
    assignedPersona: 'admin',
    timestamp: '2026-04-19T22:00:00Z',
    relativeTime: '2d ago',
    isSnoozed: false,
    isResolved: true,
    resolvedAt: '2026-04-19T22:00:05Z',
    conversationThread: [],
    auditLog: [
      { timestamp: '2026-04-19T22:00:05Z', actor: 'System (Auto-Approve Rule)', action: 'Auto-applied — within ±5% pricing policy' },
    ],
  },

  {
    id: 'rev-019',
    displayId: 'REV-019',
    title: 'Carryover routing decision — AW25 Denim batch',
    summary: 'Inventory Agent recommends routing 3,200 units of AW25 denim to outlet channel. Current sell-through at 22% after 90 days in network. Outlet partner confirmed capacity.',
    lifecycleState: 'approval',
    severity: 'S3',
    domain: 'LIQUIDATION',
    status: 'awaiting-approval',
    impactDescription: '₹45L recovery from outlet routing',
    projectedImpactInr: 4500000,
    agentId: 'liquidation-trigger-v1',
    agentName: 'Liquidation Trigger',
    confidenceBucket: 'likely',
    ruleOrSignal: 'carryover_routing_trigger',
    lineage: [
      { state: 'insight', date: '2026-04-10T07:00:00Z', actor: 'Liquidation Trigger' },
      { state: 'exception', date: '2026-04-15T07:00:00Z', actor: 'Liquidation Trigger' },
      { state: 'approval', date: '2026-04-18T09:00:00Z', actor: 'Liquidation Trigger' },
    ],
    approvalContext: {
      proposedAction: 'Route 3,200 units to outlet partner at 40% of MRP',
      steps: [
        { description: 'Transfer to outlet partner warehouse', impactInr: 4500000, isReversible: false },
      ],
      isReversible: false,
    },
    ownerId: 'category-head',
    ownerName: 'Category Head',
    assignedPersona: 'category',
    relatedEntityLabels: ['3,200 Units', '1 Outlet Partner'],
    timestamp: '2026-04-18T09:00:00Z',
    relativeTime: '2d ago',
    isSnoozed: false,
    isResolved: false,
    conversationThread: [],
    auditLog: [],
  },

  {
    id: 'rev-020',
    displayId: 'REV-020',
    linkedItemId: 'rev-008',
    title: 'Calendar conflict — SS26 Drop 2 vs Festival prep',
    summary: 'Calendar Agent detected a 2-week overlap between SS26 Drop 2 intake and Diwali Festival preparation at 12 stores. Warehouse capacity at 92% during the overlap window.',
    lifecycleState: 'exception',
    severity: 'S3',
    domain: 'PLAN',
    status: 'agent-reviewing',
    impactDescription: 'Capacity conflict at 12 stores during overlap',
    projectedImpactInr: 8000000,
    agentId: 'calendar-agent-v1',
    agentName: 'Calendar Agent',
    confidenceBucket: 'likely',
    ruleOrSignal: 'calendar_overlap_detection',
    lineage: [
      { state: 'exception', date: '2026-04-17T10:00:00Z', actor: 'Calendar Agent' },
    ],
    ownerId: '',
    ownerName: 'Unassigned',
    assignedPersona: 'ops',
    relatedEntityLabels: ['12 Stores', '2 Events'],
    timestamp: '2026-04-17T10:00:00Z',
    relativeTime: '3d ago',
    isSnoozed: false,
    isResolved: false,
    conversationThread: [],
    auditLog: [],
  },
];
