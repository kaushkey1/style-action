import { useCallback } from 'react';
import { cn, formatNumber } from '@/lib/utils';
import { Pencil, RotateCcw, AlertTriangle, ChevronRight, Info } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui';
import { useSpacePlanStore } from '../stores/useSpacePlanStore';
import { validateCategoryEdit } from '../data/mockSpacePlanningData';
import { InlineSpaceEditor } from './InlineSpaceEditor';
import { WhyPopover } from './WhyPopover';

const PREV_SPSF_HINT = 'Same 3-month season, last year · ₹/sft/month';
const CURRENT_SPSF_HINT = 'Trailing 3 months · ₹/sft/month';

/** ₹ rate: 0 decimals (1 decimal below 100); 0/null renders as "—". */
function formatRate(v: number | null | undefined): string {
  if (!v) return '—';
  return v < 100 ? `₹${v.toFixed(1)}` : `₹${formatNumber(Math.round(v))}`;
}

function TrendValue({ pct, className }: { pct: number | null | undefined; className?: string }): React.ReactNode {
  if (pct === null || pct === undefined) return <span className={cn('text-gray-400', className)}>—</span>;
  return (
    <span className={cn(
      'font-mono font-medium',
      pct > 0 ? 'text-green-700' : pct < 0 ? 'text-red-700' : 'text-gray-400',
      className,
    )}>
      {pct > 0 ? '▲ +' : pct < 0 ? '▼ ' : ''}{pct.toFixed(1)}%
    </span>
  );
}

function SpsfHeader({ label, hint }: { label: string; hint: string }): React.ReactNode {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help underline decoration-dotted decoration-gray-300 underline-offset-2">{label}</span>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  );
}

function EfficiencyGauge({ low, high, actual }: { low: number; high: number; actual: number }): React.ReactNode {
  const range = high - low;
  const pos = range > 0 ? ((actual - low) / range) * 100 : 50;
  const clampedPos = Math.max(0, Math.min(100, pos));

  return (
    <div className="flex items-center gap-2 min-w-[160px]">
      <span className="text-xs font-mono text-gray-500 w-8 text-right">{low.toFixed(2)}</span>
      <div className="relative flex-1 h-2 bg-gray-200 rounded-full">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full border-2 border-white shadow-sm"
          // eslint-disable-next-line no-restricted-syntax -- dynamic position from data
          style={{ left: `calc(${clampedPos}% - 6px)` }}
          title={`Efficiency: ${actual.toFixed(2)}`}
        />
      </div>
      <span className="text-xs font-mono text-gray-500 w-8">{high.toFixed(2)}</span>
    </div>
  );
}

function ProportionBar({ share, isOverflow }: { share: number; isOverflow: boolean }): React.ReactNode {
  return (
    <div className="w-full h-5 bg-gray-100 rounded overflow-hidden">
      <div
        className={cn('h-full rounded transition-all', isOverflow ? 'bg-amber-400/60' : 'bg-primary/40')}
        // eslint-disable-next-line no-restricted-syntax -- dynamic width from data
        style={{ width: `${Math.min(share, 100)}%` }}
      />
    </div>
  );
}

