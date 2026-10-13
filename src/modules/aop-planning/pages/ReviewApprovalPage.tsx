import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import {
  PageHeader,
  MetricGrid,
  MetricCard,
  SectionHeader,
  EmptyState,
  Badge,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { useAOPPlanningStore } from '../stores/useAOPPlanningStore';
import { WorkflowStepper } from '../components/WorkflowStepper';
import { CycleStatusBadge } from '../components/CycleStatusBadge';
import { GuardrailChip } from '../components/GuardrailChip';
import { ReviewTimeline } from '../components/ReviewTimeline';
import { ApprovalActionBar } from '../components/ApprovalActionBar';
import { AopSubNav } from '../components/AopSubNav';
import { ruleLabel } from '../data/exceptionRules';
import { STATUS_TO_PHASE } from '../types/aopPlanning.types';
import type { CycleStatus, PlanningException } from '../types/aopPlanning.types';

export function ReviewApprovalPage(): React.ReactNode {
  const { cycleId } = useParams<{ cycleId: string }>();
  const cycles = useAOPPlanningStore((s) => s.cycles);
  const reviews = useAOPPlanningStore((s) => s.reviews);
  const exceptions = useAOPPlanningStore((s) => s.exceptions);
  const gridRows = useAOPPlanningStore((s) => s.gridRows);
  const scenarios = useAOPPlanningStore((s) => s.scenarios);
  const transitionCycleStatus = useAOPPlanningStore((s) => s.transitionCycleStatus);
  const addReview = useAOPPlanningStore((s) => s.addReview);

  const cycle = cycles.find((c) => c.id === cycleId);
  if (!cycle) {
    return <EmptyState title="Cycle not found" description="The requested planning cycle does not exist." />;
  }

  const phase = STATUS_TO_PHASE[cycle.status];
  const cycleReviews = reviews.filter((r) => r.cycleId === cycle.id);
  const cycleExceptions = exceptions.filter((e) => e.cycleId === cycle.id);
  const hardOpen = cycleExceptions.filter((e) => e.severity === 'hard' && e.status === 'open');

  const totalRow = gridRows.find((r) => r.id === 'total');
  const activeScenario = scenarios.find((s) => s.id === cycle.activeScenarioId);

  const channelSummary = gridRows.filter((r) => r.level === 'channel');

  const handleSubmit = (): void => {
    const success = transitionCycleStatus(cycle.id, 'SUBMITTED');
    if (success) {
      addReview({
        cycleId: cycle.id,
        action: 'submitted',
        actor: 'User',
        actorRole: 'Planner',
        timestamp: new Date().toISOString(),
        comment: 'Submitted for review',
        version: cycle.version,
      });
    }
  };

  const handleApprove = (): void => {
    let nextStatus: CycleStatus = 'IN_REVIEW';
    if (cycle.status === 'SUBMITTED') nextStatus = 'IN_REVIEW';
    if (cycle.status === 'IN_REVIEW') nextStatus = 'APPROVED';

    const success = transitionCycleStatus(cycle.id, nextStatus);
    if (success) {
      addReview({
        cycleId: cycle.id,
        action: 'approved',
        actor: 'User',
        actorRole: 'Central Finance',
        timestamp: new Date().toISOString(),
        comment: 'Approved',
        version: cycle.version,
      });
    }
  };

  const handleRequestRevision = (comment: string): void => {
    const success = transitionCycleStatus(cycle.id, 'REVISION_REQUESTED');
    if (success) {
      addReview({
        cycleId: cycle.id,
        action: 'revision_requested',
        actor: 'User',
        actorRole: 'Central Finance',
        timestamp: new Date().toISOString(),
        comment,
        version: cycle.version,
      });
    }
  };

  const handleLock = (): void => {
    const success = transitionCycleStatus(cycle.id, 'LOCKED');
    if (success) {
      addReview({
        cycleId: cycle.id,
        action: 'locked',
        actor: 'User',
        actorRole: 'Central Finance',
        timestamp: new Date().toISOString(),
        comment: 'Plan locked',
        version: cycle.version,
      });
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="Review & Approval"
        backTo={{ label: cycle.name, path: `/sales-plan/workspace/${cycle.id}` }}
        actions={<CycleStatusBadge status={cycle.status} />}
      />

      <AopSubNav />

      <WorkflowStepper currentPhase={phase} status={cycle.status} />

      {/* Summary KPIs */}
      <MetricGrid columns={4}>
        <MetricCard label="GSV" value={activeScenario ? `₹${activeScenario.totalNetSales} Cr` : '—'} />
        <MetricCard label="Gross Margin" value={activeScenario ? `₹${activeScenario.totalGrossMargin} Cr` : '—'} />
        <MetricCard label="GM%" value={activeScenario ? `${activeScenario.avgGmPct}%` : '—'} />
        <MetricCard
          label="Growth vs PY"
          value={totalRow ? `${totalRow.growthPct >= 0 ? '+' : ''}${totalRow.growthPct.toFixed(1)}%` : '—'}
        />
      </MetricGrid>

      {/* Exceptions Carried In — grouped by rule to avoid a long scroll */}
      <ExceptionsSummary exceptions={cycleExceptions} />

      {/* Channel Summary */}
      <div>
        <SectionHeader title="Channel Summary" />
        <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Channel</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">FY Total (₹ Cr)</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">GM%</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Growth</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500">Guardrail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {channelSummary.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {row.label}
                      </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                      ₹{row.fyTotal.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                      {row.gmPct.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className={row.growthPct >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {row.growthPct >= 0 ? '+' : ''}{row.growthPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <GuardrailChip status={row.guardrailStatus} growthPct={row.growthPct} compact />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Review Timeline */}
      <div>
        <SectionHeader title="Review History" />
        <div className="mt-3">
          {cycleReviews.length === 0 ? (
            <EmptyState title="No review history" description="No review actions have been recorded yet." variant="neutral" />
          ) : (
            <ReviewTimeline entries={cycleReviews} />
          )}
        </div>
      </div>

      {/* Approval Action Bar */}
      <ApprovalActionBar
        cycleStatus={cycle.status}
        hardExceptionCount={hardOpen.length}
        onSubmit={handleSubmit}
        onApprove={handleApprove}
        onRequestRevision={handleRequestRevision}
        onLock={handleLock}
      />
    </div>
  );
}

interface RuleGroup {
  rule: string;
  items: PlanningException[];
  hardCount: number;
}

/** Compact, collapsible summary of carried-in exceptions grouped by rule. */
function ExceptionsSummary({ exceptions }: { exceptions: PlanningException[] }): React.ReactNode {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const open = exceptions.filter((e) => e.status === 'open' || e.status === 'acknowledged');
  if (open.length === 0) return null;

  const hard = open.filter((e) => e.severity === 'hard').length;
  const soft = open.length - hard;

  const map = new Map<string, PlanningException[]>();
  for (const e of open) {
    const arr = map.get(e.rule) ?? [];
    arr.push(e);
    map.set(e.rule, arr);
  }
  const groups: RuleGroup[] = [...map.entries()]
    .map(([rule, items]) => ({ rule, items, hardCount: items.filter((i) => i.severity === 'hard').length }))
    .sort((a, b) => (b.hardCount > 0 ? 1 : 0) - (a.hardCount > 0 ? 1 : 0) || b.items.length - a.items.length);

  const toggle = (rule: string): void =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(rule)) next.delete(rule);
      else next.add(rule);
      return next;
    });

  return (
    <div>
      <SectionHeader title="Exceptions Carried In" />
      <p className="text-xs text-gray-500 mt-1">
        {open.length} open · {hard} hard · {soft} soft
      </p>
      <div className="mt-3 border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
        {groups.map((group) => {
          const isOpen = expanded.has(group.rule);
          return (
            <div key={group.rule}>
              <button
                type="button"
                onClick={() => toggle(group.rule)}
                aria-expanded={isOpen}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <span className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className={cn('w-2 h-2 rounded-full shrink-0', group.hardCount > 0 ? 'bg-red-500' : 'bg-amber-500')}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-gray-900 truncate">{ruleLabel(group.rule)}</span>
                  <Badge size="sm" variant="default">{group.items.length}</Badge>
                </span>
                <ChevronRight
                  className={cn('w-4 h-4 text-gray-400 shrink-0 transition-transform', isOpen && 'rotate-90')}
                  aria-hidden="true"
                />
              </button>
              {isOpen && (
                <ul className="bg-gray-50/50 px-4 py-2 space-y-1.5">
                  {group.items.map((exc) => (
                    <li key={exc.id} className="flex items-start gap-2 text-xs text-gray-700">
                      <span
                        className={cn(
                          'mt-1 w-1.5 h-1.5 rounded-full shrink-0',
                          exc.severity === 'hard' ? 'bg-red-500' : 'bg-amber-500',
                        )}
                        aria-hidden="true"
                      />
                      <span className="flex-1">{exc.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
