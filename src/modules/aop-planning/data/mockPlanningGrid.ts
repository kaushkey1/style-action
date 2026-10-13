import type { PlanningGridRow, ChannelId, StoreClassification, MonthCell, CategoryAllocation } from '../types/aopPlanning.types';
import { PLAN_MONTHS, CHANNEL_CATEGORIES, DEFAULT_CATEGORY_ALLOCATION } from './mockChannels';
import { SEASONALITY_WEIGHTS, getGuardrailBand, computeGuardrailStatus } from './mockGuardrails';

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

interface StoreDef {
  id: string;
  name: string;
  classification: StoreClassification;
  grade: string;
  fyTarget: number;
  priorYear: number;
  gmPct: number;
}

const STORE_DEFS: Record<ChannelId, StoreDef[]> = {
  EBO: [
    { id: 'ebo-s1', name: 'Mumbai Phoenix Mills', classification: 'LFL', grade: 'A', fyTarget: 4.2, priorYear: 3.9, gmPct: 13.1 },
    { id: 'ebo-s2', name: 'Delhi Select City Walk', classification: 'NEW', grade: 'A1', fyTarget: 3.1, priorYear: 0, gmPct: 12.8 },
    { id: 'ebo-s3', name: 'Bangalore Forum Mall', classification: 'ANNUALISED', grade: 'A', fyTarget: 2.6, priorYear: 1.8, gmPct: 13.4 },
    { id: 'ebo-s4', name: 'Pune Koregaon Park', classification: 'LFL', grade: 'A2', fyTarget: 1.9, priorYear: 1.8, gmPct: 12.2 },
    { id: 'ebo-s5', name: 'Chennai Express Avenue', classification: 'LFL', grade: 'A1', fyTarget: 2.4, priorYear: 2.2, gmPct: 12.9 },
    { id: 'ebo-s6', name: 'Hyderabad Inorbit', classification: 'CLOSURE', grade: 'A3', fyTarget: 0.8, priorYear: 1.1, gmPct: 10.5 },
    { id: 'ebo-s7', name: 'Kolkata Quest Mall', classification: 'LFL', grade: 'A2', fyTarget: 1.7, priorYear: 1.6, gmPct: 11.8 },
    { id: 'ebo-s8', name: 'Ahmedabad Palladium', classification: 'NEW', grade: 'A1', fyTarget: 2.8, priorYear: 0, gmPct: 13.0 },
    { id: 'ebo-s9', name: 'Jaipur World Trade Park', classification: 'LFL', grade: 'A2', fyTarget: 1.5, priorYear: 1.4, gmPct: 11.5 },
    { id: 'ebo-s10', name: 'Lucknow Lulu Mall', classification: 'ANNUALISED', grade: 'A2', fyTarget: 1.8, priorYear: 1.0, gmPct: 12.0 },
    { id: 'ebo-s11', name: 'Chandigarh Elante', classification: 'LFL', grade: 'A1', fyTarget: 2.0, priorYear: 1.9, gmPct: 12.4 },
    { id: 'ebo-s12', name: 'Goa Caculo Mall', classification: 'LFL', grade: 'A3', fyTarget: 0.9, priorYear: 0.85, gmPct: 10.8 },
  ],
  SIS: [
    { id: 'sis-s1', name: 'Shoppers Stop — Mumbai', classification: 'LFL', grade: 'A', fyTarget: 3.8, priorYear: 3.5, gmPct: 14.2 },
    { id: 'sis-s2', name: 'Lifestyle — Bangalore', classification: 'LFL', grade: 'A1', fyTarget: 2.9, priorYear: 2.7, gmPct: 13.6 },
    { id: 'sis-s3', name: 'Central — Delhi', classification: 'ANNUALISED', grade: 'A2', fyTarget: 1.5, priorYear: 1.0, gmPct: 12.0 },
    { id: 'sis-s4', name: 'Pantaloons — Pune', classification: 'LFL', grade: 'A2', fyTarget: 2.1, priorYear: 2.0, gmPct: 11.9 },
    { id: 'sis-s5', name: 'Westside — Chennai', classification: 'LFL', grade: 'A1', fyTarget: 2.5, priorYear: 2.3, gmPct: 13.1 },
    { id: 'sis-s6', name: 'Shoppers Stop — Hyderabad', classification: 'LFL', grade: 'A1', fyTarget: 2.2, priorYear: 2.0, gmPct: 13.0 },
    { id: 'sis-s7', name: 'Lifestyle — Kolkata', classification: 'NEW', grade: 'A2', fyTarget: 1.8, priorYear: 0, gmPct: 12.5 },
    { id: 'sis-s8', name: 'Central — Ahmedabad', classification: 'LFL', grade: 'A2', fyTarget: 1.6, priorYear: 1.5, gmPct: 11.8 },
  ],
  MBO: [
    { id: 'mbo-s1', name: 'Fashion Hub — Delhi', classification: 'LFL', grade: 'A2', fyTarget: 1.2, priorYear: 1.1, gmPct: 10.5 },
    { id: 'mbo-s2', name: 'Style Mart — Mumbai', classification: 'LFL', grade: 'A3', fyTarget: 0.9, priorYear: 0.85, gmPct: 9.8 },
    { id: 'mbo-s3', name: 'Trend Corner — Bangalore', classification: 'NEW', grade: 'A2', fyTarget: 1.4, priorYear: 0, gmPct: 11.2 },
    { id: 'mbo-s4', name: 'Urban Edge — Chennai', classification: 'LFL', grade: 'A2', fyTarget: 1.1, priorYear: 1.0, gmPct: 10.0 },
    { id: 'mbo-s5', name: 'Metro Style — Pune', classification: 'LFL', grade: 'A3', fyTarget: 0.7, priorYear: 0.65, gmPct: 9.5 },
    { id: 'mbo-s6', name: 'Fashion Point — Hyderabad', classification: 'LFL', grade: 'A2', fyTarget: 0.95, priorYear: 0.9, gmPct: 10.2 },
  ],
  AJIO: [
    { id: 'ajio-direct', name: 'AJIO Direct', classification: 'LFL', grade: 'A', fyTarget: 8.5, priorYear: 7.2, gmPct: 18.0 },
    { id: 'ajio-marketplace', name: 'AJIO Marketplace', classification: 'LFL', grade: 'A1', fyTarget: 4.2, priorYear: 3.8, gmPct: 16.5 },
    { id: 'ajio-luxe', name: 'AJIO Luxe', classification: 'ANNUALISED', grade: 'A', fyTarget: 2.1, priorYear: 1.2, gmPct: 20.0 },
  ],
  Ecom_own_site: [],
  Omni: [],
  Franchise: [],
  DISTRIBUTION: [
    { id: 'dist-s1', name: 'North Zone Wholesale', classification: 'LFL', grade: 'A1', fyTarget: 5.6, priorYear: 5.2, gmPct: 8.5 },
    { id: 'dist-s2', name: 'South Zone Wholesale', classification: 'LFL', grade: 'A2', fyTarget: 3.4, priorYear: 3.1, gmPct: 8.2 },
    { id: 'dist-s3', name: 'Corporate B2B', classification: 'LFL', grade: 'A2', fyTarget: 2.1, priorYear: 1.9, gmPct: 7.0 },
    { id: 'dist-s4', name: 'East Zone Wholesale', classification: 'LFL', grade: 'A2', fyTarget: 2.8, priorYear: 2.6, gmPct: 8.0 },
    { id: 'dist-s5', name: 'West Zone Wholesale', classification: 'LFL', grade: 'A1', fyTarget: 4.1, priorYear: 3.8, gmPct: 8.3 },
    { id: 'dist-s6', name: 'Export — UK/EU', classification: 'LFL', grade: 'A', fyTarget: 3.5, priorYear: 3.2, gmPct: 9.0 },
  ],
};

