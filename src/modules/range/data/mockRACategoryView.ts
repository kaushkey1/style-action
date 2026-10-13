import type { Status } from './types/rangeArchitecture';

export interface RACategoryEntry {
  id: string;
  categoryCode: string;
  categoryName: string;
  raId: string;
  fashionGrade: 'Core' | 'Fashion' | 'Ultimate' | 'Fashion Basics';
  fashionGradeCode: 'COR' | 'FSH' | 'ULT' | 'FB';
  bmCode: string;
  bmName: string;
  options: number;
  buyQty: number;
  mixPct: number;
  avgPrice: number;
  storeCount: number;
  ftfAdoptionPct: number;
  status: Status;
  segmentId: string;
  familyId: string;
  brickId: string;
}

const FASHION_GRADE_CONFIG = [
  { grade: 'Core' as const, code: 'COR' as const, familyId: 'CORE', brickId: 'BR001' },
  { grade: 'Fashion' as const, code: 'FSH' as const, familyId: 'FASHION', brickId: 'BR002' },
  { grade: 'Ultimate' as const, code: 'ULT' as const, familyId: 'ULTIMATE', brickId: 'BR003' },
  { grade: 'Fashion Basics' as const, code: 'FB' as const, familyId: 'FASHION_BASICS', brickId: 'BR004' },
];

const BM_CONFIG = [
  { code: 'BM-1', name: 'In-House' },
  { code: 'BM-2', name: 'ODM' },
  { code: 'BM-3', name: 'Vendor Nom.' },
  { code: 'BM-4', name: 'Ext. Brand' },
];

const CATEGORY_NAME_MAP: Record<string, string> = {
  '42': 'Men Western: Formal Shirts',
  '55': 'Men Western: Casual Shirts',
  '56': 'Men Western: Denim Bottoms',
  '80': 'Men Western: Casual T-shirts',
};

interface GradeData {
  options: number;
  buyQty: number;
  mixPct: number;
  avgPrice: number;
  storeCount: number;
  ftfAdoptionPct: number;
  status: Status;
  bmSplits: Array<{ bmIndex: number; optionShare: number; qtyShare: number }>;
}

