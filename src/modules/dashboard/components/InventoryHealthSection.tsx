import { useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import {
  EmptyState,
  InfoHeaderIcon,
  MetricCard,
  MetricGrid,
  SectionHeader,
  TableMetricsInfo,
  TableToolbar,
  Badge,
  DrillMenu,
} from "@/components/ui";
import { cn, formatCurrency, formatCompactNumber, classifyRag, ragToTextClass } from "@/lib/utils";
import { getRowDrillTargets, getChartDrillTargets } from "@/lib/routing";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useTableSearchSort } from "@/hooks/useTableSearchSort";
import { useThresholds } from "@/hooks/useThresholds";
import { AOPMobileCard } from "@/modules/aop/components/AOPMobileCard";
import type {
  CommandCenterKeyMetric,
  InventoryHealthResponse,
  InventoryStockDistributionRow,
} from "../api/dashboardApi";

/** Temporarily hidden — product request. Set to `true` to show again. */
const SHOW_STOCK_DISTRIBUTION = false;

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_BADGE_VARIANT: Record<string, "success" | "warning" | "error" | "default"> = {
  on_track: "success",
  warning: "warning",
  critical: "error",
  neutral: "default",
};

const STATUS_LABEL: Record<string, string> = {
  on_track: "On Track",
  warning: "Warning",
  critical: "Critical",
  neutral: "Neutral",
};

import { CHART_SEQUENTIAL, CHART_PRIMARY, CHART_AXIS_LABEL, CHART_BORDER } from "@/data/chartColors";
import { getCurrencySymbol } from '@/lib/utils';
import { stripIndexPrefix } from "@/modules/category-director/lib/apiAdapters";
// Age buckets are ordinal → one-hue indigo ramp (hierarchy), consistent with InventoryLifecycleTab.
const PIE_COLORS = CHART_SEQUENTIAL;
const INR_IN_CRORE = 10_000_000;
const INR_IN_LAKH = 100_000;
const INR_IN_THOUSAND = 1_000;

function asFiniteNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatPct(value: unknown, digits = 1): string {
  const n = asFiniteNumber(value);
  return n == null ? "—" : `${n.toFixed(digits)}%`;
}

function formatCount(value: unknown): string {
  const n = asFiniteNumber(value);
  if (n == null) return "—";
  const rounded = Math.round(n);
  if (Math.abs(rounded) >= 1_000) return formatCompactNumber(rounded);
  return rounded.toLocaleString("en-IN");
}

type InrScale = {
  divisor: number;
  suffix: "Cr" | "L" | "K" | "";
};

function pickInrScale(maxValue: number): InrScale {
  if (maxValue >= INR_IN_CRORE) return { divisor: INR_IN_CRORE, suffix: "Cr" };
  if (maxValue >= INR_IN_LAKH) return { divisor: INR_IN_LAKH, suffix: "L" };
  if (maxValue >= INR_IN_THOUSAND) return { divisor: INR_IN_THOUSAND, suffix: "K" };
  return { divisor: 1, suffix: "" };
}

function formatInrScaled(value: unknown, scale: InrScale): string {
  const n = asFiniteNumber(value);
  if (n == null) return "—";
  if (scale.divisor === 1) return `${getCurrencySymbol()}${Math.round(n).toLocaleString("en-IN")}`;
  const scaled = n / scale.divisor;
  const digits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
  return `${getCurrencySymbol()}${scaled.toFixed(digits)} ${scale.suffix}`;
}

// ---------------------------------------------------------------------------
// Inventory Age Distribution (Pie Chart) — API only
// ---------------------------------------------------------------------------

