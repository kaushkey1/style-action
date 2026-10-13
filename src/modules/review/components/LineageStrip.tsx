import { useState } from 'react';
import { Lightbulb, AlertTriangle, CheckSquare, ArrowRight, Clock } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import type { LineageEntry } from '../data/mockReviewData';

const STATE_CONFIG: Record<string, { icon: typeof Lightbulb; label: string }> = {
  insight: { icon: Lightbulb, label: 'Insight' },
  exception: { icon: AlertTriangle, label: 'Exception' },
  approval: { icon: CheckSquare, label: 'Approval' },
};

interface LineageStripProps {
  lineage: LineageEntry[];
  slaDeadline?: string;
  slaHours?: number;
}

export function LineageStrip({ lineage, slaDeadline, slaHours }: LineageStripProps): React.ReactNode {
  const [now] = useState(() => Date.now());

  if (lineage.length === 0) return null;

  const slaRemaining = slaDeadline
    ? Math.max(0, Math.round((new Date(slaDeadline).getTime() - now) / (1000 * 60 * 60)))
    : null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {lineage.map((entry, i) => {
        const config = STATE_CONFIG[entry.state];
        if (!config) return null;
        const Icon = config.icon;
        return (
          <div key={`${entry.state}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />}
            <span className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600">
              <Icon className="w-3 h-3" />
              <span>{config.label}</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-400">{formatDate(new Date(entry.date))}</span>
            </span>
          </div>
        );
      })}

      {slaRemaining !== null && (
        <span className={cn(
          'ml-auto inline-flex items-center gap-1 text-xs font-medium',
          slaRemaining <= 2 ? 'text-red-600' : slaRemaining <= 4 ? 'text-amber-600' : 'text-gray-500',
        )}>
          <Clock className="w-3 h-3" />
          SLA: {slaRemaining}h {slaHours ? `/ ${slaHours}h` : ''}
        </span>
      )}
    </div>
  );
}
