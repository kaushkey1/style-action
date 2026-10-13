import type { Scenario, DemandShock, SimulationResult, AOPNetworkRollup, AOPPodRollup, AOPCategoryRollup } from '@/modules/aop/data/mockAOPTypes';
import { POD_MW_P1, POD_MW_P2, POD_MW_P3, POD_WIW_P1, POD_WWW_P3, POD_KW_P1, POD_FW_P1, POD_NA_P1 } from '@/modules/otb/data/mockOTB';

// ─── Scenario UUIDs ─────────────────────────────────────────────────
export const SCENARIO_CONSERVATIVE_ID = 'a4f1b2c3-d4e5-4a6b-87c8-d9e0f1a2b3c4';
export const SCENARIO_MODERATE_ID     = 'b5a2c3d4-e5f6-4b7c-98d9-e0f1a2b3c4d5';
export const SCENARIO_AGGRESSIVE_ID   = 'c6b3d4e5-f6a7-4c8d-09e0-f1a2b3c4d5e6';

// ─── Helper: build PODs ─────────────────────────────────────────────

function makePods(multiplier: number): AOPPodRollup[] {
  const base = [
    { podId: POD_MW_P1, podName: 'Menswear Pod 1 (Shirts)', cats: ['MC'], stores: 420, sft: 185000, rev: 1665, gm: 53.5, spsf: 750, status: 'on-track' as const },
    { podId: POD_MW_P2, podName: 'Menswear Pod 2 (Trousers)', cats: ['MF'], stores: 420, sft: 165000, rev: 1423, gm: 54.0, spsf: 720, status: 'on-track' as const },
    { podId: POD_MW_P3, podName: 'Menswear Pod 3 (T-Shirts)', cats: ['MC'], stores: 400, sft: 120000, rev: 984, gm: 52.8, spsf: 685, status: 'on-track' as const },
    { podId: POD_WIW_P1, podName: "Women's IW Pod 1 (Kurtas)", cats: ['WIW'], stores: 380, sft: 140000, rev: 892, gm: 56.2, spsf: 810, status: 'on-track' as const },
    { podId: POD_WWW_P3, podName: "Women's WW Pod 3 (Denims)", cats: ['WWW'], stores: 380, sft: 98000, rev: 735, gm: 52.2, spsf: 625, status: 'warning' as const },
    { podId: POD_KW_P1, podName: 'Kidswear Pod 1 (Boys)', cats: ['KW'], stores: 350, sft: 95000, rev: 612, gm: 55.2, spsf: 590, status: 'on-track' as const },
    { podId: POD_FW_P1, podName: 'Footwear Pod 1', cats: ['FW'], stores: 320, sft: 88000, rev: 548, gm: 51.0, spsf: 540, status: 'on-track' as const },
    { podId: POD_NA_P1, podName: 'Non-Apparel Pod 1', cats: ['NA'], stores: 280, sft: 72000, rev: 421, gm: 48.0, spsf: 480, status: 'on-track' as const },
  ];

  return base.map((p) => ({
    podId: p.podId,
    podName: p.podName,
    categories: p.cats,
    storeCount: Math.round(p.stores * multiplier),
    totalSFT: Math.round(p.sft * multiplier),
    annualRevenue: Math.round(p.rev * multiplier),
    annualGM: Math.round(p.rev * multiplier * p.gm / 100),
    gmPct: p.gm,
    avgSPSF: p.spsf,
    targetTurns: 6.0,
    status: p.status,
    sellThroughTargets: { day90: 75, day120: 90, day180: 100 },
  }));
}

function makeCategories(multiplier: number): AOPCategoryRollup[] {
  const cats = [
    { id: 'MC', name: "Men's Casuals", stores: 420, sft: 260000, rev: 2400, gm: 1284 },
    { id: 'MF', name: "Men's Formals", stores: 420, sft: 165000, rev: 1423, gm: 776 },
    { id: 'WIW', name: "Women's Indian Wear", stores: 380, sft: 190000, rev: 1350, gm: 759 },
    { id: 'WWW', name: "Women's Western Wear", stores: 380, sft: 175000, rev: 1250, gm: 653 },
    { id: 'KW', name: 'Kids Wear', stores: 350, sft: 145000, rev: 980, gm: 541 },
    { id: 'FW', name: 'Footwear', stores: 320, sft: 130000, rev: 850, gm: 434 },
    { id: 'NA', name: 'Non-Apparel', stores: 280, sft: 95000, rev: 620, gm: 298 },
  ];
  const totalRev = cats.reduce((s, c) => s + c.rev, 0) * multiplier;
  return cats.map((c) => ({
    categoryId: c.id,
    categoryName: c.name,
    storeCount: Math.round(c.stores * multiplier),
    totalSFT: Math.round(c.sft * multiplier),
    annualRevenue: Math.round(c.rev * multiplier),
    annualGM: Math.round(c.gm * multiplier),
    avgSPSF: Math.round((c.rev * multiplier * 10000000) / (c.sft * multiplier)),
    contribution: Math.round((c.rev * multiplier / totalRev) * 1000) / 10,
  }));
}

