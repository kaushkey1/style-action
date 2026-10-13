import React from 'react';
import { cn } from '@/lib/utils';
import { PLAN_MONTHS } from '../data/mockChannels';

const H1_MONTHS = PLAN_MONTHS.filter((m) => m.season === 'H1');
const H2_MONTHS = PLAN_MONTHS.filter((m) => m.season === 'H2');

export function MonthColumnHeaders(): React.ReactNode {
  return (
    <thead>
      {/* Season grouping row */}
      <tr className="bg-gray-50">
        <th
          className="sticky left-0 z-10 bg-gray-50 min-w-[240px] px-3 py-2"
          aria-label="Row labels"
        />
        <th
          colSpan={H1_MONTHS.length}
          className="px-2 py-2 text-center text-xs font-semibold text-gray-600 tracking-wide"
        >
          H1 (Apr-Sep)
        </th>
        <th className="w-0.5 bg-gray-300 p-0" aria-hidden="true" />
        <th
          colSpan={H2_MONTHS.length}
          className="px-2 py-2 text-center text-xs font-semibold text-gray-600 tracking-wide"
        >
          H2 (Oct-Mar)
        </th>
        {/* Generated + FY Total + Latest Est + PY + GOLY + Growth + Guardrail */}
        <th className="px-2 py-2 text-xs font-semibold text-gray-600" />
        <th className="px-2 py-2 text-xs font-semibold text-gray-600" />
        <th className="px-2 py-2 text-xs font-semibold text-gray-600" />
        <th className="px-2 py-2 text-xs font-semibold text-gray-600" />
        <th className="px-2 py-2 text-xs font-semibold text-gray-600" />
        <th className="px-2 py-2 text-xs font-semibold text-gray-600" />
        <th className="px-2 py-2 text-xs font-semibold text-gray-600" />
      </tr>

      {/* Month labels row */}
      <tr className="bg-gray-50 border-b border-gray-200">
        <th
          className={cn(
            'sticky left-0 z-10 bg-gray-50 min-w-[240px]',
            'px-3 py-2 text-left text-xs font-medium text-gray-500',
          )}
        >
          Entity
        </th>
        {H1_MONTHS.map((month) => (
          <th
            key={month.id}
            className="px-2 py-2 text-right text-xs font-medium text-gray-500 whitespace-nowrap min-w-[70px]"
          >
            {month.shortLabel}
          </th>
        ))}
        <th className="w-0.5 bg-gray-300 p-0" aria-hidden="true" />
        {H2_MONTHS.map((month) => (
          <th
            key={month.id}
            className="px-2 py-2 text-right text-xs font-medium text-gray-500 whitespace-nowrap min-w-[70px]"
          >
            {month.shortLabel}
          </th>
        ))}
        <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 whitespace-nowrap min-w-[80px]">
          Generated
        </th>
        <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 whitespace-nowrap min-w-[80px]">
          Working
        </th>
        <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 whitespace-nowrap min-w-[90px]">
          Latest Est
        </th>
        <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 whitespace-nowrap min-w-[80px]">
          LY
        </th>
        <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 whitespace-nowrap min-w-[70px]">
          GOLY
        </th>
        <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 whitespace-nowrap min-w-[60px]">
          Growth
        </th>
        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 whitespace-nowrap min-w-[90px]">
          Guardrail
        </th>
      </tr>
    </thead>
  );
}