const CATEGORY_DATA: Record<string, Record<string, GradeData>> = {
  '42': {
    Core: {
      options: 245, buyQty: 180000, mixPct: 35, avgPrice: 1299,
      storeCount: 420, ftfAdoptionPct: 85, status: 'Ongoing',
      bmSplits: [
        { bmIndex: 0, optionShare: 0.55, qtyShare: 0.60 },
        { bmIndex: 1, optionShare: 0.30, qtyShare: 0.25 },
        { bmIndex: 2, optionShare: 0.15, qtyShare: 0.15 },
      ],
    },
    Fashion: {
      options: 312, buyQty: 220000, mixPct: 40, avgPrice: 1599,
      storeCount: 385, ftfAdoptionPct: 72, status: 'Ongoing',
      bmSplits: [
        { bmIndex: 0, optionShare: 0.40, qtyShare: 0.45 },
        { bmIndex: 1, optionShare: 0.35, qtyShare: 0.30 },
        { bmIndex: 3, optionShare: 0.25, qtyShare: 0.25 },
      ],
    },
    Ultimate: {
      options: 89, buyQty: 45000, mixPct: 15, avgPrice: 2999,
      storeCount: 180, ftfAdoptionPct: 42, status: 'New',
      bmSplits: [
        { bmIndex: 0, optionShare: 0.60, qtyShare: 0.55 },
        { bmIndex: 3, optionShare: 0.40, qtyShare: 0.45 },
      ],
    },
    'Fashion Basics': {
      options: 156, buyQty: 95000, mixPct: 10, avgPrice: 899,
      storeCount: 420, ftfAdoptionPct: 90, status: 'Ongoing',
      bmSplits: [
        { bmIndex: 1, optionShare: 0.50, qtyShare: 0.55 },
        { bmIndex: 2, optionShare: 0.50, qtyShare: 0.45 },
      ],
    },
  },
  '55': {
    Core: {
      options: 198, buyQty: 150000, mixPct: 30, avgPrice: 1199,
      storeCount: 400, ftfAdoptionPct: 88, status: 'Completed',
      bmSplits: [
        { bmIndex: 0, optionShare: 0.50, qtyShare: 0.55 },
        { bmIndex: 1, optionShare: 0.30, qtyShare: 0.25 },
        { bmIndex: 2, optionShare: 0.20, qtyShare: 0.20 },
      ],
    },
    Fashion: {
      options: 275, buyQty: 195000, mixPct: 38, avgPrice: 1499,
      storeCount: 370, ftfAdoptionPct: 68, status: 'Ongoing',
      bmSplits: [
        { bmIndex: 0, optionShare: 0.45, qtyShare: 0.50 },
        { bmIndex: 1, optionShare: 0.30, qtyShare: 0.25 },
        { bmIndex: 3, optionShare: 0.25, qtyShare: 0.25 },
      ],
    },
    Ultimate: {
      options: 72, buyQty: 38000, mixPct: 12, avgPrice: 2499,
      storeCount: 160, ftfAdoptionPct: 38, status: 'New',
      bmSplits: [
        { bmIndex: 0, optionShare: 0.65, qtyShare: 0.60 },
        { bmIndex: 3, optionShare: 0.35, qtyShare: 0.40 },
      ],
    },
    'Fashion Basics': {
      options: 180, buyQty: 120000, mixPct: 20, avgPrice: 799,
      storeCount: 410, ftfAdoptionPct: 92, status: 'Ongoing',
      bmSplits: [
        { bmIndex: 1, optionShare: 0.45, qtyShare: 0.50 },
        { bmIndex: 2, optionShare: 0.55, qtyShare: 0.50 },
      ],
    },
  },
  '56': {
    Core: {
      options: 160, buyQty: 130000, mixPct: 32, avgPrice: 1899,
      storeCount: 380, ftfAdoptionPct: 82, status: 'Ongoing',
      bmSplits: [
        { bmIndex: 0, optionShare: 0.50, qtyShare: 0.50 },
        { bmIndex: 1, optionShare: 0.30, qtyShare: 0.30 },
        { bmIndex: 2, optionShare: 0.20, qtyShare: 0.20 },
      ],
    },
    Fashion: {
      options: 220, buyQty: 165000, mixPct: 42, avgPrice: 2199,
      storeCount: 350, ftfAdoptionPct: 65, status: 'Ongoing',
      bmSplits: [
        { bmIndex: 0, optionShare: 0.40, qtyShare: 0.45 },
        { bmIndex: 1, optionShare: 0.35, qtyShare: 0.30 },
        { bmIndex: 3, optionShare: 0.25, qtyShare: 0.25 },
      ],
    },
    Ultimate: {
      options: 55, buyQty: 28000, mixPct: 10, avgPrice: 3499,
      storeCount: 140, ftfAdoptionPct: 35, status: 'New',
      bmSplits: [
        { bmIndex: 0, optionShare: 0.55, qtyShare: 0.50 },
        { bmIndex: 3, optionShare: 0.45, qtyShare: 0.50 },
      ],
    },
    'Fashion Basics': {
      options: 130, buyQty: 85000, mixPct: 16, avgPrice: 1299,
      storeCount: 390, ftfAdoptionPct: 88, status: 'Completed',
      bmSplits: [
        { bmIndex: 1, optionShare: 0.50, qtyShare: 0.55 },
        { bmIndex: 2, optionShare: 0.50, qtyShare: 0.45 },
      ],
    },
  },
  '80': {
    Core: {
      options: 210, buyQty: 170000, mixPct: 33, avgPrice: 999,
      storeCount: 430, ftfAdoptionPct: 90, status: 'Completed',
      bmSplits: [
        { bmIndex: 0, optionShare: 0.55, qtyShare: 0.60 },
        { bmIndex: 1, optionShare: 0.25, qtyShare: 0.20 },
        { bmIndex: 2, optionShare: 0.20, qtyShare: 0.20 },
      ],
    },
    Fashion: {
      options: 290, buyQty: 210000, mixPct: 40, avgPrice: 1399,
      storeCount: 395, ftfAdoptionPct: 70, status: 'Ongoing',
      bmSplits: [
        { bmIndex: 0, optionShare: 0.45, qtyShare: 0.50 },
        { bmIndex: 1, optionShare: 0.30, qtyShare: 0.25 },
        { bmIndex: 3, optionShare: 0.25, qtyShare: 0.25 },
      ],
    },
    Ultimate: {
      options: 65, buyQty: 32000, mixPct: 12, avgPrice: 2299,
      storeCount: 150, ftfAdoptionPct: 40, status: 'New',
      bmSplits: [
        { bmIndex: 0, optionShare: 0.60, qtyShare: 0.55 },
        { bmIndex: 3, optionShare: 0.40, qtyShare: 0.45 },
      ],
    },
    'Fashion Basics': {
      options: 145, buyQty: 100000, mixPct: 15, avgPrice: 699,
      storeCount: 440, ftfAdoptionPct: 94, status: 'Ongoing',
      bmSplits: [
        { bmIndex: 1, optionShare: 0.50, qtyShare: 0.55 },
        { bmIndex: 2, optionShare: 0.50, qtyShare: 0.45 },
      ],
    },
  },
};

