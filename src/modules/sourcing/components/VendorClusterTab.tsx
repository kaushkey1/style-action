import { useEffect, useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import { AlertCircle, RefreshCw } from 'lucide-react';
import {
  SectionHeader, InfoHeaderIcon, ChartTooltipContent, ChartLegendContent, Badge,
  TableToolbar, TableMetricsInfo, EmptyState, Skeleton, Button,
} from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useTableSearchSort } from '@/hooks/useTableSearchSort';
import { AOPMobileCard } from '@/modules/aop/components/AOPMobileCard';
import { ChartCard } from '@/modules/dashboard/components/ChartCard';
import { DashboardKpiGrid } from '@/modules/dashboard/components/DashboardKpiGrid';
import { CHART_PRIMARY, CHART_BASELINE, CHART_GRID, CHART_AXIS_TICK } from '@/data/chartColors';
import { cn } from '@/lib/utils';
import type { SourcingFilters } from '../stores/useSourcingFilterStore';
import { useClusterOptionsStore } from '../stores/useClusterOptionsStore';
import { useVendorClusterTeams } from '../api/sourcingDirectorHooks';
import {
  vendorKpis, intakeMarginByCategory,
} from '../data/mockSourcingData';
import { parseNumeric } from '../lib/tableFormat';
import { MetricCardWithGap } from './MetricCardWithGap';
import { stripIndexPrefix } from '@/modules/category-director/lib/apiAdapters';
import {
  apiKpiToSrcHealthKpi,
  clusterScorecardToRows,
  clustersFromScorecard,
  kpiByCode,
  maxConcentrationShare,
  vendorConcentrationToRows,
  vendorLoadToRows,
  vendorOtifTrendToChart,
  vendorPerformanceToRows,
  zeroFillVendorsToRows,
  type SrcHealthKpiWithGap,
} from '../lib/apiAdapters';

// ── KPI Grid ────────────────────────────────────────────────────────────────

function KpiGrid({ kpis }: { kpis: SrcHealthKpiWithGap[] }) {
  return (
    <DashboardKpiGrid>
      {kpis.map((kpi) => (
        <MetricCardWithGap
          key={kpi.id}
          label={kpi.label}
          value={kpi.value}
          infoKey={kpi.infoKey}
          dataGapReason={kpi.dataGapReason}
        />
      ))}
    </DashboardKpiGrid>
  );
}

const trendChartConfig = {
  actual: { label: 'OTIF %', color: CHART_PRIMARY },
  target: { label: 'Target', color: CHART_BASELINE },
};

const CLUSTER_STATUS_VARIANT = {
  on_track: { variant: 'success' as const, label: 'On Track' },
  warning: { variant: 'warning' as const, label: 'Watch' },
  critical: { variant: 'error' as const, label: 'Critical' },
};

const ZEROFILL_STATUS_VARIANT: Record<string, 'error' | 'warning' | 'default'> = {
  Escalated: 'error',
  'At risk': 'error',
  'Under review': 'warning',
  Monitoring: 'warning',
};

// ── Section 1: Cluster Team Scorecard ──────────────────────────────────────

interface TableHeader {
  label: string;
  /** True for numeric metric columns: right-aligned + InfoHeaderIcon tooltip. */
  metric: boolean;
  /** Right-align without a tooltip (status badges, action columns). */
  rightAlign?: boolean;
  infoKey?: string;
}

// Lead column hidden — BE doesn't populate it. To unhide: restore the entry,
// the mobile metric row, and the `<td>{r.lead}</td>` desktop cell.
const CLUSTER_HEADERS: readonly TableHeader[] = [
  { label: 'Cluster Team', metric: false },
  { label: 'Vendors', metric: true },
  { label: 'OTIF', metric: true, infoKey: 'OTIF' },
  { label: 'Fill Rate', metric: true },
  { label: 'At-Risk', metric: true, infoKey: 'Vendors at Risk' },
  { label: 'Delayed', metric: true },
  { label: 'Status', metric: false, rightAlign: true },
];

const CLUSTER_METRIC_KEYS = CLUSTER_HEADERS.filter((h) => h.metric).map((h) => h.infoKey ?? h.label);

type ClusterRow = ReturnType<typeof clusterScorecardToRows>[number];

