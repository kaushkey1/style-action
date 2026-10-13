import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { UnifiedItem } from '../data/mockReviewData';

interface ActionPreviewProps {
  item: UnifiedItem;
}

export function ActionPreview({ item }: ActionPreviewProps): React.ReactNode {
  if (item.lifecycleState !== 'approval' || !item.approvalContext) return null;

  const ctx = item.approvalContext;
  const totalRecovery = ctx.steps.reduce((sum, s) => sum + s.impactInr, 0);

  return (
    <div className="mt-3 space-y-3">
      {totalRecovery > 0 && (
        <div className="flex items-center gap-2.5 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
          <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Estimated recovery</span>
          <span className="text-sm font-bold text-emerald-700 tabular-nums ml-auto">{formatCurrency(totalRecovery)}</span>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-medium text-gray-500 mb-1.5">Proposed action</p>
        <p className="text-sm font-medium text-gray-900">{ctx.proposedAction}</p>
        <div className="mt-2">
          {ctx.steps.map((step, i) => (
            <div key={i} className="flex items-center justify-between text-xs text-gray-600 py-1.5 border-t border-gray-100 first:border-t-0 first:pt-0">
              <span>{step.description}</span>
              {step.impactInr > 0 && (
                <span className="font-semibold text-gray-900 tabular-nums">{formatCurrency(step.impactInr)}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
