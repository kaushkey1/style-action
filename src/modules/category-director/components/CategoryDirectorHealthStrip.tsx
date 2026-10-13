import { MetricCard } from '@/components/ui';
import { DashboardKpiGrid } from '@/modules/dashboard/components/DashboardKpiGrid';
import { heroKpis, type CategoryDirectorHealthKpi } from '../data/mockCategoryDirectorData';
import type { KpiCard } from '../api/categoryDirectorApi';
import { apiKpiToCategoryDirectorHealthKpi, cdStatusToRag, cdKpiSubtitle, kpiByCode } from '../lib/apiAdapters';

// HIDDEN — hero strip cards skipped in render. To unhide: remove from set.
//   'ww-otb'    — awaiting data sign-off.
//   'ww-fp-st'  — duplicate of Category Performance tab's Full-Price ST tile;
//                 PM directive: keep only on Category Performance.
//   'ww-gm'     — duplicate of Category Performance tab's Realised GM % tile;
//                 PM directive: keep only on Category Performance.
const HIDDEN_KPI_IDS = new Set(['ww-otb', 'ww-fp-st', 'ww-gm']);

// Plan/reference tiles show a constant target value, not a performance outcome.
// Suppress the RAG badge so a "warning" fallback status does not mislead users.
const PLAN_TILE_IDS = new Set(['ww-gs-aop', 'ww-sales-plan']);

// KPIs whose user-facing label was renamed on the FE (per CC Bug Tracker) but
// where the BE still returns the legacy "MD …" label. For these, we pin the
// mock (renamed) label via labelOverride so the rename is visible immediately.
const FE_RENAMED_KPI_IDS = new Set(['ww-md-pending']);

interface CategoryDirectorHealthStripProps {
  /**
   * Optional live KPI cards (from /category-performance). When provided, every
   * mock KPI is run through `apiKpiToCategoryDirectorHealthKpi` — cards with
   * real API data render live; cards the API returns as placeholder
   * (value === null / "N/A") render with value "N/A" and carry a
   * `dataGapReason`. The mock value is never substituted.
   *
   * Omit the prop (e.g. on SubcategoryDrilldownPage) to render the static mock
   * strip unchanged — that case is "no fetch initiated" rather than "API
   * returned placeholder" and is intentionally left untouched.
   */
  kpis?: KpiCard[] | null;
  /**
   * Additional cards appended to the right of the hero strip (e.g. Tab 2's
   * Season Sell-Through). Lets the caller fold a second strip into the same
   * grid so all KPIs render in one row.
   */
  extraCards?: CategoryDirectorHealthKpi[];
}

/**
 * CategoryDirectorHealthStrip — 6 hero KPIs rendered inside the Sell-Through tab
 * (Net Revenue vs Plan, Full-Price ST %, Realised GM %, MD Triggers Pending,
 * OTB Utilisation, Size Completeness).
 *
 * MOVED-HERO-KPIS: relocated 2026-05-06 from CategoryDirectorDashboardPage.tsx into
 * the Sell-Through tab. Anchor location is provisional — search the repo for
 * "MOVED-HERO-KPIS" to find every relocation reference and update them
 * together if this strip moves again.
 */
export function CategoryDirectorHealthStrip({ kpis, extraCards = [] }: CategoryDirectorHealthStripProps = {}) {
  const visibleMockKpis = heroKpis.filter((mock) => !HIDDEN_KPI_IDS.has(mock.id));
  const heroCards: CategoryDirectorHealthKpi[] = kpis
    ? visibleMockKpis.map((mock) => {
        const labelOverride = FE_RENAMED_KPI_IDS.has(mock.id) ? mock.label : undefined;
        return apiKpiToCategoryDirectorHealthKpi(kpiByCode(kpis, mock.id), mock, { labelOverride });
      })
    : visibleMockKpis;
  const cards = [...heroCards, ...extraCards];

  return (
    <DashboardKpiGrid>
      {cards.map((kpi) => (
        <MetricCard
          key={kpi.id}
          label={kpi.label}
          value={kpi.value}
          infoKey={kpi.infoKey}
          status={PLAN_TILE_IDS.has(kpi.id) ? undefined : cdStatusToRag(kpi.status)}
          subtitle={cdKpiSubtitle(kpi)}
        />
      ))}
    </DashboardKpiGrid>
  );
}
