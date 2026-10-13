import {
  MetricCard,
  SectionHeader,
  EmptyState,
} from '@/components/ui';
import { useMemo } from 'react';
import type { CategoryDirectorFilters } from '../stores/useCategoryDirectorFilterStore';
import { DashboardKpiGrid } from '@/modules/dashboard/components/DashboardKpiGrid';
import type {
  StoreHealthRow,
  CategoryDirectorHealthKpi,
} from '../data/mockCategoryDirectorData';
import { useStoreDistribution } from '../api/categoryDirectorHooks';
import {
  apiKpiToCategoryDirectorHealthKpi,
  cdStatusToRag,
  cdKpiSubtitle,
  kpiByCode,
  revPerStoreLabelOverride,
  storeHealthByGradeToRows,
  storesValueFormatToDisplay,
} from '../lib/apiAdapters';
import { StoreHealthSection } from './StoreHealthSection';

// ---------------------------------------------------------------------------
// Reallocation Suggestions — data gap, no API field today
// ---------------------------------------------------------------------------

function ReallocationSection() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Reallocation Suggestions" />
      <EmptyState
        title="Data integration in progress"
        description="Reallocation suggestions will appear once the AI agent surfaces transfer candidates."
        variant="neutral"
        className="py-6"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI display config (FE-only — values always come from the API)
// ---------------------------------------------------------------------------

type StoreKpiMeta = {
  id: string;
  label: string;
  target: string;
  infoKey: string;
};

const STORE_KPI_META: StoreKpiMeta[] = [
  { id: 'ww-stores',      label: 'Stores Carrying WW',  target: '—',         infoKey: 'Stores Carrying WW' },
  { id: 'ww-right-stock', label: 'Right-Stocked',       target: '≥1,600',    infoKey: 'Right-Stocked' },
  { id: 'ww-rev-store',   label: 'Rev per Store',       target: '≥₹7.0L', infoKey: 'Rev/Day' },
  { id: 'ww-ajio-sla',    label: 'Ajio SLA %',          target: '≥95%',      infoKey: 'Ajio SLA %' },
];

// ---------------------------------------------------------------------------
// Main tab
// ---------------------------------------------------------------------------

export function StoreDistributionTab({ filters }: { filters: CategoryDirectorFilters }) {
  const { data } = useStoreDistribution(filters);

  // 4 KPI cards:
  //   ww-stores       → live, format " of " → " / "
  //   ww-right-stock  → data gap (API N/A); renders "N/A" via adapter
  //   ww-rev-store    → live, label override "Revenue / Store / Day" → "Rev per Store"
  //   ww-ajio-sla     → data gap; renders "N/A" via adapter
  const kpiCards = useMemo<CategoryDirectorHealthKpi[]>(() => {
    return STORE_KPI_META.map((meta) => {
      const card = kpiByCode(data?.kpi_cards, meta.id);
      const frame: CategoryDirectorHealthKpi = {
        id: meta.id,
        label: meta.label,
        value: 'N/A',
        target: meta.target,
        status: 'warning',
        trendDelta: 0,
        trendLabel: 'vs LW',
        trendDirection: 'flat',
        infoKey: meta.infoKey,
      };
      if (meta.id === 'ww-stores' && card && !card.value_formatted.toUpperCase().includes('N/A')) {
        // Live but with display format swap; bypass placeholder fallback.
        return {
          ...frame,
          label: card.label,
          value: storesValueFormatToDisplay(card.value_formatted),
        };
      }
      if (meta.id === 'ww-rev-store' && card && card.value !== null) {
        return apiKpiToCategoryDirectorHealthKpi(card, frame, {
          labelOverride: revPerStoreLabelOverride(),
        });
      }
      return apiKpiToCategoryDirectorHealthKpi(card, frame);
    });
  }, [data?.kpi_cards]);

  // Live "Store Health by Grade" rows. Render an empty table (handled by the
  // section's EmptyState path) when the API returns no rows for the current
  // filter — never silently fall back to mock numbers.
  const storeHealthRows = useMemo<StoreHealthRow[]>(
    () => storeHealthByGradeToRows(data?.store_health_by_grade) ?? [],
    [data?.store_health_by_grade],
  );

  return (
    <div className="space-y-4">
      <DashboardKpiGrid>
        {kpiCards.map((kpi) => (
          <MetricCard
            key={kpi.id}
            label={kpi.label}
            value={kpi.value}
            infoKey={kpi.infoKey}
            status={cdStatusToRag(kpi.status)}
            subtitle={cdKpiSubtitle(kpi)}
          />
        ))}
      </DashboardKpiGrid>

      <StoreHealthSection rows={storeHealthRows} />
      <ReallocationSection />
    </div>
  );
}
