import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  AlertTriangle,
  CheckCircle2,
  Copy,
  GitCompare,
  Play,
  Info,
} from 'lucide-react';
import { Badge, Button, Input, KpiLabel, PageHeader, DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SectionHeader, MetricGrid, EmptyState } from '@/components/ui';
import {cn, formatNumber, getCurrencySymbol} from '@/lib/utils';
import { mockScenarios } from '../data/mockScenarios';
import { useToast } from '@/hooks/useToast';
import type { PlanningStatus, RiskLevel } from '../data/mockAOPTypes';

const statusConfig: Record<PlanningStatus, { label: string; variant: 'default' | 'warning' | 'success' | 'destructive' }> = {
  draft: { label: 'Draft', variant: 'default' },
  under_review: { label: 'Under Review', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  active: { label: 'Active', variant: 'success' },
  superseded: { label: 'Superseded', variant: 'default' },
};

const riskConfig: Record<RiskLevel, { label: string; variant: 'success' | 'warning' | 'destructive' }> = {
  low: { label: 'Low Risk', variant: 'success' },
  medium: { label: 'Medium Risk', variant: 'warning' },
  high: { label: 'High Risk', variant: 'destructive' },
};

type DetailTab = 'overview' | 'assumptions' | 'whatif' | 'demand-shock';

export function ScenarioDetailPage() {
  const { scenarioId } = useParams();
  const navigate = useNavigate();
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  // What-if simulation state
  const [whatIfVariable, setWhatIfVariable] = useState('store_count');
  const [simulationRun, setSimulationRun] = useState(false);

  // Demand shock state
  const [shockType, setShockType] = useState('competitor_entry');

  const scenario = useMemo(
    () => mockScenarios.find((s) => s.id === scenarioId),
    [scenarioId]
  );

  if (!scenario) {
    return (
      <div className="space-y-4">
        <PageHeader title="Scenario Detail" backTo={{ label: 'Scenarios', path: '/aop/scenarios' }} />
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center text-gray-500">
          Scenario not found
        </div>
      </div>
    );
  }

  const rollup = scenario.networkRollup;
  const status = statusConfig[scenario.status];
  const risk = riskConfig[scenario.riskLevel];
  const impact = scenario.downstreamImpact;

  const detailTabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'assumptions' as const, label: 'Assumptions' },
    { id: 'whatif' as const, label: 'What-if Builder' },
    { id: 'demand-shock' as const, label: 'Demand Shock' },
  ];

  const handleApprove = () => {
    success(`${scenario.name} scenario approved and set to ACTIVE`);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={scenario.name}
        backTo={{ label: 'Scenarios', path: '/aop/scenarios' }}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 -mt-2">
        <div className="flex items-center gap-3">
          <Badge variant={status.variant}>{status.label}</Badge>
          <Badge variant={risk.variant}>{risk.label}</Badge>
          {scenario.isRecommended && (
            <Badge variant="default" className="bg-amber-50 text-amber-700 border-amber-200">
              <Star className="w-3 h-3 mr-1 fill-amber-400" /> Recommended
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => success('Scenario cloned')}>
            <Copy className="w-4 h-4 mr-1" /> Clone
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/aop/compare')}>
            <GitCompare className="w-4 h-4 mr-1" /> Compare
          </Button>
          {scenario.status === 'under_review' && (
            <Button size="sm" onClick={handleApprove}>
              <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
            </Button>
          )}
        </div>
      </div>

      {/* Detail tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 pb-px">
        {detailTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              tab.id === activeTab
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Key metrics */}
          <MetricGrid columns={4} className="mb-0">
            {[
              { label: 'Revenue', value: `${getCurrencySymbol()}${formatNumber(rollup.annualRevenue)} Cr` },
              { label: 'Gross Margin', value: `${getCurrencySymbol()}${formatNumber(rollup.annualGM)} Cr (${rollup.gmPct}%)` },
              { label: 'OTB Envelope', value: `${getCurrencySymbol()}${formatNumber(rollup.otbEnvelope)} Cr` },
              { label: 'Store Count', value: `${formatNumber(rollup.storeCount)} (${rollup.newStores > 0 ? '+' : ''}${rollup.newStores})` },
              { label: 'Avg SPSF', labelNode: <>Avg <KpiLabel abbr="SPSF" /></>, value: `${getCurrencySymbol()}${formatNumber(rollup.avgSPSF)}` },
              { label: 'Inventory Turns', value: `${rollup.targetTurns}x` },
              { label: 'Cover Days', value: `${rollup.targetCoverDays}d` },
              { label: 'Capacity Utilization', value: `${rollup.capacityUtilization}%` },
            ].map((m) => (
              <div key={m.label} className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="text-xs text-gray-500 mb-1">{'labelNode' in m && m.labelNode ? m.labelNode : m.label}</div>
                <div className="text-lg font-bold text-gray-900">{m.value}</div>
              </div>
            ))}
          </MetricGrid>

          {/* Downstream Impact */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <SectionHeader title="Downstream Impact" />
            <MetricGrid columns={4}>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500">OTB Envelope</div>
                <div className="text-sm font-semibold text-gray-900">{getCurrencySymbol()}{formatNumber(impact.otbEnvelope)} Cr</div>
                {impact.otbDelta !== 0 && (
                  <div className={cn('text-xs', impact.otbDelta > 0 ? 'text-emerald-600' : 'text-red-600')}>
                    {impact.otbDelta > 0 ? '+' : ''}{getCurrencySymbol()}{formatNumber(Math.abs(impact.otbDelta))} Cr
                  </div>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500">Range Options/Store</div>
                <div className="text-sm font-semibold text-gray-900">{formatNumber(impact.rangeOptionsPerStore)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500">Capacity Utilization</div>
                <div className={cn('text-sm font-semibold', impact.capacityUtilization > 100 ? 'text-red-600' : 'text-gray-900')}>
                  {impact.capacityUtilization}%
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500">Stores at Risk</div>
                <div className={cn('text-sm font-semibold', impact.storesAtRisk > 30 ? 'text-red-600' : 'text-gray-900')}>
                  {impact.storesAtRisk}
                </div>
              </div>
            </MetricGrid>
          </div>

          {/* Constraint Violations */}
          {scenario.constraintViolations.length > 0 && (
            <div className="bg-white rounded-lg border border-red-200 p-4">
              <h2 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Constraint Violations ({scenario.constraintViolations.length})
              </h2>
              <div className="space-y-2">
                {scenario.constraintViolations.map((v, i) => (
                  <div key={i} className="flex items-start gap-3 bg-red-50 rounded-lg p-3">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-red-800">{v.description}</div>
                      <div className="text-xs text-red-600 mt-0.5">
                        {v.affectedStores} stores affected | Current: {v.currentValue} | Threshold: {v.threshold} | Severity: {v.severity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* POD Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <SectionHeader title="POD Breakdown" />
            <DataTable className="[&_table]:text-sm">
              <DataTableHeader className="border-b-gray-100">
                <DataTableHead className="pr-4">POD</DataTableHead>
                <DataTableHead align="right">Revenue</DataTableHead>
                <DataTableHead align="right"><KpiLabel abbr="GM%" /></DataTableHead>
                <DataTableHead align="right"><KpiLabel abbr="SPSF" /></DataTableHead>
                <DataTableHead align="right">Stores</DataTableHead>
                <DataTableHead align="center" className="pl-3">Status</DataTableHead>
              </DataTableHeader>
              <DataTableBody>
                {rollup.pods.length === 0 ? (
                  <tr><td colSpan={6}><EmptyState description="No PODs to display" /></td></tr>
                ) : rollup.pods.map((pod) => (
                  <DataTableRow key={pod.podId} className="border-b border-gray-50">
                    <DataTableCell className="pr-4 font-medium text-gray-900">{pod.podName}</DataTableCell>
                    <DataTableCell align="right">{getCurrencySymbol()}{formatNumber(pod.annualRevenue)} Cr</DataTableCell>
                    <DataTableCell align="right">{pod.gmPct}%</DataTableCell>
                    <DataTableCell align="right">{getCurrencySymbol()}{formatNumber(pod.avgSPSF)}</DataTableCell>
                    <DataTableCell align="right">{pod.storeCount}</DataTableCell>
                    <DataTableCell align="center" className="pl-3">
                      <Badge variant={pod.status === 'on-track' ? 'success' : pod.status === 'warning' ? 'warning' : 'destructive'}>
                        {pod.status === 'on-track' ? 'On Track' : pod.status === 'warning' ? 'Low' : 'At Risk'}
                      </Badge>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          </div>
        </div>
      )}

      {/* Assumptions tab */}
      {activeTab === 'assumptions' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader title="Scenario Assumptions" />
          <DataTable className="[&_table]:text-sm">
            <DataTableHeader className="border-b-gray-100">
              <DataTableHead className="pr-4">Assumption</DataTableHead>
              <DataTableHead>Value</DataTableHead>
              <DataTableHead>Source</DataTableHead>
              <DataTableHead align="center" className="pl-3">Confidence</DataTableHead>
            </DataTableHeader>
            <DataTableBody>
              {scenario.assumptions.length === 0 ? (
                <tr><td colSpan={4}><EmptyState description="No assumptions to display" /></td></tr>
              ) : scenario.assumptions.map((a) => (
                <DataTableRow key={a.id} className="border-b border-gray-50">
                  <DataTableCell className="py-2.5 pr-4 text-gray-900">{a.description}</DataTableCell>
                  <DataTableCell className="py-2.5">{a.value}</DataTableCell>
                  <DataTableCell className="py-2.5 text-gray-500">{a.source}</DataTableCell>
                  <DataTableCell align="center" className="py-2.5 pl-3">
                    <Badge variant={a.confidence === 'high' ? 'success' : a.confidence === 'medium' ? 'warning' : 'destructive'}>
                      {a.confidence}
                    </Badge>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </div>
      )}

      {/* What-if Builder tab */}
      {activeTab === 'whatif' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <SectionHeader title="What-if Simulation" />
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Scenario</label>
                <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-200">
                  {scenario.name}
                </div>
              </div>
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className="block text-sm font-medium text-gray-700 mb-1">Variable</label>
                <Select value={whatIfVariable} onValueChange={setWhatIfVariable}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="store_count">Store Count</SelectItem>
                    <SelectItem value="grade_reclassification">Grade Reclassification</SelectItem>
                    <SelectItem value="fashion_split">Fashion Split</SelectItem>
                    <SelectItem value="spsf_target">SPSF Target</SelectItem>
                    <SelectItem value="segment_entry">Segment Entry</SelectItem>
                    <SelectItem value="growth_rate">Growth Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {whatIfVariable === 'store_count' && (
              <div className="space-y-3">
                <div>
                  {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                  <Select defaultValue="close">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="close">Close Stores</SelectItem>
                      <SelectItem value="open">Open New Stores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                    Filter: Grade A3 | Region: All | SPSF: Below Floor
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {[
                      { id: '4821', name: 'City Mall Jalgaon', spsf: 312, status: 'below' },
                      { id: '4933', name: 'Main Road Satara', spsf: 298, status: 'below' },
                      { id: '5102', name: 'Market Yard Latur', spsf: 341, status: 'floor' },
                      { id: '5287', name: 'Civil Lines Amravati', spsf: 289, status: 'below' },
                      { id: '5344', name: 'Bus Stand Solapur', spsf: 305, status: 'below' },
                      { id: '5412', name: 'Mall Road Kolhapur', spsf: 378, status: 'ok' },
                      { id: '5509', name: 'Station Rd Aurangabad', spsf: 267, status: 'below' },
                    ].map((store) => (
                      <label key={store.id} className="flex items-center gap-2 text-sm hover:bg-gray-50 rounded px-2 py-1 cursor-pointer">
                        <Input type="checkbox" defaultChecked={store.status !== 'ok'} className="w-4 h-4 rounded border-gray-300" />
                        <span className="text-gray-700">Store {store.id} ({store.name})</span>
                        <span className="text-gray-500 ml-auto">A3</span>
                        <span className="text-gray-500">SPSF: {getCurrencySymbol()}{store.spsf}</span>
                        <Badge variant={store.status === 'below' ? 'destructive' : store.status === 'floor' ? 'warning' : 'success'}>
                          {store.status === 'below' ? '▼ Floor' : store.status === 'floor' ? '● Floor' : '● OK'}
                        </Badge>
                      </label>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">6 selected of 142 A3 stores</div>
                </div>
              </div>
            )}

            <div className="mt-4">
              <Button onClick={() => setSimulationRun(true)}>
                <Play className="w-4 h-4 mr-1" /> Run Simulation
              </Button>
            </div>
          </div>

          {/* Simulation Results */}
          {simulationRun && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <SectionHeader title="Impact Summary" />
              <DataTable className="[&_table]:text-sm">
                <DataTableHeader className="border-b-gray-100">
                  <DataTableHead>Metric</DataTableHead>
                  <DataTableHead align="right">Before (Base)</DataTableHead>
                  <DataTableHead align="right">After (Sim)</DataTableHead>
                  <DataTableHead align="right" className="pl-3">Delta</DataTableHead>
                </DataTableHeader>
                <DataTableBody>
                  {[
                    { metric: 'Store Count', before: '2,025', after: '2,019', delta: '−6' },
                    { metric: 'Network SFT', before: '1.61M', after: '1.58M', delta: '−30 K (−1.9%)' },
                    { metric: 'Revenue', before: '₹10,950 Cr', after: '₹10,901 Cr', delta: '−₹49 Cr' },
                    { metric: 'GM', before: '₹4,599 Cr', after: '₹4,584 Cr', delta: '−₹15 Cr' },
                    { metric: 'Avg SPSF', before: '₹680', after: '₹690', delta: '+₹10 (+1.5%)' },
                    { metric: 'OTB Envelope', before: '₹6,450 Cr', after: '₹6,401 Cr', delta: '−₹49 Cr' },
                    { metric: 'Capacity Util', before: '95%', after: '93%', delta: '−2pp' },
                    { metric: 'Rent Savings', before: '—', after: '₹8.5 Cr/yr', delta: '(freed up)' },
                  ].map((row) => (
                    <DataTableRow key={row.metric} className="border-b border-gray-50">
                      <DataTableCell className="text-gray-900">{row.metric}</DataTableCell>
                      <DataTableCell align="right">{row.before}</DataTableCell>
                      <DataTableCell align="right">{row.after}</DataTableCell>
                      <DataTableCell align="right" className={cn(
                        'pl-3 font-medium',
                        row.delta.startsWith('−') || row.delta.startsWith('-') ? 'text-red-600' : row.delta.startsWith('+') ? 'text-emerald-600' : 'text-gray-500'
                      )}>
                        {row.delta}
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>

              <div className="mt-3 bg-blue-50 rounded-lg p-3 text-sm text-blue-800 flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Net Impact: Revenue −₹49 Cr, but SPSF improves +1.5% and rent savings of ₹8.5 Cr improve operating margin by +0.08pp</span>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => success('Saved as scenario variant')}>
                  Save as Scenario Variant
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSimulationRun(false)}>
                  Discard
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Demand Shock tab */}
      {activeTab === 'demand-shock' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <SectionHeader title="Demand Shock Simulation" />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className="block text-sm font-medium text-gray-700 mb-1">Shock Type</label>
                <Select value={shockType} onValueChange={setShockType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="competitor_entry">Competitor Entry</SelectItem>
                    <SelectItem value="competitor_exit">Competitor Exit</SelectItem>
                    <SelectItem value="weather">Weather Event</SelectItem>
                    <SelectItem value="festival_shift">Festival Shift</SelectItem>
                    <SelectItem value="macro">Macro Slowdown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className="block text-sm font-medium text-gray-700 mb-1">Preset</label>
                <Select defaultValue="chain-entry">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chain-entry">Chain Entry — 5+ stores</SelectItem>
                    <SelectItem value="single-store">Single Store Entry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* eslint-disable-next-line design-system/prefer-metric-grid -- form inputs, not metric cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className="block text-sm font-medium text-gray-700 mb-1">Competitor</label>
                <Input
                  type="text"
                  defaultValue="H&M"
                  className="w-full"
                />
              </div>
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className="block text-sm font-medium text-gray-700 mb-1">Modifier (%)</label>
                <Input
                  type="number"
                  defaultValue={-15}
                  className="w-full"
                />
              </div>
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <Select defaultValue="permanent">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="temporary">Temporary (2-4 weeks)</SelectItem>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <div className="text-xs text-gray-500 mb-1">Affected stores (auto-detected from catchment overlap):</div>
              <div className="text-sm text-gray-700">12 stores identified | Total current revenue: ₹312 Cr/yr</div>
            </div>

            <Button>
              <Play className="w-4 h-4 mr-1" /> Run Simulation
            </Button>
          </div>

          {/* Pre-loaded demand shock example */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <SectionHeader title="Impact Timeline — H&M Entry (Aug 2026)" />
            <DataTable className="[&_table]:text-sm">
              <DataTableHeader className="border-b-gray-100">
                <DataTableHead>Month</DataTableHead>
                <DataTableHead align="right">Base Rev</DataTableHead>
                <DataTableHead align="right">Shocked Rev</DataTableHead>
                <DataTableHead align="right">Delta</DataTableHead>
                <DataTableHead align="right" className="pl-3">Cumulative</DataTableHead>
              </DataTableHeader>
              <DataTableBody>
                {[
                  { month: 'Aug', base: 26.0, shocked: 22.1, delta: -3.9, cum: -3.9 },
                  { month: 'Sep', base: 28.1, shocked: 23.9, delta: -4.2, cum: -8.1 },
                  { month: 'Oct', base: 42.2, shocked: 35.9, delta: -6.3, cum: -14.4, note: 'Diwali!' },
                  { month: 'Nov', base: 35.1, shocked: 29.8, delta: -5.3, cum: -19.7 },
                  { month: 'Dec', base: 31.6, shocked: 26.9, delta: -4.7, cum: -24.4 },
                  { month: 'Jan-Mar', base: 82.4, shocked: 70.0, delta: -12.4, cum: -36.8 },
                ].map((row) => (
                  <DataTableRow key={row.month} className="border-b border-gray-50">
                    <DataTableCell className="font-medium text-gray-900">
                      {row.month}
                      {row.note && <span className="text-amber-600 ml-1 text-xs">({row.note})</span>}
                    </DataTableCell>
                    <DataTableCell align="right">{getCurrencySymbol()}{row.base.toFixed(1)} Cr</DataTableCell>
                    <DataTableCell align="right">{getCurrencySymbol()}{row.shocked.toFixed(1)} Cr</DataTableCell>
                    <DataTableCell align="right" className="text-red-600">−{getCurrencySymbol()}{Math.abs(row.delta).toFixed(1)} Cr</DataTableCell>
                    <DataTableCell align="right" className="pl-3 text-red-600 font-medium">−{getCurrencySymbol()}{Math.abs(row.cum).toFixed(1)} Cr</DataTableCell>
                  </DataTableRow>
                ))}
                <tr className="border-t border-gray-200 font-semibold">
                  <td className="px-3 py-2 text-gray-900">FY Total</td>
                  <td className="px-3 py-2 text-right text-gray-900">₹312 Cr</td>
                  <td className="px-3 py-2 text-right text-gray-900">₹265.2 Cr</td>
                  <td className="px-3 py-2 text-right text-red-600">−₹46.8 Cr</td>
                  <td className="px-3 py-2 pl-3 text-right text-red-600">−15%</td>
                </tr>
              </DataTableBody>
            </DataTable>

            <div className="mt-3">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Recommended Mitigations</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                <li>Increase fashion allocation in affected stores (+5% fashion split)</li>
                <li>Accelerate VM refresh cycle (from 30d to 21d)</li>
                <li>Reallocate ₹15 Cr OTB from affected stores to high-growth stores</li>
                <li>Launch targeted marketing campaigns in overlapping catchments</li>
              </ol>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => success('Saved as scenario variant')}>
                Save as Scenario Variant
              </Button>
              <Button variant="outline" size="sm" onClick={() => success('Mitigations applied — re-running simulation')}>
                Apply Mitigations & Re-run
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
