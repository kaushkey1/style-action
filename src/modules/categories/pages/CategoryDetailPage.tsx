import { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  Cell,
} from 'recharts';
import { AlertCircle, RefreshCw } from 'lucide-react';
import {
  PageHeader,
  Badge,
  MetricCard,
  MetricGrid,
  Card,
  SectionHeader,
  EmptyState,
  Button,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  ChartTooltipContent,
  ChartLegendContent,
} from '@/components/ui';
import { cn, ragBadgeVariant, ragLabel, toTitleCase } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { ChartCard } from '@/modules/dashboard/components/ChartCard';
import {
  CHART_ACTUAL,
  CHART_PLAN,
  CHART_SEQUENTIAL,
  CHART_GRID,
  CHART_AXIS_TICK,
} from '@/data/chartColors';
import { useCategoryPerformance, useFilterOptions } from '@/modules/category-director/api/categoryDirectorHooks';
import { cdStatusToRag, cdKpiSubtitle, stripIndexPrefix } from '@/modules/category-director/lib/apiAdapters';
import { useCategoriesFilterStore } from '../stores/useCategoriesFilterStore';
import {
  selectKpiCards,
  deriveCategoryStatus,
  toSubcategoryRows,
  toSubcatRevenueVsPlan,
  toSubcatRevenueMix,
  DETAIL_KPI_META,
} from '../api/categoriesAdapters';
import { useCategoryInsights } from '../api/categoryInsightsApi';
import { CategoryActionCards } from '../components/CategoryActionCards';
import { CategoryActionsRail } from '../components/CategoryActionsRail';
import { CategoryDetailShimmer } from '../components/CategoryDetailShimmer';

const aopChartConfig = {
  actual: { label: 'Actual', color: CHART_ACTUAL },
  plan: { label: 'AOP Plan', color: CHART_PLAN },
};

