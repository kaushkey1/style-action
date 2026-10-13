// ─── Types ──────────────────────────────────────────────────────────────────

export type PlanStatus = 'not_run' | 'draft' | 'review' | 'approved';
export type BoundBadge = 'free' | '@lower' | '@upper' | '>sigmaMax' | 'manual';
export type PodBoundBadge = 'ok' | '@min' | '@max' | '>max';
export type DepthFlag = 'OK' | 'SHORT';

export interface StoreAssumptions {
  efficiencyBands: Record<string, { low: number; high: number }>;
  wSpsfWeights: [number, number, number];
  blend: [number, number];
  footwearCapSqft: number;
  bestOfRestPct: number;
  bestOfRestThreshold: number;
  sellThroughPct: number;
  initialDeductions: Record<string, number>;
  totalDeductionPct: number;
  footwearPct: number;
  ebPct: number;
}

export interface ReferenceDataItem {
  label: string;
  value: string;
  synced: boolean;
}

export interface EnvelopeStep {
  label: string;
  value: number;
  isSubtraction: boolean;
  isResult: boolean;
  /** Rule annotation from the API (e.g. "10% of carpet, cap 1,200"); absent for mock data. */
  rule?: string | null;
  /** Sub-components (initial-deduction lines) from the API; absent for mock data. */
  children?: Array<{ label: string; value: number; rule?: string | null }>;
}

export interface CategoryAllocation {
  code: string;
  name: string;
  currentSpace: number;
  newSpace: number;
  share: number;
  efficiencyLow: number;
  efficiencyHigh: number;
  efficiencyActual: number;
  lowerBound: number;
  upperBound: number;
  sigmaMin: number;
  sigmaMax: number;
  boundBadge: BoundBadge;
  optionsMin: number;
  optionsMax: number;
  unitsMin: number;
  unitsMax: number;
  isManual: boolean;
  salesShare: number;
  /** Real floor assignment from category_result_v1.floor (API); absent for mock data. */
  floor?: string | null;
  /** Space in the same 3-month season last year (AW25) from the API; absent for mock data. */
  prevYearSpaceSqft?: number | null;
  /** SPSF windows (₹/sft/month) from the API; absent for mock data. */
  prevYearSpsf?: number | null;
  currentSpsf?: number | null;
  threeYrSpsf?: number | null;
  spsfTrendPct?: number | null;
}

export interface FloorLayout {
  label: string;
  categories: Array<{ code: string; name: string; space: number }>;
  totalSpace: number;
}

export interface SubcategoryPod {
  id: number;
  name: string;
  categoryCode: string;
  min: number;
  max: number;
  minPct: number;
  maxPct: number;
  newSpace: number;
  optionsMin: number;
  optionsMax: number;
  unitsMin: number;
  unitsMax: number;
  depthFlag: DepthFlag;
  boundBadge: PodBoundBadge;
  isManual: boolean;
}

export interface VersionDiff {
  field: string;
  oldValue: string;
  newValue: string;
  note: string;
}

export interface VersionEntry {
  version: number;
  timestamp: string;
  author: string;
  summary: string;
  isCurrent: boolean;
  /** saved against an older engine run — shown in history, never applied */
  isStale?: boolean;
  diffs: VersionDiff[];
  snapshot: {
    assumptions: StoreAssumptions;
    categories: CategoryAllocation[];
    pods: SubcategoryPod[];
  } | null;
}

export interface Scenario {
  id: string;
  name: string;
  isActive: boolean;
  categories: CategoryAllocation[];
  pods: SubcategoryPod[];
  assumptions: StoreAssumptions;
  plPool: number;
  exceptionCount: number;
  optionsTotalMin: number;
  optionsTotalMax: number;
}

export interface SpacePlanStore {
  code: string;
  name: string;
  city: string;
  format: string;
  floors: number;
  carpetArea: number;
  status: PlanStatus;
  flagCount: number;
  currentVersion: number;
  lastEditedAt: string;
  lastEditedBy: string;
  categories: CategoryAllocation[];
  pods: SubcategoryPod[];
  assumptions: StoreAssumptions;
  referenceData: ReferenceDataItem[];
  versions: VersionEntry[];
  scenarios: Scenario[];
}

