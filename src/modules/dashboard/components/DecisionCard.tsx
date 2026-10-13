import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MoreVertical,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Copy,
  MessageSquare,
  Timer,
  Send,
  UserPlus,
} from 'lucide-react';
import {
  Badge,
  Button,
  BottomSheet,
  Input,
  ConfirmDialog,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { useDecisionQueueStore } from '../stores/useDecisionQueueStore';
import type { DecisionStatus } from '../stores/useDecisionQueueStore';
import type { Exception } from '@/modules/exceptions/data/mockExceptions';
import type { CriticalKpiDecision, DecisionCardFields } from '../data/mockDecisionData';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DecisionCardProps {
  itemId: string;
  kind: 'exception' | 'kpi';
  // Exception-specific
  exception?: Exception;
  cardFields?: DecisionCardFields;
  // KPI-specific
  kpiDecision?: CriticalKpiDecision;
  onInvestigate?: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Rejection reasons
// ---------------------------------------------------------------------------

const REJECTION_REASONS = [
  'Not the right time',
  'Incorrect analysis',
  'Already actioned externally',
  'Needs more information',
  'Other',
];

// ---------------------------------------------------------------------------
// Status badge + border config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<DecisionStatus, { borderColor: string; label: string; badgeVariant: 'success' | 'error' | 'warning' | 'default' }> = {
  pending: { borderColor: 'border-l-red-500', label: 'Pending', badgeVariant: 'error' },
  approved: { borderColor: 'border-l-green-500', label: 'Approved', badgeVariant: 'success' },
  rejected: { borderColor: 'border-l-gray-300', label: 'Rejected', badgeVariant: 'default' },
  snoozed: { borderColor: 'border-l-gray-300', label: 'Snoozed', badgeVariant: 'default' },
  delegated: { borderColor: 'border-l-gray-300', label: 'Delegated', badgeVariant: 'default' },
  'auto-resolved': { borderColor: 'border-l-green-500', label: 'Auto-resolved', badgeVariant: 'success' },
};

// ---------------------------------------------------------------------------
// Progress Bar
// ---------------------------------------------------------------------------

function ThresholdProgressBar({
  value,
  threshold,
  direction,
  className,
}: {
  value: number;
  threshold: number;
  direction: 'above' | 'below';
  className?: string;
}) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const max = Math.max(value, threshold) * 1.2;
  const fillPct = animated ? Math.min((value / max) * 100, 100) : 0;
  const thresholdPct = Math.min((threshold / max) * 100, 100);
  const isBreach = direction === 'above' ? value > threshold : value < threshold;

  return (
    <div className={cn('space-y-1', className)}>
      {/* Progress bar — dynamic widths require inline styles */}
      {/* eslint-disable no-restricted-syntax -- dynamic width/position for animated progress bar */}
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            'absolute top-0 left-0 h-full rounded-full transition-[width] duration-500 ease-out',
            isBreach ? 'bg-red-500' : 'bg-green-500',
          )}
          style={{ width: `${fillPct}%` }}
        />
        <div
          className="absolute top-0 w-0.5 h-full bg-gray-400"
          style={{ left: `${thresholdPct}%` }}
        />
      </div>
      {/* eslint-enable no-restricted-syntax */}
      { }
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className={cn('font-semibold', isBreach ? 'text-red-600' : 'text-green-600')}>
          {value}%
        </span>
        <span>threshold: {threshold}%</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function DecisionCard({
  itemId,
  kind,
  exception,
  cardFields,
  kpiDecision,
}: DecisionCardProps) {
  const isMobile = useIsMobile();
  const { success, error: toastError } = useToast();
  const status = useDecisionQueueStore((s) => s.getStatus(itemId));
  const isCollapsed = useDecisionQueueStore((s) => s.collapsedItems.has(itemId));
  const delegation = useDecisionQueueStore((s) => s.delegations[itemId]);

  // Approve/Reject confirmation state
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNote, setRejectNote] = useState('');

  // Kebab / comment state
  const [kebabOpen, setKebabOpen] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Recommendation expand
  const [recExpanded, setRecExpanded] = useState(false);

  // Collapse timer ref
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived fields
  const domain = kind === 'exception' ? exception?.domain : kpiDecision?.domain;
  const title = kind === 'exception' ? exception?.title : kpiDecision?.title;
  const relativeTime = kind === 'exception' ? exception?.relativeTime : kpiDecision?.relativeTime;
  const financialImpactFormatted = kind === 'exception' ? cardFields?.financialImpactFormatted : kpiDecision?.financialImpactFormatted;
  const recommendation = kind === 'exception' ? cardFields?.agentRecommendationFull : kpiDecision?.agentRecommendation;
  const primaryActionLabel = kind === 'exception' ? cardFields?.primaryActionLabel : kpiDecision?.primaryActionLabel;
  const metricValue = kind === 'exception' ? cardFields?.metricValue : kpiDecision?.metricValue;
  const threshold = kind === 'exception' ? cardFields?.threshold : kpiDecision?.threshold;
  const thresholdDirection = kind === 'exception' ? cardFields?.thresholdDirection : kpiDecision?.thresholdDirection;

  const statusConfig = STATUS_CONFIG[status];

  // Truncate recommendation
  const recTruncated = recommendation && recommendation.length > 120;
  const recDisplay = recTruncated && !recExpanded ? recommendation.slice(0, 120) + '…' : recommendation;

  // Auto-collapse after approve/reject
  const scheduleCollapse = useCallback(() => {
    if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    collapseTimerRef.current = setTimeout(() => {
      useDecisionQueueStore.getState().collapseItem(itemId);
    }, 3000);
  }, [itemId]);

  useEffect(() => {
    return () => {
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    };
  }, []);

  // --- Handlers ---

  const handleApprove = () => {
    useDecisionQueueStore.getState().approveItem(itemId);
    setShowApproveConfirm(false);
    success(`${primaryActionLabel ?? 'Action'} approved. Executes within 2 hours.`);
    scheduleCollapse();
  };

  const handleReject = () => {
    if (!rejectReason) return;
    useDecisionQueueStore.getState().rejectItem(itemId, { reason: rejectReason, note: rejectNote || undefined });
    setShowRejectConfirm(false);
    toastError('Recommendation rejected. Reason recorded.');
    setRejectReason('');
    setRejectNote('');
    scheduleCollapse();
  };

  const handleSnooze = (duration: string) => {
    const now = new Date();
    let until: Date;
    switch (duration) {
      case '2h': until = new Date(now.getTime() + 2 * 60 * 60 * 1000); break;
      case '4h': until = new Date(now.getTime() + 4 * 60 * 60 * 1000); break;
      case 'tomorrow': {
        until = new Date(now);
        until.setDate(until.getDate() + 1);
        until.setHours(9, 0, 0, 0);
        break;
      }
      default: until = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    }
    useDecisionQueueStore.getState().snoozeItem(itemId, until.toISOString());
    success(`Snoozed until ${until.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/dashboard?exception=${itemId}&highlight=true`;
    navigator.clipboard.writeText(url).then(() => {
      success('Link copied to clipboard');
    });
  };

  const handleSaveComment = () => {
    if (!commentText.trim()) return;
    useDecisionQueueStore.getState().addComment(itemId, commentText.trim());
    setCommentText('');
    setShowComment(false);
    success('Comment saved');
  };

  // --- Collapsed render ---
  if (isCollapsed && status !== 'pending') {
    return (
      <div className={cn('border-l-3 rounded-lg bg-white border border-gray-200 px-4 py-3 flex items-center justify-between', statusConfig.borderColor)}>
        <div className="flex items-center gap-2 min-w-0">
          {status === 'approved' && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
          {status === 'rejected' && <XCircle className="w-4 h-4 text-gray-400 shrink-0" />}
          <span className="text-sm text-gray-700 truncate">{title}</span>
        </div>
        <Badge variant={statusConfig.badgeVariant} size="sm">
          {statusConfig.label} by you
        </Badge>
      </div>
    );
  }

  // --- Full render ---
  return (
    <>
      <div
        className={cn(
          'border-l-3 rounded-lg bg-white border border-gray-200 transition-all duration-200',
          'hover:border-primary/30 hover:shadow-md',
          statusConfig.borderColor,
          status !== 'pending' && 'opacity-80',
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="error" dot>CRITICAL</Badge>
            <span className="text-xs font-medium text-gray-700">{domain}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {relativeTime}
            </span>
            {/* Kebab menu — BottomSheet on mobile, DropdownMenu on desktop */}
            {isMobile ? (
              <>
                <button
                  className="p-1.5 -m-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="More actions"
                  onClick={() => setKebabOpen(true)}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                <BottomSheet isOpen={kebabOpen} onClose={() => setKebabOpen(false)} title="Actions">
                  <div className="space-y-1 pb-4">
                    <button onClick={() => { setKebabOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm text-gray-700 hover:bg-gray-50 min-h-12">
                      <Sparkles className="w-4 h-4 text-gray-500 shrink-0" /> Ask Impetus about this
                    </button>
                    <div className="h-px bg-gray-100 mx-4" />
                    <button onClick={() => { handleSnooze('2h'); setKebabOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm text-gray-700 hover:bg-gray-50 min-h-12">
                      <Timer className="w-4 h-4 text-gray-500 shrink-0" /> Snooze 2 hours
                    </button>
                    <button onClick={() => { handleSnooze('4h'); setKebabOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm text-gray-700 hover:bg-gray-50 min-h-12">
                      <Timer className="w-4 h-4 text-gray-500 shrink-0" /> Snooze 4 hours
                    </button>
                    <button onClick={() => { handleSnooze('tomorrow'); setKebabOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm text-gray-700 hover:bg-gray-50 min-h-12">
                      <Timer className="w-4 h-4 text-gray-500 shrink-0" /> Snooze until tomorrow 9 AM
                    </button>
                    <div className="h-px bg-gray-100 mx-4" />
                    <button onClick={() => { setShowComment(true); setKebabOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm text-gray-700 hover:bg-gray-50 min-h-12">
                      <MessageSquare className="w-4 h-4 text-gray-500 shrink-0" /> Add a comment
                    </button>
                    <button onClick={() => { handleCopyLink(); setKebabOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm text-gray-700 hover:bg-gray-50 min-h-12">
                      <Copy className="w-4 h-4 text-gray-500 shrink-0" /> Copy link
                    </button>
                    <button disabled className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm text-gray-400 min-h-12 opacity-50">
                      <UserPlus className="w-4 h-4 shrink-0" /> Delegate
                    </button>
                  </div>
                </BottomSheet>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-1.5 -m-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    aria-label="More actions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={4}>
                  <DropdownMenuItem onSelect={() => { /* Ask Impetus placeholder */ }}>
                    <Sparkles className="w-4 h-4 text-gray-500" />
                    Ask Impetus about this
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Timer className="w-4 h-4 text-gray-500" />
                      Snooze
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onSelect={() => handleSnooze('2h')}>2 hours</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleSnooze('4h')}>4 hours</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleSnooze('tomorrow')}>Tomorrow, 9 AM</DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem onSelect={() => setShowComment(true)}>
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    Add a comment
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleCopyLink}>
                    <Copy className="w-4 h-4 text-gray-500" />
                    Copy link
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <UserPlus className="w-4 h-4 text-gray-500" />
                    Delegate
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Financial impact headline */}
        <div className="px-4 pb-2">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          {financialImpactFormatted && (
            <p className="text-lg font-bold text-gray-900 mt-1">{financialImpactFormatted} at risk</p>
          )}
        </div>

        {/* Progress bar */}
        {metricValue != null && threshold != null && thresholdDirection && (
          <div className="px-4 pb-3">
            <ThresholdProgressBar
              value={metricValue}
              threshold={threshold}
              direction={thresholdDirection}
            />
          </div>
        )}

        {/* Agent recommendation */}
        {recommendation && status === 'pending' && (
          <div className="px-4 pb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Agent recommendation</p>
            <p className="text-xs text-gray-700 leading-relaxed">
              {recDisplay}
              {recTruncated && (
                <button
                  onClick={() => setRecExpanded(!recExpanded)}
                  className="text-primary text-xs font-medium ml-1"
                >
                  {recExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </p>
          </div>
        )}

        {/* Status chips for non-pending states */}
        {status === 'approved' && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approved by you
            </div>
          </div>
        )}
        {status === 'rejected' && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
              <XCircle className="w-3.5 h-3.5" />
              Rejected · reason recorded
            </div>
          </div>
        )}
        {status === 'delegated' && delegation && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
              <UserPlus className="w-3.5 h-3.5" />
              Delegated to {delegation.delegateeName}
            </div>
          </div>
        )}

        {/* Action buttons — hidden until approve/reject workflow is ready */}

        {/* Ask Impetus tertiary CTA — hidden until approve/reject workflow is ready */}

        {/* Inline comment */}
        {showComment && (
          <div className="px-4 pb-3 border-t border-gray-100 pt-3">
            <div className="flex gap-2">
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a note for the record…"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveComment();
                  if (e.key === 'Escape') setShowComment(false);
                }}
              />
              <Button size="sm" onClick={handleSaveComment} disabled={!commentText.trim()}>
                <Send className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Approve confirmation */}
      <ConfirmDialog
        open={showApproveConfirm}
        onOpenChange={setShowApproveConfirm}
        title={`${primaryActionLabel ?? 'Approve'}?`}
        description={`This will trigger execution for this item. ${financialImpactFormatted ? `Financial impact: ${financialImpactFormatted}.` : ''} Execution begins within 2 hours of approval.`}
        confirmLabel="Confirm approval"
        onConfirm={handleApprove}
      />

      {/* Reject confirmation */}
      <ConfirmDialog
        open={showRejectConfirm}
        onOpenChange={setShowRejectConfirm}
        title="Reject this recommendation?"
        description="Rejecting removes this item from the active queue. Your reason will be recorded and visible to the team."
        confirmLabel="Reject and log reason"
        variant="destructive"
        onConfirm={handleReject}
        confirmDisabled={!rejectReason}
      >
        <div className="space-y-3 mt-3">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">
              Reason <span className="text-red-500">*</span>
            </p>
            <Select value={rejectReason} onValueChange={setRejectReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason…" />
              </SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            label="Note (optional)"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Add a note…"
          />
        </div>
      </ConfirmDialog>
    </>
  );
}
