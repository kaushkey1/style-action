// ─── Sales Plan Types ─────────────────────────────────────────────

// ─── State Machine ────────────────────────────────────────────────
export type CycleStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'REVISION_REQUESTED'
  | 'APPROVED'
  | 'LOCKED'
  | 'PROMOTED';

export const VALID_TRANSITIONS: Record<CycleStatus, CycleStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['IN_REVIEW'],
  IN_REVIEW: ['APPROVED', 'REVISION_REQUESTED'],
  REVISION_REQUESTED: ['SUBMITTED'],
  APPROVED: ['LOCKED'],
  LOCKED: ['PROMOTED'],
  PROMOTED: [],
};

export type CyclePhase = 'setup' | 'plan' | 'review' | 'approve' | 'lock' | 'promote';

export const CYCLE_PHASES: CyclePhase[] = ['setup', 'plan', 'review', 'approve', 'lock', 'promote'];

export const PHASE_LABELS: Record<CyclePhase, string> = {
  setup: 'Setup',
  plan: 'Plan',
  review: 'Review',
  approve: 'Approve',
  lock: 'Lock',
  promote: 'Promote',
};

export const STATUS_TO_PHASE: Record<CycleStatus, CyclePhase> = {
  DRAFT: 'plan',
  SUBMITTED: 'review',
  IN_REVIEW: 'review',
  REVISION_REQUESTED: 'plan',
  APPROVED: 'approve',
  LOCKED: 'lock',
  PROMOTED: 'promote',
};

// ─── Channels ─────────────────────────────────────────────────────
// Channels are dynamic (users can add custom channels per cycle), so this is a plain
// string. Known base channels: EBO, SIS, MBO, AJIO, Ecom_own_site, Omni, Franchise, DISTRIBUTION.
export type ChannelId = string;

export interface Channel {
  id: ChannelId;
  label: string;
  hasOTB: boolean;
  color: string;
}

// ─── Store Classification ─────────────────────────────────────────
export type StoreClassification = 'LFL' | 'ANNUALISED' | 'NEW' | 'CLOSURE' | 'NON_COMPARABLE';
export type StoreStatus = 'Active' | 'Full Closure' | 'Renovation' | 'Relocation';
export type ClosureType = 'temporary' | 'full' | 'relocation';

// ─── Store Listing (Manage Stores) ────────────────────────────────
export interface StoreListing {
  id: string;
  name: string;
  code: string;
  state: string;
  city: string;
  type: string;
  channelId: ChannelId;
  category: string;
  isNew?: boolean;
  startDate: string;
  endDate: string | null;
  status: StoreStatus;
  closureType: ClosureType | null;
  closureReason: string | null;
  reopenDate: string | null;
  /** Operational for all 12 months of the FY (opened on/before FY start, active all year). */
  comparable?: boolean;
}

// ─── Measures ─────────────────────────────────────────────────────
export type Measure = 'net_sales' | 'gross_margin' | 'gm_pct';

export const MEASURE_LABELS: Record<Measure, string> = {
  net_sales: 'GSV',
  gross_margin: 'Gross Margin',
  gm_pct: 'GM%',
};

// ─── Season ───────────────────────────────────────────────────────
export type Season = 'H1' | 'H2';

export interface PlanMonth {
  id: string;
  label: string;
  shortLabel: string;
  season: Season;
  index: number;
}

// ─── Month Cell ───────────────────────────────────────────────────
export interface MonthCell {
  monthId: string;
  value: number; // Working AOP (current NSV)
  generated?: number; // Generated AOP (snapshot at last Generate)
  actual?: number | null; // Current-FY actual (elapsed months); null/absent when N/A
  isActual?: boolean; // month has actual sales -> read-only
  isPinned: boolean;
  isEdited: boolean;
  priorYear: number; // last-year (LY) NSV for the same month
}

// ─── Channel Target (Planning Inputs) ─────────────────────────────
export interface ChannelTargetInput {
  channelId: ChannelId;
  netSalesTarget: number;
  gmPctTarget: number;
  pyActual: number;
}

// ─── Category Allocation ──────────────────────────────────────────
export interface CategoryAllocation {
  category: string;
  pct: number;
  value: number;
}

// ─── Grid Row ─────────────────────────────────────────────────────
export type GridRowLevel = 'total' | 'channel' | 'category' | 'store';

export interface GuardrailBand {
  minGrowth: number;
  maxGrowth: number;
}

export type GuardrailStatus = 'within' | 'above' | 'below';

export interface GolyMonth {
  monthId: string;
  golyPct: number;
}

export interface GolyDetail {
  ytdActual: number;
  plannedRemainder: number;
  latestEstimate: number;
  priorYearTotal: number;
  golyPct: number;
  months: GolyMonth[];
}

