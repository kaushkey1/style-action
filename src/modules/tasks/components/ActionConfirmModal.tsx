import { useState } from 'react';
import { Button, Modal, ModalFooter, Textarea } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useTaskMutations } from '../hooks/useTaskMutations';
import { ACTION_META } from '../lib/actionMeta';
import { emailToast } from '../lib/emailMockToast';
import type { Task } from '../types/task.types';
import type { TaskAction } from '../lib/permissions';

interface ActionConfirmModalProps {
  task: Task;
  action: TaskAction | null;
  onClose: () => void;
}

/**
 * Single confirm-modal shared by all 7 task mutations (submit, block, approve,
 * request_changes, reopen, cancel, restore). The per-action labels, validation,
 * and side-effects come from ACTION_META.
 *
 * The BE auto-writes a transition activity row and (when reason is set) the
 * matching auto-comment in the same transaction as the status PATCH.
 */
export function ActionConfirmModal({ task, action, onClose }: ActionConfirmModalProps): React.JSX.Element | null {
  const meta = action ? ACTION_META[action] : undefined;
  const isOpen = action !== null && meta !== undefined;

  const { patch } = useTaskMutations();
  const toast = useToast();
  const userEmail = useAuthStore((s) => s.user?.email ?? '');

  const [reason, setReason] = useState('');
  const [error, setError]   = useState<string | null>(null);

  if (!isOpen || !meta) return null;

  const otherParty = task.assigned_to === userEmail ? task.assignor : task.assigned_to;

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (meta.reasonRequired && !reason.trim()) {
      setError('Please provide a reason');
      return;
    }
    setError(null);
    patch.mutate(
      {
        id: task.id,
        patch: { status: meta.nextStatus },
        reason: reason.trim() || undefined,
      },
      {
        onSuccess: () => {
          emailToast(toast, meta.emailEvent, otherParty);
          setReason('');
          onClose();
        },
      },
    );
  };

  const handleClose = (): void => {
    setReason('');
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={meta.title} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">{meta.description}</p>
        <div className="space-y-1.5">
          <label htmlFor="action-reason" className="text-sm font-medium text-gray-700">
            {meta.reasonRequired ? <>Reason <span className="text-red-600">*</span></> : 'Notes (optional)'}
          </label>
          <Textarea
            id="action-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={meta.reasonPlaceholder}
            rows={4}
            error={error ?? undefined}
          />
        </div>
        <ModalFooter>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={patch.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={meta.destructive ? 'destructive' : 'primary'}
            disabled={patch.isPending}
          >
            {patch.isPending ? 'Working…' : meta.submitLabel}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
