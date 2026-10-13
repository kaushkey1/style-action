import { useMemo, useState } from 'react';
import { Badge, Pagination, usePagination, KpiLabel, EmptyState } from '@/components/ui';
import {cn, getFormattingConfig, getCurrencySymbol} from '@/lib/utils';
import { useUnifiedPlanningStore } from '../stores/unified-planning.store';
import {
  networkCapacityBuildUp,
  storeSpaceProfiles,
  getSpsfTargetForGrade,
  getSpsfRagStatus,
  spsfTargets,
} from '@/modules/range/data/mockSpacePlanning';

// ── RAG helpers ──

const ragDotClasses: Record<string, string> = {
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  green: 'bg-emerald-500',
  blue: 'bg-blue-500',
};

const ragLabels: Record<string, string> = {
  red: 'below floor',
  amber: 'below target',
  green: 'on target',
  blue: 'above stretch',
};

// ── Activity Log Mock Data ──

const activityLog = [
  { date: '28 Feb 2026', store: 'Mumbai - Phoenix Mall', type: 'Segment', desc: 'Reduced KW 16%\u219213%, expanded WIW', spsfBefore: 861, spsfAfter: 878, status: 'Applied' },
  { date: '25 Feb 2026', store: 'Kolkata - Quest Mall', type: 'Brand Exit', desc: 'Exited Celio, expanded Performax', spsfBefore: 522, spsfAfter: 548, status: 'Applied' },
  { date: '22 Feb 2026', store: 'Chennai - Express Avenue', type: 'Module', desc: 'Added 2 Avaasa wall bays', spsfBefore: 738, spsfAfter: 752, status: 'Applied' },
  { date: '18 Feb 2026', store: 'Delhi - Select Citywalk', type: 'Segment', desc: 'Increased MF 20%\u219223%', spsfBefore: 845, spsfAfter: 858, status: 'Pending' },
  { date: '15 Feb 2026', store: 'Jaipur - World Trade Park', type: 'Brand Exit', desc: 'Exited Soch, expanded Global Desi', spsfBefore: 395, spsfAfter: 412, status: 'Simulated' },
  { date: '12 Feb 2026', store: 'Ahmedabad - Palladium', type: 'Module', desc: 'Consolidated Gini & Jony fixtures', spsfBefore: 498, spsfAfter: 510, status: 'Simulated' },
];

const typeColorClasses: Record<string, string> = {
  Module: 'text-blue-600',
  Segment: 'text-amber-600',
  'Brand Exit': 'text-red-600',
};

const statusVariantMap: Record<string, 'success' | 'warning' | 'default'> = {
  Applied: 'success',
  Pending: 'warning',
  Simulated: 'default',
};

// ── Component ──

