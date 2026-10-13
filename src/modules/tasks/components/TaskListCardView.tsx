import { EmptyState } from '@/components/ui';
import type { Task, TaskListTab } from '../types/task.types';
import { TaskRowCard } from './TaskRowCard';

export interface TaskListCardViewProps {
  tasks: Task[];
  tab: TaskListTab;
}

/** Flat, ungrouped task list (matches the lab). Ordering comes from the query. */
export function TaskListCardView({ tasks }: TaskListCardViewProps): React.JSX.Element {
  if (tasks.length === 0) {
    return <EmptyState description="No tasks match your filters" />;
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskRowCard key={task.id} task={task} />
      ))}
    </div>
  );
}