function AgeDistributionChartApi({
  points,
}: {
  points: InventoryHealthResponse["age_distribution_chart"];
}): React.ReactNode {
  const isMobile = useIsMobile();

  function parseBucketStart(label: string): number {
    if (label.startsWith('>')) return Infinity;
    const m = /(\d+)/.exec(label);
    return m ? parseInt(m[1] ?? "0", 10) : 0;
  }

  const pieData = [...points]
    .sort((a, b) => parseBucketStart(a.label ?? "") - parseBucketStart(b.label ?? ""))
    .map((d, i) => ({
      name: d.label,
      value: d.pct ?? 0,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeEntry = isMobile && activeIndex !== null ? (pieData[activeIndex] ?? null) : null;

  const pieLabel = ({ cx, cy, midAngle, outerRadius, name, value, index }: {
    cx?: number; cy?: number; midAngle?: number; outerRadius?: number;
    name?: string; value?: number; index?: number;
  }) => {
    // On mobile: no outside labels — tapped slice info shown in the donut center only
    if (isMobile) return null;
    const pct = Number(value ?? 0);
    if (!Number.isFinite(pct)) return null;
    const cxN = Number(cx ?? 0);
    const cyN = Number(cy ?? 0);
    const midAngleN = Number(midAngle ?? 0);
    const outerRadiusN = Number(outerRadius ?? 0);
    const indexN = index ?? 0;
    const RAD = Math.PI / 180;
    const isTiny = pct < 3;
    const side = Math.cos(-midAngleN * RAD) >= 0 ? 1 : -1;
    const edgeRadius = outerRadiusN + 2;
    const elbowRadius = outerRadiusN + 14;
    const labelRadius = outerRadiusN + (isTiny ? 30 : 20);
    const edgeX = cxN + edgeRadius * Math.cos(-midAngleN * RAD);
    const edgeY = cyN + edgeRadius * Math.sin(-midAngleN * RAD);
    const elbowX = cxN + elbowRadius * Math.cos(-midAngleN * RAD);
    const elbowY = cyN + elbowRadius * Math.sin(-midAngleN * RAD);
    const baseX = cxN + labelRadius * Math.cos(-midAngleN * RAD);
    const baseY = cyN + labelRadius * Math.sin(-midAngleN * RAD);
    const tinyNudgeY = isTiny ? (indexN % 2 === 0 ? -14 : 14) : 0;
    const tinyNudgeX = isTiny ? side * 10 : 0;
    const x = baseX + tinyNudgeX;
    const y = baseY + tinyNudgeY;
    const anchor = x > cxN ? "start" : "end";
    const sliceColor =
      typeof (pieData[indexN] as { color?: unknown } | undefined)?.color === "string"
        ? (pieData[indexN] as { color: string }).color
        : CHART_AXIS_LABEL;
    return (
      <g>
        <path
          d={`M ${edgeX},${edgeY} L ${elbowX},${elbowY + tinyNudgeY} L ${x},${y}`}
          stroke={sliceColor}
          strokeWidth={1}
          fill="none"
        />
        <text
          x={x}
          y={y}
          fill={sliceColor}
          textAnchor={anchor}
          dominantBaseline="central"
          fontSize={isTiny ? 11 : 12}
        >
          {`${name} ${pct.toFixed(1)}%`}
        </text>
      </g>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Inventory Age Distribution" />
      {/* Donut chart — labels on desktop only; mobile uses tap-to-reveal center label + legend below */}
      <div className="relative mt-3">
        <ResponsiveContainer width="100%" minWidth={0} height={280}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={40}
              dataKey="value"
              label={pieLabel}
              labelLine={false}
              onClick={isMobile ? (_, index) => {
                setActiveIndex(typeof index === "number" ? (index === activeIndex ? null : index) : null);
              } : undefined}
            >
              {pieData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            {!isMobile && (
              <Tooltip
                contentStyle={{ borderRadius: 8, border: `1px solid ${CHART_BORDER}`, fontSize: 12 }}
                formatter={(value) => [`${Number(value ?? 0).toFixed(1)}%`, "Share"]}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
        {/* Center label — shown on mobile when a slice is tapped */}
        {activeEntry && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center leading-tight">
              <div className="text-xs text-gray-500 max-w-[72px] text-center leading-snug">{activeEntry.name}</div>
              {/* eslint-disable-next-line no-restricted-syntax -- dynamic slice color from chart data */}
              <div className="text-base font-bold tabular-nums" style={{ color: activeEntry.color }}>
                {activeEntry.value.toFixed(1)}%
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Legend as structured list — all data visible without interaction */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
        {pieData.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            {/* eslint-disable-next-line no-restricted-syntax -- dynamic chart color */}
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-xs text-gray-600 truncate">{d.name}</span>
            <span className="text-xs font-semibold text-gray-900 ml-auto tabular-nums">{d.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inventory by Category (Horizontal Bar Chart) — API only
// ---------------------------------------------------------------------------

function InventoryCategoryChartApi({ points }: { points: InventoryHealthResponse["category_chart"] }): React.ReactNode {
  const rows = points.map((c) => ({
    category: c.label,
    value: asFiniteNumber(c.value) ?? 0,
    // Single metric across categories → one indigo (colour is semantic only; category is the axis label).
    color: CHART_PRIMARY,
  }));
  const maxValue = rows.reduce((max, row) => Math.max(max, row.value), 0) || 1;
  const scale = pickInrScale(maxValue);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader
        title="Inventory by Category"
        actions={<DrillMenu rowLabel="categories" targets={getChartDrillTargets('category', { from: 'dashboard' })} />}
      />
      {/* Custom bar chart — label above bar, full width, no wasted space */}
      <div className="mt-3 space-y-3">
        {rows.map((row) => {
          const pct = maxValue > 0 ? (row.value / maxValue) * 100 : 0;
          return (
            <div key={row.category}>
              {/* eslint-disable-next-line design-system/prefer-section-header -- bar chart label row */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">{row.category}</span>
                <span className="text-xs font-semibold text-gray-900 tabular-nums">
                  {formatInrScaled(row.value, scale)}
                </span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: row.color }} // eslint-disable-line no-restricted-syntax -- dynamic bar width and color
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Key Metrics — uses shared MetricCard (1-per-row on mobile)
// ---------------------------------------------------------------------------

function KeyMetricsGrid({ metrics }: { metrics: CommandCenterKeyMetric[] }): React.ReactNode {
  return (
    <MetricGrid columns={metrics.length as 2 | 3 | 4 | 5}>
      {metrics.map((m) => (
        <MetricCard
          key={m.label}
          label={m.label}
          infoKey={m.label}
          value={m.value_formatted}
          subtitle={m.target && m.target.trim() !== "—" ? `Target: ${m.target}` : undefined}
          badge={
            <Badge variant={STATUS_BADGE_VARIANT[m.status] ?? "default"} className="text-xs">
              {STATUS_LABEL[m.status] ?? m.status}
            </Badge>
          }
        />
      ))}
    </MetricGrid>
  );
}

// ---------------------------------------------------------------------------
// Stock Distribution — API only
// ---------------------------------------------------------------------------

function isAgedQtyStockRow(
  row: InventoryStockDistributionRow,
): row is Extract<InventoryStockDistributionRow, { aged_qty: number }> {
  return "aged_qty" in row;
}

function StockDistributionApiSection({
  rows,
}: {
  rows: InventoryHealthResponse["stock_distribution"];
}): React.ReactNode {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Stock Distribution" />
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- stock distribution requires 5-column responsive density not covered by shared metric grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-3">
        {rows.map((row) => {
          if (isAgedQtyStockRow(row)) {
            return (
              <div
                key={row.age_bucket}
                className="rounded-lg bg-gray-50 p-4"
              >
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{row.age_bucket}</span>
                <span className="text-xl font-bold text-gray-900 block mt-1">{formatPct(row.aged_qty_pct, 1)}</span>
                <span className="text-xs text-gray-500 mt-0.5 block">
                  Bucket qty {formatCount(row.aged_qty)} · Total stock {formatCount(row.m_total_stk_qty)}
                </span>
              </div>
            );
          }
          return (
            <div
              key={row.age_bucket}
              className="rounded-lg bg-gray-50 p-4"
            >
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{row.age_bucket}</span>
              <span className="text-xl font-bold text-gray-900 block mt-1">{formatCurrency(row.stock_value)}</span>
              <span className="text-xs text-gray-500 mt-0.5 block">
                {formatPct(row.pct_of_total, 1)} · Qty {formatCount(row.stock_qty)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BrokenSetTableApi({ rows }: { rows: InventoryHealthResponse["broken_set_table"] }): React.ReactNode {
  const isMobile = useIsMobile();
  const showValueAtRisk = rows.some((r) => r.value_at_risk_cr != null && Number.isFinite(r.value_at_risk_cr));
  const showAvgMissing = rows.some((r) => r.avg_missing_sizes != null && Number.isFinite(r.avg_missing_sizes));

  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } = useTableSearchSort(rows, {
    searchField: (r) => r.category,
    sortUrlParamPrefix: "invBrokenSet",
    sortFields: {
      "Broken Sets": (r) => r.broken_sets,
      "Total Options": (r) => r.total_options,
      "Broken %": (r) => r.broken_pct,
      "Value At Risk": (r) => Math.abs(r.value_at_risk_cr ?? 0),
      "Avg Missing Sizes": (r) => r.avg_missing_sizes ?? 0,
    },
  });

  const sortColumns = [
    { key: "Total Options", label: "Total Options" },
    { key: "Broken Sets", label: "Broken Sets" },
    { key: "Broken %", label: "Broken %" },
    ...(showValueAtRisk ? [{ key: "Value At Risk", label: "Value At Risk" }] : []),
    ...(showAvgMissing ? [{ key: "Avg Missing Sizes", label: "Avg Missing Sizes" }] : []),
  ];

  const toolbarActions = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search categories..."
      sortColumns={sortColumns}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => {
        setSortKey(k);
        setSortDir(d);
      }}
    />
  );

  if (isMobile) {
    return (
      <div className="space-y-3">
        <SectionHeader
          title={
            <>
              Broken Set Analysis{" "}
              <TableMetricsInfo
                metrics={["Total Options", "Broken Sets", "Broken", "Value At Risk", "Avg Missing Sizes"]}
              />
            </>
          }
          actions={toolbarActions}
        />
        {filteredRows.map((r) => (
          <AOPMobileCard
            key={r.category}
            title={stripIndexPrefix(r.category)}
            metrics={[
              { label: "Total Options", value: formatCount(r.total_options) },
              { label: "Broken Sets", value: formatCount(r.broken_sets) },
              { label: "Broken %", value: `${r.broken_pct.toFixed(1)}%` },
              ...(showValueAtRisk && r.value_at_risk_cr != null
                ? [{ label: "Value at Risk", value: `${r.value_at_risk_cr.toFixed(1)} Cr` }]
                : []),
              ...(showAvgMissing && r.avg_missing_sizes != null
                ? [{ label: "Avg Missing", value: r.avg_missing_sizes.toFixed(1) }]
                : []),
            ]}
            onClick={() => {}}
            className="cursor-default"
            showChevron={false}
          />
        ))}
        {filteredRows.length === 0 && (
          <EmptyState
            title={search ? "No results" : "No broken sets in this period"}
            description={search ? `No categories matching "${search}"` : "When the API returns broken-set rows for the active filter combo, they'll appear here."}
            variant="neutral"
          />
        )}
      </div>
    );
  }

  const headers = [
    "Category",
    "Total Options",
    "Broken Sets",
    "Broken",
    ...(showValueAtRisk ? ["Value At Risk"] : []),
    ...(showAvgMissing ? ["Avg Missing Sizes"] : []),
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Broken Set Analysis" actions={toolbarActions} />
      <div className="overflow-x-auto mt-3 -mx-4 px-4">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {headers.map((h, i) => (
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
              <th className="py-2 px-3"><span className="sr-only">Drill</span></th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={headers.length + 1} className="py-6">
                  <EmptyState
                    title={search ? "No results" : "No broken sets in this period"}
                    description={search ? `No categories matching "${search}"` : "When the API returns broken-set rows for the active filter combo, they'll appear here."}
                    variant="neutral"
                  />
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr key={r.category} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 pl-3 pr-3 text-sm font-medium text-gray-900">{stripIndexPrefix(r.category)}</td>
                  <td className="py-3 px-3 text-sm text-gray-700 text-right tabular-nums whitespace-nowrap">
                    {formatCount(r.total_options)}
                  </td>
                  <td className="py-3 px-3 text-sm text-gray-700 text-right tabular-nums whitespace-nowrap">
                    {formatCount(r.broken_sets)}
                  </td>
                  <td className="py-3 px-3 text-sm text-gray-700 text-right tabular-nums whitespace-nowrap">
                    {r.broken_pct.toFixed(1)}%
                  </td>
                  {showValueAtRisk ? (
                    <td className="py-3 px-3 text-sm text-gray-700 text-right tabular-nums whitespace-nowrap">
                      {r.value_at_risk_cr != null && Number.isFinite(r.value_at_risk_cr)
                        ? `${getCurrencySymbol()}${Math.abs(r.value_at_risk_cr).toFixed(1)} Cr`
                        : "—"}
                    </td>
                  ) : null}
                  {showAvgMissing ? (
                    <td className="py-3 px-3 text-sm text-gray-700 text-right tabular-nums whitespace-nowrap">
                      {r.avg_missing_sizes != null && Number.isFinite(r.avg_missing_sizes)
                        ? r.avg_missing_sizes.toFixed(1)
                        : "—"}
                    </td>
                  ) : null}
                  <td className="py-3 px-3 text-right">
                    <DrillMenu rowLabel={stripIndexPrefix(r.category)} targets={getRowDrillTargets({ category: r.category, from: 'dashboard' })} />
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


function CategoryHealthTableApi({ rows }: { rows: InventoryHealthResponse["category_health_table"] }): React.ReactNode {
  const isMobile = useIsMobile();
  const thresholds = useThresholds();
  const showDoi = rows.some((r) => r.doi_days != null && Number.isFinite(r.doi_days));
  const showTurnover = rows.some((r) => r.turnover != null && Number.isFinite(r.turnover));

  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } = useTableSearchSort(rows, {
    searchField: (r) => r.category,
    sortUrlParamPrefix: "invCatHealth",
    sortFields: {
      "Stock Value": (r) => r.stock_value,
      "Aged Inv": (r) => r.aged_pct,
      Fresh: (r) => r.fresh_pct,
      "Days On Hand": (r) => r.doi_days ?? 0,
      Turnover: (r) => r.turnover ?? 0,
    },
  });

  const sortColumns = [
    { key: "Stock Value", label: "Stock Value" },
    { key: "Aged Inv", label: "Aged Inv" },
    { key: "Fresh", label: "Fresh" },
    ...(showDoi ? [{ key: "Days On Hand", label: "Days On Hand" }] : []),
    ...(showTurnover ? [{ key: "Turnover", label: "Turnover" }] : []),
  ];

  const toolbarActions = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search categories..."
      sortColumns={sortColumns}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => {
        setSortKey(k);
        setSortDir(d);
      }}
    />
  );

  if (isMobile) {
    return (
      <div className="space-y-3">
        <SectionHeader
          title={
            <>
              Category-wise Inventory Health{" "}
              <TableMetricsInfo metrics={["Stock Value", "Aged Inv", "Fresh", "Days On Hand", "Turnover"]} />
            </>
          }
          actions={toolbarActions}
        />
        {filteredRows.map((r) => (
          <AOPMobileCard
            key={r.category}
            title={stripIndexPrefix(r.category)}
            metrics={[
              { label: "Stock Value", value: formatCurrency(r.stock_value) },
              { label: "Aged Inv", value: `${r.aged_pct}%` },
              { label: "Fresh", value: `${r.fresh_pct}%` },
              ...(showDoi && r.doi_days != null && Number.isFinite(r.doi_days)
                ? [{ label: "Days On Hand", value: `${Math.round(r.doi_days).toLocaleString("en-IN")} days` }]
                : []),
              ...(showTurnover && r.turnover != null && Number.isFinite(r.turnover)
                ? [{ label: "Turnover", value: r.turnover.toFixed(1) }]
                : []),
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

  const headers = [
    "Category",
    "Stock Value",
    "Aged Inv",
    "Fresh",
    ...(showDoi ? ["Days On Hand"] : []),
    ...(showTurnover ? ["Turnover"] : []),
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Category-wise Inventory Health" actions={toolbarActions} />
      <div className="overflow-x-auto mt-3 -mx-4 px-4">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {headers.map((h, i) => (
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
              <th className="py-2 px-3"><span className="sr-only">Drill</span></th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 && search ? (
              <tr>
                <td colSpan={headers.length + 1} className="py-6">
                  <EmptyState title="No results" description={`No categories matching "${search}"`} variant="neutral" />
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr key={r.category} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 pl-3 pr-3 font-medium text-gray-900">{stripIndexPrefix(r.category)}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">
                    {formatCurrency(r.stock_value)}
                  </td>
                  <td className={cn("py-2.5 px-3 text-right tabular-nums whitespace-nowrap", ragToTextClass(classifyRag(r.aged_pct, thresholds.get("agedInventory") ?? null)))}>
                    {r.aged_pct}%
                  </td>
                  <td className={cn("py-2.5 px-3 text-right tabular-nums whitespace-nowrap", ragToTextClass(classifyRag(r.fresh_pct, thresholds.get("freshPercent") ?? null)))}>
                    {r.fresh_pct}%
                  </td>
                  {showDoi ? (
                    <td className={cn("py-2.5 px-3 text-right tabular-nums whitespace-nowrap", ragToTextClass(classifyRag(r.doi_days ?? NaN, thresholds.get("inventoryDays") ?? null)))}>
                      {r.doi_days != null && Number.isFinite(r.doi_days)
                        ? `${Math.round(r.doi_days).toLocaleString("en-IN")} days`
                        : "—"}
                    </td>
                  ) : null}
                  {showTurnover ? (
                    <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">
                      {r.turnover != null && Number.isFinite(r.turnover) ? r.turnover.toFixed(1) : "—"}
                    </td>
                  ) : null}
                  <td className="py-2.5 px-3 text-right">
                    <DrillMenu rowLabel={stripIndexPrefix(r.category)} targets={getRowDrillTargets({ category: r.category, from: 'dashboard' })} />
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

// ---------------------------------------------------------------------------
// Composed Inventory Health Section
// ---------------------------------------------------------------------------

interface InventoryHealthSectionProps {
  data?: InventoryHealthResponse | null;
  /** When true, skip rendering the KeyMetricsGrid (metrics are shown in the main KPI section). */
  hideKeyMetrics?: boolean;
}

export function InventoryHealthSection({ data, hideKeyMetrics }: InventoryHealthSectionProps): React.ReactNode {
  if (data) {
    const hasAny =
      (data.age_distribution_chart?.length ?? 0) +
      (data.category_chart?.length ?? 0) +
      (data.key_metrics?.length ?? 0) +
      (SHOW_STOCK_DISTRIBUTION ? (data.stock_distribution?.length ?? 0) : 0) +
      (data.broken_set_table?.length ?? 0) +
      (data.category_health_table?.length ?? 0);
    if (hasAny === 0) {
      return (
        <EmptyState
          title="No inventory detail"
          description="No chart or table data was returned for this period."
          variant="neutral"
        />
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.age_distribution_chart?.length ? (
            <AgeDistributionChartApi points={data.age_distribution_chart} />
          ) : null}
          {data.category_chart?.length ? <InventoryCategoryChartApi points={data.category_chart} /> : null}
        </div>
        {!hideKeyMetrics && data.key_metrics?.length ? <KeyMetricsGrid metrics={data.key_metrics} /> : null}
        {SHOW_STOCK_DISTRIBUTION && data.stock_distribution?.length ? (
          <StockDistributionApiSection rows={data.stock_distribution} />
        ) : null}
        {data.category_health_table?.length ? <CategoryHealthTableApi rows={data.category_health_table} /> : null}
        {/* Always render Broken Set Analysis — the component handles empty state internally so the
            section never silently disappears when the API returns zero rows for this filter combo. */}
        <BrokenSetTableApi rows={data.broken_set_table ?? []} />
      </div>
    );
  }

  return (
    <EmptyState
      title="No inventory data"
      description="Connect the Inventory Health API to view charts and tables."
      variant="neutral"
    />
  );
}
