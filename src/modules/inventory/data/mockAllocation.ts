// ─── Inventory Allocation mock data ────────────────────────────────

export interface GradeDistribution {
  grade: string;
  units: number;
  stores: number;
}

export interface DropAllocation {
  dropId: string;
  dropName: string;
  totalUnits: number;
  storesCovered: number;
  otbUtilizationPct: number;
  gradeDistribution: GradeDistribution[];
}

export interface StoreAllocation {
  storeId: string;
  storeName: string;
  grade: string;
  sft: number;
  units: number;
  coverDays: number;
  fixtureFit: 'ok' | 'tight' | 'over';
  status: 'allocated' | 'pending' | 'flagged';
}

export interface ConstraintCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  actual: string;
  threshold: string;
  description: string;
}

// ─── Drop Allocation Summary ────────────────────────────────────

export const dropAllocation: DropAllocation = {
  dropId: 'd6f7a8b9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
  dropName: "SS26 Men's Casuals Drop 4",
  totalUnits: 48_500,
  storesCovered: 182,
  otbUtilizationPct: 73,
  gradeDistribution: [
    { grade: 'A+', units: 12_200, stores: 18 },
    { grade: 'A1', units: 14_800, stores: 35 },
    { grade: 'A2', units: 12_500, stores: 52 },
    { grade: 'A3', units: 9_000, stores: 64 },
  ],
};

// ─── Store-Level Allocations ────────────────────────────────────

export const storeAllocations: StoreAllocation[] = [
  { storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', storeName: 'Phoenix Palladium', grade: 'A+', sft: 4_200, units: 680, coverDays: 32, fixtureFit: 'ok', status: 'allocated' },
  { storeId: 'e6b6e0f2-3a7d-4b6a-81e9-6f2a8d0b4c7e', storeName: 'Ambience Mall Gurgaon', grade: 'A+', sft: 3_800, units: 650, coverDays: 30, fixtureFit: 'ok', status: 'allocated' },
  { storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', storeName: 'Select Citywalk', grade: 'A1', sft: 3_200, units: 420, coverDays: 28, fixtureFit: 'ok', status: 'allocated' },
  { storeId: '26d4a8b0-1c5f-4d4c-a9a7-4b0c6f8d2e5a', storeName: 'Inorbit Malad', grade: 'A1', sft: 2_800, units: 380, coverDays: 35, fixtureFit: 'tight', status: 'allocated' },
  { storeId: '6ed4a8b0-1c5f-4340-a9a7-4b0c6f8d2e53', storeName: 'Forum Koramangala', grade: 'A2', sft: 2_400, units: 240, coverDays: 42, fixtureFit: 'ok', status: 'allocated' },
  { storeId: '91a7d1e3-4f8c-4670-b2d0-7e3f9c1a5b86', storeName: 'VR Chennai', grade: 'A2', sft: 2_600, units: 260, coverDays: 38, fixtureFit: 'ok', status: 'allocated' },
  { storeId: '37e5b9c1-2d6a-4e5d-80b8-5c1d7a9e3f6b', storeName: 'Infinity Mall Andheri', grade: 'A3', sft: 1_800, units: 140, coverDays: 48, fixtureFit: 'over', status: 'flagged' },
  { storeId: '4cf8c2d4-5e9b-4710-a3c1-8d4e0b2f6a31', storeName: 'South City Kolkata', grade: 'A3', sft: 2_000, units: 160, coverDays: 45, fixtureFit: 'tight', status: 'allocated' },
  { storeId: 'b3c9f3a5-6b0e-4890-94f2-9a5b1e3c7da8', storeName: 'Nexus Hyderabad', grade: 'A1', sft: 3_500, units: 440, coverDays: 26, fixtureFit: 'ok', status: 'allocated' },
  { storeId: 'c4f4c8d0-1e5b-4f4e-a9c7-4d0e6b8f2a5c', storeName: 'DLF Promenade', grade: 'A+', sft: 4_000, units: 700, coverDays: 29, fixtureFit: 'ok', status: 'allocated' },
  { storeId: 'f7a3d7e9-0f4c-4210-b8d6-3e9f5c7a1bec', storeName: 'Lulu Mall Kochi', grade: 'A2', sft: 2_200, units: 220, coverDays: 40, fixtureFit: 'ok', status: 'pending' },
  { storeId: 'f7c7f1a3-4b8e-4c7b-92f0-7a3b9e1c5d8f', storeName: 'Elante Mall Chandigarh', grade: 'A2', sft: 2_500, units: 250, coverDays: 36, fixtureFit: 'ok', status: 'allocated' },
];

// ─── Constraint Checks ──────────────────────────────────────────

export const constraintChecks: ConstraintCheck[] = [
  { name: 'Fixture Capacity', status: 'warn', actual: '92%', threshold: '≤90%', description: '3 stores exceed fixture capacity — manual fit check needed' },
  { name: 'Core / Fashion Split', status: 'pass', actual: '62:38', threshold: '60:40 ± 5%', description: 'Within acceptable range for Men Casuals' },
  { name: 'Cover Days (Avg)', status: 'pass', actual: '35d', threshold: '≤45d', description: 'Network average within target range' },
  { name: 'OTB Budget Fit', status: 'pass', actual: '73%', threshold: '≤100%', description: 'Allocation within OTB budget envelope' },
  { name: 'Grade A+ Depth', status: 'pass', actual: '678 avg', threshold: '≥500', description: 'Top-grade stores have adequate depth' },
  { name: 'Minimum Assortment', status: 'warn', actual: '18 styles', threshold: '≥20', description: '4 A3 stores below minimum style count' },
];

// ─── Allocation Summary ─────────────────────────────────────────

export const allocationSummary = {
  totalUnits: dropAllocation.totalUnits,
  storesCovered: dropAllocation.storesCovered,
  otbUtilizationPct: dropAllocation.otbUtilizationPct,
  constraintsPassing: constraintChecks.filter(c => c.status === 'pass').length,
  constraintsTotal: constraintChecks.length,
  flaggedStores: storeAllocations.filter(s => s.status === 'flagged').length,
  pendingStores: storeAllocations.filter(s => s.status === 'pending').length,
};
