// ---------------------------------------------------------------------------
// Business Pulse Charts
// ---------------------------------------------------------------------------

export const monthlyRevenueData = [
  { month: 'Oct', actual: 1050, target: 1100 },
  { month: 'Nov', actual: 1120, target: 1100 },
  { month: 'Dec', actual: 1200, target: 1150 },
  { month: 'Jan', actual: 1180, target: 1200 },
  { month: 'Feb', actual: 1140, target: 1200 },
  { month: 'Mar', actual: 1080, target: 1250 },
];

export const categoryRevenueData = [
  { name: 'Menswear', value: 33, revenue: 188 },
  { name: 'Women Indian', value: 20, revenue: 116 },
  { name: 'Women Western', value: 19, revenue: 108 },
  { name: 'Kids', value: 14, revenue: 80 },
  { name: 'Non-Apparel', value: 14, revenue: 80 },
];

export { CHART_SEQUENTIAL as CATEGORY_COLORS } from '@/data/chartColors';

/** Drill-down: sub-category breakdown per category */
export const categoryDrilldown: Record<string, { name: string; value: number; revenue: number }[]> = {
  Menswear: [
    { name: 'Casuals', value: 38, revenue: 71 },
    { name: 'Formals', value: 22, revenue: 41 },
    { name: 'Ethnic', value: 18, revenue: 34 },
    { name: 'Denim', value: 14, revenue: 26 },
    { name: 'Innerwear', value: 8, revenue: 16 },
  ],
  'Women Indian': [
    { name: 'Kurtas', value: 32, revenue: 37 },
    { name: 'Sarees & Dupattas', value: 28, revenue: 32 },
    { name: 'Lehengas', value: 20, revenue: 23 },
    { name: 'Salwar Sets', value: 12, revenue: 14 },
    { name: 'Blouses', value: 8, revenue: 10 },
  ],
  'Women Western': [
    { name: 'Tops', value: 30, revenue: 32 },
    { name: 'Dresses', value: 25, revenue: 27 },
    { name: 'Bottoms', value: 22, revenue: 24 },
    { name: 'Outerwear', value: 15, revenue: 16 },
    { name: 'Activewear', value: 8, revenue: 9 },
  ],
  Kids: [
    { name: 'Boys Casual', value: 35, revenue: 28 },
    { name: 'Girls Casual', value: 30, revenue: 24 },
    { name: 'Infant', value: 20, revenue: 16 },
    { name: 'School Uniform', value: 15, revenue: 12 },
  ],
  'Non-Apparel': [
    { name: 'Footwear', value: 40, revenue: 32 },
    { name: 'Accessories', value: 30, revenue: 24 },
    { name: 'Home & Living', value: 20, revenue: 16 },
    { name: 'Beauty', value: 10, revenue: 8 },
  ],
};

/** Nested table: Category → Class hierarchy */
export interface CategoryRow {
  name: string;
  revenue: number;
  gm: number;
  sellThrough: number;
  aged: number;
  fresh: number;
  children?: CategoryRow[];
}

