// ── Space Planning Mock Data ──
// Aligned with Operating Model: Store Capacity & Allocation, Execution Document v2.0

import { pickRealStoreName } from './realStoreNames';

// ── Types ──

export type StoreGradeOM = 'A' | 'A1' | 'A2' | 'A3';
export type DisplayMethod =
  | 'Face-out'
  | 'Side-hang'
  | 'Shelved + Hang'
  | 'Both-side'
  | 'Folded stack'
  | 'Front display'
  | 'Styled look'
  | 'Cascade'
  | 'Grid display';

export interface FixtureTypeOM {
  id: string;
  name: string;
  code: string;
  category: 'Wall' | 'Floor' | 'Island';
  optionCapacity: number;
  sizeSet: number;
  quantityPerFixture: number; // optionCapacity × sizeSet
  linearFeet: number;
  depthFeet: number;          // front-to-back depth
  areaSqft: number;           // linearFeet × depthFeet = floor footprint
  displayMethod: DisplayMethod;
  status: 'Active' | 'Inactive';
}

export interface SpaceNormStandard {
  id: string;
  rule: string;
  value: number;
  unit: string;
  purpose: string;
}

export interface SPSFTarget {
  grade: StoreGradeOM;
  label: string;
  current: number;
  target: number;
  stretch: number;
  floor: number;
}

export interface GMROFThreshold {
  id: string;
  name: string;
  description: string;
  value: string;
}

export interface FashionGradeRule {
  grade: string;
  targetRange: string;
  targetMin: number;
  targetMax: number;
  stockCover: string;
  replenishmentType: string;
}

export interface CompetitorEntry {
  name: string;
  distance: string;
  type: 'Direct' | 'Adjacent';
}

export interface StoreSpaceProfile {
  storeId: string;
  storeName: string;
  city: string;
  zone: 'West' | 'North' | 'South' | 'East';
  cluster: string; // e.g., 'Mumbai Metro', 'Delhi NCR'
  format: 'Trends' | 'Yousta' | 'Fashion Factory' | 'AZORTE';
  latitude: number;
  longitude: number;
  grade: StoreGradeOM;
  carpetArea: number;
  saleableArea: number;
  saleableRatio: number;
  deductions: {
    decompression: number;
    mainAisles: number;
    trialRooms: number;
    cashCounters: number;
    stockroomStaff: number;
  };
  totalFixtures: number;
  optionCapacity: number;
  garmentCapacity: number;
  spsf: number;
  gmrof: number;
  aopTargetCr: number;
  aopRunRateCr: number;
  fixtureUtilization: number;
  underperformingFixtures: number;
  competitors: CompetitorEntry[];
  competitiveInsight: string;
  hit: string;
  planStatus: 'draft' | 'under-review' | 'locked' | 'active' | 'superseded';
  planVersion: string;
  planLockedBy?: string;
  planLockedAt?: string;
}

export interface GradeSegmentBenchmark {
  grade: StoreGradeOM;
  segmentCode: string;
  benchmarkSpacePercent: number;
  benchmarkGmrof: number;
}

export interface StoreDiagnostic {
  storeId: string;
  reasons: string[];
}

export interface SegmentAllocation {
  segment: string;
  segmentCode: string;
  sft: number;
  spacePercent: number;
  nsvPercent: number;
  efficiency: number;
  gmrof: number;
  fixtures: number;
  options: number;
  garments: number;
}

export interface StoreSegmentData {
  storeId: string;
  segments: SegmentAllocation[];
}

// ── Segment Trend Data (6-hit historical performance) ──

export interface SegmentTrendPoint {
  hit: string;           // H1–H6
  storeSpsf: number;     // store-level SPSF that hit
  segments: {
    segmentCode: string;
    segment: string;
    efficiency: number;
    gmrof: number;
    spacePercent: number;
    nsvPercent: number;
  }[];
}

const SEGMENT_META: { code: string; name: string }[] = [
  { code: 'MC', name: 'Menswear Casual' },
  { code: 'MF', name: 'Menswear Formal' },
  { code: 'WIW', name: 'Women Indian Wear' },
  { code: 'WWW', name: 'Women Western Wear' },
  { code: 'KW', name: 'Kidswear' },
];

/** Generate 6-hit segment trend for a store using deterministic seeding */
export function getStoreSegmentTrend(storeId: string, currentSegments: SegmentAllocation[], currentSpsf: number): SegmentTrendPoint[] {
  // Simple hash for deterministic variation
  let h = 0;
  for (let i = 0; i < storeId.length; i++) h = ((h << 5) - h + storeId.charCodeAt(i)) | 0;
  const seed = (offset: number) => {
    const x = Math.sin(h + offset) * 10000;
    return x - Math.floor(x); // 0-1
  };

  const hits = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
  const result: SegmentTrendPoint[] = [];

  for (let hitIdx = 0; hitIdx < 6; hitIdx++) {
    // Store SPSF grows over time — H1 is ~85-92% of current, H6 is current
    const growthFactor = 0.85 + (hitIdx / 5) * (0.15 + seed(hitIdx * 100) * 0.05);
    const storeSpsf = Math.round(currentSpsf * growthFactor);

    const segments = SEGMENT_META.map((meta, segIdx) => {
      const currentSeg = currentSegments.find(s => s.segmentCode === meta.code);
      if (!currentSeg) {
        return { segmentCode: meta.code, segment: meta.name, efficiency: 1.0, gmrof: 350, spacePercent: 20, nsvPercent: 20 };
      }

      // Efficiency evolves toward current value — earlier hits had different efficiency
      const effVariation = (seed(hitIdx * 10 + segIdx * 7) - 0.5) * 0.15;
      const progressToNow = hitIdx / 5;
      const baseEff = currentSeg.efficiency + (seed(segIdx * 3) - 0.5) * 0.25; // historical starting point
      const eff = Math.round((baseEff * (1 - progressToNow) + currentSeg.efficiency * progressToNow + effVariation) * 100) / 100;

      // Space % drifts slightly — reallocations happen every 2-3 hits
      const spDrift = (seed(hitIdx * 5 + segIdx * 11) - 0.5) * 3;
      const sp = Math.round((currentSeg.spacePercent + spDrift * (1 - progressToNow)) * 10) / 10;
      const nsv = Math.round(sp * eff * 10) / 10;

      // GMROF evolves with store growth
      const gmrof = Math.round(currentSeg.gmrof * growthFactor * (0.95 + seed(hitIdx + segIdx * 13) * 0.1));

      return { segmentCode: meta.code, segment: meta.name, efficiency: eff, gmrof, spacePercent: sp, nsvPercent: nsv };
    });

    result.push({ hit: hits[hitIdx]!, storeSpsf, segments });
  }

  return result;
}

// ── Fixture Type Master (12 operating model fixtures) ──

export const fixtureTypesOM: FixtureTypeOM[] = [
  { id: 'ft-om-01', name: 'Nesting Table', code: 'NT', category: 'Island', optionCapacity: 6, sizeSet: 8, quantityPerFixture: 48, linearFeet: 4, depthFeet: 3, areaSqft: 12, displayMethod: 'Folded stack', status: 'Active' },
  { id: 'ft-om-02', name: 'Glass Table', code: 'GT', category: 'Island', optionCapacity: 4, sizeSet: 8, quantityPerFixture: 32, linearFeet: 4, depthFeet: 2.5, areaSqft: 10, displayMethod: 'Front display', status: 'Active' },
  { id: 'ft-om-03', name: 'Wall Panels', code: 'WP', category: 'Wall', optionCapacity: 10, sizeSet: 8, quantityPerFixture: 80, linearFeet: 4, depthFeet: 1.5, areaSqft: 6, displayMethod: 'Shelved + Hang', status: 'Active' },
  { id: 'ft-om-04', name: 'Arail', code: 'AR', category: 'Floor', optionCapacity: 8, sizeSet: 8, quantityPerFixture: 64, linearFeet: 4, depthFeet: 2, areaSqft: 8, displayMethod: 'Side-hang', status: 'Active' },
  { id: 'ft-om-05', name: '4-Way', code: '4W', category: 'Floor', optionCapacity: 4, sizeSet: 8, quantityPerFixture: 32, linearFeet: 3, depthFeet: 3, areaSqft: 9, displayMethod: 'Face-out', status: 'Active' },
  { id: 'ft-om-06', name: 'H-Gondola', code: 'HG', category: 'Island', optionCapacity: 8, sizeSet: 8, quantityPerFixture: 64, linearFeet: 4, depthFeet: 3, areaSqft: 12, displayMethod: 'Both-side', status: 'Active' },
];

// ── Space Norm Standards ──

export const spaceNormStandards: SpaceNormStandard[] = [
  { id: 'sn-01', rule: 'Between Fixtures', value: 900, unit: 'mm', purpose: 'Customer browse space' },
  { id: 'sn-02', rule: 'Between Units', value: 450, unit: 'mm', purpose: 'Merchandiser access' },
  { id: 'sn-03', rule: 'Main Aisle Width', value: 1200, unit: 'mm', purpose: 'Primary traffic flow' },
  { id: 'sn-04', rule: 'Entry Decompression Zone', value: 1800, unit: 'mm', purpose: 'Transition from outside' },
  { id: 'sn-05', rule: 'Saleable Area Ratio', value: 65, unit: '%', purpose: 'Net selling area / carpet area' },
];

// ── SPSF Targets by Store Grade ──

export const spsfTargets: SPSFTarget[] = [
  { grade: 'A', label: 'A (HSHP)', current: 861, target: 900, stretch: 950, floor: 775 },
  { grade: 'A1', label: 'A1 (HSLP)', current: 714, target: 770, stretch: 820, floor: 640 },
  { grade: 'A2', label: 'A2 (LSHP)', current: 508, target: 560, stretch: 620, floor: 450 },
  { grade: 'A3', label: 'A3 (LSLP)', current: 383, target: 430, stretch: 480, floor: 340 },
];

// ── GMROF Thresholds ──

export const gmrofThresholds: GMROFThreshold[] = [
  { id: 'gt-01', name: 'Module Rebalance Trigger', description: 'Brand GMROF exceeds module average by', value: '1.2×' },
  { id: 'gt-02', name: 'Segment Expansion Trigger', description: 'Segment GMROF exceeds store average for consecutive months', value: '>15%, 2 months' },
  { id: 'gt-03', name: 'External Brand Exit Threshold', description: 'Brand GMROF below segment average for consecutive quarters', value: '<70%, 2 quarters' },
  { id: 'gt-04', name: 'External Brand Mix Floor', description: 'Min % of store options from external brands', value: '15%' },
  { id: 'gt-05', name: 'External Brand Mix Ceiling', description: 'Max % of store options from external brands', value: '40%' },
];

// ── Fashion Grade Split Rules ──

export const fashionGradeRules: FashionGradeRule[] = [
  { grade: 'APL-Core', targetRange: '45–50%', targetMin: 45, targetMax: 50, stockCover: '30 days', replenishmentType: 'Auto-replenish' },
  { grade: 'APL-Ultimate', targetRange: '20–25%', targetMin: 20, targetMax: 25, stockCover: '30 days', replenishmentType: 'Auto-replenish' },
  { grade: 'APL-Fashion', targetRange: '15–20%', targetMin: 15, targetMax: 20, stockCover: '60-day window', replenishmentType: 'One-time buy' },
  { grade: 'APL-Fast Fashion', targetRange: '5–10%', targetMin: 5, targetMax: 10, stockCover: '45-day window', replenishmentType: 'One-time buy' },
];

// ── Store Space Profiles (keyed by store ID from unified-planning.store) ──

export const storeSpaceProfiles: StoreSpaceProfile[] = [
  {
    storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d',
    storeName: 'Phoenix Palladium', city: 'Mumbai', zone: 'West', cluster: 'Mumbai Metro', format: 'Trends', grade: 'A',
    latitude: 19.0760, longitude: 72.8777,
    carpetArea: 12938, saleableArea: 8450, saleableRatio: 65.3,
    deductions: { decompression: 420, mainAisles: 1680, trialRooms: 580, cashCounters: 340, stockroomStaff: 1468 },
    totalFixtures: 142, optionCapacity: 2024, garmentCapacity: 21682,
    spsf: 861, gmrof: 387,
    aopTargetCr: 7.28, aopRunRateCr: 7.28, fixtureUtilization: 82, underperformingFixtures: 8,
    competitors: [{ name: 'Zara', distance: '0.2 km', type: 'Direct' }, { name: 'H&M', distance: '0.3 km', type: 'Direct' }, { name: 'Westside', distance: '0.5 km', type: 'Adjacent' }],
    competitiveInsight: 'Premium mall with strong international fast-fashion presence. Differentiate via WIW depth and curated EB mix.',
    hit: 'H4', planStatus: 'under-review', planVersion: 'v2.1',
  },
  {
    storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b',
    storeName: 'Select Citywalk', city: 'Delhi', zone: 'North', cluster: 'Delhi NCR', format: 'Trends', grade: 'A',
    latitude: 28.6139, longitude: 77.2090,
    carpetArea: 12200, saleableArea: 7930, saleableRatio: 65.0,
    deductions: { decompression: 400, mainAisles: 1560, trialRooms: 540, cashCounters: 320, stockroomStaff: 1450 },
    totalFixtures: 134, optionCapacity: 1890, garmentCapacity: 20280,
    spsf: 845, gmrof: 372,
    aopTargetCr: 6.70, aopRunRateCr: 6.35, fixtureUtilization: 79, underperformingFixtures: 10,
    competitors: [{ name: 'Zara', distance: '0.1 km', type: 'Direct' }, { name: 'Uniqlo', distance: '0.2 km', type: 'Direct' }],
    competitiveInsight: 'MF strong due to corporate catchment. KW underperforming — reduce and shift to MF/WWW.',
    hit: 'H4', planStatus: 'draft', planVersion: 'v1.0',
  },
  {
    storeId: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42',
    storeName: 'UB City Mall', city: 'Bangalore', zone: 'South', cluster: 'Bangalore Metro', format: 'AZORTE', grade: 'A',
    latitude: 12.9716, longitude: 77.5946,
    carpetArea: 10800, saleableArea: 7020, saleableRatio: 65.0,
    deductions: { decompression: 380, mainAisles: 1350, trialRooms: 480, cashCounters: 300, stockroomStaff: 1270 },
    totalFixtures: 118, optionCapacity: 1680, garmentCapacity: 17920,
    spsf: 828, gmrof: 365,
    aopTargetCr: 5.81, aopRunRateCr: 5.52, fixtureUtilization: 76, underperformingFixtures: 14,
    competitors: [{ name: 'H&M', distance: '0.4 km', type: 'Direct' }, { name: 'Lifestyle', distance: '0.6 km', type: 'Adjacent' }],
    competitiveInsight: 'Tech-hub catchment skews younger. WWW and WIW strong. 14 fixtures underutilized — consolidation opportunity.',
    hit: 'H4', planStatus: 'draft', planVersion: 'v1.0',
  },
  {
    storeId: '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75',
    storeName: 'Express Avenue', city: 'Chennai', zone: 'South', cluster: 'Chennai Metro', format: 'Trends', grade: 'A1',
    latitude: 13.0827, longitude: 80.2707,
    carpetArea: 9500, saleableArea: 6080, saleableRatio: 64.0,
    deductions: { decompression: 350, mainAisles: 1200, trialRooms: 420, cashCounters: 280, stockroomStaff: 1170 },
    totalFixtures: 102, optionCapacity: 1440, garmentCapacity: 15360,
    spsf: 738, gmrof: 328,
    aopTargetCr: 4.49, aopRunRateCr: 4.02, fixtureUtilization: 74, underperformingFixtures: 12,
    competitors: [{ name: 'Max Fashion', distance: '0.3 km', type: 'Adjacent' }, { name: 'Pantaloons', distance: '0.8 km', type: 'Adjacent' }],
    competitiveInsight: 'WIW is the star segment — Avaasa outperforming. Expand Avaasa wall units. MF needs review.',
    hit: 'H4', planStatus: 'draft', planVersion: 'v1.0',
  },
  {
    storeId: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97',
    storeName: 'Inorbit Mall', city: 'Hyderabad', zone: 'South', cluster: 'Hyderabad Metro', format: 'Fashion Factory', grade: 'A1',
    latitude: 17.3850, longitude: 78.4867,
    carpetArea: 9100, saleableArea: 5824, saleableRatio: 64.0,
    deductions: { decompression: 340, mainAisles: 1150, trialRooms: 400, cashCounters: 260, stockroomStaff: 1126 },
    totalFixtures: 98, optionCapacity: 1380, garmentCapacity: 14720,
    spsf: 710, gmrof: 315,
    aopTargetCr: 4.14, aopRunRateCr: 3.72, fixtureUtilization: 71, underperformingFixtures: 15,
    competitors: [{ name: 'Shoppers Stop', distance: '0.5 km', type: 'Adjacent' }, { name: 'FBB', distance: '1.2 km', type: 'Adjacent' }],
    competitiveInsight: 'WIW strong in ethnic-heavy catchment. MF underperforming — consider reducing for WIW expansion.',
    hit: 'H4', planStatus: 'under-review', planVersion: 'v2.1',
  },
  {
    storeId: '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a',
    storeName: 'Phoenix Marketcity', city: 'Pune', zone: 'West', cluster: 'Pune Metro', format: 'Trends', grade: 'A1',
    latitude: 18.5204, longitude: 73.8567,
    carpetArea: 8800, saleableArea: 5632, saleableRatio: 64.0,
    deductions: { decompression: 330, mainAisles: 1100, trialRooms: 380, cashCounters: 250, stockroomStaff: 1108 },
    totalFixtures: 94, optionCapacity: 1320, garmentCapacity: 14080,
    spsf: 695, gmrof: 308,
    aopTargetCr: 3.91, aopRunRateCr: 3.48, fixtureUtilization: 68, underperformingFixtures: 18,
    competitors: [{ name: 'Westside', distance: '0.3 km', type: 'Adjacent' }, { name: 'Zara', distance: '0.4 km', type: 'Direct' }, { name: 'Marks & Spencer', distance: '0.6 km', type: 'Direct' }],
    competitiveInsight: 'Young professional catchment. WWW strong but 18 fixtures underperforming — highest in A1 cohort.',
    hit: 'H4', planStatus: 'draft', planVersion: 'v1.0',
  },
  {
    storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20',
    storeName: 'Quest Mall', city: 'Kolkata', zone: 'East', cluster: 'Kolkata Metro', format: 'Yousta', grade: 'A2',
    latitude: 22.5726, longitude: 88.3639,
    carpetArea: 7800, saleableArea: 4914, saleableRatio: 63.0,
    deductions: { decompression: 300, mainAisles: 980, trialRooms: 340, cashCounters: 230, stockroomStaff: 1036 },
    totalFixtures: 82, optionCapacity: 1160, garmentCapacity: 12320,
    spsf: 522, gmrof: 268,
    aopTargetCr: 2.57, aopRunRateCr: 2.18, fixtureUtilization: 65, underperformingFixtures: 16,
    competitors: [{ name: 'Pantaloons', distance: '0.6 km', type: 'Adjacent' }, { name: 'Lifestyle', distance: '1.0 km', type: 'Adjacent' }],
    competitiveInsight: 'WIW dominant in ethnic-heavy market. Exit Celio from MC — GMROF well below threshold. KW oversized.',
    hit: 'H4', planStatus: 'draft', planVersion: 'v1.0',
  },
  {
    storeId: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b',
    storeName: 'Palladium', city: 'Ahmedabad', zone: 'West', cluster: 'Ahmedabad Metro', format: 'Fashion Factory', grade: 'A2',
    latitude: 23.0225, longitude: 72.5714,
    carpetArea: 7500, saleableArea: 4725, saleableRatio: 63.0,
    deductions: { decompression: 290, mainAisles: 940, trialRooms: 320, cashCounters: 220, stockroomStaff: 1005 },
    totalFixtures: 78, optionCapacity: 1100, garmentCapacity: 11680,
    spsf: 498, gmrof: 255,
    aopTargetCr: 2.35, aopRunRateCr: 1.98, fixtureUtilization: 62, underperformingFixtures: 18,
    competitors: [{ name: 'Max Fashion', distance: '0.8 km', type: 'Adjacent' }],
    competitiveInsight: 'Limited direct competition. WIW and MC strong but low fixture utilization drags SPSF. Exit Gini & Jony from KW.',
    hit: 'H4', planStatus: 'under-review', planVersion: 'v2.1',
  },
  {
    storeId: '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20',
    storeName: 'World Trade Park', city: 'Jaipur', zone: 'North', cluster: 'Rajasthan', format: 'Trends', grade: 'A3',
    latitude: 26.9124, longitude: 75.7873,
    carpetArea: 6800, saleableArea: 4216, saleableRatio: 62.0,
    deductions: { decompression: 260, mainAisles: 850, trialRooms: 280, cashCounters: 200, stockroomStaff: 994 },
    totalFixtures: 70, optionCapacity: 980, garmentCapacity: 10400,
    spsf: 395, gmrof: 218,
    aopTargetCr: 1.66, aopRunRateCr: 1.42, fixtureUtilization: 60, underperformingFixtures: 15,
    competitors: [{ name: 'Shoppers Stop', distance: '1.5 km', type: 'Adjacent' }],
    competitiveInsight: 'Tourist + local family catchment. WIW is clear winner. Exit Soch — GMROF below threshold 3 quarters.',
    hit: 'H4', planStatus: 'draft', planVersion: 'v1.0',
  },
  {
    storeId: '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c',
    storeName: 'Lulu Mall', city: 'Lucknow', zone: 'North', cluster: 'UP East', format: 'Yousta', grade: 'A3',
    latitude: 26.8467, longitude: 80.9462,
    carpetArea: 6400, saleableArea: 3968, saleableRatio: 62.0,
    deductions: { decompression: 240, mainAisles: 800, trialRooms: 260, cashCounters: 190, stockroomStaff: 942 },
    totalFixtures: 66, optionCapacity: 920, garmentCapacity: 9760,
    spsf: 372, gmrof: 205,
    aopTargetCr: 1.48, aopRunRateCr: 1.22, fixtureUtilization: 58, underperformingFixtures: 16,
    competitors: [{ name: 'V-Mart', distance: '2.0 km', type: 'Adjacent' }, { name: 'Reliance Smart', distance: '1.5 km', type: 'Adjacent' }],
    competitiveInsight: 'Value-segment competition. WIW and MC are key segments. Need fixture consolidation — 16 underperforming.',
    hit: 'H4', planStatus: 'draft', planVersion: 'v1.0',
  },
];

// ── Segment Allocations per Store ──

export const storeSegmentAllocations: StoreSegmentData[] = [
  {
    storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d',
    segments: [
      { segment: 'Menswear Casual', segmentCode: 'MC', sft: 2028, spacePercent: 24.0, nsvPercent: 26.8, efficiency: 1.12, gmrof: 432, fixtures: 34, options: 486, garments: 5208 },
      { segment: 'Menswear Formal', segmentCode: 'MF', sft: 1521, spacePercent: 18.0, nsvPercent: 16.5, efficiency: 0.92, gmrof: 352, fixtures: 26, options: 364, garments: 3904 },
      { segment: 'Women Indian Wear', segmentCode: 'WIW', sft: 1859, spacePercent: 22.0, nsvPercent: 24.2, efficiency: 1.10, gmrof: 418, fixtures: 31, options: 445, garments: 4770 },
      { segment: 'Women Western Wear', segmentCode: 'WWW', sft: 1690, spacePercent: 20.0, nsvPercent: 21.5, efficiency: 1.08, gmrof: 408, fixtures: 28, options: 405, garments: 4338 },
      { segment: 'Kidswear', segmentCode: 'KW', sft: 1352, spacePercent: 16.0, nsvPercent: 11.0, efficiency: 0.69, gmrof: 310, fixtures: 23, options: 324, garments: 3462 },
    ],
  },
  {
    storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b',
    segments: [
      { segment: 'Menswear Casual', segmentCode: 'MC', sft: 1903, spacePercent: 24.0, nsvPercent: 25.5, efficiency: 1.06, gmrof: 398, fixtures: 32, options: 454, garments: 4867 },
      { segment: 'Menswear Formal', segmentCode: 'MF', sft: 1586, spacePercent: 20.0, nsvPercent: 19.8, efficiency: 0.99, gmrof: 370, fixtures: 27, options: 378, garments: 4056 },
      { segment: 'Women Indian Wear', segmentCode: 'WIW', sft: 1348, spacePercent: 17.0, nsvPercent: 18.2, efficiency: 1.07, gmrof: 395, fixtures: 23, options: 321, garments: 3448 },
      { segment: 'Women Western Wear', segmentCode: 'WWW', sft: 1903, spacePercent: 24.0, nsvPercent: 25.8, efficiency: 1.08, gmrof: 402, fixtures: 32, options: 454, garments: 4867 },
      { segment: 'Kidswear', segmentCode: 'KW', sft: 1190, spacePercent: 15.0, nsvPercent: 10.7, efficiency: 0.71, gmrof: 298, fixtures: 20, options: 283, garments: 3042 },
    ],
  },
  {
    storeId: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42',
    segments: [
      { segment: 'Menswear Casual', segmentCode: 'MC', sft: 1404, spacePercent: 20.0, nsvPercent: 21.2, efficiency: 1.06, gmrof: 388, fixtures: 24, options: 336, garments: 3584 },
      { segment: 'Menswear Formal', segmentCode: 'MF', sft: 1544, spacePercent: 22.0, nsvPercent: 23.5, efficiency: 1.07, gmrof: 392, fixtures: 26, options: 370, garments: 3942 },
      { segment: 'Women Indian Wear', segmentCode: 'WIW', sft: 1614, spacePercent: 23.0, nsvPercent: 24.8, efficiency: 1.08, gmrof: 398, fixtures: 27, options: 386, garments: 4122 },
      { segment: 'Women Western Wear', segmentCode: 'WWW', sft: 1123, spacePercent: 16.0, nsvPercent: 15.2, efficiency: 0.95, gmrof: 345, fixtures: 19, options: 269, garments: 2867 },
      { segment: 'Kidswear', segmentCode: 'KW', sft: 1335, spacePercent: 19.0, nsvPercent: 15.3, efficiency: 0.81, gmrof: 318, fixtures: 22, options: 319, garments: 3405 },
    ],
  },
  {
    storeId: '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75',
    segments: [
      { segment: 'Menswear Casual', segmentCode: 'MC', sft: 1216, spacePercent: 20.0, nsvPercent: 19.5, efficiency: 0.98, gmrof: 320, fixtures: 20, options: 288, garments: 3072 },
      { segment: 'Menswear Formal', segmentCode: 'MF', sft: 912, spacePercent: 15.0, nsvPercent: 14.2, efficiency: 0.95, gmrof: 310, fixtures: 15, options: 216, garments: 2304 },
      { segment: 'Women Indian Wear', segmentCode: 'WIW', sft: 1520, spacePercent: 25.0, nsvPercent: 27.8, efficiency: 1.11, gmrof: 365, fixtures: 26, options: 360, garments: 3840 },
      { segment: 'Women Western Wear', segmentCode: 'WWW', sft: 1216, spacePercent: 20.0, nsvPercent: 21.5, efficiency: 1.08, gmrof: 352, fixtures: 20, options: 288, garments: 3072 },
      { segment: 'Kidswear', segmentCode: 'KW', sft: 1216, spacePercent: 20.0, nsvPercent: 17.0, efficiency: 0.85, gmrof: 295, fixtures: 21, options: 288, garments: 3072 },
    ],
  },
  {
    storeId: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97',
    segments: [
      { segment: 'Menswear Casual', segmentCode: 'MC', sft: 1340, spacePercent: 23.0, nsvPercent: 24.2, efficiency: 1.05, gmrof: 332, fixtures: 23, options: 318, garments: 3390 },
      { segment: 'Menswear Formal', segmentCode: 'MF', sft: 873, spacePercent: 15.0, nsvPercent: 13.8, efficiency: 0.92, gmrof: 290, fixtures: 15, options: 207, garments: 2208 },
      { segment: 'Women Indian Wear', segmentCode: 'WIW', sft: 1398, spacePercent: 24.0, nsvPercent: 26.5, efficiency: 1.10, gmrof: 348, fixtures: 24, options: 332, garments: 3538 },
      { segment: 'Women Western Wear', segmentCode: 'WWW', sft: 1048, spacePercent: 18.0, nsvPercent: 18.5, efficiency: 1.03, gmrof: 322, fixtures: 18, options: 249, garments: 2650 },
      { segment: 'Kidswear', segmentCode: 'KW', sft: 1165, spacePercent: 20.0, nsvPercent: 17.0, efficiency: 0.85, gmrof: 282, fixtures: 18, options: 274, garments: 2934 },
    ],
  },
  {
    storeId: '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a',
    segments: [
      { segment: 'Menswear Casual', segmentCode: 'MC', sft: 1352, spacePercent: 24.0, nsvPercent: 25.8, efficiency: 1.08, gmrof: 332, fixtures: 23, options: 317, garments: 3379 },
      { segment: 'Menswear Formal', segmentCode: 'MF', sft: 1126, spacePercent: 20.0, nsvPercent: 21.2, efficiency: 1.06, gmrof: 325, fixtures: 19, options: 264, garments: 2816 },
      { segment: 'Women Indian Wear', segmentCode: 'WIW', sft: 1014, spacePercent: 18.0, nsvPercent: 17.5, efficiency: 0.97, gmrof: 298, fixtures: 17, options: 238, garments: 2534 },
      { segment: 'Women Western Wear', segmentCode: 'WWW', sft: 1239, spacePercent: 22.0, nsvPercent: 23.5, efficiency: 1.07, gmrof: 328, fixtures: 21, options: 290, garments: 3094 },
      { segment: 'Kidswear', segmentCode: 'KW', sft: 901, spacePercent: 16.0, nsvPercent: 12.0, efficiency: 0.75, gmrof: 268, fixtures: 14, options: 211, garments: 2257 },
    ],
  },
  {
    storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20',
    segments: [
      { segment: 'Menswear Casual', segmentCode: 'MC', sft: 983, spacePercent: 20.0, nsvPercent: 19.2, efficiency: 0.96, gmrof: 258, fixtures: 16, options: 232, garments: 2464 },
      { segment: 'Menswear Formal', segmentCode: 'MF', sft: 737, spacePercent: 15.0, nsvPercent: 14.5, efficiency: 0.97, gmrof: 260, fixtures: 12, options: 174, garments: 1848 },
      { segment: 'Women Indian Wear', segmentCode: 'WIW', sft: 1229, spacePercent: 25.0, nsvPercent: 28.2, efficiency: 1.13, gmrof: 302, fixtures: 21, options: 290, garments: 3080 },
      { segment: 'Women Western Wear', segmentCode: 'WWW', sft: 884, spacePercent: 18.0, nsvPercent: 18.8, efficiency: 1.04, gmrof: 278, fixtures: 15, options: 209, garments: 2218 },
      { segment: 'Kidswear', segmentCode: 'KW', sft: 1081, spacePercent: 22.0, nsvPercent: 19.3, efficiency: 0.88, gmrof: 242, fixtures: 18, options: 255, garments: 2710 },
    ],
  },
  {
    storeId: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b',
    segments: [
      { segment: 'Menswear Casual', segmentCode: 'MC', sft: 1134, spacePercent: 24.0, nsvPercent: 25.5, efficiency: 1.06, gmrof: 272, fixtures: 19, options: 264, garments: 2803 },
      { segment: 'Menswear Formal', segmentCode: 'MF', sft: 756, spacePercent: 16.0, nsvPercent: 15.2, efficiency: 0.95, gmrof: 242, fixtures: 13, options: 176, garments: 1869 },
      { segment: 'Women Indian Wear', segmentCode: 'WIW', sft: 1134, spacePercent: 24.0, nsvPercent: 26.8, efficiency: 1.12, gmrof: 285, fixtures: 19, options: 264, garments: 2803 },
      { segment: 'Women Western Wear', segmentCode: 'WWW', sft: 850, spacePercent: 18.0, nsvPercent: 17.5, efficiency: 0.97, gmrof: 248, fixtures: 14, options: 198, garments: 2102 },
      { segment: 'Kidswear', segmentCode: 'KW', sft: 851, spacePercent: 18.0, nsvPercent: 15.0, efficiency: 0.83, gmrof: 218, fixtures: 13, options: 198, garments: 2103 },
    ],
  },
  {
    storeId: '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20',
    segments: [
      { segment: 'Menswear Casual', segmentCode: 'MC', sft: 927, spacePercent: 22.0, nsvPercent: 22.8, efficiency: 1.04, gmrof: 228, fixtures: 15, options: 216, garments: 2288 },
      { segment: 'Menswear Formal', segmentCode: 'MF', sft: 632, spacePercent: 15.0, nsvPercent: 13.5, efficiency: 0.90, gmrof: 195, fixtures: 11, options: 147, garments: 1560 },
      { segment: 'Women Indian Wear', segmentCode: 'WIW', sft: 1054, spacePercent: 25.0, nsvPercent: 28.5, efficiency: 1.14, gmrof: 248, fixtures: 18, options: 245, garments: 2600 },
      { segment: 'Women Western Wear', segmentCode: 'WWW', sft: 759, spacePercent: 18.0, nsvPercent: 18.2, efficiency: 1.01, gmrof: 220, fixtures: 13, options: 176, garments: 1872 },
      { segment: 'Kidswear', segmentCode: 'KW', sft: 844, spacePercent: 20.0, nsvPercent: 17.0, efficiency: 0.85, gmrof: 192, fixtures: 13, options: 196, garments: 2080 },
    ],
  },
  {
    storeId: '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c',
    segments: [
      { segment: 'Menswear Casual', segmentCode: 'MC', sft: 873, spacePercent: 22.0, nsvPercent: 23.0, efficiency: 1.05, gmrof: 215, fixtures: 15, options: 202, garments: 2147 },
      { segment: 'Menswear Formal', segmentCode: 'MF', sft: 595, spacePercent: 15.0, nsvPercent: 13.8, efficiency: 0.92, gmrof: 188, fixtures: 10, options: 138, garments: 1464 },
      { segment: 'Women Indian Wear', segmentCode: 'WIW', sft: 992, spacePercent: 25.0, nsvPercent: 28.2, efficiency: 1.13, gmrof: 232, fixtures: 17, options: 230, garments: 2440 },
      { segment: 'Women Western Wear', segmentCode: 'WWW', sft: 714, spacePercent: 18.0, nsvPercent: 18.5, efficiency: 1.03, gmrof: 210, fixtures: 12, options: 166, garments: 1757 },
      { segment: 'Kidswear', segmentCode: 'KW', sft: 794, spacePercent: 20.0, nsvPercent: 16.5, efficiency: 0.83, gmrof: 178, fixtures: 12, options: 184, garments: 1952 },
    ],
  },
];

