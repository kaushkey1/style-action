import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  description: string;
  title?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  className?: string;
  variant?: 'neutral' | 'positive';
  action?: ReactNode;
}

export function EmptyState({ description, title, icon: Icon, iconClassName, className, variant = 'neutral', action }: EmptyStateProps) {
  const isPositive = variant === 'positive';

  return (
    <div className={cn('p-8 text-center', className)}>
      {Icon && <Icon className={cn('w-8 h-8 mx-auto mb-2', iconClassName || (isPositive ? 'text-success' : 'text-gray-400'))} />}
      {title && <p className="text-sm font-medium text-gray-900">{title}</p>}
      <p className={cn('text-xs', isPositive ? 'text-success-600' : 'text-gray-500')}>{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
