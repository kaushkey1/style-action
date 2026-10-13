/* eslint-disable design-system/prefer-section-header -- PLM drawer uses custom inline section labels */
import { useState, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';
import { Sheet, Badge, Button, Pagination } from '@/components/ui';
import type { PlmSubmissionSummary, PlmSubmissionItem } from '../data/types/raPlmSubmission';
import type { ValidationSummary } from '../data/types/raValidation';

interface PlmSubmissionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  submission: PlmSubmissionSummary;
  items: PlmSubmissionItem[];
  validationSummary: ValidationSummary;
  onRetry: () => void;
  isRetrying: boolean;
  planLabel: string;
  itemsLoading?: boolean;
  itemsError?: boolean;
  itemPage: number;
  onItemPageChange: (page: number) => void;
}

const ITEM_STATUS_CONFIG = {
  submitted: { icon: CheckCircle, iconClass: 'text-blue-500', label: 'Submitted to PLM', badgeVariant: 'info' as const },
  accepted: { icon: CheckCircle, iconClass: 'text-emerald-500', label: 'Accepted', badgeVariant: 'success' as const },
  failed: { icon: XCircle, iconClass: 'text-red-500', label: 'Failed', badgeVariant: 'destructive' as const },
  processing: { icon: Clock, iconClass: 'text-blue-500', label: 'Processing', badgeVariant: 'info' as const },
  unresolved: { icon: Clock, iconClass: 'text-gray-400', label: 'Needs review', badgeVariant: 'secondary' as const },
  skipped: { icon: Clock, iconClass: 'text-gray-400', label: 'Skipped', badgeVariant: 'secondary' as const },
} as const;

export function PlmSubmissionDrawer({
  isOpen,
  onClose,
  submission,
  items,
  validationSummary,
  onRetry,
  isRetrying,
  planLabel,
  itemsLoading,
  itemsError,
  itemPage,
  onItemPageChange,
}: PlmSubmissionDrawerProps): React.ReactNode {
  const [retryClicked, setRetryClicked] = useState(false);

  const eligibleItems = items.filter(i => i.retryEligible);

  const handleRetry = useCallback(() => {
    if (isRetrying || retryClicked) return;
    setRetryClicked(true);
    onRetry();
    setTimeout(() => setRetryClicked(false), 2000);
  }, [isRetrying, retryClicked, onRetry]);

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="PLM Submission"
      description={planLabel}
      width="xl"
    >
      <div className="flex flex-col h-full overflow-auto">
        {/* Summary */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500">
              Batch: <span className="font-medium text-gray-700">{submission.batchRef ?? '-'}</span>
            </p>
            {submission.latestAttemptAt && (
              <p className="text-xs text-gray-400">
                {formatDateTime(new Date(submission.latestAttemptAt))}
              </p>
            )}
          </div>

          {/* eslint-disable-next-line design-system/prefer-metric-grid -- custom 3-stat inline summary for PLM drawer */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-emerald-700">{submission.accepted}</p>
              <p className="text-[10px] text-emerald-600">Accepted</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-red-700">{submission.failed}</p>
              <p className="text-[10px] text-red-600">Failed</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-gray-700">{submission.totalItems}</p>
              <p className="text-[10px] text-gray-500">Total</p>
            </div>
          </div>
        </div>

        {/* Readiness */}
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-[10px] uppercase text-gray-400 font-medium mb-2">Validation Readiness</p>
          {validationSummary.hasBlockingFailure ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <p className="text-xs text-red-700">Blocked — resolve blocking validation failures before resubmitting</p>
            </div>
          ) : validationSummary.checking > 0 ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 animate-pulse" />
              <p className="text-xs text-blue-700">Validation checks still running</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <p className="text-xs text-emerald-700">Ready — no blocking validation failures</p>
            </div>
          )}
        </div>

        {/* Failure summary by reason */}
        {submission.failuresByReason.length > 0 && (
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-[10px] uppercase text-gray-400 font-medium mb-2">Failure Summary</p>
            <div className="space-y-1.5">
              {submission.failuresByReason.map((f, i) => (
                <div key={i} className="flex items-center justify-between">
                  <p className="text-xs text-gray-700">{f.reason}</p>
                  <Badge variant="destructive" size="sm">{f.count}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Item-level table */}
        <div className="px-5 py-3 flex-1 overflow-auto">
          <p className="text-[10px] uppercase text-gray-400 font-medium mb-2">Item Details</p>
          {itemsLoading && <p className="text-xs text-gray-500" role="status">Loading submission items...</p>}
          {itemsError && <p className="text-xs text-red-700" role="alert">Unable to load submission items.</p>}
          {!itemsLoading && !itemsError && items.length === 0 && <p className="text-xs text-gray-500">No item details available.</p>}
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-3 py-2 font-medium text-gray-500">Brick</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">Brand</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">Attributes</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">Status</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">Detail</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const statusCfg = ITEM_STATUS_CONFIG[item.status];
                  const StatusIcon = statusCfg.icon;
                  return (
                    <tr key={item.id} className={cn('border-b border-gray-100', item.status === 'failed' && 'bg-red-50/50')}>
                      <td className="px-3 py-2 text-gray-900 font-medium whitespace-nowrap">{item.brick}</td>
                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{item.brand}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{item.attributes}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <StatusIcon className={cn('w-3.5 h-3.5', statusCfg.iconClass)} />
                          <Badge variant={statusCfg.badgeVariant} size="sm">{statusCfg.label}</Badge>
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600 max-w-[240px]">
                        {item.detail ?? item.businessError ?? item.errorReason ?? (item.styleCode ? `Style: ${item.styleCode}` : '-')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {submission.hasSavedItems && submission.totalItems > 50 && (
            <Pagination
              currentPage={itemPage}
              totalPages={Math.ceil(submission.totalItems / 50)}
              totalItems={submission.totalItems}
              pageSize={50}
              onPageChange={onItemPageChange}
            />
          )}
        </div>

        {/* Retry action */}
        {eligibleItems.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 shrink-0">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600">
                Failed items eligible for retry
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRetry}
                disabled={isRetrying || retryClicked || validationSummary.hasBlockingFailure}
              >
                <RotateCcw className={cn('w-3.5 h-3.5 mr-1.5', isRetrying && 'animate-spin')} />
                {isRetrying ? 'Retrying...' : 'Retry failed items'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
