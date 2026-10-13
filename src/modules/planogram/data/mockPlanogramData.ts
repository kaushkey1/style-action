// Mock data for Planogram module

export interface PlanogramData {
  site: string;
  brand_id: string;
  brand_id_desc: string;
  fashion_grade: string;
  fashion_grade_description: string;
  mh_segment_cd: string;
  mh_segment_desc: string;
  mh_brick_desc: string;
  plan_options: number;
  plan_qty: number;
  // Tracking fields
  previous_options?: number;
  previous_qty?: number;
  change_percentage?: number;
  comments?: string;
}

export interface Brand {
  id: string;
  name: string;
  totalSites: number;
  totalOptions: number;
  totalQuantity: number;
  lastUpdated: string;
  lastUpdatedBy: string;
}

export interface PlanogramSummary {
  brandId: string;
  brandName: string;
  totalSites: number;
  totalOptions: number;
  totalQuantity: number;
  fashionGradeMix: {
    core: number;
    fashion: number;
    premium: number;
  };
  lastUpdated: string;
  lastUpdatedBy: string;
}

// Mock brands list
export const mockBrands: Brand[] = [
  {
    id: 'DNMX',
    name: 'DNMX',
    totalSites: 142,
    totalOptions: 3456,
    totalQuantity: 245000,
    lastUpdated: '2026-04-02',
    lastUpdatedBy: 'Rahul V.'
  },
  {
    id: 'JOHN_PLAYERS',
    name: 'John Players',
    totalSites: 128,
    totalOptions: 2890,
    totalQuantity: 198000,
    lastUpdated: '2026-04-01',
    lastUpdatedBy: 'Priya K.'
  },
  {
    id: 'NETPLAY',
    name: 'Netplay',
    totalSites: 98,
    totalOptions: 2100,
    totalQuantity: 156000,
    lastUpdated: '2026-03-30',
    lastUpdatedBy: 'Anand T.'
  },
  {
    id: 'RIO',
    name: 'Rio',
    totalSites: 156,
    totalOptions: 4200,
    totalQuantity: 312000,
    lastUpdated: '2026-04-03',
    lastUpdatedBy: 'Deepa R.'
  },
  {
    id: 'FIG',
    name: 'Fig',
    totalSites: 112,
    totalOptions: 3100,
    totalQuantity: 225000,
    lastUpdated: '2026-03-29',
    lastUpdatedBy: 'Deepa R.'
  },
  {
    id: 'AVAASA',
    name: 'Avaasa',
    totalSites: 134,
    totalOptions: 3800,
    totalQuantity: 278000,
    lastUpdated: '2026-04-02',
    lastUpdatedBy: 'Deepa R.'
  },
  {
    id: 'TEAMSPIRIT',
    name: 'Teamspirit',
    totalSites: 89,
    totalOptions: 1950,
    totalQuantity: 134000,
    lastUpdated: '2026-03-28',
    lastUpdatedBy: 'Priya K.'
  },
  {
    id: 'LEE_COOPER',
    name: 'Lee Cooper',
    totalSites: 76,
    totalOptions: 1680,
    totalQuantity: 112000,
    lastUpdated: '2026-03-31',
    lastUpdatedBy: 'Priya K.'
  }
];