function makeMonthlyRevenue(annual: number): number[] {
  const weights = [7, 6, 5, 6, 7, 8, 12, 10, 9, 8, 7, 15];
  return weights.map((w) => Math.round(annual * w / 100));
}

// ─── Network Rollups ────────────────────────────────────────────────

const conservativeRollup: AOPNetworkRollup = {
  fiscalYear: 'FY 2026-27',
  planningCycle: 'annual',
  storeCount: 1985,
  newStores: -15,
  totalSFT: 1550000,
  newSFT: -50000,
  annualRevenue: 10400,
  h1Revenue: 4680,
  h2Revenue: 5720,
  annualGM: 4576,
  gmPct: 44.0,
  avgSPSF: 671,
  dailyRevenue: 28.5,
  garmentCapacity: 13200000,
  capacityUtilization: 88,
  otbEnvelope: 5800,
  targetTurns: 5.5,
  targetCoverDays: 36,
  pods: makePods(0.95),
  categories: makeCategories(0.95),
  monthlyRevenue: makeMonthlyRevenue(10400),
};

const moderateRollup: AOPNetworkRollup = {
  fiscalYear: 'FY 2026-27',
  planningCycle: 'annual',
  storeCount: 2025,
  newStores: 25,
  totalSFT: 1610000,
  newSFT: 40000,
  annualRevenue: 10950,
  h1Revenue: 4927,
  h2Revenue: 6023,
  annualGM: 4599,
  gmPct: 42.0,
  avgSPSF: 680,
  dailyRevenue: 30,
  garmentCapacity: 14300000,
  capacityUtilization: 95,
  otbEnvelope: 6450,
  targetTurns: 6.0,
  targetCoverDays: 33,
  pods: makePods(1.0),
  categories: makeCategories(1.0),
  monthlyRevenue: makeMonthlyRevenue(10950),
};

const aggressiveRollup: AOPNetworkRollup = {
  fiscalYear: 'FY 2026-27',
  planningCycle: 'annual',
  storeCount: 2050,
  newStores: 50,
  totalSFT: 1680000,
  newSFT: 80000,
  annualRevenue: 11700,
  h1Revenue: 5265,
  h2Revenue: 6435,
  annualGM: 4680,
  gmPct: 40.0,
  avgSPSF: 696,
  dailyRevenue: 32,
  garmentCapacity: 15500000,
  capacityUtilization: 103,
  otbEnvelope: 7200,
  targetTurns: 6.5,
  targetCoverDays: 30,
  pods: makePods(1.07),
  categories: makeCategories(1.07),
  monthlyRevenue: makeMonthlyRevenue(11700),
};

// ─── Scenarios ──────────────────────────────────────────────────────