export function CategoryDetailsTab(): React.ReactNode {
  const categories = useSpacePlanStore((s) => s.categories);
  const plPool = useSpacePlanStore((s) => s.plPool);
  const storeSpsf = useSpacePlanStore((s) => s.storeSpsf);
  const editingCell = useSpacePlanStore((s) => s.editingCell);
  const showExceptionsOnly = useSpacePlanStore((s) => s.showExceptionsOnly);
  const setEditingCell = useSpacePlanStore((s) => s.setEditingCell);
  const editCategorySpace = useSpacePlanStore((s) => s.editCategorySpace);
  const resetManualEdit = useSpacePlanStore((s) => s.resetManualEdit);
  const setActiveTab = useSpacePlanStore((s) => s.setActiveTab);
  const setSelectedCategoryCode = useSpacePlanStore((s) => s.setSelectedCategoryCode);

  const filtered = showExceptionsOnly
    ? categories.filter((c) => c.boundBadge === '>sigmaMax' || c.boundBadge === 'manual')
    : categories;

  const totalNew = categories.reduce((s, c) => s + c.newSpace, 0);
  const totalOptionsMin = categories.reduce((s, c) => s + c.optionsMin, 0);
  const totalOptionsMax = categories.reduce((s, c) => s + c.optionsMax, 0);
  const overflowCategories = categories.filter((c) => c.boundBadge === '>sigmaMax');

  const handleRowClick = useCallback((code: string) => {
    setSelectedCategoryCode(code);
    setActiveTab('subcategories');
  }, [setSelectedCategoryCode, setActiveTab]);

  const handleEditClick = useCallback((index: number) => {
    setEditingCell({ type: 'category', index });
  }, [setEditingCell]);

  return (
    <div className="space-y-4 animate-fadeInUp">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">Category</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Allocation</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SpsfHeader label="Prev-Year SPSF" hint={PREV_SPSF_HINT} />
                </th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SpsfHeader label="Prev-Year Space" hint="Space in the same 3-month season, last year (AW25)" />
                </th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">New Space</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SpsfHeader label="Current SPSF" hint={CURRENT_SPSF_HINT} />
                </th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Delta</th>
                <th className="text-center py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[160px]">Efficiency</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Options</th>
                <th className="w-8 px-1" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((cat) => {
                const realIndex = categories.indexOf(cat);
                const delta = cat.newSpace - cat.currentSpace;
                const deltaPct = cat.currentSpace > 0 ? Math.round((delta / cat.currentSpace) * 100) : 0;
                const isEditing = editingCell?.type === 'category' && editingCell.index === realIndex;

                return (
                  <tr
                    key={cat.code}
                    className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors group"
                  >
                    {/* Category name — click navigates to subcategories */}
                    <td className="py-3 px-3 cursor-pointer" onClick={() => handleRowClick(cat.code)}>
                      <p className="text-sm font-semibold text-gray-900">{cat.code}</p>
                      <p className="text-xs text-gray-500">{cat.name}</p>
                    </td>

                    {/* Proportion bar */}
                    <td className="py-3 px-3 cursor-pointer" onClick={() => handleRowClick(cat.code)}>
                      <div className="flex items-center gap-2">
                        <ProportionBar share={cat.share} isOverflow={cat.boundBadge === '>sigmaMax'} />
                        <span className="text-xs font-mono text-gray-500 w-10 flex-shrink-0">{cat.share.toFixed(1)}%</span>
                      </div>
                    </td>

                    {/* Prev-Year SPSF */}
                    <td className="py-3 px-3 text-right font-mono text-sm text-gray-700 cursor-pointer" onClick={() => handleRowClick(cat.code)}>
                      {formatRate(cat.prevYearSpsf)}
                    </td>

                    {/* Prev-Year Space (AW25) */}
                    <td className="py-3 px-3 text-right font-mono text-sm text-gray-700 cursor-pointer" onClick={() => handleRowClick(cat.code)}>
                      {cat.prevYearSpaceSqft != null ? (
                        formatNumber(Math.round(cat.prevYearSpaceSqft))
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-gray-400 cursor-help">—</span>
                          </TooltipTrigger>
                          <TooltipContent>no history for last-year season</TooltipContent>
                        </Tooltip>
                      )}
                    </td>

                    {/* New space (editable) */}
                    <td className="py-3 px-3 text-right">
                      {isEditing ? (
                        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="presentation">
                          <InlineSpaceEditor
                            value={cat.newSpace}
                            min={cat.lowerBound}
                            onCommit={(v) => editCategorySpace(realIndex, v)}
                            onCancel={() => setEditingCell(null)}
                            validate={(v) => validateCategoryEdit(v, cat, plPool, categories, realIndex)}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <div
                            onClick={() => handleEditClick(realIndex)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleEditClick(realIndex); }}
                            aria-label={`Click to edit ${cat.code} space`}
                            className="cursor-pointer"
                          >
                            <p className={cn('text-sm font-semibold font-mono', cat.isManual ? 'text-amber-700' : 'text-gray-900')}>
                              {formatNumber(cat.newSpace)}
                              {cat.isManual && <Pencil className="w-3 h-3 inline ml-1 text-amber-500" />}
                            </p>
                            <p className="text-xs text-gray-400">was {formatNumber(cat.currentSpace)}</p>
                          </div>
                          {cat.isManual && (
                            <button
                              onClick={(e) => { e.stopPropagation(); resetManualEdit('category', realIndex); }}
                              className="text-gray-400 hover:text-gray-600 p-0.5"
                              aria-label={`Reset ${cat.code} to computed`}
                              title="Reset to computed value"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <span onClick={(e) => e.stopPropagation()} role="presentation">
                            <WhyPopover category={cat} plPool={plPool}>
                              <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help flex-shrink-0" />
                            </WhyPopover>
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Current SPSF */}
                    <td className="py-3 px-3 text-right font-mono text-sm text-gray-700 cursor-pointer" onClick={() => handleRowClick(cat.code)}>
                      {formatRate(cat.currentSpsf)}
                    </td>

                    {/* SPSF Trend */}
                    <td className="py-3 px-3 text-right cursor-pointer" onClick={() => handleRowClick(cat.code)}>
                      <TrendValue pct={cat.spsfTrendPct} className="text-sm" />
                    </td>

                    {/* Delta */}
                    <td className="py-3 px-3 text-right cursor-pointer" onClick={() => handleRowClick(cat.code)}>
                      <span className={cn('text-sm font-mono font-medium', delta > 0 ? 'text-green-700' : delta < 0 ? 'text-red-700' : 'text-gray-400')}>
                        {delta > 0 ? '+' : ''}{formatNumber(delta)}
                      </span>
                      <p className="text-xs text-gray-400">{deltaPct > 0 ? '+' : ''}{deltaPct}%</p>
                    </td>

                    {/* Efficiency gauge */}
                    <td className="py-3 px-3 cursor-pointer" onClick={() => handleRowClick(cat.code)}>
                      <EfficiencyGauge low={cat.efficiencyLow} high={cat.efficiencyHigh} actual={cat.efficiencyActual} />
                    </td>

                    {/* Options range */}
                    <td className="py-3 px-3 text-right font-mono text-sm text-gray-700 cursor-pointer" onClick={() => handleRowClick(cat.code)}>
                      {formatNumber(cat.optionsMin)}–{formatNumber(cat.optionsMax)}
                    </td>

                    {/* Drill chevron */}
                    <td className="py-3 px-1 cursor-pointer" onClick={() => handleRowClick(cat.code)}>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300">
                <td className="py-3 px-3 font-semibold text-gray-900">Total</td>
                <td className="py-3 px-3" />
                <td className="py-3 px-3 text-right font-mono text-gray-700">{formatRate(storeSpsf?.prevYearSpsf)}</td>
                <td className="py-3 px-3 text-right font-mono text-gray-700">
                  {categories.every((c) => c.prevYearSpaceSqft != null)
                    ? formatNumber(Math.round(categories.reduce((s, c) => s + (c.prevYearSpaceSqft ?? 0), 0)))
                    : '—'}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-gray-900">{formatNumber(totalNew)}</td>
                <td className="py-3 px-3 text-right font-mono text-gray-700">{formatRate(storeSpsf?.currentSpsf)}</td>
                <td className="py-3 px-3 text-right"><TrendValue pct={storeSpsf?.spsfTrendPct} className="text-sm" /></td>
                <td className="py-3 px-3" />
                <td className="py-3 px-3" />
                <td className="py-3 px-3 text-right font-mono text-gray-700">
                  {formatNumber(totalOptionsMin)}–{formatNumber(totalOptionsMax)}
                </td>
                <td className="py-3 px-1" />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Overflow warnings */}
        {overflowCategories.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            {overflowCategories.map((cat) => (
              <div key={cat.code} className="flex items-start gap-2 text-sm mb-1 last:mb-0">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-amber-800">
                  <span className="font-semibold">{cat.code}</span> exceeds ΣMAX ({formatNumber(cat.sigmaMax)}) — its pods overflow.
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
