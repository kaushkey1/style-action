// API client for the Sales Plan (AOP) backend.
// Backend prefix /v1.0/sales-plan, reached via the application-scoped proxy.

import { appApiFetch, appApiPost, appApiPut } from '@/lib/api';
import type {
  BrickViewCategory,
  CategoryAllocation,
  ChannelVarianceRow,
  PlanningCycle,
  PlanningException,
  PlanningGridRow,
  StoreListing,
  UserTask,
} from '../types/aopPlanning.types';

const BASE = '/sales-plan';

// ─── Response contracts (match backend src/app/sales_plan) ───────────────────

export interface CyclesResponse {
  cycles: PlanningCycle[];
  tasks: UserTask[];
  kpis: {
    activeCycles: number;
    pendingTasks: number;
    exceptions: { hard: number; soft: number };
    lockedPlans: number;
  };
}

export interface ChannelTargetRow {
  channelId: string;
  netSalesTarget: number;
  gmPctTarget: number;
  pyActual: number;
  growthPct: number;
  fyGrossMargin: number;
}

export interface SeasonalityWeight {
  monthId: string;
  weightPct: number;
}

export interface InputsResponse {
  channelTargets: ChannelTargetRow[];
  seasonality: SeasonalityWeight[];
  growthFactorPct: number;
  enterpriseTarget: number;
  netSalesTotal: number;
  pyActual: number;
  growthPct: number;
  blendedGmPct: number;
}

export interface WorkspaceMonth {
  id: string;
  shortLabel: string;
  label: string;
  season: 'H1' | 'H2';
  index: number;
}

export interface WorkspaceSummary {
  netSales: number;
  generatedTotal: number;
  ytdActual: number;
  plannedRemainder: number;
  latestEstimate: number;
  pyTotal: number;
  growthPct: number;
  golyPct: number;
  storeCount: number;
  newStoreCount: number;
  avgGmPct: number;
}

export interface WorkspaceResponse {
  rows: PlanningGridRow[];
  months: WorkspaceMonth[];
  summary: WorkspaceSummary;
}

export interface StoreCategoriesResponse {
  storeId: string;
  storeName: string;
  fyTotal: number;
  allocations: CategoryAllocation[];
}

export interface CategoryViewItem {
  category: string;
  value: number;
  pctOfChannel: number;
  stores: number;
  topContributor: { name: string; value: number };
}

export interface CategoryStoreDetail {
  storeId: string;
  storeName: string;
  categories: Record<string, number>;
  fyTotal: number;
}

export interface CategoryViewResponse {
  categories: CategoryViewItem[];
  total: number;
  storeDetail: CategoryStoreDetail[];
}

export interface ChannelVarianceResponse {
  channels: ChannelVarianceRow[];
}

export interface ChangeLogEntry {
  id: string;
  cycleId: string;
  timestamp: string | null;
  actor: string;
  scope: string;
  field: string;
  entityRef: Record<string, unknown> | null;
  previousValue: number | null;
  newValue: number | null;
  deltaPct: number | null;
  reason: string | null;
  source: string | null;
  status: string | null;
}

export interface RollingMonth {
  seq: number;
  monthId: string;
  label: string;
  fyStartYear: number;
  cycleId: string;
  value: number;
  generated: number;
  actual: number | null;
  priorYear: number;
  latestEstimate: number;
  isActual: boolean;
  isFyBoundary: boolean;
}

export interface RollingCycleInfo {
  cycleId: string;
  name: string;
  fyStartYear: number;
  status: string;
  isLocked: boolean;
}

export interface RollingResponse {
  current: RollingCycleInfo;
  next: RollingCycleInfo | null;
  months: RollingMonth[];
}

export interface CycleVersion {
  versionId: string;
  versionNo: number;
  label: string;
  status: string;
  isPromoted: boolean;
  isApproved: boolean;
  isCurrent: boolean;
  createdBy: string;
  createdAt: string | null;
}

export interface VersionsResponse {
  cycleId: string;
  currentVersion: number;
  approvedVersion: number | null;
  versions: CycleVersion[];
}

export interface BrickViewResponse {
  categories: BrickViewCategory[];
  total: number;
}

export interface StoreBrickAllocation {
  brickCd: string;
  brickDesc: string;
  category: string | null;
  pct: number;
  value: number;
}

export interface StoreBricksResponse {
  storeId: string;
  storeName: string;
  fyTotal: number;
  allocations: StoreBrickAllocation[];
}

// ─── Calls ───────────────────────────────────────────────────────────────────

