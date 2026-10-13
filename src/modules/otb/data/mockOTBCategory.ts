// ─── Types ──────────────────────────────────────────────────────────

export interface OTBCategoryRow {
  id: string;
  category: string;
  categoryCode: string;
  subcategory: string;
  subcategoryCode: string;
  budget: number;
  consumed: number;
  utilPct: number;
}

export interface OTBCategoryLineItem {
  id: string;
  otbNumber: string;
  otbId: string;
  category: string;
  brick: string;
  subcategory: string;
  grade: string;
  hit: number;
  recommended: number;
  purchase: number;
  variancePct: number | null;
  utilPct: number;
}

export interface OTBCategoryStore {
  site: string;
  store_name: string;
  grade: string;
  city: string;
  budget: number;
  consumed: number;
  util_pct: number;
  cover_days: number | null;
  capacity_pct: number | null;
  alerts: string[];
}

// ─── Status helpers ─────────────────────────────────────────────────

export function getCategoryStatus(util: number): { label: string; variant: 'success' | 'warning' | 'error' | 'default' } {
  if (util > 110) return { label: 'Over', variant: 'error' };
  if (util > 105) return { label: 'Watch', variant: 'warning' };
  if (util >= 85) return { label: 'Normal', variant: 'success' };
  if (util >= 70) return { label: 'Watch', variant: 'warning' };
  return { label: 'Under', variant: 'error' };
}

// ─── Category Listing Data ──────────────────────────────────────────

