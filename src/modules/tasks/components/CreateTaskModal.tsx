import { Modal } from '@/components/ui';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useTaskMutations } from '../hooks/useTaskMutations';
import type { TaskPriority } from '../types/task.types';
import { TaskForm, type TaskFormValues } from './TaskForm';

export interface LinkedExceptionContext {
  /** Real exception id used for navigation and persistence (typically a UUID). */
  id: string;
  /** Human-readable code shown in the UI (e.g. "EXC-STOCK-AGING"). Falls back to id when absent. */
  displayId?: string;
  title: string;
  description: string;
  severity: 'S1' | 'S2' | 'S3' | 'S4';
  /** Days to act — from the exception's deadline_days field. Used to pre-populate the deadline. */
  deadlineDays?: number | null;
  /** LLM-generated recommended action text. Appended to the task description when present. */
  recommendedAction?: string | null;
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** When set, pre-populates the form for the "from exception" variant. */
  linkedException?: LinkedExceptionContext;
}

const SEVERITY_TO_PRIORITY: Record<LinkedExceptionContext['severity'], TaskPriority> = {
  S1: 'Critical',
  S2: 'High',
  S3: 'Medium',
  S4: 'Low',
};

function buildInitial(linkedException: LinkedExceptionContext | undefined): TaskFormValues {
  const title = linkedException ? `Investigate: ${linkedException.title}` : '';
  let description = linkedException?.description ?? '';
  if (linkedException?.recommendedAction) {
    description += description ? '\n\nRecommended action: ' : 'Recommended action: ';
    description += linkedException.recommendedAction;
  }
  const priority = linkedException ? SEVERITY_TO_PRIORITY[linkedException.severity] : 'Medium';
  let dueDate = '';
  if (linkedException?.deadlineDays) {
    const d = new Date();
    d.setDate(d.getDate() + linkedException.deadlineDays);
    dueDate = d.toISOString().split('T')[0] ?? '';
  }
  return { title, description, priority, assignedTo: '', dueDate };
}

/**
 * Two variants share this modal:
 *   - General task — `linkedException` omitted, blank form
 *   - Task from exception — `linkedException` passed, fields pre-filled
 *
 * The shared `TaskForm` is keyed so that switching contexts (or re-opening the
 * modal) remounts it with fresh state. Create and Edit render the SAME form so
 * the two flows never diverge.
 */
export function CreateTaskModal({ isOpen, onClose, linkedException }: CreateTaskModalProps): React.JSX.Element {
  const { create } = useTaskMutations();
  const userEmail = useAuthStore((s) => s.user?.email ?? '');
  const formKey = isOpen ? `open:${linkedException?.id ?? '__blank__'}` : 'closed';

  const handleSubmit = (v: TaskFormValues): void => {
    create.mutate(
      {
        title: v.title,
        description: v.description.trim(),
        assigned_to: v.assignedTo,
        priority: v.priority,
        due_date: v.dueDate ? new Date(v.dueDate).toISOString() : null,
        exception_id: linkedException?.id ?? null,
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={linkedException ? `Create task from ${linkedException.displayId ?? linkedException.id}` : 'Create task'}
      size="lg"
    >
      <TaskForm
        key={formKey}
        initial={buildInitial(linkedException)}
        onSubmit={handleSubmit}
        onCancel={onClose}
        submitLabel="Create Task"
        pendingLabel="Creating…"
        isPending={create.isPending}
        excludeEmails={userEmail ? [userEmail] : []}
      />
    </Modal>
  );
}
