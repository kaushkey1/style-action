import { useState } from 'react';
import { Badge } from '@/components/ui';
import {cn, getCurrencySymbol} from '@/lib/utils';
import { spaceRecommendations } from '@/modules/range/data/mockSpacePlanning';
import type { SpaceRecommendation } from '@/modules/range/data/mockSpacePlanning';
import { X, ArrowRight } from 'lucide-react';

// ── Helpers ──

type RecommendationType = SpaceRecommendation['type'];

const sectionConfig: {
  type: RecommendationType;
  label: string;
  borderColor: string;
}[] = [
  { type: 'module', label: 'Module-Level Adjustments', borderColor: 'border-l-blue-500' },
  { type: 'segment', label: 'Segment-Level Adjustments', borderColor: 'border-l-amber-500' },
  { type: 'brand-exit', label: 'Brand Exit / Replace', borderColor: 'border-l-red-500' },
];

function groupByType(items: SpaceRecommendation[]) {
  const groups: Record<RecommendationType, SpaceRecommendation[]> = {
    module: [],
    segment: [],
    'brand-exit': [],
  };
  for (const item of items) {
    groups[item.type].push(item);
  }
  return groups;
}

// ── Recommendation Card ──

function RecommendationCard({
  recommendation,
  isSimulating,
  onSimulate,
  onCloseSimulation,
}: {
  recommendation: SpaceRecommendation;
  isSimulating: boolean;
  onSimulate: () => void;
  onCloseSimulation: () => void;
}) {
  const { type, title, storeName, trigger, constraint, impact, spsfDelta } =
    recommendation;

  // Mock baseline values
  const currentSpsf = 720;
  const currentGmrof = 345;
  const currentSpacePct = 22;

  const projectedSpsf = currentSpsf + spsfDelta;
  const projectedGmrof = currentGmrof + Math.round(spsfDelta * 0.45);
  const projectedSpacePct = type === 'brand-exit'
    ? currentSpacePct - 2.5
    : type === 'module'
      ? currentSpacePct + 1.2
      : currentSpacePct - 0.8;

  return (
    <div>
      <div
        className={cn(
          'border rounded-lg p-4',
          type === 'module'
            ? 'border-l-4 border-l-blue-500 border-gray-100'
            : type === 'segment'
              ? 'border-l-4 border-l-amber-500 border-gray-100'
              : 'border-l-4 border-l-red-500 border-gray-100',
        )}
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold text-gray-900">{title}</span>
          <Badge variant="default" size="sm">
            {storeName}
          </Badge>
        </div>

        {/* Detail grid */}
        {/* eslint-disable-next-line design-system/prefer-metric-grid -- attribute detail grid (trigger/constraint/impact), not a metric grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          {/* Trigger */}
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium mb-0.5">
              Trigger
            </p>
            <p className="text-xs text-gray-600">{trigger}</p>
          </div>

          {/* Constraint */}
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium mb-0.5">
              Constraint
            </p>
            <p className="text-xs text-gray-600">{constraint}</p>
          </div>

          {/* Impact */}
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium mb-0.5">
              Impact
            </p>
            <p className="text-xs text-gray-600">
              {impact}{' '}
              <Badge variant="success" size="sm">
                +{getCurrencySymbol()}{spsfDelta}/SFT
              </Badge>
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
          <button
            type="button"
            onClick={isSimulating ? onCloseSimulation : onSimulate}
            className={cn(
              'px-3 py-1.5 rounded text-xs font-medium transition-colors',
              isSimulating
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100',
            )}
          >
            {isSimulating ? 'Close Simulation' : 'Simulate'}
          </button>
          <button
            type="button"
            className="px-3 py-1.5 rounded text-xs font-medium transition-colors bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          >
            Apply
          </button>
          <button
            type="button"
            className="px-3 py-1.5 rounded text-xs font-medium transition-colors bg-gray-50 text-gray-500 hover:bg-gray-100"
          >
            Dismiss
          </button>
        </div>
      </div>

      {/* Simulation Panel */}
      {isSimulating && (
        <div className="mt-2 border border-blue-200 bg-blue-50/30 rounded-lg p-4">
          {/* eslint-disable-next-line design-system/prefer-section-header -- simulation panel header with close button, not a section header */}
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
              Simulation: {title}
            </h4>
            <button
              type="button"
              onClick={onCloseSimulation}
              className="p-2 -m-1 text-gray-400 hover:text-gray-600"
              aria-label="Close simulation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start">
            {/* Current State */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Current State</p>
              <div className="bg-white rounded p-2.5 border border-gray-100">
                <p className="text-xs text-gray-500">SPSF</p>
                <p className="text-sm font-bold text-gray-900">{getCurrencySymbol()}{currentSpsf}/SFT</p>
              </div>
              <div className="bg-white rounded p-2.5 border border-gray-100">
                <p className="text-xs text-gray-500">GMROF</p>
                <p className="text-sm font-bold text-gray-900">{getCurrencySymbol()}{currentGmrof}/SFT</p>
              </div>
              <div className="bg-white rounded p-2.5 border border-gray-100">
                <p className="text-xs text-gray-500">Space %</p>
                <p className="text-sm font-bold text-gray-900">{currentSpacePct.toFixed(1)}%</p>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center pt-8">
              <ArrowRight className="w-5 h-5 text-blue-400" />
            </div>

            {/* Projected State */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Projected State</p>
              <div className="bg-white rounded p-2.5 border border-green-100">
                <p className="text-xs text-gray-500">SPSF</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-900">{getCurrencySymbol()}{projectedSpsf}/SFT</p>
                  <Badge variant="success" size="sm">+{getCurrencySymbol()}{spsfDelta}/SFT</Badge>
                </div>
              </div>
              <div className="bg-white rounded p-2.5 border border-green-100">
                <p className="text-xs text-gray-500">GMROF</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-900">{getCurrencySymbol()}{projectedGmrof}/SFT</p>
                  <Badge variant="success" size="sm">+{getCurrencySymbol()}{Math.round(spsfDelta * 0.45)}</Badge>
                </div>
              </div>
              <div className="bg-white rounded p-2.5 border border-green-100">
                <p className="text-xs text-gray-500">Space %</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-900">{projectedSpacePct.toFixed(1)}%</p>
                  <Badge variant={projectedSpacePct > currentSpacePct ? 'success' : 'warning'} size="sm">
                    {projectedSpacePct > currentSpacePct ? '+' : ''}{(projectedSpacePct - currentSpacePct).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ──

export function CategorySpaceRecommendations({
  categoryId,
}: {
  categoryId: string;
}) {
  const [simulatingId, setSimulatingId] = useState<string | null>(null);

  const filtered = spaceRecommendations.filter(
    (r) => r.categoryId === categoryId,
  );

  if (filtered.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500">
          No space recommendations for this category.
        </p>
      </div>
    );
  }

  const groups = groupByType(filtered);

  return (
    <div className="space-y-6">
      {sectionConfig.map(({ type, label }) => {
        const items = groups[type];
        if (items.length === 0) return null;

        return (
          <div key={type} className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {label}
            </h3>
            {items.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                isSimulating={simulatingId === rec.id}
                onSimulate={() => setSimulatingId(rec.id)}
                onCloseSimulation={() => setSimulatingId(null)}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
