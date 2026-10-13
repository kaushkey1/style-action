import { useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Timer,
  ArrowDown,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent, MetricGrid } from '@/components/ui';
import { DetailPanel, DetailPanelSection } from '@/components/ui';
import { EmptyState, PageSkeleton, AwaitingConnection } from '@/components/ui';
import { type Exception, type ExceptionSeverity } from '../data/mockExceptions';
import { type HumanGate } from '../data/mockHumanGates';
import { HumanGateCard } from '../components/HumanGateCard';
import { useExceptionStore } from '../stores/useExceptionStore';
import { useHumanGateStore } from '../stores/useHumanGateStore';
import { useExceptionsData } from '../api/useExceptionsData';
import { useHumanGatesData } from '../api/useHumanGatesData';
import { useToast } from '@/hooks/useToast';
import { useSelection } from '@/hooks/useSelection';
import { cn, formatCurrency } from '@/lib/utils';

const severityConfig: Record<ExceptionSeverity, { label: string; badge: 'error' | 'warning' | 'primary' | 'default' }> = {
  S1: { label: 'S1 Critical', badge: 'error' },
  S2: { label: 'S2 High', badge: 'warning' },
  S3: { label: 'S3 Medium', badge: 'primary' },
  S4: { label: 'S4 Low', badge: 'default' },
};

