import {
  Send,
  Pause,
  CheckCircle,
  RotateCcw,
  Pencil,
  UserCog,
  X,
  Undo2,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui';
import type { Task } from '../types/task.types';
import { canUserDo, type TaskAction } from '../lib/permissions';

interface ActionsListProps {
  task: Task;
  userEmail: string;
  onAction?: (action: TaskAction) => void;
}

interface ActionMeta {
  action: TaskAction;
  label: string;
  Icon: LucideIcon;
  variant?: 'primary' | 'destructive' | 'ghost';
}

const ALL_ACTIONS: ActionMeta[] = [
  { action: 'submit_for_review', label: 'Submit for review', Icon: Send },
  { action: 'mark_blocked',      label: 'Mark blocked',       Icon: Pause },
  { action: 'approve_close',     label: 'Approve & close',    Icon: CheckCircle },
  { action: 'request_changes',   label: 'Request changes',    Icon: RotateCcw, variant: 'ghost' },
  { action: 'edit',              label: 'Edit',               Icon: Pencil, variant: 'ghost' },
  { action: 'reassign',          label: 'Reassign',           Icon: UserCog, variant: 'ghost' },
  { action: 'reopen',            label: 'Reopen',             Icon: Undo2, variant: 'ghost' },
  { action: 'restore',           label: 'Restore',            Icon: Undo2, variant: 'ghost' },
  { action: 'cancel',            label: 'Cancel task',        Icon: X, variant: 'destructive' },
];

/**
 * Mirror of the row kebab — shown in the right rail on desktop.
 * Buttons render only if `canUserDo()` returns true for the current role + status.
 *
 * The primary CTA already lives in the header (DetailActionBar), so this rail is
 * a calm, uniform menu: standard actions as quiet ghost rows, the destructive
 * action separated by a divider and color-coded (no loud filled-red bar).
 */
export function ActionsList({ task, userEmail, onAction }: ActionsListProps): React.JSX.Element | null {
  const available = ALL_ACTIONS.filter((meta) => canUserDo(meta.action, task, userEmail));
  if (available.length === 0) return null;

  const standard = available.filter((meta) => meta.variant !== 'destructive');
  const destructive = available.filter((meta) => meta.variant === 'destructive');

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Actions</p>
      <div className="flex flex-col gap-0.5">
        {standard.map(({ action, label, Icon }) => (
          <Button
            key={action}
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => onAction?.(action)}
          >
            <Icon className="w-3.5 h-3.5 text-gray-400" aria-hidden />
            {label}
          </Button>
        ))}

        {destructive.length > 0 && (
          <>
            <div className="my-1 border-t border-gray-100" aria-hidden />
            {destructive.map(({ action, label, Icon }) => (
              <Button
                key={action}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-error hover:bg-error/5 hover:text-error focus-kb:ring-error/20"
                onClick={() => onAction?.(action)}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden />
                {label}
              </Button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
