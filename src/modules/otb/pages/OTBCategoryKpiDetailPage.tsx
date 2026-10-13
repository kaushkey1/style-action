import { Fragment, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Badge, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, PageHeader as PageHeaderCompound, SectionHeader, EmptyState, Skeleton, Tabs, TabsList, TabsTrigger } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Info, Sparkles, Download, Pencil, X, Save, ChevronDown, History } from 'lucide-react';
import { useCategoryKpiData, useRecordAggregateEdit } from '../api/otbDashboardApi';
import { useDownload } from '@/hooks/useDownload';
import { useToast } from '@/hooks/useToast';
import { IMPETUS_APP_BASE } from '@/lib/api';
import type { OtbKpiData } from '../api/otbDashboardApi';
import { EditLogHistorySheet } from '../components/EditLogHistorySheet';

// ─── Helpers (shared with OTBChannelDetailPage / OTBCalculationSheetPage) ──

const MONTHS_FULL = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'] as const;

function toFiscalIdx(calMonth: number): number {
  return (calMonth - 4 + 12) % 12;
}

/** Inverse of toFiscalIdx — fiscal column index back to a calendar month (1-12). */
function toCalMonth(fiscalIdx: number): number {
  return ((fiscalIdx + 3) % 12) + 1;
}

function sanitizeKey(s: string): string {
  return s.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
}

type KpiFormat = 'currency' | 'units' | 'pct' | 'decimal' | 'days';

function detectFormat(groupName: string, kpiName: string): KpiFormat {
  const gn = groupName.toLowerCase();
  const kn = kpiName.toLowerCase();
  if (kn.includes('pct') || kn.includes('utilization')) return 'pct';
  if (kn.includes('change') || kn.includes('variance')) return 'pct';
  if (kn.includes('discount') || kn.includes('margin')) return 'pct';
  if (kn.includes('sell-through') || kn.includes('sell through')) return 'pct';
  if (kn.includes('gmroi')) return 'decimal';
  if (kn === 'days' || kn.includes('holding days')) return 'days';
  if (gn.includes('weeks of cover') || gn.includes('cover')) return 'decimal';
  if (gn.endsWith('(u)') || kn.includes('unit') || kn.includes('stock') || kn.includes('inventory') || kn.includes('on order') || kn.includes('buy quantity') || kn.includes('carryover') || kn.includes('net otb') || kn.includes('target closing') || kn.includes('ly inventory')) return 'units';
  if (gn.endsWith('(v)') || kn.includes('value') || kn.includes('sales') || kn.includes('cogs') || kn.includes('price') || kn.includes('cost') || kn.includes('asp') || kn.includes('landed')) return 'currency';
  return 'currency';
}

function formatValue(value: number, fmt: KpiFormat): string {
  if (value === 0 && fmt !== 'pct') return '0';
  switch (fmt) {
    case 'currency': return formatCurrency(value, { decimals: 2 });
    case 'units': return Math.round(value).toLocaleString('en-IN');
    case 'pct': return `${value.toFixed(2)}%`;
    case 'decimal': return value.toFixed(2);
    case 'days': return Math.round(value).toLocaleString('en-IN');
    default: return formatCurrency(value, { decimals: 2 });
  }
}

// ─── Edit helpers ───────────────────────────────────────────────────

const PURCHASE_VALUE_KEY = 'otb__purchase_value';

function toRawDigits(value: number): string {
  return String(Math.round(value));
}

function sanitizeNumericInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '');
  const dotIdx = cleaned.indexOf('.');
  if (dotIdx === -1) return cleaned;
  return cleaned.slice(0, dotIdx + 1) + cleaned.slice(dotIdx + 1).replace(/\./g, '');
}

function groupDigits(raw: string): string {
  if (!raw) return '0';
  const parts = raw.split('.');
  const num = parseInt(parts[0] || '0', 10);
  const formatted = isNaN(num) ? '0' : num.toLocaleString('en-IN');
  return parts.length > 1 ? `${formatted}.${parts[1]}` : formatted;
}

