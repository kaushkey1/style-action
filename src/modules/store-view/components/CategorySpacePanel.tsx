import { useMemo } from 'react';
import { useUnifiedPlanningStore } from '../stores/unified-planning.store';
import {
  getCategorySpaceSummary,
  getStoreCategorySpace,
} from '@/modules/range/data/mockSpacePlanning';
import type { StoreCategorySpaceRow } from '@/modules/range/data/mockSpacePlanning';

// ── Props ──

interface CategorySpacePanelProps {
  segmentCode: string;
  storeId?: string;
}

// ── Summary Cards ──

function SummaryCards({ segmentCode, storeRow }: { segmentCode: string; storeRow?: StoreCategorySpaceRow }) {
  const summary = useMemo(() => getCategorySpaceSummary(segmentCode), [segmentCode]);

  const cards = storeRow
    ? [
        { label: 'SFT', value: storeRow.sft.toLocaleString('en-IN') },
        { label: 'GMROF', value: `\u20B9${storeRow.gmrof}/SFT` },
        { label: 'SPSF', value: `\u20B9${storeRow.spsf}` },
      ]
    : [
        { label: 'Total SFT', value: summary.totalSft.toLocaleString('en-IN') },
        { label: 'Avg GMROF', value: `\u20B9${summary.avgGmrof}/SFT` },
        { label: 'Total Fixtures', value: summary.totalFixtures.toLocaleString('en-IN') },
      ];

  return (
    /* eslint-disable-next-line design-system/prefer-metric-grid -- inline space KPIs within segment accordion; MetricGrid too heavy for this nested context */
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            {card.label}
          </p>
          <p className="text-sm font-bold tabular-nums text-gray-900">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ──

export function CategorySpacePanel({
  segmentCode,
  storeId,
}: CategorySpacePanelProps) {
  const stores = useUnifiedPlanningStore((s) => s.stores);

  const storeRow = useMemo(() => {
    if (!storeId) return undefined;
    const allRows = getStoreCategorySpace(segmentCode, stores);
    return allRows.find((r) => r.storeId === storeId);
  }, [storeId, segmentCode, stores]);

  return <SummaryCards segmentCode={segmentCode} storeRow={storeRow} />;
}