export const revenueByCategoryNested: CategoryRow[] = [
  {
    name: 'Menswear', revenue: 188, gm: 43.0, sellThrough: 70, aged: 17, fresh: 56,
    children: [
      { name: 'Casuals', revenue: 71, gm: 44.2, sellThrough: 74, aged: 14, fresh: 62, children: [
        { name: 'T-Shirts', revenue: 28, gm: 45.0, sellThrough: 78, aged: 10, fresh: 68 },
        { name: 'Polos', revenue: 22, gm: 44.5, sellThrough: 72, aged: 14, fresh: 60 },
        { name: 'Shorts', revenue: 12, gm: 43.0, sellThrough: 70, aged: 16, fresh: 58 },
        { name: 'Joggers', revenue: 9, gm: 42.8, sellThrough: 68, aged: 18, fresh: 56 },
      ]},
      { name: 'Formals', revenue: 41, gm: 42.8, sellThrough: 68, aged: 18, fresh: 52, children: [
        { name: 'Shirts', revenue: 18, gm: 43.5, sellThrough: 70, aged: 16, fresh: 54 },
        { name: 'Trousers', revenue: 14, gm: 42.0, sellThrough: 66, aged: 20, fresh: 50 },
        { name: 'Blazers', revenue: 9, gm: 42.5, sellThrough: 64, aged: 22, fresh: 48 },
      ]},
      { name: 'Ethnic', revenue: 34, gm: 38.5, sellThrough: 58, aged: 28, fresh: 42, children: [
        { name: 'Kurtas', revenue: 20, gm: 39.0, sellThrough: 60, aged: 26, fresh: 44 },
        { name: 'Sherwanis', revenue: 8, gm: 36.5, sellThrough: 52, aged: 34, fresh: 36 },
        { name: 'Nehru Jackets', revenue: 6, gm: 40.0, sellThrough: 58, aged: 24, fresh: 46 },
      ]},
      { name: 'Denim', revenue: 26, gm: 45.1, sellThrough: 72, aged: 12, fresh: 64 },
      { name: 'Innerwear', revenue: 16, gm: 48.0, sellThrough: 82, aged: 6, fresh: 78 },
    ],
  },
  {
    name: 'Women Indian', revenue: 116, gm: 39.1, sellThrough: 59, aged: 27, fresh: 43,
    children: [
      { name: 'Kurtas', revenue: 37, gm: 41.2, sellThrough: 64, aged: 22, fresh: 48, children: [
        { name: 'Cotton Kurtas', revenue: 16, gm: 42.0, sellThrough: 68, aged: 18, fresh: 52 },
        { name: 'Silk Kurtas', revenue: 12, gm: 39.5, sellThrough: 58, aged: 26, fresh: 44 },
        { name: 'Printed Kurtas', revenue: 9, gm: 43.0, sellThrough: 66, aged: 20, fresh: 50 },
      ]},
      { name: 'Sarees & Dupattas', revenue: 32, gm: 36.8, sellThrough: 52, aged: 30, fresh: 38, children: [
        { name: 'Silk Sarees', revenue: 14, gm: 35.0, sellThrough: 48, aged: 34, fresh: 32 },
        { name: 'Cotton Sarees', revenue: 10, gm: 38.0, sellThrough: 56, aged: 26, fresh: 42 },
        { name: 'Dupattas', revenue: 8, gm: 40.0, sellThrough: 60, aged: 24, fresh: 46 },
      ]},
      { name: 'Lehengas', revenue: 23, gm: 35.4, sellThrough: 48, aged: 34, fresh: 32 },
      { name: 'Salwar Sets', revenue: 14, gm: 42.0, sellThrough: 66, aged: 20, fresh: 50 },
      { name: 'Blouses', revenue: 10, gm: 44.5, sellThrough: 72, aged: 15, fresh: 58 },
    ],
  },
  {
    name: 'Women Western', revenue: 108, gm: 42.8, sellThrough: 68, aged: 17, fresh: 55,
    children: [
      { name: 'Tops', revenue: 32, gm: 43.5, sellThrough: 72, aged: 14, fresh: 60 },
      { name: 'Dresses', revenue: 27, gm: 44.2, sellThrough: 70, aged: 16, fresh: 56 },
      { name: 'Bottoms', revenue: 24, gm: 42.0, sellThrough: 66, aged: 18, fresh: 52 },
      { name: 'Outerwear', revenue: 16, gm: 40.5, sellThrough: 62, aged: 22, fresh: 48 },
      { name: 'Activewear', revenue: 9, gm: 46.0, sellThrough: 78, aged: 8, fresh: 72 },
    ],
  },
  {
    name: 'Kids', revenue: 80, gm: 41.8, sellThrough: 75, aged: 12, fresh: 63,
    children: [
      { name: 'Boys Casual', revenue: 28, gm: 42.5, sellThrough: 78, aged: 10, fresh: 68 },
      { name: 'Girls Casual', revenue: 24, gm: 43.0, sellThrough: 76, aged: 11, fresh: 65 },
      { name: 'Infant', revenue: 16, gm: 39.5, sellThrough: 70, aged: 15, fresh: 58 },
      { name: 'School Uniform', revenue: 12, gm: 40.0, sellThrough: 72, aged: 14, fresh: 60 },
    ],
  },
  {
    name: 'Non-Apparel', revenue: 80, gm: 44.6, sellThrough: 68, aged: 17, fresh: 57,
    children: [
      { name: 'Footwear', revenue: 32, gm: 46.2, sellThrough: 72, aged: 14, fresh: 62 },
      { name: 'Accessories', revenue: 24, gm: 48.0, sellThrough: 74, aged: 12, fresh: 66 },
      { name: 'Home & Living', revenue: 16, gm: 36.8, sellThrough: 56, aged: 32, fresh: 38 },
      { name: 'Beauty', revenue: 8, gm: 52.0, sellThrough: 80, aged: 6, fresh: 78 },
    ],
  },
  {
    name: 'External Brands', revenue: 66, gm: 33.5, sellThrough: 67, aged: 21, fresh: 50,
    children: [
      { name: 'H&M', revenue: 22, gm: 34.0, sellThrough: 70, aged: 18, fresh: 54 },
      { name: 'GAP', revenue: 18, gm: 35.2, sellThrough: 68, aged: 20, fresh: 52 },
      { name: 'Marks & Spencer', revenue: 14, gm: 32.8, sellThrough: 65, aged: 24, fresh: 46 },
      { name: 'Others', revenue: 12, gm: 30.5, sellThrough: 62, aged: 26, fresh: 44 },
    ],
  },
];

