import { Modal } from '@/components/ui';
import { useTaskMutations } from '../hooks/useTaskMutations';
import type { Task } from '../types/task.types';
import { TaskForm, type TaskFormValues } from './TaskForm';

interface EditTaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

function toDateInputValue(iso: string | null): string {
  if (iso === null || iso.length === 0) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Edit an existing task. Renders the SAME shared `TaskForm` as create — so the
 * two flows never diverge — and diff-patches only the fields that changed.
 * Only the assignor can edit (gated by canUserDo('edit', ...) at the call site).
 *
 * The form is remounted on every open via the `key` so reopening discards
 * unsaved edits and reflects the latest task state.
 */
export function EditTaskModal({ task, isOpen, onClose }: EditTaskModalProps): React.JSX.Element {
  const { patch } = useTaskMutations();
  const formKey = isOpen ? `open:${task.id}:${task.updated_at}` : 'closed';

  const initial: TaskFormValues = {
    title: task.title,
    description: task.description,
    priority: task.priority,
    assignedTo: task.assigned_to,
    dueDate: toDateInputValue(task.due_date),
  };

  const handleSubmit = (v: TaskFormValues): void => {
    const nextDueIso = v.dueDate ? new Date(v.dueDate).toISOString() : null;
    const patchBody: Parameters<typeof patch.mutate>[0]['patch'] = {};
    if (v.title !== task.title) patchBody.title = v.title;
    if (v.description !== task.description) patchBody.description = v.description;
    if (v.priority !== task.priority) patchBody.priority = v.priority;
    if (v.assignedTo !== task.assigned_to) patchBody.assigned_to = v.assignedTo;
    if (nextDueIso !== task.due_date) patchBody.due_date = nextDueIso;

    if (Object.keys(patchBody).length === 0) {
      onClose();
      return;
    }

    patch.mutate({ id: task.id, patch: patchBody }, { onSuccess: () => onClose() });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit task" size="lg">
      <TaskForm
        key={formKey}
        initial={initial}
        onSubmit={handleSubmit}
        onCancel={onClose}
        submitLabel="Save changes"
        pendingLabel="Saving…"
        isPending={patch.isPending}
      />
    </Modal>
  );
}
