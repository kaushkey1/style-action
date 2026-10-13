import { useMemo, type ReactElement } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, LabelList,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { AlertCircle, RefreshCw } from 'lucide-react';
import {
  SectionHeader, InfoHeaderIcon, ChartTooltipContent,
  TableToolbar, TableMetricsInfo, EmptyState, Skeleton, Button, Badge,
} from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useTableSearchSort } from '@/hooks/useTableSearchSort';
import { AOPMobileCard } from '@/modules/aop/components/AOPMobileCard';
import { ChartCard } from '@/modules/dashboard/components/ChartCard';
import { DashboardKpiGrid } from '@/modules/dashboard/components/DashboardKpiGrid';
import { CHART_SEQUENTIAL, CHART_GRID, CHART_AXIS_TICK, CHART_PRIMARY } from '@/data/chartColors';
import { cn } from '@/lib/utils';
import type { SourcingFilters } from '../stores/useSourcingFilterStore';
import { usePoPipeline } from '../api/sourcingDirectorHooks';
import { poKpis } from '../data/mockSourcingData';
import { fmtIntOrDashOps, fmtLocaleIntOps, parseNumeric } from './../lib/tableFormat';
import { MetricCardWithGap } from './MetricCardWithGap';
import { stripIndexPrefix } from '@/modules/category-director/lib/apiAdapters';
import {
  apiKpiToSrcHealthKpi,
  delayedPosToRows,
  kpiByCode,
  leadTimeDistributionToChart,
  poByCategoryToRows,
  poFunnelToData,
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

const funnelChartConfig = {
  count: { label: 'PO Count', color: CHART_SEQUENTIAL[0]! },
};

const leadTimeChartConfig = {
  count: { label: 'POs', color: CHART_PRIMARY },
};

interface FunnelLabelProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number;
  index?: number;
}

interface FunnelLabelRow { stage: string; count: number; retentionPct: number | null }

/**
 * Render count + retention % to the right of each funnel bar. Called by
 * Recharts as `content` of `<LabelList>` — closes over the latest funnelRows
 * so it always sees fresh data.
 *
 * Retention coloring: ≤ −50% red, ≤ −20% amber, else gray-500.
 */
function renderFunnelLabel(
  props: FunnelLabelProps,
  funnelRows: FunnelLabelRow[],
): ReactElement | null {
  const { x = 0, y = 0, width = 0, height = 0, value, index = 0 } = props;
  const row = funnelRows[index];
  if (!row) return null;

  const countText = fmtLocaleIntOps(value);
  const retPct = row.retentionPct;
  const retText = retPct == null ? null : `${retPct > 0 ? '+' : ''}${retPct}%`;
  const retColor =
    retPct == null ? '#6b7280'
    : retPct <= -50 ? '#dc2626'
    : retPct <= -20 ? '#d97706'
    : '#6b7280';

  const labelX = x + width + 8;
  const labelY = y + height / 2 + 4;

  return (
    <g>
      <text x={labelX} y={labelY} fontSize={11} fill="#374151" fontWeight={500}>
        {countText}
      </text>
      {retText && (
        <text x={labelX + 42} y={labelY} fontSize={10} fill={retColor} fontWeight={500}>
          {retText}
        </text>
      )}
    </g>
  );
}

// ── Section 1: PO Pipeline by Category ─────────────────────────────────────

interface TableHeader {
  label: string;
  /** True for numeric metric columns: right-aligned + InfoHeaderIcon tooltip. */
  metric: boolean;
  /** Right-align without a tooltip (status badges, action columns). */
  rightAlign?: boolean;
  infoKey?: string;
}

const PIPELINE_HEADERS: readonly TableHeader[] = [
  { label: 'Category', metric: false },
  { label: 'Total POs', metric: true },
  { label: 'In Production', metric: true },
  { label: 'In Transit', metric: true },
  { label: 'Delivered', metric: true },
  { label: 'GRN Done', metric: true },
  { label: 'Fill Rate', metric: true },
  { label: 'Average Lead Time', metric: true, infoKey: 'Avg Lead' },
];

