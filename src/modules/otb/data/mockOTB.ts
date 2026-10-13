import type {
  OTBBudget,
  OTBPodBudget,
  OTBStoreBudget,
  OTBLineItem,
  ChaseRecommendation,
  ChaseHistory,
  MicroDrop,
  MicroDropSignal,
  OTBReallocation,
  VendorConcentration,
  OTBConfig,
  OTBReconciliation,
  SellThroughTriage,
  TestLot,
  FashionOptionLifecycle,
  VendorScorecard,
} from '../types/otb.types';

// ─── Helper: Lakh/Crore values (in Lakhs for consistency) ───────────
// All monetary values stored in Lakhs (1 Cr = 100 Lakhs)
const Cr = 100; // 1 Crore = 100 Lakhs

// ─── Pod UUIDs ───────────────────────────────────────────────────────
export const POD_MW_P1  = 'a1b2c3d4-e5f6-4a1b-b2c3-d4e5f6a7b8c1';
export const POD_MW_P2  = 'b2c3d4e5-f6a7-4b2c-c3d4-e5f6a7b8c9d2';
export const POD_MW_P3  = 'c3d4e5f6-a7b8-4c3d-d4e5-f6a7b8c9d0e3';
export const POD_WIW_P1 = 'd4e5f6a7-b8c9-4d4e-e5f6-a7b8c9d0e1f4';
export const POD_WIW_P2 = 'e5f6a7b8-c9d0-4e5f-f6a7-b8c9d0e1f2a5';
export const POD_WWW_P1 = 'f6a7b8c9-d0e1-4f6a-a7b8-c9d0e1f2a3b6';
export const POD_WWW_P3 = 'a7b8c9d0-e1f2-4a7b-b8c9-d0e1f2a3b4c7';
export const POD_KW_P1  = 'b8c9d0e1-f2a3-4b8c-c9d0-e1f2a3b4c5d8';
export const POD_FW_P1  = 'c9d0e1f2-a3b4-4c9d-d0e1-f2a3b4c5d6e9';
export const POD_NA_P1  = 'd0e1f2a3-b4c5-4d0e-e1f2-a3b4c5d6e7f0';

// ─── Vendor UUIDs ────────────────────────────────────────────────────
const VENDOR_001 = 'e1f2a3b4-c5d6-4e1f-f2a3-b4c5d6e7f8a1';
const VENDOR_002 = 'f2a3b4c5-d6e7-4f2a-a3b4-c5d6e7f8a9b2';
const VENDOR_003 = 'a3b4c5d6-e7f8-4a3b-b4c5-d6e7f8a9b0c3';
const VENDOR_004 = 'b4c5d6e7-f8a9-4b4c-c5d6-e7f8a9b0c1d4';
const VENDOR_005 = 'c5d6e7f8-a9b0-4c5d-d6e7-f8a9b0c1d2e5';

// ─── Chase History UUIDs ─────────────────────────────────────────────
const CHASE_001 = 'd6e7f8a9-b0c1-4d6e-e7f8-a9b0c1d2e3f6';
const CHASE_002 = 'e7f8a9b0-c1d2-4e7f-f8a9-b0c1d2e3f4a7';
const CHASE_003 = 'f8a9b0c1-d2e3-4f8a-a9b0-c1d2e3f4a5b8';
const CHASE_004 = 'a9b0c1d2-e3f4-4a9b-b0c1-d2e3f4a5b6c9';
const CHASE_005 = 'b0c1d2e3-f4a5-4b0c-c1d2-e3f4a5b6c7d0';
const CHASE_006 = 'c1d2e3f4-a5b6-4c1d-d2e3-f4a5b6c7d8e1';
const CHASE_007 = 'd2e3f4a5-b6c7-4d2e-e3f4-a5b6c7d8e9f2';
const CHASE_008 = 'e3f4a5b6-c7d8-4e3f-f4a5-b6c7d8e9f0a3';

// ─── Store definitions (matching canonical 22-store set) ─────────────

