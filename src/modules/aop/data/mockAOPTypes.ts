// ─── AOP & Scenario Planning Types ─────────────────────────────────

export type PlanningCycle = 'annual' | 'mid-season';
export type PlanningStatus = 'draft' | 'under_review' | 'approved' | 'active' | 'superseded';
export type ScenarioType = 'what-if' | 'demand-shock' | 'aop-comparison';
export type RiskLevel = 'low' | 'medium' | 'high';
export type VarianceStatus = 'on-track' | 'warning' | 'breach';
export type StoreGrade = 'A' | 'A1' | 'A2' | 'A3';

// ─── AOP Store Plan ─────────────────────────────────────────────────

export interface AOPSegmentPlan {
  segmentId: string;
  segmentName: string;
  allocatedSFT: number;
  spsfTarget: number;
  monthlyRevenue: number;
  annualRevenue: number;
  intakeMargin: number;
  grossMargin: number;
  gmrof: number;
  efficiency: number;
  fashionSplit: {
    corePct: number;
    fashionPct: number;
  };
}

export interface ValidationIssue {
  rule: string;
  severity: 'hard-block' | 'warning';
  message: string;
  field: string;
  currentValue: number;
  threshold: number;
}

export interface AOPStorePlan {
  storeId: string;
  storeName: string;
  storeGrade: StoreGrade;
  isF1: boolean;
  region: string;
  city: string;
  carpetArea: number;
  saleableArea: number;
  totalFixtures: number;
  garmentCapacity: number;
  spsfTarget: number;
  annualRevenue: number;
  segments: AOPSegmentPlan[];
  blendedIntakeMargin: number;
  blendedDeliveredMargin: number;
  annualGM: number;
  targetTurns: number;
  targetCoverDays: number;
  optionCount: number;
  monthlyWeights: number[];
  monthlyRevenue: number[];
  priorYearRevenue: number;
  priorYearGM: number;
  priorYearSPSF: number;
  yoyGrowth: number;
  validationStatus: 'valid' | 'warning' | 'error';
  validationIssues: ValidationIssue[];
  // Intelligence context
  catchmentProfile?: string;
  competitorContext?: string;
  competitiveGap?: string;
  demandTrend?: string;
}

// ─── AOP Rollup ─────────────────────────────────────────────────────

export interface AOPCategoryRollup {
  categoryId: string;
  categoryName: string;
  storeCount: number;
  totalSFT: number;
  annualRevenue: number;
  annualGM: number;
  avgSPSF: number;
  contribution: number;
}

export interface AOPPodRollup {
  podId: string;
  podName: string;
  categories: string[];
  storeCount: number;
  totalSFT: number;
  annualRevenue: number;
  annualGM: number;
  gmPct: number;
  avgSPSF: number;
  targetTurns: number;
  status: 'on-track' | 'warning' | 'at-risk';
  sellThroughTargets: {
    day90: number;
    day120: number;
    day180: number;
  };
}

export interface AOPNetworkRollup {
  fiscalYear: string;
  planningCycle: PlanningCycle;
  storeCount: number;
  newStores: number;
  totalSFT: number;
  newSFT: number;
  annualRevenue: number;
  h1Revenue: number;
  h2Revenue: number;
  annualGM: number;
  gmPct: number;
  avgSPSF: number;
  dailyRevenue: number;
  garmentCapacity: number;
  capacityUtilization: number;
  otbEnvelope: number;
  targetTurns: number;
  targetCoverDays: number;
  pods: AOPPodRollup[];
  categories: AOPCategoryRollup[];
  monthlyRevenue: number[];
}

// ─── Scenario ───────────────────────────────────────────────────────

export interface ScenarioAssumption {
  id: string;
  category: 'growth' | 'macro' | 'competition' | 'operations' | 'weather';
  description: string;
  value: string;
  source: string;
  confidence: 'high' | 'medium' | 'low';
  actualValue?: string;
  actualStatus?: VarianceStatus;
}

export type ScenarioVariable =
  | 'store_count'
  | 'grade_reclassification'
  | 'fashion_split'
  | 'spsf_target'
  | 'margin_target'
  | 'demand_modifier'
  | 'vendor_concentration'
  | 'segment_entry'
  | 'segment_exit'
  | 'growth_rate';

