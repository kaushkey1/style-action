// ─── OTB Status & Enums ──────────────────────────────────────────────

export type OTBStatus = 'draft' | 'committed' | 'locked' | 'active' | 'closed';
export type OTBTier = 'pre-book' | 'chase' | 'micro-drop';
export type FashionGrade = 'core' | 'fashion';
export type SourcingEngine = 'scale-margin' | 'fast-response' | 'test-repeat';
export type ChaseSignal = 'winner' | 'strong' | 'stable' | 'weak' | 'stockout';
export type GuardrailStatus = 'ok' | 'warning' | 'breach';

// ─── OTB Budget ──────────────────────────────────────────────────────

export interface OTBBudget {
  id: string;
  fiscalYear: string;
  half: 'H1' | 'H2' | 'FY';
  status: OTBStatus;
  approvedScenarioId: string;
  createdAt: string;
  lockedAt: string | null;

  // Network-level totals (at retail)
  totalBudget: number;
  totalConsumed: number;
  totalRemaining: number;
  utilization: number;

  // Tier breakdown
  tiers: OTBTierBreakdown[];

  // Fashion grade split
  fashionGradeSplit: {
    core: { budget: number; consumed: number };
    fashion: { budget: number; consumed: number };
  };

  // Sourcing engine allocation
  sourcingEngines: OTBSourcingAllocation[];

  // POD-level breakdown
  pods: OTBPodBudget[];

  // Guardrail summary
  guardrailStatus: OTBGuardrailSummary;
}

export interface OTBTierBreakdown {
  tier: OTBTier;
  sharePct: number;
  budget: number;
  consumed: number;
  remaining: number;
  status: 'held' | 'active' | 'locked' | 'depleted';
}

export interface OTBSourcingAllocation {
  engine: SourcingEngine;
  sharePct: number;
  budget: number;
  consumed: number;
  vendorCount: number;
  avgLeadTimeDays: number;
}

// ─── POD OTB ─────────────────────────────────────────────────────────

export interface OTBPodBudget {
  podId: string;
  podName: string;
  budget: number;
  consumed: number;
  utilization: number;
  maxVendorConcentration: number;
  maxVendorName: string;

  tiers: OTBTierBreakdown[];

  fashionGradeSplit: {
    core: { budget: number; consumed: number; sharePct: number };
    fashion: { budget: number; consumed: number; sharePct: number };
  };

  stores: OTBStoreBudget[];
}

// ─── Store OTB ───────────────────────────────────────────────────────

export interface OTBStoreBudget {
  storeId: string;
  storeName: string;
  storeGrade: 'A' | 'A1' | 'A2' | 'A3';
  city: string;

  aopRevenue: number;
  aopAtCost: number;
  inventoryOnHand: number;
  openPOs: number;
  safetyStock: number;

  otbBudget: number;
  otbAtRetail: number;
  consumed: number;
  utilization: number;

  garmentCapacity: number;
  plannedGarments: number;
  capacityUtilization: number;

  coverDays: number;
  coverDaysStatus: 'low' | 'ok' | 'high';

  categories: OTBStoreCategoryBudget[];
}

export interface OTBStoreCategoryBudget {
  categoryId: string;
  categoryName: string;
  otbBudget: number;
  consumed: number;
  utilization: number;
  fashionGrade: {
    core: number;
    fashion: number;
  };
}

// ─── Chase ───────────────────────────────────────────────────────────

export interface ChaseRecommendation {
  id: string;
  styleId: string;
  styleName: string;
  podId: string;
  podName: string;
  signal: ChaseSignal;
  rosMultiple: number;
  currentQty: number;
  recommendedChaseQty: number;
  chasePctIncrease: number;
  estimatedAmount: number;
  affectedStoreCount: number;
  affectedStoreIds: string[];
  priority: 'P1' | 'P2' | 'P3';
  status: 'pending' | 'approved' | 'rejected' | 'po-created';
  approvedBy: string | null;
  approvedAt: string | null;
}

export interface ChaseHistory {
  id: string;
  date: string;
  styleId: string;
  styleName: string;
  podId: string;
  amount: number;
  storeCount: number;
  approvedBy: string;
  signal: ChaseSignal;
}

// ─── Micro-Drop ──────────────────────────────────────────────────────

export interface MicroDrop {
  id: string;
  name: string;
  trigger: 'trend' | 'competitive' | 'festival' | 'weather' | 'viral';
  triggerSource: string;
  triggerDescription: string;
  podIds: string[];
  budget: number;
  consumed: number;
  styleCount: number;
  storeCount: number;
  storeFilter: string;
  targetNDay: string;
  status: 'signal' | 'approved' | 'in-production' | 'shipped' | 'in-store';
  progressSteps: MicroDropProgress[];
}

export interface MicroDropProgress {
  step: string;
  status: 'pending' | 'in-progress' | 'completed';
  completedAt: string | null;
}

export interface MicroDropSignal {
  id: string;
  name: string;
  source: string;
  relevance: 'high' | 'medium' | 'low';
  estimatedBudget: number;
  estimatedStyles: number;
  description: string;
}