export function CategoryDetailPage(): React.ReactNode {
  const { categoryName } = useParams<{ categoryName: string }>();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();

  const decodedName = categoryName ? decodeURIComponent(categoryName) : '';

  // Base filters: prefer store state, but fall back to URL params so that a
  // direct deep-link (or browser refresh on the detail URL) still works.
  const storeFilters = useCategoriesFilterStore((s) => s.filters);
  const baseFilters = useMemo(() => {
    const urlDateFrom = searchParams.get('dateFrom');
    const urlDateTo = searchParams.get('dateTo');
    const urlFormat = searchParams.get('format');
    const urlBrand = searchParams.get('brand');
    const urlCategory = searchParams.get('category');
    const urlFashionGrade = searchParams.get('fashionGrade');
    const hasUrlFilters = !!(urlDateFrom || urlDateTo || urlFormat || urlBrand || urlCategory || urlFashionGrade);
    if (hasUrlFilters) {
      return {
        ...storeFilters,
        dateFrom: urlDateFrom ?? storeFilters.dateFrom,
        dateTo: urlDateTo ?? storeFilters.dateTo,
        format: urlFormat ?? storeFilters.format,
        brand: urlBrand ?? storeFilters.brand,
        fashionGrade: urlFashionGrade ?? storeFilters.fashionGrade,
      };
    }
    return storeFilters;
  }, [searchParams, storeFilters]);

  // Back link preserves the current URL params on the list page.
  const backPath = `/categories${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

  // Resolve the raw API category value ("1. MEN APPAREL") from the stripped
  // route name ("MEN APPAREL") so the API filter contract is exact.
  const { data: apiFilters } = useFilterOptions(baseFilters);
  const rawCategoryName = useMemo(() => {
    const match = apiFilters?.categories?.find(
      (c) => stripIndexPrefix(c).toUpperCase() === decodedName.toUpperCase(),
    );
    return match ?? decodedName;
  }, [apiFilters?.categories, decodedName]);

  const detailFilters = useMemo(
    () => ({ ...baseFilters, category: rawCategoryName, subcategory: 'all' }),
    [baseFilters, rawCategoryName],
  );

  const { data, isLoading, isError, refetch } = useCategoryPerformance(detailFilters);

  const { data: insights, isLoading: insightsLoading } = useCategoryInsights(
    rawCategoryName || undefined,
  );

  const categoryRow = useMemo(
    () => data?.category_perf_table?.find((r) => r.category === rawCategoryName),
    [data?.category_perf_table, rawCategoryName],
  );

  const status = categoryRow ? deriveCategoryStatus(categoryRow) : undefined;
  const hasPlan =
    categoryRow?.plan_net_sales !== null &&
    categoryRow?.plan_net_sales !== undefined &&
    Number.isFinite(categoryRow?.plan_net_sales) &&
    categoryRow?.plan_net_sales !== 0;

  const kpiCards = useMemo(() => selectKpiCards(data?.kpi_cards, DETAIL_KPI_META), [data?.kpi_cards]);
  const subRows = useMemo(
    () => toSubcategoryRows(data?.subcategory_drilldown, rawCategoryName),
    [data?.subcategory_drilldown, rawCategoryName],
  );
  const revenueVsPlan = useMemo(
    () => toSubcatRevenueVsPlan(data?.subcategory_drilldown, rawCategoryName),
    [data?.subcategory_drilldown, rawCategoryName],
  );
  const revenueMix = useMemo(
    () => toSubcatRevenueMix(data?.subcategory_drilldown, rawCategoryName),
    [data?.subcategory_drilldown, rawCategoryName],
  );
  const mixMax = useMemo(
    () => revenueMix.reduce((m, d) => Math.max(m, d.value), 0),
    [revenueMix],
  );

  const titleBadge = status ? (
    hasPlan ? (
      <Badge variant={ragBadgeVariant(status)}>{ragLabel(status)}</Badge>
    ) : (
      <Badge variant="default">No plan set</Badge>
    )
  ) : undefined;

  return (
    <div className="space-y-4 animate-fadeInUp">
      <PageHeader
        title={toTitleCase(decodedName || 'Category')}
        backTo={{ label: 'All categories', path: backPath }}
        badges={titleBadge}
      />

      {isError ? (
        <EmptyState
          title="Couldn't load this category"
          description="The dashboard service didn't respond. Try again in a moment."
          icon={AlertCircle}
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-1.5" /> Retry
            </Button>
          }
        />
      ) : isLoading && !data ? (
        <CategoryDetailShimmer />
      ) : !categoryRow ? (
        <EmptyState
          title="Category not found"
          description={`No data for "${decodedName}". It may not exist for the current filters.`}
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-1.5" /> Retry
            </Button>
          }
        />
      ) : (
        <>
          {/* KPIs: 1-per-row on phones, 2-col on tablet (md), 4-col on desktop (lg) — matches the list. */}
          <MetricGrid columns={4} className="xs:grid-cols-1 md:grid-cols-2">
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
          </MetricGrid>

          <CategoryActionCards
            summary={insights?.summary}

            isLoading={insightsLoading}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <ChartCard title="Net Revenue vs AOP by sub-category (₹ Cr)">
              <div className="h-[320px]">
                {revenueVsPlan.length === 0 ? (
                  <EmptyState
                    description="No sub-category data for this window"
                    className="h-full flex flex-col items-center justify-center"
                  />
                ) : (
                  <ResponsiveContainer width="100%" minWidth={0} height={320}>
                    <BarChart
                      data={revenueVsPlan}
                      layout="vertical"
                      margin={{ top: 8, right: 12, bottom: 8, left: 5 }}
                      barCategoryGap={isMobile ? 4 : 8}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 12, fill: CHART_AXIS_TICK }}
                        tickLine={false}
                        axisLine={false}
                        hide={isMobile}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: isMobile ? 10 : 12, fill: CHART_AXIS_TICK }}
                        tickLine={false}
                        axisLine={false}
                        width={isMobile ? 110 : 170}
                        interval={0}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                        content={<ChartTooltipContent config={aopChartConfig} valueFormatter={(v) => `₹${v} Cr`} />}
                      />
                      <Legend verticalAlign="top" align="right" content={<ChartLegendContent config={aopChartConfig} />} />
                      <Bar dataKey="actual" fill={CHART_ACTUAL} radius={[0, 4, 4, 0]} barSize={12} />
                      <Bar dataKey="plan" fill={CHART_PLAN} radius={[0, 4, 4, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>

            <ChartCard title="Net Revenue mix by sub-category">
              <div className="h-[320px]">
                {revenueMix.length === 0 ? (
                  <EmptyState
                    description="No sub-category data for this window"
                    className="h-full flex flex-col items-center justify-center"
                  />
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-4 h-full">
                    <div className="w-[180px] h-[180px] shrink-0">
                      <ResponsiveContainer width="100%" minWidth={0} height={180}>
                        <RadialBarChart
                          data={revenueMix}
                          cx="50%"
                          cy="50%"
                          innerRadius="30%"
                          outerRadius="100%"
                          startAngle={90}
                          endAngle={-270}
                        >
                          <PolarAngleAxis type="number" domain={[0, mixMax]} angleAxisId={0} tick={false} />
                          <RadialBar dataKey="value" angleAxisId={0} background={{ fill: CHART_GRID }} cornerRadius={6}>
                            {revenueMix.map((_, i) => (
                              <Cell key={i} fill={CHART_SEQUENTIAL[i % CHART_SEQUENTIAL.length]} />
                            ))}
                          </RadialBar>
                          <Tooltip
                            cursor={false}
                            content={<ChartTooltipContent valueFormatter={(v) => `₹${v} Cr`} />}
                          />
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="flex-1 w-full space-y-1.5 overflow-y-auto max-h-[280px]">
                      {revenueMix.map((d, i) => (
                        <li key={d.name} className="flex items-center gap-2 text-xs">
                          <span
                            className="w-2 h-2 rounded-sm shrink-0"
                            // eslint-disable-next-line no-restricted-syntax -- dynamic slice colour from the chart ramp
                            style={{ backgroundColor: CHART_SEQUENTIAL[i % CHART_SEQUENTIAL.length] }}
                          />
                          <span className="flex-1 text-gray-700 truncate">{d.name}</span>
                          <span className="text-gray-500">{d.sharePct.toFixed(1)}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </ChartCard>
          </div>

          {/* eslint-disable-next-line design-system/prefer-metric-grid -- content + actions-rail layout, not a metric grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-3 gap-y-4 lg:gap-y-3 items-start">
            {isMobile ? (
              // Mobile: no card wrapper — each sub-category card owns its container
              // (no card-in-card), matching the categories list.
              <div>
                <SectionHeader title="Sub-Category Performance" />
                {subRows.length === 0 ? (
                  <EmptyState
                    title="No sub-categories"
                    description="No sub-category data for the current filters."
                  />
                ) : (
                  <div className="space-y-3">
                    {subRows.map((row) => (
                      <div
                        key={row.name}
                        className="bg-white rounded-lg border border-gray-200 p-3"
                      >
                        <h4 className="text-base font-semibold text-gray-900 mb-2 truncate">
                          {row.name}
                        </h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div>
                            <span className="text-xs text-gray-500">Net Revenue</span>
                            <span className="block text-sm font-medium text-gray-900 tabular-nums">
                              {row.netRevenueFormatted}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">
                              AOP Net Revenue
                            </span>
                            <span className="block text-sm font-medium text-gray-900 tabular-nums">
                              {row.planRevenueFormatted}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Var to plan</span>
                            <span
                              className={cn(
                                "block text-sm font-medium tabular-nums",
                                row.variancePct === null
                                  ? "text-gray-400"
                                  : row.variancePct >= 0
                                    ? "text-green-600"
                                    : "text-red-600",
                              )}
                            >
                              {row.varianceFormatted}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">GM%</span>
                            <span className="block text-sm font-medium text-gray-900 tabular-nums">
                              {row.gmPctFormatted}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">
                              Intake Margin%
                            </span>
                            <span className="block text-sm font-medium text-gray-900 tabular-nums">
                              {row.intakeMarginFormatted}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Card className="p-4 lg:col-span-2">
                <SectionHeader title="Sub-Category Performance" />
                {subRows.length === 0 ? (
                  <EmptyState
                    title="No sub-categories"
                    description="No sub-category data for the current filters."
                  />
                ) : (
                  <DataTable minWidth="720px" className="[&_table]:text-sm">
                    <DataTableHeader>
                      <DataTableHead>Sub-category</DataTableHead>
                      <DataTableHead>Net Revenue</DataTableHead>
                      <DataTableHead>AOP Net Revenue</DataTableHead>
                      <DataTableHead>Var to plan</DataTableHead>
                      <DataTableHead>GM%</DataTableHead>
                      <DataTableHead>Intake Margin%</DataTableHead>
                    </DataTableHeader>
                    <DataTableBody>
                      {subRows.map((row) => (
                        <DataTableRow key={row.name}>
                          <DataTableCell>
                            <span className="font-medium text-gray-900">{row.name}</span>
                          </DataTableCell>
                          <DataTableCell>{row.netRevenueFormatted}</DataTableCell>
                          <DataTableCell>{row.planRevenueFormatted}</DataTableCell>
                          <DataTableCell>
                            <span
                              className={cn(
                                'font-medium',
                                row.variancePct === null
                                  ? 'text-gray-400'
                                  : row.variancePct >= 0
                                    ? 'text-green-600'
                                    : 'text-red-600',
                              )}
                            >
                              {row.varianceFormatted}
                            </span>
                          </DataTableCell>
                          <DataTableCell>{row.gmPctFormatted}</DataTableCell>
                          <DataTableCell>{row.intakeMarginFormatted}</DataTableCell>
                        </DataTableRow>
                      ))}
                    </DataTableBody>
                  </DataTable>
                )}
              </Card>
            )}

            <CategoryActionsRail
              topTasks={insights?.top_tasks}
              categoryCode={rawCategoryName || undefined}
              isLoading={insightsLoading}
            />
          </div>
        </>
      )}
    </div>
  );
}
