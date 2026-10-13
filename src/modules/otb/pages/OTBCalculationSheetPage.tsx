import React, { useState, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useParams, useSearchParams } from 'react-router-dom';
import { Sparkles, Info, ChevronDown, ChevronRight, Save, Loader2, HelpCircle, Pencil, X, Download } from 'lucide-react';
import { useDownload } from '@/hooks/useDownload';
import { IMPETUS_APP_BASE } from '@/lib/api';
import { Badge, PageHeader, FilterSelect, MetricCard, MetricGrid, Button, ConfirmDialog, SectionHeader, DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell, EmptyState, Pagination, usePagination, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, Skeleton } from '@/components/ui';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui';
import { cn, formatCurrency, formatCurrencyFromLakhs, getFormattingConfig } from '@/lib/utils';
import { useModuleConfig } from '@/hooks/useScreenConfig';
import { parseOtbConfig } from '../data/otbTenantConfig';
import { useOtbPlan, useOtbKpiData, useOtbEditLog, useOtbSummaryView, useOtbEditRequest } from '../api/otbDashboardApi';
import { useOTBStore } from '../stores/otb.store';
import { useModulePermissions } from '@/permissions';

import type { OTBLineItem, OTBLineItemEdit } from '../types/otb.types';
import type { OtbPlanData, OtbKpiData, OtbEditLogItem, OtbSummaryView, OtbEditRequestPayload } from '../api/otbDashboardApi';

// ─── API helpers ─────────────────────────────────────────────────────────

function apiPlanToLineItem(data: OtbPlanData, podId: string): OTBLineItem {
  const hit = parseInt(data.hit ?? '1', 10) || 1;
  return {
    id: data.plan_name || data.otb_id,
    podId,
    otbNumber: data.plan_name || data.otb_id,
    brand: data.brand ?? '',
    brandLabel: data.brand ?? '',
    fashionGrade: (data.grade ?? '').toLowerCase().includes('core') ? 'core' : 'fashion',
    fashionGradeLabel: data.grade ?? '',
    hit,
    budget: data.summary?.recommended_value ?? 0,
    consumed: data.summary?.purchase_value ?? 0,
    utilization: data.summary?.utilization_pct ?? 0,
    recommendedValue: data.summary?.recommended_value ?? 0,
    purchaseValue: data.summary?.purchase_value ?? 0,
    editStatus: 'none',
    editHistory: [],
  };
}

function apiEditToLocal(item: OtbEditLogItem): OTBLineItemEdit {
  const statusMap: Record<string, OTBLineItemEdit['status']> = {
    'auto-approved': 'auto-approved',
    'auto_approved': 'auto-approved',
    'pending': 'pending',
    'approved': 'approved',
    'rejected': 'rejected',
  };
  return {
    id: item.change_id,
    timestamp: item.timestamp ?? '',
    actor: item.actor_name ?? 'Unknown',
    actorRole: item.actor_role ?? '',
    oldValue: item.old_value,
    newValue: item.new_value,
    variancePct: item.variance_pct ?? 0,
    requiresApproval: Math.abs(item.variance_pct ?? 0) > 10,
    status: statusMap[(item.status ?? '').toLowerCase()] ?? 'pending',
    approvedBy: item.approved_by ?? undefined,
  };
}

// ─── API KPI Data transforms ─────────────────────────────────────────────

function sanitizeKey(s: string): string {
  return s.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
}

function detectFormat(groupName: string, kpiName: string): KpiRow['format'] {
  const gn = groupName.toLowerCase();
  const kn = kpiName.toLowerCase();
  if (kn.includes('pct') || kn.includes('utilization')) return 'pct';
  if (kn.includes('change') || kn.includes('variance')) return 'pct';
  if (kn.includes('achievement')) return 'pct';
  if (kn.includes('discount') || kn.includes('margin')) return 'pct';
  if (kn.includes('sell-through') || kn.includes('sell through')) return 'pct';
  if (kn.includes('gmroi')) return 'decimal';
  if (kn === 'days' || kn.includes('holding days')) return 'days';
  if (kn.includes('actual cover') || kn.includes('target cover')) return 'days';
  if (gn.includes('weeks of cover') || gn.includes('cover')) return 'decimal';
  if (gn.endsWith('(u)') || kn.includes('unit') || kn.includes('stock') || kn.includes('inventory') || kn.includes('inwards') || kn.includes('otb (qty') || kn.includes('on order') || kn.includes('buy quantity') || kn.includes('carryover') || kn.includes('net otb') || kn.includes('target closing') || kn.includes('ly inventory')) return 'units';
  if (gn.endsWith('(v)') || kn.includes('value') || kn.includes('sales') || kn.includes('cogs') || kn.includes('price') || kn.includes('cost') || kn.includes('asp') || kn.includes('landed')) return 'currency';
  return 'currency';
}

function isChangeKpi(kpiName: string): boolean {
  const kn = kpiName.toLowerCase();
  return kn.includes('change over') || kn.includes('variance');
}

/** Fiscal month index: Apr=0 ... Mar=11 */
function toFiscalIdx(calMonth: number): number {
  return (calMonth - 4 + 12) % 12;
}

function toCalMonth(fiscalIdx: number): number {
  return ((fiscalIdx + 3) % 12) + 1;
}

function buildApiKpiRows(data: OtbKpiData): KpiRow[] {
  const allGroups = [...(data.otb_data ?? []), ...(data.remaining_data ?? [])];
  const rows: KpiRow[] = [];
  for (const group of allGroups) {
    const groupKey = sanitizeKey(group.group_name);
    for (const kpi of group.kpis) {
      rows.push({
        group: groupKey,
        groupLabel: group.group_name,
        kpiName: kpi.kpi_name,
        format: detectFormat(group.group_name, kpi.kpi_name),
        isRecommended: kpi.kpi_name.toLowerCase().includes('recommended'),
        isEditable: false, // per-cell from API
        isChange: isChangeKpi(kpi.kpi_name),
        dataKey: `${groupKey}__${sanitizeKey(kpi.kpi_name)}`,
        kpiId: kpi.kpi_id,
      });
    }
  }
  return rows;
}

function buildApiMonthlyData(data: OtbKpiData): MonthlyData[] {
  const months: MonthlyData[] = Array.from({ length: 12 }, () => ({}));
  const allGroups = [...(data.otb_data ?? []), ...(data.remaining_data ?? [])];
  for (const group of allGroups) {
    const groupKey = sanitizeKey(group.group_name);
    for (const kpi of group.kpis) {
      const dk = `${groupKey}__${sanitizeKey(kpi.kpi_name)}`;
      for (const m of kpi.monthly_metrics) {
        const fi = toFiscalIdx(m.month);
        if (fi >= 0 && fi < 12) months[fi]![dk] = m.monthly_total;
      }
    }
  }
  return months;
}

/** Returns sorted week numbers that have data for a given fiscal month */
function buildApiActiveWeeks(data: OtbKpiData, fiscalIdx: number): number[] {
  const calMonth = toCalMonth(fiscalIdx);
  const weekNums = new Set<number>();
  const allGroups = [...(data.otb_data ?? []), ...(data.remaining_data ?? [])];
  for (const group of allGroups) {
    for (const kpi of group.kpis) {
      const monthly = kpi.monthly_metrics.find((m) => m.month === calMonth);
      if (monthly?.weekly_metrics) {
        for (const w of monthly.weekly_metrics) weekNums.add(w.week_number);
      }
    }
  }
  return Array.from(weekNums).sort((a, b) => a - b);
}

/** Builds weekly data keyed by week_number (not array index) */
function buildApiWeeklyData(data: OtbKpiData, fiscalIdx: number): Record<number, MonthlyData> {
  const calMonth = toCalMonth(fiscalIdx);
  const allGroups = [...(data.otb_data ?? []), ...(data.remaining_data ?? [])];
  const weeks: Record<number, MonthlyData> = {};
  for (const group of allGroups) {
    const groupKey = sanitizeKey(group.group_name);
    for (const kpi of group.kpis) {
      const dk = `${groupKey}__${sanitizeKey(kpi.kpi_name)}`;
      const monthly = kpi.monthly_metrics.find((m) => m.month === calMonth);
      if (monthly?.weekly_metrics) {
        for (const w of monthly.weekly_metrics) {
          if (!weeks[w.week_number]) weeks[w.week_number] = {};
          weeks[w.week_number]![dk] = w.value;
        }
      }
    }
  }
  return weeks;
}

/** Extract the actual year for each fiscal month index from the API data. */
function buildApiFiscalYearMap(data: OtbKpiData): Record<number, number> {
  const map: Record<number, number> = {};
  const allGroups = [...(data.otb_data ?? []), ...(data.remaining_data ?? [])];
  for (const group of allGroups) {
    for (const kpi of group.kpis) {
      for (const m of kpi.monthly_metrics) {
        const fi = toFiscalIdx(m.month);
        if (!(fi in map)) map[fi] = m.year;
      }
    }
  }
  return map;
}

