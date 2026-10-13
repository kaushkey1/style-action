// ── Space Planning Mock Data ──
// Aligned with Operating Model: Store Capacity & Allocation, Execution Document v2.0

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

export interface StoreSpaceProfile {
  storeId: string;
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

// ── Fixture Type Master (12 operating model fixtures) ──

export const fixtureTypesOM: FixtureTypeOM[] = [
  { id: 'ft-om-01', name: '4-Way Rack', code: '4WAY', category: 'Floor', optionCapacity: 4, sizeSet: 8, quantityPerFixture: 32, linearFeet: 3, displayMethod: 'Face-out', status: 'Active' },
  { id: 'ft-om-02', name: 'Straight Rack (4ft)', code: 'SR4', category: 'Floor', optionCapacity: 8, sizeSet: 8, quantityPerFixture: 64, linearFeet: 4, displayMethod: 'Side-hang', status: 'Active' },
  { id: 'ft-om-03', name: 'Straight Rack (6ft)', code: 'SR6', category: 'Floor', optionCapacity: 12, sizeSet: 8, quantityPerFixture: 96, linearFeet: 6, displayMethod: 'Side-hang', status: 'Active' },
  { id: 'ft-om-04', name: 'Wall Unit (4ft)', code: 'WU4', category: 'Wall', optionCapacity: 10, sizeSet: 8, quantityPerFixture: 80, linearFeet: 4, displayMethod: 'Shelved + Hang', status: 'Active' },
  { id: 'ft-om-05', name: 'Wall Unit (8ft)', code: 'WU8', category: 'Wall', optionCapacity: 20, sizeSet: 8, quantityPerFixture: 160, linearFeet: 8, displayMethod: 'Shelved + Hang', status: 'Active' },
  { id: 'ft-om-06', name: 'Gondola (4ft)', code: 'GD4', category: 'Island', optionCapacity: 8, sizeSet: 8, quantityPerFixture: 64, linearFeet: 4, displayMethod: 'Both-side', status: 'Active' },
  { id: 'ft-om-07', name: 'Gondola (8ft)', code: 'GD8', category: 'Island', optionCapacity: 16, sizeSet: 8, quantityPerFixture: 128, linearFeet: 8, displayMethod: 'Both-side', status: 'Active' },
  { id: 'ft-om-08', name: 'Nested Table', code: 'NT', category: 'Island', optionCapacity: 6, sizeSet: 8, quantityPerFixture: 48, linearFeet: 4, displayMethod: 'Folded stack', status: 'Active' },
  { id: 'ft-om-09', name: 'Display Table', code: 'DT', category: 'Island', optionCapacity: 4, sizeSet: 8, quantityPerFixture: 32, linearFeet: 4, displayMethod: 'Front display', status: 'Active' },
  { id: 'ft-om-10', name: 'Mannequin Platform', code: 'MP', category: 'Floor', optionCapacity: 2, sizeSet: 8, quantityPerFixture: 16, linearFeet: 3, displayMethod: 'Styled look', status: 'Active' },
  { id: 'ft-om-11', name: 'Waterfall Arm', code: 'WFA', category: 'Wall', optionCapacity: 3, sizeSet: 8, quantityPerFixture: 24, linearFeet: 2, displayMethod: 'Cascade', status: 'Active' },
  { id: 'ft-om-12', name: 'Slatwall Panel (4ft)', code: 'SWP', category: 'Wall', optionCapacity: 10, sizeSet: 8, quantityPerFixture: 80, linearFeet: 4, displayMethod: 'Grid display', status: 'Active' },
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
    storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', // Mumbai - Phoenix Mall (A+)
    carpetArea: 12938,
    saleableArea: 8450,
    saleableRatio: 65.3,
    deductions: { decompression: 420, mainAisles: 1680, trialRooms: 580, cashCounters: 340, stockroomStaff: 1468 },
    totalFixtures: 142,
    optionCapacity: 2024,
    garmentCapacity: 21682,
    spsf: 861,
    gmrof: 387,
  },
  {
    storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', // Delhi - Select Citywalk (A+)
    carpetArea: 12200,
    saleableArea: 7930,
    saleableRatio: 65.0,
    deductions: { decompression: 400, mainAisles: 1560, trialRooms: 540, cashCounters: 320, stockroomStaff: 1450 },
    totalFixtures: 134,
    optionCapacity: 1890,
    garmentCapacity: 20280,
    spsf: 845,
    gmrof: 372,
  },
  {
    storeId: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42', // Bangalore - UB City (A+)
    carpetArea: 10800,
    saleableArea: 7020,
    saleableRatio: 65.0,
    deductions: { decompression: 380, mainAisles: 1350, trialRooms: 480, cashCounters: 300, stockroomStaff: 1270 },
    totalFixtures: 118,
    optionCapacity: 1680,
    garmentCapacity: 17920,
    spsf: 828,
    gmrof: 365,
  },
  {
    storeId: '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75', // Chennai - Express Avenue (A1)
    carpetArea: 9500,
    saleableArea: 6080,
    saleableRatio: 64.0,
    deductions: { decompression: 350, mainAisles: 1200, trialRooms: 420, cashCounters: 280, stockroomStaff: 1170 },
    totalFixtures: 102,
    optionCapacity: 1440,
    garmentCapacity: 15360,
    spsf: 738,
    gmrof: 328,
  },
  {
    storeId: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97', // Hyderabad - Inorbit Mall (A1)
    carpetArea: 9100,
    saleableArea: 5824,
    saleableRatio: 64.0,
    deductions: { decompression: 340, mainAisles: 1150, trialRooms: 400, cashCounters: 260, stockroomStaff: 1126 },
    totalFixtures: 98,
    optionCapacity: 1380,
    garmentCapacity: 14720,
    spsf: 710,
    gmrof: 315,
  },
  {
    storeId: '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a', // Pune - Phoenix Marketcity (A1)
    carpetArea: 8800,
    saleableArea: 5632,
    saleableRatio: 64.0,
    deductions: { decompression: 330, mainAisles: 1100, trialRooms: 380, cashCounters: 250, stockroomStaff: 1108 },
    totalFixtures: 94,
    optionCapacity: 1320,
    garmentCapacity: 14080,
    spsf: 695,
    gmrof: 308,
  },
  {
    storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20', // Kolkata - Quest Mall (A2)
    carpetArea: 7800,
    saleableArea: 4914,
    saleableRatio: 63.0,
    deductions: { decompression: 300, mainAisles: 980, trialRooms: 340, cashCounters: 230, stockroomStaff: 1036 },
    totalFixtures: 82,
    optionCapacity: 1160,
    garmentCapacity: 12320,
    spsf: 522,
    gmrof: 268,
  },
  {
    storeId: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b', // Ahmedabad - Palladium (A2)
    carpetArea: 7500,
    saleableArea: 4725,
    saleableRatio: 63.0,
    deductions: { decompression: 290, mainAisles: 940, trialRooms: 320, cashCounters: 220, stockroomStaff: 1005 },
    totalFixtures: 78,
    optionCapacity: 1100,
    garmentCapacity: 11680,
    spsf: 498,
    gmrof: 255,
  },
  {
    storeId: '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20', // Jaipur - World Trade Park (A3)
    carpetArea: 6800,
    saleableArea: 4216,
    saleableRatio: 62.0,
    deductions: { decompression: 260, mainAisles: 850, trialRooms: 280, cashCounters: 200, stockroomStaff: 994 },
    totalFixtures: 70,
    optionCapacity: 980,
    garmentCapacity: 10400,
    spsf: 395,
    gmrof: 218,
  },
  {
    storeId: '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c', // Lucknow - Lulu Mall (A3)
    carpetArea: 6400,
    saleableArea: 3968,
    saleableRatio: 62.0,
    deductions: { decompression: 240, mainAisles: 800, trialRooms: 260, cashCounters: 190, stockroomStaff: 942 },
    totalFixtures: 66,
    optionCapacity: 920,
    garmentCapacity: 9760,
    spsf: 372,
    gmrof: 205,
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
  type: 'module' | 'segment' | 'brand-exit';
  categoryId: string;
  storeId: string;
  storeName: string;
  title: string;
  trigger: string;
  constraint: string;
  impact: string;
  spsfDelta: number;
}

export const spaceRecommendations: SpaceRecommendation[] = [
  {
    id: 'sr-01',
    type: 'module',
    categoryId: 'mens-casual',
    storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d',
    storeName: 'Mumbai - Phoenix Mall',
    title: 'Transfer 2 fixtures from Celio to Netplay',
    trigger: 'Celio GMROF ₹192 vs segment avg ₹358 — below 70% threshold for 2 quarters',
    constraint: 'External brand mix must stay ≥15% of store options',
    impact: 'Projected +₹18/SFT SPSF improvement in MC segment',
    spsfDelta: 18,
  },
  {
    id: 'sr-02',
    type: 'module',
    categoryId: 'womens-ethnic',
    storeId: '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75',
    storeName: 'Chennai - Express Avenue',
    title: 'Expand Avaasa wall units by 2 bays',
    trigger: 'Avaasa GMROF ₹425 exceeds module avg by 1.3× — above 1.2× rebalance trigger',
    constraint: 'Wall fixture capacity: 8 bays available, currently using 6',
    impact: 'Projected +₹14/SFT SPSF improvement in WIW segment',
    spsfDelta: 14,
  },
  {
    id: 'sr-03',
    type: 'segment',
    categoryId: 'kids-wear',
    storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d',
    storeName: 'Mumbai - Phoenix Mall',
    title: 'Reduce Kidswear from 16% to 13%, reallocate to WIW',
    trigger: 'Kidswear efficiency 0.69 — below 0.8 threshold for 3 consecutive months',
    constraint: 'Minimum 12% floor for kidswear per brand guidelines',
    impact: 'Projected +₹22/SFT store-level SPSF uplift',
    spsfDelta: 22,
  },
  {
    id: 'sr-04',
    type: 'segment',
    categoryId: 'mens-formal',
    storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b',
    storeName: 'Delhi - Select Citywalk',
    title: 'Increase Menswear Formal from 20% to 23%',
    trigger: 'MF NSV% 19.8 exceeds space% 20.0 for 2 months — expansion trigger met',
    constraint: 'Reallocation from KW (15% → 12%) within minimum floor',
    impact: 'Projected +₹15/SFT SPSF improvement across segments',
    spsfDelta: 15,
  },
  {
    id: 'sr-05',
    type: 'brand-exit',
    categoryId: 'mens-casual',
    storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20',
    storeName: 'Kolkata - Quest Mall',
    title: 'Exit Celio, replace with Performax expansion',
    trigger: 'Celio GMROF ₹192 — below 70% of segment avg (₹258) for 2 quarters',
    constraint: 'External brand mix at 38%, exit keeps it above 15% floor',
    impact: 'Projected +₹28/SFT from replacing low-GMROF EB with high-GMROF PL',
    spsfDelta: 28,
  },
  {
    id: 'sr-06',
    type: 'brand-exit',
    categoryId: 'womens-ethnic',
    storeId: '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20',
    storeName: 'Jaipur - World Trade Park',
    title: 'Exit Soch, expand Global Desi allocation',
    trigger: 'Soch GMROF ₹188 — below 70% of segment avg (₹248) for 3 quarters',
    constraint: 'External brand mix currently 35%, exit brings to 30% — above 15% floor',
    impact: 'Projected +₹20/SFT from brand replacement',
    spsfDelta: 20,
  },
  {
    id: 'sr-07',
    type: 'brand-exit',
    categoryId: 'kids-wear',
    storeId: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b',
    storeName: 'Ahmedabad - Palladium',
    title: 'Exit Gini & Jony, consolidate Juniors range',
    trigger: 'Gini & Jony GMROF ₹165 — below 70% of segment avg (₹218) for 2 quarters',
    constraint: 'External brand mix at 22%, exit brings to 15% — at minimum floor',
    impact: 'Projected +₹16/SFT from consolidation',
    spsfDelta: 16,
  },
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
  { grade: 'A', stores: 3, fyRevCr: 510, monthlyUnitsLabel: '4.25 L', inStoreStockLabel: '12.75 L', sharePercent: 34, perStore: 170 },
  { grade: 'A1', stores: 3, fyRevCr: 420, monthlyUnitsLabel: '3.50 L', inStoreStockLabel: '10.50 L', sharePercent: 28, perStore: 140 },
  { grade: 'A2', stores: 2, fyRevCr: 310, monthlyUnitsLabel: '2.58 L', inStoreStockLabel: '7.75 L', sharePercent: 21, perStore: 155 },
  { grade: 'A3', stores: 2, fyRevCr: 260, monthlyUnitsLabel: '2.17 L', inStoreStockLabel: '6.50 L', sharePercent: 17, perStore: 130 },
];

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

// ── Sprint: 8-Step Allocation Process Flow ──

export interface AllocationProcessStep {
  step: number;
  name: string;
  status: 'complete' | 'warning' | 'in-progress';
  outputSummary: string;
  detail: string;
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

