/**
 * Cross-page "drill" routing — the production resolver for deep links between modules.
 *
 * Maps a scope (category / sub-category / store / SKU / grade / region / city) to the real,
 * verified app routes per docs/specs/user-journey-by-level.md §4 (reconciled 2026-06-10).
 * Destinations already read these params (Store View, AOP, Inventory, Allocation, Product).
 *
 * Source values often carry an index prefix ("2. WOMEN APPAREL") — `stripIndexPrefix` normalises
 * them; destinations match prefix-stripped + case-insensitive, so exact sub-category alignment is
 * best-effort until a canonical taxonomy map exists.
 */
import { Store, Network, Boxes, LineChart, Package } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Insight } from '@/modules/store-view/api/insightsApi';

const enc = encodeURIComponent;

/** Strip a leading "N. " merch-hierarchy index (e.g. "2. WOMEN APPAREL" -> "WOMEN APPAREL"). */
export function stripIndexPrefix(value: string): string {
  return value.replace(/^\d+\.\s*/, '').trim();
}

export interface DrillScope {
  category?: string;
  subCategory?: string;
  /** inventory's top filter field; defaults to `category` when omitted */
  segment?: string;
  grade?: string;
  format?: string;
  region?: string;
  city?: string;
  store?: string;
  /** single-SKU style code = option code + colourway (e.g. "443118917GREEN") */
  style?: string;
  /** allocation filters */
  stoId?: string;
  sku?: string;
  /** return-chip source tag */
  from?: string;
}

export type DrillTargetId =
  | 'store-view'
  | 'aop'
  | 'inventory'
  | 'product-list'
  | 'product'
  | 'allocation';

export interface DrillTarget {
  id: string;
  label: string;
  icon: LucideIcon;
  preview: string;
  to: string;
}

function query(parts: Array<string | false | undefined | null>): string {
  const q = parts.filter(Boolean).join('&');
  return q ? `?${q}` : '';
}

/** Resolve a single (target, scope) to a real route string. */
export function getDrillRoute(target: DrillTargetId, scope: DrillScope): string {
  const from = scope.from ? `from=${enc(scope.from)}` : undefined;
  const cat = scope.category ? stripIndexPrefix(scope.category) : undefined;
  const sub = scope.subCategory ? stripIndexPrefix(scope.subCategory) : undefined;
  const seg = scope.segment ? stripIndexPrefix(scope.segment) : cat; // inventory filters by `segment`

  switch (target) {
    case 'store-view':
      return `/command/store-view${query([
        cat && `category=${enc(cat)}`,
        scope.format && `format=${enc(scope.format)}`,
        scope.region && `region=${enc(scope.region)}`,
        scope.city && `city=${enc(scope.city)}`,
        from,
      ])}`;
    case 'aop':
      return `/command/aop${query([
        'tab=category',
        cat && `category=${enc(cat)}`,
        sub && `subCategory=${enc(sub)}`,
        from,
      ])}`;
    case 'inventory':
      return `/inventory${query([
        seg && `segment=${enc(seg)}`,
        sub && `family=${enc(sub)}`,
        scope.grade && `grade=${enc(scope.grade)}`,
        scope.format && `format=${enc(scope.format)}`,
        from,
      ])}`;
    case 'product-list':
      // Store-scoped route — no store, no route (caller must drop the target). Never fabricate one.
      if (!scope.store) return '';
      return `/products/${enc(scope.store)}${query([
        cat && `category=${enc(cat)}`,
        sub && `subCategory=${enc(sub)}`,
        from,
      ])}`;
    case 'product':
      // Store-scoped route — no store, no route (caller must drop the target). Never fabricate one.
      if (!scope.store || !scope.style) return '';
      return `/products/${enc(scope.store)}/${enc(scope.style)}`;
    case 'allocation':
      return `/inventory/actions${query([
        scope.stoId && `stoId=${enc(scope.stoId)}`,
        scope.sku && `sku=${enc(scope.sku)}`,
        from,
      ])}`;
    default: {
      const _exhaustive: never = target;
      return _exhaustive;
    }
  }
}

/**
 * The standard 4 drill destinations for a dashboard category/grade row.
 * "Store breakdown" → Store View (category-filtered store list, not the un-filterable Intelligence list).
 */
export function getRowDrillTargets(scope: DrillScope): DrillTarget[] {
  return [
    { id: 'stores', label: 'Store breakdown', icon: Store, preview: 'Across stores', to: getDrillRoute('store-view', scope) },
    { id: 'category', label: 'Category breakdown', icon: Network, preview: 'Sub-category split', to: getDrillRoute('aop', scope) },
    { id: 'inventory', label: 'Open in Inventory', icon: Boxes, preview: 'Stock & ageing', to: getDrillRoute('inventory', scope) },
    { id: 'aop', label: 'Open in AOP plan', icon: LineChart, preview: 'Plan vs actual', to: getDrillRoute('aop', scope) },
  ];
}

/** Store × category row (store-detail Demand table). */
export function getStoreCategoryDrillTargets(scope: DrillScope): DrillTarget[] {
  const seg = scope.category ? stripIndexPrefix(scope.category) : '';
  return [
    { id: 'store-inventory', label: 'Open in Inventory', icon: Boxes, preview: `This store · ${seg}`, to: getDrillRoute('product-list', scope) },
    { id: 'stores', label: 'Compare across stores', icon: Store, preview: `${seg} · all stores`, to: getDrillRoute('store-view', scope) },
    { id: 'aop', label: 'Open in AOP plan', icon: LineChart, preview: 'Plan vs actual', to: getDrillRoute('aop', scope) },
  ].filter((t) => t.to !== '');
}

