import { useState, useEffect } from 'react';
import {
  ArrowDown,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  ExternalLink,
  Timer,
  UserCheck,
  Zap,
  AlertTriangle,
  IndianRupee,
  Store,
  Bot,
} from 'lucide-react';
import { Badge, Button, ConfirmDialog } from '@/components/ui';
import { DetailPanel, DetailPanelSection } from '@/components/ui';
import { FilterBar, FilterPills, FilterSelect, FilterSearch } from '@/components/ui';
import { EmptyState, PageSkeleton, AwaitingConnection } from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useToast } from '@/hooks/useToast';
import { useExceptionStore } from '../stores/useExceptionStore';
import { useExceptionsData } from '../api/useExceptionsData';
import {
  type Exception,
  type ExceptionSeverity,
  type ExceptionStatus,
  type ExceptionDetectionType,
  type ExceptionDomain,
} from '../data/mockExceptions';
import { usePersonaStore } from '@/hooks/usePersonaStore';
import { personaMap } from '@/data/personaConfig';
import { cn, formatCurrency } from '@/lib/utils';
import { ApprovalCountdown } from '../components/ApprovalCountdown';
import { useSearch } from '@/hooks/useSearch';
import { useFilters } from '@/hooks/useFilters';
import { useSelection } from '@/hooks/useSelection';
import { useResetOnPersonaChange } from '@/hooks/useResetOnPersonaChange';

const severityConfig: Record<ExceptionSeverity, { color: string; bg: string; label: string; badge: 'error' | 'warning' | 'primary' | 'default' }> = {
  S1: { color: 'text-error-600', bg: 'bg-error-50', label: 'S1 Critical', badge: 'error' },
  S2: { color: 'text-warning-600', bg: 'bg-warning-50', label: 'S2 High', badge: 'warning' },
  S3: { color: 'text-primary-600', bg: 'bg-primary-50', label: 'S3 Medium', badge: 'primary' },
  S4: { color: 'text-gray-500', bg: 'bg-gray-50', label: 'S4 Low', badge: 'default' },
};



const statusConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  'agent-reviewing': { icon: Eye, label: 'Agent Reviewing', color: 'text-primary' },
  'awaiting-approval': { icon: Clock, label: 'Awaiting Approval', color: 'text-warning' },
  resolved: { icon: CheckCircle2, label: 'Resolved', color: 'text-success' },
  investigating: { icon: Loader2, label: 'Investigating', color: 'text-primary' },
  'agent-analyzing': { icon: Loader2, label: 'Agent Analyzing', color: 'text-primary' },
  'agent-acted': { icon: Zap, label: 'Agent Acted', color: 'text-success' },
  'escalated': { icon: ArrowUpRight, label: 'Escalated', color: 'text-error' },
  'human-overridden': { icon: UserCheck, label: 'Human Overridden', color: 'text-primary-600' },
  'monitoring': { icon: Eye, label: 'Monitoring', color: 'text-warning' },
  'closed-with-learning': { icon: CheckCircle2, label: 'Closed', color: 'text-gray-500' },
};

const lifecycleSteps = [
  { key: 'detected', label: 'Detected' },
  { key: 'agent-reviewing', label: 'Agent Reviewing' },
  { key: 'action-taken', label: 'Action Taken' },
  { key: 'human-review', label: 'Human Review' },
  { key: 'resolved', label: 'Resolved' },
] as const;

/** Map an ExceptionStatus to which lifecycle step is current (0-based index). */
function getLifecycleStepIndex(status: ExceptionStatus): number {
  switch (status) {
    case 'investigating':
    case 'agent-analyzing':
      return 0; // Detected
    case 'agent-reviewing':
      return 1; // Agent Reviewing
    case 'agent-acted':
    case 'escalated':
      return 2; // Action Taken
    case 'awaiting-approval':
    case 'human-overridden':
      return 3; // Human Review
    case 'resolved':
    case 'monitoring':
    case 'closed-with-learning':
      return 4; // Resolved
    default:
      return 0;
  }
}

function mapStatusToApprovalStatus(status: ExceptionStatus): 'pending' | 'approved' | 'rejected' | 'escalated' | 'auto-approved' {
  if (status === 'escalated') return 'escalated';
  if (status === 'resolved' || status === 'closed-with-learning' || status === 'monitoring') return 'approved';
  if (status === 'agent-acted') return 'auto-approved';
  if (status === 'human-overridden') return 'rejected';
  return 'pending';
}

