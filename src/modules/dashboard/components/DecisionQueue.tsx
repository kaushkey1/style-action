import { useMemo } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button, EmptyState } from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useExceptionStore } from '@/modules/exceptions/stores/useExceptionStore';
import { cn } from '@/lib/utils';
import { DecisionCard } from './DecisionCard';
import { useDecisionQueueStore } from '../stores/useDecisionQueueStore';
import { decisionCardOverrides, criticalKpiDecisions } from '../data/mockDecisionData';

interface DecisionQueueProps {
  onInvestigate?: (id: string) => void;
  searchQuery?: string;
  sortBy?: string;
  className?: string;
}

export function DecisionQueue({ onInvestigate, searchQuery = '', sortBy: _sortBy, className }: DecisionQueueProps) {
  void _sortBy; // will be used when sort logic is implemented
  const isMobile = useIsMobile();
  const exceptions = useExceptionStore((s) => s.exceptions);
  const { showOverflow, toggleOverflow, statusOverrides } = useDecisionQueueStore();

  // Build the queue: S1 exceptions with decision card data + critical KPI decisions
  const queueItems = useMemo(() => {
    // S1 exceptions that have decision card overrides
    const exceptionItems = exceptions
      .filter((exc) => exc.severity === 'S1' && decisionCardOverrides[exc.id])
      .map((exc) => ({
        id: exc.id,
        kind: 'exception' as const,
        exception: exc,
        cardFields: decisionCardOverrides[exc.id]!,
        financialImpact: exc.projected_impact_inr,
      }));

    // Critical KPI decisions
    const kpiItems = criticalKpiDecisions.map((kpi) => ({
      id: kpi.id,
      kind: 'kpi' as const,
      kpiDecision: kpi,
      financialImpact: kpi.financialImpact,
    }));

    // Combine, exceptions ranked above KPIs
    const combined = [
      ...exceptionItems.sort((a, b) => b.financialImpact - a.financialImpact),
      ...kpiItems.sort((a, b) => b.financialImpact - a.financialImpact),
    ];

    // Apply search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return combined.filter((item) => {
        const title = item.kind === 'exception' ? item.exception.title : item.kpiDecision.title;
        const domain = item.kind === 'exception' ? item.exception.domain : item.kpiDecision.domain;
        return title.toLowerCase().includes(q) || domain.toLowerCase().includes(q);
      });
    }

    return combined;
  }, [exceptions, searchQuery]);

  // Filter out snoozed items
  const activeItems = queueItems.filter(
    (item) => statusOverrides[item.id] !== 'snoozed',
  );

  // Visible count: 4 on desktop, 2 on mobile
  const visibleCount = isMobile ? 2 : 4;
  const visibleItems = showOverflow ? activeItems : activeItems.slice(0, visibleCount);
  const overflowCount = activeItems.length - visibleCount;
  const snoozedCount = queueItems.length - activeItems.length;

  // All items resolved/approved?
  const allPending = activeItems.filter((item) => !statusOverrides[item.id] || statusOverrides[item.id] === 'pending');
  const isAllClear = queueItems.length > 0 && allPending.length === 0;

  // Truly empty (no S1 exceptions + no critical KPIs)
  const isEmpty = queueItems.length === 0;

  return (
    <div className={cn('space-y-3', className)}>
      {/* All clear state */}
      {isAllClear && (
        <div className="border-l-3 border-l-green-500 rounded-lg bg-white border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">All clear</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Agents have handled everything. No decisions needed.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Last agent review: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} today
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty state — no data */}
      {isEmpty && (
        <EmptyState
          description="No critical exceptions match the current filters."
          className="py-8"
        />
      )}

      {/* Decision cards */}
      {!isAllClear && !isEmpty && (
        <>
          {visibleItems.map((item) => (
            <DecisionCard
              key={item.id}
              itemId={item.id}
              kind={item.kind}
              exception={item.kind === 'exception' ? item.exception : undefined}
              cardFields={item.kind === 'exception' ? item.cardFields : undefined}
              kpiDecision={item.kind === 'kpi' ? item.kpiDecision : undefined}
              onInvestigate={onInvestigate}
            />
          ))}

          {/* Overflow toggle */}
          {overflowCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-gray-500"
              onClick={toggleOverflow}
            >
              {showOverflow ? (
                <>Collapse <ChevronUp className="w-3 h-3 ml-1" /></>
              ) : (
                <>View {overflowCount} more <ChevronDown className="w-3 h-3 ml-1" /></>
              )}
            </Button>
          )}

          {/* Snoozed indicator */}
          {snoozedCount > 0 && (
            <p className="text-xs text-gray-400 text-center">
              {snoozedCount} snoozed ↓
            </p>
          )}
        </>
      )}
    </div>
  );
}
