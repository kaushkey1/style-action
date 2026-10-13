import { useState, useMemo } from 'react';

import { ChevronDown, ChevronRight, Clock, AlertTriangle } from 'lucide-react';
import { Badge, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui';
import { cn, formatDate, formatNumber } from '@/lib/utils';

import { PipelineView } from './PipelineView';

import type { ActionSummary, PipelineStep, ReadinessCheck, RunType } from '../../types/engine.types';

/** Threshold in milliseconds for a "stale" engine run (24 hours). */
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

/** Check staleness outside render to avoid calling impure Date.now() during render. */
function computeIsStale(runTimestamp: string): boolean {
  const runDate = new Date(runTimestamp);
  return Date.now() - runDate.getTime() > STALE_THRESHOLD_MS;
}

interface RunStatusBarProps {
  readonly runType: RunType;
  readonly asOfDate: string;
  readonly runTimestamp: string;
  readonly readinessChecks: readonly ReadinessCheck[];
  readonly lineCounts: ActionSummary;
  readonly pipeline: readonly PipelineStep[];
}

/** Compact bar showing run metadata with expandable pipeline view. */
export function RunStatusBar({
  runType,
  asOfDate,
  runTimestamp,
  readinessChecks,
  lineCounts,
  pipeline,
}: RunStatusBarProps): React.ReactNode {
  const [isExpanded, setIsExpanded] = useState(false);

  const isStale = useMemo(() => computeIsStale(runTimestamp), [runTimestamp]);
  const allChecksPassed = readinessChecks.every((c) => c.passed);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Stale warning banner */}
      {isStale ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border-b border-amber-200 rounded-t-lg">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-xs text-amber-700">No engine run in the last 24 hours</span>
        </div>
      ) : null}

      {/* Main bar — clickable to expand pipeline */}
      <button
        type="button"
        className="flex w-full items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors rounded-lg"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        aria-label={`Engine run status. ${isExpanded ? 'Collapse' : 'Expand'} pipeline view`}
      >
        {/* Run type badge */}
        <Badge variant={runType === 'Nightly' ? 'primary' : 'info'} size="sm">
          {runType}
        </Badge>

        {/* As-of date */}
        <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
          <span className="hidden sm:inline text-gray-500">As of</span>
          <span className="font-medium text-gray-700">{formatDate(asOfDate)}</span>
        </div>

        {/* Run timestamp */}
        <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0 hidden md:flex">
          <Clock className="w-3 h-3" />
          <span>{formatDate(runTimestamp, { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
        </div>

        {/* Readiness dots */}
        <div className="flex items-center gap-1 shrink-0">
          {readinessChecks.map((check) => (
            <Tooltip key={check.name}>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    check.passed ? 'bg-green-500' : 'bg-red-500',
                  )}
                  aria-label={`${check.name}: ${check.passed ? 'passed' : 'failed'}`}
                />
              </TooltipTrigger>
              <TooltipContent>{check.name}: {check.passed ? 'Passed' : 'Failed'}{check.detail ? ` — ${check.detail}` : ''}</TooltipContent>
            </Tooltip>
          ))}
          {!allChecksPassed ? (
            <span className="text-xs text-red-600 ml-1 hidden sm:inline">Issues</span>
          ) : null}
        </div>

        {/* Line counts */}
        <div className="flex items-center gap-2 text-xs text-gray-500 ml-auto shrink-0 tabular-nums hidden lg:flex">
          <span>Replenishment: <span className="font-medium text-gray-700">{formatNumber(lineCounts.replenishment)}</span></span>
          <span className="text-gray-400">&middot;</span>
          <span>Pullback: <span className="font-medium text-gray-700">{formatNumber(lineCounts.pullback)}</span></span>
          <span className="text-gray-400">&middot;</span>
          <span>Markdown: <span className="font-medium text-gray-700">{formatNumber(lineCounts.markdown)}</span></span>
        </div>

        {/* Expand chevron */}
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>

      {/* Expanded pipeline view */}
      {isExpanded ? (
        <div className="border-t border-gray-100 px-3 pb-3">
          <PipelineView steps={pipeline} />
        </div>
      ) : null}
    </div>
  );
}