// ─── Computation Engine (pure functions) ────────────────────────────────────

export function computeEnvelope(carpet: number, assumptions: StoreAssumptions): EnvelopeStep[] {
  const deductionAmt = Math.round(carpet * assumptions.totalDeductionPct / 100);
  const footwearAmt = Math.min(
    Math.round(carpet * assumptions.footwearPct / 100),
    assumptions.footwearCapSqft,
  );
  const apparelSpace = carpet - deductionAmt - footwearAmt;
  const ebTotal = Math.round(apparelSpace * assumptions.ebPct / 100);
  const plPreBor = apparelSpace - ebTotal;
  const borAmt = carpet > assumptions.bestOfRestThreshold
    ? Math.round(plPreBor * assumptions.bestOfRestPct / 100)
    : 0;
  const plPool = plPreBor - borAmt;

  return [
    { label: 'Carpet area', value: carpet, isSubtraction: false, isResult: false },
    { label: `Initial deductions (${assumptions.totalDeductionPct}%)`, value: -deductionAmt, isSubtraction: true, isResult: false },
    { label: `Footwear (${assumptions.footwearPct}%, cap ${assumptions.footwearCapSqft.toLocaleString()})`, value: -footwearAmt, isSubtraction: true, isResult: false },
    { label: 'Apparel space', value: apparelSpace, isSubtraction: false, isResult: true },
    { label: `External Brands (${assumptions.ebPct}% of apparel)`, value: -ebTotal, isSubtraction: true, isResult: false },
    { label: 'PL apparel (pre-Best-of-Rest)', value: plPreBor, isSubtraction: false, isResult: true },
    { label: `Best of Rest (${assumptions.bestOfRestPct}%, carpet > ${(assumptions.bestOfRestThreshold / 1000).toFixed(0)}k)`, value: -borAmt, isSubtraction: true, isResult: false },
    { label: 'PL POOL', value: plPool, isSubtraction: false, isResult: true },
  ];
}

export function getPlPool(carpet: number, assumptions: StoreAssumptions): number {
  const steps = computeEnvelope(carpet, assumptions);
  const last = steps[steps.length - 1];
  return last ? last.value : 0;
}

export function solveCategories(
  pool: number,
  categories: CategoryAllocation[],
  pinnedIndex?: number,
  pinnedValue?: number,
): CategoryAllocation[] {
  const result = categories.map((c) => ({ ...c }));

  if (pinnedIndex !== undefined && pinnedValue !== undefined) {
    const target = result[pinnedIndex];
    if (target) {
      target.newSpace = pinnedValue;
      target.isManual = true;
      target.boundBadge = 'manual';
    }
  }

  const pinnedTotal = pinnedIndex !== undefined
    ? (result[pinnedIndex]?.newSpace ?? 0)
    : 0;
  const remaining = pool - pinnedTotal;

  const unpinned = result.filter((_, i) => i !== pinnedIndex);
  const unpinnedCurrentTotal = unpinned.reduce((s, c) => s + c.newSpace, 0);

  if (unpinnedCurrentTotal > 0) {
    // MIN-only rebalance (no ceiling): distribute the remaining pool
    // proportionally; anyone pushed below their floor is clamped at it and the
    // shortfall cascades to the still-unclamped categories.
    let targetTotal = remaining;
    let active = [...unpinned];
    let guard = 0;
    while (active.length > 0 && guard < unpinned.length + 1) {
      guard++;
      const activeCurrent = active.reduce((s, c) => s + c.newSpace, 0);
      if (activeCurrent <= 0) break;
      const scale = targetTotal / activeCurrent;
      const clampedNow = active.filter((c) => Math.round(c.newSpace * scale) < c.lowerBound);
      if (clampedNow.length === 0) {
        for (const cat of active) cat.newSpace = Math.round(cat.newSpace * scale);
        break;
      }
      for (const cat of clampedNow) {
        cat.newSpace = cat.lowerBound;
        targetTotal -= cat.lowerBound;
      }
      active = active.filter((c) => !clampedNow.includes(c));
    }
    for (const cat of unpinned) {
      if (!cat.isManual) {
        cat.boundBadge = cat.newSpace <= cat.lowerBound ? '@lower' : 'free';
      }
    }
  }

  // Conservation: Σ newSpace must equal the pool exactly. Assign the rounding
  // remainder to a category that stays at/above its floor (largest first);
  // fall back to the pinned category so the invariant always holds.
  const actualTotal = result.reduce((s, c) => s + c.newSpace, 0);
  const diff = pool - actualTotal;
  if (diff !== 0) {
    const adjustable = [...unpinned]
      .filter((c) => c.newSpace + diff >= c.lowerBound)
      .sort((a, b) => b.newSpace - a.newSpace)[0]
      ?? (pinnedIndex !== undefined ? result[pinnedIndex] : undefined);
    if (adjustable) {
      adjustable.newSpace += diff;
    }
  }

  for (const cat of result) {
    cat.share = pool > 0 ? Math.round((cat.newSpace / pool) * 1000) / 10 : 0;
    cat.optionsMin = Math.round(cat.newSpace * 0.18);
    cat.optionsMax = Math.round(cat.newSpace * 0.25);
    cat.unitsMin = Math.round(cat.newSpace * 3.3);
    cat.unitsMax = Math.round(cat.newSpace * 4.5);

    if (cat.newSpace > cat.sigmaMax && cat.boundBadge !== 'manual') {
      cat.boundBadge = '>sigmaMax';
    }
  }

  return result;
}

