import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Copy,
  GitCompare,
  Star,
  AlertTriangle,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Badge, Button, PageHeader, DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell, SectionHeader, StoreFilterSelect, EmptyState } from '@/components/ui';
import {cn, formatNumber, getCurrencySymbol} from '@/lib/utils';
import { useAOPStore } from '../stores/useAOPStore';
import { mockScenarios, mockSimulationResults, SCENARIO_CONSERVATIVE_ID, SCENARIO_MODERATE_ID, SCENARIO_AGGRESSIVE_ID } from '../data/mockScenarios';
import type { PlanningStatus, RiskLevel } from '../data/mockAOPTypes';

const tabs = [
  { id: 'dashboard' as const, label: 'AOP Dashboard', route: '/aop' },
  { id: 'planner' as const, label: 'Scenario Planner', route: '/aop/scenarios' },
  { id: 'comparison' as const, label: 'Comparison', route: '/aop/compare' },
  { id: 'variance' as const, label: 'Variance Tracker', route: '/aop/variance' },
];

const statusConfig: Record<PlanningStatus, { label: string; variant: 'default' | 'warning' | 'success' | 'destructive' }> = {
  draft: { label: 'Draft', variant: 'default' },
  under_review: { label: 'Under Review', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  active: { label: 'Active', variant: 'success' },
  superseded: { label: 'Superseded', variant: 'default' },
};

const riskConfig: Record<RiskLevel, { variant: 'success' | 'warning' | 'destructive' }> = {
  low: { variant: 'success' },
  medium: { variant: 'warning' },
  high: { variant: 'destructive' },
};

const scenarioColors: Record<string, string> = {
  [SCENARIO_CONSERVATIVE_ID]: 'border-l-blue-400',
  [SCENARIO_MODERATE_ID]: 'border-l-emerald-400',
  [SCENARIO_AGGRESSIVE_ID]: 'border-l-amber-400',
};

export function ScenarioPlannerPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const storeParam = searchParams.get('store');
  const { fiscalYear } = useAOPStore();

  return (
    <div className="space-y-4 animate-fadeInUp">
      <PageHeader
        title="Scenario Planner"
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
              tab.id === 'planner'
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

      {/* Active Scenarios */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Active Scenarios" />
        <div className="space-y-3">
          {mockScenarios.length === 0 ? (
            <EmptyState description="No scenarios to display" />
          ) : mockScenarios.map((scenario) => {
            const status = statusConfig[scenario.status];
            const rollup = scenario.networkRollup;
            return (
              <div
                key={scenario.id}
                className={cn(
                  'border border-gray-200 rounded-lg p-4 border-l-4 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer',
                  scenarioColors[scenario.id] ?? 'border-l-gray-400'
                )}
                onClick={() => navigate(`/aop/scenarios/${scenario.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/aop/scenarios/${scenario.id}`);
                  }
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{scenario.name}</span>
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {scenario.isRecommended && (
                      <Badge variant="default" className="bg-amber-50 text-amber-700 border-amber-200">
                        <Star className="w-3 h-3 mr-1 fill-amber-400" /> Recommended
                      </Badge>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Growth: <span className="font-medium text-gray-900">{scenario.assumptions.find((a) => a.category === 'growth')?.value ?? '—'}</span></span>
                  <span className="text-gray-400">|</span>
                  <span>Revenue: <span className="font-medium text-gray-900">{getCurrencySymbol()}{formatNumber(rollup.annualRevenue)} Cr</span></span>
                  <span className="text-gray-400">|</span>
                  <span>OTB: <span className="font-medium text-gray-900">{getCurrencySymbol()}{formatNumber(rollup.otbEnvelope)} Cr</span></span>
                  <span className="text-gray-400">|</span>
                  <span>Stores: <span className="font-medium text-gray-900">{formatNumber(rollup.storeCount)} ({rollup.newStores > 0 ? '+' : ''}{rollup.newStores})</span></span>
                  <span className="text-gray-400">|</span>
                  <span>Risk: <Badge variant={riskConfig[scenario.riskLevel].variant} className="ml-1">{scenario.riskLevel}</Badge></span>
                  <span className="text-gray-400">|</span>
                  <span>
                    Violations:{' '}
                    {scenario.constraintViolations.length > 0 ? (
                      <span className="text-red-600 font-medium">{scenario.constraintViolations.length} <AlertTriangle className="w-3 h-3 inline" /></span>
                    ) : (
                      <span className="text-gray-500">0</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/aop/scenarios/${scenario.id}`); }}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); }}>
                    <Copy className="w-3.5 h-3.5 mr-1" /> Clone
                  </Button>
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); navigate('/aop/compare'); }}>
                    <GitCompare className="w-3.5 h-3.5 mr-1" /> Compare
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" /> New Scenario
          </Button>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" /> From Template
          </Button>
          <Button variant="outline" size="sm">
            <Zap className="w-4 h-4 mr-1" /> What-if Simulation
          </Button>
        </div>
      </div>

      {/* Recent Simulations */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Recent Simulations" />
        <DataTable className="[&_table]:text-sm">
          <DataTableHeader className="border-b-gray-100">
            <DataTableHead className="pr-4">Simulation</DataTableHead>
            <DataTableHead>Base</DataTableHead>
            <DataTableHead>Impact</DataTableHead>
            <DataTableHead align="right" className="pl-3">Date</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {mockSimulationResults.length === 0 ? (
              <tr><td colSpan={4}><EmptyState description="No simulations to display" /></td></tr>
            ) : mockSimulationResults.map((sim) => {
              const primaryImpact = sim.impact[0];
              const deltaStr = typeof primaryImpact?.delta === 'string' ? primaryImpact.delta : '';
              const isNegative = deltaStr.includes('−') || deltaStr.includes('-');
              return (
                <DataTableRow key={sim.id} className="border-b border-gray-50 cursor-pointer">
                  <DataTableCell className="py-2.5 pr-4 text-gray-900 font-medium">{sim.name}</DataTableCell>
                  <DataTableCell className="py-2.5 text-gray-500">{sim.baseScenarioName}</DataTableCell>
                  <DataTableCell className={cn('py-2.5 font-medium', isNegative ? 'text-red-600' : 'text-emerald-600')}>
                    {primaryImpact?.metric}: {deltaStr}
                  </DataTableCell>
                  <DataTableCell align="right" className="py-2.5 pl-3 text-gray-500">
                    {new Date(sim.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </DataTableCell>
                </DataTableRow>
              );
            })}
          </DataTableBody>
        </DataTable>
      </div>
    </div>
  );
}