/** Returns sorted fiscal month indices that have data in the API response */
function buildApiActiveMonths(data: OtbKpiData): number[] {
  const indices = new Set<number>();
  const allGroups = [...(data.otb_data ?? []), ...(data.remaining_data ?? [])];
  for (const group of allGroups) {
    for (const kpi of group.kpis) {
      for (const m of kpi.monthly_metrics) {
        indices.add(toFiscalIdx(m.month));
      }
    }
  }
  return Array.from(indices).sort((a, b) => a - b);
}

function buildApiEditableMap(data: OtbKpiData): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  const allGroups = [...(data.otb_data ?? []), ...(data.remaining_data ?? [])];
  for (const group of allGroups) {
    const groupKey = sanitizeKey(group.group_name);
    for (const kpi of group.kpis) {
      const dk = `${groupKey}__${sanitizeKey(kpi.kpi_name)}`;
      for (const m of kpi.monthly_metrics) {
        map[`${dk}-${toFiscalIdx(m.month)}`] = m.is_editable;
      }
    }
  }
  return map;
}

interface ProposedInfo {
  proposed: number;
  current: number;
  status: string;
}

function buildApiProposedMap(data: OtbKpiData): Record<string, ProposedInfo> {
  const map: Record<string, ProposedInfo> = {};
  const allGroups = [...(data.otb_data ?? []), ...(data.remaining_data ?? [])];
  for (const group of allGroups) {
    const groupKey = sanitizeKey(group.group_name);
    for (const kpi of group.kpis) {
      const dk = `${groupKey}__${sanitizeKey(kpi.kpi_name)}`;
      for (const m of kpi.monthly_metrics) {
        if (m.proposed_value != null) {
          map[`${dk}-${toFiscalIdx(m.month)}`] = {
            proposed: m.proposed_value,
            current: m.monthly_total,
            status: m.approval_status ?? 'draft',
          };
        }
      }
    }
  }
  return map;
}

/** Build editable map for weekly view: "dataKey-weekIdx" → is_editable */
function buildApiWeeklyEditableMap(data: OtbKpiData, fiscalIdx: number): Record<string, boolean> {
  const calMonth = toCalMonth(fiscalIdx);
  const map: Record<string, boolean> = {};
  const allGroups = [...(data.otb_data ?? []), ...(data.remaining_data ?? [])];
  for (const group of allGroups) {
    const groupKey = sanitizeKey(group.group_name);
    for (const kpi of group.kpis) {
      const dk = `${groupKey}__${sanitizeKey(kpi.kpi_name)}`;
      const monthly = kpi.monthly_metrics.find((m) => m.month === calMonth);
      if (monthly?.weekly_metrics) {
        for (const w of monthly.weekly_metrics) {
          map[`${dk}-${w.week_number}`] = w.is_editable;
        }
      }
    }
  }
  return map;
}

/** Build proposed map for weekly view: "dataKey-weekNumber" → ProposedInfo */
function buildApiWeeklyProposedMap(data: OtbKpiData, fiscalIdx: number): Record<string, ProposedInfo> {
  const calMonth = toCalMonth(fiscalIdx);
  const map: Record<string, ProposedInfo> = {};
  const allGroups = [...(data.otb_data ?? []), ...(data.remaining_data ?? [])];
  for (const group of allGroups) {
    const groupKey = sanitizeKey(group.group_name);
    for (const kpi of group.kpis) {
      const dk = `${groupKey}__${sanitizeKey(kpi.kpi_name)}`;
      const monthly = kpi.monthly_metrics.find((m) => m.month === calMonth);
      if (monthly?.weekly_metrics) {
        for (const w of monthly.weekly_metrics) {
          if (w.proposed_value != null) {
            map[`${dk}-${w.week_number}`] = {
              proposed: w.proposed_value,
              current: w.value,
              status: w.approval_status ?? 'draft',
            };
          }
        }
      }
    }
  }
  return map;
}

// ─── Seeded random generator ────────────────────────────────────────────

function seededRandom(seed: string, index: number): number {
  let hash = 0;
  const str = seed + ':' + index;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 1000) / 1000;
}

// ─── Constants ──────────────────────────────────────────────────────────

const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'] as const;
const MONTHS_FULL = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'] as const;
const DAYS_IN_MONTH = [30, 31, 30, 31, 31, 30, 31, 30, 31, 31, 28, 31] as const;

/** Get the calendar year for a fiscal month index (0=Apr). FY starts in April. */
function getFiscalMonthYear(fiscalIdx: number): number {
  const now = new Date();
  const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  // Apr(0)–Dec(8) → fyStartYear, Jan(9)–Mar(11) → fyStartYear + 1
  return fiscalIdx < 9 ? fyStartYear : fyStartYear + 1;
}

const MONTH_OPTIONS = MONTHS.map((m, i) => ({
  value: String(i),
  label: m,
}));

// Current month index in fiscal year (0=Apr, 11=Mar).
// Fiscal year runs Apr–Mar, so calendar month 4 (Apr) → index 0, month 3 (Mar) → index 11.
function getCurrentFiscalMonthIndex(): number {
  const now = new Date();
  const calMonth = now.getMonth(); // 0-based: 0=Jan, 3=Apr
  return (calMonth - 3 + 12) % 12;  // Apr=0, May=1, …, Mar=11
}
const CURRENT_MONTH_INDEX = getCurrentFiscalMonthIndex();

// ─── Number formatting helpers ──────────────────────────────────────────

function getLocaleFmt(): Intl.NumberFormat {
  return new Intl.NumberFormat(getFormattingConfig().locale);
}
function getLocaleFmt2(): Intl.NumberFormat {
  return new Intl.NumberFormat(getFormattingConfig().locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function getCurrSym(): string {
  const { locale, currency } = getFormattingConfig();
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 })
    .format(0).replace(/[\d\s.,]/g, '').trim();
}

function fmtCurrLakhs(v: number): string {
  return formatCurrencyFromLakhs(v);
}

function fmtCurrRupees(v: number): string {
  return `${getCurrSym()}${getLocaleFmt().format(Math.round(v))}`;
}

function fmtCurrFull(v: number): string {
  return `${getCurrSym()}${getLocaleFmt2().format(v)}`;
}

function fmtUnits(v: number): string {
  return getLocaleFmt().format(Math.round(v));
}

function fmtPct(v: number): string {
  return `${v.toFixed(1)}%`;
}

/** Percentage with 2 decimals */
function fmtPct2(v: number): string {
  return `${getLocaleFmt2().format(v)}%`;
}

function fmtDecimal(v: number): string {
  return v.toFixed(1);
}

// ─── KPI Row Definitions ────────────────────────────────────────────────

interface KpiRow {
  group: string;
  groupLabel: string;
  kpiName: string;
  format: 'currencyLakhs' | 'currencyRupees' | 'currency' | 'units' | 'pct' | 'decimal' | 'days';
  isRecommended?: boolean;
  isEditable?: boolean;
  isChange?: boolean;
  dataKey: string;
  kpiId?: string;
}

