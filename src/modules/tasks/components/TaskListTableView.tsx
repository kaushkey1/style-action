import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link as LinkIcon } from 'lucide-react';
import {
  Avatar,
  Button,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  EmptyState,
} from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Task, TaskListTab, TaskStatus } from '../types/task.types';
import { TaskStatusPill } from './TaskStatusPill';
import { PriorityChip } from './PriorityChip';
import { TaskListCardView } from './TaskListCardView';
import { TaskActionsMenu } from './TaskActionsMenu';

const NEW_BADGE_STATUSES: ReadonlySet<TaskStatus> = new Set(['open', 'reopened']);

/** Shared cell treatment — vertically centred, single-line rows for a clean, even table. */
const CELL = 'align-middle py-2.5';

/** "Created by" handle shown in the Assignor cell; full email surfaces on hover. */
function assignorHandle(email: string): string {
  return email.split('@')[0] ?? email;
}

export interface TaskListTableViewProps {
  tasks: Task[];
  tab: TaskListTab;
}

export function TaskListTableView({ tasks, tab }: TaskListTableViewProps): React.JSX.Element {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [now] = useState<number>(() => Date.now());

  // Flat list, most-recently-updated first. No sub-tabs / sort control — the
  // Status column carries state, and the toolbar filters live on the page.
  const rows = useMemo(
    () => [...tasks].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
    [tasks],
  );

  if (isMobile) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
          Table view is optimised for ≥1024px screens. Showing card view instead.
        </p>
        <TaskListCardView tasks={tasks} tab={tab} />
      </div>
    );
  }

  if (rows.length === 0) {
    return <EmptyState description="No tasks match your filters." />;
  }

  return (
    <DataTable minWidth="1040px">
      <DataTableHeader className="bg-white">
        <DataTableHead>Task</DataTableHead>
        <DataTableHead>Linked</DataTableHead>
        <DataTableHead>Priority</DataTableHead>
        <DataTableHead>Status</DataTableHead>
        <DataTableHead>Deadline</DataTableHead>
        <DataTableHead>Assignor</DataTableHead>
        <DataTableHead>Updated</DataTableHead>
        <DataTableHead>{''}</DataTableHead>
      </DataTableHeader>
      <DataTableBody>
        {rows.map((task) => {
          const isUnread = task.unread_by_assignee && NEW_BADGE_STATUSES.has(task.status);
          const isOverdue = task.due_date !== null && new Date(task.due_date).getTime() < now;
          const dueText = task.due_date
            ? isOverdue
              ? `Overdue ${formatRelativeTime(task.due_date)}`
              : `Due ${formatRelativeTime(task.due_date)}`
            : '—';
          return (
            <DataTableRow
              key={task.id}
              className="cursor-pointer"
              onClick={() => void navigate(`/tasks/${task.id}`)}
            >
              {/* Task — leading unread dot + single-line title */}
              <DataTableCell className={CELL}>
                <div className="flex items-center gap-2">
                  {isUnread && (
                    <span className="inline-flex shrink-0 items-center">
                      <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden />
                      <span className="sr-only">New</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void navigate(`/tasks/${task.id}`);
                    }}
                    title={task.title}
                    className={cn(
                      'block max-w-[300px] truncate text-left text-gray-900 hover:text-primary',
                      isUnread ? 'font-semibold' : 'font-medium',
                    )}
                  >
                    {task.title}
                  </button>
                </div>
              </DataTableCell>

              {/* Linked — compact single-line chip, long ids truncate */}
              <DataTableCell className={CELL}>
                {task.exception_id !== null ? (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto max-w-[160px] p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      void navigate(`/review/${task.exception_id}`);
                    }}
                    title={task.exception_id}
                  >
                    <LinkIcon className="w-3 h-3 shrink-0" />
                    <span className="truncate">{task.exception_id}</span>
                  </Button>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </DataTableCell>

              <DataTableCell className={CELL}><PriorityChip priority={task.priority} /></DataTableCell>
              <DataTableCell className={CELL}><TaskStatusPill status={task.status} /></DataTableCell>

              {/* Deadline — never wraps */}
              <DataTableCell className={CELL}>
                <span className={cn('whitespace-nowrap tabular-nums', isOverdue ? 'text-red-700 font-medium' : 'text-gray-700')}>
                  {dueText}
                </span>
              </DataTableCell>

              {/* Assignor — avatar + handle, full email on hover */}
              <DataTableCell className={CELL}>
                <span className="flex items-center gap-2" title={task.assignor}>
                  <Avatar name={task.assignor} size="xs" />
                  <span className="max-w-[140px] truncate text-gray-700">{assignorHandle(task.assignor)}</span>
                </span>
              </DataTableCell>

              {/* Updated — never wraps */}
              <DataTableCell className={CELL}>
                <span className="whitespace-nowrap text-gray-500 tabular-nums">{formatRelativeTime(task.updated_at)}</span>
              </DataTableCell>

              {/* Functional kebab — shared with the Kanban board card */}
              <DataTableCell className={CELL}>
                <TaskActionsMenu task={task} align="end" />
              </DataTableCell>
            </DataTableRow>
          );
        })}
      </DataTableBody>
    </DataTable>
  );
}
