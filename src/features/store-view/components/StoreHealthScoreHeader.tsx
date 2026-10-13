import { Badge, MetricCard } from '@/components/ui';
import type { StoreAuditData } from '@/modules/store-view/types/storeAudit.types';
import type { AuditRating } from '@/modules/store-view/types/storeAudit.types';

function ratingBadgeVariant(rating: AuditRating): 'success' | 'warning' | 'error' {
  switch (rating) {
    case 'Good': return 'success';
    case 'Amber': return 'warning';
    case 'Red': return 'error';
  }
}

interface StoreHealthScoreHeaderProps {
  data: StoreAuditData;
  storeName?: string;
}

export function StoreHealthScoreHeader({ data, storeName }: StoreHealthScoreHeaderProps) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-4">
      {/* Score Header Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {/* eslint-disable-next-line design-system/prefer-section-header -- custom score header with badge and audit info, not a standard section title */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Store Health Score</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-gray-900">{data.overallScore.toFixed(2)}</span>
              <span className="text-sm text-gray-400">/ 3.00</span>
            </div>
            {storeName && (
              <p className="text-xs text-gray-500 mt-1">
                Audit: {data.storeName} ({data.city}) &middot; Code: {data.storeCode}
              </p>
            )}
          </div>
          <Badge variant={ratingBadgeVariant(data.overallRating)} size="lg">
            {data.overallRating}
          </Badge>
        </div>
      </div>

      {/* Summary Metrics Row */}
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- custom 5-col grid with clickable metric cards and scroll-to actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        <MetricCard
          label="Overall Score"
          value={data.overallScore.toFixed(2)}
          subtitle="out of 3.00"
        />
        <MetricCard
          label="Overall Rating"
          value={data.overallRating}
          subtitle={data.overallScore >= 2.5 ? '≥ 2.50' : data.overallScore >= 1.8 ? '1.80 – 2.49' : '< 1.80'}
          badge={<Badge variant={ratingBadgeVariant(data.overallRating)} size="sm">{data.overallRating}</Badge>}
        />
        <button onClick={() => scrollTo('section-s0')} className="text-left cursor-pointer hover:border-gray-300 transition-all rounded-lg">
          <MetricCard
            label="S0 Critical"
            value={data.s0Count}
            subtitle="Fix within 48 hours"
            className="h-full"
          >
            {data.s0Count > 0 && <div className="mt-1 text-xs font-semibold text-red-700">{data.s0Count} issues</div>}
          </MetricCard>
        </button>
        <button onClick={() => scrollTo('section-s1')} className="text-left cursor-pointer hover:border-gray-300 transition-all rounded-lg">
          <MetricCard
            label="S1 High"
            value={data.s1Count}
            subtitle="Fix within 7 days"
            className="h-full"
          >
            {data.s1Count > 0 && <div className="mt-1 text-xs font-semibold text-amber-700">{data.s1Count} issues</div>}
          </MetricCard>
        </button>
        <button onClick={() => scrollTo('section-s2')} className="text-left cursor-pointer hover:border-gray-300 transition-all rounded-lg">
          <MetricCard
            label="S2 Medium"
            value={data.s2Count}
            subtitle="Fix within 30 days"
            className="h-full"
          >
            {data.s2Count > 0 && <div className="mt-1 text-xs font-semibold text-blue-700">{data.s2Count} issues</div>}
          </MetricCard>
        </button>
      </div>
    </div>
  );
}
