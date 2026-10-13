import { Sheet, Badge, Button, Skeleton } from '@/components/ui';
import { cn, formatNumber, formatDateTime, formatRelativeTime } from '@/lib/utils';
import { RotateCcw, Clock, User } from 'lucide-react';

/** Minimal version shape the panel renders. */
export interface HistoryVersionItem {
  version: number;
  timestamp: string;
  author: string;
  summary: string;
  isCurrent: boolean;
  /** saved against an older engine run — shown but never applied */
  isStale?: boolean;
  /** Category changes vs the previous version (API-computed; v1 diffs vs the run). */
  changes: Array<{ code: string; from: number; to: number }>;
}

interface VersionHistoryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: HistoryVersionItem[];
  /** Header subtitle, e.g. "8048 · RRL Trends Bangalore RMM". */
  storeLabel?: string;
  /** Optional restore handler — Restore buttons are hidden when absent. */
  onRestore?: (versionNum: number) => void;
  isLoading?: boolean;
}

export function VersionHistoryPanel({
  open,
  onOpenChange,
  versions,
  storeLabel,
  onRestore,
  isLoading = false,
}: VersionHistoryPanelProps): React.ReactNode {
  const sorted = [...versions].sort((a, b) => b.version - a.version);

  return (
    <Sheet
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Version History"
      description={storeLabel}
      side="right"
      width="md"
    >
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{versions.length} version{versions.length !== 1 ? 's' : ''} recorded</p>

            {versions.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center">No versions yet. Save a plan to create the first version.</p>
            ) : (
              <div className="relative pl-6">
                {/* timeline rail */}
                <div className="absolute left-[6px] top-3 bottom-3 w-px bg-gray-200" aria-hidden="true" />

                {sorted.map((v) => {
                  const isRestore = v.summary.toLowerCase().startsWith('restored');
                  return (
                    <div key={v.version} className="relative mb-3 last:mb-0">
                      <span
                        className={cn(
                          'absolute -left-6 top-4 w-3 h-3 rounded-full border-2',
                          v.isCurrent ? 'bg-primary border-primary' : 'bg-white border-gray-300',
                        )}
                        aria-hidden="true"
                      />
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex flex-wrap items-center gap-1.5">
                            <Badge variant={isRestore ? 'info' : 'warning'} size="sm">
                              {isRestore ? 'Restored' : 'Space Updated'}
                            </Badge>
                            {v.isStale && (
                              <Badge variant="default" size="sm">
                                Stale — superseded by a newer run
                              </Badge>
                            )}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500" title={formatDateTime(v.timestamp)}>
                            <Clock className="w-3 h-3" />{formatRelativeTime(v.timestamp)}
                          </span>
                        </div>

                        <p className="text-sm font-semibold text-gray-900 mt-2">v{v.version} · {v.summary}</p>
                        <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <User className="w-3 h-3" />{v.author}
                        </p>

                        {v.changes.length > 0 ? (
                          <div className="mt-2 space-y-0.5">
                            {v.changes.map((d) => (
                              <p key={d.code} className="text-xs">
                                <span className="text-gray-600">{d.code}:</span>{' '}
                                <span className="text-red-700 line-through">{formatNumber(d.from)}</span>
                                <span className="text-gray-400 mx-1">→</span>
                                <span className="text-green-700 font-medium">{formatNumber(d.to)}</span>
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-gray-400">No category space changes</p>
                        )}

                        {!v.isCurrent && onRestore && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2"
                            onClick={() => onRestore(v.version)}
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />Restore
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </Sheet>
  );
}
