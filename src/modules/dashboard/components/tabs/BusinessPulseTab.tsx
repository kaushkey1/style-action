import { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine,
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
} from 'recharts';
import { ChevronDown, ChevronRight, ArrowLeft, Search as SearchIcon } from 'lucide-react';
import { SectionHeader, Button, FilterSelect } from '@/components/ui';
import { ChartTooltipContent, ChartLegendContent } from '@/components/ui';
import {cn, getCurrencySymbol} from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { ChartCard } from '../ChartCard';
import { DomainKpis } from './DomainKpis';
import {
  tabDomainKpis,
  monthlyRevenueData,
  revenueByCategoryNested,
  type CategoryRow,
} from '../../data/mockChartData';
import { CHART_SEQUENTIAL, CHART_PRIMARY, CHART_BASELINE, CHART_GRID, CHART_AXIS_TICK } from '@/data/chartColors';
import { stripIndexPrefix } from '@/modules/category-director/lib/apiAdapters';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

type MetricKey = 'revenue' | 'gm' | 'sellThrough' | 'aged' | 'fresh';

const areaChartConfig = {
  actual: { label: 'Actual', color: CHART_PRIMARY },
  target: { label: 'Target', color: CHART_BASELINE },
};

const PIE_METRIC_OPTIONS = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'gm', label: 'GM%' },
  { value: 'sellThrough', label: 'Sell-Through' },
  { value: 'aged', label: 'Aged Inv' },
  { value: 'fresh', label: 'Fresh Stock' },
];

const PERIOD_OPTIONS = [
  { value: '3m', label: '3 months' },
  { value: '6m', label: '6 months' },
  { value: '12m', label: '12 months' },
  { value: 'ytd', label: 'YTD' },
];

// ---------------------------------------------------------------------------
// Nested table row
// ---------------------------------------------------------------------------

