import React, { useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, Info, ChevronDown, Save, Pencil, X, Download } from 'lucide-react';
import { Badge, PageHeader, FilterSelect, MetricCard, MetricGrid, Button, SectionHeader, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui';
import { cn, formatCurrencyFromLakhs, getFormattingConfig } from '@/lib/utils';
import { getCategoryName, getCategoryLineItems } from '../data/mockOTBCategory';

import type { OTBCategoryLineItem } from '../data/mockOTBCategory';

// ─── Constants ──────────────────────────────────────────────────────────

const MONTHS_FULL = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'] as const;
const MONTHS_SHORT = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'] as const;
const DAYS_IN_MONTH = [30, 31, 30, 31, 31, 30, 31, 30, 31, 31, 28, 31] as const;

function getFiscalMonthYear(fiscalIdx: number): number {
  const now = new Date();
  const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return fiscalIdx < 9 ? fyStartYear : fyStartYear + 1;
}

function getCurrentFiscalMonthIndex(): number {
  const calMonth = new Date().getMonth();
  return (calMonth - 3 + 12) % 12;
}

const CURRENT_MONTH_INDEX = getCurrentFiscalMonthIndex();

const MONTH_OPTIONS = MONTHS_SHORT.map((m, i) => ({
  value: String(i),
  label: m,
}));

// ─── Formatting ─────────────────────────────────────────────────────────

function getLocFmt(): Intl.NumberFormat {
  return new Intl.NumberFormat(getFormattingConfig().locale);
}
function getLocFmt2(): Intl.NumberFormat {
  return new Intl.NumberFormat(getFormattingConfig().locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function getCSym(): string {
  const { locale, currency } = getFormattingConfig();
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 })
    .format(0).replace(/[\d\s.,]/g, '').trim();
}

function fmtCurrFull(v: number): string {
  return `${getCSym()}${getLocFmt2().format(v)}`;
}

function fmtUnits(v: number): string {
  return getLocFmt().format(Math.round(v));
}

function fmtPct2(v: number): string {
  return `${getLocFmt2().format(v)}%`;
}

function fmtDecimal(v: number): string {
  return v.toFixed(1);
}

// ─── KPI Row Types ──────────────────────────────────────────────────────

interface KpiRow {
  group: string;
  groupLabel: string;
  kpiName: string;
  format: 'currency' | 'units' | 'pct' | 'decimal' | 'days';
  isRecommended?: boolean;
  isEditable?: boolean;
  isChange?: boolean;
  dataKey: string;
}

interface MonthlyData {
  [key: string]: number;
}

const KPI_ROWS: KpiRow[] = [
  { group: 'otb', groupLabel: 'OTB', kpiName: 'OTB Value', format: 'currency', dataKey: 'otbValue' },
  { group: 'otb', groupLabel: 'OTB', kpiName: 'Recommended Value', format: 'currency', isRecommended: true, dataKey: 'recommendedValue' },
  { group: 'otb', groupLabel: 'OTB', kpiName: 'Purchase Value', format: 'currency', isEditable: true, dataKey: 'purchaseValue' },

  { group: 'unitSales', groupLabel: 'Unit Sales (U)', kpiName: 'Forecasting Quantity', format: 'units', dataKey: 'forecastQty' },
  { group: 'unitSales', groupLabel: 'Unit Sales (U)', kpiName: 'CY Unit Sales', format: 'units', dataKey: 'cyUnitSales' },
  { group: 'unitSales', groupLabel: 'Unit Sales (U)', kpiName: 'LY Unit Sales', format: 'units', dataKey: 'lyUnitSales' },
  { group: 'unitSales', groupLabel: 'Unit Sales (U)', kpiName: 'AOP Unit Sales', format: 'units', dataKey: 'aopUnitSales' },
  { group: 'unitSales', groupLabel: 'Unit Sales (U)', kpiName: 'Change over LY', format: 'pct', isChange: true, dataKey: 'unitSalesChangeLY' },
  { group: 'unitSales', groupLabel: 'Unit Sales (U)', kpiName: 'Achievement against AOP', format: 'pct', dataKey: 'unitSalesAchAOP' },

  { group: 'netSales', groupLabel: 'Net Sales (V)', kpiName: 'CY Net Sales', format: 'currency', dataKey: 'cyNetSales' },
  { group: 'netSales', groupLabel: 'Net Sales (V)', kpiName: 'LY Net Sales', format: 'currency', dataKey: 'lyNetSales' },
  { group: 'netSales', groupLabel: 'Net Sales (V)', kpiName: 'AOP Net Sales', format: 'currency', dataKey: 'aopNetSales' },
  { group: 'netSales', groupLabel: 'Net Sales (V)', kpiName: 'Change over LY', format: 'pct', isChange: true, dataKey: 'netSalesChangeLY' },
  { group: 'netSales', groupLabel: 'Net Sales (V)', kpiName: 'Achievement against AOP', format: 'pct', dataKey: 'netSalesAchAOP' },

  { group: 'inventory', groupLabel: 'Inventory (U)', kpiName: 'Opening Stock', format: 'units', dataKey: 'openingStock' },
  { group: 'inventory', groupLabel: 'Inventory (U)', kpiName: 'Closing Stock', format: 'units', dataKey: 'closingStock' },
  { group: 'inventory', groupLabel: 'Inventory (U)', kpiName: 'Inwards', format: 'units', dataKey: 'inwards' },
  { group: 'inventory', groupLabel: 'Inventory (U)', kpiName: 'WoC', format: 'decimal', dataKey: 'woc' },

  { group: 'margins', groupLabel: 'Margins', kpiName: 'Discount %', format: 'pct', dataKey: 'discountPct' },
  { group: 'margins', groupLabel: 'Margins', kpiName: 'Net Intake Margin %', format: 'pct', dataKey: 'netIntakeMarginPct' },
  { group: 'margins', groupLabel: 'Margins', kpiName: 'COGS', format: 'currency', dataKey: 'cogs' },
];

// ─── Seeded random ──────────────────────────────────────────────────────

function seededRandom(seed: string, index: number): number {
  let hash = 0;
  const str = seed + ':' + index;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 1000) / 1000;
}

