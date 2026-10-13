import { POD_MW_P1, POD_MW_P2, POD_WIW_P1, POD_WIW_P2, POD_WWW_P3, POD_KW_P1, POD_FW_P1, POD_NA_P1 } from '@/modules/otb/data/mockOTB';

// ─── Range Architecture Types ──────────────────────────────────────────────

export type RangeStatus = 'draft' | 'review' | 'locked' | 'active';
export type CarryoverDecision = 'continue' | 'refresh' | 'exit' | 'undecided';
export type PriceTier = 'entry' | 'mid' | 'premium';
export type OptionPerformance = 'winner' | 'strong' | 'stable' | 'weak';

export interface PriceLadderAllocation {
  entry: {
    optionPct: number;
    optionCount: number;
    aspRange: { min: number; max: number };
  };
  mid: {
    optionPct: number;
    optionCount: number;
    aspRange: { min: number; max: number };
  };
  premium: {
    optionPct: number;
    optionCount: number;
    aspRange: { min: number; max: number };
  };
  blendedASP: number;
}

export interface FixtureAssignment {
  fixtureType: string;
  fixtureCount: number;
  optionCapacity: number;
  optionsAssigned: number;
  depthAssigned: number;
  utilization: number;
}

export interface SegmentRange {
  segmentId: string;
  segmentName: string;
  optionCapacity: number;
  optionsPlanned: number;
  coreOptions: number;
  fashionOptions: number;
  totalDepth: number;
  sizeSet: number;
  allocatedSFT: number;
  stockingDensity: number;
  demandIndex: number;
  competitiveGap: number;
  efficiency: number;
  priceLadder: PriceLadderAllocation;
  fixtures: FixtureAssignment[];
  otbBudget: number;
  otbConsumed: number;
}

export interface StoreRangePlan {
  storeId: string;
  storeName: string;
  storeGrade: 'A' | 'A1' | 'A2' | 'A3';
  clusterId: string;
  totalOptions: number;
  totalDepth: number;
  stockingDensity: number;
  saleableArea: number;
  otbBudget: number;
  otbConsumed: number;
  otbFitPct: number;
  totalFixtures: number;
  fixtureUtilization: number;
  segments: SegmentRange[];
}

export interface RangePlan {
  id: string;
  fiscalYear: string;
  season: string;
  podId: string;
  podName: string;
  status: RangeStatus;
  lockedAt: string | null;
  lockedBy: string | null;
  nDayDeadline: string;
  storeCount: number;
  avgOptionsPerStore: number;
  totalDepth: number;
  corePct: number;
  fashionPct: number;
  carryoverPct: number;
  newFashionPct: number;
  otbBudget: number;
  otbConsumed: number;
  otbFit: number;
}

export interface CarryoverStyle {
  styleId: string;
  styleName: string;
  subCategory: string;
  segmentId: string;
  sellThrough90d: number;
  rosTrend: 'growing' | 'stable' | 'declining' | 'sharp-decline';
  intakeMargin: number;
  revenueShare: number;
  competitorHasEquivalent: boolean;
  customerFeedback: 'positive' | 'neutral' | 'mixed' | 'negative';
  decision: CarryoverDecision;
  decisionReason: string;
  decisionBy: 'system' | 'manual';
  overriddenBy: string | null;
  storesCarrying: number;
  fixturePositions: number;
  otbImpact: number;
}

export interface OptionPerformanceData {
  styleId: string;
  styleName: string;
  segmentId: string;
  podId: string;
  fixtureType: string;
  rosActual: number;
  rosPlanned: number;
  rosMultiple: number;
  classification: OptionPerformance;
  sellThroughPct: number;
  revenueShare: number;
  revenuePerLFT: number;
  action: 'chase' | 'monitor' | 'markdown' | 'remove';
}

export interface FixturePerformanceData {
  fixtureType: string;
  avgSellThrough: number;
  revenuePerLFT: number;
  bestSegment: string;
  worstSegment: string;
  action: string;
}

