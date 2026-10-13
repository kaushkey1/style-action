import { TrendingUp, Pause, Trash2, Bot } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { mockChaseStyles } from '@/modules/admin/data/mockAdminData';
import type { ChaseStyle } from '@/modules/admin/data/mockAdminData';

export function ChaseDecisionPanel() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      {/* eslint-disable-next-line design-system/prefer-section-header -- panel header with count badge, not a standalone section header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Chase / Hold / Kill Decisions</h3>
        <Badge variant="warning" size="sm">{mockChaseStyles.length} styles</Badge>
      </div>

      <div className="space-y-3">
        {mockChaseStyles.map((style) => (
          // eslint-disable-next-line no-restricted-syntax -- dynamic value
          <ChaseStyleCard key={style.styleId} style={style} />
        ))}
      </div>
    </div>
  );
}

function ChaseStyleCard({ style }: { style: ChaseStyle }) {
  const recConfig = {
    chase: { label: 'Chase', color: 'text-success-700 bg-success-50 border-success/30', icon: TrendingUp },
    hold: { label: 'Hold', color: 'text-warning-700 bg-warning-50 border-warning/30', icon: Pause },
    kill: { label: 'Kill', color: 'text-error-700 bg-error-50 border-error/30', icon: Trash2 },
  };

  const rec = recConfig[style.agentRecommendation];
  const RecIcon = rec.icon;

  const stColor = style.sellThrough7d >= 80 ? 'text-success-700' : style.sellThrough7d >= 60 ? 'text-warning-700' : 'text-error-700';

  return (
    <div className="border border-gray-100 rounded-lg p-3 hover:border-primary/30 transition-all duration-200">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-mono text-gray-400">{style.styleId}</span>
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-0.5', rec.color)}>
              <RecIcon className="w-3 h-3" />
              {rec.label}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-900">{style.styleName}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={cn('text-lg font-bold', stColor)}>{style.sellThrough7d}%</p>
          <p className="text-[10px] text-gray-500">7d ST</p>
        </div>
      </div>

      {/* eslint-disable-next-line design-system/prefer-metric-grid -- inline attribute grid within a card, not a standalone metric grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-2 text-xs">
        <div>
          <p className="text-[10px] text-gray-500">ROS</p>
          <p className="font-medium text-gray-900">{style.ros}x</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500">Inventory</p>
          <p className="font-medium text-gray-900">{style.inventoryUnits}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500">Cover</p>
          <p className="font-medium text-gray-900">{style.coverDays}d</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500">Confidence</p>
          <p className="font-medium text-gray-900">{style.confidence}%</p>
        </div>
      </div>

      {/* Agent recommendation context */}
      <div className="flex items-start gap-1.5 mb-3 text-[10px] text-gray-500">
        <Bot className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
        <span>{style.financialImpact[style.agentRecommendation]}</span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button variant={style.agentRecommendation === 'chase' ? 'primary' : 'outline'} size="sm" className="flex-1 text-xs">
          <TrendingUp className="w-3 h-3 mr-1" /> Chase
        </Button>
        <Button variant={style.agentRecommendation === 'hold' ? 'primary' : 'outline'} size="sm" className="flex-1 text-xs">
          <Pause className="w-3 h-3 mr-1" /> Hold
        </Button>
        <Button variant={style.agentRecommendation === 'kill' ? 'primary' : 'outline'} size="sm" className="flex-1 text-xs">
          <Trash2 className="w-3 h-3 mr-1" /> Kill
        </Button>
      </div>
    </div>
  );
}
