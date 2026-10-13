import { Badge, Progress, SectionHeader, MetricGrid, EmptyState, DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell } from '@/components/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import {
  workingCapitalMetrics,
  valueAtRiskBuckets,
  workingCapitalSummary,
} from '../data/mockWorkingCapital';
import {cn, getCurrencySymbol} from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { TimePeriodFilter } from '@/components/TimePeriodFilter';

function MetricsGrid() {
  return (
    <MetricGrid columns={3} className="mb-0">
      {workingCapitalMetrics.length === 0 ? <EmptyState description="No metrics to display" /> : workingCapitalMetrics.map((metric) => (
        <div
          key={metric.id}
          className={cn(
            'bg-white rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md',
            metric.status === 'on-track' ? 'border-success/20' :
            metric.status === 'warning' ? 'border-warning/20' :
            'border-error/20'
          )}
        >
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-sm font-semibold text-gray-900">{metric.name}</span>
            {metric.status === 'on-track' ? (
              <Badge variant="success" className="text-[10px]">On Track</Badge>
            ) : metric.status === 'warning' ? (
              <Badge variant="warning" className="text-[10px]">Warning</Badge>
            ) : (
              <Badge variant="error" className="text-[10px]">Critical</Badge>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</p>
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs text-gray-500">Target: {metric.target}</span>
            {metric.trend && metric.trendValue && (
              <div className={cn('flex items-center gap-0.5 text-xs font-medium',
                metric.trend === 'down' && metric.id.includes('days') ? 'text-success' :
                metric.trend === 'up' ? 'text-success' : 'text-gray-500'
              )}>
                {metric.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {metric.trendValue}
              </div>
            )}
          </div>
        </div>
      ))}
    </MetricGrid>
  );
}

function ValueAtRiskTable() {
  const maxInterest = Math.max(...valueAtRiskBuckets.map((b) => b.interest_cost_lakh));

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <SectionHeader
          title="Value-at-Risk by Age Bucket"
          subtitle="Higher age = higher risk of markdown/write-off + interest carrying cost"
          className="mb-0"
        />
      </div>
      <DataTable>
          <DataTableHeader>
              <DataTableHead>Age Bucket</DataTableHead>
              <DataTableHead align="right">Inventory Value</DataTableHead>
              <DataTableHead align="right">Risk %</DataTableHead>
              <DataTableHead align="center">Value-at-Risk</DataTableHead>
              <DataTableHead align="right">Interest Cost</DataTableHead>
              <DataTableHead align="center" className="w-32">Impact</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {valueAtRiskBuckets.length === 0 ? (
              <DataTableRow><DataTableCell colSpan={6}><EmptyState description="No risk data to display" /></DataTableCell></DataTableRow>
            ) : valueAtRiskBuckets.map((bucket) => {
              const var_cr = Math.round(bucket.value_cr * bucket.risk_pct / 100);
              return (
                <DataTableRow key={bucket.ageBucket}>
                  <DataTableCell className="font-medium text-gray-900">{bucket.ageBucket}</DataTableCell>
                  <DataTableCell align="right">{getCurrencySymbol()}{bucket.value_cr} Cr</DataTableCell>
                  <DataTableCell align="right">
                    <span className={cn(
                      'font-medium',
                      bucket.risk_pct > 30 ? 'text-error' : bucket.risk_pct > 10 ? 'text-warning' : 'text-gray-700'
                    )}>
                      {bucket.risk_pct}%
                    </span>
                  </DataTableCell>
                  <DataTableCell align="center" className="font-medium text-error-600">{getCurrencySymbol()}{var_cr} Cr</DataTableCell>
                  <DataTableCell align="right">{getCurrencySymbol()}{bucket.interest_cost_lakh} L</DataTableCell>
                  <DataTableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(bucket.interest_cost_lakh / maxInterest) * 100}
                        className="h-1.5 flex-1"
                      />
                    </div>
                  </DataTableCell>
                </DataTableRow>
              );
            })}
          </DataTableBody>
          <tfoot>
            <tr className="bg-gray-50 border-t-2 border-gray-200 font-medium">
              <td className="p-3 text-gray-900">Total</td>
              <td className="p-3 text-right text-gray-900">{getCurrencySymbol()}{workingCapitalSummary.totalInventory_cr} Cr</td>
              <td className="p-3 text-right text-gray-500">--</td>
              <td className="p-3 text-center text-error font-bold">{getCurrencySymbol()}{workingCapitalSummary.totalVAR_cr} Cr</td>
              <td className="p-3 text-right text-gray-900">{getCurrencySymbol()}{(workingCapitalSummary.totalInterestCost_cr * 100).toFixed(0)} L</td>
              <td className="p-3" />
            </tr>
          </tfoot>
      </DataTable>
    </div>
  );
}

export function WorkingCapitalPage() {
  return (
    <div className="animate-fadeInUp">
      <div className="flex items-center justify-end mb-2">
        <TimePeriodFilter />
      </div>

      <Tabs defaultValue="metrics">
        <TabsList variant="underline" className="mb-4">
          <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
          <TabsTrigger value="var">Value-at-Risk</TabsTrigger>
        </TabsList>
        <TabsContent value="metrics">
          <MetricGrid>
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Total Inventory</p>
              <p className="text-xl font-bold text-gray-900">{getCurrencySymbol()}{workingCapitalSummary.totalInventory_cr} Cr</p>
            </div>
            <div className="bg-white rounded-lg border border-error/30 p-3">
              <p className="text-xs text-gray-500">Value-at-Risk</p>
              <p className="text-xl font-bold text-error">{getCurrencySymbol()}{workingCapitalSummary.totalVAR_cr} Cr</p>
            </div>
            <div className="bg-white rounded-lg border border-warning/30 p-3">
              <p className="text-xs text-gray-500">Interest Cost</p>
              <p className="text-xl font-bold text-warning">{getCurrencySymbol()}{(workingCapitalSummary.totalInterestCost_cr).toFixed(1)} Cr</p>
            </div>
            <div className="bg-white rounded-lg border border-error/30 p-3">
              <p className="text-xs text-gray-500">Aged Stock (&gt;180d)</p>
              <p className="text-xl font-bold text-error">{getCurrencySymbol()}{workingCapitalSummary.agedInventory_cr} Cr</p>
            </div>
          </MetricGrid>
          <MetricsGrid />
        </TabsContent>
        <TabsContent value="var">
          <ValueAtRiskTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