// ─── Fixture Type Master ──────────────────────────────────────────────────

export interface FixtureTypeMaster {
  id: number;
  name: string;
  optionsPerFixture: number;
  sizeSet: number;
  depthPerFixture: number;
  linearFeet: number;
  displayMethod: string;
  compatibleSegments: string[];
}

export const fixtureTypeMaster: FixtureTypeMaster[] = [
  { id: 1, name: '4-Way Rack', optionsPerFixture: 4, sizeSet: 8, depthPerFixture: 32, linearFeet: 3, displayMethod: 'Face-out', compatibleSegments: ['MC', 'MF', 'WIW', 'WWW'] },
  { id: 2, name: 'Straight Rack (4ft)', optionsPerFixture: 8, sizeSet: 8, depthPerFixture: 64, linearFeet: 4, displayMethod: 'Side-hang', compatibleSegments: ['MC', 'MF', 'WWW'] },
  { id: 3, name: 'Straight Rack (6ft)', optionsPerFixture: 12, sizeSet: 8, depthPerFixture: 96, linearFeet: 6, displayMethod: 'Side-hang', compatibleSegments: ['MC', 'MF', 'WWW'] },
  { id: 4, name: 'Wall Unit (4ft)', optionsPerFixture: 10, sizeSet: 8, depthPerFixture: 80, linearFeet: 4, displayMethod: 'Shelved + Hang', compatibleSegments: ['MC', 'MF', 'WIW', 'WWW', 'KW', 'FW', 'NA'] },
  { id: 5, name: 'Wall Unit (8ft)', optionsPerFixture: 20, sizeSet: 8, depthPerFixture: 160, linearFeet: 8, displayMethod: 'Shelved + Hang', compatibleSegments: ['MC', 'MF', 'WIW', 'WWW', 'KW', 'FW', 'NA'] },
  { id: 6, name: 'Gondola (4ft)', optionsPerFixture: 8, sizeSet: 8, depthPerFixture: 64, linearFeet: 4, displayMethod: 'Both-side', compatibleSegments: ['KW', 'NA', 'FW'] },
  { id: 7, name: 'Gondola (8ft)', optionsPerFixture: 16, sizeSet: 8, depthPerFixture: 128, linearFeet: 8, displayMethod: 'Both-side', compatibleSegments: ['KW', 'NA', 'FW'] },
  { id: 8, name: 'Nested Table', optionsPerFixture: 6, sizeSet: 8, depthPerFixture: 48, linearFeet: 4, displayMethod: 'Folded stack', compatibleSegments: ['MC', 'KW'] },
  { id: 9, name: 'Display Table', optionsPerFixture: 4, sizeSet: 8, depthPerFixture: 32, linearFeet: 4, displayMethod: 'Front display', compatibleSegments: ['WWW', 'WIW'] },
  { id: 10, name: 'Mannequin Platform', optionsPerFixture: 2, sizeSet: 8, depthPerFixture: 16, linearFeet: 3, displayMethod: 'Styled look', compatibleSegments: ['MC', 'MF', 'WIW', 'WWW', 'KW', 'FW', 'NA'] },
  { id: 11, name: 'Waterfall Arm', optionsPerFixture: 3, sizeSet: 8, depthPerFixture: 24, linearFeet: 2, displayMethod: 'Cascade', compatibleSegments: ['WWW', 'WIW'] },
  { id: 12, name: 'Slatwall Panel (4ft)', optionsPerFixture: 10, sizeSet: 8, depthPerFixture: 80, linearFeet: 4, displayMethod: 'Grid display', compatibleSegments: ['NA', 'FW'] },
];

// ─── Segment Master ───────────────────────────────────────────────────────

