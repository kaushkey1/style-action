import { Target } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from "recharts";
import { Badge, EmptyState, SectionHeader } from "@/components/ui";
import { cn, formatCurrency } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { CHART_DIVERGING, CHART_GRID, CHART_BORDER } from "@/data/chartColors";
import type { CommandCenterKeyMetric, FinancialResponse } from "../api/dashboardApi";

/** Temporarily hidden — product request. Set to `true` to show again. */
const SHOW_FINANCIAL_KEY_METRICS = false;

// ---------------------------------------------------------------------------
// Icons + status helpers
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

// ---------------------------------------------------------------------------
// Margin Flow — API (absolute ₹)
// ---------------------------------------------------------------------------

function MarginFlowChartApi({ points }: { points: FinancialResponse["margin_flow_chart"] }): React.ReactNode {
  const isMobile = useIsMobile();
  const chartData = points.map((p) => ({
    name: p.label,
    value: p.value,
  }));

  // Mobile: horizontal bar list — no diagonal text, all data visible
  if (isMobile) {
    const maxAbs = Math.max(1, ...chartData.map(d => Math.abs(d.value)));

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Margin Flow" />
        <div className="mt-3 space-y-3">
          {chartData.map((d) => {
            const isPositive = d.value >= 0;
            const pct = (Math.abs(d.value) / maxAbs) * 100;
            return (
              <div key={d.name}>
                {/* eslint-disable-next-line design-system/prefer-section-header -- margin flow bar label row */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-700">{d.name}</span>
                  <span className={cn("text-xs font-semibold tabular-nums", isPositive ? "text-green-700" : "text-orange-500")}>
                    {formatCurrency(d.value, { compact: true })}
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", isPositive ? "bg-indigo-500" : "bg-orange-400")}
                    style={{ width: `${Math.max(pct, 2)}%` }} // eslint-disable-line no-restricted-syntax -- dynamic bar width
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop: vertical bar chart (existing)
  const values = chartData.map((d) => d.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const span = maxV - minV || Math.abs(maxV) || 1e7;
  const pad = span * 0.08;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Margin Flow" />
      <div className="mt-3">
        <ResponsiveContainer width="100%" minWidth={0} height={300}>
          <BarChart data={chartData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} interval={0} angle={-12} height={56} />
            <YAxis
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              domain={[minV - pad, maxV + pad]}
              tickFormatter={(v) => formatCurrency(v, { compact: true })}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: `1px solid ${CHART_BORDER}`, fontSize: 12 }}
              formatter={(value) => [formatCurrency(Number(value ?? 0)), ""]}
            />
            <ReferenceLine y={0} stroke="#e5e7eb" />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.value >= 0 ? CHART_DIVERGING.positive : CHART_DIVERGING.negative} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function FinancialKeyMetricFromApi({ metric }: { metric: CommandCenterKeyMetric }): React.ReactNode {
  const sv = metric.status;
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Target className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-sm text-gray-600">{metric.label}</span>
      </div>
      <span className="text-2xl font-bold text-gray-900 block">{metric.value_formatted}</span>
      {/* eslint-disable-next-line design-system/prefer-section-header -- card footer with target+badge, not a section title */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-500">Target: {metric.target}</span>
        <Badge variant={STATUS_BADGE_VARIANT[sv] ?? "default"} className="text-xs">
          {STATUS_LABEL[sv] ?? sv}
        </Badge>
      </div>
    </div>
  );
}

function KeyMetricsApiSection({ metrics }: { metrics: CommandCenterKeyMetric[] }): React.ReactNode {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Key Metrics" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
        {metrics.map((m) => (
          <FinancialKeyMetricFromApi key={m.label} metric={m} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composed Financial Section
// ---------------------------------------------------------------------------

export function FinancialSection({ data }: { data?: FinancialResponse | null }): React.ReactNode {
  if (data) {
    const hasFlow = Array.isArray(data.margin_flow_chart) && data.margin_flow_chart.length > 0;
    const hasMetrics = Array.isArray(data.key_metrics) && data.key_metrics.length > 0;
    const showMetricsBlock = SHOW_FINANCIAL_KEY_METRICS && hasMetrics;
    if (!hasFlow && !showMetricsBlock) {
      return (
        <EmptyState
          title="No financial detail"
          description="No chart or metric data was returned for this period."
          variant="neutral"
        />
      );
    }
    return (
      <div className="space-y-4">
        {hasFlow ? <MarginFlowChartApi points={data.margin_flow_chart} /> : null}
        {showMetricsBlock ? <KeyMetricsApiSection metrics={data.key_metrics} /> : null}
      </div>
    );
  }

  return (
    <EmptyState
      title="No financial data"
      description="Connect the Financial API to view margin flow and key metrics."
      variant="neutral"
    />
  );
}
