import type { ReactNode } from 'react';
import { EmptyState } from '@/components/ui';
import type { Change } from '../../types/aopAdmin';

const LABELS: Record<string, string> = { nsm_ratio: 'NSM%', sell_through_ratio: 'Sell-through%', discount_ratio: 'Discount%', aop_achievement_ratio: 'AOP Achievement%', organisation: 'Organisation', channel: 'Channel', site: 'Site', planned_site: 'Planned site' };

function changeLabel(change: Change): string {
  return Object.values(change.entity_key).filter((value) => value !== null)
    .map((value) => LABELS[String(value)] ?? String(value).replaceAll('_', ' ').replaceAll('.', ' / ')).join(' · ');
}

function changeValue(change: Change, value: unknown, removed = false): string {
  if (value === null) return removed ? 'Inherited / removed' : 'Inherited / unset';
  if (typeof value === 'number' && ['nsm_ratio', 'sell_through_ratio', 'discount_ratio', 'aop_achievement_ratio'].includes(String(change.entity_key.parameter_key))) return `${Number((value * 100).toFixed(6))}%`;
  return typeof value === 'string' ? value : JSON.stringify(value);
}

export function AopChangeList({ changes }: { changes: Change[] }): ReactNode {
  if (!changes.length) return <EmptyState title="No changes" description="The pending values match the saved configuration." />;
  return <div className="space-y-2 max-h-80 overflow-y-auto">{changes.map((change, index) => <div key={index} className="border-b border-gray-100 pb-2 text-sm">
    <p className="font-medium text-gray-900">{changeLabel(change)}</p>
    <p className="text-gray-600 break-words">{changeValue(change, change.old_value)} → {changeValue(change, change.new_value, true)}</p>
  </div>)}</div>;
}
