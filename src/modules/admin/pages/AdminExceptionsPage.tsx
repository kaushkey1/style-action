import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
  GitBranch,
  CheckSquare,
  Square,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent, Switch, Pagination, usePagination, SectionHeader, EmptyState } from '@/components/ui';
import { exceptionRules, routingConfigs, type RoutingConfig } from '../data/mockAdminData';
import { cn } from '@/lib/utils';

type SeverityFilter = 'All' | 'S1' | 'S2' | 'S3' | 'S4';

function SeverityBadge({ severity }: { severity: 'S1' | 'S2' | 'S3' | 'S4' }) {
  switch (severity) {
    case 'S1':
      return <Badge variant="error">{severity}</Badge>;
    case 'S2':
      return <Badge variant="warning">{severity}</Badge>;
    case 'S3':
      return <Badge variant="default">{severity}</Badge>;
    case 'S4':
      return <Badge variant="outline" className="text-gray-500 border-gray-300">{severity}</Badge>;
  }
}

function CheckIcon({ checked }: { checked: boolean }) {
  return checked ? (
    <CheckSquare className="w-4 h-4 text-primary" />
  ) : (
    <Square className="w-4 h-4 text-gray-400" />
  );
}

function RoutingDetailPanel({ config }: { config: RoutingConfig }) {
  const { routing } = config;
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-gray-900">Routing Detail: {config.kpiName}</h3>
        {config.dualRoute && <Badge variant="primary" size="sm">Dual-Route</Badge>}
        {!config.dualRoute && config.productRoute && <Badge variant="info" size="sm">Product Only</Badge>}
        {!config.dualRoute && config.opsRoute && <Badge variant="warning" size="sm">Ops Only</Badge>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {routing.productChain && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Product-Dimension Routing
            </h4>
            <div className="space-y-1.5 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-14 shrink-0">Primary</span>
                <ArrowRight className="w-3 h-3 text-gray-400" />
                <span>{routing.productChain.primary}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-14 shrink-0">CC</span>
                <ArrowRight className="w-3 h-3 text-gray-400" />
                <span>{routing.productChain.cc}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-14 shrink-0">Escalate</span>
                <ArrowRight className="w-3 h-3 text-gray-400" />
                <span>{routing.productChain.escalate}</span>
              </div>
            </div>
          </div>
        )}

        {routing.opsChain && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Operations-Dimension Routing
            </h4>
            <div className="space-y-1.5 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-14 shrink-0">Primary</span>
                <ArrowRight className="w-3 h-3 text-gray-400" />
                <span>{routing.opsChain.primary}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-14 shrink-0">CC</span>
                <ArrowRight className="w-3 h-3 text-gray-400" />
                <span>{routing.opsChain.cc}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-14 shrink-0">Escalate</span>
                <ArrowRight className="w-3 h-3 text-gray-400" />
                <span>{routing.opsChain.escalate}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {routing.cascadeDesc && (
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3 h-3 text-warning" />
            <h4 className="text-xs font-semibold text-gray-700">Cascade Detection</h4>
          </div>
          <p className="text-xs text-gray-500 mt-1">{routing.cascadeDesc}</p>
        </div>
      )}

      {!routing.cascadeDesc && config.cascadeThreshold === null && (
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-500 italic">No cascade detection configured for this KPI.</p>
        </div>
      )}
    </div>
  );
}

