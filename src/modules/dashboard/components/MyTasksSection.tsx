import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Link as LinkIcon, CheckCircle2, Inbox } from 'lucide-react';
import { Badge, Button, Skeleton } from '@/components/ui';
import { useAuthStore } from '@/hooks/useAuthStore';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useTasksList } from '@/modules/tasks/hooks/useTasksList';
import { DEFAULT_TASK_FILTERS, type Task } from '@/modules/tasks/types/task.types';

/**
 * "My Tasks" section for Console Home. Shows the top 3 critical tasks assigned
 * to the current user. Renders empty / completed states when there's no work.
 *
 * State determination:
 *   - active:    >=1 task with status in [open, in_progress, blocked, reopened] and priority=Critical
 *   - completed: no active critical tasks AND >=1 critical task closed (done) today
 *   - empty:     no active critical tasks AND nothing closed today
 *
 * Matches the 3-per-row rhythm of Modules + Resources sections below.
 */

const ACTIVE_STATUSES: ReadonlySet<Task['status']> = new Set([
  'open',
  'in_progress',
  'blocked',
  'reopened',
]);

function startOfTodayIso(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function MyTasksSection(): React.JSX.Element {
  const navigate = useNavigate();
  const userEmail = useAuthStore((s) => s.user?.email ?? '');

  const { data: tasks = [], isLoading } = useTasksList({
    tab: 'assigned-to-me',
    filters: { ...DEFAULT_TASK_FILTERS, priority: 'Critical' },
    userEmail,
  });

  const { activeTop3, closedToday } = useMemo(() => {
    const todayStart = startOfTodayIso();
    const active = tasks.filter((t) => ACTIVE_STATUSES.has(t.status));
    const done = tasks.filter(
      (t) => t.status === 'done' && new Date(t.updated_at).getTime() >= todayStart,
    );
    return { activeTop3: active.slice(0, 3), closedToday: done.length };
  }, [tasks]);

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">My Tasks</h2>
        <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')}>
          See All
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>

      {isLoading ? (
        <SkeletonGrid />
      ) : activeTop3.length > 0 ? (
        <TasksGrid tasks={activeTop3} />
      ) : closedToday > 0 ? (
        <CompletedState closedToday={closedToday} />
      ) : (
        <EmptyState />
      )}
    </section>
  );
}

// ─── Active state — top 3 critical tasks ──────────────────────────────────

function TasksGrid({ tasks }: { tasks: Task[] }) {
  return (
    // 3-track grid is preserved at every count: 1 or 2 tasks occupy their
    // natural 1/3 width on desktop and leave the remaining tracks empty,
    // rather than stretching to fill the row.
    // eslint-disable-next-line design-system/prefer-metric-grid -- task nav grid, not metrics
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const navigate = useNavigate();
  const dueLabel = task.due_date
    ? `Due ${formatRelativeTime(task.due_date)}`
    : 'No deadline';
  const assignorName = task.assignor.split('@')[0] ?? task.assignor;
  return (
    <button
      onClick={() => navigate(`/tasks/${task.id}`)}
      className={cn(
        'text-left rounded-lg border border-gray-200 bg-white p-4',
        'hover:border-primary/30 hover:shadow-md transition-all duration-200',
        'focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2',
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="error" size="sm">CRITICAL</Badge>
        {task.exception_id && (
          <span className="inline-flex items-center gap-1 text-xs text-amber-700">
            <LinkIcon className="w-3 h-3" />
            Exception
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{task.title}</p>
      <p className="text-xs text-gray-500">
        {dueLabel} · from {assignorName}
      </p>
    </button>
  );
}

// ─── Empty state — no critical tasks ──────────────────────────────────────

function EmptyState() {
  const navigate = useNavigate();
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
          <Inbox className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">No critical tasks right now</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Anything that gets flagged for you will show up here.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/tasks')}
          className="shrink-0 hidden sm:inline-flex"
        >
          View all tasks
        </Button>
      </div>
    </div>
  );
}

// ─── Completed state — closed all critical work today ─────────────────────

function CompletedState({ closedToday }: { closedToday: number }) {
  const navigate = useNavigate();
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-green-50 text-green-700 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">All caught up</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {closedToday} critical {closedToday === 1 ? 'task' : 'tasks'} closed today.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/tasks')}
          className="shrink-0 hidden sm:inline-flex"
        >
          View history
        </Button>
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    // eslint-disable-next-line design-system/prefer-metric-grid -- skeleton mirrors task grid
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-[104px] w-full rounded-lg" />
      ))}
    </div>
  );
}