export interface PlanningGridRow {
  id: string;
  level: GridRowLevel;
  label: string;
  parentId: string | null;
  channelId: ChannelId | null;
  storeClassification: StoreClassification | null;
  storeGrade: string | null;
  isNewStore: boolean;
  months: MonthCell[];
  fyTotal: number;
  generatedTotal?: number; // Generated AOP FY total
  ytdActual?: number; // Σ actuals for elapsed months
  plannedRemainder?: number; // Σ plan for remaining months
  latestEstimate?: number; // ytdActual + plannedRemainder
  priorYearTotal: number;
  growthPct: number;
  golyPct?: number; // growth of latest estimate over last year
  golyDetail?: GolyDetail | null;
  guardrailStatus: GuardrailStatus;
  guardrailBand: GuardrailBand;
  gmPct: number;
  grossMargin: number;
  city?: string;
  categoryAllocations: CategoryAllocation[];
}

// ─── Channel variance (top-down vs bottom-up) ─────────────────────
export interface ChannelVarianceRow {
  channel: string;
  topDown: number;
  bottomUp: number;
  variance: number;
  variancePct: number;
}

// ─── Brick view (category → SAP bricks) ───────────────────────────
export interface BrickViewBrick {
  brickCd: string;
  brickDesc: string;
  value: number;
  generated: number;
  latestEstimate: number;
  priorYear: number;
  golyPct: number;
  pctOfCategory: number;
}

export interface BrickViewCategory {
  category: string;
  value: number;
  generated: number;
  latestEstimate: number;
  priorYear: number;
  golyPct: number;
  pctOfTotal: number;
  bricks: BrickViewBrick[];
}

// ─── Readiness ────────────────────────────────────────────────────
export type ReadinessStatus = 'ready' | 'pending' | 'error';

export interface ReadinessCheck {
  id: string;
  label: string;
  description: string;
  status: ReadinessStatus;
  detail: string;
}

// ─── Cycle ────────────────────────────────────────────────────────
export interface PlanningCycle {
  id: string;
  name: string;
  fiscalYear: string;
  fyStartYear?: number;
  brand: string;
  status: CycleStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  submittedBy: string | null;
  submittedAt: string | null;
  reviewedBy: string | null;
  approvedAt: string | null;
  lockedBy: string | null;
  lockedAt: string | null;
  promotedAt: string | null;
  activeScenarioId: string;
  readinessChecks: ReadinessCheck[];
  exceptionCount: { hard: number; soft: number };
}

// ─── Exceptions ───────────────────────────────────────────────────
export type ExceptionSeverity = 'hard' | 'soft';
export type ExceptionStatus = 'open' | 'acknowledged' | 'resolved';

export interface PlanningException {
  id: string;
  cycleId: string;
  severity: ExceptionSeverity;
  rule: string;
  message: string;
  affectedEntity: string;
  affectedEntityId: string;
  channelId: ChannelId;
  deepLinkRowId: string | null;
  status: ExceptionStatus;
  resolvedBy: string | null;
  resolvedAt: string | null;
}

// ─── Scenarios ────────────────────────────────────────────────────
export type ScenarioType = 'base' | 'optimistic' | 'conservative';

export interface ScenarioChannelBreakdown {
  channelId: ChannelId;
  channelLabel: string;
  netSales: number;
  grossMargin: number;
  gmPct: number;
  growthPct: number;
  storeCount: number;
}

export interface PlanningScenario {
  id: string;
  cycleId: string;
  name: string;
  type: ScenarioType;
  isActive: boolean;
  totalNetSales: number;
  totalGrossMargin: number;
  avgGmPct: number;
  totalStoreCount: number;
  growthVsPY: number;
  channelBreakdown: ScenarioChannelBreakdown[];
}

// ─── New Store Projection ─────────────────────────────────────────
export type ProjectionMethod = 'waterfall' | 'reference';

export interface NewStoreProjection {
  storeId: string;
  storeName: string;
  channelId: ChannelId;
  waterfallTotal: number;
  waterfallMonths: number[];
  referenceStoreId: string;
  referenceStoreName: string;
  referenceTotal: number;
  referenceMonths: number[];
  variancePct: number;
  selectedMethod: ProjectionMethod;
  isAcknowledged: boolean;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
}

// ─── Review & Approval ───────────────────────────────────────────
export type ReviewAction = 'submitted' | 'approved' | 'revision_requested' | 'locked' | 'promoted' | 'comment';

export interface ReviewEntry {
  id: string;
  cycleId: string;
  action: ReviewAction;
  actor: string;
  actorRole: string;
  timestamp: string;
  comment: string;
  version: number;
}

// ─── Audit History ───────────────────────────────────────────────
export interface AuditEntry {
  id: string;
  cycleId: string;
  timestamp: string;
  actor: string;
  action: string;
  entityType: 'cycle' | 'grid_cell' | 'exception' | 'scenario' | 'approval';
  entityId: string;
  description: string;
  oldValue: string | null;
  newValue: string | null;
}

// ─── User Task ───────────────────────────────────────────────────
export type TaskType = 'review' | 'resolve_exception' | 'submit' | 'approve' | 'revise';

export interface UserTask {
  id: string;
  cycleId: string;
  cycleName: string;
  type: TaskType;
  description: string;
  priority: 'high' | 'medium' | 'low';
  deepLink: string;
}
