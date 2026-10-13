// Engine Dashboard types — co-located with engine feature.

/** The 9 possible rule-tree outcomes from the engine (Bible section 5.5). */
export type EngineOutcome =
  | 'LEAVE ALONE'
  | 'SUPPLY HOLD'
  | 'MOVE'
  | 'HOLD'
  | 'DISCOUNT'
  | 'HOLD TO EXIT'
  | 'LIQUIDATION'
  | 'TEST CLEARANCE'
  | 'WAIT';

/** Priority order for sorting outcomes (lower = more urgent). */
export const OUTCOME_PRIORITY: Record<EngineOutcome, number> = {
  LIQUIDATION: 0,
  DISCOUNT: 1,
  MOVE: 2,
  'HOLD TO EXIT': 3,
  'TEST CLEARANCE': 4,
  'SUPPLY HOLD': 5,
  HOLD: 6,
  WAIT: 7,
  'LEAVE ALONE': 8,
} as const;

/** Gate status within the 5-gate decision path. */
export type GateStatus = 'passed' | 'decided' | 'not_reached' | 'failed';

/** A single gate result in the G0-G4 decision path. */
export interface GateResult {
  /** Gate index 0-4. */
  readonly gate: number;
  /** Human-readable gate name. */
  readonly name: string;
  /** Whether this gate passed, decided, or was not reached. */
  readonly status: GateStatus;
  /** Key name:value inputs shown in collapsed view (1-3 lines). */
  readonly keyInputs: readonly GateInput[];
  /** Full inputs shown when the gate row is expanded. */
  readonly fullInputs: readonly GateInput[];
  /** One-line result explanation. */
  readonly testResult: string;
}

/** A single name:value input pair for a gate. */
export interface GateInput {
  readonly label: string;
  readonly value: string;
}

/** Grade classification for an option. */
export type GradeType = 'Fashion' | 'Ultimate' | 'Core';

/** Lifecycle stage of an option at a store. */
export type LifecycleStage =
  | 'Under min'
  | 'Building'
  | 'Checkpoint'
  | 'Review'
  | 'Exit review'
  | 'Exit'
  | 'Core active'
  | 'Unknown';

/** Run type for the engine. */
export type RunType = 'Nightly' | 'Pullback (Mon)' | 'Pullback (Thu)';

/** Status of a single data readiness check. */
export interface ReadinessCheck {
  readonly name: string;
  readonly passed: boolean;
  readonly detail?: string;
}

/** Status of a single pipeline step. */
export type PipelineStepStatus = 'ran' | 'skipped' | 'failed';

/** A step in the engine pipeline. */
export interface PipelineStep {
  readonly index: number;
  readonly name: string;
  readonly status: PipelineStepStatus;
  /** One-line stat for this step. */
  readonly stat: string;
  /** Pullback sub-steps (only for the pullback run step). */
  readonly subSteps?: readonly PipelineStep[];
}

/** Line state for engine output. */
export type LineState = 'proposed' | 'released' | 'in_transit' | 'received' | 'reconciled';

/** Autonomy band for governance routing. */
export type AutonomyBand = 'auto' | 'stop-and-approve';

/** Governance trigger labels (T1-T7). */
export type GovernanceTrigger = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7';

/** Size split row for replenishment output. */
export interface SizeSplitRow {
  readonly size: string;
  readonly share: number;
  readonly target: number;
  readonly position: number;
  readonly dispatch: number;
}

/** Replenishment detail from engine output. */
export interface ReplenishmentDetail {
  readonly kind: 'replenishment';
  readonly targetStock: number;
  readonly sizeSplit: readonly SizeSplitRow[];
  readonly dcStockBefore: number;
  readonly dcStockAfter: number;
  readonly rationingStatus: string;
}

/** Pullback detail from engine output. */
export interface PullbackDetail {
  readonly kind: 'pullback';
  readonly pullbackType: string;
  readonly reason: string;
  readonly rank: number;
  readonly unitsPulled: number;
  readonly route: string;
  readonly spaceFloorBefore: number;
  readonly spaceFloorAfter: number;
  readonly linkedReplacement: string | null;
}

/** Price row for markdown output. */
export interface PriceRow {
  readonly size: string;
  readonly fullPrice: number;
  readonly ladderPrice: number;
  readonly floorPrice: number;
  readonly markedPrice: number;
}

/** Markdown detail from engine output. */
export interface MarkdownDetail {
  readonly kind: 'markdown';
  readonly ladderTier: number;
  readonly depth: number;
  readonly priceTable: readonly PriceRow[];
  readonly headroom: number;
  readonly floorClamp: boolean;
  readonly oneWayDoor: boolean;
  readonly nextStepEligible: boolean;
}

/** Hold/leave-alone/wait detail from engine output. */
export interface HoldDetail {
  readonly kind: 'hold';
  readonly reason: string;
  readonly nextStep: string;
}

/** Union of all engine output detail types. */
export type EngineOutputDetailData =
  | ReplenishmentDetail
  | PullbackDetail
  | MarkdownDetail
  | HoldDetail;

/** Line metadata common to all engine outcomes. */
export interface LineMetadata {
  readonly runId: string;
  readonly lineState: LineState;
  readonly autonomyBand: AutonomyBand;
  readonly triggers: readonly GovernanceTrigger[];
}

/** One option x store engine outcome row. */
export interface EngineOutcomeRow {
  readonly id: string;
  readonly optionCode: string;
  readonly optionName: string;
  readonly optionColour: string;
  readonly storeCode: string;
  readonly storeName: string;
  readonly outcome: EngineOutcome;
  readonly actionSummary: string;
  readonly grade: GradeType;
  readonly lifecycleAge: number;
  readonly lifecycleStage: LifecycleStage;
  readonly gap: number;
  readonly decidingGate: number;
  readonly gates: readonly GateResult[];
  readonly outputDetail: EngineOutputDetailData;
  readonly lineMetadata: LineMetadata;
}

/** Summary counts for the run status bar. */
export interface ActionSummary {
  readonly replenishment: number;
  readonly pullback: number;
  readonly markdown: number;
}

/** Full engine run. */
export interface EngineRun {
  readonly runId: string;
  readonly runType: RunType;
  readonly asOfDate: string;
  readonly runTimestamp: string;
  readonly readinessChecks: readonly ReadinessCheck[];
  readonly lineCounts: ActionSummary;
  readonly pipeline: readonly PipelineStep[];
  readonly outcomes: readonly EngineOutcomeRow[];
}