export const segmentMaster = [
  { id: 'MC', name: "Men's Casuals", shortName: 'MC' },
  { id: 'MF', name: "Men's Formals", shortName: 'MF' },
  { id: 'WIW', name: "Women's Indian Wear", shortName: 'WIW' },
  { id: 'WWW', name: "Women's Western Wear", shortName: 'WWW' },
  { id: 'KW', name: 'Kids Wear', shortName: 'KW' },
  { id: 'FW', name: 'Footwear', shortName: 'FW' },
  { id: 'NA', name: 'Non-Apparel', shortName: 'NA' },
];

// ─── Mock Range Plans (POD-level) ──────────────────────────────────────────

export const mockRangePlans: RangePlan[] = [
  {
    id: 'rp-001',
    fiscalYear: 'FY 2026-27',
    season: 'SS26',
    podId: POD_MW_P1,
    podName: 'MW Pod 1 (Shirts)',
    status: 'locked',
    lockedAt: '2026-02-15',
    lockedBy: 'Rajesh Kumar',
    nDayDeadline: '2026-02-28',
    storeCount: 420,
    avgOptionsPerStore: 428,
    totalDepth: 1440960,
    corePct: 70,
    fashionPct: 30,
    carryoverPct: 60,
    newFashionPct: 28,
    otbBudget: 17262000000,
    otbConsumed: 16914760000,
    otbFit: 98,
  },
  {
    id: 'rp-002',
    fiscalYear: 'FY 2026-27',
    season: 'SS26',
    podId: POD_MW_P2,
    podName: 'MW Pod 2 (Trousers)',
    status: 'locked',
    lockedAt: '2026-02-18',
    lockedBy: 'Anita Sharma',
    nDayDeadline: '2026-02-28',
    storeCount: 420,
    avgOptionsPerStore: 412,
    totalDepth: 1384320,
    corePct: 72,
    fashionPct: 28,
    carryoverPct: 62,
    newFashionPct: 26,
    otbBudget: 16632000000,
    otbConsumed: 16300000000,
    otbFit: 98,
  },
  {
    id: 'rp-003',
    fiscalYear: 'FY 2026-27',
    season: 'SS26',
    podId: POD_WIW_P1,
    podName: 'WIW Pod 1 (Kurtas)',
    status: 'locked',
    lockedAt: '2026-02-20',
    lockedBy: 'Priya Menon',
    nDayDeadline: '2026-02-28',
    storeCount: 380,
    avgOptionsPerStore: 483,
    totalDepth: 1468320,
    corePct: 70,
    fashionPct: 30,
    carryoverPct: 58,
    newFashionPct: 30,
    otbBudget: 18582000000,
    otbConsumed: 18210360000,
    otbFit: 98,
  },
  {
    id: 'rp-004',
    fiscalYear: 'FY 2026-27',
    season: 'SS26',
    podId: POD_WWW_P3,
    podName: 'WWW Pod 3 (Denims)',
    status: 'review',
    lockedAt: null,
    lockedBy: null,
    nDayDeadline: '2026-03-05',
    storeCount: 350,
    avgOptionsPerStore: 380,
    totalDepth: 1064000,
    corePct: 68,
    fashionPct: 32,
    carryoverPct: 55,
    newFashionPct: 32,
    otbBudget: 13300000000,
    otbConsumed: 12768000000,
    otbFit: 96,
  },
  {
    id: 'rp-005',
    fiscalYear: 'FY 2026-27',
    season: 'SS26',
    podId: POD_FW_P1,
    podName: 'FW Pod 1 (Men\'s FW)',
    status: 'draft',
    lockedAt: null,
    lockedBy: null,
    nDayDeadline: '2026-03-08',
    storeCount: 300,
    avgOptionsPerStore: 185,
    totalDepth: 444000,
    corePct: 72,
    fashionPct: 28,
    carryoverPct: 65,
    newFashionPct: 22,
    otbBudget: 5580000000,
    otbConsumed: 5189400000,
    otbFit: 93,
  },
  {
    id: 'rp-006',
    fiscalYear: 'FY 2026-27',
    season: 'SS26',
    podId: POD_KW_P1,
    podName: 'KW Pod 1 (Kids)',
    status: 'locked',
    lockedAt: '2026-02-22',
    lockedBy: 'Deepa Nair',
    nDayDeadline: '2026-02-28',
    storeCount: 320,
    avgOptionsPerStore: 390,
    totalDepth: 998400,
    corePct: 75,
    fashionPct: 25,
    carryoverPct: 62,
    newFashionPct: 22,
    otbBudget: 9252000000,
    otbConsumed: 9067000000,
    otbFit: 98,
  },
  {
    id: 'rp-007',
    fiscalYear: 'FY 2026-27',
    season: 'SS26',
    podId: POD_NA_P1,
    podName: 'NA Pod 1 (Accessories)',
    status: 'draft',
    lockedAt: null,
    lockedBy: null,
    nDayDeadline: '2026-03-10',
    storeCount: 280,
    avgOptionsPerStore: 80,
    totalDepth: 179200,
    corePct: 80,
    fashionPct: 20,
    carryoverPct: 68,
    newFashionPct: 18,
    otbBudget: 2492000000,
    otbConsumed: 2243000000,
    otbFit: 90,
  },
  {
    id: 'rp-008',
    fiscalYear: 'FY 2026-27',
    season: 'SS26',
    podId: POD_WIW_P2,
    podName: 'WIW Pod 2 (Sarees)',
    status: 'locked',
    lockedAt: '2026-02-25',
    lockedBy: 'Kavitha Reddy',
    nDayDeadline: '2026-02-28',
    storeCount: 340,
    avgOptionsPerStore: 245,
    totalDepth: 666400,
    corePct: 72,
    fashionPct: 28,
    carryoverPct: 64,
    newFashionPct: 24,
    otbBudget: 8330000000,
    otbConsumed: 8163400000,
    otbFit: 98,
  },
];

