import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Bot, User, Clock } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { useActionHistoryStore } from '../stores/useActionHistoryStore';
import type { ActionRecord } from '../data/mockActionHistory';

// ---------------------------------------------------------------------------
// Action Row
// ---------------------------------------------------------------------------

const ACTION_BADGE: Record<string, { variant: 'success' | 'error' | 'warning' | 'default'; label: string }> = {
  executed: { variant: 'success', label: 'Executed' },
  pending: { variant: 'warning', label: 'Pending' },
  cancelled: { variant: 'default', label: 'Cancelled' },
  failed: { variant: 'error', label: 'Failed' },
};

function ActionRow({ action, onCancel }: { action: ActionRecord; onCancel: (id: string) => void }) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const ActorIcon = action.actorType === 'agent' ? Bot : User;
  const statusConf = ACTION_BADGE[action.status] ?? ACTION_BADGE['executed']!;

  return (
    <div className="px-4 py-3 border-b border-gray-100 last:border-0">
      {/* Actor + status */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <ActorIcon className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-xs font-medium text-gray-900 truncate">{action.actor}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={statusConf.variant} size="sm" className="text-xs">
            {statusConf.label}
          </Badge>
          <span className="text-xs text-gray-400">{action.relativeTime}</span>
        </div>
      </div>

      {/* Subject */}
      <p className="text-sm text-gray-700 mb-1">{action.subject}</p>

      {/* Execution time + financial impact */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-500">{action.executionTime}</span>
        {action.financialImpact && (
          <span className="text-xs font-medium text-gray-700">{action.financialImpact}</span>
        )}
      </div>

      {/* Cancel action — inline confirm */}
      {action.status === 'pending' && (
        <div className="mt-2">
          {confirmCancel ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Cancel before execution?</span>
              <Button size="sm" variant="outline" className="text-xs h-6" onClick={() => { onCancel(action.id); setConfirmCancel(false); }}>
                Confirm
              </Button>
              <Button size="sm" variant="ghost" className="text-xs h-6" onClick={() => setConfirmCancel(false)}>
                Keep it
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmCancel(true)}
              className="text-xs text-primary hover:text-primary-700 transition-colors"
            >
              Cancel before execution →
            </button>
          )}
        </div>
      )}

      {action.status === 'executed' && (
        <button className="text-xs text-gray-400 hover:text-gray-600 transition-colors mt-1">
          View audit →
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------

export function ActionHistoryPanel() {
  const { isOpen, close, actions, cancelAction } = useActionHistoryStore();
  const isMobile = useIsMobile();
  const { success } = useToast();

  const handleCancel = (id: string) => {
    cancelAction(id);
    success('Action cancelled before execution.');
  };

  if (!isOpen) return null;

  const pendingCount = actions.filter((a) => a.status === 'pending').length;

  const panel = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={close}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed z-50 bg-white flex flex-col',
          isMobile
            ? 'inset-x-0 bottom-0 rounded-t-2xl max-h-[90dvh]'
            : 'top-0 right-0 bottom-0 w-[420px] border-l border-gray-200 shadow-xl',
        )}
      >
        {/* Mobile drag handle */}
        {isMobile && (
          <div className="flex justify-center py-2 shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>
        )}

        {/* Header */}
        {/* eslint-disable-next-line design-system/prefer-section-header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">Action History</h2>
            {pendingCount > 0 && (
              <Badge variant="warning" size="sm">{pendingCount} pending</Badge>
            )}
          </div>
          <button
            onClick={close}
            className="p-2 -m-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg"
            aria-label="Close action history"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action list */}
        <div className="flex-1 overflow-y-auto">
          {actions.map((action) => (
            <ActionRow key={action.id} action={action} onCancel={handleCancel} />
          ))}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-4 py-3 border-t border-gray-100 bg-gray-50 pb-safe">
          <button className="text-xs text-primary hover:text-primary-700 transition-colors w-full text-center">
            Open full history →
          </button>
        </div>
      </div>
    </>
  );

  return createPortal(panel, document.body);
}
