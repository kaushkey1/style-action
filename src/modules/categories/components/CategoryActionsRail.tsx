import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { Card, SectionHeader, Skeleton } from '@/components/ui';
import { PriorityChip } from '@/modules/tasks/components/PriorityChip';
import type { Task } from '@/modules/tasks/types/task.types';

interface CategoryActionsRailProps {
  topTasks: Task[] | undefined;
  categoryCode: string | undefined;
  isLoading: boolean;
}

export function CategoryActionsRail({
  topTasks,
  categoryCode,
  isLoading,
}: CategoryActionsRailProps): React.ReactNode {
  const navigate = useNavigate();

  const handleViewAll = (): void => {
    const scope = categoryCode ? `category:${categoryCode}` : undefined;
    const qs = scope ? `?scope=${encodeURIComponent(scope)}` : '';
    navigate(`/tasks${qs}`);
  };

  const hasTasks = !isLoading && !!topTasks?.length;

  return (
    <div>
      <SectionHeader
        title="This category's actions"
        inlineActions
        actions={
          hasTasks ? (
            <button
              type="button"
              onClick={handleViewAll}
              className="relative inline-flex min-h-8 items-center gap-1 rounded px-1 text-xs font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary"
            >
              {/* 32px control, 44px tap target. */}
              <span className="absolute inset-x-0 top-1/2 h-11 -translate-y-1/2" aria-hidden />
              View all tasks <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : undefined
        }
      />

      {isLoading ? (
        <Card className="p-4">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ))}
          </div>
        </Card>
      ) : !topTasks?.length ? (
        <Card className="p-4">
          <p className="text-sm text-gray-400">No actions available</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {topTasks.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  aria-label={`Open task: ${task.title}`}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                >
                  <PriorityChip priority={task.priority} />
                  <span className="min-w-0 flex-1 text-sm leading-snug text-gray-700 line-clamp-2">
                    {task.title}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
