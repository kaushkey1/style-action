import { useState } from 'react';
import { MoreVertical, Pencil, UserCog, Pause, X, History, type LucideIcon } from 'lucide-react';
import { BottomSheet } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Task } from '../types/task.types';
import { canUserDo, type TaskAction } from '../lib/permissions';
import { TaskHistoryPanel } from './TaskHistoryPanel';

interface SecondaryAction {
  action: TaskAction;
  label: string;
  Icon: LucideIcon;
  destructive?: boolean;
}

// Secondary actions for the detail (the primary workflow transitions live in the
// sticky bottom bar). Role-gated via canUserDo; History is always available.
const SECONDARY: SecondaryAction[] = [
  { action: 'edit', label: 'Edit', Icon: Pencil },
  { action: 'reassign', label: 'Reassign', Icon: UserCog },
  { action: 'mark_blocked', label: 'Mark blocked', Icon: Pause },
  { action: 'cancel', label: 'Cancel task', Icon: X, destructive: true },
];

const ROW = 'flex min-h-12 w-full items-center gap-3 rounded-lg px-2 text-left hover:bg-gray-50';

/**
 * Mobile task-detail header kebab. Opens a BottomSheet of role-gated secondary
 * actions (Edit · Reassign · Mark blocked · Cancel) + History. Edit/Reassign/etc.
 * route through the page's `onAction` (→ the existing modals); History opens the
 * activity panel directly.
 */
export function MobileDetailKebab({
  task,
  userEmail,
  onAction,
}: {
  task: Task;
  userEmail: string;
  onAction: (action: TaskAction) => void;
}): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const available = SECONDARY.filter((s) => canUserDo(s.action, task, userEmail));

  return (
    <>
      <button
        type="button"
        aria-label="Task actions"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      <BottomSheet isOpen={open} onClose={() => setOpen(false)} title="Task actions" showClose>
        <div className="flex flex-col">
          {available.map(({ action, label, Icon, destructive }) => (
            <button
              key={action}
              type="button"
              onClick={() => {
                setOpen(false);
                onAction(action);
              }}
              className={cn(ROW, 'text-sm font-medium', destructive ? 'text-error' : 'text-gray-900')}
            >
              <Icon className={cn('h-4 w-4 shrink-0', destructive ? 'text-error' : 'text-gray-400')} aria-hidden />
              <span className="flex-1">{label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setHistoryOpen(true);
            }}
            className={cn(ROW, 'text-sm font-medium text-gray-900')}
          >
            <History className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
            <span className="flex-1">History</span>
          </button>
        </div>
      </BottomSheet>

      <TaskHistoryPanel task={task} isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  );
}
