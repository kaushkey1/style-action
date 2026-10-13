import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Button,
  MetricCard,
  SectionHeader,
  InfoHeaderIcon,
  ChartTooltipContent,
  TableToolbar,
  TableMetricsInfo,
  EmptyState,
  Skeleton,
  DrillMenu,
} from '@/components/ui';
import { useMemo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useTableSearchSort } from '@/hooks/useTableSearchSort';
import { cn } from '@/lib/utils';
// HIDDEN — numericPrefixSortKey was used only inside Broken Size Runs.
// Restore when un-hiding that section.
// import { numericPrefixSortKey } from '@/lib/utils';
import type { CategoryDirectorFilters } from '../stores/useCategoryDirectorFilterStore';
import { ChartCard } from '@/modules/dashboard/components/ChartCard';
import { getChartDrillTargets } from '@/lib/routing';
import { DashboardKpiGrid } from '@/modules/dashboard/components/DashboardKpiGrid';
import { AOPMobileCard } from '@/modules/aop/components/AOPMobileCard';
import {
  CHART_SEQUENTIAL, CHART_PRIMARY,
  CHART_GRID, CHART_AXIS_TICK,
} from '@/data/chartColors';
import type {
  MdTriggerRow,
  CategoryDirectorHealthKpi,
} from '../data/mockCategoryDirectorData';
import { useInventoryLifecycle, useCategoryPerformance } from '../api/categoryDirectorHooks';
import {
  ageDistributionToRecharts,
  agedByGradeToRecharts,
  apiKpiToCategoryDirectorHealthKpi,
  cdStatusToRag,
  cdKpiSubtitle,
  // HIDDEN — brokenSizesToRows adapter. Restore when un-hiding Broken Size Runs section.
  // brokenSizesToRows,
  computeAxisWidth,
  kpiByCode,
  markdownTriggersTableToRows,
  // HIDDEN — stripIndexPrefix was used only inside Broken Size Runs.
  // Restore when un-hiding that section.
  // stripIndexPrefix,
} from '../lib/apiAdapters';
import type {
  MarkdownTriggerRow,
  ReplenishmentTriggerRow,
  AllocationTriggerRow,
} from '../api/categoryDirectorApi';
import { SingleLineTick } from '../lib/chartAxis';

/**
 * FE display config for the Inventory & Lifecycle KPI grid — render order,
 * labels, targets, and the API `code` that supplies each tile's value.
 * Values are never hardcoded here; missing API → "N/A" via the adapter.
 * `ww-fashion-age` removed 2026-05-29 per PM.
 */
type InvKpiMeta = {
  id: string;
  apiCode: string;
  label: string;
  target: string;
  infoKey: string;
  /**
   * Which BE endpoint emits this card. Defaults to 'inv' (the inventory-
   * lifecycle response). Use 'perf' for KPIs that physically render on this
   * tab but whose data lives in /category-performance — currently the two
   * sell-through KPIs that were relocated here on 2026-06-01.
   */
  source?: 'inv' | 'perf';
};