// ─── Data structures ────────────────────────────────────────────────

interface ColumnDef { label: string; index: number }

interface KpiRow {
  group: string;
  groupLabel: string;
  kpiName: string;
  dataKey: string;
  format: KpiFormat;
  isOtb: boolean;
  isRecommended: boolean;
}

const SEASON_IDX = 99;

/**
 * The `year` on every metric is the SEASON year, not the calendar year — the
 * calculator stamps Season_Year onto all rows of a season. AW 2026 therefore
 * spans Aug 2026 → Jan 2027 with `year: 2026` throughout.
 */
function findSeasonYear(data: OtbKpiData): number | undefined {
  for (const group of [...(data.otb_data ?? []), ...(data.remaining_data ?? [])]) {
    for (const kpi of group.kpis) {
      for (const m of kpi.monthly_metrics) {
        if (m.year) return m.year;
      }
    }
  }
  return undefined;
}

function buildColumns(data: OtbKpiData, viewMode: 'monthly' | 'season', seasonLabel?: string): ColumnDef[] {
  const seasonYear = findSeasonYear(data);

  if (viewMode === 'season') {
    const name = seasonLabel ?? data.available_seasons?.[0];
    const label = name
      ? (seasonYear ? `${name} ${seasonYear}` : name)
      : 'Season Total';
    return [{ label, index: SEASON_IDX }];
  }

  const indices = new Set<number>();
  const yearMap: Record<number, number> = {};
  for (const group of [...(data.otb_data ?? []), ...(data.remaining_data ?? [])]) {
    for (const kpi of group.kpis) {
      for (const m of kpi.monthly_metrics) {
        if (m.month == null) continue;
        const fi = toFiscalIdx(m.month);
        indices.add(fi);
        if (m.year) yearMap[fi] = m.year;
      }
    }
  }

  const ordered = Array.from(indices).sort((a, b) => a - b);
  const firstCalMonth = toCalMonth(ordered[0] ?? 0);

  return ordered.map((fi) => {
    const calMonth = toCalMonth(fi);
    const baseYear = yearMap[fi] ?? seasonYear ?? new Date().getFullYear();
    // Months that fall past the calendar wrap belong to the next year
    // (AW: Aug–Dec 2026, then Jan 2027).
    const year = calMonth < firstCalMonth ? baseYear + 1 : baseYear;
    return { label: `${MONTHS_FULL[fi]} ${year}`, index: fi };
  });
}

/**
 * DEMO ONLY — KPI rows suppressed from the grid.
 * Keyed by `${group}__${kpi}` (sanitised). All five are known-bad:
 *   - Actual Selling Price / LY ASP    : LY history sparse — 0.00 for the Others channel
 *   - OTB Details / GMROI              : derived from AOP NSV-COGS over OTB value
 *   - Inventory COGS / Change over LY  : LY COGS is ~2,400x too low, so the % explodes
 *   - Inventory Units / Target Closing : calculator does unit_req * target_woc(30) with no
 *                                        divide by season length -> ~26x inflated
 *   - Inventory Holding / Days         : averaged across plans instead of ratio-of-sums;
 *                                        EBO reads 4,602 days where the true figure is 555
 * REVERSIBLE: empty this set to restore them.
 * See docs/sessions/2026-08-03-otb-superdry-ui-changes.md
 */
const HIDDEN_KPI_KEYS = new Set<string>([
  'actual_selling_price__ly_asp',
  'otb_details__gmroi',
  'inventory_cogs__change_over_ly',
  'inventory_units__target_closing',
  'inventory_holding__days',
]);

function buildKpiRows(data: OtbKpiData): KpiRow[] {
  const rows: KpiRow[] = [];
  for (const group of [...(data.otb_data ?? []), ...(data.remaining_data ?? [])]) {
    const groupKey = sanitizeKey(group.group_name);
    const isOtb = group.group_name === 'OTB';
    for (const kpi of group.kpis) {
      const dataKey = `${groupKey}__${sanitizeKey(kpi.kpi_name)}`;
      if (HIDDEN_KPI_KEYS.has(dataKey)) continue;
      rows.push({
        group: groupKey,
        groupLabel: group.group_name,
        kpiName: kpi.kpi_name,
        dataKey,
        format: detectFormat(group.group_name, kpi.kpi_name),
        isOtb,
        isRecommended: kpi.kpi_name.toLowerCase().includes('recommended'),
      });
    }
  }
  return rows;
}

