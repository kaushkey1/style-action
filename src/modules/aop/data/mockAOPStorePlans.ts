import type { AOPStorePlan, AOPSegmentPlan } from './mockAOPTypes';
import { CANONICAL_STORES } from '@/data/canonicalStores';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Lookup a canonical store UUID by display name (exact or partial match). */
function storeId(name: string): string {
  const store = CANONICAL_STORES.find((s) => s.name === name);
  if (!store) throw new Error(`canonicalStores: no store named "${name}"`);
  return store.id;
}

function makeSegments(saleableArea: number, spsfTarget: number): AOPSegmentPlan[] {
  // Segment allocation percentages of saleable area
  const segs = [
    { id: 'MC', name: "Men's Casuals", pct: 0.16, spsfMult: 1.0, margin: 53.5, eff: () => 90 + Math.floor(Math.random() * 30) },
    { id: 'MF', name: "Men's Formals", pct: 0.10, spsfMult: 1.15, margin: 54.5, eff: () => 95 + Math.floor(Math.random() * 30) },
    { id: 'WIW', name: "Women's Indian Wear", pct: 0.18, spsfMult: 1.05, margin: 56.2, eff: () => 90 + Math.floor(Math.random() * 25) },
    { id: 'WWW', name: "Women's Western Wear", pct: 0.17, spsfMult: 1.08, margin: 52.2, eff: () => 85 + Math.floor(Math.random() * 30) },
    { id: 'KW', name: 'Kids Wear', pct: 0.14, spsfMult: 0.82, margin: 55.2, eff: () => 75 + Math.floor(Math.random() * 25) },
    { id: 'FW', name: 'Footwear', pct: 0.13, spsfMult: 0.92, margin: 51.0, eff: () => 80 + Math.floor(Math.random() * 25) },
    { id: 'NA', name: 'Non-Apparel', pct: 0.12, spsfMult: 0.72, margin: 48.0, eff: () => 70 + Math.floor(Math.random() * 25) },
  ];

  // Adjust last to ensure sum = saleableArea
  let totalAllocated = 0;
  return segs.map((s, i) => {
    const allocatedSFT = i < segs.length - 1 ? Math.round(saleableArea * s.pct) : saleableArea - totalAllocated;
    totalAllocated += allocatedSFT;
    const segSPSF = Math.round(spsfTarget * s.spsfMult);
    const annualRevenueCr = (allocatedSFT * segSPSF) / 10000000; // actual Cr
    const monthlyRevenue = annualRevenueCr / 12;
    const grossMargin = annualRevenueCr * (s.margin / 100);
    const gmrof = allocatedSFT > 0 ? grossMargin / allocatedSFT * 10000000 : 0;
    const efficiency = s.eff();

    return {
      segmentId: s.id,
      segmentName: s.name,
      allocatedSFT,
      spsfTarget: segSPSF,
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      annualRevenue: Math.round(annualRevenueCr * 100) / 100,
      intakeMargin: s.margin,
      grossMargin: Math.round(grossMargin * 100) / 100,
      gmrof: Math.round(gmrof),
      efficiency,
      fashionSplit: { corePct: 70, fashionPct: 30 },
    };
  });
}

function makeStore(
  id: string, name: string, grade: 'A' | 'A1' | 'A2' | 'A3',
  isF1: boolean, region: string, city: string,
  carpetArea: number, saleableArea: number, spsfTarget: number,
  overrides?: Partial<AOPStorePlan>
): AOPStorePlan {
  const segments = makeSegments(saleableArea, spsfTarget);
  const annualRevenue = segments.reduce((sum, s) => sum + s.annualRevenue, 0);
  const annualGM = segments.reduce((sum, s) => sum + s.grossMargin, 0);
  const blendedIntakeMargin = annualRevenue > 0 ? (annualGM / annualRevenue) * 100 : 0;
  const blendedDeliveredMargin = 42; // target
  const priorYearRevenue = Math.round(annualRevenue * 0.92 * 100) / 100;
  const priorYearGM = Math.round(priorYearRevenue * 0.41 * 100) / 100;
  const priorYearSPSF = Math.round(spsfTarget * 0.92);
  const yoyGrowth = Math.round(((annualRevenue - priorYearRevenue) / priorYearRevenue) * 10000) / 100;
  const totalFixtures = Math.round(saleableArea / 12);
  const garmentCapacity = totalFixtures * 22;
  const weights = [7, 6, 5, 6, 7, 8, 12, 10, 9, 8, 7, 15];
  const monthlyRevenue = weights.map((w) => Math.round(annualRevenue * w) / 100);

  return {
    storeId: id,
    storeName: name,
    storeGrade: grade,
    isF1,
    region,
    city,
    carpetArea,
    saleableArea,
    totalFixtures,
    garmentCapacity,
    spsfTarget,
    annualRevenue: Math.round(annualRevenue * 100) / 100,
    segments,
    blendedIntakeMargin: Math.round(blendedIntakeMargin * 10) / 10,
    blendedDeliveredMargin,
    annualGM: Math.round(annualGM * 100) / 100,
    targetTurns: 6.0,
    targetCoverDays: 33,
    optionCount: grade === 'A' ? 2024 : grade === 'A1' ? 1800 : grade === 'A2' ? 1500 : 1200,
    monthlyWeights: weights,
    monthlyRevenue,
    priorYearRevenue,
    priorYearGM,
    priorYearSPSF,
    yoyGrowth,
    validationStatus: 'valid',
    validationIssues: [],
    ...overrides,
  };
}