export const revenueByCategory = [
  { name: 'Menswear', revenue: 188, gm: 43.0, sellThrough: 70, aged: 17, fresh: 56 },
  { name: 'Women Indian', revenue: 116, gm: 39.1, sellThrough: 59, aged: 27, fresh: 43 },
  { name: 'Women Western', revenue: 108, gm: 42.8, sellThrough: 68, aged: 17, fresh: 55 },
  { name: 'Kids', revenue: 80, gm: 41.8, sellThrough: 75, aged: 12, fresh: 63 },
  { name: 'Non-Apparel', revenue: 80, gm: 44.6, sellThrough: 68, aged: 17, fresh: 57 },
  { name: 'External Brands', revenue: 66, gm: 33.5, sellThrough: 67, aged: 21, fresh: 50 },
];

// ---------------------------------------------------------------------------
// Financial Charts
// ---------------------------------------------------------------------------

export const marginFlowData = [
  { stage: 'Intake Margin', value: 52.4 },
  { stage: 'Markdown Impact', value: -10.7 },
  { stage: 'Gross Margin', value: 41.7 },
];

export const otbConsumptionData = [{ name: 'OTB', consumed: 80, total: 100 }];

// ---------------------------------------------------------------------------
// Inventory Health Charts
// ---------------------------------------------------------------------------

export const inventoryAgeData = [
  { category: 'Menswear', '<30d': 42, '31-90d': 25, '91-180d': 16, '>180d': 17 },
  { category: 'Women Indian', '<30d': 28, '31-90d': 22, '91-180d': 23, '>180d': 27 },
  { category: 'Women Western', '<30d': 38, '31-90d': 27, '91-180d': 18, '>180d': 17 },
  { category: 'Kids', '<30d': 45, '31-90d': 28, '91-180d': 15, '>180d': 12 },
  { category: 'Non-Apparel', '<30d': 36, '31-90d': 24, '91-180d': 23, '>180d': 17 },
];

export const inventoryByCategoryData = [
  { name: 'Menswear', value: 620, status: 'warning' },
  { name: 'Women Indian', value: 480, status: 'critical' },
  { name: 'Women Western', value: 380, status: 'on_track' },
  { name: 'Kids', value: 290, status: 'on_track' },
  { name: 'Non-Apparel', value: 334, status: 'warning' },
];

// ---------------------------------------------------------------------------
// Geography Charts
// ---------------------------------------------------------------------------

export const regionRevenueData = [
  { zone: 'West Metro', revenue: 18.2, avg: 12.5 },
  { zone: 'North Metro', revenue: 15.8, avg: 12.5 },
  { zone: 'South Metro', revenue: 14.1, avg: 12.5 },
  { zone: 'East Metro', revenue: 5.8, avg: 12.5 },
  { zone: 'Tier-1', revenue: 12.4, avg: 12.5 },
  { zone: 'Tier-2', revenue: 7.7, avg: 12.5 },
];

export const storeMixData = [
  { name: 'Metro', value: 35, stores: 928 },
  { name: 'Tier-1', value: 30, stores: 796 },
  { name: 'Tier-2', value: 25, stores: 664 },
  { name: 'Tier-3', value: 10, stores: 265 },
];

export { CHART_SEQUENTIAL as STORE_MIX_COLORS } from '@/data/chartColors';

// ---------------------------------------------------------------------------
// Categories Charts
// ---------------------------------------------------------------------------

