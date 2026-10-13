// ── Category View — Mock Data ──────────────────────────────────────

export interface CategoryViewItem {
  id: string;
  run_id: string;
  category_name: string;
  category_code: string;
  fashion_grade: string;
  fashion_grade_desc: string;
  hit: string;
  expected_revenue: number;
  options: number;
  status: string;
}

export interface FashionGradeRow {
  id: string;
  run_id: string;
  buy_plan_id: string;
  fashion_grade: string;
  fashion_grade_code: string;
  options: number;
  buy_qty: number;
  otb_allocated: number;
  otb_used: number;
  otb_usage_percentage: number;
  avg_asp: number;
  revenue: number;
  margin_percentage: number;
  stores: number;
  status: string;
}

export interface CategoryDetailData {
  category_name: string;
  category_code: string;
  hit: string;
  fashion_grades: FashionGradeRow[];
}

export interface CategoryHistoryEntry {
  id: string;
  field: string;
  from: string;
  to: string;
  user: string;
  date: string;
}

// ── Category listing items ─────────────────────────────────────────

export const mockCategoryItems: CategoryViewItem[] = [
  { id: 'MW-DNM-CORE', run_id: 'bp-mw-dnm-core', category_name: 'Men Western: Denim Bottoms', category_code: 'MW-DNM', fashion_grade: 'APL-Core', fashion_grade_desc: 'Core', hit: 'H5', expected_revenue: 18366250, options: 156, status: 'Costing' },
  { id: 'MW-DNM-FAS', run_id: 'bp-mw-dnm-fas', category_name: 'Men Western: Denim Bottoms', category_code: 'MW-DNM', fashion_grade: 'APL-Fashion', fashion_grade_desc: 'Fashion', hit: 'H5', expected_revenue: 34987500, options: 234, status: 'Buy Plan Review' },
  { id: 'MW-DNM-ULT', run_id: 'bp-mw-dnm-ult', category_name: 'Men Western: Denim Bottoms', category_code: 'MW-DNM', fashion_grade: 'APL-Ultimate', fashion_grade_desc: 'Ultimate', hit: 'H5', expected_revenue: 13121250, options: 66, status: 'Buy Plan Approval' },
  { id: 'MW-CTS-CORE', run_id: 'bp-mw-cts-core', category_name: 'Men Western: Casual T-shirts', category_code: 'MW-CTS', fashion_grade: 'APL-Core', fashion_grade_desc: 'Core', hit: 'H5', expected_revenue: 14679000, options: 423, status: 'Costing' },
  { id: 'MW-CTS-FAS', run_id: 'bp-mw-cts-fas', category_name: 'Men Western: Casual T-shirts', category_code: 'MW-CTS', fashion_grade: 'APL-Fashion', fashion_grade_desc: 'Fashion', hit: 'H5', expected_revenue: 17482500, options: 347, status: 'Buy Plan Review' },
  { id: 'MW-CTS-FB', run_id: 'bp-mw-cts-fb', category_name: 'Men Western: Casual T-shirts', category_code: 'MW-CTS', fashion_grade: 'APL-Fashion Basics', fashion_grade_desc: 'Fashion Basics', hit: 'H5', expected_revenue: 2096500, options: 122, status: 'Buy Plan Review' },
  { id: 'MW-CSH-CORE', run_id: 'bp-mw-csh-core', category_name: 'Men Western: Casual Shirts', category_code: 'MW-CSH', fashion_grade: 'APL-Core', fashion_grade_desc: 'Core', hit: 'H5', expected_revenue: 14071200, options: 234, status: 'Costing' },
  { id: 'MW-CSH-FAS', run_id: 'bp-mw-csh-fas', category_name: 'Men Western: Casual Shirts', category_code: 'MW-CSH', fashion_grade: 'APL-Fashion', fashion_grade_desc: 'Fashion', hit: 'H5', expected_revenue: 21989000, options: 321, status: 'Buy Plan Review' },
  { id: 'MW-CSH-ULT', run_id: 'bp-mw-csh-ult', category_name: 'Men Western: Casual Shirts', category_code: 'MW-CSH', fashion_grade: 'APL-Ultimate', fashion_grade_desc: 'Ultimate', hit: 'H5', expected_revenue: 6157800, options: 90, status: 'Buy Plan Approval' },
  { id: 'WW-TOP-CORE', run_id: 'bp-ww-top-core', category_name: 'Women: Western Tops', category_code: 'WW-TOP', fashion_grade: 'APL-Core', fashion_grade_desc: 'Core', hit: 'H5', expected_revenue: 18224800, options: 312, status: 'Buy Plan Approval' },
  { id: 'WW-TOP-FAS', run_id: 'bp-ww-top-fas', category_name: 'Women: Western Tops', category_code: 'WW-TOP', fashion_grade: 'APL-Fashion', fashion_grade_desc: 'Fashion', hit: 'H5', expected_revenue: 34181000, options: 456, status: 'Costing' },
  { id: 'WW-TOP-ULT', run_id: 'bp-ww-top-ult', category_name: 'Women: Western Tops', category_code: 'WW-TOP', fashion_grade: 'APL-Ultimate', fashion_grade_desc: 'Ultimate', hit: 'H5', expected_revenue: 7497000, options: 93, status: 'Buy Plan Review' },
  { id: 'WW-DRS-CORE', run_id: 'bp-ww-drs-core', category_name: 'Women: Western Dress & Blazers', category_code: 'WW-DRS', fashion_grade: 'APL-Core', fashion_grade_desc: 'Core', hit: 'H6', expected_revenue: 23740500, options: 234, status: 'Costing' },
  { id: 'WW-DRS-FAS', run_id: 'bp-ww-drs-fas', category_name: 'Women: Western Dress & Blazers', category_code: 'WW-DRS', fashion_grade: 'APL-Fashion', fashion_grade_desc: 'Fashion', hit: 'H6', expected_revenue: 39588000, options: 378, status: 'Buy Plan Review' },
  { id: 'WW-DRS-ULT', run_id: 'bp-ww-drs-ult', category_name: 'Women: Western Dress & Blazers', category_code: 'WW-DRS', fashion_grade: 'APL-Ultimate', fashion_grade_desc: 'Ultimate', hit: 'H6', expected_revenue: 12497500, options: 66, status: 'Buy Plan Approval' },
  { id: 'KW-BOY-CORE', run_id: 'bp-kw-boy-core', category_name: 'Kids: Boys', category_code: 'KW-BOY', fashion_grade: 'APL-Core', fashion_grade_desc: 'Core', hit: 'H5', expected_revenue: 9588000, options: 287, status: 'Costing' },
  { id: 'KW-BOY-FAS', run_id: 'bp-kw-boy-fas', category_name: 'Kids: Boys', category_code: 'KW-BOY', fashion_grade: 'APL-Fashion', fashion_grade_desc: 'Fashion', hit: 'H5', expected_revenue: 14836500, options: 312, status: 'Buy Plan Approval' },
  { id: 'KW-BOY-FB', run_id: 'bp-kw-boy-fb', category_name: 'Kids: Boys', category_code: 'KW-BOY', fashion_grade: 'APL-Fashion Basics', fashion_grade_desc: 'Fashion Basics', hit: 'H5', expected_revenue: 2695500, options: 113, status: 'Buy Plan Review' },
  { id: 'KW-INF-CORE', run_id: 'bp-kw-inf-core', category_name: 'Kids: Infant', category_code: 'KW-INF', fashion_grade: 'APL-Core', fashion_grade_desc: 'Core', hit: 'H5', expected_revenue: 8386000, options: 312, status: 'Costing' },
  { id: 'KW-INF-FAS', run_id: 'bp-kw-inf-fas', category_name: 'Kids: Infant', category_code: 'KW-INF', fashion_grade: 'APL-Fashion', fashion_grade_desc: 'Fashion', hit: 'H5', expected_revenue: 10788000, options: 267, status: 'Buy Plan Approval' },
  { id: 'MW-FSH-CORE', run_id: 'bp-mw-fsh-core', category_name: 'Men Western: Formal Shirts', category_code: 'MW-FSH', fashion_grade: 'APL-Core', fashion_grade_desc: 'Core', hit: 'H6', expected_revenue: 12500000, options: 198, status: 'Completed' },
  { id: 'MW-FSH-FAS', run_id: 'bp-mw-fsh-fas', category_name: 'Men Western: Formal Shirts', category_code: 'MW-FSH', fashion_grade: 'APL-Fashion', fashion_grade_desc: 'Fashion', hit: 'H6', expected_revenue: 18750000, options: 276, status: 'Completed' },
];