export interface ModificationScope {
  level: 'network' | 'region' | 'grade' | 'store' | 'category';
  ids?: string[];
  filterGrade?: string;
  filterRegion?: string;
}

export interface ScenarioModification {
  id: string;
  variable: ScenarioVariable;
  scope: ModificationScope;
  oldValue: number | string;
  newValue: number | string;
  impactDescription: string;
}

export interface ConstraintViolation {
  constraint: string;
  severity: 'hard-block' | 'warning';
  affectedStores: number;
  description: string;
  currentValue: number;
  threshold: number;
}

export interface DownstreamImpact {
  otbEnvelope: number;
  otbDelta: number;
  rangeOptionsPerStore: number;
  rangeOptionsDelta: number;
  inventoryTurns: number;
  coverDays: number;
  capacityUtilization: number;
  storesAtRisk: number;
}

export interface Scenario {
  id: string;
  name: string;
  type: ScenarioType;
  status: PlanningStatus;
  baseScenarioId: string | null;
  fiscalYear: string;
  planningCycle: PlanningCycle;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  approvedBy: string | null;
  approvedAt: string | null;
  isRecommended: boolean;
  assumptions: ScenarioAssumption[];
  modifications: ScenarioModification[];
  networkRollup: AOPNetworkRollup;
  riskLevel: RiskLevel;
  constraintViolations: ConstraintViolation[];
  downstreamImpact: DownstreamImpact;
}

// ─── Demand Shock ───────────────────────────────────────────────────

export type DemandShockType = 'competitor_entry' | 'competitor_exit' | 'weather' | 'festival_shift' | 'macro' | 'custom';

export interface DemandShock {
  id: string;
  name: string;
  shockType: DemandShockType;
  presetId?: string;
  modifier: number;
  duration: 'permanent' | 'temporary';
  durationWeeks?: number;
  affectedStoreIds: string[];
  affectedCategories?: string[];
  startMonth: number;
  confidence: 'high' | 'medium' | 'low';
  mitigations: string[];
}

export interface DemandShockPreset {
  id: string;
  name: string;
  shockType: DemandShockType;
  defaultModifier: number;
  defaultDuration: DemandShock['duration'];
  defaultDurationWeeks?: number;
  scopeDescription: string;
}

// ─── What-if Simulation ─────────────────────────────────────────────

export interface SimulationResult {
  id: string;
  name: string;
  baseScenarioId: string;
  baseScenarioName: string;
  type: 'what-if' | 'demand-shock';
  date: string;
  parameters: Record<string, string | number>;
  impact: {
    metric: string;
    before: number | string;
    after: number | string;
    delta: string;
  }[];
}

// ─── AOP vs Actual Tracking ─────────────────────────────────────────

export interface AOPVariance {
  storeId?: string;
  storeName?: string;
  podId?: string;
  podName?: string;
  categoryId?: string;
  categoryName?: string;
  period: string;
  planned: { revenue: number; gm: number; spsf: number; turns: number };
  actual: { revenue: number; gm: number; spsf: number; turns: number };
  variance: { revenue: number; gm: number; spsf: number; turns: number };
  status: {
    revenue: VarianceStatus;
    gm: VarianceStatus;
    spsf: VarianceStatus;
    turns: VarianceStatus;
  };
}

export interface AOPVarianceTrend {
  month: string;
  planned: number;
  actual: number;
  variancePct: number;
}

// ─── Admin Configuration ────────────────────────────────────────────

export interface AOPConfig {
  planningCycle: PlanningCycle;
  fiscalYear: string;
  baseSPSFSource: 'grade_target' | 'historical_actual' | 'custom';
  growthAssumption: number;
  monthlyWeights: number[];
  intakeMarginFloor: number;
  deliveredMarginTarget: number;
  segmentMargins: { segmentId: string; segmentName: string; coreIntake: number; fashionIntake: number; blendedTarget: number }[];
  markdownBudget: number;
  shrinkageAllowance: number;
  revenueVarianceThreshold: number;
  marginVarianceThreshold: number;
  spsfFloorVariance: number;
  exceptionSeverity: 'S1' | 'S2' | 'S3' | 'S4';
  maxActiveScenarios: number;
  autoArchiveDays: number;
}
