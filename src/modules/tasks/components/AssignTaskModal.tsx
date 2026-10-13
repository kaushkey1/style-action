import { useState } from 'react';
import { Button, Modal, ModalFooter } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { useTaskMutations } from '../hooks/useTaskMutations';
import type { Task } from '../types/task.types';
import { AssigneePicker } from './AssigneePicker';

interface AssignTaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Desktop assign flow — a small modal wrapping the shared AssigneePicker.
 * (On mobile, assign opens the TaskActionsSheet at its assign view instead.)
 */
export function AssignTaskModal({ task, isOpen, onClose }: AssignTaskModalProps): React.JSX.Element {
  const { patch } = useTaskMutations();
  const toast = useToast();
  const [value, setValue] = useState(task.assigned_to);

  // Reset to the task's current assignee each time the modal (re)opens.
  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) setValue(task.assigned_to);
  }

  const save = (): void => {
    patch.mutate(
      { id: task.id, patch: { assigned_to: value } },
      {
        onSuccess: () => {
          toast.success(value ? `Assigned to ${value}` : 'Unassigned');
          onClose();
        },
      },
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign task" size="md">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="assign-modal-picker" className="text-sm font-medium text-gray-700">Assignee</label>
          <div id="assign-modal-picker">
            <AssigneePicker value={value} onChange={setValue} />
          </div>
        </div>
        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={patch.isPending}>Cancel</Button>
          <Button type="button" onClick={save} disabled={patch.isPending}>
            {patch.isPending ? 'Assigning…' : 'Assign'}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