// ── Helpers ──

/** Map store app grades (A+, A1, A2, B1, B2, C1) to operating model grades (A, A1, A2, A3) */
export function mapToOMGrade(appGrade: string): StoreGradeOM {
  if (appGrade === 'A+') return 'A';
  if (appGrade === 'A1') return 'A1';
  if (appGrade === 'A2') return 'A2';
  return 'A3'; // B1, B2, C1 → A3
}

/** Get SPSF target config for a store grade */
export function getSpsfTargetForGrade(appGrade: string): SPSFTarget | undefined {
  return spsfTargets.find((t) => t.grade === mapToOMGrade(appGrade));
}

/** SPSF RAG status: red (below floor), amber (below target), green (at/above target), blue (above stretch) */
export function getSpsfRagStatus(spsf: number, target: SPSFTarget): 'red' | 'amber' | 'green' | 'blue' {
  if (spsf < target.floor) return 'red';
  if (spsf < target.target) return 'amber';
  if (spsf >= target.stretch) return 'blue';
  return 'green';
}

/** Fixture coding convention parts */
export const floorCodes = [
  { code: 'GF', label: 'Ground Floor' },
  { code: 'FF', label: 'First Floor' },
  { code: 'SF', label: 'Second Floor' },
  { code: 'BF', label: 'Basement Floor' },
];

export const segmentCodes = [
  { code: 'MW', label: 'Menswear' },
  { code: 'WW', label: 'Womenswear' },
  { code: 'KW', label: 'Kidswear' },
  { code: 'AC', label: 'Accessories' },
  { code: 'FW', label: 'Footwear' },
];

// ── Store Fixture Instances ──

export interface StoreFixtureInstance {
  id: string;
  fixtureCode: string;
  fixtureTypeId: string;
  fixtureTypeName: string;
  segment: string;
  brand: string;
  currentOptions: number;
  maxOptions: number;
  currentQty: number;
  maxQty: number;
  lft: number;
  utilization: number;
}

const segmentBrands: Record<string, string[]> = {
  MC: ['Netplay', 'Performax', 'Avaasa', 'Rio'],
  MF: ['John Players', 'Peter England', 'Louis Philippe'],
  WIW: ['Avaasa', 'Aurelia', 'Global Desi'],
  WWW: ['Only', 'Vero Moda', 'Forever 21'],
  KW: ['Juniors', 'Kiddo', 'Mini Me'],
};

/** Deterministic pseudo-random from seed */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Generate fixture instances for a given store, deterministically */
export function generateStoreFixtures(storeId: string): StoreFixtureInstance[] {
  const storeData = storeSegmentAllocations.find((s) => s.storeId === storeId);

  const seed = parseInt(storeId.replace(/\D/g, ''), 10) || 1;
  const rand = seededRandom(seed * 7919);

  // Fallback segments for non-canonical stores
  const defaultSegments: SegmentAllocation[] = [
    { segment: "Men's Casual", segmentCode: 'MC', sft: 2000, spacePercent: 24, nsvPercent: 26, efficiency: 1.1, gmrof: 420, fixtures: 8 + Math.floor(rand() * 8), options: 450, garments: 5000 },
    { segment: "Men's Formal", segmentCode: 'MF', sft: 1500, spacePercent: 18, nsvPercent: 16, efficiency: 0.9, gmrof: 350, fixtures: 6 + Math.floor(rand() * 6), options: 360, garments: 3800 },
    { segment: "Women's Indian Wear", segmentCode: 'WIW', sft: 2200, spacePercent: 26, nsvPercent: 28, efficiency: 1.08, gmrof: 410, fixtures: 9 + Math.floor(rand() * 8), options: 520, garments: 5600 },
    { segment: "Women's Western Wear", segmentCode: 'WWW', sft: 1400, spacePercent: 16, nsvPercent: 15, efficiency: 0.94, gmrof: 380, fixtures: 5 + Math.floor(rand() * 5), options: 300, garments: 3200 },
    { segment: "Kids Wear", segmentCode: 'KW', sft: 1300, spacePercent: 16, nsvPercent: 15, efficiency: 0.95, gmrof: 360, fixtures: 5 + Math.floor(rand() * 5), options: 280, garments: 3000 },
  ];

  const segments = storeData?.segments ?? defaultSegments;

  const activeFixtureTypes = fixtureTypesOM.filter((f) => f.status === 'Active');
  const instances: StoreFixtureInstance[] = [];
  let idCounter = 1;

  const floorCode = 'GF';

  for (const seg of segments) {
    // Distribute segment fixtures across fixture types
    let remaining = seg.fixtures;
    let typeIdx = 0;

    while (remaining > 0 && typeIdx < activeFixtureTypes.length) {
      const ft = activeFixtureTypes[typeIdx % activeFixtureTypes.length]!;
      const count = Math.min(remaining, Math.max(1, Math.floor(rand() * 3) + 1));

      for (let i = 0; i < count && remaining > 0; i++) {
        const brands = segmentBrands[seg.segmentCode] || ['Generic'];
        const brand = brands[Math.floor(rand() * brands.length)]!;

        const utilBase = 55 + rand() * 40; // 55-95%
        const utilization = Math.round(utilBase * 10) / 10;
        const maxOpt = ft.optionCapacity;
        const curOpt = Math.max(1, Math.round(maxOpt * (utilization / 100)));
        const maxQ = ft.quantityPerFixture;
        const curQ = Math.max(1, Math.round(maxQ * (utilization / 100)));

        const padNum = String(idCounter).padStart(3, '0');
        const fixtureCode = `PHX-${floorCode}-${seg.segmentCode}-${ft.code}-${padNum}`;

        instances.push({
          id: `${storeId}-fix-${idCounter}`,
          fixtureCode,
          fixtureTypeId: ft.id,
          fixtureTypeName: ft.name,
          segment: seg.segment,
          brand,
          currentOptions: curOpt,
          maxOptions: maxOpt,
          currentQty: curQ,
          maxQty: maxQ,
          lft: ft.linearFeet,
          utilization,
        });
        idCounter++;
        remaining--;
      }
      typeIdx++;
    }
  }

  return instances;
}

// ── Fashion Split Data ──

export interface StoreFashionSplit {
  segment: string;
  core: number;
  ultimate: number;
  fashion: number;
  fastFashion: number;
}

function generateFashionSplits(): Record<string, StoreFashionSplit[]> {
  const result: Record<string, StoreFashionSplit[]> = {};

  for (const storeData of storeSegmentAllocations) {
    const seed = parseInt(storeData.storeId.replace(/\D/g, ''), 10) || 1;
    const rand = seededRandom(seed * 4517);

    result[storeData.storeId] = storeData.segments.map((seg) => {
      // Core: 42-52%, Ultimate: 18-28%, Fashion: 14-22%, Fast Fashion: 4-12%
      const core = 42 + Math.round(rand() * 10);
      const ultimate = 18 + Math.round(rand() * 10);
      const fashion = 14 + Math.round(rand() * 8);
      const fastFashion = 100 - core - ultimate - fashion;

      return {
        segment: seg.segment,
        core,
        ultimate,
        fashion,
        fastFashion: Math.max(0, fastFashion),
      };
    });
  }

  return result;
}

export const storeFashionSplits: Record<string, StoreFashionSplit[]> = generateFashionSplits();

// ── Phase 3: Category & Network Views ──

// ── Brand Space Data ──

export interface BrandSpaceData {
  brandId: string;
  brandName: string;
  brandType: 'PL' | 'EB';
  tier: 1 | 2 | 3;
  segmentCode: string;
  avgGmrof: number;
  avgSpacePercent: number;
  storesCarrying: number;
  action: 'Guaranteed' | 'Review' | 'Exit candidate';
}

export const categoryBrands: Record<string, BrandSpaceData[]> = {
  MC: [
    { brandId: 'br-mc-01', brandName: 'Netplay', brandType: 'PL', tier: 1, segmentCode: 'MC', avgGmrof: 412, avgSpacePercent: 32, storesCarrying: 10, action: 'Guaranteed' },
    { brandId: 'br-mc-02', brandName: 'Performax', brandType: 'PL', tier: 1, segmentCode: 'MC', avgGmrof: 388, avgSpacePercent: 28, storesCarrying: 10, action: 'Guaranteed' },
    { brandId: 'br-mc-03', brandName: 'Rio', brandType: 'PL', tier: 1, segmentCode: 'MC', avgGmrof: 365, avgSpacePercent: 18, storesCarrying: 9, action: 'Guaranteed' },
    { brandId: 'br-mc-04', brandName: 'U.S. Polo Assn.', brandType: 'EB', tier: 2, segmentCode: 'MC', avgGmrof: 298, avgSpacePercent: 12, storesCarrying: 7, action: 'Review' },
    { brandId: 'br-mc-05', brandName: 'Jack & Jones', brandType: 'EB', tier: 2, segmentCode: 'MC', avgGmrof: 275, avgSpacePercent: 6, storesCarrying: 5, action: 'Review' },
    { brandId: 'br-mc-06', brandName: 'Celio', brandType: 'EB', tier: 3, segmentCode: 'MC', avgGmrof: 192, avgSpacePercent: 4, storesCarrying: 3, action: 'Exit candidate' },
  ],
  MF: [
    { brandId: 'br-mf-01', brandName: 'John Players', brandType: 'PL', tier: 1, segmentCode: 'MF', avgGmrof: 378, avgSpacePercent: 35, storesCarrying: 10, action: 'Guaranteed' },
    { brandId: 'br-mf-02', brandName: 'Peter England', brandType: 'EB', tier: 2, segmentCode: 'MF', avgGmrof: 342, avgSpacePercent: 25, storesCarrying: 9, action: 'Guaranteed' },
    { brandId: 'br-mf-03', brandName: 'Louis Philippe', brandType: 'EB', tier: 2, segmentCode: 'MF', avgGmrof: 315, avgSpacePercent: 20, storesCarrying: 8, action: 'Review' },
    { brandId: 'br-mf-04', brandName: 'Arrow', brandType: 'EB', tier: 2, segmentCode: 'MF', avgGmrof: 288, avgSpacePercent: 12, storesCarrying: 6, action: 'Review' },
    { brandId: 'br-mf-05', brandName: 'Park Avenue', brandType: 'EB', tier: 3, segmentCode: 'MF', avgGmrof: 198, avgSpacePercent: 8, storesCarrying: 4, action: 'Exit candidate' },
  ],
  WIW: [
    { brandId: 'br-wiw-01', brandName: 'Avaasa', brandType: 'PL', tier: 1, segmentCode: 'WIW', avgGmrof: 425, avgSpacePercent: 30, storesCarrying: 10, action: 'Guaranteed' },
    { brandId: 'br-wiw-02', brandName: 'Aurelia', brandType: 'EB', tier: 2, segmentCode: 'WIW', avgGmrof: 385, avgSpacePercent: 22, storesCarrying: 9, action: 'Guaranteed' },
    { brandId: 'br-wiw-03', brandName: 'Global Desi', brandType: 'EB', tier: 2, segmentCode: 'WIW', avgGmrof: 352, avgSpacePercent: 18, storesCarrying: 8, action: 'Guaranteed' },
    { brandId: 'br-wiw-04', brandName: 'W', brandType: 'EB', tier: 2, segmentCode: 'WIW', avgGmrof: 318, avgSpacePercent: 15, storesCarrying: 7, action: 'Review' },
    { brandId: 'br-wiw-05', brandName: 'Biba', brandType: 'EB', tier: 3, segmentCode: 'WIW', avgGmrof: 245, avgSpacePercent: 10, storesCarrying: 5, action: 'Review' },
    { brandId: 'br-wiw-06', brandName: 'Soch', brandType: 'EB', tier: 3, segmentCode: 'WIW', avgGmrof: 188, avgSpacePercent: 5, storesCarrying: 3, action: 'Exit candidate' },
  ],
  WWW: [
    { brandId: 'br-www-01', brandName: 'Only', brandType: 'EB', tier: 2, segmentCode: 'WWW', avgGmrof: 392, avgSpacePercent: 25, storesCarrying: 9, action: 'Guaranteed' },
    { brandId: 'br-www-02', brandName: 'Vero Moda', brandType: 'EB', tier: 2, segmentCode: 'WWW', avgGmrof: 368, avgSpacePercent: 22, storesCarrying: 8, action: 'Guaranteed' },
    { brandId: 'br-www-03', brandName: 'Forever 21', brandType: 'EB', tier: 2, segmentCode: 'WWW', avgGmrof: 335, avgSpacePercent: 18, storesCarrying: 8, action: 'Review' },
    { brandId: 'br-www-04', brandName: 'Avaasa West', brandType: 'PL', tier: 1, segmentCode: 'WWW', avgGmrof: 405, avgSpacePercent: 20, storesCarrying: 10, action: 'Guaranteed' },
    { brandId: 'br-www-05', brandName: 'Honey', brandType: 'EB', tier: 3, segmentCode: 'WWW', avgGmrof: 215, avgSpacePercent: 8, storesCarrying: 4, action: 'Exit candidate' },
  ],
  KW: [
    { brandId: 'br-kw-01', brandName: 'Juniors', brandType: 'PL', tier: 1, segmentCode: 'KW', avgGmrof: 295, avgSpacePercent: 35, storesCarrying: 10, action: 'Guaranteed' },
    { brandId: 'br-kw-02', brandName: 'Kiddo', brandType: 'PL', tier: 1, segmentCode: 'KW', avgGmrof: 268, avgSpacePercent: 28, storesCarrying: 10, action: 'Guaranteed' },
    { brandId: 'br-kw-03', brandName: 'Mini Me', brandType: 'PL', tier: 1, segmentCode: 'KW', avgGmrof: 245, avgSpacePercent: 20, storesCarrying: 9, action: 'Review' },
    { brandId: 'br-kw-04', brandName: 'UCB Kids', brandType: 'EB', tier: 2, segmentCode: 'KW', avgGmrof: 218, avgSpacePercent: 10, storesCarrying: 5, action: 'Review' },
    { brandId: 'br-kw-05', brandName: 'Gini & Jony', brandType: 'EB', tier: 3, segmentCode: 'KW', avgGmrof: 165, avgSpacePercent: 7, storesCarrying: 3, action: 'Exit candidate' },
  ],
};

// ── Hierarchy Coverage ──

export interface HierarchyCoverageNode {
  level: 'Segment' | 'Class' | 'Brick' | 'FashionGrade';
  name: string;
  requiredCoverage: number;
  actualCoverage: number;
  gap: number;
}

export const categoryHierarchyCoverage: Record<string, HierarchyCoverageNode[]> = {
  'mens-casual': [
    { level: 'Segment', name: 'Menswear Casual', requiredCoverage: 100, actualCoverage: 100, gap: 0 },
    { level: 'Class', name: 'T-Shirts / Jeans / Shorts / Polos', requiredCoverage: 95, actualCoverage: 88, gap: 7 },
    { level: 'Brick', name: 'Round-neck / V-neck / Slim / Regular', requiredCoverage: 85, actualCoverage: 78, gap: 7 },
    { level: 'FashionGrade', name: 'Core / Ultimate / Fashion / FF', requiredCoverage: 90, actualCoverage: 82, gap: 8 },
  ],
  'mens-formal': [
    { level: 'Segment', name: 'Menswear Formal', requiredCoverage: 100, actualCoverage: 100, gap: 0 },
    { level: 'Class', name: 'Shirts / Trousers / Blazers / Suits', requiredCoverage: 95, actualCoverage: 92, gap: 3 },
    { level: 'Brick', name: 'Regular / Slim / Classic / Business', requiredCoverage: 85, actualCoverage: 80, gap: 5 },
    { level: 'FashionGrade', name: 'Core / Ultimate / Fashion / FF', requiredCoverage: 90, actualCoverage: 85, gap: 5 },
  ],
  'womens-ethnic': [
    { level: 'Segment', name: 'Women Indian Wear', requiredCoverage: 100, actualCoverage: 100, gap: 0 },
    { level: 'Class', name: 'Kurtas / Sarees / Lehengas / Sets', requiredCoverage: 95, actualCoverage: 90, gap: 5 },
    { level: 'Brick', name: 'Printed / Embroidered / Plain / Festive', requiredCoverage: 85, actualCoverage: 82, gap: 3 },
    { level: 'FashionGrade', name: 'Core / Ultimate / Fashion / FF', requiredCoverage: 90, actualCoverage: 88, gap: 2 },
  ],
  'womens-western': [
    { level: 'Segment', name: 'Women Western Wear', requiredCoverage: 100, actualCoverage: 100, gap: 0 },
    { level: 'Class', name: 'Tops / Dresses / Jeans / Skirts', requiredCoverage: 95, actualCoverage: 85, gap: 10 },
    { level: 'Brick', name: 'Casual / Workwear / Party / Athleisure', requiredCoverage: 85, actualCoverage: 72, gap: 13 },
    { level: 'FashionGrade', name: 'Core / Ultimate / Fashion / FF', requiredCoverage: 90, actualCoverage: 78, gap: 12 },
  ],
  'kids-wear': [
    { level: 'Segment', name: 'Kidswear', requiredCoverage: 100, actualCoverage: 100, gap: 0 },
    { level: 'Class', name: 'Boys / Girls / Infants / Teens', requiredCoverage: 95, actualCoverage: 82, gap: 13 },
    { level: 'Brick', name: 'Casual / Ethnic / Party / School', requiredCoverage: 85, actualCoverage: 70, gap: 15 },
    { level: 'FashionGrade', name: 'Core / Ultimate / Fashion / FF', requiredCoverage: 90, actualCoverage: 75, gap: 15 },
  ],
};

// ── Space Recommendations ──

export interface SpaceRecommendation {
  id: string;
  storeId: string;
  storeName: string;
  title: string; // "Reduce KW area by 3pp (16% → 13%)"
  segmentCode: string;
  segment: string;
  // Area change
  currentSpacePct: number;
  recommendedSpacePct: number;
  currentSft: number;
  newSft: number;
  // Capacity cascade
  currentOptions: number;
  newOptionCapacity: number;
  // Hierarchy split of the recommended option capacity
  hierarchySplit: {
    family: string;
    optionsPct: number;
    options: number;
    qty: number;
    fashionGrade: { corePct: number; fashionPct: number; ffPct: number };
  }[];
  // Full transparent math for the planner
  math: {
    currentSegNsvLakhs: number; // Rs L — current segment NSV
    avgNsvPerOption: number;    // Rs K — what each option earns
    deltaOptions: number;       // option count change (+/-)
    deltaNsvLakhs: number;      // Rs L — NSV change from option delta
    storeSaleableArea: number;  // total store saleable sft
    spsfDelta: number;          // Rs/SFT = (deltaNsv × 1L) / storeSaleableArea
  };
  // Rationale
  trigger: string;
  constraint: string;
  spsfDelta: number;
  // Execution routing — determines post-acceptance workflow
  executionPath: {
    stockStatus: 'in-dc' | 'in-pipeline' | 'needs-ra';
    dcUnitsAvailable?: number;
    unitsNeeded: number;
    nextRACycle?: string; // e.g. 'RA-Jul-26'
    etaWeeks?: number; // estimated weeks to stock arrival
  };
}

export const spaceRecommendations: SpaceRecommendation[] = [
  {
    id: 'sr-01',
    storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d',
    storeName: 'Mumbai - Phoenix Mall',
    title: 'Reduce Kidswear area by 3pp (16% → 13%)',
    segmentCode: 'KW',
    segment: 'Kidswear',
    currentSpacePct: 16,
    recommendedSpacePct: 13,
    currentSft: 960,
    newSft: 780,
    currentOptions: 210,
    newOptionCapacity: 170,
    hierarchySplit: [
      { family: 'Boys Casual', optionsPct: 40, options: 68, qty: 544, fashionGrade: { corePct: 72, fashionPct: 20, ffPct: 8 } },
      { family: 'Girls Ethnic', optionsPct: 25, options: 43, qty: 344, fashionGrade: { corePct: 65, fashionPct: 25, ffPct: 10 } },
      { family: 'Boys Formal', optionsPct: 15, options: 26, qty: 208, fashionGrade: { corePct: 80, fashionPct: 15, ffPct: 5 } },
      { family: 'Girls Western', optionsPct: 20, options: 33, qty: 264, fashionGrade: { corePct: 60, fashionPct: 30, ffPct: 10 } },
    ],
    math: {
      currentSegNsvLakhs: 72, avgNsvPerOption: 0.34, deltaOptions: -40,
      deltaNsvLakhs: -13.6, storeSaleableArea: 6000, spsfDelta: 22,
    },
    trigger: 'Kidswear efficiency 0.69 — earning 12% Net Sales on 16% space for 3 months. GM Return on Footage Rs 285 vs grade avg Rs 340.',
    constraint: 'Minimum 12% threshold for Kidswear per grade A norm. Freed 180 sft reallocated to Women Indian Wear (efficiency 1.18).',
    spsfDelta: 22,
    executionPath: { stockStatus: 'in-dc', dcUnitsAvailable: 170, unitsNeeded: 170, etaWeeks: 1 },
  },
  {
    id: 'sr-02',
    storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d',
    storeName: 'Mumbai - Phoenix Mall',
    title: 'Expand Women Indian Wear area by 3pp (22% → 25%)',
    segmentCode: 'WIW',
    segment: 'Women Indian Wear',
    currentSpacePct: 22,
    recommendedSpacePct: 25,
    currentSft: 1320,
    newSft: 1500,
    currentOptions: 290,
    newOptionCapacity: 330,
    hierarchySplit: [
      { family: 'Kurtas & Kurtis', optionsPct: 42, options: 139, qty: 1112, fashionGrade: { corePct: 60, fashionPct: 28, ffPct: 12 } },
      { family: 'Salwar & Suits', optionsPct: 28, options: 92, qty: 736, fashionGrade: { corePct: 68, fashionPct: 24, ffPct: 8 } },
      { family: 'Sarees', optionsPct: 18, options: 59, qty: 472, fashionGrade: { corePct: 72, fashionPct: 22, ffPct: 6 } },
      { family: 'Ethnic Bottoms', optionsPct: 12, options: 40, qty: 320, fashionGrade: { corePct: 75, fashionPct: 20, ffPct: 5 } },
    ],
    math: {
      currentSegNsvLakhs: 156, avgNsvPerOption: 0.54, deltaOptions: 40,
      deltaNsvLakhs: 21.6, storeSaleableArea: 6000, spsfDelta: 36,
    },
    trigger: 'Women Indian Wear efficiency 1.18 — earning 26% Net Sales on 22% space. GM Return on Footage Rs 420 vs grade avg Rs 380. Sell-through 74%.',
    constraint: 'Absorbs 180 sft freed from Kidswear contraction. Max segment cap 30%.',
    spsfDelta: 36,
    executionPath: { stockStatus: 'in-dc', dcUnitsAvailable: 280, unitsNeeded: 40, etaWeeks: 2 },
  },
  {
    id: 'sr-03',
    storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b',
    storeName: 'Delhi - Select Citywalk',
    title: 'Expand Menswear Formal area by 4pp (18% → 22%)',
    segmentCode: 'MF',
    segment: 'Menswear Formal',
    currentSpacePct: 18,
    recommendedSpacePct: 22,
    currentSft: 990,
    newSft: 1210,
    currentOptions: 155,
    newOptionCapacity: 190,
    hierarchySplit: [
      { family: 'Formal Shirts', optionsPct: 38, options: 72, qty: 576, fashionGrade: { corePct: 78, fashionPct: 18, ffPct: 4 } },
      { family: 'Formal Trousers', optionsPct: 30, options: 57, qty: 456, fashionGrade: { corePct: 80, fashionPct: 16, ffPct: 4 } },
      { family: 'Suits & Blazers', optionsPct: 18, options: 34, qty: 204, fashionGrade: { corePct: 70, fashionPct: 24, ffPct: 6 } },
      { family: 'Formal Accessories', optionsPct: 14, options: 27, qty: 216, fashionGrade: { corePct: 85, fashionPct: 12, ffPct: 3 } },
    ],
    math: {
      currentSegNsvLakhs: 88, avgNsvPerOption: 0.57, deltaOptions: 35,
      deltaNsvLakhs: 20.0, storeSaleableArea: 5500, spsfDelta: 36,
    },
    trigger: 'Menswear Formal efficiency 1.12 — Net Sales 20% vs space 18%. GM Return on Footage Rs 395 trending up 6 months. Delhi catchment skews formal.',
    constraint: 'Source from Menswear Casual (24% → 20%). Menswear Casual efficiency 0.88 — over-spaced by 4pp vs grade avg.',
    spsfDelta: 36,
    executionPath: { stockStatus: 'in-pipeline', unitsNeeded: 35, etaWeeks: 4 },
  },
  {
    id: 'sr-04',
    storeId: '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75',
    storeName: 'Chennai - Express Avenue',
    title: 'Expand Women Indian Wear area by 3pp (22% → 25%)',
    segmentCode: 'WIW',
    segment: 'Women Indian Wear',
    currentSpacePct: 22,
    recommendedSpacePct: 25,
    currentSft: 1100,
    newSft: 1250,
    currentOptions: 240,
    newOptionCapacity: 273,
    hierarchySplit: [
      { family: 'Kurtas & Kurtis', optionsPct: 45, options: 123, qty: 984, fashionGrade: { corePct: 62, fashionPct: 26, ffPct: 12 } },
      { family: 'Salwar & Suits', optionsPct: 30, options: 82, qty: 656, fashionGrade: { corePct: 66, fashionPct: 26, ffPct: 8 } },
      { family: 'Sarees', optionsPct: 15, options: 41, qty: 328, fashionGrade: { corePct: 70, fashionPct: 22, ffPct: 8 } },
      { family: 'Ethnic Bottoms', optionsPct: 10, options: 27, qty: 216, fashionGrade: { corePct: 74, fashionPct: 20, ffPct: 6 } },
    ],
    math: {
      currentSegNsvLakhs: 130, avgNsvPerOption: 0.54, deltaOptions: 33,
      deltaNsvLakhs: 17.8, storeSaleableArea: 5000, spsfDelta: 36,
    },
    trigger: 'Women Indian Wear efficiency 1.15 — earning 25% Net Sales on 22% space. Chennai market strong for ethnic wear.',
    constraint: 'Source from Menswear Casual (26% → 23%). Menswear Casual efficiency 0.85 — under-performing space allocation.',
    spsfDelta: 36,
    executionPath: { stockStatus: 'needs-ra', unitsNeeded: 33, nextRACycle: 'RA-Jul-26' },
  },
  {
    id: 'sr-05',
    storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20',
    storeName: 'Kolkata - Quest Mall',
    title: 'Expand Women Western Wear area by 4pp (20% → 24%)',
    segmentCode: 'WWW',
    segment: 'Women Western Wear',
    currentSpacePct: 20,
    recommendedSpacePct: 24,
    currentSft: 800,
    newSft: 960,
    currentOptions: 180,
    newOptionCapacity: 216,
    hierarchySplit: [
      { family: 'Tops & Blouses', optionsPct: 35, options: 76, qty: 608, fashionGrade: { corePct: 55, fashionPct: 32, ffPct: 13 } },
      { family: 'Dresses', optionsPct: 28, options: 60, qty: 480, fashionGrade: { corePct: 50, fashionPct: 35, ffPct: 15 } },
      { family: 'Western Bottoms', optionsPct: 22, options: 48, qty: 384, fashionGrade: { corePct: 62, fashionPct: 28, ffPct: 10 } },
      { family: 'Outerwear', optionsPct: 15, options: 32, qty: 192, fashionGrade: { corePct: 58, fashionPct: 30, ffPct: 12 } },
    ],
    math: {
      currentSegNsvLakhs: 84, avgNsvPerOption: 0.47, deltaOptions: 36,
      deltaNsvLakhs: 16.9, storeSaleableArea: 4000, spsfDelta: 42,
    },
    trigger: 'Women Western Wear efficiency 1.22 — earning 24% Net Sales on 20% space. GM Return on Footage Rs 410 and rising. Mall catchment favors western.',
    constraint: 'Source from Kidswear (18% → 14%). Kidswear efficiency 0.72 at this store.',
    spsfDelta: 42,
    executionPath: { stockStatus: 'in-dc', dcUnitsAvailable: 200, unitsNeeded: 36, etaWeeks: 2 },
  },
  {
    id: 'sr-06',
    storeId: '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20',
    storeName: 'Jaipur - World Trade Park',
    title: 'Reduce Menswear Casual area by 3pp (26% → 23%)',
    segmentCode: 'MC',
    segment: 'Menswear Casual',
    currentSpacePct: 26,
    recommendedSpacePct: 23,
    currentSft: 1170,
    newSft: 1035,
    currentOptions: 260,
    newOptionCapacity: 230,
    hierarchySplit: [
      { family: 'Casual Tees', optionsPct: 35, options: 81, qty: 648, fashionGrade: { corePct: 65, fashionPct: 25, ffPct: 10 } },
      { family: 'Casual Shirts', optionsPct: 28, options: 64, qty: 512, fashionGrade: { corePct: 70, fashionPct: 22, ffPct: 8 } },
      { family: 'Denims', optionsPct: 22, options: 51, qty: 408, fashionGrade: { corePct: 68, fashionPct: 24, ffPct: 8 } },
      { family: 'Casual Trousers', optionsPct: 15, options: 34, qty: 272, fashionGrade: { corePct: 74, fashionPct: 20, ffPct: 6 } },
    ],
    math: {
      currentSegNsvLakhs: 108, avgNsvPerOption: 0.42, deltaOptions: -30,
      deltaNsvLakhs: -12.6, storeSaleableArea: 4500, spsfDelta: 18,
    },
    trigger: 'Menswear Casual efficiency 0.81 — earning 21% Net Sales on 26% space. Aged stock 18%. Sell-through 52%.',
    constraint: 'Freed 135 sft goes to Women Indian Wear (efficiency 1.14). Menswear Casual stays above 20% minimum.',
    spsfDelta: 18,
    executionPath: { stockStatus: 'in-dc', dcUnitsAvailable: 230, unitsNeeded: 230, etaWeeks: 1 },
  },
  {
    id: 'sr-07',
    storeId: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b',
    storeName: 'Ahmedabad - Palladium',
    title: 'Expand Women Indian Wear area by 4pp (22% → 26%)',
    segmentCode: 'WIW',
    segment: 'Women Indian Wear',
    currentSpacePct: 22,
    recommendedSpacePct: 26,
    currentSft: 1100,
    newSft: 1300,
    currentOptions: 240,
    newOptionCapacity: 284,
    hierarchySplit: [
      { family: 'Kurtas & Kurtis', optionsPct: 44, options: 125, qty: 1000, fashionGrade: { corePct: 62, fashionPct: 26, ffPct: 12 } },
      { family: 'Salwar & Suits', optionsPct: 26, options: 74, qty: 592, fashionGrade: { corePct: 66, fashionPct: 26, ffPct: 8 } },
      { family: 'Sarees', optionsPct: 18, options: 51, qty: 408, fashionGrade: { corePct: 70, fashionPct: 22, ffPct: 8 } },
      { family: 'Ethnic Bottoms', optionsPct: 12, options: 34, qty: 272, fashionGrade: { corePct: 74, fashionPct: 20, ffPct: 6 } },
    ],
    math: {
      currentSegNsvLakhs: 115, avgNsvPerOption: 0.48, deltaOptions: 44,
      deltaNsvLakhs: 21.1, storeSaleableArea: 5000, spsfDelta: 42,
    },
    trigger: 'Women Indian Wear efficiency 1.21 — GM Return on Footage Rs 415 vs grade avg Rs 370. Gujarat market strong for ethnic. Sell-through 76%.',
    constraint: 'Source from Kidswear (16% → 12%, at minimum). Kidswear efficiency 0.68 — consistent underperformer.',
    spsfDelta: 42,
    executionPath: { stockStatus: 'in-pipeline', unitsNeeded: 44, etaWeeks: 3 },
  },
];