export const salesPlanApi = {
  listCycles: () => appApiFetch<CyclesResponse>(`${BASE}/cycles`),

  createCycle: (body: { name: string; brand?: string; fiscalYearLabel: string; fyStartYear: number }) =>
    appApiPost<PlanningCycle>(`${BASE}/cycles`, body),

  getCycle: (cycleId: string) => appApiFetch<PlanningCycle>(`${BASE}/cycles/${cycleId}`),

  generate: (cycleId: string) =>
    appApiPost<{ rowsWritten: number; stores: number }>(`${BASE}/cycles/${cycleId}/generate`),

  getInputs: (cycleId: string) => appApiFetch<InputsResponse>(`${BASE}/cycles/${cycleId}/inputs`),

  updateChannelTarget: (
    cycleId: string,
    channel: string,
    body: { netSalesTarget?: number; growthPct?: number; gmPctTarget?: number },
  ) => appApiPut<InputsResponse>(`${BASE}/cycles/${cycleId}/inputs/channel/${channel}`, body),

  updateSeasonality: (cycleId: string, weights: SeasonalityWeight[], reason: string) =>
    appApiPut<InputsResponse>(`${BASE}/cycles/${cycleId}/inputs/seasonality`, { weights, reason }),

  updateGrowthFactor: (cycleId: string, growthPct: number) =>
    appApiPut<InputsResponse>(`${BASE}/cycles/${cycleId}/inputs/growth-factor`, { growthPct }),

  addChannel: (
    cycleId: string,
    body: { name: string; target: number; gmPct: number },
  ) => appApiPost<{ ok: boolean; channel: string }>(`${BASE}/cycles/${cycleId}/channels`, body),

  listChanges: (cycleId: string) =>
    appApiFetch<ChangeLogEntry[]>(`${BASE}/cycles/${cycleId}/changes`),

  getRolling: (cycleId: string) =>
    appApiFetch<RollingResponse>(`${BASE}/cycles/${cycleId}/rolling`),

  setCycleStatus: (cycleId: string, status: string) =>
    appApiPut<PlanningCycle>(`${BASE}/cycles/${cycleId}/status`, { status }),

  listVersions: (cycleId: string) =>
    appApiFetch<VersionsResponse>(`${BASE}/cycles/${cycleId}/versions`),

  createRevision: (cycleId: string) =>
    appApiPost<VersionsResponse>(`${BASE}/cycles/${cycleId}/revisions`),

  setVersionStatus: (cycleId: string, versionNo: number, status: 'DRAFT' | 'APPROVED' | 'REJECTED') =>
    appApiPut<VersionsResponse>(`${BASE}/cycles/${cycleId}/versions/${versionNo}/status`, { status }),

  getWorkspace: (cycleId: string, versionNo?: number) =>
    appApiFetch<WorkspaceResponse>(
      `${BASE}/cycles/${cycleId}/workspace`,
      versionNo != null ? { version: String(versionNo) } : undefined,
    ),

  updateCell: (
    cycleId: string,
    body: { channel: string; storeId: string; monthId: string; value: number },
  ) => appApiPut<WorkspaceResponse>(`${BASE}/cycles/${cycleId}/workspace/cell`, body),

  updateChannelCell: (
    cycleId: string,
    body: { channel: string; monthId: string; value: number },
  ) => appApiPut<WorkspaceResponse>(`${BASE}/cycles/${cycleId}/workspace/channel-cell`, body),

  getStoreCategories: (cycleId: string, storeId: string) =>
    appApiFetch<StoreCategoriesResponse>(`${BASE}/cycles/${cycleId}/stores/${storeId}/categories`),

  updateStoreCategories: (
    cycleId: string,
    storeId: string,
    body: { channel: string; allocations: { category: string; pct: number }[] },
  ) =>
    appApiPut<StoreCategoriesResponse>(`${BASE}/cycles/${cycleId}/stores/${storeId}/categories`, body),

  getCategoryView: (cycleId: string, channel?: string) =>
    appApiFetch<CategoryViewResponse>(`${BASE}/cycles/${cycleId}/category-view`, { channel }),

  getChannelVariance: (cycleId: string) =>
    appApiFetch<ChannelVarianceResponse>(
      `${BASE}/cycles/${cycleId}/workspace/channel-variance`,
    ),

  getBrickView: (cycleId: string, channel?: string) =>
    appApiFetch<BrickViewResponse>(`${BASE}/cycles/${cycleId}/brick-view`, { channel }),

  getStoreBricks: (cycleId: string, storeId: string) =>
    appApiFetch<StoreBricksResponse>(`${BASE}/cycles/${cycleId}/stores/${storeId}/bricks`),

  updateStoreBricks: (
    cycleId: string,
    storeId: string,
    body: { channel: string; allocations: { brickCd: string; pct: number }[] },
  ) => appApiPut<StoreBricksResponse>(`${BASE}/cycles/${cycleId}/stores/${storeId}/bricks`, body),

  listExceptions: (cycleId: string) =>
    appApiFetch<PlanningException[]>(`${BASE}/cycles/${cycleId}/exceptions`),

  updateException: (
    cycleId: string,
    exceptionId: string,
    status: 'open' | 'acknowledged' | 'resolved',
  ) =>
    appApiPut<{ id: string; status: string }>(
      `${BASE}/cycles/${cycleId}/exceptions/${exceptionId}`,
      { status },
    ),

  listStores: (cycleId: string) =>
    appApiFetch<StoreListing[]>(`${BASE}/cycles/${cycleId}/stores`),

  setStoreClosure: (
    cycleId: string,
    storeCode: string,
    body: { type: 'full' | 'temp' | 'relocation'; closureDate: string; reopenDate?: string; reason?: string },
  ) => appApiPost<{ ok: boolean }>(`${BASE}/cycles/${cycleId}/stores/${storeCode}/closure`, body),

  addStore: (
    cycleId: string,
    body: AddStorePayload,
  ) => appApiPost<{ ok: boolean; storeCode: string }>(`${BASE}/cycles/${cycleId}/stores`, body),
  addStoresBulk: (
    cycleId: string,
    stores: AddStorePayload[],
  ) => appApiPost<BulkAddStoresResult>(`${BASE}/cycles/${cycleId}/stores/bulk`, { stores }),
};

export interface AddStorePayload {
  name: string;
  storeCode?: string;
  state?: string;
  city?: string;
  channelId: string;
  category?: string;
  grade?: string;
  storeType?: 'FULL_PRICE' | 'OUTLET';
  freshDiscountPct?: number | null;
  eossDiscountPct?: number | null;
  openingMonthIndex: number;
  method: 'waterfall' | 'reference';
  annualTarget: number;
  referenceStoreCode?: string;
  referenceAdjustmentPct?: number;
}

export interface BulkAddStoresResult {
  created: number;
  failed: number;
  storeCodes: string[];
  errors: Array<{ row: number; name: string | null; error: string }>;
}
