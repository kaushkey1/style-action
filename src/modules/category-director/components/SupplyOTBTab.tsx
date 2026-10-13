import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  MetricCard,
  SectionHeader,
  InfoHeaderIcon,
  ChartTooltipContent,
  ChartLegendContent,
  TableToolbar,
  TableMetricsInfo,
  EmptyState,
} from '@/components/ui';
import { useMemo } from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useTableSearchSort } from '@/hooks/useTableSearchSort';
import type { CategoryDirectorFilters } from '../stores/useCategoryDirectorFilterStore';
import { ChartCard } from '@/modules/dashboard/components/ChartCard';
import { DashboardKpiGrid } from '@/modules/dashboard/components/DashboardKpiGrid';
import { AOPMobileCard } from '@/modules/aop/components/AOPMobileCard';
import {
  CHART_PRIMARY, CHART_BASELINE, CHART_CATEGORICAL,
  CHART_GRID, CHART_AXIS_TICK,
} from '@/data/chartColors';
import {
  supplyKpis, otbByClassData, vendorDeliveryData,
  otbTrackerRows, activePORows, intakeMarginRows,
  type OtbTrackerRow,
  type ActivePoRow,
  type IntakeMarginRow,
  type CategoryDirectorHealthKpi,
} from '../data/mockCategoryDirectorData';
import { getCurrencySymbol } from '@/lib/utils';
import { useSupplyOtb } from '../api/categoryDirectorHooks';
import { useHeroKpiStore } from '../stores/useHeroKpiStore';
import {
  apiKpiToCategoryDirectorHealthKpi,
  cdStatusToRag,
  cdKpiSubtitle,
  kpiByCode,
  stripIndexPrefix,
  vendorDeliveryToChart,
} from '../lib/apiAdapters';

