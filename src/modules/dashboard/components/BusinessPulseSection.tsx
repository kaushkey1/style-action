import { ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";
import { CHART_AXIS_TICK, CHART_BORDER, CHART_CATEGORICAL } from "@/data/chartColors";
import { useNavigate } from "react-router-dom";
import { DrillMenu, EmptyState, SectionHeader, TableMetricsInfo, TableToolbar } from "@/components/ui";
import { useTableSearchSort } from "@/hooks/useTableSearchSort";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { getRowDrillTargets, getGradeDrillTargets, getFormatDrillTargets, getChartDrillTargets } from "@/lib/routing";
import type { BusinessPulseResponse } from "../api/dashboardApi";
import type { CategoryShare, SimpleTableConfig, DrilldownRow } from "../types/businessPulseUi";
import {
  mapCategoryChartToPie,
  mapFashionGradeTable,
  mapFormatTable,
  mapRevenueMarginTable,
  REVENUE_MARGIN_COPY,
} from "../utils/businessPulseMappers";
import { DrilldownTable } from "./DrilldownTable";
import { StandardDataTable } from "./StandardDataTable";
import { parseNumericValue } from "../utils/standardTable";
import { HEADER_TO_KPI } from "../utils/columnKpiMap";
import { AOPMobileCard } from "@/modules/aop/components/AOPMobileCard";
import { setSegmentDrill } from "../stores/segmentDrillStore";

/** Temporarily hidden — product request. Set to `true` to show again. */
const SHOW_REVENUE_BY_CATEGORY_PIE_CHART = false;

export interface BusinessPulseSectionProps {
  pulse?: BusinessPulseResponse | null;
  pulseError?: string | null;
}

function CategoryPieChart({ data }: { data: CategoryShare[] }): React.ReactNode {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Revenue by Category — Top 5" />
        <EmptyState
          title="No category mix"
          description="No category revenue breakdown returned for this filter set."
          className="py-12"
        />
      </div>
    );
  }
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader
        title="Revenue by Category — Top 5"
        actions={<DrillMenu rowLabel="categories" targets={getChartDrillTargets('category', { from: 'dashboard' })} />}
      />
      <div className="mt-3">
        <ResponsiveContainer width="100%" minWidth={0} height={260}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={0}
              dataKey="value"
              label={({ name, value }) => `${name} ${value}%`}
              labelLine={{ strokeWidth: 1, stroke: CHART_AXIS_TICK }}
            >
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={CHART_CATEGORICAL[i % CHART_CATEGORICAL.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: `1px solid ${CHART_BORDER}`,
                fontSize: 12,
              }}
              formatter={(value) => [`${value}%`, "Share"]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Mobile card view for DrilldownTable rows (Revenue & Margin by Category) */
function MobileDrilldownCards({
  title,
  subtitle,
  headers,
  rows,
  defaultSortKey,
}: {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: DrilldownRow[];
  defaultSortKey?: string;
}): React.ReactNode {
  const navigate = useNavigate();
  const sortFields: Record<string, (row: DrilldownRow) => number> = {};
  headers.slice(1).forEach((h, i) => {
    sortFields[h] = (row: DrilldownRow) => parseNumericValue(row.values[i] ?? "0");
  });

  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } = useTableSearchSort(rows, {
    searchField: (row) => row.name,
    sortFields,
    defaultSortKey,
  });

  function handleCardClick(row: DrilldownRow) {
    if (row.children?.length) {
      setSegmentDrill(row, headers);
      navigate(`/dashboard/segment/${encodeURIComponent(row.name)}`);
    }
  }

  if (rows.length === 0) {
    return (
      <div>
        <SectionHeader title={title} />
        <EmptyState title="No data" description="No segment data available." className="py-10" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          {title} <TableMetricsInfo metrics={headers.slice(1)} />
        </h3>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search segments..."
        sortColumns={headers.slice(1).map((h) => ({ key: h, label: h }))}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={(k, d) => {
          setSortKey(k);
          setSortDir(d);
        }}
      />

      {filteredRows.map((row) => (
        <AOPMobileCard
          key={row.id}
          title={row.name}
          metrics={row.values.map((val, i) => ({
            label: headers[i + 1] ?? "",
            value: val,
          }))}
          onClick={() => handleCardClick(row)}
          showChevron={!!row.children?.length}
          className={!row.children?.length ? "cursor-default" : undefined}
        />
      ))}
      {filteredRows.length === 0 && search && (
        <EmptyState title="No results" description={`No segments matching "${search}"`} variant="neutral" />
      )}
    </div>
  );
}

export function BusinessPulseSection({
  pulse = null,
  pulseError = null,
}: BusinessPulseSectionProps = {}): React.ReactNode {
  const isMobile = useIsMobile();
  const hasPulse = Boolean(pulse) && !pulseError;

  const categoryPie: CategoryShare[] =
    SHOW_REVENUE_BY_CATEGORY_PIE_CHART && hasPulse && pulse!.category_revenue_chart?.length
      ? mapCategoryChartToPie(pulse!.category_revenue_chart)
      : [];

  const marginTable = {
    title: REVENUE_MARGIN_COPY.title,
    headers: [...REVENUE_MARGIN_COPY.headers],
    rows: hasPulse && pulse!.revenue_margin_table?.length ? mapRevenueMarginTable(pulse!.revenue_margin_table) : [],
  };

  const fashionConfig: SimpleTableConfig = hasPulse
    ? mapFashionGradeTable(pulse!.fashion_grade_table ?? [])
    : mapFashionGradeTable([]);

  const formatConfig: SimpleTableConfig = hasPulse ? mapFormatTable(pulse!.format_table ?? []) : mapFormatTable([]);

  const dataNotice = hasPulse ? pulse!.data_notice?.trim() : undefined;

  return (
    <div className="space-y-4">
      {pulseError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
          <span className="font-medium">Business Pulse could not be loaded.</span>{" "}
          <span className="text-red-800/90">{pulseError}</span>
        </div>
      ) : null}

      {dataNotice ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {dataNotice}
        </div>
      ) : null}

      {!hasPulse && !pulseError ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
          Business Pulse data is available when using a dashboard persona connected to the API.
        </div>
      ) : null}

      {SHOW_REVENUE_BY_CATEGORY_PIE_CHART ? (
        <div className="grid grid-cols-1 gap-4">
          <CategoryPieChart data={categoryPie} />
        </div>
      ) : null}

      {isMobile ? (
        <MobileDrilldownCards
          title={marginTable.title}
          headers={marginTable.headers}
          rows={marginTable.rows}
          defaultSortKey="Net Revenue"
        />
      ) : (
        <DrilldownTable
          title={marginTable.title}
          headers={marginTable.headers}
          rows={marginTable.rows}
          searchable
          sortUrlParamPrefix="bpSegment"
          defaultSortKey="Net Revenue"
          enableColumnManagement
          rowActions={({ row, depth, parentName }) => (
            <DrillMenu
              rowLabel={row.name}
              targets={getRowDrillTargets(
                depth === 0
                  ? { category: row.name, from: 'dashboard' }
                  : { category: parentName, subCategory: row.name, from: 'dashboard' },
              )}
            />
          )}
          columnKpiCodes={marginTable.headers.slice(1).map((h) => HEADER_TO_KPI[h] ?? null)}
        />
      )}

      {/* Fashion grade defaults to Net Revenue sort (Gross Revenue is a placeholder until the BE ships it). */}
      <StandardDataTable
        config={fashionConfig}
        searchable
        searchPlaceholder="Search fashion grade..."
        sortUrlParamPrefix="bpFashion"
        defaultSortKey="Net Revenue"
        enableColumnManagement
        rowActions={(row) => (row[0] ? <DrillMenu rowLabel={row[0]} targets={getGradeDrillTargets(row[0], 'dashboard')} /> : null)}
        columnKpiCodes={fashionConfig.headers.slice(1).map((h) => HEADER_TO_KPI[h] ?? null)}
      />
      <StandardDataTable
        config={formatConfig}
        searchable
        searchPlaceholder="Search formats..."
        sortUrlParamPrefix="bpFormat"
        enableColumnManagement
        rowActions={(row) => (row[0] ? <DrillMenu rowLabel={row[0]} targets={getFormatDrillTargets(row[0], 'dashboard')} /> : null)}
        columnKpiCodes={formatConfig.headers.slice(1).map((h) => HEADER_TO_KPI[h] ?? null)}
      />
    </div>
  );
}
