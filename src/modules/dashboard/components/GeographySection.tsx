import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  EmptyState,
  InfoHeaderIcon,
  SectionHeader,
  TableMetricsInfo,
  TableToolbar,
  DrillMenu,
} from "@/components/ui";
import { useTableSearchSort } from "@/hooks/useTableSearchSort";
import { cn, formatCurrency, formatCompactNumber } from "@/lib/utils";
import { getRegionDrillTargets, getChartDrillTargets } from "@/lib/routing";
import { StandardDataTable } from "./StandardDataTable";
import { computeFirstColWidth } from "../utils/standardTable";
import { HEADER_TO_KPI } from "../utils/columnKpiMap";
import type { GeographyResponse } from "../api/dashboardApi";
import type { SimpleTableConfig } from "../types/businessPulseUi";

/** Temporarily hidden — product request. Set to `true` to show again. */
const SHOW_REVENUE_BY_REGION_CHART = false;

import { CHART_CATEGORICAL, CHART_SEQUENTIAL, CHART_GRID, CHART_BORDER } from "@/data/chartColors";
import { getCurrencySymbol } from '@/lib/utils';
const REGION_COLORS = CHART_CATEGORICAL;
const INR_IN_CRORE = 10_000_000;
const INR_IN_LAKH = 100_000;
const INR_IN_THOUSAND = 1_000;

// ---------------------------------------------------------------------------
// Nullable API numbers (geography command-center tables)
// ---------------------------------------------------------------------------

function fmtLocaleInt(value: unknown): string {
  if (value == null || value === "") return "\u2014";
  const n = Number(value);
  if (!Number.isFinite(n)) return "\u2014";
  if (Math.abs(n) >= 1_000) return formatCompactNumber(n);
  return n.toLocaleString("en-IN");
}

function fmtLocaleRevPerStore(value: unknown): string {
  if (value == null || value === "") return "\u2014";
  const n = Number(value);
  if (!Number.isFinite(n)) return "\u2014";
  if (Math.abs(n) >= 1_000) return `${getCurrencySymbol()}${formatCompactNumber(n)}`;
  return `${getCurrencySymbol()}${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function fmtFixed2(value: unknown): string {
  if (value == null || value === "") return "\u2014";
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : "\u2014";
}

function fmtCurrencyOrDash(value: unknown): string {
  if (value == null || value === "") return "\u2014";
  const n = Number(value);
  return Number.isFinite(n) ? formatCurrency(n) : "\u2014";
}

/** Prefer `avg_gross_margin_pct`; then `avg_gm_pct`; legacy `avg_gmrof`. Values are percentage points. */
function fmtGmPctOrGmrof(r: {
  avg_gross_margin_pct?: number | null;
  avg_gm_pct?: number | null;
  avg_gmrof?: number | null;
}): string {
  const v = r.avg_gross_margin_pct ?? r.avg_gm_pct ?? r.avg_gmrof;
  return fmtPctCell(v);
}

function fmtPctCell(value: unknown): string {
  if (value == null || value === "") return "\u2014";
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toFixed(1)}%` : "\u2014";
}

type InrScale = {
  divisor: number;
  suffix: "Cr" | "L" | "K" | "";
};

function pickInrScale(maxValue: number): InrScale {
  if (maxValue >= INR_IN_CRORE) return { divisor: INR_IN_CRORE, suffix: "Cr" };
  if (maxValue >= INR_IN_LAKH) return { divisor: INR_IN_LAKH, suffix: "L" };
  if (maxValue >= INR_IN_THOUSAND)
    return { divisor: INR_IN_THOUSAND, suffix: "K" };
  return { divisor: 1, suffix: "" };
}

function fmtInrScaled(value: unknown, scale: InrScale): string {
  if (value == null || value === "") return "\u2014";
  const n = Number(value);
  if (!Number.isFinite(n)) return "\u2014";
  if (scale.divisor === 1)
    return `\u20B9${Math.round(n).toLocaleString("en-IN")}`;
  const scaled = n / scale.divisor;
  const digits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
  return `\u20B9${scaled.toFixed(digits)} ${scale.suffix}`;
}

// ---------------------------------------------------------------------------
// Revenue by Region (Horizontal Bar)
// ---------------------------------------------------------------------------

// (mock chart removed -- API only)

// ---------------------------------------------------------------------------
// Store Mix by City Tier (Pie)
// ---------------------------------------------------------------------------

// (mock chart removed -- API only)

// ---------------------------------------------------------------------------
// Charts -- API (command-center geography)
// ---------------------------------------------------------------------------

