import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Star, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Button, Input, KpiLabel, PageHeader, SectionHeader, DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell, StoreFilterSelect, EmptyState } from '@/components/ui';
import {cn, formatNumber, getCurrencySymbol} from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useAOPStore } from '../stores/useAOPStore';
import { mockScenarios } from '../data/mockScenarios';
import { useToast } from '@/hooks/useToast';

const tabs = [
  { id: 'dashboard' as const, label: 'AOP Dashboard', route: '/aop' },
  { id: 'planner' as const, label: 'Scenario Planner', route: '/aop/scenarios' },
  { id: 'comparison' as const, label: 'Comparison', route: '/aop/compare' },
  { id: 'variance' as const, label: 'Variance Tracker', route: '/aop/variance' },
];

import { CHART_CATEGORICAL, CHART_GRID, CHART_BORDER } from '@/data/chartColors';
const barColors = CHART_CATEGORICAL.slice(0, 3);

export function ScenarioComparisonPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const storeParam = searchParams.get('store');
  const { fiscalYear, comparisonScenarioIds, setComparisonScenarios } = useAOPStore();
  const { success } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set(comparisonScenarioIds));

  const scenarios = mockScenarios.filter((s) => selected.has(s.id));

  const toggleScenario = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
    setComparisonScenarios([...next]);
  };

  const chartData = scenarios.map((s, i) => ({
    name: s.name.replace(' (Base)', ''),
    revenue: s.networkRollup.annualRevenue,
    fill: barColors[i % barColors.length],
  }));

  // Comparison matrix rows
  type Row = { label: string; labelNode?: React.ReactNode; section?: boolean; values: (string | number)[]; warning?: boolean[] };
  const matrix: Row[] = scenarios.length > 0 ? [
    { label: 'FINANCIAL', section: true, values: [] },
    { label: 'Revenue', values: scenarios.map((s) => `${getCurrencySymbol()}${formatNumber(s.networkRollup.annualRevenue)} Cr`) },
    { label: 'Growth %', values: scenarios.map((s) => s.assumptions.find((a) => a.category === 'growth')?.value ?? '—') },
    { label: 'Gross Margin', values: scenarios.map((s) => `${getCurrencySymbol()}${formatNumber(s.networkRollup.annualGM)} Cr`) },
    { label: 'GM %', values: scenarios.map((s) => `${s.networkRollup.gmPct}%`) },
    { label: 'Delivered Margin', values: scenarios.map((s) => `${s.networkRollup.gmPct}%`), warning: scenarios.map((s) => s.networkRollup.gmPct < 42) },
    { label: 'OPERATIONAL', section: true, values: [] },
    { label: 'Store Count', values: scenarios.map((s) => `${formatNumber(s.networkRollup.storeCount)} (${s.networkRollup.newStores > 0 ? '+' : ''}${s.networkRollup.newStores})`) },
    { label: 'Total SFT', values: scenarios.map((s) => `${(s.networkRollup.totalSFT / 100_000).toFixed(1)} L`) },
    { label: 'Avg SPSF', labelNode: <>Avg <KpiLabel abbr="SPSF" /></>, values: scenarios.map((s) => `${getCurrencySymbol()}${formatNumber(s.networkRollup.avgSPSF)}`) },
    { label: 'Fashion Split', values: scenarios.map((s) => {
      const mod = s.modifications.find((m) => m.variable === 'fashion_split');
      return mod ? String(mod.newValue) : '70/30';
    }), warning: scenarios.map((s) => !!s.modifications.find((m) => m.variable === 'fashion_split')) },
    { label: 'Options/Store', values: scenarios.map((s) => formatNumber(s.downstreamImpact.rangeOptionsPerStore)) },
    { label: 'INVENTORY', section: true, values: [] },
    { label: 'OTB Envelope', values: scenarios.map((s) => `${getCurrencySymbol()}${formatNumber(s.networkRollup.otbEnvelope)} Cr`) },
    { label: 'Inventory Turns', values: scenarios.map((s) => `${s.networkRollup.targetTurns}x`) },
    { label: 'Cover Days', values: scenarios.map((s) => `${s.networkRollup.targetCoverDays}d`) },
    { label: 'Capacity Util', values: scenarios.map((s) => `${s.networkRollup.capacityUtilization}%`), warning: scenarios.map((s) => s.networkRollup.capacityUtilization > 100) },
    { label: 'Garment Capacity', values: scenarios.map((s) => `${(s.networkRollup.garmentCapacity / 100_000).toFixed(1)} L`), warning: scenarios.map((s) => s.networkRollup.garmentCapacity > 15_000_000) },
    { label: 'RISK', section: true, values: [] },
    { label: 'Stores at Risk', values: scenarios.map((s) => String(s.downstreamImpact.storesAtRisk)) },
    { label: 'Constraint Violations', values: scenarios.map((s) => s.constraintViolations.length > 0 ? `${s.constraintViolations.length}` : '0'), warning: scenarios.map((s) => s.constraintViolations.length > 0) },
    { label: 'Key Dependencies', values: scenarios.map((s) => {
      if (s.networkRollup.newStores > 0) return `${s.networkRollup.newStores} new stores`;
      if (s.networkRollup.newStores < 0) return 'None';
      return '—';
    }) },
    { label: 'ASSUMPTIONS', section: true, values: [] },
    { label: 'Consumer Sentiment', values: scenarios.map((s) => s.assumptions.find((a) => a.category === 'macro')?.value ?? '—') },
    { label: 'Competitor Activity', values: scenarios.map((s) => s.assumptions.find((a) => a.category === 'competition')?.value ?? '—') },
    { label: 'Fabric Inflation', values: scenarios.map((s) => s.assumptions.find((a) => a.description.includes('Fabric'))?.value ?? '—') },
  ] : [];

  return (
    <div className="space-y-4 animate-fadeInUp">
      <PageHeader
        title="Scenario Comparison"
        backTo={{ label: 'AOP', path: '/aop' }}
      />

      {/* Tab navigation */}
      <div className="flex items-center gap-1 border-b border-gray-200 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              const suffix = storeParam ? `?store=${encodeURIComponent(storeParam)}` : '';
              navigate(tab.route + suffix);
            }}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              tab.id === 'comparison'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <StoreFilterSelect
            value={storeParam}
            onChange={(name) => {
              if (name) {
                searchParams.set('store', name);
              } else {
                searchParams.delete('store');
              }
              setSearchParams(searchParams);
            }}
          />
          <span className="text-sm text-gray-500">{fiscalYear}</span>
        </div>
      </div>

      {/* Scenario selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">Comparing:</span>
        {mockScenarios.map((s) => (
          <label key={s.id} className="flex items-center gap-1.5 cursor-pointer">
            <Input
              type="checkbox"
              checked={selected.has(s.id)}
              onChange={() => toggleScenario(s.id)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">
              {s.name}
              {s.isRecommended && <Star className="w-3 h-3 inline ml-1 text-amber-400 fill-amber-400" />}
            </span>
          </label>
        ))}
      </div>

      {scenarios.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center text-gray-500">
          Select at least one scenario to compare
        </div>
      ) : (
        <>
          {/* Side-by-side matrix */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <SectionHeader title="Side-by-Side Comparison" />
            <DataTable className="[&_table]:text-sm">
              <DataTableHeader>
                <DataTableHead className="pr-4 w-44"></DataTableHead>
                {scenarios.map((s) => (
                  <DataTableHead key={s.id} align="right" className="text-gray-700">
                    {s.name.replace(' (Base)', '')}
                    {s.isRecommended && <Star className="w-3 h-3 inline ml-1 text-amber-400 fill-amber-400" />}
                  </DataTableHead>
                ))}
              </DataTableHeader>
              <DataTableBody>
                {matrix.length === 0 ? (
                  <tr><td colSpan={scenarios.length + 1}><EmptyState description="No comparison data to display" /></td></tr>
                ) : matrix.map((row, i) => (
                  row.section ? (
                    <tr key={i}>
                      <td colSpan={scenarios.length + 1} className="py-2 pt-4 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                        {row.label}
                      </td>
                    </tr>
                  ) : (
                    <DataTableRow key={i} className="border-b border-gray-50">
                      <DataTableCell className="pr-4 text-gray-600">{row.labelNode ?? row.label}</DataTableCell>
                      {row.values.map((val, j) => (
                        <DataTableCell key={j} align="right" className={cn(
                          'font-medium',
                          row.warning?.[j] ? 'text-amber-600' : 'text-gray-900'
                        )}>
                          {val}
                          {row.warning?.[j] && <AlertTriangle className="w-3 h-3 inline ml-1 text-amber-500" />}
                        </DataTableCell>
                      ))}
                    </DataTableRow>
                  )
                ))}
              </DataTableBody>
            </DataTable>
          </div>

          {/* Visual comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <SectionHeader title="Revenue by Scenario" />
              <div className="h-48">
                <ResponsiveContainer width="100%" minWidth={0} height="100%">
                  <BarChart data={chartData} barSize={isMobile ? 32 : 48}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID} />
                    <XAxis dataKey="name" tick={{ fontSize: isMobile ? 10 : 12 }} axisLine={false} tickLine={false} interval={isMobile ? 'preserveStartEnd' : 0} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${getCurrencySymbol()}${v}`} hide={isMobile} />
                    <Tooltip
                      formatter={(value) => [`${getCurrencySymbol()}${formatNumber(Number(value ?? 0))} Cr`, 'Revenue']}
                      contentStyle={{ borderRadius: 8, border: `1px solid ${CHART_BORDER}`, fontSize: 12 }}
                    />
                    <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <SectionHeader title="Risk vs Return" />
              <div className="h-48 flex items-center justify-center">
                <div className="relative w-full h-full">
                  {/* Simple quadrant chart */}
                  <div className="absolute inset-0 border-l-2 border-b-2 border-gray-200">
                    <div className="absolute bottom-0 left-0 w-full text-center text-xs text-gray-500">Risk →</div>
                    <div className="absolute top-0 left-0 h-full flex items-center">
                      <span className="text-xs text-gray-500 -rotate-90 whitespace-nowrap">Return →</span>
                    </div>
                    {scenarios.map((s, i) => {
                      const x = s.riskLevel === 'low' ? 25 : s.riskLevel === 'medium' ? 55 : 80;
                      const y = 100 - (s.networkRollup.annualRevenue - 10000) / 20;
                      return (
                         
                        <div
                          key={s.id}
                          className="absolute flex items-center gap-1"
                          // eslint-disable-next-line no-restricted-syntax -- dynamic positioning
                          style={{ left: `${x}%`, bottom: `${y}%`, transform: 'translate(-50%, 50%)' }}
                        >
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white',
                            i === 0 ? 'bg-blue-400' : i === 1 ? 'bg-emerald-500' : 'bg-amber-500'
                          )}>
                            {String.fromCharCode(65 + i)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Moderate scenario recommended:</h2>
                <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
                  <li>Achievable +8% growth with current operational model</li>
                  <li>42% delivered margin meets strategic target</li>
                  <li>No constraint violations</li>
                  <li>Key dependency: 25 new stores by Q2 (real estate pipeline confirmed)</li>
                </ul>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              {scenarios.map((s) => (
                <Button
                  key={s.id}
                  variant={s.isRecommended ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => success(`${s.name} scenario approved and set to ACTIVE`)}
                >
                  {s.isRecommended && <Star className="w-3.5 h-3.5 mr-1" />}
                  Approve {s.name.replace(' (Base)', '')}
                </Button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
