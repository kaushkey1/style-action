import type { DpPlanItem, DpAllocationItem, DpAllocationKpi } from '../api/dpApi';

// ── Extended type with category field ───────────────────────────────

export interface CategoryDpPlanItem extends DpPlanItem {
  category: string;
  subcategory: string;
  brick: string;
}

// ── Category View DP Plan listing mock data ─────────────────────────

export const mockCategoryDpPlans: CategoryDpPlanItem[] = [
  {
    dp_plan_id: 'F0855500025502AWSS262026H5',
    display_dp_name: 'DP-F085-0002-55-5502-2026-H5',
    brand: 'AVAASA MIX N MATCH', brand_desc: 'AVAASA MIX N MATCH',
    segment: 'WW', segment_desc: 'WOMENS WEAR',
    family: 'ETH', family_desc: 'ETHNIC WEAR',
    category: 'Women Indian Ethnic Wear', subcategory: 'Kurta Sets', brick: 'Kurta',
    fashion_grade: 'APL-Fashion', fashion_grade_desc: 'APL-Fashion',
    year: 2026, hit: 'H5', season: 'AWSS-26', drop_number: 2,
    qty: 14200, total_value: 11000000, total_stores: 6, total_skus: 58,
    total_allocated_qty: 14200, allocation_rate: 95.0, p1_qty: 10650, p3_qty: 3550,
    status: 'submitted_to_procuro', buy_plan_id: 'BP-WW-ETH-2026-H5',
    earliest_delivery_date: '2026-05-01', created_at: '2026-04-01', updated_at: '2026-04-28',
  },
  {
    dp_plan_id: 'F0855500025502AWSS262026H5D1',
    display_dp_name: 'DP-F085-0002-55-5502-2026-H5',
    brand: 'AVAASA MIX N MATCH', brand_desc: 'AVAASA MIX N MATCH',
    segment: 'WW', segment_desc: 'WOMENS WEAR',
    family: 'ETH', family_desc: 'ETHNIC WEAR',
    category: 'Women Indian Ethnic Wear', subcategory: 'Salwar & Dupatta', brick: 'Salwar',
    fashion_grade: 'APL-Fashion', fashion_grade_desc: 'APL-Fashion',
    year: 2026, hit: 'H5', season: 'AWSS-26', drop_number: 1,
    qty: 11000, total_value: 10500000, total_stores: 6, total_skus: 45,
    total_allocated_qty: 11000, allocation_rate: 94.0, p1_qty: 8250, p3_qty: 2750,
    status: 'submitted_to_procuro', buy_plan_id: 'BP-WW-ETH-2026-H5',
    earliest_delivery_date: '2026-04-15', created_at: '2026-03-20', updated_at: '2026-04-25',
  },
  {
    dp_plan_id: 'M0124400032101AWSS262026H5',
    display_dp_name: 'DP-M012-0003-44-2101-2026-H5',
    brand: 'JOHN PLAYERS', brand_desc: 'JOHN PLAYERS',
    segment: 'MW', segment_desc: 'MENS WEAR',
    family: 'CSH', family_desc: 'CASUAL SHIRTS',
    category: 'Men Western Casual Shirts', subcategory: 'Half Sleeve', brick: 'Shirt',
    fashion_grade: 'APL-Core', fashion_grade_desc: 'APL-Core',
    year: 2026, hit: 'H5', season: 'AWSS-26', drop_number: 1,
    qty: 28500, total_value: 32000000, total_stores: 42, total_skus: 120,
    total_allocated_qty: 27075, allocation_rate: 95.0, p1_qty: 20306, p3_qty: 6769,
    status: 'approved', buy_plan_id: 'BP-MW-CSH-2026-H5',
    earliest_delivery_date: '2026-05-10', created_at: '2026-04-05', updated_at: '2026-04-30',
  },
  {
    dp_plan_id: 'M0124400032101AWSS262026H6',
    display_dp_name: 'DP-M012-0003-44-2101-2026-H6',
    brand: 'JOHN PLAYERS', brand_desc: 'JOHN PLAYERS',
    segment: 'MW', segment_desc: 'MENS WEAR',
    family: 'CSH', family_desc: 'CASUAL SHIRTS',
    category: 'Men Western Casual Shirts', subcategory: 'Full Sleeve', brick: 'Shirt',
    fashion_grade: 'APL-Core', fashion_grade_desc: 'APL-Core',
    year: 2026, hit: 'H6', season: 'AWSS-26',
    qty: 18200, total_value: 20500000, total_stores: 38, total_skus: 85,
    total_allocated_qty: 17290, allocation_rate: 95.0, p1_qty: 12968, p3_qty: 4322,
    status: 'dp_generated', buy_plan_id: 'BP-MW-CSH-2026-H6',
    earliest_delivery_date: '2026-06-01', created_at: '2026-04-10', updated_at: '2026-05-01',
  },
  {
    dp_plan_id: 'K0567800041201AWSS262026H5',
    display_dp_name: 'DP-K056-0004-78-1201-2026-H5',
    brand: 'AJILE BY PANTALOONS', brand_desc: 'AJILE BY PANTALOONS',
    segment: 'KW', segment_desc: 'KIDS WEAR',
    family: 'BOY', family_desc: 'BOYS CASUAL',
    category: 'Kids Boys Casual', subcategory: 'T-Shirts & Shorts', brick: 'T-Shirt',
    fashion_grade: 'APL-Fashion Basics', fashion_grade_desc: 'APL-Fashion Basics',
    year: 2026, hit: 'H5', season: 'AWSS-26', drop_number: 1,
    qty: 9800, total_value: 7200000, total_stores: 28, total_skus: 67,
    total_allocated_qty: 9310, allocation_rate: 95.0, p1_qty: 6983, p3_qty: 2327,
    status: 'approved', buy_plan_id: 'BP-KW-BOY-2026-H5',
    earliest_delivery_date: '2026-05-05', created_at: '2026-04-02', updated_at: '2026-04-29',
  },
  {
    dp_plan_id: 'W0891200058301AWSS262026H5',
    display_dp_name: 'DP-W089-0005-12-8301-2026-H5',
    brand: 'RANGMANCH', brand_desc: 'RANGMANCH',
    segment: 'WW', segment_desc: 'WOMENS WEAR',
    family: 'KUR', family_desc: 'KURTA & SETS',
    category: 'Women Indian Kurta & Sets', subcategory: 'Straight Kurta', brick: 'Kurta',
    fashion_grade: 'APL-Fashion', fashion_grade_desc: 'APL-Fashion',
    year: 2026, hit: 'H5', season: 'AWSS-26',
    qty: 22400, total_value: 19800000, total_stores: 35, total_skus: 98,
    total_allocated_qty: 21280, allocation_rate: 95.0, p1_qty: 15960, p3_qty: 5320,
    status: 'po_created', buy_plan_id: 'BP-WW-KUR-2026-H5',
    earliest_delivery_date: '2026-04-20', created_at: '2026-03-25', updated_at: '2026-04-27',
  },
  {
    dp_plan_id: 'M0334500067401AWSS262026H5',
    display_dp_name: 'DP-M033-0006-45-7401-2026-H5',
    brand: 'PETER ENGLAND', brand_desc: 'PETER ENGLAND',
    segment: 'MW', segment_desc: 'MENS WEAR',
    family: 'FSH', family_desc: 'FORMAL SHIRTS',
    category: 'Men Western Formal Shirts', subcategory: 'Regular Fit', brick: 'Shirt',
    fashion_grade: 'APL-Core', fashion_grade_desc: 'APL-Core',
    year: 2026, hit: 'H5', season: 'AWSS-26', drop_number: 1,
    qty: 35600, total_value: 45000000, total_stores: 55, total_skus: 145,
    total_allocated_qty: 33820, allocation_rate: 95.0, p1_qty: 25365, p3_qty: 8455,
    status: 'executed', buy_plan_id: 'BP-MW-FSH-2026-H5',
    earliest_delivery_date: '2026-04-10', created_at: '2026-03-15', updated_at: '2026-04-20',
  },
  {
    dp_plan_id: 'M0334500067401AWSS262026H5D2',
    display_dp_name: 'DP-M033-0006-45-7401-2026-H5',
    brand: 'PETER ENGLAND', brand_desc: 'PETER ENGLAND',
    segment: 'MW', segment_desc: 'MENS WEAR',
    family: 'FSH', family_desc: 'FORMAL SHIRTS',
    category: 'Men Western Formal Shirts', subcategory: 'Slim Fit', brick: 'Shirt',
    fashion_grade: 'APL-Core', fashion_grade_desc: 'APL-Core',
    year: 2026, hit: 'H5', season: 'AWSS-26', drop_number: 2,
    qty: 15800, total_value: 20200000, total_stores: 48, total_skus: 72,
    total_allocated_qty: 15010, allocation_rate: 95.0, p1_qty: 11258, p3_qty: 3752,
    status: 'submitted_to_procuro', buy_plan_id: 'BP-MW-FSH-2026-H5',
    earliest_delivery_date: '2026-05-15', created_at: '2026-04-12', updated_at: '2026-05-02',
  },
  {
    dp_plan_id: 'W0445600073501AWSS262026H6',
    display_dp_name: 'DP-W044-0007-56-3501-2026-H6',
    brand: 'HONEY BY PANTALOONS', brand_desc: 'HONEY BY PANTALOONS',
    segment: 'WW', segment_desc: 'WOMENS WEAR',
    family: 'WTP', family_desc: 'WESTERN TOPS',
    category: 'Women Western Tops', subcategory: 'Crop Tops', brick: 'Top',
    fashion_grade: 'APL-Ultimate', fashion_grade_desc: 'APL-Ultimate',
    year: 2026, hit: 'H6', season: 'AWSS-26',
    qty: 8500, total_value: 12400000, total_stores: 22, total_skus: 54,
    total_allocated_qty: 8075, allocation_rate: 95.0, p1_qty: 6056, p3_qty: 2019,
    status: 'draft', buy_plan_id: 'BP-WW-WTP-2026-H6',
    earliest_delivery_date: '2026-06-15', created_at: '2026-04-20', updated_at: '2026-05-03',
  },
  {
    dp_plan_id: 'M0556700084601AWSS262026H5',
    display_dp_name: 'DP-M055-0008-67-4601-2026-H5',
    brand: 'BYFORD BY PANTALOONS', brand_desc: 'BYFORD BY PANTALOONS',
    segment: 'MW', segment_desc: 'MENS WEAR',
    family: 'DNM', family_desc: 'DENIM BOTTOMS',
    category: 'Men Western Denim Bottoms', subcategory: 'Slim Jeans', brick: 'Jeans',
    fashion_grade: 'APL-Fashion', fashion_grade_desc: 'APL-Fashion',
    year: 2026, hit: 'H5', season: 'AWSS-26', drop_number: 1,
    qty: 19600, total_value: 28700000, total_stores: 40, total_skus: 88,
    total_allocated_qty: 18620, allocation_rate: 95.0, p1_qty: 13965, p3_qty: 4655,
    status: 'procuro_acknowledged', buy_plan_id: 'BP-MW-DNM-2026-H5',
    earliest_delivery_date: '2026-05-08', created_at: '2026-04-08', updated_at: '2026-04-30',
  },
  {
    dp_plan_id: 'K0667800095701AWSS262026H6',
    display_dp_name: 'DP-K066-0009-78-5701-2026-H6',
    brand: 'PANTALOONS', brand_desc: 'PANTALOONS',
    segment: 'KW', segment_desc: 'KIDS WEAR',
    family: 'GRL', family_desc: 'GIRLS CASUAL',
    category: 'Kids Girls Casual', subcategory: 'Dresses & Frocks', brick: 'Dress',
    fashion_grade: 'APL-Fashion Basics', fashion_grade_desc: 'APL-Fashion Basics',
    year: 2026, hit: 'H6', season: 'AWSS-26',
    qty: 7200, total_value: 5100000, total_stores: 20, total_skus: 42,
    total_allocated_qty: 6840, allocation_rate: 95.0, p1_qty: 5130, p3_qty: 1710,
    status: 'engine_running', buy_plan_id: 'BP-KW-GRL-2026-H6',
    earliest_delivery_date: null, created_at: '2026-04-25', updated_at: '2026-05-04',
  },
  {
    dp_plan_id: 'W0778900106801AWSS262026H5',
    display_dp_name: 'DP-W077-0010-89-6801-2026-H5',
    brand: 'TRISHAA', brand_desc: 'TRISHAA',
    segment: 'WW', segment_desc: 'WOMENS WEAR',
    family: 'SAR', family_desc: 'SAREE & LEHENGA',
    category: 'Women Indian Saree & Lehenga', subcategory: 'Silk Saree', brick: 'Saree',
    fashion_grade: 'APL-Ultimate', fashion_grade_desc: 'APL-Ultimate',
    year: 2026, hit: 'H5', season: 'AWSS-26', drop_number: 1,
    qty: 5400, total_value: 9800000, total_stores: 18, total_skus: 36,
    total_allocated_qty: 5130, allocation_rate: 95.0, p1_qty: 3848, p3_qty: 1282,
    status: 'approved', buy_plan_id: 'BP-WW-SAR-2026-H5',
    earliest_delivery_date: '2026-04-25', created_at: '2026-03-28', updated_at: '2026-04-26',
  },
  {
    dp_plan_id: 'M0890100117901AWSS262026H5',
    display_dp_name: 'DP-M089-0011-01-7901-2026-H5',
    brand: 'SF JEANS', brand_desc: 'SF JEANS',
    segment: 'MW', segment_desc: 'MENS WEAR',
    family: 'CTS', family_desc: 'CASUAL T-SHIRTS',
    category: 'Men Western Casual T-Shirts', subcategory: 'Round Neck', brick: 'T-Shirt',
    fashion_grade: 'APL-Fashion', fashion_grade_desc: 'APL-Fashion',
    year: 2026, hit: 'H5', season: 'AWSS-26',
    qty: 42000, total_value: 38000000, total_stores: 60, total_skus: 165,
    total_allocated_qty: 39900, allocation_rate: 95.0, p1_qty: 29925, p3_qty: 9975,
    status: 'po_created', buy_plan_id: 'BP-MW-CTS-2026-H5',
    earliest_delivery_date: '2026-04-18', created_at: '2026-03-22', updated_at: '2026-04-28',
  },
  {
    dp_plan_id: 'W0901200128001AWSS262026H6',
    display_dp_name: 'DP-W090-0012-12-8001-2026-H6',
    brand: 'ALTO MODA', brand_desc: 'ALTO MODA',
    segment: 'WW', segment_desc: 'WOMENS WEAR',
    family: 'WDR', family_desc: 'WESTERN DRESSES',
    category: 'Women Western Dresses', subcategory: 'Midi Dresses', brick: 'Dress',
    fashion_grade: 'APL-Fashion', fashion_grade_desc: 'APL-Fashion',
    year: 2026, hit: 'H6', season: 'AWSS-26', drop_number: 1,
    qty: 6800, total_value: 11200000, total_stores: 25, total_skus: 48,
    total_allocated_qty: 6460, allocation_rate: 95.0, p1_qty: 4845, p3_qty: 1615,
    status: 'dp_generated', buy_plan_id: 'BP-WW-WDR-2026-H6',
    earliest_delivery_date: '2026-06-10', created_at: '2026-04-22', updated_at: '2026-05-03',
  },
  {
    dp_plan_id: 'M1012300139101AWSS262026H5',
    display_dp_name: 'DP-M101-0013-23-9101-2026-H5',
    brand: 'AJILE BY PANTALOONS', brand_desc: 'AJILE BY PANTALOONS',
    segment: 'MW', segment_desc: 'MENS WEAR',
    family: 'SPT', family_desc: 'SPORTS & ATHLEISURE',
    category: 'Men Sports & Athleisure', subcategory: 'Track Pants', brick: 'Trouser',
    fashion_grade: 'APL-Fashion Basics', fashion_grade_desc: 'APL-Fashion Basics',
    year: 2026, hit: 'H5', season: 'AWSS-26',
    qty: 16500, total_value: 14800000, total_stores: 32, total_skus: 78,
    total_allocated_qty: 15675, allocation_rate: 95.0, p1_qty: 11756, p3_qty: 3919,
    status: 'approved', buy_plan_id: 'BP-MW-SPT-2026-H5',
    earliest_delivery_date: '2026-05-12', created_at: '2026-04-06', updated_at: '2026-04-29',
  },
  {
    dp_plan_id: 'M1123400140201AWSS262026H6',
    display_dp_name: 'DP-M112-0014-34-0201-2026-H6',
    brand: 'PETER ENGLAND', brand_desc: 'PETER ENGLAND',
    segment: 'MW', segment_desc: 'MENS WEAR',
    family: 'FTS', family_desc: 'FORMAL TROUSERS',
    category: 'Men Western Formal Trousers', subcategory: 'Pleated', brick: 'Trouser',
    fashion_grade: 'APL-Core', fashion_grade_desc: 'APL-Core',
    year: 2026, hit: 'H6', season: 'AWSS-26', drop_number: 1,
    qty: 12300, total_value: 18600000, total_stores: 45, total_skus: 62,
    total_allocated_qty: 11685, allocation_rate: 95.0, p1_qty: 8764, p3_qty: 2921,
    status: 'rejected', buy_plan_id: 'BP-MW-FTS-2026-H6',
    earliest_delivery_date: '2026-06-05', created_at: '2026-04-18', updated_at: '2026-05-02',
  },
  {
    dp_plan_id: 'K1234500151301AWSS262026H5',
    display_dp_name: 'DP-K123-0015-45-1301-2026-H5',
    brand: 'PANTALOONS', brand_desc: 'PANTALOONS',
    segment: 'KW', segment_desc: 'KIDS WEAR',
    family: 'INF', family_desc: 'INFANT WEAR',
    category: 'Kids Infant Wear', subcategory: 'Rompers', brick: 'Romper',
    fashion_grade: 'APL-Core', fashion_grade_desc: 'APL-Core',
    year: 2026, hit: 'H5', season: 'AWSS-26',
    qty: 4800, total_value: 3200000, total_stores: 15, total_skus: 30,
    total_allocated_qty: 4560, allocation_rate: 95.0, p1_qty: 3420, p3_qty: 1140,
    status: 'engine_failed', buy_plan_id: 'BP-KW-INF-2026-H5',
    earliest_delivery_date: null, created_at: '2026-04-15', updated_at: '2026-05-01',
  },
  {
    dp_plan_id: 'W1345600162401AWSS262026H5',
    display_dp_name: 'DP-W134-0016-56-2401-2026-H5',
    brand: 'RANGMANCH', brand_desc: 'RANGMANCH',
    segment: 'WW', segment_desc: 'WOMENS WEAR',
    family: 'NDB', family_desc: 'NON-DENIM BOTTOMS',
    category: 'Women Western Non-Denim Bottoms', subcategory: 'Palazzos', brick: 'Trouser',
    fashion_grade: 'APL-Fashion Basics', fashion_grade_desc: 'APL-Fashion Basics',
    year: 2026, hit: 'H5', season: 'AWSS-26', drop_number: 1,
    qty: 10200, total_value: 8900000, total_stores: 30, total_skus: 55,
    total_allocated_qty: 9690, allocation_rate: 95.0, p1_qty: 7268, p3_qty: 2422,
    status: 'submitted_to_procuro', buy_plan_id: 'BP-WW-NDB-2026-H5',
    earliest_delivery_date: '2026-05-03', created_at: '2026-04-03', updated_at: '2026-04-28',
  },
];

