import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, AlertTriangle, ClipboardList, ExternalLink } from 'lucide-react';
import { Button, Modal, ModalFooter, Input } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { cn, formatCurrency } from '@/lib/utils';
import { CreateTaskModal } from '@/modules/tasks/components/CreateTaskModal';
import type { LinkedExceptionContext } from '@/modules/tasks/components/CreateTaskModal';
import { TaskStatusPill } from '@/modules/tasks/components/TaskStatusPill';
import { useTaskByException } from '@/modules/tasks/hooks/useTaskByException';

function highlightNumbers(text: string): React.ReactNode {
  const parts = text.split(/(₹[\d,.]+\s*(?:Cr|L|K)?|Rs\.?\s*[\d,.]+\s*(?:Cr|L|K)?|\d+(?:\.\d+)?%|\d+(?:,\d+)*\s*(?:SKUs?|DCs?|POs?|stores?|vendors?|categories|months?|days?|orders?))/gi);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <span key={i} className="font-semibold text-gray-900">{part}</span>;
    }
    return part;
  });
}
import { ReviewDetailHeader } from './ReviewDetailHeader';
import { MetricBreachCard } from './MetricBreachCard';
import { ActionPreview } from './ActionPreview';
import { ConnectedEntities } from './ConnectedEntities';
// import { ConversationThread } from './ConversationThread'; // hidden — future release
import { FeedbackPanelSection } from './feedback/FeedbackPanelSection';
import { RejectReasonModal } from './RejectReasonModal';
import { useReviewStore } from '../stores/useReviewStore';
import type { UnifiedItem } from '../data/mockReviewData';
import type { ExceptionDomain } from '@/modules/exceptions/data/mockExceptions';

const HIGH_VALUE_THRESHOLD = 10_000_000;

interface ReviewDetailPanelProps {
  item: UnifiedItem;
  onClose?: () => void;
  className?: string;
}

