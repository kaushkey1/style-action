import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis,
} from 'recharts';
import { SectionHeader } from '@/components/ui';
import { ChartTooltipContent } from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { DomainKpis } from './DomainKpis';
import { tabDomainKpis, marginFlowData, otbConsumptionData } from '../../data/mockChartData';

import { CHART_PRIMARY, CHART_STATUS, CHART_GRID, CHART_AXIS_TICK, CHART_AXIS_LABEL } from '@/data/chartColors';

const MARGIN_COLORS: Record<string, string> = {
  'Intake Margin': CHART_PRIMARY,
  'Markdown Impact': CHART_STATUS.warning,
  'Gross Margin': CHART_STATUS.success,
};

export function FinancialTab() {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      <DomainKpis kpis={tabDomainKpis['financial']!} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Margin Flow */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader title="Margin Flow" />
          <div className="h-[280px] mt-3">
            <ResponsiveContainer width="100%" minWidth={0} height="100%">
              <BarChart data={marginFlowData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis dataKey="stage" tick={{ fontSize: isMobile ? 10 : 12, fill: CHART_AXIS_LABEL }} tickLine={false} interval={isMobile ? 'preserveStartEnd' : 0} />
                <YAxis tick={{ fontSize: 12, fill: CHART_AXIS_TICK }} tickLine={false} axisLine={false} hide={isMobile} />
                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} content={<ChartTooltipContent valueFormatter={(v) => `${v}%`} />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {marginFlowData.map((entry) => (
                    <Cell key={entry.stage} fill={MARGIN_COLORS[entry.stage] ?? CHART_PRIMARY} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* OTB Consumption */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader title="OTB Consumption" />
          <div className="h-[280px] mt-3 flex items-center justify-center">
            <ResponsiveContainer width="100%" minWidth={0} height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                data={otbConsumptionData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="consumed" fill={CHART_PRIMARY} cornerRadius={8} />
                <text x="50%" y="46%" textAnchor="middle" className="text-2xl font-bold" fill="#111827">
                  80%
                </text>
                <text x="50%" y="56%" textAnchor="middle" className="text-xs" fill={CHART_AXIS_TICK}>
                  Consumed
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