function RoutingTab() {
  const [selectedKpi, setSelectedKpi] = useState<string | null>(null);
  const selectedConfig = selectedKpi ? routingConfigs.find((c) => c.kpiName === selectedKpi) ?? null : null;

  return (
    <div className="space-y-4">
      <SectionHeader title="Exception Routing Configuration" />

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">KPI</th>
              <th className="text-center px-3 py-2 text-xs font-medium text-gray-500">Product Route</th>
              <th className="text-center px-3 py-2 text-xs font-medium text-gray-500">Ops Route</th>
              <th className="text-center px-3 py-2 text-xs font-medium text-gray-500">Dual-Route</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Cascade Threshold</th>
            </tr>
          </thead>
          <tbody>
            {routingConfigs.length === 0 ? (
              <tr><td colSpan={5}><EmptyState description="No routing configurations to display" /></td></tr>
            ) : routingConfigs.map((config) => (
              <tr
                key={config.kpiName}
                onClick={() => setSelectedKpi(selectedKpi === config.kpiName ? null : config.kpiName)}
                className={cn(
                  'border-b border-gray-100 cursor-pointer transition-colors',
                  selectedKpi === config.kpiName ? 'bg-primary/5' : 'hover:bg-gray-50'
                )}
              >
                <td className="px-3 py-2.5 text-gray-900 font-medium">{config.kpiName}</td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex justify-center">
                    <CheckIcon checked={config.productRoute} />
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex justify-center">
                    <CheckIcon checked={config.opsRoute} />
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex justify-center">
                    <CheckIcon checked={config.dualRoute} />
                  </div>
                </td>
                <td className="px-3 py-2.5 text-gray-700">
                  {config.cascadeThreshold !== null ? (
                    <span>{config.cascadeThreshold} stores</span>
                  ) : (
                    <span className="text-gray-500">--</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {selectedConfig ? (
        <RoutingDetailPanel config={selectedConfig} />
      ) : (
        <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-4 text-center">
          <GitBranch className="w-5 h-5 text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Click a KPI row above to view its routing detail</p>
        </div>
      )}
    </div>
  );
}

export function AdminExceptionsPage() {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('All');
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [ruleStates, setRuleStates] = useState<Record<string, boolean>>(
    () => Object.fromEntries(exceptionRules.map((r) => [r.id, r.active]))
  );

  const filteredRules = severityFilter === 'All'
    ? exceptionRules
    : exceptionRules.filter((r) => r.severity === severityFilter);

  const selectedRule = selectedRuleId
    ? exceptionRules.find((r) => r.id === selectedRuleId)
    : null;

  const severityOptions: SeverityFilter[] = ['All', 'S1', 'S2', 'S3', 'S4'];

  const [currentPage, setCurrentPage] = useState(1);
  const { totalPages, totalItems, pageSize, getPageItems } = usePagination(filteredRules, 10);
  const pageItems = getPageItems(currentPage);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reset pagination when filters change
    setCurrentPage(1);
  }, [severityFilter]);

  return (
    <div className="relative">
      <div className="absolute inset-0 z-10 flex items-start justify-center pt-48 bg-white/60 rounded-lg">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-500">Coming Soon</p>
          <p className="text-xs text-gray-400 mt-1">Platform configuration is under development</p>
        </div>
      </div>
    <div className="space-y-4 pointer-events-none select-none opacity-40 grayscale">
      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="routing">Routing</TabsTrigger>
        </TabsList>

        {/* Tab 1 — Exception Generation Rules */}
        <TabsContent value="rules">
          <div className="space-y-3">
            <SectionHeader
              title="Exception Generation Rules"
              actions={
                <Button size="sm">
                  <Plus className="w-3 h-3 mr-1" />
                  Add Rule
                </Button>
              }
            />

            {/* Severity filter row */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Severity:</span>
              {severityOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSeverityFilter(opt)}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium rounded-lg transition-colors',
                    severityFilter === opt
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Rules table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">KPI</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Trigger</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Severity</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Agent</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Cooldown</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Escalation</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length === 0 ? (
                    <tr><td colSpan={7}><EmptyState description="No exception rules to display" /></td></tr>
                  ) : pageItems.map((rule) => (
                    <tr
                      key={rule.id}
                      onClick={() => setSelectedRuleId(selectedRuleId === rule.id ? null : rule.id)}
                      className={cn(
                        'border-b border-gray-100 cursor-pointer transition-colors',
                        selectedRuleId === rule.id
                          ? 'bg-primary/5'
                          : 'hover:bg-gray-50'
                      )}
                    >
                      <td className="px-3 py-2.5 text-gray-900 font-medium">{rule.kpiName}</td>
                      <td className="px-3 py-2.5 text-gray-700">{rule.trigger}</td>
                      <td className="px-3 py-2.5">
                        <SeverityBadge severity={rule.severity} />
                      </td>
                      <td className="px-3 py-2.5 text-gray-700 text-xs">{rule.agent}</td>
                      <td className="px-3 py-2.5 text-gray-700">{rule.cooldownHours}h</td>
                      <td className="px-3 py-2.5 text-gray-700">{rule.escalationHours}h</td>
                      <td className="px-3 py-2.5">
                        <Switch
                          checked={ruleStates[rule.id]}
                          onCheckedChange={(checked) =>
                            setRuleStates((prev) => ({ ...prev, [rule.id]: checked }))
                          }
                          aria-label={`Toggle ${rule.kpiName} rule`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={totalItems}
                    pageSize={pageSize}
                  />
                </div>
              )}
            </div>

            {/* Footer note */}
            <div className="flex items-center gap-2 px-1">
              <Info className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-500">
                Default cooldowns: S1=4h &nbsp; S2=8h &nbsp; S3=24h &nbsp; S4=48h
              </span>
            </div>

            {/* Selected rule detail panel */}
            {selectedRule && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                <SectionHeader
                  title={`Rule Detail: ${selectedRule.kpiName}`}
                  actions={<SeverityBadge severity={selectedRule.severity} />}
                  className="mb-0"
                />
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">Trigger Condition</span>
                    <p className="text-gray-900 font-medium mt-0.5">{selectedRule.trigger}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Assigned Agent</span>
                    <p className="text-gray-900 font-medium mt-0.5">{selectedRule.agent}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Cooldown Period</span>
                    <p className="text-gray-900 font-medium mt-0.5">{selectedRule.cooldownHours} hours</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Escalation Window</span>
                    <p className="text-gray-900 font-medium mt-0.5">{selectedRule.escalationHours} hours</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Rule ID:</span> {selectedRule.id}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 2 — Routing Configuration */}
        <TabsContent value="routing">
          <RoutingTab />
        </TabsContent>
      </Tabs>
    </div>
    </div>
  );
}