function ApprovalCard({
  item,
  isSelected,
  onSelect,
  onApprove,
  onReject,
}: {
  item: Exception;
  isSelected: boolean;
  onSelect: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const severity = severityConfig[item.severity];

  return (
    <button
      onClick={onSelect}
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-4 text-left w-full transition-all duration-200 hover:border-primary/30 hover:shadow-md',
        isSelected && 'border-primary ring-1 ring-primary/20'
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Badge variant={severity.badge}>{severity.label}</Badge>
          <span className="text-xs font-mono text-gray-400">{item.displayId}</span>
        </div>
        <div className="flex items-center gap-2">
          {item.response_sla && (
            <span className="flex items-center gap-1 text-[10px] text-warning-600">
              <Timer className="w-3 h-3" />
              SLA: {item.response_sla}
            </span>
          )}
          <Clock className="w-3 h-3 text-warning" />
        </div>
      </div>
      <p className="text-sm font-medium text-gray-900 mb-1">{item.title}</p>
      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
        <span>Impact: {item.impact}</span>
        <span>Cost of Delay: {formatCurrency(item.projected_impact_inr)}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" className="flex-1 text-xs h-7 gap-1" onClick={(e) => { e.stopPropagation(); onApprove(item.id); }}>
          <CheckCircle2 className="w-3 h-3" />
          Approve
        </Button>
        <Button variant="outline" size="sm" className="flex-1 text-xs h-7 gap-1 border-error/40 text-error hover:bg-error-50 hover:border-error/60" onClick={(e) => { e.stopPropagation(); onReject(item.id); }}>
          <XCircle className="w-3 h-3" />
          Reject
        </Button>
      </div>
    </button>
  );
}

function ApprovalDetail({ item, onClose, onApprove, onReject }: { item: Exception; onClose: () => void; onApprove: (id: string) => void; onReject: (id: string) => void }) {
  const severity = severityConfig[item.severity];

  return (
    <DetailPanel isOpen={true} title={`Approval - ${item.displayId}`} onClose={onClose}>
      <div className="p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">{item.title}</h3>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge variant={severity.badge}>{severity.label}</Badge>
            <Badge variant="outline">{item.type}</Badge>
            <Badge variant="outline">{item.domain}</Badge>
          </div>
          <p className="text-xs text-gray-500">{item.relativeTime}</p>
        </div>

        <DetailPanelSection title="Impact Analysis">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-gray-50">
              <p className="text-[10px] text-gray-500">Financial Impact</p>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(item.projected_impact_inr)}</p>
            </div>
            {item.projected_cm_impact && (
              <div className="p-2 rounded-lg bg-error-50/50">
                <p className="text-[10px] text-gray-500">CM Impact</p>
                <p className="text-sm font-bold text-error-600">{item.projected_cm_impact} pts</p>
              </div>
            )}
          </div>
        </DetailPanelSection>

        {item.cascadeChain && (
          <DetailPanelSection title="Context">
            <div className="space-y-0">
              {item.cascadeChain.map((step, i) => (
                <div key={i} className="relative">
                  {i > 0 && (
                    <div className="flex justify-center py-1">
                      <ArrowDown className="w-3 h-3 text-gray-400" />
                    </div>
                  )}
                  <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                    <p className="text-xs font-medium text-primary">{step.system}</p>
                    <p className="text-xs text-gray-700 mt-0.5">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </DetailPanelSection>
        )}

        {item.recommendations && (
          <DetailPanelSection title="Agent Recommendations">
            <div className="space-y-2">
              {item.recommendations.map((rec, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-primary-50/50 border border-primary/10">
                  <p className="text-xs font-medium text-primary">{rec.agent}</p>
                  <p className="text-xs text-gray-700 mt-0.5">{rec.action}</p>
                </div>
              ))}
            </div>
          </DetailPanelSection>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <Button size="sm" className="w-full gap-1" onClick={() => { onApprove(item.id); onClose(); }}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approve All Recommendations
          </Button>
          <Button variant="outline" size="sm" className="w-full gap-1 border-error/40 text-error hover:bg-error-50 hover:border-error/60" onClick={() => { onReject(item.id); onClose(); }}>
            <XCircle className="w-3.5 h-3.5" />
            Reject
          </Button>
        </div>
      </div>
    </DetailPanel>
  );
}

// Sort human gates: pending first, then escalated, then approved/auto-approved
// Within pending, sort by SLA deadline (soonest first)
const statusOrder: Record<string, number> = {
  pending: 0,
  escalated: 1,
  approved: 2,
  'auto-approved': 3,
  rejected: 4,
};

function sortGates(gates: HumanGate[]): HumanGate[] {
  return [...gates].sort((a, b) => {
    const statusDiff = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
    if (statusDiff !== 0) return statusDiff;
    // Within same status, sort by SLA deadline (soonest first)
    return new Date(a.slaDeadline).getTime() - new Date(b.slaDeadline).getTime();
  });
}

function HumanGatesTab() {
  const { success, error: toastError } = useToast();
  const gates = useHumanGateStore((s) => s.gates);
  const approveGate = useHumanGateStore((s) => s.approveGate);
  const rejectGate = useHumanGateStore((s) => s.rejectGate);
  const sortedGates = useMemo(() => sortGates(gates), [gates]);

  const pendingCount = gates.filter((g) => g.status === 'pending').length;
  const escalatedCount = gates.filter((g) => g.status === 'escalated').length;
  const avgSlaHours = Math.round(gates.reduce((s, g) => s + g.slaHours, 0) / gates.length);

  const handleApprove = (id: string) => {
    approveGate(id);
    success(`Gate ${id} approved`);
  };

  const handleReject = (id: string) => {
    rejectGate(id);
    toastError(`Gate ${id} rejected`);
  };

  return (
    <div>
      {/* Summary Stats */}
      <MetricGrid columns={3}>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-warning" />
            <p className="text-xs text-gray-500">Pending Gates</p>
          </div>
          <p className="text-xl font-bold text-warning">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <p className="text-xs text-gray-500">Avg SLA Hours</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{avgSlaHours}h</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-error" />
            <p className="text-xs text-gray-500">Escalated</p>
          </div>
          <p className="text-xl font-bold text-error">{escalatedCount}</p>
        </div>
      </MetricGrid>

      {/* Gate Cards */}
      <div className="space-y-3">
        {sortedGates.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200">
            <EmptyState
              icon={CheckCircle2}
              iconClassName="text-success"
              title="All gates resolved"
              description="No pending human gates"
            />
          </div>
        ) : (
          sortedGates.map((gate) => (
            <HumanGateCard
              key={gate.id}
              gate={gate}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ExceptionApprovalsTab() {
  const { success, error: toastError } = useToast();
  const selection = useSelection();
  const exceptions = useExceptionStore((s) => s.exceptions);
  const approveException = useExceptionStore((s) => s.approveException);
  const rejectException = useExceptionStore((s) => s.rejectException);
  const handleApprove = (id: string) => { approveException(id); success(`Exception ${id} approved`); };
  const handleReject = (id: string) => { rejectException(id); toastError(`Exception ${id} rejected`); };
  const pendingItems = exceptions
    .filter((e) => e.status === 'awaiting-approval')
    .sort((a, b) => b.projected_impact_inr - a.projected_impact_inr);
  const selected = selection.selectedId ? pendingItems.find((e) => e.id === selection.selectedId) : null;

  return (
    <div>
      <p className="text-xs text-gray-500 px-1 mb-3">
        {pendingItems.length} pending &middot; {formatCurrency(pendingItems.reduce((sum, e) => sum + e.projected_impact_inr, 0))} at risk &middot; {pendingItems.filter(e => e.severity === 'S1').length} critical &middot; {pendingItems.filter(e => e.severity === 'S2').length} high
      </p>

      {/* Approval List + Detail */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className={cn('space-y-3 transition-all', selected ? 'lg:w-[55%]' : 'w-full')}>
          {pendingItems.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200">
              <EmptyState
                icon={CheckCircle2}
                iconClassName="text-success"
                title="All caught up"
                description="No pending approvals"
              />
            </div>
          ) : (
            pendingItems.map((item) => (
              <ApprovalCard
                key={item.id}
                item={item}
                isSelected={selection.selectedId === item.id}
                onSelect={() => selection.setSelectedId(selection.selectedId === item.id ? null : item.id)}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))
          )}
        </div>
        {selected && (
          <div className="lg:w-[45%]">
            <ApprovalDetail item={selected} onClose={() => selection.clearSelection()} onApprove={handleApprove} onReject={handleReject} />
          </div>
        )}
      </div>
    </div>
  );
}

export function ApprovalQueuePage() {
  // Data hooks
  const { data: exceptionsData, loading: exceptionsLoading, error: exceptionsError, refetch: refetchExceptions } = useExceptionsData();
  const { data: gatesData, loading: gatesLoading, error: gatesError, refetch: refetchGates } = useHumanGatesData();

  const initializeExceptions = useExceptionStore((s) => s.initialize);
  const initializeGates = useHumanGateStore((s) => s.initialize);

  useEffect(() => {
    if (exceptionsData) {
      initializeExceptions(exceptionsData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initializeExceptions is a stable Zustand action
  }, [exceptionsData]);

  useEffect(() => {
    if (gatesData) {
      initializeGates(gatesData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initializeGates is a stable Zustand action
  }, [gatesData]);

  const gates = useHumanGateStore((s) => s.gates);
  const exceptions = useExceptionStore((s) => s.exceptions);

  const loading = exceptionsLoading || gatesLoading;
  const error = exceptionsError || gatesError;

  // Loading / error states (after all hooks)
  if (loading) return <PageSkeleton />;
  if (error) return <AwaitingConnection feature="Approvals" onRetry={() => { refetchExceptions(); refetchGates(); }} />;

  const pendingGateCount = gates.filter((g) => g.status === 'pending').length;
  const pendingExceptionCount = exceptions.filter(
    (e) => e.status === 'awaiting-approval'
  ).length;

  return (
    <div className="animate-fadeInUp">
      <Tabs defaultValue="human-gates">
        <TabsList variant="underline" className="mb-4">
          <TabsTrigger value="human-gates" variant="underline">
            Human Gates
            {pendingGateCount > 0 && (
              <Badge variant="warning" size="sm" className="ml-2">
                {pendingGateCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="exception-approvals" variant="underline">
            Exception Approvals
            {pendingExceptionCount > 0 && (
              <Badge variant="warning" size="sm" className="ml-2">
                {pendingExceptionCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="human-gates">
          <HumanGatesTab />
        </TabsContent>

        <TabsContent value="exception-approvals">
          <ExceptionApprovalsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
