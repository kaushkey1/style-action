import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { SectionHeader } from '@/components/ui';
import { ChartTooltipContent, ChartLegendContent } from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { DomainKpis } from './DomainKpis';
import { tabDomainKpis, sellThroughByCategoryData, categoryHealthData } from '../../data/mockChartData';
import { stripIndexPrefix } from '@/modules/category-director/lib/apiAdapters';

import { CHART_PRIMARY, CHART_STATUS, CHART_GRID, CHART_AXIS_TICK, CHART_AXIS_LABEL } from '@/data/chartColors';

const healthConfig = {
  sellThrough: { label: 'Sell-Through %', color: CHART_PRIMARY },
  aged: { label: 'Aged Inv %', color: CHART_STATUS.critical },
};

export function CategoriesTab() {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      <DomainKpis kpis={tabDomainKpis['categories']!} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Sell-Through by Category */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader title="Sell-Through by Category" />
          <div className="h-[280px] mt-3">
            <ResponsiveContainer width="100%" minWidth={0} height="100%">
              <BarChart data={sellThroughByCategoryData} layout="vertical" margin={{ top: 5, right: 5, bottom: 5, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: isMobile ? 10 : 12, fill: CHART_AXIS_TICK }} tickLine={false} domain={[0, 100]} />
                <YAxis type="category" dataKey="category" tickFormatter={stripIndexPrefix} tick={{ fontSize: isMobile ? 10 : 12, fill: CHART_AXIS_LABEL }} tickLine={false} axisLine={false} width={100} hide={isMobile} />
                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} content={<ChartTooltipContent valueFormatter={(v) => `${v}%`} />} />
                <ReferenceLine x={70} stroke={CHART_AXIS_TICK} strokeDasharray="4 4" label={{ value: '70% target', position: 'top', fontSize: 12, fill: CHART_AXIS_TICK }} />
                <Bar dataKey="sellThrough" fill={CHART_PRIMARY} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Health Matrix */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader title="Category Health Matrix" />
          <div className="h-[280px] mt-3">
            <ResponsiveContainer width="100%" minWidth={0} height="100%">
              <BarChart data={categoryHealthData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis dataKey="category" tickFormatter={stripIndexPrefix} tick={{ fontSize: isMobile ? 10 : 12, fill: CHART_AXIS_LABEL }} tickLine={false} interval={isMobile ? 'preserveStartEnd' : 0} />
                <YAxis tick={{ fontSize: 12, fill: CHART_AXIS_TICK }} tickLine={false} axisLine={false} hide={isMobile} />
                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} content={<ChartTooltipContent config={healthConfig} valueFormatter={(v) => `${v}%`} />} />
                <Legend content={<ChartLegendContent config={healthConfig} />} />
                <Bar dataKey="sellThrough" fill={healthConfig.sellThrough.color} radius={[4, 4, 0, 0]} />
                <Bar dataKey="aged" fill={healthConfig.aged.color} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
