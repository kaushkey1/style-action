import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { SectionHeader } from '@/components/ui';
import { ChartTooltipContent, ChartLegendContent } from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { DomainKpis } from './DomainKpis';
import { tabDomainKpis, vendorPerformanceData, procurementPipelineData } from '../../data/mockChartData';

import { CHART_SEQUENTIAL, CHART_GRID, CHART_AXIS_TICK, CHART_AXIS_LABEL, CHART_BORDER } from '@/data/chartColors';

const vendorConfig = {
  fillRate: { label: 'Fill Rate %', color: CHART_SEQUENTIAL[0]! },
  otif: { label: 'OTIF %', color: CHART_SEQUENTIAL[1]! },
};

const pipelineConfig = {
  openPRs: { label: 'Open PRs', color: CHART_SEQUENTIAL[0]! },
  openPOs: { label: 'Open POs', color: CHART_SEQUENTIAL[1]! },
  grnPending: { label: 'GRN Pending', color: CHART_SEQUENTIAL[3]! },
};

export function OperationsTab() {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      <DomainKpis kpis={tabDomainKpis['operations']!} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Top Vendor Performance */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader title="Top Vendor Performance" />
          <div className="h-[280px] mt-3">
            <ResponsiveContainer width="100%" minWidth={0} height="100%">
              <BarChart data={vendorPerformanceData} layout="vertical" margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: isMobile ? 10 : 12, fill: CHART_AXIS_TICK }} tickLine={false} domain={[0, 100]} />
                <YAxis type="category" dataKey="vendor" tick={{ fontSize: isMobile ? 10 : 12, fill: CHART_AXIS_LABEL }} tickLine={false} axisLine={false} width={60} />
                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} content={<ChartTooltipContent config={vendorConfig} valueFormatter={(v) => `${v}%`} />} />
                <Legend content={<ChartLegendContent config={vendorConfig} />} />
                <ReferenceLine x={95} stroke={CHART_AXIS_TICK} strokeDasharray="4 4" />
                <ReferenceLine x={90} stroke={CHART_BORDER} strokeDasharray="4 4" />
                <Bar dataKey="fillRate" fill={vendorConfig.fillRate.color} radius={[0, 4, 4, 0]} />
                <Bar dataKey="otif" fill={vendorConfig.otif.color} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Procurement Pipeline */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader title="Procurement Pipeline" />
          <div className="h-[280px] mt-3">
            <ResponsiveContainer width="100%" minWidth={0} height="100%">
              <BarChart data={procurementPipelineData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis dataKey="week" tick={{ fontSize: isMobile ? 10 : 12, fill: CHART_AXIS_LABEL }} tickLine={false} interval={isMobile ? 'preserveStartEnd' : 0} />
                <YAxis tick={{ fontSize: 12, fill: CHART_AXIS_TICK }} tickLine={false} axisLine={false} hide={isMobile} />
                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} content={<ChartTooltipContent config={pipelineConfig} />} />
                <Legend content={<ChartLegendContent config={pipelineConfig} />} />
                <Bar dataKey="openPRs" stackId="a" fill={pipelineConfig.openPRs.color} radius={[0, 0, 0, 0]} />
                <Bar dataKey="openPOs" stackId="a" fill={pipelineConfig.openPOs.color} />
                <Bar dataKey="grnPending" stackId="a" fill={pipelineConfig.grnPending.color} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
