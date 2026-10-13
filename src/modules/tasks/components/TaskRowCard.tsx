import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link as LinkIcon, UserPlus } from 'lucide-react';
import { Avatar, Badge, Button } from '@/components/ui';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { Task } from '../types/task.types';
import { TaskStatusPill } from './TaskStatusPill';
import { PriorityChip } from './PriorityChip';
import { TaskActionsMenu } from './TaskActionsMenu';
import { TaskActionsSheet } from './TaskActionsSheet';
import { AssignTaskModal } from './AssignTaskModal';

const NEW_BADGE_STATUSES: ReadonlySet<Task['status']> = new Set(['open', 'reopened']);

// Lab-card chip styling (mobile). Status = neutral pill + a status-coloured dot;
// priority = a coloured pill whose dot inherits the text colour (`bg-current`).
const STATUS_LABEL: Record<Task['status'], string> = {
  pending: 'Pending',
  open: 'Open',
  in_progress: 'In progress',
  in_review: 'In review',
  done: 'Done',
  blocked: 'Blocked',
  reopened: 'Reopened',
  cancelled: 'Cancelled',
};
const STATUS_DOT: Record<Task['status'], string> = {
  pending: 'bg-gray-400',
  open: 'bg-gray-400',
  in_progress: 'bg-amber-500',
  in_review: 'bg-blue-500',
  done: 'bg-green-500',
  blocked: 'bg-red-500',
  reopened: 'bg-amber-500',
  cancelled: 'bg-gray-400',
};
const PRIO_CHIP: Record<Task['priority'], string> = {
  Critical: 'bg-red-100 text-red-700',
  High: 'bg-amber-100 text-amber-700',
  Medium: 'bg-blue-100 text-blue-700',
  Low: 'bg-gray-100 text-gray-700',
};

export interface TaskRowCardProps {
  task: Task;
}

export function TaskRowCard({ task }: TaskRowCardProps): React.JSX.Element {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  // Capture "now" once per mount — keeps render pure (no Date.now() in body).
  const [now] = useState<number>(() => Date.now());
  const [assignSheetOpen, setAssignSheetOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const isUnread = task.unread_by_assignee && NEW_BADGE_STATUSES.has(task.status);
  const isOverdue = task.due_date !== null && new Date(task.due_date).getTime() < now;
  const dueText = task.due_date
    ? isOverdue
      ? `Overdue ${formatRelativeTime(task.due_date)}`
      : `Due ${formatRelativeTime(task.due_date)}`
    : 'No due date';

  const handleNavigate = (): void => {
    void navigate(`/tasks/${task.id}`);
  };

  // Trailing actions — assignee avatar + kebab (Edit · History; no Move — Kanban only).
  const actions = (
    <div className="mt-0.5 flex shrink-0 items-center gap-0.5">
      {task.assigned_to ? (
        <Avatar name={task.assigned_to} size="xs" className="bg-primary font-semibold text-white" />
      ) : (
        <button
          type="button"
          aria-label="Assign task"
          onClick={() => (isMobile ? setAssignSheetOpen(true) : setAssignModalOpen(true))}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-600"
        >
          <UserPlus className="h-3 w-3" />
        </button>
      )}
      <TaskActionsMenu task={task} showMove={false} align="end" />
      {isMobile ? (
        <TaskActionsSheet
          task={task}
          isOpen={assignSheetOpen}
          onClose={() => setAssignSheetOpen(false)}
          initialView="assign"
          showMove={false}
        />
      ) : (
        <AssignTaskModal task={task} isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} />
      )}
    </div>
  );

  return (
    <div
      className={cn(
        'group bg-white rounded-lg border border-gray-200 p-3 hover:border-primary/30 hover:shadow-md transition-all duration-200',
        isUnread && 'border-l-3 border-l-red-500',
        !isMobile && 'min-h-[72px]',
      )}
    >
      {isMobile ? (
        <div className="flex items-start gap-2.5">
          <div className="min-w-0 flex-1">
            <button type="button" onClick={handleNavigate} className="block w-full text-left">
              <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 text-pretty">
                {task.title}
              </p>
            </button>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {/* Status — neutral pill + status-coloured dot. */}
              <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-700">
                <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[task.status])} aria-hidden />
                {STATUS_LABEL[task.status]}
              </span>
              {isUnread && (
                <Badge variant="error" size="sm">
                  NEW
                </Badge>
              )}
              {/* Priority — coloured pill, dot inherits text colour. */}
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-1.5 py-0.5 text-xs font-medium',
                  PRIO_CHIP[task.priority],
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                {task.priority}
              </span>
              {/* SLA / due + assignor. */}
              <span className={cn('text-xs', isOverdue ? 'font-medium text-red-700' : 'text-gray-500')}>
                {dueText}
              </span>
              <span className="text-xs text-gray-400" aria-hidden>·</span>
              <span className="text-xs text-gray-500">{task.assignor.split('@')[0]}</span>
              {task.exception_id !== null && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/review/${task.exception_id}`);
                  }}
                >
                  <LinkIcon className="w-3 h-3" /> {task.exception_id}
                </Button>
              )}
            </div>
          </div>
          {actions}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <TaskStatusPill status={task.status} />
          {isUnread && (
            <Badge variant="error" size="sm">
              NEW
            </Badge>
          )}
          <button
            type="button"
            onClick={handleNavigate}
            className="text-sm font-medium text-gray-900 text-left truncate hover:text-primary flex-1"
          >
            {task.title}
          </button>
          {task.exception_id !== null && (
            <Button
              variant="link"
              size="sm"
              className="shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/review/${task.exception_id}`);
              }}
            >
              <LinkIcon className="w-3 h-3" /> {task.exception_id}
            </Button>
          )}
          <PriorityChip priority={task.priority} />
          <span
            className={cn(
              'text-sm tabular-nums w-24 text-right',
              isOverdue ? 'text-red-700 font-medium' : 'text-gray-500',
            )}
          >
            {dueText}
          </span>
          <span className="text-xs text-gray-500 w-40 truncate">{task.assignor}</span>
          {actions}
        </div>
      )}
    </div>
  );
}
