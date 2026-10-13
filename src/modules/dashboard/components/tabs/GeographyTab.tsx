import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { SectionHeader } from '@/components/ui';
import { ChartTooltipContent } from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { DomainKpis } from './DomainKpis';
import { tabDomainKpis, regionRevenueData, storeMixData } from '../../data/mockChartData';
import { CHART_PRIMARY, CHART_SEQUENTIAL, CHART_GRID, CHART_AXIS_TICK, CHART_AXIS_LABEL } from '@/data/chartColors';
import { getCurrencySymbol } from '@/lib/utils';

export function GeographyTab() {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      <DomainKpis kpis={tabDomainKpis['geography']!} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Revenue by Region */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader title="Revenue by Region" />
          <div className="h-[280px] mt-3">
            <ResponsiveContainer width="100%" minWidth={0} height="100%">
              <BarChart data={regionRevenueData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis dataKey="zone" tick={{ fontSize: isMobile ? 10 : 12, fill: CHART_AXIS_LABEL }} tickLine={false} interval={isMobile ? 'preserveStartEnd' : 0} />
                <YAxis tick={{ fontSize: 12, fill: CHART_AXIS_TICK }} tickLine={false} axisLine={false} hide={isMobile} />
                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} content={<ChartTooltipContent valueFormatter={(v) => `${getCurrencySymbol()}${v} Cr/day`} />} />
                <ReferenceLine y={12.5} stroke={CHART_AXIS_TICK} strokeDasharray="4 4" label={{ value: 'Avg', position: 'right', fontSize: 12, fill: CHART_AXIS_TICK }} />
                <Bar dataKey="revenue" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Store Mix by City Tier */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader title="Store Mix by City Tier" />
          <div className="h-[280px] mt-3">
            <ResponsiveContainer width="100%" minWidth={0} height="100%">
              <PieChart>
                <Pie
                  data={storeMixData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  stroke="none"
                  label={({ name, value, cx: cxVal, cy: cyVal, midAngle = 0, outerRadius: or }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = (or as number) + 20;
                    const x = (cxVal as number) + radius * Math.cos(-(midAngle) * RADIAN);
                    const y = (cyVal as number) + radius * Math.sin(-(midAngle) * RADIAN);
                    return (
                      <text x={x} y={y} textAnchor={x > (cxVal as number) ? 'start' : 'end'} dominantBaseline="central" className="text-xs fill-gray-600">
                        {name} {value}%
                      </text>
                    );
                  }}
                  labelLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                >
                  {storeMixData.map((_, i) => (
                    <Cell key={i} fill={CHART_SEQUENTIAL[i]} />
                  ))}
                </Pie>
                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} content={<ChartTooltipContent valueFormatter={(v) => `${v}%`} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
