import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Progress,
  EmptyState,
} from '@/components/ui';
import {
  roleTransitions,
  agentRoleMappings,
  roleKpiAssignments,
  agenticRoles,
  transitionSummary,
  type RoleTransition,
  type AutonomyTier,
} from '../data/mockAdminData';
import {
  GitMerge,
  Bot,
  BarChart3,
  Users,
  ArrowRight,
  X,
  CheckCircle2,
  Clock,
  CalendarClock,
  Cpu,
} from 'lucide-react';

function getStatusBadge(status: RoleTransition['status']) {
  switch (status) {
    case 'completed':
      return <Badge variant="success" size="sm">Completed</Badge>;
    case 'in_progress':
      return <Badge variant="warning" size="sm">In Progress</Badge>;
    case 'planned':
      return <Badge variant="outline" size="sm">Planned</Badge>;
  }
}

function getTierBadge(tier: AutonomyTier) {
  const variants: Record<AutonomyTier, { variant: 'primary' | 'info' | 'warning' | 'default'; label: string }> = {
    T1: { variant: 'primary', label: 'T1 Autonomous' },
    T2: { variant: 'info', label: 'T2 Supervised' },
    T3: { variant: 'warning', label: 'T3 Co-pilot' },
    T4: { variant: 'default', label: 'T4 Oracle' },
  };
  const config = variants[tier];
  return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
}

function getQuadrantBadge(quadrant: string) {
  const variants: Record<string, 'success' | 'info' | 'warning' | 'secondary'> = {
    Financial: 'success',
    Customer: 'info',
    Operations: 'warning',
    People: 'secondary',
  };
  return <Badge variant={variants[quadrant] ?? 'default'} size="sm">{quadrant}</Badge>;
}

// ── Role Mapping Tab ──

