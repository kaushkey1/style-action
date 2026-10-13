import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PageHeader, Button, Card, EmptyState, Skeleton, Tooltip, TooltipTrigger, TooltipContent, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui';
import { Check, X, AlertCircle, ChevronDown, ChevronUp, Image as ImageIcon, Pencil, Loader2 } from 'lucide-react';
import { cn, getCurrencySymbol } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { useStyles, useUpdateStyles } from '../api/vendorCatalogHooks';
import type { StyleItem, StyleColor } from '../api/vendorCatalogApi';

const PAGE_SIZE = 100;
const MAX_COLOR_SWATCHES = 5;

interface LocationState {
  brand?: string;
  segment?: string;
  family?: string;
  runId?: string;
}

const COLOR_PALETTE: Record<string, string> = {
  black: '#111827',
  white: '#f9fafb',
  ivory: '#fffff0',
  cream: '#f5ecd7',
  ecru: '#c2b280',
  beige: '#e8dcc4',
  tan: '#d2b48c',
  khaki: '#c3b091',
  camel: '#c19a6b',
  taupe: '#a18772',
  brown: '#8b4513',
  chocolate: '#5c3a21',
  rust: '#b7410e',
  red: '#ef4444',
  crimson: '#dc143c',
  scarlet: '#ff2400',
  maroon: '#800000',
  burgundy: '#6e0d25',
  wine: '#722f37',
  pink: '#ec4899',
  rose: '#e11d48',
  blush: '#f4c2c2',
  fuchsia: '#d946ef',
  magenta: '#c026d3',
  coral: '#ff7f50',
  salmon: '#fa8072',
  peach: '#ffcba4',
  orange: '#f97316',
  yellow: '#eab308',
  mustard: '#cdac4b',
  gold: '#d4a017',
  olive: '#808000',
  lime: '#84cc16',
  mint: '#a8e6cf',
  green: '#22c55e',
  emerald: '#10b981',
  teal: '#14b8a6',
  aqua: '#06b6d4',
  cyan: '#06b6d4',
  turquoise: '#40e0d0',
  blue: '#3b82f6',
  navy: '#1e3a8a',
  royal: '#4169e1',
  denim: '#1560bd',
  indigo: '#4338ca',
  purple: '#a855f7',
  violet: '#8b5cf6',
  lavender: '#b497d6',
  plum: '#8e4585',
  grey: '#9ca3af',
  gray: '#9ca3af',
  silver: '#c0c0c0',
  charcoal: '#36454f',
  multi: '#9333ea',
  floral: '#fb7185',
};

const COLOR_FALLBACK = '#9ca3af';

function swatchColor(name: string | null): string {
  if (!name) return COLOR_FALLBACK;
  const normalized = name.toLowerCase().replace(/[^a-z]/g, '');
  if (COLOR_PALETTE[normalized]) return COLOR_PALETTE[normalized];
  const match = Object.keys(COLOR_PALETTE).find((k) => normalized.includes(k));
  return match ? COLOR_PALETTE[match] ?? COLOR_FALLBACK : COLOR_FALLBACK;
}

