import type { PersonaInsightData } from '@/modules/dashboard/data/mockPersonaDashboards';

// ── Types ──

export interface CategoryDirectorHealthKpi {
  id: string;
  label: string;
  value: string;
  target: string;
  status: 'on_track' | 'warning' | 'critical';
  trendDelta: number;
  trendLabel: string;
  trendDirection: 'up' | 'down' | 'flat';
  infoKey: string;
}

export interface DrilldownTableRow {
  cells: (string | number)[];
  children?: DrilldownTableRow[];
}

// ── Hero KPIs (always visible strip) ──
//
// Used by `CategoryDirectorHealthStrip` as a static fallback when the strip
// renders before live `useCategoryPerformance` data is available (e.g. on the
// Subcategory Drilldown overlay). Once the hero strip on the drilldown route is
// wired through `useHeroKpiStore`, this can be deleted.

export const heroKpis: CategoryDirectorHealthKpi[] = [
  { id: 'ww-sales-plan', label: 'Net Revenue vs Plan', value: '₹116 Cr / ₹130 Cr', target: '≥100%', status: 'warning', trendDelta: 2.4, trendLabel: 'vs last week', trendDirection: 'up', infoKey: 'Net Revenue vs Plan' },
  { id: 'ww-fp-st', label: 'Full-Price ST %', value: '58%', target: '≥65%', status: 'warning', trendDelta: -1.2, trendLabel: 'vs last week', trendDirection: 'down', infoKey: 'FP ST %' },
  { id: 'ww-gm', label: 'Realised GM %', value: '39.1%', target: '≥45%', status: 'critical', trendDelta: -1.8, trendLabel: 'vs last week', trendDirection: 'down', infoKey: 'Gross Margin' },
  { id: 'ww-md-pending', label: 'Markdown Action Pending', value: '4', target: '0', status: 'critical', trendDelta: 2, trendLabel: 'vs yesterday', trendDirection: 'up', infoKey: 'Markdown Triggers' },
  { id: 'ww-otb', label: 'OTB Utilisation', value: '78%', target: '85–100%', status: 'warning', trendDelta: 4, trendLabel: 'vs last week', trendDirection: 'up', infoKey: 'OTB Consumption' },
  { id: 'ww-size-comp', label: 'Size Completeness', value: '88%', target: '≥95%', status: 'warning', trendDelta: -1.2, trendLabel: 'vs last week', trendDirection: 'down', infoKey: 'Size Completeness' },
];

// ── Tab 2: Inventory & Lifecycle types ──

export interface MdTriggerRow {
  optionId: string;
  store: string;
  storeName: string;
  doh: string;
  stPct: string;
  fpStPct: string;
  stage: string;
  time: string;
  mdAction: string;
}

// ── Tab 4: Store & Distribution types ──

export interface StoreHealthRow {
  grade: string;
  stores: string;
  rightStocked: string;
  overstocked: string;
  understocked: string;
  revPerDay: string;
}

// ── Tab 5: Supply & OTB ──
//
// Out of scope for the current mock-removal pass — these are consumed by
// `SupplyOTBTab.tsx` and are documented data gaps where the BE has no
// equivalent field today.

export const supplyKpis: CategoryDirectorHealthKpi[] = [
  { id: 'ww-otb2', label: 'OTB Utilisation', value: '78%', target: '85–100%', status: 'warning', trendDelta: 4, trendLabel: 'vs LW', trendDirection: 'up', infoKey: 'OTB Consumption' },
  { id: 'ww-otb-rem', label: 'OTB Remaining', value: '₹18 Cr', target: '-', status: 'on_track', trendDelta: 0, trendLabel: '', trendDirection: 'flat', infoKey: 'OTB Remaining' },
  { id: 'ww-chase', label: 'Chase Consumed', value: '62%', target: '≤110% pace', status: 'on_track', trendDelta: 4, trendLabel: 'vs LW', trendDirection: 'up', infoKey: 'Chase Consumed' },
  { id: 'ww-vendor-conc', label: 'Vendor Conc Max', value: '22%', target: '≤20%', status: 'warning', trendDelta: 2, trendLabel: 'vs LW', trendDirection: 'up', infoKey: 'Vendor Concentration' },
  { id: 'ww-sample', label: 'Sample Approval', value: '64%', target: '≥70%', status: 'warning', trendDelta: -2, trendLabel: 'vs LW', trendDirection: 'down', infoKey: 'Sample Approval %' },
];

export const otbByClassData = [
  { name: 'Women Indian', budget: 32, committed: 24 },
  { name: 'Women Western', budget: 28, committed: 22 },
  { name: 'Lingerie', budget: 22, committed: 18 },
];

export const vendorDeliveryData = [
  { name: 'Vendor A (Indian)', value: 96 },
  { name: 'Vendor B (Western)', value: 92 },
  { name: 'Vendor C (Lingerie)', value: 88 },
  { name: 'Vendor D (Indian)', value: 94 },
  { name: 'Vendor E (Western)', value: 86 },
];

export interface OtbTrackerRow {
  category: string;
  budget: string;
  numPos: string;
  committed: string;
  open: string;
  utilPct: string;
  remaining: string;
}

export const otbTrackerRows: OtbTrackerRow[] = [
  { category: 'Women Indian', budget: '₹32 Cr', numPos: '48', committed: '₹24 Cr', open: '₹8 Cr', utilPct: '75%', remaining: '₹4 Cr' },
  { category: 'Women Western', budget: '₹28 Cr', numPos: '36', committed: '₹22 Cr', open: '₹6 Cr', utilPct: '79%', remaining: '₹3 Cr' },
  { category: 'Lingerie', budget: '₹22 Cr', numPos: '24', committed: '₹18 Cr', open: '₹4 Cr', utilPct: '82%', remaining: '₹2 Cr' },
];

