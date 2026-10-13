import React from 'react';
import { Clock, User } from 'lucide-react';
import { Badge, EmptyState, Sheet, Spinner } from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';
import {
  useChannelEditLog,
  useCategoryEditLog,
  type OtbEditLogItem,
} from '../api/otbDashboardApi';

type StatusBadgeVariant = 'success' | 'error' | 'warning' | 'default';

export type EditLogScope =
  | { type: 'channel'; format: string; label: string }
  | { type: 'category'; classCode: string; brick: string; label: string };

interface EditLogHistorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  scope: EditLogScope | null;
}

function statusVariant(status: string): StatusBadgeVariant {
  const s = status.toUpperCase();
  if (s === 'APPROVED') return 'success';
  if (s === 'REJECTED') return 'error';
  if (s.startsWith('PENDING')) return 'warning';
  return 'default';
}

function statusLabel(status: string): string {
  if (status.toUpperCase() === 'RECORDED') return 'KPI Value Updated';
  return status
    .toLowerCase()
    .split('_')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function EditLogTimeline({ entries }: { entries: OtbEditLogItem[] }): React.ReactNode {
  if (entries.length === 0) {
    return (
      <div className="px-5 py-8">
        <EmptyState description="No Purchase Value edits recorded yet" />
      </div>
    );
  }

  return (
    <div className="px-5 py-4">
      <p className="text-xs text-gray-500 mb-4">
        {entries.length} change{entries.length !== 1 ? 's' : ''} recorded
      </p>
      <div className="relative">
        <div className="absolute left-3 top-3 bottom-3 w-px bg-gray-200" />
        <div className="space-y-4">
          {entries.map((entry, idx) => {
            const date = entry.timestamp ? new Date(entry.timestamp) : null;
            const formattedDate = date
              ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : '-';
            const formattedTime = date
              ? date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <div key={entry.change_id} className="relative pl-8">
                <div
                  className={cn(
                    'absolute left-1.5 top-2.5 w-3 h-3 rounded-full border-2',
                    idx === 0 ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300',
                  )}
                />

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant={statusVariant(entry.status)} size="md">
                      {statusLabel(entry.status)}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap">
                      <Clock className="w-3 h-3" />
                      <span>
                        {formattedDate}
                        {formattedTime ? `, ${formattedTime}` : ''}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-1">Purchase Value</p>

                  <div className="flex items-center text-xs gap-1.5 mb-2">
                    <span className="text-red-500 line-through">
                      {formatCurrency(entry.old_value, { decimals: 2 })}
                    </span>
                    <span className="text-gray-400">&rarr;</span>
                    <span className="text-green-600 font-medium">
                      {formatCurrency(entry.new_value, { decimals: 2 })}
                    </span>
                    {entry.variance_pct !== null && (
                      <span
                        className={cn(
                          'font-medium',
                          entry.variance_pct >= 0 ? 'text-green-600' : 'text-red-500',
                        )}
                      >
                        ({entry.variance_pct >= 0 ? '+' : ''}
                        {entry.variance_pct}%)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <User className="w-3 h-3" />
                    <span>{entry.actor_name ?? 'system'}</span>
                  </div>

                  {entry.comments && (
                    <p className="text-xs text-gray-500 mt-1.5 italic">{entry.comments}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function EditLogHistorySheet({
  isOpen,
  onClose,
  scope,
}: EditLogHistorySheetProps): React.ReactNode {
  const channelQuery = useChannelEditLog(
    scope?.type === 'channel' ? scope.format : null,
    isOpen,
  );
  const categoryQuery = useCategoryEditLog(
    scope?.type === 'category' ? scope.classCode : null,
    scope?.type === 'category' ? scope.brick : null,
    isOpen,
  );

  const active = scope?.type === 'category' ? categoryQuery : channelQuery;
  const entries = active.data ?? [];

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Log History"
      description={scope?.label}
      width="md"
    >
      {active.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : active.isError ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-red-500">Failed to load edit log</p>
        </div>
      ) : (
        <EditLogTimeline entries={entries} />
      )}
    </Sheet>
  );
}