const CLUSTER_SORT_FIELDS = {
  Vendors: (r: ClusterRow) => r.vendors,
  'OTIF%': (r: ClusterRow) => parseNumeric(r.otif),
  'Fill Rate': (r: ClusterRow) => parseNumeric(r.fillRate),
  'At-Risk': (r: ClusterRow) => r.atRisk,
  Delayed: (r: ClusterRow) => r.delayedPOs,
} as const;

const CLUSTER_SORT_COLUMNS = Object.keys(CLUSTER_SORT_FIELDS).map((k) => ({ key: k, label: k }));

function ClusterScorecardSection({ rows, gapReason }: { rows: ClusterRow[]; gapReason: string | null }) {
  const isMobile = useIsMobile();
  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } =
    useTableSearchSort(rows, {
      searchField: (r) => r.cluster,
      sortFields: CLUSTER_SORT_FIELDS,
      sortUrlParamPrefix: 'srcClusterScorecard',
    });

  const toolbar = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search clusters..."
      sortColumns={CLUSTER_SORT_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => { setSortKey(k); setSortDir(d); }}
    />
  );

  const emptyDescription = search
    ? `No matches for "${search}"`
    : (gapReason ?? 'No clusters match the current filter.');

  if (isMobile) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Cluster Team Scorecard <TableMetricsInfo metrics={CLUSTER_METRIC_KEYS} />
        </h3>
        {toolbar}
        {filteredRows.length === 0 ? (
          <EmptyState title="No results" description={emptyDescription} variant="neutral" />
        ) : (
          filteredRows.map((r) => (
            <AOPMobileCard
              key={r.cluster}
              title={r.cluster}
              metrics={[
                { label: 'Vendors', value: r.vendors.toLocaleString('en-IN') },
                { label: 'OTIF', value: r.otif },
                { label: 'Fill Rate', value: r.fillRate },
                { label: 'At-Risk', value: r.atRisk.toLocaleString('en-IN') },
                { label: 'Delayed', value: r.delayedPOs.toLocaleString('en-IN') },
                { label: 'Status', value: CLUSTER_STATUS_VARIANT[r.status].label },
              ]}
              onClick={() => {}}
              className="cursor-default"
              showChevron={false}
            />
          ))
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Cluster Team Scorecard" actions={toolbar} />
      <div className="overflow-x-auto mt-3 -mx-4 px-4">
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {CLUSTER_HEADERS.map((h) => {
                const rightAligned = h.metric || h.rightAlign;
                return (
                  <th
                    key={h.label}
                    className={cn(
                      'py-2 font-medium text-gray-500 text-xs whitespace-nowrap',
                      rightAligned ? 'text-right px-3' : 'text-left pl-3 pr-3',
                    )}
                  >
                    <span className={cn('inline-flex items-center gap-1', rightAligned && 'w-full justify-end')}>
                      {h.label}
                      {h.metric && <InfoHeaderIcon metricKey={h.infoKey ?? h.label} />}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={CLUSTER_HEADERS.length} className="py-6">
                  <EmptyState title="No results" description={emptyDescription} variant="neutral" className="py-6" />
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => {
                const status = CLUSTER_STATUS_VARIANT[r.status];
                return (
                  <tr key={r.cluster} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="py-2.5 pl-3 pr-3 text-left font-medium text-gray-900">{r.cluster}</td>
                    <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.vendors.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.otif}</td>
                    <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.fillRate}</td>
                    <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.atRisk.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.delayedPOs.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <Badge variant={status.variant} size="sm">{status.label}</Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Section 2: Vendor Performance (Top / Bottom) ───────────────────────────

const VENDOR_PERF_HEADERS: readonly TableHeader[] = [
  { label: 'Vendor', metric: false },
  { label: 'On-Time', metric: true },
  { label: 'Fill Rate', metric: true },
];

const VENDOR_PERF_METRIC_KEYS = VENDOR_PERF_HEADERS.filter((h) => h.metric).map((h) => h.infoKey ?? h.label);

type VendorPerfRow = ReturnType<typeof vendorPerformanceToRows>[number];

const VENDOR_PERF_SORT_FIELDS = {
  'On-Time': (r: VendorPerfRow) => parseNumeric(r.onTime),
  'Fill Rate': (r: VendorPerfRow) => parseNumeric(r.fillRate),
} as const;

const VENDOR_PERF_SORT_COLUMNS = Object.keys(VENDOR_PERF_SORT_FIELDS).map((k) => ({ key: k, label: k }));

function VendorPerformanceSection({ topRows, bottomRows }: { topRows: VendorPerfRow[]; bottomRows: VendorPerfRow[] }) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'top' | 'bottom'>('top');
  const activeRows = activeTab === 'top' ? topRows : bottomRows;

  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } =
    useTableSearchSort(activeRows, {
      searchField: (r) => r.vendor,
      sortFields: VENDOR_PERF_SORT_FIELDS,
      sortUrlParamPrefix: `srcVendorPerf_${activeTab}`,
    });

  const toolbar = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search vendors..."
      sortColumns={VENDOR_PERF_SORT_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => { setSortKey(k); setSortDir(d); }}
    />
  );

  const tabButtons = (
    <>
      <button
        type="button"
        onClick={() => setActiveTab('top')}
        className={cn(
          'py-2 px-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
          activeTab === 'top'
            ? 'border-primary text-primary'
            : 'border-transparent text-gray-500 hover:text-gray-700',
        )}
      >
        Top Vendors
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('bottom')}
        className={cn(
          'py-2 px-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
          activeTab === 'bottom'
            ? 'border-primary text-primary'
            : 'border-transparent text-gray-500 hover:text-gray-700',
        )}
      >
        Bottom Vendors
      </button>
    </>
  );

  if (isMobile) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">{tabButtons}</div>
          <TableMetricsInfo metrics={VENDOR_PERF_METRIC_KEYS} />
        </div>
        {toolbar}
        {filteredRows.length === 0 ? (
          <EmptyState title="No results" description={search ? `No matches for "${search}"` : 'No vendors available.'} variant="neutral" />
        ) : (
          filteredRows.map((r) => (
            <AOPMobileCard
              key={r.vendor}
              title={r.vendor}
              metrics={[
                { label: 'On-Time', value: r.onTime },
                { label: 'Fill Rate', value: r.fillRate },
              ]}
              onClick={() => {}}
              className="cursor-default"
              showChevron={false}
            />
          ))
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* eslint-disable-next-line design-system/prefer-section-header -- custom tab + toolbar row matches OperationsSupplyChainSection D5 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1">{tabButtons}</div>
        <div className="flex items-center gap-2">{toolbar}</div>
      </div>
      <div className="overflow-x-auto mt-3 -mx-4 px-4">
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {VENDOR_PERF_HEADERS.map((h, i) => (
                <th
                  key={h.label}
                  className={cn(
                    'py-2 font-medium text-gray-500 text-xs whitespace-nowrap',
                    i === 0 ? 'text-left pl-3 pr-3' : 'text-right px-3',
                  )}
                >
                  <span className={cn('inline-flex items-center gap-1', h.metric && 'w-full justify-end')}>
                    {h.label}
                    {h.metric && <InfoHeaderIcon metricKey={h.infoKey ?? h.label} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={VENDOR_PERF_HEADERS.length} className="py-6">
                  <EmptyState title="No results" description={search ? `No matches for "${search}"` : 'No vendors available.'} variant="neutral" className="py-6" />
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr key={r.vendor} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="py-2.5 pl-3 pr-3 text-left font-medium text-gray-900">{r.vendor}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.onTime}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.fillRate}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Section 3: Zero-Fill Vendors ───────────────────────────────────────────

const ZEROFILL_HEADERS: readonly TableHeader[] = [
  { label: 'Vendor', metric: false },
  { label: 'Cluster Team', metric: false },
  { label: 'PO Count', metric: true },
  { label: 'Units Ordered', metric: true },
  { label: 'Days Since GRN', metric: true },
  { label: 'Status', metric: false },
];

const ZEROFILL_METRIC_KEYS = ZEROFILL_HEADERS.filter((h) => h.metric).map((h) => h.infoKey ?? h.label);

type ZeroFillRow = ReturnType<typeof zeroFillVendorsToRows>[number];

const ZEROFILL_SORT_FIELDS = {
  'PO Count': (r: ZeroFillRow) => r.poCount,
  'Units Ordered': (r: ZeroFillRow) => parseNumeric(r.unitsOrdered),
} as const;

const ZEROFILL_SORT_COLUMNS = Object.keys(ZEROFILL_SORT_FIELDS).map((k) => ({ key: k, label: k }));

function ZeroFillVendorsSection({ rows }: { rows: ZeroFillRow[] }) {
  const isMobile = useIsMobile();
  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } =
    useTableSearchSort(rows, {
      searchField: (r) => `${r.vendor} ${r.cluster}`,
      sortFields: ZEROFILL_SORT_FIELDS,
      sortUrlParamPrefix: 'srcZeroFill',
    });

  const toolbar = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search vendors..."
      sortColumns={ZEROFILL_SORT_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => { setSortKey(k); setSortDir(d); }}
    />
  );

  if (isMobile) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Zero-Fill Vendors <TableMetricsInfo metrics={ZEROFILL_METRIC_KEYS} />
        </h3>
        {toolbar}
        {filteredRows.length === 0 ? (
          <EmptyState title="No results" description={search ? `No matches for "${search}"` : 'No zero-fill vendors in range.'} variant="neutral" />
        ) : (
          filteredRows.map((r) => (
            <AOPMobileCard
              key={r.vendor}
              title={r.vendor}
              metrics={[
                { label: 'Cluster', value: r.cluster },
                { label: 'PO Count', value: r.poCount.toLocaleString('en-IN') },
                { label: 'Units Ordered', value: r.unitsOrdered },
                { label: 'Days Since GRN', value: `${r.daysSinceGRN}` },
                { label: 'Status', value: r.status },
              ]}
              onClick={() => {}}
              className="cursor-default"
              showChevron={false}
            />
          ))
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Zero-Fill Vendors" actions={toolbar} />
      <div className="overflow-x-auto mt-3 -mx-4 px-4">
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {ZEROFILL_HEADERS.map((h) => {
                const rightAligned = h.metric || h.rightAlign;
                return (
                  <th
                    key={h.label}
                    className={cn(
                      'py-2 font-medium text-gray-500 text-xs whitespace-nowrap',
                      rightAligned ? 'text-right px-3' : 'text-left pl-3 pr-3',
                    )}
                  >
                    <span className={cn('inline-flex items-center gap-1', rightAligned && 'w-full justify-end')}>
                      {h.label}
                      {h.metric && <InfoHeaderIcon metricKey={h.infoKey ?? h.label} />}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={ZEROFILL_HEADERS.length} className="py-6">
                  <EmptyState title="No results" description={search ? `No matches for "${search}"` : 'No zero-fill vendors in range.'} variant="neutral" className="py-6" />
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => {
                const statusVariant = ZEROFILL_STATUS_VARIANT[r.status] ?? 'default';
                return (
                  <tr key={r.vendor} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="py-2.5 pl-3 pr-3 text-left font-medium text-gray-900">{r.vendor}</td>
                    <td className="py-2.5 pl-3 pr-3 text-left text-gray-700">{r.cluster}</td>
                    <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.poCount.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.unitsOrdered}</td>
                    <td className="py-2.5 px-3 text-right text-red-600 font-medium tabular-nums whitespace-nowrap">{r.daysSinceGRN}</td>
                    <td className="py-2.5 pl-3 pr-3 text-left">
                      <Badge variant={statusVariant} size="sm">{r.status}</Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Section 4: Vendor Load & Capacity ──────────────────────────────────────

const LOAD_HEADERS: readonly TableHeader[] = [
  { label: 'Vendor', metric: false },
  { label: 'Cluster', metric: false },
  { label: 'Active POs', metric: true },
];

const LOAD_METRIC_KEYS = LOAD_HEADERS.filter((h) => h.metric).map((h) => h.infoKey ?? h.label);

type LoadRow = ReturnType<typeof vendorLoadToRows>[number];

const LOAD_SORT_FIELDS = {
  'Active POs': (r: LoadRow) => r.activePOs,
} as const;

const LOAD_SORT_COLUMNS = Object.keys(LOAD_SORT_FIELDS).map((k) => ({ key: k, label: k }));

function VendorLoadSection({ rows }: { rows: LoadRow[] }) {
  const isMobile = useIsMobile();
  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } =
    useTableSearchSort(rows, {
      searchField: (r) => `${r.vendor} ${r.cluster}`,
      sortFields: LOAD_SORT_FIELDS,
      sortUrlParamPrefix: 'srcVendorLoad',
    });

  const toolbar = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search vendors..."
      sortColumns={LOAD_SORT_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => { setSortKey(k); setSortDir(d); }}
    />
  );

  if (isMobile) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Vendor Load & Capacity <TableMetricsInfo metrics={LOAD_METRIC_KEYS} />
        </h3>
        {toolbar}
        {filteredRows.length === 0 ? (
          <EmptyState title="No results" description={search ? `No matches for "${search}"` : 'No vendors available.'} variant="neutral" />
        ) : (
          filteredRows.map((r) => (
            <AOPMobileCard
              key={r.vendor}
              title={r.vendor}
              metrics={[
                { label: 'Cluster', value: r.cluster },
                { label: 'Active POs', value: r.activePOs.toLocaleString('en-IN') },
              ]}
              onClick={() => {}}
              className="cursor-default"
              showChevron={false}
            />
          ))
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Vendor Load & Capacity" actions={toolbar} />
      <div className="overflow-x-auto mt-3 -mx-4 px-4">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {LOAD_HEADERS.map((h) => {
                const rightAligned = h.metric || h.rightAlign;
                return (
                  <th
                    key={h.label}
                    className={cn(
                      'py-2 font-medium text-gray-500 text-xs whitespace-nowrap',
                      rightAligned ? 'text-right px-3' : 'text-left pl-3 pr-3',
                    )}
                  >
                    <span className={cn('inline-flex items-center gap-1', rightAligned && 'w-full justify-end')}>
                      {h.label}
                      {h.metric && <InfoHeaderIcon metricKey={h.infoKey ?? h.label} />}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={LOAD_HEADERS.length} className="py-6">
                  <EmptyState title="No results" description={search ? `No matches for "${search}"` : 'No vendors available.'} variant="neutral" className="py-6" />
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr key={r.vendor} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="py-2.5 pl-3 pr-3 text-left font-medium text-gray-900">{r.vendor}</td>
                  <td className="py-2.5 pl-3 pr-3 text-left text-gray-700">{r.cluster}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.activePOs.toLocaleString('en-IN')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Section 5: Vendor Concentration ────────────────────────────────────────

const CONCENTRATION_HEADERS: readonly TableHeader[] = [
  { label: 'Vendor', metric: false },
  { label: 'Cluster', metric: false },
  { label: 'Categories', metric: false },
  { label: 'Shipped Units', metric: true },
  { label: 'Share %', metric: true },
];

const CONCENTRATION_METRIC_KEYS = CONCENTRATION_HEADERS.filter((h) => h.metric).map((h) => h.infoKey ?? h.label);

type ConcentrationRow = ReturnType<typeof vendorConcentrationToRows>[number];

const CONCENTRATION_SORT_FIELDS = {
  'Shipped Units': (r: ConcentrationRow) => parseNumeric(r.poValue),
  'Share %': (r: ConcentrationRow) => parseNumeric(r.share),
} as const;

const CONCENTRATION_SORT_COLUMNS = Object.keys(CONCENTRATION_SORT_FIELDS).map((k) => ({ key: k, label: k }));

function VendorConcentrationSection({ rows, maxShare }: { rows: ConcentrationRow[]; maxShare: number }) {
  const isMobile = useIsMobile();
  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } =
    useTableSearchSort(rows, {
      searchField: (r) => `${r.vendor} ${r.cluster} ${r.categories}`,
      sortFields: CONCENTRATION_SORT_FIELDS,
      sortUrlParamPrefix: 'srcVendorConcentration',
    });

  const toolbar = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search vendors..."
      sortColumns={CONCENTRATION_SORT_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => { setSortKey(k); setSortDir(d); }}
    />
  );

  const subtitle = `Max vendor share: ${maxShare.toFixed(1)}% — ${maxShare < 20 ? 'within' : 'above'} 20% safe threshold`;

  if (isMobile) {
    return (
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Vendor Concentration <TableMetricsInfo metrics={CONCENTRATION_METRIC_KEYS} />
          </h3>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        {toolbar}
        {filteredRows.length === 0 ? (
          <EmptyState title="No results" description={search ? `No matches for "${search}"` : 'No vendors available.'} variant="neutral" />
        ) : (
          filteredRows.map((r, i) => (
            <AOPMobileCard
              // Vendors with multiple clusters return multiple rows from BE — key must include cluster.
              key={`${r.vendor}-${r.cluster}-${i}`}
              title={r.vendor}
              metrics={[
                { label: 'Cluster', value: r.cluster },
                { label: 'Categories', value: r.categories },
                { label: 'Shipped Units', value: r.poValue },
                { label: 'Share %', value: r.share },
              ]}
              onClick={() => {}}
              className="cursor-default"
              showChevron={false}
            />
          ))
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Vendor Concentration" subtitle={subtitle} actions={toolbar} />
      <div className="overflow-x-auto mt-3 -mx-4 px-4">
        <table className="w-full text-sm min-w-[820px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {CONCENTRATION_HEADERS.map((h, i) => (
                <th
                  key={h.label}
                  className={cn(
                    'py-2 font-medium text-gray-500 text-xs whitespace-nowrap',
                    h.metric ? 'text-right px-3' : 'text-left pl-3 pr-3',
                    i === 0 && 'pl-3',
                  )}
                >
                  <span className={cn('inline-flex items-center gap-1', h.metric && 'w-full justify-end')}>
                    {h.label}
                    {h.metric && <InfoHeaderIcon metricKey={h.infoKey ?? h.label} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={CONCENTRATION_HEADERS.length} className="py-6">
                  <EmptyState title="No results" description={search ? `No matches for "${search}"` : 'No vendors available.'} variant="neutral" className="py-6" />
                </td>
              </tr>
            ) : (
              filteredRows.map((r, i) => (
                // Vendors with multiple clusters return multiple rows from BE — key must include cluster.
                <tr key={`${r.vendor}-${r.cluster}-${i}`} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="py-2.5 pl-3 pr-3 text-left font-medium text-gray-900">{r.vendor}</td>
                  <td className="py-2.5 pl-3 pr-3 text-left text-gray-700">{r.cluster}</td>
                  <td className="py-2.5 pl-3 pr-3 text-left text-gray-700">{r.categories}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.poValue}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.share}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Section 6: Intake Margin by Category (data gap — kept on mock) ─────────

const INTAKE_HEADERS: readonly TableHeader[] = [
  { label: 'Category', metric: false },
  { label: 'Intake Margin %', metric: true },
  { label: 'Target', metric: true },
  { label: 'Compliance', metric: true },
  { label: 'POs Below Target', metric: true },
  { label: 'Value at Risk', metric: true },
];

const INTAKE_METRIC_KEYS = INTAKE_HEADERS.filter((h) => h.metric).map((h) => h.infoKey ?? h.label);

const INTAKE_SORT_FIELDS = {
  'Intake Margin %': (r: typeof intakeMarginByCategory[number]) => parseNumeric(r.im),
  Compliance: (r: typeof intakeMarginByCategory[number]) => parseNumeric(r.compliance),
  'POs Below Target': (r: typeof intakeMarginByCategory[number]) => r.posBelowTarget,
  'Value at Risk': (r: typeof intakeMarginByCategory[number]) => parseNumeric(r.valueAtRisk),
} as const;

const INTAKE_SORT_COLUMNS = Object.keys(INTAKE_SORT_FIELDS).map((k) => ({ key: k, label: k }));

/** Replace developer-facing gap reasons with user-friendly text. */
function humanizeGapReason(raw: string | null): string | null {
  if (!raw) return null;
  // Common developer-facing patterns from the API:
  if (/requires?\s+GRN\s+cost/i.test(raw)) return 'Intake margin analysis by product hierarchy';
  if (/awaiting\s+data/i.test(raw)) return 'This data is being integrated.';
  return raw;
}

function IntakeMarginSection({ gapReason: rawGapReason, subcategoryFilter, apiData }: { gapReason: string | null; subcategoryFilter: string; apiData?: Array<{ category: string; im: string; target: string; compliance: string; posBelowTarget: number; valueAtRisk: string }> }) {
  const gapReason = humanizeGapReason(rawGapReason);
  const isMobile = useIsMobile();

  const sourceData = useMemo(
    () => (apiData && apiData.length > 0) ? apiData : (rawGapReason ? [] : intakeMarginByCategory),
    [apiData, rawGapReason],
  );

  const preFiltered = useMemo(() => {
    if (subcategoryFilter === 'all') return sourceData;
    const target = stripIndexPrefix(subcategoryFilter);
    return sourceData.filter((r) => r.category === target);
  }, [subcategoryFilter, sourceData]);

  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } =
    useTableSearchSort(preFiltered, {
      searchField: (r) => r.category,
      sortFields: INTAKE_SORT_FIELDS,
      sortUrlParamPrefix: 'srcIntakeMargin',
    });

  const toolbar = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search categories..."
      sortColumns={INTAKE_SORT_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => { setSortKey(k); setSortDir(d); }}
    />
  );

  if (sourceData.length === 0 && rawGapReason) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Intake Margin by Category" />
        <EmptyState
          title="Intake margin data not yet available"
          description={gapReason ?? 'This data is being integrated and will appear once the required data sources are connected.'}
          variant="neutral"
          className="py-6"
        />
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Intake Margin by Category <TableMetricsInfo metrics={INTAKE_METRIC_KEYS} />
        </h3>
        {gapReason && <p className="text-xs text-amber-700">{gapReason}</p>}
        {toolbar}
        {filteredRows.length === 0 ? (
          <EmptyState
            title="No results"
            description={search ? `No matches for "${search}"` : 'No categories match the current filter.'}
            variant="neutral"
          />
        ) : (
          filteredRows.map((r) => (
            <AOPMobileCard
              key={r.category}
              title={stripIndexPrefix(r.category)}
              metrics={[
                { label: 'Intake Margin %', value: r.im },
                { label: 'Target', value: r.target },
                { label: 'Compliance', value: r.compliance },
                { label: 'POs Below Target', value: `${r.posBelowTarget}` },
                { label: 'Value at Risk', value: r.valueAtRisk },
              ]}
              onClick={() => {}}
              className="cursor-default"
              showChevron={false}
            />
          ))
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader
        title="Intake Margin by Category"
        subtitle={gapReason ?? undefined}
        actions={toolbar}
      />
      <div className="overflow-x-auto mt-3 -mx-4 px-4">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {INTAKE_HEADERS.map((h, i) => (
                <th
                  key={h.label}
                  className={cn(
                    'py-2 font-medium text-gray-500 text-xs whitespace-nowrap',
                    i === 0 ? 'text-left pl-3 pr-3' : 'text-right px-3',
                  )}
                >
                  <span className={cn('inline-flex items-center gap-1', h.metric && 'w-full justify-end')}>
                    {h.label}
                    {h.metric && <InfoHeaderIcon metricKey={h.infoKey ?? h.label} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={INTAKE_HEADERS.length} className="py-6">
                  <EmptyState
                    title="No results"
                    description={search ? `No matches for "${search}"` : 'No categories match the current filter.'}
                    variant="neutral"
                    className="py-6"
                  />
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr key={r.category} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="py-2.5 pl-3 pr-3 text-left font-medium text-gray-900">{stripIndexPrefix(r.category)}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.im}</td>
                  <td className="py-2.5 px-3 text-right text-gray-500 tabular-nums whitespace-nowrap">{r.target}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.compliance}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.posBelowTarget}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.valueAtRisk}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab assembly ────────────────────────────────────────────────────────────

// Map mock KPI ids → API codes for indexing into kpi_cards.
const VENDOR_KPI_API_CODES: Record<string, string> = {
  'src-fr': 'src-fr',
  'src-otif2': 'src-otif2',
  'src-im': 'src-im',
  'src-vr': 'src-vr',
};

export function VendorClusterTab({ filters }: { filters: SourcingFilters }) {
  const isMobile = useIsMobile();
  const setClusterOptions = useClusterOptionsStore((s) => s.setClusters);

  const { data, isLoading, isError, refetch } = useVendorClusterTeams(filters);

  // Hoist distinct cluster names so the page-level Cluster chip can populate.
  useEffect(() => {
    if (data?.cluster_team_scorecard?.length) {
      setClusterOptions(clustersFromScorecard(data.cluster_team_scorecard));
    }
  }, [data?.cluster_team_scorecard, setClusterOptions]);

  const kpiCards = useMemo<SrcHealthKpiWithGap[]>(() => {
    return vendorKpis.map((mock) => {
      const code = VENDOR_KPI_API_CODES[mock.id];
      const card = code ? kpiByCode(data?.kpi_cards, code) : undefined;
      return apiKpiToSrcHealthKpi(card, mock);
    });
  }, [data?.kpi_cards]);

  // Hide cards whose data source isn't live yet (API returned a placeholder).
  // When the data lands, dataGapReason clears and the card reappears.
  const visibleKpiCards = useMemo(
    () => kpiCards.filter((kpi) => !kpi.dataGapReason),
    [kpiCards],
  );

  const trendData = useMemo(() => vendorOtifTrendToChart(data?.vendor_otif_trend_chart), [data?.vendor_otif_trend_chart]);
  const clusterRows = useMemo(() => clusterScorecardToRows(data?.cluster_team_scorecard), [data?.cluster_team_scorecard]);
  const zeroFillRows = useMemo(() => zeroFillVendorsToRows(data?.zero_fill_vendors), [data?.zero_fill_vendors]);
  const loadRows = useMemo(() => vendorLoadToRows(data?.vendor_load_capacity), [data?.vendor_load_capacity]);
  const topRows = useMemo(() => vendorPerformanceToRows(data?.vendor_load_capacity, 'top', 5), [data?.vendor_load_capacity]);
  const bottomRows = useMemo(() => vendorPerformanceToRows(data?.vendor_load_capacity, 'bottom', 5), [data?.vendor_load_capacity]);
  const concentrationRows = useMemo(() => vendorConcentrationToRows(data?.vendor_concentration), [data?.vendor_concentration]);
  const maxShare = useMemo(() => maxConcentrationShare(data?.vendor_concentration), [data?.vendor_concentration]);

  if (isError) {
    return (
      <EmptyState
        title="Couldn't load Vendor & Cluster Teams"
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
          {vendorKpis.map((kpi) => (
            <Skeleton key={kpi.id} className="h-[88px] w-full" />
          ))}
        </DashboardKpiGrid>
        <Skeleton className="h-[280px] w-full" />
        <Skeleton className="h-[260px] w-full" />
        <Skeleton className="h-[260px] w-full" />
        <Skeleton className="h-[260px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeInUp">
      <KpiGrid kpis={visibleKpiCards} />

      <ChartCard title="Vendor OTIF Trend" description="Weekly on-time-in-full % vs 90% target">
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" minWidth={0} height="100%">
            <LineChart data={trendData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
              <XAxis dataKey="week" tick={{ fontSize: isMobile ? 10 : 12, fill: CHART_AXIS_TICK }} tickLine={false} interval={isMobile ? 'preserveStartEnd' : 0} />
              <YAxis domain={[70, 100]} tick={{ fontSize: 12, fill: CHART_AXIS_TICK }} tickLine={false} axisLine={false} hide={isMobile} />
              <Tooltip content={<ChartTooltipContent config={trendChartConfig} valueFormatter={(v) => `${v}%`} />} />
              <Legend content={<ChartLegendContent config={trendChartConfig} />} />
              <ReferenceLine y={90} stroke={CHART_BASELINE} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="actual" stroke={CHART_PRIMARY} strokeWidth={2} dot={{ r: 3, fill: CHART_PRIMARY }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="target" stroke={CHART_BASELINE} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ClusterScorecardSection rows={clusterRows} gapReason={data?.cluster_team_scorecard_data_gap_reason ?? null} />
      <VendorPerformanceSection topRows={topRows} bottomRows={bottomRows} />
      <ZeroFillVendorsSection rows={zeroFillRows} />
      <VendorLoadSection rows={loadRows} />
      <VendorConcentrationSection rows={concentrationRows} maxShare={maxShare} />
      <IntakeMarginSection gapReason={data?.intake_margin_by_category_data_gap_reason ?? null} subcategoryFilter={filters.subcategory} />
    </div>
  );
}
