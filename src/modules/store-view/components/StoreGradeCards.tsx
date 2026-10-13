import { SectionHeader, Badge, Skeleton, EmptyState, KpiLabel, TableMetricsInfo } from '@/components/ui';
import { cn, formatNumber, classifyRag, ragToTextClass } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { KpiThreshold } from '@/modules/admin/api/thresholdApi';
import type { StoreHealthByGradeRow } from '@/modules/category-director/api/categoryDirectorApi';

/** Metric-definition keys (in METRIC_DESCRIPTIONS) for the grade-card metrics —
 *  feeds the single mobile "Metric Definitions" bottom sheet on the section title. */
const GRADE_METRIC_KEYS: string[] = ['Avg SPSF', 'Avg GMROF', 'Conversion', 'ABV', 'Gross Margin', 'Rev/Day'];

function fmt(value: number | null | undefined, decimals = 0, prefix = '', suffix = ''): string {
  if (value == null) return '—';
  return `${prefix}${value.toFixed(decimals)}${suffix}`;
}

interface StoreGradeCardsProps {
  rows: StoreHealthByGradeRow[];
  isLoading: boolean;
  thresholds?: Map<string, KpiThreshold>;
}

const DASH = '—';

function GradeMetric({ label, value, ragClass }: { label: React.ReactNode; value: string; ragClass?: string | null }): React.ReactNode {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className={cn(
        'mt-0.5 text-sm font-semibold tabular-nums',
        value === DASH ? 'text-gray-400' : (ragClass ?? 'text-gray-900'),
      )}>
        {value}
      </p>
    </div>
  );
}

/**
 * Store Performance by Grade — one card per grade. Only DAILY (revenue/day) has a live
 * per-grade source today; SPSF/GMROF/CONV/ABV/MARGIN show "—" until their API is wired.
 */
export function StoreGradeCards({ rows, isLoading, thresholds }: StoreGradeCardsProps): React.ReactNode {
  const isMobile = useIsMobile();
  if (isLoading) {
    return (
      <div className="space-y-3">
        <SectionHeader title="Store Performance by Grade" />
        {/* eslint-disable-next-line design-system/prefer-metric-grid -- grade card skeletons, not MetricCards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const grades = rows.filter((r) => r.store_grade != null);

  return (
    <div className="space-y-3">
      <SectionHeader
        title={
          <>
            Store Performance by Grade <span className="font-normal text-gray-400">({grades.length})</span>
            <TableMetricsInfo metrics={GRADE_METRIC_KEYS} />
          </>
        }
      />
      {grades.length === 0 ? (
        <EmptyState description="No grade data for the selected filters." variant="neutral" />
      ) : (
        /* eslint-disable-next-line design-system/prefer-metric-grid -- grade cards, not the KPI strip */
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {grades.map((g) => {
            const storeCount = g.store_count ?? g.total_stores;
            const daily = g.daily_sales != null
              ? `₹${(g.daily_sales / 1e7).toFixed(1)} Cr`
              : g.revenue_per_day_cr != null
              ? `₹${g.revenue_per_day_cr.toFixed(1)} Cr`
              : DASH;
            const rag = (kpiCode: string, value: number | null | undefined) =>
              value != null ? ragToTextClass(classifyRag(value, thresholds?.get(kpiCode) ?? null)) : null;

            return (
              <div key={g.store_grade} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-lg font-semibold text-gray-900">{g.store_grade}</span>
                  <Badge variant="primary">{storeCount != null ? `${formatNumber(storeCount)} stores` : 'N/A'}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                  <GradeMetric label={isMobile ? 'SPSF' : <KpiLabel abbr="SPSF" />} value={fmt(g.spsf, 0, '₹')} ragClass={rag('salesPerSqft', g.spsf)} />
                  <GradeMetric label={isMobile ? 'GMROF' : <KpiLabel abbr="GMROF" />} value={fmt(g.gmrof, 0, '₹')} ragClass={rag('grossMargin', g.gmrof)} />
                  <GradeMetric label="CONV" value={fmt(g.pct, 2, '', '%')} ragClass={rag('conversion', g.pct)} />
                  <GradeMetric label="ABV" value={fmt(g.abv, 0, '₹')} ragClass={rag('ats', g.abv)} />
                  <GradeMetric label="MARGIN" value={fmt(g.gross_margin_pct, 1, '', '%')} ragClass={rag('grossMargin', g.gross_margin_pct)} />
                  <GradeMetric label="DAILY" value={daily} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