// ─── OTB Line Items (Segment × Family breakdown) ────────────────────

export interface OTBLineItemEdit {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  oldValue: number;
  newValue: number;
  variancePct: number;         // % change from recommended
  requiresApproval: boolean;   // true if |variancePct| > 10
  status: 'auto-approved' | 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  reason?: string;
}

export interface OTBLineItem {
  id: string;
  podId: string;
  otbNumber: string;
  brand: string;
  brandLabel: string;
  fashionGrade: 'core' | 'fashion';
  fashionGradeLabel: string;
  hit: number; // 1–12, each corresponding to a month of the fiscal year (1=Apr, 12=Mar)
  budget: number;
  consumed: number;
  utilization: number;
  recommendedValue: number;     // system-recommended purchase value (Lakhs)
  purchaseValue: number;        // editable, defaults to recommendedValue
  editStatus: 'none' | 'pending-approval' | 'approved' | 'rejected';
  editHistory: OTBLineItemEdit[];
}

// ─── Vendor Concentration ────────────────────────────────────────────

export interface VendorConcentration {
  vendorId: string;
  vendorName: string;
  podId: string;
  poValue: number;
  sharePct: number;
  limit: number;
  headroom: number;
  status: GuardrailStatus;
}

// ─── Guardrail Summary ───────────────────────────────────────────────

export interface OTBGuardrailSummary {
  otbCap: {
    status: GuardrailStatus;
    networkUtilization: number;
    breachCount: number;
    atRiskCount: number;
  };
  vendorConcentration: {
    status: GuardrailStatus;
    maxConcentration: number;
    breachCount: number;
    atRiskCount: number;
  };
  intakeMargin: {
    status: GuardrailStatus;
    avgMargin: number;
    breachCount: number;
  };
  fashionSplit: {
    status: GuardrailStatus;
    avgCorePct: number;
    avgFashionPct: number;
    breachCount: number;
  };
  capacityCeiling: {
    status: GuardrailStatus;
    avgUtilization: number;
    breachCount: number;
    atRiskCount: number;
  };
}

// ─── Reallocation ────────────────────────────────────────────────────

export interface OTBReallocation {
  id: string;
  type: 'within-pod' | 'cross-pod' | 'cross-tier' | 'otb-increase';
  fromPodId: string;
  fromPodName: string;
  toPodId: string;
  toPodName: string;
  amount: number;
  reason: string;
  impact: string;
  approver: string;
  priority: 'high' | 'medium' | 'low';
  status: 'recommended' | 'approved' | 'rejected' | 'executed';
  recommendedBy: string;
  approvedBy: string | null;
}

// ─── Admin Config ────────────────────────────────────────────────────

export type AggregationLevel = 'sub_format_code' | 'BRAND_ID' | 'MH_SEGMENT_CD' | 'FASHION_GRADE' | 'MH_FAMILY_CD' | 'MH_CLASS_CD' | 'MH_BRICK_CD';
export type CalculationFrequency = 'Monthly' | 'Weekly' | 'Quarterly' | 'Half Yearly' | 'Yearly';
export type ExecutionMode = 'fresh' | 'refresh';

export interface OTBKPIFormula {
  kpiName: string;
  formula: string;
  category: string;
  evaluationOrder: number;
  isActive: boolean;
  description: string;
}

export interface OTBDataSource {
  sourceName: string;
  backend: 'bigquery' | 'postgresql';
  tableName: string;
  description: string;
  mergeColumns: string[];
  isActive: boolean;
}

