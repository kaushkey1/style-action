import { useState } from 'react';
import { ChevronDown, AlertTriangle, AlertCircle, Eye, User, Clock, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { SourceBadge } from './SourceBadge';

import type { PulsePointTask, ActionSeverity, TaskStatus } from '../data/pulsePointEngine';

const SEVERITY_BORDER: Record<ActionSeverity, string> = {
  S0: 'border-l-red-500',
  S1: 'border-l-amber-500',
  S2: 'border-l-gray-400',
};

const SEVERITY_BADGE: Record<ActionSeverity, 'error' | 'warning' | 'default'> = {
  S0: 'error',
  S1: 'warning',
  S2: 'default',
};

const SEVERITY_ICON: Record<ActionSeverity, typeof AlertTriangle> = {
  S0: AlertCircle,
  S1: AlertTriangle,
  S2: Eye,
};

const STATUS_VARIANT: Record<TaskStatus, 'error' | 'warning' | 'success' | 'default' | 'info'> = {
  Open: 'default',
  'In Progress': 'info',
  Escalated: 'error',
  Resolved: 'success',
};

const STATUS_ICON: Record<TaskStatus, typeof Clock | null> = {
  Open: Clock,
  'In Progress': Clock,
  Escalated: ArrowUpRight,
  Resolved: null,
};

function sourceKey(source: string): 'cctv' | 'audio' | 'input' {
  if (source === 'CCTV') return 'cctv';
  if (source === 'Audio') return 'audio';
  return 'input';
}

interface PulsePointTaskRowProps {
  task: PulsePointTask;
}

export function PulsePointTaskRow({ task }: PulsePointTaskRowProps): React.ReactNode {
  const [expanded, setExpanded] = useState(false);
  const SevIcon = SEVERITY_ICON[task.severity];
  const StatusIcon = STATUS_ICON[task.status];

  function handleToggle(): void {
    setExpanded((prev) => !prev);
  }

  function handleKeyDown(e: React.KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  }

  return (
    <Card className={cn('border-l-3', SEVERITY_BORDER[task.severity], 'transition-shadow hover:shadow-sm')}>
      <CardContent className="p-0">
        <div
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          aria-label={`${task.severity} task: ${task.task}`}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className="px-3 py-2.5 md:px-4 md:py-3 cursor-pointer select-none"
        >
          {/* Main row: severity + task + chevron */}
          <div className="flex items-start gap-2">
            <Badge variant={SEVERITY_BADGE[task.severity]} size="sm" className="shrink-0 mt-0.5">
              <SevIcon className="w-3 h-3 mr-0.5" />
              {task.severity}
            </Badge>
            <p className="text-sm text-gray-900 flex-1 leading-snug">{task.task}</p>
            <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform mt-1', expanded && 'rotate-180')} />
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2 ml-[52px]">
            <Badge variant={STATUS_VARIANT[task.status]} size="sm">
              {StatusIcon && <StatusIcon className="w-3 h-3 mr-0.5" />}
              {task.status}
            </Badge>
            <Badge variant="outline" size="sm">{task.category}</Badge>
            {task.sourceType === 'Multi-Source' ? (
              <Badge variant="primary" size="sm">Multi-Source</Badge>
            ) : (
              <SourceBadge source={sourceKey(task.sourceType)} />
            )}
            <span className="flex items-center gap-1 text-[10px] text-gray-400 ml-auto">
              <User className="w-3 h-3" />
              {task.owner.name}
            </span>
          </div>
        </div>

        {/* Expanded: insight + escalation + progress */}
        {expanded && (
          <div className="border-t border-gray-100 px-3 py-2.5 md:px-4 md:py-3 ml-[52px] space-y-2">
            <div>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Insight</p>
              <p className="text-xs text-gray-600 leading-relaxed">{task.insight}</p>
            </div>
            <div className="flex flex-wrap gap-4">
              {task.escalation && (
                <div>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Escalation</p>
                  <p className="text-xs text-red-600">{task.escalation}</p>
                </div>
              )}
              {task.progress && (
                <div>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Progress</p>
                  <p className="text-xs text-gray-600">{task.progress}</p>
                </div>
              )}
            </div>
            <div className="pt-1">
              <p className="text-[10px] text-gray-400 italic">Powered by PulsePoint</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Keep old export name for backwards compatibility
export { PulsePointTaskRow as PulsePointActionCard };
