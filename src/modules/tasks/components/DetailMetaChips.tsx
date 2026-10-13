import { Avatar } from '@/components/ui';
import type { Task } from '../types/task.types';
import { TaskStatusPill } from './TaskStatusPill';
import { PriorityChip } from './PriorityChip';

/**
 * Compact, display-only meta chips for the mobile task detail — status · priority
 * · assignee. (Due date + assignor sit in a caption under the title.) Editing
 * happens in the Edit form; status changes via the Kanban board.
 */
export function DetailMetaChips({ task }: { task: Task }): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <TaskStatusPill status={task.status} />
      <PriorityChip priority={task.priority} />
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
        {task.assigned_to ? (
          <>
            <Avatar name={task.assigned_to} size="xs" />
            {task.assigned_to.split('@')[0]}
          </>
        ) : (
          'Unassigned'
        )}
      </span>
    </div>
  );
}
