// ─── Product Display Mock Data ──────────────────────────────────────────────
// Apparel product options for Reliance Retail Trends format stores.
// All values are T-1 snapshot (previous day's close).

// ─── Types ──────────────────────────────────────────────────────────────────

export type FashionGrade = 'Core' | 'Ultimate' | 'Fashion Basics' | 'Fast Fashion';
export type PercolationState = 'native' | 'percolated-in' | 'flagged-out';
export type TriggerSeverity = 'info' | 'warning' | 'error';
export type StoreGradeLevel = 'A0' | 'A1' | 'A2' | 'A3';


export interface Trigger {
  grade: FashionGrade;
  day: number | null;
  condition: string;
  severity: TriggerSeverity;
  action: string;
}

export interface HealthComponents {
  stAttainment: number;
  markdownDiscipline: number;
  sizeHealth: number;
  ageRisk: number;
}

export interface SizeStockEntry {
  size: string;
  qty: number;
}

export interface StoreInventory {
  storeCode: string;
  storeGrade: StoreGradeLevel;
  unitsReceived: number;
  unitsSold: number;
  sellableStock: number;
  storeAgeDays: number;
  percolationState: PercolationState;
  sizeStock: SizeStockEntry[];
  brokenSizes: string[];
  fillRate: number;
}

export interface ProductAttribute {
  label: string;
  value: string;
}

export interface ProductOption {
  styleCode: string;
  name: string;
  imageUrl: string;
  grnDate: string;
  segment: string;
  family: string;
  classLevel: string;
  brick: string;
  fashionGrade: FashionGrade;
  color: string;
  fit: string;
  pattern: string;
  mrp: number;
  asp: number;
  markdownPct: number;
  sizeSet: string[];
  networkAgeDays: number;
  unitsReceived: number;
  unitsSold: number;
  sellableStock: number;
  sellThroughPct: number;
  fullPriceST7: number | null;
  fullPriceST14: number | null;
  fullPriceST30: number | null;
  cumulativeSTSeries: { day: number; actual: number; target: number }[];
  ros: number;
  daysOnHand: number | null;
  forwardCoverWeeks: number | null;
  healthScore: number;
  healthComponents: HealthComponents;
  activeTrigger: Trigger | null;
  isOffTarget: boolean;
  isNew: boolean;
  isStagnant: boolean;
  isAged: boolean;
  stores: StoreInventory[];
  productAttributes: ProductAttribute[];
}

// ─── Grade Target Curves (from spec §9.3) ───────────────────────────────────

export const GRADE_TARGETS: Record<FashionGrade, {
  mix: number;
  d7: number; d14: number; d30: number; d45: number; d60: number; d90: number;
  mdFloor: number;
}> = {
  'Core':            { mix: 15, d7: 18, d14: 30, d30: 58, d45: 78, d60: 90, d90: 95, mdFloor: 7 },
  'Ultimate':        { mix: 45, d7: 14, d14: 25, d30: 52, d45: 68, d60: 80, d90: 88, mdFloor: 9 },
  'Fashion Basics':  { mix: 25, d7: 10, d14: 20, d30: 42, d45: 57, d60: 70, d90: 82, mdFloor: 12 },
  'Fast Fashion':    { mix: 15, d7: 8,  d14: 16, d30: 35, d45: 50, d60: 62, d90: 75, mdFloor: 18 },
};

export const HEALTH_BANDS = {
  healthy: { min: 75, label: 'Healthy', color: 'emerald' },
  watch: { min: 55, label: 'Watch', color: 'amber' },
  atRisk: { min: 0, label: 'At Risk', color: 'red' },
} as const;

export function getHealthBand(score: number): 'healthy' | 'watch' | 'atRisk' {
  if (score >= 75) return 'healthy';
  if (score >= 55) return 'watch';
  return 'atRisk';
}

// ─── Helper: interpolate target at a given age ──────────────────────────────

export function interpolateTarget(grade: FashionGrade, age: number): number {
  const t = GRADE_TARGETS[grade];
  const milestones = [
    { day: 0, val: 0 }, { day: 7, val: t.d7 }, { day: 14, val: t.d14 },
    { day: 30, val: t.d30 }, { day: 45, val: t.d45 }, { day: 60, val: t.d60 },
    { day: 90, val: t.d90 },
  ];
  if (age >= 90) return t.d90;
  for (let i = 0; i < milestones.length - 1; i++) {
    const cur = milestones[i];
    const next = milestones[i + 1];
    if (cur && next && age >= cur.day && age <= next.day) {
      const frac = (age - cur.day) / (next.day - cur.day);
      return cur.val + frac * (next.val - cur.val);
    }
  }
  return 0;
}

// ─── Helper: get store-scoped product data ──────────────────────────────────

export function getStoreProduct(product: ProductOption, storeCode: string): StoreInventory | undefined {
  return product.stores.find((s) => s.storeCode === storeCode);
}

export function computeStoreSellThrough(inv: StoreInventory): number {
  if (inv.unitsReceived === 0) return 0;
  return Math.round((inv.unitsSold / inv.unitsReceived) * 100);
}

// ─── T-1 date ───────────────────────────────────────────────────────────────

