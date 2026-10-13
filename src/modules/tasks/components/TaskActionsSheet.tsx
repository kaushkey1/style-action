import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, ChevronRight, History, Pencil, Search } from 'lucide-react';
import { Avatar, BottomSheet, Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useTaskMutations } from '../hooks/useTaskMutations';
import { useUsers } from '../hooks/useUsers';
import { LANES, STATUS_TO_LANE, type LaneId } from '../lib/lanes';
import type { Task } from '../types/task.types';
import { EditTaskModal } from './EditTaskModal';
import { TaskHistoryPanel } from './TaskHistoryPanel';

/**
 * Mobile task-actions menu rendered as a BottomSheet (the touch-friendly
 * counterpart to `TaskActionsMenu`'s desktop dropdown). Drills from the action
 * list into Move / Assign sub-views; Edit and History defer to the shared
 * modals. All actions run through the same `patch` mutation.
 */
type SheetView = 'menu' | 'move' | 'assign';

export interface TaskActionsSheetProps {
  task: Task;
  /** Current lane — when omitted, derived from the task status. Hidden in "Move to". */
  currentLane?: LaneId;
  isOpen: boolean;
  onClose: () => void;
  /** View shown when the sheet opens (e.g. 'assign' from the card assign icon). */
  initialView?: SheetView;
  /** Show the "Move to" menu row. Kanban only — Card rows pass false. Default true. */
  showMove?: boolean;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

const ROW = 'flex min-h-12 items-center gap-3 rounded-lg px-2 text-left hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

export function TaskActionsSheet({
  task,
  currentLane,
  isOpen,
  onClose,
  initialView = 'menu',
  showMove = true,
}: TaskActionsSheetProps): React.JSX.Element {
  const toast = useToast();
  const userEmail = useAuthStore((s) => s.user?.email ?? '');
  const { patch } = useTaskMutations();
  const [view, setView] = useState<SheetView>(initialView);
  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 200);

  const lane = currentLane ?? STATUS_TO_LANE[task.status];

  const { data: users = [], isFetching } = useUsers({
    search: debouncedQuery,
    enabled: isOpen && view === 'assign',
  });

  // Reset to the requested view + clear search each time the sheet (re)opens.
  // Render-time state adjustment (not an effect) per React's "you might not need
  // an effect" guidance for resetting state when a prop changes.
  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setView(initialView);
      setQuery('');
    }
  }

  const handleMove = (targetLane: LaneId): void => {
    const target = LANES.find((l) => l.id === targetLane);
    if (target && target.id !== lane) {
      patch.mutate(
        { id: task.id, patch: { status: target.status } },
        { onSuccess: () => toast.success(`Task moved to ${target.label}`) },
      );
    }
    onClose();
  };

  const handleAssign = (email: string): void => {
    patch.mutate(
      { id: task.id, patch: { assigned_to: email || userEmail } },
      { onSuccess: () => toast.success(email ? `Assigned to ${email}` : 'Unassigned') },
    );
    onClose();
  };

  const openEdit = (): void => {
    onClose();
    setEditOpen(true);
  };
  const openHistory = (): void => {
    onClose();
    setHistoryOpen(true);
  };

  const visibleUsers = useMemo(() => {
    const unassigned = { id: -1, email: '', name: 'Unassigned', initials: '—', username: null, active: true };
    return [unassigned, ...users];
  }, [users]);

  const title = view === 'menu' ? 'Task actions' : view === 'move' ? 'Move to' : 'Assign to';

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        showClose
        onBack={view === 'menu' ? undefined : () => setView('menu')}
        header={
          view === 'assign' ? (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or email…"
                className="pl-8"
                aria-label="Search people"
              />
            </div>
          ) : undefined
        }
      >
        {view === 'menu' && (
          <div className="flex flex-col">
            <button type="button" onClick={openEdit} className={cn(ROW, 'text-sm font-medium text-gray-900')}>
              <Pencil className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
              <span className="flex-1">Edit</span>
            </button>
            <button type="button" onClick={openHistory} className={cn(ROW, 'text-sm font-medium text-gray-900')}>
              <History className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
              <span className="flex-1">History</span>
            </button>
            {showMove && (
              <button type="button" onClick={() => setView('move')} className={cn(ROW, 'text-sm font-medium text-gray-900')}>
                <ArrowLeftRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                <span className="flex-1">Move to</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
              </button>
            )}
          </div>
        )}

        {view === 'move' && (
          <div className="flex flex-col">
            {LANES.filter((l) => l.id !== lane).map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => handleMove(l.id)}
                className={cn(ROW, 'text-sm text-gray-900')}
              >
                <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', l.dot)} aria-hidden />
                {l.label}
              </button>
            ))}
          </div>
        )}

        {view === 'assign' && (
          <div className="flex flex-col">
            {isFetching && query.trim() !== '' ? (
              <p className="px-2 py-4 text-center text-sm text-gray-400">Searching…</p>
            ) : visibleUsers.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-gray-400">No match</p>
            ) : (
              visibleUsers.map((u) => (
                <button
                  key={u.email || 'unassigned'}
                  type="button"
                  onClick={() => handleAssign(u.email)}
                  className={cn(ROW)}
                >
                  <Avatar name={u.name} size="sm" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-gray-900">{u.name}</span>
                    {u.email && <span className="truncate text-xs text-gray-400">{u.email}</span>}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </BottomSheet>

      <EditTaskModal task={task} isOpen={editOpen} onClose={() => setEditOpen(false)} />
      <TaskHistoryPanel task={task} isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  );
}
