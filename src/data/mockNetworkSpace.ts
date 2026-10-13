// ─── Network Space Planning mock data ─────────────────────────────

export interface GarmentCapacity {
  grade: string;
  stores: number;
  revenueCr: number;
  monthlyUnits: number;
  inStoreStock: number;
  sharePercent: number;
  perStoreAvg: number;
}

export interface SpaceMetric {
  storeId: string;
  storeName: string;
  grade: string;
  currentSpsf: number;
  targetSpsf: number;
  status: 'above-target' | 'on-target' | 'below-floor';
}

export interface SpaceAdjustment {
  id: string;
  date: string;
  storeId: string;
  storeName: string;
  type: string;
  spsfBefore: number;
  spsfAfter: number;
  status: 'completed' | 'pending' | 'in-progress';
}

// ─── 15M Garment Capacity by Grade ───────────────────────────────

export const garmentCapacity: GarmentCapacity[] = [
  { grade: 'A+', stores: 18, revenueCr: 2_850, monthlyUnits: 3_200_000, inStoreStock: 890_000, sharePercent: 21.3, perStoreAvg: 177_778 },
  { grade: 'A1', stores: 35, revenueCr: 3_680, monthlyUnits: 4_100_000, inStoreStock: 1_150_000, sharePercent: 27.3, perStoreAvg: 117_143 },
  { grade: 'A2', stores: 52, revenueCr: 3_150, monthlyUnits: 3_500_000, inStoreStock: 980_000, sharePercent: 23.3, perStoreAvg: 67_308 },
  { grade: 'A3', stores: 64, revenueCr: 2_280, monthlyUnits: 2_600_000, inStoreStock: 720_000, sharePercent: 17.3, perStoreAvg: 40_625 },
  { grade: 'B', stores: 40, revenueCr: 1_190, monthlyUnits: 1_600_000, inStoreStock: 460_000, sharePercent: 10.7, perStoreAvg: 40_000 },
];

// ─── Network SPSF Metrics ────────────────────────────────────────

export const networkSpaceMetrics: SpaceMetric[] = [
  { storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', storeName: 'Phoenix Palladium', grade: 'A+', currentSpsf: 1.82, targetSpsf: 1.50, status: 'above-target' },
  { storeId: 'e6b6e0f2-3a7d-4b6a-81e9-6f2a8d0b4c7e', storeName: 'Ambience Mall Gurgaon', grade: 'A+', currentSpsf: 1.68, targetSpsf: 1.50, status: 'above-target' },
  { storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', storeName: 'Select Citywalk', grade: 'A1', currentSpsf: 1.54, targetSpsf: 1.50, status: 'on-target' },
  { storeId: '26d4a8b0-1c5f-4d4c-a9a7-4b0c6f8d2e5a', storeName: 'Inorbit Malad', grade: 'A1', currentSpsf: 1.45, targetSpsf: 1.50, status: 'on-target' },
  { storeId: '6ed4a8b0-1c5f-4340-a9a7-4b0c6f8d2e53', storeName: 'Forum Koramangala', grade: 'A2', currentSpsf: 1.38, targetSpsf: 1.50, status: 'below-floor' },
  { storeId: '91a7d1e3-4f8c-4670-b2d0-7e3f9c1a5b86', storeName: 'VR Chennai', grade: 'A2', currentSpsf: 1.52, targetSpsf: 1.50, status: 'on-target' },
  { storeId: '37e5b9c1-2d6a-4e5d-80b8-5c1d7a9e3f6b', storeName: 'Infinity Mall Andheri', grade: 'A3', currentSpsf: 1.22, targetSpsf: 1.50, status: 'below-floor' },
  { storeId: '4cf8c2d4-5e9b-4710-a3c1-8d4e0b2f6a31', storeName: 'South City Kolkata', grade: 'A3', currentSpsf: 1.31, targetSpsf: 1.50, status: 'below-floor' },
  { storeId: 'b3c9f3a5-6b0e-4890-94f2-9a5b1e3c7da8', storeName: 'Nexus Hyderabad', grade: 'A1', currentSpsf: 1.61, targetSpsf: 1.50, status: 'above-target' },
  { storeId: 'c4f4c8d0-1e5b-4f4e-a9c7-4d0e6b8f2a5c', storeName: 'DLF Promenade', grade: 'A+', currentSpsf: 1.75, targetSpsf: 1.50, status: 'above-target' },
];

// ─── Space Adjustment Activity Log ──────────────────────────────

export const spaceAdjustments: SpaceAdjustment[] = [
  { id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', date: '2026-02-28', storeId: '6ed4a8b0-1c5f-4340-a9a7-4b0c6f8d2e53', storeName: 'Forum Koramangala', type: 'Fixture Expansion', spsfBefore: 1.18, spsfAfter: 1.38, status: 'completed' },
  { id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', date: '2026-03-01', storeId: '37e5b9c1-2d6a-4e5d-80b8-5c1d7a9e3f6b', storeName: 'Infinity Mall Andheri', type: 'Layout Optimization', spsfBefore: 1.15, spsfAfter: 1.22, status: 'in-progress' },
  { id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', date: '2026-03-02', storeId: '4cf8c2d4-5e9b-4710-a3c1-8d4e0b2f6a31', storeName: 'South City Kolkata', type: 'Category Rebalance', spsfBefore: 1.28, spsfAfter: 1.31, status: 'in-progress' },
  { id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', date: '2026-03-03', storeId: '26d4a8b0-1c5f-4d4c-a9a7-4b0c6f8d2e5a', storeName: 'Inorbit Malad', type: 'Seasonal Swap', spsfBefore: 1.40, spsfAfter: 1.45, status: 'pending' },
  { id: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', date: '2026-02-25', storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', storeName: 'Phoenix Palladium', type: 'Premium Zone Expansion', spsfBefore: 1.72, spsfAfter: 1.82, status: 'completed' },
  { id: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', date: '2026-03-04', storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', storeName: 'Select Citywalk', type: 'Display Density Increase', spsfBefore: 1.48, spsfAfter: 1.54, status: 'pending' },
];

// ─── Summary ─────────────────────────────────────────────────────

export const networkSpaceSummary = {
  actualCapacityCr: 1.48,
  targetCapacityCr: 1.50,
  networkAvgSpsf: +(networkSpaceMetrics.reduce((s, m) => s + m.currentSpsf, 0) / networkSpaceMetrics.length).toFixed(2),
  storesBelowFloor: networkSpaceMetrics.filter(m => m.status === 'below-floor').length,
  totalStores: 3647,
  totalSqft: 1_450_000,
};
