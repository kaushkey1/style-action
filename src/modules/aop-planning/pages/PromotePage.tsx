import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  PageHeader,
  MetricGrid,
  MetricCard,
  SectionHeader,
  EmptyState,
  Button,
  ConfirmDialog,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { useAOPPlanningStore } from '../stores/useAOPPlanningStore';
import { CycleStatusBadge } from '../components/CycleStatusBadge';
import { AopSubNav } from '../components/AopSubNav';

export function PromotePage(): React.ReactNode {
  const { cycleId } = useParams<{ cycleId: string }>();
  const cycles = useAOPPlanningStore((s) => s.cycles);
  const gridRows = useAOPPlanningStore((s) => s.gridRows);
  const scenarios = useAOPPlanningStore((s) => s.scenarios);
  const transitionCycleStatus = useAOPPlanningStore((s) => s.transitionCycleStatus);

  const [promoteConfirmOpen, setPromoteConfirmOpen] = useState(false);

  const cycle = cycles.find((c) => c.id === cycleId);
  if (!cycle) {
    return <EmptyState title="Cycle not found" description="The requested planning cycle does not exist." />;
  }

  const canPromote = cycle.status === 'LOCKED';
  const isPromoted = cycle.status === 'PROMOTED';
  const activeScenario = scenarios.find((s) => s.id === cycle.activeScenarioId);
  const channelRows = gridRows.filter((r) => r.level === 'channel');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promote to OTB"
        backTo={{ label: cycle.name, path: `/sales-plan/workspace/${cycle.id}` }}
        actions={<CycleStatusBadge status={cycle.status} />}
      />

      <AopSubNav />

      {!canPromote && !isPromoted && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <p className="text-sm text-amber-800">
            Plan must be locked before it can be promoted to OTB. Current status: <span className="font-semibold">{cycle.status}</span>
          </p>
        </div>
      )}

      {isPromoted && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <p className="text-sm text-green-800">
            This plan has been promoted to OTB. Contract version: <span className="font-semibold">superdry-FY26-v{cycle.version}</span>
            {cycle.promotedAt && (
              <span className="ml-2 text-green-600">
                · {new Date(cycle.promotedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            )}
          </p>
        </div>
      )}

      <MetricGrid columns={4}>
        <MetricCard label="GSV" value={activeScenario ? `₹${activeScenario.totalNetSales} Cr` : '—'} />
        <MetricCard label="Gross Margin" value={activeScenario ? `₹${activeScenario.totalGrossMargin} Cr` : '—'} />
        <MetricCard label="Stores" value={activeScenario ? String(activeScenario.totalStoreCount) : '—'} />
        <MetricCard label="Scenario" value={activeScenario?.name ?? '—'} />
      </MetricGrid>

      <div>
        <SectionHeader title="Contract Preview" />
        <p className="text-xs text-gray-500 mt-1 mb-3">
          Contract: superdry-FY26-v{cycle.version} — per channel · season · segment
        </p>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Channel</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">FY GSV (₹ Cr)</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">GM%</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {channelRows.map((row) => {
                  return (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {row.label}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-700">₹{row.fyTotal.toFixed(1)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-700">{row.gmPct.toFixed(1)}%</td>
                      <td className={cn('px-4 py-3 text-right tabular-nums', row.growthPct >= 0 ? 'text-green-600' : 'text-red-600')}>
                        {row.growthPct >= 0 ? '+' : ''}{row.growthPct.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600">
        OTB pins this version and absorbs later versions forward-only.
      </div>

      {canPromote && (
        <div className="flex justify-end">
          <Button onClick={() => setPromoteConfirmOpen(true)}>
            Publish Contract
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={promoteConfirmOpen}
        onOpenChange={setPromoteConfirmOpen}
        title="Promote to OTB"
        description="This will publish the OTB handoff contract. The plan becomes the single source of truth for the year. This action cannot be undone."
        confirmLabel="Publish Contract"
        onConfirm={() => transitionCycleStatus(cycle.id, 'PROMOTED')}
      />
    </div>
  );
}
