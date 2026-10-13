import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { AlertCircle, Info, RefreshCw } from 'lucide-react';
import {
  SectionHeader, InfoHeaderIcon, ChartTooltipContent, Badge,
  TableToolbar, TableMetricsInfo, EmptyState, Skeleton, Button, DrillMenu,
} from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useTableSearchSort } from '@/hooks/useTableSearchSort';
import { AOPMobileCard } from '@/modules/aop/components/AOPMobileCard';
import { ChartCard } from '@/modules/dashboard/components/ChartCard';
import { getChartDrillTargets } from '@/lib/routing';
import { DashboardKpiGrid } from '@/modules/dashboard/components/DashboardKpiGrid';
import { CHART_CATEGORICAL, CHART_GRID, CHART_AXIS_TICK } from '@/data/chartColors';
import { cn } from '@/lib/utils';
import type { SourcingFilters } from '../stores/useSourcingFilterStore';
import { useQualityMaterials } from '../api/sourcingDirectorHooks';
import {
  qualityKpis, qualityByVendorRows, defectBreakdownRows, fabricPositionRows,
  defectByCategoryData, fabricUtilData,
} from '../data/mockSourcingData';
import {
  fmtFixed1PctOps, fmtIntOrDashOps, parseNumeric,
  splitDefectImpact, type DefectSeverity,
} from '../lib/tableFormat';
import { MetricCardWithGap } from './MetricCardWithGap';
import { apiKpiToSrcHealthKpi, kpiByCode, type SrcHealthKpiWithGap } from '../lib/apiAdapters';

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

// ── Severity → Badge variant (D7) ───────────────────────────────────────────

const SEVERITY_VARIANT: Record<DefectSeverity, 'error' | 'warning' | 'default'> = {
  High: 'error',
  Medium: 'warning',
  Low: 'default',
};

const FABRIC_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error'> = {
  Healthy: 'success',
  Tight: 'warning',
  Critical: 'error',
};

// ── Charts ──────────────────────────────────────────────────────────────────

const defectChartConfig = {
  value: { label: 'Defect Rate %', color: CHART_CATEGORICAL[3]! },
};

const fabricChartConfig = {
  value: { label: 'Utilization %', color: CHART_CATEGORICAL[0]! },
};

// ── Section 1: Quality Issues by Vendor ────────────────────────────────────
//   - Action column hidden (D1)
//   - Search + sort, mobile cards, info icons on every metric column

interface TableHeader {
  label: string;
  /** True for numeric metric columns: right-aligned + InfoHeaderIcon tooltip. */
  metric: boolean;
  /** Right-align without a tooltip (status badges, categorical/text columns). */
  rightAlign?: boolean;
  infoKey?: string;
}

const QUALITY_HEADERS: readonly TableHeader[] = [
  { label: 'Vendor', metric: false },
  { label: 'Cluster', metric: false },
  { label: 'POs Inspected', metric: true },
  { label: 'First-Pass', metric: true, infoKey: 'First-Pass' },
  { label: 'Defect Rate', metric: true },
  { label: 'Top Defect', metric: false, rightAlign: true },
];

const QUALITY_METRIC_KEYS = QUALITY_HEADERS.filter((h) => h.metric).map((h) => h.infoKey ?? h.label);

const QUALITY_SORT_FIELDS = {
  'POs Inspected': (r: typeof qualityByVendorRows[number]) => parseNumeric(r.posInspected),
  'First-Pass': (r: typeof qualityByVendorRows[number]) => parseNumeric(r.firstPass),
  'Defect Rate': (r: typeof qualityByVendorRows[number]) => parseNumeric(r.defectRate),
} as const;

const QUALITY_SORT_COLUMNS = Object.keys(QUALITY_SORT_FIELDS).map((k) => ({ key: k, label: k }));