function NestedTableRow({
  row,
  depth,
}: {
  row: CategoryRow;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = row.children && row.children.length > 0;

  return (
    <>
      <tr
        className={cn(
          'border-b border-gray-50 last:border-0 transition-colors',
          hasChildren ? 'hover:bg-gray-50 cursor-pointer' : 'hover:bg-gray-50/50',
          depth > 0 && 'bg-gray-50/30',
        )}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <td className="py-2.5 pr-3 font-medium text-gray-900">
          {/* eslint-disable no-restricted-syntax -- dynamic padding for tree depth */}
          <div className="flex items-center gap-1.5" style={{ paddingLeft: depth * 20 }}>
          {/* eslint-enable no-restricted-syntax */}
            {hasChildren && (
              expanded
                ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                : <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            )}
            {!hasChildren && <span className="w-3.5 shrink-0" />}
            <span className={depth === 0 ? 'font-semibold' : 'font-normal text-gray-700'}>{row.name}</span>
          </div>
        </td>
        <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums">{getCurrencySymbol()}{row.revenue}</td>
        <td className={cn('py-2.5 px-3 text-right tabular-nums', row.gm < 40 ? 'text-red-600 font-medium' : 'text-gray-700')}>
          {row.gm.toFixed(1)}%
        </td>
        <td className={cn('py-2.5 px-3 text-right tabular-nums', row.sellThrough < 65 ? 'text-red-600 font-medium' : 'text-gray-700')}>
          {row.sellThrough.toFixed(1)}%
        </td>
        <td className={cn('py-2.5 px-3 text-right tabular-nums', row.aged > 20 ? 'text-red-600 font-medium' : 'text-gray-700')}>
          {row.aged.toFixed(1)}%
        </td>
        <td className="py-2.5 pl-3 text-right text-gray-700 tabular-nums">{row.fresh.toFixed(1)}%</td>
      </tr>
      {expanded && row.children?.map((child) => (
        <NestedTableRow key={child.name} row={child} depth={depth + 1} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main tab
// ---------------------------------------------------------------------------

export function BusinessPulseTab() {
  const isMobile = useIsMobile();
  const [areaPeriod, setAreaPeriod] = useState('6m');
  const [pieMetric, setPieMetric] = useState('revenue');
  const [drillCategory, setDrillCategory] = useState<string | null>(null);
  const [tableSearch, setTableSearch] = useState('');
  const [tableSortKey, setTableSortKey] = useState<MetricKey | 'name'>('name');

  // Table search + sort
  const sortedTableData = useMemo(() => {
    let data = [...revenueByCategoryNested];
    if (tableSearch) {
      const q = tableSearch.toLowerCase();
      data = data.filter((row) => {
        const parentMatch = row.name.toLowerCase().includes(q);
        const childMatch = row.children?.some((c) => c.name.toLowerCase().includes(q));
        return parentMatch || childMatch;
      });
    }
    if (tableSortKey !== 'name') {
      data.sort((a, b) => (b[tableSortKey] ?? 0) - (a[tableSortKey] ?? 0));
    }
    return data;
  }, [tableSearch, tableSortKey]);

  // Pie data — derived from revenueByCategoryNested (same source as table)
  // Metric filter controls which value the pie shows
  const pieData = useMemo(() => {
    const metricKey = pieMetric as MetricKey;
    const source = drillCategory
      ? revenueByCategoryNested.find((r) => r.name === drillCategory)?.children ?? []
      : revenueByCategoryNested;
    return source.map((row) => ({
      name: row.name,
      value: row[metricKey] ?? row.revenue,
    }));
  }, [drillCategory, pieMetric]);

  const handlePieClick = (data: { name?: string }) => {
    const name = String(data.name ?? '');
    if (!drillCategory) {
      const match = revenueByCategoryNested.find((r) => r.name === name);
      if (match?.children && match.children.length > 0) {
        setDrillCategory(name);
      }
    } else {
      // Second-level drill: check if this child has its own children
      const parent = revenueByCategoryNested.find((r) => r.name === drillCategory);
      const child = parent?.children?.find((c) => c.name === name);
      if (child?.children && child.children.length > 0) {
        setDrillCategory(drillCategory + ' > ' + name);
      }
    }
  };

  // Resolve drill path for 2-level deep (e.g. "Menswear > Casuals"). Strip any
  // numeric prefix per segment so the title reads "MEN APPAREL → CASUALS" not
  // "1. MEN APPAREL → 3. CASUALS".
  const drillPath = drillCategory?.split(' > ').map(stripIndexPrefix) ?? [];
  const drillTitle = drillCategory
    ? drillPath.join(' → ')
    : `By Category`;
  const metricLabel = PIE_METRIC_OPTIONS.find((o) => o.value === pieMetric)?.label ?? 'Revenue';

  return (
    <div className="space-y-4">
      <DomainKpis kpis={tabDomainKpis['business-pulse']!} />

      {/* Charts — each with inline header filter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Chart 1 — Monthly Revenue */}
        <ChartCard
          title="Monthly Revenue"
          description="Actual vs AOP Target (₹ Cr)"
          infoTooltip="Monthly revenue run rate compared against the Annual Operating Plan target. Gap indicates shortfall vs plan. Data refreshed daily."
          filterOptions={PERIOD_OPTIONS}
          filterValue={areaPeriod}
          onFilterChange={setAreaPeriod}
        >
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" minWidth={0} height="100%">
              <AreaChart data={monthlyRevenueData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis dataKey="month" tick={{ fontSize: isMobile ? 10 : 12, fill: CHART_AXIS_TICK }} tickLine={false} interval={isMobile ? 'preserveStartEnd' : 0} />
                <YAxis tick={{ fontSize: 12, fill: CHART_AXIS_TICK }} tickLine={false} axisLine={false} hide={isMobile} />
                <Tooltip
                  cursor={{ stroke: 'rgba(99, 102, 241, 0.2)', strokeWidth: 1 }}
                  content={<ChartTooltipContent config={areaChartConfig} valueFormatter={(v) => `${getCurrencySymbol()}${v} Cr`} />}
                />
                <Legend content={<ChartLegendContent config={areaChartConfig} />} />
                <ReferenceLine y={1200} stroke={CHART_BASELINE} strokeDasharray="4 4" />
                <Area type="monotone" dataKey="target" stroke={CHART_BASELINE} fill="transparent" strokeDasharray="4 4" strokeWidth={1.5} activeDot={{ r: 4 }} />
                <Area type="monotone" dataKey="actual" stroke={CHART_PRIMARY} fill={CHART_PRIMARY} fillOpacity={0.1} strokeWidth={2} activeDot={{ r: 5, fill: CHART_PRIMARY }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Chart 2 — Revenue by Category (drill-down) */}
        <ChartCard
          title={drillCategory ? `${metricLabel} — ${drillTitle}` : `${metricLabel} by Category`}
          description={drillCategory ? `Breakdown by ${metricLabel.toLowerCase()}. Click to drill deeper.` : `Top categories by ${metricLabel.toLowerCase()}. Click a segment to drill down.`}
          infoTooltip={`Distribution of ${metricLabel.toLowerCase()} across categories. Matches the table data below. Click a segment to drill into sub-categories (same hierarchy as table rows).`}
          filterOptions={PIE_METRIC_OPTIONS}
          filterValue={pieMetric}
          onFilterChange={(v) => { setPieMetric(v); setDrillCategory(null); }}
        >
          {drillCategory && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1 -mt-1 mb-2"
              onClick={() => setDrillCategory(null)}
            >
              <ArrowLeft className="w-3 h-3" />
              Back to all categories
            </Button>
          )}
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" minWidth={0} height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  onClick={handlePieClick}
                  cursor={!drillCategory ? 'pointer' : 'default'}
                  stroke="none"
                  label={({ name, value, cx, cy, midAngle = 0, outerRadius: or }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = (or as number) + 20;
                    const x = (cx as number) + radius * Math.cos(-(midAngle) * RADIAN);
                    const y = (cy as number) + radius * Math.sin(-(midAngle) * RADIAN);
                    return (
                      <text
                        x={x}
                        y={y}
                        textAnchor={x > (cx as number) ? 'start' : 'end'}
                        dominantBaseline="central"
                        className="text-xs fill-gray-600"
                      >
                        {name} {pieMetric === 'revenue' ? `${getCurrencySymbol()}${value}` : `${value}%`}
                      </text>
                    );
                  }}
                  labelLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_SEQUENTIAL[i % CHART_SEQUENTIAL.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltipContent valueFormatter={(v) => pieMetric === 'revenue' ? `${getCurrencySymbol()}${v} Cr` : `${v}%`} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Table — with search + sort */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Revenue & Margin by Category" />
        {/* eslint-disable-next-line design-system/prefer-section-header */}
        <div className="flex items-center justify-between gap-3 mt-1 mb-3">
          <div className="relative">
            <SearchIcon className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {/* eslint-disable-next-line no-restricted-syntax -- search with icon overlay */}
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Search categories..."
              className="h-8 pl-8 pr-3 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus-kb:ring-2 focus-kb:ring-primary/20 focus-kb:border-primary w-[200px] text-base"
            />
          </div>
          <FilterSelect
            value={tableSortKey}
            onChange={(v) => setTableSortKey(v as MetricKey | 'name')}
            options={[
              { value: 'name', label: 'Sort: Name' },
              { value: 'revenue', label: 'Sort: Revenue' },
              { value: 'gm', label: 'Sort: GM%' },
              { value: 'sellThrough', label: 'Sort: Sell-Through' },
              { value: 'aged', label: 'Sort: Aged Inv' },
              { value: 'fresh', label: 'Sort: Fresh' },
            ]}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-3 font-medium text-gray-500">Name</th>
                <th className="text-right py-2 px-3 font-medium text-gray-500">Revenue (Cr/mo)</th>
                <th className="text-right py-2 px-3 font-medium text-gray-500">GM%</th>
                <th className="text-right py-2 px-3 font-medium text-gray-500">Sell-Through%</th>
                <th className="text-right py-2 px-3 font-medium text-gray-500">Aged Inv%</th>
                <th className="text-right py-2 pl-3 font-medium text-gray-500">Fresh%</th>
              </tr>
            </thead>
            <tbody>
              {sortedTableData.map((row) => (
                <NestedTableRow key={row.name} row={row} depth={0} />
              ))}
              {sortedTableData.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No categories match &ldquo;{tableSearch}&rdquo;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
