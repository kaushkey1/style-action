import { Badge, KpiLabel } from '@/components/ui';
import { cn, classifyRag, ragToTextClass } from '@/lib/utils';
import { categoryPods, categoryGroups, type CategoryPod } from '../data/mockApexData';
import { useThresholds } from '@/hooks/useThresholds';

const statusBadge: Record<CategoryPod['status'], { variant: 'success' | 'warning' | 'error'; label: string }> = {
  'on-track': { variant: 'success', label: 'On Track' },
  warning: { variant: 'warning', label: 'Watch' },
  critical: { variant: 'error', label: 'Critical' },
};

function parseNumeric(val: string): number {
  return parseFloat(val.replace(/[₹,%/mo Cr]/g, '')) || 0;
}

function CategoryGroupTable({ category, pods }: { category: string; pods: CategoryPod[] }) {
  const thresholds = useThresholds();
  const onTrack = pods.filter((p) => p.status === 'on-track').length;
  const warning = pods.filter((p) => p.status === 'warning').length;
  const critical = pods.filter((p) => p.status === 'critical').length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* eslint-disable-next-line design-system/prefer-section-header -- category group header with status badges, not a standalone section header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{category}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{pods.length} pods</span>
          {onTrack > 0 && <Badge variant="success" className="text-xs">{onTrack} on track</Badge>}
          {warning > 0 && <Badge variant="warning" className="text-xs">{warning} watch</Badge>}
          {critical > 0 && <Badge variant="error" className="text-xs">{critical} critical</Badge>}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-3 py-2 font-medium text-gray-500">Sub-Category</th>
              <th className="text-left px-3 py-2 font-medium text-gray-500">Brands</th>
              <th className="text-right px-3 py-2 font-medium text-gray-500">Revenue</th>
              <th className="text-right px-3 py-2 font-medium text-gray-500">ST%</th>
              <th className="text-right px-3 py-2 font-medium text-gray-500"><KpiLabel abbr="GM%" /></th>
              <th className="text-right px-3 py-2 font-medium text-gray-500">Aged Inv%</th>
              <th className="text-right px-3 py-2 font-medium text-gray-500">Fresh%</th>
              <th className="text-left px-3 py-2 font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {pods.map((pod) => {
              const badge = statusBadge[pod.status];
              return (
                <tr
                  key={pod.podNumber}
                  className={cn(
                    'border-t border-gray-100 hover:bg-gray-50 transition-colors',
                    pod.status === 'critical' && 'bg-red-50/30'
                  )}
                >
                  <td className="px-3 py-2.5 text-gray-900 font-medium">{pod.subCategory}</td>
                  <td className="px-3 py-2.5 text-gray-500 max-w-[140px] truncate">{pod.brands}</td>
                  <td className="px-3 py-2.5 text-right text-gray-900 font-medium tabular-nums whitespace-nowrap">
                    {pod.currentRevenue}
                  </td>
                  <td
                    className={cn(
                      'px-3 py-2.5 text-right font-medium tabular-nums whitespace-nowrap',
                      ragToTextClass(classifyRag(parseNumeric(pod.sellThrough), thresholds.get('avgSellThrough') ?? null)),
                    )}
                  >
                    {pod.sellThrough}
                  </td>
                  <td
                    className={cn(
                      'px-3 py-2.5 text-right font-medium tabular-nums whitespace-nowrap',
                      ragToTextClass(classifyRag(parseNumeric(pod.grossMargin), thresholds.get('grossMargin') ?? null)),
                    )}
                  >
                    {pod.grossMargin}
                  </td>
                  <td
                    className={cn(
                      'px-3 py-2.5 text-right font-medium tabular-nums whitespace-nowrap',
                      ragToTextClass(classifyRag(parseNumeric(pod.agedInventory), thresholds.get('agedInventory') ?? null)),
                    )}
                  >
                    {pod.agedInventory}
                  </td>
                  <td
                    className={cn(
                      'px-3 py-2.5 text-right font-medium tabular-nums whitespace-nowrap',
                      ragToTextClass(classifyRag(parseNumeric(pod.freshPercent), thresholds.get('freshPercent') ?? null)),
                    )}
                  >
                    {pod.freshPercent}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ApexCategoryPods() {
  // Summary stats
  const onTrack = categoryPods.filter((p) => p.status === 'on-track').length;
  const warning = categoryPods.filter((p) => p.status === 'warning').length;
  const critical = categoryPods.filter((p) => p.status === 'critical').length;

  return (
    <div className="space-y-3">
      {/* Summary cards */}
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- custom status summary cards with conditional border colors, not a standard metric grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Total Product Pods</p>
          <p className="text-lg font-bold text-gray-900">24</p>
          <p className="text-xs text-gray-400">~₹500 Cr each, end-to-end</p>
        </div>
        <div className="bg-white rounded-lg border border-success/30 bg-success-50/30 p-3">
          <p className="text-xs text-gray-500">On Track</p>
          <p className="text-lg font-semibold text-green-700">{onTrack}</p>
          <p className="text-xs text-gray-400">ST ≥70%, Fresh ≥60%</p>
        </div>
        <div className="bg-white rounded-lg border border-warning/30 bg-warning-50/30 p-3">
          <p className="text-xs text-gray-500">Watch</p>
          <p className="text-lg font-semibold text-amber-700">{warning}</p>
          <p className="text-xs text-gray-400">1+ metrics below target</p>
        </div>
        <div className="bg-white rounded-lg border border-error/30 bg-error-50/30 p-3">
          <p className="text-xs text-gray-500">Critical</p>
          <p className="text-lg font-semibold text-red-700">{critical}</p>
          <p className="text-xs text-gray-400">Aged &gt;25% or ST &lt;60%</p>
        </div>
      </div>

      {/* Grouped tables by category */}
      {categoryGroups.map((group) => {
        const pods = categoryPods.filter((p) => p.category === group);
        if (pods.length === 0) return null;
        return <CategoryGroupTable key={group} category={group} pods={pods} />;
      })}

      {/* Data source footer */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <p className="text-xs text-gray-500 italic">
          Data source: SAP Sales &amp; Gross Margin, Material Master, Current Inventory, Site Material Master. All metrics derived from Databricks at T-1 latency.
        </p>
      </div>
    </div>
  );
}