function QualityByVendorSection() {
  const isMobile = useIsMobile();
  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } =
    useTableSearchSort(qualityByVendorRows, {
      searchField: (r) => `${r.vendor} ${r.cluster}`,
      sortFields: QUALITY_SORT_FIELDS,
      sortUrlParamPrefix: 'srcQualityVendor',
    });

  const toolbar = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search vendors..."
      sortColumns={QUALITY_SORT_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => { setSortKey(k); setSortDir(d); }}
    />
  );

  if (isMobile) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Quality Issues by Vendor <TableMetricsInfo metrics={QUALITY_METRIC_KEYS} />
        </h3>
        {toolbar}
        {filteredRows.length === 0 && search ? (
          <EmptyState title="No results" description={`No matches for "${search}"`} variant="neutral" />
        ) : (
          filteredRows.map((r) => (
            <AOPMobileCard
              key={r.vendor}
              title={r.vendor}
              metrics={[
                { label: 'Cluster', value: r.cluster },
                { label: 'POs Inspected', value: fmtIntOrDashOps(r.posInspected) },
                { label: 'First-Pass', value: r.firstPass },
                { label: 'Defect Rate', value: r.defectRate },
                { label: 'Top Defect', value: r.topDefect },
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
      <SectionHeader title="Quality Issues by Vendor" actions={toolbar} />
      <div className="overflow-x-auto mt-3 -mx-4 px-4">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {QUALITY_HEADERS.map((h) => {
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
            {filteredRows.length === 0 && search ? (
              <tr>
                <td colSpan={QUALITY_HEADERS.length} className="py-6">
                  <EmptyState title="No results" description={`No matches for "${search}"`} variant="neutral" className="py-6" />
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr key={r.vendor} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="py-2.5 pl-3 pr-3 text-left font-medium text-gray-900">{r.vendor}</td>
                  <td className="py-2.5 pl-3 pr-3 text-left text-gray-600">{r.cluster}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.posInspected}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.firstPass}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.defectRate}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 whitespace-nowrap">{r.topDefect}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Section 2: Defect Breakdown ────────────────────────────────────────────
//   - Renamed from "Defect Category Breakdown" (D9)
//   - Trend column hidden (D6)
//   - Impact split into Severity (badge) + Resolution (text) via D7

const DEFECT_HEADERS: readonly TableHeader[] = [
  { label: 'Type', metric: false },
  { label: 'Count', metric: true },
  { label: '% of Total', metric: true },
  // Severity and Resolution are categorical badges, not numeric metrics —
  // right-align without a tooltip (no metric-info dictionary entry exists).
  { label: 'Severity', metric: false, rightAlign: true },
  { label: 'Resolution', metric: false, rightAlign: true },
];

const DEFECT_METRIC_KEYS = DEFECT_HEADERS.filter((h) => h.metric).map((h) => h.infoKey ?? h.label);

const DEFECT_SORT_FIELDS = {
  Count: (r: typeof defectBreakdownRows[number]) => parseNumeric(r.count),
  '% of Total': (r: typeof defectBreakdownRows[number]) => parseNumeric(r.pctOfTotal),
} as const;

const DEFECT_SORT_COLUMNS = Object.keys(DEFECT_SORT_FIELDS).map((k) => ({ key: k, label: k }));

function DefectBreakdownSection() {
  const isMobile = useIsMobile();
  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } =
    useTableSearchSort(defectBreakdownRows, {
      searchField: (r) => r.type,
      sortFields: DEFECT_SORT_FIELDS,
      sortUrlParamPrefix: 'srcDefectBreakdown',
    });

  const toolbar = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search defect types..."
      sortColumns={DEFECT_SORT_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => { setSortKey(k); setSortDir(d); }}
    />
  );

  if (isMobile) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Defect Breakdown <TableMetricsInfo metrics={DEFECT_METRIC_KEYS} />
        </h3>
        {toolbar}
        {filteredRows.length === 0 && search ? (
          <EmptyState title="No results" description={`No matches for "${search}"`} variant="neutral" />
        ) : (
          filteredRows.map((r) => {
            const { severity, resolution } = splitDefectImpact(r.impact);
            return (
              <AOPMobileCard
                key={r.type}
                title={r.type}
                metrics={[
                  { label: 'Count', value: fmtIntOrDashOps(r.count) },
                  { label: '% of Total', value: r.pctOfTotal },
                  { label: 'Severity', value: severity },
                  { label: 'Resolution', value: resolution },
                ]}
                onClick={() => {}}
                className="cursor-default"
                showChevron={false}
              />
            );
          })
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Defect Breakdown" actions={toolbar} />
      <div className="overflow-x-auto mt-3 -mx-4 px-4">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {DEFECT_HEADERS.map((h) => {
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
            {filteredRows.length === 0 && search ? (
              <tr>
                <td colSpan={DEFECT_HEADERS.length} className="py-6">
                  <EmptyState title="No results" description={`No matches for "${search}"`} variant="neutral" className="py-6" />
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => {
                const { severity, resolution } = splitDefectImpact(r.impact);
                return (
                  <tr key={r.type} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="py-2.5 pl-3 pr-3 text-left font-medium text-gray-900">{r.type}</td>
                    <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.count}</td>
                    <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.pctOfTotal}</td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <Badge variant={SEVERITY_VARIANT[severity]} size="sm">{severity}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-700 whitespace-nowrap">{resolution}</td>
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

// ── Section 3: Fabric Position ──────────────────────────────────────────────
//   - Renamed from "Fabric Position Detail" (D9)

const FABRIC_HEADERS: readonly TableHeader[] = [
  { label: 'Type', metric: false },
  { label: 'Total', metric: true },
  { label: 'Committed', metric: true },
  { label: 'Free', metric: true },
  { label: 'Utilization %', metric: true, infoKey: 'Util %' },
  { label: 'At Risk', metric: true },
  { label: 'Status', metric: false, rightAlign: true },
];

const FABRIC_METRIC_KEYS = FABRIC_HEADERS.filter((h) => h.metric).map((h) => h.infoKey ?? h.label);

const FABRIC_SORT_FIELDS = {
  Total: (r: typeof fabricPositionRows[number]) => parseNumeric(r.total),
  Committed: (r: typeof fabricPositionRows[number]) => parseNumeric(r.committed),
  Free: (r: typeof fabricPositionRows[number]) => parseNumeric(r.free),
  'Utilization %': (r: typeof fabricPositionRows[number]) => r.utilPct,
  'At Risk': (r: typeof fabricPositionRows[number]) => parseNumeric(r.atRisk),
} as const;

const FABRIC_SORT_COLUMNS = Object.keys(FABRIC_SORT_FIELDS).map((k) => ({ key: k, label: k }));

function FabricPositionSection() {
  const isMobile = useIsMobile();
  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } =
    useTableSearchSort(fabricPositionRows, {
      searchField: (r) => r.type,
      sortFields: FABRIC_SORT_FIELDS,
      sortUrlParamPrefix: 'srcFabricPosition',
    });

  const toolbar = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search fabric types..."
      sortColumns={FABRIC_SORT_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => { setSortKey(k); setSortDir(d); }}
    />
  );

  if (isMobile) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Fabric Position <TableMetricsInfo metrics={FABRIC_METRIC_KEYS} />
        </h3>
        {toolbar}
        {filteredRows.length === 0 && search ? (
          <EmptyState title="No results" description={`No matches for "${search}"`} variant="neutral" />
        ) : (
          filteredRows.map((r) => (
            <AOPMobileCard
              key={r.type}
              title={r.type}
              metrics={[
                { label: 'Total', value: r.total },
                { label: 'Committed', value: r.committed },
                { label: 'Free', value: r.free },
                { label: 'Utilization %', value: fmtFixed1PctOps(r.utilPct) },
                { label: 'At Risk', value: r.atRisk },
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
      <SectionHeader title="Fabric Position" actions={toolbar} />
      <div className="overflow-x-auto mt-3 -mx-4 px-4">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {FABRIC_HEADERS.map((h) => {
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
            {filteredRows.length === 0 && search ? (
              <tr>
                <td colSpan={FABRIC_HEADERS.length} className="py-6">
                  <EmptyState title="No results" description={`No matches for "${search}"`} variant="neutral" className="py-6" />
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr key={r.type} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="py-2.5 pl-3 pr-3 text-left font-medium text-gray-900">{r.type}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.total}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.committed}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.free}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.utilPct}%</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.atRisk}</td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <Badge variant={FABRIC_STATUS_VARIANT[r.status] ?? 'default'} size="sm">{r.status}</Badge>
                  </td>
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

const QUALITY_KPI_API_CODES: Record<string, string> = {
  'src-fpy': 'src-fpy',
  'src-defect': 'src-defect',
  'src-fab-util': 'src-fab-util',
};

export function QualityMaterialsTab({ filters }: { filters: SourcingFilters }) {
  const isMobile = useIsMobile();
  const { data, isLoading, isError, refetch } = useQualityMaterials(filters);

  const kpiCards = useMemo<SrcHealthKpiWithGap[]>(() => {
    return qualityKpis.map((mock) => {
      const code = QUALITY_KPI_API_CODES[mock.id];
      const card = code ? kpiByCode(data?.kpi_cards, code) : undefined;
      return apiKpiToSrcHealthKpi(card, mock);
    });
  }, [data?.kpi_cards]);

  if (isError) {
    return (
      <EmptyState
        title="Couldn't load Quality & Materials"
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
          {qualityKpis.map((kpi) => (
            <Skeleton key={kpi.id} className="h-[88px] w-full" />
          ))}
        </DashboardKpiGrid>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Skeleton className="h-[260px] w-full" />
          <Skeleton className="h-[260px] w-full" />
        </div>
        <Skeleton className="h-[260px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeInUp">
      {data?.tab_data_gap_reason && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">{data.tab_data_gap_reason}</p>
        </div>
      )}

      <KpiGrid kpis={kpiCards} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ChartCard
          title="Defect Rate by Category"
          description="Defect rate % across product categories"
          headerAction={<DrillMenu rowLabel="categories" targets={getChartDrillTargets('category', { from: 'dashboard' })} />}
        >
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" minWidth={0} height="100%">
              <BarChart data={defectByCategoryData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
                <XAxis type="number" domain={[0, 6]} tick={{ fontSize: 12, fill: CHART_AXIS_TICK }} tickLine={false} axisLine={false} hide={isMobile} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: isMobile ? 10 : 11, fill: CHART_AXIS_TICK }} tickLine={false} axisLine={false} width={isMobile ? 80 : 110} />
                <Tooltip content={<ChartTooltipContent config={defectChartConfig} valueFormatter={(v) => `${v}%`} />} />
                <Bar dataKey="value" fill={CHART_CATEGORICAL[3]} radius={[0, 4, 4, 0]} barSize={isMobile ? 16 : 22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Fabric Utilization by Type" description="Committed fabric as % of total capacity">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" minWidth={0} height="100%">
              <BarChart data={fabricUtilData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: CHART_AXIS_TICK }} tickLine={false} axisLine={false} hide={isMobile} />
                <YAxis type="category" dataKey="type" tick={{ fontSize: isMobile ? 10 : 11, fill: CHART_AXIS_TICK }} tickLine={false} axisLine={false} width={isMobile ? 80 : 110} />
                <Tooltip content={<ChartTooltipContent config={fabricChartConfig} valueFormatter={(v) => `${v}%`} />} />
                <Bar dataKey="value" fill={CHART_CATEGORICAL[0]} radius={[0, 4, 4, 0]} barSize={isMobile ? 16 : 22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <QualityByVendorSection />
      <DefectBreakdownSection />
      <FabricPositionSection />
    </div>
  );
}
