import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ChevronDown, ChevronUp, Activity, Download } from 'lucide-react';
import { IMPETUS_APP_BASE } from '@/lib/api';
import { useDownload } from '@/hooks/useDownload';
import {
  Badge, Button, MetricCard, MetricGrid, SectionHeader, EmptyState,
  FilterBar, FilterPills, FilterMultiSelect, FilterSearch, FilterClear, PageHeader,
  DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell,
  Tabs, TabsList, TabsTrigger, TabsContent, Pagination, DrillMenu,
} from '@/components/ui';
import type { AgeBucket } from '../data/mockInventory';
import { cn, formatNumber } from '@/lib/utils';
import { getSkuDrillTargets } from '@/lib/routing';
import { useInventoryFilterStore } from '../stores/useInventoryFilterStore';
import { useApiData } from '@/hooks/useApiData';
import {
  fetchHealthSummary,
  fetchLifecycleItems,
  fetchNOOSItems,
  fetchMarkdownClearance,
  fetchStoreFreshness,
  // fetchRotationAlerts,
  fetchFilterOptions,
  fetchNOOSActivityLog,
  fetchBrokenSets,
} from '../api/inventoryApi';
import type { NOOSActivityLogData } from '../api/inventoryApi';
import type { HealthSummaryData, LifecycleItem, /* RotationAlertItem, */ ClearanceItem } from '../api/inventoryApi';

// ─── AgeBucketBar ─────────────────────────────────────────────────────────