export function solvePods(
  categorySpace: number,
  pods: SubcategoryPod[],
  pinnedIndex?: number,
  pinnedValue?: number,
): SubcategoryPod[] {
  const result = pods.map((p) => ({ ...p }));

  // MIN is the only hard bound; MAX is a soft guideline kept for the neutral
  // @max info tag only (pods may legitimately exceed it).
  for (const pod of result) {
    pod.min = Math.round(pod.minPct * categorySpace);
    pod.max = Math.round(pod.maxPct * categorySpace);
  }

  if (pinnedIndex !== undefined && pinnedValue !== undefined) {
    const target = result[pinnedIndex];
    if (target) {
      target.newSpace = pinnedValue;
      target.isManual = true;
    }
  }

  const pinnedTotal = pinnedIndex !== undefined
    ? (result[pinnedIndex]?.newSpace ?? 0)
    : 0;
  const remaining = categorySpace - pinnedTotal;

  const unpinned = result.filter((_, i) => i !== pinnedIndex);
  const unpinnedCurrentTotal = unpinned.reduce((s, p) => s + p.newSpace, 0);

  if (unpinnedCurrentTotal > 0) {
    // MIN-only rebalance: distribute proportionally; anyone pushed below their
    // floor is clamped at it and the shortfall cascades to the rest.
    let targetTotal = remaining;
    let active = [...unpinned];
    let guard = 0;
    while (active.length > 0 && guard < unpinned.length + 1) {
      guard++;
      const activeCurrent = active.reduce((s, p) => s + p.newSpace, 0);
      if (activeCurrent <= 0) break;
      const scale = targetTotal / activeCurrent;
      const clampedNow = active.filter((p) => Math.round(p.newSpace * scale) < p.min);
      if (clampedNow.length === 0) {
        for (const pod of active) pod.newSpace = Math.round(pod.newSpace * scale);
        break;
      }
      for (const pod of clampedNow) {
        pod.newSpace = pod.min;
        targetTotal -= pod.min;
      }
      active = active.filter((p) => !clampedNow.includes(p));
    }
  }

  // Conservation: Σ pod space must equal the category space exactly.
  const actualTotal = result.reduce((s, p) => s + p.newSpace, 0);
  const diff = categorySpace - actualTotal;
  if (diff !== 0) {
    const adjustable = [...unpinned]
      .filter((p) => p.newSpace + diff >= p.min)
      .sort((a, b) => b.newSpace - a.newSpace)[0]
      ?? (pinnedIndex !== undefined ? result[pinnedIndex] : undefined);
    if (adjustable) {
      adjustable.newSpace += diff;
    }
  }

  for (const pod of result) {
    pod.optionsMin = Math.round(pod.newSpace * 0.12);
    pod.optionsMax = Math.round(pod.newSpace * 0.16);
    pod.unitsMin = Math.round(pod.newSpace * 2.1);
    pod.unitsMax = Math.round(pod.newSpace * 2.8);
    // Neutral bound tag (not an error state): AT_MIN / AT_MAX / OK.
    pod.boundBadge = pod.newSpace <= pod.min ? '@min'
      : pod.newSpace >= pod.max ? '@max'
      : 'ok';
    pod.depthFlag = pod.unitsMin / Math.max(pod.optionsMax, 1) < 4 ? 'SHORT' : 'OK';
  }

  return result;
}

