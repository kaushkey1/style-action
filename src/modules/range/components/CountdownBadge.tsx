import { cn } from '@/lib/utils';

interface CountdownBadgeProps {
  daysRemaining: number;
  deadline: string;
  className?: string;
}

export function CountdownBadge({ daysRemaining, deadline, className }: CountdownBadgeProps) {
  // Determine badge styling based on days remaining
  const getBadgeStyles = () => {
    if (daysRemaining > 14) {
      return {
        bg: 'bg-indigo-50',
        text: 'text-primary-700',
        border: 'border-indigo-200',
        animate: false
      };
    }
    if (daysRemaining >= 7) {
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        animate: false
      };
    }
    if (daysRemaining >= 1) {
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        animate: true
      };
    }
    if (daysRemaining === 0) {
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        animate: true
      };
    }
    // Overdue
    return {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-300',
      animate: true
    };
  };

  const styles = getBadgeStyles();

  const getLabel = () => {
    if (daysRemaining > 0) {
      return `${daysRemaining}d remaining`;
    }
    if (daysRemaining === 0) {
      return 'Due today';
    }
    return `OVERDUE — ${Math.abs(daysRemaining)} days`;
  };

  return (
    <div className="flex items-center gap-2">
      <div className="text-right">
        <div className="text-xs text-gray-400">N-120 Deadline</div>
        <div className="text-sm font-semibold text-gray-900">{deadline}</div>
      </div>
      <span className={cn(
        "px-3 py-1 rounded-full text-xs font-semibold border",
        styles.bg,
        styles.text,
        styles.border,
        styles.animate && 'animate-pulse',
        className
      )}>
        {getLabel()}
      </span>
    </div>
  );
}