// ─── Mock Data Generation ───────────────────────────────────────────────

function generateMonthlyData(item: OTBCategoryLineItem): MonthlyData[] {
  const seed = item.id;
  const months: MonthlyData[] = [];

  for (let m = 0; m < 12; m++) {
    const data: MonthlyData = {};
    const sr = (idx: number) => seededRandom(seed, m * 100 + idx);
    const festivalMult = m === 6 ? 1.6 : m === 7 ? 1.5 : m === 8 ? 1.3 : 1.0;
    const monthBudget = item.recommended / 12;

    // OTB
    const otbValue = monthBudget * (0.7 + sr(0) * 0.6) * festivalMult;
    data['otbValue'] = otbValue;
    data['recommendedValue'] = otbValue * (0.85 + sr(1) * 0.3);
    data['purchaseValue'] = otbValue * (0.8 + sr(2) * 0.35);

    // Unit Sales
    const cyUnits = Math.round((1500 + sr(3) * 13500) * festivalMult);
    const lyUnits = Math.round(cyUnits * (0.85 + sr(4) * 0.1));
    const aopUnits = Math.round(cyUnits * (0.95 + sr(5) * 0.1));
    data['forecastQty'] = Math.round(cyUnits * (0.9 + sr(6) * 0.2));
    data['cyUnitSales'] = cyUnits;
    data['lyUnitSales'] = lyUnits;
    data['aopUnitSales'] = aopUnits;
    data['unitSalesChangeLY'] = lyUnits > 0 ? ((cyUnits - lyUnits) / lyUnits) * 100 : 0;
    data['unitSalesAchAOP'] = aopUnits > 0 ? (cyUnits / aopUnits) * 100 : 0;

    // Net Sales (in full rupees)
    const cyNet = (3000000 + sr(7) * 27000000) * festivalMult;
    const lyNet = cyNet * (0.85 + sr(8) * 0.1);
    const aopNet = cyNet * (0.95 + sr(9) * 0.1);
    data['cyNetSales'] = cyNet;
    data['lyNetSales'] = lyNet;
    data['aopNetSales'] = aopNet;
    data['netSalesChangeLY'] = lyNet > 0 ? ((cyNet - lyNet) / lyNet) * 100 : 0;
    data['netSalesAchAOP'] = aopNet > 0 ? (cyNet / aopNet) * 100 : 0;

    // Inventory
    const openStock = Math.round(5000 + sr(10) * 45000);
    data['openingStock'] = openStock;
    data['closingStock'] = Math.round(openStock * (0.7 + sr(11) * 0.5));
    data['inwards'] = Math.round(2000 + sr(12) * 8000);
    data['woc'] = 3 + sr(13) * 7;

    // Margins
    data['discountPct'] = 8 + sr(14) * 20;
    data['netIntakeMarginPct'] = 14 + sr(15) * 12;
    data['cogs'] = cyNet * (0.55 + sr(16) * 0.15);

    months.push(data);
  }

  return months;
}

