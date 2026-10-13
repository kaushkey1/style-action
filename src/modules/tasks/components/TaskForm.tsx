import { useState } from 'react';
import { Button, Input, Textarea, ModalFooter, DatePicker } from '@/components/ui';
import type { TaskPriority } from '../types/task.types';
import { AssigneePicker } from './AssigneePicker';
import { PriorityPicker } from './PriorityPicker';

/**
 * Shared task form used by BOTH Create and Edit modals so the two flows never
 * diverge (same fields, same controls: AssigneePicker · DatePicker · PriorityPicker).
 * The parent owns the mutation + modal chrome; this component owns the fields,
 * local state, and validation, and hands back the values on submit.
 */
export interface TaskFormValues {
  title: string;
  description: string;
  priority: TaskPriority;
  /** Assignee email ('' = none). */
  assignedTo: string;
  /** Deadline as ISO `YYYY-MM-DD`, or '' when unset. */
  dueDate: string;
}

interface TaskFormProps {
  initial: TaskFormValues;
  onSubmit: (values: TaskFormValues) => void;
  onCancel: () => void;
  submitLabel: string;
  pendingLabel: string;
  isPending: boolean;
  /** Emails to exclude from the assignee picker (e.g. the current user on create). */
  excludeEmails?: readonly string[];
}

export function TaskForm({
  initial, onSubmit, onCancel, submitLabel, pendingLabel, isPending, excludeEmails = [],
}: TaskFormProps): React.JSX.Element {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [priority, setPriority] = useState<TaskPriority>(initial.priority);
  const [assignedTo, setAssignedTo] = useState(initial.assignedTo);
  const [dueDate, setDueDate] = useState(initial.dueDate);
  const [errors, setErrors] = useState<{ title?: string; assignedTo?: string }>({});

  // Deadlines can't be in the past — local today as the min selectable date.
  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!title.trim()) next.title = 'Title is required';
    if (!assignedTo) next.assignedTo = 'Assignee is required';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit({ title: title.trim(), description, priority, assignedTo, dueDate });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="task-form-title" className="text-sm font-medium text-gray-700">
          Title <span className="text-red-600">*</span>
        </label>
        <Input
          id="task-form-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'task-form-title-error' : undefined}
        />
        {errors.title && <p id="task-form-title-error" className="text-xs text-red-600">{errors.title}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="task-form-description" className="text-sm font-medium text-gray-700">Description</label>
        <Textarea
          id="task-form-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Context, acceptance criteria, links…"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="task-form-assignee" className="text-sm font-medium text-gray-700">
            Assignee <span className="text-red-600">*</span>
          </label>
          <div id="task-form-assignee">
            <AssigneePicker value={assignedTo} onChange={setAssignedTo} excludeEmails={excludeEmails} />
          </div>
          {errors.assignedTo && <p className="text-xs text-red-600">{errors.assignedTo}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="task-form-due" className="text-sm font-medium text-gray-700">Deadline</label>
          <DatePicker id="task-form-due" value={dueDate} onChange={setDueDate} placeholder="dd/mm/yyyy" label="Deadline" minDate={todayIso} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="task-form-priority" className="text-sm font-medium text-gray-700">Priority</label>
        <div id="task-form-priority"><PriorityPicker value={priority} onChange={setPriority} /></div>
      </div>

      <ModalFooter>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>Cancel</Button>
        <Button type="submit" disabled={isPending}>{isPending ? pendingLabel : submitLabel}</Button>
      </ModalFooter>
    </form>
  );
}