  const splits = storeFashionSplits[storeId];
  const fashionWarning = splits
    ? splits.some(s => {
        const ffPct = s.fastFashion;
        const maxFf = fashionGradeRules.find(r => r.grade === 'APL-Fast Fashion');
        return maxFf ? ffPct > maxFf.targetMax : false;
      })
    : false;

  const pendingRecs = spaceRecommendations.filter(r => r.storeId === storeId).length;

  return [
    {
      step: 1, name: 'Compute Store GMROF', status: 'complete',
      outputSummary: `GMROF: Rs${profile.gmrof}/SFT`,
      detail: `Store-level Gross Margin Return on Footage calculated from total GM divided by saleable area (${profile.saleableArea.toLocaleString()} SFT).`,
    },
    {
      step: 2, name: 'Compute Segment GMROF', status: 'complete',
      outputSummary: topSegment ? `Top: ${topSegment.segmentCode} (Rs${topSegment.gmrof})` : 'Computed',
      detail: `GMROF computed for each merchandise segment. ${allocs.length} segments ranked by margin density.`,
    },
    {
      step: 3, name: 'Compute Brand GMROF', status: 'complete',
      outputSummary: `${Object.values(categoryBrands).flat().length} brands ranked`,
      detail: 'Brand-level GMROF calculated within each segment. PL and EB brands ranked separately by margin contribution.',
    },
    {
      step: 4, name: 'Set Fixture Allocation', status: 'complete',
      outputSummary: `${fixtures.length} fixtures distributed`,
      detail: `Fixtures allocated proportionally to segment GMROF rankings. Total ${fixtures.length} fixtures across ${allocs.length} segments.`,
    },
    {
      step: 5, name: 'Apply Fixture Capacity', status: overflows > 0 ? 'warning' : 'complete',
      outputSummary: overflows > 0 ? `${overflows} overflows detected` : 'Zero overflows',
      detail: overflows > 0
        ? `${overflows} fixtures exceed maximum capacity. Review fixture assignments and consider rebalancing.`
        : 'All fixtures within capacity limits. No overflow conditions detected.',
    },
    {
      step: 6, name: 'Apply Fashion Grade Split', status: fashionWarning ? 'warning' : 'complete',
      outputSummary: fashionWarning ? 'Split deviation detected' : 'Compliant',
      detail: fashionWarning
        ? 'One or more fashion grades exceed the configured maximum percentage. Review fashion grade allocation rules.'
        : 'Fashion grade split is within configured thresholds for all grades.',
    },
    {
      step: 7, name: 'Compute Projected SPSF', status: 'complete',
      outputSummary: `Rs${profile.spsf} (target: Rs${spsfTargets.find(t => t.grade === mapToOMGrade('A'))?.target || 'N/A'})`,
      detail: `Sales Per Square Foot projected from current sales velocity and allocated space. Current SPSF is Rs${profile.spsf}/SFT.`,
    },
    {
      step: 8, name: 'Iterate & Optimize', status: pendingRecs > 0 ? 'in-progress' : 'complete',
      outputSummary: pendingRecs > 0 ? `${pendingRecs} recs pending` : 'Optimized',
      detail: pendingRecs > 0
        ? `${pendingRecs} optimization recommendations pending review. Apply or dismiss to complete this step.`
        : 'All optimization recommendations have been addressed.',
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
  netFixtureChange: number;
}

export function simulateRecommendation(recId: string): SimulationResult | null {
  const rec = spaceRecommendations.find(r => r.id === recId);
  if (!rec) return null;

  const baseGmrof = 358;
  const baseSpsf = 861;
  const delta = rec.spsfDelta;
  const fixtureDelta = rec.type === 'brand-exit' ? -2 : rec.type === 'module' ? 0 : -1;

  return {
    recId,
    title: rec.title,
    metrics: [
      { label: 'Module GMROF', current: baseGmrof, projected: baseGmrof + Math.round(delta * 0.8), delta: Math.round(delta * 0.8), unit: 'Rs/SFT' },
      { label: 'Store SPSF', current: baseSpsf, projected: baseSpsf + delta, delta, unit: 'Rs/SFT' },
      { label: 'Segment Fixtures', current: 34, projected: 34 + fixtureDelta, delta: fixtureDelta, unit: 'units' },
    ],
    netFixtureChange: fixtureDelta,
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
