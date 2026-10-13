/**
 * KPI Formulae tab for the channel-led (Superdry) OTB Configuration screen.
 *
 * Read-only, like the FNL tab. Superdry's formulae live in a flat
 * {name: expression} map with no category metadata, so groups are derived from
 * the `Category__Metric` naming convention.
 */

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, FlaskConical } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import type { OtbConfiguration } from '../../api/otbConfigurationApi';
import { cn } from '@/lib/utils';

interface KpiGroup {
  category: string;
  items: { name: string; formula: string }[];
}

/** `OTB_Details__Buy_Quantity` -> category `OTB Details`, metric `Buy Quantity`. */
function humanise(token: string): string {
  return token.replace(/_/g, ' ').trim();
}

function groupFormulae(formulae: Record<string, string>): KpiGroup[] {
  const map = new Map<string, { name: string; formula: string }[]>();
  for (const [name, formula] of Object.entries(formulae)) {
    const [prefix] = name.split('__');
    const category = humanise(prefix || 'Other');
    const existing = map.get(category) ?? [];
    existing.push({ name, formula });
    map.set(category, existing);
  }
  return [...map.entries()]
    .map(([category, items]) => ({
      category,
      items: items.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => b.items.length - a.items.length || a.category.localeCompare(b.category));
}

export function SuperdryKpiFormulaeTab({ config }: { config: OtbConfiguration }) {
  const groups = useMemo(() => groupFormulae(config.kpi_formulae ?? {}), [config.kpi_formulae]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (category: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  if (groups.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <EmptyState
          icon={FlaskConical}
          title="No KPI formulae"
          description="This organisation has no KPI formulae configured."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3">
        <FlaskConical className="w-4 h-4 text-primary-700 shrink-0 mt-0.5" />
        <p className="text-sm text-primary-700">
          Reference documentation only. The OTB engine implements these KPIs directly in
          vectorised code — editing these expressions would not change the calculated values.
        </p>
      </div>

      {groups.map(({ category, items }) => {
        const isCollapsed = collapsed.has(category);
        return (
          <div key={category} className="bg-white rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() => toggle(category)}
              className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-lg"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm font-semibold text-gray-900">{category}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                {items.length}
              </span>
            </button>

            {!isCollapsed && (
              <div className="px-4 pb-3 space-y-3">
                {items.map(({ name, formula }) => (
                  <div key={name} className={cn('pt-3 border-t border-gray-100')}>
                    <p className="text-sm font-mono font-medium text-gray-900">{name}</p>
                    <pre className="mt-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 font-mono whitespace-pre-wrap break-words">
                      {formula}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