export const mockScenarios: Scenario[] = [
  {
    id: SCENARIO_CONSERVATIVE_ID,
    name: 'Conservative',
    type: 'aop-comparison',
    status: 'under_review',
    baseScenarioId: null,
    fiscalYear: 'FY 2026-27',
    planningCycle: 'annual',
    createdAt: '2026-02-15T10:00:00Z',
    updatedAt: '2026-02-28T14:30:00Z',
    createdBy: 'Planning Team',
    approvedBy: null,
    approvedAt: null,
    isRecommended: false,
    assumptions: [
      { id: 'ca-1', category: 'growth', description: 'YoY growth rate', value: '+4%', source: 'Cautious estimate', confidence: 'high' },
      { id: 'ca-2', category: 'macro', description: 'Consumer sentiment', value: 'Stable', source: 'RBI consumer confidence index', confidence: 'medium' },
      { id: 'ca-3', category: 'competition', description: 'Competitor activity', value: 'Status quo', source: 'Market intelligence', confidence: 'medium' },
      { id: 'ca-4', category: 'operations', description: 'New store openings', value: '0 (15 closures)', source: 'Real estate team', confidence: 'high' },
      { id: 'ca-5', category: 'operations', description: 'Fabric cost inflation', value: '+4%', source: 'Vendor quotes Q4', confidence: 'high' },
      { id: 'ca-6', category: 'weather', description: 'Monsoon timing', value: 'Normal', source: 'IMD forecast', confidence: 'medium' },
    ],
    modifications: [
      { id: 'cm-1', variable: 'store_count', scope: { level: 'grade', filterGrade: 'A3' }, oldValue: 2000, newValue: 1985, impactDescription: 'Close 15 underperforming A3 stores' },
      { id: 'cm-2', variable: 'growth_rate', scope: { level: 'network' }, oldValue: 8, newValue: 4, impactDescription: 'Reduce growth target to conservative +4%' },
      { id: 'cm-3', variable: 'margin_target', scope: { level: 'network' }, oldValue: 42, newValue: 44, impactDescription: 'Increase margin target to 44% delivered' },
    ],
    networkRollup: conservativeRollup,
    riskLevel: 'low',
    constraintViolations: [],
    downstreamImpact: {
      otbEnvelope: 5800,
      otbDelta: -650,
      rangeOptionsPerStore: 1800,
      rangeOptionsDelta: -200,
      inventoryTurns: 5.5,
      coverDays: 36,
      capacityUtilization: 88,
      storesAtRisk: 12,
    },
  },
  {
    id: SCENARIO_MODERATE_ID,
    name: 'Moderate (Base)',
    type: 'aop-comparison',
    status: 'under_review',
    baseScenarioId: null,
    fiscalYear: 'FY 2026-27',
    planningCycle: 'annual',
    createdAt: '2026-02-15T10:00:00Z',
    updatedAt: '2026-02-28T16:00:00Z',
    createdBy: 'Planning Team',
    approvedBy: null,
    approvedAt: null,
    isRecommended: true,
    assumptions: [
      { id: 'ma-1', category: 'growth', description: 'YoY growth rate', value: '+8%', source: 'Business Head directive', confidence: 'high' },
      { id: 'ma-2', category: 'macro', description: 'Consumer sentiment', value: 'Stable', source: 'RBI consumer confidence index', confidence: 'medium' },
      { id: 'ma-3', category: 'competition', description: 'Competitor activity', value: 'Minor entry', source: 'Market intelligence', confidence: 'medium' },
      { id: 'ma-4', category: 'operations', description: 'New store openings', value: '25 by Q2', source: 'Real estate pipeline confirmed', confidence: 'medium' },
      { id: 'ma-5', category: 'operations', description: 'Fabric cost inflation', value: '+4%', source: 'Vendor quotes Q4', confidence: 'high' },
      { id: 'ma-6', category: 'weather', description: 'Monsoon timing', value: 'Normal (Jun 15-Sep 15)', source: 'IMD forecast', confidence: 'medium' },
      { id: 'ma-7', category: 'operations', description: 'Festival calendar', value: 'Diwali Oct 20, Navratri Oct 2-11', source: 'Fixed', confidence: 'high' },
    ],
    modifications: [],
    networkRollup: moderateRollup,
    riskLevel: 'medium',
    constraintViolations: [],
    downstreamImpact: {
      otbEnvelope: 6450,
      otbDelta: 0,
      rangeOptionsPerStore: 2000,
      rangeOptionsDelta: 0,
      inventoryTurns: 6.0,
      coverDays: 33,
      capacityUtilization: 95,
      storesAtRisk: 28,
    },
  },
  {
    id: SCENARIO_AGGRESSIVE_ID,
    name: 'Aggressive',
    type: 'aop-comparison',
    status: 'under_review',
    baseScenarioId: null,
    fiscalYear: 'FY 2026-27',
    planningCycle: 'annual',
    createdAt: '2026-02-15T10:00:00Z',
    updatedAt: '2026-02-28T18:00:00Z',
    createdBy: 'Planning Team',
    approvedBy: null,
    approvedAt: null,
    isRecommended: false,
    assumptions: [
      { id: 'aa-1', category: 'growth', description: 'YoY growth rate', value: '+12%', source: 'Stretch target', confidence: 'low' },
      { id: 'aa-2', category: 'macro', description: 'Consumer sentiment', value: 'Improving', source: 'Optimistic outlook', confidence: 'low' },
      { id: 'aa-3', category: 'competition', description: 'Competitor activity', value: 'Major entry', source: 'Market intelligence', confidence: 'medium' },
      { id: 'aa-4', category: 'operations', description: 'New store openings', value: '50', source: 'Accelerated pipeline', confidence: 'low' },
      { id: 'aa-5', category: 'operations', description: 'Fabric cost inflation', value: '+6%', source: 'Elevated demand scenario', confidence: 'medium' },
      { id: 'aa-6', category: 'weather', description: 'Monsoon timing', value: 'Normal', source: 'IMD forecast', confidence: 'medium' },
    ],
    modifications: [
      { id: 'am-1', variable: 'store_count', scope: { level: 'network' }, oldValue: 2000, newValue: 2050, impactDescription: 'Open 50 new stores across all grades' },
      { id: 'am-2', variable: 'growth_rate', scope: { level: 'network' }, oldValue: 8, newValue: 12, impactDescription: 'Aggressive +12% growth target' },
      { id: 'am-3', variable: 'fashion_split', scope: { level: 'network' }, oldValue: '70/30', newValue: '65/35', impactDescription: 'Shift fashion split to 65/35' },
      { id: 'am-4', variable: 'margin_target', scope: { level: 'network' }, oldValue: 42, newValue: 40, impactDescription: 'Accept lower margin at 40% delivered' },
    ],
    networkRollup: aggressiveRollup,
    riskLevel: 'high',
    constraintViolations: [
      { constraint: 'capacity_ceiling', severity: 'hard-block', affectedStores: 23, description: 'Garment capacity exceeds 15M ceiling at 15.5M', currentValue: 15500000, threshold: 15000000 },
      { constraint: 'fashion_split', severity: 'hard-block', affectedStores: 2050, description: 'Fashion split 65/35 violates 70/30 mandate', currentValue: 35, threshold: 30 },
      { constraint: 'margin_floor', severity: 'warning', affectedStores: 47, description: '47 stores projected below 42% delivered margin', currentValue: 40, threshold: 42 },
    ],
    downstreamImpact: {
      otbEnvelope: 7200,
      otbDelta: 750,
      rangeOptionsPerStore: 2200,
      rangeOptionsDelta: 200,
      inventoryTurns: 6.5,
      coverDays: 30,
      capacityUtilization: 103,
      storesAtRisk: 47,
    },
  },
];

