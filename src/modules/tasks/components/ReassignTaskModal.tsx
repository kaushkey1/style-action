import { useState } from 'react';
import { Button, Modal, ModalFooter, Textarea } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useTaskMutations } from '../hooks/useTaskMutations';
import { emailToast } from '../lib/emailMockToast';
import type { Task } from '../types/task.types';
import { AssigneePicker } from './AssigneePicker';

interface ReassignTaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Hand the task to a different assignee. Only the assignor can reassign
 * (gated by canUserDo('reassign', ...) at the call site).
 *
 * The mock email "task_assigned" goes to the new assignee on success.
 * The optional reason is forwarded so the BE can record the activity note.
 */
export function ReassignTaskModal({ task, isOpen, onClose }: ReassignTaskModalProps): React.JSX.Element {
  const formKey = isOpen ? `open:${task.id}:${task.updated_at}` : 'closed';
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reassign task" size="md">
      <ReassignTaskForm key={formKey} task={task} onClose={onClose} />
    </Modal>
  );
}

interface ReassignTaskFormProps {
  task: Task;
  onClose: () => void;
}

function ReassignTaskForm({ task, onClose }: ReassignTaskFormProps): React.JSX.Element {
  const { patch } = useTaskMutations();
  const toast = useToast();
  const userEmail = useAuthStore((s) => s.user?.email ?? '');
  const [assignee, setAssignee] = useState('');
  const [reason, setReason]     = useState('');
  const [error, setError]       = useState<string | null>(null);

  const excludeEmails = [task.assigned_to, userEmail].filter((e) => e.length > 0);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!assignee) {
      setError('Please pick a new assignee');
      return;
    }
    if (assignee === task.assigned_to) {
      setError('Pick a different assignee');
      return;
    }
    setError(null);

    patch.mutate(
      {
        id: task.id,
        patch: { assigned_to: assignee },
        reason: reason.trim() || undefined,
      },
      {
        onSuccess: (updated) => {
          emailToast(toast, 'task_assigned', updated.assigned_to);
          onClose();
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600">
        Hand this task to a different teammate. They&rsquo;ll be notified by email.
      </p>

      <div className="space-y-1.5">
        <label htmlFor="reassign-assignee" className="text-sm font-medium text-gray-700">
          New assignee <span className="text-red-600">*</span>
        </label>
        <div id="reassign-assignee">
          <AssigneePicker
            value={assignee}
            onChange={setAssignee}
            excludeEmails={excludeEmails}
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="reassign-reason" className="text-sm font-medium text-gray-700">
          Reason (optional)
        </label>
        <Textarea
          id="reassign-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Context for the new assignee…"
          rows={3}
        />
      </div>

      <ModalFooter>
        <Button type="button" variant="ghost" onClick={onClose} disabled={patch.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={patch.isPending}>
          {patch.isPending ? 'Reassigning…' : 'Reassign'}
        </Button>
      </ModalFooter>
    </form>
  );
}
