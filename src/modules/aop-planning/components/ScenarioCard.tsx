import React from 'react';
import { Badge, Button } from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';

import type { PlanningScenario, ScenarioType } from '../types/aopPlanning.types';

interface ScenarioCardProps {
  scenario: PlanningScenario;
  isActive: boolean;
  onSetActive: () => void;
}

const TYPE_BADGE_VARIANT: Record<
  ScenarioType,
  'default' | 'success' | 'warning'
> = {
  base: 'default',
  optimistic: 'success',
  conservative: 'warning',
};

function formatGrowth(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function ScenarioCard({
  scenario,
  isActive,
  onSetActive,
}: ScenarioCardProps): React.ReactNode {
  return (
    <div
      className={cn(
        'bg-white border border-gray-200 rounded-lg p-4 transition-all duration-200',
        'hover:border-primary/30 hover:shadow-md',
        isActive && 'ring-2 ring-primary',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {scenario.name}
          </h3>
          {isActive && (
            <Badge variant="success" dot size="sm">Active</Badge>
          )}
        </div>
        <Badge variant={TYPE_BADGE_VARIANT[scenario.type]}>
          {scenario.type}
        </Badge>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
        <div>
          <p className="text-xs text-gray-500">GSV</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(scenario.totalNetSales)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Gross Margin</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(scenario.totalGrossMargin)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">GM%</p>
          <p className="text-sm font-semibold text-gray-900">
            {scenario.avgGmPct.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Growth vs PY</p>
          <p
            className={cn(
              'text-sm font-medium',
              scenario.growthVsPY > 0 && 'text-green-700',
              scenario.growthVsPY < 0 && 'text-red-700',
              scenario.growthVsPY === 0 && 'text-gray-700',
            )}
          >
            {formatGrowth(scenario.growthVsPY)}
          </p>
        </div>
      </div>

      {/* Channel Breakdown */}
      {scenario.channelBreakdown.length > 0 && (
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full min-w-[280px] text-xs mb-3">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-1.5 font-medium text-gray-500">
                  Channel
                </th>
                <th className="text-right py-1.5 font-medium text-gray-500">
                  GSV
                </th>
                <th className="text-right py-1.5 font-medium text-gray-500">
                  GM%
                </th>
                <th className="text-right py-1.5 font-medium text-gray-500">
                  Growth
                </th>
              </tr>
            </thead>
            <tbody>
              {scenario.channelBreakdown.map((ch) => (
                <tr key={ch.channelId} className="border-b border-gray-50">
                  <td className="py-1.5 text-gray-700">{ch.channelLabel}</td>
                  <td className="text-right py-1.5 text-gray-700">
                    {formatCurrency(ch.netSales)}
                  </td>
                  <td className="text-right py-1.5 text-gray-700">
                    {ch.gmPct.toFixed(1)}%
                  </td>
                  <td
                    className={cn(
                      'text-right py-1.5 font-medium',
                      ch.growthPct > 0 && 'text-green-700',
                      ch.growthPct < 0 && 'text-red-700',
                      ch.growthPct === 0 && 'text-gray-700',
                    )}
                  >
                    {formatGrowth(ch.growthPct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 border-t border-gray-100">
        <Button
          variant="outline"
          size="sm"
          onClick={onSetActive}
          disabled={isActive}
          className="w-full sm:w-auto"
        >
          {isActive ? 'Active Scenario' : 'Set as Active'}
        </Button>
      </div>
    </div>
  );
}
