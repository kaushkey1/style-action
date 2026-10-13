import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  IndianRupee,
  TrendingUp,
  ShoppingBag,
  Package,
  Users,
  Heart,
  Truck,
  Target,
  Wallet,
  Zap,
  AlertTriangle,
  Layers,
  Sparkles,
  Tag,
  Clock,
  Building,
  MapPin,
  Megaphone,
  Settings,
  Crown,
  Maximize2,
  ArrowRight,
} from 'lucide-react';
import {
  Badge,
  Button,
  SectionHeader,
  MetricGrid,
  EmptyState,
  Tabs, TabsList, TabsTrigger, TabsContent,
  DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell,
} from '@/components/ui';
import { usePersonaStore } from '@/hooks/usePersonaStore';
import { usePersonaConfig } from '@/hooks/usePersonaConfig';
import {
  personaMap,
  type CTKpi, type TabSection,
  type TableSection, type BarsSection, type AlertsSection,
  type FunnelSection, type TrackerSection, type SummaryCardsSection,
} from '../data/mockControlTower';
import { mockExceptions } from '@/modules/exceptions/data/mockExceptions';
import { cn, ragCardClasses, ragBadgeVariant, ragLabel, severityBorderClasses, formatCurrency } from '@/lib/utils';
import type { RagStatus } from '@/lib/utils';
import { TimePeriodFilter } from '@/components/TimePeriodFilter';
import { ApexGeographyDrilldown } from '@/modules/dashboard/components/ApexGeographyDrilldown';
import { ApexCategoryPods } from '@/modules/dashboard/components/ApexCategoryPods';
import { DailyCadenceStrip } from '@/modules/calendar/components/DailyCadenceStrip';
import { morningBriefing } from '@/modules/calendar/data/mockCadence';

// ─── Icon map ─────────────────────────────────────────────────────────

const iconMap: Record<string, React.ElementType> = {
  'activity': Activity,
  'indian-rupee': IndianRupee,
  'trending-up': TrendingUp,
  'shopping-bag': ShoppingBag,
  'package-check': Package,
  'truck': Truck,
  'target': Target,
  'wallet': Wallet,
  'zap': Zap,
  'heart': Heart,
  'users': Users,
  'clock': Clock,
  'tag': Tag,
  'layers': Layers,
  'sparkles': Sparkles,
  'alert-triangle': AlertTriangle,
  'building': Building,
  'map-pin': MapPin,
  'megaphone': Megaphone,
  'settings': Settings,
  'crown': Crown,
  'maximize-2': Maximize2,
};

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Comp = iconMap[name] || Activity;
  return <Comp className={className} />;
}

// ─── KPI Card & Grid ──────────────────────────────────────────────────

function KPICard({ kpi }: { kpi: CTKpi }) {
  const status = kpi.status as RagStatus;

  return (
    <div className={cn('rounded-lg border border-gray-200 border-l-3 p-2.5 transition-all duration-200 hover:shadow-md', ragCardClasses(status))}>
      <div className="flex items-center justify-between gap-1 mb-0.5">
        <p className="text-xs font-medium text-gray-700 truncate">{kpi.name}</p>
        <Badge variant={ragBadgeVariant(status)} className="text-[10px]">
          {ragLabel(status)}
        </Badge>
      </div>
      <p className="text-lg font-bold text-gray-900">{kpi.value}</p>
      <p className="text-[10px] text-gray-500">Target: {kpi.target}</p>
    </div>
  );
}

function KPIGrid({ kpis }: { kpis: CTKpi[] }) {
  const count = kpis.length;
  const cols: 3 | 4 = (count % 3 === 0 && count % 4 !== 0) || count === 2 ? 3 : 4;
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Key Metrics" actions={<TimePeriodFilter />} />
      <MetricGrid columns={cols} className="mb-0">
        {kpis.map((kpi) => (
          <KPICard key={kpi.id} kpi={kpi} />
        ))}
      </MetricGrid>
    </div>
  );
}

// ─── Section renderers ────────────────────────────────────────────────

