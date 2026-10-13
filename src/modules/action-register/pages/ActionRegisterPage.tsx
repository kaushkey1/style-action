import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardCheck, RefreshCw, XCircle, CheckCircle, AlertTriangle,
  ThumbsUp, ThumbsDown, Edit3, Play, Star,
} from 'lucide-react';
import {
  Card,
  Badge,
  Button,
  MetricGrid,
  MetricCard,
  PageHeader,
  SectionHeader,
  Spinner,
  EmptyState,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Textarea,
  Label,
  Tabs,
  TabsList,
  TabsTrigger,
  FilterMultiSelect,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  fetchActions,
  updateAction,
  recordOutcome,
  fetchActionStats,
  actionRegisterKeys,
} from '../api/actionRegisterApi';
import type {
  Action,
  ActionPriority,
  UpdateActionData,
} from '../data/actionRegisterTypes';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '../data/actionRegisterTypes';

// ─── Action Card ────────────────────────────────────────────────────────────

function ActionCard({
  action,
  onClick,
}: {
  action: Action;
  onClick: () => void;
}): React.ReactNode {
  const priorityCfg = PRIORITY_CONFIG[action.priority] ?? PRIORITY_CONFIG.MEDIUM;
  const statusCfg = STATUS_CONFIG[action.status] ?? STATUS_CONFIG.PROPOSED;

  return (
    <Card
      className="p-4 cursor-pointer hover:border-primary/30 transition-colors"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
      }}
      aria-label={`Action: ${action.action}`}
    >
      <SectionHeader
        title={
          <span className="flex items-center gap-2 flex-wrap">
            <Badge variant={priorityCfg.variant} size="sm">{priorityCfg.label}</Badge>
            <Badge variant={statusCfg.variant} size="sm">{statusCfg.label}</Badge>
            {action.rule && <Badge variant="default" size="sm">{action.rule}</Badge>}
          </span>
        }
        className="mb-2"
      />
      <p className="text-sm text-gray-900 mb-2">{action.action}</p>
      { }
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span>{action.owner}</span>
          {action.store_code && <Badge variant="default" size="sm">{action.store_code}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {action.likelihood?.value > 0 && (
            <span className="flex items-center gap-1">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                {/* eslint-disable-next-line no-restricted-syntax -- dynamic width */}
                <div className="h-full bg-primary rounded-full" style={{ width: `${action.likelihood.value}%` }} />
              </div>
              {action.likelihood.value}%
            </span>
          )}
          {action.clockspeed && <span>{action.clockspeed}</span>}
        </div>
      </div>
    </Card>
  );
}

// ─── Action Detail Dialog ───────────────────────────────────────────────────