const PIPELINE_METRIC_KEYS = PIPELINE_HEADERS.filter((h) => h.metric).map((h) => h.infoKey ?? h.label);

type PipelineRow = ReturnType<typeof poByCategoryToRows>[number];

const PIPELINE_SORT_FIELDS = {
  'Total POs': (r: PipelineRow) => parseNumeric(r.totalPOs),
  'In Production': (r: PipelineRow) => r.inProduction,
  'In Transit': (r: PipelineRow) => r.inTransit,
  Delivered: (r: PipelineRow) => r.delivered,
  'GRN Done': (r: PipelineRow) => r.grnDone,
  'Fill Rate': (r: PipelineRow) => parseNumeric(r.fillRate),
  'Average Lead Time': (r: PipelineRow) => parseNumeric(r.avgLead),
} as const;

const PIPELINE_SORT_COLUMNS = Object.keys(PIPELINE_SORT_FIELDS).map((k) => ({ key: k, label: k }));

function PipelineByCategorySection({ rows, subcategoryFilter }: { rows: PipelineRow[]; subcategoryFilter: string }) {
  const isMobile = useIsMobile();
  const preFiltered = useMemo(() => {
    if (subcategoryFilter === 'all') return rows;
    const target = stripIndexPrefix(subcategoryFilter);
    return rows.filter((r) => r.category === target);
  }, [rows, subcategoryFilter]);

  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } =
    useTableSearchSort(preFiltered, {
      searchField: (r) => r.category,
      sortFields: PIPELINE_SORT_FIELDS,
      sortUrlParamPrefix: 'srcPOPipeline',
    });

  const toolbar = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search categories..."
      sortColumns={PIPELINE_SORT_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => { setSortKey(k); setSortDir(d); }}
    />
  );

  if (isMobile) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          PO Pipeline by Category <TableMetricsInfo metrics={PIPELINE_METRIC_KEYS} />
        </h3>
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
                { label: 'Total POs', value: r.totalPOs },
                { label: 'In Production', value: fmtIntOrDashOps(r.inProduction) },
                { label: 'In Transit', value: fmtIntOrDashOps(r.inTransit) },
                { label: 'Delivered', value: fmtIntOrDashOps(r.delivered) },
                { label: 'GRN Done', value: fmtIntOrDashOps(r.grnDone) },
                { label: 'Fill Rate', value: r.fillRate },
                { label: 'Average Lead Time', value: r.avgLead },
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
      <SectionHeader title="PO Pipeline by Category" actions={toolbar} />
      <div className="overflow-x-auto mt-3 -mx-4 px-4">
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {PIPELINE_HEADERS.map((h, i) => (
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
                <td colSpan={PIPELINE_HEADERS.length} className="py-6">
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
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.totalPOs}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.inProduction.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.inTransit.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.delivered.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.grnDone.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.fillRate}</td>
                  <td className="py-2.5 px-3 text-right text-gray-500 tabular-nums whitespace-nowrap">{r.avgLead}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Section 2: Delayed POs ─────────────────────────────────────────────────

const DELAYED_HEADERS: readonly TableHeader[] = [
  { label: 'PO ID', metric: false },
  { label: 'Vendor', metric: false },
  { label: 'Cluster', metric: false },
  { label: 'Category', metric: false },
  { label: 'Days Delayed', metric: true },
  { label: 'Stage Stuck', metric: false, rightAlign: true },
  { label: 'Value', metric: true },
];

const DELAYED_METRIC_KEYS = DELAYED_HEADERS.filter((h) => h.metric).map((h) => h.infoKey ?? h.label);

type DelayedRow = ReturnType<typeof delayedPosToRows>[number];

const DELAYED_SORT_FIELDS = {
  'Days Delayed': (r: DelayedRow) => r.daysDelayed,
  Value: (r: DelayedRow) => parseNumeric(r.value),
} as const;

const DELAYED_SORT_COLUMNS = Object.keys(DELAYED_SORT_FIELDS).map((k) => ({ key: k, label: k }));

function DelayedPOsSection({ rows, subcategoryFilter }: { rows: DelayedRow[]; subcategoryFilter: string }) {
  const isMobile = useIsMobile();
  const preFiltered = useMemo(() => {
    if (subcategoryFilter === 'all') return rows;
    const target = stripIndexPrefix(subcategoryFilter);
    return rows.filter((r) => r.category === target);
  }, [rows, subcategoryFilter]);

  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } =
    useTableSearchSort(preFiltered, {
      searchField: (r) => `${r.poId} ${r.vendor} ${r.cluster} ${r.category} ${r.stageStuck}`,
      sortFields: DELAYED_SORT_FIELDS,
      sortUrlParamPrefix: 'srcDelayedPOs',
    });

  const toolbar = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search POs..."
      sortColumns={DELAYED_SORT_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => { setSortKey(k); setSortDir(d); }}
    />
  );

  if (isMobile) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Delayed POs <TableMetricsInfo metrics={DELAYED_METRIC_KEYS} />
        </h3>
        {toolbar}
        {filteredRows.length === 0 ? (
          <EmptyState
            title="No results"
            description={search ? `No matches for "${search}"` : 'No delayed POs match the current filter.'}
            variant="neutral"
          />
        ) : (
          filteredRows.map((r) => (
            <AOPMobileCard
              key={r.poId}
              title={r.poId}
              metrics={[
                { label: 'Vendor', value: r.vendor },
                { label: 'Cluster', value: r.cluster },
                { label: 'Category', value: stripIndexPrefix(r.category) },
                { label: 'Days Delayed', value: `${r.daysDelayed}` },
                { label: 'Stage Stuck', value: r.stageStuck },
                { label: 'Value', value: r.value },
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
      <SectionHeader title="Delayed POs" actions={toolbar} />
      <div className="overflow-x-auto mt-3 -mx-4 px-4">
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {DELAYED_HEADERS.map((h) => {
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
                <td colSpan={DELAYED_HEADERS.length} className="py-6">
                  <EmptyState
                    title="No results"
                    description={search ? `No matches for "${search}"` : 'No delayed POs match the current filter.'}
                    variant="neutral"
                    className="py-6"
                  />
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr key={r.poId} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="py-2.5 pl-3 pr-3 text-left font-medium text-gray-900">{r.poId}</td>
                  <td className="py-2.5 pl-3 pr-3 text-left text-gray-900">{r.vendor}</td>
                  <td className="py-2.5 pl-3 pr-3 text-left text-gray-600">{r.cluster}</td>
                  <td className="py-2.5 pl-3 pr-3 text-left text-gray-600">{stripIndexPrefix(r.category)}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 justify-end">
                      <span className="text-red-600 font-medium">{r.daysDelayed.toLocaleString('en-IN')}</span>
                      {r.daysDelayed > 90 && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Escalate</Badge>}
                    </span>
                  </td>
                  <td className="py-2.5 pl-3 pr-3 text-left text-gray-600">{r.stageStuck}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.value}</td>
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

const PO_KPI_API_CODES: Record<string, string> = {
  'src-total-pos': 'src-total-pos',
  'src-delayed2': 'src-delayed2',
  'src-po-grn': 'src-po-grn',
  'src-grn-pending': 'src-grn-pending',
};

export function POPipelineTab({ filters }: { filters: SourcingFilters }) {
  const isMobile = useIsMobile();
  const { data, isLoading, isError, refetch } = usePoPipeline(filters);

  const kpiCards = useMemo<SrcHealthKpiWithGap[]>(() => {
    return poKpis.map((mock) => {
      const code = PO_KPI_API_CODES[mock.id];
      const card = code ? kpiByCode(data?.kpi_cards, code) : undefined;
      return apiKpiToSrcHealthKpi(card, mock);
    });
  }, [data?.kpi_cards]);

  const funnelRows = useMemo(() => {
    const base = poFunnelToData(data?.po_funnel_chart);
    return base.map((row, i) => {
      const prev = i > 0 ? base[i - 1] : null;
      const retentionPct = prev && prev.count > 0
        ? Math.round(((row.count - prev.count) / prev.count) * 100)
        : null;
      return { ...row, retentionPct };
    });
  }, [data?.po_funnel_chart]);

  const leadTimeRows = useMemo(() => leadTimeDistributionToChart(data?.lead_time_distribution_chart), [data?.lead_time_distribution_chart]);
  const categoryRows = useMemo(() => poByCategoryToRows(data?.po_pipeline_by_category), [data?.po_pipeline_by_category]);
  const delayedRows = useMemo(() => delayedPosToRows(data?.delayed_pos_table), [data?.delayed_pos_table]);

  if (isError) {
    return (
      <EmptyState
        title="Couldn't load PO Pipeline"
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
          {poKpis.map((kpi) => (
            <Skeleton key={kpi.id} className="h-[88px] w-full" />
          ))}
        </DashboardKpiGrid>
        <Skeleton className="h-[320px] w-full" />
        <Skeleton className="h-[260px] w-full" />
        <Skeleton className="h-[260px] w-full" />
        <Skeleton className="h-[260px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeInUp">
      <KpiGrid kpis={kpiCards} />

      <ChartCard title="PO Volume by Stage" description="Purchase orders at each processing stage — counts are point-in-time snapshots, not a sequential funnel">
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" minWidth={0} height="100%">
            <BarChart
              data={funnelRows}
              layout="vertical"
              margin={{ top: 5, right: isMobile ? 60 : 110, bottom: 5, left: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: CHART_AXIS_TICK }} tickLine={false} axisLine={false} hide={isMobile} />
              <YAxis type="category" dataKey="stage" tick={{ fontSize: isMobile ? 10 : 11, fill: CHART_AXIS_TICK }} tickLine={false} axisLine={false} width={isMobile ? 100 : 120} />
              <Tooltip content={<ChartTooltipContent config={funnelChartConfig} />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={isMobile ? 16 : 22}>
                {funnelRows.map((entry, index) => (
                  <Cell key={entry.stage} fill={CHART_SEQUENTIAL[index % CHART_SEQUENTIAL.length]} />
                ))}
                <LabelList
                  dataKey="count"
                  content={(props) => renderFunnelLabel(props as FunnelLabelProps, funnelRows)}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {leadTimeRows.length > 0 && (
        <ChartCard title="Lead Time Distribution" description="POs grouped by PO→AWB lead time">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" minWidth={0} height="100%">
              <BarChart data={leadTimeRows} margin={{ top: 5, right: 12, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis dataKey="bucket" tick={{ fontSize: isMobile ? 10 : 12, fill: CHART_AXIS_TICK }} tickLine={false} interval={0} />
                <YAxis tick={{ fontSize: 12, fill: CHART_AXIS_TICK }} tickLine={false} axisLine={false} hide={isMobile} />
                <Tooltip content={<ChartTooltipContent config={leadTimeChartConfig} />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={isMobile ? 24 : 36}>
                  {leadTimeRows.map((entry, index) => (
                    <Cell key={entry.bucket} fill={CHART_SEQUENTIAL[index % CHART_SEQUENTIAL.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      <PipelineByCategorySection rows={categoryRows} subcategoryFilter={filters.subcategory} />
      <DelayedPOsSection rows={delayedRows} subcategoryFilter={filters.subcategory} />
    </div>
  );
}
