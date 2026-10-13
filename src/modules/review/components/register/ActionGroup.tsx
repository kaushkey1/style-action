import { useState } from 'react';
import { ClipboardList, RotateCcw } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { CreateTaskModal, type LinkedExceptionContext } from '@/modules/tasks/components/CreateTaskModal';
import { useReviewMutations } from '../../hooks/useReviewMutations';
import { useToast } from '@/hooks/useToast';
import { useIsTouch } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import type { RegisterException } from '../../hooks/useRegisterRows';
import type { EndState } from './registerTokens';
import { END_STATE } from './registerTokens';

// Decision-state badge variant. Indigo/`primary` is reserved for interactive in
// the DS, so "Delegated" uses `purple` (a distinct, non-RAG status), not primary.
const END_STATE_VARIANT: Record<EndState, 'success' | 'error' | 'purple' | 'default'> = {
  open: 'default',
  approved: 'success',
  rejected: 'error',
  delegated: 'purple',
};

interface ActionGroupProps {
  exception: RegisterException;
  endState: EndState;
  onEndStateChange: (state: EndState) => void;
  compact?: boolean;
  actionsOnly?: boolean;
  /** Card-footer mode: fill the available width, md size + 44px hit area. */
  fullWidth?: boolean;
  /** In fullWidth mode, render Create Task as the primary action (detail footer,
      where it is the sole call to action). Defaults to outline (list-card footer). */
  primary?: boolean;
}

export function ActionGroup({
  exception,
  endState,
  onEndStateChange,
  compact = false,
  actionsOnly = false,
  fullWidth = false,
  primary = false,
}: ActionGroupProps): React.ReactNode {
  useReviewMutations();
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const isTouch = useIsTouch();


  const handleUndo = (): void => {
    onEndStateChange('open');
    toast.info('Decision undone', 'Item returned to open state.');
  };

  const handleCreateTask = (): void => {
    setShowCreate(true);
  };

  if (endState !== 'open') {
    return (
      <div className={cn('flex items-center gap-2', fullWidth && 'flex-1')}>
        {!actionsOnly && (
          <Badge
            variant={END_STATE_VARIANT[endState]}
            size="sm"
            dot
          >
            {END_STATE[endState].label}
          </Badge>
        )}
        <button
          type="button"
          onClick={handleUndo}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
        >
          <RotateCcw className="h-3 w-3" /> Undo
        </button>
      </div>
    );
  }

  const linkedContext: LinkedExceptionContext = {
    id: exception.id,
    displayId: exception.code,
    title: exception.title,
    description: exception.aiSummary,
    severity: exception.severity,
    deadlineDays: exception.sla ? parseInt(exception.sla, 10) : null,
    recommendedAction: exception.remediation !== 'NA' ? exception.remediation : null,
  };

  return (
    <>
      <div className={cn('flex items-center gap-2', fullWidth && 'flex-1')}>
        <Button
          variant={fullWidth && primary ? 'primary' : 'outline'}
          size={fullWidth ? 'md' : 'sm'}
          onClick={handleCreateTask}
          aria-label="Create task from this exception"
          className={cn(
            'gap-1.5 whitespace-nowrap',
            fullWidth
              ? 'relative min-h-10 w-full'
              : cn('min-h-8 min-w-11 lg:min-w-0', isTouch && 'relative'),
          )}
        >
          {fullWidth && <span className="absolute inset-x-0 top-1/2 h-11 -translate-y-1/2 lg:hidden" aria-hidden />}
          {/* Touch: keep the button visually 32px (sm) but extend the tap target to 40px. */}
          {!fullWidth && isTouch && (
            <span className="absolute inset-x-0 top-1/2 h-10 -translate-y-1/2" aria-hidden />
          )}
          <ClipboardList className="h-3.5 w-3.5" />
          {(!compact || fullWidth) && 'Create Task'}
        </Button>
      </div>

      <CreateTaskModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        linkedException={linkedContext}
      />
    </>
  );
}
