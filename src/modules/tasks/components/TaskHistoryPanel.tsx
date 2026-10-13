import { useMemo } from 'react';
import { Activity as ActivityIcon } from 'lucide-react';
import { BottomSheet, EmptyState, Sheet, Spinner } from '@/components/ui';
import { formatRelativeTime } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useTaskActivities } from '../hooks/useTaskComments';
import type { Task } from '../types/task.types';

export interface TaskHistoryPanelProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Read-only activity-log panel opened from the "History" kebab action.
 * Desktop → a right-side slide-over (Sheet); mobile → a BottomSheet, matching the
 * app's action-sheet convention. Body = the task's activity timeline (newest
 * first). Activities are only fetched while the panel is open.
 */
export function TaskHistoryPanel({ task, isOpen, onClose }: TaskHistoryPanelProps): React.JSX.Element {
  const isMobile = useIsMobile();
  const { data: activities = [], isLoading } = useTaskActivities(isOpen ? task.id : undefined);

  const ordered = useMemo(
    () => [...activities].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [activities],
  );

  const body = (
    <>
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">Activity log</h3>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : ordered.length === 0 ? (
        <EmptyState description="No activity yet." />
      ) : (
        <ol className="space-y-3">
          {ordered.map((a) => (
            <li key={a.id} className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100">
                <ActivityIcon className="h-3 w-3 text-gray-500" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-gray-700">{a.actor}</span> {a.event}
                <span className="text-gray-400 tabular-nums"> · {formatRelativeTime(a.created_at)}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </>
  );

  if (isMobile) {
    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} title={task.title} showClose>
        {body}
      </BottomSheet>
    );
  }

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title={task.title} side="right" width="md">
      <div className="p-4">{body}</div>
    </Sheet>
  );
}
