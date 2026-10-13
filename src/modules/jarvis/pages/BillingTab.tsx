import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import {
  MetricGrid,
  MetricCard,
  SectionHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  Badge,
  EmptyState,
} from '@/components/ui';
import { SourceBadge } from '../components/SourceBadge';
import { useJarvisDateStore } from '../stores/useJarvisDateStore';
import { useSmartiAreaCount } from '../api/smartiQueries';
import {
  billingMetrics,
  monthlyBills,
} from '@/modules/jarvis/data/mockJarvis';

import type { AreaCountEntry } from '../api/smartiTypes';
import type { RagStatus } from '@/lib/utils';
import type { JarvisMetric } from '@/modules/jarvis/data/mockJarvis';

function mapStatus(status: 'green' | 'amber' | 'red' | undefined): RagStatus | undefined {
  if (!status) return undefined;
  const map: Record<'green' | 'amber' | 'red', RagStatus> = {
    green: 'on-track',
    amber: 'warning',
    red: 'critical',
  };
  return map[status];
}

function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
};

interface BillingTabProps {
  startDateOverride?: string;
  endDateOverride?: string;
}

export function BillingTab({ startDateOverride, endDateOverride }: BillingTabProps = {}): React.ReactNode {
  const storeDate = useJarvisDateStore((s) => s.dateRange);
  const startDate = startDateOverride ?? storeDate.startDate;
  const endDate = endDateOverride ?? storeDate.endDate;
  const areaCount = useSmartiAreaCount(startDate, endDate);

  // POS / billing counter zones (identified by queue metadata)
  const allZones: AreaCountEntry[] = areaCount.data?.data ?? [];
  const cashCounterZones = allZones.filter(
    (z: AreaCountEntry) => z.queueType === 'cash_counters_queue',
  );
  const totalServed = cashCounterZones.reduce((sum: number, z: AreaCountEntry) => sum + z.totalServed, 0);
  const avgWaitTime = cashCounterZones.length > 0
    ? cashCounterZones.reduce((sum: number, z: AreaCountEntry) => sum + z.avgWaitTime, 0) / cashCounterZones.length
    : 0;
  const maxWaitTime = Math.max(...cashCounterZones.map((z: AreaCountEntry) => z.maxWaitTime), 0);
  const activeCashCounters = cashCounterZones.filter((z: AreaCountEntry) => z.totalServed > 0).length;

  // Enhance billing metrics with real data
  const enhancedMetrics: JarvisMetric[] = billingMetrics.map((metric) => {
    if (metric.id === 'bl-1' && !areaCount.isLoading) {
      return {
        ...metric,
        label: 'Avg Queue Wait',
        value: formatSeconds(avgWaitTime),
        numericValue: avgWaitTime,
        source: 'cctv' as const,
        status: avgWaitTime > 300 ? 'red' as const : avgWaitTime > 120 ? 'amber' as const : 'green' as const,
      };
    }
    if (metric.id === 'bl-2' && !areaCount.isLoading) {
      return {
        ...metric,
        label: 'Max Queue Wait',
        value: formatSeconds(maxWaitTime),
        numericValue: maxWaitTime,
        source: 'cctv' as const,
      };
    }
    if (metric.id === 'bl-4' && !areaCount.isLoading) {
      return {
        ...metric,
        label: 'Active Cash Counters',
        value: `${activeCashCounters} / ${cashCounterZones.length}`,
        numericValue: activeCashCounters,
        source: 'cctv' as const,
      };
    }
    if (metric.id === 'bl-5' && !areaCount.isLoading) {
      return {
        ...metric,
        label: 'Total Served',
        value: totalServed.toLocaleString(),
        numericValue: totalServed,
        source: 'cctv' as const,
      };
    }
    return metric;
  });

  return (
    <div className="space-y-4">
      <SectionHeader title="Billing Journey" subtitle="Checkout, transaction, and POS performance" />

      {/* Billing Metrics */}
      <MetricGrid columns={3}>
        {enhancedMetrics.map((metric) => (
          <MetricCard
            key={metric.id}
            label={metric.label}
            value={metric.value}
            status={mapStatus(metric.status)}
            badge={<SourceBadge source={metric.source} />}
          />
        ))}
      </MetricGrid>

      {/* Cash Counter Detail */}
      <div>
        <SectionHeader
          title="Cash Counter Performance"
          subtitle="Queue metrics per counter from CCTV"
          actions={
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm">Live CCTV</Badge>
              <SourceBadge source="audio" />
            </div>
          }
        />
        <Card>
          <CardContent className="p-0">
            {areaCount.isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
            ) : cashCounterZones.length === 0 ? (
              <EmptyState title="No counter data" description="No cash counter data for this period" />
            ) : (
              <DataTable minWidth="600px">
                <DataTableHeader>
                  <DataTableHead>Counter</DataTableHead>
                  <DataTableHead align="right">Total Served</DataTableHead>
                  <DataTableHead align="right">Avg Wait</DataTableHead>
                  <DataTableHead align="right">Max Wait</DataTableHead>
                  <DataTableHead align="right">Min Wait</DataTableHead>
                  <DataTableHead align="right">Active Now</DataTableHead>
                  <DataTableHead>Status</DataTableHead>
                </DataTableHeader>
                <DataTableBody>
                  {cashCounterZones.map((counter: AreaCountEntry) => {
                    const status = counter.totalServed === 0 ? 'Idle' : counter.totalServed > 50 ? 'High load' : 'Normal';
                    const variant = status === 'Idle' ? 'default' as const : status === 'High load' ? 'warning' as const : 'success' as const;
                    return (
                      <DataTableRow key={counter.areaId}>
                        <DataTableCell className="font-medium text-xs">{counter.areaName}</DataTableCell>
                        <DataTableCell align="right" className="text-xs tabular-nums">{counter.totalServed}</DataTableCell>
                        <DataTableCell align="right" className="text-xs tabular-nums">{formatSeconds(counter.avgWaitTime)}</DataTableCell>
                        <DataTableCell align="right" className="text-xs tabular-nums">{formatSeconds(counter.maxWaitTime)}</DataTableCell>
                        <DataTableCell align="right" className="text-xs tabular-nums">{formatSeconds(counter.minWaitTime)}</DataTableCell>
                        <DataTableCell align="right" className="text-xs tabular-nums">{counter.activeVisitors}</DataTableCell>
                        <DataTableCell>
                          <Badge variant={variant} size="sm" dot>{status}</Badge>
                        </DataTableCell>
                      </DataTableRow>
                    );
                  })}
                </DataTableBody>
              </DataTable>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Bills Chart (mock) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">Monthly Bills (FY)</CardTitle>
            <SourceBadge source="input" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyBills} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6b7280' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value) => [Number(value).toLocaleString(), 'Bills']}
              />
              <Bar dataKey="bills" fill="#818cf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
