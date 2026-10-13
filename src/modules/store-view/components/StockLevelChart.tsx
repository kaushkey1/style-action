import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { SectionHeader, Skeleton, EmptyState, DrillMenu } from '@/components/ui';
import { getChartDrillTargets } from '@/lib/routing';
import { CHART_DIVERGING, CHART_GRID, CHART_AXIS_LABEL, CHART_BORDER } from '@/data/chartColors';
import type { StoreHealthByGradeRow } from '@/modules/category-director/api/categoryDirectorApi';

interface StockLevelChartProps {
  rows: StoreHealthByGradeRow[];
  isLoading: boolean;
}

/**
 * Stock Level by Grade — a single diverging bar shows over- and under-stocked store
 * counts per grade (understocked left of zero, overstocked right). Live from the
 * /store-distribution per-grade rollup.
 */
export function StockLevelChart({ rows, isLoading }: StockLevelChartProps): React.ReactNode {
  if (isLoading) {
    return <Skeleton className="h-[340px] rounded-lg" />;
  }

  // Understocked plotted negative so it diverges left of 0; overstocked right.
  const data = rows
    .filter((r) => r.store_grade != null)
    .map((r) => ({
      grade: r.store_grade,
      over: r.overstocked_stores ?? 0,
      under: -(r.understocked_stores ?? 0),
    }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader
        inlineActions
        title="Stock Level by Grade"
        actions={<DrillMenu rowLabel="store grades" targets={getChartDrillTargets('grade', { from: 'dashboard' })} />}
      />
      <div className="mt-3 h-[280px]">
        {data.length === 0 ? (
          <EmptyState description="No stock-level data for the selected filters." variant="neutral" />
        ) : (
          <ResponsiveContainer width="100%" minWidth={0} height={280}>
            <BarChart data={data} layout="vertical" stackOffset="sign" barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v: number) => `${Math.abs(v)}`}
                tick={{ fontSize: 11, fill: CHART_AXIS_LABEL }}
                axisLine={{ stroke: CHART_BORDER }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="grade"
                tick={{ fontSize: 12, fill: CHART_AXIS_LABEL }}
                axisLine={false}
                tickLine={false}
                width={72}
              />
              <Tooltip
                formatter={(value, name) => [Math.abs(Number(value)), name]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${CHART_BORDER}` }}
              />
              <ReferenceLine x={0} stroke={CHART_BORDER} />
              <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="under" name="Understocked" stackId="stock" fill={CHART_DIVERGING.negative} radius={[4, 0, 0, 4]} />
              <Bar dataKey="over" name="Overstocked" stackId="stock" fill={CHART_DIVERGING.positive} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