function TableSectionView({ section }: { section: TableSection }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title={section.title} />
      <DataTable>
          <DataTableHeader>
              {section.headers.map((h) => (
                <DataTableHead key={h}>{h}</DataTableHead>
              ))}
          </DataTableHeader>
          <DataTableBody>
            {section.rows.length === 0 ? (
              <DataTableRow><DataTableCell colSpan={section.headers.length}><EmptyState description="No data to display" /></DataTableCell></DataTableRow>
            ) : section.rows.map((row, i) => (
              <DataTableRow key={i}>
                {row.map((cell, j) => (
                  <DataTableCell key={j}>{cell}</DataTableCell>
                ))}
              </DataTableRow>
            ))}
          </DataTableBody>
      </DataTable>
    </div>
  );
}

function BarsSectionView({ section }: { section: BarsSection }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title={section.title} />
      {section.items.length === 0 ? <EmptyState description="No data to display" /> : (
        <div className="space-y-3">
          {section.items.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs text-gray-700">{item.label}</span>
                <span className="text-xs font-medium text-gray-900">
                  {item.value}{item.max <= 100 ? '%' : ` / ${item.max}`}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                { }
                <div
                  className={cn('h-full rounded-full transition-all duration-500', item.color)}
                  // eslint-disable-next-line no-restricted-syntax -- dynamic width
                  style={{ width: `${(item.value / item.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AlertsSectionView({ section }: { section: AlertsSection }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title={section.title} />
      {section.items.length === 0 ? <EmptyState description="No alerts to display" /> : (
        <div className="space-y-2">
          {section.items.map((item, i) => (
            <div key={i} className={cn('border-l-3 rounded-r-lg p-3', severityBorderClasses(item.severity))}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-gray-700 flex-1">{item.text}</p>
                <span className="text-[10px] text-gray-500 ml-3 whitespace-nowrap">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FunnelSectionView({ section }: { section: FunnelSection }) {
  const maxVal = Math.max(...section.steps.map((s) => s.value));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title={section.title} />
      <div className="space-y-2">
        {section.steps.map((step) => (
          <div key={step.label} className="flex items-center gap-3">
            <span className="text-xs text-gray-600 w-28 shrink-0">{step.label}</span>
            <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
              { }
              <div
                className={cn('h-full rounded flex items-center px-2 transition-all duration-500', step.color)}
                // eslint-disable-next-line no-restricted-syntax -- dynamic width
                style={{ width: `${(step.value / maxVal) * 100}%` }}
              >
                <span className="text-[10px] font-medium text-white">{step.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrackerSectionView({ section }: { section: TrackerSection }) {
  const total = section.phases.reduce((sum, p) => sum + p.count, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title={section.title} />
      <div className="flex h-4 rounded-full overflow-hidden mb-3">
        {section.phases.map((phase) => (
          <div
            key={phase.label}
            className={cn('transition-all duration-500', phase.color)}
            // eslint-disable-next-line no-restricted-syntax -- dynamic width
            style={{ width: `${(phase.count / total) * 100}%` }}
            title={`${phase.label}: ${phase.count}`}
          />
        ))}
      </div>
      <MetricGrid columns={4} className="gap-2 mb-0">
        {section.phases.map((phase) => (
          <div key={phase.label} className="flex items-center gap-1.5">
            <span className={cn('w-2 h-2 rounded-full shrink-0', phase.color)} />
            <span className="text-[10px] text-gray-600 truncate">{phase.label}</span>
            <span className="text-[10px] font-medium text-gray-900 ml-auto">{phase.count}</span>
          </div>
        ))}
      </MetricGrid>
    </div>
  );
}

function SummaryCardsSectionView({ section }: { section: SummaryCardsSection }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title={section.title} />
      <MetricGrid columns={3} className="mb-0">
        {section.cards.map((card) => (
          <div key={card.label} className={cn('rounded-lg border border-gray-200 border-l-3 p-3', ragCardClasses(card.status as RagStatus))}>
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{card.value}</p>
          </div>
        ))}
      </MetricGrid>
    </div>
  );
}

function SectionRenderer({ section }: { section: TabSection }) {
  switch (section.type) {
    case 'table': return <TableSectionView section={section} />;
    case 'bars': return <BarsSectionView section={section} />;
    case 'alerts': return <AlertsSectionView section={section} />;
    case 'funnel': return <FunnelSectionView section={section} />;
    case 'tracker': return <TrackerSectionView section={section} />;
    case 'summary-cards': return <SummaryCardsSectionView section={section} />;
  }
}

// ─── Today's Vitals ──────────────────────────────────────────────────

function TodaysVitals() {
  const statusClass = {
    'on-track': 'text-success',
    'warning': 'text-warning',
    'critical': 'text-error',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <SectionHeader title="Today's Vitals" className="mb-2" />
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- vitals strip with divide-x, not metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:items-stretch lg:divide-x divide-gray-100 gap-px bg-gray-50 rounded-lg border border-gray-200">
        {morningBriefing.vitals.map((vital) => (
          <div key={vital.metric} className="px-3 py-2 min-w-0 lg:flex-1">
            <p className="text-xs text-gray-500 truncate">{vital.metric}</p>
            <p className={cn('text-sm font-semibold mt-0.5', statusClass[vital.status])}>
              {vital.value}
            </p>
            <p className="text-[10px] text-gray-400 truncate">{vital.vsTarget}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Control Tower Exception Table ────────────────────────────────────

const severityConfig = {
  S1: { label: 'Critical', variant: 'error' as const },
  S2: { label: 'High', variant: 'warning' as const },
  S3: { label: 'Medium', variant: 'default' as const },
  S4: { label: 'Low', variant: 'default' as const },
} as const;

const statusDisplay: Record<string, { label: string; variant: 'warning' | 'error' | 'default' | 'success' }> = {
  'awaiting-approval': { label: 'Needs Approval', variant: 'warning' },
  'agent-reviewing': { label: 'Agent Working', variant: 'default' },
  'agent-analyzing': { label: 'Agent Analyzing', variant: 'default' },
  'investigating': { label: 'Investigating', variant: 'warning' },
  'escalated': { label: 'Escalated', variant: 'error' },
  'agent-acted': { label: 'Agent Acted', variant: 'success' },
};

const activeStatuses = new Set(['awaiting-approval', 'agent-reviewing', 'agent-analyzing', 'investigating', 'escalated', 'agent-acted']);

function ControlTowerTableCard() {
  const navigate = useNavigate();
  const { personaId } = usePersonaStore();
  const persona = personaMap[personaId];
  const domainFilter = persona?.config.defaultFilters.exceptionDomain;

  const filtered = mockExceptions
    .filter((e) => {
      if (!activeStatuses.has(e.status)) return false;
      if (domainFilter && domainFilter !== 'all' && e.domain !== domainFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const sev = { S1: 0, S2: 1, S3: 2, S4: 3 } as const;
      const sa = sev[a.severity] ?? 4;
      const sb = sev[b.severity] ?? 4;
      if (sa !== sb) return sa - sb;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    })
    .slice(0, 10);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <SectionHeader
        title={<span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-gray-500" />Exceptions &amp; Approvals</span>}
        actions={
          <div className="flex items-center gap-2">
            {filtered.filter((e) => e.status === 'awaiting-approval').length > 0 && (
              <Badge variant="warning" size="sm">
                {filtered.filter((e) => e.status === 'awaiting-approval').length} pending approval
              </Badge>
            )}
            <Badge variant="default" size="sm">{filtered.length} active</Badge>
          </div>
        }
      />
      {/* Severity summary strip */}
      <div className="flex items-center gap-4 flex-wrap mb-3 pb-3 border-b border-gray-100">
        {([['S1', 'Critical', 'error'] as const, ['S2', 'High', 'warning'] as const, ['S3', 'Medium', 'primary'] as const, ['S4', 'Low', 'default'] as const]).map(([code, label, variant]) => {
          const count = filtered.filter((e) => e.severity === code).length;
          return (
            <div key={code} className="flex items-center gap-1.5 text-xs">
              <Badge variant={variant} size="sm">{code}</Badge>
              <span className="text-gray-500">{label}</span>
              <span className="font-semibold text-gray-900">{count}</span>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 ? (
        <EmptyState description="No active exceptions for your domain" />
      ) : (
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-2 pr-3">Sev</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-2 pr-3">Exception</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-2 pr-3">Agent Action</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-2 pr-3">Status</th>
                <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-2 pr-3">Impact</th>
                <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-2 pl-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((exc) => {
                const sev = severityConfig[exc.severity];
                const st = statusDisplay[exc.status] ?? { label: exc.status, variant: 'default' as const };
                const action = exc.recommendations?.[0]?.action;
                return (
                  <tr key={exc.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="py-2.5 pr-3">
                      <Badge variant={sev.variant} size="sm">{exc.severity}</Badge>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[260px]">{exc.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-gray-400 font-medium">{exc.domain}</span>
                          <span className="text-[10px] text-gray-400">&middot;</span>
                          <span className="text-[10px] text-gray-400">{exc.relativeTime}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <p className="text-xs text-gray-600 truncate max-w-[220px]">
                        {action ?? 'Investigating...'}
                      </p>
                      {exc.recommendations?.[0]?.agent && (
                        <span className="text-[10px] text-primary font-medium">
                          {exc.recommendations[0].agent}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge variant={st.variant} size="sm">{st.label}</Badge>
                    </td>
                    <td className="py-2.5 pr-3 text-right">
                      <span className="text-xs font-semibold text-gray-900 whitespace-nowrap">
                        {formatCurrency(exc.projected_impact_inr)}
                      </span>
                    </td>
                    <td className="py-2.5 pl-3 text-right">
                      {exc.status === 'awaiting-approval' ? (
                        <Button size="sm" className="text-xs h-7" onClick={() => navigate('/exceptions')}>
                          Approve
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/exceptions')}>
                          View
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <Button variant="ghost" size="sm" className="w-full justify-between text-xs" onClick={() => navigate('/exceptions')}>
          View All Exceptions
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────

export function ControlTowerPage() {
  const { personaId } = usePersonaStore();

  const persona = usePersonaConfig(personaMap);

  // Track active tab for pinned KPI strip
  const [activeTabId, setActiveTabId] = useState(persona.tabs[0]?.id ?? '');

  // Reset active tab when persona changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setActiveTabId(persona.tabs[0]?.id ?? ''); }, [personaId]);

  const activeTab = persona.tabs.find(t => t.id === activeTabId) ?? persona.tabs[0];

  return (
    <div className="animate-fadeInUp space-y-4">
      {/* 1. Pinned KPI strip — persists across tab switches */}
      {activeTab && <KPIGrid kpis={activeTab.kpis} />}

      {/* 2. Exceptions & Approvals — unified control tower table */}
      <ControlTowerTableCard />

      {/* 3. Domain tabs — persona tabs only (max 4-5), sections only (no KPIGrid repeat) */}
      <Tabs defaultValue={persona.tabs[0]?.id} key={personaId} onValueChange={setActiveTabId}>
        <TabsList variant="underline" className="mb-6">
          {persona.tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              <DynamicIcon name={tab.icon} className="w-3.5 h-3.5 mr-1.5" />
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {persona.tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            <div className="space-y-4">
              {(tab.id === 'apex-pulse' || tab.id === 'ceo-pulse') && (
                <>
                  <DailyCadenceStrip />
                  <TodaysVitals />
                </>
              )}
              {tab.id === 'apex-geography' || tab.id === 'ceo-geography' ? (
                <ApexGeographyDrilldown />
              ) : tab.id === 'apex-categories' ? (
                <ApexCategoryPods />
              ) : (
                tab.sections?.map((section, i) => (
                  <SectionRenderer key={i} section={section} />
                ))
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
