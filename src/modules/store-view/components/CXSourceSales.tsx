import { useQuery } from '@tanstack/react-query';
import { EmptyState, MetricCard, MetricGrid, Skeleton } from '@/components/ui';
import { STALE_TIMES, formatCurrencyFromLakhs, formatNumber } from '@/lib/utils';
import {
  fetchStoreSales,
  storeSalesKeys,
  type SalesKpiCard,
  type SalesKpiConstituent,
} from '../api/storeSalesApi';

interface CXSourceSalesProps {
  storeCode: string;
  startDate: string;
  endDate: string;
}

/** Whole numbers render without a decimal tail; ratios keep 2dp as StoreOps does. */
function formatMeasure(value: number): string {
  return Number.isInteger(value) ? formatNumber(value) : value.toFixed(2);
}

function formatHeadline(card: SalesKpiCard): string {
  if (card.value === null) return '—';
  return `${card.prefix}${formatMeasure(card.value)}${card.suffix}`;
}

function formatConstituent(item: SalesKpiConstituent): string {
  const value = item.isCurrencyLakhs
    ? formatCurrencyFromLakhs(item.value)
    : `${item.prefix}${formatMeasure(item.value)}`;
  return item.suffix ? `${value} ${item.suffix}` : value;
}

/**
 * StoreOps sales KPIs for one store, shown in the Checkout & Billing drill-down.
 *
 * The seven cards, their order, formulas and RAG thresholds mirror the StoreOps
 * sales dashboard so the numbers can be compared card-for-card. Two quirks are
 * reproduced deliberately and must not be "fixed" here — they live in the
 * backend query: Conversion % uses 90/95 thresholds against a rate that runs
 * ~13%, so it always reads critical; and SPSF divides by summed daily area, so
 * over a multi-day range it is sales per sq ft *per day*.
 */
export function CXSourceSales({
  storeCode,
  startDate,
  endDate,
}: CXSourceSalesProps): React.ReactNode {
  const { data, isLoading, error } = useQuery({
    queryKey: storeSalesKeys.store(storeCode, startDate, endDate),
    queryFn: () => fetchStoreSales(storeCode, startDate, endDate),
    enabled: !!storeCode,
    staleTime: STALE_TIMES.LISTING,
    // These are slow warehouse/Places calls; a retry doubles the wait
    // without making an empty or failing result any more likely to succeed.
    retry: false,
  });

  if (isLoading) {
    return (
      <MetricGrid columns={4}>
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </MetricGrid>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Sales Data Unavailable"
        description="Could not load sales KPIs for this store. Please try again."
      />
    );
  }

  if (!data || data.cards.length === 0) {
    return (
      <EmptyState
        title="No Sales Data"
        description="No sales data available for this store in the selected period."
      />
    );
  }

  return (
    <div className="space-y-3 animate-fadeInUp">
      <p className="text-xs text-gray-500">
        {data.storeName} · {data.daysWithData} day{data.daysWithData === 1 ? '' : 's'} of data
        {data.maxDate ? ` · latest ${data.maxDate}` : ''}
      </p>

      <MetricGrid columns={4}>
        {data.cards.map((card) => (
          <MetricCard
            key={card.name}
            label={card.label}
            value={formatHeadline(card)}
            status={card.status ?? undefined}
          >
            <div className="mt-1 space-y-0.5">
              {card.constituents.map((item) => (
                <div
                  key={item.label}
                  className="flex items-baseline justify-between gap-2 text-xs"
                >
                  <span className="text-gray-500 truncate">{item.label}</span>
                  <span className="font-medium text-gray-900 shrink-0">
                    {formatConstituent(item)}
                  </span>
                </div>
              ))}
            </div>
          </MetricCard>
        ))}
      </MetricGrid>
    </div>
  );
}