// Grade A stores (3) — Premium
const gradeAStores: AOPStorePlan[] = [
  makeStore(storeId('Infinity Mall Malad'), 'Infinity Mall Malad', 'A', true, 'West', 'Mumbai', 10200, 8450, 900, {
    catchmentProfile: 'High Affluence (₹18 L avg HH income)',
    competitorContext: 'H&M (800m), Zara (1.2km), Westside (500m)',
    competitiveGap: 'Under-indexed in Women\'s Western (−12% vs catchment)',
    demandTrend: '+6% footfall QoQ, +4% conversion',
  }),
  makeStore(storeId('Phoenix Marketcity Kurla'), 'Phoenix Marketcity Kurla', 'A', true, 'West', 'Mumbai', 9800, 8100, 920, {
    catchmentProfile: 'Ultra Premium (₹22 L avg HH income)',
    competitorContext: 'Zara (same mall), H&M (same mall), Marks & Spencer (same mall)',
    competitiveGap: 'Strong in Menswear (+8% vs catchment)',
    demandTrend: '+4% footfall QoQ, +6% conversion',
  }),
  makeStore(storeId('Ambience Mall Gurgaon'), 'Ambience Mall Gurgaon', 'A', true, 'North', 'Gurgaon', 9500, 7800, 880, {
    catchmentProfile: 'Premium Corporate (₹20 L avg HH income)',
    competitorContext: 'Zara (same mall), Uniqlo (same mall), Westside (2km)',
    competitiveGap: 'Balanced portfolio, slight edge in Formals',
    demandTrend: '+3% footfall QoQ, +5% conversion',
  }),
];

// Grade A1 stores (5) — High-sales
const gradeA1Stores: AOPStorePlan[] = [
  makeStore(storeId('Phoenix Marketcity Pune'), 'Phoenix Marketcity Pune', 'A1', true, 'West', 'Pune', 7500, 6200, 770, {
    catchmentProfile: 'Upper Middle (₹14 L avg HH income)',
    competitorContext: 'Westside (1km), Shoppers Stop (same mall)',
    demandTrend: '+5% footfall QoQ',
  }),
  makeStore(storeId('Forum Koramangala'), 'Forum Koramangala', 'A1', true, 'South', 'Bangalore', 7200, 5900, 790, {
    catchmentProfile: 'Tech Affluent (₹16 L avg HH income)',
    competitorContext: 'H&M (same mall), Max (2km)',
    demandTrend: '+7% footfall QoQ',
  }),
  makeStore(storeId('Express Avenue Chennai'), 'Express Avenue Chennai', 'A1', false, 'South', 'Chennai', 6800, 5600, 750, {
    catchmentProfile: 'Urban Professional (₹13 L avg HH income)',
    demandTrend: '+3% footfall QoQ',
  }),
  makeStore(storeId('South City Kolkata'), 'South City Kolkata', 'A1', false, 'East', 'Kolkata', 6500, 5400, 760),
  makeStore(storeId('Elante Mall Chandigarh'), 'Elante Mall Chandigarh', 'A1', false, 'North', 'Chandigarh', 6300, 5200, 740),
];