function ActionDetailDialog({
  action,
  open,
  onOpenChange,
}: {
  action: Action | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): React.ReactNode {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [editedDesc, setEditedDesc] = useState('');
  const [editing, setEditing] = useState(false);
  const [outcomeText, setOutcomeText] = useState('');
  const [effectivenessRating, setEffectivenessRating] = useState(3);

  const updateMut = useMutation({
    mutationFn: (data: UpdateActionData) => updateAction(action!.id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: actionRegisterKeys.all });
      onOpenChange(false);
      setReason('');
      setEditing(false);
    },
  });

  const outcomeMut = useMutation({
    mutationFn: () => recordOutcome(action!.id, {
      outcome: outcomeText,
      effectiveness: effectivenessRating,
    }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: actionRegisterKeys.all });
      onOpenChange(false);
      setOutcomeText('');
    },
  });

  if (!action) return null;

  const priorityCfg = PRIORITY_CONFIG[action.priority] ?? PRIORITY_CONFIG.MEDIUM;
  const statusCfg = STATUS_CONFIG[action.status] ?? STATUS_CONFIG.PROPOSED;
  const isProposed = action.status === 'PROPOSED';
  const isApproved = action.status === 'APPROVED';
  const isInProgress = action.status === 'IN_PROGRESS';
  const isDone = action.status === 'DONE';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Action Detail</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={priorityCfg.variant}>{priorityCfg.label}</Badge>
            <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
            {action.rule && <Badge variant="default">{action.rule}</Badge>}
            {action.store_code && <Badge variant="info" size="sm">{action.store_code}</Badge>}
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Action</p>
            {editing ? (
              <Textarea
                value={editedDesc}
                onChange={(e) => setEditedDesc(e.target.value)}
                rows={3}
              />
            ) : (
              <p className="text-sm text-gray-900">{action.action}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Owner</p>
              <p className="text-sm text-gray-900">{action.owner}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Source</p>
              <p className="text-sm text-gray-900">{action.report_ref}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Expected Outcome</p>
            <p className="text-sm text-gray-700">{action.expected_outcome}</p>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Likelihood</p>
              <span className="text-sm text-gray-900">{action.likelihood?.value ?? 0}%</span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Confidence</p>
              <Badge variant="default" size="sm">{action.likelihood?.confidence ?? 'unknown'}</Badge>
            </div>
            {action.clockspeed && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Timeline</p>
                <span className="text-sm text-gray-900">{action.clockspeed}</span>
              </div>
            )}
          </div>

          {/* Approve/Reject/Modify for PROPOSED */}
          {isProposed && (
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div>
                <Label htmlFor="action-reason">Reason (required for rejection)</Label>
                <Textarea
                  id="action-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why approve, modify, or reject this action?"
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => updateMut.mutate({ status: 'APPROVED', reason })}>
                  <ThumbsUp className="w-3.5 h-3.5 mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditedDesc(action.action);
                    setEditing(true);
                  }}
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1" /> Modify
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200"
                  onClick={() => {
                    if (!reason.trim()) return;
                    updateMut.mutate({ status: 'REJECTED', reason });
                  }}
                  disabled={!reason.trim()}
                >
                  <ThumbsDown className="w-3.5 h-3.5 mr-1" /> Reject
                </Button>
              </div>
              {editing && (
                <Button
                  size="sm"
                  onClick={() => updateMut.mutate({ status: 'APPROVED', reason, action: editedDesc })}
                >
                  Save & Approve
                </Button>
              )}
            </div>
          )}

          {isApproved && (
            <div className="border-t border-gray-200 pt-4">
              <Button size="sm" onClick={() => updateMut.mutate({ status: 'IN_PROGRESS' })}>
                <Play className="w-3.5 h-3.5 mr-1" /> Mark In Progress
              </Button>
            </div>
          )}

          {isInProgress && (
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div>
                <Label htmlFor="outcome-text">What happened?</Label>
                <Textarea
                  id="outcome-text"
                  value={outcomeText}
                  onChange={(e) => setOutcomeText(e.target.value)}
                  placeholder="Describe the actual outcome..."
                  className="mt-1"
                  rows={3}
                />
              </div>
              <Button
                size="sm"
                onClick={() => updateMut.mutate({ status: 'DONE' })}
                disabled={!outcomeText.trim()}
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Record Outcome
              </Button>
            </div>
          )}

          {isDone && (
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div>
                <Label>Effectiveness Rating</Label>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setEffectivenessRating(n)}
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                        n <= effectivenessRating ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400',
                      )}
                      type="button"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  ))}
                  <span className="text-xs text-gray-500 ml-2">{effectivenessRating}/5</span>
                </div>
              </div>
              <Button size="sm" onClick={() => outcomeMut.mutate()}>
                <Star className="w-3.5 h-3.5 mr-1" /> Submit Rating
              </Button>
            </div>
          )}

          {action.reason && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Decision Reason</p>
              <p className="text-sm text-gray-700">{action.reason}</p>
            </div>
          )}
          {action.outcome && (
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-xs font-medium text-green-600 uppercase mb-1">Recorded Outcome</p>
              <p className="text-sm text-gray-700">{action.outcome}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

const STATUS_TAB_OPTIONS = [
  { value: '__all__', label: 'All' },
  { value: 'PROPOSED', label: 'Proposed' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
  { value: 'MEASURED', label: 'Measured' },
];

const PRIORITY_OPTIONS = (Object.keys(PRIORITY_CONFIG) as ActionPriority[]).map((p) => ({
  value: p,
  label: PRIORITY_CONFIG[p].label,
}));

export function ActionRegisterPage(): React.ReactNode {
  const [statusFilter, setStatusFilter] = useState('__all__');
  // Multi-select CSV, 'all' = no filter (FilterMultiSelect contract).
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [ruleFilter, setRuleFilter] = useState('all');
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: actionRegisterKeys.list(statusFilter !== '__all__' ? { status: statusFilter } : undefined),
    queryFn: () => fetchActions(statusFilter !== '__all__' ? { status: statusFilter } : undefined),
    refetchInterval: 15_000,
  });

  const { data: stats } = useQuery({
    queryKey: actionRegisterKeys.stats(),
    queryFn: fetchActionStats,
  });

  const actions = data?.actions ?? [];

  // Rule options come from the loaded data (e.g. Full Shelf, Right Product, Right Price).
  const ruleOptions = [...new Set(actions.map((a) => a.rule).filter(Boolean))]
    .sort()
    .map((r) => ({ value: r, label: r }));

  // Status filters server-side (query param); priority + rule filter client-side.
  const selectedPriorities = priorityFilter && priorityFilter !== 'all' ? new Set(priorityFilter.split(',')) : null;
  const selectedRules = ruleFilter && ruleFilter !== 'all' ? new Set(ruleFilter.split(',')) : null;
  const filteredActions = actions.filter(
    (a) =>
      (!selectedPriorities || selectedPriorities.has(a.priority)) &&
      (!selectedRules || selectedRules.has(a.rule)),
  );
  const hasActiveFilters = statusFilter !== '__all__' || selectedPriorities !== null || selectedRules !== null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={XCircle}
        title="Failed to load actions"
        description="Could not connect to the Action Register."
        action={
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* Title bar — menu name; tabs + filters on the row below */}
      <PageHeader title="Actions" />

      {/* Status tabs left, filters right (search-leftmost pattern; no search here) */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <TabsList variant="underline">
            {STATUS_TAB_OPTIONS.map((opt) => (
              <TabsTrigger key={opt.value} value={opt.value} variant="underline">
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
            <FilterMultiSelect
              value={priorityFilter}
              onChange={setPriorityFilter}
              placeholder="Priority"
              options={PRIORITY_OPTIONS}
            />
            <FilterMultiSelect
              value={ruleFilter}
              onChange={setRuleFilter}
              placeholder="Rule"
              options={ruleOptions}
            />
          </div>
        </div>
      </Tabs>

      {/* Stats */}
      {stats && (
        <MetricGrid columns={4}>
          <MetricCard label="Total Actions" value={stats.total} icon={ClipboardCheck} iconColor="info" />
          <MetricCard label="Proposed" value={stats.proposed} icon={AlertTriangle} iconColor="warning" />
          <MetricCard label="Approval Rate" value={stats.approval_rate} icon={ThumbsUp} iconColor="success" />
          <MetricCard label="Avg Effectiveness" value={`${stats.avg_effectiveness}/5`} icon={Star} iconColor="info" />
        </MetricGrid>
      )}

      {/* Action cards */}
      {filteredActions.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No actions"
          description={hasActiveFilters ? 'No actions match the current filters.' : 'Run a store review to generate actions.'}
        />
      ) : (
        <div className="space-y-3">
          {filteredActions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              onClick={() => {
                setSelectedAction(action);
                setDetailOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <ActionDetailDialog
        action={selectedAction}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
