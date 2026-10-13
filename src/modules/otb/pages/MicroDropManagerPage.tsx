import {
  Zap,
  Calendar,
  CloudSun,
  TrendingUp,
  ShieldAlert,
  Plus,
  X,
  Check,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Badge, Button, PageHeader, Progress, SectionHeader, EmptyState, StoreFilterSelect } from '@/components/ui';
import { cn, formatCurrencyFromLakhs } from '@/lib/utils';
import { useOTBStore } from '../stores/otb.store';
import { OTBTabNavigation } from '../components/OTBTabNavigation';
import type { MicroDrop, MicroDropSignal, MicroDropProgress } from '../types/otb.types';

// ─── Helpers ──────────────────────────────────────────────────────────

const TRIGGER_ICONS: Record<MicroDrop['trigger'], typeof TrendingUp> = {
  trend: TrendingUp,
  competitive: ShieldAlert,
  festival: Calendar,
  weather: CloudSun,
  viral: Zap,
};

const STATUS_BADGE_VARIANT: Record<MicroDrop['status'], { label: string; variant: 'warning' | 'info' | 'success' | 'default' }> = {
  signal: { label: 'SIGNAL', variant: 'default' },
  approved: { label: 'APPROVED', variant: 'info' },
  'in-production': { label: 'IN PRODUCTION', variant: 'warning' },
  shipped: { label: 'SHIPPED', variant: 'success' },
  'in-store': { label: 'IN STORE', variant: 'success' },
};

const RELEVANCE_VARIANT: Record<MicroDropSignal['relevance'], 'error' | 'warning' | 'default'> = {
  high: 'error',
  medium: 'warning',
  low: 'default',
};

// ─── Progress Step Tracker ────────────────────────────────────────────

