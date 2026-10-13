import { Badge, MetricGrid } from '@/components/ui';
import type { DomainKpi } from '../../data/mockChartData';

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'error'> = {
  on_track: 'success',
  warning: 'warning',
  critical: 'error',
};
const STATUS_LABEL: Record<string, string> = {
  on_track: 'On Track',
  warning: 'Warning',
  critical: 'Critical',
};

export function DomainKpis({ kpis }: { kpis: DomainKpi[] }) {
  return (
    <MetricGrid columns={kpis.length <= 3 ? 3 : 4}>
      {kpis.map((kpi) => (
        <div key={kpi.label} className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-medium text-gray-500">{kpi.label}</span>
            <Badge variant={STATUS_BADGE[kpi.status]} size="sm" className="text-xs">
              {STATUS_LABEL[kpi.status]}
            </Badge>
          </div>
          <p className="text-lg font-bold text-gray-900">{kpi.value}</p>
          <p className="text-xs text-gray-400 mt-0.5">Target: {kpi.target}</p>
        </div>
      ))}
    </MetricGrid>
  );
}