// Grade A2 stores (8) — Mid-tier
const gradeA2Stores: AOPStorePlan[] = [
  makeStore(storeId('City Centre Nashik'), 'City Centre Nashik', 'A2', false, 'West', 'Nashik', 5800, 4800, 560),
  makeStore(storeId('Crystal Mall Rajkot'), 'Crystal Mall Rajkot', 'A2', false, 'West', 'Rajkot', 5500, 4500, 550),
  makeStore(storeId('Treasure Island Indore'), 'Treasure Island Indore', 'A2', false, 'Central', 'Indore', 5600, 4600, 570),
  makeStore(storeId('DB City Bhopal'), 'DB City Bhopal', 'A2', false, 'Central', 'Bhopal', 5400, 4400, 540),
  makeStore(storeId('Sahara Mall Lucknow'), 'Sahara Mall Lucknow', 'A2', false, 'North', 'Lucknow', 5300, 4350, 565),
  makeStore(storeId('Centre Square Kochi'), 'Centre Square Kochi', 'A2', false, 'South', 'Kochi', 5100, 4200, 580),
  makeStore(storeId('GT World Mall Bangalore'), 'GT World Mall Bangalore', 'A2', false, 'South', 'Bangalore', 5700, 4700, 590),
  makeStore(storeId('Pavilion Mall Hyderabad'), 'Pavilion Mall Hyderabad', 'A2', false, 'South', 'Hyderabad', 5200, 4300, 555),
];

// Grade A3 stores (6) — Value, some below floor
const gradeA3Stores: AOPStorePlan[] = [
  makeStore(storeId('City Mall Jalgaon'), 'City Mall Jalgaon', 'A3', false, 'West', 'Jalgaon', 3800, 3100, 380, {
    validationStatus: 'warning',
    validationIssues: [{ rule: 'SPSF Floor', severity: 'warning', message: 'SPSF ₹380 below A3 floor of ₹430', field: 'spsfTarget', currentValue: 380, threshold: 430 }],
  }),
  makeStore(storeId('Main Road Satara'), 'Main Road Satara', 'A3', false, 'West', 'Satara', 3500, 2900, 360, {
    validationStatus: 'warning',
    validationIssues: [{ rule: 'SPSF Floor', severity: 'warning', message: 'SPSF ₹360 below A3 floor of ₹430', field: 'spsfTarget', currentValue: 360, threshold: 430 }],
  }),
  makeStore(storeId('Market Yard Latur'), 'Market Yard Latur', 'A3', false, 'West', 'Latur', 3600, 2950, 430),
  makeStore(storeId('Civil Lines Amravati'), 'Civil Lines Amravati', 'A3', false, 'West', 'Amravati', 3400, 2800, 350, {
    validationStatus: 'warning',
    validationIssues: [{ rule: 'SPSF Floor', severity: 'warning', message: 'SPSF ₹350 below A3 floor of ₹430', field: 'spsfTarget', currentValue: 350, threshold: 430 }],
  }),
  makeStore(storeId('Bus Stand Solapur'), 'Bus Stand Solapur', 'A3', false, 'West', 'Solapur', 3300, 2700, 390, {
    validationStatus: 'warning',
    validationIssues: [{ rule: 'SPSF Floor', severity: 'warning', message: 'SPSF ₹390 below A3 floor of ₹430', field: 'spsfTarget', currentValue: 390, threshold: 430 }],
  }),
  makeStore(storeId('Station Road Aurangabad'), 'Station Road Aurangabad', 'A3', false, 'West', 'Aurangabad', 3200, 2650, 420),
];

// Proposed new stores (3) — for scenario planning only
const proposedStores: AOPStorePlan[] = [
  makeStore(storeId('R-City Ghatkopar'), 'R-City Ghatkopar (Proposed)', 'A1', true, 'West', 'Mumbai', 7000, 5800, 800, {
    validationStatus: 'valid',
  }),
  makeStore(storeId('VR Surat'), 'VR Surat (Proposed)', 'A2', false, 'West', 'Surat', 5000, 4100, 560, {
    validationStatus: 'valid',
  }),
  makeStore(storeId('Lulu Mall Trivandrum'), 'Lulu Mall Trivandrum (Proposed)', 'A2', false, 'South', 'Trivandrum', 5200, 4300, 570, {
    validationStatus: 'valid',
  }),
];

export const mockAOPStorePlans: AOPStorePlan[] = [
  ...gradeAStores,
  ...gradeA1Stores,
  ...gradeA2Stores,
  ...gradeA3Stores,
  ...proposedStores,
];

export function getStoresByGrade(grade: string): AOPStorePlan[] {
  return mockAOPStorePlans.filter((s) => s.storeGrade === grade);
}

export function getStoreById(id: string): AOPStorePlan | undefined {
  return mockAOPStorePlans.find((s) => s.storeId === id);
}
