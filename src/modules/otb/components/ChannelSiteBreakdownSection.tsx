import { useMemo, useState } from 'react';
import { Badge, Button, EmptyState, SectionHeader, Skeleton } from '@/components/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useChannelSiteMonthly, type ChannelSiteMonthlyRow } from '../api/otbDashboardApi';

const PAGE_SIZE = 25;

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/** Fiscal-year index (Apr = 0 … Mar = 11) for ordering season columns. */
function toFiscalIdx(calMonth: number): number {
  return (calMonth - 4 + 12) % 12;
}

interface MonthCol {
  key: string;
  label: string;
}

/** Fiscal-ordered month columns with year-wrap labels (e.g. Jan shows 2027). */
function buildMonthCols(months: { year: number; month: number }[]): MonthCol[] {
  const ordered = [...months].sort((a, b) => toFiscalIdx(a.month) - toFiscalIdx(b.month));
  const first = ordered[0];
  if (!first) return [];
  const firstCalMonth = first.month;
  return ordered.map((m) => {
    const displayYear = m.month < firstCalMonth ? m.year + 1 : m.year;
    return { key: `${m.year}-${m.month}`, label: `${MONTHS_SHORT[m.month - 1]} ${displayYear}` };
  });
}

/** Look up a site's OTB value for a given `${year}-${month}` key. */
function valueMap(row: ChannelSiteMonthlyRow): Record<string, number> {
  const map: Record<string, number> = {};
  for (const m of row.monthly_metrics) {
    if (m.month == null || m.year == null) continue;
    map[`${m.year}-${m.month}`] = m.monthly_total;
  }
  return map;
}

/** Human-readable location from the best-available geography fields. */
function location(store: ChannelSiteMonthlyRow): string {
  return [store.city, store.state].filter(Boolean).join(', ');
}

/**
 * Format an OTB value exactly like the Channel View → Monthly grid
 * (`formatValue` currency branch): default font, ₹ grouping, 2 decimals,
 * and a bare "0" for zero.
 */
function formatOtbValue(value: number): string {
  if (value === 0) return '0';
  return formatCurrency(value, { decimals: 2 });
}

interface ChannelSiteBreakdownSectionProps {
  /** Channel/format code (e.g. EBO_Channel). */
  channel: string;
  /** Optional season filter (e.g. AW, SS). */
  season?: string;
}

/**
 * Site View — per-site × month OTB Value grid within a single channel.
 *
 * Monthly matrix (rows = sites, columns = season months) backed by
 * `GET /otb/budget/channel-site-monthly`, which reads `otb_kpi_values_detail`.
 * Only channels the calculator breaks down by site (e.g. EBO) return rows.
 * Value-focused (OTB Value) and read-only.
 */
export function ChannelSiteBreakdownSection({
  channel,
  season,
}: ChannelSiteBreakdownSectionProps): React.ReactNode {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useChannelSiteMonthly({
    channel,
    season,
    page,
    page_size: PAGE_SIZE,
  });

  const rows = useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 0;
  const hasNext = data?.has_next ?? false;

  const monthCols = useMemo(() => buildMonthCols(data?.months ?? []), [data?.months]);

  // Page column totals (per month + grand total).
  const colTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    let grand = 0;
    for (const r of rows) {
      const vm = valueMap(r);
      for (const c of monthCols) totals[c.key] = (totals[c.key] ?? 0) + (vm[c.key] ?? 0);
      grand += r.total;
    }
    return { totals, grand };
  }, [rows, monthCols]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <SectionHeader
        title="Site Breakdown — Monthly OTB Value"
        subtitle="OTB value per site across the season months."
        addPadding
        actions={
          total > 0 ? (
            <Badge variant="outline" size="sm">
              {total.toLocaleString('en-IN')} sites
            </Badge>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 w-48" />
              {Array.from({ length: 6 }).map((__, j) => (
                <Skeleton key={j} className="h-4 w-20 flex-1" />
              ))}
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-4">
          <EmptyState description="Could not load the site breakdown for this channel." />
        </div>
      ) : rows.length === 0 ? (
        <div className="p-4">
          <EmptyState description="No per-site OTB is available for this channel." />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-max">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="sticky left-0 z-20 bg-gray-50 text-left text-xs font-semibold text-gray-600 px-3 py-2.5 w-[240px] min-w-[240px] border-r border-gray-200">
                    Store
                  </th>
                  {monthCols.map((c) => (
                    <th key={c.key} className="text-left text-xs font-semibold text-gray-600 px-3 py-2.5 min-w-[130px] whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                  <th className="text-left text-xs font-semibold text-gray-700 px-3 py-2.5 min-w-[140px] whitespace-nowrap border-l border-gray-200">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((store, i) => {
                  const vm = valueMap(store);
                  return (
                    <tr key={store.site || i} className="border-b border-gray-100">
                      <td className="sticky left-0 z-10 bg-white px-3 py-2.5 w-[240px] min-w-[240px] border-r border-gray-200">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 text-sm">
                            {store.store_name ?? `Store ${store.site}`}
                          </span>
                          <span className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            {location(store) && <span>{location(store)}</span>}
                            <span className="font-mono text-gray-400">{store.site}</span>
                          </span>
                        </div>
                      </td>
                      {monthCols.map((c) => (
                        <td key={c.key} className="text-left text-sm text-gray-900 px-3 py-2.5 whitespace-nowrap">
                          {formatOtbValue(vm[c.key] ?? 0)}
                        </td>
                      ))}
                      <td className="text-left text-sm font-semibold text-gray-900 px-3 py-2.5 whitespace-nowrap border-l border-gray-200">
                        {formatOtbValue(store.total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200 font-medium">
                  <td className="sticky left-0 z-10 bg-gray-50 px-3 py-3 text-gray-900 font-semibold border-r border-gray-200">
                    Total (this page)
                  </td>
                  {monthCols.map((c) => (
                    <td key={c.key} className="text-left text-sm text-gray-900 px-3 py-3 whitespace-nowrap">
                      {formatOtbValue(colTotals.totals[c.key] ?? 0)}
                    </td>
                  ))}
                  <td className="text-left text-sm text-gray-900 px-3 py-3 font-semibold whitespace-nowrap border-l border-gray-200">
                    {formatOtbValue(colTotals.grand)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {totalPages > 1 && (
            /* eslint-disable-next-line design-system/prefer-section-header -- pagination footer bar, not a section title/actions header */
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <span className="text-xs text-gray-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!hasNext}
                  onClick={() => setPage((p) => p + 1)}
                  className="cursor-pointer"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
