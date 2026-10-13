import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { SectionHeader } from '@/components/ui';
import { ChartTooltipContent, ChartLegendContent } from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { DomainKpis } from './DomainKpis';
import { tabDomainKpis, inventoryAgeData, inventoryByCategoryData } from '../../data/mockChartData';
import { stripIndexPrefix } from '@/modules/category-director/lib/apiAdapters';

import { CHART_PRIMARY, CHART_STATUS, CHART_GRID, CHART_AXIS_TICK, CHART_AXIS_LABEL } from '@/data/chartColors';
import { getCurrencySymbol } from '@/lib/utils';

const ageConfig = {
  '<30d': { label: '< 30 days', color: CHART_STATUS.success },
  '31-90d': { label: '31–90 days', color: CHART_STATUS.neutral },
  '91-180d': { label: '91–180 days', color: CHART_STATUS.warning },
  '>180d': { label: '> 180 days', color: CHART_STATUS.critical },
};

const STATUS_BAR_COLOR: Record<string, string> = {
  on_track: CHART_STATUS.success,
  warning: CHART_STATUS.warning,
  critical: CHART_STATUS.critical,
};

export function InventoryHealthTab() {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      <DomainKpis kpis={tabDomainKpis['inventory-health']!} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Inventory Age Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader title="Inventory Age Distribution" />
          <div className="h-[280px] mt-3">
            <ResponsiveContainer width="100%" minWidth={0} height="100%">
              <BarChart data={inventoryAgeData} layout="vertical" margin={{ top: 5, right: 5, bottom: 5, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: isMobile ? 10 : 12, fill: CHART_AXIS_TICK }} tickLine={false} />
                <YAxis type="category" dataKey="category" tickFormatter={stripIndexPrefix} tick={{ fontSize: isMobile ? 10 : 12, fill: CHART_AXIS_LABEL }} tickLine={false} axisLine={false} width={90} hide={isMobile} />
                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} content={<ChartTooltipContent config={ageConfig} valueFormatter={(v) => `${v}%`} />} />
                <Legend content={<ChartLegendContent config={ageConfig} />} />
                <Bar dataKey="<30d" stackId="a" fill={ageConfig['<30d'].color} radius={[0, 0, 0, 0]} />
                <Bar dataKey="31-90d" stackId="a" fill={ageConfig['31-90d'].color} />
                <Bar dataKey="91-180d" stackId="a" fill={ageConfig['91-180d'].color} />
                <Bar dataKey=">180d" stackId="a" fill={ageConfig['>180d'].color} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory by Category */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader title="Inventory by Category" />
          <div className="h-[280px] mt-3">
            <ResponsiveContainer width="100%" minWidth={0} height="100%">
              <BarChart data={inventoryByCategoryData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis dataKey="name" tickFormatter={stripIndexPrefix} tick={{ fontSize: isMobile ? 10 : 12, fill: CHART_AXIS_LABEL }} tickLine={false} interval={isMobile ? 'preserveStartEnd' : 0} />
                <YAxis tick={{ fontSize: 12, fill: CHART_AXIS_TICK }} tickLine={false} axisLine={false} hide={isMobile} />
                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} content={<ChartTooltipContent valueFormatter={(v) => `${getCurrencySymbol()}${v} Cr`} />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {inventoryByCategoryData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_BAR_COLOR[entry.status] ?? CHART_PRIMARY} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
