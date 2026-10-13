import { Badge, KpiLabel, MetricCard, SectionHeader, MetricGrid, EmptyState, Tabs, TabsList, TabsTrigger, TabsContent, DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell } from '@/components/ui';
import { mockCategoryPerformance, sellThroughCurve } from '../data/mockTradingWall';
import {cn, getCurrencySymbol} from '@/lib/utils';
import { TimePeriodFilter } from '@/components/TimePeriodFilter';
import { ChaseDecisionPanel } from '@/modules/otb/components/ChaseDecisionPanel';

function PerformanceGrid() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <DataTable>
          <DataTableHeader>
              <DataTableHead>Category</DataTableHead>
              <DataTableHead>Cluster</DataTableHead>
              <DataTableHead align="center"><KpiLabel abbr="Sell-Through" /> %</DataTableHead>
              <DataTableHead align="center"><KpiLabel abbr="WOS" /></DataTableHead>
              <DataTableHead align="center">Full Price</DataTableHead>
              <DataTableHead align="center">Markdown</DataTableHead>
              <DataTableHead align="center">Revenue</DataTableHead>
              <DataTableHead align="right"><KpiLabel abbr="SPSF" /></DataTableHead>
              <DataTableHead align="right"><KpiLabel abbr="GMROF" /></DataTableHead>
              <DataTableHead align="center">Space Eff.</DataTableHead>
              <DataTableHead align="center">Core/Fashion</DataTableHead>
              <DataTableHead align="center">Signals</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {mockCategoryPerformance.length === 0 ? (
              <DataTableRow><DataTableCell colSpan={12}><EmptyState description="No categories to display" /></DataTableCell></DataTableRow>
            ) : mockCategoryPerformance.map((row) => (
              <DataTableRow key={row.id}>
                <DataTableCell className="font-medium text-gray-900">{row.category}</DataTableCell>
                <DataTableCell className="text-gray-600">{row.cluster}</DataTableCell>
                <DataTableCell align="center">
                  <span className={cn('font-medium', row.sellThrough_pct >= 70 ? 'text-success' : row.sellThrough_pct >= 60 ? 'text-warning' : 'text-error')}>
                    {row.sellThrough_pct}%
                  </span>
                </DataTableCell>
                <DataTableCell align="center">
                  <Badge
                    variant={row.wos_band === 'within' ? 'success' : row.wos_band === 'over' ? 'error' : 'warning'}
                    className="text-xs"
                  >
                    {row.wos.toFixed(1)}w
                  </Badge>
                </DataTableCell>
                <DataTableCell align="center">{row.fullPrice_pct}%</DataTableCell>
                <DataTableCell align="center">
                  <span className={cn(row.markdown_pct > 35 ? 'text-error-600 font-medium' : 'text-gray-700')}>
                    {row.markdown_pct}%
                  </span>
                </DataTableCell>
                <DataTableCell align="center">
                  <div>
                    <span className="text-gray-900 font-medium">{getCurrencySymbol()}{row.revenue_cr}</span>
                    <span className="text-gray-500">/{row.target_cr} Cr</span>
                  </div>
                </DataTableCell>
                <DataTableCell align="right">{getCurrencySymbol()}{row.spsf}</DataTableCell>
                <DataTableCell align="right">{getCurrencySymbol()}{row.gmrof}</DataTableCell>
                <DataTableCell align="center">
                  <Badge
                    variant={row.spaceEfficiency >= 100 ? 'success' : row.spaceEfficiency >= 80 ? 'warning' : 'error'}
                    className="text-xs"
                  >
                    {row.spaceEfficiency}%
                  </Badge>
                </DataTableCell>
                <DataTableCell align="center">
                  <div className="flex items-center justify-center gap-1">
                    <span className={cn('text-xs', row.coreMix_pct >= 70 ? 'text-success' : 'text-warning')}>
                      {row.coreMix_pct}C
                    </span>
                    <span className="text-gray-400">/</span>
                    <span className={cn('text-xs', row.fashionMix_pct <= 30 ? 'text-success' : 'text-error')}>
                      {row.fashionMix_pct}F
                    </span>
                  </div>
                </DataTableCell>
                <DataTableCell align="center">
                  <div className="flex items-center justify-center gap-1">
                    {row.reorder_signal && (
                      <Badge variant="success" className="text-xs">Reorder</Badge>
                    )}
                    {row.markdown_trigger && (
                      <Badge variant="error" className="text-xs">MD</Badge>
                    )}
                    {!row.reorder_signal && !row.markdown_trigger && (
                      <span className="text-gray-400">--</span>
                    )}
                  </div>
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
      </DataTable>
    </div>
  );
}

function SellThroughCurveChart() {
  const maxVal = 100;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Sell-Through Curve (Avg All Categories)" className="mb-4" />
      <div className="flex items-end gap-3 h-48">
        {sellThroughCurve.map((point) => (
          <div key={point.week} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end gap-0.5 h-[160px]">
              { }
              <div
                className="flex-1 bg-gray-200 rounded-t"
                // eslint-disable-next-line no-restricted-syntax -- dynamic height
                style={{ height: `${(point.target / maxVal) * 100}%` }}
                title={`Target: ${point.target}%`}
              />
              { }
              <div
                className={cn('flex-1 rounded-t', point.actual >= point.target ? 'bg-success' : 'bg-primary')}
                // eslint-disable-next-line no-restricted-syntax -- dynamic height
                style={{ height: `${(point.actual / maxVal) * 100}%` }}
                title={`Actual: ${point.actual}%`}
              />
            </div>
            <span className="text-xs text-gray-500">W{point.week}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-gray-200" />
          <span className="text-xs text-gray-500">Target</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-primary" />
          <span className="text-xs text-gray-500">Actual</span>
        </div>
      </div>
    </div>
  );
}

function FashionPyramid() {
  const pyramid = [
    { label: 'Ultimates', pct: 5, target: '≤5%', color: 'bg-error', status: 'on-track' },
    { label: 'Fashion', pct: 35, target: '≤20%', color: 'bg-warning', status: 'critical' },
    { label: 'Core', pct: 42, target: '≥50%', color: 'bg-primary', status: 'warning' },
    { label: 'Essentials', pct: 18, target: '≥20%', color: 'bg-success', status: 'warning' },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Fashion Pyramid Mix" className="mb-4" />
      <div className="space-y-3">
        {pyramid.map((tier) => (
          <div key={tier.label} className="flex items-center gap-3">
            <span className="text-xs text-gray-600 w-20 shrink-0">{tier.label}</span>
            <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line no-restricted-syntax -- dynamic width */}
              <div className={cn('h-full rounded-lg', tier.color)} style={{ width: `${tier.pct}%` }} />
            </div>
            <span className="text-xs font-medium text-gray-900 w-10">{tier.pct}%</span>
            <Badge
              variant={tier.status === 'on-track' ? 'success' : tier.status === 'warning' ? 'warning' : 'error'}
              className="text-xs w-14 justify-center"
            >
              {tier.target}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TradingWallPage() {
  const overstock = mockCategoryPerformance.filter((r) => r.wos_band === 'over').length;
  const markdownTriggers = mockCategoryPerformance.filter((r) => r.markdown_trigger).length;
  const reorderSignals = mockCategoryPerformance.filter((r) => r.reorder_signal).length;

  return (
    <div className="animate-fadeInUp">
      {/* Summary */}
      <div className="flex items-center justify-end mb-2">
        <TimePeriodFilter />
      </div>
      <MetricGrid>
        <MetricCard label="Categories Tracked" value={mockCategoryPerformance.length} />
        <MetricCard label={<><KpiLabel abbr="WOS" /> Overstock</>} value={overstock} status={overstock > 0 ? 'critical' : 'on-track'} />
        <MetricCard label="Markdown Triggers" value={markdownTriggers} status="critical" />
        <MetricCard label="Reorder Signals" value={reorderSignals} status="on-track" />
      </MetricGrid>

      <Tabs defaultValue="grid">
        <TabsList variant="underline" className="mb-4">
          <TabsTrigger value="grid">Performance Grid</TabsTrigger>
          <TabsTrigger value="curve">Sell-Through Curve</TabsTrigger>
          <TabsTrigger value="pyramid">Fashion Pyramid</TabsTrigger>
          <TabsTrigger value="chase">Chase Decisions</TabsTrigger>
        </TabsList>
        <TabsContent value="grid">
          <PerformanceGrid />
        </TabsContent>
        <TabsContent value="curve">
          <SellThroughCurveChart />
        </TabsContent>
        <TabsContent value="pyramid">
          <FashionPyramid />
        </TabsContent>
        <TabsContent value="chase">
          <ChaseDecisionPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
