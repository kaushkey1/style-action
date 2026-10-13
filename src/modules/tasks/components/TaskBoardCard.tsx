import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { cn, formatDate } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { Task } from '../types/task.types';
import type { LaneId } from '../lib/lanes';
import { PriorityChip } from './PriorityChip';
import { TaskActionsMenu } from './TaskActionsMenu';
import { TaskActionsSheet } from './TaskActionsSheet';
import { AssignTaskModal } from './AssignTaskModal';

export interface TaskBoardCardProps {
  task: Task;
  lane: LaneId;
  dragging: boolean;
  /** Start a pointer drag from this card (long-press on touch, move on mouse). */
  onPointerDown: (task: Task, lane: LaneId, cardEl: HTMLElement, e: React.PointerEvent) => void;
  /** Open the task — suppressed by the parent if the gesture became a drag. */
  onActivate: (task: Task) => void;
}

export function TaskBoardCard({
  task,
  lane,
  dragging,
  onPointerDown,
  onActivate,
}: TaskBoardCardProps): React.JSX.Element {
  const isMobile = useIsMobile();
  const [assignSheetOpen, setAssignSheetOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  // Derive assignee initials from email (simplified — real `User` object would have initials)
  const assigneeInitials = task.assigned_to
    ? task.assigned_to
        .split('@')[0]
        ?.split('.')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '?'
    : null;

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActivate(task);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onPointerDown={(e) => onPointerDown(task, lane, e.currentTarget, e)}
      onClick={() => onActivate(task)}
      onKeyDown={handleKeyDown}
      className={cn(
        'cursor-grab rounded-lg border border-gray-200 bg-white p-3 text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary active:cursor-grabbing',
        dragging && 'opacity-40',
      )}
    >
      {/* Title + assignee / kebab cluster */}
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 text-pretty">
          {task.title}
        </p>
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- stops the card's open/drag handlers; the controls inside are themselves keyboard-accessible */}
        <div
          className="flex shrink-0 items-center gap-0.5"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {assigneeInitials ? (
            <Avatar name={task.assigned_to} size="xs" />
          ) : isMobile ? (
            <button
              type="button"
              aria-label="Assign task"
              onClick={() => setAssignSheetOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-600"
            >
              <UserPlus className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Assign task"
              onClick={() => setAssignModalOpen(true)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-600"
            >
              <UserPlus className="h-3.5 w-3.5" />
            </button>
          )}
          <TaskActionsMenu task={task} currentLane={lane} align="end" />

          {/* Assign flow — mobile: bottom-sheet; desktop: modal. Kept inside this
              cluster so portal clicks (which bubble through the React tree, not the
              DOM) hit the cluster's stopPropagation, not the card's open handler. */}
          {isMobile ? (
            <TaskActionsSheet
              task={task}
              currentLane={lane}
              isOpen={assignSheetOpen}
              onClose={() => setAssignSheetOpen(false)}
              initialView="assign"
            />
          ) : (
            <AssignTaskModal task={task} isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} />
          )}
        </div>
      </div>

      {/* Priority + due — adjacent, matching the Card-row meta style. */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <PriorityChip priority={task.priority} />
        <span className="text-xs text-gray-500">
          {task.due_date ? formatDate(task.due_date) : 'No date'}
        </span>
      </div>
    </div>
  );
}