const INV_KPI_META: InvKpiMeta[] = [
  { id: 'ww-doh',       apiCode: 'ww-doh',       label: 'Days on Hand',           target: '≤75d',  infoKey: 'Days on Hand' },
  { id: 'ww-aged',      apiCode: 'ww-aged',      label: 'Aged % >120d',           target: '≤15%',  infoKey: 'Aged Stock (>120d)' },
  { id: 'ww-fresh',     apiCode: 'ww-fresh',     label: 'Fresh % <30d',           target: '≥55%',  infoKey: 'Fresh Inventory' },
  { id: 'ww-noos',      apiCode: 'ww-noos',      label: 'NOOS Stockouts',         target: '0',     infoKey: 'NOOS Stockout (Stores)' },
  { id: 'ww-inv-turns', apiCode: 'ww-inv-turns', label: 'Inv Turns (annualised)', target: '≥8x',   infoKey: 'Inv Turns (annualised)' },
  // Moved from Category Performance on 2026-06-01 (PM decision). The cards
  // render here, but the BE only emits these codes on /category-performance —
  // hence `source: 'perf'`. Remove the second hook call when BE adds them to
  // /inventory-lifecycle.
  { id: 'ww-fp-st2',    apiCode: 'ww-fp-st',     label: 'Full-Price ST %',        target: '≥65%',  infoKey: 'FP ST %', source: 'perf' },
  { id: 'ww-st-season', apiCode: 'ww-st-season', label: 'Sell-Through',           target: '≥65%',  infoKey: 'ST %',    source: 'perf' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseNumeric(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/** Format DOH string with en-IN commas and " days" suffix. */
function formatDohStr(value: string): string {
  const n = parseNumeric(value);
  if (n === 0 && value.trim() !== '0') return value;
  return `${n.toLocaleString('en-IN')} days`;
}

/** DOH conditional color: red >365, amber >180, default otherwise. */
function dohColorClass(value: string): string {
  const n = parseNumeric(value);
  if (n > 365) return 'text-red-600 font-medium';
  if (n > 180) return 'text-amber-600 font-medium';
  return '';
}

// ---------------------------------------------------------------------------
// MD Triggers Pending
// ---------------------------------------------------------------------------

// Option ID + Stage columns hidden until data sign-off. Time + MD Action
// removed 2026-05-29 per data-team spec v2 — BE field doesn't surface them.
// To unhide: restore entries in MD_TRIGGER_HEADERS / MD_TRIGGER_INFO_KEYS and
// uncomment the corresponding <td> cells and mobile metrics below.
const MD_TRIGGER_HEADERS = ['Store ID', 'Store Name', 'Days on Hand', 'ST %', 'FP ST %'];
const MD_TRIGGER_INFO_KEYS: Record<string, string> = {
  'Store ID': 'Store',
  'Store Name': 'Store',
  'Days on Hand': 'Days on Hand',
  'ST %': 'ST %',
  'FP ST %': 'FP ST %',
};
const MD_TRIGGER_SORT_FIELDS: Record<string, (r: MdTriggerRow) => number> = {
  'Days on Hand': (r) => parseNumeric(r.doh),
  'ST %': (r) => parseNumeric(r.stPct),
  'FP ST %': (r) => parseNumeric(r.fpStPct),
};
const MD_TRIGGER_SORT_COLUMNS = Object.keys(MD_TRIGGER_SORT_FIELDS).map((k) => ({ key: k, label: k }));

function MdTriggersSection({ apiRows }: { apiRows: MarkdownTriggerRow[] | undefined }) {
  const isMobile = useIsMobile();
  // Live BE only — empty array when the API returns nothing for this window.
  // The EmptyState below handles the no-data case.
  const sourceRows: MdTriggerRow[] = useMemo(
    () => markdownTriggersTableToRows(apiRows) ?? [],
    [apiRows],
  );
  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } =
    useTableSearchSort(sourceRows, {
      searchField: (r) => `${r.store} ${r.storeName}`,
      sortFields: MD_TRIGGER_SORT_FIELDS,
    });
  // Cap to top 10 (default sort = Days on Hand desc, so this is "10 most urgent
  // stores"). Cap stays in place if the user re-sorts/searches — they're
  // inspecting a curated triage list, not browsing the full set.
  const MD_TRIGGER_TOP_N = 10;
  const visibleRows = filteredRows.slice(0, MD_TRIGGER_TOP_N);

  const toolbar = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search triggers..."
      sortColumns={MD_TRIGGER_SORT_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => { setSortKey(k); setSortDir(d); }}
    />
  );

  if (isMobile) {
    return (
      <div className="space-y-3">
        <SectionHeader
          title={<>Markdown Actions Pending <TableMetricsInfo metrics={Object.keys(MD_TRIGGER_INFO_KEYS)} /></>}
          actions={toolbar}
        />
        {visibleRows.map((r) => (
          <AOPMobileCard
            key={`${r.optionId}-${r.store}`}
            title={r.storeName}
            metrics={[
              { label: 'Store ID', value: r.store },
              { label: 'DOH', value: formatDohStr(r.doh) },
              { label: 'ST %', value: r.stPct },
              { label: 'FP ST %', value: r.fpStPct },
            ]}
            onClick={() => {}}
            className="cursor-default"
            showChevron={false}
          />
        ))}
        {visibleRows.length === 0 && (
          <EmptyState
            title="No results"
            description={search ? `No triggers matching "${search}"` : 'No markdown triggers for the current filters.'}
            variant="neutral"
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Markdown Actions Pending" actions={toolbar} />
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {MD_TRIGGER_HEADERS.map((h) => (
                <th key={h} className="text-left py-2.5 px-3 font-medium text-gray-500 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    {h}
                    {MD_TRIGGER_INFO_KEYS[h] && <InfoHeaderIcon metricKey={MD_TRIGGER_INFO_KEYS[h]} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={MD_TRIGGER_HEADERS.length} className="py-6">
                  <EmptyState
                    title="No results"
                    description={search ? `No triggers matching "${search}"` : 'No markdown triggers for the current filters.'}
                    variant="neutral"
                    className="py-6"
                  />
                </td>
              </tr>
            ) : (
              visibleRows.map((r) => (
                <tr key={`${r.optionId}-${r.store}`} className="border-b border-gray-50 hover:bg-gray-50/50">
                  {/* HIDDEN — Option ID column. To unhide: uncomment + add to headers.
                  <td className="py-2 px-3 font-medium text-gray-900">{r.optionId}</td> */}
                  <td className="py-2 px-3 font-medium text-gray-900">{r.store}</td>
                  <td className="py-2 px-3 text-gray-700">{r.storeName}</td>
                  <td className={cn('py-2 px-3 text-gray-700 tabular-nums', dohColorClass(r.doh))}>{formatDohStr(r.doh)}</td>
                  <td className="py-2 px-3 text-gray-700 tabular-nums">{r.stPct}</td>
                  <td className="py-2 px-3 text-gray-700 tabular-nums">{r.fpStPct}</td>
                  {/* HIDDEN — Stage column.
                  <td className="py-2 px-3 text-gray-700 tabular-nums">{r.stage}</td> */}
                  {/* HIDDEN — Time + MD Action columns removed 2026-05-29 per BE spec v2. */}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Replenishment Triggers (ANR planning runs — top 10 by recency + qty)
// Spec: docs/api ref doc/allocation_replensihment_category_director_api_integration.md §3.12.
// BE pre-sorts by create_date DESC then replenishment_qty DESC. We apply
// search/sort across the full payload (~16k rows), then cap to top 10 to
// mirror the "Markdown Actions Pending" triage pattern and keep the DOM small.
// ---------------------------------------------------------------------------

const REPLEN_TRIGGER_HEADERS = ['Create Date', 'Store', 'Category', 'Sub-Category', 'Priority', 'Replen Qty', 'Avg ROS', 'Avg STR %', 'Avg Cover Days'];
const REPLEN_TRIGGER_TOP_N = 10;
const REPLEN_TRIGGER_SORT_FIELDS: Record<string, (r: ReplenishmentTriggerRow) => number> = {
  // Default sort: Replen Qty desc (matches BE secondary sort key).
  'Replen Qty': (r) => r.replenishment_qty ?? 0,
  'Avg ROS': (r) => r.avg_ros_rate ?? 0,
  'Avg STR %': (r) => r.avg_str_rate ?? 0,
  'Avg Cover Days': (r) => r.avg_cover_days ?? 0,
};
const REPLEN_TRIGGER_SORT_COLUMNS = Object.keys(REPLEN_TRIGGER_SORT_FIELDS).map((k) => ({ key: k, label: k }));

function fmtNumber(value: number | null | undefined, digits = 0): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function ReplenishmentTriggersSection({ apiRows }: { apiRows: ReplenishmentTriggerRow[] | undefined }) {
  const sourceRows = useMemo(() => apiRows ?? [], [apiRows]);
  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } =
    useTableSearchSort(sourceRows, {
      searchField: (r) => `${r.store_id} ${r.category_desc ?? ''} ${r.subcategory_desc ?? ''} ${r.priority ?? ''}`,
      sortFields: REPLEN_TRIGGER_SORT_FIELDS,
    });
  const visibleRows = filteredRows.slice(0, REPLEN_TRIGGER_TOP_N);

  const toolbar = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search store / category / priority..."
      sortColumns={REPLEN_TRIGGER_SORT_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => { setSortKey(k); setSortDir(d); }}
    />
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader
        title="Replenishment Actions Pending"
        actions={toolbar}
      />
      {filteredRows.length > REPLEN_TRIGGER_TOP_N && (
        <p className="text-xs text-gray-500 mt-2">Showing top {REPLEN_TRIGGER_TOP_N} of {filteredRows.length.toLocaleString('en-IN')}{search ? ' matching' : ''}.</p>
      )}
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {REPLEN_TRIGGER_HEADERS.map((h) => (
                <th key={h} className="text-left py-2.5 px-3 font-medium text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={REPLEN_TRIGGER_HEADERS.length} className="py-6">
                  <EmptyState
                    title={search ? 'No results' : 'No replenishment triggers'}
                    description={search ? `No triggers matching "${search}"` : 'No ANR replenishment runs in the current planning state.'}
                    variant="neutral"
                    className="py-6"
                  />
                </td>
              </tr>
            ) : (
              visibleRows.map((r, i) => (
                <tr key={`${r.create_date}-${r.store_id}-${r.subcategory_desc ?? ''}-${i}`} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2 px-3 text-gray-700 whitespace-nowrap">{r.create_date}</td>
                  <td className="py-2 px-3 font-medium text-gray-900">{r.store_id}</td>
                  <td className="py-2 px-3 text-gray-700">{r.category_desc ?? '—'}</td>
                  <td className="py-2 px-3 text-gray-700">{r.subcategory_desc ?? '—'}</td>
                  <td className="py-2 px-3 text-gray-700">{r.priority ?? '—'}</td>
                  <td className="py-2 px-3 text-gray-700 tabular-nums">{fmtNumber(r.replenishment_qty)}</td>
                  <td className="py-2 px-3 text-gray-700 tabular-nums">{fmtNumber(r.avg_ros_rate, 2)}</td>
                  <td className="py-2 px-3 text-gray-700 tabular-nums">{fmtNumber(r.avg_str_rate, 1)}</td>
                  <td className="py-2 px-3 text-gray-700 tabular-nums">{fmtNumber(r.avg_cover_days, 0)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Allocation Triggers (ANR pullback runs — top 10 by recency + pullback qty)
// Spec §3.13. BE pre-sorts by created_date DESC then pullback_qty DESC.
// ---------------------------------------------------------------------------

const ALLOC_TRIGGER_HEADERS = ['Created', 'Source', 'Destination', 'Delivery', 'Category', 'Sub-Category', 'Options', 'Replacement Qty', 'Pullback Qty'];
const ALLOC_TRIGGER_TOP_N = 10;
const ALLOC_TRIGGER_SORT_FIELDS: Record<string, (r: AllocationTriggerRow) => number> = {
  // Default sort: Pullback Qty desc (matches BE secondary sort key).
  'Pullback Qty': (r) => r.pullback_qty ?? 0,
  'Replacement Qty': (r) => r.replacement_quantity ?? 0,
  Options: (r) => r.replacement_option_code ?? 0,
};
const ALLOC_TRIGGER_SORT_COLUMNS = Object.keys(ALLOC_TRIGGER_SORT_FIELDS).map((k) => ({ key: k, label: k }));

function AllocationTriggersSection({ apiRows }: { apiRows: AllocationTriggerRow[] | undefined }) {
  const sourceRows = useMemo(() => apiRows ?? [], [apiRows]);
  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } =
    useTableSearchSort(sourceRows, {
      searchField: (r) => `${r.source_store_id} ${r.destination_store_id} ${r.category_desc ?? ''} ${r.subcategory_desc ?? ''} ${r.delivery_type ?? ''}`,
      sortFields: ALLOC_TRIGGER_SORT_FIELDS,
    });
  const visibleRows = filteredRows.slice(0, ALLOC_TRIGGER_TOP_N);

  const toolbar = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search store / category / delivery..."
      sortColumns={ALLOC_TRIGGER_SORT_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => { setSortKey(k); setSortDir(d); }}
    />
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader
        title="Allocation Actions Pending"
        actions={toolbar}
      />
      {filteredRows.length > ALLOC_TRIGGER_TOP_N && (
        <p className="text-xs text-gray-500 mt-2">Showing top {ALLOC_TRIGGER_TOP_N} of {filteredRows.length.toLocaleString('en-IN')}{search ? ' matching' : ''}.</p>
      )}
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {ALLOC_TRIGGER_HEADERS.map((h) => (
                <th key={h} className="text-left py-2.5 px-3 font-medium text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={ALLOC_TRIGGER_HEADERS.length} className="py-6">
                  <EmptyState
                    title={search ? 'No results' : 'No allocation triggers'}
                    description={search ? `No triggers matching "${search}"` : 'No ANR pullback runs in the current planning state.'}
                    variant="neutral"
                    className="py-6"
                  />
                </td>
              </tr>
            ) : (
              visibleRows.map((r, i) => (
                <tr key={`${r.created_date}-${r.source_store_id}-${r.destination_store_id}-${r.subcategory_desc ?? ''}-${i}`} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2 px-3 text-gray-700 whitespace-nowrap">{r.created_date}</td>
                  <td className="py-2 px-3 font-medium text-gray-900">{r.source_store_id}</td>
                  <td className="py-2 px-3 text-gray-700">{r.destination_store_id}</td>
                  <td className="py-2 px-3 text-gray-700">{r.delivery_type ?? '—'}</td>
                  <td className="py-2 px-3 text-gray-700">{r.category_desc ?? '—'}</td>
                  <td className="py-2 px-3 text-gray-700">{r.subcategory_desc ?? '—'}</td>
                  <td className="py-2 px-3 text-gray-700 tabular-nums">{fmtNumber(r.replacement_option_code)}</td>
                  <td className="py-2 px-3 text-gray-700 tabular-nums">{fmtNumber(r.replacement_quantity)}</td>
                  <td className="py-2 px-3 text-gray-700 tabular-nums">{fmtNumber(r.pullback_qty)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Broken Sizes — HIDDEN
// To un-hide: remove the block-comment wrappers below, restore the
// `<BrokenSizeSection ... />` render in the JSX, restore the `brokenRows`
// memo, and restore the `brokenSizesToRows` + `BrokenSizeRow` imports.
// ---------------------------------------------------------------------------

/* HIDDEN — Broken Size Runs section
const BROKEN_SIZE_HEADERS = ['Class', 'Total Options', 'Broken', 'Broken %', 'At-Risk Revenue', 'Avg Missing Sizes'];
const BROKEN_SIZE_INFO_KEYS: Record<string, string> = {
  Class: 'Class',
  'Total Options': 'Total Options',
  Broken: 'Broken',
  'Broken %': 'Broken %',
  'At-Risk Revenue': 'At-Risk Revenue',
  'Avg Missing Sizes': 'Avg Missing Sizes',
};
const BROKEN_SIZE_SORT_FIELDS: Record<string, (r: BrokenSizeRow) => number> = {
  'Total Options': (r) => parseNumeric(r.totalOptions),
  Broken: (r) => parseNumeric(r.broken),
  'Broken %': (r) => parseNumeric(r.brokenPct),
  'At-Risk Revenue': (r) => parseNumeric(r.atRiskRevenue),
  // Sort by category name — numeric-prefix-aware. Pair with ASC.
  Category: (r) => numericPrefixSortKey(r.category),
};
const BROKEN_SIZE_SORT_COLUMNS = Object.keys(BROKEN_SIZE_SORT_FIELDS).map((k) => ({ key: k, label: k }));

function BrokenSizeSection({ rows, categoryFilter }: { rows: BrokenSizeRow[]; categoryFilter: string }) {
  const isMobile = useIsMobile();
  const preFiltered = useMemo(() => {
    if (categoryFilter === 'all') return rows;
    const target = stripIndexPrefix(categoryFilter);
    return rows.filter((r) => r.category === target);
  }, [categoryFilter, rows]);
  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } =
    useTableSearchSort(preFiltered, {
      searchField: (r) => r.category,
      sortFields: BROKEN_SIZE_SORT_FIELDS,
    });

  const toolbar = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search categories..."
      sortColumns={BROKEN_SIZE_SORT_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => { setSortKey(k); setSortDir(d); }}
    />
  );

  if (isMobile) {
    return (
      <div className="space-y-3">
        <SectionHeader
          title={<>Broken Size Runs <TableMetricsInfo metrics={Object.keys(BROKEN_SIZE_INFO_KEYS)} /></>}
          actions={toolbar}
        />
        {filteredRows.map((r) => (
          <AOPMobileCard
            key={r.category}
            title={r.category}
            metrics={[
              { label: 'Total Options', value: r.totalOptions },
              { label: 'Broken', value: r.broken },
              { label: 'Broken %', value: r.brokenPct },
              { label: 'At-Risk Revenue', value: r.atRiskRevenue },
              { label: 'Avg Missing Sizes', value: r.avgMissingSizes },
            ]}
            onClick={() => {}}
            className="cursor-default"
            showChevron={false}
          />
        ))}
        {filteredRows.length === 0 && search && (
          <EmptyState title="No results" description={`No categories matching "${search}"`} variant="neutral" />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Broken Size Runs" actions={toolbar} />
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {BROKEN_SIZE_HEADERS.map((h) => (
                <th key={h} className="text-left py-2.5 px-3 font-medium text-gray-500 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    {h}
                    {BROKEN_SIZE_INFO_KEYS[h] && <InfoHeaderIcon metricKey={BROKEN_SIZE_INFO_KEYS[h]} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 && search ? (
              <tr>
                <td colSpan={BROKEN_SIZE_HEADERS.length} className="py-6">
                  <EmptyState title="No results" description={`No categories matching "${search}"`} variant="neutral" className="py-6" />
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr key={r.category} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2 px-3 font-medium text-gray-900">{r.category}</td>
                  <td className="py-2 px-3 text-gray-700 tabular-nums">{r.totalOptions}</td>
                  <td className="py-2 px-3 text-gray-700 tabular-nums">{r.broken}</td>
                  <td className="py-2 px-3 text-gray-700 tabular-nums">{r.brokenPct}</td>
                  <td className="py-2 px-3 text-gray-700 tabular-nums">{r.atRiskRevenue}</td>
                  <td className="py-2 px-3 text-gray-700 tabular-nums">{r.avgMissingSizes}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
*/ // END HIDDEN — Broken Size Runs section

// ---------------------------------------------------------------------------
// Main tab
// ---------------------------------------------------------------------------

export function InventoryLifecycleTab({ filters }: { filters: CategoryDirectorFilters }) {
  const isMobile = useIsMobile();
  const { data, isLoading, isError, refetch } = useInventoryLifecycle(filters);
  // Sibling fetch for the 2 sell-through KPIs that live on /category-performance
  // but render in this tab's KPI grid (relocated 2026-06-01). React Query
  // dedupes against the Category Performance tab's call, so this is a free
  // cache hit if the user has already visited that tab in the same session.
  const { data: perfData } = useCategoryPerformance(filters);

  const kpiCards = useMemo<CategoryDirectorHealthKpi[]>(() => {
    return INV_KPI_META.map((meta) => {
      const cards = meta.source === 'perf' ? perfData?.kpi_cards : data?.kpi_cards;
      const card = kpiByCode(cards, meta.apiCode);
      const frame: CategoryDirectorHealthKpi = {
        id: meta.id,
        label: meta.label,
        value: 'N/A',
        target: meta.target,
        status: 'warning',
        trendDelta: 0,
        trendLabel: 'vs LW',
        trendDirection: 'flat',
        infoKey: meta.infoKey,
      };
      // UI labels are the source of truth on this tab — keeps the rename of
      // BE "Season Sell-Through" → UI "Sell-Through" sticky, and aligns with
      // the existing "Aged % >180d" vs API >120d-threshold label divergence.
      return apiKpiToCategoryDirectorHealthKpi(card, frame, { labelOverride: meta.label });
    });
  }, [data?.kpi_cards, perfData?.kpi_cards]);

  const agePie = useMemo(
    () => ageDistributionToRecharts(data?.age_distribution_chart),
    [data?.age_distribution_chart],
  );
  const agedByGrade = useMemo(
    () => agedByGradeToRecharts(data?.aged_by_grade_chart),
    [data?.aged_by_grade_chart],
  );
  // Left-aligned YAxis labels — same treatment as Revenue by Category.
  const agedByGradeAxisFontSize = isMobile ? 10 : 12;
  const agedByGradeAxisWidth = useMemo(
    () => computeAxisWidth(agedByGrade.map((d) => d.name), agedByGradeAxisFontSize, isMobile ? 140 : 180),
    [agedByGrade, agedByGradeAxisFontSize, isMobile],
  );
  // HIDDEN — brokenRows memo. To unhide: uncomment along with the
  // BrokenSizeSection render below.
  // const brokenRows = useMemo(
  //   () => brokenSizesToRows(data?.broken_sizes_table),
  //   [data?.broken_sizes_table],
  // );

  if (isError) {
    return (
      <EmptyState
        title="Couldn't load Inventory & Lifecycle"
        description="The dashboard service didn't respond. Try again in a moment."
        icon={AlertCircle}
        action={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
          </Button>
        }
      />
    );
  }

  if (isLoading && !data) {
    return (
      <div className="space-y-4">
        <DashboardKpiGrid>
          {INV_KPI_META.map((meta) => (
            <Skeleton key={meta.id} className="h-[88px] w-full" />
          ))}
        </DashboardKpiGrid>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DashboardKpiGrid>
        {kpiCards.map((kpi) => (
          <MetricCard
            key={kpi.id}
            label={kpi.label}
            value={kpi.value}
            infoKey={kpi.infoKey}
            status={cdStatusToRag(kpi.status)}
            subtitle={cdKpiSubtitle(kpi)}
          />
        ))}
      </DashboardKpiGrid>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ChartCard title="Inventory Age Distribution">
          <div className="h-[300px]">
            {agePie.length === 0 ? (
              <EmptyState description="No inventory snapshot for this window" className="h-full flex items-center justify-center" />
            ) : (
              <ResponsiveContainer width="100%" minWidth={0} height="100%">
                <PieChart>
                  <Pie
                    data={agePie}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    stroke="none"
                    label={({ name, value, cx: cxVal, cy: cyVal, midAngle = 0, outerRadius: or }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = (or as number) + 18;
                      const x = (cxVal as number) + radius * Math.cos(-(midAngle) * RADIAN);
                      const y = (cyVal as number) + radius * Math.sin(-(midAngle) * RADIAN);
                      return (
                        <text
                          x={x}
                          y={y}
                          textAnchor={x > (cxVal as number) ? 'start' : 'end'}
                          dominantBaseline="central"
                          className="text-xs fill-gray-600"
                        >
                          {name} {value}%
                        </text>
                      );
                    }}
                    labelLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                  >
                    {agePie.map((_, i) => (
                      <Cell key={i} fill={CHART_SEQUENTIAL[i % CHART_SEQUENTIAL.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltipContent valueFormatter={(v) => `${v}%`} />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard
          title="Aged Stock by Grade"
          headerAction={<DrillMenu rowLabel="grades" targets={getChartDrillTargets('grade', { from: 'dashboard' })} />}
        >
          <div className="h-[300px]">
            {agedByGrade.length === 0 ? (
              <EmptyState description="No aged-stock grade data for this window" className="h-full flex items-center justify-center" />
            ) : (
              <ResponsiveContainer width="100%" minWidth={0} height="100%">
                <BarChart data={agedByGrade} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: CHART_AXIS_TICK }} tickLine={false} axisLine={false} hide={isMobile} unit="%" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    width={agedByGradeAxisWidth}
                    interval={0}
                    tick={(props) => (
                      <SingleLineTick
                        {...props}
                        fontSize={agedByGradeAxisFontSize}
                        maxChars={isMobile ? 18 : 26}
                        axisWidth={agedByGradeAxisWidth}
                      />
                    )}
                  />
                  <Tooltip content={<ChartTooltipContent valueFormatter={(v) => `${v}%`} />} />
                  {/* Single metric across grades → one indigo (colour is semantic only). */}
                  <Bar dataKey="value" fill={CHART_PRIMARY} radius={[0, 4, 4, 0]} barSize={isMobile ? 20 : 28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>

      <MdTriggersSection apiRows={data?.markdown_triggers_table} />
      <AllocationTriggersSection apiRows={data?.allocation_triggers_table} />
      <ReplenishmentTriggersSection apiRows={data?.replenishment_triggers_table} />
      {/* HIDDEN — Broken Size Runs table. To unhide: uncomment this line, the
          `brokenRows` memo, the `brokenSizesToRows` + `BrokenSizeRow` imports,
          and the BrokenSizeSection component + constants block below. */}
      {/* <BrokenSizeSection rows={brokenRows} categoryFilter={filters.category} /> */}
    </div>
  );
}