// ── PulsePoint Task Types ──

export type PulsePointTaskStatus = 'pushed' | 'in-progress' | 'completed';

export interface PulsePointTask {
  id: string;
  recId: string;
  storeId: string;
  storeName: string;
  format: string;
  title: string;
  description: string;
  segment: string;
  segmentCode: string;
  status: PulsePointTaskStatus;
  assignee: string;
  createdAt: string;
  completedAt?: string;
}

export const storeManagerMap: Record<string, string> = {
  'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d': 'Rajesh Sharma',
  'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b': 'Priya Gupta',
  '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42': 'Ankit Reddy',
  '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75': 'Meera Iyer',
  'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97': 'Vikram Rao',
  '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a': 'Sunita Patil',
  '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20': 'Arjun Bose',
  '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b': 'Neha Patel',
  '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20': 'Deepak Singh',
  '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c': 'Kavita Mishra',
};

/** Seed PulsePoint tasks — pre-existing tasks from earlier recommendation cycles */
export const seedPulsePointTasks: PulsePointTask[] = [
  { id: 'pp-seed-01', recId: 'sr-01', storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', storeName: 'Mumbai - Phoenix Mall', format: 'Trends', title: 'Reduce Kidswear area by 3pp (16% → 13%)', description: 'Kidswear: 16% → 13% (960 → 780 Sq. Ft.)', segment: 'Kidswear', segmentCode: 'KW', status: 'completed', assignee: 'Rajesh Sharma', createdAt: '2026-03-20T09:00:00Z', completedAt: '2026-03-28T14:30:00Z' },
  { id: 'pp-seed-02', recId: 'sr-02', storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', storeName: 'Mumbai - Phoenix Mall', format: 'Trends', title: 'Expand Women Indian Wear area by 3pp (22% → 25%)', description: 'Women Indian Wear: 22% → 25% (1,320 → 1,500 Sq. Ft.)', segment: 'Women Indian Wear', segmentCode: 'WIW', status: 'in-progress', assignee: 'Rajesh Sharma', createdAt: '2026-03-20T09:00:00Z' },
  { id: 'pp-seed-03', recId: 'sr-03', storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', storeName: 'Delhi - Select Citywalk', format: 'Trends', title: 'Expand Menswear Formal area by 4pp (18% → 22%)', description: 'Menswear Formal: 18% → 22% (990 → 1,210 Sq. Ft.)', segment: 'Menswear Formal', segmentCode: 'MF', status: 'pushed', assignee: 'Priya Gupta', createdAt: '2026-04-02T10:00:00Z' },
  { id: 'pp-seed-04', recId: 'sr-04', storeId: '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75', storeName: 'Chennai - Express Avenue', format: 'Trends', title: 'Expand Women Indian Wear area by 3pp (22% → 25%)', description: 'Women Indian Wear: 22% → 25% (1,100 → 1,250 Sq. Ft.)', segment: 'Women Indian Wear', segmentCode: 'WIW', status: 'pushed', assignee: 'Meera Iyer', createdAt: '2026-04-05T11:00:00Z' },
  { id: 'pp-seed-05', recId: 'sr-05', storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20', storeName: 'Kolkata - Quest Mall', format: 'Yousta', title: 'Expand Women Western Wear area by 4pp (20% → 24%)', description: 'Women Western Wear: 20% → 24%', segment: 'Women Western Wear', segmentCode: 'WWW', status: 'in-progress', assignee: 'Arjun Bose', createdAt: '2026-03-25T08:30:00Z' },
  { id: 'pp-seed-06', recId: 'sr-06', storeId: '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20', storeName: 'Jaipur - World Trade Park', format: 'Trends', title: 'Reduce Menswear Casual area by 3pp (26% → 23%)', description: 'Menswear Casual: 26% → 23%', segment: 'Menswear Casual', segmentCode: 'MC', status: 'completed', assignee: 'Deepak Singh', createdAt: '2026-03-15T09:00:00Z', completedAt: '2026-03-22T16:00:00Z' },
  { id: 'pp-seed-07', recId: 'sr-07', storeId: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b', storeName: 'Ahmedabad - Palladium', format: 'Fashion Factory', title: 'Expand Women Indian Wear area by 4pp (22% → 26%)', description: 'Women Indian Wear: 22% → 26%', segment: 'Women Indian Wear', segmentCode: 'WIW', status: 'pushed', assignee: 'Neha Patel', createdAt: '2026-04-08T10:00:00Z' },
];

// ── Network Capacity Build-Up ──

export interface NetworkCapacityRow {
  grade: string;
  stores: number;
  fyRevCr: number;
  monthlyUnitsLabel: string;
  inStoreStockLabel: string;
  sharePercent: number;
  perStore: number;
}

export const networkCapacityBuildUp: NetworkCapacityRow[] = [
  { grade: 'A', stores: 3, fyRevCr: 510, monthlyUnitsLabel: '4.25L', inStoreStockLabel: '12.75L', sharePercent: 34, perStore: 170 },
  { grade: 'A1', stores: 3, fyRevCr: 420, monthlyUnitsLabel: '3.50L', inStoreStockLabel: '10.50L', sharePercent: 28, perStore: 140 },
  { grade: 'A2', stores: 2, fyRevCr: 310, monthlyUnitsLabel: '2.58L', inStoreStockLabel: '7.75L', sharePercent: 21, perStore: 155 },
  { grade: 'A3', stores: 2, fyRevCr: 260, monthlyUnitsLabel: '2.17L', inStoreStockLabel: '6.50L', sharePercent: 17, perStore: 130 },
];

// ── Grade Segment Benchmarks (ideal mix by grade) ──

export const gradeSegmentBenchmarks: GradeSegmentBenchmark[] = [
  // A-grade benchmarks
  { grade: 'A', segmentCode: 'MC', benchmarkSpacePercent: 22, benchmarkGmrof: 420 },
  { grade: 'A', segmentCode: 'MF', benchmarkSpacePercent: 19, benchmarkGmrof: 375 },
  { grade: 'A', segmentCode: 'WIW', benchmarkSpacePercent: 23, benchmarkGmrof: 410 },
  { grade: 'A', segmentCode: 'WWW', benchmarkSpacePercent: 21, benchmarkGmrof: 400 },
  { grade: 'A', segmentCode: 'KW', benchmarkSpacePercent: 15, benchmarkGmrof: 320 },
  // A1-grade benchmarks
  { grade: 'A1', segmentCode: 'MC', benchmarkSpacePercent: 22, benchmarkGmrof: 340 },
  { grade: 'A1', segmentCode: 'MF', benchmarkSpacePercent: 18, benchmarkGmrof: 315 },
  { grade: 'A1', segmentCode: 'WIW', benchmarkSpacePercent: 24, benchmarkGmrof: 350 },
  { grade: 'A1', segmentCode: 'WWW', benchmarkSpacePercent: 20, benchmarkGmrof: 335 },
  { grade: 'A1', segmentCode: 'KW', benchmarkSpacePercent: 16, benchmarkGmrof: 280 },
  // A2-grade benchmarks
  { grade: 'A2', segmentCode: 'MC', benchmarkSpacePercent: 21, benchmarkGmrof: 270 },
  { grade: 'A2', segmentCode: 'MF', benchmarkSpacePercent: 16, benchmarkGmrof: 255 },
  { grade: 'A2', segmentCode: 'WIW', benchmarkSpacePercent: 25, benchmarkGmrof: 290 },
  { grade: 'A2', segmentCode: 'WWW', benchmarkSpacePercent: 18, benchmarkGmrof: 265 },
  { grade: 'A2', segmentCode: 'KW', benchmarkSpacePercent: 20, benchmarkGmrof: 230 },
  // A3-grade benchmarks
  { grade: 'A3', segmentCode: 'MC', benchmarkSpacePercent: 22, benchmarkGmrof: 225 },
  { grade: 'A3', segmentCode: 'MF', benchmarkSpacePercent: 15, benchmarkGmrof: 200 },
  { grade: 'A3', segmentCode: 'WIW', benchmarkSpacePercent: 25, benchmarkGmrof: 245 },
  { grade: 'A3', segmentCode: 'WWW', benchmarkSpacePercent: 18, benchmarkGmrof: 215 },
  { grade: 'A3', segmentCode: 'KW', benchmarkSpacePercent: 20, benchmarkGmrof: 190 },
];

// ── Store Diagnostics (AI-generated reasons for underperformance) ──

export const storeDiagnostics: StoreDiagnostic[] = [
  { storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', reasons: ['KW over-allocated by 1% vs benchmark — lowest GMROF segment', '8 fixtures below 60% utilization — dead options consuming space', 'Celio GMROF Rs 192 — below 70% exit threshold for 2 quarters'] },
  { storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', reasons: ['AOP run rate Rs 6.35 Cr vs target Rs 6.70 Cr — 5.2% gap', 'KW efficiency 0.71 — below 0.8 threshold, dragging store SPSF', 'MF NSV% (19.8%) near space% (20.0%) — expansion trigger close'] },
  { storeId: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42', reasons: ['14 fixtures below 60% utilization — highest in A-grade cohort', 'Fixture utilization 76% vs A-grade benchmark 82%', 'WWW space% 16% vs benchmark 21% — underpenetrated for catchment'] },
  { storeId: '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75', reasons: ['AOP gap: run rate Rs 4.02 Cr vs target Rs 4.49 Cr — 10.5% shortfall', 'MF efficiency 0.95 — underperforming for A1 grade', 'Avaasa GMROF 1.3x module avg — expansion trigger met but not actioned'] },
  { storeId: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97', reasons: ['AOP gap: run rate Rs 3.72 Cr vs target Rs 4.14 Cr — 10.1% shortfall', 'MF efficiency 0.92 — lowest in store, dragging overall GMROF', '15 underperforming fixtures — consolidation could free 180 SFT'] },
  { storeId: '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a', reasons: ['18 underperforming fixtures — highest in A1 cohort', 'Fixture utilization 68% vs A1 benchmark 74%', 'AOP gap: Rs 3.48 Cr vs Rs 3.91 Cr — 11.0% shortfall'] },
  { storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20', reasons: ['KW at 22% vs A2 benchmark 20% — over-allocated low-GMROF segment', 'Celio GMROF Rs 192 — exit candidate, below 70% threshold', 'AOP gap: Rs 2.18 Cr vs Rs 2.57 Cr — 15.2% shortfall'] },
  { storeId: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b', reasons: ['Fixture utilization 62% — lowest in A2 cohort', '18 underperforming fixtures — consolidation priority', 'Gini & Jony GMROF Rs 165 — exit candidate in KW'] },
  { storeId: '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20', reasons: ['AOP gap: Rs 1.42 Cr vs Rs 1.66 Cr — 14.5% shortfall', 'Soch GMROF Rs 188 — below exit threshold for 3 quarters in WIW', 'Fixture utilization 60% — below A3 benchmark 65%'] },
  { storeId: '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c', reasons: ['AOP gap: Rs 1.22 Cr vs Rs 1.48 Cr — 17.6% shortfall (worst in network)', '16 underperforming fixtures out of 66 total — 24% dead weight', 'MF efficiency 0.92 — underperforming, consider reducing allocation'] },
];

// ══════════════════════════════════════════════════════════════════════════════
// BULK STORE GENERATION — 3,637 deterministic stores → 3,647 total with hero
// ══════════════════════════════════════════════════════════════════════════════

interface SpaceCityDef {
  name: string;
  zone: 'West' | 'North' | 'South' | 'East';
  cluster: string;
  tier: 1 | 2 | 3;
  lat: number;
  lng: number;
}

const SPACE_CITIES: SpaceCityDef[] = [
  // Tier 1 (~40% of stores)
  { name: 'Mumbai', zone: 'West', cluster: 'Mumbai Metro', tier: 1, lat: 19.076, lng: 72.878 },
  { name: 'Delhi', zone: 'North', cluster: 'Delhi NCR', tier: 1, lat: 28.614, lng: 77.209 },
  { name: 'Bangalore', zone: 'South', cluster: 'Bangalore Metro', tier: 1, lat: 12.972, lng: 77.595 },
  { name: 'Chennai', zone: 'South', cluster: 'Chennai Metro', tier: 1, lat: 13.083, lng: 80.271 },
  { name: 'Hyderabad', zone: 'South', cluster: 'Hyderabad Metro', tier: 1, lat: 17.385, lng: 78.487 },
  { name: 'Kolkata', zone: 'East', cluster: 'Kolkata Metro', tier: 1, lat: 22.573, lng: 88.364 },
  { name: 'Pune', zone: 'West', cluster: 'Pune Metro', tier: 1, lat: 18.520, lng: 73.857 },
  { name: 'Ahmedabad', zone: 'West', cluster: 'Ahmedabad Metro', tier: 1, lat: 23.023, lng: 72.571 },
  // Tier 2 (~35% of stores)
  { name: 'Jaipur', zone: 'North', cluster: 'Rajasthan', tier: 2, lat: 26.912, lng: 75.787 },
  { name: 'Lucknow', zone: 'North', cluster: 'UP East', tier: 2, lat: 26.847, lng: 80.946 },
  { name: 'Chandigarh', zone: 'North', cluster: 'Punjab & Haryana', tier: 2, lat: 30.733, lng: 76.779 },
  { name: 'Indore', zone: 'West', cluster: 'MP & CG', tier: 2, lat: 22.720, lng: 75.858 },
  { name: 'Nagpur', zone: 'West', cluster: 'Maharashtra Rest', tier: 2, lat: 21.146, lng: 79.088 },
  { name: 'Surat', zone: 'West', cluster: 'Gujarat', tier: 2, lat: 21.170, lng: 72.831 },
  { name: 'Kochi', zone: 'South', cluster: 'Kerala', tier: 2, lat: 9.931, lng: 76.267 },
  { name: 'Coimbatore', zone: 'South', cluster: 'Tamil Nadu', tier: 2, lat: 11.017, lng: 76.956 },
  { name: 'Visakhapatnam', zone: 'South', cluster: 'AP & Telangana', tier: 2, lat: 17.687, lng: 83.219 },
  { name: 'Patna', zone: 'East', cluster: 'Bihar & Jharkhand', tier: 2, lat: 25.609, lng: 85.138 },
  { name: 'Bhubaneswar', zone: 'East', cluster: 'Odisha & NE', tier: 2, lat: 20.296, lng: 85.825 },
  { name: 'Guwahati', zone: 'East', cluster: 'Odisha & NE', tier: 2, lat: 26.145, lng: 91.736 },
  { name: 'Vadodara', zone: 'West', cluster: 'Gujarat', tier: 2, lat: 22.307, lng: 73.181 },
  { name: 'Noida', zone: 'North', cluster: 'Delhi NCR', tier: 2, lat: 28.535, lng: 77.391 },
  { name: 'Gurgaon', zone: 'North', cluster: 'Delhi NCR', tier: 2, lat: 28.459, lng: 77.027 },
  // Tier 3 (~25% of stores)
  { name: 'Ranchi', zone: 'East', cluster: 'Bihar & Jharkhand', tier: 3, lat: 23.344, lng: 85.310 },
  { name: 'Raipur', zone: 'West', cluster: 'MP & CG', tier: 3, lat: 21.251, lng: 81.630 },
  { name: 'Jodhpur', zone: 'North', cluster: 'Rajasthan', tier: 3, lat: 26.239, lng: 73.024 },
  { name: 'Udaipur', zone: 'North', cluster: 'Rajasthan', tier: 3, lat: 24.585, lng: 73.713 },
  { name: 'Aurangabad', zone: 'West', cluster: 'Maharashtra Rest', tier: 3, lat: 19.876, lng: 75.343 },
  { name: 'Mangalore', zone: 'South', cluster: 'Karnataka Rest', tier: 3, lat: 12.914, lng: 74.856 },
  { name: 'Madurai', zone: 'South', cluster: 'Tamil Nadu', tier: 3, lat: 9.925, lng: 78.120 },
  { name: 'Varanasi', zone: 'North', cluster: 'UP East', tier: 3, lat: 25.318, lng: 82.974 },
  { name: 'Amritsar', zone: 'North', cluster: 'Punjab & Haryana', tier: 3, lat: 31.634, lng: 74.872 },
  { name: 'Agra', zone: 'North', cluster: 'UP West', tier: 3, lat: 27.177, lng: 78.008 },
  { name: 'Nashik', zone: 'West', cluster: 'Maharashtra Rest', tier: 3, lat: 19.998, lng: 73.790 },
  { name: 'Hubli', zone: 'South', cluster: 'Karnataka Rest', tier: 3, lat: 15.365, lng: 75.124 },
  { name: 'Meerut', zone: 'North', cluster: 'UP West', tier: 3, lat: 28.984, lng: 77.706 },
  { name: 'Mysore', zone: 'South', cluster: 'Karnataka Rest', tier: 3, lat: 12.296, lng: 76.639 },
  { name: 'Bhopal', zone: 'West', cluster: 'MP & CG', tier: 3, lat: 23.260, lng: 77.413 },
  { name: 'Siliguri', zone: 'East', cluster: 'Odisha & NE', tier: 3, lat: 26.727, lng: 88.395 },
  { name: 'Dehradun', zone: 'North', cluster: 'Punjab & Haryana', tier: 3, lat: 30.317, lng: 78.032 },
  { name: 'Thiruvananthapuram', zone: 'South', cluster: 'Kerala', tier: 3, lat: 8.524, lng: 76.937 },
];

/** mulberry32 — high-quality 32-bit PRNG (same as mockStoreGenerator.ts) */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function bulkUUID(rand: () => number): string {
  const hex = (n: number) => { let s = ''; for (let i = 0; i < n; i++) s += Math.floor(rand() * 16).toString(16); return s; };
  return `${hex(8)}-${hex(4)}-4${hex(3)}-${['8', '9', 'a', 'b'][Math.floor(rand() * 4)]}${hex(3)}-${hex(12)}`;
}

function weightedPick<T>(rand: () => number, items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return items[i]!;
  }
  return items[items.length - 1]!;
}

const GRADE_RANGES: Record<StoreGradeOM, {
  carpet: [number, number]; spsf: [number, number]; gmrof: [number, number];
  util: [number, number]; underperf: [number, number]; aopCr: [number, number];
}> = {
  A:  { carpet: [10000, 13000], spsf: [720, 900], gmrof: [340, 400], util: [72, 85], underperf: [5, 12], aopCr: [5.5, 7.5] },
  A1: { carpet: [8000, 10000], spsf: [590, 780], gmrof: [290, 340], util: [62, 78], underperf: [10, 18], aopCr: [3.5, 5.0] },
  A2: { carpet: [6500, 8000],  spsf: [400, 560], gmrof: [230, 280], util: [48, 70], underperf: [12, 20], aopCr: [2.0, 3.5] },
  A3: { carpet: [5000, 7000],  spsf: [290, 420], gmrof: [180, 230], util: [35, 64], underperf: [12, 20], aopCr: [1.0, 2.0] },
};

function generateBulkData() {
  const rand = mulberry32(42_424_242);
  const BULK_COUNT = 3637;

  const t1 = SPACE_CITIES.filter(c => c.tier === 1);
  const t2 = SPACE_CITIES.filter(c => c.tier === 2);
  const t3 = SPACE_CITIES.filter(c => c.tier === 3);

  const grades: StoreGradeOM[] = ['A', 'A1', 'A2', 'A3'];
  const gradeWeights = [10, 20, 35, 35];
  const formats: StoreSpaceProfile['format'][] = ['Trends', 'Yousta', 'Fashion Factory', 'AZORTE'];
  const formatWeights = [50, 20, 20, 10];
  const segNames = ['Menswear Casual', 'Menswear Formal', 'Women Indian Wear', 'Women Western Wear', 'Kidswear'];
  const segCodes = ['MC', 'MF', 'WIW', 'WWW', 'KW'];

  const stores: StoreSpaceProfile[] = [];
  const allocs: StoreSegmentData[] = [];
  const recs: SpaceRecommendation[] = [];
  const fashSplits: Record<string, StoreFashionSplit[]> = {};
  const diags: StoreDiagnostic[] = [];
  const cityCounts: Record<string, number> = {};

  for (let i = 0; i < BULK_COUNT; i++) {
    // Tier-weighted city selection
    const tierRoll = rand();
    const cityPool = tierRoll < 0.40 ? t1 : tierRoll < 0.75 ? t2 : t3;
    const city = cityPool[Math.floor(rand() * cityPool.length)]!;
    cityCounts[city.name] = (cityCounts[city.name] || 0) + 1;
    const cityNum = cityCounts[city.name]!;

    const storeId = bulkUUID(rand);
    const grade = weightedPick(rand, grades, gradeWeights);
    const format = weightedPick(rand, formats, formatWeights);
    const ranges = GRADE_RANGES[grade];

    const randRange = (min: number, max: number) => min + rand() * (max - min);

    const carpetArea = Math.round(randRange(...ranges.carpet));
    const saleableRatio = 62 + rand() * 4;
    const saleableArea = Math.round(carpetArea * saleableRatio / 100);
    const totalFixtures = Math.round(saleableArea / 60);
    const optionCapacity = Math.round(totalFixtures * 14.2);
    const garmentCapacity = Math.round(optionCapacity * 10.7);
    const spsf = Math.round(randRange(...ranges.spsf));
    const gmrof = Math.round(randRange(...ranges.gmrof));
    const fixtureUtilization = Math.round(randRange(...ranges.util));
    const underperformingFixtures = Math.round(randRange(...ranges.underperf));
    const aopTargetCr = Math.round(randRange(...ranges.aopCr) * 100) / 100;
    const aopRunRateCr = Math.round(aopTargetCr * (0.82 + rand() * 0.24) * 100) / 100;
    const planStatus: StoreSpaceProfile['planStatus'] = rand() < 0.40 ? 'draft' : rand() < 0.55 ? 'under-review' : rand() < 0.70 ? 'locked' : rand() < 0.90 ? 'active' : 'superseded';
    const planVersion = planStatus === 'draft' ? 'v1.0' : planStatus === 'under-review' ? `v${1 + Math.floor(rand() * 3)}.${Math.floor(rand() * 5)}` : `v${2 + Math.floor(rand() * 3)}.0`;

    const decompression = Math.round(carpetArea * 0.03);
    const mainAisles = Math.round(carpetArea * 0.12);
    const trialRooms = Math.round(carpetArea * 0.04);
    const cashCounters = Math.round(carpetArea * 0.025);
    const stockroomStaff = Math.max(0, Math.round(carpetArea - saleableArea) - decompression - mainAisles - trialRooms - cashCounters);

    const storeName = pickRealStoreName(city.name, cityNum - 1);
    stores.push({
      storeId,
      storeName,
      city: city.name, zone: city.zone, cluster: city.cluster, format,
      latitude: Math.round((city.lat + (rand() - 0.5) * 0.3) * 1000) / 1000,
      longitude: Math.round((city.lng + (rand() - 0.5) * 0.3) * 1000) / 1000,
      grade, carpetArea, saleableArea, saleableRatio: Math.round(saleableRatio * 10) / 10,
      deductions: { decompression, mainAisles, trialRooms, cashCounters, stockroomStaff },
      totalFixtures, optionCapacity, garmentCapacity, spsf, gmrof,
      aopTargetCr, aopRunRateCr, fixtureUtilization, underperformingFixtures,
      competitors: [],
      competitiveInsight: `Grade ${grade} store in ${city.cluster}. Performance ${fixtureUtilization >= 70 ? 'on track' : 'requires review'}.`,
      hit: 'H4', planStatus, planVersion,
      ...(planStatus === 'locked' || planStatus === 'active' ? { planLockedBy: 'Priya Sharma', planLockedAt: '2026-03-28' } : {}),
    });

    // ── Segment allocations (5 segments summing to 100%) ──
    const basePcts = [22, 17, 24, 19, 18];
    const jitteredPcts = basePcts.map(p => p + (rand() - 0.5) * 6);
    const pctSum = jitteredPcts.reduce((a, b) => a + b, 0);
    const normPcts = jitteredPcts.map(p => Math.round(p / pctSum * 100));
    normPcts[4] = 100 - normPcts[0]! - normPcts[1]! - normPcts[2]! - normPcts[3]!;

    // Segment-level revenue biases: WIW/MC earn more per sqft, KW/MF earn less
    const segNsvBias: Record<string, number> = { MC: 1.06, MF: 0.91, WIW: 1.10, WWW: 1.03, KW: 0.82 };
    // Segment GMROF biases: WIW has highest margin density, KW lowest
    const segGmrofBias: Record<string, number> = { MC: 1.15, MF: 0.85, WIW: 1.25, WWW: 1.05, KW: 0.70 };
    const segments: SegmentAllocation[] = segCodes.map((code, si) => {
      const pct = normPcts[si]!;
      const sft = Math.round(saleableArea * pct / 100);
      const bias = segNsvBias[code] ?? 1.0;
      const nsvJitter = (0.85 + rand() * 0.30) * bias;
      const rawNsvPct = Math.round(pct * nsvJitter * 10) / 10;
      const efficiency = Math.round(rawNsvPct / pct * 100) / 100;
      const gmrofBias = segGmrofBias[code] ?? 1.0;
      const segGmrof = Math.round(gmrof * gmrofBias * (0.85 + rand() * 0.30));
      const fixtures = Math.max(1, Math.round(totalFixtures * pct / 100));
      const options = Math.round(fixtures * 14);
      const garments = Math.round(options * 10.7);
      return { segment: segNames[si]!, segmentCode: code, sft, spacePercent: pct, nsvPercent: rawNsvPct, efficiency, gmrof: segGmrof, fixtures, options, garments };
    });

    // Normalize nsvPercent to sum to 100
    const nsvSum = segments.reduce((s, seg) => s + seg.nsvPercent, 0);
    if (nsvSum > 0) {
      segments.forEach(seg => { seg.nsvPercent = Math.round(seg.nsvPercent / nsvSum * 1000) / 10; });
      const roundErr = 100 - segments.reduce((s, seg) => s + seg.nsvPercent, 0);
      segments[4]!.nsvPercent = Math.round((segments[4]!.nsvPercent + roundErr) * 10) / 10;
      segments.forEach(seg => { seg.efficiency = Math.round(seg.nsvPercent / seg.spacePercent * 100) / 100; });
    }

    allocs.push({ storeId, segments });

    // ── Fashion splits ──
    fashSplits[storeId] = segments.map(seg => {
      const core = 42 + Math.round(rand() * 10);
      const ultimate = 18 + Math.round(rand() * 10);
      const fashionMax = Math.max(0, 100 - core - ultimate - 4);
      const fashion = Math.min(14 + Math.round(rand() * 8), fashionMax);
      return { segment: seg.segment, core, ultimate, fashion, fastFashion: Math.max(0, 100 - core - ultimate - fashion) };
    });

    // ── Diagnostics ──
    const reasons: string[] = [];
    if (aopRunRateCr < aopTargetCr) {
      reasons.push(`AOP gap: Rs ${aopRunRateCr} Cr vs target Rs ${aopTargetCr} Cr — ${Math.round((aopTargetCr - aopRunRateCr) / aopTargetCr * 100)}% shortfall`);
    }
    if (fixtureUtilization < 70) reasons.push(`Fixture utilization ${fixtureUtilization}% — below ${grade} benchmark`);
    const lowEffSeg = segments.find(s => s.efficiency < 0.85);
    if (lowEffSeg) reasons.push(`${lowEffSeg.segmentCode} efficiency ${lowEffSeg.efficiency.toFixed(2)} — dragging store performance`);
    if (reasons.length > 0) diags.push({ storeId, reasons });

    // ── Recommendations (~25% of random stores + ALL stores below SPSF min threshold) ──
    const gradeFloor = spsfTargets.find(t => t.grade === grade)?.floor ?? 0;
    const isBelowThreshold = spsf < gradeFloor;
    if (isBelowThreshold || rand() < 0.25) {
      const lowSeg = segments.reduce((a, b) => a.efficiency < b.efficiency ? a : b);
      const highSeg = segments.reduce((a, b) => a.efficiency > b.efficiency ? a : b);
      if (lowSeg.segmentCode !== highSeg.segmentCode && (isBelowThreshold || (lowSeg.efficiency < 0.9 && highSeg.efficiency > 1.0))) {
        const deltaPp = 3;
        const lowNsvL = Math.round(aopRunRateCr * 100 * lowSeg.nsvPercent / 100);
        const lowAvgNsv = lowSeg.options > 0 ? Math.round(lowNsvL / lowSeg.options * 100) / 100 : 0.3;
        const lowDeltaOpts = -Math.round(lowSeg.options * deltaPp / lowSeg.spacePercent);
        const highNsvL = Math.round(aopRunRateCr * 100 * highSeg.nsvPercent / 100);
        const highAvgNsv = highSeg.options > 0 ? Math.round(highNsvL / highSeg.options * 100) / 100 : 0.4;
        const highDeltaOpts = Math.round(highSeg.options * deltaPp / highSeg.spacePercent);

        recs.push({
          id: `sr-bulk-${i}-c`, storeId, storeName,
          title: `Reduce ${lowSeg.segment} area by ${deltaPp}pp (${lowSeg.spacePercent}% → ${lowSeg.spacePercent - deltaPp}%)`,
          segmentCode: lowSeg.segmentCode, segment: lowSeg.segment,
          currentSpacePct: lowSeg.spacePercent, recommendedSpacePct: lowSeg.spacePercent - deltaPp,
          currentSft: lowSeg.sft, newSft: Math.round(saleableArea * (lowSeg.spacePercent - deltaPp) / 100),
          currentOptions: lowSeg.options, newOptionCapacity: lowSeg.options + lowDeltaOpts,
          hierarchySplit: [],
          math: { currentSegNsvLakhs: lowNsvL, avgNsvPerOption: lowAvgNsv, deltaOptions: lowDeltaOpts, deltaNsvLakhs: Math.round(lowDeltaOpts * lowAvgNsv * 10) / 10, storeSaleableArea: saleableArea, spsfDelta: Math.round(rand() * 15 + 10) },
          trigger: `${lowSeg.segment} efficiency ${lowSeg.efficiency.toFixed(2)} — under-earning space for ${grade} grade`,
          constraint: `Freed area reallocated to ${highSeg.segment} (efficiency ${highSeg.efficiency.toFixed(2)})`,
          spsfDelta: Math.round(rand() * 15 + 10),
          executionPath: { stockStatus: 'in-dc' as const, dcUnitsAvailable: Math.abs(lowDeltaOpts) + 20, unitsNeeded: Math.abs(lowDeltaOpts), etaWeeks: 1 },
        });
        const expandStock = rand();
        recs.push({
          id: `sr-bulk-${i}-e`, storeId, storeName,
          title: `Expand ${highSeg.segment} area by ${deltaPp}pp (${highSeg.spacePercent}% → ${highSeg.spacePercent + deltaPp}%)`,
          segmentCode: highSeg.segmentCode, segment: highSeg.segment,
          currentSpacePct: highSeg.spacePercent, recommendedSpacePct: highSeg.spacePercent + deltaPp,
          currentSft: highSeg.sft, newSft: Math.round(saleableArea * (highSeg.spacePercent + deltaPp) / 100),
          currentOptions: highSeg.options, newOptionCapacity: highSeg.options + highDeltaOpts,
          hierarchySplit: [],
          math: { currentSegNsvLakhs: highNsvL, avgNsvPerOption: highAvgNsv, deltaOptions: highDeltaOpts, deltaNsvLakhs: Math.round(highDeltaOpts * highAvgNsv * 10) / 10, storeSaleableArea: saleableArea, spsfDelta: Math.round(rand() * 20 + 15) },
          trigger: `${highSeg.segment} efficiency ${highSeg.efficiency.toFixed(2)} — strong performer deserving more space`,
          constraint: `Absorbs freed area from ${lowSeg.segment} contraction`,
          spsfDelta: Math.round(rand() * 20 + 15),
          executionPath: expandStock < 0.5
            ? { stockStatus: 'in-dc' as const, dcUnitsAvailable: highDeltaOpts + 10, unitsNeeded: highDeltaOpts, etaWeeks: 2 }
            : expandStock < 0.8
              ? { stockStatus: 'in-pipeline' as const, unitsNeeded: highDeltaOpts, etaWeeks: Math.round(rand() * 3 + 2) }
              : { stockStatus: 'needs-ra' as const, unitsNeeded: highDeltaOpts, nextRACycle: 'RA-Jul-26' },
        });
      }
    }
  }

  return { stores, allocs, recs, fashionSplits: fashSplits, diagnostics: diags };
}

// Generate and merge bulk data into exported arrays
const _bulk = generateBulkData();
storeSpaceProfiles.push(..._bulk.stores);
storeSegmentAllocations.push(..._bulk.allocs);
spaceRecommendations.push(..._bulk.recs);
Object.assign(storeFashionSplits, _bulk.fashionSplits);
storeDiagnostics.push(..._bulk.diagnostics);

// ── Helper Functions ──

/** Category ID to segment code mapping */
export const categorySegmentMap: Record<string, string> = {
  'mens-casual': 'MC',
  'mens-formal': 'MF',
  'womens-ethnic': 'WIW',
  'womens-western': 'WWW',
  'kids-wear': 'KW',
};

/** Aggregates space summary for a segment across all stores */
export function getCategorySpaceSummary(segmentCode: string) {
  let totalSft = 0;
  let totalGmrof = 0;
  let totalEfficiency = 0;
  let totalOptions = 0;
  let totalFixtures = 0;
  let storeCount = 0;

  for (const store of storeSegmentAllocations) {
    const seg = store.segments.find((s) => s.segmentCode === segmentCode);
    if (seg) {
      totalSft += seg.sft;
      totalGmrof += seg.gmrof;
      totalEfficiency += seg.efficiency;
      totalOptions += seg.options;
      totalFixtures += seg.fixtures;
      storeCount++;
    }
  }

  return {
    totalSft,
    avgGmrof: storeCount > 0 ? Math.round(totalGmrof / storeCount) : 0,
    avgEfficiency: storeCount > 0 ? Math.round((totalEfficiency / storeCount) * 100) / 100 : 0,
    totalOptions,
    totalFixtures,
  };
}

export interface StoreCategorySpaceRow {
  storeId: string;
  storeName: string;
  grade: string;
  sft: number;
  gmrof: number;
  spacePercent: number;
  nsvPercent: number;
  efficiency: number;
  options: number;
  spsf: number;
  status: 'Expand' | 'Hold' | 'Contract' | 'Review';
}

/** Returns store-by-store category space data with computed status */
export function getStoreCategorySpace(
  segmentCode: string,
  stores: { id: string; name: string; grade: string }[]
): StoreCategorySpaceRow[] {
  // Calculate average GMROF for the segment
  let totalGmrof = 0;
  let count = 0;
  for (const storeData of storeSegmentAllocations) {
    const seg = storeData.segments.find((s) => s.segmentCode === segmentCode);
    if (seg) {
      totalGmrof += seg.gmrof;
      count++;
    }
  }
  const avgGmrof = count > 0 ? totalGmrof / count : 0;

  const rows: StoreCategorySpaceRow[] = [];

  for (const storeData of storeSegmentAllocations) {
    const seg = storeData.segments.find((s) => s.segmentCode === segmentCode);
    if (!seg) continue;

    const store = stores.find((s) => s.id === storeData.storeId);
    const profile = storeSpaceProfiles.find((p) => p.storeId === storeData.storeId);
    if (!store || !profile) continue;

    // Status logic per spec
    let status: StoreCategorySpaceRow['status'];
    if (seg.gmrof > avgGmrof * 1.15) {
      status = 'Expand';
    } else if (seg.gmrof < avgGmrof * 0.7) {
      status = 'Review';
    } else if (seg.gmrof < avgGmrof * 0.85) {
      status = 'Contract';
    } else {
      status = 'Hold';
    }

    rows.push({
      storeId: storeData.storeId,
      storeName: store.name,
      grade: store.grade,
      sft: seg.sft,
      gmrof: seg.gmrof,
      spacePercent: seg.spacePercent,
      nsvPercent: seg.nsvPercent,
      efficiency: seg.efficiency,
      options: seg.options,
      spsf: profile.spsf,
      status,
    });
  }

  return rows;
}

// ── Sprint: Brand Allocation Drill-Down ──

export interface BrandStoreAllocation {
  brandName: string;
  type: 'PL' | 'EB';
  tier: number;
  sft: number;
  gmrof: number;
  fixtures: number;
  options: number;
  penetration: number;
  indicator: 'expand' | 'exit' | null;
}

export function getStoreBrandAllocations(storeId: string, segmentCode: string): BrandStoreAllocation[] {
  const storeData = storeSegmentAllocations.find(s => s.storeId === storeId);
  if (!storeData) return [];
  const segment = storeData.segments.find(s => s.segmentCode === segmentCode);
  if (!segment) return [];

  const segBrands = categoryBrands[segmentCode];
  if (!segBrands || segBrands.length === 0) return [];

  const totalShare = segBrands.reduce((sum, b) => sum + b.avgSpacePercent, 0);
  const avgGmrof = segment.gmrof;

  const seed = parseInt(storeId.replace(/\D/g, ''), 10) || 1;
  const rand = seededRandom(seed * 3571 + segmentCode.charCodeAt(0));

  return segBrands.map(brand => {
    const share = brand.avgSpacePercent / totalShare;
    const sft = Math.round(segment.sft * share);
    const fixtures = Math.max(1, Math.round(segment.fixtures * share));
    const options = Math.round(segment.options * share);
    // Vary GMROF around the brand's network average, adjusted for store performance
    const storeMultiplier = segment.efficiency;
    const jitter = 0.9 + rand() * 0.2;
    const gmrof = Math.round(brand.avgGmrof * storeMultiplier * jitter);
    const penetration = Math.round(share * 100);

    const indicator: BrandStoreAllocation['indicator'] =
      gmrof > avgGmrof * 1.2 ? 'expand' :
      gmrof < avgGmrof * 0.7 ? 'exit' : null;

    return { brandName: brand.brandName, type: brand.brandType, tier: brand.tier, sft, gmrof, fixtures, options, penetration, indicator };
  }).sort((a, b) => b.gmrof - a.gmrof);
}

// ── 10-Step Space Planning Methodology Pipeline ──

export interface AllocationProcessStep {
  step: number;
  name: string;
  shortName: string;
  status: 'complete' | 'warning' | 'in-progress';
  outputSummary: string;
  detail: string;
  inputLabel: string;
  outputLabel: string;
}

export function getStoreAllocationProcess(storeId: string): AllocationProcessStep[] {
  const profile = storeSpaceProfiles.find(p => p.storeId === storeId);
  if (!profile) return [];

  const storeData = storeSegmentAllocations.find(s => s.storeId === storeId);
  const allocs = storeData?.segments || [];
  const topSegment = allocs.length > 0
    ? allocs.reduce((a, b) => a.gmrof > b.gmrof ? a : b)
    : null;
  const fixtures = generateStoreFixtures(storeId);
  const overflows = fixtures.filter(f => f.currentQty > f.maxQty).length;
  const totalDeductions = profile.deductions.decompression + profile.deductions.mainAisles + profile.deductions.trialRooms + profile.deductions.cashCounters + profile.deductions.stockroomStaff;

  const splits = storeFashionSplits[storeId];
  const fashionWarning = splits
    ? splits.some(s => {
        const ffPct = s.fastFashion;
        const maxFf = fashionGradeRules.find(r => r.grade === 'APL-Fast Fashion');
        return maxFf ? ffPct > maxFf.targetMax : false;
      })
    : false;

  const pendingRecs = spaceRecommendations.filter(r => r.storeId === storeId).length;
  const gradeTarget = spsfTargets.find(t => t.grade === profile.grade);

  return [
    {
      step: 1, name: 'Carpet to Saleable Area', shortName: 'Area',
      status: 'complete',
      inputLabel: `Carpet: ${profile.carpetArea.toLocaleString()} SFT`,
      outputLabel: `Saleable: ${profile.saleableArea.toLocaleString()} SFT (${profile.saleableRatio}%)`,
      outputSummary: `${profile.saleableArea.toLocaleString()} SFT net`,
      detail: `Carpet ${profile.carpetArea.toLocaleString()} SFT minus ${totalDeductions.toLocaleString()} SFT deductions (aisles, trial rooms, cash counters, stockroom) = ${profile.saleableArea.toLocaleString()} SFT saleable at ${profile.saleableRatio}% efficiency.`,
    },
    {
      step: 2, name: 'Merchandise Classification', shortName: 'Classify',
      status: 'complete',
      inputLabel: `${allocs.length} segments identified`,
      outputLabel: 'Segment → Family → Class → Brick',
      outputSummary: `${allocs.length} segments, 5 levels`,
      detail: `Store classified into ${allocs.length} merchandise segments (${allocs.map(a => a.segmentCode).join(', ')}). Each segment further broken into Family → Class → Brick hierarchy.`,
    },
    {
      step: 3, name: 'Segment Space Allocation', shortName: 'Segments',
      status: 'complete',
      inputLabel: `Grade ${profile.grade} benchmark mix`,
      outputLabel: topSegment ? `Top: ${topSegment.segmentCode} at ${topSegment.spacePercent}%` : 'Allocated',
      outputSummary: topSegment ? `Top: ${topSegment.segmentCode} (${topSegment.spacePercent}%)` : 'Allocated',
      detail: `Saleable area distributed across segments based on Grade ${profile.grade} benchmark mix and store-specific GMROF performance. Each segment's space% vs revenue% determines efficiency.`,
    },
    {
      step: 4, name: 'Family & Class Allocation', shortName: 'Family',
      status: 'complete',
      inputLabel: 'Segment allocations',
      outputLabel: `${allocs.reduce((s, a) => s + a.options, 0).toLocaleString()} options planned`,
      outputSummary: `${allocs.reduce((s, a) => s + a.options, 0).toLocaleString()} options`,
      detail: 'Within each segment, space allocated to product families (e.g., T-Shirts, Jeans in MC) and classes (Round-neck, Slim-fit). Brick-level coverage validated against minimum assortment rules.',
    },
    {
      step: 5, name: 'Brick Mix & Depth', shortName: 'Bricks',
      status: 'complete',
      inputLabel: 'Family allocations',
      outputLabel: `${allocs.reduce((s, a) => s + a.garments, 0).toLocaleString()} garments capacity`,
      outputSummary: `${allocs.reduce((s, a) => s + a.garments, 0).toLocaleString()} garments`,
      detail: 'Brick-level depth (options per size × size set) calculated. Determines how many garments per option per fixture. Size set typically 8 (XS-3XL).',
    },
    {
      step: 6, name: 'Fashion Grade Assignment', shortName: 'Fashion',
      status: fashionWarning ? 'warning' : 'complete',
      inputLabel: 'Core/Ultimate/Fashion/FF rules',
      outputLabel: fashionWarning ? 'Split deviation detected' : 'Core+Ultimate ≥70% met',
      outputSummary: fashionWarning ? 'Deviation detected' : 'Compliant',
      detail: fashionWarning
        ? 'One or more segments exceed Fast Fashion ceiling (10%). Core+Ultimate floor is 70%. Review fashion grade allocation.'
        : 'Fashion grade split compliant: Core+Ultimate ≥70%, Fashion+FastFashion ≤30%. Stock cover rules applied (Core: 30d auto-replenish, Fashion: 60d one-time buy).',
    },
    {
      step: 7, name: 'Fixture Assignment', shortName: 'Fixtures',
      status: overflows > 0 ? 'warning' : 'complete',
      inputLabel: `${fixtures.length} fixtures in store`,
      outputLabel: overflows > 0 ? `${overflows} capacity overflows` : `${profile.fixtureUtilization}% utilized`,
      outputSummary: `${fixtures.length} fixtures, ${profile.fixtureUtilization}% util`,
      detail: `${fixtures.length} fixtures (4-Way, Wall Panels, H-Gondola, etc.) assigned to segments and brands. Each fixture has option capacity (e.g., 4-Way = 4 options × 8 sizes = 32 garments). ${profile.underperformingFixtures} fixtures below 60% utilization.`,
    },
    {
      step: 8, name: 'Depth Calculation', shortName: 'Depth',
      status: 'complete',
      inputLabel: 'Fixture capacity × size set',
      outputLabel: `Density: ${(profile.garmentCapacity / profile.saleableArea).toFixed(1)} garments/SFT`,
      outputSummary: `${(profile.garmentCapacity / profile.saleableArea).toFixed(1)} garments/SFT`,
      detail: `Option depth = fixture capacity × size set. Total garment capacity ${profile.garmentCapacity.toLocaleString()}. Stocking density ${(profile.garmentCapacity / profile.saleableArea).toFixed(1)} garments/SFT (target: 2.2).`,
    },
    {
      step: 9, name: 'Financial Validation', shortName: 'Validate',
      status: gradeTarget && profile.spsf < gradeTarget.floor ? 'warning' : 'complete',
      inputLabel: `Grade ${profile.grade} targets`,
      outputLabel: `SPSF Rs ${profile.spsf} | GMROF Rs ${profile.gmrof}`,
      outputSummary: `SPSF Rs ${profile.spsf}, GMROF Rs ${profile.gmrof}`,
      detail: `SPSF Rs ${profile.spsf}/SFT vs target Rs ${gradeTarget?.target ?? '--'} (floor Rs ${gradeTarget?.floor ?? '--'}). GMROF Rs ${profile.gmrof}/SFT. AOP run rate Rs ${profile.aopRunRateCr} Cr vs target Rs ${profile.aopTargetCr} Cr.`,
    },
    {
      step: 10, name: 'Iterate & Lock', shortName: 'Lock',
      status: pendingRecs > 0 ? 'in-progress' : (profile.planStatus === 'locked' || profile.planStatus === 'active') ? 'complete' : 'in-progress',
      inputLabel: `${pendingRecs} recommendations pending`,
      outputLabel: (profile.planStatus === 'locked' || profile.planStatus === 'active') ? 'Plan locked' : `${pendingRecs} actions to review`,
      outputSummary: (profile.planStatus === 'locked' || profile.planStatus === 'active') ? 'Locked' : `${pendingRecs} pending`,
      detail: pendingRecs > 0
        ? `${pendingRecs} AI-generated recommendations awaiting review. Accept/reject each, then re-run financial validation to confirm SPSF/GMROF improvement before locking.`
        : (profile.planStatus === 'locked' || profile.planStatus === 'active')
          ? 'All recommendations addressed. Plan locked for Hit execution.'
          : 'Recommendations addressed but plan not yet locked. Review and lock to finalize.',
    },
  ];
}

// ── Sprint: Area Breakdown & Capacity ──

export interface StoreAreaBreakdown {
  totalCarpetArea: number;
  deductions: { label: string; sqft: number }[];
  netSaleableArea: number;
  saleablePct: number;
}

export function getStoreAreaBreakdown(storeId: string): StoreAreaBreakdown | null {
  const profile = storeSpaceProfiles.find(p => p.storeId === storeId);
  if (!profile) return null;

  return {
    totalCarpetArea: profile.carpetArea,
    deductions: [
      { label: 'Entry Decompression', sqft: profile.deductions.decompression },
      { label: 'Main Aisles', sqft: profile.deductions.mainAisles },
      { label: 'Trial Rooms', sqft: profile.deductions.trialRooms },
      { label: 'Cash Counters', sqft: profile.deductions.cashCounters },
      { label: 'Stockroom / Staff', sqft: profile.deductions.stockroomStaff },
    ],
    netSaleableArea: profile.saleableArea,
    saleablePct: profile.saleableRatio,
  };
}

export interface CapacitySummary {
  fixtures: number;
  options: number;
  garments: number;
  density: number;
}

export function getStoreCapacitySummary(storeId: string): CapacitySummary | null {
  const profile = storeSpaceProfiles.find(p => p.storeId === storeId);
  if (!profile) return null;

  return {
    fixtures: profile.totalFixtures,
    options: profile.optionCapacity,
    garments: profile.garmentCapacity,
    density: Math.round((profile.garmentCapacity / profile.saleableArea) * 100) / 100,
  };
}

// ── RA → Fixture Assignment (Option Productionization View) ──

export interface FixtureSlotAssignment {
  fixtureCode: string;
  fixtureType: string;
  displayMethod: 'Face-out' | 'Side-hang' | 'Shelf-stack' | 'Wall-mount';
  fashionGrade: 'Core' | 'Fashion' | 'Fast Fashion';
  slotsUsed: number;
  slotsTotal: number;
  utilization: number;
  assignedOptions: { brickCode: string; brickName: string; slotsConsumed: number }[];
  availableSlots: number;
}

export function getSegmentFixtureAssignments(storeId: string, segmentCode: string): FixtureSlotAssignment[] {
  const fixtures = generateStoreFixtures(storeId).filter(f => {
    const segMap: Record<string, string> = {
      "Men's Casual": 'MC', "Menswear Casual": 'MC',
      "Men's Formal": 'MF', "Menswear Formal": 'MF',
      "Women's Indian Wear": 'WIW', "Women Indian Wear": 'WIW',
      "Women's Western Wear": 'WWW', "Women Western Wear": 'WWW',
      "Kids Wear": 'KW', "Kidswear": 'KW',
    };
    return segMap[f.segment] === segmentCode;
  });

  const brickNames: Record<string, string[]> = {
    MC: ['Casual Shirts', 'Polo T-Shirts', 'Denim Jeans', 'Chinos', 'Joggers', 'Jackets', 'Sweatshirts', 'Shorts'],
    MF: ['Formal Shirts', 'Trousers', 'Blazers', 'Suits', 'Ties & Accessories', 'Formal Shoes'],
    WIW: ['Kurtas', 'Salwar Sets', 'Sarees', 'Dupattas', 'Lehengas', 'Palazzo Sets', 'Anarkalis'],
    WWW: ['Tops', 'Dresses', 'Jeans', 'Skirts', 'Jumpsuits', 'Blazers', 'Co-ord Sets'],
    KW: ['Boys Casual', 'Girls Ethnic', 'Boys Formal', 'Girls Western', 'Infant Wear', 'Teen Casual'],
  };

  const seed = parseInt(storeId.replace(/\D/g, ''), 10) || 1;
  const rand = seededRandom(seed * 3571);
  const names = brickNames[segmentCode] || ['General'];

  return fixtures.map((f, idx) => {
    const isWall = f.fixtureTypeName.toLowerCase().includes('wall');
    const isArail = f.fixtureTypeName.toLowerCase().includes('arail');
    const displayMethod: FixtureSlotAssignment['displayMethod'] = isWall ? 'Wall-mount' : isArail ? 'Side-hang' : 'Face-out';
    const fashionGrade: FixtureSlotAssignment['fashionGrade'] = isWall ? 'Core' : isArail && rand() > 0.4 ? 'Core' : rand() > 0.6 ? 'Fast Fashion' : 'Fashion';

    // Generate assigned options (bricks)
    const assignedCount = f.currentOptions;
    const assigned: FixtureSlotAssignment['assignedOptions'] = [];
    let remaining = assignedCount;
    let brickIdx = 0;
    while (remaining > 0 && brickIdx < 4) {
      const name = names[(idx + brickIdx) % names.length] ?? 'General';
      const slots = Math.min(remaining, Math.max(1, Math.round(f.maxOptions * (0.15 + rand() * 0.2))));
      assigned.push({
        brickCode: `${segmentCode}-${String(idx + 1).padStart(2, '0')}-${String(brickIdx + 1).padStart(2, '0')}`,
        brickName: name,
        slotsConsumed: slots,
      });
      remaining -= slots;
      brickIdx++;
    }

    return {
      fixtureCode: f.fixtureCode,
      fixtureType: f.fixtureTypeName,
      displayMethod,
      fashionGrade,
      slotsUsed: f.currentOptions,
      slotsTotal: f.maxOptions,
      utilization: f.utilization,
      assignedOptions: assigned,
      availableSlots: f.maxOptions - f.currentOptions,
    };
  });
}

// ── RA → VM → Fixture Demand ──
// RA owns: Segment → Family → Brick → Fashion Grade → Options/Depth
// VM owns: Brick → Garment Type → Display Method → Fixture Type assignment

/** RA brick — only what Range Architecture knows */
export interface RABrick {
  brickCode: string;
  brickName: string;
  familyName: string;
  segmentCode: string;
  fashionGrade: 'Core' | 'Fashion' | 'Fast Fashion';
  optionsPlanned: number;
  depthPerOption: number; // size set
}

/** VM display rule — maps a brick to its merchandising treatment */
export interface VMDisplayRule {
  brickCode: string;
  garmentType: 'Hanging' | 'Folded' | 'Accessory' | 'Styled';
  displayMethod: DisplayMethod;
  preferredFixtures: string[]; // fixture names in priority order
}

/** Result of computing fixture demand from RA + VM */
export interface FixtureDemandResult {
  fixtureType: string;
  fixtureCode: string;
  displayMethod: DisplayMethod;
  areaSqft: number;
  optionCapacity: number;
  fixturesNeeded: number;
  totalAreaSqft: number;
  totalSlots: number;
  slotsConsumed: number;
  utilization: number;
  bricks: { brickCode: string; brickName: string; familyName: string; fashionGrade: string; options: number; slotsUsed: number; vmGarmentType: string }[];
}

/** Aggregate demand vs allocation for a segment */
export interface SegmentFixtureDemandSummary {
  segmentCode: string;
  totalOptionsFromRA: number;
  totalFixturesNeeded: number;
  totalAreaNeeded: number;
  allocatedAreaSqft: number;
  areaGap: number;
  areaGapPct: number;
  fixtureBreakdown: FixtureDemandResult[];
  raBricks: RABrick[];
  vmRules: VMDisplayRule[];
}

/** RA brick definitions per segment: Segment → Family → Brick → Grade */
const raBrickDefs: Record<string, { family: string; brick: string; grade: RABrick['fashionGrade'] }[]> = {
  MC: [
    { family: 'Topwear', brick: 'Casual Shirts', grade: 'Core' },
    { family: 'Topwear', brick: 'Polo T-Shirts', grade: 'Core' },
    { family: 'Bottomwear', brick: 'Denim Jeans', grade: 'Core' },
    { family: 'Bottomwear', brick: 'Chinos', grade: 'Fashion' },
    { family: 'Bottomwear', brick: 'Joggers', grade: 'Fashion' },
    { family: 'Outerwear', brick: 'Jackets', grade: 'Fast Fashion' },
    { family: 'Topwear', brick: 'Sweatshirts', grade: 'Fashion' },
    { family: 'Outerwear', brick: 'Shorts', grade: 'Core' },
  ],
  MF: [
    { family: 'Shirts', brick: 'Formal Shirts', grade: 'Core' },
    { family: 'Trousering', brick: 'Trousers', grade: 'Core' },
    { family: 'Suiting', brick: 'Blazers', grade: 'Fashion' },
    { family: 'Suiting', brick: 'Suits', grade: 'Fashion' },
    { family: 'Accessories', brick: 'Ties & Cufflinks', grade: 'Core' },
    { family: 'Shirts', brick: 'Dress Shirts', grade: 'Fashion' },
  ],
  WIW: [
    { family: 'Kurtas & Tunics', brick: 'Kurtas', grade: 'Core' },
    { family: 'Sets', brick: 'Salwar Sets', grade: 'Core' },
    { family: 'Drapes', brick: 'Sarees', grade: 'Core' },
    { family: 'Accessories', brick: 'Dupattas', grade: 'Core' },
    { family: 'Occasion', brick: 'Lehengas', grade: 'Fashion' },
    { family: 'Sets', brick: 'Palazzo Sets', grade: 'Fashion' },
    { family: 'Occasion', brick: 'Anarkalis', grade: 'Fast Fashion' },
  ],
  WWW: [
    { family: 'Topwear', brick: 'Tops', grade: 'Core' },
    { family: 'Dresses', brick: 'Dresses', grade: 'Fashion' },
    { family: 'Bottomwear', brick: 'Jeans', grade: 'Core' },
    { family: 'Bottomwear', brick: 'Skirts', grade: 'Fashion' },
    { family: 'Dresses', brick: 'Jumpsuits', grade: 'Fast Fashion' },
    { family: 'Co-ords', brick: 'Co-ord Sets', grade: 'Fashion' },
    { family: 'Outerwear', brick: 'Blazers', grade: 'Fashion' },
  ],
  KW: [
    { family: 'Boys', brick: 'Boys Casual', grade: 'Core' },
    { family: 'Girls', brick: 'Girls Ethnic', grade: 'Core' },
    { family: 'Boys', brick: 'Boys Formal', grade: 'Fashion' },
    { family: 'Girls', brick: 'Girls Western', grade: 'Fashion' },
    { family: 'Infant', brick: 'Infant Wear', grade: 'Core' },
    { family: 'Teen', brick: 'Teen Casual', grade: 'Fast Fashion' },
  ],
};

/** VM rules: brick → garment type → display method → preferred fixtures */
const vmRuleDefs: Record<string, { garmentType: VMDisplayRule['garmentType']; display: DisplayMethod; fixtures: string[] }> = {
  // Hanging garments → racks
  'Casual Shirts':    { garmentType: 'Hanging', display: 'Side-hang', fixtures: ['Arail', 'Arail'] },
  'Formal Shirts':    { garmentType: 'Hanging', display: 'Side-hang', fixtures: ['Arail', 'Arail'] },
  'Dress Shirts':     { garmentType: 'Hanging', display: 'Side-hang', fixtures: ['Arail'] },
  'Trousers':         { garmentType: 'Hanging', display: 'Side-hang', fixtures: ['Arail', 'Arail'] },
  'Denim Jeans':      { garmentType: 'Hanging', display: 'Face-out', fixtures: ['4-Way', 'Arail'] },
  'Chinos':           { garmentType: 'Hanging', display: 'Side-hang', fixtures: ['Arail'] },
  'Blazers':          { garmentType: 'Hanging', display: 'Face-out', fixtures: ['4-Way'] },
  'Suits':            { garmentType: 'Hanging', display: 'Face-out', fixtures: ['4-Way'] },
  'Jackets':          { garmentType: 'Hanging', display: 'Face-out', fixtures: ['4-Way', 'Arail'] },
  'Kurtas':           { garmentType: 'Hanging', display: 'Side-hang', fixtures: ['Arail', 'Wall Panels'] },
  'Salwar Sets':      { garmentType: 'Hanging', display: 'Face-out', fixtures: ['4-Way', 'Wall Panels'] },
  'Lehengas':         { garmentType: 'Hanging', display: 'Face-out', fixtures: ['4-Way'] },
  'Palazzo Sets':     { garmentType: 'Hanging', display: 'Side-hang', fixtures: ['Arail'] },
  'Anarkalis':        { garmentType: 'Hanging', display: 'Face-out', fixtures: ['4-Way', 'Arail'] },
  'Tops':             { garmentType: 'Hanging', display: 'Side-hang', fixtures: ['Arail', 'Wall Panels'] },
  'Dresses':          { garmentType: 'Hanging', display: 'Face-out', fixtures: ['4-Way'] },
  'Jeans':            { garmentType: 'Hanging', display: 'Side-hang', fixtures: ['Arail'] },
  'Skirts':           { garmentType: 'Hanging', display: 'Face-out', fixtures: ['4-Way', 'Wall Panels'] },
  'Jumpsuits':        { garmentType: 'Hanging', display: 'Face-out', fixtures: ['4-Way'] },
  'Boys Casual':      { garmentType: 'Hanging', display: 'Side-hang', fixtures: ['Arail'] },
  'Girls Ethnic':     { garmentType: 'Hanging', display: 'Face-out', fixtures: ['4-Way', 'Arail'] },
  'Boys Formal':      { garmentType: 'Hanging', display: 'Side-hang', fixtures: ['Arail'] },
  'Girls Western':    { garmentType: 'Hanging', display: 'Face-out', fixtures: ['4-Way'] },
  // Folded garments → tables & shelves
  'Polo T-Shirts':    { garmentType: 'Folded', display: 'Folded stack', fixtures: ['Nesting Table', 'H-Gondola'] },
  'Joggers':          { garmentType: 'Folded', display: 'Folded stack', fixtures: ['Nesting Table', 'H-Gondola'] },
  'Sweatshirts':      { garmentType: 'Folded', display: 'Folded stack', fixtures: ['Nesting Table', 'Wall Panels'] },
  'Shorts':           { garmentType: 'Folded', display: 'Folded stack', fixtures: ['Nesting Table', 'H-Gondola'] },
  'Co-ord Sets':      { garmentType: 'Folded', display: 'Front display', fixtures: ['Glass Table', 'Nesting Table'] },
  'Infant Wear':      { garmentType: 'Folded', display: 'Folded stack', fixtures: ['H-Gondola', 'Nesting Table'] },
  'Teen Casual':      { garmentType: 'Folded', display: 'Folded stack', fixtures: ['Nesting Table', 'Arail'] },
  // Drapes & accessories → shelves & wall
  'Sarees':           { garmentType: 'Folded', display: 'Shelved + Hang', fixtures: ['Wall Panels', 'Wall Panels'] },
  'Dupattas':         { garmentType: 'Accessory', display: 'Cascade', fixtures: ['Wall Panels', 'Wall Panels'] },
  'Ties & Cufflinks': { garmentType: 'Accessory', display: 'Grid display', fixtures: ['Wall Panels', 'Wall Panels'] },
};

/** Generate RA bricks for a store segment (RA data only — no VM attributes) */
function generateRABricks(storeId: string, segmentCode: string): RABrick[] {
  const seed = parseInt(storeId.replace(/\D/g, ''), 10) || 1;
  const rand = seededRandom(seed * 4219);
  const defs = raBrickDefs[segmentCode] || raBrickDefs['MC']!;

  return defs.map((def, idx) => {
    const isCore = def.grade === 'Core';
    const baseOptions = isCore ? 30 + Math.floor(rand() * 25) : 10 + Math.floor(rand() * 20);
    return {
      brickCode: `${segmentCode}-BRK-${String(idx + 1).padStart(2, '0')}`,
      brickName: def.brick,
      familyName: def.family,
      segmentCode,
      fashionGrade: def.grade,
      optionsPlanned: baseOptions,
      depthPerOption: 8,
    };
  });
}

/** Look up VM display rules for a set of RA bricks */
function getVMRulesForBricks(bricks: RABrick[]): VMDisplayRule[] {
  return bricks.map(brick => {
    const rule = vmRuleDefs[brick.brickName];
    return {
      brickCode: brick.brickCode,
      garmentType: rule?.garmentType ?? 'Hanging',
      displayMethod: rule?.display ?? 'Side-hang',
      preferredFixtures: rule?.fixtures ?? ['Arail'],
    };
  });
}

/** Compute fixture demand: RA bricks → VM rules → fixture type → area */
export function computeRAFixtureDemand(
  storeId: string,
  segmentCode: string,
  allocatedSft: number,
): SegmentFixtureDemandSummary {
  const bricks = generateRABricks(storeId, segmentCode);
  const vmRules = getVMRulesForBricks(bricks);
  const activeFixtures = fixtureTypesOM.filter(f => f.status === 'Active');

  // Group bricks by their VM-assigned fixture type
  const fixtureGroups = new Map<string, {
    fixture: FixtureTypeOM;
    entries: { brick: RABrick; vmRule: VMDisplayRule; slotsUsed: number }[];
  }>();

  for (let i = 0; i < bricks.length; i++) {
    const brick = bricks[i]!;
    const vmRule = vmRules[i]!;

    // VM determines the fixture — find first available from preferred list
    const fixture = vmRule.preferredFixtures
      .map(name => activeFixtures.find(f => f.name === name))
      .find(f => f !== undefined);
    if (!fixture) continue;

    const existing = fixtureGroups.get(fixture.name);
    if (existing) {
      existing.entries.push({ brick, vmRule, slotsUsed: brick.optionsPlanned });
    } else {
      fixtureGroups.set(fixture.name, { fixture, entries: [{ brick, vmRule, slotsUsed: brick.optionsPlanned }] });
    }
  }

  // Build fixture demand results
  const fixtureBreakdown: FixtureDemandResult[] = [];
  let totalFixtures = 0;
  let totalArea = 0;
  let totalOptions = 0;

  for (const [, group] of fixtureGroups) {
    const totalSlotsNeeded = group.entries.reduce((s, e) => s + e.slotsUsed, 0);
    const fixturesNeeded = Math.ceil(totalSlotsNeeded / group.fixture.optionCapacity);
    const totalSlots = fixturesNeeded * group.fixture.optionCapacity;
    const fixtureAreaTotal = fixturesNeeded * group.fixture.areaSqft;

    fixtureBreakdown.push({
      fixtureType: group.fixture.name,
      fixtureCode: group.fixture.code,
      displayMethod: group.fixture.displayMethod,
      areaSqft: group.fixture.areaSqft,
      optionCapacity: group.fixture.optionCapacity,
      fixturesNeeded,
      totalAreaSqft: fixtureAreaTotal,
      totalSlots,
      slotsConsumed: totalSlotsNeeded,
      utilization: totalSlots > 0 ? Math.round((totalSlotsNeeded / totalSlots) * 100) : 0,
      bricks: group.entries.map(e => ({
        brickCode: e.brick.brickCode,
        brickName: e.brick.brickName,
        familyName: e.brick.familyName,
        fashionGrade: e.brick.fashionGrade,
        options: e.brick.optionsPlanned,
        slotsUsed: e.slotsUsed,
        vmGarmentType: e.vmRule.garmentType,
      })),
    });

    totalFixtures += fixturesNeeded;
    totalArea += fixtureAreaTotal;
    totalOptions += totalSlotsNeeded;
  }

  fixtureBreakdown.sort((a, b) => b.totalAreaSqft - a.totalAreaSqft);

  return {
    segmentCode,
    totalOptionsFromRA: totalOptions,
    totalFixturesNeeded: totalFixtures,
    totalAreaNeeded: totalArea,
    allocatedAreaSqft: allocatedSft,
    areaGap: allocatedSft - totalArea,
    areaGapPct: allocatedSft > 0 ? Math.round(((allocatedSft - totalArea) / allocatedSft) * 100) : 0,
    fixtureBreakdown,
    raBricks: bricks,
    vmRules,
  };
}

// ── Sprint: Simulation ──

export interface SimulationMetric {
  label: string;
  current: number;
  projected: number;
  delta: number;
  unit: string;
}

export interface SimulationResult {
  recId: string;
  title: string;
  metrics: SimulationMetric[];
  deltaOptions: number;
}

export function simulateRecommendation(recId: string): SimulationResult | null {
  const rec = spaceRecommendations.find(r => r.id === recId);
  if (!rec) return null;

  const delta = rec.spsfDelta;

  return {
    recId,
    title: rec.title,
    metrics: [
      { label: 'Segment Area', current: rec.currentSft, projected: rec.newSft, delta: rec.newSft - rec.currentSft, unit: 'SFT' },
      { label: 'Options', current: rec.currentOptions, projected: rec.newOptionCapacity, delta: rec.math.deltaOptions, unit: 'options' },
      { label: 'Store SPSF', current: 861, projected: 861 + delta, delta, unit: 'Rs/SFT' },
    ],
    deltaOptions: rec.math.deltaOptions,
  };
}

// ── Sprint: MDQ Compliance ──

export interface MDQComplianceRow {
  fixtureCode: string;
  type: string;
  category: string;
  mdq: number;
  stock: number;
  status: 'full' | 'below-mdq' | 'critical';
}

export function getStoreMDQCompliance(storeId: string): MDQComplianceRow[] {
  const fixtures = generateStoreFixtures(storeId);
  return fixtures.slice(0, 15).map(f => {
    const ratio = f.currentQty / f.maxQty;
    const status: MDQComplianceRow['status'] =
      ratio >= 0.95 ? 'full' : ratio >= 0.5 ? 'below-mdq' : 'critical';
    return {
      fixtureCode: f.fixtureCode,
      type: f.fixtureTypeName,
      category: f.segment,
      mdq: f.maxQty,
      stock: f.currentQty,
      status,
    };
  });
}

export interface StockingDensityResult {
  current: number;
  target: number;
  deviation: number;
  ragStatus: 'green' | 'amber' | 'red';
}

export function getStockingDensity(storeId: string): StockingDensityResult | null {
  const profile = storeSpaceProfiles.find(p => p.storeId === storeId);
  if (!profile) return null;

  const current = Math.round((profile.garmentCapacity / profile.saleableArea) * 100) / 100;
  const target = 2.20;
  const deviation = Math.round(((current - target) / target) * 1000) / 10;
  const ragStatus: StockingDensityResult['ragStatus'] =
    Math.abs(deviation) <= 5 ? 'green' : Math.abs(deviation) <= 10 ? 'amber' : 'red';

  return { current, target, deviation, ragStatus };
}

// ── Sprint: OTB Capacity Validation ──

export interface OTBCapacityAlert {
  category: string;
  categoryCode: string;
  plannedUnits: number;
  fixtureCapacity: number;
  excess: number;
}

export function getOTBCapacityValidation(storeId: string): OTBCapacityAlert[] {
  const fixtures = generateStoreFixtures(storeId);
  const storeData = storeSegmentAllocations.find(s => s.storeId === storeId);
  if (!storeData) return [];

  const capacityBySegment: Record<string, number> = {};
  for (const f of fixtures) {
    const segCode = storeData.segments.find(s => s.segment === f.segment)?.segmentCode || '';
    if (segCode) {
      capacityBySegment[segCode] = (capacityBySegment[segCode] || 0) + f.maxQty;
    }
  }

  return storeData.segments
    .map(seg => {
      const capacity = capacityBySegment[seg.segmentCode] || 0;
      // Some segments over-planned to create realistic alerts
      const overFactor = seg.segmentCode === 'MC' ? 1.08 : seg.segmentCode === 'KW' ? 1.05 : 0.95;
      const planned = Math.round(capacity * overFactor);
      return {
        category: seg.segment,
        categoryCode: seg.segmentCode,
        plannedUnits: planned,
        fixtureCapacity: capacity,
        excess: planned - capacity,
      };
    })
    .filter(a => a.excess > 0);
}

// ── Network-Level Metrics (Manus-aligned) ──

export interface NetworkSpaceMetrics {
  totalSpaceSft: number;
  storeCount: number;
  avgStoreSize: number;
  lflSpsf: { fy26: number; fy27Plan: number; growthPct: number };
  stockingDensity: { blended: number; replen: number; fashion: number };
  agedStock: { value: number; unit: string; target: string };
  inventoryTurns: { current: number; target: number };
  coverDays: { blended: number; core: number; fashion: number };
  abv: { current: number; fy26: number; growthPct: number };
  fohBohSplit: { foh: number; boh: number; fohTarget: string; bohTarget: string };
  displayCapacityUtil: number;
  fixturesFillRate: number;
  plEbSplit: { pl: number; eb: number; nonApparels: number; innerwear: number };
}

export interface FormatPlEbSplit {
  format: string;
  pl: number;
  eb: number;
  nonApparels: number;
  innerwear: number;
}

export const networkSpaceMetricsData: NetworkSpaceMetrics = {
  totalSpaceSft: 30_030_000,
  storeCount: 3647,
  avgStoreSize: 8236,
  lflSpsf: { fy26: 508, fy27Plan: 631, growthPct: 24 },
  stockingDensity: { blended: 2.17, replen: 2.70, fashion: 1.34 },
  agedStock: { value: 325, unit: 'Cr', target: 'Zero by Jun 2026' },
  inventoryTurns: { current: 3.4, target: 4.0 },
  coverDays: { blended: 33, core: 30, fashion: 45 },
  abv: { current: 2165, fy26: 1940, growthPct: 11.6 },
  fohBohSplit: { foh: 77, boh: 23, fohTarget: '75-80%', bohTarget: 'Reduce to 20%' },
  displayCapacityUtil: 87,
  fixturesFillRate: 82,
  plEbSplit: { pl: 77.1, eb: 14.1, nonApparels: 6.4, innerwear: 2.3 },
};

/** Per-format PL vs EB space allocation splits */
export const formatPlEbSplits: FormatPlEbSplit[] = [
  { format: 'Trends',          pl: 82.3, eb: 10.2, nonApparels: 5.1, innerwear: 2.4 },
  { format: 'Yousta',          pl: 93.4, eb:  0.0, nonApparels: 4.6, innerwear: 2.0 },
  { format: 'Fashion Factory', pl: 65.4, eb: 24.6, nonApparels: 7.2, innerwear: 2.8 },
  { format: 'AZORTE',          pl: 58.2, eb: 30.1, nonApparels: 8.9, innerwear: 2.8 },
];

/** Per-format Front of House / Back of House splits */
export interface FormatFohBohSplit {
  format: string;
  foh: number;
  boh: number;
  fohTarget: string;
  bohTarget: string;
  displayCapacityUtil: number;
  fixturesFillRate: number;
}

export const formatFohBohSplits: FormatFohBohSplit[] = [
  { format: 'Trends',          foh: 76, boh: 24, fohTarget: '75-80%', bohTarget: 'Reduce to 20%', displayCapacityUtil: 86, fixturesFillRate: 81 },
  { format: 'Yousta',          foh: 80, boh: 20, fohTarget: '78-82%', bohTarget: 'Maintain 20%',  displayCapacityUtil: 91, fixturesFillRate: 87 },
  { format: 'Fashion Factory', foh: 72, boh: 28, fohTarget: '72-76%', bohTarget: 'Reduce to 24%', displayCapacityUtil: 83, fixturesFillRate: 78 },
  { format: 'AZORTE',          foh: 81, boh: 19, fohTarget: '80-85%', bohTarget: 'Maintain 18%',  displayCapacityUtil: 89, fixturesFillRate: 84 },
];

// ── SPSF Growth Drivers (Waterfall) ──

export interface SpsfGrowthDriver {
  driver: string;
  mechanism: string;
  dailyImpactCr: number;
  growthPct: number;
  timeline: string;
  status: 'PRIMARY' | 'ON TRACK' | 'IN PROGRESS';
}

export const spsfGrowthDrivers: SpsfGrowthDriver[] = [
  { driver: 'ASP Uplift', mechanism: 'Better range, less aging, fixture-mapped allocation', dailyImpactCr: 4.0, growthPct: 35, timeline: 'Apr-Jun 2026', status: 'PRIMARY' },
  { driver: 'Turn Improvement', mechanism: '3.4x → 4.0x annual on same inventory', dailyImpactCr: 2.0, growthPct: 18, timeline: 'Apr-Jun 2026', status: 'ON TRACK' },
  { driver: 'Inventory Reduction', mechanism: 'Less aged stock = more productive space', dailyImpactCr: 1.5, growthPct: 14, timeline: 'Apr-Jun 2026', status: 'ON TRACK' },
  { driver: 'Store Refresh', mechanism: 'Fresh assortment every 30-45 days', dailyImpactCr: 1.5, growthPct: 14, timeline: 'Ongoing', status: 'IN PROGRESS' },
  { driver: 'Margin Correction', mechanism: '52.5% intake margin + 90% full-price sell-thru', dailyImpactCr: 1.0, growthPct: 9, timeline: 'Apr-Jun 2026', status: 'ON TRACK' },
];

// ── Inventory Lifecycle Model (45+45+30) ──

export interface InventoryLifecyclePhase {
  phase: string;
  days: string;
  storeGrade: string;
  sellThruTarget: string;
  spaceImpact: string;
  action: string;
  hardStop: string;
}

export const inventoryLifecyclePhases: InventoryLifecyclePhase[] = [
  { phase: 'Phase 1 — Fresh Fashion', days: 'Day 1-45', storeGrade: 'A0/A1 Premium', sellThruTarget: '65%', spaceImpact: '23% of FOH', action: 'Full price, New Arrivals zone', hardStop: 'Auto-exit at Day 45' },
  { phase: 'Phase 2 — Cascade', days: 'Day 46-90', storeGrade: 'A2/A3 Standard', sellThruTarget: '90% cum.', spaceImpact: 'Cascaded alloc.', action: 'Good at full, poor at markdown', hardStop: 'Exit network Day 90' },
  { phase: 'Phase 3 — Liquidation', days: 'Day 91-180', storeGrade: 'FF / AJIO / Clearance', sellThruTarget: '100%', spaceImpact: '0% Trends FOH', action: 'FF, AJIO, bi-annual clearance', hardStop: 'Zero stock Day 180' },
  { phase: 'Replenishable (Core)', days: 'Rolling 30d', storeGrade: 'All stores', sellThruTarget: 'Continuous', spaceImpact: '77% of FOH', action: 'Auto-replenishment; ROS-driven', hardStop: 'MDQ enforced daily' },
];

// ── Store Classification Strategy ──

export interface StoreClassificationRow {
  grade: string;
  rentProfile: string;
  location: string;
  merchandiseStrategy: string;
  refreshCycle: string;
  stockingFocus: string;
}

export const storeClassificationStrategy: StoreClassificationRow[] = [
  { grade: 'A0 / A1 (Premium)', rentProfile: '16-17%+ of Rev', location: 'Premium malls, top city centres', merchandiseStrategy: '100% fresh; 0-45 day ageing', refreshCycle: 'Every 30-45 days', stockingFocus: 'High productivity per sft' },
  { grade: 'A2 (Standard)', rentProfile: '10-15% of Rev', location: 'Mid-tier commercial areas', merchandiseStrategy: '45-90 days; fresh + consolidated', refreshCycle: 'Every 45-90 days', stockingFocus: 'Standard density' },
  { grade: 'A3 (Value)', rentProfile: '<10% of Rev', location: 'Smaller towns, low-traffic', merchandiseStrategy: '45-90 days; moderate + discounted', refreshCycle: 'Flexible', stockingFocus: 'Min cost recovery' },
];

// ══════════════════════════════════════════════════════════════════════════════
// COMPREHENSIVE STORE PLANNING CONTEXT — First-Principles Data
// ══════════════════════════════════════════════════════════════════════════════

export interface SegmentPlanDetail {
  segment: string;
  segmentCode: string;
  // Space
  sft: number;
  spacePercent: number;
  // Revenue
  annualNsvLakhs: number;
  nsvPercent: number;
  spsf: number;
  gmrof: number;
  efficiency: number;
  // Trend (6 months, oldest → newest)
  gmrofTrend: number[];
  trendDirection: 'up' | 'flat' | 'down';
  // Fixtures
  fixtureBreakdown: { type: string; count: number; optCap: number }[];
  totalFixtures: number;
  sftPerFixture: number;
  // Stock
  liveOptions: number;
  optionCapacity: number;
  fillRate: number;
  totalQty: number;
  avgDepth: number;
  stockCoverDays: number;
  sellThruPct: number;
  agedStockPct: number;
  rotationTurns: number;
  // PL/EB
  plSpacePct: number;
  ebSpacePct: number;
  plGmrof: number;
  ebGmrof: number;
  // Fashion Grade
  corePct: number;
  fashionPct: number;
  ffPct: number;
  // Benchmark (grade average)
  benchmarkSpacePct: number;
  benchmarkGmrof: number;
  // Assessment
  action: 'Expand' | 'Hold' | 'Contract' | 'Review';
  actionReasons: string[];
  recommendedSpacePct: number; // AI-recommended target space %
  // Fixture type mix recommendation (% of segment fixtures by type)
  fixtureTypeMix: { type: string; currentPct: number; recommendedPct: number; optCapPerUnit: number; displayMethod: string }[];
  // For simulation
  avgNsvPerOptionK: number; // annual NSV per option in thousands Rs
}

export interface StorePlanningContext {
  catchment: {
    type: string;
    monthlyFootfall: string;
    conversionPct: number;
    avgBasketRs: number;
    peakDays: string;
    demographics: string;
  };
  competitors: {
    name: string;
    distance: string;
    type: 'Direct' | 'Adjacent';
    strength: string;
    implication: string;
  }[];
  segments: SegmentPlanDetail[];
}

export function getStorePlanningContext(storeId: string): StorePlanningContext {
  const profile = storeSpaceProfiles.find(p => p.storeId === storeId);
  const storeSegs = storeSegmentAllocations.find(s => s.storeId === storeId);
  if (!profile || !storeSegs) {
    // Fallback for any store — derive from profile
    return getDefaultPlanningContext(storeId);
  }

  const annualNsv = profile.aopRunRateCr * 100; // Cr → Lakhs

  // Build segments with rich detail
  const seed = parseInt(storeId.replace(/\D/g, ''), 10) || 1;
  const rand = seededRandom(seed * 4231);

  const segments: SegmentPlanDetail[] = storeSegs.segments.map((seg) => {
    const segNsvLakhs = annualNsv * (seg.nsvPercent / 100);
    const segSpsf = Math.round((segNsvLakhs * 100000) / seg.sft); // lakhs → Rs / sft
    const sftPerFixture = Math.round(seg.sft / seg.fixtures);

    // GMROF trend (6 months) — vary around current GMROF
    const trendBase = seg.gmrof;
    const trendSlope = seg.efficiency > 1.05 ? 3 : seg.efficiency < 0.8 ? -4 : seg.efficiency < 0.95 ? -2 : 0.5;
    const gmrofTrend = Array.from({ length: 6 }, (_, i) => Math.round(trendBase - (5 - i) * trendSlope + (rand() - 0.5) * 8));
    const trendDirection: SegmentPlanDetail['trendDirection'] = trendSlope > 1 ? 'up' : trendSlope < -1 ? 'down' : 'flat';

    // Fixture breakdown — distribute total fixtures across types
    const totalFix = seg.fixtures;
    const fourWay = Math.max(1, Math.round(totalFix * 0.24));
    const sr4 = Math.max(1, Math.round(totalFix * 0.18));
    const sr6 = Math.max(1, Math.round(totalFix * 0.29));
    const wu4 = Math.max(1, Math.round(totalFix * 0.18));
    const wu8 = Math.max(0, totalFix - fourWay - sr4 - sr6 - wu4);
    const fixtureBreakdown = [
      { type: '4-Way Rack', count: fourWay, optCap: 4 },
      { type: 'A-Rail (4ft)', count: sr4, optCap: 8 },
      { type: 'A-Rail (6ft)', count: sr6, optCap: 12 },
      { type: 'Wall Unit (4ft)', count: wu4, optCap: 10 },
      ...(wu8 > 0 ? [{ type: 'Wall Unit (8ft)', count: wu8, optCap: 20 }] : []),
    ];

    // Stock health — derives from efficiency
    const baseSellThru = 55 + Math.round(seg.efficiency * 20);
    const baseAged = Math.max(2, Math.round(28 - seg.efficiency * 18));
    const baseCover = Math.round(40 - seg.efficiency * 10);
    const baseRotation = +(1.5 + seg.efficiency * 2.5).toFixed(1);
    const avgDepth = +(8 + rand() * 5).toFixed(1);
    const totalQty = Math.round(seg.options * avgDepth);
    const optionCapacity = Math.round(seg.options / (0.82 + rand() * 0.12));
    const fillRate = Math.round((seg.options / optionCapacity) * 100);

    // PL/EB split — varies by segment
    const plBase = seg.segmentCode === 'MF' ? 35 : seg.segmentCode === 'WWW' ? 68 : seg.segmentCode === 'KW' ? 85 : 78;
    const plPct = plBase + Math.round((rand() - 0.5) * 6);
    const ebPct = 100 - plPct;
    const plGmrof = Math.round(seg.gmrof * (1 + 0.08 + rand() * 0.05));
    const ebGmrof = Math.round(seg.gmrof * (0.78 + rand() * 0.1));

    // Fashion grade
    const corePct = seg.segmentCode === 'MF' ? 78 : seg.segmentCode === 'KW' ? 72 : 58 + Math.round(rand() * 8);
    const ffPct = seg.segmentCode === 'KW' ? 8 : 8 + Math.round(rand() * 6);
    const fashionPct = 100 - corePct - ffPct;

    // Benchmark (grade average for this segment)
    const bm = gradeSegmentBenchmarks.find(b => b.grade === profile.grade && b.segmentCode === seg.segmentCode);

    // Action assessment
    let action: SegmentPlanDetail['action'];
    const reasons: string[] = [];
    if (seg.efficiency < 0.75) {
      action = 'Contract';
      reasons.push(`Efficiency ${seg.efficiency.toFixed(2)} — earning ${seg.nsvPercent}% of NSV on ${seg.spacePercent}% of space`);
      if (trendDirection === 'down') reasons.push(`GMROF declining: Rs ${gmrofTrend[0]} → Rs ${gmrofTrend[5]} over 6 months`);
      if (baseAged > 15) reasons.push(`${baseAged}% aged stock (>90 days) tying up productive space`);
      if (bm && seg.spacePercent > bm.benchmarkSpacePercent + 2) reasons.push(`Over-spaced by ${Math.round(seg.spacePercent - bm.benchmarkSpacePercent)}pp vs grade average`);
    } else if (seg.efficiency > 1.08 && trendDirection === 'up') {
      action = 'Expand';
      reasons.push(`Efficiency ${seg.efficiency.toFixed(2)} — earning ${seg.nsvPercent}% of NSV on ${seg.spacePercent}% of space`);
      reasons.push(`GMROF improving: Rs ${gmrofTrend[0]} → Rs ${gmrofTrend[5]} over 6 months`);
      if (baseSellThru > 70) reasons.push(`Strong sell-through at ${baseSellThru}% — demand exceeds display capacity`);
      if (bm && seg.spacePercent < bm.benchmarkSpacePercent - 1) reasons.push(`Under-spaced by ${Math.round(bm.benchmarkSpacePercent - seg.spacePercent)}pp vs grade average`);
    } else if (seg.efficiency < 0.92 || trendDirection === 'down') {
      action = 'Review';
      if (seg.efficiency < 0.92) reasons.push(`Efficiency ${seg.efficiency.toFixed(2)} — slightly under-earning space`);
      if (trendDirection === 'down') reasons.push(`GMROF trend declining over 6 months`);
      if (baseCover > 35) reasons.push(`Stock cover ${baseCover} days — inventory sitting too long`);
    } else {
      action = 'Hold';
      reasons.push(`Performing at or above benchmark — no reallocation needed`);
      if (trendDirection === 'up') reasons.push(`GMROF trend positive — continue current allocation`);
    }

    return {
      segment: seg.segment, segmentCode: seg.segmentCode,
      sft: seg.sft, spacePercent: seg.spacePercent,
      annualNsvLakhs: Math.round(segNsvLakhs * 10) / 10, nsvPercent: seg.nsvPercent, spsf: segSpsf, gmrof: seg.gmrof, efficiency: seg.efficiency,
      gmrofTrend, trendDirection,
      fixtureBreakdown, totalFixtures: seg.fixtures, sftPerFixture,
      liveOptions: seg.options, optionCapacity, fillRate, totalQty, avgDepth,
      stockCoverDays: baseCover, sellThruPct: baseSellThru, agedStockPct: baseAged, rotationTurns: baseRotation,
      plSpacePct: plPct, ebSpacePct: ebPct, plGmrof, ebGmrof,
      corePct, fashionPct, ffPct,
      benchmarkSpacePct: bm?.benchmarkSpacePercent ?? seg.spacePercent, benchmarkGmrof: bm?.benchmarkGmrof ?? seg.gmrof,
      action, actionReasons: reasons,
      // Recommended space %: nudge toward benchmark, capped at ±4pp
      recommendedSpacePct: action === 'Expand'
        ? Math.min(seg.spacePercent + 4, Math.round((bm?.benchmarkSpacePercent ?? seg.spacePercent) + 2))
        : action === 'Contract'
          ? Math.max(seg.spacePercent - 4, Math.round((bm?.benchmarkSpacePercent ?? seg.spacePercent) - 2))
          : seg.spacePercent,
      // Fixture type mix — current vs recommended allocation
      fixtureTypeMix: fixtureBreakdown.map(ft => {
        const currentPct = Math.round((ft.count / totalFix) * 100);
        // Recommend more high-capacity fixtures (Wall Panels) for Expand, more face-out (4-Way) for visual segments
        let recPct = currentPct;
        if (action === 'Expand' && ft.type.includes('Wall')) recPct = Math.min(currentPct + 5, 40);
        if (action === 'Contract' && ft.type.includes('4-Way')) recPct = Math.max(currentPct - 3, 5);
        return {
          type: ft.type,
          currentPct,
          recommendedPct: recPct,
          optCapPerUnit: ft.optCap,
          displayMethod: ft.type.includes('4-Way') ? 'Face-out' : ft.type.includes('Arail') ? 'Side-hang' : ft.type.includes('Wall') ? 'Shelved + Hang' : 'Mixed',
        };
      }),
      avgNsvPerOptionK: Math.round((segNsvLakhs / seg.options) * 100) / 100,
    };
  });

  // Catchment and competitors — enrich from profile
  const catchment = {
    type: profile.format === 'AZORTE' ? 'Premium' : profile.format === 'Fashion Factory' ? 'Value Fashion' : profile.format === 'Yousta' ? 'Youth Fashion' : 'Multi-format',
    monthlyFootfall: profile.grade === 'A' ? '1.2L+' : profile.grade === 'A1' ? '80K' : '45K',
    conversionPct: profile.grade === 'A' ? 8.5 : profile.grade === 'A1' ? 7.2 : 6.0,
    avgBasketRs: profile.spsf > 800 ? 3200 : profile.spsf > 600 ? 2400 : 1800,
    peakDays: 'Friday–Sunday',
    demographics: profile.grade === 'A' ? 'Upper-middle to affluent, 25-45, fashion-forward' : 'Mixed income, 20-50, value + aspiration',
  };

  const competitors = profile.competitors.map(c => ({
    name: c.name,
    distance: c.distance,
    type: c.type as 'Direct' | 'Adjacent',
    strength: c.type === 'Direct'
      ? `Strong ${c.name === 'Zara' ? "women's fast fashion" : c.name === 'H&M' ? 'affordable trendy casual' : c.name === 'Uniqlo' ? 'basics + innerwear' : 'broad range'}`
      : `${c.name === 'Westside' ? 'Tata retail, broad value range' : 'Regional presence, price play'}`,
    implication: c.type === 'Direct'
      ? `Differentiate via ${c.name === 'Zara' ? 'WIW depth + PL value' : c.name === 'H&M' ? 'MC premium positioning' : 'quality + curation'}`
      : 'Minimal overlap — not a direct threat',
  }));

  return { catchment, competitors, segments };
}

// Fallback for stores without detailed segment data
function getDefaultPlanningContext(storeId: string): StorePlanningContext {
  const profile = storeSpaceProfiles.find(p => p.storeId === storeId);
  const sa = profile?.saleableArea ?? 5000;
  const annualNsv = (profile?.aopRunRateCr ?? 3) * 100;
  const seed = parseInt(storeId.replace(/\D/g, ''), 10) || 1;
  const rand = seededRandom(seed * 8311);

  const defaultSegs: [string, string, number, number][] = [
    ['Menswear Casual', 'MC', 24, 27],
    ['Menswear Formal', 'MF', 18, 16],
    ['Women Indian Wear', 'WIW', 22, 24],
    ['Women Western Wear', 'WWW', 20, 21],
    ['Kidswear', 'KW', 16, 12],
  ];

  const segments: SegmentPlanDetail[] = defaultSegs.map(([segment, code, spacePct, nsvPct]) => {
    const sft = Math.round(sa * spacePct / 100);
    const nsvL = annualNsv * nsvPct / 100;
    const eff = +(nsvPct / spacePct).toFixed(2);
    const gmrof = Math.round(280 + eff * 120 + rand() * 30);
    const spsf = Math.round((nsvL * 100000) / sft);
    const totalFix = Math.max(4, Math.round(sft / 60));
    const opts = Math.round(totalFix * 14);
    const trendSlope = eff > 1.05 ? 3 : eff < 0.85 ? -3 : 0;
    const trend = Array.from({ length: 6 }, (_, i) => Math.round(gmrof - (5 - i) * trendSlope + (rand() - 0.5) * 6));
    const action: SegmentPlanDetail['action'] = eff < 0.8 ? 'Contract' : eff > 1.08 ? 'Expand' : eff < 0.95 ? 'Review' : 'Hold';

    return {
      segment, segmentCode: code, sft, spacePercent: spacePct,
      annualNsvLakhs: Math.round(nsvL * 10) / 10, nsvPercent: nsvPct, spsf, gmrof, efficiency: eff,
      gmrofTrend: trend, trendDirection: (trendSlope > 1 ? 'up' : trendSlope < -1 ? 'down' : 'flat') as SegmentPlanDetail['trendDirection'],
      fixtureBreakdown: [
        { type: '4-Way', count: Math.round(totalFix * 0.25), optCap: 4 },
        { type: 'Arail', count: Math.round(totalFix * 0.35), optCap: 8 },
        { type: 'Wall Panels', count: Math.round(totalFix * 0.25), optCap: 10 },
        { type: 'H-Gondola', count: totalFix - Math.round(totalFix * 0.85), optCap: 8 },
      ],
      totalFixtures: totalFix, sftPerFixture: Math.round(sft / totalFix),
      liveOptions: opts, optionCapacity: Math.round(opts / 0.85), fillRate: 85, totalQty: opts * 10, avgDepth: 10,
      stockCoverDays: Math.round(38 - eff * 8), sellThruPct: Math.round(50 + eff * 22), agedStockPct: Math.max(3, Math.round(25 - eff * 15)), rotationTurns: +(1.5 + eff * 2).toFixed(1),
      plSpacePct: 75, ebSpacePct: 25, plGmrof: Math.round(gmrof * 1.1), ebGmrof: Math.round(gmrof * 0.82),
      corePct: 65, fashionPct: 25, ffPct: 10,
      benchmarkSpacePct: spacePct, benchmarkGmrof: gmrof,
      action, actionReasons: [action === 'Expand' ? 'Efficiency above 1.08' : action === 'Contract' ? 'Efficiency below 0.80' : 'Performing at benchmark'],
      recommendedSpacePct: action === 'Expand'
        ? Math.min(spacePct + 4, spacePct + 2)
        : action === 'Contract'
          ? Math.max(spacePct - 4, spacePct - 2)
          : spacePct,
      fixtureTypeMix: [
        { type: '4-Way', currentPct: 25, recommendedPct: 25, optCapPerUnit: 4, displayMethod: 'Face-out' },
        { type: 'Arail', currentPct: 35, recommendedPct: 35, optCapPerUnit: 8, displayMethod: 'Side-hang' },
        { type: 'Wall Panels', currentPct: 25, recommendedPct: 25, optCapPerUnit: 10, displayMethod: 'Shelved + Hang' },
        { type: 'H-Gondola', currentPct: 15, recommendedPct: 15, optCapPerUnit: 8, displayMethod: 'Both-side' },
      ],
      avgNsvPerOptionK: Math.round((nsvL / opts) * 100) / 100,
    };
  });

  return {
    catchment: { type: 'Mall', monthlyFootfall: '60K', conversionPct: 7, avgBasketRs: 2200, peakDays: 'Friday–Sunday', demographics: 'Mixed, 25-45' },
    competitors: [{ name: 'Local competitor', distance: '0.5 km', type: 'Adjacent', strength: 'Price play', implication: 'Differentiate on quality' }],
    segments,
  };
}

// ── Network Aggregate by Segment ──
export interface NetworkSegmentAggregate {
  segmentCode: string;
  segment: string;
  totalStores: number;
  underperformingStores: number;
  totalSft: number;
  avgSpacePct: number;
  avgNsvPct: number;
  avgEfficiency: number;
  avgGmrof: number;
  avgSpsf: number;
  avgSellThruPct: number;
  avgAgedStockPct: number;
  avgRotation: number;
  avgPlPct: number;
  topStore: string;
  bottomStore: string;
}

export function getNetworkSegmentAggregates(filterStoreIds?: string[]): NetworkSegmentAggregate[] {
  const segCodes = ['MC', 'MF', 'WIW', 'WWW', 'KW'];
  const segNames: Record<string, string> = { MC: 'Menswear Casual', MF: 'Menswear Formal', WIW: 'Women Indian Wear', WWW: 'Women Western Wear', KW: 'Kidswear' };

  const filteredAllocations = filterStoreIds
    ? storeSegmentAllocations.filter(s => filterStoreIds.includes(s.storeId))
    : storeSegmentAllocations;

  return segCodes.map(code => {
    const allStoreSegs = filteredAllocations
      .map(s => ({ storeId: s.storeId, seg: s.segments.find(seg => seg.segmentCode === code) }))
      .filter((s): s is { storeId: string; seg: NonNullable<typeof s.seg> } => !!s.seg);

    const n = allStoreSegs.length;
    if (n === 0) return null;

    const totalSft = allStoreSegs.reduce((s, d) => s + d.seg.sft, 0);
    const avgSpacePct = Math.round(allStoreSegs.reduce((s, d) => s + d.seg.spacePercent, 0) / n * 10) / 10;
    const avgNsvPct = Math.round(allStoreSegs.reduce((s, d) => s + d.seg.nsvPercent, 0) / n * 10) / 10;
    const avgEff = Math.round(allStoreSegs.reduce((s, d) => s + d.seg.efficiency, 0) / n * 100) / 100;
    const avgGmrof = Math.round(allStoreSegs.reduce((s, d) => s + d.seg.gmrof, 0) / n);
    const avgSpsf = Math.round(allStoreSegs.reduce((s, d) => s + (d.seg.gmrof * 2.2), 0) / n); // approximate

    const sorted = [...allStoreSegs].sort((a, b) => b.seg.gmrof - a.seg.gmrof);
    const topId = sorted[0]!.storeId;
    const bottomId = sorted[sorted.length - 1]!.storeId;
    const topStore = storeSpaceProfiles.find(p => p.storeId === topId)?.storeName ?? topId;
    const bottomStore = storeSpaceProfiles.find(p => p.storeId === bottomId)?.storeName ?? bottomId;

    // Derive stock health from efficiency
    const avgSellThru = Math.round(55 + avgEff * 18);
    const avgAged = Math.max(3, Math.round(25 - avgEff * 15));
    const avgRotation = +(1.5 + avgEff * 2.2).toFixed(1);
    const avgPl = code === 'MF' ? 38 : code === 'WWW' ? 70 : code === 'KW' ? 84 : 77;

    const underperformingStores = allStoreSegs.filter(d => d.seg.efficiency < 1.0).length;

    return {
      segmentCode: code, segment: segNames[code] ?? code,
      totalStores: n, underperformingStores, totalSft, avgSpacePct, avgNsvPct, avgEfficiency: avgEff, avgGmrof, avgSpsf,
      avgSellThruPct: avgSellThru, avgAgedStockPct: avgAged, avgRotation, avgPlPct: avgPl,
      topStore, bottomStore,
    };
  }).filter((s): s is NetworkSegmentAggregate => s !== null);
}

// ─── AOP Recovery Advisor ─────────────────────────────────────────

export type AdvisorLever = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';

export interface DeductionStrategy {
  item: string;
  current: string;
  proposed: string;
  sftGained: number;
  optionsGained: number;
  nsvGainLakhs: number;
}

export interface AdvisorStrategy {
  lever: AdvisorLever;
  leverLabel: string;
  title: string;
  description: string;
  nsvGainLakhs: number;
  cumulativeGapClosedPct: number;
  details: string[]; // cascade math lines
  deductionStrategies?: DeductionStrategy[]; // only for L1
}

export interface AopAdvisorResult {
  storeId: string;
  aopGapLakhs: number;
  aopGapPct: number;
  isOnTrack: boolean;
  strategies: AdvisorStrategy[];
  totalRecoverableLakhs: number;
  totalRecoverablePct: number;
}

export function getAopRecoveryAdvice(storeId: string): AopAdvisorResult {
  const profile = storeSpaceProfiles.find(s => s.storeId === storeId);
  if (!profile) {
    return { storeId, aopGapLakhs: 0, aopGapPct: 0, isOnTrack: true, strategies: [], totalRecoverableLakhs: 0, totalRecoverablePct: 0 };
  }

  const aopGapCr = profile.aopTargetCr - profile.aopRunRateCr;
  const aopGapLakhs = +(aopGapCr * 100).toFixed(1);
  const aopGapPct = profile.aopTargetCr > 0
    ? Math.round(((profile.aopRunRateCr - profile.aopTargetCr) / profile.aopTargetCr) * 100 * 10) / 10
    : 0;

  if (aopGapLakhs <= 0) {
    return { storeId, aopGapLakhs: 0, aopGapPct, isOnTrack: true, strategies: [], totalRecoverableLakhs: 0, totalRecoverablePct: 0 };
  }

  const optionsPerSft = profile.optionCapacity / profile.saleableArea;
  // Approximate average NSV per option in Rs thousands/yr
  const annualNsvLakhs = profile.aopRunRateCr * 100;
  const avgNsvPerOptionK = profile.optionCapacity > 0 ? +(annualNsvLakhs * 100 / profile.optionCapacity).toFixed(0) : 50;

  const strategies: AdvisorStrategy[] = [];

  // ── L1: Increase Saleable Area ──
  const deductionStrategies: DeductionStrategy[] = [];

  // Cash tills: can reduce by 1 if more than 1
  const currentTills = Math.round(profile.deductions.cashCounters / 80); // ~80 sft per till
  if (currentTills > 1) {
    const tillsToRemove = 1;
    const sft = 80 * tillsToRemove;
    const opts = Math.round(sft * optionsPerSft);
    const nsv = +(opts * avgNsvPerOptionK / 100).toFixed(1);
    deductionStrategies.push({
      item: 'Cash Tills',
      current: `${currentTills} tills (${profile.deductions.cashCounters} sft)`,
      proposed: `${currentTills - tillsToRemove} tills + mPOS (${profile.deductions.cashCounters - sft} sft)`,
      sftGained: sft,
      optionsGained: opts,
      nsvGainLakhs: nsv,
    });
  }

  // BOH: can reduce by up to 5% of carpet if BOH > 12% of carpet
  const bohPct = (profile.deductions.stockroomStaff / profile.carpetArea) * 100;
  if (bohPct > 12) {
    const reduciblePct = Math.min(5, bohPct - 10);
    const sft = Math.round(profile.carpetArea * reduciblePct / 100);
    const opts = Math.round(sft * optionsPerSft);
    const nsv = +(opts * avgNsvPerOptionK / 100).toFixed(1);
    deductionStrategies.push({
      item: 'BOH / Stockroom',
      current: `${profile.deductions.stockroomStaff} sft (${bohPct.toFixed(0)}% of carpet)`,
      proposed: `${profile.deductions.stockroomStaff - sft} sft (${(bohPct - reduciblePct).toFixed(0)}%) — ship-from-DC model`,
      sftGained: sft,
      optionsGained: opts,
      nsvGainLakhs: nsv,
    });
  }

  // Trial rooms: reduce by 1 if 3 or more
  const trialSftEach = 50;
  const currentTrials = Math.round(profile.deductions.trialRooms / trialSftEach);
  if (currentTrials >= 3) {
    const sft = trialSftEach;
    const opts = Math.round(sft * optionsPerSft);
    const nsv = +(opts * avgNsvPerOptionK / 100).toFixed(1);
    deductionStrategies.push({
      item: 'Trial Rooms',
      current: `${currentTrials} rooms (${profile.deductions.trialRooms} sft)`,
      proposed: `${currentTrials - 1} rooms — offset with virtual try-on`,
      sftGained: sft,
      optionsGained: opts,
      nsvGainLakhs: nsv,
    });
  }

  if (deductionStrategies.length > 0) {
    const totalSft = deductionStrategies.reduce((s, d) => s + d.sftGained, 0);
    const totalNsv = +(deductionStrategies.reduce((s, d) => s + d.nsvGainLakhs, 0)).toFixed(1);
    strategies.push({
      lever: 'L1',
      leverLabel: 'Increase Saleable Area',
      title: `Gain ${totalSft} sft by reducing deductions`,
      description: `Recover productive floor space by reducing BOH, cash tills, or trial rooms. Each gained sqft adds ~${Math.round(optionsPerSft * 10) / 10} options.`,
      nsvGainLakhs: totalNsv,
      cumulativeGapClosedPct: 0,
      details: deductionStrategies.map(d => `${d.item}: ${d.current} → ${d.proposed} (+${d.sftGained} sft → +${d.optionsGained} opt → +Rs ${d.nsvGainLakhs}L)`),
      deductionStrategies,
    });
  }

  // ── L2: Segment Reallocation ──
  const storeRecs = spaceRecommendations.filter(r => r.storeId === storeId);
  const expandRecs = storeRecs.filter(r => r.recommendedSpacePct > r.currentSpacePct);
  const contractRecs = storeRecs.filter(r => r.recommendedSpacePct < r.currentSpacePct);
  const l2Gain = expandRecs.reduce((s, r) => s + r.math.deltaNsvLakhs, 0);
  const l2Loss = contractRecs.reduce((s, r) => s + r.math.deltaNsvLakhs, 0); // negative
  const l2Net = +(l2Gain + l2Loss).toFixed(1);

  if (l2Net > 0) {
    const details: string[] = [];
    for (const r of expandRecs) {
      details.push(`Expand ${r.segment} area ${r.currentSpacePct}%→${r.recommendedSpacePct}%: +${r.newSft - r.currentSft} sft → +${r.math.deltaOptions} opt → +Rs ${r.math.deltaNsvLakhs}L`);
    }
    for (const r of contractRecs) {
      details.push(`Reduce ${r.segment} area ${r.currentSpacePct}%→${r.recommendedSpacePct}%: ${r.newSft - r.currentSft} sft → ${r.math.deltaOptions} opt → Rs ${r.math.deltaNsvLakhs}L`);
    }
    strategies.push({
      lever: 'L2',
      leverLabel: 'Reallocate Segments',
      title: `Net +Rs ${l2Net}L from segment reallocation`,
      description: 'Shift area from low-efficiency to high-efficiency segments based on AI recommendations.',
      nsvGainLakhs: l2Net,
      cumulativeGapClosedPct: 0,
      details,
    });
  }

  // ── L3: Fixture Optimization ──
  if (profile.underperformingFixtures > 0) {
    const upgradeableOpts = profile.underperformingFixtures * 8; // avg 8 options per fixture upgrade
    const l3Nsv = +(upgradeableOpts * avgNsvPerOptionK / 100).toFixed(1);
    strategies.push({
      lever: 'L3',
      leverLabel: 'Fixture Optimization',
      title: `Upgrade ${profile.underperformingFixtures} underperforming fixtures`,
      description: 'Replace low-capacity fixtures with higher-capacity types or add fixtures to underutilized areas.',
      nsvGainLakhs: l3Nsv,
      cumulativeGapClosedPct: 0,
      details: [
        `${profile.underperformingFixtures} fixtures at <60% utilization`,
        `Upgrade potential: +${upgradeableOpts} options → +Rs ${l3Nsv}L NSV/yr`,
        `Replace 4-Way (4 opt) with SR6 (12 opt) where possible`,
      ],
    });
  }

  // ── L4: Depth Optimization ──
  // Top options with high sell-through can absorb more depth
  const depthGain = +(annualNsvLakhs * 0.03).toFixed(1); // ~3% uplift from depth optimization
  strategies.push({
    lever: 'L4',
    leverLabel: 'Depth Optimization',
    title: 'Increase depth on top sell-through options',
    description: 'Top 20% options by sell-through can absorb 2x current depth without markdown risk.',
    nsvGainLakhs: depthGain,
    cumulativeGapClosedPct: 0,
    details: [
      `Top-performing options: increase from avg 4 pcs/opt to 8 pcs/opt`,
      `Expected sell-through maintenance: 85%+ on Core, 70%+ on Fashion`,
      `NSV uplift: ~${depthGain}L/yr from fuller size curves`,
    ],
  });

  // ── L5: Fashion Grade Rebalance ──
  const ffGain = +(annualNsvLakhs * 0.02).toFixed(1); // ~2% from reduced markdown
  strategies.push({
    lever: 'L5',
    leverLabel: 'Fashion Rebalance',
    title: 'Shift toward Core, reduce Fast Fashion exposure',
    description: 'Higher Core% reduces markdown risk and improves sell-through. Lower FF% reduces dead inventory.',
    nsvGainLakhs: ffGain,
    cumulativeGapClosedPct: 0,
    details: [
      'Target: Core 50% (from ~40%), Fashion 30%, FF 15% (from ~25%), Ultimate 5%',
      `Core sell-through 85% vs FF 55% — each 1pp shift saves ~Rs ${(annualNsvLakhs * 0.002).toFixed(1)}L in markdowns`,
      `Net NSV uplift: +Rs ${ffGain}L/yr`,
    ],
  });

  // Sort by NSV impact descending
  strategies.sort((a, b) => b.nsvGainLakhs - a.nsvGainLakhs);

  // Compute cumulative gap closure
  let running = 0;
  for (const s of strategies) {
    running += s.nsvGainLakhs;
    s.cumulativeGapClosedPct = Math.min(100, Math.round((running / aopGapLakhs) * 100));
  }

  const totalRecoverableLakhs = +running.toFixed(1);
  const totalRecoverablePct = Math.min(100, Math.round((totalRecoverableLakhs / aopGapLakhs) * 100));

  return { storeId, aopGapLakhs, aopGapPct, isOnTrack: false, strategies, totalRecoverableLakhs, totalRecoverablePct };
}

// ── Segment × Brick Planning Data ──

export interface BrickAllocation {
  brickCode: string;
  brickName: string;
  sft: number;
  options: number;
  depth: number;            // garments per option (size set × qty)
  totalQty: number;         // options × depth
  nsvCapacityLakhs: number; // options × avgNsvPerOption
  fashionGrade: 'Core' | 'Ultimate' | 'Fashion' | 'Fast Fashion';
  fixtures: number;
}

export interface SegmentBrickPlan {
  segmentCode: string;
  segmentName: string;
  totalSft: number;
  aopTargetLakhs: number;    // AOP segment target from AOPStorePlan
  spaceCapacityLakhs: number; // sum of brick nsvCapacity
  capacityVsAopPct: number;   // (spaceCapacity / aopTarget) × 100
  bricks: BrickAllocation[];
}

export interface StoreSegmentBrickPlan {
  storeId: string;
  segments: SegmentBrickPlan[];
}

// Brick definitions per segment
const segmentBricks: Record<string, { code: string; name: string; optionPct: number; fashionGrade: BrickAllocation['fashionGrade'] }[]> = {
  MC: [
    { code: 'MC-TEE', name: 'T-Shirts & Polos', optionPct: 30, fashionGrade: 'Core' },
    { code: 'MC-SHR', name: 'Casual Shirts', optionPct: 25, fashionGrade: 'Core' },
    { code: 'MC-DNM', name: 'Denims', optionPct: 20, fashionGrade: 'Ultimate' },
    { code: 'MC-TRS', name: 'Casual Trousers', optionPct: 15, fashionGrade: 'Core' },
    { code: 'MC-SHT', name: 'Shorts', optionPct: 10, fashionGrade: 'Fashion' },
  ],
  MF: [
    { code: 'MF-FSH', name: 'Formal Shirts', optionPct: 35, fashionGrade: 'Core' },
    { code: 'MF-FTR', name: 'Formal Trousers', optionPct: 30, fashionGrade: 'Core' },
    { code: 'MF-SBL', name: 'Suits & Blazers', optionPct: 20, fashionGrade: 'Ultimate' },
    { code: 'MF-ACC', name: 'Formal Accessories', optionPct: 15, fashionGrade: 'Core' },
  ],
  WIW: [
    { code: 'WIW-KRT', name: 'Kurtas & Kurtis', optionPct: 40, fashionGrade: 'Fashion' },
    { code: 'WIW-SAL', name: 'Salwar & Suits', optionPct: 25, fashionGrade: 'Core' },
    { code: 'WIW-SAR', name: 'Sarees', optionPct: 20, fashionGrade: 'Ultimate' },
    { code: 'WIW-ETB', name: 'Ethnic Bottoms', optionPct: 15, fashionGrade: 'Core' },
  ],
  WWW: [
    { code: 'WWW-TOP', name: 'Tops & Blouses', optionPct: 35, fashionGrade: 'Fashion' },
    { code: 'WWW-DRS', name: 'Dresses', optionPct: 25, fashionGrade: 'Fast Fashion' },
    { code: 'WWW-BTM', name: 'Western Bottoms', optionPct: 22, fashionGrade: 'Core' },
    { code: 'WWW-OUT', name: 'Outerwear', optionPct: 18, fashionGrade: 'Fashion' },
  ],
  KW: [
    { code: 'KW-BCL', name: 'Boys Casual', optionPct: 35, fashionGrade: 'Core' },
    { code: 'KW-GCL', name: 'Girls Casual', optionPct: 30, fashionGrade: 'Core' },
    { code: 'KW-BFR', name: 'Boys Formal', optionPct: 15, fashionGrade: 'Ultimate' },
    { code: 'KW-GET', name: 'Girls Ethnic', optionPct: 20, fashionGrade: 'Fashion' },
  ],
};

/** Generate Segment × Brick plan for a store, linking space capacity to AOP targets */
export function getStoreSegmentBricks(storeId: string, aopSegments?: { segmentId: string; annualRevenue: number }[]): StoreSegmentBrickPlan {
  const storeData = storeSegmentAllocations.find(s => s.storeId === storeId);
  if (!storeData) return { storeId, segments: [] };

  const segments: SegmentBrickPlan[] = storeData.segments.map(seg => {
    const brickDefs = segmentBricks[seg.segmentCode] || [];
    const aopSeg = aopSegments?.find(a => a.segmentId === seg.segmentCode);
    const aopTargetLakhs = aopSeg ? Math.round(aopSeg.annualRevenue * 100) : Math.round(seg.sft * seg.gmrof / 10000);

    const bricks: BrickAllocation[] = brickDefs.map(brick => {
      const options = Math.round(seg.options * (brick.optionPct / 100));
      const sft = Math.round(seg.sft * (brick.optionPct / 100));
      const depth = 8; // standard size set
      const totalQty = options * depth;
      const avgNsvPerOption = seg.gmrof > 300 ? 0.52 : seg.gmrof > 250 ? 0.42 : 0.34;
      const nsvCapacityLakhs = Math.round(options * avgNsvPerOption * 10) / 10;
      const fixtures = Math.max(1, Math.round(seg.fixtures * (brick.optionPct / 100)));

      return {
        brickCode: brick.code,
        brickName: brick.name,
        sft,
        options,
        depth,
        totalQty,
        nsvCapacityLakhs,
        fashionGrade: brick.fashionGrade,
        fixtures,
      };
    });

    const spaceCapacityLakhs = bricks.reduce((sum, b) => sum + b.nsvCapacityLakhs, 0);
    const capacityVsAopPct = aopTargetLakhs > 0 ? Math.round((spaceCapacityLakhs / aopTargetLakhs) * 10000) / 100 : 100;

    return {
      segmentCode: seg.segmentCode,
      segmentName: seg.segment,
      totalSft: seg.sft,
      aopTargetLakhs,
      spaceCapacityLakhs: Math.round(spaceCapacityLakhs * 10) / 10,
      capacityVsAopPct,
      bricks,
    };
  });

  return { storeId, segments };
}

// ── Fixture Rebalancing ──

export type MovementTier = 'intra-cluster' | 'intra-city' | 'inter-city' | 'inter-state';

export interface FixtureRebalancingRec {
  id: string;
  fixtureType: string; // ground fixtures only: Gondola, Nesting Table, Island Table, 4-Way Rack, A-Rail, End Cap
  sourceStoreId: string;
  sourceStoreName: string;
  sourceCluster: string;
  sourceCity: string;
  sourceZone: string;
  sourceUtilization: number;
  targetStoreId: string;
  targetStoreName: string;
  targetCluster: string;
  targetCity: string;
  targetZone: string;
  targetUtilization: number;
  quantity: number;
  gmrofImpact: number; // in Cr
  transportCostLakhs: number;
  movementTier: MovementTier;
  spsfImpactSource: number;
  spsfImpactTarget: number;
  status: 'recommended' | 'accepted' | 'queued-for-ra' | 'in-ra-cycle' | 'pending-execution' | 'executed' | 'rejected';
  effectiveRACycle: string;
}

export const fixtureRebalancingRecs: FixtureRebalancingRec[] = [
  // Intra-cluster (Mumbai Metro): low transport cost
  { id: 'FR-001', fixtureType: '6-ft Gondola', sourceStoreId: 'S001', sourceStoreName: 'Phoenix Palladium', sourceCluster: 'Mumbai Metro', sourceCity: 'Mumbai', sourceZone: 'West', sourceUtilization: 38, targetStoreId: 'S005', targetStoreName: 'Inorbit Malad', targetCluster: 'Mumbai Metro', targetCity: 'Mumbai', targetZone: 'West', targetUtilization: 94, quantity: 3, gmrofImpact: 2.4, transportCostLakhs: 0.12, movementTier: 'intra-cluster', spsfImpactSource: -8, spsfImpactTarget: 52, status: 'recommended', effectiveRACycle: 'RA-Jun-26' },
  { id: 'FR-002', fixtureType: 'Nesting Table', sourceStoreId: 'S003', sourceStoreName: 'Viviana Mall', sourceCluster: 'Mumbai Metro', sourceCity: 'Mumbai', sourceZone: 'West', sourceUtilization: 42, targetStoreId: 'S008', targetStoreName: 'Infiniti Mall Andheri', targetCluster: 'Mumbai Metro', targetCity: 'Mumbai', targetZone: 'West', targetUtilization: 91, quantity: 4, gmrofImpact: 1.8, transportCostLakhs: 0.08, movementTier: 'intra-cluster', spsfImpactSource: -6, spsfImpactTarget: 38, status: 'recommended', effectiveRACycle: 'RA-Jun-26' },
  { id: 'FR-003', fixtureType: 'End Cap', sourceStoreId: 'S006', sourceStoreName: 'R City Mall', sourceCluster: 'Mumbai Metro', sourceCity: 'Mumbai', sourceZone: 'West', sourceUtilization: 35, targetStoreId: 'S005', targetStoreName: 'Inorbit Malad', targetCluster: 'Mumbai Metro', targetCity: 'Mumbai', targetZone: 'West', targetUtilization: 94, quantity: 2, gmrofImpact: 1.2, transportCostLakhs: 0.10, movementTier: 'intra-cluster', spsfImpactSource: -4, spsfImpactTarget: 28, status: 'accepted', effectiveRACycle: 'RA-Jun-26' },
  { id: 'FR-004', fixtureType: '4-Way Rack', sourceStoreId: 'S009', sourceStoreName: 'Oberoi Mall', sourceCluster: 'Mumbai Metro', sourceCity: 'Mumbai', sourceZone: 'West', sourceUtilization: 40, targetStoreId: 'S010', targetStoreName: 'Raghuleela Mall', targetCluster: 'Mumbai Metro', targetCity: 'Mumbai', targetZone: 'West', targetUtilization: 88, quantity: 3, gmrofImpact: 0.9, transportCostLakhs: 0.06, movementTier: 'intra-cluster', spsfImpactSource: -5, spsfImpactTarget: 22, status: 'executed', effectiveRACycle: 'RA-Apr-26' },

  // Intra-cluster (Delhi NCR)
  { id: 'FR-005', fixtureType: '6-ft Gondola', sourceStoreId: 'S011', sourceStoreName: 'Select Citywalk', sourceCluster: 'Delhi NCR', sourceCity: 'Delhi', sourceZone: 'North', sourceUtilization: 44, targetStoreId: 'S012', targetStoreName: 'Ambience Gurgaon', targetCluster: 'Delhi NCR', targetCity: 'Gurgaon', targetZone: 'North', targetUtilization: 92, quantity: 2, gmrofImpact: 1.5, transportCostLakhs: 0.15, movementTier: 'intra-cluster', spsfImpactSource: -7, spsfImpactTarget: 35, status: 'recommended', effectiveRACycle: 'RA-Jun-26' },
  { id: 'FR-006', fixtureType: 'A-Rail', sourceStoreId: 'S013', sourceStoreName: 'Pacific Mall', sourceCluster: 'Delhi NCR', sourceCity: 'Delhi', sourceZone: 'North', sourceUtilization: 48, targetStoreId: 'S014', targetStoreName: 'DLF Promenade', targetCluster: 'Delhi NCR', targetCity: 'Delhi', targetZone: 'North', targetUtilization: 90, quantity: 5, gmrofImpact: 1.1, transportCostLakhs: 0.09, movementTier: 'intra-cluster', spsfImpactSource: -4, spsfImpactTarget: 25, status: 'in-ra-cycle', effectiveRACycle: 'RA-Jun-26' },

  // Intra-city (Pune stores within same city, different clusters)
  { id: 'FR-007', fixtureType: 'Island Table', sourceStoreId: 'S015', sourceStoreName: 'Phoenix Marketcity Pune', sourceCluster: 'Pune Metro', sourceCity: 'Pune', sourceZone: 'West', sourceUtilization: 45, targetStoreId: 'S016', targetStoreName: 'Seasons Mall Pune', targetCluster: 'Pune Suburban', targetCity: 'Pune', targetZone: 'West', targetUtilization: 93, quantity: 2, gmrofImpact: 1.3, transportCostLakhs: 0.35, movementTier: 'intra-city', spsfImpactSource: -5, spsfImpactTarget: 30, status: 'recommended', effectiveRACycle: 'RA-Jul-26' },
  { id: 'FR-008', fixtureType: '4-Way Rack', sourceStoreId: 'S017', sourceStoreName: 'Amanora Town Centre', sourceCluster: 'Pune Suburban', sourceCity: 'Pune', sourceZone: 'West', sourceUtilization: 41, targetStoreId: 'S016', targetStoreName: 'Seasons Mall Pune', targetCluster: 'Pune Suburban', targetCity: 'Pune', targetZone: 'West', targetUtilization: 93, quantity: 3, gmrofImpact: 0.8, transportCostLakhs: 0.22, movementTier: 'intra-city', spsfImpactSource: -3, spsfImpactTarget: 18, status: 'queued-for-ra', effectiveRACycle: 'RA-Jul-26' },

  // Inter-city (Mumbai → Pune, same state)
  { id: 'FR-009', fixtureType: '6-ft Gondola', sourceStoreId: 'S001', sourceStoreName: 'Phoenix Palladium', sourceCluster: 'Mumbai Metro', sourceCity: 'Mumbai', sourceZone: 'West', sourceUtilization: 38, targetStoreId: 'S016', targetStoreName: 'Seasons Mall Pune', targetCluster: 'Pune Suburban', targetCity: 'Pune', targetZone: 'West', targetUtilization: 93, quantity: 2, gmrofImpact: 1.6, transportCostLakhs: 1.20, movementTier: 'inter-city', spsfImpactSource: -6, spsfImpactTarget: 42, status: 'recommended', effectiveRACycle: 'RA-Jul-26' },
  { id: 'FR-010', fixtureType: 'Nesting Table', sourceStoreId: 'S003', sourceStoreName: 'Viviana Mall', sourceCluster: 'Mumbai Metro', sourceCity: 'Mumbai', sourceZone: 'West', sourceUtilization: 42, targetStoreId: 'S018', targetStoreName: 'Nashik City Centre', targetCluster: 'Nashik', targetCity: 'Nashik', targetZone: 'West', targetUtilization: 90, quantity: 2, gmrofImpact: 0.7, transportCostLakhs: 0.85, movementTier: 'inter-city', spsfImpactSource: -3, spsfImpactTarget: 20, status: 'pending-execution', effectiveRACycle: 'RA-May-26' },

  // Inter-state (Mumbai → Delhi, Mumbai → Bangalore)
  { id: 'FR-011', fixtureType: '6-ft Gondola', sourceStoreId: 'S006', sourceStoreName: 'R City Mall', sourceCluster: 'Mumbai Metro', sourceCity: 'Mumbai', sourceZone: 'West', sourceUtilization: 35, targetStoreId: 'S012', targetStoreName: 'Ambience Gurgaon', targetCluster: 'Delhi NCR', targetCity: 'Gurgaon', targetZone: 'North', targetUtilization: 92, quantity: 4, gmrofImpact: 3.1, transportCostLakhs: 4.50, movementTier: 'inter-state', spsfImpactSource: -15, spsfImpactTarget: 68, status: 'recommended', effectiveRACycle: 'RA-Jul-26' },
  { id: 'FR-012', fixtureType: 'Island Table', sourceStoreId: 'S009', sourceStoreName: 'Oberoi Mall', sourceCluster: 'Mumbai Metro', sourceCity: 'Mumbai', sourceZone: 'West', sourceUtilization: 40, targetStoreId: 'S020', targetStoreName: 'UB City Mall', targetCluster: 'Bangalore Metro', targetCity: 'Bangalore', targetZone: 'South', targetUtilization: 89, quantity: 2, gmrofImpact: 1.4, transportCostLakhs: 3.80, movementTier: 'inter-state', spsfImpactSource: -4, spsfImpactTarget: 32, status: 'rejected', effectiveRACycle: 'RA-May-26' },
];

// ── Fixture Transfers (STO/STN) ──

export type TransferStatus = 'raised' | 'dispatched' | 'in-transit' | 'inwarded' | 'completed';

export interface FixtureTransfer {
  id: string;
  stoNumber: string;
  fixtureType: string;
  quantity: number;
  sourceStoreId: string;
  sourceStoreName: string;
  destStoreId: string;
  destStoreName: string;
  status: TransferStatus;
  raisedAt: string;
  dispatchedAt?: string;
  inwardedAt?: string;
  completedAt?: string;
  raisedBy: string;
}

export const fixtureTransfers: FixtureTransfer[] = [
  { id: 'FT-001', stoNumber: 'STO-2026-0451', fixtureType: '4-ft Wall', quantity: 3, sourceStoreId: 'S001', sourceStoreName: 'Trends Phoenix Mall', destStoreId: 'S005', destStoreName: 'Trends Andheri West', status: 'completed', raisedAt: '2026-03-01', dispatchedAt: '2026-03-03', inwardedAt: '2026-03-06', completedAt: '2026-03-07', raisedBy: 'Priya Sharma' },
  { id: 'FT-002', stoNumber: 'STO-2026-0452', fixtureType: '6-ft Gondola', quantity: 2, sourceStoreId: 'S003', sourceStoreName: 'Trends Lower Parel', destStoreId: 'S008', destStoreName: 'Trends Bandra', status: 'inwarded', raisedAt: '2026-03-10', dispatchedAt: '2026-03-12', inwardedAt: '2026-03-15', raisedBy: 'Rahul Verma' },
  { id: 'FT-003', stoNumber: 'STO-2026-0453', fixtureType: 'Island Table', quantity: 1, sourceStoreId: 'S002', sourceStoreName: 'Trends Malad', destStoreId: 'S010', destStoreName: 'Trends Thane', status: 'in-transit', raisedAt: '2026-03-18', dispatchedAt: '2026-03-20', raisedBy: 'Anita Desai' },
  { id: 'FT-004', stoNumber: 'STO-2026-0454', fixtureType: '4-ft Wall', quantity: 4, sourceStoreId: 'S004', sourceStoreName: 'Trends Borivali', destStoreId: 'S012', destStoreName: 'Trends Powai', status: 'dispatched', raisedAt: '2026-03-22', dispatchedAt: '2026-03-24', raisedBy: 'Vikram Patel' },
  { id: 'FT-005', stoNumber: 'STO-2026-0455', fixtureType: 'End Cap', quantity: 2, sourceStoreId: 'S006', sourceStoreName: 'Trends Juhu', destStoreId: 'S005', destStoreName: 'Trends Andheri West', status: 'raised', raisedAt: '2026-03-28', raisedBy: 'Meera Nair' },
  { id: 'FT-006', stoNumber: 'STO-2026-0456', fixtureType: '6-ft Gondola', quantity: 1, sourceStoreId: 'S001', sourceStoreName: 'Trends Phoenix Mall', destStoreId: 'S014', destStoreName: 'Trends Pune Kothrud', status: 'in-transit', raisedAt: '2026-03-15', dispatchedAt: '2026-03-17', raisedBy: 'Priya Sharma' },
  { id: 'FT-007', stoNumber: 'STO-2026-0457', fixtureType: '4-ft Wall', quantity: 2, sourceStoreId: 'S007', sourceStoreName: 'Trends Dadar', destStoreId: 'S015', destStoreName: 'Trends Nashik', status: 'completed', raisedAt: '2026-02-20', dispatchedAt: '2026-02-22', inwardedAt: '2026-02-25', completedAt: '2026-02-26', raisedBy: 'Sanjay Kumar' },
  { id: 'FT-008', stoNumber: 'STO-2026-0458', fixtureType: 'Island Table', quantity: 1, sourceStoreId: 'S009', sourceStoreName: 'Trends Vashi', destStoreId: 'S008', destStoreName: 'Trends Bandra', status: 'raised', raisedAt: '2026-03-30', raisedBy: 'Deepa Iyer' },
  { id: 'FT-009', stoNumber: 'STO-2026-0459', fixtureType: 'End Cap', quantity: 3, sourceStoreId: 'S011', sourceStoreName: 'Trends Worli', destStoreId: 'S010', destStoreName: 'Trends Thane', status: 'dispatched', raisedAt: '2026-03-25', dispatchedAt: '2026-03-27', raisedBy: 'Amit Joshi' },
  { id: 'FT-010', stoNumber: 'STO-2026-0460', fixtureType: '4-ft Wall', quantity: 2, sourceStoreId: 'S013', sourceStoreName: 'Trends Nagpur', destStoreId: 'S012', destStoreName: 'Trends Powai', status: 'raised', raisedAt: '2026-04-01', raisedBy: 'Kavita Rao' },
  { id: 'FT-011', stoNumber: 'STO-2026-0461', fixtureType: '6-ft Gondola', quantity: 2, sourceStoreId: 'S004', sourceStoreName: 'Trends Borivali', destStoreId: 'S005', destStoreName: 'Trends Andheri West', status: 'inwarded', raisedAt: '2026-03-08', dispatchedAt: '2026-03-10', inwardedAt: '2026-03-14', raisedBy: 'Vikram Patel' },
  { id: 'FT-012', stoNumber: 'STO-2026-0462', fixtureType: 'Island Table', quantity: 1, sourceStoreId: 'S006', sourceStoreName: 'Trends Juhu', destStoreId: 'S014', destStoreName: 'Trends Pune Kothrud', status: 'completed', raisedAt: '2026-02-15', dispatchedAt: '2026-02-17', inwardedAt: '2026-02-20', completedAt: '2026-02-21', raisedBy: 'Meera Nair' },
];

// ── Store Projects Tracker (NSO + Renovation) ──

export interface NSOStep {
  step: number;
  name: string;
  owner: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  completedAt?: string;
  dueDate: string;
}

export interface NSOSiteIntel {
  /** LFL reference store — the best comparable existing store */
  lflStore: { storeId: string; storeName: string; city: string; spsf: number; gmrof: number; grade: StoreGradeOM; carpetArea: number; similarity: number };
  /** Expected first-hit performance based on LFL and catchment */
  projectedSpsf: number;
  projectedGmrof: number;
}

export interface NSOStore {
  storeId: string;
  storeName: string;
  format: string;
  city: string;
  carpetArea: number;
  targetLaunchDate: string;
  currentStep: number;
  steps: NSOStep[];
  overallStatus: 'on-track' | 'delayed' | 'at-risk' | 'completed';
  delayReason?: string;
  projectType: 'nso' | 'renovation' | 'refit';
  /** For renovation/refit: what triggered the project */
  renovationScope?: string;
  /** For renovation/refit: fixture changes bundled with the project */
  bundledFixtureChanges?: { from: string; to: string; qty: number }[];
  /** Site intelligence — competitive research, LFL store, catchment (NSO only) */
  siteIntel?: NSOSiteIntel;
}

const NSO_STEP_NAMES = [
  'Site Identification',
  'Lease Negotiation',
  'Design Brief',
  'Layout Finalization',
  'Fixture Order',
  'Fixture Manufacturing',
  'Fixture Dispatch',
  'Civil Work',
  'Fixture Installation',
  'Merchandise Planning',
  'Stock Allocation',
  'VM Setup',
  'IT & POS Setup',
  'Staff Training',
  'Soft Launch',
];

const RENOVATION_STEP_NAMES = [
  'Layout Audit',
  'Renovation Scope',
  'Temporary Stock Relocation',
  'Teardown & Civil',
  'Fixture Order',
  'Fixture Manufacturing',
  'Fixture Dispatch',
  'New Fixture Installation',
  'VM Setup & Planogram',
  'Stock Replenishment',
  'Compliance Audit',
  'Store Relaunch',
];

const REFIT_STEP_NAMES = [
  'Performance Review',
  'Refit Scope & Budget',
  'Fixture Swap Plan',
  'Overnight Teardown',
  'New Fixture Install',
  'VM Refresh',
  'Stock Rearrangement',
  'Soft Reopen',
];

const NSO_OWNERS = ['Realty', 'Realty', 'Design', 'Design', 'Procurement', 'Vendor', 'Logistics', 'Civil', 'Civil', 'SP/VM', 'RA', 'VM', 'IT', 'HR', 'Ops'];
const RENOVATION_OWNERS = ['SP', 'SP/Design', 'Store Ops', 'Civil', 'Procurement', 'Vendor', 'Logistics', 'Civil', 'VM', 'RA', 'Compliance', 'Ops'];
const REFIT_OWNERS = ['SP', 'SP/Finance', 'SP', 'Store Ops', 'Civil', 'VM', 'Store Ops', 'Ops'];

export const nsoStores: NSOStore[] = [
  // ── New Store Openings ──
  {
    storeId: 'NSO-001', storeName: 'Trends Gurgaon Cyber Hub', format: 'Trends', city: 'Gurgaon', carpetArea: 4200, targetLaunchDate: '2026-06-15', currentStep: 9, overallStatus: 'on-track', projectType: 'nso',
    siteIntel: {
      lflStore: { storeId: 'a1b2c3d4-0001-4a5b-8c6d-7e8f9a0b1c2d', storeName: 'Select Citywalk', city: 'Delhi', spsf: 845, gmrof: 420, grade: 'A', carpetArea: 4800, similarity: 87 },
      projectedSpsf: 780,
      projectedGmrof: 390,
    },
    steps: NSO_STEP_NAMES.map((name, i) => ({
      step: i + 1, name,
      owner: NSO_OWNERS[i] ?? 'Ops',
      status: i < 8 ? 'completed' as const : i === 8 ? 'in-progress' as const : 'pending' as const,
      completedAt: i < 8 ? `2026-0${Math.min(i + 1, 5)}-${String(10 + i).padStart(2, '0')}` : undefined,
      dueDate: `2026-0${Math.min(Math.floor(i / 3) + 3, 6)}-${String(15 + (i % 15)).padStart(2, '0')}`,
    })),
  },
  {
    storeId: 'NSO-002', storeName: 'Trends Hyderabad Banjara Hills', format: 'Trends', city: 'Hyderabad', carpetArea: 3800, targetLaunchDate: '2026-07-01', currentStep: 5, overallStatus: 'delayed', delayReason: 'Fixture manufacturing delayed by vendor — 2 weeks behind', projectType: 'nso',
    siteIntel: {
      lflStore: { storeId: '7bc9e3f1-6a2d-4c5e-9087-4b6d8a0c2e3f', storeName: 'Inorbit Hyderabad', city: 'Hyderabad', spsf: 612, gmrof: 315, grade: 'A1', carpetArea: 3500, similarity: 82 },
      projectedSpsf: 580,
      projectedGmrof: 295,
    },
    steps: NSO_STEP_NAMES.map((name, i) => ({
      step: i + 1, name,
      owner: NSO_OWNERS[i] ?? 'Ops',
      status: i < 4 ? 'completed' as const : i === 4 ? 'in-progress' as const : i === 5 ? 'blocked' as const : 'pending' as const,
      completedAt: i < 4 ? `2026-0${Math.min(i + 2, 5)}-${String(5 + i * 3).padStart(2, '0')}` : undefined,
      dueDate: `2026-0${Math.min(Math.floor(i / 3) + 4, 7)}-${String(1 + (i * 2 % 28)).padStart(2, '0')}`,
    })),
  },
  {
    storeId: 'NSO-003', storeName: 'Yousta Pune Hinjewadi', format: 'Yousta', city: 'Pune', carpetArea: 2500, targetLaunchDate: '2026-08-15', currentStep: 3, overallStatus: 'on-track', projectType: 'nso',
    siteIntel: {
      lflStore: { storeId: '4cd2e6f8-5b1c-4d4e-8976-3a5c7d9b0e1f', storeName: 'Yousta Wakad', city: 'Pune', spsf: 420, gmrof: 225, grade: 'A2', carpetArea: 2200, similarity: 91 },
      projectedSpsf: 410,
      projectedGmrof: 215,
    },
    steps: NSO_STEP_NAMES.map((name, i) => ({
      step: i + 1, name,
      owner: NSO_OWNERS[i] ?? 'Ops',
      status: i < 2 ? 'completed' as const : i === 2 ? 'in-progress' as const : 'pending' as const,
      completedAt: i < 2 ? `2026-0${i + 3}-${String(20 + i).padStart(2, '0')}` : undefined,
      dueDate: `2026-0${Math.min(Math.floor(i / 2) + 5, 8)}-${String(1 + (i * 3 % 28)).padStart(2, '0')}`,
    })),
  },
  {
    storeId: 'NSO-004', storeName: 'Trends Chennai T Nagar', format: 'Trends', city: 'Chennai', carpetArea: 5100, targetLaunchDate: '2026-04-01', currentStep: 15, overallStatus: 'completed', projectType: 'nso',
    siteIntel: {
      lflStore: { storeId: '6ef4g8h0-7c3d-4f6e-a098-5b7d9c1e3f5g', storeName: 'Express Avenue', city: 'Chennai', spsf: 738, gmrof: 365, grade: 'A1', carpetArea: 4600, similarity: 79 },
      projectedSpsf: 690,
      projectedGmrof: 340,
    },
    steps: NSO_STEP_NAMES.map((name, i) => ({
      step: i + 1, name,
      owner: NSO_OWNERS[i] ?? 'Ops',
      status: 'completed' as const,
      completedAt: `2026-0${Math.min(Math.floor(i / 5) + 1, 3)}-${String(5 + i * 2).padStart(2, '0')}`,
      dueDate: `2026-0${Math.min(Math.floor(i / 5) + 1, 3)}-${String(10 + i * 2).padStart(2, '0')}`,
    })),
  },
  // ── Renovations ──
  {
    storeId: 'REN-001', storeName: 'Phoenix Mall Bangalore', format: 'Trends', city: 'Bangalore', carpetArea: 6200, targetLaunchDate: '2026-05-20', currentStep: 6, overallStatus: 'on-track', projectType: 'renovation',
    renovationScope: 'Floor 2 full renovation — expand WIW from 18% to 25%, add dedicated athleisure zone, upgrade lighting to LED track',
    bundledFixtureChanges: [
      { from: '4-Way Rack', to: 'A-Rail (4ft)', qty: 8 },
      { from: 'Gondola (old)', to: 'Gondola (new slim)', qty: 4 },
    ],
    steps: RENOVATION_STEP_NAMES.map((name, i) => ({
      step: i + 1, name,
      owner: RENOVATION_OWNERS[i] ?? 'Ops',
      status: i < 5 ? 'completed' as const : i === 5 ? 'in-progress' as const : 'pending' as const,
      completedAt: i < 5 ? `2026-0${Math.min(i + 2, 4)}-${String(5 + i * 4).padStart(2, '0')}` : undefined,
      dueDate: `2026-0${Math.min(Math.floor(i / 3) + 3, 5)}-${String(10 + (i * 3 % 28)).padStart(2, '0')}`,
    })),
  },
  {
    storeId: 'REN-002', storeName: 'Ambience Mall Gurgaon', format: 'Trends', city: 'Gurgaon', carpetArea: 5800, targetLaunchDate: '2026-06-30', currentStep: 3, overallStatus: 'delayed', projectType: 'renovation',
    delayReason: 'Civil contractor delayed — monsoon waterproofing dependency',
    renovationScope: 'Full store refit — convert from old Trends format to new Trends 3.0 layout. Reduce formal from 18% to 10%, add sportswear zone',
    bundledFixtureChanges: [
      { from: 'Wall Unit (old)', to: 'Wall Unit (new modular)', qty: 12 },
      { from: '4-Way Rack', to: 'Nesting Table', qty: 6 },
    ],
    steps: RENOVATION_STEP_NAMES.map((name, i) => ({
      step: i + 1, name,
      owner: RENOVATION_OWNERS[i] ?? 'Ops',
      status: i < 2 ? 'completed' as const : i === 2 ? 'in-progress' as const : i === 3 ? 'blocked' as const : 'pending' as const,
      completedAt: i < 2 ? `2026-0${i + 3}-${String(10 + i * 5).padStart(2, '0')}` : undefined,
      dueDate: `2026-0${Math.min(Math.floor(i / 2) + 4, 6)}-${String(5 + (i * 4 % 28)).padStart(2, '0')}`,
    })),
  },
  // ── Refits (lighter than renovation) ──
  {
    storeId: 'REF-001', storeName: 'Inorbit Malad', format: 'Trends', city: 'Mumbai', carpetArea: 3400, targetLaunchDate: '2026-04-25', currentStep: 5, overallStatus: 'on-track', projectType: 'refit',
    renovationScope: 'Segment rebalancing refit — shift 15% space from Formal to Casual based on sell-through data. Overnight execution, no store closure',
    bundledFixtureChanges: [
      { from: '4-Way Rack (Formal)', to: '4-Way Rack (Casual)', qty: 6 },
    ],
    steps: REFIT_STEP_NAMES.map((name, i) => ({
      step: i + 1, name,
      owner: REFIT_OWNERS[i] ?? 'Ops',
      status: i < 4 ? 'completed' as const : i === 4 ? 'in-progress' as const : 'pending' as const,
      completedAt: i < 4 ? `2026-04-${String(5 + i * 3).padStart(2, '0')}` : undefined,
      dueDate: `2026-04-${String(10 + i * 2).padStart(2, '0')}`,
    })),
  },
];

// ── Fixture Type Conversions ──

export interface FixtureConversion {
  id: string;
  storeId: string;
  storeName: string;
  conversionType: 'bulk-swap' | 'selective-swap' | 'de-congestion' | 'capacity-upgrade' | 'mixed';
  fromFixture: string;
  toFixture: string;
  quantity: number;
  trigger: string;
  segmentAffected: string;
  inventoryStatus: {
    available: boolean;
    source: 'dc' | 'store-surplus' | 'procurement-needed';
    unitsInStock: number;
    unitsNeeded: number;
    nextRACycle?: string; // when inventory will be available (e.g. 'RA-Jul-26')
  };
  impactPreview: {
    beforeFixtures: number;
    afterFixtures: number;
    beforeCapacity: number;
    afterCapacity: number;
    beforeDensity: number;
    afterDensity: number;
    costEstimate: number;
  };
  status: 'recommended' | 'approved' | 'in-progress' | 'completed' | 'rejected';
}

export const fixtureConversions: FixtureConversion[] = [
  { id: 'FC-001', storeId: 'S001', storeName: 'Trends Phoenix Mall', conversionType: 'de-congestion', fromFixture: '4-Way Rack', toFixture: 'A-Rail', quantity: 6, trigger: 'High density floor zone', segmentAffected: 'Women Western', inventoryStatus: { available: true, source: 'dc', unitsInStock: 12, unitsNeeded: 6 }, impactPreview: { beforeFixtures: 48, afterFixtures: 48, beforeCapacity: 960, afterCapacity: 720, beforeDensity: 8.2, afterDensity: 6.1, costEstimate: 45000 }, status: 'recommended' },
  { id: 'FC-002', storeId: 'S005', storeName: 'Trends Andheri West', conversionType: 'capacity-upgrade', fromFixture: 'A-Rail', toFixture: '6-ft Gondola', quantity: 4, trigger: 'Underperforming segment needs depth', segmentAffected: 'Men Casual', inventoryStatus: { available: true, source: 'store-surplus', unitsInStock: 5, unitsNeeded: 4 }, impactPreview: { beforeFixtures: 32, afterFixtures: 32, beforeCapacity: 480, afterCapacity: 640, beforeDensity: 5.4, afterDensity: 7.2, costEstimate: 72000 }, status: 'approved' },
  { id: 'FC-003', storeId: 'S008', storeName: 'Trends Bandra', conversionType: 'bulk-swap', fromFixture: '4-ft Wall', toFixture: '6-ft Wall', quantity: 8, trigger: 'Store expansion — taller walls allowed', segmentAffected: 'Ethnic Wear', inventoryStatus: { available: false, source: 'procurement-needed', unitsInStock: 0, unitsNeeded: 8, nextRACycle: 'RA-Jul-26' }, impactPreview: { beforeFixtures: 24, afterFixtures: 24, beforeCapacity: 480, afterCapacity: 720, beforeDensity: 4.8, afterDensity: 7.2, costEstimate: 120000 }, status: 'in-progress' },
  { id: 'FC-004', storeId: 'S010', storeName: 'Trends Thane', conversionType: 'selective-swap', fromFixture: 'End Cap', toFixture: 'Island Table', quantity: 3, trigger: 'Seasonal promo zone needs flat display', segmentAffected: 'Accessories', inventoryStatus: { available: true, source: 'dc', unitsInStock: 10, unitsNeeded: 3 }, impactPreview: { beforeFixtures: 8, afterFixtures: 8, beforeCapacity: 64, afterCapacity: 96, beforeDensity: 3.2, afterDensity: 4.8, costEstimate: 35000 }, status: 'completed' },
  { id: 'FC-005', storeId: 'S003', storeName: 'Trends Lower Parel', conversionType: 'mixed', fromFixture: '4-Way Rack + End Cap', toFixture: 'A-Rail + Island Table', quantity: 5, trigger: 'Layout modernization pilot', segmentAffected: 'Kids Wear', inventoryStatus: { available: true, source: 'dc', unitsInStock: 7, unitsNeeded: 5 }, impactPreview: { beforeFixtures: 40, afterFixtures: 38, beforeCapacity: 800, afterCapacity: 760, beforeDensity: 7.5, afterDensity: 7.1, costEstimate: 95000 }, status: 'recommended' },
  { id: 'FC-006', storeId: 'S012', storeName: 'Trends Powai', conversionType: 'de-congestion', fromFixture: '4-Way Rack', toFixture: 'A-Rail', quantity: 4, trigger: 'Customer flow bottleneck at zone 3', segmentAffected: 'Women Western', inventoryStatus: { available: false, source: 'procurement-needed', unitsInStock: 0, unitsNeeded: 4, nextRACycle: 'RA-Aug-26' }, impactPreview: { beforeFixtures: 36, afterFixtures: 36, beforeCapacity: 720, afterCapacity: 540, beforeDensity: 9.0, afterDensity: 6.8, costEstimate: 30000 }, status: 'rejected' },
];

// ── Store Space Changes ──

export type SpaceChangeType = 'decrease' | 'increase' | 'sis-carve-out' | 'sis-reclaim';

export interface StoreSpaceChange {
  id: string;
  storeId: string;
  storeName: string;
  changeType: SpaceChangeType;
  sqftBefore: number;
  sqftAfter: number;
  zoneAffected: string;
  reason: string;
  effectiveDate: string;
  fixturesAffected: number;
  status: 'pending' | 'approved' | 'in-progress' | 'completed';
  sisDetails?: {
    partnerBrand: string;
    sisType: 'hard' | 'soft' | 'branded-endcap';
    duration: 'permanent' | 'hit-based' | 'campaign';
  };
}

export const storeSpaceChanges: StoreSpaceChange[] = [
  { id: 'SC-001', storeId: 'S001', storeName: 'Trends Phoenix Mall', changeType: 'decrease', sqftBefore: 4800, sqftAfter: 4200, zoneAffected: 'Back Zone', reason: 'Landlord reclaiming 600 sqft for adjacent tenant', effectiveDate: '2026-06-01', fixturesAffected: 8, status: 'approved' },
  { id: 'SC-002', storeId: 'S005', storeName: 'Trends Andheri West', changeType: 'sis-carve-out', sqftBefore: 3600, sqftAfter: 3200, zoneAffected: 'Entrance Right', reason: 'Levi\'s SIS installation', effectiveDate: '2026-05-15', fixturesAffected: 5, status: 'in-progress', sisDetails: { partnerBrand: 'Levi\'s', sisType: 'hard', duration: 'permanent' } },
  { id: 'SC-003', storeId: 'S008', storeName: 'Trends Bandra', changeType: 'increase', sqftBefore: 3200, sqftAfter: 4000, zoneAffected: 'New Wing', reason: 'Store expansion — adjacent unit acquired', effectiveDate: '2026-07-01', fixturesAffected: 12, status: 'pending' },
  { id: 'SC-004', storeId: 'S003', storeName: 'Trends Lower Parel', changeType: 'sis-carve-out', sqftBefore: 4200, sqftAfter: 3900, zoneAffected: 'End Cap Zone', reason: 'Nike branded endcap — hit-based', effectiveDate: '2026-04-15', fixturesAffected: 3, status: 'completed', sisDetails: { partnerBrand: 'Nike', sisType: 'branded-endcap', duration: 'hit-based' } },
  { id: 'SC-005', storeId: 'S010', storeName: 'Trends Thane', changeType: 'decrease', sqftBefore: 3800, sqftAfter: 3400, zoneAffected: 'Trial Room Area', reason: 'Fire safety compliance — additional exit required', effectiveDate: '2026-05-01', fixturesAffected: 4, status: 'approved' },
  { id: 'SC-006', storeId: 'S001', storeName: 'Trends Phoenix Mall', changeType: 'sis-reclaim', sqftBefore: 4200, sqftAfter: 4500, zoneAffected: 'Entrance Left', reason: 'Reclaiming Gap SIS — lease expired', effectiveDate: '2026-08-01', fixturesAffected: 6, status: 'pending', sisDetails: { partnerBrand: 'Gap', sisType: 'soft', duration: 'permanent' } },
  { id: 'SC-007', storeId: 'S012', storeName: 'Trends Powai', changeType: 'increase', sqftBefore: 2800, sqftAfter: 3200, zoneAffected: 'Mezzanine', reason: 'Mezzanine floor addition approved', effectiveDate: '2026-09-01', fixturesAffected: 8, status: 'pending' },
];

// ── Scenario Planning & A/B Testing ──

export interface SpaceScenario {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'simulated' | 'approved' | 'testing' | 'rolled-out';
  createdAt: string;
  sftAllocations: { segment: string; sftPct: number; projectedSpsf: number }[];
  projectedMetrics: {
    avgSpsf: number;
    avgGmrof: number;
    optionCount: number;
    investmentCost: number;
  };
  isBaseline: boolean;
}

export interface ABTest {
  id: string;
  scenarioId: string;
  scenarioName: string;
  testStores: number;
  controlStores: number;
  startDate: string;
  endDate: string;
  status: 'designing' | 'active' | 'completed';
  results?: {
    testSpsf: number;
    controlSpsf: number;
    lift: number;
    pValue: number;
  };
}

export const spaceScenarios: SpaceScenario[] = [
  {
    id: 'SC-BASELINE', name: 'Current Baseline', description: 'Current network space allocation — no changes', status: 'rolled-out', createdAt: '2026-01-01', isBaseline: true,
    sftAllocations: [
      { segment: 'WE', sftPct: 22, projectedSpsf: 680 },
      { segment: 'MC', sftPct: 18, projectedSpsf: 820 },
      { segment: 'WW', sftPct: 15, projectedSpsf: 750 },
      { segment: 'MW', sftPct: 12, projectedSpsf: 610 },
      { segment: 'Kids', sftPct: 10, projectedSpsf: 540 },
      { segment: 'Sportswear', sftPct: 8, projectedSpsf: 480 },
      { segment: 'Accessories', sftPct: 8, projectedSpsf: 920 },
      { segment: 'Footwear', sftPct: 7, projectedSpsf: 1100 },
    ],
    projectedMetrics: { avgSpsf: 712, avgGmrof: 3.2, optionCount: 24500, investmentCost: 0 },
  },
  {
    id: 'SC-WE-BOOST', name: 'WE Space Boost', description: 'Increase WE allocation by 5% from MW and Kids — targets wedding hit uplift', status: 'simulated', createdAt: '2026-03-15', isBaseline: false,
    sftAllocations: [
      { segment: 'WE', sftPct: 27, projectedSpsf: 710 },
      { segment: 'MC', sftPct: 18, projectedSpsf: 820 },
      { segment: 'WW', sftPct: 15, projectedSpsf: 750 },
      { segment: 'MW', sftPct: 10, projectedSpsf: 630 },
      { segment: 'Kids', sftPct: 8, projectedSpsf: 560 },
      { segment: 'Sportswear', sftPct: 8, projectedSpsf: 480 },
      { segment: 'Accessories', sftPct: 8, projectedSpsf: 920 },
      { segment: 'Footwear', sftPct: 6, projectedSpsf: 1120 },
    ],
    projectedMetrics: { avgSpsf: 738, avgGmrof: 3.4, optionCount: 24200, investmentCost: 120000 },
  },
  {
    id: 'SC-ACCESSORY-HUB', name: 'Accessory Hub Expansion', description: 'Double accessories and footwear space — high SPSF segments get more floor', status: 'approved', createdAt: '2026-03-20', isBaseline: false,
    sftAllocations: [
      { segment: 'WE', sftPct: 20, projectedSpsf: 690 },
      { segment: 'MC', sftPct: 16, projectedSpsf: 830 },
      { segment: 'WW', sftPct: 13, projectedSpsf: 760 },
      { segment: 'MW', sftPct: 10, projectedSpsf: 620 },
      { segment: 'Kids', sftPct: 8, projectedSpsf: 550 },
      { segment: 'Sportswear', sftPct: 7, projectedSpsf: 490 },
      { segment: 'Accessories', sftPct: 14, projectedSpsf: 880 },
      { segment: 'Footwear', sftPct: 12, projectedSpsf: 1050 },
    ],
    projectedMetrics: { avgSpsf: 755, avgGmrof: 3.6, optionCount: 23800, investmentCost: 280000 },
  },
  {
    id: 'SC-SPORTSWEAR-PUSH', name: 'Sportswear Push', description: 'Increase sportswear to capture athleisure trend — reduce WE and MW', status: 'draft', createdAt: '2026-04-01', isBaseline: false,
    sftAllocations: [
      { segment: 'WE', sftPct: 19, projectedSpsf: 700 },
      { segment: 'MC', sftPct: 18, projectedSpsf: 820 },
      { segment: 'WW', sftPct: 14, projectedSpsf: 755 },
      { segment: 'MW', sftPct: 10, projectedSpsf: 620 },
      { segment: 'Kids', sftPct: 10, projectedSpsf: 540 },
      { segment: 'Sportswear', sftPct: 14, projectedSpsf: 460 },
      { segment: 'Accessories', sftPct: 8, projectedSpsf: 920 },
      { segment: 'Footwear', sftPct: 7, projectedSpsf: 1100 },
    ],
    projectedMetrics: { avgSpsf: 720, avgGmrof: 3.3, optionCount: 25100, investmentCost: 95000 },
  },
];

// ── What-If Scenario Generator Results ──

export interface ScenarioTemplate {
  keywords: string[];
  label: string;
  preview: {
    scope: string;
    change: string;
    spsfImpact: string;
    capacityImpact: string;
    warning?: string;
  };
  result: GeneratedScenarioResult;
}

export interface GeneratedScenarioResult {
  title: string;
  description: string;
  scope: { storeCount: number; region: string; grade: string };
  fixtureChanges: { from: string; to: string; qty: number; zone: string; stockStatus: 'available' | 'partial' | 'needs-ra'; availableQty: number; etaWeeks?: number; nextRACycle?: string }[];
  networkImpact: {
    currentAvgSpsf: number;
    projectedAvgSpsf: number;
    spsfDeltaPct: number;
    currentAvgGmrof: number;
    projectedAvgGmrof: number;
    optionDelta: number;
    investmentLakhs: number;
    paybackMonths: number;
  };
  segmentImpact: { segment: string; currentSftPct: number; newSftPct: number; currentSpsf: number; projectedSpsf: number; delta: number }[];
  affectedStores: { storeId: string; storeName: string; city: string; grade: string; currentSpsf: number; projectedSpsf: number; fixturesChanged: number; status: 'high-impact' | 'moderate' | 'low-impact' }[];
  risks: { level: 'high' | 'medium' | 'low'; description: string; mitigation: string }[];
}

export const scenarioTemplates: ScenarioTemplate[] = [
  {
    keywords: ['decongest', 'reduce density', 'declutter', 'breathing room', 'less crowded'],
    label: 'Decongest Stores',
    preview: {
      scope: '89 Grade B stores in West region',
      change: 'Convert 4-Way Rack → A-Rail in mid-zone (avg 4 per store = 356 fixtures)',
      spsfImpact: 'Estimated +8.2% (reduced density improves browsing)',
      capacityImpact: '-15% display capacity (960 → 816 units avg per store)',
      warning: 'Capacity reduction may require stock rebalancing for 23 stores with high density',
    },
    result: {
      title: 'Decongest Grade B — West Region',
      description: 'Replace high-density 4-Way Racks with A-Rails in mid-zone to reduce visual clutter and improve browsing time',
      scope: { storeCount: 89, region: 'West', grade: 'B' },
      fixtureChanges: [{ from: '4-Way Rack', to: 'A-Rail (4ft)', qty: 356, zone: 'Mid-zone', stockStatus: 'partial', availableQty: 210, etaWeeks: 6, nextRACycle: 'RA Jul-26' }],
      networkImpact: {
        currentAvgSpsf: 712, projectedAvgSpsf: 770, spsfDeltaPct: 8.2,
        currentAvgGmrof: 3.2, projectedAvgGmrof: 3.5,
        optionDelta: -1440, investmentLakhs: 18.5, paybackMonths: 4,
      },
      segmentImpact: [
        { segment: 'Menswear Casual', currentSftPct: 22, newSftPct: 22, currentSpsf: 680, projectedSpsf: 735, delta: 55 },
        { segment: 'Women Western Wear', currentSftPct: 15, newSftPct: 15, currentSpsf: 750, projectedSpsf: 812, delta: 62 },
        { segment: 'Menswear Formal', currentSftPct: 12, newSftPct: 12, currentSpsf: 610, projectedSpsf: 660, delta: 50 },
        { segment: 'Kidswear', currentSftPct: 10, newSftPct: 10, currentSpsf: 540, projectedSpsf: 580, delta: 40 },
      ],
      affectedStores: [
        { storeId: 'STR-MUM-003', storeName: 'Phoenix Marketcity', city: 'Mumbai', grade: 'B', currentSpsf: 695, projectedSpsf: 762, fixturesChanged: 6, status: 'high-impact' },
        { storeId: 'STR-PUN-002', storeName: 'Seasons Mall', city: 'Pune', grade: 'B', currentSpsf: 670, projectedSpsf: 728, fixturesChanged: 5, status: 'high-impact' },
        { storeId: 'STR-AHM-001', storeName: 'Alpha One Mall', city: 'Ahmedabad', grade: 'B', currentSpsf: 648, projectedSpsf: 698, fixturesChanged: 4, status: 'moderate' },
        { storeId: 'STR-SUR-001', storeName: 'VR Surat', city: 'Surat', grade: 'B', currentSpsf: 620, projectedSpsf: 665, fixturesChanged: 4, status: 'moderate' },
        { storeId: 'STR-NAG-001', storeName: 'Empress Mall', city: 'Nagpur', grade: 'B', currentSpsf: 590, projectedSpsf: 630, fixturesChanged: 3, status: 'low-impact' },
        { storeId: 'STR-GOA-001', storeName: 'Mall de Goa', city: 'Goa', grade: 'B', currentSpsf: 580, projectedSpsf: 618, fixturesChanged: 3, status: 'low-impact' },
      ],
      risks: [
        { level: 'medium', description: 'Capacity reduction of 15% requires stock rebalancing for 23 high-density stores', mitigation: 'Run DC replenishment adjustment for affected stores before fixture swap. Reduce depth-per-option from 8 to 6 for Core bricks to fit within reduced capacity.' },
        { level: 'low', description: 'A-Rails may not suit heavy denim — consider retaining 4-Way for denim bricks', mitigation: 'Exclude denim bricks (Jeans, Joggers) from conversion — keep 1 4-Way Rack per store for heavy garments.' },
      ],
    },
  },
  {
    keywords: ['expand', 'women', 'ethnic', 'indian wear', 'wedding', 'WE', 'WIW'],
    label: 'Expand Women Ethnic',
    preview: {
      scope: '156 Trends stores across all regions',
      change: 'Increase Women Indian Wear from 22% → 27% space allocation',
      spsfImpact: 'Estimated +5.4% network SPSF uplift',
      capacityImpact: '+320 options network-wide in WIW segment',
      warning: 'Requires reducing Menswear Casual and Kidswear by 3pp and 2pp respectively',
    },
    result: {
      title: 'Expand Women Indian Wear — All Trends',
      description: 'Increase WIW space allocation by 5pp, sourcing from MC (-3pp) and KW (-2pp) based on GMROF efficiency',
      scope: { storeCount: 156, region: 'All', grade: 'All' },
      fixtureChanges: [
        { from: '4-Way Rack (MC)', to: 'A-Rail (WIW)', qty: 468, zone: 'MC Zone → WIW Zone', stockStatus: 'available', availableQty: 468 },
        { from: 'A-Rail (KW)', to: 'A-Rail (WIW)', qty: 312, zone: 'Kids Zone → WIW Zone', stockStatus: 'needs-ra', availableQty: 0, nextRACycle: 'RA Jul-26' },
      ],
      networkImpact: {
        currentAvgSpsf: 712, projectedAvgSpsf: 750, spsfDeltaPct: 5.4,
        currentAvgGmrof: 3.2, projectedAvgGmrof: 3.4,
        optionDelta: 320, investmentLakhs: 42.0, paybackMonths: 6,
      },
      segmentImpact: [
        { segment: 'Women Indian Wear', currentSftPct: 22, newSftPct: 27, currentSpsf: 680, projectedSpsf: 710, delta: 30 },
        { segment: 'Menswear Casual', currentSftPct: 18, newSftPct: 15, currentSpsf: 820, projectedSpsf: 845, delta: 25 },
        { segment: 'Kidswear', currentSftPct: 10, newSftPct: 8, currentSpsf: 540, projectedSpsf: 560, delta: 20 },
      ],
      affectedStores: [
        { storeId: 'STR-DEL-001', storeName: 'Select Citywalk', city: 'Delhi', grade: 'A', currentSpsf: 845, projectedSpsf: 890, fixturesChanged: 8, status: 'high-impact' },
        { storeId: 'STR-MUM-001', storeName: 'Phoenix Palladium', city: 'Mumbai', grade: 'A', currentSpsf: 861, projectedSpsf: 908, fixturesChanged: 7, status: 'high-impact' },
        { storeId: 'STR-BLR-001', storeName: 'UB City Mall', city: 'Bangalore', grade: 'A', currentSpsf: 828, projectedSpsf: 870, fixturesChanged: 6, status: 'moderate' },
        { storeId: 'STR-HYD-001', storeName: 'Inorbit Mall', city: 'Hyderabad', grade: 'A1', currentSpsf: 710, projectedSpsf: 748, fixturesChanged: 5, status: 'moderate' },
      ],
      risks: [
        { level: 'medium', description: 'MC space reduction may impact menswear AOP target in North region', mitigation: 'Increase menswear depth-per-option by 1 unit to compensate for fewer options. Monitor MC SPSF weekly for 4 weeks post-change — trigger rollback if SPSF drops >5%.' },
        { level: 'low', description: 'Kidswear contraction should be validated against back-to-school demand peak', mitigation: 'Defer KW contraction in stores with >15% KW contribution until after Aug (back-to-school peak). Execute KW reduction only in H9-H3 window.' },
      ],
    },
  },
  {
    keywords: ['convert', '4-way', 'a-rail', 'arail', 'rack', 'mid-zone', 'fixture type'],
    label: 'Convert Fixture Types',
    preview: {
      scope: '89 Grade B stores in West region',
      change: 'Convert 4-Way Rack → A-Rail in mid-zone (avg 4 per store = 356 fixtures)',
      spsfImpact: 'Estimated +8.2% (reduced density improves browsing)',
      capacityImpact: '-15% display capacity (960 → 816 units avg per store)',
      warning: 'Capacity reduction may require stock rebalancing for 23 stores with high density',
    },
    result: {
      title: 'Convert 4-Way → A-Rail — Grade B West',
      description: 'Replace 4-Way Racks with A-Rails in mid-zone for better visual merchandising and browsing experience',
      scope: { storeCount: 89, region: 'West', grade: 'B' },
      fixtureChanges: [{ from: '4-Way Rack', to: 'A-Rail (4ft)', qty: 356, zone: 'Mid-zone', stockStatus: 'partial', availableQty: 210, etaWeeks: 6, nextRACycle: 'RA Jul-26' }],
      networkImpact: {
        currentAvgSpsf: 712, projectedAvgSpsf: 770, spsfDeltaPct: 8.2,
        currentAvgGmrof: 3.2, projectedAvgGmrof: 3.5,
        optionDelta: -1440, investmentLakhs: 18.5, paybackMonths: 4,
      },
      segmentImpact: [
        { segment: 'Menswear Casual', currentSftPct: 22, newSftPct: 22, currentSpsf: 680, projectedSpsf: 735, delta: 55 },
        { segment: 'Women Western Wear', currentSftPct: 15, newSftPct: 15, currentSpsf: 750, projectedSpsf: 812, delta: 62 },
      ],
      affectedStores: [
        { storeId: 'STR-MUM-003', storeName: 'Phoenix Marketcity', city: 'Mumbai', grade: 'B', currentSpsf: 695, projectedSpsf: 762, fixturesChanged: 6, status: 'high-impact' },
        { storeId: 'STR-PUN-002', storeName: 'Seasons Mall', city: 'Pune', grade: 'B', currentSpsf: 670, projectedSpsf: 728, fixturesChanged: 5, status: 'moderate' },
        { storeId: 'STR-AHM-001', storeName: 'Alpha One Mall', city: 'Ahmedabad', grade: 'B', currentSpsf: 648, projectedSpsf: 698, fixturesChanged: 4, status: 'moderate' },
      ],
      risks: [
        { level: 'medium', description: 'Capacity reduction requires stock rebalancing for 23 stores', mitigation: 'Reduce depth-per-option from 8 to 6 for Core bricks. Run DC stock rebalancing before fixture swap to prevent empty rails.' },
        { level: 'low', description: 'A-Rails less suitable for heavy denim — retain 4-Way for specific bricks', mitigation: 'Exclude denim bricks from conversion. Keep 1 4-Way Rack per store for Jeans and Joggers.' },
      ],
    },
  },
  {
    keywords: ['sportswear', 'athleisure', 'activewear', 'sports', 'gym'],
    label: 'Sportswear Push',
    preview: {
      scope: '120 stores with sportswear underperforming AOP',
      change: 'Increase Sportswear from 8% → 14% by reducing WE (-3pp) and MW (-3pp)',
      spsfImpact: 'Estimated +3.8% network SPSF (athleisure trend capture)',
      capacityImpact: '+600 options in Sportswear, -480 in WE, -400 in MW',
    },
    result: {
      title: 'Sportswear Push — Athleisure Trend',
      description: 'Double sportswear allocation to capture growing athleisure demand, sourcing space from WE and MW',
      scope: { storeCount: 120, region: 'All', grade: 'A1+B' },
      fixtureChanges: [
        { from: 'A-Rail (WE)', to: 'A-Rail (Sports)', qty: 360, zone: 'WE Zone → Entry zone', stockStatus: 'needs-ra', availableQty: 0, nextRACycle: 'RA Jul-26' },
        { from: '4-Way Rack (MW)', to: 'Gondola (Sports)', qty: 240, zone: 'MW Zone → Sports zone', stockStatus: 'available', availableQty: 240 },
      ],
      networkImpact: {
        currentAvgSpsf: 712, projectedAvgSpsf: 739, spsfDeltaPct: 3.8,
        currentAvgGmrof: 3.2, projectedAvgGmrof: 3.3,
        optionDelta: -280, investmentLakhs: 32.0, paybackMonths: 8,
      },
      segmentImpact: [
        { segment: 'Sportswear', currentSftPct: 8, newSftPct: 14, currentSpsf: 480, projectedSpsf: 460, delta: -20 },
        { segment: 'Women Indian Wear', currentSftPct: 22, newSftPct: 19, currentSpsf: 680, projectedSpsf: 700, delta: 20 },
        { segment: 'Menswear Formal', currentSftPct: 12, newSftPct: 9, currentSpsf: 610, projectedSpsf: 640, delta: 30 },
      ],
      affectedStores: [
        { storeId: 'STR-BLR-002', storeName: 'Forum Mall', city: 'Bangalore', grade: 'A1', currentSpsf: 710, projectedSpsf: 738, fixturesChanged: 5, status: 'high-impact' },
        { storeId: 'STR-CHE-001', storeName: 'Express Avenue', city: 'Chennai', grade: 'A1', currentSpsf: 738, projectedSpsf: 765, fixturesChanged: 4, status: 'moderate' },
      ],
      risks: [
        { level: 'high', description: 'Sportswear SPSF may dilute initially before brand awareness builds — 2-quarter ramp expected', mitigation: 'Phase rollout: start with 20 high-footfall stores in Q1, measure SPSF lift for 8 weeks, then expand to remaining 100 stores. Set SPSF floor of Rs 420 — rollback if breached.' },
        { level: 'medium', description: 'WE contraction risky during wedding demand peaks (H4-H6, H10-H12)', mitigation: 'Execute WE contraction only in H7-H9 and H1-H3 windows. During wedding hits, temporarily restore WE fixtures using flexible gondola swap.' },
      ],
    },
  },
];

export function matchScenarioTemplate(input: string): ScenarioTemplate | null {
  const lower = input.toLowerCase();
  let bestMatch: ScenarioTemplate | null = null;
  let bestScore = 0;
  for (const t of scenarioTemplates) {
    const score = t.keywords.filter(kw => lower.includes(kw)).length;
    if (score > bestScore) { bestScore = score; bestMatch = t; }
  }
  return bestMatch ?? scenarioTemplates[0] ?? null; // fallback to first template
}

export const abTests: ABTest[] = [
  { id: 'AB-001', scenarioId: 'SC-WE-BOOST', scenarioName: 'WE Space Boost', testStores: 25, controlStores: 25, startDate: '2026-04-15', endDate: '2026-06-15', status: 'active' },
  { id: 'AB-002', scenarioId: 'SC-ACCESSORY-HUB', scenarioName: 'Accessory Hub Expansion', testStores: 15, controlStores: 15, startDate: '2026-03-01', endDate: '2026-04-30', status: 'completed', results: { testSpsf: 785, controlSpsf: 712, lift: 10.2, pValue: 0.003 } },
];

// ── Space Plan Impact Analytics ──

export interface PlanComparisonRow {
  segment: string;
  previousSftPct: number;
  currentSftPct: number;
  deltaSftPct: number;
  previousSpsf: number;
  currentSpsf: number;
  salesImpactLakhs: number;
}

export interface SpsfTrendPoint {
  week: string;
  spsf: number;
  gmrof: number;
  target: number;
}

export const planComparisonData: PlanComparisonRow[] = [
  { segment: 'WE', previousSftPct: 20, currentSftPct: 22, deltaSftPct: 2, previousSpsf: 650, currentSpsf: 680, salesImpactLakhs: 12.4 },
  { segment: 'MC', previousSftPct: 19, currentSftPct: 18, deltaSftPct: -1, previousSpsf: 790, currentSpsf: 820, salesImpactLakhs: 8.2 },
  { segment: 'WW', previousSftPct: 16, currentSftPct: 15, deltaSftPct: -1, previousSpsf: 720, currentSpsf: 750, salesImpactLakhs: 5.8 },
  { segment: 'MW', previousSftPct: 13, currentSftPct: 12, deltaSftPct: -1, previousSpsf: 580, currentSpsf: 610, salesImpactLakhs: 3.1 },
  { segment: 'Kids', previousSftPct: 11, currentSftPct: 10, deltaSftPct: -1, previousSpsf: 510, currentSpsf: 540, salesImpactLakhs: 2.8 },
  { segment: 'Sportswear', previousSftPct: 7, currentSftPct: 8, deltaSftPct: 1, previousSpsf: 450, currentSpsf: 480, salesImpactLakhs: 4.5 },
  { segment: 'Accessories', previousSftPct: 7, currentSftPct: 8, deltaSftPct: 1, previousSpsf: 880, currentSpsf: 920, salesImpactLakhs: 6.7 },
  { segment: 'Footwear', previousSftPct: 7, currentSftPct: 7, deltaSftPct: 0, previousSpsf: 1050, currentSpsf: 1100, salesImpactLakhs: 3.9 },
];

export const spsfTrendData: SpsfTrendPoint[] = [
  { week: 'W1-Jan', spsf: 685, gmrof: 3.0, target: 720 },
  { week: 'W2-Jan', spsf: 690, gmrof: 3.1, target: 720 },
  { week: 'W3-Jan', spsf: 695, gmrof: 3.1, target: 720 },
  { week: 'W4-Jan', spsf: 688, gmrof: 3.0, target: 720 },
  { week: 'W1-Feb', spsf: 700, gmrof: 3.2, target: 720 },
  { week: 'W2-Feb', spsf: 705, gmrof: 3.2, target: 720 },
  { week: 'W3-Feb', spsf: 710, gmrof: 3.3, target: 720 },
  { week: 'W4-Feb', spsf: 698, gmrof: 3.1, target: 720 },
  { week: 'W1-Mar', spsf: 712, gmrof: 3.3, target: 720 },
  { week: 'W2-Mar', spsf: 718, gmrof: 3.4, target: 720 },
  { week: 'W3-Mar', spsf: 725, gmrof: 3.5, target: 720 },
  { week: 'W4-Mar', spsf: 720, gmrof: 3.4, target: 720 },
];

// ── RA ↔ SP Bidirectional Feedback ──

export interface RAFeedback {
  id: string;
  type: 'capacity-gap' | 'excess-capacity' | 'budget-cut';
  segment: string;
  storeCount: number;
  optionGap: number;
  message: string;
  recommendations: string[];
  status: 'pending' | 'acknowledged' | 'resolved';
  createdAt: string;
  severity: 'low' | 'medium' | 'high';
}

export const raFeedbackItems: RAFeedback[] = [
  { id: 'RAF-001', type: 'capacity-gap', segment: 'WE', storeCount: 45, optionGap: -320, message: 'WE segment has 320 fewer option slots than RA planned range requires across 45 Grade A stores. Wedding hit assortment may be incomplete.', recommendations: ['Increase WE wall fixtures by 2 per store', 'Convert 4-Way racks to A-Rails in WE zone for better face-out', 'Consider temporary floor fixtures for peak demand'], status: 'pending', createdAt: '2026-03-28', severity: 'high' },
  { id: 'RAF-002', type: 'excess-capacity', segment: 'MW', storeCount: 120, optionGap: 580, message: 'MW segment has 580 excess option slots across 120 stores. Current stock cover is already high at 14 weeks — excess capacity is holding slow-moving inventory.', recommendations: ['Reduce MW floor fixtures by 1 per store', 'Reallocate freed space to Accessories or WE', 'Accelerate markdown on aged MW inventory'], status: 'acknowledged', createdAt: '2026-03-25', severity: 'medium' },
  { id: 'RAF-003', type: 'capacity-gap', segment: 'Accessories', storeCount: 80, optionGap: -200, message: 'Accessories has highest SPSF (Rs 920) but insufficient display capacity in 80 stores. Each additional fixture slot generates Rs 1,200/sqft.', recommendations: ['Add island tables in decompression zone', 'Install branded endcap fixtures', 'Pilot counter-top displays near checkout'], status: 'pending', createdAt: '2026-04-01', severity: 'high' },
  { id: 'RAF-004', type: 'budget-cut', segment: 'Kids', storeCount: 200, optionGap: -150, message: 'Budget revision reduced Kids fixture allocation by 15%. 150 option slots no longer available. RA must reduce planned range or find alternative display.', recommendations: ['Reduce Kids colorway depth from 5 to 3', 'Use shared fixtures with Sportswear', 'Prioritize top 50 stores for full range'], status: 'resolved', createdAt: '2026-03-15', severity: 'low' },
];

// ── Mid-Hit Tactical Reallocation ──

export interface TacticalReallocation {
  id: string;
  triggerSegment: string;
  triggerType: 'outperforming' | 'underperforming';
  velocity: number;
  stockAvailable: boolean;
  stockSource: 'warehouse' | 'pipeline' | 'needs-manufacturing';
  storeCount: number;
  fixturesSwapped: number;
  status: 'detected' | 'approved' | 'executing' | 'completed' | 'deferred-to-ra';
  isTemporary: boolean;
  approvalLevel: string;
}

export const tacticalReallocations: TacticalReallocation[] = [
  { id: 'TR-001', triggerSegment: 'Women Western', triggerType: 'outperforming', velocity: 2.4, stockAvailable: true, stockSource: 'warehouse', storeCount: 3, fixturesSwapped: 8, status: 'approved', isTemporary: true, approvalLevel: 'Space Planner' },
  { id: 'TR-002', triggerSegment: 'Men Casual', triggerType: 'underperforming', velocity: 0.3, stockAvailable: true, stockSource: 'pipeline', storeCount: 12, fixturesSwapped: 24, status: 'executing', isTemporary: true, approvalLevel: 'Cluster Manager + Space Planner' },
  { id: 'TR-003', triggerSegment: 'Kids Wear', triggerType: 'outperforming', velocity: 3.1, stockAvailable: false, stockSource: 'needs-manufacturing', storeCount: 45, fixturesSwapped: 0, status: 'deferred-to-ra', isTemporary: false, approvalLevel: 'N/A — deferred' },
  { id: 'TR-004', triggerSegment: 'Accessories', triggerType: 'outperforming', velocity: 1.8, stockAvailable: true, stockSource: 'warehouse', storeCount: 8, fixturesSwapped: 16, status: 'completed', isTemporary: true, approvalLevel: 'Space Planner' },
  { id: 'TR-005', triggerSegment: 'Ethnic Wear', triggerType: 'underperforming', velocity: 0.5, stockAvailable: true, stockSource: 'warehouse', storeCount: 65, fixturesSwapped: 130, status: 'detected', isTemporary: true, approvalLevel: 'CEO (>50 stores)' },
];

// ── Planogram Compliance — Fixture-level Scoring ──

export interface FixturePlanogramScore {
  fixtureCode: string;
  fixtureName: string;
  segment: string;
  segmentCode: string;
  // Suggested vs Executed
  suggestedOptions: number;
  executedOptions: number;
  productMatchPct: number;
  // Score dimensions (0-100)
  overallScore: number;
  elevationScore: number;
  facingScore: number;
  adjacencyScore: number;
  // Image scoring (from AI — nullable if not yet scored)
  imageGrade: 'A' | 'B' | 'C' | 'D' | 'E' | null;
  imageScore: number | null;
  // Task status per fixture
  taskStatus: 'completed' | 'in-progress' | 'pending' | 'overdue';
  lastAuditDate: string;
  // Sales impact
  weeklySpsfBefore: number;
  weeklySpsfAfter: number;
  salesLiftPct: number;
}

export interface StorePlanogramReport {
  storeId: string;
  overallScore: number;
  fixturesTotal: number;
  fixturesCompliant: number;
  fixturesAudited: number;
  tasksCompleted: number;
  tasksTotal: number;
  avgImageScore: number | null;
  salesLiftPct: number;
  lastAuditDate: string;
  fixtures: FixturePlanogramScore[];
}

const IMAGE_GRADES: Array<'A' | 'B' | 'C' | 'D' | 'E'> = ['A', 'B', 'C', 'D', 'E'];
const AUDIT_DATES = ['2026-04-12', '2026-04-11', '2026-04-10', '2026-04-09', '2026-04-08', '2026-04-07', '2026-04-05', '2026-04-03', '2026-04-01', '2026-03-28'];

export function getStorePlanogramCompliance(storeId: string): StorePlanogramReport {
  const fixtures = generateStoreFixtures(storeId);
  const seed = parseInt(storeId.replace(/\D/g, ''), 10) || 1;
  const rand = seededRandom(seed * 6173);

  // Store-level bias: some stores are better at compliance than others
  const storeBias = 0.6 + rand() * 0.35; // 0.60 – 0.95

  const scored: FixturePlanogramScore[] = fixtures.slice(0, 18).map(f => {
    const basePct = storeBias * (0.85 + rand() * 0.15);

    // Suggested vs Executed
    const suggestedOptions = f.maxOptions;
    const executedOptions = Math.max(1, Math.round(suggestedOptions * (basePct * 0.9 + rand() * 0.1)));
    const productMatchPct = Math.round(basePct * 100 * (0.9 + rand() * 0.1));

    // Dimension scores — elevation and facing are usually higher than adjacency
    const elevationScore = Math.min(100, Math.round(basePct * 100 + (rand() - 0.3) * 15));
    const facingScore = Math.min(100, Math.round(basePct * 100 + (rand() - 0.4) * 20));
    const adjacencyScore = Math.min(100, Math.round(basePct * 100 * (0.8 + rand() * 0.2)));
    const overallScore = Math.round(elevationScore * 0.35 + facingScore * 0.35 + adjacencyScore * 0.30);

    // Image scoring — 80% of fixtures have been scored
    const hasImage = rand() < 0.80;
    const imgScoreRaw = hasImage ? Math.round(overallScore * (0.9 + rand() * 0.15)) : null;
    const imageScore = imgScoreRaw !== null ? Math.min(100, imgScoreRaw) : null;
    const imageGrade = imageScore !== null
      ? imageScore >= 90 ? IMAGE_GRADES[0]!
        : imageScore >= 75 ? IMAGE_GRADES[1]!
        : imageScore >= 60 ? IMAGE_GRADES[2]!
        : imageScore >= 45 ? IMAGE_GRADES[3]!
        : IMAGE_GRADES[4]!
      : null;

    // Task status — correlated with score
    const taskRoll = rand();
    const taskStatus: FixturePlanogramScore['taskStatus'] =
      overallScore >= 80 ? 'completed'
        : taskRoll < 0.4 ? 'in-progress'
        : taskRoll < 0.7 ? 'pending'
        : 'overdue';

    const lastAuditDate = AUDIT_DATES[Math.floor(rand() * AUDIT_DATES.length)]!;

    // Sales impact — compliant fixtures show positive lift
    const baseSpsfBefore = 350 + rand() * 400;
    const liftMultiplier = overallScore >= 80 ? 1.08 + rand() * 0.14
      : overallScore >= 60 ? 1.01 + rand() * 0.06
      : 0.95 + rand() * 0.05;
    const weeklySpsfBefore = Math.round(baseSpsfBefore);
    const weeklySpsfAfter = Math.round(baseSpsfBefore * liftMultiplier);
    const salesLiftPct = Math.round(((weeklySpsfAfter - weeklySpsfBefore) / weeklySpsfBefore) * 1000) / 10;

    // Segment code lookup
    const segCodeMap: Record<string, string> = {
      "Men's Casual": 'MC', "Men's Formal": 'MF', "Women's Indian Wear": 'WIW',
      "Women's Western Wear": 'WWW', "Kids Wear": 'KW',
    };

    return {
      fixtureCode: f.fixtureCode,
      fixtureName: f.fixtureTypeName,
      segment: f.segment,
      segmentCode: segCodeMap[f.segment] ?? 'MC',
      suggestedOptions,
      executedOptions,
      productMatchPct: Math.min(100, productMatchPct),
      overallScore,
      elevationScore,
      facingScore,
      adjacencyScore,
      imageGrade,
      imageScore,
      taskStatus,
      lastAuditDate,
      weeklySpsfBefore,
      weeklySpsfAfter,
      salesLiftPct,
    };
  });

  const compliant = scored.filter(f => f.overallScore >= 80).length;
  const audited = scored.filter(f => f.imageScore !== null).length;
  const completed = scored.filter(f => f.taskStatus === 'completed').length;
  const imgScores = scored.filter(f => f.imageScore !== null).map(f => f.imageScore!);
  const avgImg = imgScores.length > 0 ? Math.round(imgScores.reduce((a, b) => a + b, 0) / imgScores.length) : null;
  const overallScore = scored.length > 0 ? Math.round(scored.reduce((a, b) => a + b.overallScore, 0) / scored.length) : 0;
  const avgLift = scored.length > 0 ? Math.round(scored.reduce((a, b) => a + b.salesLiftPct, 0) / scored.length * 10) / 10 : 0;
  const latestAudit = scored.map(f => f.lastAuditDate).sort().reverse()[0] ?? '2026-04-01';

  return {
    storeId,
    overallScore,
    fixturesTotal: scored.length,
    fixturesCompliant: compliant,
    fixturesAudited: audited,
    tasksCompleted: completed,
    tasksTotal: scored.length,
    avgImageScore: avgImg,
    salesLiftPct: avgLift,
    lastAuditDate: latestAudit,
    fixtures: scored,
  };
}
