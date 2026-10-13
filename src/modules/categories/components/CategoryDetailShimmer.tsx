import type React from 'react';
import { ShimmerKpiGrid } from '@/components/ui';

function ShimmerBar({ className }: { className?: string }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className ?? ''}`} />;
}

export function CategoryDetailShimmer(): React.ReactNode {
  return (
    <div className="space-y-4">
      {/* KPI cards row */}
      <ShimmerKpiGrid />

      {/* Action cards — "Defend these" + "Fix or cut these" + "What needs attention" */}
      { }
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {([0, 1] as number[]).map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="flex items-center gap-2 mb-3">
              <ShimmerBar className="w-4 h-4 rounded-sm" />
              <ShimmerBar className="h-3 w-24" />
            </div>
            <ShimmerBar className="h-3 w-32" />
          </div>
        ))}
        <div className="bg-white rounded-lg border border-gray-200 p-4 lg:col-span-2 animate-pulse">
          <div className="flex items-center gap-2 mb-3">
            <ShimmerBar className="w-4 h-4 rounded-sm" />
            <ShimmerBar className="h-3 w-36" />
          </div>
          <ShimmerBar className="h-3 w-32" />
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Horizontal bar chart skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
          <ShimmerBar className="h-4 w-56 mb-4" />
          <div className="space-y-4 py-2">
            {(
              [
                ['w-[90%]', 'w-[58%]'],
                ['w-[65%]', 'w-[42%]'],
                ['w-[45%]', 'w-[29%]'],
                ['w-[35%]', 'w-[22%]'],
              ] as [string, string][]
            ).map(([actual, plan], i) => (
              <div key={i} className="flex items-center gap-2">
                <ShimmerBar className="h-3 w-14 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <ShimmerBar className={`h-3 ${actual}`} />
                  <ShimmerBar className={`h-3 ${plan}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Donut chart skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
          <ShimmerBar className="h-4 w-44 mb-4" />
          <div className="flex items-center gap-6 h-[260px]">
            <div className="w-[160px] h-[160px] shrink-0 rounded-full border-[28px] border-gray-200 bg-gray-100" />
            <div className="flex-1 space-y-3">
              {(['w-3/5', 'w-4/5', 'w-2/5', 'w-[70%]', 'w-[55%]'] as string[]).map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <ShimmerBar className="w-2 h-2 rounded-sm shrink-0" />
                  <ShimmerBar className={`h-3 flex-1 ${w}`} />
                  <ShimmerBar className="h-3 w-10 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-category table + actions rail */}
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- shimmer placeholder mimicking table+rail layout, not a metric grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
        <div className="bg-white rounded-lg border border-gray-200 p-4 lg:col-span-2 animate-pulse">
          <ShimmerBar className="h-4 w-44 mb-4" />
          <div className="space-y-3">
            <div className="grid grid-cols-6 gap-3 pb-2 border-b border-gray-100">
              {(['w-24', 'w-20', 'w-28', 'w-20', 'w-14', 'w-24'] as string[]).map((w, i) => (
                <ShimmerBar key={i} className={`h-3 ${w}`} />
              ))}
            </div>
            {([0, 1, 2, 3] as number[]).map((r) => (
              <div key={r} className="grid grid-cols-6 gap-3 py-1">
                {(['w-20', 'w-16', 'w-20', 'w-16', 'w-12', 'w-20'] as string[]).map((w, i) => (
                  <ShimmerBar key={i} className={`h-3 ${w}`} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Actions rail */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
          {/* eslint-disable-next-line design-system/prefer-section-header -- shimmer skeleton for rail card with count badge, not a page section header */}
          <div className="flex items-center justify-between mb-3">
            <ShimmerBar className="h-3 w-32" />
            <ShimmerBar className="h-3 w-10" />
          </div>
          <ShimmerBar className="h-3 w-28" />
        </div>
      </div>
    </div>
  );
}