/** Fashion-grade row → Inventory filtered by grade (no category/store dimension applies). */
export function getGradeDrillTargets(grade: string, from = 'dashboard'): DrillTarget[] {
  return [
    { id: 'inventory', label: 'Open in Inventory', icon: Boxes, preview: `Grade ${grade}`, to: getDrillRoute('inventory', { grade, from }) },
  ];
}

/** Format row → Store View + Inventory filtered by format. */
export function getFormatDrillTargets(format: string, from = 'dashboard'): DrillTarget[] {
  return [
    { id: 'stores', label: 'Store breakdown', icon: Store, preview: `${format} stores`, to: getDrillRoute('store-view', { format, from }) },
    { id: 'inventory', label: 'Open in Inventory', icon: Boxes, preview: `${format} stock`, to: getDrillRoute('inventory', { format, from }) },
  ];
}

/**
 * Chart-header drill ("View ▾"). Charts show all series at once, so this is a generic
 * "open the breakdown" jump for the chart's dimension (not a single-value drill).
 */
export function getChartDrillTargets(
  dimension: 'category' | 'grade' | 'store-category' | 'format' | 'region',
  scope: DrillScope = {},
): DrillTarget[] {
  switch (dimension) {
    case 'category':
      return [
        { id: 'aop', label: 'Category breakdown', icon: Network, preview: 'Open AOP by category', to: getDrillRoute('aop', scope) },
        { id: 'inventory', label: 'Open in Inventory', icon: Boxes, preview: 'Stock & ageing', to: getDrillRoute('inventory', scope) },
      ];
    case 'grade':
      return [
        { id: 'stores', label: 'Open in Store View', icon: Store, preview: 'Store performance by grade', to: getDrillRoute('store-view', scope) },
      ];
    case 'store-category':
      return [
        { id: 'product-list', label: 'Open product display', icon: Package, preview: "This store's products", to: getDrillRoute('product-list', scope) },
        { id: 'aop', label: 'Category breakdown', icon: Network, preview: 'Open AOP by category', to: getDrillRoute('aop', scope) },
      ].filter((t) => t.to !== '');
    case 'format':
      return [
        { id: 'stores', label: 'Store breakdown', icon: Store, preview: 'Stores by format', to: getDrillRoute('store-view', scope) },
        { id: 'inventory', label: 'Open in Inventory', icon: Boxes, preview: 'Stock by format', to: getDrillRoute('inventory', scope) },
      ];
    case 'region':
      return [
        { id: 'stores', label: 'Store breakdown', icon: Store, preview: 'Stores by region', to: getDrillRoute('store-view', scope) },
      ];
    default: {
      const _exhaustive: never = dimension;
      return _exhaustive;
    }
  }
}

/** Geography state/region row → Store View filtered by region. */
export function getRegionDrillTargets(region: string, from = 'dashboard'): DrillTarget[] {
  return [
    { id: 'stores', label: 'Store breakdown', icon: Store, preview: `${region} stores`, to: getDrillRoute('store-view', { region, from }) },
  ];
}

/**
 * Inventory NOOS SKU row → allocation actions (+ product page only when a store is known).
 * NOOS rows are network-wide (no store), so the store-scoped product page is offered only when a
 * store is present — we never fabricate one. The option code drives the allocation search.
 */
export function getSkuDrillTargets(scope: DrillScope): DrillTarget[] {
  const allocationScope: DrillScope = { ...scope, sku: scope.sku ?? scope.style };
  return [
    { id: 'product', label: 'Open product page', icon: Package, preview: scope.category ? `Single-SKU · ${scope.category}` : 'Single-SKU detail', to: getDrillRoute('product', scope) },
    { id: 'allocation', label: 'Open in Allocation Actions', icon: Boxes, preview: 'Pull-back / replenish', to: getDrillRoute('allocation', allocationScope) },
  ].filter((t) => t.to !== '');
}

/**
 * Map a domain / sub_domain label to one safe fallback drill target so every
 * insight gets a kebab even when it has no category / format scope.
 */
function getDomainFallbackTargets(domainRaw: string, from: string): DrillTarget[] {
  const d = domainRaw.toLowerCase();
  if (d.includes('inventory') || d.includes('noos') || d.includes('markdown')) {
    return [{ id: 'inventory', label: 'Open in Inventory', icon: Boxes, preview: 'Stock & ageing', to: getDrillRoute('inventory', { from }) }];
  }
  if (d.includes('aop') || d.includes('revenue') || d.includes('margin') || d.includes('sell')) {
    return [{ id: 'aop', label: 'Open in AOP plan', icon: LineChart, preview: 'Plan vs actual', to: getDrillRoute('aop', { from }) }];
  }
  if (d.includes('store') || d.includes('format') || d.includes('vendor')) {
    return [{ id: 'stores', label: 'Open in Store View', icon: Store, preview: 'Store performance', to: getDrillRoute('store-view', { from }) }];
  }
  // Universal last-resort: AOP plan (always a valid, non-store-scoped route).
  return [{ id: 'aop', label: 'Open in AOP plan', icon: LineChart, preview: 'Plan vs actual', to: getDrillRoute('aop', { from }) }];
}

/**
 * Drill targets for a Control Tower insight / exception. Resolution order:
 * category/segment → format → domain fallback. Always returns >= 1 non-empty
 * target, so the DrillMenu never renders empty (the "missing kebab" bug).
 */
export function getInsightDrillTargets(insight: Insight, from = 'review'): DrillTarget[] {
  const category = insight.category ?? insight.relevant_segments?.[0];
  if (category) return getRowDrillTargets({ category, from });

  const format = insight.relevant_formats?.[0];
  if (format) return getFormatDrillTargets(format, from);

  const domain = insight.sub_domain ?? insight.domain;
  if (domain) return getDomainFallbackTargets(domain, from);

  return getDomainFallbackTargets('', from);
}