function buildEntries(categoryCode: string): RACategoryEntry[] {
  const gradeDataMap = CATEGORY_DATA[categoryCode];
  if (!gradeDataMap) return [];

  const categoryName = CATEGORY_NAME_MAP[categoryCode] ?? categoryCode;
  const entries: RACategoryEntry[] = [];

  for (const fg of FASHION_GRADE_CONFIG) {
    const data = gradeDataMap[fg.grade];
    if (!data) continue;

    for (const split of data.bmSplits) {
      const bm = BM_CONFIG[split.bmIndex];
      if (!bm) continue;

      entries.push({
        id: `RA-${categoryCode}-${fg.code}-${bm.code}`,
        categoryCode,
        categoryName,
        raId: `RA-${categoryCode}-${fg.code}`,
        fashionGrade: fg.grade,
        fashionGradeCode: fg.code,
        bmCode: bm.code,
        bmName: bm.name,
        options: Math.round(data.options * split.optionShare),
        buyQty: Math.round(data.buyQty * split.qtyShare),
        mixPct: Math.round(data.mixPct * split.optionShare * 10) / 10,
        avgPrice: data.avgPrice,
        storeCount: data.storeCount,
        ftfAdoptionPct: data.ftfAdoptionPct,
        status: data.status,
        segmentId: categoryCode,
        familyId: fg.familyId,
        brickId: fg.brickId,
      });
    }
  }

  return entries;
}

const entriesCache: Record<string, RACategoryEntry[]> = {};

export function getRACategoryEntries(categoryCode: string): RACategoryEntry[] {
  if (!entriesCache[categoryCode]) {
    entriesCache[categoryCode] = buildEntries(categoryCode);
  }
  return entriesCache[categoryCode] ?? [];
}

export interface RAGradeSummary {
  id: string;
  categoryCode: string;
  fashionGrade: 'Core' | 'Fashion' | 'Ultimate' | 'Fashion Basics';
  fashionGradeCode: 'COR' | 'FSH' | 'ULT' | 'FB';
  options: number;
  buyQty: number;
  mixPct: number;
  avgPrice: number;
  storeCount: number;
  ftfAdoptionPct: number;
  status: Status;
  familyId: string;
  brickId: string;
}

export function getGradeSummaries(categoryCode: string): RAGradeSummary[] {
  const gradeDataMap = CATEGORY_DATA[categoryCode];
  if (!gradeDataMap) return [];

  const summaries: RAGradeSummary[] = [];
  for (const fg of FASHION_GRADE_CONFIG) {
    const data = gradeDataMap[fg.grade];
    if (!data) continue;

    summaries.push({
      id: `${categoryCode}-${fg.code}`,
      categoryCode,
      fashionGrade: fg.grade,
      fashionGradeCode: fg.code,
      options: data.options,
      buyQty: data.buyQty,
      mixPct: data.mixPct,
      avgPrice: data.avgPrice,
      storeCount: data.storeCount,
      ftfAdoptionPct: data.ftfAdoptionPct,
      status: data.status,
      familyId: fg.familyId,
      brickId: fg.brickId,
    });
  }
  return summaries;
}