function formatDDMMYYYY(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
export const T_MINUS_1_DATE = formatDDMMYYYY(yesterday);

// ─── Product images by category ─────────────────────────────────────────────
// Unsplash images matched to apparel product types

const PRODUCT_IMAGES: Record<string, string[]> = {
  'T-Shirts': [
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=300&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=300&fit=crop&auto=format',
  ],
  'Polo Shirts': [
    'https://images.unsplash.com/photo-1625910513413-5fc421e352e2?w=400&h=300&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=400&h=300&fit=crop&auto=format',
  ],
  'Casual Shirts': [
    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=300&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1602810318383-e386cc2a3f87?w=400&h=300&fit=crop&auto=format',
  ],
  'Jeans': [
    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=300&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=300&fit=crop&auto=format',
  ],
  'Chinos': [
    'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=300&fit=crop&auto=format',
  ],
  'Shorts': [
    'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&h=300&fit=crop&auto=format',
  ],
  'Jackets': [
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=300&fit=crop&auto=format',
  ],
  'Sweatshirts': [
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=300&fit=crop&auto=format',
  ],
  'Hoodies': [
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=300&fit=crop&auto=format',
  ],
  'Regular Fit': [
    'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=400&h=300&fit=crop&auto=format',
  ],
  'Slim Fit': [
    'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=400&h=300&fit=crop&auto=format',
  ],
  'Flat Front': [
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=300&fit=crop&auto=format',
  ],
  'Pleated': [
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=300&fit=crop&auto=format',
  ],
  'Blouses': [
    'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&h=300&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1518622358385-8ea7d0794bf6?w=400&h=300&fit=crop&auto=format',
  ],
  'Crop Tops': [
    'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=400&h=300&fit=crop&auto=format',
  ],
  'Midi': [
    'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=300&fit=crop&auto=format',
  ],
  'Maxi': [
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=300&fit=crop&auto=format',
  ],
  'Mini': [
    'https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=400&h=300&fit=crop&auto=format',
  ],
  'Straight': [
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=300&fit=crop&auto=format',
  ],
  'A-Line': [
    'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400&h=300&fit=crop&auto=format',
  ],
  'Anarkali': [
    'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400&h=300&fit=crop&auto=format',
  ],
  'Silk': [
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=300&fit=crop&auto=format',
  ],
  'Cotton': [
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=300&fit=crop&auto=format',
  ],
  'Georgette': [
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=300&fit=crop&auto=format',
  ],
  'Sneakers': [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=300&fit=crop&auto=format',
  ],
  'Loafers': [
    'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400&h=300&fit=crop&auto=format',
  ],
  'Slip-ons': [
    'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=400&h=300&fit=crop&auto=format',
  ],
  'Running': [
    'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400&h=300&fit=crop&auto=format',
  ],
};

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&auto=format';

function getProductImage(classLevel: string, index: number): string {
  const images = PRODUCT_IMAGES[classLevel];
  if (!images || images.length === 0) return FALLBACK_IMG;
  return images[index % images.length] ?? FALLBACK_IMG;
}

let imageCounter = 0;

// ─── Size sets by segment ───────────────────────────────────────────────────

const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const KIDS_SIZES = ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y'];
const FOOTWEAR_SIZES = ['6', '7', '8', '9', '10', '11'];

// ─── Store codes for demo ───────────────────────────────────────────────────

const DEMO_STORES = [
  { code: 'TRN-MUM-001', grade: 'A0' as StoreGradeLevel },
  { code: 'TRN-DEL-002', grade: 'A1' as StoreGradeLevel },
  { code: 'TRN-BLR-003', grade: 'A1' as StoreGradeLevel },
  { code: 'TRN-HYD-004', grade: 'A2' as StoreGradeLevel },
  { code: 'TRN-KOL-005', grade: 'A3' as StoreGradeLevel },
];

// ─── Build helpers ──────────────────────────────────────────────────────────

function buildCumulativeST(grade: FashionGrade, age: number, finalST: number): { day: number; actual: number; target: number }[] {
  const milestones = [7, 14, 30, 45, 60, 90];
  const t = GRADE_TARGETS[grade];
  const targets = [t.d7, t.d14, t.d30, t.d45, t.d60, t.d90];
  const series: { day: number; actual: number; target: number }[] = [{ day: 0, actual: 0, target: 0 }];

  for (let i = 0; i < milestones.length; i++) {
    const d = milestones[i]!;
    const tgt = targets[i]!;
    if (d > age) break;
    const progress = d / Math.max(age, 1);
    const actual = Math.round(finalST * progress * (0.85 + Math.random() * 0.3));
    series.push({ day: d, actual: Math.min(actual, 100), target: tgt });
  }
  return series;
}

function buildStoreInventories(
  product: { sizeSet: string[]; networkAgeDays: number; unitsReceived: number; unitsSold: number; sellableStock: number },
  storeCount: number,
): StoreInventory[] {
  return DEMO_STORES.slice(0, storeCount).map((store, idx) => {
    const factor = 1 - idx * 0.15;
    const received = Math.round(product.unitsReceived * factor / storeCount);
    const sold = Math.round(product.unitsSold * factor / storeCount);
    const stock = Math.max(0, received - sold);
    const storeAge = Math.max(1, product.networkAgeDays - idx * 5);
    const sizeStock: SizeStockEntry[] = product.sizeSet.map((size, si) => {
      const qty = si === 2 || si === 3 ? Math.max(0, Math.round(stock / product.sizeSet.length * (0.3 + Math.random() * 0.7))) : Math.round(stock / product.sizeSet.length * (0.5 + Math.random()));
      return { size, qty };
    });
    const broken = sizeStock.filter((s) => s.qty === 0).map((s) => s.size);
    const available = sizeStock.filter((s) => s.qty > 0).length;
    const fillRate = product.sizeSet.length > 0 ? Math.round((available / product.sizeSet.length) * 100) : 100;

    return {
      storeCode: store.code,
      storeGrade: store.grade,
      unitsReceived: received,
      unitsSold: sold,
      sellableStock: stock,
      storeAgeDays: storeAge,
      percolationState: idx < 2 ? 'native' : 'percolated-in',
      sizeStock,
      brokenSizes: broken,
      fillRate,
    };
  });
}

function computeHealth(
  st: number, grade: FashionGrade, age: number, md: number, fillRate: number,
): { score: number; components: HealthComponents } {
  const target = interpolateTarget(grade, age);
  const stAttainment = target > 0 ? Math.min(1, st / target) : 1;
  const mdFloor = GRADE_TARGETS[grade].mdFloor;
  const markdownDiscipline = Math.max(0, 1 - (md - mdFloor) / 30);
  const sizeHealth = fillRate / 100;
  const ageRisk = Math.max(0, 1 - age / 120);

  const score = Math.round(
    (stAttainment * 0.45 + markdownDiscipline * 0.20 + sizeHealth * 0.20 + ageRisk * 0.15) * 100,
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    components: {
      stAttainment: Math.round(stAttainment * 100),
      markdownDiscipline: Math.round(markdownDiscipline * 100),
      sizeHealth: Math.round(sizeHealth * 100),
      ageRisk: Math.round(ageRisk * 100),
    },
  };
}

function computeTrigger(grade: FashionGrade, age: number, st: number, ros: number, md: number): Trigger | null {
  const t = GRADE_TARGETS[grade];
  if (ros <= 0.1 && age > 14) {
    return { grade, day: null, condition: 'ROS near zero past trailing window', severity: 'warning', action: 'Flag stagnant — assess markdown or transfer' };
  }
  if (md > t.mdFloor + 5) {
    return { grade, day: null, condition: `Markdown ${md.toFixed(0)}% exceeds floor + buffer (${t.mdFloor + 5}%)`, severity: 'warning', action: 'Markdown active — monitor erosion' };
  }
  if (grade === 'Core' && age >= 30 && ros < 1.2) {
    return { grade, day: 30, condition: 'ROS < 60% plan at D30', severity: 'error', action: 'Percolation flag' };
  }
  if (grade === 'Ultimate' && age >= 30 && ros < 1.1) {
    return { grade, day: 30, condition: 'ROS < 55% plan at D30', severity: 'error', action: 'Percolation flag' };
  }
  if (grade === 'Fashion Basics' && age >= 30 && st < 40) {
    return { grade, day: 30, condition: 'ST < 40% at D30 (hard block)', severity: 'error', action: 'Hard transfer / markdown' };
  }
  if (grade === 'Core' && age >= 14 && age < 30 && st < 22) {
    return { grade, day: 14, condition: 'ST < 22% cumulative at D14', severity: 'warning', action: 'Inter-store size rebalance' };
  }
  if (grade === 'Core' && age >= 7 && age < 14 && st < 12) {
    return { grade, day: 7, condition: 'ST < 12% received at D7', severity: 'info', action: 'Monitor' };
  }
  return null;
}

function getFabricForCategory(segment: string, family: string): string {
  const fabricMap: Record<string, string[]> = {
    'Top Wear': ['100% Cotton', 'Cotton Jersey', 'Pique Cotton', 'Linen', 'Cotton Blend'],
    'Bottom Wear': ['Cotton Twill', 'Stretch Denim', 'Cotton Chino', 'Cotton Lycra'],
    'Outerwear': ['French Terry', 'Fleece', 'Denim', 'Nylon'],
    'Shirts': ['100% Cotton', 'Cotton Poplin', 'Oxford Cotton', 'Linen Cotton'],
    'Trousers': ['Poly-Viscose', 'Wool Blend', 'Cotton Stretch', 'Poly-Cotton'],
    'Tops & Tees': ['Viscose', 'Crepe', 'Cotton Jersey', 'Rayon', 'Satin'],
    'Dresses': ['Georgette', 'Crepe', 'Cotton', 'Viscose Rayon', 'Polyester'],
    'Kurtas & Kurtis': ['Cotton', 'Rayon', 'Chanderi', 'Silk Cotton', 'Viscose'],
    'Sarees': ['Pure Silk', 'Cotton Silk', 'Georgette', 'Banarasi Silk', 'Chiffon'],
    'Salwar Sets': ['Cotton', 'Chanderi Silk', 'Rayon', 'Muslin'],
    'Dupattas': ['Silk', 'Banarasi Silk', 'Cotton', 'Chiffon'],
    'Boys Top Wear': ['100% Cotton', 'Cotton Jersey', 'Cotton Blend'],
    'Girls Top Wear': ['100% Cotton', 'Cotton Jersey', 'Rayon'],
    'Sets & Combos': ['Cotton', 'Cotton Blend', 'Hosiery Cotton'],
    'Casual Shoes': ['Canvas', 'Knit Mesh', 'Leather', 'Synthetic Leather', 'EVA'],
  };
  const options = fabricMap[family] ?? fabricMap[segment] ?? ['Cotton Blend'];
  return options[Math.floor(Math.random() * options.length)] ?? 'Cotton Blend';
}

function buildProduct(
  code: string, name: string, segment: string, family: string, classLevel: string, brick: string,
  grade: FashionGrade, color: string, fit: string, pattern: string,
  mrp: number, asp: number, sizeSet: string[], ageDays: number,
  received: number, sold: number, ros: number,
  extraAttrs: ProductAttribute[] = [],
): ProductOption {
  const stock = Math.max(0, received - sold);
  const st = received > 0 ? Math.round((sold / received) * 100) : 0;
  const md = mrp > 0 ? Math.round(((mrp - asp) / mrp) * 100) : 0;
  const avgFill = 83;
  const { score, components } = computeHealth(st, grade, ageDays, md, avgFill);
  const isOffTarget = st < 0.9 * interpolateTarget(grade, ageDays);
  const doh = ros > 0.1 ? Math.round(stock / ros) : null;
  const fwdCover = ros > 0.1 ? parseFloat((stock / (ros * 7)).toFixed(1)) : null;
  const trigger = computeTrigger(grade, ageDays, st, ros, md);

  const stores = buildStoreInventories({ sizeSet, networkAgeDays: ageDays, unitsReceived: received, unitsSold: sold, sellableStock: stock }, 4);

  return {
    styleCode: code,
    name,
    imageUrl: getProductImage(classLevel, imageCounter++),
    grnDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() - ageDays);
      return formatDDMMYYYY(d);
    })(),
    segment, family, classLevel, brick, fashionGrade: grade,
    color, fit, pattern,
    mrp, asp, markdownPct: md, sizeSet,
    networkAgeDays: ageDays,
    unitsReceived: received, unitsSold: sold, sellableStock: stock,
    sellThroughPct: st,
    fullPriceST7: ageDays >= 7 ? Math.round(st * 0.3) : null,
    fullPriceST14: ageDays >= 14 ? Math.round(st * 0.55) : null,
    fullPriceST30: ageDays >= 30 ? Math.round(st * 0.82) : null,
    cumulativeSTSeries: buildCumulativeST(grade, ageDays, st),
    ros,
    daysOnHand: doh,
    forwardCoverWeeks: fwdCover,
    healthScore: score,
    healthComponents: components,
    activeTrigger: trigger,
    isOffTarget,
    isNew: ageDays < 7,
    isStagnant: ros <= 0.1 && ageDays > 14,
    isAged: ageDays > 90,
    stores,
    productAttributes: [
      { label: 'Color', value: color },
      { label: 'Fit', value: fit || 'Regular' },
      { label: 'Pattern', value: pattern },
      { label: 'Fabric', value: getFabricForCategory(segment, family) },
      ...extraAttrs,
    ],
  };
}