// ─── Network Range Summary ─────────────────────────────────────────────────

export const networkRangeSummary = {
  avgOptionsPerStore: 2024,
  optionTargetFrom: 4000,
  optionTargetTo: 2000,
  optionReductionPct: 81,
  coreFashionSplit: { core: 72, fashion: 28 },
  totalDepth: 38200000,
  stockingDensity: 2.17,
  otbFit: 98.2,
  fixtureUtilization: 91,
  podsLocked: 18,
  podsTotal: 22,
};

// ─── Segment Range Summary (Network Averages) ──────────────────────────────

export const segmentRangeSummary = [
  { segmentId: 'MC', segmentName: "Men's Casuals", avgOptions: 428, corePct: 70, fashionPct: 30, priceMix: { entry: 35, mid: 45, premium: 20 }, status: 'locked' as RangeStatus },
  { segmentId: 'MF', segmentName: "Men's Formals", avgOptions: 356, corePct: 70, fashionPct: 30, priceMix: { entry: 30, mid: 45, premium: 25 }, status: 'locked' as RangeStatus },
  { segmentId: 'WIW', segmentName: "Women's Indian Wear", avgOptions: 483, corePct: 70, fashionPct: 30, priceMix: { entry: 35, mid: 45, premium: 20 }, status: 'locked' as RangeStatus },
  { segmentId: 'WWW', segmentName: "Women's Western Wear", avgOptions: 452, corePct: 68, fashionPct: 32, priceMix: { entry: 25, mid: 45, premium: 30 }, status: 'locked' as RangeStatus },
  { segmentId: 'KW', segmentName: 'Kids Wear', avgOptions: 390, corePct: 75, fashionPct: 25, priceMix: { entry: 40, mid: 45, premium: 15 }, status: 'locked' as RangeStatus },
  { segmentId: 'FW', segmentName: 'Footwear', avgOptions: 185, corePct: 72, fashionPct: 28, priceMix: { entry: 35, mid: 45, premium: 20 }, status: 'draft' as RangeStatus },
  { segmentId: 'NA', segmentName: 'Non-Apparel', avgOptions: 80, corePct: 80, fashionPct: 20, priceMix: { entry: 45, mid: 40, premium: 15 }, status: 'draft' as RangeStatus },
];