export function ExternalBrandsPage() {
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;
  const runId = state.runId;

  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [expandedColors, setExpandedColors] = useState<Set<string>>(new Set());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  interface ColorDraft {
    name: string;
    hex: string;
    codes: string[];
    qty: string;
    optedIn: boolean;
    /** Original values fetched from the API — used to detect dirty rows on save. */
    originalQty: string;
    originalOptedIn: boolean;
  }
  interface EditDraft { mrp: string; cost: string; originalMrp: string; originalCost: string; colors: ColorDraft[] }
  const [editDraft, setEditDraft] = useState<EditDraft>({
    mrp: '',
    cost: '',
    originalMrp: '',
    originalCost: '',
    colors: [],
  });
  const [editError, setEditError] = useState<string | null>(null);

  const updateStylesMutation = useUpdateStyles(runId);
  const toast = useToast();

  const startEdit = (key: string, product: StyleItem): void => {
    setEditingKey(key);
    setEditError(null);
    // Defensive: support both new shape (codes: string[], qty: number)
    // and any older shape from a not-yet-deployed backend.
    const totalQty = product.predicted_qty ?? 0;
    const colorList = (product.colors ?? []).map((c) => {
      const legacyCode = (c as unknown as { code?: string | null }).code;
      const codes = Array.isArray(c.codes) && c.codes.length > 0
        ? c.codes
        : legacyCode
          ? [legacyCode]
          : [];
      return { ...c, codes };
    });
    // Prefer the API's per-color qty. If absent (older backend), fall back to
    // splitting the style total evenly so the rows aren't all 0.
    const fallbackPerColor = colorList.length > 0 ? Math.floor(totalQty / colorList.length) : 0;
    const mrpStr = product.rrp != null ? String(product.rrp) : '';
    const costStr = product.fob != null ? String(product.fob) : '';
    setEditDraft({
      mrp: mrpStr,
      cost: costStr,
      originalMrp: mrpStr,
      originalCost: costStr,
      colors: colorList.map((c) => {
        const apiQty = typeof c.qty === 'number' ? c.qty : fallbackPerColor;
        const qtyStr = String(apiQty);
        const nameStr = c.name ?? '';
        const hex = swatchColor(c.name);
        // Default to opted-in when the field is missing (older backend).
        const opted = typeof c.opted_in === 'boolean' ? c.opted_in : true;
        return {
          name: nameStr,
          hex,
          codes: c.codes,
          qty: qtyStr,
          optedIn: opted,
          originalQty: qtyStr,
          originalOptedIn: opted,
        };
      }),
    });
  };

  const cancelEdit = (): void => {
    setEditingKey(null);
    setEditError(null);
  };

  const updateColorDraft = (idx: number, patch: Partial<ColorDraft>): void => {
    setEditDraft((d) => ({
      ...d,
      colors: d.colors.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    }));
  };

  const saveEdit = (styleCode: string): void => {
    // Only include style-level fields if they actually changed.
    const mrpChanged = editDraft.mrp !== editDraft.originalMrp;
    const costChanged = editDraft.cost !== editDraft.originalCost;
    const mrp = mrpChanged && editDraft.mrp.trim() !== '' ? Number(editDraft.mrp) : undefined;
    const cost = costChanged && editDraft.cost.trim() !== '' ? Number(editDraft.cost) : undefined;
    if ((mrpChanged && editDraft.mrp.trim() !== '' && Number.isNaN(mrp)) ||
        (costChanged && editDraft.cost.trim() !== '' && Number.isNaN(cost))) {
      setEditError('Enter valid numbers for MRP / Cost');
      return;
    }

    // Per-colour payload — ONLY rows the user actually changed.
    // For each dirty row, emit one entry per underlying colour_code; when a
    // colour name maps to multiple codes, split the new qty evenly.
    const colorEdits = editDraft.colors.flatMap((c) => {
      const qtyDirty = c.qty !== c.originalQty;
      const optedDirty = c.optedIn !== c.originalOptedIn;
      if (!qtyDirty && !optedDirty) return [];
      const totalForColor = c.qty.trim() === '' ? null : Number(c.qty);
      if (qtyDirty && totalForColor != null && Number.isNaN(totalForColor)) return [];
      const perCode = qtyDirty && totalForColor != null && c.codes.length > 0
        ? Math.floor(totalForColor / c.codes.length)
        : null;
      return c.codes.map((code) => ({
        colour_code: code,
        qty: qtyDirty ? (perCode ?? undefined) : undefined,
        opted_in: optedDirty ? c.optedIn : undefined,
      }));
    });

    if (mrp === undefined && cost === undefined && colorEdits.length === 0) {
      setEditError('Nothing changed');
      return;
    }

    setEditError(null);
    updateStylesMutation.mutate(
      [{ style_code: styleCode, mrp, cost, colors: colorEdits.length ? colorEdits : undefined }],
      {
        onSuccess: (response) => {
          if (response.success_count > 0) {
            setEditingKey(null);
            const r = response.results[0];
            if (r?.error) {
              toast.success(`${styleCode} saved with warnings: ${r.error}`, 'Saved');
            } else {
              toast.success(`${styleCode} updated`, 'Saved');
            }
            return;
          }
          const firstError = response.results.find((r) => r.status === 'error');
          const msg = firstError?.error ?? 'Save failed (no rows updated)';
          setEditError(msg);
          toast.error(msg, 'Save failed');
        },
        onError: (e: unknown) => {
          const msg = e instanceof Error ? e.message : 'Save failed';
          setEditError(msg);
          toast.error(msg, 'Save failed');
        },
      },
    );
  };

  const toggleColorsExpansion = (key: string): void => {
    setExpandedColors((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const { data: stylesData, isLoading, isError, refetch } = useStyles(runId, {
    sort: 'normalised_score',
    order: 'desc',
    page: 1,
    page_size: PAGE_SIZE,
  });

  const items = useMemo(() => stylesData?.items ?? [], [stylesData]);
  const editingProduct = useMemo(
    () => (editingKey ? items.find((p) => (p.style_code ?? '') === editingKey) ?? null : null),
    [editingKey, items],
  );
  const fxRate = items[0]?.fx_rate_gbp_inr ?? null;

  const productKey = (p: StyleItem): string => p.style_code ?? '';

  const toggleProductSelection = (key: string): void => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleAllSelection = (): void => {
    if (selectedProducts.size === items.length && items.length > 0) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(items.map(productKey)));
    }
  };

  const getMatchIcon = (score: number | null) => {
    if (score == null) return <X className="h-3 w-3" />;
    if (score >= 60) return <Check className="h-3 w-3" />;
    if (score >= 40) return <AlertCircle className="h-3 w-3" />;
    return <X className="h-3 w-3" />;
  };

  const getMatchColor = (score: number | null): string => {
    if (score == null) return 'text-gray-600 bg-gray-50 border-gray-200';
    if (score >= 60) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="px-6 py-3">
          {/* eslint-disable-next-line design-system/prefer-section-header -- sticky page header with action bar */}
          <div className="flex items-center justify-between">
            <div>
              <PageHeader
                title="Catalog Selection"
                backTo={{ label: 'Catalog Buying', path: '/external-brands' }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Review and select products from brand catalog that match your range requirements
              </p>
              {fxRate != null && (
                <p
                  className="text-[11px] text-gray-500 mt-1"
                  title="Source: Frankfurter (ECB mid-market, daily). Cached 1h."
                >
                  FX rate: £1 = ₹{fxRate.toFixed(2)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAllSelection}
                disabled={items.length === 0}
              >
                {selectedProducts.size === items.length && items.length > 0 ? 'Deselect All' : 'Select All'}
              </Button>
              <span className="text-sm text-gray-500">
                {selectedProducts.size} of {items.length} selected
              </span>
              <Button variant="primary" size="sm" disabled={selectedProducts.size === 0}>
                Add to Range Plan ({selectedProducts.size})
              </Button>
            </div>
          </div>
        </div>
      </div>

      {!runId && (
        <div className="p-4">
          <EmptyState
            icon={AlertCircle}
            title="Catalog reference missing"
            description="Open this page by clicking a catalog row from the Catalog Buying list."
          />
        </div>
      )}

      {runId && isLoading && (
        <div className="p-4">
          {/* eslint-disable-next-line design-system/prefer-metric-grid -- product card grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <Skeleton key={`sk-${idx}`} className="h-96 w-full" />
            ))}
          </div>
        </div>
      )}

      {runId && !isLoading && isError && (
        <div className="p-4">
          <EmptyState
            icon={AlertCircle}
            title="Failed to load products"
            description="Something went wrong loading the catalog."
            action={
              <Button variant="primary" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            }
          />
        </div>
      )}

      {runId && !isLoading && !isError && items.length === 0 && (
        <div className="p-4">
          <EmptyState
            icon={ImageIcon}
            title="No products found"
            description="This catalog has no products."
          />
        </div>
      )}

      {runId && !isLoading && !isError && items.length > 0 && (
        <div className="p-4">
          {/* eslint-disable-next-line design-system/prefer-metric-grid -- product card grid, not page-level metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((product) => {
              const key = productKey(product);
              const isExpanded = expandedProduct === key;
              const isSelected = selectedProducts.has(key);
              const score = product.normalised_score;
              const currency = product.currency === 'GBP' ? '£' : getCurrencySymbol();
              const mrpInr = product.rrp_inr;
              const costInr = product.fob_inr;
              const colors = product.colors ?? [];
              const sizes = product.size_run ?? [];
              const isColorsExpanded = expandedColors.has(key);
              const visibleColors = isColorsExpanded ? colors : colors.slice(0, MAX_COLOR_SWATCHES);
              const extraColors = Math.max(0, colors.length - MAX_COLOR_SWATCHES);

              return (
                <Card
                  key={key}
                  className={cn(
                    'overflow-hidden transition-all hover:shadow-lg',
                    isSelected && 'ring-2 ring-indigo-500',
                  )}
                >
                  <div className="relative">
                    <div className="absolute top-3 left-3 z-10">
                      {/* eslint-disable-next-line no-restricted-syntax -- native checkbox for selection overlay */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleProductSelection(key)}
                        className="rounded border-gray-300 bg-white/90 backdrop-blur-sm"
                        aria-label={`Select ${product.style_description ?? 'product'}`}
                      />
                    </div>

                    {score != null && (
                      <div className="absolute top-3 right-3 z-10">
                        <div className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border backdrop-blur-sm',
                          getMatchColor(score),
                        )}>
                          {getMatchIcon(score)}
                          {score.toFixed(0)}%
                        </div>
                      </div>
                    )}

                    {/* Product image — placeholder; image_url not in DB. See vendor-catalog-data-gaps.md */}
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-gray-400" aria-hidden />
                    </div>

                    <div className="p-4">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 mb-1 truncate" title={product.style_description ?? undefined}>
                            {product.style_description ?? '—'}
                          </h3>
                          <div className="text-xs text-gray-500">
                            {product.style_code ?? '—'}
                          </div>
                        </div>
                        {product.style_code && (
                          <button
                            type="button"
                            onClick={() => startEdit(key, product)}
                            className="text-gray-500 hover:text-gray-900 p-1 rounded hover:bg-gray-100"
                            aria-label="Edit MRP, cost, colours"
                            title="Edit MRP, cost, colours"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">MRP:</span>
                          <span
                            className="ml-1 font-medium text-gray-900"
                            title={product.rrp != null ? `${currency}${product.rrp.toFixed(2)}` : undefined}
                          >
                            {mrpInr != null ? `₹${Math.round(mrpInr).toLocaleString('en-IN')}` : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Cost:</span>
                          <span
                            className="ml-1 font-medium text-gray-900"
                            title={product.fob != null ? `${currency}${product.fob.toFixed(2)}` : undefined}
                          >
                            {costInr != null ? `₹${Math.round(costInr).toLocaleString('en-IN')}` : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Qty:</span>
                          <span className="ml-1 font-medium text-gray-900">
                            {(product.predicted_qty ?? 0).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Sizes:</span>
                          <span className="ml-1 font-medium text-gray-900">
                            {product.size_count ?? 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">GIM:</span>
                          <span className="ml-1 font-medium text-green-600">
                            {product.gim_pct != null ? `${product.gim_pct.toFixed(1)}%` : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">NIM:</span>
                          <span className="ml-1 font-medium text-amber-600">
                            {product.nim_pct != null ? `${product.nim_pct.toFixed(1)}%` : '—'}
                          </span>
                        </div>
                      </div>

                      {colors.length > 0 && (
                        <div className="mt-3 text-xs">
                          <div className="text-gray-500 mb-1.5">
                            Available in {product.color_count} color{product.color_count === 1 ? '' : 's'}:
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {visibleColors.map((c, idx) => (
                              <ColorSwatch key={`${key}-color-${idx}`} color={c} />
                            ))}
                            {extraColors > 0 && !isColorsExpanded && (
                              <button
                                type="button"
                                onClick={() => toggleColorsExpansion(key)}
                                className="text-[11px] text-gray-700 hover:text-gray-900 underline ml-1 font-medium"
                                aria-label={`Show ${extraColors} more colors`}
                              >
                                +{extraColors}
                              </button>
                            )}
                            {isColorsExpanded && colors.length > MAX_COLOR_SWATCHES && (
                              <button
                                type="button"
                                onClick={() => toggleColorsExpansion(key)}
                                className="text-[11px] text-gray-700 hover:text-gray-900 underline ml-1 font-medium"
                                aria-label="Show fewer colors"
                              >
                                show less
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setExpandedProduct(isExpanded ? null : key)}
                        className="w-full mt-3 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded transition-colors flex items-center justify-center gap-1 font-medium"
                      >
                        {isExpanded ? (
                          <>Hide Details <ChevronUp className="h-3 w-3" /></>
                        ) : (
                          <>View Details <ChevronDown className="h-3 w-3" /></>
                        )}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="border-t bg-gray-50 px-4 py-3">
                        <div className="text-[11px]">
                          <div className="grid grid-cols-[1fr_1fr_1fr] gap-x-3 mb-1.5 pb-1 border-b border-gray-200">
                            <div className="font-medium text-gray-500 uppercase">Attribute</div>
                            <div className="font-medium text-gray-500 uppercase">Catalog</div>
                            <div className="font-medium text-gray-500 uppercase text-right">Range Req.</div>
                          </div>

                          <div className="space-y-0.5">
                            <AttrRow label="Fit" catalogValue={product.extracted_fit} rangeValue={product.range_requirements?.fit} />
                            <AttrRow label="Pattern" catalogValue={product.extracted_pattern} rangeValue={product.range_requirements?.pattern} />
                            <AttrRow label="Fabric" catalogValue={product.extracted_fabric} rangeValue={product.range_requirements?.fabric} />
                            <AttrRow label="Neckline" catalogValue={product.extracted_neckline} rangeValue={product.range_requirements?.neckline} />
                            <AttrRow label="Sleeve" catalogValue={product.extracted_sleeve} rangeValue={product.range_requirements?.sleeve} />
                            <AttrRow label="Color Family" catalogValue={product.extracted_color_family} rangeValue={product.range_requirements?.color_family} />
                            <AttrRow label="Wash" catalogValue={product.extracted_wash} rangeValue={product.range_requirements?.wash} />
                            <AttrRow label="Origin" catalogValue={product.coo} />
                            <AttrRow label="Supplier" catalogValue={product.supplier} />
                          </div>

                          {sizes.length > 0 && (
                            <div className="mt-2 pt-1.5 border-t border-gray-200">
                              <span className="text-gray-500">Sizes: </span>
                              <span className="inline-flex flex-wrap gap-1 ml-1 align-middle">
                                {sizes.map((s) => (
                                  <span key={`${key}-size-${s}`} className="px-1.5 py-0.5 bg-white text-gray-700 rounded border border-gray-200 text-[11px]">
                                    {s}
                                  </span>
                                ))}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={editingKey != null} onOpenChange={(open) => { if (!open) cancelEdit(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit style</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto">
              <table className="w-full text-xs border border-gray-200 rounded">
                <tbody className="divide-y divide-gray-200">
                  <InfoRow label="Style code" value={editingProduct.style_code} />
                  <InfoRow label="Style description" value={editingProduct.style_description} />
                  <InfoRow label="Item class" value={editingProduct.item_class_desc} />
                  <InfoRow label="Sub category" value={editingProduct.sub_category} />
                  <InfoRow label="Gender" value={editingProduct.gender} />
                  <InfoRow label="Season" value={editingProduct.season} />
                  <InfoRow label="Fabric text" value={editingProduct.fabric_text} />
                </tbody>
              </table>

              <EditField
                label="MRP (£)"
                value={editDraft.mrp}
                onChange={(v) => setEditDraft((d) => ({ ...d, mrp: v }))}
              />
              <EditField
                label="Cost (£)"
                value={editDraft.cost}
                onChange={(v) => setEditDraft((d) => ({ ...d, cost: v }))}
              />

              {editDraft.colors.length > 0 && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-gray-500 mb-2 font-medium">
                    Colours ({editDraft.colors.length})
                  </div>
                  <table className="w-full text-xs border border-gray-200 rounded overflow-hidden">
                    <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
                      <tr>
                        <th className="px-2 py-1.5 text-left w-12">Select</th>
                        <th className="px-2 py-1.5 text-left">Colour</th>
                        <th className="px-2 py-1.5 text-right w-24">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {editDraft.colors.map((c, idx) => (
                        <tr key={`edit-color-${idx}`} className={cn('bg-white', !c.optedIn && 'opacity-60')}>
                          <td className="px-2 py-1.5">
                            {/* eslint-disable-next-line no-restricted-syntax -- native checkbox for opt-in */}
                            <input
                              type="checkbox"
                              checked={c.optedIn}
                              onChange={(e) => updateColorDraft(idx, { optedIn: e.target.checked })}
                              className="rounded border-gray-300 h-4 w-4"
                              aria-label={`Select ${c.name}`}
                            />
                          </td>
                          <td className="px-2 py-1.5 text-gray-700">
                            <span className="inline-flex items-center gap-2">
                              <span
                                // eslint-disable-next-line no-restricted-syntax -- dynamic swatch from data
                                style={{ backgroundColor: c.hex }}
                                className="inline-block h-5 w-5 rounded-full border border-gray-300 shrink-0"
                                aria-hidden
                              />
                              <span>{c.name || '—'}</span>
                            </span>
                          </td>
                          <td className="px-2 py-1.5">
                            <Input
                              type="number"
                              inputMode="numeric"
                              step="1"
                              min="0"
                              value={c.qty}
                              onChange={(e) => updateColorDraft(idx, { qty: e.target.value })}
                              className="h-7 text-right text-xs"
                              aria-label={`Qty for ${c.name}`}
                              disabled={!c.optedIn}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {editError && (
                <p className="text-red-600 text-xs" role="alert">{editError}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelEdit}
              disabled={updateStylesMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => editingProduct?.style_code && saveEdit(editingProduct.style_code)}
              disabled={updateStylesMutation.isPending || !editingProduct?.style_code}
            >
              {updateStylesMutation.isPending ? (
                <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Saving</>
              ) : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface EditFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }): React.ReactNode {
  return (
    <tr className="bg-white">
      <td className="px-2 py-1.5 text-gray-500 w-1/3">{label}</td>
      <td className="px-2 py-1.5 text-gray-900" title={value ?? undefined}>
        {value && value !== 'UNKNOWN' ? value : '—'}
      </td>
    </tr>
  );
}

function EditField({ label, value, onChange, step = '0.01' }: EditFieldProps): React.ReactNode {
  return (
    <label className="flex items-center justify-between gap-2">
      <span className="text-gray-500">{label}</span>
      <Input
        type="number"
        inputMode="decimal"
        step={step}
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-28 text-right text-xs"
      />
    </label>
  );
}

function ColorSwatch({ color }: { color: StyleColor }): React.ReactNode {
  const label = color.name ?? color.codes[0] ?? 'Color';
  const bg = swatchColor(color.name);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          // eslint-disable-next-line no-restricted-syntax -- dynamic color swatch from data
          style={{ backgroundColor: bg }}
          className="inline-block h-5 w-5 rounded-full border border-gray-300 shadow-sm cursor-default p-0"
          aria-label={label}
        />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

interface AttrRowProps {
  label: string;
  catalogValue: string | null;
  rangeValue?: string | null;
}

function AttrRow({ label, catalogValue, rangeValue }: AttrRowProps): React.ReactNode {
  const cat = catalogValue && catalogValue !== 'UNKNOWN' ? catalogValue : null;
  const rng = rangeValue && rangeValue !== 'UNKNOWN' ? rangeValue : null;
  if (!cat && !rng) return null;
  const matched = cat != null && rng != null && cat.toLowerCase() === rng.toLowerCase();
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr] gap-x-3 py-0.5">
      <div className="text-gray-600 truncate">{label}</div>
      <div className={cn('truncate', matched ? 'text-green-700 font-medium' : 'text-gray-900')} title={cat ?? '—'}>
        {cat ?? '—'}
      </div>
      <div className="text-gray-700 text-right truncate" title={rng ?? '—'}>
        {rng ?? '—'}
      </div>
    </div>
  );
}