// ─── Format value ───────────────────────────────────────────────────────

function formatValue(value: number, format: KpiRow['format']): string {
  switch (format) {
    case 'currency':
      return fmtCurrFull(value);
    case 'units':
      return fmtUnits(value);
    case 'pct':
      return fmtPct2(value);
    case 'decimal':
      return fmtDecimal(value);
    case 'days':
      return `${Math.round(value)}d`;
    default:
      return String(value);
  }
}

function formatInputValue(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  const intPart = parts[0] ?? '';
  const decPart = parts.length > 1 ? parts[1] : undefined;
  if (!intPart && decPart === undefined) return '';
  const num = parseInt(intPart || '0', 10);
  const formatted = isNaN(num) ? '0' : getLocFmt().format(num);
  if (decPart !== undefined) return `${formatted}.${decPart}`;
  return formatted;
}

function formatValueRaw(value: number, format: KpiRow['format']): string {
  switch (format) {
    case 'currency':
      return getLocFmt().format(Math.round(value));
    case 'units':
      return fmtUnits(value);
    case 'pct':
      return `${value.toFixed(1)}%`;
    case 'decimal':
      return fmtDecimal(value);
    case 'days':
      return `${Math.round(value)}d`;
    default:
      return String(value);
  }
}

// ─── Page Component ─────────────────────────────────────────────────────