export interface ValidationResult {
  valid: boolean;
  message: string;
  clampedValue?: number;
}

export function validateCategoryEdit(
  value: number,
  category: CategoryAllocation,
  pool: number,
  allCategories: CategoryAllocation[],
  editIndex: number,
): ValidationResult {
  // MIN-only validation: the category MAX/ceiling constraint was removed.
  // Effective floor = max(lower_share x pool, sigma_min) — baked into lowerBound.
  const min = category.lowerBound;
  if (value < min) {
    return {
      valid: false,
      message: `Below minimum — ${category.code} floor is ${min.toLocaleString()}. Clamp to ${min.toLocaleString()}?`,
      clampedValue: min,
    };
  }

  // Derived feasibility limit (pool is fixed): the edit may not push any other
  // category below its minimum. Not a business ceiling.
  const othersMinTotal = allCategories
    .filter((_, i) => i !== editIndex)
    .reduce((s, c) => s + c.lowerBound, 0);
  const maxAllowed = pool - othersMinTotal;

  if (value > maxAllowed) {
    return {
      valid: false,
      message: `Too high — leaves other categories below their minimums. Max available is ${maxAllowed.toLocaleString()}. Clamp?`,
      clampedValue: maxAllowed,
    };
  }

  return { valid: true, message: '' };
}

export function validatePodEdit(
  value: number,
  pod: SubcategoryPod,
  categorySpace: number,
  allPods: SubcategoryPod[],
  editIndex: number,
): ValidationResult {
  // MIN-only validation: pod MAX is a soft guideline, not a constraint.
  const min = Math.round(pod.minPct * categorySpace);

  if (value < min) {
    return {
      valid: false,
      message: `Below minimum — pod floor is ${min.toLocaleString()}. Clamp to ${min.toLocaleString()}?`,
      clampedValue: min,
    };
  }

  // Derived feasibility limit (category space is fixed): the edit may not push
  // any sibling pod below its minimum.
  const othersMinTotal = allPods
    .filter((_, i) => i !== editIndex)
    .reduce((s, p) => s + Math.round(p.minPct * categorySpace), 0);
  const maxAllowed = categorySpace - othersMinTotal;

  if (value > maxAllowed) {
    return {
      valid: false,
      message: `Too high — leaves other pods below their minimums. Max available is ${maxAllowed.toLocaleString()}. Clamp?`,
      clampedValue: maxAllowed,
    };
  }

  return { valid: true, message: '' };
}

export function getFloorLayouts(floors: number, categories: CategoryAllocation[]): FloorLayout[] {
  const catMap = new Map(categories.map((c) => [c.code, c]));
  const get = (code: string): { code: string; name: string; space: number } => {
    const c = catMap.get(code);
    return { code, name: c?.name ?? code, space: c?.newSpace ?? 0 };
  };

  if (floors === 1) {
    const cats = ['WIW', 'WWW', 'KW', 'MC', 'MF'].map(get);
    return [{ label: 'Ground', categories: cats, totalSpace: cats.reduce((s, c) => s + c.space, 0) }];
  }
  if (floors === 2) {
    const ground = ['WIW', 'WWW'].map(get);
    const first = ['KW', 'MC', 'MF'].map(get);
    return [
      { label: 'First', categories: first, totalSpace: first.reduce((s, c) => s + c.space, 0) },
      { label: 'Ground', categories: ground, totalSpace: ground.reduce((s, c) => s + c.space, 0) },
    ];
  }
  const ground = ['WIW'].map(get);
  const first = ['WWW', 'KW'].map(get);
  const second = ['MC', 'MF'].map(get);
  return [
    { label: 'Second', categories: second, totalSpace: second.reduce((s, c) => s + c.space, 0) },
    { label: 'First', categories: first, totalSpace: first.reduce((s, c) => s + c.space, 0) },
    { label: 'Ground', categories: ground, totalSpace: ground.reduce((s, c) => s + c.space, 0) },
  ];
}

