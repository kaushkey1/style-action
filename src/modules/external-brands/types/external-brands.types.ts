// External Brands (BM-4) Type Definitions

// ─── Core Data Models ────────────────────────────────────────────────────────

// Type alias for StyleDetailPanel component
export type ExternalStyle = BrandStyle;

export type SlotState =
  | 'empty'
  | 'auto_shortlist_pending'
  | 'partial'
  | 'covered'
  | 'over'
  | 'accepted_gap'
  | 'locked_covered'
  | 'locked_partial';

export type StyleState =
  | 'in_catalog'
  | 'attribute_review_pending'
  | 'excluded'
  | 'unscored'
  | 'auto_shortlisted'
  | 'confirmed'
  | 'rejected'
  | 'manually_shortlisted'
  | 'target_changed'
  | 'no_longer_eligible'
  | 'locked'
  | 'returned_from_buy_plan'
  | 'rejected_by_filter';

export type SessionState =
  | 'awaiting_catalog'
  | 'in_curation'
  | 'pending_category_head_review'
  | 'approved_for_buy_plan'
  | 'buy_plan_ingested'
  | 'curation_reentry_pending';

export interface PriceBand {
  min: number;
  max: number;
}

export interface AttributeMatch {
  attribute: string;
  status: 'match' | 'miss' | 'partial' | 'na';
  note?: string;
}

export interface Slot {
  id: string;
  brick: string;
  fashionGrade: string;
  priceBand: PriceBand;
  attributes: Record<string, string>;
  targetOptions: number;
  state: SlotState;
  shortlist: StyleMatch[];
  isLocked?: boolean;
  lockedFromDrop?: string;
}

export interface StyleMatch {
  styleId: string;
  score: number;
  state: StyleState;
  breakdown: AttributeMatch[];
  bestFitSlot: string;
  alternateSlots: { slotId: string; score: number }[];
  confirmedAt?: Date;
  confirmedBy?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
}

export interface BrandStyle {
  id: string;
  brand: string;
  brandId: string;
  name: string;
  code: string;
  mrp: number;
  moq: number;
  wholesaleCost: number;
  attributes: Record<string, { value: string; confidence: number }>;
  images: string[];
  sizeRun: string[];
  drop: string;
  colourway?: string;
  state: StyleState;
}

export interface BrandCatalog {
  id: string;
  brand: string;
  brandId: string;
  category: string;
  season: string;
  drop: string;
  styles: BrandStyle[];
  receivedAt: Date;
}

export interface Session {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  dropId: string;
  dropLabel: string;
  brandLabel?: string;
  mode: 'curate' | 'view';
  status: SessionState;
  catalog: BrandCatalog;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Coverage & Metrics ──────────────────────────────────────────────────────

export interface CoverageMetrics {
  totalSlots: number;
  coveredSlots: number;
  partialSlots: number;
  pendingSlots: number;
  acceptedGaps: number;
  emptySlots: number;
  confirmedStyles: number;
  pendingStyles: number;
}

export interface BrandConcentration {
  brand: string;
  confirmedCount: number;
  percentageOfCategory: number;
  cap: number;
  isOverCap: boolean;
}

export interface AttributeCoverage {
  attribute: string;
  target: Record<string, number>;
  confirmed: Record<string, number>;
  variance: Record<string, number>;
}

export interface GuardrailStatus {
  type: 'hard' | 'soft';
  label: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  blocksCompletion: boolean;
  affectedCount?: number;
}

// ─── UI View States ──────────────────────────────────────────────────────────

export type CenterView = 'session-overview' | 'matches' | 'catalog' | 'attribute-review';

export interface FilterState {
  brands: string[];
  bricks: string[];
  fashionGrades: string[];
  priceBands: { min?: number; max?: number };
  statuses: StyleState[];
  similarity: { min?: number; max?: number };
  drops: string[];
}

export interface SortState {
  field: 'similarity' | 'mrp' | 'moq' | 'brand' | 'recency';
  direction: 'asc' | 'desc';
}

// ─── Actions & Events ────────────────────────────────────────────────────────

export interface StyleAction {
  type: 'confirm' | 'reject' | 'undo_confirm' | 'undo_reject' | 'manual_shortlist' | 'remove_manual' | 'reassign';
  styleId: string;
  slotId: string;
  userId: string;
  timestamp: Date;
  reason?: string;
}

export interface SlotAction {
  type: 'mark_gap' | 'unmark_gap' | 'lock' | 'unlock';
  slotId: string;
  userId: string;
  timestamp: Date;
}

export interface AttributeReviewAction {
  type: 'confirm_and_rematch' | 'exclude' | 'accept_all' | 'exclude_all';
  styleId?: string;
  corrections?: Record<string, string>;
  userId: string;
  timestamp: Date;
}

// ─── Buy Plan Handoff ────────────────────────────────────────────────────────

export interface BuyPlanHandoff {
  styleId: string;
  styleCode: string;
  brand: string;
  brandId: string;
  slotId: string;
  mrp: number;
  wholesaleCost: number;
  moq: number;
  sizeRun: string[];
  similarityScore: number;
  attributes: Record<string, string>;
  confirmedBy: string;
  confirmedAt: Date;
}

// ─── Match Engine Contract ───────────────────────────────────────────────────

export interface MatchResult {
  styleId: string;
  slotId: string;
  score: number;
  breakdown: AttributeMatch[];
  hardFilterFailed: boolean;
}

export interface MatchEngineRequest {
  slots: Slot[];
  styles: BrandStyle[];
  weights?: Record<string, number>;
  thresholds?: {
    autoShortlist: number;
    display: number;
  };
}

export interface MatchEngineResponse {
  results: MatchResult[];
  computedAt: Date;
  engineVersion: string;
}