export const sellThroughByCategoryData = [
  { category: 'Kids', sellThrough: 75, target: 70 },
  { category: 'Menswear', sellThrough: 70, target: 70 },
  { category: 'Women Western', sellThrough: 68, target: 70 },
  { category: 'Non-Apparel', sellThrough: 68, target: 70 },
  { category: 'External Brands', sellThrough: 67, target: 70 },
  { category: 'Women Indian', sellThrough: 59, target: 70 },
];

export const categoryHealthData = [
  { category: 'Menswear', sellThrough: 70, aged: 17 },
  { category: 'Women Indian', sellThrough: 59, aged: 27 },
  { category: 'Women Western', sellThrough: 68, aged: 17 },
  { category: 'Kids', sellThrough: 75, aged: 12 },
  { category: 'Non-Apparel', sellThrough: 68, aged: 17 },
  { category: 'Ext. Brands', sellThrough: 67, aged: 21 },
];

// ---------------------------------------------------------------------------
// Operations Charts
// ---------------------------------------------------------------------------

export const vendorPerformanceData = [
  { vendor: 'V-067', fillRate: 72, otif: 65 },
  { vendor: 'V-023', fillRate: 81, otif: 74 },
  { vendor: 'V-112', fillRate: 88, otif: 82 },
  { vendor: 'V-045', fillRate: 92, otif: 88 },
  { vendor: 'V-089', fillRate: 96, otif: 93 },
];

export const procurementPipelineData = [
  { week: 'W1', openPRs: 45, openPOs: 120, grnPending: 30 },
  { week: 'W2', openPRs: 38, openPOs: 135, grnPending: 42 },
  { week: 'W3', openPRs: 52, openPOs: 110, grnPending: 55 },
  { week: 'W4', openPRs: 30, openPOs: 145, grnPending: 38 },
];

// ---------------------------------------------------------------------------
// Domain KPI definitions per tab
// ---------------------------------------------------------------------------

export interface DomainKpi {
  label: string;
  value: string;
  target: string;
  status: 'on_track' | 'warning' | 'critical';
}

export const tabDomainKpis: Record<string, DomainKpi[]> = {
  'business-pulse': [
    { label: 'Revenue Run Rate', value: '₹74 Cr/day', target: '₹100 Cr/day', status: 'critical' },
    { label: 'Net Revenue vs Plan', value: '92%', target: '≥100%', status: 'warning' },
    { label: 'Avg Sell-Through', value: '68%', target: '≥70%', status: 'critical' },
  ],
  financial: [
    { label: 'Gross Revenue vs Target', value: '₹1,110 Cr', target: '₹1,500 Cr', status: 'warning' },
    { label: 'Intake Margin %', value: '52.4%', target: '≥50%', status: 'on_track' },
    { label: 'Markdown %', value: '18.2%', target: '<15%', status: 'warning' },
    { label: 'OTB Consumption', value: '80%', target: '<95%', status: 'on_track' },
  ],
  'inventory-health': [
    { label: 'Total Inventory', value: '₹2,104 Cr', target: '-', status: 'warning' },
    { label: 'Aged Stock >180d', value: '₹262 Cr (13.85%)', target: '<10.5%', status: 'critical' },
    { label: 'Inventory Turns', value: '4.2x', target: '≥5x', status: 'warning' },
    { label: 'Fresh Inventory', value: '70%', target: '≥65%', status: 'on_track' },
  ],
  geography: [
    { label: 'Active Stores', value: '2,653', target: '-', status: 'on_track' },
    { label: 'Avg Rev/Store', value: '₹2.8 L/day', target: '₹3.0 L/day', status: 'warning' },
    { label: 'Avg Aged Inv %', value: '13.85%', target: '<10.5%', status: 'critical' },
  ],
  categories: [
    { label: 'On Track', value: '2 of 6', target: '6 of 6', status: 'warning' },
    { label: 'MD Triggers Pending', value: '3', target: '0', status: 'warning' },
    { label: 'Options Aged >45d', value: '142 K', target: '<100 K', status: 'critical' },
  ],
  operations: [
    { label: 'Vendor OTIF %', value: '82%', target: '≥90%', status: 'critical' },
    { label: 'Vendor Fill Rate', value: '88%', target: '≥95%', status: 'warning' },
    { label: 'GRN On-Time', value: '91%', target: '≥95%', status: 'warning' },
  ],
};