function AgeBucketBar({ buckets, onBucketClick }: { buckets: AgeBucket[]; onBucketClick?: (bucket: AgeBucket) => void }) {
  const maxPct = buckets.length > 0 ? Math.max(...buckets.map((b) => b.pct)) : 1;
  const bucketColors: Record<string, string> = {
    'A0': 'bg-success',
    'A1': 'bg-primary',
    'A2': 'bg-warning',
    'A3': 'bg-error/70',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Inventory Age Profile" className="mb-4" />
      <div className="space-y-1">
        {buckets.map((bucket) => (
          <button
            key={bucket.label}
            type="button"
            className="group w-full flex items-center gap-3 px-2 py-2 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors text-left"
            onClick={() => onBucketClick?.(bucket)}
          >
            <span className="text-xs text-gray-600 w-28 shrink-0">{bucket.label}</span>
            <div className="flex-1 h-5 bg-gray-100 rounded-lg overflow-hidden relative">
              <div
                className={cn('h-full rounded-lg transition-all', bucketColors[bucket.range])}
                // eslint-disable-next-line no-restricted-syntax -- dynamic width
                style={{ width: `${(bucket.pct / maxPct) * 100}%` }}
              />
            </div>
            <div className="text-right shrink-0 w-24">
              <span className="text-xs font-medium text-gray-900">{bucket.pct}%</span>
              <span className="text-xs text-gray-500 ml-1">({formatNumber(bucket.units)})</span>
            </div>
            <span className="text-xs text-gray-500 w-16 text-right">{bucket.value_cr} Cr</span>
          </button>
        ))}
      </div>
      {/* eslint-disable-next-line design-system/prefer-section-header -- legend row, not a section header */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="text-xs text-gray-500">Stage 1 (0-45d)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs text-gray-500">Stage 2 (46-90d)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-xs text-gray-500">Stage 3 (91-120d)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-error" />
            <span className="text-xs text-gray-500">Stage 4 (121d+)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── HealthSummaryStrip ───────────────────────────────────────────────────

type HealthStripTarget = 'noosStockouts' | 'aa1Exits' | 'a2Exits' | 'agedStock' | 'pullbacks';

function HealthSummaryStrip({ data, onNavigate }: { data: HealthSummaryData | null; onNavigate?: (target: HealthStripTarget) => void }) {
  if (!data || !('total_units' in data)) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center flex-wrap gap-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-4 py-1">
            <div className="h-3 w-16 bg-gray-100 rounded animate-pulse mb-1" />
            <div className="h-5 w-12 bg-gray-100 rounded animate-pulse mb-1" />
            <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const ragToColor = (rag?: { status: string }) => {
    if (!rag) return 'text-gray-900';
    if (rag.status === 'green') return 'text-success';
    if (rag.status === 'amber') return 'text-warning-600';
    if (rag.status === 'red') return 'text-error';
    return 'text-gray-900';
  };

  const turnsColor = ragToColor(data.turns_rag);
  const stColor = ragToColor(data.st_rag);
  const noosColor = ragToColor(data.noos_rag);
  const aa1ExitColor = ragToColor(data.aa1_exit_rag);
  const a2ExitColor = ragToColor(data.a2_exit_rag);
  const agedColor = ragToColor(data.aged_rag);
  const pullbackColor = ragToColor(data.pullback_rag);

  const tileClass = 'hover:bg-gray-50 cursor-pointer rounded transition-colors group text-left';

  type Tile = {
    label: string;
    value: string;
    subtitle: string;
    color: string;
    target: HealthStripTarget | null;
  };

  const tiles: Tile[] = [
    { label: 'Total Inventory', value: `${data.total_value_cr} Cr`, subtitle: `${formatNumber(data.total_units)} options`, color: 'text-gray-900', target: null },
    { label: 'Inventory Turns', value: `${data.inventory_turns}x`, subtitle: 'Target 4.0x', color: turnsColor, target: null },
    { label: 'Pullbacks', value: `${data.pullback_count}`, subtitle: 'Pending pullback actions', color: pullbackColor, target: 'pullbacks' },
    { label: 'NOOS Stockout', value: `${data.noos_stockout_count}`, subtitle: 'Target: Zero', color: noosColor, target: 'noosStockouts' },
    { label: 'A/A1 Full Price ST%', value: `${data.full_price_st_pct}%`, subtitle: 'Target 70%', color: stColor, target: null },
    { label: 'A/A1 Exits', value: `${data.aa1_exit_count}`, subtitle: 'Items at Day 40-45', color: aa1ExitColor, target: null },
    { label: 'A2 Exits', value: `${data.a2_exit_count}`, subtitle: 'Items at Day 85-90', color: a2ExitColor, target: null },
    { label: 'Aged Stock %', value: `${data.aged_stock_pct}%`, subtitle: 'Target \u226412%', color: agedColor, target: 'agedStock' },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center flex-wrap gap-y-2">
      {tiles.map((tile, i) => {
        const isLast = i === tiles.length - 1;
        const wrapperClass = cn(
          'px-4 py-1',
          !isLast && 'border-r border-gray-200',
        );

        if (tile.target === null) {
          return (
            <div key={tile.label} className={wrapperClass}>
              <p className="text-xs text-gray-500">{tile.label}</p>
              <p className={cn('text-lg font-bold', tile.color)}>{tile.value}</p>
              <p className="text-xs text-gray-500">{tile.subtitle}</p>
            </div>
          );
        }

        return (
          <button
            key={tile.label}
            type="button"
            className={cn(wrapperClass, tileClass)}
            onClick={() => onNavigate?.(tile.target!)}
          >
            <p className="text-xs text-gray-500">{tile.label}</p>
            <div className="flex items-center gap-1.5">
              <p className={cn('text-lg font-bold', tile.color)}>{tile.value}</p>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 touch:opacity-100 transition-opacity" />
            </div>
            <p className="text-xs text-gray-500">{tile.subtitle}</p>
          </button>
        );
      })}
    </div>
  );
}

// ─── Tab 1: Lifecycle Tracker ──────────────────────────────────────────────

function LifecycleTrackerTab({ initialCheckpoint, storeFilter, healthData: hd }: { initialCheckpoint?: string; storeFilter?: string | null; healthData?: HealthSummaryData | null }) {
  const [checkpointFilter, setCheckpointFilter] = useState<'all' | '40_45' | '85_90' | '115_120'>(
    (initialCheckpoint as '40_45' | '85_90' | '115_120') || 'all',
  );
  const [storeGradeFilter, setStoreGradeFilter] = useState<'all' | 'A' | 'A1' | 'A2'>('all');
  const [showAllTriage, setShowAllTriage] = useState(false);
  const [lcPage, setLcPage] = useState(1);
  const [lcPageSize, setLcPageSize] = useState(25);
  const { appliedFilters: invFilters } = useInventoryFilterStore();

  // Map checkpoint pill to API param
  const apiCheckpoint = checkpointFilter === 'all' ? 'all_checkpoints' : checkpointFilter;
  const apiStoreGrade = storeGradeFilter === 'all' ? undefined : storeGradeFilter;

  const { data: lifecycleData, loading, error, refetch } = useApiData(
    () => fetchLifecycleItems({ page: lcPage, page_size: lcPageSize, checkpoint: apiCheckpoint, store_grade: apiStoreGrade }, invFilters, storeFilter),
    [invFilters.segment, invFilters.family, invFilters.brick, invFilters.class, invFilters.fashionGrade, invFilters.format, storeFilter, lcPage, lcPageSize, checkpointFilter, storeGradeFilter],
  );

  const allItems: LifecycleItem[] = useMemo(() => lifecycleData?.items ?? [], [lifecycleData]);

  // Summary counts from health summary (full dataset, not paginated)

  // Detail lists from current page items
  const triageQueue = useMemo(() => allItems.filter((o) => o.day7_signal !== null), [allItems]);

  // All returned items are checkpoint-filtered by the API
  const checkpointItems = useMemo(() => allItems.filter((item) => item.checkpoint !== null), [allItems]);

  const signalBadge = (signal: string) => {
    const map: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
      good_seller: 'success', moderate: 'warning', poor_seller: 'error', early_warning: 'warning',
    };
    const labelMap: Record<string, string> = {
      good_seller: 'Good Seller', moderate: 'Moderate', poor_seller: 'Poor Seller', early_warning: 'Early Warning',
    };
    return <Badge variant={map[signal] ?? 'default'} className="text-[10px]">{labelMap[signal] ?? signal}</Badge>;
  };

  const day14Badge = (signal: string) => {
    const map: Record<string, 'success' | 'warning' | 'default'> = {
      reorder: 'success', reallocation: 'warning', monitor: 'default',
    };
    const labelMap: Record<string, string> = {
      reorder: 'Reorder', reallocation: 'Reallocation', monitor: 'Monitor',
    };
    return <Badge variant={map[signal] ?? 'default'} className="text-[10px]">{labelMap[signal] ?? signal}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mb-3" />
          <div className="h-12 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
        <p className="text-sm text-error mb-2">Failed to load lifecycle data</p>
        <p className="text-xs text-gray-500 mb-3">{error}</p>
        <Button variant="outline" size="sm" onClick={refetch}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Day 7 / Day 14 Triage Queue */}
      {triageQueue.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <SectionHeader title="Day 7 / Day 14 Triage Queue" subtitle={`${triageQueue.length} options with active signals`} className="mb-0" />
          </div>
          <div className="divide-y divide-gray-100">
            {(showAllTriage ? triageQueue : triageQueue.slice(0, 5)).map((item) => (
              <div key={item.id} className="p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{item.style_name}</span>
                    <Badge variant="default" className="text-[10px]">{item.category}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{item.network_age_days} days</span>
                    <span className="text-xs text-gray-500">{item.sell_through_vs_plan != null ? `${item.sell_through_vs_plan}% vs plan` : `${item.sell_through_pct}% ST`}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  {item.day7_signal && signalBadge(item.day7_signal)}
                  {item.day14_signal && day14Badge(item.day14_signal)}
                </div>
              </div>
            ))}
          </div>
          {triageQueue.length > 5 && (
            <button
              onClick={() => setShowAllTriage(!showAllTriage)}
              className="w-full px-4 py-2 text-xs text-primary hover:bg-gray-50 transition-colors flex items-center justify-center gap-1 border-t border-gray-100"
            >
              {showAllTriage ? (
                <>Show less <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>Show all {triageQueue.length} <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          )}
        </div>
      )}

      {/* Checkpoint Assessments */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <SectionHeader
            title="Checkpoint Assessments"
            className="mb-3"
          />
          <FilterBar>
            <FilterPills
              value={checkpointFilter}
              onChange={(v) => { setCheckpointFilter(v as 'all' | '40_45' | '85_90' | '115_120'); setLcPage(1); }}
              options={[
                { value: 'all', label: 'All', count: hd?.lc_checkpoint_total ?? checkpointItems.length },
                { value: '40_45', label: '40-45', count: hd?.lc_checkpoint_40_45 ?? checkpointItems.filter((cp) => cp.checkpoint === '40_45').length },
                { value: '85_90', label: '85-90', count: hd?.lc_checkpoint_85_90 ?? checkpointItems.filter((cp) => cp.checkpoint === '85_90').length },
                { value: '115_120', label: '115-120', count: hd?.lc_checkpoint_115_120 ?? checkpointItems.filter((cp) => cp.checkpoint === '115_120').length },
              ]}
            />
            <span className="mx-2 h-5 w-px bg-gray-200" />
            <FilterPills
              value={storeGradeFilter}
              onChange={(v) => { setStoreGradeFilter(v as 'all' | 'A' | 'A1' | 'A2'); setLcPage(1); }}
              options={[
                { value: 'all', label: 'All Grades' },
                { value: 'A', label: 'A' },
                { value: 'A1', label: 'A1' },
                { value: 'A2', label: 'A2' },
              ]}
            />
          </FilterBar>
        </div>

        {/* Approaching Exit */}
        <div className="p-4 border-b border-gray-100">
          <SectionHeader title="Approaching Exit" subtitle={`${lifecycleData?.total ?? 0} items`} className="mb-0" />
        </div>
        <DataTable>
          <DataTableHeader>
            <DataTableHead>Option</DataTableHead>
            <DataTableHead>Category</DataTableHead>
            <DataTableHead align="right">Stores</DataTableHead>
            <DataTableHead align="right">Quantity</DataTableHead>
            <DataTableHead align="right">Avg STR (%)</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {allItems.map((item) => (
              <DataTableRow key={item.id}>
                <DataTableCell>
                  <span className="font-medium text-gray-900">{item.option_code}</span>
                  {item.style_name && <span className="text-xs text-gray-500 ml-1">{item.style_name}</span>}
                </DataTableCell>
                <DataTableCell>{item.category ?? '--'}</DataTableCell>
                <DataTableCell align="right">{item.store_count}</DataTableCell>
                <DataTableCell align="right">{formatNumber(item.total_units)}</DataTableCell>
                <DataTableCell align="right">{item.sell_through_pct != null ? `${item.sell_through_pct}%` : '--'}</DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      </div>

      {/* SOP Callout for Checkpoints
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-amber-800">
          Day 30: S2 alert if ST &lt;25% — projects &lt;50% by Day 60. Day 45: Forced exit from A/A1 — target 65% ST (Trends V4.2)
        </p>
      </div> */}

      {/* Pagination */}
      {lifecycleData && (
        // eslint-disable-next-line design-system/prefer-section-header -- pagination control
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Showing {((lcPage - 1) * lcPageSize) + 1}–{Math.min(lcPage * lcPageSize, lifecycleData.total)} of {lifecycleData.total}</span>
            <span className="mx-2">|</span>
            <span>Rows per page:</span>
            {[25, 50, 100, 500].map((size) => (
              <button
                key={size}
                onClick={() => { setLcPageSize(size); setLcPage(1); }}
                className={cn(
                  'px-2 py-0.5 rounded text-xs',
                  lcPageSize === size ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100',
                )}
              >
                {size}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLcPage((p) => Math.max(1, p - 1))}
              disabled={lcPage <= 1}
              className="px-3 py-1 text-xs rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-xs text-gray-600">Page {lcPage} of {lifecycleData.total_pages}</span>
            <button
              onClick={() => setLcPage((p) => Math.min(lifecycleData.total_pages, p + 1))}
              disabled={!lifecycleData.has_next}
              className="px-3 py-1 text-xs rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <Link to="/inventory/actions" className="text-xs text-primary hover:underline">
        View all actions
      </Link>
    </div>
  );
}

// ─── Dual-Clock Rotation Alerts — disabled ──────────────────────────────

// ─── Tab 2: NOOS Monitor ──────────────────────────────────────────────────

function NOOSMonitorTab({ storeFilter }: { storeFilter: string | null; healthData?: HealthSummaryData | null }) {
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [noosPage, setNoosPage] = useState(1);
  const noosPageSize = 25;
  const [bsPage, setBsPage] = useState(1);
  const [bsPageSize, setBsPageSize] = useState(25);
  const { appliedFilters: invFilters } = useInventoryFilterStore();

  const { data: noosData, loading: noosLoading, error: noosError, refetch: noosRefetch } = useApiData(
    () => fetchNOOSItems({ page: noosPage, page_size: noosPageSize }, invFilters, storeFilter),
    [invFilters.segment, invFilters.family, invFilters.brick, invFilters.class, invFilters.fashionGrade, invFilters.format, storeFilter, noosPage],
  );

  const { data: brokenSetsData, loading: bsLoading } = useApiData(
    () => fetchBrokenSets({ page: bsPage, page_size: bsPageSize }, invFilters, storeFilter),
    [invFilters.segment, invFilters.family, invFilters.brick, invFilters.class, invFilters.fashionGrade, invFilters.format, storeFilter, bsPage, bsPageSize],
  );

  const baseItems = useMemo(() => noosData?.items ?? [], [noosData]);
  const totalNoosItems = noosData?.total ?? 0;
  const totalNoosPages = noosData?.total_pages ?? 0;

  // ── Broken Sets ─────────────────────────────────────────────
  const brokenSetItems = useMemo(() => brokenSetsData?.items ?? [], [brokenSetsData]);
  const totalBrokenSets = brokenSetsData?.total ?? 0;
  const totalBsPages = brokenSetsData?.total_pages ?? 0;

  // ── Section 3: Activity Log ───────────────────────────────────
  const { data: activityLogData } = useApiData<NOOSActivityLogData>(
    () => fetchNOOSActivityLog(),
    [],
  );

  const lastReplenRun = activityLogData?.last_run ?? null;
  const failedReplenRuns = activityLogData?.failed_runs ?? [];

  if (noosLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mb-3" />
          <div className="h-12 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (noosError) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
        <p className="text-sm text-error mb-2">Failed to load NOOS data</p>
        <p className="text-xs text-gray-500 mb-3">{noosError}</p>
        <Button variant="outline" size="sm" onClick={noosRefetch}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* NOOS Items Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <SectionHeader title="NOOS Items Storewise health" subtitle={`${totalNoosItems} items tracked`} className="mb-0" />
        </div>
        <DataTable>
          <DataTableHeader>
            <DataTableHead>Option</DataTableHead>
            <DataTableHead>Category</DataTableHead>
            <DataTableHead align="right">In Stock (Stores)</DataTableHead>
            <DataTableHead align="right">Stockout (Stores)</DataTableHead>
            <DataTableHead align="right">Avg. STR(%)</DataTableHead>
            <DataTableHead align="right">Units</DataTableHead>
            <DataTableHead>Status</DataTableHead>
            <DataTableHead><span className="sr-only">Drill</span></DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {baseItems.map((item) => (
              <DataTableRow key={item.id} className={cn('group', item.status === 'critical' && 'bg-red-50/50', item.status === 'warning' && 'bg-amber-50/50')}>
                <DataTableCell>
                  <span className="font-medium text-gray-900">{item.option_code}</span>
                </DataTableCell>
                <DataTableCell>{item.category ?? '--'}</DataTableCell>
                <DataTableCell align="right">{item.stores_in_stock}</DataTableCell>
                <DataTableCell align="right">
                  <span className={cn(item.stores_stockout > 0 && 'text-error font-medium')}>{item.stores_stockout}</span>
                </DataTableCell>
                <DataTableCell align="right">{item.avg_str_pct != null ? `${item.avg_str_pct}%` : '--'}</DataTableCell>
                <DataTableCell align="right">{formatNumber(item.total_units)}</DataTableCell>
                <DataTableCell>
                  <Badge
                    variant={item.status === 'healthy' ? 'success' : item.status === 'warning' ? 'warning' : 'error'}
                    className="text-[10px]"
                  >
                    {item.status}
                  </Badge>
                </DataTableCell>
                <DataTableCell>
                  <DrillMenu
                    rowLabel={item.option_code}
                    targets={getSkuDrillTargets({ style: item.option_code, category: item.category ?? undefined, from: 'inventory' })}
                  />
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
        {totalNoosPages > 1 && (
          // eslint-disable-next-line design-system/prefer-section-header -- pagination control
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Page {noosPage} of {totalNoosPages} ({totalNoosItems} items)
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={noosPage <= 1} onClick={() => setNoosPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={noosPage >= totalNoosPages} onClick={() => setNoosPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Broken Sets */}
      {brokenSetItems.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <SectionHeader
              title="Broken Sets"
              subtitle={`${totalBrokenSets} options with BSI > 0.40`}
              className="mb-0"
            />
          </div>
          <div className="relative">
            {bsLoading && (
              <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <DataTable>
              <DataTableHeader>
                <DataTableHead>Option</DataTableHead>
                <DataTableHead>Category</DataTableHead>
                <DataTableHead align="right">Stores</DataTableHead>
                <DataTableHead align="right">BSI</DataTableHead>
                <DataTableHead>Missing Sizes</DataTableHead>
              </DataTableHeader>
              <DataTableBody>
                {brokenSetItems.map(item => (
                  <DataTableRow key={item.option_code}>
                    <DataTableCell>
                      <span className="font-medium text-gray-900">{item.option_code}</span>
                    </DataTableCell>
                    <DataTableCell>{item.category ?? '--'}</DataTableCell>
                    <DataTableCell align="right">{item.stores_affected}</DataTableCell>
                    <DataTableCell align="right">
                      <span className={cn(item.bsi >= 0.6 ? 'text-error font-medium' : item.bsi >= 0.4 ? 'text-amber-600 font-medium' : 'text-gray-700')}>
                        {item.bsi.toFixed(2)}
                      </span>
                    </DataTableCell>
                    <DataTableCell>
                      <div className="flex gap-1 flex-wrap">
                        {item.missing_sizes.map(s => (
                          <Badge key={s} variant="error" className="text-[10px]">{s}</Badge>
                        ))}
                      </div>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          </div>
          {(totalBsPages > 1 || bsPageSize !== 25) && (
            // eslint-disable-next-line design-system/prefer-section-header -- pagination control
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Rows per page:</span>
                {/* eslint-disable-next-line no-restricted-syntax -- inline page size selector */}
                <select
                  value={bsPageSize}
                  onChange={e => { setBsPageSize(Number(e.target.value)); setBsPage(1); }}
                  className="text-xs border border-gray-200 rounded px-1.5 py-0.5"
                >
                  {[25, 50, 100, 500].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <span className="text-xs text-gray-500 ml-2">
                  Page {bsPage} of {totalBsPages} ({totalBrokenSets} items)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={bsPage <= 1} onClick={() => setBsPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={bsPage >= totalBsPages} onClick={() => setBsPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section 3: Automation Activity Log (collapsible, closed by default) */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowActivityLog(!showActivityLog)}
          className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
        >
          <SectionHeader
            title="Automation Activity Log"
            subtitle="What the replenishment agent did"
            className="mb-0"
            actions={showActivityLog ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          />
        </button>
        {showActivityLog && (
          <div className="border-t border-gray-100 divide-y divide-gray-100">
            {/* Last replenishment run */}
            {lastReplenRun && (
              <div className="p-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">Last Replenishment Run</p>
                {/* eslint-disable-next-line design-system/prefer-metric-grid -- compact log display, not standalone KPI cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-500">Run ID</p>
                    <p className="text-xs font-mono text-gray-900">{lastReplenRun.anr_run_id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Actions Generated</p>
                    <p className="text-xs font-medium text-gray-900">{formatNumber(lastReplenRun.actions_generated)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Actions Approved</p>
                    <p className="text-xs font-medium text-gray-900">{formatNumber(lastReplenRun.actions_approved)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Total Units</p>
                    <p className="text-xs font-medium text-gray-900">{formatNumber(lastReplenRun.total_units)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Failed runs alert */}
            {failedReplenRuns.length > 0 && (
              <div className="p-4 bg-red-50/50">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-3.5 h-3.5 text-error" />
                  <p className="text-xs font-semibold text-error">Failed Run Detected</p>
                </div>
                {failedReplenRuns.map(run => (
                  <div key={run.anr_run_id} className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                    <span className="font-mono">{run.anr_run_id}</span>
                    <span>{run.created_at?.split('T')[0] ?? '--'}</span>
                    <Badge variant="error" className="text-[10px]">Failed</Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Summary metrics — hidden until real data available (backlog #65) */}
          </div>
        )}
      </div>

      <Link to="/inventory/actions" className="text-xs text-primary hover:underline">
        View all actions
      </Link>
    </div>
  );
}

// ─── Tab 3: Markdown & Clearance ──────────────────────────────────────────

type PhaseFilter = 'all' | 'markdown' | 'clearance' | 'liquidation' | 'exit';

const PIPELINE_PHASES = [
  { key: 'markdown' as const, label: 'Markdown', days: 'Day 45-90', channel: 'A2/A3 stores', discount: '10-30% off', borderColor: 'border-t-primary' },
  { key: 'clearance' as const, label: 'Clearance', days: 'Day 91-120', channel: 'CC / AJIO', discount: '30-50% off', borderColor: 'border-t-warning' },
  { key: 'liquidation' as const, label: 'Liquidation', days: 'Day 121-180', channel: 'FF / B2B', discount: 'At cost', borderColor: 'border-t-error' },
  { key: 'exit' as const, label: 'Exit', days: 'Day 180+', channel: '', discount: 'Loss Booked', borderColor: 'border-t-gray-800' },
] as const;

function MarkdownClearanceTab({ initialPhase, storeFilter, healthData: hd }: { initialPhase?: PhaseFilter; storeFilter?: string | null; healthData?: HealthSummaryData | null }) {
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>(initialPhase ?? 'all');
  const [mdPage, setMdPage] = useState(1);
  const mdPageSize = 25;
  const [clPage, setClPage] = useState(1);
  const clPageSize = 25;
  const [exitPage, setExitPage] = useState(1);
  const exitPageSize = 25;
  const liquidationRef = useRef<HTMLDivElement>(null);
  const exitRef = useRef<HTMLDivElement>(null);
  const { appliedFilters: invFilters } = useInventoryFilterStore();

  // Map phase filter to API param (only markdown/clearance, not 'all' or 'liquidation')
  const apiPhase = phaseFilter === 'markdown' || phaseFilter === 'clearance' ? phaseFilter : undefined;

  const { data: mdData, loading: mdLoading, error: mdError, refetch: mdRefetch } = useApiData(
    () => fetchMarkdownClearance({
      limit: mdPageSize,
      offset: (mdPage - 1) * mdPageSize,
      phase: apiPhase,
      cl_page: clPage,
      cl_page_size: clPageSize,
      exit_page: exitPage,
      exit_page_size: exitPageSize,
    }, invFilters, storeFilter),
    [invFilters.segment, invFilters.family, invFilters.brick, invFilters.class, invFilters.fashionGrade, invFilters.format, storeFilter, mdPage, apiPhase, clPage, exitPage],
  );

  // API items
  const apiMdItems = useMemo(() => mdData?.markdown_items ?? [], [mdData]);
  const apiClearanceItems = useMemo(() => mdData?.clearance_items ?? [], [mdData]);
  const apiExitItems = useMemo(() => mdData?.exit_items ?? [], [mdData]);
  const totalMarkdown = mdData?.total_markdown ?? 0;
  const totalClearance = mdData?.total_clearance ?? 0;
  const totalExit = mdData?.total_exit ?? 0;
  const totalMdPages = Math.ceil(totalMarkdown / mdPageSize);

  const phaseCounts = useMemo(() => ({
    markdown: hd?.md_stage1_count ?? 0,
    clearance: hd?.md_stage2_count ?? 0,
    liquidation: hd?.cl_liquidation_count ?? 0,
    exit: hd?.cl_exit_count ?? 0,
  }), [hd]);

  const phaseValues = useMemo(() => ({
    markdown: `${formatNumber(hd?.md_stage1_units ?? 0)}`,
    clearance: `${formatNumber(hd?.md_stage2_units ?? 0)}`,
    liquidation: `${formatNumber(hd?.cl_liquidation_units ?? 0)}`,
    exit: `${formatNumber(hd?.cl_exit_units ?? 0)}`,
  }), [hd]);

  // API already filters by phase server-side
  const filteredMdItems = apiMdItems;

  const phaseFilterOptions = useMemo(() => [
    { value: 'all', label: 'All', count: hd ? (hd.md_stage1_count + hd.md_stage2_count) : totalMarkdown },
    { value: 'markdown', label: 'Markdown (45-90d)', count: hd?.md_stage1_count ?? 0 },
    { value: 'clearance', label: 'Clearance (91-120d)', count: hd?.md_stage2_count ?? 0 },
  ], [hd, totalMarkdown]);

  if (mdLoading) {
    return (
      <div className="space-y-4">
        <MetricGrid columns={4}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse mb-2" />
              <div className="h-6 w-12 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </MetricGrid>
      </div>
    );
  }

  if (mdError) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
        <p className="text-sm text-error mb-2">Failed to load markdown data</p>
        <p className="text-xs text-gray-500 mb-3">{mdError}</p>
        <Button variant="outline" size="sm" onClick={mdRefetch}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 45+30+30 Pipeline Strip */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="45+30+30 Inventory Lifecycle Pipeline" className="mb-4" />
        <div className="flex items-stretch gap-1 w-full">
          {PIPELINE_PHASES.map((phase, i) => (
            <div key={phase.key} className="flex items-stretch flex-1">
              <button
                type="button"
                className={cn(
                  'w-full min-w-0 rounded-lg border border-t-[3px] p-3 text-left transition-all',
                  phase.borderColor,
                  phaseFilter === phase.key
                    ? 'bg-white shadow-sm ring-1 ring-primary/30'
                    : 'bg-gray-50/50 hover:bg-white hover:shadow-sm',
                )}
                onClick={() => {
                  const next = phaseFilter === phase.key ? 'all' : phase.key;
                  setPhaseFilter(next);
                  if (next === 'liquidation') {
                    liquidationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  } else if (next === 'exit') {
                    exitRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                {/* eslint-disable-next-line design-system/prefer-section-header -- pipeline phase card header, not a section */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-gray-900">{phase.label}</span>
                  <Badge
                    variant="default"
                    size="sm"
                  >
                    {phaseCounts[phase.key]}
                  </Badge>
                </div>
                <p className="text-[10px] text-gray-500 mb-0.5">{phase.days}</p>
                <p className="text-[10px] text-gray-500 mb-0.5">{phase.channel}</p>
                <p className="text-[10px] font-medium text-gray-600 mb-1.5">{phase.discount}</p>
                <p className="text-xs font-medium text-gray-900">{phaseValues[phase.key]} units</p>
              </button>
              {i < PIPELINE_PHASES.length - 1 && (
                <div className="flex items-center px-0.5 text-gray-400">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-3">45+30+30 Engine per SOP-04 / SOP-09. Network age carries through all transfers.</p>
      </div>

      {/* Markdown Items Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <SectionHeader title="Markdown Items" className="mb-3" />
          <FilterBar>
            <FilterPills
              value={phaseFilter === 'liquidation' ? 'all' : phaseFilter}
              onChange={(v) => { setPhaseFilter(v as PhaseFilter); setMdPage(1); }}
              options={phaseFilterOptions}
            />
          </FilterBar>
        </div>
        <DataTable>
          <DataTableHeader>
            <DataTableHead>Option</DataTableHead>
            <DataTableHead>Category</DataTableHead>
            <DataTableHead align="center">Phase</DataTableHead>
            <DataTableHead align="right">Days</DataTableHead>
            <DataTableHead align="right">MD%</DataTableHead>
            <DataTableHead align="right">Units Left</DataTableHead>
            <DataTableHead align="right">Margin%</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {filteredMdItems.map((item) => {
              const stage = item.markdown_stage ?? 1;
              const d = item.network_age_days;
              const mdPct = d <= 60 ? 10 : d <= 75 ? 20 : d <= 90 ? 30 : d <= 120 ? 40 : 50;
              return (
              <DataTableRow key={item.id}>
                <DataTableCell>
                  <span className="font-medium text-gray-900">{item.option_code}</span>
                </DataTableCell>
                <DataTableCell>{item.category}</DataTableCell>
                <DataTableCell align="center">
                  <Badge
                    variant={stage === 1 ? 'primary' : 'warning'}
                    className="text-[10px]"
                  >
                    {stage === 1 ? 'Markdown' : 'Clearance'}
                  </Badge>
                </DataTableCell>
                <DataTableCell align="right">{item.network_age_days}d</DataTableCell>
                <DataTableCell align="right">{mdPct}%</DataTableCell>
                <DataTableCell align="right">{formatNumber(item.remaining_units)}</DataTableCell>
                <DataTableCell align="right">{item.margin_at_current_price}%</DataTableCell>
              </DataTableRow>
              );
            })}
          </DataTableBody>
        </DataTable>
        {/* Pagination */}
        {totalMdPages > 1 && (
          // eslint-disable-next-line design-system/prefer-section-header -- pagination control
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Page {mdPage} of {totalMdPages} ({totalMarkdown} items)
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={mdPage <= 1} onClick={() => setMdPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={mdPage >= totalMdPages} onClick={() => setMdPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Liquidation Queue — API clearance items */}
      <div ref={liquidationRef}>
        <LiquidationQueue
          items={apiClearanceItems}
          total={totalClearance}
          page={clPage}
          pageSize={clPageSize}
          onPageChange={setClPage}
        />
      </div>

      {/* Exit Queue — 180+ days */}
      <div ref={exitRef}>
        <ExitQueue
          items={apiExitItems}
          total={totalExit}
          page={exitPage}
          pageSize={exitPageSize}
          onPageChange={setExitPage}
        />
      </div>
    </div>
  );
}

// ─── Liquidation Queue ────────────────────────────────────────────────────

function LiquidationQueue({ items, total, page, pageSize, onPageChange }: {
  items: ClearanceItem[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <SectionHeader title="Liquidation Pipeline" subtitle={`${total} items aged 121-180 days`} className="mb-0" />
      </div>
      {items.length === 0 ? (
        <EmptyState title="No items in pipeline" description="All inventory is within age thresholds" className="p-4" />
      ) : (
        <DataTable>
          <DataTableHeader>
            <DataTableHead>Option</DataTableHead>
            <DataTableHead>Category</DataTableHead>
            <DataTableHead align="right">Days</DataTableHead>
            <DataTableHead align="right">Units</DataTableHead>
            <DataTableHead align="right">Value (L)</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {items.map((item) => (
              <DataTableRow key={item.id}>
                <DataTableCell>
                  <span className="font-medium text-gray-900">{item.option_code}</span>
                </DataTableCell>
                <DataTableCell>{item.category}</DataTableCell>
                <DataTableCell align="right">{item.network_age_days}d</DataTableCell>
                <DataTableCell align="right">{formatNumber(item.remaining_units)}</DataTableCell>
                <DataTableCell align="right">{item.value_at_cost_lakh.toFixed(1)}</DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      )}
      {totalPages > 1 && (
        // eslint-disable-next-line design-system/prefer-section-header -- pagination control
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            Page {page} of {totalPages} ({total} items)
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Exit Queue ───────────────────────────────────────────────────────────

function ExitQueue({ items, total, page, pageSize, onPageChange }: {
  items: ClearanceItem[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <SectionHeader title="Exit" subtitle={`${total} items aged 180+ days`} className="mb-0" />
      </div>
      {items.length === 0 ? (
        <EmptyState title="No items in exit" description="No inventory beyond 180 days" className="p-4" />
      ) : (
        <DataTable>
          <DataTableHeader>
            <DataTableHead>Option</DataTableHead>
            <DataTableHead>Category</DataTableHead>
            <DataTableHead align="right">Days</DataTableHead>
            <DataTableHead align="right">Units</DataTableHead>
            <DataTableHead align="right">Value (L)</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {items.map((item) => (
              <DataTableRow key={item.id}>
                <DataTableCell>
                  <span className="font-medium text-gray-900">{item.option_code}</span>
                </DataTableCell>
                <DataTableCell>{item.category}</DataTableCell>
                <DataTableCell align="right">{item.network_age_days}d</DataTableCell>
                <DataTableCell align="right">{formatNumber(item.remaining_units)}</DataTableCell>
                <DataTableCell align="right">{item.value_at_cost_lakh.toFixed(1)}</DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      )}
      {totalPages > 1 && (
        // eslint-disable-next-line design-system/prefer-section-header -- pagination control
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            Page {page} of {totalPages} ({total} items)
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 4: Store Freshness ───────────────────────────────────────────────

type StoreFreshnessSortCol = 'store_grade' | 'total_options' | 'freshness_pct' | 'exit_queue' | 'compliance';

const complianceSortOrder: Record<string, number> = { non_compliant: 0, at_risk: 1, compliant: 2 };
const gradeSortOrder: Record<string, number> = { 'A': 0, 'A1': 1, 'A2': 2, 'A3': 3 };

function StoreFreshnessTab({ storeFilter, healthData: hd }: { storeFilter: string | null; healthData?: HealthSummaryData | null }) {
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [complianceFilter, setComplianceFilter] = useState<string>('all');
  const [sortCol, setSortCol] = useState<StoreFreshnessSortCol>('freshness_pct');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [sfPage, setSfPage] = useState(1);
  const [sfPageSize, setSfPageSize] = useState(25);
  const [storeSearch, setStoreSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { appliedFilters: invFilters } = useInventoryFilterStore();

  // Debounce search input
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback((val: string) => {
    setStoreSearch(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setSfPage(1);
    }, 400);
  }, []);

  const searchParam = debouncedSearch.trim() || undefined;

  const { data: freshnessData, loading: freshnessLoading, error: freshnessError, refetch: freshnessRefetch } = useApiData(
    () => fetchStoreFreshness(
      { page: sfPage, page_size: sfPageSize, sort_by: sortCol, sort_order: sortDir, store_grade: gradeFilter !== 'all' ? gradeFilter : undefined, compliance: complianceFilter !== 'all' ? complianceFilter : undefined, search: searchParam },
      invFilters,
      storeFilter,
    ),
    [invFilters.segment, invFilters.family, invFilters.brick, invFilters.class, invFilters.fashionGrade, invFilters.format, storeFilter, sortCol, sortDir, gradeFilter, complianceFilter, sfPage, sfPageSize, debouncedSearch],
  );

  const baseRecords = useMemo(() => freshnessData?.items ?? [], [freshnessData]);
  const totalStores = freshnessData?.total ?? 0;
  const totalSfPages = freshnessData?.total_pages ?? 0;

  const apA1Stores = useMemo(
    () => baseRecords.filter((s) => s.store_grade === 'A' || s.store_grade === 'A1'),
    [baseRecords],
  );
  const apA1Compliant = hd
    ? hd.sf_compliant
    : apA1Stores.filter((s) => s.compliance === 'compliant').length;
  const apA1Total = hd ? hd.sf_total : apA1Stores.length;

  const avgFashionAge = hd
    ? hd.sf_avg_fashion_age_days
    : (baseRecords.length > 0 ? Math.round(baseRecords.reduce((s, r) => s + r.avg_fashion_age_days, 0) / baseRecords.length) : 0);

  const totalForcedExit = hd
    ? hd.sf_total_exit_queue
    : baseRecords.reduce((s, r) => s + r.exit_queue, 0);

  const sortedStores = useMemo(() => {
    const sorted = [...baseRecords].sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case 'store_grade':
          cmp = (gradeSortOrder[a.store_grade ?? ''] ?? 99) - (gradeSortOrder[b.store_grade ?? ''] ?? 99);
          break;
        case 'total_options':
          cmp = a.total_options - b.total_options;
          break;
        case 'freshness_pct':
          cmp = a.freshness_pct - b.freshness_pct;
          break;
        case 'exit_queue':
          cmp = a.exit_queue - b.exit_queue;
          break;
        case 'compliance':
          cmp = (complianceSortOrder[a.compliance] ?? 99) - (complianceSortOrder[b.compliance] ?? 99);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [baseRecords, sortCol, sortDir]);

  const toggleSort = (col: StoreFreshnessSortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
    setSfPage(1);
  };

  const sortIndicator = (col: StoreFreshnessSortCol) => {
    if (sortCol !== col) return null;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 inline-block ml-0.5" />
      : <ChevronDown className="w-3 h-3 inline-block ml-0.5" />;
  };

  const gradeOptions = useMemo(() => [
    { value: 'all', label: 'All', count: hd?.total_stores ?? totalStores },
    { value: 'A', label: 'A', count: hd?.sf_grade_a_count ?? baseRecords.filter((s) => s.store_grade === 'A').length },
    { value: 'A1', label: 'A1', count: hd?.sf_grade_a1_count ?? baseRecords.filter((s) => s.store_grade === 'A1').length },
    { value: 'A2', label: 'A2', count: hd?.sf_grade_a2_count ?? baseRecords.filter((s) => s.store_grade === 'A2').length },
    { value: 'A3', label: 'A3', count: hd?.sf_grade_a3_count ?? baseRecords.filter((s) => s.store_grade === 'A3').length },
  ], [hd, totalStores, baseRecords]);

  const complianceOptions = useMemo(() => [
    { value: 'all', label: 'All', count: hd?.total_stores ?? totalStores },
    { value: 'compliant', label: 'Compliant', count: hd?.sf_compliant_count ?? baseRecords.filter((s) => s.compliance === 'compliant').length },
    { value: 'at_risk', label: 'At Risk', count: hd?.sf_at_risk_count ?? baseRecords.filter((s) => s.compliance === 'at_risk').length },
    { value: 'non_compliant', label: 'Non-Compliant', count: hd?.sf_non_compliant_count ?? baseRecords.filter((s) => s.compliance === 'non_compliant').length },
  ], [hd, totalStores, baseRecords]);

  if (freshnessLoading) {
    return (
      <div className="space-y-4">
        <MetricGrid columns={3}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse mb-2" />
              <div className="h-6 w-12 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </MetricGrid>
      </div>
    );
  }

  if (freshnessError) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
        <p className="text-sm text-error mb-2">Failed to load store freshness data</p>
        <p className="text-xs text-gray-500 mb-3">{freshnessError}</p>
        <Button variant="outline" size="sm" onClick={freshnessRefetch}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <MetricGrid columns={3}>
        <MetricCard
          label="A/A1 Freshness Compliance"
          value={`${apA1Compliant}/${apA1Total}`}
          subtitle="Stores meeting freshness target"
          status={apA1Total > 0 && apA1Compliant === apA1Total ? 'on-track' : 'warning'}
        />
        <MetricCard
          label="Avg Fashion Age"
          value={`${avgFashionAge}d`}
          subtitle="Target: <45 days"
          status={avgFashionAge < 45 ? 'on-track' : 'warning'}
        />
        <MetricCard
          label="Forced Exit Queue"
          value={totalForcedExit}
          subtitle="Items queued for forced exit"
          status={totalForcedExit > 5 ? 'critical' : totalForcedExit > 0 ? 'warning' : 'on-track'}
        />
      </MetricGrid>

      <FilterBar>
        <FilterPills value={gradeFilter} onChange={setGradeFilter} options={gradeOptions} />
        <FilterPills value={complianceFilter} onChange={(v) => { setComplianceFilter(v); setSfPage(1); }} options={complianceOptions} />
      </FilterBar>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* eslint-disable-next-line design-system/prefer-section-header -- custom layout with search */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <SectionHeader title="Store Freshness" subtitle={`${totalStores} stores total`} className="mb-0" />
          <FilterSearch value={storeSearch} onChange={handleSearchChange} placeholder="Search store name or code..." />
        </div>
        <DataTable>
          <DataTableHeader>
            <DataTableHead>Store</DataTableHead>
            <DataTableHead className="cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('store_grade')}>
              Grade{sortIndicator('store_grade')}
            </DataTableHead>
            <DataTableHead>Region</DataTableHead>
            <DataTableHead align="right" className="cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('total_options')}>
              Options{sortIndicator('total_options')}
            </DataTableHead>
            <DataTableHead align="right">Under 45d</DataTableHead>
            <DataTableHead align="right">45-90d</DataTableHead>
            <DataTableHead align="right">Over 90d</DataTableHead>
            <DataTableHead align="right" className="cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('freshness_pct')}>
              Freshness %{sortIndicator('freshness_pct')}
            </DataTableHead>
            <DataTableHead align="right" className="cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('exit_queue')}>
              Exit Queue{sortIndicator('exit_queue')}
            </DataTableHead>
            <DataTableHead className="cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('compliance')}>
              Status{sortIndicator('compliance')}
            </DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {sortedStores.map((store) => (
              <DataTableRow
                key={store.store_id}
                className={cn(
                  store.compliance === 'non_compliant' && 'bg-red-50/50',
                  store.compliance === 'at_risk' && 'bg-amber-50/50',
                )}
              >
                <DataTableCell>
                  <span className="font-medium text-gray-900">{store.store_name ?? store.store_id}</span>
                </DataTableCell>
                <DataTableCell>
                  {store.store_grade ? (
                  <Badge
                    variant={
                      store.store_grade === 'A' ? 'success'
                        : store.store_grade === 'A1' ? 'primary'
                        : store.store_grade === 'A2' ? 'warning'
                        : 'error'
                    }
                    className="text-[10px]"
                  >
                    {store.store_grade}
                  </Badge>
                  ) : <span className="text-xs text-gray-400">--</span>}
                </DataTableCell>
                <DataTableCell>{store.region ?? '--'}</DataTableCell>
                <DataTableCell align="right">{store.total_options}</DataTableCell>
                <DataTableCell align="right">{store.options_under_45d}</DataTableCell>
                <DataTableCell align="right">{store.options_45_to_90d}</DataTableCell>
                <DataTableCell align="right">{store.options_over_90d}</DataTableCell>
                <DataTableCell align="right">
                  <span className={cn(
                    'font-medium',
                    store.freshness_pct >= 80 ? 'text-success'
                      : store.freshness_pct >= 60 ? 'text-warning-600'
                      : 'text-error',
                  )}>
                    {store.freshness_pct}%
                  </span>
                </DataTableCell>
                <DataTableCell align="right">{store.exit_queue}</DataTableCell>
                <DataTableCell>
                  <Badge
                    variant={
                      store.compliance === 'compliant' ? 'success'
                        : store.compliance === 'at_risk' ? 'warning'
                        : 'error'
                    }
                    className="text-[10px]"
                  >
                    {store.compliance.replace('_', ' ')}
                  </Badge>
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
        <Pagination
          currentPage={sfPage}
          totalPages={totalSfPages}
          onPageChange={setSfPage}
          totalItems={totalStores}
          pageSize={sfPageSize}
          onPageSizeChange={(size) => { setSfPageSize(size); setSfPage(1); }}
          pageSizeOptions={[25, 50, 100, 500]}
        />
      </div>

      {/* SOP Callout */}
      <div className="bg-primary-50 border border-primary/20 rounded-lg p-3">
        <p className="text-xs text-primary-700">
          A/A1 stores must refresh every 30-45 days -- no fashion item beyond 45 days (SOP-07). Non-compliant stores require immediate intervention.
        </p>
      </div>
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────

export default function InventoryCommandCenterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [ageProfileOpen, setAgeProfileOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('freshness');
  const { download, isDownloading } = useDownload(IMPETUS_APP_BASE);

  const TAB_DOWNLOAD_MAP: Record<string, { path: string; filename: string }> = {
    lifecycle: { path: '/inventory/lifecycle', filename: 'inventory_lifecycle.xlsx' },
    noos: { path: '/inventory/noos', filename: 'inventory_noos.xlsx' },
    freshness: { path: '/inventory/store-freshness', filename: 'store_freshness.xlsx' },
  };

  // Global inventory filters from Zustand
  const { filters, appliedFilters, setFilter, applyFilters, resetFilters, hasActiveFilters, isDirty } = useInventoryFilterStore();
  const anyFilterActive = hasActiveFilters();
  const filtersDirty = isDirty();
  // Store filter flows through the existing `storeFilter` plumbing (sent as `store=`,
  // matched as `site = @store`). Derived from the *applied* store so it only takes
  // effect on Apply, like the other filters.
  const storeFilter = appliedFilters.store && appliedFilters.store !== 'all' ? appliedFilters.store : null;

  // Independent & dynamic filter options (like the CEO dashboard): one request with
  // the FULL current draft selection; the backend returns each dimension's options
  // cross-filtered by the OTHER selected dims (exclude-self). Refetches live on any
  // change — no Apply needed for the option refresh. (Data/KPIs still gate on Apply.)
  const { data: filterData } = useApiData(
    () => fetchFilterOptions(filters),
    [filters.segment, filters.family, filters.class, filters.brick, filters.fashionGrade, filters.format],
  );

  // When options change, prune any selected value that's no longer valid (keeps
  // selections consistent without forcing a strict parent→child reset). Converges:
  // once pruned to a valid subset / 'all', the guard stops further setFilter calls.
  useEffect(() => {
    if (!filterData) return;
    const prune = (key: keyof typeof filters, current: string, opts?: string[]) => {
      if (current === 'all') return;
      const valid = new Set(opts ?? []);
      const kept = current.split(',').filter((v) => valid.has(v));
      const next = kept.length ? kept.join(',') : 'all';
      if (next !== current) setFilter(key, next);
    };
    prune('segment', filters.segment, filterData.segment);
    prune('family', filters.family, filterData.family);
    prune('class', filters.class, filterData.class);
    prune('brick', filters.brick, filterData.brick);
    prune('fashionGrade', filters.fashionGrade, filterData.fashion_grade);
    prune('format', filters.format, filterData.format);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prune when options change
  }, [filterData]);

  // Build filter select options — all dropdowns are always enabled; options are the
  // cross-filtered lists from the single request.
  const apiFormatOptions = useMemo(
    () => [{ value: 'all', label: 'All Formats' }, ...(filterData?.format ?? []).map(v => ({ value: v, label: v }))],
    [filterData],
  );
  const apiSegmentOptions = useMemo(
    () => [{ value: 'all', label: 'All Segments' }, ...(filterData?.segment ?? []).map(v => ({ value: v, label: v }))],
    [filterData],
  );
  const apiFamilyOptions = useMemo(
    () => [{ value: 'all', label: 'All Families' }, ...(filterData?.family ?? []).map(v => ({ value: v, label: v }))],
    [filterData],
  );
  const apiClassOptions = useMemo(
    () => [{ value: 'all', label: 'All Classes' }, ...(filterData?.class ?? []).map(v => ({ value: v, label: v }))],
    [filterData],
  );
  const apiBrickOptions = useMemo(
    () => [{ value: 'all', label: 'All Bricks' }, ...(filterData?.brick ?? []).map(v => ({ value: v, label: v }))],
    [filterData],
  );
  const apiFashionGradeOptions = useMemo(
    () => [{ value: 'all', label: 'All Grades' }, ...(filterData?.fashion_grade ?? []).map(v => ({ value: v, label: v }))],
    [filterData],
  );
  const apiStoreOptions = useMemo(() => {
    const vals = filterData?.stores ?? [];
    return [{ value: 'all', label: 'All Stores' }, ...vals.map(s => ({ value: s.value, label: s.label ?? s.value }))];
  }, [filterData]);

  // ── Deep-link seeding (mount-only): apply ?tab/?segment/?family/?grade/?format from the URL.
  //    Defensive — only set a filter when the value matches a real option (case-insensitive), so a
  //    cross-taxonomy mismatch leaves it as 'all' rather than landing on an empty/broken view.
  //    (Destination side only — drill triggers live in the design lab, not in this page.)
  const deepLinkParams = useRef({
    tab: searchParams.get('tab'),
    format: searchParams.get('format'),
    segment: searchParams.get('segment'),
    family: searchParams.get('family'),
    grade: searchParams.get('grade'),
  });
  const deepLinkSeeded = useRef({ base: false });
  const matchOption = (val: string | null, opts: string[]): string | undefined =>
    val ? opts.find((o) => o.toLowerCase() === val.toLowerCase()) : undefined;

  useEffect(() => {
    if (deepLinkSeeded.current.base || !filterData) return;
    deepLinkSeeded.current.base = true;
    const w = deepLinkParams.current;
    if (w.tab && ['freshness', 'noos', 'lifecycle', 'markdown'].includes(w.tab)) setActiveTab(w.tab);
    const fmt = matchOption(w.format, filterData.format ?? []);
    if (fmt) setFilter('format', fmt);
    const seg = matchOption(w.segment, filterData.segment ?? []);
    if (seg) setFilter('segment', seg);
    const grd = matchOption(w.grade, filterData.fashion_grade ?? []);
    if (grd) setFilter('fashionGrade', grd);
    const fam = matchOption(w.family, filterData.family ?? []);
    if (fam) setFilter('family', fam);
    // Deferred-apply model: commit the seeded draft so deep-linked filters take effect.
    if (fmt || seg || grd || fam) applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount seed once options load
  }, [filterData]);

  // Fetch health summary from API
  const { data: healthData } = useApiData(
    () => fetchHealthSummary(appliedFilters, storeFilter),
    [appliedFilters.segment, appliedFilters.family, appliedFilters.brick, appliedFilters.class, appliedFilters.fashionGrade, appliedFilters.format, storeFilter],
  );

  // Map API age buckets to UI AgeBucket type (default trends to 'flat')
  const ageBuckets: AgeBucket[] = useMemo(() =>
    (healthData?.age_buckets ?? []).map((b) => ({
      label: b.bucket,
      range: b.range,
      units: b.units,
      value_cr: b.value_cr,
      pct: b.pct,
      trend_vs_last_week: 'flat' as const,
      trend_delta_pct: 0,
    })),
    [healthData],
  );

  // Tab status indicators from health summary (counts + RAG statuses)
  const tabIndicators = useMemo(() => {
    const h = healthData;
    const ragToDot = (rag?: { status: string }) => {
      if (!rag) return 'bg-emerald-500';
      if (rag.status === 'red') return 'bg-red-500';
      if (rag.status === 'amber') return 'bg-amber-500';
      return 'bg-emerald-500';
    };

    const lifecycleCount = h?.lc_checkpoint_total ?? 0;
    const lifecycleDot = (h?.aa1_exit_count ?? 0) > 0 ? 'bg-red-500' : ragToDot(h?.a2_exit_rag);

    const noosCount = h?.total_noos_items ?? 0;
    const noosDot = ragToDot(h?.noos_rag);

    const mdCount = h ? (h.md_stage1_count + h.md_stage2_count + h.cl_liquidation_count + h.cl_exit_count) : 0;
    const mdDot = mdCount > 0 ? 'bg-amber-500' : 'bg-emerald-500';

    const freshnessCount = h?.total_stores ?? 0;
    const freshnessDot = 'bg-emerald-500';

    // const rotationCount = h?.total_rotation_alerts ?? 0;
    // const rotationDot = rotationCount > 0 ? 'bg-amber-500' : 'bg-emerald-500';

    return { lifecycleCount, lifecycleDot, noosCount, noosDot, mdCount, mdDot, freshnessCount, freshnessDot };
  }, [healthData]);

  const navigate = useNavigate();

  const handleHealthNavigate = useCallback((target: HealthStripTarget) => {
    searchParams.delete('mdPhase');
    searchParams.delete('checkpoint');
    searchParams.delete('noosSection');

    switch (target) {
      case 'noosStockouts':
        setActiveTab('noos');
        break;
      case 'aa1Exits':
        setActiveTab('lifecycle');
        searchParams.set('checkpoint', 'day_45');
        break;
      case 'a2Exits':
        setActiveTab('lifecycle');
        searchParams.set('checkpoint', 'all');
        break;
      case 'agedStock':
        setActiveTab('markdown');
        searchParams.set('mdPhase', 'clearance');
        break;
      case 'pullbacks':
        navigate('/inventory/actions?tab=pipeline&pipeline=pullback');
        return;
    }
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams, navigate]);

  const handleBucketClick = useCallback((bucket: AgeBucket) => {
    if (bucket.range === 'A0') {
      // Fresh inventory — navigate to Lifecycle Tracker
      setActiveTab('lifecycle');
      searchParams.delete('mdPhase');
    } else {
      // Aging inventory — navigate to Markdown & Clearance with phase filter
      const rangeToPhase: Record<string, PhaseFilter> = {
        A1: 'markdown', A2: 'clearance', A3: 'liquidation',
      };
      setActiveTab('markdown');
      searchParams.set('mdPhase', rangeToPhase[bucket.range] || 'all');
    }
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  return (
    <div className="animate-fadeInUp space-y-4">
      <PageHeader
        title="Inventory Command Center"
        className="mb-1"
        actions={TAB_DOWNLOAD_MAP[activeTab] ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const dl = TAB_DOWNLOAD_MAP[activeTab];
              if (dl) download(dl.path, dl.filename);
            }}
            disabled={isDownloading}
            className="shrink-0"
          >
            <Download className="w-4 h-4 mr-1.5" />
            {isDownloading ? 'Downloading...' : 'Download'}
          </Button>
        ) : undefined}
      />

      {/* Global filter bar — multi-select + explicit Apply (matches the dashboard) */}
      <FilterBar>
        <FilterMultiSelect value={filters.format} onChange={(v) => setFilter('format', v)} options={apiFormatOptions} placeholder="Format" searchable />
        <FilterMultiSelect value={filters.segment} onChange={(v) => setFilter('segment', v)} options={apiSegmentOptions} placeholder="Segment" searchable />
        <FilterMultiSelect value={filters.family} onChange={(v) => setFilter('family', v)} options={apiFamilyOptions} placeholder="Family" searchable />
        <FilterMultiSelect value={filters.class} onChange={(v) => setFilter('class', v)} options={apiClassOptions} placeholder="Class" searchable />
        <FilterMultiSelect value={filters.brick} onChange={(v) => setFilter('brick', v)} options={apiBrickOptions} placeholder="Brick" searchable />
        <FilterMultiSelect value={filters.fashionGrade} onChange={(v) => setFilter('fashionGrade', v)} options={apiFashionGradeOptions} placeholder="Fashion Grade" searchable />
        <FilterMultiSelect value={filters.store} onChange={(v) => setFilter('store', v)} options={apiStoreOptions} placeholder="Store" searchable />
        <Button size="sm" onClick={applyFilters} disabled={!filtersDirty} className="shrink-0">
          Apply Filters
        </Button>
        {(anyFilterActive || filtersDirty) && (
          <FilterClear onClear={() => {
            resetFilters();
          }} />
        )}
      </FilterBar>

      <HealthSummaryStrip data={healthData} onNavigate={handleHealthNavigate} />

      {/* Collapsible Age Profile */}
      <div>
        <button
          onClick={() => setAgeProfileOpen(!ageProfileOpen)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors mb-2"
        >
          {ageProfileOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {ageProfileOpen ? 'Hide' : 'Show'} Age Profile
        </button>
        {ageProfileOpen && <AgeBucketBar buckets={ageBuckets} onBucketClick={handleBucketClick} />}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="underline">
          <TabsTrigger value="freshness">
            Store Freshness
            <Badge size="sm" variant="default" dot dotColor={tabIndicators.freshnessDot} className="ml-1.5">{tabIndicators.freshnessCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="noos">
            NOOS Monitor
            <Badge size="sm" variant="default" dot dotColor={tabIndicators.noosDot} className="ml-1.5">{tabIndicators.noosCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="lifecycle">
            Lifecycle Tracker (Fashion)
            <Badge size="sm" variant="default" dot dotColor={tabIndicators.lifecycleDot} className="ml-1.5">{tabIndicators.lifecycleCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="markdown">
            Markdown &amp; Clearance
            <Badge size="sm" variant="default" dot dotColor={tabIndicators.mdDot} className="ml-1.5">{tabIndicators.mdCount}</Badge>
          </TabsTrigger>
          {/* <TabsTrigger value="rotation">
            Rotation Alerts
            <Badge size="sm" variant="default" dot dotColor={tabIndicators.rotationDot} className="ml-1.5">{tabIndicators.rotationCount}</Badge>
          </TabsTrigger> */}
        </TabsList>
        <TabsContent value="noos">
          <NOOSMonitorTab
            key={searchParams.get('noosSection') || 'default'}
            storeFilter={storeFilter}
            healthData={healthData}
          />
        </TabsContent>
        <TabsContent value="lifecycle">
          <LifecycleTrackerTab
            key={searchParams.get('checkpoint') || 'all'}
            initialCheckpoint={searchParams.get('checkpoint') || undefined}
            healthData={healthData}
            storeFilter={storeFilter}
          />
        </TabsContent>
        <TabsContent value="markdown">
          <MarkdownClearanceTab key={searchParams.get('mdPhase') || 'all'} initialPhase={(searchParams.get('mdPhase') as PhaseFilter) || undefined} storeFilter={storeFilter} healthData={healthData} />
        </TabsContent>
        <TabsContent value="freshness"><StoreFreshnessTab storeFilter={storeFilter} healthData={healthData} /></TabsContent>
        {/* <TabsContent value="rotation"><DualClockRotationAlerts storeFilter={storeFilter} /></TabsContent> */}
      </Tabs>
    </div>
  );
}