// ── Category Detail — KPI + Allocation mock data ────────────────────

export interface MockDpCategoryDetail {
  dp_plan_id: string;
  display_dp_name: string;
  status: string;
  kpi: DpAllocationKpi;
  allocations: DpAllocationItem[];
}

const BRICK_NAMES = ['Kurta', 'Shirt', 'T-Shirt', 'Trouser', 'Jeans', 'Dress', 'Top', 'Saree', 'Shorts', 'Romper'] as const;

function generateAllocations(
  dpPlanId: string,
  season: string,
  hit: string,
  year: number,
  stylePrefix: string,
  storeList: readonly string[],
  sizes: readonly string[],
  purchaseGroup: string,
  mrpBase: number,
  priorities: readonly string[],
  count: number,
  brand: string,
): DpAllocationItem[] {
  const rows: DpAllocationItem[] = [];
  let styleIndex = 1;
  let variantIndex = 1;

  for (let i = 0; i < count; i++) {
    const sizeIdx = i % sizes.length;
    if (sizeIdx === 0 && i > 0) {
      variantIndex++;
      if (variantIndex > 3) {
        variantIndex = 1;
        styleIndex++;
      }
    }
    const storeIdx = i % storeList.length;
    const priorityIdx = i % priorities.length;
    const styleId = `${stylePrefix}${String(styleIndex).padStart(2, '0')}`;
    const variantNum = `44${String(3 + styleIndex)}${String(118 + variantIndex)}${String(674 + sizeIdx).padStart(3, '0')}${String(i + 1).padStart(3, '0')}`;
    const qtyVal = (sizeIdx === 0 || sizeIdx === sizes.length - 1) ? 96 : 192;

    rows.push({
      id: `alloc-${dpPlanId}-${i}`,
      season,
      hit,
      style_id: styleId,
      variant_article_number: variantNum,
      size: sizes[sizeIdx] ?? 'M',
      purchase_group: purchaseGroup,
      delivery_date: `${year}-05-01`,
      store_code: storeList[storeIdx] ?? 'ST01',
      dc_id: null,
      qty: qtyVal,
      uom: 'EA',
      otb_number: `${dpPlanId}`,
      mrp: mrpBase + (styleIndex * 100),
      priority: priorities[priorityIdx] ?? 'P3',
      season_year: year,
      brand,
      brick: BRICK_NAMES[(styleIndex - 1) % BRICK_NAMES.length],
    });
  }
  return rows;
}