const storeDefinitions: Array<{
  id: string;
  name: string;
  grade: 'A' | 'A1' | 'A2' | 'A3';
  city: string;
  aopRevenueLakh: number;
}> = [
  // Grade A (3 stores) — high OTB, high utilization, near capacity
  { id: '7c4b2e6f-893d-4b2a-a7e5-2f8a4d6b0c3e', name: 'Infinity Mall Malad', grade: 'A', city: 'Mumbai', aopRevenueLakh: 912 },
  { id: '7bc9f3a5-6b0e-4c9b-94f2-9a5b1e3c7d0f', name: 'Viviana Thane', grade: 'A', city: 'Thane', aopRevenueLakh: 885 },
  { id: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', name: 'Select Citywalk', grade: 'A', city: 'Delhi', aopRevenueLakh: 948 },
  // Grade A1 (5 stores) — strong OTB, moderate utilization, chase-heavy
  { id: '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a', name: 'Phoenix Marketcity Pune', grade: 'A1', city: 'Pune', aopRevenueLakh: 724 },
  { id: '19e9b3c5-6d0a-4e9d-b4b2-9c5d1a3e7f0b', name: 'Phoenix Palassio Lucknow', grade: 'A1', city: 'Lucknow', aopRevenueLakh: 681 },
  { id: '6ed4a8b0-1c5f-4340-a9a7-4b0c6f8d2e53', name: 'Forum Koramangala', grade: 'A1', city: 'Bangalore', aopRevenueLakh: 712 },
  { id: 'f7c7f1a3-4b8e-4c7b-92f0-7a3b9e1c5d8f', name: 'Elante Mall Chandigarh', grade: 'A1', city: 'Chandigarh', aopRevenueLakh: 658 },
  { id: 'f7a3d7e9-0f4c-4210-b8d6-3e9f5c7a1bec', name: 'Lulu Mall Kochi', grade: 'A1', city: 'Kochi', aopRevenueLakh: 645 },
  // Grade A2 (8 stores) — mid OTB, mixed utilization
  { id: '1fa3d7e9-0f4c-4a3f-b8d6-3e9f5c7a1b4d', name: 'City Centre Nashik', grade: 'A2', city: 'Nashik', aopRevenueLakh: 420 },
  { id: '80d2a6b8-9c3f-4130-a7a5-2b8c4f6d0e75', name: 'Treasure Island Indore', grade: 'A2', city: 'Indore', aopRevenueLakh: 398 },
  { id: '7fe5b9c1-2d6a-4450-b0b8-5c1d7a9e3f64', name: 'GT World Mall Bangalore', grade: 'A2', city: 'Bangalore', aopRevenueLakh: 445 },
  { id: '08b4e8f0-1a5d-4310-89e7-4f0a6d8b2cfd', name: 'Forum Fiza Mangalore', grade: 'A2', city: 'Mangalore', aopRevenueLakh: 375 },
  { id: '4cb2e6f8-9a3d-4120-87e5-2f8a4d6b0c31', name: 'Centre Square Kota', grade: 'A2', city: 'Kota', aopRevenueLakh: 352 },
  { id: '19c5f9a1-2b6e-4410-90f8-5a1b7e9c3d0e', name: 'Coastal City Vizag', grade: 'A2', city: 'Vizag', aopRevenueLakh: 388 },
  { id: '4cf8c2d4-5e9b-4710-a3c1-8d4e0b2f6a31', name: 'South City Kolkata', grade: 'A2', city: 'Kolkata', aopRevenueLakh: 410 },
  { id: '91e3b7c9-0d4a-4240-b8b6-3c9d5a7e1f86', name: 'DB City Bhopal', grade: 'A2', city: 'Bhopal', aopRevenueLakh: 365 },
  // Grade A3 (6 stores) — low OTB, high inventory relative to sales
  { id: '3bc5f9a1-2b6e-4c5b-90f8-5a1b7e9c3d6f', name: 'Mall Road Kolhapur', grade: 'A3', city: 'Kolhapur', aopRevenueLakh: 228 },
  { id: '2ab4e8f0-1a5d-4b4a-89e7-4f0a6d8b2c5e', name: 'Crystal Mall Rajkot', grade: 'A3', city: 'Rajkot', aopRevenueLakh: 215 },
  { id: '4cd6a0b2-3c7f-4d6c-a1a9-6b2c8f0d4e7a', name: 'Fun Republic Nagpur', grade: 'A3', city: 'Nagpur', aopRevenueLakh: 242 },
  { id: 'd5e1b5c7-8d2a-4010-b6b4-1c7d3a5e9fca', name: 'Manjeera Mall Kukatpally', grade: 'A3', city: 'Hyderabad', aopRevenueLakh: 198 },
  { id: '6eb0e4f6-7a1d-4910-85e3-0f6a2d4b8c53', name: 'City Mall Siliguri', grade: 'A3', city: 'Siliguri', aopRevenueLakh: 185 },
  { id: '7fc1f5a7-8b2e-4020-96f4-1a7b3e5c9d64', name: 'Nucleus Mall Ranchi', grade: 'A3', city: 'Ranchi', aopRevenueLakh: 205 },
];

// ─── Generate store-level OTB for a POD ──────────────────────────────

function generateStoresForPod(): OTBStoreBudget[] {
  return storeDefinitions.map((store) => {
    const aopRevenue = store.aopRevenueLakh;
    const aopAtCost = Math.round(aopRevenue / 2.128); // 53% intake margin
    const inventoryOnHand = Math.round(aopAtCost * (store.grade === 'A3' ? 0.22 : store.grade === 'A2' ? 0.16 : store.grade === 'A1' ? 0.14 : 0.12));
    const openPOs = Math.round(aopAtCost * 0.07);
    const safetyStock = Math.round(aopAtCost * 0.06);
    const otbBudget = aopAtCost - inventoryOnHand - openPOs - safetyStock;
    const otbAtRetail = Math.round(otbBudget * 2.128);

    // Utilization varies by grade
    const utilMultiplier = store.grade === 'A' ? 0.78 : store.grade === 'A1' ? 0.72 : store.grade === 'A2' ? 0.65 : 0.58;
    const consumed = Math.round(otbBudget * utilMultiplier);
    const utilization = Math.round((consumed / otbBudget) * 100);

    const garmentCapacity = store.grade === 'A' ? 8500 : store.grade === 'A1' ? 6200 : store.grade === 'A2' ? 4800 : 3200;
    const plannedGarments = Math.round(garmentCapacity * (store.grade === 'A' ? 0.95 : store.grade === 'A1' ? 0.88 : 0.78));
    const capacityUtilization = Math.round((plannedGarments / garmentCapacity) * 100);

    const coverDays = store.grade === 'A' ? (24 + Math.floor(Math.random() * 8)) : store.grade === 'A1' ? (28 + Math.floor(Math.random() * 10)) : store.grade === 'A2' ? (32 + Math.floor(Math.random() * 12)) : (38 + Math.floor(Math.random() * 10));

    return {
      storeId: store.id,
      storeName: store.name,
      storeGrade: store.grade,
      city: store.city,
      aopRevenue,
      aopAtCost,
      inventoryOnHand,
      openPOs,
      safetyStock,
      otbBudget,
      otbAtRetail,
      consumed,
      utilization,
      garmentCapacity,
      plannedGarments,
      capacityUtilization,
      coverDays,
      coverDaysStatus: coverDays < 25 ? 'low' : coverDays > 40 ? 'high' : 'ok',
      categories: [
        { categoryId: 'MC', categoryName: 'Men\'s Casuals', otbBudget: Math.round(otbBudget * 0.18), consumed: Math.round(consumed * 0.19), utilization: Math.round(utilization * 1.05), fashionGrade: { core: 70, fashion: 30 } },
        { categoryId: 'MF', categoryName: 'Men\'s Formals', otbBudget: Math.round(otbBudget * 0.14), consumed: Math.round(consumed * 0.13), utilization: Math.round(utilization * 0.95), fashionGrade: { core: 80, fashion: 20 } },
        { categoryId: 'WIW', categoryName: 'Women\'s Indian Wear', otbBudget: Math.round(otbBudget * 0.22), consumed: Math.round(consumed * 0.23), utilization: Math.round(utilization * 1.02), fashionGrade: { core: 60, fashion: 40 } },
        { categoryId: 'WWW', categoryName: 'Women\'s Western Wear', otbBudget: Math.round(otbBudget * 0.20), consumed: Math.round(consumed * 0.21), utilization: Math.round(utilization * 1.04), fashionGrade: { core: 55, fashion: 45 } },
        { categoryId: 'KW', categoryName: 'Kids Wear', otbBudget: Math.round(otbBudget * 0.12), consumed: Math.round(consumed * 0.11), utilization: Math.round(utilization * 0.92), fashionGrade: { core: 75, fashion: 25 } },
        { categoryId: 'FW', categoryName: 'Footwear', otbBudget: Math.round(otbBudget * 0.09), consumed: Math.round(consumed * 0.08), utilization: Math.round(utilization * 0.88), fashionGrade: { core: 65, fashion: 35 } },
        { categoryId: 'NA', categoryName: 'Non-Apparel', otbBudget: Math.round(otbBudget * 0.05), consumed: Math.round(consumed * 0.05), utilization: Math.round(utilization * 1.0), fashionGrade: { core: 85, fashion: 15 } },
      ],
    };
  });
}

// ─── POD Mock Data ───────────────────────────────────────────────────

const podDefinitions = [
  { id: POD_MW_P1,  name: "Men's Casuals — Shirts", budget: 620 * Cr, consumed: 434 * Cr, vendorConc: 20.6, vendorName: 'Shahi Exports' },
  { id: POD_MW_P2,  name: "Men's Casuals — Trousers", budget: 540 * Cr, consumed: 378 * Cr, vendorConc: 18.2, vendorName: 'Gokaldas Exports' },
  { id: POD_MW_P3,  name: "Men's Casuals — T-Shirts", budget: 480 * Cr, consumed: 513 * Cr, vendorConc: 17.8, vendorName: 'Orient Craft' },
  { id: POD_WIW_P1, name: "Women's Indian Wear — Kurtas", budget: 520 * Cr, consumed: 369 * Cr, vendorConc: 24.1, vendorName: 'Ethnic Creations' },
  { id: POD_WIW_P2, name: "Women's Indian Wear — Sarees", budget: 450 * Cr, consumed: 320 * Cr, vendorConc: 19.5, vendorName: 'Nalli Silks' },
  { id: POD_WWW_P1, name: "Women's Western Wear — Tops", budget: 410 * Cr, consumed: 213 * Cr, vendorConc: 15.2, vendorName: 'Arvind Ltd' },
  { id: POD_WWW_P3, name: "Women's Western Wear — Denims", budget: 410 * Cr, consumed: 250 * Cr, vendorConc: 14.8, vendorName: 'Bombay Rayon' },
  { id: POD_KW_P1,  name: "Kids Wear — Boys", budget: 340 * Cr, consumed: 238 * Cr, vendorConc: 19.3, vendorName: 'Donear Industries' },
  { id: POD_FW_P1,  name: "Footwear — Men's", budget: 290 * Cr, consumed: 226 * Cr, vendorConc: 22.1, vendorName: 'Liberty Shoes' },
  { id: POD_NA_P1,  name: "Non-Apparel — Accessories", budget: 180 * Cr, consumed: 122 * Cr, vendorConc: 16.4, vendorName: 'Hidesign' },
];

export const mockOTBPods: OTBPodBudget[] = podDefinitions.map((pod) => {
  const util = Math.round((pod.consumed / pod.budget) * 100);
  const prebook = Math.round(pod.budget * 0.6);
  const chase = Math.round(pod.budget * 0.3);
  const microdrop = pod.budget - prebook - chase;

  const prebookConsumed = Math.round(prebook * (util > 100 ? 0.96 : 0.88));
  const chaseConsumed = Math.round(chase * (util > 80 ? 0.45 : 0.30));
  const microdropConsumed = pod.consumed - prebookConsumed - chaseConsumed;

  const coreBudget = Math.round(pod.budget * 0.70);
  const fashionBudget = pod.budget - coreBudget;
  const coreConsumed = Math.round(pod.consumed * 0.72);
  const fashionConsumed = pod.consumed - coreConsumed;

  return {
    podId: pod.id,
    podName: pod.name,
    budget: pod.budget,
    consumed: pod.consumed,
    utilization: util,
    maxVendorConcentration: pod.vendorConc,
    maxVendorName: pod.vendorName,
    tiers: [
      { tier: 'pre-book', sharePct: 60, budget: prebook, consumed: prebookConsumed, remaining: prebook - prebookConsumed, status: 'locked' },
      { tier: 'chase', sharePct: 30, budget: chase, consumed: chaseConsumed, remaining: chase - chaseConsumed, status: 'active' },
      { tier: 'micro-drop', sharePct: 10, budget: microdrop, consumed: Math.max(0, microdropConsumed), remaining: microdrop - Math.max(0, microdropConsumed), status: 'held' },
    ],
    fashionGradeSplit: {
      core: { budget: coreBudget, consumed: coreConsumed, sharePct: 70 },
      fashion: { budget: fashionBudget, consumed: fashionConsumed, sharePct: 30 },
    },
    stores: generateStoresForPod(),
  };
});

// ─── Vendor Concentration (for MW Pod 1) ─────────────────────────────

export const mockVendorConcentration: VendorConcentration[] = [
  { vendorId: VENDOR_001, vendorName: 'Shahi Exports', podId: POD_MW_P1, poValue: 89.2 * Cr, sharePct: 20.6, limit: 108.5 * Cr, headroom: 19.3 * Cr, status: 'ok' },
  { vendorId: VENDOR_002, vendorName: 'Gokaldas Exports', podId: POD_MW_P1, poValue: 72.1 * Cr, sharePct: 16.6, limit: 108.5 * Cr, headroom: 36.4 * Cr, status: 'ok' },
  { vendorId: VENDOR_003, vendorName: 'Orient Craft', podId: POD_MW_P1, poValue: 58.4 * Cr, sharePct: 13.5, limit: 108.5 * Cr, headroom: 50.1 * Cr, status: 'ok' },
  { vendorId: VENDOR_004, vendorName: 'Bombay Rayon', podId: POD_MW_P1, poValue: 48.7 * Cr, sharePct: 11.2, limit: 108.5 * Cr, headroom: 59.8 * Cr, status: 'ok' },
  { vendorId: VENDOR_005, vendorName: 'Arvind Ltd', podId: POD_MW_P1, poValue: 42.3 * Cr, sharePct: 9.7, limit: 108.5 * Cr, headroom: 66.2 * Cr, status: 'ok' },
];

// ─── Network OTB Budget ──────────────────────────────────────────────

const totalBudget = 6450 * Cr;
const totalConsumed = 4418 * Cr;

export const mockOTBBudget: OTBBudget = {
  id: 'OTB-FY27-H1',
  fiscalYear: 'FY 2026-27',
  half: 'H1',
  status: 'active',
  approvedScenarioId: 'SCENARIO-MOD-FY27',
  createdAt: '2025-10-15',
  lockedAt: '2026-01-25',

  totalBudget,
  totalConsumed,
  totalRemaining: totalBudget - totalConsumed,
  utilization: Math.round((totalConsumed / totalBudget) * 1000) / 10,

  tiers: [
    { tier: 'pre-book', sharePct: 60, budget: 3870 * Cr, consumed: 3420 * Cr, remaining: 450 * Cr, status: 'locked' },
    { tier: 'chase', sharePct: 30, budget: 1935 * Cr, consumed: 870 * Cr, remaining: 1065 * Cr, status: 'active' },
    { tier: 'micro-drop', sharePct: 10, budget: 645 * Cr, consumed: 128 * Cr, remaining: 517 * Cr, status: 'held' },
  ],

  fashionGradeSplit: {
    core: { budget: 4515 * Cr, consumed: 3180 * Cr },
    fashion: { budget: 1935 * Cr, consumed: 1238 * Cr },
  },

  sourcingEngines: [
    { engine: 'scale-margin', sharePct: 55, budget: 3548 * Cr, consumed: 2680 * Cr, vendorCount: 42, avgLeadTimeDays: 72 },
    { engine: 'fast-response', sharePct: 40, budget: 2580 * Cr, consumed: 1585 * Cr, vendorCount: 68, avgLeadTimeDays: 38 },
    { engine: 'test-repeat', sharePct: 5, budget: 323 * Cr, consumed: 153 * Cr, vendorCount: 24, avgLeadTimeDays: 11 },
  ],

  pods: mockOTBPods,

  guardrailStatus: {
    otbCap: { status: 'warning', networkUtilization: 68.5, breachCount: 1, atRiskCount: 2 },
    vendorConcentration: { status: 'warning', maxConcentration: 22, breachCount: 0, atRiskCount: 1 },
    intakeMargin: { status: 'ok', avgMargin: 54.1, breachCount: 0 },
    fashionSplit: { status: 'ok', avgCorePct: 72, avgFashionPct: 28, breachCount: 0 },
    capacityCeiling: { status: 'warning', avgUtilization: 93, breachCount: 0, atRiskCount: 4 },
  },
};

// ─── Chase Recommendations ───────────────────────────────────────────

// Store ID shortcuts for affected-store arrays
const gradeA = storeDefinitions.filter(s => s.grade === 'A').map(s => s.id);
const gradeA1 = storeDefinitions.filter(s => s.grade === 'A1').map(s => s.id);
const gradeA2 = storeDefinitions.filter(s => s.grade === 'A2').map(s => s.id);
const topStores = [...gradeA, ...gradeA1]; // 8 stores
const allStoreIds = storeDefinitions.map(s => s.id);

export const mockChaseRecommendations: ChaseRecommendation[] = [
  {
    id: 'CR-001', styleId: 'MS1247', styleName: 'Slim Fit Linen Shirt',
    podId: POD_MW_P1, podName: 'Men\'s Casuals — Shirts',
    signal: 'winner', rosMultiple: 3.2, currentQty: 4200, recommendedChaseQty: 4200,
    chasePctIncrease: 100, estimatedAmount: 4.2 * Cr, affectedStoreCount: 15,
    affectedStoreIds: [...gradeA, ...gradeA1, ...gradeA2.slice(0, 7)],
    priority: 'P1', status: 'pending', approvedBy: null, approvedAt: null,
  },
  {
    id: 'CR-002', styleId: 'WI3891', styleName: 'Cotton Kurta Set',
    podId: POD_WIW_P1, podName: 'Women\'s Indian Wear — Kurtas',
    signal: 'winner', rosMultiple: 2.8, currentQty: 5800, recommendedChaseQty: 5800,
    chasePctIncrease: 100, estimatedAmount: 3.8 * Cr, affectedStoreCount: 22,
    affectedStoreIds: allStoreIds,
    priority: 'P1', status: 'pending', approvedBy: null, approvedAt: null,
  },
  {
    id: 'CR-003', styleId: 'MT0892', styleName: 'Stretch Chinos',
    podId: POD_MW_P2, podName: 'Men\'s Casuals — Trousers',
    signal: 'strong', rosMultiple: 1.5, currentQty: 3600, recommendedChaseQty: 1800,
    chasePctIncrease: 50, estimatedAmount: 1.9 * Cr, affectedStoreCount: 8,
    affectedStoreIds: topStores,
    priority: 'P2', status: 'pending', approvedBy: null, approvedAt: null,
  },
  {
    id: 'CR-004', styleId: 'WD2103', styleName: 'A-Line Dress',
    podId: POD_WWW_P1, podName: 'Women\'s Western Wear — Tops',
    signal: 'strong', rosMultiple: 1.3, currentQty: 2400, recommendedChaseQty: 600,
    chasePctIncrease: 25, estimatedAmount: 1.2 * Cr, affectedStoreCount: 12,
    affectedStoreIds: [...gradeA, ...gradeA1, ...gradeA2.slice(0, 4)],
    priority: 'P2', status: 'pending', approvedBy: null, approvedAt: null,
  },
  {
    id: 'CR-005', styleId: 'KB0445', styleName: 'Boys Polo Tee',
    podId: POD_KW_P1, podName: 'Kids Wear — Boys',
    signal: 'stockout', rosMultiple: 1.8, currentQty: 1200, recommendedChaseQty: 2400,
    chasePctIncrease: 200, estimatedAmount: 0.8 * Cr, affectedStoreCount: 6,
    affectedStoreIds: [...gradeA, ...gradeA1.slice(0, 3)],
    priority: 'P1', status: 'pending', approvedBy: null, approvedAt: null,
  },
  {
    id: 'CR-006', styleId: 'MF2201', styleName: 'Slim Fit Blazer',
    podId: POD_MW_P2, podName: 'Men\'s Casuals — Trousers',
    signal: 'strong', rosMultiple: 1.4, currentQty: 1800, recommendedChaseQty: 900,
    chasePctIncrease: 50, estimatedAmount: 2.1 * Cr, affectedStoreCount: 10,
    affectedStoreIds: [...gradeA, ...gradeA1, ...gradeA2.slice(0, 2)],
    priority: 'P2', status: 'pending', approvedBy: null, approvedAt: null,
  },
  {
    id: 'CR-007', styleId: 'WI5502', styleName: 'Anarkali Suit',
    podId: POD_WIW_P1, podName: 'Women\'s Indian Wear — Kurtas',
    signal: 'winner', rosMultiple: 2.1, currentQty: 3200, recommendedChaseQty: 3200,
    chasePctIncrease: 100, estimatedAmount: 2.8 * Cr, affectedStoreCount: 18,
    affectedStoreIds: storeDefinitions.slice(0, 18).map(s => s.id),
    priority: 'P1', status: 'pending', approvedBy: null, approvedAt: null,
  },
  {
    id: 'CR-008', styleId: 'FW1102', styleName: 'Canvas Sneakers',
    podId: POD_FW_P1, podName: 'Footwear — Men\'s',
    signal: 'strong', rosMultiple: 1.6, currentQty: 2800, recommendedChaseQty: 1400,
    chasePctIncrease: 50, estimatedAmount: 1.5 * Cr, affectedStoreCount: 12,
    affectedStoreIds: storeDefinitions.slice(0, 12).map(s => s.id),
    priority: 'P3', status: 'pending', approvedBy: null, approvedAt: null,
  },
];

// ─── Chase History ───────────────────────────────────────────────────

export const mockChaseHistory: ChaseHistory[] = [
  { id: CHASE_001, date: '2026-02-28', styleId: 'MS0891', styleName: 'Classic Oxford Shirt', podId: POD_MW_P1, amount: 3.1 * Cr, storeCount: 18, approvedBy: 'R. Sharma', signal: 'winner' },
  { id: CHASE_002, date: '2026-02-26', styleId: 'WI2201', styleName: 'Palazzo Set', podId: POD_WIW_P2, amount: 2.4 * Cr, storeCount: 14, approvedBy: 'M. Gupta', signal: 'strong' },
  { id: CHASE_003, date: '2026-02-24', styleId: 'MT1201', styleName: 'Cargo Joggers', podId: POD_MW_P2, amount: 1.8 * Cr, storeCount: 10, approvedBy: 'R. Sharma', signal: 'strong' },
  { id: CHASE_004, date: '2026-02-22', styleId: 'WD1801', styleName: 'Floral Maxi Dress', podId: POD_WWW_P1, amount: 2.9 * Cr, storeCount: 20, approvedBy: 'A. Patel', signal: 'winner' },
  { id: CHASE_005, date: '2026-02-20', styleId: 'AUTO', styleName: 'Auto-replenish (multiple)', podId: 'MULTI', amount: 8.2 * Cr, storeCount: 142, approvedBy: 'System (T1)', signal: 'stable' },
  { id: CHASE_006, date: '2026-02-18', styleId: 'KW0312', styleName: 'Girls Party Frock', podId: POD_KW_P1, amount: 1.2 * Cr, storeCount: 8, approvedBy: 'S. Kumar', signal: 'strong' },
  { id: CHASE_007, date: '2026-02-15', styleId: 'MS0445', styleName: 'Mandarin Collar Shirt', podId: POD_MW_P1, amount: 2.6 * Cr, storeCount: 16, approvedBy: 'R. Sharma', signal: 'winner' },
  { id: CHASE_008, date: '2026-02-12', styleId: 'AUTO', styleName: 'Auto-replenish (multiple)', podId: 'MULTI', amount: 6.8 * Cr, storeCount: 128, approvedBy: 'System (T1)', signal: 'stable' },
];

// ─── Micro-Drops ─────────────────────────────────────────────────────

export const mockMicroDrops: MicroDrop[] = [
  {
    id: 'MD-001', name: 'Summer Linen Capsule',
    trigger: 'trend', triggerSource: 'FTF trend signal',
    triggerDescription: 'Linen surging on social + runway — 280% increase in search volume',
    podIds: [POD_MW_P1, POD_WWW_P1], budget: 48 * Cr, consumed: 32 * Cr,
    styleCount: 12, storeCount: 85, storeFilter: 'A + A1 only',
    targetNDay: '2026-03-15', status: 'in-production',
    progressSteps: [
      { step: 'Fabric sourced', status: 'completed', completedAt: '2026-02-18' },
      { step: 'Cutting', status: 'completed', completedAt: '2026-02-22' },
      { step: 'Sewing', status: 'in-progress', completedAt: null },
      { step: 'QC', status: 'pending', completedAt: null },
      { step: 'Ship', status: 'pending', completedAt: null },
    ],
  },
  {
    id: 'MD-002', name: 'Holi Festival Edit',
    trigger: 'festival', triggerSource: 'Festival calendar',
    triggerDescription: 'Holi on Mar 14 — festive capsule targeting North + West regions',
    podIds: [POD_WIW_P1, POD_KW_P1], budget: 32 * Cr, consumed: 8 * Cr,
    styleCount: 8, storeCount: 120, storeFilter: 'North + West regions',
    targetNDay: '2026-03-07', status: 'approved',
    progressSteps: [
      { step: 'Fabric sourced', status: 'completed', completedAt: '2026-02-25' },
      { step: 'Cutting', status: 'in-progress', completedAt: null },
      { step: 'Sewing', status: 'pending', completedAt: null },
      { step: 'QC', status: 'pending', completedAt: null },
      { step: 'Ship', status: 'pending', completedAt: null },
    ],
  },
  {
    id: 'MD-003', name: 'Athleisure Counter-Response',
    trigger: 'competitive', triggerSource: 'Store Intelligence alert',
    triggerDescription: 'H&M launched athleisure capsule in 45 stores — need competitive counter',
    podIds: [POD_MW_P3, POD_WWW_P3], budget: 40 * Cr, consumed: 0,
    styleCount: 10, storeCount: 60, storeFilter: 'A + A1 + A2 (metro)',
    targetNDay: '2026-03-25', status: 'approved',
    progressSteps: [
      { step: 'Fabric sourced', status: 'in-progress', completedAt: null },
      { step: 'Cutting', status: 'pending', completedAt: null },
      { step: 'Sewing', status: 'pending', completedAt: null },
      { step: 'QC', status: 'pending', completedAt: null },
      { step: 'Ship', status: 'pending', completedAt: null },
    ],
  },
];

// ─── Micro-Drop Signals ──────────────────────────────────────────────

export const mockMicroDropSignals: MicroDropSignal[] = [
  {
    id: 'MDS-001', name: 'Crochet tops trending +340%',
    source: 'FTF + Ajio browse data + Social listening',
    relevance: 'high', estimatedBudget: 25 * Cr, estimatedStyles: 6,
    description: 'Crochet and macrame tops showing explosive growth across Instagram, Pinterest, and Ajio browse. 340% increase in search volume week-over-week.',
  },
  {
    id: 'MDS-002', name: 'Competitor gap: H&M athleisure capsule',
    source: 'Store Intelligence competitive alert',
    relevance: 'medium', estimatedBudget: 40 * Cr, estimatedStyles: 10,
    description: 'H&M launched a 15-style athleisure capsule across 45 stores. Our athleisure category has 18% lower option count in overlapping geographies.',
  },
  {
    id: 'MDS-003', name: 'Heat wave forecast (next 2 weeks, West)',
    source: 'Weather model + Store Intelligence',
    relevance: 'low', estimatedBudget: 15 * Cr, estimatedStyles: 4,
    description: 'IMD forecasts temperatures 4-6°C above normal for western India. Opportunity to accelerate summer transition styles in Mumbai, Pune, Ahmedabad.',
  },
];

// ─── Reallocations ───────────────────────────────────────────────────

export const mockReallocations: OTBReallocation[] = [
  {
    id: 'RA-001', type: 'cross-pod',
    fromPodId: POD_WWW_P1, fromPodName: 'Women\'s Western Wear — Tops',
    toPodId: POD_MW_P3, toPodName: 'Men\'s Casuals — T-Shirts',
    amount: 33 * Cr,
    reason: 'Men\'s Casuals — T-Shirts is at 107% utilization — ₹33 Cr over budget. Women\'s Western Wear — Tops is at 52% utilization — ₹197 Cr under-utilized.',
    impact: 'Men\'s Casuals — T-Shirts normalizes to 101%, Women\'s Western Wear — Tops drops to 48%',
    approver: 'Head of Planning',
    priority: 'high', status: 'recommended',
    recommendedBy: 'A11 (OTB Guardian)', approvedBy: null,
  },
  {
    id: 'RA-002', type: 'within-pod',
    fromPodId: POD_WIW_P1, fromPodName: 'Women\'s Indian Wear — Kurtas',
    toPodId: POD_WIW_P1, toPodName: 'Women\'s Indian Wear — Kurtas',
    amount: 12 * Cr,
    reason: 'Vendor "Ethnic Creations" at 24% concentration. Approaching 25% limit with ₹12 Cr in pending POs.',
    impact: 'Redirect next ₹12 Cr to alternate vendors (Soch Apparels, Libas)',
    approver: 'Category Owner',
    priority: 'medium', status: 'recommended',
    recommendedBy: 'A11 (OTB Guardian)', approvedBy: null,
  },
  {
    id: 'RA-003', type: 'cross-tier',
    fromPodId: POD_FW_P1, fromPodName: 'Footwear — Men\'s',
    toPodId: POD_FW_P1, toPodName: 'Footwear — Men\'s',
    amount: 8 * Cr,
    reason: 'Pre-book tier 92% consumed with strong sell-through. Chase budget at 45% — move unused pre-book to chase for winner styles.',
    impact: 'Chase budget increases from ₹87 Cr to ₹95 Cr, enabling 2 additional chase runs',
    approver: 'Category Owner',
    priority: 'low', status: 'recommended',
    recommendedBy: 'A11 (OTB Guardian)', approvedBy: null,
  },
  {
    id: 'RA-004', type: 'cross-pod',
    fromPodId: POD_NA_P1, fromPodName: 'Non-Apparel — Accessories',
    toPodId: POD_KW_P1, toPodName: 'Kids Wear — Boys',
    amount: 15 * Cr,
    reason: 'Kids Wear chase budget nearly depleted due to strong back-to-school demand. Non-Apparel at 68% utilization with seasonal slowdown.',
    impact: 'Kids Wear chase budget replenished, Non-Apparel utilization drops to 60%',
    approver: 'Head of Planning',
    priority: 'medium', status: 'approved',
    recommendedBy: 'A11 (OTB Guardian)', approvedBy: 'V. Mehta (HoP)',
  },
];

// ─── Utilization Heatmap data ────────────────────────────────────────

export const mockUtilizationHeatmap = podDefinitions.map(pod => ({
  podId: pod.id,
  podName: pod.name,
  monthly: [
    { month: 'Apr', util: Math.round((pod.consumed / pod.budget) * 100 * 0.17) },
    { month: 'May', util: Math.round((pod.consumed / pod.budget) * 100 * 0.36) },
    { month: 'Jun', util: Math.round((pod.consumed / pod.budget) * 100 * 0.54) },
    { month: 'Jul', util: Math.round((pod.consumed / pod.budget) * 100 * 0.72) },
    { month: 'Aug', util: Math.round((pod.consumed / pod.budget) * 100 * 0.88) },
    { month: 'Sep', util: Math.round((pod.consumed / pod.budget) * 100) },
  ],
}));

// ─── Admin Configuration ─────────────────────────────────────────────

export const mockOTBConfig: OTBConfig = {
  budgetStructure: {
    preBookShare: 60,
    chaseShare: 30,
    microDropReserve: 10,
    corePreBookChase: [60, 40],
    fashionPreBookChase: [40, 60],
  },
  sourcingEngines: {
    scaleMarginShare: 55,
    fastResponseShare: 40,
    testRepeatShare: 5,
  },
  guardrails: {
    otbCap: 105,
    vendorConcentrationLimit: 25,
    intakeMarginFloor: 53,
    pricingFloorMultiplier: 1.30,
    chaseAutoReallocationLimit: 10,
  },
  utilization: {
    greenFloor: 85,
    greenCeiling: 105,
    amberFloor: 70,
    amberCeiling: 110,
    exceptionSeverityUnder: 'S3',
    exceptionSeverityOver: 'S1',
  },
  chaseTriggers: {
    winnerRosThreshold: 2.0,
    strongRosThreshold: 1.2,
    stockoutCoverDayThreshold: 10,
    chaseWindowStart: 14,
    chaseWindowEnd: 45,
  },
  vendorManagement: {
    consolidationTarget: 55,
    top20ShareTarget: 80,
    exitThreshold: 80,
    scorecardFrequency: 'monthly' as const,
    newVendorOnboardingGate: true,
  },
  fabricRationalization: {
    activeFabricTarget: 200,
    newFabricApprovalGate: true,
    volumeThresholdForRetention: 0.2,
    top50FabricTargetShare: 80,
  },
  buyingDiscipline: {
    defaultTestLotSize: 1000,
    testStoreCount: 8,
    day7RedFlagThreshold: 25,
    day14WinnerThreshold: 100,
    day14LoserThreshold: 50,
    sizeRatioTolerance: 15,
    coverBreachCore: 30,
    coverBreachFashion: 45,
    largeLotUnprovenBlock: 5000,
    fashionHardStop: 180,
  },
  reconciliation: {
    varianceTolerance: 5,
    autoCloseThreshold: 2,
    reconciliationFrequency: 'weekly' as const,
    includeTierBreakdown: true,
  },
  marginBridge: {
    intakeMarginTarget: 55,
    promoDiscountCap: 15,
    markdownBudget: 8,
    logisticsCostCap: 4,
    netGMFloor: 28,
  },
  sellThroughRules: {
    day7WinnerThreshold: 12,
    day7LoserThreshold: 4,
    day14WinnerST: 25,
    day14LoserST: 8,
    autoMarkdownTriggerDays: 45,
    carryoverThreshold: 30,
  },
  planningSetup: {
    fiscalYearStart: 4,
    currentFiscalYear: '2026-27',
    planningFrequency: 'monthly' as const,
    calculationFrequency: ['Monthly', 'Weekly'],
    baseMarginPct: 40,
    targetWeeksOfCover: 1,
    storeFormatsInScope: [14, 42, 43, 49],
    segmentsInScope: [42, 55, 56, 80],
    aggregationLevels: ['sub_format_code', 'BRAND_ID', 'MH_SEGMENT_CD', 'FASHION_GRADE', 'MH_FAMILY_CD'],
    executionMode: 'fresh' as const,
    inventoryAgeFilterEnabled: false,
    inventoryAgeMaxDays: 60,
    excludeKpis: ['Net_Sales__Change_Over_LY', 'Unit_Sales__Achievement_against_AOP'],
    nonNegativeKpis: [],
    netSalesMinThreshold: 148,
    hitNamesByFrequency: {
      '1': 'H2', '2': 'H3', '3': 'H4', '4': 'H5', '5': 'H6', '6': '07',
      '7': '08', '8': '09', '9': '10', '10': '11', '11': '12', '12': 'H1',
    },
  },
  calculatorEngine: {
    kpiFormulae: [
      { kpiName: 'Net_Sales__CY_Net_Sales', formula: 'CY_Net_Sales if pd.notna(CY_Net_Sales) and CY_Net_Sales > 0 else AOP_Net_Sales if AOP_Net_Sales > 0 else 0', category: 'Net Revenue', evaluationOrder: 1, isActive: true, description: 'Current year net revenue with AOP fallback' },
      { kpiName: 'Net_Sales__LY_Net_Sales', formula: 'Past_Net_Sales if pd.notna(Past_Net_Sales) else 0', category: 'Net Revenue', evaluationOrder: 2, isActive: true, description: 'Last year net revenue from AOP breakdown' },
      { kpiName: 'Net_Sales__AOP_Net_Sales', formula: 'AOP_Net_Sales if pd.notna(AOP_Net_Sales) else 0', category: 'Net Revenue', evaluationOrder: 3, isActive: true, description: 'AOP net revenue target from breakdown' },
      { kpiName: 'Net_Sales__Change_over_LY', formula: '(((Net_Sales__CY_Net_Sales / Net_Sales__LY_Net_Sales) - 1) * 100) if Net_Sales__LY_Net_Sales > 0 else 0', category: 'Net Revenue', evaluationOrder: 4, isActive: true, description: 'Percentage change year-over-year' },
      { kpiName: 'Net_Sales__Achievement_against_AOP', formula: '((Net_Sales__CY_Net_Sales / Net_Sales__AOP_Net_Sales) * 100) if Net_Sales__AOP_Net_Sales > 0 else 0', category: 'Net Revenue', evaluationOrder: 5, isActive: true, description: 'Achievement vs AOP target' },
      { kpiName: 'Actual_Selling_Price__CY_Actual_Selling_Price', formula: '(CY_Net_Sales / CY_Billing_Qty if CY_Billing_Qty > 0 and CY_Net_Sales > 0 else (AOP_Net_Sales / Predicted_Qty if Predicted_Qty > 0 and AOP_Net_Sales > 0 else (Past_Net_Sales / Past_Billing_Qty if Past_Billing_Qty > 0 and Past_Net_Sales > 0 else (CY_Average_MRP if CY_Average_MRP > 0 else 0))))', category: 'Pricing', evaluationOrder: 6, isActive: true, description: 'Cascading ASP with multiple fallbacks' },
      { kpiName: 'Actual_Selling_Price__LY_Actual_Selling_Price', formula: '(Past_Net_Sales / Past_Billing_Qty) if pd.notna(Past_Net_Sales) and pd.notna(Past_Billing_Qty) and Past_Billing_Qty > 0 else 0', category: 'Pricing', evaluationOrder: 7, isActive: true, description: 'Last year actual selling price' },
      { kpiName: 'Unit_Sales__CY_Unit_Sales', formula: 'CY_Billing_Qty if CY_Billing_Qty > 0 else (Net_Sales__CY_Net_Sales / Actual_Selling_Price__CY_Actual_Selling_Price) if Net_Sales__CY_Net_Sales > 0 and Actual_Selling_Price__CY_Actual_Selling_Price > 0 else 0', category: 'Unit Sales', evaluationOrder: 8, isActive: true, description: 'Current year unit sales' },
      { kpiName: 'Unit_Sales__LY_Unit_Sales', formula: 'Past_Billing_Qty if pd.notna(Past_Billing_Qty) else 0', category: 'Unit Sales', evaluationOrder: 9, isActive: true, description: 'Last year unit sales from AOP breakdown' },
      { kpiName: 'Unit_Sales__AOP_Unit_Sales', formula: '(Net_Sales__AOP_Net_Sales / Actual_Selling_Price__CY_Actual_Selling_Price) if Net_Sales__AOP_Net_Sales > 0 and Actual_Selling_Price__CY_Actual_Selling_Price > 0 else 0', category: 'Unit Sales', evaluationOrder: 10, isActive: true, description: 'AOP value target converted to units' },
      { kpiName: 'Unit_Sales__Change_over_LY', formula: '(((Unit_Sales__CY_Unit_Sales / Unit_Sales__LY_Unit_Sales) - 1) * 100) if Unit_Sales__LY_Unit_Sales > 0 else 0', category: 'Unit Sales', evaluationOrder: 11, isActive: true, description: 'Unit sales YoY change' },
      { kpiName: 'Unit_Sales__Achievement_against_AOP', formula: '((Unit_Sales__CY_Unit_Sales / Unit_Sales__AOP_Unit_Sales) * 100) if Unit_Sales__AOP_Unit_Sales > 0 else 0', category: 'Unit Sales', evaluationOrder: 12, isActive: true, description: 'Unit sales achievement vs AOP' },
      { kpiName: 'Discount__CY_Average_Discount', formula: '((CY_Average_Discount/CY_Average_MRP) * 100) if pd.notna(CY_Average_Discount) and CY_Average_MRP > 0 else 0', category: 'Discount', evaluationOrder: 13, isActive: true, description: 'Current year average discount percentage' },
      { kpiName: 'Discount__LY_Average_Discount', formula: '((Past_Average_Discount/Past_Average_MRP) * 100) if pd.notna(Past_Average_Discount) and Past_Average_MRP > 0 else 0', category: 'Discount', evaluationOrder: 14, isActive: true, description: 'Last year average discount percentage' },
      { kpiName: 'Inventory_Units__Closing_Stock', formula: "ROUND(Closing_Stock_Qty) if Closing_Stock_Qty > 0 else (prev_otb['Inventory_Units__Closing_Stock'] + prev_otb['Inwards__Planned_Inwards'] - (prev_otb['Unit_Sales__CY_Unit_Sales'] if prev_otb['Unit_Sales__CY_Unit_Sales'] > 0 and is_start_of_month else prev_otb['Predicted_Qty']) if prev_otb else 0)", category: 'Inventory', evaluationOrder: 15, isActive: true, description: 'Closing stock with carry-forward from previous period' },
      { kpiName: 'Inventory_Units__Target_Inventory', formula: 'ROUND(Target_Inventory) if Target_Inventory > 0 else 0', category: 'Inventory', evaluationOrder: 16, isActive: true, description: 'Target inventory from AOP breakdown' },
      { kpiName: 'Inwards__Planned_Inwards', formula: 'ROUND(Inward_Qty) if pd.notna(Inward_Qty) and Inward_Qty > 0 else 0', category: 'Inwards', evaluationOrder: 17, isActive: true, description: 'PO inward receipt quantities' },
      { kpiName: 'Inwards__Additional_Inwards', formula: '0', category: 'Inwards', evaluationOrder: 18, isActive: true, description: 'Additional inward receipts (manual override)' },
      { kpiName: 'Inventory_Units__Opening_Stock', formula: 'ROUND(Inventory_Units__Closing_Stock + Inwards__Planned_Inwards + Inwards__Additional_Inwards)', category: 'Inventory', evaluationOrder: 19, isActive: true, description: 'Opening stock: closing stock + all inwards' },
      { kpiName: 'Inventory_Units__LY_Inventory', formula: 'ROUND(Past_Inventory) if pd.notna(Past_Inventory) else 0', category: 'Inventory', evaluationOrder: 20, isActive: true, description: 'Last year inventory from AOP breakdown' },
      { kpiName: 'Inventory_Units__Change_over_LY', formula: '(Inventory_Units__Opening_Stock / Inventory_Units__LY_Inventory - 1) * 100 if Inventory_Units__LY_Inventory > 0 else 0', category: 'Inventory', evaluationOrder: 21, isActive: true, description: 'Inventory YoY change' },
      { kpiName: 'Weeks_of_Cover__Actual_Cover', formula: 'ROUND(Inventory_Units__Opening_Stock / (Unit_Sales__CY_Unit_Sales if Unit_Sales__CY_Unit_Sales > 0 else Predicted_Qty if Predicted_Qty > 0 else 1)) if (Unit_Sales__CY_Unit_Sales > 0 or Predicted_Qty > 0) else 0', category: 'Weeks of Cover', evaluationOrder: 22, isActive: true, description: 'Periods of demand covered by current stock' },
      { kpiName: 'Weeks_of_Cover__Target_Cover', formula: '1', category: 'Weeks of Cover', evaluationOrder: 23, isActive: true, description: 'Configurable target cover (currently 1)' },
      { kpiName: 'Weeks_of_Cover__LY', formula: 'ROUND(Inventory_Units__LY_Inventory / Unit_Sales__LY_Unit_Sales) if Unit_Sales__LY_Unit_Sales > 0 else 0', category: 'Weeks of Cover', evaluationOrder: 24, isActive: true, description: 'Last year weeks of cover' },
      { kpiName: 'Weeks_of_Cover__Cover_Variance', formula: 'Weeks_of_Cover__Actual_Cover - Weeks_of_Cover__Target_Cover', category: 'Weeks of Cover', evaluationOrder: 25, isActive: true, description: 'Positive = overstocked' },
      { kpiName: 'Inwards__OTB', formula: 'MAX([0, ROUND(Inventory_Units__Target_Inventory - CY_Billing_Qty - Inventory_Units__Opening_Stock)])', category: 'OTB', evaluationOrder: 26, isActive: true, description: 'Open-to-Buy units: target minus sold minus on-hand' },
      { kpiName: 'Margin__Margin', formula: '40', category: 'Margin', evaluationOrder: 27, isActive: true, description: 'Configurable margin percentage (currently 40%)' },
      { kpiName: 'COGS__CY_COGS', formula: 'Actual_Selling_Price__CY_Actual_Selling_Price * (1 - Margin__Margin/100) if pd.notna(Actual_Selling_Price__CY_Actual_Selling_Price) else 0', category: 'COGS', evaluationOrder: 28, isActive: true, description: 'Cost per unit at current margin' },
      { kpiName: 'COGS__LY_COGS', formula: 'Past_Cost if pd.notna(Past_Cost) else 0', category: 'COGS', evaluationOrder: 29, isActive: true, description: 'Last year cost of goods sold' },
      { kpiName: 'OTB__OTB_Value', formula: 'Inwards__OTB * COGS__CY_COGS', category: 'OTB', evaluationOrder: 30, isActive: true, description: 'OTB units converted to monetary value' },
      { kpiName: 'OTB__Recommended_Value', formula: 'MAX([0, ROUND(Target_Inventory_Forecast - Predicted_Qty - Inventory_Units__Opening_Stock) * COGS__CY_COGS])', category: 'OTB', evaluationOrder: 31, isActive: true, description: 'ML-enhanced recommendation based on forecasts' },
      { kpiName: 'OTB__Purchase_Value', formula: 'OTB__Recommended_Value', category: 'OTB', evaluationOrder: 32, isActive: true, description: 'Purchase value (defaults to recommended value)' },
      { kpiName: 'Inventory_COGS__Opening_Inventory_COGS', formula: 'Inventory_Units__Opening_Stock * COGS__CY_COGS if pd.notna(Inventory_Units__Opening_Stock) and pd.notna(COGS__CY_COGS) else 0', category: 'Inventory COGS', evaluationOrder: 33, isActive: true, description: 'Total inventory at cost' },
      { kpiName: 'Inventory_COGS__LY_Inventory_COGS', formula: '(Inventory_Units__LY_Inventory * (Past_Cost / Past_Inventory)) if Past_Cost > 0 and Past_Inventory > 0 else 0', category: 'Inventory COGS', evaluationOrder: 34, isActive: true, description: 'Last year inventory at cost' },
      { kpiName: 'Inventory_COGS__Change_over_LY', formula: '(Inventory_COGS__Opening_Inventory_COGS / Inventory_COGS__LY_Inventory_COGS - 1) * 100 if Inventory_COGS__LY_Inventory_COGS > 0 else 0', category: 'Inventory COGS', evaluationOrder: 35, isActive: true, description: 'YoY change in inventory value' },
    ],
    dataSources: [
      { sourceName: 'AOP Targets', backend: 'bigquery', tableName: 'impetus_planning.aop', description: 'Annual Operating Plan net sales targets by hierarchy', mergeColumns: ['sub_format_code', 'BRAND_ID', 'MH_SEGMENT_CD', 'FASHION_GRADE', 'MH_FAMILY_CD'], isActive: true },
      { sourceName: 'AOP Breakdown', backend: 'bigquery', tableName: 'impetus_planning.aop_breakdown', description: 'Pre-computed breakdown at aggregation grain with LY actuals', mergeColumns: ['sub_format_code', 'BRAND_ID', 'MH_SEGMENT_CD', 'FASHION_GRADE', 'MH_FAMILY_CD', 'Month', 'Year'], isActive: true },
      { sourceName: 'Sales', backend: 'bigquery', tableName: 'impetus_prod_buyplan_integrations.sales', description: 'Historical and current-year billing quantities and net sales', mergeColumns: ['sub_format_code', 'BRAND_ID', 'MH_SEGMENT_CD', 'FASHION_GRADE', 'MH_FAMILY_CD', 'Month', 'Year'], isActive: true },
      { sourceName: 'Stock', backend: 'bigquery', tableName: 'impetus_prod_buyplan_integrations.Stock', description: 'Current and historical closing stock positions', mergeColumns: ['sub_format_code', 'BRAND_ID', 'MH_SEGMENT_CD', 'FASHION_GRADE', 'MH_FAMILY_CD', 'Month', 'Year'], isActive: true },
      { sourceName: 'Inwards', backend: 'bigquery', tableName: 'impetus_prod_buyplan_integrations.INWARD', description: 'Purchase order inward receipts by hierarchy', mergeColumns: ['sub_format_code', 'BRAND_ID', 'MH_SEGMENT_CD', 'FASHION_GRADE', 'MH_FAMILY_CD', 'Month', 'Year'], isActive: true },
      { sourceName: 'ML Forecasts', backend: 'postgresql', tableName: 'forecast_results.brand_monthly_forecasts', description: 'ML demand forecasts at brand-month level', mergeColumns: ['BRAND_ID', 'Month', 'Year'], isActive: true },
      { sourceName: 'Catalog', backend: 'bigquery', tableName: 'impetus_prod_buyplan_integrations.CATALOG', description: 'Product hierarchy mappings and descriptions', mergeColumns: [], isActive: true },
      { sourceName: 'Store Master', backend: 'bigquery', tableName: 'analytics_masterhub.public_site', description: 'Store metadata and sub-format classification', mergeColumns: [], isActive: true },
      { sourceName: 'OTB Plans', backend: 'bigquery', tableName: 'impetus_otb_planning.otb_plans', description: 'OTB plan definitions and status tracking', mergeColumns: [], isActive: true },
      { sourceName: 'KPI Groups', backend: 'bigquery', tableName: 'impetus_otb_planning.kpi_groups', description: 'KPI category grouping definitions', mergeColumns: [], isActive: true },
      { sourceName: 'KPIs', backend: 'bigquery', tableName: 'impetus_otb_planning.kpis', description: 'KPI metadata and formula definitions', mergeColumns: [], isActive: true },
      { sourceName: 'Org KPI Mappings', backend: 'bigquery', tableName: 'impetus_otb_planning.org_kpi_mappings', description: 'Organization-level KPI configuration mappings', mergeColumns: [], isActive: true },
      { sourceName: 'OTB KPI Values', backend: 'bigquery', tableName: 'impetus_otb_planning.otb_kpi_values', description: 'Computed KPI values per OTB plan and time period', mergeColumns: [], isActive: true },
      { sourceName: 'Organizations', backend: 'bigquery', tableName: 'impetus_prod_buyplan_integrations.organizations', description: 'Organization master data and tenant configuration', mergeColumns: [], isActive: true },
      { sourceName: 'PG Mappings', backend: 'bigquery', tableName: 'impetus_planning.purchase_group_mappings', description: 'Purchase group to hierarchy mapping definitions', mergeColumns: [], isActive: true },
    ],
  },
};

// ─── Weekly Reconciliations (v2.0) ──────────────────────────────

export const mockReconciliations: OTBReconciliation[] = [
  // Week ending 2026-02-07 — MW Shirts
  {
    id: 'recon-w1-mc',
    weekEnding: '2026-02-07',
    podId: POD_MW_P1,
    categoryId: 'MC',
    openingStock: 4820,
    inwardReceipts: 1200,
    sales: 1580,
    closingStock: 4440,
    otbBudget: 62000,
    cumulativePOsIssued: 43400,
    otbRemaining: 18600,
    consumptionPace: 'on-track',
    marginBridge: {
      intakeMargin: 54.2,
      promoDiscount: 2.1,
      markdownImpact: 3.4,
      logisticsCost: 1.8,
      netGrossMargin: 46.9,
      targetNetGM: 42.0,
      variance: 4.9,
    },
  },
  // Week ending 2026-02-07 — WIW Kurtas
  {
    id: 'recon-w1-wiw',
    weekEnding: '2026-02-07',
    podId: POD_WIW_P1,
    categoryId: 'WIW',
    openingStock: 5300,
    inwardReceipts: 1050,
    sales: 1250,
    closingStock: 5100,
    otbBudget: 52000,
    cumulativePOsIssued: 35820,
    otbRemaining: 16180,
    consumptionPace: 'on-track',
    marginBridge: {
      intakeMargin: 55.5,
      promoDiscount: 1.6,
      markdownImpact: 2.5,
      logisticsCost: 1.7,
      netGrossMargin: 49.7,
      targetNetGM: 42.0,
      variance: 7.7,
    },
  },
  // Week ending 2026-02-07 — WWW Tops
  {
    id: 'recon-w1-www',
    weekEnding: '2026-02-07',
    podId: POD_WWW_P1,
    categoryId: 'WWW',
    openingStock: 3400,
    inwardReceipts: 700,
    sales: 900,
    closingStock: 3200,
    otbBudget: 41000,
    cumulativePOsIssued: 24160,
    otbRemaining: 16840,
    consumptionPace: 'behind',
    marginBridge: {
      intakeMargin: 53.0,
      promoDiscount: 2.2,
      markdownImpact: 3.8,
      logisticsCost: 2.0,
      netGrossMargin: 45.0,
      targetNetGM: 42.0,
      variance: 3.0,
    },
  },
  // Week ending 2026-02-14
  {
    id: 'recon-w2-mc',
    weekEnding: '2026-02-14',
    podId: POD_MW_P1,
    categoryId: 'MC',
    openingStock: 4440,
    inwardReceipts: 980,
    sales: 1620,
    closingStock: 3800,
    otbBudget: 62000,
    cumulativePOsIssued: 44380,
    otbRemaining: 17620,
    consumptionPace: 'on-track',
    marginBridge: {
      intakeMargin: 53.8,
      promoDiscount: 2.3,
      markdownImpact: 3.6,
      logisticsCost: 1.9,
      netGrossMargin: 46.0,
      targetNetGM: 42.0,
      variance: 4.0,
    },
  },
  {
    id: 'recon-w2-wiw',
    weekEnding: '2026-02-14',
    podId: POD_WIW_P1,
    categoryId: 'WIW',
    openingStock: 5100,
    inwardReceipts: 1100,
    sales: 1450,
    closingStock: 4750,
    otbBudget: 52000,
    cumulativePOsIssued: 36920,
    otbRemaining: 15080,
    consumptionPace: 'on-track',
    marginBridge: {
      intakeMargin: 55.1,
      promoDiscount: 1.8,
      markdownImpact: 2.9,
      logisticsCost: 1.7,
      netGrossMargin: 48.7,
      targetNetGM: 42.0,
      variance: 6.7,
    },
  },
  {
    id: 'recon-w2-www',
    weekEnding: '2026-02-14',
    podId: POD_WWW_P1,
    categoryId: 'WWW',
    openingStock: 3200,
    inwardReceipts: 850,
    sales: 920,
    closingStock: 3130,
    otbBudget: 41000,
    cumulativePOsIssued: 25010,
    otbRemaining: 15990,
    consumptionPace: 'behind',
    marginBridge: {
      intakeMargin: 52.8,
      promoDiscount: 2.5,
      markdownImpact: 4.2,
      logisticsCost: 2.0,
      netGrossMargin: 44.1,
      targetNetGM: 42.0,
      variance: 2.1,
    },
  },
  // Week ending 2026-02-21
  {
    id: 'recon-w3-mc',
    weekEnding: '2026-02-21',
    podId: POD_MW_P1,
    categoryId: 'MC',
    openingStock: 3800,
    inwardReceipts: 1500,
    sales: 1710,
    closingStock: 3590,
    otbBudget: 62000,
    cumulativePOsIssued: 45880,
    otbRemaining: 16120,
    consumptionPace: 'on-track',
    marginBridge: {
      intakeMargin: 54.0,
      promoDiscount: 2.0,
      markdownImpact: 3.2,
      logisticsCost: 1.8,
      netGrossMargin: 47.0,
      targetNetGM: 42.0,
      variance: 5.0,
    },
  },
  {
    id: 'recon-w3-wiw',
    weekEnding: '2026-02-21',
    podId: POD_WIW_P1,
    categoryId: 'WIW',
    openingStock: 4750,
    inwardReceipts: 1300,
    sales: 1580,
    closingStock: 4470,
    otbBudget: 52000,
    cumulativePOsIssued: 38220,
    otbRemaining: 13780,
    consumptionPace: 'on-track',
    marginBridge: {
      intakeMargin: 54.8,
      promoDiscount: 1.9,
      markdownImpact: 3.1,
      logisticsCost: 1.7,
      netGrossMargin: 48.1,
      targetNetGM: 42.0,
      variance: 6.1,
    },
  },
  {
    id: 'recon-w3-www',
    weekEnding: '2026-02-21',
    podId: POD_WWW_P1,
    categoryId: 'WWW',
    openingStock: 3130,
    inwardReceipts: 600,
    sales: 780,
    closingStock: 2950,
    otbBudget: 41000,
    cumulativePOsIssued: 25610,
    otbRemaining: 15390,
    consumptionPace: 'behind',
    marginBridge: {
      intakeMargin: 52.5,
      promoDiscount: 2.8,
      markdownImpact: 4.5,
      logisticsCost: 2.1,
      netGrossMargin: 43.1,
      targetNetGM: 42.0,
      variance: 1.1,
    },
  },
  // Week ending 2026-02-28
  {
    id: 'recon-w4-mc',
    weekEnding: '2026-02-28',
    podId: POD_MW_P1,
    categoryId: 'MC',
    openingStock: 3590,
    inwardReceipts: 1800,
    sales: 1850,
    closingStock: 3540,
    otbBudget: 62000,
    cumulativePOsIssued: 47680,
    otbRemaining: 14320,
    consumptionPace: 'ahead',
    marginBridge: {
      intakeMargin: 53.5,
      promoDiscount: 2.4,
      markdownImpact: 3.8,
      logisticsCost: 1.9,
      netGrossMargin: 45.4,
      targetNetGM: 42.0,
      variance: 3.4,
    },
  },
  {
    id: 'recon-w4-wiw',
    weekEnding: '2026-02-28',
    podId: POD_WIW_P1,
    categoryId: 'WIW',
    openingStock: 4470,
    inwardReceipts: 1400,
    sales: 1680,
    closingStock: 4190,
    otbBudget: 52000,
    cumulativePOsIssued: 39620,
    otbRemaining: 12380,
    consumptionPace: 'ahead',
    marginBridge: {
      intakeMargin: 55.3,
      promoDiscount: 2.0,
      markdownImpact: 2.8,
      logisticsCost: 1.6,
      netGrossMargin: 48.9,
      targetNetGM: 42.0,
      variance: 6.9,
    },
  },
  {
    id: 'recon-w4-www',
    weekEnding: '2026-02-28',
    podId: POD_WWW_P1,
    categoryId: 'WWW',
    openingStock: 2950,
    inwardReceipts: 900,
    sales: 850,
    closingStock: 3000,
    otbBudget: 41000,
    cumulativePOsIssued: 26510,
    otbRemaining: 14490,
    consumptionPace: 'behind',
    marginBridge: {
      intakeMargin: 52.2,
      promoDiscount: 3.0,
      markdownImpact: 4.8,
      logisticsCost: 2.2,
      netGrossMargin: 42.2,
      targetNetGM: 42.0,
      variance: 0.2,
    },
  },
];

// ─── Sell-Through Triage (v2.0) ─────────────────────────────────

export const mockSellThroughTriage: SellThroughTriage[] = [
  // 2 winners (ST >100%, Day-14 confirmed)
  {
    id: 'STT-001',
    styleId: 'MS1247',
    styleName: 'Slim Fit Linen Shirt',
    podId: POD_MW_P1,
    checkpoint: 'day-14',
    checkpointDate: '2026-02-28',
    plannedSellThrough: 40,
    actualSellThrough: 68,
    rosVsPlan: 1.70,
    sizeBreakdown: [
      { size: 'XS', sold: 42, allocated: 80, sellThrough: 52.5, oosDate: null },
      { size: 'S', sold: 145, allocated: 180, sellThrough: 80.6, oosDate: '2026-03-08' },
      { size: 'M', sold: 290, allocated: 320, sellThrough: 90.6, oosDate: '2026-03-04' },
      { size: 'L', sold: 260, allocated: 300, sellThrough: 86.7, oosDate: '2026-03-05' },
      { size: 'XL', sold: 120, allocated: 160, sellThrough: 75.0, oosDate: '2026-03-10' },
      { size: 'XXL', sold: 35, allocated: 60, sellThrough: 58.3, oosDate: null },
    ],
    classification: 'winner',
    recommendedAction: 'Chase 4,200 units across 15 stores. Prioritize M/L/XL sizes to prevent stockout.',
    estimatedChaseAmount: 4.2 * Cr,
    affectedStoreCount: 15,
    status: 'pending-review',
  },
  {
    id: 'STT-002',
    styleId: 'WI3891',
    styleName: 'Cotton Kurta Set',
    podId: POD_WIW_P1,
    checkpoint: 'day-14',
    checkpointDate: '2026-02-28',
    plannedSellThrough: 35,
    actualSellThrough: 58,
    rosVsPlan: 1.66,
    sizeBreakdown: [
      { size: 'XS', sold: 88, allocated: 140, sellThrough: 62.9, oosDate: null },
      { size: 'S', sold: 210, allocated: 280, sellThrough: 75.0, oosDate: '2026-03-06' },
      { size: 'M', sold: 380, allocated: 420, sellThrough: 90.5, oosDate: '2026-03-03' },
      { size: 'L', sold: 340, allocated: 380, sellThrough: 89.5, oosDate: '2026-03-04' },
      { size: 'XL', sold: 160, allocated: 220, sellThrough: 72.7, oosDate: '2026-03-09' },
      { size: 'XXL', sold: 52, allocated: 100, sellThrough: 52.0, oosDate: null },
    ],
    classification: 'winner',
    recommendedAction: 'Chase 5,800 units across all 22 stores. Strong national demand — prioritize M/L replenishment.',
    estimatedChaseAmount: 3.8 * Cr,
    affectedStoreCount: 22,
    status: 'pending-review',
  },
  // 2 size-break-salvage (50-100% ST, specific sizes selling)
  {
    id: 'STT-003',
    styleId: 'MT0892',
    styleName: 'Stretch Chinos',
    podId: POD_MW_P2,
    checkpoint: 'day-14',
    checkpointDate: '2026-02-28',
    plannedSellThrough: 40,
    actualSellThrough: 32,
    rosVsPlan: 0.80,
    sizeBreakdown: [
      { size: 'XS', sold: 8, allocated: 60, sellThrough: 13.3, oosDate: null },
      { size: 'S', sold: 22, allocated: 100, sellThrough: 22.0, oosDate: null },
      { size: 'M', sold: 85, allocated: 140, sellThrough: 60.7, oosDate: null },
      { size: 'L', sold: 92, allocated: 120, sellThrough: 76.7, oosDate: '2026-03-12' },
      { size: 'XL', sold: 48, allocated: 80, sellThrough: 60.0, oosDate: null },
      { size: 'XXL', sold: 12, allocated: 50, sellThrough: 24.0, oosDate: null },
    ],
    classification: 'size-break-salvage',
    recommendedAction: 'Chase M/L/XL only (225 units). Consolidate XS/S/XXL stock to A3 stores for markdown.',
    estimatedChaseAmount: 0.6 * Cr,
    affectedStoreCount: 8,
    status: 'pending-review',
  },
  {
    id: 'STT-004',
    styleId: 'WD2103',
    styleName: 'A-Line Dress',
    podId: POD_WWW_P1,
    checkpoint: 'day-14',
    checkpointDate: '2026-02-28',
    plannedSellThrough: 38,
    actualSellThrough: 28,
    rosVsPlan: 0.74,
    sizeBreakdown: [
      { size: 'XS', sold: 15, allocated: 50, sellThrough: 30.0, oosDate: null },
      { size: 'S', sold: 68, allocated: 90, sellThrough: 75.6, oosDate: '2026-03-15' },
      { size: 'M', sold: 72, allocated: 100, sellThrough: 72.0, oosDate: '2026-03-14' },
      { size: 'L', sold: 40, allocated: 80, sellThrough: 50.0, oosDate: null },
      { size: 'XL', sold: 18, allocated: 60, sellThrough: 30.0, oosDate: null },
      { size: 'XXL', sold: 5, allocated: 40, sellThrough: 12.5, oosDate: null },
    ],
    classification: 'size-break-salvage',
    recommendedAction: 'Chase S/M sizes only (150 units) for top 12 stores. Move XL/XXL to markdown cascade.',
    estimatedChaseAmount: 0.45 * Cr,
    affectedStoreCount: 12,
    status: 'pending-review',
  },
  // 2 losers (ST <50%, Day-14 confirmed)
  {
    id: 'STT-005',
    styleId: 'MF2201',
    styleName: 'Slim Fit Blazer',
    podId: POD_MW_P2,
    checkpoint: 'day-14',
    checkpointDate: '2026-02-28',
    plannedSellThrough: 35,
    actualSellThrough: 12,
    rosVsPlan: 0.34,
    sizeBreakdown: [
      { size: 'XS', sold: 2, allocated: 40, sellThrough: 5.0, oosDate: null },
      { size: 'S', sold: 8, allocated: 70, sellThrough: 11.4, oosDate: null },
      { size: 'M', sold: 22, allocated: 100, sellThrough: 22.0, oosDate: null },
      { size: 'L', sold: 18, allocated: 90, sellThrough: 20.0, oosDate: null },
      { size: 'XL', sold: 6, allocated: 60, sellThrough: 10.0, oosDate: null },
      { size: 'XXL', sold: 2, allocated: 40, sellThrough: 5.0, oosDate: null },
    ],
    classification: 'loser',
    recommendedAction: 'Kill re-orders. Initiate cascade to A3 stores at 20% markdown. Recover OTB for reallocation.',
    estimatedChaseAmount: null,
    affectedStoreCount: 10,
    status: 'pending-review',
  },
  {
    id: 'STT-006',
    styleId: 'WI5502',
    styleName: 'Anarkali Suit',
    podId: POD_WIW_P1,
    checkpoint: 'day-14',
    checkpointDate: '2026-02-28',
    plannedSellThrough: 30,
    actualSellThrough: 11,
    rosVsPlan: 0.37,
    sizeBreakdown: [
      { size: 'XS', sold: 4, allocated: 50, sellThrough: 8.0, oosDate: null },
      { size: 'S', sold: 12, allocated: 80, sellThrough: 15.0, oosDate: null },
      { size: 'M', sold: 18, allocated: 110, sellThrough: 16.4, oosDate: null },
      { size: 'L', sold: 10, allocated: 90, sellThrough: 11.1, oosDate: null },
      { size: 'XL', sold: 5, allocated: 60, sellThrough: 8.3, oosDate: null },
      { size: 'XXL', sold: 1, allocated: 30, sellThrough: 3.3, oosDate: null },
    ],
    classification: 'loser',
    recommendedAction: 'Kill re-orders. Fast-track to cascade stores within 7 days. Block future POs for this style.',
    estimatedChaseAmount: null,
    affectedStoreCount: 18,
    status: 'pending-review',
  },
  // 2 at Day-7 stage (not yet classified at Day-14)
  {
    id: 'STT-007',
    styleId: 'KB0445',
    styleName: 'Boys Polo Tee',
    podId: POD_KW_P1,
    checkpoint: 'day-7',
    checkpointDate: '2026-03-03',
    plannedSellThrough: 20,
    actualSellThrough: 28,
    rosVsPlan: 1.40,
    sizeBreakdown: [
      { size: 'XS', sold: 18, allocated: 40, sellThrough: 45.0, oosDate: null },
      { size: 'S', sold: 32, allocated: 60, sellThrough: 53.3, oosDate: null },
      { size: 'M', sold: 45, allocated: 80, sellThrough: 56.3, oosDate: null },
      { size: 'L', sold: 38, allocated: 70, sellThrough: 54.3, oosDate: null },
      { size: 'XL', sold: 20, allocated: 50, sellThrough: 40.0, oosDate: null },
      { size: 'XXL', sold: 8, allocated: 30, sellThrough: 26.7, oosDate: null },
    ],
    classification: 'winner',
    recommendedAction: 'Strong Day-7 signal. Await Day-14 confirmation before chase. Pre-alert vendor for potential re-cut.',
    estimatedChaseAmount: 0.8 * Cr,
    affectedStoreCount: 6,
    status: 'pending-review',
  },
  {
    id: 'STT-008',
    styleId: 'FW1102',
    styleName: 'Canvas Sneakers',
    podId: POD_FW_P1,
    checkpoint: 'day-7',
    checkpointDate: '2026-03-03',
    plannedSellThrough: 18,
    actualSellThrough: 10,
    rosVsPlan: 0.56,
    sizeBreakdown: [
      { size: 'XS', sold: 3, allocated: 30, sellThrough: 10.0, oosDate: null },
      { size: 'S', sold: 8, allocated: 45, sellThrough: 17.8, oosDate: null },
      { size: 'M', sold: 15, allocated: 60, sellThrough: 25.0, oosDate: null },
      { size: 'L', sold: 12, allocated: 55, sellThrough: 21.8, oosDate: null },
      { size: 'XL', sold: 5, allocated: 40, sellThrough: 12.5, oosDate: null },
      { size: 'XXL', sold: 2, allocated: 20, sellThrough: 10.0, oosDate: null },
    ],
    classification: 'loser',
    recommendedAction: 'Amber signal at Day-7. Monitor closely — if no improvement by Day-14, initiate cascade.',
    estimatedChaseAmount: null,
    affectedStoreCount: 12,
    status: 'pending-review',
  },
];

// ─── Test Lots (v2.0) ──────────────────────────────────────────

export const mockTestLots: TestLot[] = [
  // Active — just launched, no signals
  {
    id: 'TL-001',
    styleId: 'MS1390',
    styleName: 'Oversized Camp Collar Shirt',
    podId: POD_MW_P1,
    quantity: 1000,
    testStoreIds: gradeA.concat(gradeA1.slice(0, 5)),
    testStoreCount: 8,
    launchDate: '2026-03-04',
    day7Signal: null,
    day14Classification: null,
    recutPOId: null,
    recutQuantity: null,
    recutSizeRatios: null,
    status: 'active',
  },
  // Day-7 green signal
  {
    id: 'TL-002',
    styleId: 'WI4120',
    styleName: 'Block Print Palazzo Set',
    podId: POD_WIW_P1,
    quantity: 1000,
    testStoreIds: gradeA.concat(gradeA1.slice(0, 5)),
    testStoreCount: 8,
    launchDate: '2026-02-24',
    day7Signal: 'green',
    day14Classification: null,
    recutPOId: null,
    recutQuantity: null,
    recutSizeRatios: null,
    status: 'active',
  },
  // Day-7 red signal (early warning)
  {
    id: 'TL-003',
    styleId: 'WD3200',
    styleName: 'Satin Wrap Dress',
    podId: POD_WWW_P1,
    quantity: 800,
    testStoreIds: gradeA.concat(gradeA1.slice(0, 5)),
    testStoreCount: 8,
    launchDate: '2026-02-24',
    day7Signal: 'red',
    day14Classification: null,
    recutPOId: null,
    recutQuantity: null,
    recutSizeRatios: null,
    status: 'active',
  },
  // Winner-scaling — Day-14 confirmed winner, re-cut in progress
  {
    id: 'TL-004',
    styleId: 'MS1247',
    styleName: 'Slim Fit Linen Shirt',
    podId: POD_MW_P1,
    quantity: 1000,
    testStoreIds: gradeA.concat(gradeA1.slice(0, 5)),
    testStoreCount: 8,
    launchDate: '2026-02-10',
    day7Signal: 'green',
    day14Classification: 'winner',
    recutPOId: 'PO-RC-004',
    recutQuantity: 4200,
    recutSizeRatios: { XS: 8, S: 18, M: 30, L: 26, XL: 13, XXL: 5 },
    status: 'winner-scaling',
  },
  // Killed — Day-14 loser
  {
    id: 'TL-005',
    styleId: 'MF2201',
    styleName: 'Slim Fit Blazer',
    podId: POD_MW_P2,
    quantity: 800,
    testStoreIds: gradeA.concat(gradeA1.slice(0, 5)),
    testStoreCount: 8,
    launchDate: '2026-02-03',
    day7Signal: 'red',
    day14Classification: 'loser',
    recutPOId: null,
    recutQuantity: null,
    recutSizeRatios: null,
    status: 'killed',
  },
  // Completed — winner scaled successfully
  {
    id: 'TL-006',
    styleId: 'WI3891',
    styleName: 'Cotton Kurta Set',
    podId: POD_WIW_P1,
    quantity: 1000,
    testStoreIds: gradeA.concat(gradeA1.slice(0, 5)),
    testStoreCount: 8,
    launchDate: '2026-01-20',
    day7Signal: 'green',
    day14Classification: 'winner',
    recutPOId: 'PO-RC-006',
    recutQuantity: 5800,
    recutSizeRatios: { XS: 10, S: 20, M: 28, L: 24, XL: 12, XXL: 6 },
    status: 'completed',
  },
];

// ─── Fashion Option Lifecycle (v2.0) ────────────────────────────

const STORE_A_1 = storeDefinitions[0]!.id;   // Infinity Mall Malad
const STORE_A_2 = storeDefinitions[1]!.id;   // Viviana Thane
const STORE_A_3 = storeDefinitions[2]!.id;   // Select Citywalk
const STORE_A1_1 = storeDefinitions[3]!.id;  // Phoenix Marketcity Pune
const STORE_A2_1 = storeDefinitions[9]!.id;  // City Centre Nashik
const STORE_A2_2 = storeDefinitions[10]!.id; // Treasure Island Indore
const STORE_A3_1 = storeDefinitions[16]!.id; // Mall Road Kolhapur
const STORE_A3_2 = storeDefinitions[17]!.id; // Crystal Mall Rajkot

export const mockFashionLifecycle: FashionOptionLifecycle[] = [
  // a0-a1-fresh (Day 1-45) — 2 items
  {
    optionId: 'FLC-001',
    optionName: 'Oversized Camp Collar Shirt',
    podId: POD_MW_P1,
    networkAge: 12,
    currentStage: 'a0-a1-fresh',
    storePositions: [
      { storeId: STORE_A_1, storeAge: 12, networkAge: 12, currentStock: 85, sellThrough: 32, status: 'active', antiRotationFlag: false },
      { storeId: STORE_A_2, storeAge: 12, networkAge: 12, currentStock: 78, sellThrough: 28, status: 'active', antiRotationFlag: false },
      { storeId: STORE_A_3, storeAge: 12, networkAge: 12, currentStock: 92, sellThrough: 35, status: 'active', antiRotationFlag: false },
      { storeId: STORE_A1_1, storeAge: 10, networkAge: 12, currentStock: 60, sellThrough: 22, status: 'active', antiRotationFlag: false },
    ],
    originalOTBConsumed: 3.8 * Cr,
    markdownImpact: 0,
    liquidationRecovery: 0,
  },
  {
    optionId: 'FLC-002',
    optionName: 'Block Print Palazzo Set',
    podId: POD_WIW_P1,
    networkAge: 28,
    currentStage: 'a0-a1-fresh',
    storePositions: [
      { storeId: STORE_A_1, storeAge: 28, networkAge: 28, currentStock: 45, sellThrough: 58, status: 'active', antiRotationFlag: false },
      { storeId: STORE_A_3, storeAge: 25, networkAge: 28, currentStock: 52, sellThrough: 52, status: 'active', antiRotationFlag: false },
      { storeId: STORE_A1_1, storeAge: 22, networkAge: 28, currentStock: 38, sellThrough: 48, status: 'active', antiRotationFlag: false },
    ],
    originalOTBConsumed: 2.9 * Cr,
    markdownImpact: 0,
    liquidationRecovery: 0,
  },
  // a2-a3-cascade (Day 46-90) — 2 items
  {
    optionId: 'FLC-003',
    optionName: 'Floral Maxi Dress',
    podId: POD_WWW_P1,
    networkAge: 62,
    currentStage: 'a2-a3-cascade',
    storePositions: [
      { storeId: STORE_A_1, storeAge: 62, networkAge: 62, currentStock: 12, sellThrough: 82, status: 'active', antiRotationFlag: false },
      { storeId: STORE_A_2, storeAge: 55, networkAge: 62, currentStock: 18, sellThrough: 75, status: 'transfer-pending', antiRotationFlag: false },
      { storeId: STORE_A2_1, storeAge: 20, networkAge: 62, currentStock: 45, sellThrough: 35, status: 'active', antiRotationFlag: false },
      { storeId: STORE_A2_2, storeAge: 18, networkAge: 62, currentStock: 48, sellThrough: 30, status: 'active', antiRotationFlag: false },
    ],
    originalOTBConsumed: 4.2 * Cr,
    markdownImpact: 0.3 * Cr,
    liquidationRecovery: 0,
  },
  {
    optionId: 'FLC-004',
    optionName: 'Mandarin Collar Shirt',
    podId: POD_MW_P1,
    networkAge: 78,
    currentStage: 'a2-a3-cascade',
    storePositions: [
      { storeId: STORE_A_1, storeAge: 78, networkAge: 78, currentStock: 5, sellThrough: 92, status: 'active', antiRotationFlag: false },
      { storeId: STORE_A2_1, storeAge: 35, networkAge: 78, currentStock: 32, sellThrough: 48, status: 'active', antiRotationFlag: false },
      { storeId: STORE_A3_1, storeAge: 12, networkAge: 78, currentStock: 55, sellThrough: 18, status: 'active', antiRotationFlag: false },
    ],
    originalOTBConsumed: 3.5 * Cr,
    markdownImpact: 0.5 * Cr,
    liquidationRecovery: 0,
  },
  // liquidation (Day 91-180) — 2 items
  {
    optionId: 'FLC-005',
    optionName: 'Embroidered Georgette Saree',
    podId: POD_WIW_P2,
    networkAge: 120,
    currentStage: 'liquidation',
    storePositions: [
      { storeId: STORE_A3_1, storeAge: 45, networkAge: 120, currentStock: 68, sellThrough: 22, status: 'marked-down', antiRotationFlag: false },
      { storeId: STORE_A3_2, storeAge: 40, networkAge: 120, currentStock: 72, sellThrough: 18, status: 'marked-down', antiRotationFlag: false },
      { storeId: STORE_A2_2, storeAge: 60, networkAge: 120, currentStock: 30, sellThrough: 55, status: 'marked-down', antiRotationFlag: false },
    ],
    originalOTBConsumed: 5.1 * Cr,
    markdownImpact: 1.8 * Cr,
    liquidationRecovery: 0.9 * Cr,
  },
  {
    optionId: 'FLC-006',
    optionName: 'Slim Fit Blazer',
    podId: POD_MW_P2,
    networkAge: 105,
    currentStage: 'liquidation',
    storePositions: [
      { storeId: STORE_A3_1, storeAge: 30, networkAge: 105, currentStock: 42, sellThrough: 15, status: 'marked-down', antiRotationFlag: false },
      { storeId: STORE_A3_2, storeAge: 28, networkAge: 105, currentStock: 38, sellThrough: 12, status: 'marked-down', antiRotationFlag: false },
      { storeId: STORE_A2_1, storeAge: 50, networkAge: 105, currentStock: 22, sellThrough: 42, status: 'marked-down', antiRotationFlag: false },
      { storeId: STORE_A2_2, storeAge: 48, networkAge: 105, currentStock: 25, sellThrough: 38, status: 'marked-down', antiRotationFlag: false },
    ],
    originalOTBConsumed: 3.2 * Cr,
    markdownImpact: 1.2 * Cr,
    liquidationRecovery: 0.5 * Cr,
  },
  // written-off (Day 180+) — 1 item
  {
    optionId: 'FLC-007',
    optionName: 'Sequin Party Gown',
    podId: POD_WWW_P1,
    networkAge: 210,
    currentStage: 'written-off',
    storePositions: [
      { storeId: STORE_A3_1, storeAge: 90, networkAge: 210, currentStock: 35, sellThrough: 8, status: 'liquidated', antiRotationFlag: false },
      { storeId: STORE_A3_2, storeAge: 88, networkAge: 210, currentStock: 28, sellThrough: 6, status: 'liquidated', antiRotationFlag: false },
      { storeId: STORE_A2_2, storeAge: 120, networkAge: 210, currentStock: 12, sellThrough: 25, status: 'liquidated', antiRotationFlag: false },
    ],
    originalOTBConsumed: 2.8 * Cr,
    markdownImpact: 2.1 * Cr,
    liquidationRecovery: 0.3 * Cr,
  },
  // Anti-rotation flagged — 1 item
  {
    optionId: 'FLC-008',
    optionName: 'Cargo Joggers',
    podId: POD_MW_P2,
    networkAge: 55,
    currentStage: 'a2-a3-cascade',
    storePositions: [
      { storeId: STORE_A_1, storeAge: 55, networkAge: 55, currentStock: 8, sellThrough: 88, status: 'active', antiRotationFlag: false },
      { storeId: STORE_A_2, storeAge: 50, networkAge: 55, currentStock: 15, sellThrough: 78, status: 'transfer-pending', antiRotationFlag: true },
      { storeId: STORE_A2_1, storeAge: 15, networkAge: 55, currentStock: 42, sellThrough: 28, status: 'active', antiRotationFlag: false },
      { storeId: STORE_A3_1, storeAge: 8, networkAge: 55, currentStock: 50, sellThrough: 12, status: 'active', antiRotationFlag: false },
    ],
    originalOTBConsumed: 2.4 * Cr,
    markdownImpact: 0.2 * Cr,
    liquidationRecovery: 0,
  },
];

// ─── Vendor Scorecards (v2.0) ──────────────────────────────────

// Additional vendor UUIDs for scorecards
const VENDOR_006 = 'd6e7f8a9-b0c1-4d6e-e7f8-a9b0c1d2e3f7';
const VENDOR_007 = 'e7f8a9b0-c1d2-4e7f-f8a9-b0c1d2e3f4a8';
const VENDOR_008 = 'f8a9b0c1-d2e3-4f8a-a9b0-c1d2e3f4a5b9';
const VENDOR_009 = 'a9b0c1d2-e3f4-4a9b-b0c1-d2e3f4a5b6ca';
const VENDOR_010 = 'b0c1d2e3-f4a5-4b0c-c1d2-e3f4a5b6c7d1';

export const mockVendorScorecards: VendorScorecard[] = [
  // 4 active vendors (score >80%)
  {
    vendorId: VENDOR_001,
    vendorName: 'Shahi Exports',
    sourcingEngine: 'scale-margin',
    deliveryOnTime: 94,
    qualityScore: 92,
    leadTimeDays: 65,
    fabricAvailability: 96,
    compositeScore: 92,
    totalPOValue: 89.2 * Cr,
    activePOCount: 24,
    concentrationByPod: [
      { podId: POD_MW_P1, podName: 'Men\'s Casuals — Shirts', sharePct: 20.6, status: 'ok' },
      { podId: POD_MW_P2, podName: 'Men\'s Casuals — Trousers', sharePct: 12.4, status: 'ok' },
    ],
    status: 'active',
    exitReason: null,
  },
  {
    vendorId: VENDOR_002,
    vendorName: 'Gokaldas Exports',
    sourcingEngine: 'scale-margin',
    deliveryOnTime: 91,
    qualityScore: 88,
    leadTimeDays: 70,
    fabricAvailability: 90,
    compositeScore: 88,
    totalPOValue: 72.1 * Cr,
    activePOCount: 18,
    concentrationByPod: [
      { podId: POD_MW_P1, podName: 'Men\'s Casuals — Shirts', sharePct: 16.6, status: 'ok' },
      { podId: POD_MW_P3, podName: 'Men\'s Casuals — T-Shirts', sharePct: 14.2, status: 'ok' },
    ],
    status: 'active',
    exitReason: null,
  },
  {
    vendorId: VENDOR_003,
    vendorName: 'Orient Craft',
    sourcingEngine: 'fast-response',
    deliveryOnTime: 88,
    qualityScore: 90,
    leadTimeDays: 35,
    fabricAvailability: 92,
    compositeScore: 86,
    totalPOValue: 58.4 * Cr,
    activePOCount: 22,
    concentrationByPod: [
      { podId: POD_MW_P1, podName: 'Men\'s Casuals — Shirts', sharePct: 13.5, status: 'ok' },
      { podId: POD_KW_P1, podName: 'Kids Wear — Boys', sharePct: 10.8, status: 'ok' },
    ],
    status: 'active',
    exitReason: null,
  },
  {
    vendorId: VENDOR_006,
    vendorName: 'Ethnic Creations',
    sourcingEngine: 'scale-margin',
    deliveryOnTime: 90,
    qualityScore: 85,
    leadTimeDays: 60,
    fabricAvailability: 88,
    compositeScore: 84,
    totalPOValue: 65.3 * Cr,
    activePOCount: 16,
    concentrationByPod: [
      { podId: POD_WIW_P1, podName: 'Women\'s Indian Wear — Kurtas', sharePct: 24.1, status: 'warning' },
      { podId: POD_WIW_P2, podName: 'Women\'s Indian Wear — Sarees', sharePct: 8.5, status: 'ok' },
    ],
    status: 'active',
    exitReason: null,
  },
  // 3 watch vendors (score 70-80%)
  {
    vendorId: VENDOR_004,
    vendorName: 'Bombay Rayon',
    sourcingEngine: 'scale-margin',
    deliveryOnTime: 78,
    qualityScore: 80,
    leadTimeDays: 75,
    fabricAvailability: 82,
    compositeScore: 78,
    totalPOValue: 48.7 * Cr,
    activePOCount: 14,
    concentrationByPod: [
      { podId: POD_MW_P1, podName: 'Men\'s Casuals — Shirts', sharePct: 11.2, status: 'ok' },
      { podId: POD_WWW_P3, podName: 'Women\'s Western Wear — Denims', sharePct: 14.8, status: 'ok' },
    ],
    status: 'watch',
    exitReason: null,
  },
  {
    vendorId: VENDOR_007,
    vendorName: 'Nalli Silks',
    sourcingEngine: 'scale-margin',
    deliveryOnTime: 82,
    qualityScore: 76,
    leadTimeDays: 80,
    fabricAvailability: 74,
    compositeScore: 76,
    totalPOValue: 42.8 * Cr,
    activePOCount: 10,
    concentrationByPod: [
      { podId: POD_WIW_P2, podName: 'Women\'s Indian Wear — Sarees', sharePct: 19.5, status: 'ok' },
    ],
    status: 'watch',
    exitReason: null,
  },
  {
    vendorId: VENDOR_008,
    vendorName: 'Donear Industries',
    sourcingEngine: 'fast-response',
    deliveryOnTime: 75,
    qualityScore: 78,
    leadTimeDays: 42,
    fabricAvailability: 80,
    compositeScore: 74,
    totalPOValue: 35.2 * Cr,
    activePOCount: 12,
    concentrationByPod: [
      { podId: POD_KW_P1, podName: 'Kids Wear — Boys', sharePct: 19.3, status: 'ok' },
      { podId: POD_MW_P2, podName: 'Men\'s Casuals — Trousers', sharePct: 8.1, status: 'ok' },
    ],
    status: 'watch',
    exitReason: null,
  },
  // 3 exit-candidate vendors (score <70%)
  {
    vendorId: VENDOR_005,
    vendorName: 'Arvind Ltd',
    sourcingEngine: 'scale-margin',
    deliveryOnTime: 65,
    qualityScore: 68,
    leadTimeDays: 85,
    fabricAvailability: 62,
    compositeScore: 64,
    totalPOValue: 42.3 * Cr,
    activePOCount: 8,
    concentrationByPod: [
      { podId: POD_MW_P1, podName: 'Men\'s Casuals — Shirts', sharePct: 9.7, status: 'ok' },
      { podId: POD_WWW_P1, podName: 'Women\'s Western Wear — Tops', sharePct: 15.2, status: 'ok' },
    ],
    status: 'exit-candidate',
    exitReason: 'Chronic delivery delays (avg 12 days late). Quality rejects up 40% QoQ.',
  },
  {
    vendorId: VENDOR_009,
    vendorName: 'Liberty Shoes',
    sourcingEngine: 'scale-margin',
    deliveryOnTime: 60,
    qualityScore: 62,
    leadTimeDays: 90,
    fabricAvailability: 58,
    compositeScore: 58,
    totalPOValue: 28.5 * Cr,
    activePOCount: 6,
    concentrationByPod: [
      { podId: POD_FW_P1, podName: 'Footwear — Men\'s', sharePct: 22.1, status: 'warning' },
    ],
    status: 'exit-candidate',
    exitReason: 'Lead time 90 days (target 72). 3 consecutive quality audit failures. FW Pod over-concentrated at 22%.',
  },
  {
    vendorId: VENDOR_010,
    vendorName: 'Hidesign',
    sourcingEngine: 'test-repeat',
    deliveryOnTime: 58,
    qualityScore: 70,
    leadTimeDays: 18,
    fabricAvailability: 55,
    compositeScore: 62,
    totalPOValue: 18.4 * Cr,
    activePOCount: 4,
    concentrationByPod: [
      { podId: POD_NA_P1, podName: 'Non-Apparel — Accessories', sharePct: 16.4, status: 'ok' },
    ],
    status: 'exit-candidate',
    exitReason: 'Material availability dropped below 60%. Unable to fulfill test-repeat commitments within SLA.',
  },
];

// ─── Lookup Maps ──────────────────────────────────────────────────

/** Category ID → human-readable name */
export const categoryNameMap: Record<string, string> = {
  MC: "Men's Casuals",
  MF: "Men's Formals",
  WIW: "Women's Indian Wear",
  WWW: "Women's Western Wear",
  KW: 'Kids Wear',
  FW: 'Footwear',
  NA: 'Non-Apparel',
};

/** POD ID → human-readable Segment / Family name */
export const podNameMap: Record<string, string> = {
  [POD_MW_P1]: "Men's Casuals — Shirts",
  [POD_MW_P2]: "Men's Casuals — Trousers",
  [POD_MW_P3]: "Men's Casuals — T-Shirts",
  [POD_WIW_P1]: "Women's Indian Wear — Kurtas",
  [POD_WIW_P2]: "Women's Indian Wear — Sarees",
  [POD_WWW_P1]: "Women's Western Wear — Tops",
  [POD_WWW_P3]: "Women's Western Wear — Denims",
  [POD_KW_P1]: "Kids Wear — Boys",
  [POD_FW_P1]: "Footwear — Men's",
  [POD_NA_P1]: "Non-Apparel — Accessories",
};

// ─── POD Hierarchy (Segment × Family mapping) ──────────────────────────

export const POD_HIERARCHY: {
  podId: string;
  segment: string;
  segmentLabel: string;
  family: string;
  familyLabel: string;
}[] = [
  { podId: POD_MW_P1,  segment: 'MC',  segmentLabel: "Men's Casuals",        family: 'shirts',      familyLabel: 'Shirts' },
  { podId: POD_MW_P2,  segment: 'MC',  segmentLabel: "Men's Casuals",        family: 'trousers',    familyLabel: 'Trousers' },
  { podId: POD_MW_P3,  segment: 'MC',  segmentLabel: "Men's Casuals",        family: 'tshirts',     familyLabel: 'T-Shirts' },
  { podId: POD_WIW_P1, segment: 'WIW', segmentLabel: "Women's Indian Wear",  family: 'kurtas',      familyLabel: 'Kurtas' },
  { podId: POD_WIW_P2, segment: 'WIW', segmentLabel: "Women's Indian Wear",  family: 'sarees',      familyLabel: 'Sarees' },
  { podId: POD_WWW_P1, segment: 'WWW', segmentLabel: "Women's Western Wear", family: 'shirts',      familyLabel: 'Tops' },
  { podId: POD_WWW_P3, segment: 'WWW', segmentLabel: "Women's Western Wear", family: 'jeans',       familyLabel: 'Denims' },
  { podId: POD_KW_P1,  segment: 'KW',  segmentLabel: 'Kids Wear',           family: 'tshirts',     familyLabel: 'Boys' },
  { podId: POD_FW_P1,  segment: 'FW',  segmentLabel: 'Footwear',            family: 'shoes',       familyLabel: "Men's" },
  { podId: POD_NA_P1,  segment: 'NA',  segmentLabel: 'Non-Apparel',         family: 'accessories', familyLabel: 'Accessories' },
];

// ─── OTB Line Items (per-POD breakdown) ────────────────────────────────

// Compact template: [brand, brandLabel, grade, hit (1-12 = Apr-Mar), budgetSharePct]
type LT = [string, string, 'core' | 'fashion', number, number];

const POD_TEMPLATES: Record<string, LT[]> = {
  [POD_MW_P1]: [ // MC - Shirts
    ['trends',   'Trends',    'core',     1, 14],
    ['trends',   'Trends',    'fashion',  2, 10],
    ['netplay',  'NetPlay',   'core',     1, 12],
    ['trends',   'Trends',    'core',     3, 11],
    ['azorte',   'Azorte',    'fashion',  4,  9],
    ['azorte',   'Azorte',    'core',     2, 10],
    ['performax','Performax', 'core',     5, 12],
    ['performax','Performax', 'fashion',  6,  8],
    ['yousta',   'Yousta',    'fashion',  3,  7],
    ['netplay',  'NetPlay',   'core',     4,  7],
  ],
  [POD_MW_P2]: [ // MC - Trousers
    ['trends',   'Trends',    'core',     1, 18],
    ['netplay',  'NetPlay',   'core',     2, 14],
    ['trends',   'Trends',    'fashion',  3, 10],
    ['yousta',   'Yousta',    'core',     1, 15],
    ['yousta',   'Yousta',    'fashion',  4, 12],
    ['azorte',   'Azorte',    'core',     5, 11],
    ['azorte',   'Azorte',    'fashion',  6,  8],
    ['performax','Performax', 'core',     2,  6],
    ['trends',   'Trends',    'core',     7,  6],
  ],
  [POD_MW_P3]: [ // MC - T-Shirts
    ['trends',   'Trends',    'core',     1, 20],
    ['yousta',   'Yousta',    'core',     2, 15],
    ['trends',   'Trends',    'fashion',  3, 12],
    ['netplay',  'NetPlay',   'core',     4, 14],
    ['performax','Performax', 'core',     1, 12],
    ['yousta',   'Yousta',    'fashion',  5, 10],
    ['frendz',   'Frendz',    'fashion',  6,  8],
    ['trends',   'Trends',    'core',     7,  9],
  ],
  [POD_WIW_P1]: [ // WIW - Kurtas
    ['avaasa',   'Avaasa',    'core',     1, 18],
    ['trends',   'Trends',    'core',     2, 15],
    ['avaasa',   'Avaasa',    'fashion',  3, 12],
    ['avaasa',   'Avaasa',    'fashion',  7, 11],
    ['trends',   'Trends',    'core',     4, 14],
    ['avaasa',   'Avaasa',    'fashion',  8,  8],
    ['trends',   'Trends',    'core',     5, 12],
    ['avaasa',   'Avaasa',    'core',     6, 10],
  ],
  [POD_WIW_P2]: [ // WIW - Sarees
    ['avaasa',   'Avaasa',    'core',     1, 18],
    ['trends',   'Trends',    'core',     2, 16],
    ['avaasa',   'Avaasa',    'fashion',  7, 14],
    ['trends',   'Trends',    'fashion',  3, 12],
    ['avaasa',   'Avaasa',    'fashion',  8, 13],
    ['trends',   'Trends',    'core',     4, 14],
    ['avaasa',   'Avaasa',    'core',     5, 13],
  ],
  [POD_WWW_P1]: [ // WWW - Tops
    ['trends',   'Trends',    'core',     1, 18],
    ['azorte',   'Azorte',    'fashion',  2, 14],
    ['yousta',   'Yousta',    'fashion',  3, 12],
    ['azorte',   'Azorte',    'core',     4, 13],
    ['trends',   'Trends',    'core',     5, 14],
    ['avaasa',   'Avaasa',    'core',     6, 12],
    ['avaasa',   'Avaasa',    'fashion',  7,  9],
    ['trends',   'Trends',    'fashion',  8,  8],
  ],
  [POD_WWW_P3]: [ // WWW - Denims
    ['yousta',   'Yousta',    'core',     1, 20],
    ['trends',   'Trends',    'core',     2, 16],
    ['azorte',   'Azorte',    'fashion',  3, 14],
    ['yousta',   'Yousta',    'fashion',  4, 12],
    ['trends',   'Trends',    'fashion',  5, 10],
    ['yousta',   'Yousta',    'core',     6, 12],
    ['azorte',   'Azorte',    'fashion',  7,  8],
    ['trends',   'Trends',    'core',     8,  8],
  ],
  [POD_KW_P1]: [ // KW - Boys
    ['frendz',   'Frendz',    'core',     1, 20],
    ['trends',   'Trends',    'core',     2, 16],
    ['trends',   'Trends',    'fashion',  3, 12],
    ['frendz',   'Frendz',    'core',     4, 14],
    ['frendz',   'Frendz',    'core',     5, 12],
    ['trends',   'Trends',    'fashion',  6, 10],
    ['frendz',   'Frendz',    'fashion',  7,  8],
    ['trends',   'Trends',    'core',     8,  8],
  ],
  [POD_FW_P1]: [ // FW - Men's
    ['trends',   'Trends',    'core',     1, 18],
    ['performax','Performax', 'core',     2, 16],
    ['azorte',   'Azorte',    'core',     3, 14],
    ['yousta',   'Yousta',    'fashion',  4, 12],
    ['performax','Performax', 'fashion',  5, 10],
    ['trends',   'Trends',    'core',     6, 12],
    ['azorte',   'Azorte',    'fashion',  7,  9],
    ['yousta',   'Yousta',    'core',     8,  9],
  ],
  [POD_NA_P1]: [ // NA - Accessories
    ['trends',   'Trends',    'core',     1, 18],
    ['azorte',   'Azorte',    'core',     2, 16],
    ['trends',   'Trends',    'core',     3, 14],
    ['avaasa',   'Avaasa',    'fashion',  4, 12],
    ['azorte',   'Azorte',    'fashion',  7, 12],
    ['trends',   'Trends',    'core',     5, 12],
    ['azorte',   'Azorte',    'fashion',  6,  8],
    ['avaasa',   'Avaasa',    'core',     8,  8],
  ],
};

// Segment short-code prefix for OTB numbers
const SEGMENT_PREFIX: Record<string, string> = { MC: 'MC', WIW: 'WIW', WWW: 'WWW', KW: 'KW', FW: 'FW', NA: 'NA' };

/** Generate OTB line items for all pods */
export const mockOTBLineItems: OTBLineItem[] = (() => {
  const items: OTBLineItem[] = [];
  let seq = 1;
  for (const pod of mockOTBPods) {
    const templates = POD_TEMPLATES[pod.podId];
    if (!templates) continue;
    const hier = POD_HIERARCHY.find((h) => h.podId === pod.podId);
    const prefix = hier ? SEGMENT_PREFIX[hier.segment] ?? 'OTB' : 'OTB';
    templates.forEach((t) => {
      const share = t[4] / 100;
      const budget = Math.round(pod.budget * share);
      const consumed = Math.round(pod.consumed * share);
      const util = budget > 0 ? Math.round((consumed / budget) * 100) : 0;
      items.push({
        id: `otb-${pod.podId.slice(0, 8)}-${seq}`,
        podId: pod.podId,
        otbNumber: `OTB-${prefix}-${String(seq).padStart(4, '0')}`,
        brand: t[0], brandLabel: t[1],
        fashionGrade: t[2], fashionGradeLabel: t[2] === 'core' ? 'Core' : 'Fashion',
        hit: t[3],
        budget, consumed, utilization: util,
        recommendedValue: budget,
        purchaseValue: budget,
        editStatus: 'none',
        editHistory: [],
      });
      seq++;
    });
  }

  // Seed sample edits to demonstrate the feature
  // Item #1: small edit (< 10%) that was auto-approved
  if (items[0]) {
    const recommended = items[0].recommendedValue;
    const newVal = Math.round(recommended * 1.05); // +5%
    items[0].purchaseValue = newVal;
    items[0].editHistory = [{
      id: 'edit-seed-1',
      timestamp: '2026-03-06 10:30:00',
      actor: 'Priya Sharma',
      actorRole: 'Category Buyer',
      oldValue: recommended,
      newValue: newVal,
      variancePct: 5,
      requiresApproval: false,
      status: 'auto-approved',
      reason: 'Adjusted for seasonal uptick in demand',
    }];
  }

  // Item #2: large edit (> 10%) with status 'pending'
  if (items[1]) {
    const recommended = items[1].recommendedValue;
    const newVal = Math.round(recommended * 1.18); // +18%
    items[1].purchaseValue = newVal;
    items[1].editStatus = 'pending-approval';
    items[1].editHistory = [{
      id: 'edit-seed-2',
      timestamp: '2026-03-07 14:15:00',
      actor: 'Rajesh Kumar',
      actorRole: 'Category Buyer',
      oldValue: recommended,
      newValue: newVal,
      variancePct: 18,
      requiresApproval: true,
      status: 'pending',
      reason: 'New brand campaign expected to drive higher sales',
    }];
  }

  // Item #3: large edit (> 10%) that was approved
  if (items[2]) {
    const recommended = items[2].recommendedValue;
    const newVal = Math.round(recommended * 0.85); // -15%
    items[2].purchaseValue = newVal;
    items[2].editHistory = [{
      id: 'edit-seed-3',
      timestamp: '2026-03-05 09:00:00',
      actor: 'Anita Desai',
      actorRole: 'Category Buyer',
      oldValue: recommended,
      newValue: newVal,
      variancePct: -15,
      requiresApproval: true,
      status: 'approved',
      approvedBy: 'VP Merchandising',
      approvedAt: '2026-03-05 11:30:00',
      reason: 'Reduced allocation due to slow-moving stock',
    }];
  }

  return items;
})();
