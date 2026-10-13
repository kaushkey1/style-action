import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, LineChart, Boxes, Store } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { cn, formatNumber } from '@/lib/utils';
import { getDrillRoute } from '@/lib/routing';
import type { UnifiedItem } from '../data/mockReviewData';

const RAG_BADGE: Record<string, { label: string; variant: 'error' | 'warning' | 'success' }> = {
  RED: { label: 'Critical', variant: 'error' },
  AMBER: { label: 'Warning', variant: 'warning' },
  GREEN: { label: 'On Track', variant: 'success' },
};

interface MetricBreachCardProps {
  item: UnifiedItem;
}

export function MetricBreachCard({ item }: MetricBreachCardProps): React.ReactNode {
  const navigate = useNavigate();
  if (!item.metricName) return null;

  const rag = item.ragStatus ? RAG_BADGE[item.ragStatus] : null;
  // Structured action: jump to where you ACT on the recommendation (AOP, category-scoped).
  const actionCategory = item.category ?? item.dimensionSegment ?? null;

  // Scope drill links — "where this is happening" — derived from existing fields (no new data).
  const scopeCat = item.category ?? item.dimensionSegment ?? null;
  const scopeFmt = item.dimensionFormat ?? null;
  const scopeLinks: Array<{ key: string; label: string; to: string; icon: typeof Boxes }> = [];
  if (scopeCat) {
    scopeLinks.push({ key: 'inv-cat', label: `Inventory · ${scopeCat}`, icon: Boxes, to: getDrillRoute('inventory', { segment: scopeCat, from: 'review' }) });
    scopeLinks.push({ key: 'store-cat', label: `Stores · ${scopeCat}`, icon: Store, to: getDrillRoute('store-view', { category: scopeCat, from: 'review' }) });
  }
  if (scopeFmt) {
    scopeLinks.push({ key: 'store-fmt', label: `Stores · ${scopeFmt}`, icon: Store, to: getDrillRoute('store-view', { format: scopeFmt, from: 'review' }) });
  }

  return (
    <div className="rounded-lg border border-gray-200 p-3 space-y-2">
      {/* eslint-disable-next-line design-system/prefer-section-header -- compact inline header in detail panel card */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Metric Breach</h3>
        <div className="flex items-center gap-1.5">
          {item.category && (
            <Badge variant="outline" className="text-xs">{item.category}</Badge>
          )}
          {rag && (
            <Badge variant={rag.variant} size="sm">{rag.label}</Badge>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-medium text-gray-900">{item.metricName}</p>
        <p className="text-sm text-gray-600">
          {item.metricValue != null ? formatNumber(item.metricValue) : '—'} observed
          {item.thresholdValue != null && (
            <span className="text-gray-400"> (target: {formatNumber(item.thresholdValue)})</span>
          )}
        </p>
        {item.breachPct != null && (
          <p className={cn(
            'text-sm font-medium',
            (item.breachPct ?? 0) >= 50 ? 'text-red-600' : 'text-amber-600',
          )}>
            Breach: {item.breachPct.toFixed(1)}%
          </p>
        )}
      </div>

      {item.remediation && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-0.5">Recommended action</p>
          <p className="text-sm text-gray-700">{item.remediation}</p>
          {actionCategory && (
            <div className="mt-2.5">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(getDrillRoute('aop', { category: actionCategory, from: 'review' }))}
                className="active:scale-[0.96] transition-transform"
              >
                <LineChart className="w-3.5 h-3.5" />
                Open in AOP plan
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}

      {scopeLinks.length > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-1.5">Where this is happening</p>
          <div className="flex flex-wrap gap-1.5">
            {scopeLinks.map((l) => (
              <button
                key={l.key}
                type="button"
                onClick={() => navigate(l.to)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 min-h-11 lg:min-h-0 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <l.icon className="w-3.5 h-3.5 text-gray-400" />
                {l.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