export const mockCategoryRows: OTBCategoryRow[] = [
  // Tops & Tees — 3 subcategories
  { id: 'cat-01', category: 'Tops & Tees', categoryCode: 'tops-tees', subcategory: 'T-Shirts', subcategoryCode: 'tshirts', budget: 45000000, consumed: 40500000, utilPct: 90 },
  { id: 'cat-02', category: 'Tops & Tees', categoryCode: 'tops-tees', subcategory: 'Polo Shirts', subcategoryCode: 'polo', budget: 32000000, consumed: 30720000, utilPct: 96 },
  { id: 'cat-03', category: 'Tops & Tees', categoryCode: 'tops-tees', subcategory: 'Tank Tops', subcategoryCode: 'tank-tops', budget: 12000000, consumed: 10200000, utilPct: 85 },

  // Bottoms — 3 subcategories
  { id: 'cat-04', category: 'Bottoms', categoryCode: 'bottoms', subcategory: 'Jeans', subcategoryCode: 'jeans', budget: 55000000, consumed: 47850000, utilPct: 87 },
  { id: 'cat-05', category: 'Bottoms', categoryCode: 'bottoms', subcategory: 'Trousers', subcategoryCode: 'trousers', budget: 38000000, consumed: 36100000, utilPct: 95 },
  { id: 'cat-06', category: 'Bottoms', categoryCode: 'bottoms', subcategory: 'Shorts', subcategoryCode: 'shorts', budget: 15000000, consumed: 13500000, utilPct: 90 },

  // Dresses — 2 subcategories
  { id: 'cat-07', category: 'Dresses', categoryCode: 'dresses', subcategory: 'Casual Dresses', subcategoryCode: 'casual-dresses', budget: 28000000, consumed: 30800000, utilPct: 110 },
  { id: 'cat-08', category: 'Dresses', categoryCode: 'dresses', subcategory: 'Party Dresses', subcategoryCode: 'party-dresses', budget: 22000000, consumed: 24200000, utilPct: 110 },

  // Outerwear — 2 subcategories
  { id: 'cat-09', category: 'Outerwear', categoryCode: 'outerwear', subcategory: 'Jackets', subcategoryCode: 'jackets', budget: 42000000, consumed: 27300000, utilPct: 65 },
  { id: 'cat-10', category: 'Outerwear', categoryCode: 'outerwear', subcategory: 'Blazers', subcategoryCode: 'blazers', budget: 18000000, consumed: 14400000, utilPct: 80 },

  // Innerwear — 2 subcategories
  { id: 'cat-11', category: 'Innerwear', categoryCode: 'innerwear', subcategory: 'Briefs', subcategoryCode: 'briefs', budget: 20000000, consumed: 19000000, utilPct: 95 },
  { id: 'cat-12', category: 'Innerwear', categoryCode: 'innerwear', subcategory: 'Vests', subcategoryCode: 'vests', budget: 14000000, consumed: 12600000, utilPct: 90 },

  // Footwear — 3 subcategories
  { id: 'cat-13', category: 'Footwear', categoryCode: 'footwear', subcategory: 'Sneakers', subcategoryCode: 'sneakers', budget: 60000000, consumed: 57000000, utilPct: 95 },
  { id: 'cat-14', category: 'Footwear', categoryCode: 'footwear', subcategory: 'Formal Shoes', subcategoryCode: 'formal-shoes', budget: 25000000, consumed: 22500000, utilPct: 90 },
  { id: 'cat-15', category: 'Footwear', categoryCode: 'footwear', subcategory: 'Sandals', subcategoryCode: 'sandals', budget: 18000000, consumed: 20700000, utilPct: 115 },

  // Accessories — 4 subcategories
  { id: 'cat-16', category: 'Accessories', categoryCode: 'accessories', subcategory: 'Belts', subcategoryCode: 'belts', budget: 8000000, consumed: 7200000, utilPct: 90 },
  { id: 'cat-17', category: 'Accessories', categoryCode: 'accessories', subcategory: 'Watches', subcategoryCode: 'watches', budget: 35000000, consumed: 33250000, utilPct: 95 },
  { id: 'cat-18', category: 'Accessories', categoryCode: 'accessories', subcategory: 'Sunglasses', subcategoryCode: 'sunglasses', budget: 12000000, consumed: 10800000, utilPct: 90 },
  { id: 'cat-19', category: 'Accessories', categoryCode: 'accessories', subcategory: 'Bags', subcategoryCode: 'bags', budget: 22000000, consumed: 20900000, utilPct: 95 },

  // Ethnic Wear — 3 subcategories (one has zero budget for edge case)
  { id: 'cat-20', category: 'Ethnic Wear', categoryCode: 'ethnic-wear', subcategory: 'Kurtas', subcategoryCode: 'kurtas', budget: 30000000, consumed: 28500000, utilPct: 95 },
  { id: 'cat-21', category: 'Ethnic Wear', categoryCode: 'ethnic-wear', subcategory: 'Sherwanis', subcategoryCode: 'sherwanis', budget: 15000000, consumed: 12000000, utilPct: 80 },
  { id: 'cat-22', category: 'Ethnic Wear', categoryCode: 'ethnic-wear', subcategory: 'Stoles', subcategoryCode: 'stoles', budget: 0, consumed: 0, utilPct: 0 },

  // Sleepwear — 0 line items (edge case: empty category)
  { id: 'cat-23', category: 'Sleepwear', categoryCode: 'sleepwear', subcategory: 'Pajamas', subcategoryCode: 'pajamas', budget: 5000000, consumed: 4500000, utilPct: 90 },
  { id: 'cat-24', category: 'Sleepwear', categoryCode: 'sleepwear', subcategory: 'Nightgowns', subcategoryCode: 'nightgowns', budget: 3000000, consumed: 2700000, utilPct: 90 },
];

// ─── Category Line Items ────────────────────────────────────────────

const BRICKS = ['Casual Wear', 'Formal Wear', 'Sports Wear', 'Active Wear', 'Premium Wear', 'Daily Wear'];

function generateLineItems(category: string, categoryCode: string, subcategories: string[], count: number): OTBCategoryLineItem[] {
  const grades = ['A', 'A1', 'A2', 'A3'];
  const items: OTBCategoryLineItem[] = [];
  for (let i = 0; i < count; i++) {
    const subcat = subcategories[i % subcategories.length]!;
    const grade = grades[i % grades.length]!;
    const brick = BRICKS[i % BRICKS.length]!;
    const hit = (i % 6) + 1;
    const recommended = 500000 + Math.floor(Math.random() * 4500000);
    const varianceBase = (Math.random() * 30) - 15;
    const purchase = Math.round(recommended * (1 + varianceBase / 100));
    const utilPct = Math.round((purchase / recommended) * 100);
    const variancePct = i % 7 === 0 ? null : Math.round(varianceBase * 10) / 10;
    items.push({
      id: `li-${categoryCode}-${String(i + 1).padStart(3, '0')}`,
      otbNumber: `40424200${String(3420 + i).padStart(4, '0')}XAWSS2026${String(7 + (i % 5)).padStart(2, '0')}NA`,
      otbId: `otb-${categoryCode}-${String(i + 1).padStart(3, '0')}`,
      category,
      brick,
      subcategory: subcat,
      grade,
      hit,
      recommended,
      purchase,
      variancePct,
      utilPct,
    });
  }
  return items;
}