// ─── Default Assumptions ────────────────────────────────────────────────────

function defaultAssumptions(): StoreAssumptions {
  return {
    efficiencyBands: {
      WIW: { low: 1.00, high: 1.20 },
      WWW: { low: 0.85, high: 1.05 },
      MC: { low: 0.90, high: 1.10 },
      MF: { low: 1.00, high: 1.20 },
      KW: { low: 0.80, high: 0.90 },
    },
    wSpsfWeights: [0.5, 0.3, 0.2],
    blend: [0.3, 0.7],
    footwearCapSqft: 1200,
    bestOfRestPct: 10,
    bestOfRestThreshold: 6000,
    sellThroughPct: 70,
    initialDeductions: { 'NON APPS': 1.25, Acc: 1.25, IW: 0.5, Lingerie: 2.0 },
    totalDeductionPct: 5,
    footwearPct: 10,
    ebPct: 24,
  };
}

// ─── Mock Store Generator ───────────────────────────────────────────────────

function makePods(catCode: string, catSpace: number): SubcategoryPod[] {
  const podDefs: Record<string, Array<{ id: number; name: string; minPct: number; maxPct: number }>> = {
    WIW: [
      { id: 14, name: 'Women Indian Kurta/SKD/Bottoms', minPct: 0.24, maxPct: 0.80 },
      { id: 16, name: 'Women Indian/Fusion: Festive SKD', minPct: 0.04, maxPct: 0.08 },
      { id: 18, name: 'Women Indian: Ethnic Sets', minPct: 0.10, maxPct: 0.25 },
    ],
    WWW: [
      { id: 20, name: 'Women Western: Casual Tops', minPct: 0.20, maxPct: 0.45 },
      { id: 22, name: 'Women Western: Dresses & Jumpsuits', minPct: 0.15, maxPct: 0.35 },
      { id: 24, name: 'Women Western: Denim & Trousers', minPct: 0.15, maxPct: 0.30 },
    ],
    MC: [
      { id: 2, name: 'Men Casual: Shirts & Tees', minPct: 0.30, maxPct: 0.50 },
      { id: 4, name: 'Men Casual: Trousers & Jeans', minPct: 0.25, maxPct: 0.45 },
      { id: 6, name: 'Men Casual: Polos & Jackets', minPct: 0.10, maxPct: 0.30 },
    ],
    MF: [
      { id: 8, name: 'Men Formal: Shirts', minPct: 0.30, maxPct: 0.50 },
      { id: 10, name: 'Men Formal: Trousers', minPct: 0.25, maxPct: 0.45 },
      { id: 12, name: 'Men Formal: Blazers & Suits', minPct: 0.10, maxPct: 0.25 },
    ],
    KW: [
      { id: 30, name: 'Kids Boys: Casual', minPct: 0.25, maxPct: 0.45 },
      { id: 32, name: 'Kids Girls: Casual', minPct: 0.25, maxPct: 0.45 },
      { id: 34, name: 'Kids: Ethnic & Festive', minPct: 0.10, maxPct: 0.25 },
    ],
  };

  const defs = podDefs[catCode] ?? [];
  const totalMidPct = defs.reduce((s, d) => s + (d.minPct + d.maxPct) / 2, 0);

  return defs.map((d) => {
    const midPct = (d.minPct + d.maxPct) / 2;
    const sharePct = totalMidPct > 0 ? midPct / totalMidPct : 1 / defs.length;
    const rawSpace = Math.round(catSpace * sharePct);
    const minSpace = Math.round(d.minPct * catSpace);
    const maxSpace = Math.round(d.maxPct * catSpace);
    const roundedSpace = Math.max(minSpace, Math.min(maxSpace, rawSpace));

    return {
      id: d.id,
      name: d.name,
      categoryCode: catCode,
      min: Math.round(d.minPct * catSpace),
      max: Math.round(d.maxPct * catSpace),
      minPct: d.minPct,
      maxPct: d.maxPct,
      newSpace: roundedSpace,
      optionsMin: Math.round(roundedSpace * 0.12),
      optionsMax: Math.round(roundedSpace * 0.16),
      unitsMin: Math.round(roundedSpace * 2.1),
      unitsMax: Math.round(roundedSpace * 2.8),
      depthFlag: 'OK' as DepthFlag,
      boundBadge: 'ok' as PodBoundBadge,
      isManual: false,
    };
  });
}

