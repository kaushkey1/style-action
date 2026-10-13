import React from 'react';
import { Clock, User } from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';
import { Badge, EmptyState } from '@/components/ui';
import { useChanges } from '../api/salesPlanHooks';

import type { ChangeLogEntry } from '../api/salesPlanApi';

interface VersionHistoryListProps {
  cycleId: string;
}

const SCOPE_LABELS: Record<string, string> = {
  store_plan: 'Store Plan',
  channel_target: 'Channel Target',
  seasonality: 'Seasonality',
  category: 'Category',
  growth_factor: 'Growth Factor',
};

const FIELD_LABELS: Record<string, string> = {
  nsv: 'GSV',
  net_sales_target_nsv: 'Target',
  weight_pct: 'Weight %',
  growth_pct: 'Growth %',
  growth_factor_pct: 'Growth %',
};

// Internal audit noise (version bumps, generate/re-seed) — not user-facing plan edits.
function isAuditNoise(entry: ChangeLogEntry): boolean {
  return entry.scope === 'version' || entry.source === 'generate';
}

function scopeLabel(scope: string): string {
  return SCOPE_LABELS[scope] ?? scope.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(value: number | null): string {
  if (value === null || value === undefined) return '-';
  return Number(value).toLocaleString();
}

/** Concise entity label from the change's entityRef (channel / store / month / category). */
function entityLabel(entityRef: Record<string, unknown> | null): string | null {
  if (!entityRef) return null;
  const parts: string[] = [];
  for (const key of ['channel', 'category', 'store_name', 'store_id', 'month_id']) {
    const val = entityRef[key];
    if (typeof val === 'string' && val.trim()) parts.push(val.trim());
  }
  return parts.length ? parts.join(' · ') : null;
}

/** Inline (row-expanded) change history for a cycle — Buy Plan-style timeline, latest first. */
export function VersionHistoryList({ cycleId }: VersionHistoryListProps): React.ReactNode {
  const { data, isLoading, isError } = useChanges(cycleId);

  const entries = [...(data ?? [])]
    .filter((e) => !isAuditNoise(e))
    .sort((a, b) => new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime());

  if (isLoading) {
    return <div className="h-16 rounded-lg border border-gray-200 bg-gray-50 animate-pulse" />;
  }
  if (isError) {
    return <EmptyState title="Unable to load history" description="Please try again." variant="neutral" />;
  }
  if (entries.length === 0) {
    return <EmptyState title="No changes recorded" description="No plan edits recorded for this cycle." variant="neutral" />;
  }

  return (
    <div className="px-1 py-1">
      <p className="text-xs text-gray-500 mb-3">
        {entries.length} change{entries.length !== 1 ? 's' : ''} recorded
      </p>
      <div className="relative">
        <div className="absolute left-3 top-3 bottom-3 w-px bg-gray-200" aria-hidden="true" />
        <div className="space-y-4">
          {entries.map((entry, idx) => {
            const entity = entityLabel(entry.entityRef);
            const hasValues = entry.previousValue !== null || entry.newValue !== null;
            return (
              <div key={entry.id} className="relative pl-8">
                <div
                  className={cn(
                    'absolute left-1.5 top-2.5 w-3 h-3 rounded-full border-2',
                    idx === 0 ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300',
                  )}
                  aria-hidden="true"
                />
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <Badge variant="default" size="sm">
                      {scopeLabel(entry.scope)}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>{entry.timestamp ? formatDateTime(entry.timestamp) : '—'}</span>
                    </div>
                  </div>

                  {entity && <p className="text-sm font-medium text-gray-900 mb-0.5">{entity}</p>}

                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                    <User className="w-3 h-3" />
                    <span>{entry.actor || 'system'}</span>
                  </div>

                  {hasValues && (
                    <div className="flex items-center flex-wrap gap-1.5 text-xs">
                      <span className="text-gray-500">{fieldLabel(entry.field)}:</span>
                      <span className="text-red-500 line-through">{formatValue(entry.previousValue)}</span>
                      <span className="text-gray-400">&rarr;</span>
                      <span className="text-green-600 font-medium">{formatValue(entry.newValue)}</span>
                    </div>
                  )}

                  {entry.reason && (
                    <p className="text-xs text-gray-600 mt-1.5 bg-white rounded border border-gray-100 px-2 py-1">
                      {entry.reason}
                    </p>
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
