export type DropStage =
  | 'Range'
  | 'Sample'
  | 'Cost'
  | 'PO'
  | 'Fabric'
  | 'Production'
  | 'QC'
  | 'Ship'
  | 'DC'
  | 'Store'
  | 'Selling';

export type DropStageStatus = 'completed' | 'active' | 'blocked' | 'upcoming';

export interface DropStageDetail {
  stage: DropStage;
  status: DropStageStatus;
  date?: string;
  note?: string;
}

export interface Drop {
  id: string;
  name: string;
  category: string;
  season: string;
  totalStyles: number;
  totalUnits: number;
  stages: DropStageDetail[];
  targetStores: number;
  revenue_projection_cr: number;
}

export const dropStages: DropStage[] = [
  'Range', 'Sample', 'Cost', 'PO', 'Fabric', 'Production', 'QC', 'Ship', 'DC', 'Store', 'Selling',
];

export const mockDrops: Drop[] = [
  {
    id: 'd1a2b3c4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    name: 'AW26 Menswear Core Drop 1',
    category: 'Menswear Casual',
    season: 'AW26',
    totalStyles: 45,
    totalUnits: 28000,
    stages: [
      { stage: 'Range', status: 'completed', date: '2026-01-10' },
      { stage: 'Sample', status: 'completed', date: '2026-01-20' },
      { stage: 'Cost', status: 'completed', date: '2026-01-25' },
      { stage: 'PO', status: 'completed', date: '2026-01-30' },
      { stage: 'Fabric', status: 'active', date: '2026-02-10', note: 'Fabric dispatch delayed for 8 styles' },
      { stage: 'Production', status: 'upcoming' },
      { stage: 'QC', status: 'upcoming' },
      { stage: 'Ship', status: 'upcoming' },
      { stage: 'DC', status: 'upcoming' },
      { stage: 'Store', status: 'upcoming' },
      { stage: 'Selling', status: 'upcoming' },
    ],
    targetStores: 120,
    revenue_projection_cr: 8.5,
  },
  {
    id: 'd2b3c4d5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    name: 'SS26 Womenswear Western Drop 3',
    category: 'Womenswear Western',
    season: 'SS26',
    totalStyles: 32,
    totalUnits: 19200,
    stages: [
      { stage: 'Range', status: 'completed', date: '2025-12-15' },
      { stage: 'Sample', status: 'completed', date: '2025-12-28' },
      { stage: 'Cost', status: 'completed', date: '2026-01-05' },
      { stage: 'PO', status: 'completed', date: '2026-01-10' },
      { stage: 'Fabric', status: 'completed', date: '2026-01-18' },
      { stage: 'Production', status: 'completed', date: '2026-02-01' },
      { stage: 'QC', status: 'blocked', note: 'QC failure on lot #L-8834 — re-inspection scheduled' },
      { stage: 'Ship', status: 'upcoming' },
      { stage: 'DC', status: 'upcoming' },
      { stage: 'Store', status: 'upcoming' },
      { stage: 'Selling', status: 'upcoming' },
    ],
    targetStores: 85,
    revenue_projection_cr: 5.2,
  },
  {
    id: 'd3c4d5e6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    name: 'SS26 Womenswear Ethnic Drop 5',
    category: 'Womenswear Ethnic',
    season: 'SS26',
    totalStyles: 28,
    totalUnits: 16800,
    stages: [
      { stage: 'Range', status: 'completed', date: '2025-12-01' },
      { stage: 'Sample', status: 'completed', date: '2025-12-15' },
      { stage: 'Cost', status: 'completed', date: '2025-12-20' },
      { stage: 'PO', status: 'completed', date: '2025-12-28' },
      { stage: 'Fabric', status: 'completed', date: '2026-01-08' },
      { stage: 'Production', status: 'completed', date: '2026-01-25' },
      { stage: 'QC', status: 'completed', date: '2026-02-05' },
      { stage: 'Ship', status: 'completed', date: '2026-02-08' },
      { stage: 'DC', status: 'active', date: '2026-02-14' },
      { stage: 'Store', status: 'upcoming' },
      { stage: 'Selling', status: 'upcoming' },
    ],
    targetStores: 60,
    revenue_projection_cr: 4.8,
  },
  {
    id: 'd4d5e6f7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    name: 'SS26 Footwear Core Replenishment',
    category: 'Footwear',
    season: 'SS26',
    totalStyles: 15,
    totalUnits: 45000,
    stages: [
      { stage: 'Range', status: 'completed', date: '2025-11-15' },
      { stage: 'Sample', status: 'completed', date: '2025-11-25' },
      { stage: 'Cost', status: 'completed', date: '2025-12-01' },
      { stage: 'PO', status: 'completed', date: '2025-12-10' },
      { stage: 'Fabric', status: 'completed', date: '2025-12-18' },
      { stage: 'Production', status: 'completed', date: '2026-01-15' },
      { stage: 'QC', status: 'completed', date: '2026-01-28' },
      { stage: 'Ship', status: 'completed', date: '2026-02-01' },
      { stage: 'DC', status: 'completed', date: '2026-02-08' },
      { stage: 'Store', status: 'completed', date: '2026-02-12' },
      { stage: 'Selling', status: 'active', note: 'Sell-through at 34% after 4 days' },
    ],
    targetStores: 150,
    revenue_projection_cr: 12.0,
  },
  {
    id: 'd5e6f7a8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
    name: 'AW26 Micro-Drop Trendy Jackets',
    category: 'Menswear Casual',
    season: 'AW26',
    totalStyles: 5,
    totalUnits: 2500,
    stages: [
      { stage: 'Range', status: 'completed', date: '2026-02-01' },
      { stage: 'Sample', status: 'active', note: 'Virtual samples in review' },
      { stage: 'Cost', status: 'upcoming' },
      { stage: 'PO', status: 'upcoming' },
      { stage: 'Fabric', status: 'upcoming' },
      { stage: 'Production', status: 'upcoming' },
      { stage: 'QC', status: 'upcoming' },
      { stage: 'Ship', status: 'upcoming' },
      { stage: 'DC', status: 'upcoming' },
      { stage: 'Store', status: 'upcoming' },
      { stage: 'Selling', status: 'upcoming' },
    ],
    targetStores: 25,
    revenue_projection_cr: 1.2,
  },
];