// Generate mock planogram data for a brand
export function generatePlanogramData(brandId: string): PlanogramData[] {
  const brand = mockBrands.find(b => b.id === brandId);
  if (!brand) return [];

  const sites = [
    { code: 'S001', name: 'Phoenix Mall' },
    { code: 'S002', name: 'Inorbit Mall' },
    { code: 'S003', name: 'Forum Mall' },
    { code: 'S004', name: 'City Centre' },
    { code: 'S005', name: 'Express Avenue' },
    { code: 'S006', name: 'VR Mall' },
    { code: 'S007', name: 'Orion Mall' },
    { code: 'S008', name: 'Pacific Mall' },
    { code: 'S009', name: 'Nexus Mall' },
    { code: 'S010', name: 'Select City Walk' },
  ];

  const segments = [
    { code: 'MW', desc: 'Menswear' },
    { code: 'WW', desc: 'Womenswear' },
    { code: 'KW', desc: 'Kidswear' },
    { code: 'ACC', desc: 'Accessories' },
  ];

  const fashionGrades = [
    { grade: 'Core', desc: 'Core Replenishment' },
    { grade: 'Fashion', desc: 'Fashion Forward' },
    { grade: 'Premium', desc: 'Premium Collection' },
  ];

  const bricks = [
    'Shirts',
    'T-Shirts',
    'Jeans',
    'Trousers',
    'Dresses',
    'Tops',
    'Kurtas',
    'Bottoms',
  ];

  const planogramData: PlanogramData[] = [];

  // Generate data for each site
  const numSites = Math.min(sites.length, Math.floor(brand.totalSites / 10));
  for (let i = 0; i < numSites; i++) {
    const site = sites[i];
    const segment = segments[i % segments.length];
    const fashionGrade = fashionGrades[i % fashionGrades.length];
    const brick = bricks[i % bricks.length];

    if (!site || !segment || !fashionGrade || !brick) continue;

    const baseOptions = Math.floor(brand.totalOptions / numSites);
    const baseQty = Math.floor(brand.totalQuantity / numSites);

    planogramData.push({
      site: site.code,
      brand_id: brandId,
      brand_id_desc: brand.name,
      fashion_grade: fashionGrade.grade,
      fashion_grade_description: fashionGrade.desc,
      mh_segment_cd: segment.code,
      mh_segment_desc: segment.desc,
      mh_brick_desc: brick,
      plan_options: baseOptions + Math.floor(Math.random() * 50),
      plan_qty: baseQty + Math.floor(Math.random() * 5000),
      previous_options: baseOptions,
      previous_qty: baseQty,
      change_percentage: 0,
      comments: ''
    });
  }

  return planogramData;
}

// Get summary for a brand
export function getBrandSummary(brandId: string): PlanogramSummary | null {
  const brand = mockBrands.find(b => b.id === brandId);
  if (!brand) return null;

  return {
    brandId: brand.id,
    brandName: brand.name,
    totalSites: brand.totalSites,
    totalOptions: brand.totalOptions,
    totalQuantity: brand.totalQuantity,
    fashionGradeMix: {
      core: 45,
      fashion: 35,
      premium: 20
    },
    lastUpdated: brand.lastUpdated,
    lastUpdatedBy: brand.lastUpdatedBy
  };
}

// Recent upload history
export interface UploadHistory {
  id: string;
  brandId: string;
  brandName: string;
  uploadedAt: string;
  uploadedBy: string;
  status: 'success' | 'partial' | 'failed';
  sitesAffected: number;
  optionsChanged: number;
  quantityChanged: number;
}

export const mockUploadHistory: UploadHistory[] = [
  {
    id: 'UPL-001',
    brandId: 'DNMX',
    brandName: 'DNMX',
    uploadedAt: '2026-04-02 14:30',
    uploadedBy: 'Rahul V.',
    status: 'success',
    sitesAffected: 45,
    optionsChanged: 120,
    quantityChanged: 8500
  },
  {
    id: 'UPL-002',
    brandId: 'RIO',
    brandName: 'Rio',
    uploadedAt: '2026-04-02 11:15',
    uploadedBy: 'Deepa R.',
    status: 'success',
    sitesAffected: 38,
    optionsChanged: 95,
    quantityChanged: 6200
  },
  {
    id: 'UPL-003',
    brandId: 'JOHN_PLAYERS',
    brandName: 'John Players',
    uploadedAt: '2026-04-01 16:45',
    uploadedBy: 'Priya K.',
    status: 'partial',
    sitesAffected: 22,
    optionsChanged: 56,
    quantityChanged: 3400
  }
];