export interface OTBConfig {
  budgetStructure: {
    preBookShare: number;
    chaseShare: number;
    microDropReserve: number;
    corePreBookChase: [number, number];
    fashionPreBookChase: [number, number];
  };
  sourcingEngines: {
    scaleMarginShare: number;
    fastResponseShare: number;
    testRepeatShare: number;
  };
  guardrails: {
    otbCap: number;
    vendorConcentrationLimit: number;
    intakeMarginFloor: number;
    pricingFloorMultiplier: number;
    chaseAutoReallocationLimit: number;
  };
  utilization: {
    greenFloor: number;
    greenCeiling: number;
    amberFloor: number;
    amberCeiling: number;
    exceptionSeverityUnder: string;
    exceptionSeverityOver: string;
  };
  chaseTriggers: {
    winnerRosThreshold: number;
    strongRosThreshold: number;
    stockoutCoverDayThreshold: number;
    chaseWindowStart: number;
    chaseWindowEnd: number;
  };
  vendorManagement: {
    consolidationTarget: number;
    top20ShareTarget: number;
    exitThreshold: number;
    scorecardFrequency: 'weekly' | 'monthly' | 'quarterly';
    newVendorOnboardingGate: boolean;
  };
  fabricRationalization: {
    activeFabricTarget: number;
    newFabricApprovalGate: boolean;
    volumeThresholdForRetention: number;
    top50FabricTargetShare: number;
  };
  buyingDiscipline: {
    defaultTestLotSize: number;
    testStoreCount: number;
    day7RedFlagThreshold: number;
    day14WinnerThreshold: number;
    day14LoserThreshold: number;
    sizeRatioTolerance: number;
    coverBreachCore: number;
    coverBreachFashion: number;
    largeLotUnprovenBlock: number;
    fashionHardStop: number;
  };
  reconciliation: {
    varianceTolerance: number;
    autoCloseThreshold: number;
    reconciliationFrequency: 'weekly' | 'bi-weekly' | 'monthly';
    includeTierBreakdown: boolean;
  };
  marginBridge: {
    intakeMarginTarget: number;
    promoDiscountCap: number;
    markdownBudget: number;
    logisticsCostCap: number;
    netGMFloor: number;
  };
  sellThroughRules: {
    day7WinnerThreshold: number;
    day7LoserThreshold: number;
    day14WinnerST: number;
    day14LoserST: number;
    autoMarkdownTriggerDays: number;
    carryoverThreshold: number;
  };
  planningSetup: {
    fiscalYearStart: number;
    currentFiscalYear: string;
    planningFrequency: 'monthly' | 'weekly' | 'quarterly' | 'half-yearly' | 'yearly';
    calculationFrequency: CalculationFrequency[];
    baseMarginPct: number;
    targetWeeksOfCover: number;
    storeFormatsInScope: number[];
    segmentsInScope: number[];
    aggregationLevels: AggregationLevel[];
    executionMode: ExecutionMode;
    inventoryAgeFilterEnabled: boolean;
    inventoryAgeMaxDays: number;
    excludeKpis: string[];
    nonNegativeKpis: string[];
    netSalesMinThreshold: number;
    hitNamesByFrequency: Record<string, string>;
  };
  calculatorEngine: {
    kpiFormulae: OTBKPIFormula[];
    dataSources: OTBDataSource[];
  };
}

// ─── Weekly Reconciliation (v2.0) ─────────────────────────────────

export interface OTBReconciliation {
  id: string;
  weekEnding: string;
  podId: string;
  categoryId: string;
  openingStock: number;
  inwardReceipts: number;
  sales: number;
  closingStock: number;
  otbBudget: number;
  cumulativePOsIssued: number;
  otbRemaining: number;
  consumptionPace: 'ahead' | 'on-track' | 'behind';
  marginBridge: {
    intakeMargin: number;
    promoDiscount: number;
    markdownImpact: number;
    logisticsCost: number;
    netGrossMargin: number;
    targetNetGM: number;
    variance: number;
  };
}

// ─── Sell-Through Triage (v2.0) ──────────────────────────────────

export type TriageClassification = 'winner' | 'size-break-salvage' | 'loser';
export type TriageCheckpoint = 'day-7' | 'day-14';

export interface SellThroughTriage {
  id: string;
  styleId: string;
  styleName: string;
  podId: string;
  checkpoint: TriageCheckpoint;
  checkpointDate: string;
  plannedSellThrough: number;
  actualSellThrough: number;
  rosVsPlan: number;
  sizeBreakdown: {
    size: string;
    sold: number;
    allocated: number;
    sellThrough: number;
    oosDate: string | null;
  }[];
  classification: TriageClassification;
  recommendedAction: string;
  estimatedChaseAmount: number | null;
  affectedStoreCount: number;
  status: 'pending-review' | 'action-taken' | 'dismissed';
}

// ─── Test Lot (v2.0) ─────────────────────────────────────────────

export interface TestLot {
  id: string;
  styleId: string;
  styleName: string;
  podId: string;
  quantity: number;
  testStoreIds: string[];
  testStoreCount: number;
  launchDate: string;
  day7Signal: 'green' | 'amber' | 'red' | null;
  day14Classification: TriageClassification | null;
  recutPOId: string | null;
  recutQuantity: number | null;
  recutSizeRatios: Record<string, number> | null;
  status: 'active' | 'winner-scaling' | 'killed' | 'completed';
}

// ─── Fashion Lifecycle (v2.0) ────────────────────────────────────

export type FashionLifecycleStage = 'a0-a1-fresh' | 'a2-a3-cascade' | 'liquidation' | 'written-off';

export interface FashionOptionLifecycle {
  optionId: string;
  optionName: string;
  podId: string;
  networkAge: number;
  currentStage: FashionLifecycleStage;
  storePositions: {
    storeId: string;
    storeAge: number;
    networkAge: number;
    currentStock: number;
    sellThrough: number;
    status: 'active' | 'transfer-pending' | 'marked-down' | 'liquidated';
    antiRotationFlag: boolean;
  }[];
  originalOTBConsumed: number;
  markdownImpact: number;
  liquidationRecovery: number;
}

// ─── Vendor Scorecard (v2.0) ─────────────────────────────────────

export interface VendorScorecard {
  vendorId: string;
  vendorName: string;
  sourcingEngine: SourcingEngine;
  deliveryOnTime: number;
  qualityScore: number;
  leadTimeDays: number;
  fabricAvailability: number;
  compositeScore: number;
  totalPOValue: number;
  activePOCount: number;
  concentrationByPod: {
    podId: string;
    podName: string;
    sharePct: number;
    status: GuardrailStatus;
  }[];
  status: 'active' | 'watch' | 'exit-candidate';
  exitReason: string | null;
}