export function OTBCategoryCalcSheetPage(): React.ReactNode {
  const { categoryId, otbId } = useParams<{ categoryId: string; otbId: string }>();
  const categoryCode = categoryId ?? '';
  const otbIdValue = otbId ?? '';
  const categoryName = getCategoryName(categoryCode);

  // Find the line item from mock data
  const lineItem = useMemo(() => {
    const items = getCategoryLineItems(categoryCode);
    return items.find((li) => li.otbId === otbIdValue) ?? null;
  }, [categoryCode, otbIdValue]);

  const otbCode = lineItem?.otbNumber ?? otbIdValue;

  // View mode
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState('0');

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Generate monthly data
  const monthlyData = useMemo(() => {
    if (!lineItem) return [];
    return generateMonthlyData(lineItem);
  }, [lineItem]);

  // Generate weekly data from monthly
  const weeklyData = useMemo<Record<number, MonthlyData>>(() => {
    if (!lineItem || viewMode !== 'weekly') return {};
    const monthIdx = parseInt(selectedMonth, 10);
    const daysCount = DAYS_IN_MONTH[monthIdx]!;
    const weekCount = Math.ceil(daysCount / 7);
    const monthData = monthlyData[monthIdx];
    if (!monthData) return {};
    const weeks: Record<number, MonthlyData> = {};
    for (let w = 0; w < weekCount; w++) {
      const week: MonthlyData = {};
      const daysInWeek = w === weekCount - 1 ? daysCount - w * 7 : 7;
      for (const key of Object.keys(monthData)) {
        const monthVal = monthData[key]!;
        const weekBase = (monthVal / daysCount) * daysInWeek;
        const variation = 0.88 + seededRandom(lineItem.id + ':wk', w * 50 + Object.keys(monthData).indexOf(key)) * 0.24;
        week[key] = weekBase * variation;
      }
      weeks[w] = week;
    }
    return weeks;
  }, [lineItem, viewMode, selectedMonth, monthlyData]);

  // Columns
  const columns = useMemo(() => {
    if (viewMode === 'monthly') {
      return MONTHS_FULL.map((m, i) => ({
        label: `${m} ${getFiscalMonthYear(i)}`,
        index: i,
      }));
    }
    const monthIdx = parseInt(selectedMonth, 10);
    const daysCount = DAYS_IN_MONTH[monthIdx]!;
    const weekCount = Math.ceil(daysCount / 7);
    return Array.from({ length: weekCount }, (_, i) => ({
      label: `Wk ${i + 1}`,
      index: i,
    }));
  }, [viewMode, selectedMonth]);

  const dataSource: Record<number, MonthlyData | undefined> = viewMode === 'monthly'
    ? monthlyData.reduce<Record<number, MonthlyData>>((acc, d, i) => { acc[i] = d; return acc; }, {})
    : weeklyData;

  // Group row spans
  const groupMeta = useMemo(() => {
    const spans: Record<string, number> = {};
    const firstRowIndex: Record<string, number> = {};
    KPI_ROWS.forEach((row, idx) => {
      spans[row.group] = (spans[row.group] || 0) + 1;
      if (!(row.group in firstRowIndex)) {
        firstRowIndex[row.group] = idx;
      }
    });
    return { spans, firstRowIndex };
  }, []);

  const hasUnsavedEdits = Object.keys(editedValues).length > 0;

  const handleSaveEdits = useCallback(() => {
    setEditedValues({});
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  }, []);

  // Utilization-based status
  const utilPct = lineItem?.utilPct ?? 0;
  const statusLabel = utilPct > 110 ? 'Over' : utilPct > 105 ? 'Watch' : utilPct >= 85 ? 'Normal' : utilPct >= 70 ? 'Watch' : 'Under';
  const statusVariant = statusLabel === 'Normal' ? 'success' : statusLabel === 'Watch' ? 'warning' : 'error';

  // Breadcrumb links
  const categoryDetailLink = `/otb/category/${categoryCode}`;

  // Invalid category
  if (!categoryName) {
    return (
      <div className="space-y-4 animate-fadeInUp">
        <PageHeader
          title="OTB Calculation Sheet"
          backTo={{ label: 'Open-to-Buy', path: '/otb/category' }}
        />
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-sm text-gray-500">Invalid category: <span className="font-mono font-medium text-gray-700">{categoryCode}</span></p>
          <Link to="/otb/category" className="text-sm text-primary hover:underline mt-2 inline-block">
            Back to Category listing
          </Link>
        </div>
      </div>
    );
  }

  // Line item not found
  if (!lineItem) {
    return (
      <div className="space-y-4 animate-fadeInUp">
        <PageHeader
          title="OTB Calculation Sheet"
          backTo={{ label: categoryName, path: categoryDetailLink }}
        />
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-1">OTB Line Item Not Found</h3>
          <p className="text-sm text-gray-500">
            The OTB ID &quot;{otbIdValue}&quot; does not match any line item in {categoryName}.
          </p>
          <Link to={categoryDetailLink} className="text-sm text-primary hover:underline mt-3">
            Back to {categoryName}
          </Link>
        </div>
      </div>
    );
  }

  // Loading simulation — mock data is instant, but show skeleton briefly
  const summaryBudget = lineItem.recommended;
  const summaryConsumed = lineItem.purchase;
  const summaryUtil = lineItem.utilPct;
  const summaryRemaining = Math.max(0, summaryBudget - summaryConsumed);

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* Page Header */}
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <span>OTB Number : {otbCode}</span>
            <Badge variant={statusVariant as 'success' | 'warning' | 'error'}>
              {statusLabel}
            </Badge>
          </span>
        }
        backTo={{ label: categoryName, path: categoryDetailLink }}
        actions={
          isEditing ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setEditedValues({}); setIsEditing(false); }}
              >
                <X className="w-3.5 h-3.5 mr-1.5" />
                Discard
              </Button>
              <Button size="sm" onClick={handleSaveEdits} disabled={!hasUnsavedEdits}>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save OTB
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Download
                    <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Download Monthly View</DropdownMenuItem>
                  <DropdownMenuItem>Download Weekly View</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Edit
              </Button>
            </div>
          )
        }
      />

      {/* Summary KPI Cards */}
      <MetricGrid columns={4}>
        <MetricCard label="OTB Budget" value={formatCurrencyFromLakhs(summaryBudget / 100000)} />
        <MetricCard label="Consumed" value={formatCurrencyFromLakhs(summaryConsumed / 100000)} />
        <MetricCard label="Remaining" value={formatCurrencyFromLakhs(summaryRemaining / 100000)} />
        <MetricCard
          label="Utilization"
          value={`${summaryUtil}%`}
          badge={<Badge variant={statusVariant as 'success' | 'warning' | 'error'} size="sm">{statusLabel}</Badge>}
        />
      </MetricGrid>

      {/* Info line + View toggle */}
      <SectionHeader
        title={
          <span className="flex items-center gap-1.5 text-xs font-normal text-gray-500">
            <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            Edit Purchase Value cells for future months, then save. Edits beyond &plusmn;10% of recommended require approval.
          </span>
        }
        actions={
          <div className="flex items-center gap-3 shrink-0">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'monthly' | 'weekly')}>
              <TabsList variant="default">
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
              </TabsList>
            </Tabs>

            {viewMode === 'weekly' && (
              <FilterSelect
                value={selectedMonth}
                onChange={setSelectedMonth}
                placeholder="Select Month"
                options={MONTH_OPTIONS}
                searchable
              />
            )}
          </div>
        }
        className="mb-0"
      />

      {/* KPI Spreadsheet Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full border-collapse min-w-max">
          <tbody>
            {KPI_ROWS.map((row, rowIdx) => {
              const isFirstInGroup = groupMeta.firstRowIndex[row.group] === rowIdx;
              const prevRow = rowIdx > 0 ? KPI_ROWS[rowIdx - 1] : null;
              const isNewSection = isFirstInGroup && prevRow && prevRow.group === 'otb' && row.group !== 'otb';
              const showHeaderRow = rowIdx === 0 || isNewSection;

              return (
                <React.Fragment key={`${row.group}-${row.dataKey}`}>
                  {showHeaderRow && (
                    <tr className="bg-gray-50 border-b border-gray-200 border-t border-t-gray-200">
                      <td className="sticky left-0 z-20 bg-gray-50 text-left text-xs font-semibold text-gray-600 px-3 py-2.5 w-[180px] min-w-[180px] border-r border-gray-200">
                        KPI Group
                      </td>
                      <td className="sticky left-[180px] z-20 bg-gray-50 text-left text-xs font-semibold text-gray-600 px-3 py-2.5 w-[220px] min-w-[220px] border-r border-gray-200">
                        KPI
                      </td>
                      {columns.map((col) => (
                        <td
                          key={col.index}
                          className="text-left text-xs font-semibold text-gray-600 px-3 py-2.5 min-w-[160px] whitespace-nowrap"
                        >
                          {col.label}
                        </td>
                      ))}
                    </tr>
                  )}

                  <tr
                    className={cn(
                      'border-b border-gray-100',
                      row.isRecommended && 'bg-violet-50/40',
                    )}
                  >
                    <td className="sticky left-0 z-10 bg-white text-sm text-gray-900 px-3 py-2.5 w-[180px] min-w-[180px] border-r border-gray-200">
                      {isFirstInGroup ? row.groupLabel : ''}
                    </td>

                    <td
                      className={cn(
                        'sticky left-[180px] z-10 text-sm font-medium px-3 py-2.5 w-[220px] min-w-[220px] border-r border-gray-200 bg-white',
                        row.isRecommended ? 'text-primary' : 'text-gray-900',
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        {row.isRecommended && (
                          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                        )}
                        {row.kpiName}
                        {row.isEditable && !row.isRecommended && (
                          <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        )}
                      </span>
                    </td>

                    {columns.map((col) => {
                      const monthData = dataSource[col.index];
                      const value = monthData?.[row.dataKey] ?? 0;
                      const isEditable = isEditing && row.isEditable && col.index >= CURRENT_MONTH_INDEX;
                      const editKey = `${row.dataKey}-${col.index}`;

                      if (isEditable) {
                        return (
                          <td key={col.index} className="text-right px-2 py-1.5 min-w-[160px] whitespace-nowrap">
                            {/* eslint-disable-next-line no-restricted-syntax -- spreadsheet cell input */}
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editedValues[editKey] ?? formatValueRaw(value, row.format)}
                              onChange={(e) => {
                                const formatted = formatInputValue(e.target.value);
                                setEditedValues((prev) => ({
                                  ...prev,
                                  [editKey]: formatted,
                                }));
                              }}
                              className="w-full text-right text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-primary/30 focus:border-primary focus:outline-none"
                            />
                          </td>
                        );
                      }

                      return (
                        <td
                          key={col.index}
                          className={cn(
                            'text-left text-sm text-gray-900 px-3 py-2.5 min-w-[160px] whitespace-nowrap',
                            row.isRecommended && 'bg-violet-50/40',
                          )}
                        >
                          {formatValue(value, row.format)}
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Save success feedback */}
      {saveSuccess && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
          <Badge variant="success" size="sm">Saved</Badge>
          <p className="text-sm text-green-700">OTB saved successfully.</p>
        </div>
      )}
    </div>
  );
}
