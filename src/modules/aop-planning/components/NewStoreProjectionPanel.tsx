import React, { useState } from 'react';
import { Sheet, Button, RadioGroup, RadioGroupItem, Label } from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';

import type { NewStoreProjection, ProjectionMethod } from '../types/aopPlanning.types';

interface NewStoreProjectionPanelProps {
  projection: NewStoreProjection;
  onMethodChange: (method: ProjectionMethod) => void;
  onAcknowledge: () => void;
  onClose: () => void;
}

const MONTH_LABELS = [
  'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
  'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar',
] as const;

function getBarWidthPct(value: number, maxValue: number): number {
  if (maxValue <= 0) return 0;
  return Math.round((value / maxValue) * 100);
}

function getSeasonalityMax(months: number[]): number {
  let max = 0;
  for (const v of months) {
    if (v > max) max = v;
  }
  return max;
}

export function NewStoreProjectionPanel({
  projection,
  onMethodChange,
  onAcknowledge,
  onClose,
}: NewStoreProjectionPanelProps): React.ReactNode {
  const [localMethod, setLocalMethod] = useState<ProjectionMethod>(
    projection.selectedMethod,
  );

  const maxBarValue = Math.max(
    projection.waterfallTotal,
    projection.referenceTotal,
  );
  const waterfallPct = getBarWidthPct(projection.waterfallTotal, maxBarValue);
  const referencePct = getBarWidthPct(projection.referenceTotal, maxBarValue);

  const seasonalityMonths =
    localMethod === 'waterfall'
      ? projection.waterfallMonths
      : projection.referenceMonths;
  const seasonalityMax = getSeasonalityMax(seasonalityMonths);

  const varianceSign = projection.variancePct >= 0 ? '+' : '';

  function handleMethodChange(value: string): void {
    const method = value as ProjectionMethod;
    setLocalMethod(method);
    onMethodChange(method);
  }

  return (
    <Sheet
      isOpen
      onClose={onClose}
      title={`${projection.storeName} — NEW — Projection`}
      side="right"
      width="lg"
    >
      <div className="p-4 space-y-6">
        {/* Comparison Bars */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-sm font-medium text-gray-700">
                Waterfall (board, Y1)
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(projection.waterfallTotal)}
              </span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                aria-label={`Waterfall projection: ${waterfallPct}%`}
                // eslint-disable-next-line no-restricted-syntax -- dynamic bar width from data
                style={{ width: `${waterfallPct}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-sm font-medium text-gray-700">
                Reference store ({projection.referenceStoreName})
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(projection.referenceTotal)}
              </span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-400 rounded-full transition-all duration-300"
                aria-label={`Reference projection: ${referencePct}%`}
                // eslint-disable-next-line no-restricted-syntax -- dynamic bar width from data
                style={{ width: `${referencePct}%` }}
              />
            </div>
          </div>

          <p
            className={cn(
              'text-sm font-medium',
              projection.variancePct >= 0 ? 'text-green-700' : 'text-red-700',
            )}
          >
            Variance: {varianceSign}
            {projection.variancePct.toFixed(1)}%
          </p>
        </div>

        {/* Seasonality Bars */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Monthly Distribution
          </h3>
          <div className="flex items-end gap-1.5 h-20">
            {seasonalityMonths.map((value, index) => {
              const label = MONTH_LABELS[index];
              const heightPct =
                seasonalityMax > 0
                  ? Math.max(Math.round((value / seasonalityMax) * 100), 4)
                  : 4;
              return (
                <div
                  key={label}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full bg-primary/20 rounded-sm transition-all duration-200"
                    // eslint-disable-next-line no-restricted-syntax -- dynamic bar height from data
                    style={{ height: `${heightPct}%` }}
                    aria-label={`${label}: ${formatCurrency(value)}`}
                  />
                  <span className="text-[10px] text-gray-500 leading-none">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Method Selection */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Projection Method
          </h3>
          <RadioGroup
            value={localMethod}
            onValueChange={handleMethodChange}
            className="grid gap-3"
          >
            <label
              htmlFor="method-reference"
              className="flex items-center gap-3 cursor-pointer"
            >
              <RadioGroupItem value="reference" id="method-reference" />
              <Label
                htmlFor="method-reference"
                className="text-sm text-gray-700 cursor-pointer"
              >
                Reference
              </Label>
            </label>
            <label
              htmlFor="method-waterfall"
              className="flex items-center gap-3 cursor-pointer"
            >
              <RadioGroupItem value="waterfall" id="method-waterfall" />
              <Label
                htmlFor="method-waterfall"
                className="text-sm text-gray-700 cursor-pointer"
              >
                Waterfall
              </Label>
            </label>
          </RadioGroup>
        </div>

        {/* Acknowledge */}
        <div className="pt-2 border-t border-gray-200">
          {projection.isAcknowledged ? (
            <p className="text-sm text-gray-500">
              Acknowledged by {projection.acknowledgedBy}
            </p>
          ) : (
            <Button onClick={onAcknowledge} className="w-full sm:w-auto">
              Acknowledge
            </Button>
          )}
        </div>
      </div>
    </Sheet>
  );
}