// ─── Demand Shocks ──────────────────────────────────────────────────
// affectedStoreIds use canonical UUIDs from canonicalStores.ts

export const mockDemandShocks: DemandShock[] = [
  {
    id: 'ds-1',
    name: 'H&M Competitor Entry — Mumbai',
    shockType: 'competitor_entry',
    presetId: 'dsp-2',
    modifier: -15,
    duration: 'permanent',
    affectedStoreIds: [
      '7c4b2e6f-893d-4b2a-a7e5-2f8a4d6b0c3e', // Infinity Mall Malad
      '15c3f7a9-0b4e-4c3b-98f6-3a9b5e7c1d4f', // Phoenix Marketcity Kurla
      '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a', // Phoenix Marketcity Pune
      '1fa3d7e9-0f4c-4a3f-b8d6-3e9f5c7a1b4d', // City Centre Nashik
      '2ab4e8f0-1a5d-4b4a-89e7-4f0a6d8b2c5e', // Crystal Mall Rajkot
    ],
    startMonth: 8,
    confidence: 'medium',
    mitigations: [
      'Increase fashion allocation in affected stores (+5% fashion split)',
      'Accelerate VM refresh cycle (from 30d to 21d)',
      'Reallocate ₹15 Cr OTB from affected stores to high-growth stores',
      'Launch targeted marketing campaigns in overlapping catchments',
    ],
  },
  {
    id: 'ds-2',
    name: 'Early Monsoon — South India',
    shockType: 'weather',
    presetId: 'dsp-4',
    modifier: -25,
    duration: 'temporary',
    durationWeeks: 4,
    affectedStoreIds: [
      '6ed4a8b0-1c5f-4340-a9a7-4b0c6f8d2e53', // Forum Koramangala
      '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75', // Express Avenue Chennai
      'e6f2c6d8-9e3b-4110-a7c5-2d8e4b6f0adb', // Centre Square Kochi
      '7fe5b9c1-2d6a-4450-b0b8-5c1d7a9e3f64', // GT World Mall Bangalore
      'c4d0a4b6-7c1f-4900-a5a3-0b6c2f4d8eb9', // Pavilion Mall Hyderabad
    ],
    affectedCategories: ['FW', 'WWW'],
    startMonth: 6,
    confidence: 'medium',
    mitigations: [
      'Pull forward monsoon-resistant categories (rainwear, waterproof footwear)',
      'Delay markdowns on summer stock by 2 weeks',
      'Increase digital marketing in affected regions',
    ],
  },
  {
    id: 'ds-3',
    name: 'Diwali Timing Shift (+2 weeks)',
    shockType: 'festival_shift',
    presetId: 'dsp-5',
    modifier: -8,
    duration: 'temporary',
    durationWeeks: 4,
    affectedStoreIds: [],
    startMonth: 10,
    confidence: 'high',
    mitigations: [
      'Shift Oct revenue -8% to Nov +10% in seasonal phasing',
      'Delay festive range arrival by 1 week',
      'Extend festive VM window by 5 days',
    ],
  },
  {
    id: 'ds-4',
    name: 'Macro Slowdown — Consumer Sentiment Drop',
    shockType: 'macro',
    presetId: 'dsp-6',
    modifier: -5,
    duration: 'temporary',
    durationWeeks: 26,
    affectedStoreIds: [],
    startMonth: 7,
    confidence: 'low',
    mitigations: [
      'Increase value proposition in marketing',
      'Shift OTB toward core/replenishment (lower risk)',
      'Tighten markdowns and protect margin',
      'Focus on high-footfall locations',
    ],
  },
];