const KPI_ROWS: KpiRow[] = [
  // OTB (3 rows)
  { group: 'otb', groupLabel: 'OTB', kpiName: 'OTB Value', format: 'currencyLakhs', dataKey: 'otbValue' },
  { group: 'otb', groupLabel: 'OTB', kpiName: 'Recommended Value', format: 'currencyLakhs', isRecommended: true, dataKey: 'recommendedValue' },
  { group: 'otb', groupLabel: 'OTB', kpiName: 'Purchase Value', format: 'currencyLakhs', isEditable: true, dataKey: 'purchaseValue' },

  // Net Revenue (V) (5 rows)
  { group: 'netSales', groupLabel: 'Net Revenue (V)', kpiName: 'CY Net Revenue', format: 'currencyLakhs', dataKey: 'cyNetSales' },
  { group: 'netSales', groupLabel: 'Net Revenue (V)', kpiName: 'LY Net Revenue', format: 'currencyLakhs', dataKey: 'lyNetSales' },
  { group: 'netSales', groupLabel: 'Net Revenue (V)', kpiName: 'AOP Net Revenue', format: 'currencyLakhs', dataKey: 'aopNetSales' },
  { group: 'netSales', groupLabel: 'Net Revenue (V)', kpiName: 'Change over LY', format: 'pct', isChange: true, dataKey: 'netSalesChangeLY' },
  { group: 'netSales', groupLabel: 'Net Revenue (V)', kpiName: 'Achievement against AOP', format: 'pct', dataKey: 'netSalesAchievementAOP' },

  // Unit Sales (U) (5 rows)
  { group: 'unitSales', groupLabel: 'Unit Sales (U)', kpiName: 'CY Unit Sales', format: 'units', dataKey: 'cyUnitSales' },
  { group: 'unitSales', groupLabel: 'Unit Sales (U)', kpiName: 'LY Unit Sales', format: 'units', dataKey: 'lyUnitSales' },
  { group: 'unitSales', groupLabel: 'Unit Sales (U)', kpiName: 'AOP Unit Sales', format: 'units', dataKey: 'aopUnitSales' },
  { group: 'unitSales', groupLabel: 'Unit Sales (U)', kpiName: 'Change over LY', format: 'pct', isChange: true, dataKey: 'unitSalesChangeLY' },
  { group: 'unitSales', groupLabel: 'Unit Sales (U)', kpiName: 'Achievement against AOP', format: 'pct', dataKey: 'unitSalesAchievementAOP' },

  // Actual Selling Price (V) (2 rows)
  { group: 'asp', groupLabel: 'Actual Selling Price (V)', kpiName: 'CY Actual Selling Price', format: 'currencyRupees', dataKey: 'cyASP' },
  { group: 'asp', groupLabel: 'Actual Selling Price (V)', kpiName: 'LY Actual Selling Price', format: 'currencyRupees', dataKey: 'lyASP' },

  // Discount % (2 rows)
  { group: 'discount', groupLabel: 'Discount %', kpiName: 'CY Average Discount', format: 'pct', dataKey: 'cyDiscount' },
  { group: 'discount', groupLabel: 'Discount %', kpiName: 'LY Average Discount', format: 'pct', dataKey: 'lyDiscount' },

  // Inventory Units (U) (6 rows)
  { group: 'inventory', groupLabel: 'Inventory Units (U)', kpiName: 'Opening Stock', format: 'units', dataKey: 'openingStock' },
  { group: 'inventory', groupLabel: 'Inventory Units (U)', kpiName: 'Target Inventory', format: 'units', dataKey: 'targetInventory' },
  { group: 'inventory', groupLabel: 'Inventory Units (U)', kpiName: 'LY Inventory', format: 'units', dataKey: 'lyInventory' },
  { group: 'inventory', groupLabel: 'Inventory Units (U)', kpiName: 'Change over LY', format: 'pct', isChange: true, dataKey: 'inventoryChangeLY' },
  { group: 'inventory', groupLabel: 'Inventory Units (U)', kpiName: 'Actual Cover', format: 'days', dataKey: 'actualCover' },
  { group: 'inventory', groupLabel: 'Inventory Units (U)', kpiName: 'Target Cover', format: 'days', dataKey: 'targetCover' },

  // Weeks of Cover (3 rows)
  { group: 'woc', groupLabel: 'Weeks of Cover', kpiName: 'CY', format: 'decimal', dataKey: 'cyWoC' },
  { group: 'woc', groupLabel: 'Weeks of Cover', kpiName: 'LY', format: 'decimal', dataKey: 'lyWoC' },
  { group: 'woc', groupLabel: 'Weeks of Cover', kpiName: 'Cover Variance', format: 'decimal', isChange: true, dataKey: 'coverVariance' },

  // Inwards (U) (3 rows)
  { group: 'inwards', groupLabel: 'Inwards (U)', kpiName: 'Planned Inwards', format: 'units', dataKey: 'plannedInwards' },
  { group: 'inwards', groupLabel: 'Inwards (U)', kpiName: 'Additional Inwards', format: 'units', dataKey: 'additionalInwards' },
  { group: 'inwards', groupLabel: 'Inwards (U)', kpiName: 'OTB (Qty.)', format: 'units', dataKey: 'otbQty' },

  // Inventory COGS (V) (3 rows)
  { group: 'invCogs', groupLabel: 'Inventory COGS (V)', kpiName: 'Opening Inventory COGS', format: 'currencyLakhs', dataKey: 'openingInvCOGS' },
  { group: 'invCogs', groupLabel: 'Inventory COGS (V)', kpiName: 'LY Inventory COGS', format: 'currencyLakhs', dataKey: 'lyInvCOGS' },
  { group: 'invCogs', groupLabel: 'Inventory COGS (V)', kpiName: 'Change over LY', format: 'pct', isChange: true, dataKey: 'invCOGSChangeLY' },

  // CY COGS (1 row)
  { group: 'cyCogs', groupLabel: 'CY COGS', kpiName: 'CY COGS', format: 'currencyLakhs', dataKey: 'cyCOGS' },

  // Margin (2 rows)
  { group: 'margin', groupLabel: 'Margin', kpiName: 'Margin', format: 'pct', isEditable: true, dataKey: 'margin' },
  { group: 'margin', groupLabel: 'Margin', kpiName: 'Change over LY', format: 'pct', isChange: true, dataKey: 'marginChangeLY' },
];

// ─── Mock Data Generation ───────────────────────────────────────────────

interface MonthlyData {
  [key: string]: number;
}

function generateMonthlyData(lineItem: OTBLineItem): MonthlyData[] {
  const seed = lineItem.id;
  const months: MonthlyData[] = [];

  for (let m = 0; m < 12; m++) {
    const data: MonthlyData = {};
    const sr = (idx: number) => seededRandom(seed, m * 100 + idx);

    // Festival season multiplier (Oct=6, Nov=7 in 0-indexed)
    const festivalMult = m === 6 ? 1.6 : m === 7 ? 1.5 : m === 8 ? 1.3 : 1.0;
    // Budget for this line item, spread across months
    const monthBudgetBase = lineItem.budget / 12;

    // OTB
    const otbValue = monthBudgetBase * (0.7 + sr(0) * 0.6) * festivalMult;
    data['otbValue'] = otbValue;
    data['recommendedValue'] = otbValue * (0.85 + sr(1) * 0.3);
    data['purchaseValue'] = otbValue * (0.8 + sr(2) * 0.35);

    // Net Revenue (in Lakhs): ₹30-300 L per month
    const cyNetSales = (30 + sr(3) * 270) * festivalMult;
    const lyNetSales = cyNetSales * (0.85 + sr(4) * 0.10); // LY is 85-95% of CY
    const aopNetSales = cyNetSales * (0.95 + sr(5) * 0.10); // AOP is 95-105% of CY
    data['cyNetSales'] = cyNetSales;
    data['lyNetSales'] = lyNetSales;
    data['aopNetSales'] = aopNetSales;
    data['netSalesChangeLY'] = ((cyNetSales - lyNetSales) / lyNetSales) * 100;
    data['netSalesAchievementAOP'] = (cyNetSales / aopNetSales) * 100;

    // Unit Sales: 1,500-15,000 per month
    const cyUnitSales = Math.round((1500 + sr(6) * 13500) * festivalMult);
    const lyUnitSales = Math.round(cyUnitSales * (0.85 + sr(7) * 0.10));
    const aopUnitSales = Math.round(cyUnitSales * (0.95 + sr(8) * 0.10));
    data['cyUnitSales'] = cyUnitSales;
    data['lyUnitSales'] = lyUnitSales;
    data['aopUnitSales'] = aopUnitSales;
    data['unitSalesChangeLY'] = ((cyUnitSales - lyUnitSales) / lyUnitSales) * 100;
    data['unitSalesAchievementAOP'] = (cyUnitSales / aopUnitSales) * 100;

    // ASP: ₹500-₹2,500
    const cyASP = 500 + sr(9) * 2000;
    data['cyASP'] = cyASP;
    data['lyASP'] = cyASP * (0.92 + sr(10) * 0.08);

    // Discount: 8-30% (higher towards end of season)
    const seasonDiscount = m >= 9 ? 10 : m >= 6 ? 5 : 0; // higher in Jan-Mar
    data['cyDiscount'] = 8 + sr(11) * 15 + seasonDiscount;
    data['lyDiscount'] = 8 + sr(12) * 15 + seasonDiscount * 0.8;

    // Inventory: 5,000-50,000 units
    const openingStock = Math.round(5000 + sr(13) * 45000);
    const targetInventory = Math.round(openingStock * (0.9 + sr(14) * 0.2));
    const lyInventory = Math.round(openingStock * (0.85 + sr(15) * 0.10));
    data['openingStock'] = openingStock;
    data['targetInventory'] = targetInventory;
    data['lyInventory'] = lyInventory;
    data['inventoryChangeLY'] = ((openingStock - lyInventory) / lyInventory) * 100;
    data['actualCover'] = Math.round(20 + sr(16) * 25);
    data['targetCover'] = Math.round(25 + sr(17) * 15);

    // Weeks of Cover: 3-10
    const cyWoC = 3 + sr(18) * 7;
    const lyWoC = 3 + sr(19) * 7;
    data['cyWoC'] = cyWoC;
    data['lyWoC'] = lyWoC;
    data['coverVariance'] = cyWoC - lyWoC;

    // Inwards
    data['plannedInwards'] = Math.round(2000 + sr(20) * 8000);
    data['additionalInwards'] = Math.round(sr(21) * 2000);
    data['otbQty'] = Math.round(data['plannedInwards']! + data['additionalInwards']!);

    // Inventory COGS (in Lakhs)
    const openingInvCOGS = cyNetSales * (0.55 + sr(22) * 0.15);
    const lyInvCOGS = openingInvCOGS * (0.85 + sr(23) * 0.10);
    data['openingInvCOGS'] = openingInvCOGS;
    data['lyInvCOGS'] = lyInvCOGS;
    data['invCOGSChangeLY'] = ((openingInvCOGS - lyInvCOGS) / lyInvCOGS) * 100;

    // CY COGS
    data['cyCOGS'] = cyNetSales * (0.58 + sr(24) * 0.12);

    // Margin: 14-24%
    const margin = 14 + sr(25) * 10;
    const lyMargin = 14 + sr(26) * 10;
    data['margin'] = margin;
    data['marginChangeLY'] = margin - lyMargin;

    months.push(data);
  }

  return months;
}

