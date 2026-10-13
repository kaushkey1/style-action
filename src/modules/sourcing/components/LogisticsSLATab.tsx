import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import { AlertCircle, RefreshCw } from 'lucide-react';
import {
  SectionHeader, InfoHeaderIcon, ChartTooltipContent, ChartLegendContent,
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
import { useLogisticsSla } from '../api/sourcingDirectorHooks';
import { logisticsKpis } from '../data/mockSourcingData';
import { parseNumeric } from '../lib/tableFormat';
import { MetricCardWithGap } from './MetricCardWithGap';
import {
  apiKpiToSrcHealthKpi,
  deliveryPartnerToRows,
  deliverySlaTrendToChart,
  kpiByCode,
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

const slaChartConfig = {
  sla: { label: 'SLA %', color: CHART_PRIMARY },
  target: { label: 'Target', color: CHART_BASELINE },
};

// ── Section 1: Delivery Partner Scorecard ──────────────────────────────────

interface TableHeader {
  label: string;
  metric: boolean;
  infoKey?: string;
}

const ALL_PARTNER_HEADERS: readonly TableHeader[] = [
  { label: 'Partner', metric: false },
  { label: 'Shipments', metric: true },
  { label: 'On-Time', metric: true },
  { label: 'SLA Met', metric: true, infoKey: 'SLA Met' },
  { label: 'Average Days', metric: true, infoKey: 'Avg Days' },
  { label: 'Failed Pickups', metric: true },
  { label: 'Exceptions', metric: true },
];

type PartnerRow = ReturnType<typeof deliveryPartnerToRows>[number];

const PARTNER_SORT_FIELDS = {
  Shipments: (r: PartnerRow) => parseNumeric(r.shipments),
  'On-Time': (r: PartnerRow) => parseNumeric(r.onTime),
  'SLA Met': (r: PartnerRow) => parseNumeric(r.slaMet),
  'Average Days': (r: PartnerRow) => parseNumeric(r.avgDays),
  'Failed Pickups': (r: PartnerRow) => r.failedPickups,
  Exceptions: (r: PartnerRow) => r.exceptions,
} as const;

const PARTNER_SORT_COLUMNS = Object.keys(PARTNER_SORT_FIELDS).map((k) => ({ key: k, label: k }));

function DeliveryPartnerSection({ rows }: { rows: PartnerRow[] }) {
  const isMobile = useIsMobile();
  const hasOnTimeData = rows.some((r) => r.onTime !== '—');
  const PARTNER_HEADERS = useMemo(
    () => hasOnTimeData ? ALL_PARTNER_HEADERS : ALL_PARTNER_HEADERS.filter((h) => h.label !== 'On-Time'),
    [hasOnTimeData],
  );
  const PARTNER_METRIC_KEYS = PARTNER_HEADERS.filter((h) => h.metric).map((h) => h.infoKey ?? h.label);
  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } =
    useTableSearchSort(rows, {
      searchField: (r) => r.partner,
      sortFields: PARTNER_SORT_FIELDS,
      sortUrlParamPrefix: 'srcDeliveryPartner',
    });

  const toolbar = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search partners..."
      sortColumns={PARTNER_SORT_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => { setSortKey(k); setSortDir(d); }}
    />
  );

  if (isMobile) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Delivery Partner Scorecard <TableMetricsInfo metrics={PARTNER_METRIC_KEYS} />
        </h3>
        {toolbar}
        {filteredRows.length === 0 ? (
          <EmptyState title="No results" description={search ? `No matches for "${search}"` : 'No partners available.'} variant="neutral" />
        ) : (
          filteredRows.map((r) => (
            <AOPMobileCard
              key={r.partner}
              title={r.partner}
              metrics={[
                { label: 'Shipments', value: r.shipments },
                ...(hasOnTimeData ? [{ label: 'On-Time', value: r.onTime }] : []),
                { label: 'SLA Met', value: r.slaMet },
                { label: 'Average Days', value: r.avgDays },
                { label: 'Failed Pickups', value: r.failedPickups.toLocaleString('en-IN') },
                { label: 'Exceptions', value: r.exceptions.toLocaleString('en-IN') },
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
      <SectionHeader title="Delivery Partner Scorecard" actions={toolbar} />
      <div className="overflow-x-auto mt-3 -mx-4 px-4">
        <table className="w-full text-sm min-w-[820px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {PARTNER_HEADERS.map((h, i) => (
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
                <td colSpan={PARTNER_HEADERS.length} className="py-6">
                  <EmptyState title="No results" description={search ? `No matches for "${search}"` : 'No partners available.'} variant="neutral" className="py-6" />
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr key={r.partner} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="py-2.5 pl-3 pr-3 text-left font-medium text-gray-900">{r.partner}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.shipments}</td>
                  {hasOnTimeData && <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.onTime}</td>}
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.slaMet}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.avgDays}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.failedPickups.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">{r.exceptions.toLocaleString('en-IN')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Section 2: Shipment Exceptions (data gap — empty state) ────────────────

function ShipmentExceptionsSection({ gapReason }: { gapReason: string | null }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Shipment Exceptions" />
      <EmptyState
        title="Shipment Exceptions"
        description={gapReason ?? 'Shipment exception data is being integrated.'}
        variant="neutral"
        className="py-8"
      />
    </div>
  );
}

// ── Tab assembly ────────────────────────────────────────────────────────────

const LOG_KPI_API_CODES: Record<string, string> = {
  'src-dc-dwell': 'src-dc-dwell',
  'src-delivery-sla': 'src-delivery-sla',
  'src-ship-exc': 'src-ship-exc',
  'src-intransit': 'src-intransit',
};

export function LogisticsSLATab({ filters }: { filters: SourcingFilters }) {
  const isMobile = useIsMobile();
  const { data, isLoading, isError, refetch } = useLogisticsSla(filters);

  const kpiCards = useMemo<SrcHealthKpiWithGap[]>(() => {
    return logisticsKpis.map((mock) => {
      const code = LOG_KPI_API_CODES[mock.id];
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

  const trendRows = useMemo(() => deliverySlaTrendToChart(data?.delivery_sla_trend_chart), [data?.delivery_sla_trend_chart]);
  const partnerRows = useMemo(() => deliveryPartnerToRows(data?.delivery_partner_scorecard), [data?.delivery_partner_scorecard]);

  if (isError) {
    return (
      <EmptyState
        title="Couldn't load Logistics & SLA"
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
          {logisticsKpis.map((kpi) => (
            <Skeleton key={kpi.id} className="h-[88px] w-full" />
          ))}
        </DashboardKpiGrid>
        <Skeleton className="h-[260px] w-full" />
        <Skeleton className="h-[260px] w-full" />
        <Skeleton className="h-[180px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeInUp">
      <KpiGrid kpis={visibleKpiCards} />

      <ChartCard title="Delivery SLA Trend" description="Monthly SLA % vs 95% target">
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" minWidth={0} height="100%">
            <LineChart data={trendRows} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
              <XAxis dataKey="month" tick={{ fontSize: isMobile ? 10 : 12, fill: CHART_AXIS_TICK }} tickLine={false} interval="preserveStartEnd" />
              <YAxis domain={[80, 100]} tick={{ fontSize: 12, fill: CHART_AXIS_TICK }} tickLine={false} axisLine={false} hide={isMobile} />
              <Tooltip content={<ChartTooltipContent config={slaChartConfig} valueFormatter={(v) => `${v}%`} />} />
              <Legend content={<ChartLegendContent config={slaChartConfig} />} />
              <ReferenceLine y={95} stroke={CHART_BASELINE} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="sla" stroke={CHART_PRIMARY} strokeWidth={2} dot={{ r: 3, fill: CHART_PRIMARY }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="target" stroke={CHART_BASELINE} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <DeliveryPartnerSection rows={partnerRows} />
      <ShipmentExceptionsSection gapReason={data?.shipment_exceptions_data_gap_reason ?? null} />
    </div>
  );
}