const SUPPLY_KPI_API_CODES: Record<string, string | null> = {
  'ww-otb2': null,
  'ww-otb-rem': null,
  'ww-chase': 'ww-chase',
  'ww-vendor-conc': 'ww-vendor-conc',
  'ww-sample': null,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseNumeric(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

// ---------------------------------------------------------------------------
// OTB Tracker
// ---------------------------------------------------------------------------

const OTB_TRACKER_HEADERS = ['Category', 'Budget', '# POs', 'Committed', 'Open', 'Util %', 'Remaining'];
const OTB_TRACKER_INFO_KEYS: Record<string, string> = {
  Category: 'Category',
  Budget: 'Budget',
  '# POs': '# POs',
  Committed: 'Committed',
  Open: 'Open',
  'Util %': 'Util %',
  Remaining: 'Remaining',
};
const OTB_TRACKER_SORT_FIELDS: Record<string, (r: OtbTrackerRow) => number> = {
  Budget: (r) => parseNumeric(r.budget),
  Committed: (r) => parseNumeric(r.committed),
  'Util %': (r) => parseNumeric(r.utilPct),
  Remaining: (r) => parseNumeric(r.remaining),
};
const OTB_TRACKER_SORT_COLUMNS = Object.keys(OTB_TRACKER_SORT_FIELDS).map((k) => ({ key: k, label: k }));

function OtbTrackerSection({ categoryFilter }: { categoryFilter: string }) {
  const isMobile = useIsMobile();
  const preFiltered = useMemo(() => {
    if (categoryFilter === 'all') return otbTrackerRows;
    const target = stripIndexPrefix(categoryFilter);
    return otbTrackerRows.filter((r) => r.category === target);
  }, [categoryFilter]);
  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } =
    useTableSearchSort(preFiltered, {
      searchField: (r) => r.category,
      sortFields: OTB_TRACKER_SORT_FIELDS,
    });

  const toolbar = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search categories..."
      sortColumns={OTB_TRACKER_SORT_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => { setSortKey(k); setSortDir(d); }}
    />
  );

  if (isMobile) {
    return (
      <div className="space-y-3">
        <SectionHeader
          title={<>OTB Tracker <TableMetricsInfo metrics={Object.keys(OTB_TRACKER_INFO_KEYS)} /></>}
          actions={toolbar}
        />
        {filteredRows.map((r) => (
          <AOPMobileCard
            key={r.category}
            title={stripIndexPrefix(r.category)}
            metrics={[
              { label: 'Budget', value: r.budget },
              { label: '# POs', value: r.numPos },
              { label: 'Committed', value: r.committed },
              { label: 'Open', value: r.open },
              { label: 'Util %', value: r.utilPct },
              { label: 'Remaining', value: r.remaining },
            ]}
            onClick={() => {}}
            className="cursor-default"
            showChevron={false}
          />
        ))}
        {filteredRows.length === 0 && search && (
          <EmptyState title="No results" description={`No classes matching "${search}"`} variant="neutral" />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="OTB Tracker" actions={toolbar} />
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {OTB_TRACKER_HEADERS.map((h) => (
                <th key={h} className="text-left py-2.5 px-3 font-medium text-gray-500 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    {h}
                    {OTB_TRACKER_INFO_KEYS[h] && <InfoHeaderIcon metricKey={OTB_TRACKER_INFO_KEYS[h]} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 && search ? (
              <tr>
                <td colSpan={OTB_TRACKER_HEADERS.length} className="py-6">
                  <EmptyState title="No results" description={`No classes matching "${search}"`} variant="neutral" className="py-6" />
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr key={r.category} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2 px-3 font-medium text-gray-900">{stripIndexPrefix(r.category)}</td>
                  <td className="py-2 px-3 text-gray-700">{r.budget}</td>
                  <td className="py-2 px-3 text-gray-700">{r.numPos}</td>
                  <td className="py-2 px-3 text-gray-700">{r.committed}</td>
                  <td className="py-2 px-3 text-gray-700">{r.open}</td>
                  <td className="py-2 px-3 text-gray-700">{r.utilPct}</td>
                  <td className="py-2 px-3 text-gray-700">{r.remaining}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Active POs
// ---------------------------------------------------------------------------

const ACTIVE_PO_HEADERS = ['PO #', 'Vendor', 'Option', 'Units', 'Order Date', 'Expected', 'Actual', 'Status'];
const ACTIVE_PO_INFO_KEYS: Record<string, string> = {
  'PO #': 'PO #',
  Vendor: 'Vendor',
  Option: 'Option',
  Units: 'Units',
  'Order Date': 'Order Date',
  Expected: 'Expected',
  Actual: 'Actual',
  Status: 'Status',
};
const ACTIVE_PO_SORT_FIELDS: Record<string, (r: ActivePoRow) => number> = {
  Units: (r) => parseNumeric(r.units),
};
const ACTIVE_PO_SORT_COLUMNS = Object.keys(ACTIVE_PO_SORT_FIELDS).map((k) => ({ key: k, label: k }));

function ActivePoSection() {
  const isMobile = useIsMobile();
  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } =
    useTableSearchSort(activePORows, {
      searchField: (r) => `${r.poNumber} ${r.vendor} ${r.optionId} ${r.status}`,
      sortFields: ACTIVE_PO_SORT_FIELDS,
    });

  const toolbar = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search POs..."
      sortColumns={ACTIVE_PO_SORT_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => { setSortKey(k); setSortDir(d); }}
    />
  );

  if (isMobile) {
    return (
      <div className="space-y-3">
        <SectionHeader
          title={<>Active Purchase Orders <TableMetricsInfo metrics={Object.keys(ACTIVE_PO_INFO_KEYS)} /></>}
          actions={toolbar}
        />
        {filteredRows.map((r) => (
          <AOPMobileCard
            key={r.poNumber}
            title={r.poNumber}
            metrics={[
              { label: 'Vendor', value: r.vendor },
              { label: 'Option', value: r.optionId },
              { label: 'Units', value: r.units },
              { label: 'Order Date', value: r.orderDate },
              { label: 'Expected', value: r.expected },
              { label: 'Actual', value: r.actual },
              { label: 'Status', value: r.status },
            ]}
            onClick={() => {}}
            className="cursor-default"
            showChevron={false}
          />
        ))}
        {filteredRows.length === 0 && search && (
          <EmptyState title="No results" description={`No POs matching "${search}"`} variant="neutral" />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Active Purchase Orders" actions={toolbar} />
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {ACTIVE_PO_HEADERS.map((h) => (
                <th key={h} className="text-left py-2.5 px-3 font-medium text-gray-500 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    {h}
                    {ACTIVE_PO_INFO_KEYS[h] && <InfoHeaderIcon metricKey={ACTIVE_PO_INFO_KEYS[h]} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 && search ? (
              <tr>
                <td colSpan={ACTIVE_PO_HEADERS.length} className="py-6">
                  <EmptyState title="No results" description={`No POs matching "${search}"`} variant="neutral" className="py-6" />
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr key={r.poNumber} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2 px-3 font-medium text-gray-900">{r.poNumber}</td>
                  <td className="py-2 px-3 text-gray-700">{r.vendor}</td>
                  <td className="py-2 px-3 text-gray-700">{r.optionId}</td>
                  <td className="py-2 px-3 text-gray-700">{r.units}</td>
                  <td className="py-2 px-3 text-gray-700">{r.orderDate}</td>
                  <td className="py-2 px-3 text-gray-700">{r.expected}</td>
                  <td className="py-2 px-3 text-gray-700">{r.actual}</td>
                  <td className="py-2 px-3 text-gray-700">{r.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Intake Margin Tracker
// ---------------------------------------------------------------------------

const INTAKE_MARGIN_HEADERS = ['PO #', 'Vendor', 'Subcategory', 'Date', 'Intake Value', 'IM %', 'GRN', 'Owner'];
const INTAKE_MARGIN_INFO_KEYS: Record<string, string> = {
  'PO #': 'PO #',
  Vendor: 'Vendor',
  Subcategory: 'Subcategory',
  Date: 'Date',
  'Intake Value': 'Intake Value',
  'IM %': 'IM %',
  GRN: 'GRN',
  Owner: 'Owner',
};
const INTAKE_MARGIN_SORT_FIELDS: Record<string, (r: IntakeMarginRow) => number> = {
  'Intake Value': (r) => parseNumeric(r.intakeValue),
  'IM %': (r) => parseNumeric(r.imPct),
};
const INTAKE_MARGIN_SORT_COLUMNS = Object.keys(INTAKE_MARGIN_SORT_FIELDS).map((k) => ({ key: k, label: k }));

function IntakeMarginSection() {
  const isMobile = useIsMobile();
  // Mock-only data-gap section. The Category/Subcategory dropdown values come
  // from the live /filters API (numbered strings) and don't intersect with
  // these hardcoded mock rows, so we render all rows unfiltered.
  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } =
    useTableSearchSort(intakeMarginRows, {
      searchField: (r) => `${r.poNumber} ${r.vendor} ${r.subcategory} ${r.owner}`,
      sortFields: INTAKE_MARGIN_SORT_FIELDS,
    });

  const toolbar = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search intake..."
      sortColumns={INTAKE_MARGIN_SORT_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => { setSortKey(k); setSortDir(d); }}
    />
  );

  if (isMobile) {
    return (
      <div className="space-y-3">
        <SectionHeader
          title={<>Intake Margin Tracker <TableMetricsInfo metrics={Object.keys(INTAKE_MARGIN_INFO_KEYS)} /></>}
          actions={toolbar}
        />
        {filteredRows.map((r) => (
          <AOPMobileCard
            key={r.poNumber}
            title={r.poNumber}
            metrics={[
              { label: 'Vendor', value: r.vendor },
              { label: 'Subcategory', value: stripIndexPrefix(r.subcategory) },
              { label: 'Date', value: r.date },
              { label: 'Intake Value', value: r.intakeValue },
              { label: 'IM %', value: r.imPct },
              { label: 'GRN', value: r.grn },
              { label: 'Owner', value: r.owner },
            ]}
            onClick={() => {}}
            className="cursor-default"
            showChevron={false}
          />
        ))}
        {filteredRows.length === 0 && search && (
          <EmptyState title="No results" description={`No intake matching "${search}"`} variant="neutral" />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Intake Margin Tracker" actions={toolbar} />
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {INTAKE_MARGIN_HEADERS.map((h) => (
                <th key={h} className="text-left py-2.5 px-3 font-medium text-gray-500 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    {h}
                    {INTAKE_MARGIN_INFO_KEYS[h] && <InfoHeaderIcon metricKey={INTAKE_MARGIN_INFO_KEYS[h]} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 && search ? (
              <tr>
                <td colSpan={INTAKE_MARGIN_HEADERS.length} className="py-6">
                  <EmptyState title="No results" description={`No intake matching "${search}"`} variant="neutral" className="py-6" />
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr key={r.poNumber} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2 px-3 font-medium text-gray-900">{r.poNumber}</td>
                  <td className="py-2 px-3 text-gray-700">{r.vendor}</td>
                  <td className="py-2 px-3 text-gray-700">{stripIndexPrefix(r.subcategory)}</td>
                  <td className="py-2 px-3 text-gray-700">{r.date}</td>
                  <td className="py-2 px-3 text-gray-700">{r.intakeValue}</td>
                  <td className="py-2 px-3 text-gray-700">{r.imPct}</td>
                  <td className="py-2 px-3 text-gray-700">{r.grn}</td>
                  <td className="py-2 px-3 text-gray-700">{r.owner}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart configs
// ---------------------------------------------------------------------------

const otbChartConfig = {
  budget: { label: 'Budget', color: CHART_PRIMARY },
  committed: { label: 'Committed', color: CHART_BASELINE },
};

// ---------------------------------------------------------------------------
// Main tab
// ---------------------------------------------------------------------------

export function SupplyOTBTab({ filters }: { filters: CategoryDirectorFilters }) {
  const isMobile = useIsMobile();
  const { data } = useSupplyOtb(filters);
  const heroKpis = useHeroKpiStore((s) => s.heroKpis);

  const kpiCards = useMemo<CategoryDirectorHealthKpi[]>(() => {
    return supplyKpis.map((mock) => {
      // OTB Utilisation reuses the hero store's ww-otb card if it landed.
      if (mock.id === 'ww-otb2') {
        const heroOtb = kpiByCode(heroKpis ?? undefined, 'ww-otb');
        return apiKpiToCategoryDirectorHealthKpi(heroOtb, mock);
      }
      const apiCode = SUPPLY_KPI_API_CODES[mock.id];
      if (!apiCode) return mock; // net-new — keep mock as-is
      const card = kpiByCode(data?.kpi_cards, apiCode);
      return apiKpiToCategoryDirectorHealthKpi(card, mock);
    });
  }, [data?.kpi_cards, heroKpis]);

  // Vendor delivery chart — top 5 by OTIF%. Falls back to mock if API empty.
  const vendorChart = useMemo(() => {
    const live = vendorDeliveryToChart(data?.vendor_delivery_table, 5);
    return live.length ? live : vendorDeliveryData;
  }, [data?.vendor_delivery_table]);

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ChartCard title="OTB by Class" description="Budget vs Committed (₹ Cr)">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" minWidth={0} height="100%">
              <BarChart data={otbByClassData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis dataKey="name" tick={{ fontSize: isMobile ? 10 : 12, fill: CHART_AXIS_TICK }} tickLine={false} interval={isMobile ? 'preserveStartEnd' : 0} />
                <YAxis tick={{ fontSize: 12, fill: CHART_AXIS_TICK }} tickLine={false} axisLine={false} hide={isMobile} />
                <Tooltip content={<ChartTooltipContent config={otbChartConfig} valueFormatter={(v) => `${getCurrencySymbol()}${v} Cr`} />} />
                <Legend content={<ChartLegendContent config={otbChartConfig} />} />
                <Bar dataKey="budget" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} barSize={isMobile ? 16 : 24} />
                <Bar dataKey="committed" fill={CHART_BASELINE} radius={[4, 4, 0, 0]} barSize={isMobile ? 16 : 24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Vendor Delivery %" description="On-time delivery rate by vendor">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" minWidth={0} height="100%">
              <BarChart data={vendorChart} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis type="number" tick={{ fontSize: 12, fill: CHART_AXIS_TICK }} tickLine={false} axisLine={false} hide={isMobile} domain={[0, 100]} unit="%" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: isMobile ? 9 : 11, fill: CHART_AXIS_TICK }} tickLine={false} axisLine={false} width={isMobile ? 100 : 130} />
                <Tooltip content={<ChartTooltipContent valueFormatter={(v) => `${v}%`} />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={isMobile ? 18 : 24}>
                  {vendorChart.map((_, i) => (
                    <Cell key={i} fill={CHART_CATEGORICAL[i % CHART_CATEGORICAL.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <OtbTrackerSection categoryFilter={filters.category} />
      <ActivePoSection />
      <IntakeMarginSection />
    </div>
  );
}
