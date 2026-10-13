import { cn, MOCK_NOW } from '@/lib/utils';
import { Clock, AlertTriangle } from 'lucide-react';

interface ApprovalCountdownProps {
  slaDeadline: string;    // ISO timestamp
  escalateTo: string;     // Role to escalate to
  status: 'pending' | 'approved' | 'rejected' | 'escalated' | 'auto-approved';
  className?: string;
}

export function ApprovalCountdown({ slaDeadline, escalateTo, status, className }: ApprovalCountdownProps) {
  // If status is escalated, show resolved state
  if (status === 'escalated') {
    return (
      <div className={cn('flex items-center gap-2 px-3 py-2 bg-error-50 rounded-lg border border-error/20', className)}>
        <AlertTriangle className="w-4 h-4 text-error" />
        <span className="text-xs font-medium text-error">ESCALATED to {escalateTo}</span>
      </div>
    );
  }

  // No countdown needed for resolved statuses
  if (status === 'approved' || status === 'auto-approved' || status === 'rejected') {
    return null;
  }

  const now = MOCK_NOW;
  const deadline = new Date(slaDeadline);
  const remainingMs = deadline.getTime() - now.getTime();

  const hours = Math.floor(Math.max(0, remainingMs) / (1000 * 60 * 60));
  const minutes = Math.floor(Math.max(0, (remainingMs % (1000 * 60 * 60))) / (1000 * 60));

  // Urgency color based on remaining time (percentage of a 24h window)
  const pctRemaining = remainingMs > 0 ? Math.min(100, (remainingMs / (24 * 60 * 60 * 1000)) * 100) : 0;
  const urgencyColor = pctRemaining > 50 ? 'text-success' : pctRemaining > 25 ? 'text-warning' : 'text-error';
  const barColor = pctRemaining > 50 ? 'bg-success' : pctRemaining > 25 ? 'bg-warning' : 'bg-error';

  // SLA expired
  if (remainingMs <= 0) {
    return (
      <div className={cn('flex items-center gap-2 px-3 py-2 bg-error-50 rounded-lg border border-error/20', className)}>
        <AlertTriangle className="w-4 h-4 text-error" />
        <span className="text-xs font-medium text-error">SLA EXPIRED — Escalating to {escalateTo}</span>
      </div>
    );
  }

  return (
    <div className={cn('px-3 py-2 bg-gray-50 rounded-lg border border-gray-200', className)}>
      {/* eslint-disable-next-line design-system/prefer-section-header -- countdown timer display, not a section header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-gray-400" />
          <span className={cn('text-xs font-semibold', urgencyColor)}>
            {hours}h {minutes}m remaining
          </span>
        </div>
        <span className="text-[10px] text-gray-500">&rarr; {escalateTo}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        { }
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          // eslint-disable-next-line no-restricted-syntax -- dynamic width
          style={{ width: `${Math.max(2, pctRemaining)}%` }}
        />
      </div>
    </div>
  );
}
