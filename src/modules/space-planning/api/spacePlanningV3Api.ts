import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { appApiFetch, appApiPost } from '@/lib/api';
import { STALE_TIMES } from '@/lib/utils';
import type { PlanStatus, BoundBadge, PodBoundBadge, DepthFlag } from '../data/mockSpacePlanningData';

const BASE = '/space-planning/new';

// ─── Format display labels ───────────────────────────────────────────────────
// Raw DB store_format → display label (raw values are kept for filtering/logic).
const STORE_FORMAT_LABELS: Record<string, string> = {
  TRENDS_FULL: 'Trends',
  TRENDS_MAN: 'Trends Man',
  TRENDS_WOMAN: 'Trends Woman',
  TRENDS_JUNIOR: 'Trends Junior',
};

/**
 * Display label for a store's format. TST ("Trends Small Town") is not a
 * store_format value — it lives in `subformat` as 'TRENDS SMALL TOWN'. When
 * present it wins; otherwise the store_format is mapped to a friendly label.
 */
export function formatLabel(storeFormat: string, subformat?: string | null): string {
  if ((subformat ?? '').trim().toUpperCase() === 'TRENDS SMALL TOWN') return 'TST';
  const key = (storeFormat ?? '').trim().toUpperCase();
  if (STORE_FORMAT_LABELS[key]) return STORE_FORMAT_LABELS[key];
  // Generic fallback: drop a trailing _FULL, underscores → spaces, title-case.
  const label = key
    .replace(/_FULL$/, '')
    .replace(/_/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return label || (storeFormat || '—');
}

// ─── Response types (match the backend service shape) ───────────────────────

export interface V3StoreListItem {
  code: string;
  name: string;
  city: string;
  format: string;
  subformat: string | null;
  floors: number;
  carpetArea: number;
  plPool: number;
  status: PlanStatus;
  flagCount: number;
}

export interface V3StoreListResponse {
  items: V3StoreListItem[];
  total: number;
}

export interface V3EnvelopeStep {
  label: string;
  value: number;
  isSubtraction: boolean;
  isResult: boolean;
  /** Rule annotation, e.g. "10% of carpet, cap 1,200 · 0 if carpet < 8,000 sft". */
  rule?: string | null;
  /** Sub-components (the four initial-deduction lines). */
  children?: Array<{ label: string; value: number; rule?: string | null }>;
}

export interface V3Assumptions {
  totalDeductionPct: number;
  footwearPct: number;
  footwearCapSqft: number;
  ebPct: number;
  bestOfRestPct: number;
  bestOfRestThreshold: number;
  wSpsfWeights: [number, number, number];
  blend: [number, number];
  lftFactor: number;
}

export interface V3Category {
  code: string;
  name: string;
  currentSpace: number;
  newSpace: number;
  share: number;
  salesShare: number;
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
  floor: string | null;
  isManual: boolean;
  /** Space in the same 3-month season last year (AW25); null when no history — never 0. */
  prevYearSpaceSqft: number | null;
  /** SPSF windows (₹/sft/month). prev-year = same 3-month season last year; current = trailing 3 months. */
  prevYearSpsf: number | null;
  currentSpsf: number | null;
  threeYrSpsf: number | null;
  spsfTrendPct: number | null;
}

export interface V3Pod {
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
  asp: number | null;
  isManual: boolean;
}

export interface V3VersionPayload {
  categories: Array<{ code: string; newSpace: number }>;
  /** keyed by (category, podId); legacy payloads used positional ids and are
   *  treated as stale by the server, never applied */
  pods: Array<{ category?: string; podId?: string; id?: number; newSpace: number }>;
}

export interface V3VersionEntry {
  version: number;
  timestamp: string;
  author: string;
  summary: string;
  isCurrent: boolean;
  /** saved against an older engine run (or unbound) — shown but never applied */
  isStale?: boolean;
  payload: V3VersionPayload;
  /** Category space changes vs the previous version (v1 diffs vs the engine run). */
  changes: Array<{ code: string; from: number; to: number }>;
}

export interface SaveVersionRequest {
  summary: string;
  author?: string;
  categories: Array<{ code: string; newSpace: number }>;
  pods: Array<{ category: string; podId: string; newSpace: number }>;
}

export interface V3StoreDetail {
  store: {
    code: string;
    name: string;
    city: string;
    format: string;
    subformat: string | null;
    floors: number;
    carpetArea: number;
    status: PlanStatus;
    currentVersion: number;
    classification: string | null;
    /** Store-level SPSF rollups (current-space-weighted; null when no usable rates). */
    spsf: {
      prevYearSpsf: number | null;
      currentSpsf: number | null;
      spsfTrendPct: number | null;
    };
  };
  plPool: number;
  envelope: V3EnvelopeStep[];
  assumptions: V3Assumptions;
  categories: V3Category[];
  pods: V3Pod[];
  versions: V3VersionEntry[];
}

export interface V3FormatCategoryAgg {
  code: string;
  name: string;
  avgSpace: number;
  avgSharePct: number;
  avgOptions: number;
}

export interface V3FormatPodAgg {
  name: string;
  categoryCode: string;
  avgSpace: number;
  avgOptions: number;
}

export interface V3FormatSummary {
  /** Raw store_format, or 'TST' for Trends Small Town stores. */
  key: string;
  stores: number;
  totalCarpet: number;
  totalPlPool: number;
  avgPlPool: number;
  spsf: {
    prevYearSpsf: number | null;
    currentSpsf: number | null;
    spsfTrendPct: number | null;
  };
  categories: V3FormatCategoryAgg[];
  pods: V3FormatPodAgg[];
}

export interface V3FormatsResponse {
  formats: V3FormatSummary[];
}

// ─── Fetchers ───────────────────────────────────────────────────────────────

export function fetchV3Stores(): Promise<V3StoreListResponse> {
  return appApiFetch<V3StoreListResponse>(`${BASE}/stores`);
}

export function fetchV3StoreDetail(code: string): Promise<V3StoreDetail> {
  return appApiFetch<V3StoreDetail>(`${BASE}/stores/${code}`);
}

export function saveSpacePlanVersion(code: string, body: SaveVersionRequest): Promise<V3VersionEntry> {
  return appApiPost<V3VersionEntry>(`${BASE}/stores/${code}/versions`, body);
}

export function fetchV3Formats(): Promise<V3FormatsResponse> {
  return appApiFetch<V3FormatsResponse>(`${BASE}/formats`);
}

// ─── Query keys + hooks ──────────────────────────────────────────────────────

export const spacePlanningV3Keys = {
  all: ['space-planning-v3'] as const,
  stores: () => [...spacePlanningV3Keys.all, 'stores'] as const,
  detail: (code: string) => [...spacePlanningV3Keys.all, 'detail', code] as const,
  formats: () => [...spacePlanningV3Keys.all, 'formats'] as const,
};

export function useV3Stores() {
  return useQuery({
    queryKey: spacePlanningV3Keys.stores(),
    queryFn: fetchV3Stores,
    staleTime: STALE_TIMES.LISTING,
    placeholderData: keepPreviousData,
  });
}

export function useV3StoreDetail(code: string | undefined) {
  return useQuery({
    queryKey: spacePlanningV3Keys.detail(code ?? ''),
    queryFn: () => fetchV3StoreDetail(code ?? ''),
    staleTime: STALE_TIMES.DETAIL,
    enabled: !!code,
  });
}

export function useV3Formats() {
  return useQuery({
    queryKey: spacePlanningV3Keys.formats(),
    queryFn: fetchV3Formats,
    staleTime: STALE_TIMES.LISTING,
  });
}

export function useSaveSpacePlanVersion(code: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SaveVersionRequest) => saveSpacePlanVersion(code, body),
    onSuccess: async () => {
      // refetch (not just invalidate) to defeat staleTime so the detail page
      // rehydrates with the freshly saved version immediately.
      await queryClient.refetchQueries({ queryKey: spacePlanningV3Keys.detail(code), type: 'all' });
    },
  });
}
