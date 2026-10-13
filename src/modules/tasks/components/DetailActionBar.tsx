import { Send, CheckCircle, RotateCcw, Undo2, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Task } from '../types/task.types';
import { canUserDo, type TaskAction } from '../lib/permissions';

interface DetailActionBarProps {
  task: Task;
  userEmail: string;
  onAction?: (action: TaskAction) => void;
  /**
   * `header` (default) — inline `sm` buttons for the desktop detail header.
   * `sticky` — full-width `lg` buttons in a grid, for the mobile bottom bar.
   */
  variant?: 'header' | 'sticky';
}

interface ActionButton {
  key: string;
  label: string;
  Icon: LucideIcon;
  action: TaskAction;
  /** Button variant — undefined = primary. */
  buttonVariant?: 'outline';
}

/**
 * Primary role×status transitions for the task detail. The full action set lives
 * in ActionsList (right rail) + the kebab menu. RTL ordering per ux-patterns.md
 * §18 — primary CTA is rightmost.
 */
export function DetailActionBar({
  task,
  userEmail,
  onAction,
  variant = 'header',
}: DetailActionBarProps): React.JSX.Element | null {
  const buttons: ActionButton[] = [];

  // Assignee: submit for review.
  if (canUserDo('submit_for_review', task, userEmail)) {
    buttons.push({ key: 'submit', label: 'Submit for review', Icon: Send, action: 'submit_for_review' });
  }
  // Assignor reviewing: request changes (secondary) + approve (primary).
  if (canUserDo('request_changes', task, userEmail)) {
    buttons.push({ key: 'request', label: 'Request changes', Icon: RotateCcw, action: 'request_changes', buttonVariant: 'outline' });
  }
  if (canUserDo('approve_close', task, userEmail)) {
    buttons.push({ key: 'approve', label: 'Approve & close', Icon: CheckCircle, action: 'approve_close' });
  }
  // Closed-state recoveries.
  if (canUserDo('reopen', task, userEmail)) {
    buttons.push({ key: 'reopen', label: 'Reopen', Icon: Undo2, action: 'reopen' });
  }
  if (canUserDo('restore', task, userEmail)) {
    buttons.push({ key: 'restore', label: 'Restore', Icon: Undo2, action: 'restore' });
  }

  if (buttons.length === 0) return null;

  if (variant === 'sticky') {
    return (
      <div className={cn('grid gap-2', buttons.length === 2 ? 'grid-cols-2' : 'grid-cols-1')}>
        {buttons.map(({ key, label, Icon, action, buttonVariant }) => (
          <Button key={key} variant={buttonVariant} size="lg" className="w-full" onClick={() => onAction?.(action)}>
            <Icon className="w-4 h-4" />
            {label}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {buttons.map(({ key, label, Icon, action, buttonVariant }) => (
        <Button key={key} variant={buttonVariant} size="sm" onClick={() => onAction?.(action)}>
          <Icon className="w-3.5 h-3.5" />
          {label}
        </Button>
      ))}
    </div>
  );
}
