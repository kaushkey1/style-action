import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  competitiveGapScores,
  catchmentProfiles,
  storeTwinAnalyses,
  storeDemandProfiles,
  storeClusterAssignments,
  storeClusters,
} from '../data/mockStoreIntelligence';
import { useUnifiedPlanningStore } from '../stores/unified-planning.store';

interface StoreComparisonSheetProps {
  storeIds: string[];
  onClose: () => void;
}

interface MetricRow {
  label: string;
  values: { raw: number; formatted: string }[];
  higherIsBetter: boolean;
}

const gradeColor = (grade: string) => {
  if (grade.startsWith('A+')) return 'bg-emerald-100 text-emerald-700';
  if (grade.startsWith('A')) return 'bg-blue-100 text-blue-700';
  if (grade.startsWith('B')) return 'bg-amber-100 text-amber-700';
  return 'bg-gray-100 text-gray-600';
};

export function StoreComparisonSheet({ storeIds, onClose }: StoreComparisonSheetProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isCommandContext = location.pathname.startsWith('/command/');
  const storeBasePath = isCommandContext ? '/command/store-view' : '/store-view';
  const { stores } = useUnifiedPlanningStore();

  const storeData = useMemo(() => {
    return storeIds.map((id) => {
      const store = stores.find((s) => s.id === id);
      const gap = competitiveGapScores.find((g) => g.storeId === id);
      const catchment = catchmentProfiles.find((c) => c.storeId === id);
      const twin = storeTwinAnalyses.find((t) => t.storeId === id);
      const demand = storeDemandProfiles.find((d) => d.storeId === id);
      const clusterId = storeClusterAssignments[id];
      const cluster = storeClusters.find((c) => c.id === clusterId);

      return {
        id,
        name: store?.name ?? `Store ${id.replace('store-', '#')}`,
        grade: store?.grade ?? 'N/A',
        cluster: cluster?.label ?? 'Unknown',
        compGap: gap?.overallScore ?? 0,
        twinGap: twin?.metrics[0]?.gap ?? 0,
        uplift: twin?.revenueUpliftMonthly ?? 0,
        affluence: catchment?.affluenceScore ?? 0,
        fashionForwardness: catchment?.fashionForwardness ?? 0,
        youthIndex: catchment?.youthIndex ?? 0,
        familyIndex: catchment?.familyIndex ?? 0,
        destinationScore: catchment?.destinationScore ?? 0,
        cdi: demand?.categoryDemand.length
          ? demand.categoryDemand.reduce((s, c) => s + c.salesIndex, 0) / demand.categoryDemand.length
          : 0,
        lflGrowth: demand?.categoryDemand.length
          ? demand.categoryDemand.reduce((s, c) => s + c.lflGrowth, 0) / demand.categoryDemand.length
          : 0,
      };
    });
  }, [storeIds, stores]);

  // Build metric rows — all metrics shown in unified view
  const metricRows = useMemo((): MetricRow[] => {
    return [
      {
        label: 'Twin Gap (SPSF)',
        values: storeData.map((s) => ({ raw: s.twinGap, formatted: `+${s.twinGap}` })),
        higherIsBetter: false,
      },
      {
        label: 'Monthly Uplift',
        values: storeData.map((s) => ({
          raw: s.uplift,
          formatted: s.uplift >= 100000 ? `${(s.uplift / 100000).toFixed(1)} L` : s.uplift.toLocaleString('en-IN'),
        })),
        higherIsBetter: true,
      },
      {
        label: 'Comp. Gap Score',
        values: storeData.map((s) => ({ raw: s.compGap, formatted: `${s.compGap}/100` })),
        higherIsBetter: true,
      },
      {
        label: 'CDI (Avg)',
        values: storeData.map((s) => ({ raw: s.cdi, formatted: s.cdi.toFixed(2) })),
        higherIsBetter: true,
      },
      {
        label: 'LFL Growth',
        values: storeData.map((s) => ({
          raw: s.lflGrowth,
          formatted: `${s.lflGrowth > 0 ? '+' : ''}${s.lflGrowth.toFixed(1)}%`,
        })),
        higherIsBetter: true,
      },
      {
        label: 'Affluence',
        values: storeData.map((s) => ({ raw: s.affluence, formatted: `${s.affluence}/100` })),
        higherIsBetter: true,
      },
      {
        label: 'Fashion Forward',
        values: storeData.map((s) => ({ raw: s.fashionForwardness, formatted: `${s.fashionForwardness}/100` })),
        higherIsBetter: true,
      },
      {
        label: 'Youth Index',
        values: storeData.map((s) => ({ raw: s.youthIndex, formatted: `${s.youthIndex}/100` })),
        higherIsBetter: true,
      },
      {
        label: 'Family Index',
        values: storeData.map((s) => ({ raw: s.familyIndex, formatted: `${s.familyIndex}/100` })),
        higherIsBetter: true,
      },
      {
        label: 'Destination',
        values: storeData.map((s) => ({ raw: s.destinationScore, formatted: `${s.destinationScore}/100` })),
        higherIsBetter: true,
      },
    ];
  }, [storeData]);

  // Find best/worst index for each row
  const getBestWorst = (row: MetricRow) => {
    const values = row.values.map((v) => v.raw);
    const best = row.higherIsBetter ? Math.max(...values) : Math.min(...values);
    const worst = row.higherIsBetter ? Math.min(...values) : Math.max(...values);
    return {
      bestIndices: values.map((v, i) => (v === best ? i : -1)).filter((i) => i >= 0),
      worstIndices: values.map((v, i) => (v === worst ? i : -1)).filter((i) => i >= 0),
    };
  };

  // Column width based on number of stores
  const colCount = storeData.length;
  const colClass = colCount <= 3 ? 'min-w-[160px]' : colCount <= 4 ? 'min-w-[140px]' : 'min-w-[120px]';

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" />
        <Dialog.Content
          className={cn(
            'fixed right-0 top-0 z-50 h-full bg-white shadow-xl',
            'animate-in slide-in-from-right duration-300',
            'focus:outline-none flex flex-col',
            colCount <= 3 ? 'w-[680px]' : colCount <= 4 ? 'w-[800px]' : 'w-[920px]',
          )}
        >
          {/* Header */}
          {/* eslint-disable-next-line design-system/prefer-section-header -- dialog header with close button, not a section */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <Dialog.Title className="text-sm font-semibold text-gray-900">
              Store Comparison ({storeData.length} stores)
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto px-6 py-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                {/* Store header row */}
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 pr-4 min-w-[100px]">Metric</th>
                    {storeData.map((store) => (
                      <th key={store.id} className={cn('text-center pb-3 px-2', colClass)}>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-semibold text-gray-900 truncate max-w-full">
                            {store.name.split(' - ')[1] ?? store.name}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={cn('px-1.5 py-0.5 text-xs font-bold rounded', gradeColor(store.grade))}>
                              {store.grade}
                            </span>
                            <span className="text-xs text-gray-400">{store.cluster}</span>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {metricRows.map((row) => {
                    const { bestIndices, worstIndices } = getBestWorst(row);
                    return (
                      <tr key={row.label} className="hover:bg-gray-50">
                        <td className="py-2.5 pr-4 text-xs font-medium text-gray-600 whitespace-nowrap">{row.label}</td>
                        {row.values.map((val, i) => {
                          const isBest = bestIndices.includes(i);
                          const isWorst = worstIndices.includes(i) && !isBest;
                          return (
                            <td key={i} className={cn('py-2.5 px-2 text-center tabular-nums', colClass)}>
                              <span
                                className={cn(
                                  'text-sm',
                                  isBest && 'font-bold text-emerald-700',
                                  isWorst && 'text-red-600',
                                  !isBest && !isWorst && 'text-gray-700',
                                )}
                              >
                                {val.formatted}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-6 py-3 shrink-0">
            {/* eslint-disable-next-line design-system/prefer-section-header -- footer nav row, not a section */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">View each store for full intelligence detail</span>
              <div className="flex items-center gap-2">
                {storeData.map((store) => (
                  <button
                    key={store.id}
                    onClick={() => {
                      onClose();
                      navigate(`${storeBasePath}/store/${store.id}`);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                  >
                    {store.name.split(' - ')[1] ?? store.name}
                    <ChevronRight className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