// ─── Mock Products ──────────────────────────────────────────────────────────
// 48 apparel products across segments

export const mockProducts: ProductOption[] = [
  // ── Menswear Casual — Top Wear ─────────────────────────────────────────
  buildProduct('MC-TS-001', 'Graphic Printed Crew Tee', 'Menswear Casual', 'Top Wear', 'T-Shirts', 'Round Neck', 'Core', 'Navy', 'Regular', 'Printed', 999, 949, APPAREL_SIZES, 42, 480, 420, 4.8,
    [{ label: 'Sleeve Length', value: 'Half Sleeve' }, { label: 'Neck Type', value: 'Round Neck' }, { label: 'Occasion', value: 'Casual' }, { label: 'Wash Care', value: 'Machine Wash' }]),
  buildProduct('MC-TS-002', 'Acid Wash Oversized Tee', 'Menswear Casual', 'Top Wear', 'T-Shirts', 'Round Neck', 'Fast Fashion', 'Black', 'Oversized', 'Solid', 1299, 1149, APPAREL_SIZES, 18, 320, 240, 5.2,
    [{ label: 'Sleeve Length', value: 'Half Sleeve' }, { label: 'Neck Type', value: 'Round Neck' }, { label: 'Occasion', value: 'Casual' }, { label: 'Wash Care', value: 'Machine Wash' }]),
  buildProduct('MC-TS-003', 'Striped Henley T-Shirt', 'Menswear Casual', 'Top Wear', 'T-Shirts', 'Henley', 'Fashion Basics', 'Maroon', 'Regular', 'Striped', 799, 749, APPAREL_SIZES, 55, 600, 360, 2.8,
    [{ label: 'Sleeve Length', value: 'Full Sleeve' }, { label: 'Neck Type', value: 'Henley' }, { label: 'Occasion', value: 'Casual' }, { label: 'Wash Care', value: 'Machine Wash' }]),
  buildProduct('MC-PO-004', 'Textured Polo Shirt', 'Menswear Casual', 'Top Wear', 'Polo Shirts', 'Round Neck', 'Core', 'Olive', 'Slim', 'Textured', 1499, 1399, APPAREL_SIZES, 35, 400, 340, 4.4,
    [{ label: 'Sleeve Length', value: 'Half Sleeve' }, { label: 'Collar Type', value: 'Polo Collar' }, { label: 'Occasion', value: 'Smart Casual' }, { label: 'Wash Care', value: 'Machine Wash' }]),
  buildProduct('MC-CS-005', 'Linen Camp Collar Shirt', 'Menswear Casual', 'Top Wear', 'Casual Shirts', 'Round Neck', 'Ultimate', 'White', 'Relaxed', 'Solid', 2499, 2299, APPAREL_SIZES, 28, 280, 250, 4.2,
    [{ label: 'Sleeve Length', value: 'Half Sleeve' }, { label: 'Collar Type', value: 'Camp Collar' }, { label: 'Closure', value: 'Button Front' }, { label: 'Occasion', value: 'Resort / Casual' }, { label: 'Wash Care', value: 'Hand Wash' }]),
  buildProduct('MC-CS-006', 'Check Flannel Shirt', 'Menswear Casual', 'Top Wear', 'Casual Shirts', 'Round Neck', 'Fashion Basics', 'Red', 'Regular', 'Check', 1799, 1599, APPAREL_SIZES, 65, 350, 190, 1.6,
    [{ label: 'Sleeve Length', value: 'Full Sleeve' }, { label: 'Collar Type', value: 'Spread Collar' }, { label: 'Closure', value: 'Button Front' }, { label: 'Occasion', value: 'Casual' }, { label: 'Wash Care', value: 'Machine Wash' }]),

  // ── Menswear Casual — Bottom Wear ──────────────────────────────────────
  buildProduct('MC-JN-007', 'Slim Fit Dark Wash Jeans', 'Menswear Casual', 'Bottom Wear', 'Jeans', 'Skinny', 'Core', 'Indigo', 'Slim', 'Solid', 1999, 1849, APPAREL_SIZES, 48, 520, 440, 4.0,
    [{ label: 'Waist Rise', value: 'Mid Rise' }, { label: 'Length', value: 'Full Length' }, { label: 'Wash', value: 'Dark Wash' }, { label: 'Stretch', value: 'Comfort Stretch' }, { label: 'Closure', value: 'Zip Fly' }]),
  buildProduct('MC-JN-008', 'Relaxed Tapered Jeans', 'Menswear Casual', 'Bottom Wear', 'Jeans', 'Relaxed', 'Ultimate', 'Light Blue', 'Relaxed', 'Washed', 2799, 2599, APPAREL_SIZES, 32, 240, 180, 2.6,
    [{ label: 'Waist Rise', value: 'Mid Rise' }, { label: 'Length', value: 'Full Length' }, { label: 'Wash', value: 'Light Wash' }, { label: 'Stretch', value: 'Non-Stretch' }, { label: 'Closure', value: 'Button Fly' }]),
  buildProduct('MC-CH-009', 'Stretch Slim Chino', 'Menswear Casual', 'Bottom Wear', 'Chinos', 'Skinny', 'Core', 'Khaki', 'Slim', 'Solid', 1699, 1599, APPAREL_SIZES, 40, 380, 310, 3.4,
    [{ label: 'Waist Rise', value: 'Mid Rise' }, { label: 'Length', value: 'Full Length' }, { label: 'Stretch', value: '2% Elastane' }, { label: 'Closure', value: 'Zip Fly' }, { label: 'Pockets', value: '4 Pocket' }]),
  buildProduct('MC-SH-010', 'Cargo Jogger Shorts', 'Menswear Casual', 'Bottom Wear', 'Shorts', 'Relaxed', 'Fast Fashion', 'Grey', 'Relaxed', 'Solid', 999, 899, APPAREL_SIZES, 5, 200, 30, 6.0,
    [{ label: 'Waist Rise', value: 'Mid Rise' }, { label: 'Length', value: 'Above Knee' }, { label: 'Waist Type', value: 'Elasticated Drawstring' }, { label: 'Pockets', value: '6 Pocket Cargo' }]),

  // ── Menswear Casual — Outerwear ────────────────────────────────────────
  buildProduct('MC-JK-011', 'Denim Trucker Jacket', 'Menswear Casual', 'Outerwear', 'Jackets', 'Denim', 'Ultimate', 'Blue', 'Regular', 'Solid', 3499, 3199, APPAREL_SIZES, 95, 180, 128, 0.5,
    [{ label: 'Sleeve Length', value: 'Full Sleeve' }, { label: 'Closure', value: 'Button Front' }, { label: 'Weight', value: 'Medium' }, { label: 'Pockets', value: '4 Pocket' }, { label: 'Occasion', value: 'Casual' }]),
  buildProduct('MC-SW-012', 'French Terry Sweatshirt', 'Menswear Casual', 'Outerwear', 'Sweatshirts', 'Denim', 'Fashion Basics', 'Charcoal', 'Regular', 'Solid', 1999, 1699, APPAREL_SIZES, 72, 300, 175, 1.2,
    [{ label: 'Sleeve Length', value: 'Full Sleeve' }, { label: 'Neck Type', value: 'Crew Neck' }, { label: 'Closure', value: 'Pullover' }, { label: 'Weight', value: 'Medium' }, { label: 'Wash Care', value: 'Machine Wash Cold' }]),
  buildProduct('MC-HD-013', 'Zip-Up Hoodie', 'Menswear Casual', 'Outerwear', 'Hoodies', 'Bomber', 'Fast Fashion', 'Black', 'Oversized', 'Printed', 2299, 1899, APPAREL_SIZES, 110, 250, 62, 0.08,
    [{ label: 'Sleeve Length', value: 'Full Sleeve' }, { label: 'Closure', value: 'Full Zip' }, { label: 'Hood', value: 'Drawstring Hood' }, { label: 'Weight', value: 'Heavy' }, { label: 'Pockets', value: 'Kangaroo Pocket' }]),

  // ── Menswear Formal ────────────────────────────────────────────────────
  buildProduct('MF-SH-014', 'Oxford Button-Down Shirt', 'Menswear Formal', 'Shirts', 'Regular Fit', 'Round Neck', 'Core', 'Light Blue', 'Regular', 'Solid', 1899, 1799, APPAREL_SIZES, 50, 400, 310, 2.8,
    [{ label: 'Sleeve Length', value: 'Full Sleeve' }, { label: 'Collar Type', value: 'Button-Down' }, { label: 'Cuff Type', value: 'Barrel Cuff' }, { label: 'Occasion', value: 'Formal / Office' }, { label: 'Wash Care', value: 'Machine Wash' }]),
  buildProduct('MF-SH-015', 'Slim Fit Stripe Formal', 'Menswear Formal', 'Shirts', 'Slim Fit', 'Round Neck', 'Ultimate', 'White', 'Slim', 'Striped', 2499, 2399, APPAREL_SIZES, 38, 260, 210, 2.4,
    [{ label: 'Sleeve Length', value: 'Full Sleeve' }, { label: 'Collar Type', value: 'Cutaway Collar' }, { label: 'Cuff Type', value: 'French Cuff' }, { label: 'Occasion', value: 'Formal / Office' }, { label: 'Wash Care', value: 'Dry Clean' }]),
  buildProduct('MF-TR-016', 'Flat Front Trouser', 'Menswear Formal', 'Trousers', 'Flat Front', 'Round Neck', 'Core', 'Charcoal', 'Regular', 'Solid', 2299, 2199, APPAREL_SIZES, 60, 320, 198, 1.8,
    [{ label: 'Waist Rise', value: 'Mid Rise' }, { label: 'Length', value: 'Full Length' }, { label: 'Pleat', value: 'Flat Front' }, { label: 'Closure', value: 'Hook & Bar' }, { label: 'Crease', value: 'Permanent Crease' }, { label: 'Occasion', value: 'Formal / Office' }]),
  buildProduct('MF-TR-017', 'Pleated Wool-Blend Trouser', 'Menswear Formal', 'Trousers', 'Pleated', 'Round Neck', 'Ultimate', 'Navy', 'Regular', 'Solid', 3499, 3199, APPAREL_SIZES, 45, 180, 120, 1.4,
    [{ label: 'Waist Rise', value: 'High Rise' }, { label: 'Length', value: 'Full Length' }, { label: 'Pleat', value: 'Single Pleat' }, { label: 'Closure', value: 'Hook & Bar' }, { label: 'Lining', value: 'Half Lined' }, { label: 'Occasion', value: 'Formal' }]),

  // ── Womenswear Western — Tops ──────────────────────────────────────────
  buildProduct('WW-BL-018', 'Ruffle Sleeve Blouse', 'Womenswear Western', 'Tops & Tees', 'Blouses', 'Round Neck', 'Ultimate', 'Coral', 'Regular', 'Solid', 1799, 1649, APPAREL_SIZES, 22, 350, 280, 5.6,
    [{ label: 'Sleeve Length', value: 'Short Sleeve' }, { label: 'Sleeve Detail', value: 'Ruffle' }, { label: 'Neck Type', value: 'V-Neck' }, { label: 'Length', value: 'Regular' }, { label: 'Occasion', value: 'Work / Casual' }]),
  buildProduct('WW-CT-019', 'Ribbed Crop Top', 'Womenswear Western', 'Tops & Tees', 'Crop Tops', 'Round Neck', 'Fast Fashion', 'Pink', 'Slim', 'Solid', 699, 599, APPAREL_SIZES, 12, 500, 340, 8.2,
    [{ label: 'Sleeve Length', value: 'Sleeveless' }, { label: 'Neck Type', value: 'Round Neck' }, { label: 'Length', value: 'Crop' }, { label: 'Knit Type', value: 'Ribbed' }, { label: 'Occasion', value: 'Casual' }]),
  buildProduct('WW-TS-020', 'Oversized Logo Tee', 'Womenswear Western', 'Tops & Tees', 'T-Shirts', 'Round Neck', 'Fashion Basics', 'White', 'Oversized', 'Printed', 999, 899, APPAREL_SIZES, 35, 420, 260, 3.4,
    [{ label: 'Sleeve Length', value: 'Half Sleeve' }, { label: 'Neck Type', value: 'Round Neck' }, { label: 'Length', value: 'Long / Hip' }, { label: 'Occasion', value: 'Casual / Lounge' }]),

  // ── Womenswear Western — Dresses ───────────────────────────────────────
  buildProduct('WW-DR-021', 'A-Line Midi Dress', 'Womenswear Western', 'Dresses', 'Midi', 'Round Neck', 'Ultimate', 'Teal', 'Regular', 'Floral', 2999, 2749, APPAREL_SIZES, 30, 220, 168, 2.4,
    [{ label: 'Sleeve Length', value: '3/4 Sleeve' }, { label: 'Neck Type', value: 'Square Neck' }, { label: 'Length', value: 'Midi (Calf)' }, { label: 'Silhouette', value: 'A-Line' }, { label: 'Closure', value: 'Back Zip' }, { label: 'Occasion', value: 'Party / Date Night' }]),
  buildProduct('WW-DR-022', 'Wrap Maxi Dress', 'Womenswear Western', 'Dresses', 'Maxi', 'Round Neck', 'Fashion Basics', 'Mustard', 'Regular', 'Printed', 2499, 2199, APPAREL_SIZES, 52, 280, 148, 1.4,
    [{ label: 'Sleeve Length', value: 'Short Sleeve' }, { label: 'Neck Type', value: 'V-Neck Wrap' }, { label: 'Length', value: 'Maxi (Floor)' }, { label: 'Silhouette', value: 'Wrap' }, { label: 'Closure', value: 'Tie Waist' }, { label: 'Occasion', value: 'Casual / Beach' }]),
  buildProduct('WW-DR-023', 'Bodycon Mini Dress', 'Womenswear Western', 'Dresses', 'Mini', 'Round Neck', 'Fast Fashion', 'Black', 'Slim', 'Solid', 1499, 1199, APPAREL_SIZES, 20, 300, 210, 4.8,
    [{ label: 'Sleeve Length', value: 'Sleeveless' }, { label: 'Neck Type', value: 'Square Neck' }, { label: 'Length', value: 'Mini (Above Knee)' }, { label: 'Silhouette', value: 'Bodycon' }, { label: 'Closure', value: 'Back Zip' }, { label: 'Occasion', value: 'Party / Club' }]),

  // ── Womenswear Western — Bottom Wear ───────────────────────────────────
  buildProduct('WW-JN-024', 'High-Rise Wide Leg Jeans', 'Womenswear Western', 'Bottom Wear', 'Jeans', 'Relaxed', 'Core', 'Medium Blue', 'Wide', 'Washed', 2299, 2099, APPAREL_SIZES, 44, 360, 300, 3.2,
    [{ label: 'Waist Rise', value: 'High Rise' }, { label: 'Length', value: 'Full Length' }, { label: 'Wash', value: 'Medium Wash' }, { label: 'Stretch', value: 'Non-Stretch' }, { label: 'Closure', value: 'Button Fly' }]),
  buildProduct('WW-SK-025', 'Printed Wrap Skirt', 'Womenswear Western', 'Bottom Wear', 'Shorts', 'Relaxed', 'Fashion Basics', 'Multi', 'Regular', 'Printed', 1299, 1099, APPAREL_SIZES, 68, 240, 100, 0.6,
    [{ label: 'Waist Rise', value: 'High Rise' }, { label: 'Length', value: 'Knee Length' }, { label: 'Silhouette', value: 'Wrap' }, { label: 'Closure', value: 'Tie Waist' }, { label: 'Lining', value: 'Lined' }]),

  // ── Womenswear Ethnic — Kurtas ─────────────────────────────────────────
  buildProduct('WE-KR-026', 'Chikankari Straight Kurta', 'Womenswear Ethnic', 'Kurtas & Kurtis', 'Straight', 'Round Neck', 'Core', 'White', 'Regular', 'Embroidered', 1999, 1899, APPAREL_SIZES, 38, 500, 440, 5.0,
    [{ label: 'Sleeve Length', value: '3/4 Sleeve' }, { label: 'Neck Type', value: 'Round Neck' }, { label: 'Kurta Length', value: 'Calf Length' }, { label: 'Work Type', value: 'Chikankari Hand Embroidery' }, { label: 'Occasion', value: 'Festive / Daily' }, { label: 'Transparency', value: 'Semi-Sheer' }]),
  buildProduct('WE-KR-027', 'Block Print A-Line Kurta', 'Womenswear Ethnic', 'Kurtas & Kurtis', 'A-Line', 'Round Neck', 'Ultimate', 'Maroon', 'Regular', 'Printed', 2499, 2349, APPAREL_SIZES, 25, 380, 310, 5.2,
    [{ label: 'Sleeve Length', value: 'Full Sleeve' }, { label: 'Neck Type', value: 'Mandarin Collar' }, { label: 'Kurta Length', value: 'Calf Length' }, { label: 'Work Type', value: 'Hand Block Print' }, { label: 'Occasion', value: 'Festive / Office' }, { label: 'Side Slit', value: 'Yes' }]),
  buildProduct('WE-KR-028', 'Embroidered Anarkali Kurta', 'Womenswear Ethnic', 'Kurtas & Kurtis', 'Anarkali', 'Round Neck', 'Ultimate', 'Royal Blue', 'Regular', 'Embroidered', 3499, 3249, APPAREL_SIZES, 40, 220, 186, 2.0,
    [{ label: 'Sleeve Length', value: 'Full Sleeve' }, { label: 'Neck Type', value: 'V-Neck' }, { label: 'Kurta Length', value: 'Floor Length' }, { label: 'Work Type', value: 'Zari & Thread Embroidery' }, { label: 'Flare', value: 'Full Flare (Kali)' }, { label: 'Occasion', value: 'Wedding / Festive' }, { label: 'Lining', value: 'Fully Lined' }]),
  buildProduct('WE-KR-029', 'Cotton Printed Kurta', 'Womenswear Ethnic', 'Kurtas & Kurtis', 'Straight', 'Round Neck', 'Fashion Basics', 'Green', 'Regular', 'Printed', 999, 899, APPAREL_SIZES, 58, 600, 320, 2.4,
    [{ label: 'Sleeve Length', value: 'Half Sleeve' }, { label: 'Neck Type', value: 'Keyhole Neck' }, { label: 'Kurta Length', value: 'Knee Length' }, { label: 'Work Type', value: 'Screen Print' }, { label: 'Occasion', value: 'Daily Wear' }]),

  // ── Womenswear Ethnic — Sarees ─────────────────────────────────────────
  buildProduct('WE-SR-030', 'Banarasi Silk Saree', 'Womenswear Ethnic', 'Sarees', 'Silk', 'Round Neck', 'Ultimate', 'Red', 'Regular', 'Woven', 5999, 5499, APPAREL_SIZES, 55, 120, 82, 0.8,
    [{ label: 'Saree Length', value: '5.5 meters' }, { label: 'Blouse Piece', value: 'Included (0.8m)' }, { label: 'Border Type', value: 'Zari Border' }, { label: 'Pallu', value: 'Rich Woven Pallu' }, { label: 'Occasion', value: 'Wedding / Festive' }, { label: 'Origin', value: 'Banaras' }]),
  buildProduct('WE-SR-031', 'Cotton Handloom Saree', 'Womenswear Ethnic', 'Sarees', 'Cotton', 'Round Neck', 'Core', 'Beige', 'Regular', 'Woven', 2999, 2799, APPAREL_SIZES, 42, 200, 156, 1.6,
    [{ label: 'Saree Length', value: '5.5 meters' }, { label: 'Blouse Piece', value: 'Included (0.8m)' }, { label: 'Border Type', value: 'Contrast Border' }, { label: 'Weave', value: 'Handloom' }, { label: 'Occasion', value: 'Office / Daily' }]),
  buildProduct('WE-SR-032', 'Georgette Printed Saree', 'Womenswear Ethnic', 'Sarees', 'Georgette', 'Round Neck', 'Fashion Basics', 'Peach', 'Regular', 'Printed', 1799, 1499, APPAREL_SIZES, 75, 280, 110, 0.5,
    [{ label: 'Saree Length', value: '5.5 meters' }, { label: 'Blouse Piece', value: 'Included (0.8m)' }, { label: 'Border Type', value: 'Printed Border' }, { label: 'Drape', value: 'Lightweight Flow' }, { label: 'Occasion', value: 'Party / Casual' }]),

  // ── Womenswear Ethnic — Salwar ─────────────────────────────────────────
  buildProduct('WE-SS-033', 'Chikankari Kurta Set', 'Womenswear Ethnic', 'Salwar Sets', 'Straight', 'Round Neck', 'Core', 'Mint', 'Regular', 'Embroidered', 2999, 2849, APPAREL_SIZES, 30, 260, 236, 4.2,
    [{ label: 'Set Contents', value: 'Kurta + Palazzo' }, { label: 'Dupatta', value: 'Not Included' }, { label: 'Kurta Length', value: 'Calf Length' }, { label: 'Bottom Type', value: 'Palazzo' }, { label: 'Work Type', value: 'Chikankari' }, { label: 'Occasion', value: 'Festive / Office' }]),
  buildProduct('WE-SS-034', 'Chanderi Suit Set', 'Womenswear Ethnic', 'Salwar Sets', 'A-Line', 'Round Neck', 'Ultimate', 'Yellow', 'Regular', 'Printed', 4499, 4199, APPAREL_SIZES, 48, 160, 104, 1.0,
    [{ label: 'Set Contents', value: 'Kurta + Churidar + Dupatta' }, { label: 'Dupatta', value: 'Chanderi Silk' }, { label: 'Kurta Length', value: 'Calf Length' }, { label: 'Bottom Type', value: 'Churidar' }, { label: 'Work Type', value: 'Block Print + Gota' }, { label: 'Occasion', value: 'Wedding / Festive' }]),

  // ── Kidswear ───────────────────────────────────────────────────────────
  buildProduct('KW-BT-035', 'Character Print Boys Tee', 'Kidswear', 'Boys Top Wear', 'T-Shirts', 'Round Neck', 'Core', 'Blue', 'Regular', 'Printed', 499, 449, KIDS_SIZES, 20, 800, 720, 7.0,
    [{ label: 'Sleeve Length', value: 'Half Sleeve' }, { label: 'Neck Type', value: 'Round Neck' }, { label: 'Age Group', value: '4-12 Years' }, { label: 'Wash Care', value: 'Machine Wash' }, { label: 'Skin Friendly', value: 'Yes (BIS Certified)' }]),
  buildProduct('KW-BT-036', 'Stripe Polo Boys', 'Kidswear', 'Boys Top Wear', 'Polo Shirts', 'Round Neck', 'Fashion Basics', 'Navy', 'Regular', 'Striped', 699, 649, KIDS_SIZES, 35, 500, 310, 3.8,
    [{ label: 'Sleeve Length', value: 'Half Sleeve' }, { label: 'Collar Type', value: 'Polo Collar' }, { label: 'Age Group', value: '4-12 Years' }, { label: 'Wash Care', value: 'Machine Wash' }]),
  buildProduct('KW-GT-037', 'Floral Print Girls Top', 'Kidswear', 'Girls Top Wear', 'T-Shirts', 'Round Neck', 'Fashion Basics', 'Pink', 'Regular', 'Floral', 599, 549, KIDS_SIZES, 28, 600, 380, 4.2,
    [{ label: 'Sleeve Length', value: 'Cap Sleeve' }, { label: 'Neck Type', value: 'Round Neck' }, { label: 'Age Group', value: '2-10 Years' }, { label: 'Wash Care', value: 'Machine Wash' }, { label: 'Closure', value: 'Back Button' }]),
  buildProduct('KW-BW-038', 'Cargo Shorts Boys', 'Kidswear', 'Bottom Wear', 'Shorts', 'Relaxed', 'Core', 'Khaki', 'Regular', 'Solid', 599, 549, KIDS_SIZES, 40, 450, 340, 3.0,
    [{ label: 'Waist Type', value: 'Elasticated with Drawstring' }, { label: 'Length', value: 'Above Knee' }, { label: 'Pockets', value: '6 Pocket Cargo' }, { label: 'Age Group', value: '4-14 Years' }]),
  buildProduct('KW-SC-039', 'Cotton Pajama Set', 'Kidswear', 'Sets & Combos', 'Shorts', 'Relaxed', 'Fashion Basics', 'Multi', 'Regular', 'Printed', 799, 699, KIDS_SIZES, 22, 350, 250, 4.8,
    [{ label: 'Set Contents', value: 'T-Shirt + Pajama' }, { label: 'Sleeve Length', value: 'Half Sleeve' }, { label: 'Age Group', value: '2-10 Years' }, { label: 'Wash Care', value: 'Machine Wash' }, { label: 'Skin Friendly', value: 'Yes' }]),
  buildProduct('KW-SC-040', 'Festive Kurta-Pajama Set', 'Kidswear', 'Sets & Combos', 'Shorts', 'Relaxed', 'Ultimate', 'Cream', 'Regular', 'Embroidered', 1499, 1399, KIDS_SIZES, 15, 200, 120, 3.2,
    [{ label: 'Set Contents', value: 'Kurta + Pajama' }, { label: 'Sleeve Length', value: 'Full Sleeve' }, { label: 'Neck Type', value: 'Mandarin Collar' }, { label: 'Age Group', value: '2-12 Years' }, { label: 'Occasion', value: 'Festive / Wedding' }]),

  // ── Footwear ───────────────────────────────────────────────────────────
  buildProduct('FW-SN-041', 'Canvas Low-Top Sneaker', 'Footwear', 'Casual Shoes', 'Sneakers', 'Low Top', 'Core', 'White', 'Regular', 'Solid', 1999, 1849, FOOTWEAR_SIZES, 50, 300, 252, 2.2,
    [{ label: 'Upper Material', value: 'Canvas' }, { label: 'Sole', value: 'Vulcanised Rubber' }, { label: 'Closure', value: 'Lace-Up' }, { label: 'Ankle Height', value: 'Low Top' }, { label: 'Occasion', value: 'Casual / Street' }, { label: 'Weight', value: '320g (per shoe)' }]),
  buildProduct('FW-SN-042', 'Knit Running Shoe', 'Footwear', 'Casual Shoes', 'Sneakers', 'Running', 'Ultimate', 'Black', 'Regular', 'Solid', 3499, 3299, FOOTWEAR_SIZES, 30, 200, 150, 2.0,
    [{ label: 'Upper Material', value: 'Engineered Knit Mesh' }, { label: 'Sole', value: 'Phylon + Rubber' }, { label: 'Closure', value: 'Lace-Up' }, { label: 'Cushioning', value: 'EVA Midsole' }, { label: 'Occasion', value: 'Running / Active' }, { label: 'Weight', value: '280g (per shoe)' }]),
  buildProduct('FW-LF-043', 'Leather Penny Loafer', 'Footwear', 'Casual Shoes', 'Loafers', 'Low Top', 'Fashion Basics', 'Tan', 'Regular', 'Solid', 2499, 2199, FOOTWEAR_SIZES, 62, 180, 80, 0.6,
    [{ label: 'Upper Material', value: 'Genuine Leather' }, { label: 'Sole', value: 'Leather + Rubber' }, { label: 'Closure', value: 'Slip-On' }, { label: 'Insole', value: 'Cushioned Leather' }, { label: 'Occasion', value: 'Smart Casual / Office' }]),
  buildProduct('FW-SL-044', 'Slide Sandal', 'Footwear', 'Casual Shoes', 'Slip-ons', 'Low Top', 'Fast Fashion', 'Black', 'Regular', 'Solid', 599, 499, FOOTWEAR_SIZES, 8, 400, 90, 6.5,
    [{ label: 'Upper Material', value: 'EVA' }, { label: 'Sole', value: 'EVA' }, { label: 'Closure', value: 'Slip-On' }, { label: 'Occasion', value: 'Casual / Home' }, { label: 'Waterproof', value: 'Yes' }, { label: 'Weight', value: '150g (per shoe)' }]),
  buildProduct('FW-FM-045', 'Derby Oxford Formal', 'Footwear', 'Casual Shoes', 'Loafers', 'Low Top', 'Core', 'Brown', 'Regular', 'Solid', 3999, 3799, FOOTWEAR_SIZES, 85, 150, 80, 0.3,
    [{ label: 'Upper Material', value: 'Full Grain Leather' }, { label: 'Sole', value: 'Leather' }, { label: 'Closure', value: 'Lace-Up' }, { label: 'Toe Shape', value: 'Round Toe' }, { label: 'Insole', value: 'Leather + Memory Foam' }, { label: 'Occasion', value: 'Formal / Office' }]),

  // ── Additional mixed products ──────────────────────────────────────────
  buildProduct('MC-TS-046', 'Tie-Dye Relaxed Tee', 'Menswear Casual', 'Top Wear', 'T-Shirts', 'Round Neck', 'Fast Fashion', 'Purple', 'Relaxed', 'Tie-Dye', 1199, 999, APPAREL_SIZES, 3, 180, 10, 3.3,
    [{ label: 'Sleeve Length', value: 'Half Sleeve' }, { label: 'Neck Type', value: 'Round Neck' }, { label: 'Occasion', value: 'Casual / Street' }, { label: 'Wash Care', value: 'Hand Wash Separately' }]),
  buildProduct('WW-BL-047', 'Satin Peplum Blouse', 'Womenswear Western', 'Tops & Tees', 'Blouses', 'Round Neck', 'Ultimate', 'Emerald', 'Slim', 'Solid', 2299, 2099, APPAREL_SIZES, 15, 180, 120, 3.6,
    [{ label: 'Sleeve Length', value: 'Cap Sleeve' }, { label: 'Neck Type', value: 'Sweetheart Neck' }, { label: 'Length', value: 'Peplum (Waist)' }, { label: 'Closure', value: 'Back Zip' }, { label: 'Occasion', value: 'Party / Evening' }, { label: 'Lining', value: 'Fully Lined' }]),
  buildProduct('WE-DP-048', 'Banarasi Silk Dupatta', 'Womenswear Ethnic', 'Dupattas', 'Silk', 'Round Neck', 'Ultimate', 'Gold', 'Regular', 'Woven', 1999, 1849, APPAREL_SIZES, 35, 150, 110, 1.6,
    [{ label: 'Length', value: '2.5 meters' }, { label: 'Width', value: '0.9 meters' }, { label: 'Border Type', value: 'Zari Woven' }, { label: 'Occasion', value: 'Festive / Wedding' }, { label: 'Origin', value: 'Banaras' }]),
];

// ─── Segment → products lookup ──────────────────────────────────────────────

export function getProductsByStore(storeCode: string): ProductOption[] {
  return mockProducts.filter((p) => p.stores.some((s) => s.storeCode === storeCode));
}

export function getAllSegments(): string[] {
  return [...new Set(mockProducts.map((p) => p.segment))];
}

export function getFamiliesBySegment(segment: string): string[] {
  return [...new Set(mockProducts.filter((p) => p.segment === segment).map((p) => p.family))];
}

export function getClassesByFamily(segment: string, family: string): string[] {
  return [...new Set(mockProducts.filter((p) => p.segment === segment && p.family === family).map((p) => p.classLevel))];
}
