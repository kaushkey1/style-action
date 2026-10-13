import { useState } from 'react';
import { ArrowLeftRight, History, MoreVertical, Pencil } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useTaskMutations } from '../hooks/useTaskMutations';
import { LANES, STATUS_TO_LANE, type LaneId } from '../lib/lanes';
import type { Task } from '../types/task.types';
import { EditTaskModal } from './EditTaskModal';
import { TaskHistoryPanel } from './TaskHistoryPanel';
import { TaskActionsSheet } from './TaskActionsSheet';

/**
 * Shared task-options kebab for the Kanban board + table view:
 * Edit · History · Move to ›. Assignment is deliberately NOT here — it lives in
 * the Edit form and the card's quick-assign icon (one UI per action). On mobile
 * the same actions open in a `TaskActionsSheet` (BottomSheet); on desktop, the
 * Radix dropdown below. Lane config comes from `../lib/lanes`.
 */
export type { LaneId };

export interface TaskActionsMenuProps {
  task: Task;
  /** Current lane — when omitted, derived from the task status. Hidden in "Move to". */
  currentLane?: LaneId;
  /** Radix content alignment relative to the trigger. */
  align?: 'start' | 'center' | 'end';
  /** Override the kebab trigger classes (defaults to the board-card kebab styling). */
  triggerClassName?: string;
  /** Show the "Move to" action. Kanban/Table only — Card rows pass false. Default true. */
  showMove?: boolean;
}

const KEBAB_CLASS =
  'inline-flex h-7 w-7 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 data-[state=open]:bg-gray-100';

export function TaskActionsMenu(props: TaskActionsMenuProps): React.JSX.Element {
  const isMobile = useIsMobile();
  return isMobile ? <MobileActions {...props} /> : <DesktopActions {...props} />;
}

/** Mobile: kebab opens the BottomSheet actions menu. */
function MobileActions({ task, currentLane, triggerClassName, showMove = true }: TaskActionsMenuProps): React.JSX.Element {
  const [sheetOpen, setSheetOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="Task options"
        onClick={(e) => {
          e.stopPropagation();
          setSheetOpen(true);
        }}
        className={cn(KEBAB_CLASS, triggerClassName)}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      <TaskActionsSheet
        task={task}
        currentLane={currentLane}
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        showMove={showMove}
      />
    </>
  );
}

/** Desktop: Radix dropdown with a nested Move submenu. */
function DesktopActions({
  task,
  currentLane,
  align = 'end',
  triggerClassName,
  showMove = true,
}: TaskActionsMenuProps): React.JSX.Element {
  const toast = useToast();
  const { patch } = useTaskMutations();
  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const lane = currentLane ?? STATUS_TO_LANE[task.status];

  const handleMove = (targetLane: LaneId): void => {
    const target = LANES.find((l) => l.id === targetLane);
    if (!target || target.id === lane) return;
    patch.mutate(
      { id: task.id, patch: { status: target.status } },
      { onSuccess: () => toast.success(`Task moved to ${target.label}`) },
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Task options"
            onClick={(e) => e.stopPropagation()}
            className={cn(KEBAB_CLASS, triggerClassName)}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align}>
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4 text-gray-400" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setHistoryOpen(true)}>
            <History className="h-4 w-4 text-gray-400" /> History
          </DropdownMenuItem>
          {showMove && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ArrowLeftRight className="h-4 w-4 text-gray-400" /> Move to
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {LANES.filter((l) => l.id !== lane).map((l) => (
                    <DropdownMenuItem key={l.id} onSelect={() => handleMove(l.id)}>
                      <span className={cn('h-2 w-2 shrink-0 rounded-full', l.dot)} aria-hidden />
                      {l.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditTaskModal task={task} isOpen={editOpen} onClose={() => setEditOpen(false)} />
      <TaskHistoryPanel task={task} isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  );
}
