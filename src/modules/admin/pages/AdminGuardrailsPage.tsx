import { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';
import { Badge, Switch, EmptyState } from '@/components/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { mockGuardrails, type Guardrail } from '../data/mockGuardrails';
import { mockSystems, systemSummary, type ConnectedSystem } from '@/modules/agents/data/mockSystems';
import { cn } from '@/lib/utils';

function GuardrailRow({ guardrail }: { guardrail: Guardrail }) {
  const [active, setActive] = useState(guardrail.active);

  return (
    <div className="flex items-center justify-between gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-3 flex-1">
        <div className={cn('p-1.5 rounded-lg mt-0.5', guardrail.type === 'hard' ? 'bg-error-50' : 'bg-primary-50')}>
          {guardrail.type === 'hard' ? (
            <ShieldCheck className="w-4 h-4 text-error-600" />
          ) : (
            <Shield className="w-4 h-4 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-gray-900">{guardrail.name}</span>
            {guardrail.type === 'hard' && (
              <Badge variant="error" className="text-[10px]">Hard</Badge>
            )}
            {guardrail.mdaDirective && (
              <Badge variant="warning" className="text-[10px]">
                <Bookmark className="w-2.5 h-2.5 mr-0.5" />
                MDA
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-1">{guardrail.description}</p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Agents: {guardrail.agents.join(', ')}</span>
            {guardrail.triggeredToday > 0 && (
              <span className="text-xs text-warning-600">
                {guardrail.triggeredToday} triggered today
              </span>
            )}
            {guardrail.blockedToday > 0 && (
              <span className="text-xs text-error-600">
                {guardrail.blockedToday} blocked
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="shrink-0 ml-4">
        {guardrail.type === 'hard' ? (
          <Badge variant="success" className="text-[10px]">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Always Active
          </Badge>
        ) : (
          <Switch checked={active} onCheckedChange={setActive} />
        )}
      </div>
    </div>
  );
}

function SystemHealthCard({ system }: { system: ConnectedSystem }) {
  const borderColor =
    system.status === 'operational'
      ? 'border-success/30'
      : system.status === 'degraded'
        ? 'border-warning/30'
        : 'border-error/30';

  return (
    <div className={cn('bg-white rounded-lg border p-3 transition-all duration-200 hover:shadow-md', borderColor)}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm font-semibold text-gray-900">{system.name}</span>
        <Badge
          variant={
            system.status === 'operational' ? 'success' : system.status === 'degraded' ? 'warning' : 'error'
          }
          className="text-[10px]"
        >
          {system.status}
        </Badge>
      </div>
      <p className="text-xs text-gray-500 mb-2">{system.description}</p>
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- card-internal stats, not metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <p className="text-[10px] text-gray-400">Latency</p>
          <p className={cn('text-xs font-medium', system.latency > 200 ? 'text-warning-600' : 'text-gray-700')}>
            {system.latency}ms
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400">Errors</p>
          <p className={cn('text-xs font-medium', system.errorRate > 1 ? 'text-error-600' : 'text-gray-700')}>
            {system.errorRate}%
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400">Last</p>
          <p className="text-xs font-medium text-gray-700">{system.lastContact}</p>
        </div>
      </div>
    </div>
  );
}

export function AdminGuardrailsPage() {
  const hardGuardrails = mockGuardrails.filter((g) => g.type === 'hard');
  const softGuardrails = mockGuardrails.filter((g) => g.type === 'soft');
  const mdaGuardrails = mockGuardrails.filter((g) => g.mdaDirective);

  return (
    <div className="relative">
      <div className="absolute inset-0 z-10 flex items-start justify-center pt-48 bg-white/60 rounded-lg">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-500">Coming Soon</p>
          <p className="text-xs text-gray-400 mt-1">Platform configuration is under development</p>
        </div>
      </div>
    <div className="pointer-events-none select-none opacity-40 grayscale">
      <Tabs defaultValue="policies">
        <TabsList variant="underline" className="mb-6">
          <TabsTrigger value="policies">
            <Shield className="w-3.5 h-3.5 mr-1.5" />
            All Guardrails ({mockGuardrails.length})
          </TabsTrigger>
          <TabsTrigger value="mda">
            <Bookmark className="w-3.5 h-3.5 mr-1.5" />
            MDA Directives ({mdaGuardrails.length})
          </TabsTrigger>
          <TabsTrigger value="health">
            <Activity className="w-3.5 h-3.5 mr-1.5" />
            System Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="policies">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-error-600" />
                <span className="text-sm font-semibold text-gray-900">Hard Guardrails</span>
                <span className="text-xs text-gray-400">{hardGuardrails.length} rules — cannot be overridden by agents</span>
              </div>
              <div className="space-y-2">
                {hardGuardrails.length === 0 ? (
                  <EmptyState description="No hard guardrails configured" />
                ) : hardGuardrails.map((gr) => (
                  <GuardrailRow key={gr.id} guardrail={gr} />
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-gray-900">Soft Guardrails</span>
                <span className="text-xs text-gray-400">{softGuardrails.length} rules — agent can override with justification</span>
              </div>
              <div className="space-y-2">
                {softGuardrails.length === 0 ? (
                  <EmptyState description="No soft guardrails configured" />
                ) : softGuardrails.map((gr) => (
                  <GuardrailRow key={gr.id} guardrail={gr} />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mda">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Bookmark className="w-4 h-4 text-warning" />
              <span className="text-sm font-semibold text-gray-900">MDA Strategic Directives</span>
              <span className="text-xs text-gray-400">Leadership-mandated guardrails</span>
            </div>
            <div className="space-y-2">
              {mdaGuardrails.length === 0 ? (
                <EmptyState description="No MDA guardrails configured" />
              ) : mdaGuardrails.map((gr) => (
                <GuardrailRow key={gr.id} guardrail={gr} />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="health">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success" />
                <span className="text-xs text-gray-600">{systemSummary.operational} Operational</span>
              </div>
              {systemSummary.degraded > 0 && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-warning" />
                  <span className="text-xs text-gray-600">{systemSummary.degraded} Degraded</span>
                </div>
              )}
              {systemSummary.down > 0 && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-error" />
                  <span className="text-xs text-gray-600">{systemSummary.down} Down</span>
                </div>
              )}
            </div>
            {/* eslint-disable-next-line design-system/prefer-metric-grid -- system health cards, not metric cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {mockSystems.length === 0 ? (
                <EmptyState description="No connected systems to display" />
              ) : mockSystems.map((sys) => (
                <SystemHealthCard key={sys.id} system={sys} />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </div>
  );
}