export function NetworkSpaceDashboard() {
  const stores = useUnifiedPlanningStore((s) => s.stores);
  const [spsfPage, setSpsfPage] = useState(1);

  // Compute SPSF grid data for all stores
  const storeSpsfData = useMemo(() => {
    return stores.map((store) => {
      const profile = storeSpaceProfiles.find((p) => p.storeId === store.id);
      const target = getSpsfTargetForGrade(store.grade);
      const spsf = profile?.spsf ?? 0;
      const gmrof = profile?.gmrof ?? 0;
      const ragStatus = target ? getSpsfRagStatus(spsf, target) : 'green';

      return {
        id: store.id,
        name: store.name,
        grade: store.grade,
        spsf,
        gmrof,
        ragStatus,
      };
    });
  }, [stores]);

  // Count stores by RAG status
  const ragCounts = useMemo(() => {
    const counts: Record<string, number> = { red: 0, amber: 0, green: 0, blue: 0 };
    for (const s of storeSpsfData) {
      counts[s.ragStatus] = (counts[s.ragStatus] || 0) + 1;
    }
    return counts;
  }, [storeSpsfData]);

  // Capacity table totals
  const totalStores = networkCapacityBuildUp.reduce((sum, r) => sum + r.stores, 0);
  const totalRevCr = networkCapacityBuildUp.reduce((sum, r) => sum + r.fyRevCr, 0);
  const totalShare = networkCapacityBuildUp.reduce((sum, r) => sum + r.sharePercent, 0);
  const targetRevCr = 1500;
  const achievementPct = Math.min(100, Math.round((totalRevCr / targetRevCr) * 100));

  return (
    <div className="space-y-5">
      {/* ── Section 1: 15M Garment Capacity Validation ── */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          15M Garment Capacity Validation
        </h3>

        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['Grade', 'Stores', 'FY Rev (Cr)', 'Monthly Units', 'In-Store Stock', '% Share', 'Per Store (Cr)'].map(
                (h) => (
                  <th
                    key={h}
                    className={cn(
                      'text-xs font-medium text-gray-500 pb-3',
                      h === 'Grade' ? 'text-left' : 'text-right'
                    )}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {networkCapacityBuildUp.length === 0 ? (
              <tr><td colSpan={7}><EmptyState description="No capacity data to display" /></td></tr>
            ) : networkCapacityBuildUp.map((row) => (
              <tr key={row.grade} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-2.5 text-sm font-medium text-gray-900">{row.grade}</td>
                <td className="py-2.5 text-sm text-gray-700 text-right tabular-nums">{row.stores}</td>
                <td className="py-2.5 text-sm text-gray-700 text-right tabular-nums">
                  {getCurrencySymbol()}{row.fyRevCr} Cr
                </td>
                <td className="py-2.5 text-sm text-gray-700 text-right tabular-nums">{row.monthlyUnitsLabel}</td>
                <td className="py-2.5 text-sm text-gray-700 text-right tabular-nums">{row.inStoreStockLabel}</td>
                <td className="py-2.5 text-sm text-gray-700 text-right tabular-nums">{row.sharePercent}%</td>
                <td className="py-2.5 text-sm text-gray-700 text-right tabular-nums">
                  {getCurrencySymbol()}{row.perStore} Cr
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 font-bold">
              <td className="py-3 text-sm text-gray-900">Total</td>
              <td className="py-3 text-sm text-gray-900 text-right tabular-nums">{totalStores}</td>
              <td className="py-3 text-sm text-gray-900 text-right tabular-nums">
                {getCurrencySymbol()}{totalRevCr.toLocaleString(getFormattingConfig().locale)} Cr
              </td>
              <td className="py-3 text-sm text-gray-900 text-right tabular-nums">—</td>
              <td className="py-3 text-sm text-gray-900 text-right tabular-nums">—</td>
              <td className="py-3 text-sm text-gray-900 text-right tabular-nums">{totalShare}%</td>
              <td className="py-3 text-sm text-gray-900 text-right tabular-nums">—</td>
            </tr>
          </tfoot>
        </table>
        </div>

        {/* Achievement progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>
              {getCurrencySymbol()}{totalRevCr.toLocaleString(getFormattingConfig().locale)} Cr / {getCurrencySymbol()}{targetRevCr.toLocaleString(getFormattingConfig().locale)} Cr Target
            </span>
            <span className="font-medium">{achievementPct}%</span>
          </div>
          <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
            { }
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              // eslint-disable-next-line no-restricted-syntax -- dynamic width
              style={{ width: `${achievementPct}%` }}
            />
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-1.5">
            15M Garment Capacity: On Track
          </p>
        </div>
      </div>

      {/* ── Section 2: Network SPSF Performance ── */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Network <KpiLabel abbr="SPSF" /> Performance
        </h3>

        {/* RAG summary + SPSF target reference */}
        {/* eslint-disable-next-line design-system/prefer-section-header -- RAG legend + SPSF targets row, not a section header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-xs text-gray-600">
            {(['red', 'amber', 'green', 'blue'] as const).map((status) => {
              const count = ragCounts[status] ?? 0;
              return count > 0 ? (
                <div key={status} className="flex items-center gap-1.5">
                  <span className={cn('w-2 h-2 rounded-full', ragDotClasses[status])} />
                  <span>
                    {count} {ragLabels[status]}
                  </span>
                </div>
              ) : null;
            })}
          </div>
          <div className="flex flex-wrap gap-3">
            {spsfTargets.map((t) => (
              <div key={t.grade} className="text-xs text-gray-500">
                <span className="font-semibold text-gray-700">{t.label}</span>
                {' '}— F {getCurrencySymbol()}{t.floor} / T {getCurrencySymbol()}{t.target} / S {getCurrencySymbol()}{t.stretch}
              </div>
            ))}
          </div>
        </div>

        {/* SPSF data table */}
        {(() => {
          // eslint-disable-next-line react-hooks/rules-of-hooks -- IIFE pattern requires hook call here
          const { totalPages: spsfTotalPages, totalItems: spsfTotalItems, pageSize: spsfPageSize, getPageItems: getSpsfPageItems } = usePagination(storeSpsfData, 25);
          const spsfPageItems = getSpsfPageItems(spsfPage);
          return (
            <>
              <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 pb-3">Store</th>
                    <th className="text-center text-xs font-medium text-gray-500 pb-3">Grade</th>
                    <th className="text-right text-xs font-medium text-gray-500 pb-3"><KpiLabel abbr="SPSF" /></th>
                    <th className="text-right text-xs font-medium text-gray-500 pb-3"><KpiLabel abbr="GMROF" /></th>
                    <th className="text-center text-xs font-medium text-gray-500 pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {spsfPageItems.length === 0 ? (
                    <tr><td colSpan={5}><EmptyState description="No store SPSF data to display" /></td></tr>
                  ) : spsfPageItems.map((store) => (
                    <tr key={store.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 text-sm font-medium text-gray-900">{store.name}</td>
                      <td className="py-2.5 text-center">
                        <Badge variant={store.grade.startsWith('A') ? 'success' : 'default'} size="sm">{store.grade}</Badge>
                      </td>
                      <td className="py-2.5 text-sm text-right tabular-nums">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={cn('w-1.5 h-1.5 rounded-full', ragDotClasses[store.ragStatus])} />
                          {getCurrencySymbol()}{store.spsf}
                        </span>
                      </td>
                      <td className="py-2.5 text-sm text-gray-700 text-right tabular-nums">{getCurrencySymbol()}{store.gmrof}/SFT</td>
                      <td className="py-2.5 text-center">
                        <span className={cn(
                          'text-xs font-medium px-1.5 py-0.5 rounded-full capitalize',
                          store.ragStatus === 'red' ? 'bg-red-100 text-red-700' :
                          store.ragStatus === 'amber' ? 'bg-amber-100 text-amber-700' :
                          store.ragStatus === 'green' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        )}>
                          {ragLabels[store.ragStatus]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <Pagination
                currentPage={spsfPage}
                totalPages={spsfTotalPages}
                onPageChange={setSpsfPage}
                totalItems={spsfTotalItems}
                pageSize={spsfPageSize}
              />
            </>
          );
        })()}
      </div>

      {/* ── Section 3: Space Adjustment Activity Log ── */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Recent Space Adjustments
        </h3>

        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-xs font-medium text-gray-500 pb-3 text-left">Date</th>
              <th className="text-xs font-medium text-gray-500 pb-3 text-left">Store</th>
              <th className="text-xs font-medium text-gray-500 pb-3 text-left">Type</th>
              <th className="text-xs font-medium text-gray-500 pb-3 text-left">Description</th>
              <th className="text-xs font-medium text-gray-500 pb-3 text-right"><KpiLabel abbr="SPSF" /> Before</th>
              <th className="text-xs font-medium text-gray-500 pb-3 text-right"><KpiLabel abbr="SPSF" /> After</th>
              <th className="text-xs font-medium text-gray-500 pb-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {activityLog.length === 0 ? (
              <tr><td colSpan={7}><EmptyState description="No space adjustments to display" /></td></tr>
            ) : activityLog.map((entry, idx) => (
              <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-2.5 text-xs text-gray-500 whitespace-nowrap">{entry.date}</td>
                <td className="py-2.5 text-sm font-medium text-gray-900">{entry.store}</td>
                <td className={cn('py-2.5 text-xs font-semibold', typeColorClasses[entry.type] || 'text-gray-700')}>
                  {entry.type}
                </td>
                <td className="py-2.5 text-xs text-gray-700">{entry.desc}</td>
                <td className="py-2.5 text-sm text-gray-700 text-right tabular-nums">
                  {getCurrencySymbol()}{entry.spsfBefore}
                </td>
                <td
                  className={cn(
                    'py-2.5 text-sm text-right tabular-nums',
                    entry.spsfAfter > entry.spsfBefore ? 'text-emerald-600 font-semibold' : 'text-gray-700'
                  )}
                >
                  {getCurrencySymbol()}{entry.spsfAfter}
                </td>
                <td className="py-2.5">
                  <Badge variant={statusVariantMap[entry.status] || 'default'} size="sm">
                    {entry.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