// ── Category detail data (keyed by category code) ──────────────────

export const mockCategoryDetails: Record<string, CategoryDetailData> = {
  'MW-DNM': {
    category_name: 'Men Western: Denim Bottoms',
    category_code: 'MW-DNM',
    hit: 'H5',
    fashion_grades: [
      { id: 'CORE', run_id: 'bp-mw-dnm-core', buy_plan_id: 'BP-MW-DNM-2024-H5-CORE', fashion_grade: 'Core', fashion_grade_code: 'COR', options: 156, buy_qty: 87500, otb_allocated: 4200000, otb_used: 3570000, otb_usage_percentage: 85, avg_asp: 2099, revenue: 18366250, margin_percentage: 58, stores: 420, status: 'Costing' },
      { id: 'FASHION', run_id: 'bp-mw-dnm-fas', buy_plan_id: 'BP-MW-DNM-2024-H5-FASHION', fashion_grade: 'Fashion', fashion_grade_code: 'FAS', options: 234, buy_qty: 125000, otb_allocated: 5600000, otb_used: 4760000, otb_usage_percentage: 85, avg_asp: 2799, revenue: 34987500, margin_percentage: 56, stores: 385, status: 'Buy Plan Review' },
      { id: 'ULTIMATE', run_id: 'bp-mw-dnm-ult', buy_plan_id: 'BP-MW-DNM-2024-H5-ULTIMATE', fashion_grade: 'Ultimate', fashion_grade_code: 'ULT', options: 66, buy_qty: 37500, otb_allocated: 2200000, otb_used: 1870000, otb_usage_percentage: 85, avg_asp: 3499, revenue: 13121250, margin_percentage: 54, stores: 180, status: 'Buy Plan Approval' },
    ],
  },
  'MW-CTS': {
    category_name: 'Men Western: Casual T-shirts',
    category_code: 'MW-CTS',
    hit: 'H5',
    fashion_grades: [
      { id: 'CORE', run_id: 'bp-mw-cts-core', buy_plan_id: 'BP-MW-CTS-2024-H5-CORE', fashion_grade: 'Core', fashion_grade_code: 'COR', options: 423, buy_qty: 210000, otb_allocated: 4000000, otb_used: 3400000, otb_usage_percentage: 85, avg_asp: 699, revenue: 14679000, margin_percentage: 68, stores: 420, status: 'Costing' },
      { id: 'FASHION', run_id: 'bp-mw-cts-fas', buy_plan_id: 'BP-MW-CTS-2024-H5-FASHION', fashion_grade: 'Fashion', fashion_grade_code: 'FAS', options: 347, buy_qty: 175000, otb_allocated: 4500000, otb_used: 3825000, otb_usage_percentage: 85, avg_asp: 999, revenue: 17482500, margin_percentage: 65, stores: 385, status: 'Buy Plan Review' },
      { id: 'FASHION_BASICS', run_id: 'bp-mw-cts-fb', buy_plan_id: 'BP-MW-CTS-2024-H5-FB', fashion_grade: 'Fashion Basics', fashion_grade_code: 'FB', options: 122, buy_qty: 35000, otb_allocated: 1500000, otb_used: 1275000, otb_usage_percentage: 85, avg_asp: 599, revenue: 2096500, margin_percentage: 70, stores: 420, status: 'Buy Plan Review' },
    ],
  },
  'MW-CSH': {
    category_name: 'Men Western: Casual Shirts',
    category_code: 'MW-CSH',
    hit: 'H5',
    fashion_grades: [
      { id: 'CORE', run_id: 'bp-mw-csh-core', buy_plan_id: 'BP-MW-CSH-2024-H5-CORE', fashion_grade: 'Core', fashion_grade_code: 'COR', options: 234, buy_qty: 88000, otb_allocated: 3150000, otb_used: 2677500, otb_usage_percentage: 85, avg_asp: 1599, revenue: 14071200, margin_percentage: 62, stores: 420, status: 'Costing' },
      { id: 'FASHION', run_id: 'bp-mw-csh-fas', buy_plan_id: 'BP-MW-CSH-2024-H5-FASHION', fashion_grade: 'Fashion', fashion_grade_code: 'FAS', options: 321, buy_qty: 110000, otb_allocated: 4500000, otb_used: 3825000, otb_usage_percentage: 85, avg_asp: 1999, revenue: 21989000, margin_percentage: 60, stores: 385, status: 'Buy Plan Review' },
      { id: 'ULTIMATE', run_id: 'bp-mw-csh-ult', buy_plan_id: 'BP-MW-CSH-2024-H5-ULTIMATE', fashion_grade: 'Ultimate', fashion_grade_code: 'ULT', options: 90, buy_qty: 22000, otb_allocated: 1350000, otb_used: 1147500, otb_usage_percentage: 85, avg_asp: 2799, revenue: 6157800, margin_percentage: 58, stores: 180, status: 'Buy Plan Approval' },
    ],
  },
  'WW-TOP': {
    category_name: 'Women: Western Tops',
    category_code: 'WW-TOP',
    hit: 'H5',
    fashion_grades: [
      { id: 'CORE', run_id: 'bp-ww-top-core', buy_plan_id: 'BP-WW-TOP-2024-H5-CORE', fashion_grade: 'Core', fashion_grade_code: 'COR', options: 312, buy_qty: 152000, otb_allocated: 3850000, otb_used: 3080000, otb_usage_percentage: 80, avg_asp: 1199, revenue: 18224800, margin_percentage: 66, stores: 420, status: 'Buy Plan Approval' },
      { id: 'FASHION', run_id: 'bp-ww-top-fas', buy_plan_id: 'BP-WW-TOP-2024-H5-FASHION', fashion_grade: 'Fashion', fashion_grade_code: 'FAS', options: 456, buy_qty: 190000, otb_allocated: 5600000, otb_used: 4480000, otb_usage_percentage: 80, avg_asp: 1799, revenue: 34181000, margin_percentage: 63, stores: 385, status: 'Costing' },
      { id: 'ULTIMATE', run_id: 'bp-ww-top-ult', buy_plan_id: 'BP-WW-TOP-2024-H5-ULTIMATE', fashion_grade: 'Ultimate', fashion_grade_code: 'ULT', options: 93, buy_qty: 30000, otb_allocated: 1100000, otb_used: 880000, otb_usage_percentage: 80, avg_asp: 2499, revenue: 7497000, margin_percentage: 60, stores: 180, status: 'Buy Plan Review' },
    ],
  },
  'WW-DRS': {
    category_name: 'Women: Western Dress & Blazers',
    category_code: 'WW-DRS',
    hit: 'H6',
    fashion_grades: [
      { id: 'CORE', run_id: 'bp-ww-drs-core', buy_plan_id: 'BP-WW-DRS-2024-H6-CORE', fashion_grade: 'Core', fashion_grade_code: 'COR', options: 234, buy_qty: 95000, otb_allocated: 4550000, otb_used: 3640000, otb_usage_percentage: 80, avg_asp: 2499, revenue: 23740500, margin_percentage: 64, stores: 420, status: 'Costing' },
      { id: 'FASHION', run_id: 'bp-ww-drs-fas', buy_plan_id: 'BP-WW-DRS-2024-H6-FASHION', fashion_grade: 'Fashion', fashion_grade_code: 'FAS', options: 378, buy_qty: 120000, otb_allocated: 6550000, otb_used: 5240000, otb_usage_percentage: 80, avg_asp: 3299, revenue: 39588000, margin_percentage: 61, stores: 385, status: 'Buy Plan Review' },
      { id: 'ULTIMATE', run_id: 'bp-ww-drs-ult', buy_plan_id: 'BP-WW-DRS-2024-H6-ULTIMATE', fashion_grade: 'Ultimate', fashion_grade_code: 'ULT', options: 66, buy_qty: 25000, otb_allocated: 1900000, otb_used: 1520000, otb_usage_percentage: 80, avg_asp: 4999, revenue: 12497500, margin_percentage: 57, stores: 180, status: 'Buy Plan Approval' },
    ],
  },
  'KW-BOY': {
    category_name: 'Kids: Boys',
    category_code: 'KW-BOY',
    hit: 'H5',
    fashion_grades: [
      { id: 'CORE', run_id: 'bp-kw-boy-core', buy_plan_id: 'BP-KW-BOY-2024-H5-CORE', fashion_grade: 'Core', fashion_grade_code: 'COR', options: 287, buy_qty: 120000, otb_allocated: 3150000, otb_used: 2362500, otb_usage_percentage: 75, avg_asp: 799, revenue: 9588000, margin_percentage: 70, stores: 385, status: 'Costing' },
      { id: 'FASHION', run_id: 'bp-kw-boy-fas', buy_plan_id: 'BP-KW-BOY-2024-H5-FASHION', fashion_grade: 'Fashion', fashion_grade_code: 'FAS', options: 312, buy_qty: 135000, otb_allocated: 3825000, otb_used: 2868750, otb_usage_percentage: 75, avg_asp: 1099, revenue: 14836500, margin_percentage: 68, stores: 350, status: 'Buy Plan Approval' },
      { id: 'FASHION_BASICS', run_id: 'bp-kw-boy-fb', buy_plan_id: 'BP-KW-BOY-2024-H5-FB', fashion_grade: 'Fashion Basics', fashion_grade_code: 'FB', options: 113, buy_qty: 45000, otb_allocated: 2025000, otb_used: 1518750, otb_usage_percentage: 75, avg_asp: 599, revenue: 2695500, margin_percentage: 72, stores: 385, status: 'Buy Plan Review' },
    ],
  },
  'KW-INF': {
    category_name: 'Kids: Infant',
    category_code: 'KW-INF',
    hit: 'H5',
    fashion_grades: [
      { id: 'CORE', run_id: 'bp-kw-inf-core', buy_plan_id: 'BP-KW-INF-2024-H5-CORE', fashion_grade: 'Core', fashion_grade_code: 'COR', options: 312, buy_qty: 140000, otb_allocated: 2800000, otb_used: 2100000, otb_usage_percentage: 75, avg_asp: 599, revenue: 8386000, margin_percentage: 72, stores: 385, status: 'Costing' },
      { id: 'FASHION', run_id: 'bp-kw-inf-fas', buy_plan_id: 'BP-KW-INF-2024-H5-FASHION', fashion_grade: 'Fashion', fashion_grade_code: 'FAS', options: 267, buy_qty: 120000, otb_allocated: 3600000, otb_used: 2700000, otb_usage_percentage: 75, avg_asp: 899, revenue: 10788000, margin_percentage: 68, stores: 350, status: 'Buy Plan Approval' },
    ],
  },
  'MW-FSH': {
    category_name: 'Men Western: Formal Shirts',
    category_code: 'MW-FSH',
    hit: 'H6',
    fashion_grades: [
      { id: 'CORE', run_id: 'bp-mw-fsh-core', buy_plan_id: 'BP-MW-FSH-2024-H6-CORE', fashion_grade: 'Core', fashion_grade_code: 'COR', options: 198, buy_qty: 75000, otb_allocated: 2800000, otb_used: 2520000, otb_usage_percentage: 90, avg_asp: 1899, revenue: 12500000, margin_percentage: 60, stores: 400, status: 'Completed' },
      { id: 'FASHION', run_id: 'bp-mw-fsh-fas', buy_plan_id: 'BP-MW-FSH-2024-H6-FASHION', fashion_grade: 'Fashion', fashion_grade_code: 'FAS', options: 276, buy_qty: 98000, otb_allocated: 3500000, otb_used: 3150000, otb_usage_percentage: 90, avg_asp: 2299, revenue: 18750000, margin_percentage: 58, stores: 370, status: 'Completed' },
    ],
  },
};

// ── Mock version history entries ───────────────────────────────────

export const mockCategoryHistoryEntries: CategoryHistoryEntry[] = [
  { id: '1', field: 'Buy Options', from: '850', to: '862', user: 'Priya Sharma', date: '2024-03-16 10:00 AM' },
  { id: '2', field: 'OTB Allocation', from: '₹15.5 Cr', to: '₹15.75 Cr', user: 'Amit Patel', date: '2024-03-17 11:30 AM' },
  { id: '3', field: 'ASP Target', from: '₹1,499', to: '₹1,599', user: 'Priya Sharma', date: '2024-03-17 02:00 PM' },
];

// ── Filter helpers ─────────────────────────────────────────────────

export function getCategoryViewFilters(items: CategoryViewItem[]): {
  categories: string[];
  hits: string[];
  statuses: string[];
} {
  const categories = [...new Set(items.map((i) => i.category_name))].sort();
  const hits = [...new Set(items.map((i) => i.hit))].sort();
  const statuses = [...new Set(items.map((i) => i.status))].sort();
  return { categories, hits, statuses };
}