function makeCategories(plPool: number): CategoryAllocation[] {
  const defs = [
    { code: 'WIW', name: 'Women Indian Wear', share: 0.293, salesShare: 0.30, effLow: 1.00, effHigh: 1.20, current: 1346 },
    { code: 'WWW', name: 'Women Western Wear', share: 0.200, salesShare: 0.195, effLow: 0.85, effHigh: 1.05, current: 1520 },
    { code: 'MC', name: 'Men Casual', share: 0.162, salesShare: 0.168, effLow: 0.90, effHigh: 1.10, current: 1290 },
    { code: 'MF', name: 'Men Formal', share: 0.158, salesShare: 0.164, effLow: 1.00, effHigh: 1.20, current: 1180 },
    { code: 'KW', name: 'Kids Wear', share: 0.187, salesShare: 0.174, effLow: 0.80, effHigh: 0.90, current: 1560 },
  ];

  return defs.map((d) => {
    const newSpace = Math.round(plPool * d.share);
    const sigmaMin = Math.round(plPool * d.share * 0.65);
    const sigmaMax = Math.round(plPool * d.share * 1.15);
    const lowerBound = Math.max(sigmaMin, Math.round(plPool * d.share * d.effLow * 0.85));
    const upperBound = Math.round(plPool * d.share * d.effHigh * 1.05);
    const effActual = Math.round((d.effLow + d.effHigh) / 2 * 100) / 100;

    return {
      code: d.code,
      name: d.name,
      currentSpace: d.current,
      newSpace,
      share: Math.round(d.share * 1000) / 10,
      efficiencyLow: d.effLow,
      efficiencyHigh: d.effHigh,
      efficiencyActual: effActual,
      lowerBound,
      upperBound,
      sigmaMin,
      sigmaMax,
      boundBadge: 'free' as BoundBadge,
      optionsMin: Math.round(newSpace * 0.18),
      optionsMax: Math.round(newSpace * 0.25),
      unitsMin: Math.round(newSpace * 3.3),
      unitsMax: Math.round(newSpace * 4.5),
      isManual: false,
      salesShare: d.salesShare,
    };
  });
}

function makeVersions(
  numVersions: number,
  assumptions: StoreAssumptions,
  categories: CategoryAllocation[],
  pods: SubcategoryPod[],
): VersionEntry[] {
  const summaries = [
    'initial compute',
    'efficiency upper-bound rule change',
    'manual: KW space adjusted',
    'sell-through 70% → 72%',
    'accepted WIW overflow · WWW boosted',
    'seasonal rebalance',
  ];

  const timestamps = [
    '2026-02-17T09:12:00',
    '2026-02-17T16:40:00',
    '2026-02-19T14:00:00',
    '2026-02-20T11:05:00',
    '2026-02-20T14:20:00',
    '2026-02-21T09:30:00',
  ];

  const snap = {
    assumptions: { ...assumptions },
    categories: categories.map((c) => ({ ...c })),
    pods: pods.map((p) => ({ ...p })),
  };

  return Array.from({ length: numVersions }, (_, i) => ({
    version: i + 1,
    timestamp: timestamps[i] ?? `2026-02-${15 + i}T10:00:00`,
    author: i === 0 ? 'sys' : 'you',
    summary: summaries[i] ?? `version ${i + 1} update`,
    isCurrent: i === numVersions - 1,
    diffs: i === 0 ? [] : [
      { field: 'Category space', oldValue: '—', newValue: '—', note: summaries[i] ?? '' },
    ],
    snapshot: snap,
  }));
}

interface StoreSpec {
  code: string;
  name: string;
  city: string;
  format: string;
  floors: number;
  carpet: number;
  status: PlanStatus;
  flags: number;
  versions: number;
  ebPct: number;
}