type MonthlyData = Record<string, number>;

function buildMonthlyDataMap(data: OtbKpiData): Record<number, MonthlyData> {
  const map: Record<number, MonthlyData> = {};
  for (const group of [...(data.otb_data ?? []), ...(data.remaining_data ?? [])]) {
    const groupKey = sanitizeKey(group.group_name);
    for (const kpi of group.kpis) {
      const kpiKey = `${groupKey}__${sanitizeKey(kpi.kpi_name)}`;
      for (const m of kpi.monthly_metrics) {
        const idx = m.month == null ? SEASON_IDX : toFiscalIdx(m.month);
        if (!map[idx]) map[idx] = {};
        map[idx]![kpiKey] = m.monthly_total;
      }
    }
  }
  return map;
}

// ─── Main Page ──────────────────────────────────────────────────────

export function OTBCategoryKpiDetailPage(): React.ReactNode {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchParams] = useSearchParams();
  const seasonParam = searchParams.get('season') || undefined;
  const [viewMode, setViewMode] = useState<'monthly' | 'season'>('monthly');
  const [isEditing, setIsEditing] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [savedValues, setSavedValues] = useState<Record<string, number>>({});
  const [focusedCell, setFocusedCell] = useState<string | null>(null);
  const [showEditLog, setShowEditLog] = useState(false);
  const { success: toastSuccess, warning: toastWarning } = useToast();
  const recordEdit = useRecordAggregateEdit();
  const { download, isDownloading } = useDownload(IMPETUS_APP_BASE);

  // Parse categoryId = "MEN-T-SHIRT" -> class="MEN", brick="T-SHIRT"
  const catStr = categoryId ? decodeURIComponent(categoryId) : '';
  const firstDash = catStr.indexOf('-');
  const classCode = firstDash > 0 ? catStr.slice(0, firstDash) : catStr;
  const brickCode = firstDash > 0 ? catStr.slice(firstDash + 1) : '';

  const kpiQuery = useCategoryKpiData(classCode || null, brickCode || null, viewMode === 'season' ? 'season' : seasonParam);
  const kpiData = kpiQuery.data;
  const kpiLoading = kpiQuery.isLoading;

  const columns = useMemo(() => kpiData ? buildColumns(kpiData, viewMode, seasonParam) : [], [kpiData, viewMode, seasonParam]);
  const kpiRows = useMemo(() => kpiData ? buildKpiRows(kpiData) : [], [kpiData]);
  const dataMap = useMemo(() => kpiData ? buildMonthlyDataMap(kpiData) : {}, [kpiData]);

  const groupMeta = useMemo(() => {
    const spans: Record<string, number> = {};
    const firstRowIndex: Record<string, number> = {};
    kpiRows.forEach((row, idx) => {
      spans[row.group] = (spans[row.group] || 0) + 1;
      if (!(row.group in firstRowIndex)) firstRowIndex[row.group] = idx;
    });
    return { spans, firstRowIndex };
  }, [kpiRows]);

  const pageTitle = `${classCode}${brickCode ? ` — ${brickCode}` : ''}`;

  const handleDiscard = () => {
    setEditedValues({});
    setIsEditing(false);
  };

  const handleSave = () => {
    const parsed: Record<string, number> = {};
    for (const [key, raw] of Object.entries(editedValues)) {
      const n = parseFloat(raw.replace(/[^\d.-]/g, ''));
      if (!isNaN(n)) parsed[key] = n;
    }

    // Record the seasonal Purchase Value edit in the audit log (no distribution
    // / recalc yet — that is a later phase).
    const pvKey = `${PURCHASE_VALUE_KEY}-${SEASON_IDX}`;
    const newValue = parsed[pvKey];
    const oldValue = dataMap[SEASON_IDX]?.[PURCHASE_VALUE_KEY];
    if (newValue !== undefined && newValue !== oldValue) {
      recordEdit.mutate(
        {
          scope_type: 'category',
          class: classCode,
          brick: brickCode,
          new_value: newValue,
          old_value: oldValue ?? null,
          kpi_name: 'Purchase Value',
          season: seasonParam ?? kpiData?.available_seasons?.[0] ?? null,
          year: kpiData ? findSeasonYear(kpiData) ?? null : null,
        },
        {
          onSuccess: () => toastSuccess('Edit recorded in Edit Log History'),
          onError: () => toastWarning('Could not record edit — saved locally only'),
        },
      );
    }

    setSavedValues((prev) => ({ ...prev, ...parsed }));
    setEditedValues({});
    setIsEditing(false);
  };

  const handleViewSwitch = (v: string) => {
    setViewMode(v as 'monthly' | 'season');
    setIsEditing(false);
    setEditedValues({});
  };

  return (
    <div className="space-y-4 animate-fadeInUp">
      <PageHeaderCompound
        title={pageTitle}
        backTo={{ label: 'Open-to-Buy', path: '/otb' }}
        actions={
          isEditing ? (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleDiscard} className="cursor-pointer">
                <X className="w-3.5 h-3.5 mr-1.5" />
                Discard
              </Button>
              <Button size="sm" onClick={handleSave} className="cursor-pointer">
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save OTB
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" disabled={isDownloading} className="cursor-pointer">
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    {isDownloading ? 'Downloading...' : 'Download'}
                    <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => download('/otb/plan/category-kpi-data', `otb_${classCode}_${brickCode}_monthly.xlsx`, { params: { class: classCode, brick: brickCode, ...(seasonParam ? { season: seasonParam } : {}) } })}>
                    Download Monthly View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => download('/otb/plan/category-kpi-data', `otb_${classCode}_${brickCode}_seasonal.xlsx`, { params: { class: classCode, brick: brickCode, data_type: 'season', ...(seasonParam ? { season: seasonParam } : {}) } })}>
                    Download Seasonal View
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {viewMode === 'season' && (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="cursor-pointer">
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
              )}
              {viewMode === 'season' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowEditLog(true)}
                  className="cursor-pointer"
                  title="Edit Log History"
                  aria-label="Edit Log History"
                >
                  <History className="w-3.5 h-3.5" />
                </Button>
              )}
              {seasonParam && <Badge variant="outline" size="sm">{seasonParam}</Badge>}
            </div>
          )
        }
      />

      {/* Info line + View toggle */}
      <SectionHeader
        title={
          <span className="flex items-center gap-1.5 text-xs font-normal text-gray-500">
            <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {viewMode === 'season'
              ? 'Aggregated KPI data for this category. Purchase Value can be edited in Season view.'
              : 'Aggregated KPI data across all OTB plans for this category.'}
          </span>
        }
        actions={
          <Tabs value={viewMode} onValueChange={handleViewSwitch}>
            <TabsList variant="default">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="season">Season</TabsTrigger>
            </TabsList>
          </Tabs>
        }
        className="mb-0"
      />

      {/* KPI Table */}
      {kpiLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              {Array.from({ length: 4 }).map((__, j) => (
                <Skeleton key={j} className="h-4 w-20 flex-1" />
              ))}
            </div>
          ))}
        </div>
      ) : !kpiData || kpiRows.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <EmptyState description={`No KPI data available for ${pageTitle}`} />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full border-collapse min-w-max">
            <tbody>
              {kpiRows.map((row, rowIdx) => {
                const isFirstInGroup = groupMeta.firstRowIndex[row.group] === rowIdx;
                const prevRow = rowIdx > 0 ? kpiRows[rowIdx - 1] : null;
                const isFirstRemainingGroup = isFirstInGroup && prevRow && prevRow.isOtb && !row.isOtb;
                const showHeaderRow = rowIdx === 0 || isFirstRemainingGroup;

                return (
                  <Fragment key={row.dataKey}>
                    {showHeaderRow && (
                      <tr className="bg-gray-50 border-b border-gray-200 border-t border-t-gray-200">
                        <td className="sticky left-0 z-20 bg-gray-50 text-left text-xs font-semibold text-gray-600 px-3 py-2.5 w-[180px] min-w-[180px] border-r border-gray-200">
                          KPI Group
                        </td>
                        <td className="sticky left-[180px] z-20 bg-gray-50 text-left text-xs font-semibold text-gray-600 px-3 py-2.5 w-[220px] min-w-[220px] border-r border-gray-200">
                          KPI
                        </td>
                        {columns.map((col) => (
                          <td key={col.index} className="text-left text-xs font-semibold text-gray-600 px-3 py-2.5 min-w-[160px] whitespace-nowrap">
                            {col.label}
                          </td>
                        ))}
                      </tr>
                    )}

                    <tr className={cn('border-b border-gray-100', row.isRecommended && 'bg-violet-50/40')}>
                      <td className="sticky left-0 z-10 bg-white text-sm text-gray-900 px-3 py-2.5 w-[180px] min-w-[180px] border-r border-gray-200">
                        {isFirstInGroup ? row.groupLabel : ''}
                      </td>
                      <td className={cn(
                        'sticky left-[180px] z-10 text-sm font-medium px-3 py-2.5 w-[220px] min-w-[220px] border-r border-gray-200 bg-white',
                        row.isRecommended ? 'text-primary' : 'text-gray-900',
                      )}>
                        <span className="flex items-center gap-1.5">
                          {row.isRecommended && <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />}
                          {row.kpiName}
                        </span>
                      </td>
                      {columns.map((col) => {
                        const monthData = dataMap[col.index];
                        const editKey = `${row.dataKey}-${col.index}`;
                        const value = savedValues[editKey] ?? (monthData?.[row.dataKey] ?? 0);
                        const isCellEditable = isEditing && viewMode === 'season'
                          && row.dataKey === PURCHASE_VALUE_KEY
                          && col.index === SEASON_IDX;

                        if (isCellEditable) {
                          const rawVal = editedValues[editKey] ?? toRawDigits(value);
                          const isFocused = focusedCell === editKey;
                          return (
                            <td key={col.index} className="text-left px-2 py-1.5 min-w-[160px] whitespace-nowrap">
                              {/* eslint-disable-next-line no-restricted-syntax -- spreadsheet cell input, same pattern as OTBCalculationSheetPage */}
                              <input
                                type="text"
                                inputMode="decimal"
                                value={isFocused ? rawVal : groupDigits(rawVal)}
                                onFocus={(e) => {
                                  setFocusedCell(editKey);
                                  requestAnimationFrame(() => e.target.select());
                                }}
                                onBlur={() => setFocusedCell(null)}
                                onChange={(e) => {
                                  setEditedValues((prev) => ({
                                    ...prev,
                                    [editKey]: sanitizeNumericInput(e.target.value),
                                  }));
                                }}
                                className="w-full text-left text-sm border border-gray-300 rounded px-2 py-1 bg-white focus-kb:ring-1 focus-kb:ring-primary/30 focus-kb:border-primary focus:outline-none"
                              />
                            </td>
                          );
                        }

                        return (
                          <td key={col.index} className={cn(
                            'text-left text-sm text-gray-900 px-3 py-2.5 min-w-[160px] whitespace-nowrap',
                            row.isRecommended && 'bg-violet-50/40',
                          )}>
                            {formatValue(value, row.format)}
                          </td>
                        );
                      })}
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <EditLogHistorySheet
        isOpen={showEditLog}
        onClose={() => setShowEditLog(false)}
        scope={
          classCode && brickCode
            ? {
                type: 'category',
                classCode,
                brick: brickCode,
                label: pageTitle,
              }
            : null
        }
      />
    </div>
  );
}