export interface ActivePoRow {
  poNumber: string;
  vendor: string;
  optionId: string;
  units: string;
  orderDate: string;
  expected: string;
  actual: string;
  status: string;
}

export const activePORows: ActivePoRow[] = [
  { poNumber: 'PO-44218', vendor: 'Vendor A', optionId: 'WW-TP-3312', units: '2,400', orderDate: '28 Mar', expected: '02 Apr', actual: '05 Apr', status: 'In Transit' },
  { poNumber: 'PO-44221', vendor: 'Vendor B', optionId: 'WW-DR-6614', units: '1,800', orderDate: '25 Mar', expected: '30 Mar', actual: '03 Apr', status: 'At DC' },
  { poNumber: 'PO-44225', vendor: 'Vendor C', optionId: 'WW-LG-1108', units: '1,200', orderDate: '01 Apr', expected: '06 Apr', actual: '09 Apr', status: 'Dispatched' },
  { poNumber: 'PO-44228', vendor: 'Vendor D', optionId: 'WW-SR-2218', units: '900', orderDate: '20 Mar', expected: '26 Mar', actual: '30 Mar', status: 'Overdue' },
];

export interface IntakeMarginRow {
  poNumber: string;
  vendor: string;
  subcategory: string;
  date: string;
  intakeValue: string;
  imPct: string;
  grn: string;
  owner: string;
}

export const intakeMarginRows: IntakeMarginRow[] = [
  { poNumber: 'PO-44218', vendor: 'Vendor A', subcategory: 'Kurtas & Tunics', date: '15 Mar', intakeValue: '₹4.2 Cr', imPct: '52.1%', grn: 'Yes', owner: 'R. Sharma' },
  { poNumber: 'PO-44221', vendor: 'Vendor B', subcategory: 'Dresses', date: '18 Mar', intakeValue: '₹3.6 Cr', imPct: '49.2%', grn: 'No', owner: 'Pending' },
  { poNumber: 'PO-44225', vendor: 'Vendor C', subcategory: 'Bras', date: '20 Mar', intakeValue: '₹2.8 Cr', imPct: '51.8%', grn: 'Yes', owner: 'P. Gupta' },
  { poNumber: 'PO-44228', vendor: 'Vendor D', subcategory: 'Sarees', date: '12 Mar', intakeValue: '₹1.8 Cr', imPct: '47.6%', grn: 'No', owner: 'Escalated' },
];

// ── Persona Insights (Morning Briefing) ──

export const categoryDirectorInsights: PersonaInsightData = {
  morningQuestion: 'Womens Wear at ₹116 Cr — 89% of plan. Full-Price ST at 58%. Where do you intervene?',
  summary: 'Realised GM at 39.1% — 5.9 pts below 45% target. 4 markdown triggers unactioned >24h. Sarees at 34% ST is the biggest drag. OTB at 78%. 2 NOOS stockouts. Size completeness 88%.',
  insights: [
    { id: 'ww-i1', headline: 'Realised GM at 39.1% — 5.9 pts below 45% target', detail: 'Markdown cost at 6.8% of gross sales. Lingerie at 38.2% is pulling the blend down. Season-end projection at 43.2% if markdown acceleration is controlled.', status: 'critical', metric: '39.1% GM (target: 45%)' },
    { id: 'ww-i2', headline: 'Full-Price ST at 58% — 7 pts below 65% target', detail: 'Women Western leads at 68% FP ST. Women Indian at 54% — dragged by Sarees at 34%. Lingerie at 42%.', status: 'warning', metric: '58% FP ST' },
    { id: 'ww-i3', headline: '4 markdown triggers unactioned for >24 hours', detail: 'WW-SR-2218 (142 days) and WW-KT-4521 (128 days) are the most critical. Per DB-03 A1, these should have been actioned within 24h.', status: 'critical', metric: '4 triggers pending' },
    { id: 'ww-i4', headline: 'Sarees at 34% ST — slowest class, 142 days avg age', detail: '32% of stock is aged >180 days. 3 of the 4 unactioned markdown triggers are Saree SKUs.', status: 'critical', metric: '34% ST, 32% aged' },
    { id: 'ww-i5', headline: 'Women Western at 68% FP ST — on track, chase candidates', detail: 'Tops & Blouses leading at 70% FP ST. 3 options hit Week-2 threshold for top-up.', status: 'on-track', metric: '68% FP ST, 42.8% GM' },
  ],
  agentActions: [
    { agentName: 'Trading Agent A9', action: 'Identified 3 Women Western options >60% ST at Week 2', outcome: 'Top-up POs prepared: ₹2.8 Cr value' },
    { agentName: 'Liquidation Agent A4', action: 'Flagged 86 options in Markdown Stage 3', outcome: 'Liquidation batch: ₹12 Cr value' },
    { agentName: 'Allocation Agent A12', action: 'Detected 28 overstocked / 42 understocked stores', outcome: 'Transfer plan: 361 units across 4 store pairs' },
    { agentName: 'Replenishment Engine RE1', action: 'NOOS stockout for 2 SKUs across 6 stores', outcome: 'Emergency dispatch from DC, ETA 48h' },
    { agentName: 'OTB Guardian A11', action: 'Vendor concentration alert at 22%', outcome: 'Alternative vendor sourcing initiated' },
  ],
};