const storeSpecs: StoreSpec[] = [
  { code: '8048', name: 'Bangalore RMM', city: 'Bangalore', format: 'Trends', floors: 1, carpet: 13171, status: 'draft', flags: 2, versions: 5, ebPct: 24 },
  { code: '8051', name: 'Pune Phoenix', city: 'Pune', format: 'Trends Man', floors: 2, carpet: 9420, status: 'approved', flags: 0, versions: 3, ebPct: 22 },
  { code: '8067', name: 'Surat VR', city: 'Surat', format: 'Trends Woman', floors: 1, carpet: 7150, status: 'review', flags: 1, versions: 2, ebPct: 26 },
  { code: '8090', name: 'Nagpur Empress', city: 'Nagpur', format: 'Trends Junior', floors: 1, carpet: 5800, status: 'draft', flags: 1, versions: 2, ebPct: 20 },
  { code: '8102', name: 'Delhi Select City', city: 'Delhi', format: 'Trends', floors: 3, carpet: 15400, status: 'draft', flags: 3, versions: 4, ebPct: 28 },
  { code: '8115', name: 'Mumbai Palladium', city: 'Mumbai', format: 'Trends', floors: 2, carpet: 11200, status: 'review', flags: 1, versions: 3, ebPct: 25 },
  { code: '8128', name: 'Chennai VR', city: 'Chennai', format: 'Trends Woman', floors: 1, carpet: 8300, status: 'draft', flags: 2, versions: 2, ebPct: 23 },
  { code: '8140', name: 'Hyderabad Nexus', city: 'Hyderabad', format: 'Trends', floors: 2, carpet: 10500, status: 'approved', flags: 0, versions: 6, ebPct: 21 },
];

function buildStore(spec: StoreSpec): SpacePlanStore {
  const assumptions = { ...defaultAssumptions(), ebPct: spec.ebPct };
  const plPool = getPlPool(spec.carpet, assumptions);
  const categories = makeCategories(plPool);
  const pods = categories.flatMap((c) => makePods(c.code, c.newSpace));

  if (spec.code === '8048') {
    const wiw = categories.find((c) => c.code === 'WIW');
    if (wiw) {
      wiw.newSpace = 2280;
      wiw.boundBadge = '>sigmaMax';
    }
    const www = categories.find((c) => c.code === 'WWW');
    if (www) {
      www.newSpace = 1560;
      www.isManual = true;
      www.boundBadge = 'manual';
    }
  }

  const ebArea = Math.round(spec.carpet * 0.85 * spec.ebPct / 100);

  return {
    code: spec.code,
    name: spec.name,
    city: spec.city,
    format: spec.format,
    floors: spec.floors,
    carpetArea: spec.carpet,
    status: spec.status,
    flagCount: spec.flags,
    currentVersion: spec.versions,
    lastEditedAt: '2026-02-20T14:20:00',
    lastEditedBy: 'you',
    categories,
    pods,
    assumptions,
    referenceData: [
      { label: 'EB area (by category)', value: ebArea.toLocaleString(), synced: true },
      { label: 'Sales history', value: 'loaded', synced: true },
      { label: 'AOP', value: 'loaded', synced: true },
      { label: 'Fixtures', value: 'loaded', synced: true },
    ],
    versions: makeVersions(spec.versions, assumptions, categories, pods),
    scenarios: [
      {
        id: `${spec.code}-base`,
        name: 'Baseline',
        isActive: true,
        categories: categories.map((c) => ({ ...c })),
        pods: pods.map((p) => ({ ...p })),
        assumptions: { ...assumptions },
        plPool,
        exceptionCount: spec.flags,
        optionsTotalMin: categories.reduce((s, c) => s + c.optionsMin, 0),
        optionsTotalMax: categories.reduce((s, c) => s + c.optionsMax, 0),
      },
    ],
  };
}

export const MOCK_STORES: SpacePlanStore[] = storeSpecs.map(buildStore);

export function getStoreByCode(code: string): SpacePlanStore | undefined {
  return MOCK_STORES.find((s) => s.code === code);
}

export const STATUS_CONFIG: Record<PlanStatus, { label: string; dot: string; color: string }> = {
  not_run: { label: 'Not run', dot: '○', color: 'text-gray-400' },
  draft: { label: 'Draft', dot: '●', color: 'text-amber-500' },
  review: { label: 'Review', dot: '◐', color: 'text-blue-500' },
  approved: { label: 'Approved', dot: '✓', color: 'text-green-700' },
};
