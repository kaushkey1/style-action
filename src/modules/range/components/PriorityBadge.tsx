import { cn } from '@/lib/utils';
import { PRIORITY_CONFIG, type Priority } from '../data/types/rangeArchitecture';

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];

  return (
    <span className={cn(
      "px-2.5 py-0.5 rounded-full text-xs font-semibold border",
      config.bg,
      config.text,
      config.border,
      className
    )}>
      {priority}
    </span>
  );
}