function ProgressStepTracker({ steps }: { steps: MicroDropProgress[] }) {
  return (
    <div className="flex items-center gap-1 mt-3">
      {steps.map((step, idx) => {
        const isCompleted = step.status === 'completed';
        const isInProgress = step.status === 'in-progress';
        const isPending = step.status === 'pending';

        return (
          <div key={step.step} className="flex items-center gap-1">
            {/* Step indicator */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                  isCompleted && 'bg-green-500 text-white',
                  isInProgress && 'bg-amber-400 text-white animate-pulse',
                  isPending && 'bg-gray-200 text-gray-400'
                )}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  'text-xs whitespace-nowrap',
                  isCompleted && 'text-gray-700 font-medium',
                  isInProgress && 'text-gray-700 font-medium',
                  isPending && 'text-gray-400'
                )}
              >
                {step.step}
              </span>
            </div>

            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-6 mb-5',
                  isCompleted ? 'bg-green-400' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Active Micro-Drop Card ──────────────────────────────────────────

function MicroDropCard({ drop, podNames }: { drop: MicroDrop; podNames: string[] }) {
  const TriggerIcon = TRIGGER_ICONS[drop.trigger];
  const statusConfig = STATUS_BADGE_VARIANT[drop.status];
  const budgetPct = drop.budget > 0 ? Math.round((drop.consumed / drop.budget) * 100) : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-primary/30 hover:shadow-md transition-all duration-200">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <TriggerIcon className="w-4 h-4 text-primary" />
          </div>
          <h4 className="text-sm font-semibold text-gray-900">{drop.name}</h4>
        </div>
        <Badge variant={statusConfig.variant} size="sm">
          {statusConfig.label}
        </Badge>
      </div>

      {/* Trigger description */}
      <p className="text-xs text-gray-500 mb-3">
        {drop.triggerDescription}
        <span className="text-gray-400"> -- {drop.triggerSource}</span>
      </p>

      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-700 mb-3">
        <span>
          <span className="text-gray-500">Segment / Family:</span>{' '}
          {podNames.join(', ')}
        </span>
        <span className="text-gray-400">|</span>
        <span>
          <span className="text-gray-500">Budget:</span>{' '}
          {formatCurrencyFromLakhs(drop.budget)}
        </span>
        <span className="text-gray-400">|</span>
        <span>
          <span className="text-gray-500">Styles:</span>{' '}
          {drop.styleCount}
        </span>
        <span className="text-gray-400">|</span>
        <span>
          <span className="text-gray-500">Stores:</span>{' '}
          {drop.storeCount} ({drop.storeFilter})
        </span>
      </div>

      {/* Target N-Day */}
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
        <Calendar className="w-3 h-3" />
        <span>Target N-Day: {drop.targetNDay}</span>
      </div>

      {/* Budget progress */}
      <div className="mb-1">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Budget consumed</span>
          <span>{formatCurrencyFromLakhs(drop.consumed)} / {formatCurrencyFromLakhs(drop.budget)} ({budgetPct}%)</span>
        </div>
        <Progress
          value={budgetPct}
          size="sm"
          indicatorClassName={cn(
            budgetPct >= 90 ? 'bg-red-500' : budgetPct >= 70 ? 'bg-amber-500' : 'bg-primary'
          )}
        />
      </div>

      {/* Progress tracker */}
      <ProgressStepTracker steps={drop.progressSteps} />
    </div>
  );
}

// ─── Signal Card ─────────────────────────────────────────────────────

function SignalCard({
  signal,
  onDismiss,
}: {
  signal: MicroDropSignal;
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 hover:border-primary/30 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-gray-900 truncate">{signal.name}</h4>
            <Badge variant={RELEVANCE_VARIANT[signal.relevance]} size="sm">
              {signal.relevance.charAt(0).toUpperCase() + signal.relevance.slice(1)}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mb-2">{signal.description}</p>
          <div className="flex items-center gap-3 text-xs text-gray-700">
            <span>
              <span className="text-gray-500">Source:</span> {signal.source}
            </span>
            <span className="text-gray-400">|</span>
            <span>
              <span className="text-gray-500">Est. Budget:</span> {formatCurrencyFromLakhs(signal.estimatedBudget)}
            </span>
            <span className="text-gray-400">|</span>
            <span>
              <span className="text-gray-500">Styles:</span> {signal.estimatedStyles}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {signal.relevance !== 'low' ? (
            <Button size="sm" variant="primary" className="gap-1">
              <Plus className="w-3 h-3" />
              Create
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            className="gap-1 text-gray-500"
            onClick={() => onDismiss(signal.id)}
            aria-label={`Dismiss signal: ${signal.name}`}
          >
            <X className="w-3 h-3" />
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────

export function MicroDropManagerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const storeParam = searchParams.get('store');
  const fiscalYear = useOTBStore((s) => s.fiscalYear);
  const budget = useOTBStore((s) => s.budget);
  const microDrops = useOTBStore((s) => s.microDrops);
  const microDropSignals = useOTBStore((s) => s.microDropSignals);
  const dismissSignal = useOTBStore((s) => s.dismissSignal);

  // Resolve POD IDs to names using budget.pods
  const podNameMap: Record<string, string> = {};
  if (budget?.pods) {
    for (const pod of budget.pods) {
      podNameMap[pod.podId] = pod.podName;
    }
  }

  // Micro-drop tier data from budget
  const microDropTier = budget?.tiers.find((t) => t.tier === 'micro-drop');
  const reserveBudget = microDropTier?.budget ?? 0;
  const reserveConsumed = microDropTier?.consumed ?? 0;
  const reserveAvailable = microDropTier?.remaining ?? 0;
  const reservePct = reserveBudget > 0 ? Math.round((reserveConsumed / reserveBudget) * 100) : 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Fashion Manager"
        backTo={{ label: 'OTB', path: '/otb' }}
        badges={<Badge variant="primary" size="sm">{fiscalYear}</Badge>}
        actions={
          <StoreFilterSelect
            value={storeParam}
            onChange={(name) => {
              if (name) {
                searchParams.set('store', name);
              } else {
                searchParams.delete('store');
              }
              setSearchParams(searchParams);
            }}
          />
        }
      />

      <OTBTabNavigation />

      {/* Fashion Reserve card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Fashion Reserve" />
        {/* eslint-disable-next-line design-system/prefer-metric-grid -- responsive grid (2→4 cols) not supported by MetricGrid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Budget</p>
            <p className="text-sm font-bold text-gray-900">{formatCurrencyFromLakhs(reserveBudget)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Consumed</p>
            <p className="text-sm font-semibold text-amber-600">
              {formatCurrencyFromLakhs(reserveConsumed)}{' '}
              <span className="text-xs font-normal text-gray-500">({reservePct}%)</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Available</p>
            <p className="text-sm font-semibold text-green-600">{formatCurrencyFromLakhs(reserveAvailable)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Sourcing / Lead Time</p>
            <p className="text-sm text-gray-700">Test & Repeat engine</p>
            <p className="text-xs text-gray-500">7-21 days</p>
          </div>
        </div>
        <div className="mt-3">
          <Progress
            value={reservePct}
            size="sm"
            indicatorClassName="bg-amber-500"
          />
        </div>
      </div>

      {/* Active Fashion Drops */}
      <div>
        <SectionHeader
          title={`Active Fashion Drops (${microDrops.length})`}
          actions={
            <Button size="sm" variant="primary" className="gap-1">
              <Plus className="w-3 h-3" />
              New Drop
            </Button>
          }
        />
        {/* eslint-disable-next-line design-system/prefer-metric-grid -- responsive grid (1→2→3 cols) not supported by MetricGrid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {microDrops.map((drop) => {
            const podNames = drop.podIds.map((id) => podNameMap[id] ?? id);
            return <MicroDropCard key={drop.id} drop={drop} podNames={podNames} />;
          })}
        </div>
      </div>

      {/* Fashion Signals (Incoming) */}
      <div>
        <SectionHeader title={`Fashion Signals (Incoming) (${microDropSignals.length})`} />
        {microDropSignals.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200">
            <EmptyState description="No incoming signals at this time." className="p-4" />
          </div>
        ) : (
          <div className="space-y-3">
            {microDropSignals.map((signal) => (
              <SignalCard
                key={signal.id}
                signal={signal}
                onDismiss={dismissSignal}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