function generateMonthCells(fyTotal: number, priorYear: number, seed: number): MonthCell[] {
  const rand = seededRandom(seed);
  const weightTotal = SEASONALITY_WEIGHTS.reduce((a, b) => a + b, 0);

  return PLAN_MONTHS.map((month, i) => {
    const weight = SEASONALITY_WEIGHTS[i] ?? 1;
    const jitter = 0.9 + rand() * 0.2;
    const baseValue = (fyTotal * weight * jitter) / weightTotal;
    const priorValue = priorYear > 0
      ? (priorYear * (SEASONALITY_WEIGHTS[i] ?? 1) * (0.9 + rand() * 0.2)) / weightTotal
      : 0;

    return {
      monthId: month.id,
      value: Math.round(baseValue * 100) / 100,
      isPinned: false,
      isEdited: false,
      priorYear: Math.round(priorValue * 100) / 100,
    };
  });
}

function buildCategoryAllocations(channelId: ChannelId, fyTotal: number, seed: number): CategoryAllocation[] {
  const rand = seededRandom(seed);
  const categories = CHANNEL_CATEGORIES[channelId] ?? [];
  const rawPcts = categories.map((cat) => {
    const base = DEFAULT_CATEGORY_ALLOCATION[cat] ?? 10;
    return { category: cat, pct: base + (rand() * 6 - 3) };
  });

  const rawSum = rawPcts.reduce((s, r) => s + r.pct, 0);
  return rawPcts.map((r) => {
    const normalizedPct = Math.round((r.pct / rawSum) * 100 * 10) / 10;
    return {
      category: r.category,
      pct: normalizedPct,
      value: Math.round(fyTotal * normalizedPct / 100 * 100) / 100,
    };
  });
}