// ─── Recent Simulations ─────────────────────────────────────────────

export const mockSimulationResults: SimulationResult[] = [
  {
    id: 'sim-1',
    name: 'Close 10 A3 stores',
    baseScenarioId: SCENARIO_MODERATE_ID,
    baseScenarioName: 'Moderate',
    type: 'what-if',
    date: '2026-02-28',
    parameters: { variable: 'store_count', action: 'close', count: 10, grade: 'A3' },
    impact: [
      { metric: 'Store Count', before: 2025, after: 2015, delta: '−10' },
      { metric: 'Revenue', before: '₹10,950 Cr', after: '₹10,868 Cr', delta: '−₹82 Cr' },
      { metric: 'Avg SPSF', before: '₹680', after: '₹692', delta: '+₹12 (+1.8%)' },
    ],
  },
  {
    id: 'sim-2',
    name: 'Upgrade 15 A2→A1',
    baseScenarioId: SCENARIO_MODERATE_ID,
    baseScenarioName: 'Moderate',
    type: 'what-if',
    date: '2026-02-27',
    parameters: { variable: 'grade_reclassification', from: 'A2', to: 'A1', count: 15 },
    impact: [
      { metric: 'Revenue', before: '₹10,950 Cr', after: '₹11,077 Cr', delta: '+₹127 Cr' },
      { metric: 'OTB Envelope', before: '₹6,450 Cr', after: '₹6,577 Cr', delta: '+₹127 Cr' },
    ],
  },
  {
    id: 'sim-3',
    name: 'Competitor entry Mumbai (5 stores)',
    baseScenarioId: SCENARIO_MODERATE_ID,
    baseScenarioName: 'Moderate',
    type: 'demand-shock',
    date: '2026-02-25',
    parameters: { competitor: 'H&M', locations: 'Mumbai', modifier: -15 },
    impact: [
      { metric: 'Revenue', before: '₹10,950 Cr', after: '₹10,905 Cr', delta: '−₹45 Cr' },
      { metric: 'Affected Stores', before: 0, after: 12, delta: '12 stores impacted' },
    ],
  },
  {
    id: 'sim-4',
    name: 'Shift fashion split to 65/35',
    baseScenarioId: SCENARIO_AGGRESSIVE_ID,
    baseScenarioName: 'Aggressive',
    type: 'what-if',
    date: '2026-02-24',
    parameters: { variable: 'fashion_split', oldSplit: '70/30', newSplit: '65/35' },
    impact: [
      { metric: 'OTB Envelope', before: '₹6,860 Cr', after: '₹7,200 Cr', delta: '+₹340 Cr' },
      { metric: 'Constraint Violations', before: 0, after: 2, delta: '+2 (fashion split, capacity)' },
    ],
  },
  {
    id: 'sim-5',
    name: 'Add Women\'s Active (50 stores)',
    baseScenarioId: SCENARIO_MODERATE_ID,
    baseScenarioName: 'Moderate',
    type: 'what-if',
    date: '2026-02-22',
    parameters: { variable: 'segment_entry', segment: "Women's Active", stores: 50 },
    impact: [
      { metric: 'Revenue', before: '₹10,950 Cr', after: '₹11,018 Cr', delta: '+₹68 Cr' },
      { metric: 'Incremental OTB', before: '—', after: '₹68 Cr', delta: 'New category OTB' },
    ],
  },
];