const LINE_ITEM_DATA: Record<string, OTBCategoryLineItem[]> = {
  'tops-tees': generateLineItems('Tops & Tees', 'tops-tees', ['T-Shirts', 'Polo Shirts', 'Tank Tops'], 15),
  'bottoms': generateLineItems('Bottoms', 'bottoms', ['Jeans', 'Trousers', 'Shorts'], 18),
  'dresses': generateLineItems('Dresses', 'dresses', ['Casual Dresses', 'Party Dresses'], 12),
  'outerwear': generateLineItems('Outerwear', 'outerwear', ['Jackets', 'Blazers'], 10),
  'innerwear': generateLineItems('Innerwear', 'innerwear', ['Briefs', 'Vests'], 8),
  'footwear': generateLineItems('Footwear', 'footwear', ['Sneakers', 'Formal Shoes', 'Sandals'], 16),
  'accessories': generateLineItems('Accessories', 'accessories', ['Belts', 'Watches', 'Sunglasses', 'Bags'], 20),
  'ethnic-wear': generateLineItems('Ethnic Wear', 'ethnic-wear', ['Kurtas', 'Sherwanis', 'Stoles'], 14),
  'sleepwear': [], // Edge case: empty category
};

export function getCategoryLineItems(categoryCode: string): OTBCategoryLineItem[] {
  return LINE_ITEM_DATA[categoryCode] ?? [];
}

export function getCategoryName(categoryCode: string): string | null {
  const row = mockCategoryRows.find((r) => r.categoryCode === categoryCode);
  return row?.category ?? null;
}

// ─── Store Breakdown Data ────────────────────────────────────────────

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Surat', 'Nagpur', 'Chandigarh', 'Kochi', 'Indore'];
const STORE_NAMES = [
  'Reliance Trends Phoenix', 'Reliance Trends Infinity', 'Reliance Trends Forum', 'Reliance Trends Select City',
  'Reliance Trends Ambience', 'Reliance Trends VR', 'Reliance Trends Viviana', 'Reliance Trends Orion',
  'Reliance Trends Express Avenue', 'Reliance Trends GVK One', 'Reliance Trends DB City', 'Reliance Trends Elpro',
  'Reliance Trends Oberoi', 'Reliance Trends Inorbit', 'Reliance Trends Seasons', 'Reliance Trends Central',
  'Reliance Trends Mantri', 'Reliance Trends Pacific', 'Reliance Trends World Trade', 'Reliance Trends Elante',
  'Reliance Trends DLF Promenade', 'Reliance Trends South City', 'Reliance Trends Quest', 'Reliance Trends Nexus',
  'Reliance Trends Vegas', 'Reliance Trends Galaxy', 'Reliance Trends Metro', 'Reliance Trends Crown',
  'Reliance Trends Oasis', 'Reliance Trends Pinnacle',
];

export const mockCategoryStores: OTBCategoryStore[] = STORE_NAMES.map((name, i) => {
  const grades = ['A', 'A1', 'A2', 'A3'];
  const grade = grades[i % grades.length]!;
  const city = CITIES[i % CITIES.length]!;
  const budget = 2000000 + (i * 500000);
  const utilBase = 70 + (i % 50);
  const consumed = Math.round(budget * (utilBase / 100));
  const util_pct = Math.round((consumed / budget) * 100);
  const coverDays = 15 + (i % 40);
  const capacityPct = 60 + (i % 35);
  const alerts: string[] = [];
  if (util_pct > 105) alerts.push('over-utilized');
  if (util_pct < 70) alerts.push('under-utilized');
  if (coverDays < 20) alerts.push('low-cover');

  return {
    site: `SITE-${String(1001 + i).padStart(4, '0')}`,
    store_name: name,
    grade,
    city,
    budget,
    consumed,
    util_pct,
    cover_days: coverDays,
    capacity_pct: capacityPct,
    alerts,
  };
});