function RevenueByRegionChartApi({
  points,
}: {
  points: GeographyResponse["region_chart"];
}): React.ReactNode {
  const rows = points.map((p, i) => ({
    region: p.label,
    value: p.value,
    color: REGION_COLORS[i % REGION_COLORS.length],
  }));
  const maxValue = rows.reduce(
    (max, row) => Math.max(max, Number(row.value) || 0),
    0,
  );
  const axisScale = pickInrScale(maxValue);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader
        title="Revenue by Region"
        actions={<DrillMenu rowLabel="regions" targets={getChartDrillTargets('region', { from: 'dashboard' })} />}
      />
      <div className="mt-3">
        <ResponsiveContainer width="100%" minWidth={0} height={260}>
          <BarChart data={rows} layout="vertical" barCategoryGap="20%">
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke={CHART_GRID}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => fmtInrScaled(value, axisScale)}
            />
            <YAxis
              type="category"
              dataKey="region"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: `1px solid ${CHART_BORDER}`,
                fontSize: 12,
              }}
              formatter={(value) => [fmtInrScaled(value, axisScale), "Net Revenue"]}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {rows.map((entry) => (
                <Cell key={entry.region} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StoreMixPieChartApi({
  points,
}: {
  points: GeographyResponse["city_tier_chart"];
}): React.ReactNode {
  // City tiers are ordinal → one-hue indigo ramp (hierarchy), consistent with age buckets.
  const chart = points.map((p, i) => ({
    name: p.label,
    value: p.value,
    color: CHART_SEQUENTIAL[i % CHART_SEQUENTIAL.length],
  }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Store Mix by City Tier" />
      {/* Donut -- no external labels, legend below */}
      <div className="mt-3">
        <ResponsiveContainer width="100%" minWidth={0} height={200}>
          <PieChart>
            <Pie
              data={chart}
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={40}
              dataKey="value"
              label={false}
              labelLine={false}
              strokeWidth={2}
              stroke="#fff"
            >
              {chart.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: `1px solid ${CHART_BORDER}`,
                fontSize: 12,
              }}
              formatter={(value) => [
                Number(value ?? 0).toLocaleString("en-IN"),
                "Stores",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Legend with values */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
        {chart.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              // eslint-disable-next-line no-restricted-syntax -- legend swatch uses dynamic color from chart data
              style={{ backgroundColor: d.color }}
            />
            <span className="text-xs text-gray-600 truncate">{d.name}</span>
            <span className="text-xs font-semibold text-gray-900 ml-auto tabular-nums">
              {Number(d.value).toLocaleString("en-IN")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// GeographyKeyMetricsApi removed -- product request (key metrics now suppressed)

function ZoneTableApi({
  rows,
  firstColWidthPx,
}: {
  rows: GeographyResponse["zone_table"];
  firstColWidthPx?: number;
}): React.ReactNode {
  const config: SimpleTableConfig = {
    title: "Zone-wise Performance",
    headers: [
      "Zone",
      "Net Revenue",
      "Stores",
      "Rev/Store",
      "Avg SPSF",
      "Gross Margin",
      "Sell Through",
      "Aged Inv",
    ],
    rows: rows.map((r) => [
      r.zone ?? r.ZONE ?? r.zone_desc ?? r.ZONE_DESC ?? "\u2014",
      fmtCurrencyOrDash(r.total_revenue),
      fmtLocaleInt(r.store_count),
      fmtLocaleRevPerStore(r.rev_per_store),
      fmtFixed2(r.avg_spsf),
      fmtGmPctOrGmrof(r),
      fmtPctCell(r.avg_sell_through_pct),
      fmtPctCell(r.aged_pct),
    ]),
  };

  return (
    <StandardDataTable
      config={config}
      searchable
      searchPlaceholder="Search zones..."
      sortUrlParamPrefix="geoZone"
      defaultSortKey="Net Revenue"
      enableColumnManagement
      firstColWidthPx={firstColWidthPx}
      columnKpiCodes={config.headers.slice(1).map((h) => HEADER_TO_KPI[h] ?? null)}
    />
  );
}

function TopStatesTableApi({
  rows,
  firstColWidthPx,
}: {
  rows: GeographyResponse["top_states_table"];
  firstColWidthPx?: number;
}): React.ReactNode {
  const config: SimpleTableConfig = {
    title: "Top States",
    headers: [
      "State",
      "Net Revenue",
      "Stores",
      "Rev/Store",
      "Avg SPSF",
      "Gross Margin",
      "Sell Through",
      "Aged Inv",
    ],
    rows: rows.map((r) => [
      r.state ?? r.STATE ?? r.STATENAME ?? r.STATE_NAME ?? "\u2014",
      fmtCurrencyOrDash(r.total_revenue),
      fmtLocaleInt(r.store_count),
      fmtLocaleRevPerStore(r.rev_per_store),
      fmtFixed2(r.avg_spsf),
      fmtGmPctOrGmrof(r),
      fmtPctCell(r.avg_sell_through_pct),
      fmtPctCell(r.aged_pct),
    ]),
  };

  return (
    <StandardDataTable
      config={config}
      searchable
      searchPlaceholder="Search states..."
      sortUrlParamPrefix="geoStates"
      defaultSortKey="Net Revenue"
      enableColumnManagement
      firstColWidthPx={firstColWidthPx}
      rowActions={(row) => (row[0] ? <DrillMenu rowLabel={row[0]} targets={getRegionDrillTargets(row[0], 'dashboard')} /> : null)}
      columnKpiCodes={config.headers.slice(1).map((h) => HEADER_TO_KPI[h] ?? null)}
    />
  );
}

function CityTierTableApi({
  rows,
}: {
  rows: GeographyResponse["city_tier_table"];
}): React.ReactNode {
  const TIER_SORT_COLUMNS = [
    { key: "Stores", label: "Stores" },
    { key: "Net Revenue", label: "Net Revenue" },
    { key: "Rev/Store", label: "Rev/Store" },
    { key: "Avg SPSF", label: "Avg SPSF (₹/sqft)" },
    { key: "Avg GMROF", label: "Avg GMROF" },
  ];

  const {
    search,
    setSearch,
    sortKey,
    sortDir,
    setSortKey,
    setSortDir,
    filteredRows,
  } = useTableSearchSort(rows, {
    searchField: (r) => r.tier ?? "",
    sortUrlParamPrefix: "geoTier",
    sortFields: {
      Stores: (r) => Number(r.store_count ?? 0),
      "Net Revenue": (r) => Number(r.total_revenue ?? 0),
      "Rev/Store": (r) => Number(r.rev_per_store ?? 0),
      "Avg SPSF": (r) => Number(r.avg_spsf ?? 0),
      "Avg GMROF": (r) => Number(r.avg_gmrof ?? 0),
    },
  });

  const toolbar = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search tiers..."
      sortColumns={TIER_SORT_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => {
        setSortKey(k);
        setSortDir(d);
      }}
    />
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader
        title={
          <>
            City Tier Performance{" "}
            <TableMetricsInfo
              metrics={[
                "Stores",
                "Net Revenue",
                "Rev/Store",
                "Avg SPSF",
                "Avg GMROF",
              ]}
            />
          </>
        }
        actions={toolbar}
      />
      <div className="overflow-x-auto mt-3 -mx-4 px-4">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {[
                "Tier",
                "Stores",
                "Net Revenue",
                "Rev/Store",
                "Avg SPSF",
                "Avg GMROF",
              ].map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    "py-2 font-medium text-gray-500 text-xs whitespace-nowrap",
                    i === 0 ? "text-left pl-3 pr-3" : "text-right px-3",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center gap-1",
                      i > 0 && "w-full justify-end",
                    )}
                  >
                    {h}
                    {i > 0 && <InfoHeaderIcon metricKey={h} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r, i) => (
              <tr
                key={r.tier ?? `tier-${i}`}
                className="border-b border-gray-50 last:border-0"
              >
                <td className="py-2.5 pl-3 pr-3 font-medium text-gray-900">
                  {r.tier ?? "\u2014"}
                </td>
                <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">
                  {fmtLocaleInt(r.store_count)}
                </td>
                <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">
                  {fmtCurrencyOrDash(r.total_revenue)}
                </td>
                <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">
                  {fmtLocaleRevPerStore(r.rev_per_store)}
                </td>
                <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">
                  {fmtFixed2(r.avg_spsf)}
                </td>
                <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">
                  {fmtFixed2(r.avg_gmrof)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PodTableApi({
  rows,
}: {
  rows: GeographyResponse["pod_table"];
}): React.ReactNode {
  const POD_SORT_COLUMNS = [
    { key: "Stores", label: "Stores" },
    { key: "Net Revenue", label: "Net Revenue" },
    { key: "Rev/Store", label: "Rev/Store" },
    { key: "Avg SPSF", label: "Avg SPSF (₹/sqft)" },
    { key: "Avg GMROF", label: "Avg GMROF" },
  ];

  const {
    search,
    setSearch,
    sortKey,
    sortDir,
    setSortKey,
    setSortDir,
    filteredRows,
  } = useTableSearchSort(rows, {
    searchField: (r) => r.POD_NAME ?? "",
    sortUrlParamPrefix: "geoPod",
    sortFields: {
      Stores: (r) => Number(r.store_count ?? 0),
      "Net Revenue": (r) => Number(r.total_revenue ?? 0),
      "Rev/Store": (r) => Number(r.rev_per_store ?? 0),
      "Avg SPSF": (r) => Number(r.avg_spsf ?? 0),
      "Avg GMROF": (r) => Number(r.avg_gmrof ?? 0),
    },
  });

  const toolbar = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search PODs..."
      sortColumns={POD_SORT_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => {
        setSortKey(k);
        setSortDir(d);
      }}
    />
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader
        title={
          <>
            Operations PODs{" "}
            <TableMetricsInfo
              metrics={[
                "Stores",
                "Net Revenue",
                "Rev/Store",
                "Avg SPSF",
                "Avg GMROF",
              ]}
            />
          </>
        }
        actions={toolbar}
      />
      <div className="overflow-x-auto mt-3 -mx-4 px-4">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {[
                "POD",
                "States",
                "Stores",
                "Net Revenue",
                "Rev/Store",
                "Avg SPSF",
                "Avg GMROF",
              ].map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    "py-2 font-medium text-gray-500 text-xs whitespace-nowrap",
                    i <= 1 ? "text-left pl-3 pr-3" : "text-right px-3",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center gap-1",
                      i > 1 && "w-full justify-end",
                    )}
                  >
                    {h}
                    {i > 1 && <InfoHeaderIcon metricKey={h} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r, i) => (
              <tr
                key={r.POD_NAME ?? `pod-${i}`}
                className="border-b border-gray-50 last:border-0"
              >
                <td className="py-2.5 pl-3 pr-3 font-medium text-gray-900 whitespace-nowrap">
                  {r.POD_NAME ?? "\u2014"}
                </td>
                <td
                  className="py-2.5 px-3 text-sm text-gray-600 whitespace-nowrap max-w-[200px] truncate"
                  title={r.states ?? undefined}
                >
                  {r.states ?? "\u2014"}
                </td>
                <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">
                  {fmtLocaleInt(r.store_count)}
                </td>
                <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">
                  {fmtCurrencyOrDash(r.total_revenue)}
                </td>
                <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">
                  {fmtLocaleRevPerStore(r.rev_per_store)}
                </td>
                <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">
                  {fmtFixed2(r.avg_spsf)}
                </td>
                <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">
                  {fmtFixed2(r.avg_gmrof)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composed Geography Section
// ---------------------------------------------------------------------------

export function GeographySection({
  data,
}: {
  data?: GeographyResponse | null;
}): React.ReactNode {
  if (data) {
    const hasRegionChart =
      SHOW_REVENUE_BY_REGION_CHART && (data.region_chart?.length ?? 0) > 0;
    const hasCityTierChart = (data.city_tier_chart?.length ?? 0) > 0;
    const hasBothCharts = hasRegionChart && hasCityTierChart;
    const hasAny =
      (SHOW_REVENUE_BY_REGION_CHART ? (data.region_chart?.length ?? 0) : 0) +
      (data.city_tier_chart?.length ?? 0) +
      (data.zone_table?.length ?? 0) +
      (data.top_states_table?.length ?? 0) +
      (data.city_tier_table?.length ?? 0) +
      (data.pod_table?.length ?? 0);
    if (hasAny === 0) {
      return (
        <EmptyState
          title="No geography detail"
          description="No chart or table data was returned for this period."
          variant="neutral"
        />
      );
    }

    // Shared frozen first-column width so Zone-wise and Top States stay optically
    // aligned even though zone names are short and state names are long.
    const geoTableFirstColWidth = computeFirstColWidth([
      "Zone",
      "State",
      ...(data.zone_table ?? []).map(
        (r) => r.zone ?? r.ZONE ?? r.zone_desc ?? r.ZONE_DESC ?? "",
      ),
      ...(data.top_states_table ?? []).map(
        (r) => r.state ?? r.STATE ?? r.STATENAME ?? r.STATE_NAME ?? "",
      ),
    ]);

    return (
      <div className="space-y-4">
        <div
          className={cn(
            "grid gap-4",
            hasBothCharts ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1",
          )}
        >
          {hasRegionChart ? (
            <RevenueByRegionChartApi points={data.region_chart} />
          ) : null}
          {hasCityTierChart ? (
            <StoreMixPieChartApi points={data.city_tier_chart} />
          ) : null}
        </div>
        {/* Geography key metrics removed -- product request */}
        {data.zone_table?.length ? (
          <ZoneTableApi
            rows={data.zone_table}
            firstColWidthPx={geoTableFirstColWidth}
          />
        ) : null}
        {data.top_states_table?.length ? (
          <TopStatesTableApi
            rows={data.top_states_table}
            firstColWidthPx={geoTableFirstColWidth}
          />
        ) : null}
        {data.city_tier_table?.length ? (
          <CityTierTableApi rows={data.city_tier_table} />
        ) : null}
        {data.pod_table?.length ? <PodTableApi rows={data.pod_table} /> : null}
      </div>
    );
  }

  return (
    <EmptyState
      title="No geography data"
      description="Connect the Geography API to view charts and tables."
      variant="neutral"
    />
  );
}