function RoleMappingTab() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? roleTransitions.find((t) => t.id === selectedId) ?? null : null;
  const selectedAgentic = selected ? agenticRoles.find((r) => r.id === selected.agenticRoleId) : null;

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- custom 5-col stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Users className="w-3 h-3" />
            Legacy Roles
          </div>
          <div className="text-xl font-bold text-gray-900">{transitionSummary.legacyRoleCount}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <GitMerge className="w-3 h-3" />
            Agentic Roles
          </div>
          <div className="text-xl font-bold text-gray-900">{transitionSummary.agenticRoleCount}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <CheckCircle2 className="w-3 h-3 text-success" />
            Completed
          </div>
          <div className="text-xl font-semibold text-green-700">{transitionSummary.transitionsCompleted}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Clock className="w-3 h-3 text-warning" />
            In Progress
          </div>
          <div className="text-xl font-semibold text-amber-700">{transitionSummary.transitionsInProgress}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Users className="w-3 h-3" />
            Users Migrated
          </div>
          <div className="text-xl font-bold text-gray-900">{transitionSummary.totalUsersMigrated}</div>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className={cn('bg-white rounded-lg border border-gray-200 p-3 overflow-auto', selected ? 'flex-1' : 'w-full')}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Legacy Role</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">HC</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Maps To</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cluster</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Migrated</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Progress</th>
              </tr>
            </thead>
            <tbody>
              {roleTransitions.length === 0 ? (
                <tr><td colSpan={7}><EmptyState description="No role transitions to display" /></td></tr>
              ) : roleTransitions.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setSelectedId(selectedId === t.id ? null : t.id)}
                  className={cn(
                    'border-b border-gray-50 cursor-pointer transition-colors duration-150',
                    selectedId === t.id ? 'bg-primary/5' : 'hover:bg-gray-50'
                  )}
                >
                  <td className="py-2.5 px-3 font-medium text-gray-900">{t.legacyRoleName}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700">{t.legacyHeadcount}</td>
                  <td className="py-2.5 px-3">{getStatusBadge(t.status)}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      {t.agenticRoleName}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-gray-500">{t.agenticCluster.split(':')[0]}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700">{t.usersTransitioned}/{t.totalUsers}</td>
                  <td className="py-2.5 px-3">
                    <Progress value={t.totalUsers > 0 ? (t.usersTransitioned / t.totalUsers) * 100 : 0} className="h-1.5" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-[380px] shrink-0 bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{selected.legacyRoleName}</h2>
                <p className="text-xs text-gray-500 mt-0.5">Legacy headcount: {selected.legacyHeadcount}</p>
              </div>
              <button onClick={() => setSelectedId(null)} className="p-1 rounded hover:bg-gray-100 transition-colors" aria-label="Close detail panel">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Transition</h3>
              <div className="flex items-center gap-2 text-sm mb-2">
                <span className="text-gray-700">{selected.legacyRoleName}</span>
                <ArrowRight className="w-3 h-3 text-gray-400" />
                <span className="font-medium text-gray-900">{selected.agenticRoleName}</span>
              </div>
              {getStatusBadge(selected.status)}
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Details</h3>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-gray-500">Cluster</span>
                <span className="text-gray-900">{selected.agenticCluster}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-gray-500">Users Migrated</span>
                <span className="font-medium text-gray-900">{selected.usersTransitioned} / {selected.totalUsers}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-gray-500">Target Date</span>
                <span className="text-gray-900">{new Date(selected.targetDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-gray-500">Agent Coverage</span>
                <span className="font-medium text-gray-900">{selected.agentCoveragePct}%</span>
              </div>
              <Progress value={selected.agentCoveragePct} className="h-1.5" />
            </div>

            {selectedAgentic && (
              <>
                <div className="border-t border-gray-100 pt-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Target Role Details</h3>
                  <p className="text-sm text-gray-700 mb-2">{selectedAgentic.description}</p>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-gray-500">New Headcount</span>
                    <span className="font-medium text-gray-900">{selectedAgentic.headcount}</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Agents Assigned</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAgentic.agents.map((a) => (
                      <Badge key={a} variant="primary" size="sm">{a}</Badge>
                    ))}
                  </div>
                </div>

                {selectedAgentic.absorbsLegacyRoles.length > 0 && (
                  <div className="border-t border-gray-100 pt-3">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Absorbs Legacy Roles</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedAgentic.absorbsLegacyRoles.map((r) => (
                        <Badge key={r} variant="outline" size="sm">{r}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Agent Coverage Tab ──

function AgentCoverageTab() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? agentRoleMappings.find((a) => a.id === selectedId) ?? null : null;

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- custom 5-col stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Bot className="w-3 h-3" />
            Total Agents
          </div>
          <div className="text-xl font-bold text-gray-900">{transitionSummary.agentCount}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Cpu className="w-3 h-3 text-primary" />
            T1 Autonomous
          </div>
          <div className="text-xl font-bold text-primary">{transitionSummary.tierDistribution.T1}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Cpu className="w-3 h-3 text-blue-500" />
            T2 Supervised
          </div>
          <div className="text-xl font-bold text-blue-600">{transitionSummary.tierDistribution.T2}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Cpu className="w-3 h-3 text-warning" />
            T3 Co-pilot
          </div>
          <div className="text-xl font-semibold text-amber-700">{transitionSummary.tierDistribution.T3}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Cpu className="w-3 h-3 text-gray-500" />
            T4 Oracle
          </div>
          <div className="text-xl font-bold text-gray-600">{transitionSummary.tierDistribution.T4}</div>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className={cn('bg-white rounded-lg border border-gray-200 p-3 overflow-auto', selected ? 'flex-1' : 'w-full')}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Agent Name</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Autonomy Tier</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Roles</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">KPIs</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Automates</th>
              </tr>
            </thead>
            <tbody>
              {agentRoleMappings.length === 0 ? (
                <tr><td colSpan={5}><EmptyState description="No agent-role mappings to display" /></td></tr>
              ) : agentRoleMappings.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => setSelectedId(selectedId === a.id ? null : a.id)}
                  className={cn(
                    'border-b border-gray-50 cursor-pointer transition-colors duration-150',
                    selectedId === a.id ? 'bg-primary/5' : 'hover:bg-gray-50'
                  )}
                >
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{a.agentName}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">{getTierBadge(a.autonomyTier)}</td>
                  <td className="py-2.5 px-3 text-gray-700 text-xs max-w-[200px] truncate">{a.assignedRoles.join(', ')}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700">{a.kpisMonitored.length}</td>
                  <td className="py-2.5 px-3 text-gray-500 text-xs max-w-[250px] truncate">{a.whatItAutomates}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-[380px] shrink-0 bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{selected.agentName}</h2>
                <div className="mt-1">{getTierBadge(selected.autonomyTier)}</div>
              </div>
              <button onClick={() => setSelectedId(null)} className="p-1 rounded hover:bg-gray-100 transition-colors" aria-label="Close detail panel">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">What It Automates</h3>
              <p className="text-sm text-gray-700">{selected.whatItAutomates}</p>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Assigned Roles</h3>
              <div className="flex flex-wrap gap-1.5">
                {selected.assignedRoles.map((r) => (
                  <Badge key={r} variant="primary" size="sm">{r}</Badge>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">KPIs Monitored</h3>
              <div className="space-y-1.5">
                {selected.kpisMonitored.map((kpi) => (
                  <div key={kpi} className="flex items-center gap-2 text-sm text-gray-700">
                    <BarChart3 className="w-3 h-3 text-gray-400" />
                    {kpi}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Autonomy Details</h3>
              <div className="text-sm text-gray-700">
                {selected.autonomyTier === 'T1' && 'Agent executes within rules. No human intervention needed.'}
                {selected.autonomyTier === 'T2' && 'Agent recommends, human approves with 1-click.'}
                {selected.autonomyTier === 'T3' && 'Human leads, agent accelerates and assists.'}
                {selected.autonomyTier === 'T4' && 'Agent watches and alerts, never acts autonomously.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── KPI Scorecard Tab ──

function KpiScorecardTab() {
  const rolesWithKpis = roleKpiAssignments;
  const [selectedRoleId, setSelectedRoleId] = useState(rolesWithKpis[0]?.roleId ?? '');

  const currentAssignment = useMemo(
    () => rolesWithKpis.find((r) => r.roleId === selectedRoleId),
    [rolesWithKpis, selectedRoleId]
  );

  const groupedKpis = useMemo(() => {
    if (!currentAssignment) return {};
    const groups: Record<string, typeof currentAssignment.kpis> = {};
    for (const kpi of currentAssignment.kpis) {
      const q = kpi.quadrant;
      if (!groups[q]) groups[q] = [];
      groups[q]!.push(kpi);
    }
    return groups;
  }, [currentAssignment]);

  const quadrantOrder = ['Financial', 'Customer', 'Operations', 'People'];

  return (
    <div className="space-y-4">
      {/* Role filter */}
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label className="text-sm font-medium text-gray-700">Role</label>
        <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {rolesWithKpis.map((r) => (
              <SelectItem key={r.roleId} value={r.roleId}>{r.roleName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {currentAssignment && (
          <span className="text-xs text-gray-500">{currentAssignment.kpis.length} KPIs assigned</span>
        )}
      </div>

      {/* KPI Table grouped by quadrant */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">KPI ID</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">KPI Name</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quadrant</th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">P/S</th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Weight</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Agent Handles</th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <span className="inline-block w-2 h-2 rounded-full bg-success mr-1" />G
              </th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <span className="inline-block w-2 h-2 rounded-full bg-warning mr-1" />A
              </th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <span className="inline-block w-2 h-2 rounded-full bg-error mr-1" />R
              </th>
            </tr>
          </thead>
          <tbody>
            {quadrantOrder.map((quadrant) => {
              const kpis = groupedKpis[quadrant];
              if (!kpis || kpis.length === 0) return null;
              return kpis.map((kpi, idx) => (
                <tr key={`${quadrant}-${kpi.kpiId}-${idx}`} className={cn('border-b border-gray-50', idx === 0 && 'border-t border-gray-200')}>
                  <td className="py-2 px-3 text-gray-500 font-mono text-xs">{kpi.kpiId}</td>
                  <td className="py-2 px-3 text-gray-900">{kpi.kpiName}</td>
                  <td className="py-2 px-3">{idx === 0 ? getQuadrantBadge(quadrant) : null}</td>
                  <td className="py-2 px-3 text-center">
                    <Badge variant={kpi.ps === 'P' ? 'primary' : 'outline'} size="sm">{kpi.ps}</Badge>
                  </td>
                  <td className="py-2 px-3 text-right font-medium text-gray-900">{kpi.weight}</td>
                  <td className="py-2 px-3 text-xs text-gray-500">{kpi.agentHandles}</td>
                  <td className="py-2 px-3 text-center text-xs text-green-700">{kpi.ragGreen}</td>
                  <td className="py-2 px-3 text-center text-xs text-yellow-700">{kpi.ragAmber}</td>
                  <td className="py-2 px-3 text-center text-xs text-red-700">{kpi.ragRed}</td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Page ──

export function AdminTransitionsPage() {
  return (
    <div className="relative">
      <div className="absolute inset-0 z-10 flex items-start justify-center pt-48 bg-white/60 rounded-lg">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <GitMerge className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-500">Coming Soon</p>
          <p className="text-xs text-gray-400 mt-1">Platform configuration is under development</p>
        </div>
      </div>
    <div className="space-y-4 pointer-events-none select-none opacity-40 grayscale">
      <Tabs defaultValue="mapping">
        <TabsList>
          <TabsTrigger value="mapping">
            <GitMerge className="w-4 h-4 mr-1.5" />
            Role Mapping
          </TabsTrigger>
          <TabsTrigger value="agents">
            <Bot className="w-4 h-4 mr-1.5" />
            Agent Coverage
          </TabsTrigger>
          <TabsTrigger value="kpis">
            <CalendarClock className="w-4 h-4 mr-1.5" />
            KPI Scorecard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mapping">
          <RoleMappingTab />
        </TabsContent>
        <TabsContent value="agents">
          <AgentCoverageTab />
        </TabsContent>
        <TabsContent value="kpis">
          <KpiScorecardTab />
        </TabsContent>
      </Tabs>
    </div>
    </div>
  );
}
