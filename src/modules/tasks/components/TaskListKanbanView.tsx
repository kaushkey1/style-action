import { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Inbox, Plus } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import type { Task, TaskListTab } from '../types/task.types';
import { LANES, STATUS_TO_LANE, type LaneId } from '../lib/lanes';
import { useTaskMutations } from '../hooks/useTaskMutations';
import { useKanbanDrag } from '../hooks/useKanbanDrag';
import { TaskBoardCard } from './TaskBoardCard';
import { PriorityChip } from './PriorityChip';
import { CreateTaskModal } from './CreateTaskModal';

export interface TaskListKanbanViewProps {
  tasks: Task[];
  tab: TaskListTab;
}

export function TaskListKanbanView({ tasks }: TaskListKanbanViewProps): React.JSX.Element {
  const navigate = useNavigate();
  const toast = useToast();
  const { patch } = useTaskMutations();
  const [createOpen, setCreateOpen] = useState(false);

  // Move a card to another lane (drag drop or keyboard-triggered elsewhere).
  const handleMove = useCallback(
    (taskId: string, targetLane: LaneId): void => {
      const target = LANES.find((l) => l.id === targetLane);
      if (!target) return;
      patch.mutate(
        { id: taskId, patch: { status: target.status } },
        { onSuccess: () => toast.success(`Task moved to ${target.label}`) },
      );
    },
    [patch, toast],
  );

  const { boardRef, dragId, overLane, ghost, onCardPointerDown, consumeJustDragged } =
    useKanbanDrag({ onMove: handleMove });

  // Tapping a card opens it — unless the gesture just ended in a drag.
  const handleActivate = useCallback(
    (task: Task): void => {
      if (consumeJustDragged()) return;
      void navigate(`/tasks/${task.id}`);
    },
    [consumeJustDragged, navigate],
  );

  // Group tasks by lane.
  const laneGroups = useMemo(() => {
    const groups = new Map<LaneId, Task[]>();
    for (const lane of LANES) groups.set(lane.id, []);
    for (const task of tasks) {
      const list = groups.get(STATUS_TO_LANE[task.status]);
      if (list) list.push(task);
    }
    return groups;
  }, [tasks]);

  if (tasks.length === 0) {
    return <EmptyState description="No tasks match your filters" />;
  }

  return (
    <>
      <CreateTaskModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />

      <div ref={boardRef} className="flex gap-3 overflow-x-auto pb-2">
        {LANES.map((lane) => {
          const laneTasks = laneGroups.get(lane.id) ?? [];
          return (
            <div
              key={lane.id}
              data-lane-id={lane.id}
              className={cn(
                'flex w-[78%] max-w-80 shrink-0 flex-col rounded-lg p-2 transition-all sm:w-80',
                lane.tint,
                overLane === lane.id && 'ring-2 ring-primary/40',
              )}
            >
              {/* Lane header */}
              <div className="mb-2 flex items-center gap-2 px-1 py-1">
                <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', lane.dot)} aria-hidden />
                <span className="text-sm font-semibold text-gray-900">{lane.label}</span>
                <span className="tabular-nums text-xs text-gray-500">{laneTasks.length}</span>
                <span className="ml-auto">
                  <button
                    type="button"
                    aria-label={`Add task to ${lane.label}`}
                    onClick={() => setCreateOpen(true)}
                    className="inline-flex h-6 w-6 items-center justify-center rounded text-gray-400 transition-colors hover:bg-white hover:text-gray-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </span>
              </div>

              {/* Lane content */}
              <div className="flex flex-col gap-2">
                {laneTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-1.5 px-2 py-10 text-center">
                    <Inbox className="h-5 w-5 text-gray-400" aria-hidden />
                    <p className="text-xs font-medium text-gray-500">No tasks</p>
                  </div>
                ) : (
                  laneTasks.map((task) => (
                    <TaskBoardCard
                      key={task.id}
                      task={task}
                      lane={lane.id}
                      dragging={dragId === task.id}
                      onPointerDown={onCardPointerDown}
                      onActivate={handleActivate}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Drag ghost — a compact preview that follows the pointer. */}
      {ghost &&
        createPortal(
          <div
            aria-hidden
            // eslint-disable-next-line no-restricted-syntax -- ghost follows the pointer; position/size are inherently dynamic
            style={{ left: ghost.x, top: ghost.y, width: ghost.width }}
            className="pointer-events-none fixed z-[60] -translate-x-1/2 -translate-y-1/2 rotate-2 rounded-lg border border-gray-200 bg-white p-3 opacity-95 shadow-xl"
          >
            <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-900">{ghost.task.title}</p>
            <div className="mt-2">
              <PriorityChip priority={ghost.task.priority} />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
