import { cn } from '@/lib/utils';
import { STATUS_CONFIG, type Status } from '../data/types/rangeArchitecture';

interface StatusBadgeProps {
  status: Status | (string & {});
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  // Default to "Not Due" if status is not found
  const defaultConfig = STATUS_CONFIG["Not Due"];
  const config = STATUS_CONFIG[status] || defaultConfig;

  // TypeScript guard - config will always be defined because of the fallback
  if (!config) {
    return null;
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
      config.bg,
      config.text,
      className
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {status}
    </span>
  );
}