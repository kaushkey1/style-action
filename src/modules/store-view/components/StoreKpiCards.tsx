import { MetricCard, Skeleton } from '@/components/ui';
import { DashboardKpiGrid } from '@/modules/dashboard/components/DashboardKpiGrid';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { KpiSummary } from '../api/storePerformanceApi';

function fmtCr(value: number | null | undefined): string {
  if (value == null) return '—';
  return formatCurrency(value, { compact: true });
}

function fmtPct(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${value.toFixed(1)}%`;
}

interface StoreKpiCardsProps {
  data: KpiSummary | undefined;
  isLoading: boolean;
}

export function StoreKpiCards({ data, isLoading }: StoreKpiCardsProps): React.ReactNode {
  if (isLoading || !data) {
    return (
      <DashboardKpiGrid>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] w-full rounded-lg" />
        ))}
      </DashboardKpiGrid>
    );
  }

  return (
    <DashboardKpiGrid>
      <MetricCard label="Gross Revenue AOP" value={fmtCr(data.gross_sales_aop)} infoKey="Gross Revenue AOP" />
      <MetricCard label="Gross Revenue Actual" value={fmtCr(data.gross_sales_actual)} infoKey="Gross Revenue" />
      <MetricCard label="Achievement" value={fmtPct(data.achievement_pct)} infoKey="Achievement" />
      <MetricCard label="Avg NRM%" value={fmtPct(data.avg_nrm_pct)} infoKey="Avg NRM%" />
      <MetricCard label="Stores" value={formatNumber(data.store_count ?? 0)} infoKey="Total Stores" />
    </DashboardKpiGrid>
  );
}
