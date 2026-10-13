import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { SectionHeader, Skeleton, DrillMenu } from '@/components/ui';
import { getChartDrillTargets } from '@/lib/routing';
import {
  CHART_PLAN,
  CHART_ACTUAL,
  CHART_GRID,
  CHART_AXIS_LABEL,
  CHART_BORDER,
} from '@/data/chartColors';
import type { ClusterData } from '../api/storePerformanceApi';

const CRORE = 10_000_000;

interface StoreClusterChartsProps {
  data: ClusterData | undefined;
  isLoading: boolean;
}

export function StoreClusterCharts({
  data,
  isLoading,
}: StoreClusterChartsProps): React.ReactNode {
  if (isLoading || !data) {
    return <Skeleton className="h-[340px] rounded-lg" />;
  }

  const aopData = data.aop_vs_actual
    .filter((r) => r.store_grade != null)
    .map((r) => ({
      cluster: r.store_grade ?? 'Ungraded',
      aop: (r.gross_sales_aop ?? 0) / CRORE,
      actual: (r.gross_sales_actual ?? 0) / CRORE,
    }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader
        inlineActions
        title="AOP vs Actual by Grade (₹ Cr)"
        actions={<DrillMenu rowLabel="store grades" targets={getChartDrillTargets('grade', { from: 'dashboard' })} />}
      />
      <div className="mt-3 h-[280px]">
        <ResponsiveContainer width="100%" minWidth={0} height={280}>
          <BarChart data={aopData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
            <XAxis
              dataKey="cluster"
              tick={{ fontSize: 12, fill: CHART_AXIS_LABEL }}
              axisLine={{ stroke: CHART_BORDER }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: CHART_AXIS_LABEL }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `₹${Math.round(v)}`}
            />
            <Tooltip
              formatter={(value, name) => [`₹${Number(value).toFixed(1)} Cr`, name]}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: `1px solid ${CHART_BORDER}`,
              }}
            />
            <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            {/* AOP = darker (CHART_ACTUAL), Actual = lighter (CHART_PLAN) — per approved design */}
            <Bar dataKey="aop" name="AOP" fill={CHART_ACTUAL} radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" name="Actual" fill={CHART_PLAN} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