// ─── Format value by type ───────────────────────────────────────────────

function formatValue(value: number, format: KpiRow['format']): string {
  switch (format) {
    case 'currencyLakhs':
      return fmtCurrLakhs(value);
    case 'currencyRupees':
      return fmtCurrRupees(value);
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

/** Format a raw input string: strip non-numeric, re-format with Indian commas */
function formatInputValue(raw: string): string {
  // Allow digits and a single decimal point
  const cleaned = raw.replace(/[^\d.]/g, '');
  // Split by decimal to preserve fractional part
  const parts = cleaned.split('.');
  const intPart = parts[0] ?? '';
  const decPart = parts.length > 1 ? parts[1] : undefined;
  if (!intPart && decPart === undefined) return '';
  // Format integer part with Indian grouping
  const num = parseInt(intPart || '0', 10);
  const formatted = isNaN(num) ? '0' : getLocaleFmt().format(num);
  if (decPart !== undefined) return `${formatted}.${decPart}`;
  return formatted;
}

/** Format for editable inputs — plain number without currency symbols */
function formatValueRaw(value: number, format: KpiRow['format']): string {
  switch (format) {
    case 'currencyLakhs':
    case 'currencyRupees':
    case 'currency':
      return getLocaleFmt().format(Math.round(value));
    case 'units':
      return fmtUnits(value);
    case 'pct':
      return fmtPct(value);
    case 'decimal':
      return fmtDecimal(value);
    case 'days':
      return `${Math.round(value)}d`;
    default:
      return String(value);
  }
}

// ─── Variance helpers ────────────────────────────────────────────────────

function varianceColor(pct: number): string {
  if (Math.abs(pct) <= 10) return 'text-success';
  if (Math.abs(pct) <= 20) return 'text-warning';
  return 'text-error';
}

function formatVariance(pct: number): string {
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

// ─── Edit Status Badge ───────────────────────────────────────────────────

function EditStatusBadge({ status }: { status: OTBLineItemEdit['status'] }) {
  switch (status) {
    case 'auto-approved':
      return <Badge variant="default" size="sm">Auto-approved</Badge>;
    case 'pending':
      return <Badge variant="warning" size="sm">Pending</Badge>;
    case 'approved':
      return <Badge variant="success" size="sm">Approved</Badge>;
    case 'rejected':
      return <Badge variant="error" size="sm">Rejected</Badge>;
  }
}

// ─── Edit Log Section ────────────────────────────────────────────────────

function EditLogSection({ editHistory, useRawCurrency }: { editHistory: OTBLineItemEdit[]; useRawCurrency?: boolean }) {
  const [expanded, setExpanded] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredEdits = useMemo(() => {
    const sorted = [...editHistory].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    if (statusFilter === 'all') return sorted;
    return sorted.filter((e) => e.status === statusFilter);
  }, [editHistory, statusFilter]);

  const statusOptions = ['all', 'auto-approved', 'pending', 'approved', 'rejected'] as const;

  const { totalPages, totalItems, pageSize, getPageItems } = usePagination(filteredEdits, 10);
  const pageItems = getPageItems(currentPage);

  if (editHistory.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded); } }}
        className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <SectionHeader
          title="Edit Log"
          actions={
            <span className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{editHistory.length} {editHistory.length === 1 ? 'edit' : 'edits'}</span>
              {expanded
                ? <ChevronDown className="w-4 h-4 text-gray-400" />
                : <ChevronRight className="w-4 h-4 text-gray-400" />
              }
            </span>
          }
          className="mb-0"
        />
      </div>

      {expanded && (
        <>
          {/* Status filter */}
          <div className="px-4 pt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Status:</span>
              <div className="flex gap-1">
                {statusOptions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                    className={cn(
                      'px-2 py-1 text-xs rounded font-medium transition-colors capitalize',
                      statusFilter === s
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {s === 'all' ? 'All' : s.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredEdits.length === 0 ? (
            <div className="p-4">
              <EmptyState description="No edits match the selected filter" />
            </div>
          ) : (
            <>
              <DataTable>
                <DataTableHeader>
                  <DataTableHead>Timestamp</DataTableHead>
                  <DataTableHead>Actor</DataTableHead>
                  <DataTableHead align="right">Old Value</DataTableHead>
                  <DataTableHead align="right">New Value</DataTableHead>
                  <DataTableHead align="right">Variance</DataTableHead>
                  <DataTableHead align="center">Status</DataTableHead>
                  <DataTableHead>Approved By</DataTableHead>
                </DataTableHeader>
                <DataTableBody>
                  {pageItems.map((edit) => (
                    <DataTableRow key={edit.id}>
                      <DataTableCell className="text-xs text-gray-500 whitespace-nowrap">
                        {edit.timestamp}
                      </DataTableCell>
                      <DataTableCell>
                        <div>
                          <span className="text-sm text-gray-900">{edit.actor}</span>
                          <span className="block text-xs text-gray-500">{edit.actorRole}</span>
                        </div>
                      </DataTableCell>
                      <DataTableCell align="right">
                        <span className="text-red-600 text-xs">{useRawCurrency ? formatCurrency(edit.oldValue) : formatCurrencyFromLakhs(edit.oldValue)}</span>
                      </DataTableCell>
                      <DataTableCell align="right">
                        <span className="text-green-600 text-xs">{useRawCurrency ? formatCurrency(edit.newValue) : formatCurrencyFromLakhs(edit.newValue)}</span>
                      </DataTableCell>
                      <DataTableCell align="right" className={cn('font-medium text-xs', varianceColor(edit.variancePct))}>
                        {formatVariance(edit.variancePct)}
                      </DataTableCell>
                      <DataTableCell align="center">
                        <EditStatusBadge status={edit.status} />
                      </DataTableCell>
                      <DataTableCell className="text-xs text-gray-500">
                        {edit.approvedBy ?? '-'}
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
              {totalPages > 1 && (
                <div className="px-4 pb-3">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={totalItems}
                    pageSize={pageSize}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── OTB Calculation Breakdown Popover ──────────────────────────────────

function findDataKeyByKpiName(kpiRows: KpiRow[], namePart: string): string | null {
  const lower = namePart.toLowerCase();
  const row = kpiRows.find(r => r.kpiName.toLowerCase().includes(lower));
  return row?.dataKey ?? null;
}

function isRecommendedRow(row: KpiRow): boolean {
  return !!row.isRecommended;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${MONTH_NAMES[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`;
}

function OTBBreakdownPopover({ breakdown, otbConfig }: { breakdown: OtbSummaryView['otb_code_breakdown']; otbConfig: import('../data/otbTenantConfig').OtbModuleConfig }) {
  const l1Label = otbConfig.hierarchy.level1.label;
  const l2Label = otbConfig.hierarchy.level2.label;
  const rows = [
    { label: 'Brand', value: breakdown.brand },
    { label: l1Label, value: breakdown.segment },
    { label: 'Fashion Grade', value: breakdown.fashion_grade },
    { label: l2Label, value: breakdown.family },
    { label: 'Season', value: breakdown.season_name },
    { label: 'Year', value: breakdown.season_year },
    { label: 'Hit', value: breakdown.hit },
    { label: 'Purchase Group', value: breakdown.purchase_group },
  ].filter((r) => r.value != null);

  return (
    <div className="absolute top-full left-0 mt-1.5 z-50 bg-gray-900 text-white rounded-lg shadow-xl w-[340px] p-4">
      <h4 className="text-sm font-semibold mb-3">OTB Number Breakdown</h4>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between text-sm">
            <span className="text-gray-400">{r.label}:</span>
            <span className="font-medium text-right">
              {r.value!.display_name
                ? `${r.value!.display_name}(${r.value!.code})`
                : r.value!.code}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalcBreakdownCell({
  value,
  format,
  colIndex,
  calcPopoverCol,
  setCalcPopoverCol,
  monthData,
  effectiveKpiRows,
}: {
  value: number;
  format: KpiRow['format'];
  colIndex: number;
  calcPopoverCol: number | null;
  setCalcPopoverCol: (v: number | null) => void;
  monthData: MonthlyData | undefined;
  effectiveKpiRows: KpiRow[];
}) {
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout>>(null);

  const handleOpen = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setCalcPopoverCol(colIndex);
  }, [colIndex, setCalcPopoverCol]);

  const handleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setCalcPopoverCol(null), 150);
  }, [setCalcPopoverCol]);

  return (
    <span className="inline-flex items-center gap-1.5">
      {formatValue(value, format)}
      <span
        className="shrink-0"
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
      >
        <button ref={triggerRef} type="button" className="cursor-help">
          <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 transition-colors" />
        </button>
      </span>
      {calcPopoverCol === colIndex && (
        <OTBCalcPopover
          colData={monthData ?? {}}
          kpiRows={effectiveKpiRows}
          onClose={handleClose}
          onEnter={handleOpen}
          triggerRef={triggerRef}
        />
      )}
    </span>
  );
}

function OTBCalcPopover({
  colData,
  kpiRows,
  onClose,
  onEnter,
  triggerRef,
}: {
  colData: MonthlyData;
  kpiRows: KpiRow[];
  onClose: () => void;
  onEnter: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  React.useEffect(() => {
    function updatePosition() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = 420;
      let left = rect.left + rect.width / 2 - popoverWidth / 2;
      // Keep within viewport
      if (left < 8) left = 8;
      if (left + popoverWidth > window.innerWidth - 8) left = window.innerWidth - 8 - popoverWidth;
      setPos({ top: rect.bottom + 6, left });
    }
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [triggerRef]);

  const rawOtbCfg = useModuleConfig<Record<string, unknown>>('otb');
  const formulaType = useMemo(() => parseOtbConfig(rawOtbCfg).otb_formula, [rawOtbCfg]);

  // ── FNL KPIs ──
  const targetInvKey = findDataKeyByKpiName(kpiRows, 'target inventory');
  const openingStockKey = findDataKeyByKpiName(kpiRows, 'opening stock') ?? findDataKeyByKpiName(kpiRows, 'closing stock');
  const cyCOGSKey = findDataKeyByKpiName(kpiRows, 'cy cogs');
  const aopUnitSalesKey = findDataKeyByKpiName(kpiRows, 'aop unit sales') ?? findDataKeyByKpiName(kpiRows, 'cy unit sales');
  const forecastQtyKey = findDataKeyByKpiName(kpiRows, 'forecasting quantity') ?? findDataKeyByKpiName(kpiRows, 'predicted');

  const targetInventory = targetInvKey ? (colData[targetInvKey] ?? 0) : 0;
  const openingStock = openingStockKey ? (colData[openingStockKey] ?? 0) : 0;
  const cyCOGS = cyCOGSKey ? (colData[cyCOGSKey] ?? 0) : 0;
  const aopSales = aopUnitSalesKey ? (colData[aopUnitSalesKey] ?? 0) : 0;
  const forecastedSales = forecastQtyKey ? (colData[forecastQtyKey] ?? 0) : 0;

  const otbInwards = Math.max(0, Math.round(targetInventory + aopSales - openingStock));
  const fnlOtbValue = otbInwards * cyCOGS;
  const recInwards = Math.max(0, Math.round(targetInventory + (forecastedSales === 0 ? aopSales : forecastedSales) - openingStock));
  const fnlRecValue = recInwards * cyCOGS;

  // ── RBL KPIs: OTB Value = Buy Quantity × Landed Cost Per Unit ──
  const buyQtyKey = findDataKeyByKpiName(kpiRows, 'buy quantity');
  const landedCostKey = findDataKeyByKpiName(kpiRows, 'landed cost');

  const rblBuyQty = buyQtyKey ? (colData[buyQtyKey] ?? 0) : 0;
  const rblLandedCost = landedCostKey ? (colData[landedCostKey] ?? 0) : 0;
  const rblOtbValue = rblBuyQty * rblLandedCost;

  if (!pos) return null;

  const fmt = (v: number) => getLocaleFmt().format(Math.round(v));

  const popoverContent = formulaType === 'rbl' ? (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left font-semibold text-gray-900 px-3 py-2"></th>
          <th className="text-right font-semibold text-gray-900 px-3 py-2">OTB Value</th>
          <th className="text-right font-semibold text-gray-900 px-3 py-2">Recommended</th>
        </tr>
      </thead>
      <tbody className="text-gray-600">
        <tr>
          <td className="px-3 py-1.5">Buy Quantity</td>
          <td className="text-right px-3 py-1.5 font-medium text-gray-900">{fmt(rblBuyQty)}</td>
          <td className="text-right px-3 py-1.5 font-medium text-gray-900">{fmt(rblBuyQty)}</td>
        </tr>
        <tr>
          <td className="px-3 py-1.5">Landed Cost Per Unit</td>
          <td className="text-right px-3 py-1.5 font-medium text-gray-900">&times; {fmtCurrFull(rblLandedCost)}</td>
          <td className="text-right px-3 py-1.5 font-medium text-gray-900">&times; {fmtCurrFull(rblLandedCost)}</td>
        </tr>
        <tr className="border-t border-gray-200">
          <td className="px-3 py-2 font-semibold text-primary">Total Value</td>
          <td className="text-right px-3 py-2 font-semibold text-primary">{fmtCurrFull(rblOtbValue)}</td>
          <td className="text-right px-3 py-2 font-semibold text-primary">{fmtCurrFull(rblOtbValue)}</td>
        </tr>
      </tbody>
    </table>
  ) : (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left font-semibold text-gray-900 px-3 py-2"></th>
          <th className="text-right font-semibold text-gray-900 px-3 py-2">OTB Value</th>
          <th className="text-right font-semibold text-gray-900 px-3 py-2">Recommended</th>
        </tr>
      </thead>
      <tbody className="text-gray-600">
        <tr>
          <td className="px-3 py-1.5">Target Inventory</td>
          <td className="text-right px-3 py-1.5 font-medium text-gray-900">{fmt(targetInventory)}</td>
          <td className="text-right px-3 py-1.5 font-medium text-gray-900">{fmt(targetInventory)}</td>
        </tr>
        <tr>
          <td className="px-3 py-1.5">AOP Sales Qty</td>
          <td className="text-right px-3 py-1.5 font-medium text-gray-900">+ {fmt(aopSales)}</td>
          <td className="text-right px-3 py-1.5 text-gray-400">--</td>
        </tr>
        <tr>
          <td className="px-3 py-1.5">
            <span className="inline-flex items-center gap-1">
              Forecasting Qty
              {forecastedSales === 0 && (
                <span className="relative group">
                  <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 touch:opacity-100 transition-opacity pointer-events-none z-50">
                    Forecast value is 0 so we are adding here AOP sales Qty
                  </span>
                </span>
              )}
            </span>
          </td>
          <td className="text-right px-3 py-1.5 text-gray-400">--</td>
          <td className="text-right px-3 py-1.5 font-medium text-gray-900">
            + {fmt(forecastedSales === 0 ? aopSales : forecastedSales)}
          </td>
        </tr>
        <tr>
          <td className="px-3 py-1.5">Opening Stock</td>
          <td className="text-right px-3 py-1.5 font-medium text-gray-900">- {fmt(openingStock)}</td>
          <td className="text-right px-3 py-1.5 font-medium text-gray-900">- {fmt(openingStock)}</td>
        </tr>
        <tr className="border-t border-gray-200 font-medium text-gray-900">
          <td className="px-3 py-1.5">Inwards (units)</td>
          <td className="text-right px-3 py-1.5">{fmt(otbInwards)}</td>
          <td className="text-right px-3 py-1.5">{fmt(recInwards)}</td>
        </tr>
        <tr>
          <td className="px-3 py-1.5">CY COGS</td>
          <td className="text-right px-3 py-1.5 font-medium text-gray-900">&times; {fmtCurrFull(cyCOGS)}</td>
          <td className="text-right px-3 py-1.5 font-medium text-gray-900">&times; {fmtCurrFull(cyCOGS)}</td>
        </tr>
        <tr className="border-t border-gray-200">
          <td className="px-3 py-2 font-semibold text-primary">Total Value</td>
          <td className="text-right px-3 py-2 font-semibold text-primary">{fmtCurrFull(fnlOtbValue)}</td>
          <td className="text-right px-3 py-2 font-semibold text-primary">{fmtCurrFull(fnlRecValue)}</td>
        </tr>
      </tbody>
    </table>
  );

  return ReactDOM.createPortal(
    <div
      className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-gray-200 w-[420px]"
      // eslint-disable-next-line no-restricted-syntax -- dynamic portal positioning requires inline style
      style={{ top: pos.top, left: pos.left }}
      onMouseEnter={onEnter}
      onMouseLeave={onClose}
    >
      {popoverContent}
    </div>,
    document.body,
  );
}

// ─── Page Component ─────────────────────────────────────────────────────

const OTB_SHEET_DOWNLOAD_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'X-Tenant-ID': 'reliance_fnl',
  'X-Org-ID': '5331f8af-b091-cb9f-e2a4-d247f2acaf16',
};

export function OTBCalculationSheetPage() {
  const { podId, otbId } = useParams<{ podId: string; otbId: string }>();
  const [searchParams] = useSearchParams();
  const apiOtbId = searchParams.get('otb_id'); // UUID for API call
  const { download, isDownloading } = useDownload(IMPETUS_APP_BASE);
  const fiscalYear = useOTBStore((s) => s.fiscalYear);
  const { edit: canEdit } = useModulePermissions('otb');

  // Build filter-preserved breadcrumb links
  const podDetailLink = (() => {
    const p = new URLSearchParams(searchParams);
    p.delete('otb_id'); // otb_id is sheet-specific, not for pod
    const qs = p.toString();
    return `/otb/pod/${podId}${qs ? `?${qs}` : ''}`;
  })();

  // Determine if the entire FY is still in the future (i.e. we haven't reached Apr of the FY yet).
  // fiscalYear format: "FY 2026-27" → FY starts Apr 2026.
  const isFYFuture = useMemo(() => {
    const match = fiscalYear.match(/(\d{4})/);
    if (!match) return false;
    const fyStartYear = parseInt(match[1]!, 10);
    const now = new Date();
    // FY starts on Apr 1 of fyStartYear
    const fyStart = new Date(fyStartYear, 3, 1); // month 3 = April
    return now < fyStart;
  }, [fiscalYear]);

  const allLineItems = useOTBStore((s) => s.lineItems);
  const updatePurchaseValue = useOTBStore((s) => s.updatePurchaseValue);
  const approveEdit = useOTBStore((s) => s.approveEdit);
  const rejectEdit = useOTBStore((s) => s.rejectEdit);

  // Find the line item from store (match by id or otbNumber since API plan_name maps to otbNumber)
  const mockLineItem = useMemo(
    () => allLineItems.find((item) => item.id === otbId || item.otbNumber === otbId),
    [allLineItems, otbId],
  );

  // ── API fallback: fetch plan detail via React Query when mock data not found ──
  const planId = apiOtbId || otbId || '';
  const shouldFetchApi = !mockLineItem;

  const rawOtbConfig = useModuleConfig<Record<string, unknown>>('otb');
  const otbConfig = useMemo(() => parseOtbConfig(rawOtbConfig), [rawOtbConfig]);
  const isSeasonal = otbConfig.seasonal;

  // Parse hierarchy from podId (format: "42-4207") for breadcrumbs
  const [segment, family] = (podId ?? '').split('-');
  const l1Label = otbConfig.hierarchy.level1.label;
  const l2Label = otbConfig.hierarchy.level2.label;
  const segmentFamilyLabel = segment && family
    ? `${l1Label} ${segment} \u2014 ${l2Label} ${family}`
    : 'Unknown POD';
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly' | 'season'>('monthly');

  const { data: planQueryData, isLoading: planLoading } = useOtbPlan(planId, shouldFetchApi);
  const { data: kpiQueryData, isLoading: kpiLoading } = useOtbKpiData(planId, shouldFetchApi, viewMode === 'season' ? 'season' : undefined);
  const { data: editLogQueryData, isLoading: editLogLoading } = useOtbEditLog(planId, shouldFetchApi);
  const { data: summaryQueryData, isLoading: summaryLoading } = useOtbSummaryView(planId, shouldFetchApi);
  const editRequestMutation = useOtbEditRequest(planId);

  const apiLoading = shouldFetchApi && (planLoading || kpiLoading || editLogLoading || summaryLoading);

  // Derive API line item from plan data
  const apiLineItem = useMemo<OTBLineItem | null>(() => {
    if (!planQueryData) return null;
    return apiPlanToLineItem(planQueryData, podId ?? '');
  }, [planQueryData, podId]);

  // Derive API edit history from edit log data
  const apiEditHistory = useMemo<OTBLineItemEdit[]>(() => {
    if (!editLogQueryData?.items) return [];
    return editLogQueryData.items.map(apiEditToLocal);
  }, [editLogQueryData]);

  // Derive KPI data and summary view from React Query responses
  const apiKpiData = kpiQueryData ?? null;
  const summaryView = summaryQueryData ?? null;

  // Effective line item: prefer mock data, fall back to API
  const lineItem = mockLineItem ?? apiLineItem;
  const effectiveEditHistory = mockLineItem ? mockLineItem.editHistory : apiEditHistory;
  const isFromApi = !mockLineItem && !!apiLineItem;

  const [selectedMonth, setSelectedMonth] = useState('0'); // Index into MONTHS

  // Edit mode & editable cells state: key = `${dataKey}-${colIndex}`
  const [isEditing, setIsEditing] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [calcPopoverCol, setCalcPopoverCol] = useState<number | null>(null);

  // ── KPI rows & data: API-driven or mock ──
  const effectiveKpiRows = useMemo(() => {
    if (isFromApi && apiKpiData) return buildApiKpiRows(apiKpiData);
    return KPI_ROWS;
  }, [isFromApi, apiKpiData]);

  const monthlyData = useMemo(() => {
    if (isFromApi && apiKpiData && viewMode !== 'season') return buildApiMonthlyData(apiKpiData);
    if (!lineItem) return [];
    if (viewMode === 'season') return [];
    return generateMonthlyData(lineItem);
  }, [isFromApi, apiKpiData, lineItem, viewMode]);

  const weeklyData = useMemo<Record<number, MonthlyData>>(() => {
    if (!lineItem || viewMode !== 'weekly') return {};
    const monthIdx = parseInt(selectedMonth, 10);
    if (isFromApi && apiKpiData) return buildApiWeeklyData(apiKpiData, monthIdx);
    // Mock weekly data
    const daysCount = DAYS_IN_MONTH[monthIdx]!;
    const weekCount = Math.ceil(daysCount / 7);
    const monthData = monthlyData[monthIdx];
    if (!monthData) return {};
    const weeks: Record<number, MonthlyData> = {};
    for (let w = 0; w < weekCount; w++) {
      const week: MonthlyData = {};
      const daysInThisWeek = w === weekCount - 1 ? daysCount - w * 7 : 7;
      for (const key of Object.keys(monthData)) {
        const monthVal = monthData[key]!;
        const weekBase = (monthVal / daysCount) * daysInThisWeek;
        const variation = 0.88 + seededRandom(lineItem.id + ':wk', w * 50 + Object.keys(monthData).indexOf(key)) * 0.24;
        week[key] = weekBase * variation;
      }
      weeks[w] = week;
    }
    return weeks;
  }, [lineItem, viewMode, selectedMonth, monthlyData, isFromApi, apiKpiData]);

  // API editable map: uses monthly or weekly is_editable based on view mode
  const apiEditableMap = useMemo(() => {
    if (!isFromApi || !apiKpiData) return {};
    if (viewMode === 'weekly') {
      return buildApiWeeklyEditableMap(apiKpiData, parseInt(selectedMonth, 10));
    }
    return buildApiEditableMap(apiKpiData);
  }, [isFromApi, apiKpiData, viewMode, selectedMonth]);

  // API proposed values map: uses monthly or weekly proposed_value based on view mode
  const apiProposedMap = useMemo(() => {
    if (!isFromApi || !apiKpiData) return {};
    if (viewMode === 'weekly') {
      return buildApiWeeklyProposedMap(apiKpiData, parseInt(selectedMonth, 10));
    }
    return buildApiProposedMap(apiKpiData);
  }, [isFromApi, apiKpiData, viewMode, selectedMonth]);

  // Fiscal year map from API data (fiscal index → actual year)
  const apiFiscalYearMap = useMemo(() => {
    if (isFromApi && apiKpiData) return buildApiFiscalYearMap(apiKpiData);
    return {};
  }, [isFromApi, apiKpiData]);

  // Active fiscal month indices from API data
  const apiActiveMonths = useMemo(() => {
    if (isFromApi && apiKpiData) return buildApiActiveMonths(apiKpiData);
    return null;
  }, [isFromApi, apiKpiData]);

  // Build season data from seasonal_metrics when in season view
  const seasonData = useMemo<Record<number, MonthlyData>>(() => {
    if (viewMode !== 'season' || !isFromApi || !apiKpiData) return {};
    const allGroups = [...(apiKpiData.otb_data ?? []), ...(apiKpiData.remaining_data ?? [])];
    const data: Record<number, MonthlyData> = {};
    const seasons = apiKpiData.available_seasons ?? [];
    for (let si = 0; si < seasons.length; si++) {
      data[si] = {};
    }
    for (const group of allGroups) {
      const groupKey = sanitizeKey(group.group_name);
      for (const kpi of group.kpis) {
        const dk = `${groupKey}__${sanitizeKey(kpi.kpi_name)}`;
        const metrics = (kpi as unknown as Record<string, unknown>).seasonal_metrics as { season: string; total: number }[] | undefined;
        if (metrics) {
          for (const m of metrics) {
            const si = seasons.indexOf(m.season);
            if (si >= 0 && data[si]) {
              data[si]![dk] = m.total;
            }
          }
        }
      }
    }
    return data;
  }, [viewMode, isFromApi, apiKpiData]);

  // Determine columns — only show months that have data from API
  const columns = useMemo(() => {
    if (viewMode === 'season') {
      const seasons = apiKpiData?.available_seasons ?? [];
      return seasons.map((s, i) => ({ label: s, index: i }));
    }
    if (viewMode === 'monthly') {
      if (isFromApi && apiActiveMonths) {
        return apiActiveMonths.map((fi) => {
          const year = apiFiscalYearMap[fi] ?? getFiscalMonthYear(fi);
          return { label: `${MONTHS_FULL[fi]} ${year}`, index: fi };
        });
      }
      return MONTHS.map((m, i) => ({ label: m, index: i }));
    }
    if (isFromApi && apiKpiData) {
      const monthIdx = parseInt(selectedMonth, 10);
      const activeWeeks = buildApiActiveWeeks(apiKpiData, monthIdx);
      return activeWeeks.map((wn) => ({ label: `Week ${wn}`, index: wn }));
    }
    const monthIdx = parseInt(selectedMonth, 10);
    const daysCount = DAYS_IN_MONTH[monthIdx]!;
    const weekCount = Math.ceil(daysCount / 7);
    return Array.from({ length: weekCount }, (_, i) => ({
      label: `Wk ${i + 1}`,
      index: i,
    }));
  }, [viewMode, selectedMonth, isFromApi, apiKpiData, apiFiscalYearMap, apiActiveMonths]);

  const dataSource: Record<number, MonthlyData | undefined> = viewMode === 'season'
    ? seasonData
    : viewMode === 'monthly'
      ? monthlyData.reduce<Record<number, MonthlyData>>((acc, d, i) => { acc[i] = d; return acc; }, {})
      : weeklyData;

  // Compute row spans and first-row indices for groups
  const groupMeta = useMemo(() => {
    const spans: Record<string, number> = {};
    const firstRowIndex: Record<string, number> = {};
    effectiveKpiRows.forEach((row, idx) => {
      spans[row.group] = (spans[row.group] || 0) + 1;
      if (!(row.group in firstRowIndex)) {
        firstRowIndex[row.group] = idx;
      }
    });
    return { spans, firstRowIndex };
  }, [effectiveKpiRows]);

  // ─── Purchase value edit tracking ──────────────────────────────────────
  const hasUnsavedEdits = Object.keys(editedValues).length > 0;

  // Save all edited values
  const handleSaveEdits = async () => {
    if (!lineItem) return;
    setSaveError(null);

    if (isFromApi) {
      // Build edit-request payload from editedValues
      // Group edits by kpiId: editedValues keys are "dataKey-colIndex"
      const kpiChangesMap = new Map<string, { week: number; proposed_value: number }[]>();

      for (const [editKey, rawVal] of Object.entries(editedValues)) {
        const lastDash = editKey.lastIndexOf('-');
        if (lastDash === -1) continue;
        const dataKey = editKey.slice(0, lastDash);
        const colIdx = parseInt(editKey.slice(lastDash + 1), 10);
        if (isNaN(colIdx)) continue;

        // Find kpiId from effectiveKpiRows
        const row = effectiveKpiRows.find((r) => r.dataKey === dataKey);
        if (!row?.kpiId) continue;

        const cleaned = rawVal.replace(/[^\d.-]/g, '');
        const value = parseFloat(cleaned);
        if (isNaN(value)) continue;

        // week=0 for monthly edits, week=weekNumber for weekly
        const weekValue = (viewMode === 'monthly' || viewMode === 'season') ? 0 : colIdx + 1;

        const existing = kpiChangesMap.get(row.kpiId) ?? [];
        existing.push({ week: weekValue, proposed_value: value });
        kpiChangesMap.set(row.kpiId, existing);
      }

      if (kpiChangesMap.size === 0) {
        setEditedValues({});
        return;
      }

      const kpiChanges = Array.from(kpiChangesMap.entries()).map(([kpiId, weekValues]) => ({
        kpi_id: kpiId,
        week_values: weekValues,
      }));

      const payload: OtbEditRequestPayload = {
        request_by: 'current_user',
        otb_requests: [{
          otb_id: planId,
          kpi_changes: kpiChanges,
        }],
      };

      setSaving(true);
      try {
        await editRequestMutation.mutateAsync(payload);
        setEditedValues({});
        setIsEditing(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        // React Query automatically re-fetches via onSuccess in useOtbEditRequest
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Failed to save edits');
      } finally {
        setSaving(false);
      }
    } else {
      // Mock data: recalculate total purchase value from monthly edits
      let newTotal = 0;
      for (let m = 0; m < 12; m++) {
        const editKey = `purchaseValue-${m}`;
        const editedStr = editedValues[editKey];
        if (editedStr !== undefined) {
          const cleaned = editedStr.replace(/[^\d.-]/g, '');
          const parsed = parseFloat(cleaned);
          newTotal += isNaN(parsed) ? (monthlyData[m]?.['purchaseValue'] ?? 0) : parsed;
        } else {
          newTotal += monthlyData[m]?.['purchaseValue'] ?? 0;
        }
      }
      updatePurchaseValue(lineItem.id, Math.round(newTotal));
      setEditedValues({});
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const isPending = lineItem?.editStatus === 'pending-approval';

  // Loading state (API fetch in progress)
  if (!lineItem && apiLoading) {
    return (
      <div className="space-y-4 animate-fadeInUp">
        <PageHeader
          title={otbId ?? 'OTB Calculation Sheet'}
          backTo={{ label: segmentFamilyLabel, path: podDetailLink }}
        />
        {/* KPI cards shimmer */}
        <MetricGrid columns={3}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-32" />
            </div>
          ))}
        </MetricGrid>
        {/* Table shimmer */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 space-y-4">
            {/* eslint-disable-next-line design-system/prefer-section-header -- shimmer placeholder, not a real section header */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-8 w-40" />
            </div>
            <div className="space-y-3">
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
          </div>
        </div>
      </div>
    );
  }

  // Not found state (both mock and API failed)
  if (!lineItem) {
    return (
      <div className="space-y-4 animate-fadeInUp">
        <PageHeader
          title={otbId ?? 'OTB Calculation Sheet'}
          backTo={{ label: segmentFamilyLabel, path: podDetailLink }}
        />
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            OTB Line Item Not Found
          </h3>
          <p className="text-sm text-gray-500">
            The OTB ID &quot;{otbId}&quot; does not match any line item.
          </p>
        </div>
      </div>
    );
  }

  const otbCode = summaryView?.otb_code ?? lineItem.otbNumber;
  const otbStatus = summaryView?.status ?? (isPending ? 'Pending' : 'Normal');
  const summaryMonthLabel = summaryView?.otb_code_breakdown?.season_year && summaryView.month
    ? `${MONTH_NAMES[summaryView.month - 1]} ${summaryView.otb_code_breakdown.season_year.code}`
    : '';

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* Breadcrumbs + Page Header */}
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <span>OTB Number : {otbCode}</span>
            {summaryMonthLabel && <span className="text-base font-normal text-gray-500">{summaryMonthLabel}</span>}
            {summaryView?.otb_code_breakdown && (
              <span className="relative group">
                <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                <span className="hidden group-hover:block">
                  <OTBBreakdownPopover breakdown={summaryView.otb_code_breakdown} otbConfig={otbConfig} />
                </span>
              </span>
            )}
            <Badge variant={otbStatus === 'Approved' ? 'success' : otbStatus === 'Pending' ? 'warning' : 'default'}>
              {otbStatus}
            </Badge>
          </span>
        }
        backTo={{ label: segmentFamilyLabel, path: podDetailLink }}
        actions={
          isEditing ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setEditedValues({}); setIsEditing(false); setSaveError(null); }}
                disabled={saving}
                className="cursor-pointer"
              >
                <X className="w-3.5 h-3.5 mr-1.5" />
                Discard
              </Button>
              <Button size="sm" onClick={handleSaveEdits} disabled={!hasUnsavedEdits || saving} className="cursor-pointer">
                {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                {saving ? 'Saving...' : 'Save OTB'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {apiOtbId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" disabled={isDownloading} className="cursor-pointer">
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      {isDownloading ? 'Downloading...' : 'Download'}
                      <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => download('/otb/plan/kpi-data', 'otb_monthly.xlsx', { params: { otb_id: apiOtbId, data_type: 'monthly' }, headers: OTB_SHEET_DOWNLOAD_HEADERS })}>
                      Download Monthly View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => download('/otb/plan/kpi-data', 'otb_weekly.xlsx', { params: { otb_id: apiOtbId, data_type: 'weekly' }, headers: OTB_SHEET_DOWNLOAD_HEADERS })}>
                      Download Weekly View
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {canEdit && (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="cursor-pointer">
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
              )}
            </div>
          )
        }
      />

      {/* OTB Summary Cards — hidden for RBL */}
      {summaryView && !isSeasonal && (
        <>
          <MetricGrid columns={5}>
            <MetricCard label="Consumed Amount" value={formatCurrency(summaryView.consumption)} valueClassName="text-xl font-medium" />
            <MetricCard label="Available Amount" value={formatCurrency(summaryView.available_amount)} valueClassName="text-xl font-medium" />
            <MetricCard label="Current Avg. Margin" value={`${summaryView.current_average_margin.toFixed(2)}%`} valueClassName="text-xl font-medium" />
            <MetricCard label="Budget Amount" value={formatCurrency(summaryView.total_value)} valueClassName="text-xl font-medium" />
            <MetricCard label="Budget Validity till" value={`${formatDateLabel(summaryView.budget_validity.start_date)} → ${formatDateLabel(summaryView.budget_validity.end_date)}`} valueClassName="text-xl font-medium" />
          </MetricGrid>
        </>
      )}

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
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'monthly' | 'weekly' | 'season')}>
              <TabsList variant="default">
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                {isSeasonal ? (
                  <TabsTrigger value="season">Season</TabsTrigger>
                ) : (
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                )}
              </TabsList>
            </Tabs>

            {viewMode === 'weekly' && (
              <FilterSelect
                value={selectedMonth}
                onChange={setSelectedMonth}
                placeholder="Select Month"
                options={apiActiveMonths ? MONTH_OPTIONS.filter((o) => apiActiveMonths.includes(Number(o.value))) : MONTH_OPTIONS}
                searchable
              />
            )}
          </div>
        }
        className="mb-0"
      />

      {/* Spreadsheet table */}
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
      ) : (
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full border-collapse min-w-max">
          <tbody>
            {effectiveKpiRows.map((row, rowIdx) => {
              const isFirstInGroup = groupMeta.firstRowIndex[row.group] === rowIdx;
              // Any editable cell in this row?
              const rowHasEditable = isFromApi
                ? columns.some((col) => apiEditableMap[`${row.dataKey}-${col.index}`])
                : !!row.isEditable;

              // Show header row only: at the very top (rowIdx===0) AND before the first remaining_data group
              const prevRow = rowIdx > 0 ? effectiveKpiRows[rowIdx - 1] : null;
              const isFirstRemainingGroup = isFirstInGroup && prevRow && prevRow.groupLabel === 'OTB' && row.groupLabel !== 'OTB';
              const showHeaderRow = rowIdx === 0 || isFirstRemainingGroup;

              return (
                <React.Fragment key={`${row.group}-${row.dataKey}`}>
                  {/* Column header row — at top and before remaining_data section */}
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

                  {/* KPI data row */}
                  <tr
                    className={cn(
                      'border-b border-gray-100',
                      row.isRecommended && 'bg-violet-50/40',
                    )}
                  >
                    {/* Group label — shown on first row only, blank for subsequent */}
                    <td className="sticky left-0 z-10 bg-white text-sm text-gray-900 px-3 py-2.5 w-[180px] min-w-[180px] border-r border-gray-200">
                      {isFirstInGroup ? row.groupLabel : ''}
                    </td>

                    {/* KPI name cell */}
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
                        {rowHasEditable && !row.isRecommended && (
                          <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        )}
                      </span>
                    </td>

                    {/* Value cells */}
                    {columns.map((col) => {
                      const monthData = dataSource[col.index];
                      const value = monthData?.[row.dataKey] ?? 0;
                      const isEditable = isEditing && (isFromApi
                        ? (apiEditableMap[`${row.dataKey}-${col.index}`] ?? false)
                        : (row.isEditable && (viewMode === 'monthly' || viewMode === 'season') && (isFYFuture || col.index >= CURRENT_MONTH_INDEX)));
                      const editKey = `${row.dataKey}-${col.index}`;

                      if (isEditable) {
                        const editProposed = apiProposedMap[editKey];
                        const displayValue = editProposed ? editProposed.proposed : value;
                        return (
                          <td key={col.index} className="text-right px-2 py-1.5 min-w-[160px] whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {/* eslint-disable-next-line no-restricted-syntax -- spreadsheet cell input */}
                              <input
                                type="text"
                                inputMode="decimal"
                                value={editedValues[editKey] ?? formatValueRaw(displayValue, row.format)}
                                onChange={(e) => {
                                  const formatted = formatInputValue(e.target.value);
                                  setEditedValues((prev) => ({
                                    ...prev,
                                    [editKey]: formatted,
                                  }));
                                }}
                                className="w-full text-right text-sm border border-gray-300 rounded px-2 py-1 bg-white focus-kb:ring-1 focus-kb:ring-primary/30 focus-kb:border-primary focus:outline-none"
                              />
                              {editProposed && (
                                <span className="relative group shrink-0">
                                  <HelpCircle className="w-3.5 h-3.5 text-amber-500 cursor-help" />
                                  <span className="absolute bottom-full right-0 mb-1.5 hidden group-hover:block z-50 w-max max-w-[220px] bg-gray-900 text-white text-xs rounded-md px-3 py-2 shadow-lg">
                                    <span className="block">Proposed: {formatValue(editProposed.proposed, row.format)}</span>
                                    <span className="block mt-0.5">Previous: {formatValue(editProposed.current, row.format)}</span>
                                    <span className="block mt-0.5 text-gray-400 capitalize">Status: {editProposed.status}</span>
                                  </span>
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      }

                      const proposedInfo = apiProposedMap[editKey];
                      const showCalcBreakdown = isRecommendedRow(row);

                      return (
                        <td
                          key={col.index}
                          className={cn(
                            'text-left text-sm text-gray-900 px-3 py-2.5 min-w-[160px] whitespace-nowrap',
                            row.isRecommended && 'bg-violet-50/40',
                          )}
                        >
                          {proposedInfo ? (
                            <span className="inline-flex items-center gap-1.5">
                              {formatValue(proposedInfo.proposed, row.format)}
                              <span className="relative group">
                                <HelpCircle className="w-3.5 h-3.5 text-amber-500 cursor-help" />
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50 w-max max-w-[220px] bg-gray-900 text-white text-xs rounded-md px-3 py-2 shadow-lg">
                                  <span className="block">Proposed: {formatValue(proposedInfo.proposed, row.format)}</span>
                                  <span className="block mt-0.5">Current: {formatValue(proposedInfo.current, row.format)}</span>
                                  <span className="block mt-0.5 text-gray-400 capitalize">Status: {proposedInfo.status}</span>
                                </span>
                              </span>
                            </span>
                          ) : showCalcBreakdown ? (
                            <CalcBreakdownCell
                              value={value}
                              format={row.format}
                              colIndex={col.index}
                              calcPopoverCol={calcPopoverCol}
                              setCalcPopoverCol={setCalcPopoverCol}
                              monthData={monthData}
                              effectiveKpiRows={effectiveKpiRows}
                            />
                          ) : (
                            formatValue(value, row.format)
                          )}
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
      )}

      {/* Save error feedback */}
      {saveError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
          <Badge variant="destructive" size="sm">Error</Badge>
          <p className="text-sm text-red-700">{saveError}</p>
        </div>
      )}

      {/* Save success feedback */}
      {saveSuccess && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
          <Badge variant="success" size="sm">Saved</Badge>
          <p className="text-sm text-green-700">OTB saved successfully.</p>
        </div>
      )}

      {/* Edit Log */}
      <EditLogSection editHistory={effectiveEditHistory} useRawCurrency={isFromApi} />

      {/* Approve edit dialog */}
      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Approve Purchase Value Edit"
        description="This edit exceeds the &plusmn;10% variance threshold. Approving will confirm the new purchase value for PO validation."
        confirmLabel="Approve"
        onConfirm={() => {
          approveEdit(lineItem.id);
          setApproveOpen(false);
        }}
      />

      {/* Reject edit dialog */}
      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject Purchase Value Edit"
        description="Rejecting this edit will revert the purchase value to its previous value."
        confirmLabel="Reject"
        variant="destructive"
        onConfirm={() => {
          rejectEdit(lineItem.id);
          setRejectOpen(false);
        }}
      />
    </div>
  );
}
