import { cn } from '@/lib/utils';
import type { PlmSubmissionStatus } from '../data/types/raPlmSubmission';
import { PLM_STATUS_CONFIG } from '../data/types/raPlmSubmission';

interface PlmStatusChipProps {
  status: PlmSubmissionStatus;
  onClick?: () => void;
}

export function PlmStatusChip({ status, onClick }: PlmStatusChipProps): React.ReactNode {
  const config = PLM_STATUS_CONFIG[status];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border',
        config.bg,
        config.text,
        'border-transparent',
        onClick && 'cursor-pointer hover:opacity-80',
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />
      {config.label}
    </button>
  );
}