const detectionTypes: ExceptionDetectionType[] = [
  'Threshold Breach', 'Trend Deviation', 'Milestone Miss', 'Correlation Break',
  'Cross-system Conflict', 'Pattern Match', 'Cascade Risk',
];

const domains: ExceptionDomain[] = ['PLAN', 'BUY', 'MAKE', 'MOVE', 'SELL', 'MARKET', 'PLATFORM', 'LIQUIDATION'];

function ExceptionRow({
  exception,
  isSelected,
  onSelect,
}: {
  exception: Exception;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isMobile = useIsMobile();
  const severity = severityConfig[exception.severity];
  const status = statusConfig[exception.status] ?? statusConfig['agent-reviewing']!;
  const StatusIcon = status.icon;

  if (isMobile) {
    return (
      <button
        onClick={onSelect}
        className={cn(
          'w-full text-left p-4 border-b border-gray-100 transition-colors duration-150 hover:bg-gray-50 min-h-[72px]',
          isSelected && 'bg-primary-50/50 border-l-2 border-l-primary'
        )}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <Badge variant={severity.badge}>{severity.label}</Badge>
          <span className="text-xs text-gray-400">{exception.relativeTime}</span>
        </div>
        <p className="text-sm font-medium text-gray-900 mb-1.5 line-clamp-2">{exception.title}</p>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-gray-500 truncate">Impact: {exception.impact}</span>
            <Badge variant="outline" className="text-[10px] shrink-0">{exception.domain}</Badge>
          </div>
          <div className={cn('flex items-center gap-1 text-xs shrink-0', status.color)}>
            <StatusIcon className="w-3 h-3" />
            <span>{status.label}</span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left p-4 border-b border-gray-100 transition-colors duration-150 hover:bg-gray-50',
        isSelected && 'bg-primary-50/50 border-l-2 border-l-primary'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <Badge variant={severity.badge}>{severity.label}</Badge>
          <span className="text-xs text-gray-400 font-mono">{exception.displayId}</span>
          <Badge variant="outline" className="text-[10px]">{exception.type}</Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {exception.response_sla && exception.status !== 'resolved' && (
            <span className="flex items-center gap-1 text-[10px] text-warning-600">
              <Timer className="w-3 h-3" />
              SLA: {exception.response_sla}
            </span>
          )}
          <span className="text-xs text-gray-400">{exception.relativeTime}</span>
        </div>
      </div>
      <p className="text-sm font-medium text-gray-900 mb-1">{exception.title}</p>
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="text-[10px]">{exception.domain}</Badge>
        <span className="text-xs text-gray-500">{exception.systems.join(' → ')}</span>
        <span className="text-xs text-gray-400">|</span>
        <span className="text-xs text-gray-500">Agents: {exception.agents.join(', ')}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">Impact: {exception.impact}</span>
          {exception.projected_cm_impact && (
            <span className="text-xs text-error-600">CM: {exception.projected_cm_impact} pts</span>
          )}
        </div>
        <div className={cn('flex items-center gap-1 text-xs', status.color)}>
          <StatusIcon className="w-3 h-3" />
          <span>{status.label}</span>
        </div>
      </div>
    </button>
  );
}

function ExceptionDetail({ exception, onClose }: { exception: Exception; onClose: () => void }) {
  const { success } = useToast();
  const severity = severityConfig[exception.severity];
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const isCritical = exception.severity === 'S1' || exception.severity === 'S2';

  return (
    <DetailPanel title={`Exception ${exception.displayId}`} isOpen={true} onClose={onClose}>
      <div className="p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">{exception.title}</h3>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant={severity.badge}>{severity.label}</Badge>
            <Badge variant="outline">{exception.type}</Badge>
            <Badge variant="outline">{exception.domain}</Badge>
            <Badge variant="outline">{exception.lifecycle_stage.replace(/_/g, ' ')}</Badge>
          </div>
          <p className="text-xs text-gray-500">{exception.relativeTime}</p>
        </div>

        <DetailPanelSection title="Impact">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-gray-50">
              <p className="text-[10px] text-gray-500">Financial Impact</p>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(exception.projected_impact_inr)}</p>
            </div>
            {exception.projected_cm_impact && (
              <div className="p-2 rounded-lg bg-error-50/50">
                <p className="text-[10px] text-gray-500">CM Impact</p>
                <p className="text-sm font-bold text-error-600">{exception.projected_cm_impact} pts</p>
              </div>
            )}
          </div>
          {exception.playbook_id && (
            <p className="text-xs text-gray-500 mt-2">Playbook: <span className="font-mono text-primary">{exception.playbook_id}</span></p>
          )}
          {exception.response_sla && (
            <div className="flex items-center gap-1 mt-1 text-xs text-warning-600">
              <Timer className="w-3 h-3" />
              Response SLA: {exception.response_sla}
            </div>
          )}
        </DetailPanelSection>

        {exception.cascadeChain && (
          <DetailPanelSection title="Cascade Chain">
            <div className="space-y-0">
              {exception.cascadeChain.map((step, i) => (
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

        {exception.recommendations && (
          <DetailPanelSection title="Agent Recommendations">
            <div className="space-y-2">
              {exception.recommendations.map((rec, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-primary-50/50 border border-primary/10">
                  <p className="text-xs font-medium text-primary">{rec.agent}</p>
                  <p className="text-xs text-gray-700 mt-0.5">{rec.action}</p>
                </div>
              ))}
            </div>
          </DetailPanelSection>
        )}

        {/* Resolution Lifecycle Timeline */}
        <DetailPanelSection title="Resolution Lifecycle">
          {(() => {
            const currentIdx = getLifecycleStepIndex(exception.status);
            return (
              <div className="flex items-start gap-0">
                {lifecycleSteps.map((step, i) => {
                  const isCompleted = i < currentIdx;
                  const isCurrent = i === currentIdx;
                  return (
                    <div key={step.key} className="flex flex-col items-center flex-1 relative">
                      {/* Connecting line (before the dot, except for first step) */}
                      {i > 0 && (
                        <div
                          className={cn(
                            'absolute top-[9px] right-1/2 h-0.5 w-full',
                            isCompleted || isCurrent ? 'bg-success' : 'bg-gray-200'
                          )}
                        />
                      )}
                      {/* Step indicator */}
                      <div className="relative z-10 flex items-center justify-center">
                        {isCompleted ? (
                          <CheckCircle2 className="w-[18px] h-[18px] text-success" />
                        ) : isCurrent ? (
                          <div className="relative">
                            <div className="w-[18px] h-[18px] rounded-full bg-primary flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-white" />
                            </div>
                            <div className="absolute inset-0 w-[18px] h-[18px] rounded-full bg-primary/30 animate-ping" />
                          </div>
                        ) : (
                          <div className="w-[18px] h-[18px] rounded-full bg-gray-200 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-gray-300" />
                          </div>
                        )}
                      </div>
                      {/* Label */}
                      <span
                        className={cn(
                          'text-[10px] mt-1.5 text-center leading-tight',
                          isCompleted ? 'text-success-600 font-medium' :
                          isCurrent ? 'text-primary font-semibold' :
                          'text-gray-400'
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </DetailPanelSection>

        {/* Escalation History */}
        {(exception.escalatedTo || exception.escalatedAt) && (
          <DetailPanelSection title="Escalation">
            <div className="p-2.5 rounded-lg bg-error-50/50 border border-error/10">
              <div className="flex items-center gap-2 flex-wrap">
                <AlertTriangle className="w-3 h-3 text-error" />
                {exception.escalatedTo && (
                  <Badge variant="error">{exception.escalatedTo}</Badge>
                )}
                {exception.escalatedAt && (
                  <span className="text-[10px] text-gray-500">
                    {new Date(exception.escalatedAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </span>
                )}
              </div>
            </div>
          </DetailPanelSection>
        )}

        {/* Resolution Outcome */}
        {exception.resolutionOutcome && (
          <DetailPanelSection title="Resolution Outcome">
            <div className="grid grid-cols-2 gap-2">
              {exception.resolutionOutcome.amountSaved_inr != null && (
                <div className="p-2.5 rounded-lg bg-success-50/50 border border-success/10">
                  <div className="flex items-center gap-1 mb-0.5">
                    <IndianRupee className="w-3 h-3 text-success-600" />
                    <p className="text-[10px] text-gray-500">Amount Saved</p>
                  </div>
                  <p className="text-sm font-bold text-success-600">{formatCurrency(exception.resolutionOutcome.amountSaved_inr)}</p>
                </div>
              )}
              {exception.resolutionOutcome.timeToResolve_hrs != null && (
                <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <p className="text-[10px] text-gray-500">Time to Resolve</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {exception.resolutionOutcome.timeToResolve_hrs < 1
                      ? `${Math.round(exception.resolutionOutcome.timeToResolve_hrs * 60)} min`
                      : `${exception.resolutionOutcome.timeToResolve_hrs}h`}
                  </p>
                </div>
              )}
              {exception.resolutionOutcome.storesImpacted != null && (
                <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Store className="w-3 h-3 text-gray-400" />
                    <p className="text-[10px] text-gray-500">Stores Impacted</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{exception.resolutionOutcome.storesImpacted}</p>
                </div>
              )}
              {exception.resolutionOutcome.agentActedAutonomously != null && (
                <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Bot className="w-3 h-3 text-gray-400" />
                    <p className="text-[10px] text-gray-500">Resolution Mode</p>
                  </div>
                  <Badge variant={exception.resolutionOutcome.agentActedAutonomously ? 'success' : 'primary'}>
                    {exception.resolutionOutcome.agentActedAutonomously ? 'Autonomous' : 'Human-Assisted'}
                  </Badge>
                </div>
              )}
            </div>
          </DetailPanelSection>
        )}

        {/* SLA Countdown */}
        {exception.slaDeadline && (
          <DetailPanelSection title="SLA Countdown">
            <ApprovalCountdown
              slaDeadline={exception.slaDeadline}
              escalateTo={exception.escalatedTo ?? 'Next Level'}
              status={mapStatusToApprovalStatus(exception.status)}
            />
          </DetailPanelSection>
        )}

        {/* Related KPI */}
        {exception.relatedKpiId && (
          <DetailPanelSection title="Related KPI">
            <Badge variant="outline" className="text-xs font-mono">
              {exception.relatedKpiId}
            </Badge>
          </DetailPanelSection>
        )}

        <div className="flex flex-col gap-2 pt-2">
          {exception.status !== 'resolved' && (
            <>
              <Button size="sm" className="w-full" onClick={() => {
                if (isCritical) { setConfirmApprove(true); } else { success(`All recommendations approved for ${exception.displayId}`); onClose(); }
              }}>
                Approve All Recommendations
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  if (isCritical) { setConfirmReject(true); } else { success(`Exception ${exception.displayId} rejected`); onClose(); }
                }}>
                  Reject
                </Button>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => { success(`Investigation started for ${exception.displayId}`); onClose(); }}>
                  <ExternalLink className="w-3 h-3" />
                  Investigate
                </Button>
              </div>
              {isCritical && (
                <>
                  <ConfirmDialog
                    open={confirmApprove}
                    onOpenChange={setConfirmApprove}
                    title="Approve All Recommendations"
                    description={`This is a ${severity.label} exception affecting ${exception.impact}. Approving will execute all agent recommendations. Are you sure?`}
                    confirmLabel="Approve All"
                    onConfirm={() => { success(`All recommendations approved for ${exception.displayId}`); onClose(); }}
                  />
                  <ConfirmDialog
                    open={confirmReject}
                    onOpenChange={setConfirmReject}
                    title="Reject Recommendations"
                    description={`This is a ${severity.label} exception affecting ${exception.impact}. Rejecting will discard all agent recommendations and may require manual intervention.`}
                    confirmLabel="Reject"
                    variant="destructive"
                    onConfirm={() => { success(`Exception ${exception.displayId} rejected`); onClose(); }}
                  />
                </>
              )}
            </>
          )}
          {exception.status === 'resolved' && (
            <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-success-50 border border-success/10">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-xs font-medium text-success-600">Resolved by agent</span>
            </div>
          )}
        </div>
      </div>
    </DetailPanel>
  );
}

export function ExceptionFeedPage() {
  const { personaId } = usePersonaStore();
  const isMobile = useIsMobile();
  const persona = personaMap[personaId];
  const defaultDomain = (persona?.config.defaultFilters.exceptionDomain || 'all') as ExceptionDomain | 'all';

  // Data hook + store hydration
  const { data: exceptionsData, loading, error, refetch } = useExceptionsData();
  const initialize = useExceptionStore((s) => s.initialize);

  useEffect(() => {
    if (exceptionsData) {
      initialize(exceptionsData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialize is a stable Zustand action
  }, [exceptionsData]);

  const exceptions = useExceptionStore((s) => s.exceptions);

  const search = useSearch(exceptions, { fields: ['title', 'id'] });
  const filters = useFilters(search.results, {
    severity: 'all' as ExceptionSeverity | 'all',
    domain: defaultDomain,
    type: 'all' as ExceptionDetectionType | 'all',
  });
  const selection = useSelection();

  useResetOnPersonaChange(() => {
    search.setQuery('');
    filters.setFilter('severity', 'all');
    filters.setFilter('type', 'all');
    // Domain resets to persona default via the defaultDomain variable
    // which is recomputed on the next render after persona changes
    filters.setFilter('domain', defaultDomain);
    selection.clearSelection();
  });

  // Loading / error states (after all hooks)
  if (loading) return <PageSkeleton />;
  if (error) return <AwaitingConnection feature="Exceptions" onRetry={refetch} />;

  const filtered = filters.results;
  const selected = selection.selectedId ? exceptions.find((e) => e.id === selection.selectedId) : null;

  return (
    <div className="animate-fadeInUp">
      {/* Filter Bar */}
      <div className="space-y-3 mb-4">
        <FilterBar className="mb-0">
          <FilterPills
            value={filters.filters.severity}
            onChange={(v) => filters.setFilter('severity', v as ExceptionSeverity | 'all')}
            options={[
              { value: 'all', label: 'All', count: exceptions.length },
              { value: 'S1', label: isMobile ? 'S1' : severityConfig.S1.label },
              { value: 'S2', label: isMobile ? 'S2' : severityConfig.S2.label },
              { value: 'S3', label: isMobile ? 'S3' : severityConfig.S3.label },
              { value: 'S4', label: isMobile ? 'S4' : severityConfig.S4.label },
            ]}
          />
          <FilterSearch value={search.query} onChange={search.setQuery} placeholder="Search exceptions..." />
        </FilterBar>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <span className="text-xs text-gray-500 shrink-0" id="domain-filter-label">Domain:</span>
          <div className="flex items-center gap-1 shrink-0" role="group" aria-labelledby="domain-filter-label">
            {(['all', ...domains] as const).map((d) => (
              <button
                key={d}
                onClick={() => filters.setFilter('domain', d)}
                className={cn(
                  'px-2.5 py-1.5 rounded text-xs font-medium transition-all min-h-8 shrink-0',
                  filters.filters.domain === d ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-50'
                )}
              >
                {d === 'all' ? 'All' : d}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400 mx-1">|</span>
          <span className="text-xs text-gray-500 shrink-0">Type:</span>
          <FilterSelect
            value={filters.filters.type}
            onChange={(v) => filters.setFilter('type', v as ExceptionDetectionType | 'all')}
            options={[{ value: 'all', label: 'All Types' }, ...detectionTypes.map((t) => ({ value: t, label: t }))]}
            searchable
          />
        </div>
      </div>

      {/* Exception List + Detail Panel */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div role="feed" aria-label="Exception feed" className={cn('bg-white rounded-lg border border-gray-200 overflow-hidden transition-all', selected ? 'lg:w-[55%]' : 'w-full')}>
          {filtered.length === 0 ? (
            <EmptyState description="No exceptions match your filters" />
          ) : (
            filtered.map((exc) => (
              <ExceptionRow
                key={exc.id}
                exception={exc}
                isSelected={selection.selectedId === exc.id}
                onSelect={() => selection.setSelectedId(selection.selectedId === exc.id ? null : exc.id)}
              />
            ))
          )}
        </div>
        {selected && (
          <div className="lg:w-[45%]">
            <ExceptionDetail exception={selected} onClose={() => selection.clearSelection()} />
          </div>
        )}
      </div>
    </div>
  );
}