const DETAIL_STORE_SETS = {
  small: ['TU41', '9518', 'M221', 'B445'],
  medium: ['TU41', '9518', 'M221', 'B445', 'D108', 'K332', 'P901', 'R115'],
  large: ['TU41', '9518', 'M221', 'B445', 'D108', 'K332', 'P901', 'R115', 'G207', 'H510', 'J614', 'L820'],
} as const;

export function getMockCategoryDetail(dpPlanId: string): MockDpCategoryDetail | undefined {
  const plan = mockCategoryDpPlans.find(p => p.dp_plan_id === dpPlanId);
  if (!plan) return undefined;

  const storeSet: keyof typeof DETAIL_STORE_SETS = plan.total_stores <= 10 ? 'small' :
    plan.total_stores <= 35 ? 'medium' : 'large';
  const stores: readonly string[] = DETAIL_STORE_SETS[storeSet];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const priorities = ['P3', 'P3', 'P3', 'P1'];
  const rowCount = Math.min(plan.total_skus, 60);

  const allocations = generateAllocations(
    dpPlanId,
    plan.season,
    plan.hit,
    plan.year,
    `TAS${plan.year.toString().slice(-2)}${plan.segment}${plan.family}M`,
    stores,
    sizes,
    `K${55 + Math.floor(Math.random() * 10)}`,
    999 + Math.floor(plan.total_value / plan.qty),
    priorities,
    rowCount,
    plan.brand,
  );

  const totalUnits = allocations.reduce((sum, a) => sum + a.qty, 0);
  const totalValue = allocations.reduce((sum, a) => sum + a.qty * a.mrp, 0);
  const uniqueStores = new Set(allocations.map(a => a.store_code)).size;

  return {
    dp_plan_id: plan.dp_plan_id,
    display_dp_name: plan.display_dp_name,
    status: plan.status,
    kpi: {
      total_skus: plan.total_skus,
      total_stores: uniqueStores,
      total_units: totalUnits,
      total_value: totalValue,
    },
    allocations,
  };
}