export function ReviewDetailPanel({ item, onClose, className }: ReviewDetailPanelProps): React.ReactNode {
  const navigate = useNavigate();
  const approveItem = useReviewStore((s) => s.approveItem);
  const undoApprove = useReviewStore((s) => s.undoApprove);
  const rejectItem = useReviewStore((s) => s.rejectItem);
  const acknowledgeItem = useReviewStore((s) => s.acknowledgeItem);
  const selectItem = useReviewStore((s) => s.selectItem);
  const { success: toastSuccess, removeToast, toast: addToast } = useToast();
  const { data: linkedTask } = useTaskByException(item.id);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHighValueModal, setShowHighValueModal] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const linkedExceptionContext: LinkedExceptionContext = {
    id: item.id,
    displayId: item.displayId,
    title: item.title,
    description: item.summary,
    severity: item.severity,
  };
  const undoTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isReversible = item.approvalContext?.isReversible ?? true;
  const isHighValue = item.projectedImpactInr >= HIGH_VALUE_THRESHOLD;

  const executeApproval = useCallback((): void => {
    approveItem(item.id);
    selectItem(null);

    if (isReversible) {
      const toastId = addToast({
        title: 'Approved',
        description: `${item.title}`,
        variant: 'success',
        duration: 10000,
        action: (
          <button
            type="button"
            className="text-xs font-semibold text-green-700 hover:text-green-900 underline underline-offset-2"
            onClick={() => {
              undoApprove(item.id);
              removeToast(toastId);
              if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
            }}
          >
            Undo
          </button>
        ),
      });
      undoTimerRef.current = setTimeout(() => {
        undoTimerRef.current = undefined;
      }, 10000);
    } else {
      toastSuccess(`Approved: ${item.title}`);
    }
  }, [item.id, item.title, isReversible, approveItem, selectItem, addToast, undoApprove, removeToast, toastSuccess]);

  const handleApprove = (): void => {
    if (isHighValue) {
      setShowHighValueModal(true);
    } else if (!isReversible) {
      setShowConfirmModal(true);
    } else {
      executeApproval();
    }
  };

  const handleConfirmApprove = (): void => {
    setShowConfirmModal(false);
    executeApproval();
  };

  const handleHighValueApprove = (): void => {
    if (confirmText !== 'APPROVE') return;
    setShowHighValueModal(false);
    setConfirmText('');
    if (!isReversible) {
      executeApproval();
    } else {
      executeApproval();
    }
  };

  const handleReject = (): void => {
    setShowRejectModal(true);
  };

  const handleConfirmReject = (reasonCode: string, note: string): void => {
    rejectItem(item.id, reasonCode, note);
    selectItem(null);
    setShowRejectModal(false);
    toastSuccess(`Rejected: ${item.title}`);
  };

  const handleAcknowledge = (): void => {
    acknowledgeItem(item.id);
    selectItem(null);
    toastSuccess(`Acknowledged: ${item.title}`);
  };

  return (
    <div className={cn("px-4 pt-3.5 pb-4", className)}>
      {/* Zone 1: Identity — Create Task + Close live inline with the badge row */}
      <ReviewDetailHeader
        item={item}
        onApprove={handleApprove}
        onReject={handleReject}
        onAcknowledge={handleAcknowledge}
        actions={
          <>
            {linkedTask ? (
              <>
                <TaskStatusPill status={linkedTask.status} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void navigate(`/tasks/${linkedTask.id}`)}
                  title={linkedTask.title}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Task
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowCreateTask(true)}>
                <ClipboardList className="w-3.5 h-3.5" />
                Create Task
              </Button>
            )}
            {onClose && (
              <Button size="sm" variant="outline" onClick={onClose} aria-label="Close detail panel">
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </>
        }
      />

      {/* Zone 2: AI Summary — standalone card */}
      <div className="mt-3 rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-3 bg-gradient-to-br from-primary-50/80 via-white to-purple-50/50">
          <div className="flex items-center gap-1 mb-2">
            <Sparkles className="w-3 h-3 text-primary-500" />
            <span className="text-xs font-semibold text-primary-600">AI Summary</span>
          </div>
          <p className="text-sm text-gray-700 text-pretty">{highlightNumbers(item.summary)}</p>
        </div>
      </div>

      {/* Zone 3: Action Preview — separate from AI Summary */}
      <ActionPreview item={item} />

      {/* Scope chips — inside a card to feel part of the layout */}
      {item.relatedEntityLabels && item.relatedEntityLabels.length > 0 && (
        <div className="mt-3 rounded-lg border border-gray-200 p-3">
          <ConnectedEntities item={item} />
        </div>
      )}

      {/* Zone 4: Metric Breach */}
      <div className="mt-3">
        <MetricBreachCard item={item} />
      </div>

      {/* Zone 5: Feedback */}
      <div className="mt-3">
        <FeedbackPanelSection key={item.id} exceptionId={item.id} />
      </div>

      {/* Zone 7: Activity — hidden for now, pushed to future release */}
      {/* <div className="mt-3">
        <ConversationThread
          messages={item.conversationThread}
          onSendMessage={(content) => {
            void content;
          }}
        />
      </div> */}

      {/* Reject reason modal */}
      <RejectReasonModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleConfirmReject}
        itemTitle={item.title}
        domain={item.domain as ExceptionDomain}
      />

      {/* Irreversible action confirmation modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Approval"
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">This action cannot be undone. Once approved, changes will be pushed to external systems.</p>
          </div>
          <p className="text-sm text-gray-700">
            <span className="font-medium">{item.title}</span>
            {item.projectedImpactInr > 0 && (
              <span className="text-gray-500"> — {formatCurrency(item.projectedImpactInr)} impact</span>
            )}
          </p>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
          <Button onClick={handleConfirmApprove}>Confirm Approval</Button>
        </ModalFooter>
      </Modal>

      {/* High-value typed confirmation modal */}
      <Modal
        isOpen={showHighValueModal}
        onClose={() => { setShowHighValueModal(false); setConfirmText(''); }}
        title="High-Value Approval"
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              This approval has an impact of <span className="font-bold">{formatCurrency(item.projectedImpactInr)}</span>, exceeding the ₹1 Cr threshold.
              {!isReversible && ' This action cannot be undone.'}
            </p>
          </div>
          <p className="text-sm text-gray-700 font-medium">{item.title}</p>
          <div>
            <label className="text-sm text-gray-700 font-medium" htmlFor="confirm-approve-typed">
              Type APPROVE to confirm:
            </label>
            <Input
              id="confirm-approve-typed"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="APPROVE"
              className="mt-1"
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => { setShowHighValueModal(false); setConfirmText(''); }}>Cancel</Button>
          <Button onClick={handleHighValueApprove} disabled={confirmText !== 'APPROVE'}>Confirm Approval</Button>
        </ModalFooter>
      </Modal>

      {/* Create Task from this exception */}
      <CreateTaskModal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        linkedException={linkedExceptionContext}
      />
    </div>
  );
}