function aggregateMonths(childRows: PlanningGridRow[]): MonthCell[] {
  return PLAN_MONTHS.map((month) => {
    const value = childRows.reduce((s, r) => {
      const cell = r.months.find((m) => m.monthId === month.id);
      return s + (cell?.value ?? 0);
    }, 0);
    const priorYear = childRows.reduce((s, r) => {
      const cell = r.months.find((m) => m.monthId === month.id);
      return s + (cell?.priorYear ?? 0);
    }, 0);
    return {
      monthId: month.id,
      value: Math.round(value * 100) / 100,
      isPinned: false,
      isEdited: false,
      priorYear: Math.round(priorYear * 100) / 100,
    };
  });
}

function makeRow(
  id: string,
  level: PlanningGridRow['level'],
  label: string,
  parentId: string | null,
  channelId: ChannelId | null,
  months: MonthCell[],
  opts: {
    classification?: StoreClassification | null;
    grade?: string | null;
    isNewStore?: boolean;
    gmPct?: number;
    categoryAllocations?: CategoryAllocation[];
  } = {},
): PlanningGridRow {
  const fyTotal = months.reduce((s, m) => s + m.value, 0);
  const priorTotal = months.reduce((s, m) => s + m.priorYear, 0);
  const growthPct = priorTotal > 0 ? ((fyTotal - priorTotal) / priorTotal) * 100 : 0;
  const gm = opts.gmPct ?? 12;
  const band = getGuardrailBand(opts.grade ?? null);

  return {
    id,
    level,
    label,
    parentId,
    channelId,
    storeClassification: opts.classification ?? null,
    storeGrade: opts.grade ?? null,
    isNewStore: opts.isNewStore ?? false,
    months,
    fyTotal: Math.round(fyTotal * 100) / 100,
    priorYearTotal: Math.round(priorTotal * 100) / 100,
    growthPct: Math.round(growthPct * 10) / 10,
    guardrailStatus: computeGuardrailStatus(growthPct, band),
    guardrailBand: band,
    gmPct: Math.round(gm * 10) / 10,
    grossMargin: Math.round(fyTotal * (gm / 100) * 100) / 100,
    categoryAllocations: opts.categoryAllocations ?? [],
  };
}

// Hierarchy: Total → Channel → Store (flat, no intermediate category level)
export function buildMockGrid(): PlanningGridRow[] {
  const allRows: PlanningGridRow[] = [];
  const channelRows: PlanningGridRow[] = [];
  let seedBase = 42;

  for (const [channelId, stores] of Object.entries(STORE_DEFS)) {
    const cId = channelId as ChannelId;

    const storeRows: PlanningGridRow[] = [];
    for (const store of stores) {
      const months = generateMonthCells(store.fyTarget, store.priorYear, seedBase);
      seedBase += 7;
      const allocations = buildCategoryAllocations(cId, store.fyTarget, seedBase);
      seedBase += 3;

      const storeRow = makeRow(store.id, 'store', store.name, cId, cId, months, {
        classification: store.classification,
        grade: store.grade,
        isNewStore: store.classification === 'NEW',
        gmPct: store.gmPct,
        categoryAllocations: allocations,
      });
      storeRows.push(storeRow);
    }

    const channelMonths = aggregateMonths(storeRows);
    const channelGm = storeRows.length > 0
      ? storeRows.reduce((s, r) => s + r.gmPct, 0) / storeRows.length
      : 12;
    const channelLabel = cId === 'DISTRIBUTION' ? 'Distribution' : cId;
    const chRow = makeRow(cId, 'channel', channelLabel, 'total', cId, channelMonths, { gmPct: channelGm });
    channelRows.push(chRow);
    allRows.push(chRow, ...storeRows);
  }

  const totalMonths = aggregateMonths(channelRows);
  const totalGm = channelRows.length > 0
    ? channelRows.reduce((s, r) => s + r.gmPct, 0) / channelRows.length
    : 12;
  const totalRow = makeRow('total', 'total', 'Enterprise Total', null, null, totalMonths, { gmPct: totalGm });

  return [totalRow, ...allRows];
}

export const MOCK_PLANNING_GRID = buildMockGrid();
