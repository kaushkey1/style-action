import { useState } from 'react';
import { Footprints, ShoppingBag, CreditCard, Heart, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { WalkInTab } from '@/modules/jarvis/pages/WalkInTab';
import { TrialTab } from '@/modules/jarvis/pages/TrialTab';
import { CXSourceSales } from './CXSourceSales';

import type { JourneyStageScore, JourneyStage } from '../data/cxScoreEngine';

const STAGE_ICONS: Record<JourneyStage, typeof Footprints> = {
  discovery: Footprints,
  'in-store': Footprints,
  trial: ShoppingBag,
  checkout: CreditCard,
  'post-purchase': Heart,
};

const HIDDEN_STAGES: Set<JourneyStage> = new Set(['in-store']);

const EXPANDABLE_STAGES: Set<JourneyStage> = new Set(['checkout']);

/** Stages whose analytics are still being built — shown as "In Progress" and not openable. */
const LOCKED_STAGES: Set<JourneyStage> = new Set(['discovery', 'trial', 'post-purchase']);

const STAGE_DRILLDOWN_LABEL: Partial<Record<JourneyStage, string>> = {
  discovery: 'Walk-in Analytics',
  trial: 'Trial & Selection Analytics',
  checkout: 'Sales Performance',
};

/** Source pill for the drill-down header. Omitted stages render no pill. */
const STAGE_DRILLDOWN_SOURCE: Partial<Record<JourneyStage, string>> = {
  discovery: 'CCTV + Audio',
  trial: 'CCTV + Audio',
};

interface CXJourneyBreakdownProps {
  stages: JourneyStageScore[];
  expandable?: boolean;
  /** Required for the checkout drill-down, which fetches sales KPIs by store. */
  storeCode?: string;
  startDate?: string;
  endDate?: string;
}

function StageCard({ stage, isExpanded, onToggle, canExpand, isLocked }: {
  stage: JourneyStageScore;
  isExpanded: boolean;
  onToggle: () => void;
  canExpand: boolean;
  isLocked: boolean;
}): React.ReactNode {
  const Icon = STAGE_ICONS[stage.stage];

  return (
    <div className={cn(
      'rounded-lg border overflow-hidden transition-colors',
      isExpanded ? 'border-primary-200 ring-1 ring-primary-100' : 'border-gray-200',
      isLocked ? 'bg-gray-50' : 'bg-white',
      canExpand && 'cursor-pointer',
    )}>
      <button
        type="button"
        onClick={onToggle}
        disabled={isLocked}
        aria-expanded={isLocked ? undefined : isExpanded}
        className={cn(
          'w-full p-3 text-left transition-colors min-h-[44px]',
          isLocked ? 'cursor-not-allowed' : 'hover:bg-gray-50',
        )}
      >
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg shrink-0 bg-gray-100',
            isLocked ? 'text-gray-400' : 'text-gray-600',
          )}>
            <Icon className="h-4 w-4" aria-hidden />
          </div>
          <p className={cn(
            'text-sm font-medium leading-tight flex-1 truncate',
            isLocked ? 'text-gray-500' : 'text-gray-900',
          )}>{stage.label}</p>
          {isLocked ? (
            <div className="flex items-center gap-1 shrink-0">
              <Badge variant="warning" size="sm">In Progress</Badge>
              <Lock className="h-3.5 w-3.5 text-gray-400" aria-hidden />
            </div>
          ) : canExpand ? (
            isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-primary-500 shrink-0" aria-hidden />
            ) : (
              <div className="flex items-center gap-1 shrink-0">
                <Badge variant="outline" size="sm" className="text-[10px]">Drill-down</Badge>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" aria-hidden />
              </div>
            )
          ) : (
            <ChevronDown className={cn('h-3.5 w-3.5 text-gray-400 shrink-0 transition-transform', isExpanded && 'rotate-180')} aria-hidden />
          )}
        </div>
      </button>
    </div>
  );
}

function DrilldownPanel({ stage, storeCode, startDate, endDate }: {
  stage: JourneyStage;
  storeCode: string;
  startDate: string;
  endDate: string;
}): React.ReactNode {
  const label = STAGE_DRILLDOWN_LABEL[stage];
  const source = STAGE_DRILLDOWN_SOURCE[stage];

  return (
    <div className="col-span-full rounded-lg border border-primary-200 bg-white overflow-hidden animate-fadeInUp">
      <div className="px-4 py-2.5 border-b border-primary-100 bg-primary-50/30 flex items-center gap-2">
        <div className="w-1.5 h-6 rounded-full bg-primary-400" />
        <h4 className="text-sm font-semibold text-gray-900">{label}</h4>
        {source ? <Badge variant="primary" size="sm">{source}</Badge> : null}
      </div>
      <div className="p-4">
        {stage === 'discovery' ? (
          <WalkInTab startDateOverride={startDate} endDateOverride={endDate} />
        ) : stage === 'trial' ? (
          <TrialTab startDateOverride={startDate} endDateOverride={endDate} />
        ) : stage === 'checkout' ? (
          <CXSourceSales storeCode={storeCode} startDate={startDate} endDate={endDate} />
        ) : null}
      </div>
    </div>
  );
}

export function CXJourneyBreakdown({ stages, expandable, storeCode, startDate, endDate }: CXJourneyBreakdownProps): React.ReactNode {
  const [expandedStage, setExpandedStage] = useState<JourneyStage | null>(null);

  const handleToggle = (stage: JourneyStage): void => {
    setExpandedStage((prev) => (prev === stage ? null : stage));
  };

  const showDrilldown =
    expandable && expandedStage && EXPANDABLE_STAGES.has(expandedStage)
    && startDate && endDate && storeCode;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-900">Customer Journey</h3>

      {/* eslint-disable-next-line design-system/prefer-metric-grid -- journey stage cards, not metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {stages.filter((s) => !HIDDEN_STAGES.has(s.stage)).map((stage) => {
          const isLocked = LOCKED_STAGES.has(stage.stage);
          const canExpand = !isLocked && !!expandable && EXPANDABLE_STAGES.has(stage.stage);
          return (
            <StageCard
              key={stage.stage}
              stage={stage}
              isExpanded={expandedStage === stage.stage}
              onToggle={() => handleToggle(stage.stage)}
              canExpand={canExpand}
              isLocked={isLocked}
            />
          );
        })}

        {showDrilldown ? (
          <DrilldownPanel
            stage={expandedStage}
            storeCode={storeCode}
            startDate={startDate}
            endDate={endDate}
          />
        ) : null}
      </div>
    </div>
  );
}
