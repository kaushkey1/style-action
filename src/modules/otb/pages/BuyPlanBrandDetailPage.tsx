/* eslint-disable design-system/prefer-section-header, design-system/prefer-metric-grid */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  TrendingUp,
  ShoppingCart,
  Plus,
  Minus,
  Save,
  Edit2,
  ChevronUp,
  ChevronDown,
  X,
  Send,
  Search,
  Download,
  AlertTriangle,
  ImageOff,
  Percent,
} from 'lucide-react';
import {
  Button,
  Card,
  Badge,
  Input,
  Switch,
  ShimmerTable,
  FilterBar,
  FilterSelect,
  FilterClear,
  Modal,
} from '@/components/ui';
import { PageHeader } from '@/components/ui';
import {cn, formatCurrency, debounce, getFormattingConfig, getCurrencySymbol} from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { useModulePermissions } from '@/permissions';
import { useFeatureFlag } from '@/hooks/useScreenConfig';
import {
  useRunOptionsFilters,
  useRunOptions,
  useDownloadRunOptions,
  useToggleOptionActive,
  useUpdateOptionQuantity,
  useUpdateRunStatus,
  useSendToDp,
} from '../api/buyPlanHooks';

import type {
  RunOptionItem,
  RunStyleGroup,
} from '../api/buyPlanApi';

// ── Editability helpers ─────────────────────────────────────────────

interface EditableFields {
  quantity: boolean;
  mrp: boolean;
  costPrice: boolean;
  deliveryDate: boolean;
  deliveryDateRequired: boolean;
  toggle: boolean;
}

function getEditableFields(status: string | undefined, costingEnabled = true): EditableFields {
  const s = (status ?? '').toLowerCase();
  if (s === 'invalid') return { quantity: false, mrp: false, costPrice: false, deliveryDate: false, deliveryDateRequired: false, toggle: false };
  if (s === 'pending costing' || s === 'costing failed') {
    // When costing engine is disabled, allow editing MRP, cost, and delivery date
    // so the user can manually provide costing data.
    if (!costingEnabled) return { quantity: true, mrp: true, costPrice: true, deliveryDate: true, deliveryDateRequired: false, toggle: true };
    return { quantity: true, mrp: false, costPrice: false, deliveryDate: false, deliveryDateRequired: false, toggle: true };
  }
  if (s === 'costing received') return { quantity: true, mrp: true, costPrice: !costingEnabled, deliveryDate: true, deliveryDateRequired: true, toggle: true };
  if (s === 'sent for costing' || s === 'costing in progress' || s === 'sent to dp' || s === 'submitted to dp') return { quantity: false, mrp: false, costPrice: false, deliveryDate: false, deliveryDateRequired: false, toggle: false };
  // Default: quantity + delivery date editable
  return { quantity: true, mrp: false, costPrice: false, deliveryDate: true, deliveryDateRequired: false, toggle: true };
}

// ── Option Card Component ───────────────────────────────────────────

function OptionCard({
  option,
  styleDescription,
  isEditing,
  onStartEdit,
  onEndEdit,
  onQuantityChange,
  onMrpChange,
  onCostPriceChange,
  onDeliveryDateChange,
  onToggleActive,
  onSave,
  isSaving,
  editable,
}: {
  option: RunOptionItem;
  styleDescription: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
  onQuantityChange: (newQty: number) => void;
  onMrpChange: (newMrp: number) => void;
  onCostPriceChange: (newCost: number) => void;
  onDeliveryDateChange: (date: string | null) => void;
  onToggleActive: () => void;
  onSave: () => void;
  isSaving: boolean;
  editable: EditableFields;
}) {
  const hasAnyEditable = editable.quantity || editable.mrp || editable.costPrice || editable.deliveryDate;
  const [isExpanded, setIsExpanded] = useState(false);
  const displayName = `${styleDescription} - ${option.color}`;
  const sizes = option.sizes ? option.sizes.split(',').map(s => s.trim()) : [];
  const hasZeroQtyError = option.is_enabled && option.quantity === 0;
  const hasMrpZeroError = option.is_enabled && editable.mrp && (option.mrp == null || option.mrp <= 0);
  const hasCostZeroError = option.is_enabled && editable.costPrice && (option.cost_price == null || option.cost_price <= 0);
  const hasMrpBelowCostError = option.is_enabled && (editable.mrp || editable.costPrice) && option.mrp != null && option.mrp > 0 && option.cost_price != null && option.cost_price > 0 && option.mrp <= option.cost_price;
  const hasMissingDeliveryDate = option.is_enabled && editable.deliveryDateRequired && !option.delivery_date;
  const todayStr = new Date().toISOString().split('T')[0] ?? '';
  const maxDeliveryDate = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split('T')[0] ?? '';
  })();
  const hasDeliveryDatePastError = option.is_enabled && option.delivery_date != null && option.delivery_date < todayStr;
  const isInvalid = option.status?.toLowerCase() === 'invalid';

  const [imgError, setImgError] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const rawUrl = option.image_urls?.trim();
  const imageUrl = rawUrl && rawUrl !== 'null' && rawUrl !== 'undefined' ? rawUrl : null;
  const hasImage = imageUrl && !imgError;

  return (
    <div className={cn(
      'border rounded-lg transition-all',
      isInvalid ? 'border-gray-200 bg-gray-50 opacity-60' :
      hasZeroQtyError ? 'border-red-300 bg-red-50/30' :
      option.is_enabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
    )}>
      {/* Header: Image (float) + Content (flows around & below) */}
      <div className="p-3 pb-0">
        <div className="float-left mr-3 mb-1 relative w-36 max-h-28 bg-gray-100 rounded-sm border border-gray-200 overflow-hidden">
          {hasImage ? (
            <button
              type="button"
              onClick={() => setIsImagePreviewOpen(true)}
              className="w-full cursor-zoom-in"
              aria-label={`View full image of ${displayName}`}
            >
              <img
                src={imageUrl}
                alt={displayName}
                loading="lazy"
                decoding="async"
                onError={() => setImgError(true)}
                className="w-full object-contain"
              />
            </button>
          ) : (
            <div className="w-full h-20 flex items-center justify-center">
              <ImageOff className="w-5 h-5 text-gray-400" />
            </div>
          )}
        </div>

        {/* Image Preview Modal */}
        {hasImage && (
          <Modal
            isOpen={isImagePreviewOpen}
            onClose={() => setIsImagePreviewOpen(false)}
            title={displayName}
            size="full"
            className="max-h-[85vh]"
          >
            <div className="flex items-center justify-center h-[calc(85vh-100px)]">
              <img
                src={imageUrl}
                alt={displayName}
                className="h-full w-auto max-w-full object-contain"
              />
            </div>
          </Modal>
        )}
        <div className="flex items-start justify-between gap-2">
          <h4 className={cn(
            'text-sm font-semibold leading-snug break-words',
            (isInvalid || !option.is_enabled) ? 'text-gray-400' : 'text-gray-900'
          )}>
            {displayName}
          </h4>
          <Switch
            checked={option.is_enabled}
            onCheckedChange={onToggleActive}
            disabled={!editable.toggle}
            className="shrink-0"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
          <Badge variant={option.is_enabled ? 'success' : 'secondary'} size="sm">
            {option.is_enabled ? 'Active' : 'Inactive'}
          </Badge>
          {option.status && (
            <Badge
              variant={
                option.status.toLowerCase().includes('sent') ? 'info' :
                option.status.toLowerCase() === 'approved' ? 'success' :
                option.status.toLowerCase() === 'pending costing' ? 'warning' :
                option.status.toLowerCase() === 'invalid' ? 'destructive' :
                'default'
              }
              size="sm"
            >
              {option.status}
            </Badge>
          )}
          {option.comments?.trim() && (
            <Badge variant="info" size="sm">
              {option.comments.trim()}
            </Badge>
          )}
        </div>
        {/* Compact stats */}
        <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 mt-2 text-[11px] text-gray-500">
          <span>Qty: <span className={cn('font-medium', hasZeroQtyError ? 'text-red-600' : 'text-gray-700')}>{option.quantity.toLocaleString()}</span>,</span>
          {option.mrp != null && (
            <span>MRP: <span className="font-medium text-green-600">{getCurrencySymbol()}{option.mrp.toLocaleString(getFormattingConfig().locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>,</span>
          )}
          {option.cost_price != null && (
            <span>Cost: <span className="font-medium text-gray-700">{getCurrencySymbol()}{option.cost_price.toLocaleString(getFormattingConfig().locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>,</span>
          )}
          {option.intake_margin != null && (
            <span>GIM: <span className="font-medium text-gray-700">{option.intake_margin.toFixed(1)}%</span>,</span>
          )}
          {option.net_intake_margin != null && (
            <span>NIM: <span className="font-medium text-gray-700">{option.net_intake_margin.toFixed(1)}%</span></span>
          )}
        </div>
        <div className="clear-both" />
      </div>

      {hasZeroQtyError && (
        <div className="mx-3 mt-2 flex items-start gap-1.5 rounded bg-red-50 border border-red-200 px-2.5 py-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">
            Quantity is 0 — not eligible for costing. Increase quantity or mark this option as inactive.
          </p>
        </div>
      )}

      {hasMrpZeroError && (
        <div className="mx-3 mt-2 flex items-start gap-1.5 rounded bg-red-50 border border-red-200 px-2.5 py-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">
            MRP must be greater than 0.
          </p>
        </div>
      )}

      {hasCostZeroError && (
        <div className="mx-3 mt-2 flex items-start gap-1.5 rounded bg-red-50 border border-red-200 px-2.5 py-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">
            Cost must be greater than 0.
          </p>
        </div>
      )}

      {hasMrpBelowCostError && (
        <div className="mx-3 mt-2 flex items-start gap-1.5 rounded bg-red-50 border border-red-200 px-2.5 py-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">
            MRP ({getCurrencySymbol()}{option.mrp?.toLocaleString(getFormattingConfig().locale, { minimumFractionDigits: 2 })}) must be greater than cost ({getCurrencySymbol()}{option.cost_price?.toLocaleString(getFormattingConfig().locale, { minimumFractionDigits: 2 })}).
          </p>
        </div>
      )}

      {hasDeliveryDatePastError && (
        <div className="mx-3 mt-2 flex items-start gap-1.5 rounded bg-red-50 border border-red-200 px-2.5 py-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">
            Delivery date must be a future date.
          </p>
        </div>
      )}

      {hasMissingDeliveryDate && !hasZeroQtyError && (
        <div className="mx-3 mt-2 mb-2 flex items-start gap-1.5 rounded bg-amber-50 border border-amber-200 px-2.5 py-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Delivery date is required after costing is received. Edit this option to set a delivery date.
          </p>
        </div>
      )}

      {/* Revenue + Expand */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
        <div className="text-xs">
          <span className="text-gray-500">Revenue:</span>
          <span className="ml-1 font-semibold text-gray-900">
            {formatCurrency(option.revenue)}
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* Two-column details */}
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            {/* Left — Quantity, Pricing, Allocation */}
            <div className="p-4 space-y-4">
              <div>
                <h5 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Quantity</h5>
                {isEditing ? (
                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onQuantityChange(Math.max(0, option.quantity - 100))}
                        className="p-1 hover:bg-gray-100 rounded border border-gray-200"
                        disabled={!option.is_enabled}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <Input
                        type="number"
                        value={option.quantity}
                        step="1"
                        onKeyDown={(e) => {
                          if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E') {
                            e.preventDefault();
                          }
                        }}
                        onPaste={(e) => {
                          const pasted = e.clipboardData.getData('text');
                          if (/[.,eE]/.test(pasted)) {
                            e.preventDefault();
                          }
                        }}
                        onChange={(e) => {
                          const newQty = parseInt(e.target.value) || 0;
                          onQuantityChange(Math.max(0, newQty));
                        }}
                        className={cn('w-20 h-7 text-xs text-center', hasZeroQtyError && 'border-red-400 focus-kb:ring-red-200 focus-kb:border-red-400')}
                        disabled={!option.is_enabled}
                      />
                      <button
                        onClick={() => onQuantityChange(option.quantity + 100)}
                        className="p-1 hover:bg-gray-100 rounded border border-gray-200"
                        disabled={!option.is_enabled}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    {hasZeroQtyError && (
                      <p className="text-xs text-red-600 mt-1">Quantity cannot be 0 for active options</p>
                    )}
                  </div>
                ) : (
                  <p className={cn('text-sm font-medium', hasZeroQtyError ? 'text-red-600' : 'text-gray-900')}>{option.quantity.toLocaleString()} units</p>
                )}
              </div>

              {(option.mrp != null || option.cost_price != null || option.intake_margin != null) && (
                <div>
                  <h5 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Pricing</h5>
                  <dl className="space-y-1.5 text-xs">
                    {(option.mrp != null || (isEditing && editable.mrp)) && (
                      <div className="flex justify-between items-center">
                        <dt className="text-gray-500">MRP</dt>
                        <dd className="font-medium text-green-600">
                          {isEditing && editable.mrp ? (
                            <div>
                              <Input
                                type="number"
                                value={option.mrp ?? ''}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  onMrpChange(Math.max(0, val));
                                }}
                                className={cn('w-24 h-7 text-xs text-right', (hasMrpZeroError || hasMrpBelowCostError) && 'border-red-400 focus-kb:ring-red-200 focus-kb:border-red-400')}
                                disabled={!option.is_enabled}
                                aria-label="MRP"
                              />
                              {hasMrpZeroError && <p className="text-xs text-red-600 mt-1">MRP must be &gt; 0</p>}
                              {hasMrpBelowCostError && <p className="text-xs text-red-600 mt-1">MRP must be &gt; cost</p>}
                            </div>
                          ) : (
                            <>{getCurrencySymbol()}{(option.mrp ?? 0).toLocaleString(getFormattingConfig().locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
                          )}
                        </dd>
                      </div>
                    )}
                    {(option.cost_price != null || (isEditing && editable.costPrice)) && (
                      <div className="flex justify-between items-center">
                        <dt className="text-gray-500">Cost</dt>
                        <dd className="font-medium text-gray-900">
                          {isEditing && editable.costPrice ? (
                            <div>
                              <Input
                                type="number"
                                value={option.cost_price ?? ''}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  onCostPriceChange(Math.max(0, val));
                                }}
                                className={cn('w-24 h-7 text-xs text-right', (hasCostZeroError || hasMrpBelowCostError) && 'border-red-400 focus:ring-red-200 focus:border-red-400')}
                                disabled={!option.is_enabled}
                                aria-label="Cost price"
                              />
                              {hasCostZeroError && <p className="text-xs text-red-600 mt-1">Cost must be &gt; 0</p>}
                              {hasMrpBelowCostError && <p className="text-xs text-red-600 mt-1">Cost must be &lt; MRP</p>}
                            </div>
                          ) : (
                            <>{getCurrencySymbol()}{(option.cost_price ?? 0).toLocaleString(getFormattingConfig().locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
                          )}
                        </dd>
                      </div>
                    )}
                    {option.intake_margin != null && (
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Gross Intake Margin</dt>
                        <dd className="font-medium text-gray-900">{option.intake_margin.toFixed(1)}%</dd>
                      </div>
                    )}
                    {option.net_intake_margin != null && (
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Net Intake Margin</dt>
                        <dd className="font-medium text-gray-900">{option.net_intake_margin.toFixed(1)}%</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              <div>
                <h5 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Allocation</h5>
                <dl className="space-y-1.5 text-xs">
                  {sizes.length > 0 && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-gray-500 shrink-0">Sizes</dt>
                      <dd className="font-medium text-gray-900 text-right break-words min-w-0">{sizes.join(', ')}</dd>
                    </div>
                  )}
                  {option.expected_margin != null && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Target Margin</dt>
                      <dd className="font-medium text-gray-900">{option.expected_margin.toFixed(1)}%</dd>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <dt className="text-gray-500">
                      Delivery Date
                      {editable.deliveryDateRequired && <span className="text-red-500 ml-0.5">*</span>}
                    </dt>
                    <dd className="font-medium text-gray-900">
                      {isEditing && editable.deliveryDate ? (
                        <div>
                          <Input
                            type="date"
                            value={option.delivery_date ?? ''}
                            min={todayStr}
                            max={maxDeliveryDate}
                            onChange={(e) => onDeliveryDateChange(e.target.value || null)}
                            className={cn('h-7 text-xs w-36', (hasMissingDeliveryDate || hasDeliveryDatePastError) && 'border-red-400 focus-kb:ring-red-200 focus-kb:border-red-400')}
                            disabled={!option.is_enabled}
                            aria-label="Delivery date"
                            required={editable.deliveryDateRequired}
                          />
                          {hasMissingDeliveryDate && (
                            <p className="text-xs text-red-600 mt-1">Delivery date is required</p>
                          )}
                          {hasDeliveryDatePastError && (
                            <p className="text-xs text-red-600 mt-1">Must be a future date</p>
                          )}
                        </div>
                      ) : (
                        option.delivery_date
                          ? new Date(option.delivery_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : editable.deliveryDateRequired
                            ? <span className="text-red-500 text-xs">Required</span>
                            : '—'
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Right — Style Details */}
            <div className="p-4">
              <h5 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Style Details</h5>
              {(() => {
                const styleFields: { label: string; value: string | null }[] = [
                  { label: 'Fabric', value: option.fabric },
                  { label: 'Fit', value: option.fit },
                  { label: 'Pattern', value: option.pattern },
                  { label: 'Pattern Type', value: option.pattern_type },
                  { label: 'Length', value: option.length },
                  { label: 'Neck Type', value: option.neck_type },
                  { label: 'Weave', value: option.weave },
                  { label: 'Sleeve', value: option.sleeve },
                  { label: 'Waist', value: option.waist },
                  { label: 'Wash', value: option.wash },
                ];
                const present = styleFields.filter(f => f.value);
                return present.length > 0 ? (
                  <dl className="space-y-1.5 text-xs">
                    {present.map(f => (
                      <div key={f.label} className="flex justify-between">
                        <dt className="text-gray-500">{f.label}</dt>
                        <dd className="font-medium text-gray-900">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-xs text-gray-400">No style details</p>
                );
              })()}
            </div>
          </div>

          {/* Edit Actions */}
          {hasAnyEditable && (
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100">
              {!isEditing ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onStartEdit}
                  className="h-7 text-xs"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onEndEdit}
                    className="h-7 text-xs"
                    disabled={isSaving}
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={onSave}
                    className="h-7 text-xs"
                    disabled={isSaving || hasZeroQtyError || hasMissingDeliveryDate || hasMrpZeroError || hasCostZeroError || hasMrpBelowCostError || hasDeliveryDatePastError}
                  >
                    <Save className="w-3 h-3" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const FROZEN_STATUSES = ['sent for costing', 'costing in progress', 'sent to dp', 'submitted to dp', 'invalid'];

// ── Main Page Component ─────────────────────────────────────────────

export default function BuyPlanBrandDetailPage() {
  const { id: runId } = useParams();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const { edit: canEdit } = useModulePermissions('buyPlan');
  const costingEnabled = useFeatureFlag('buy_plan', 'costing_engine_enabled');

  // Edit state
  const [localStyles, setLocalStyles] = useState<RunStyleGroup[]>([]);
  const [otbTotal, setOtbTotal] = useState(0);
  const [editingOptionId, setEditingOptionId] = useState<number | null>(null);
  const [editingQty, setEditingQty] = useState<number | null>(null);
  const [editingDeliveryDate, setEditingDeliveryDate] = useState<string | null>(null);
  const [editingMrp, setEditingMrp] = useState<number | null>(null);
  const [editingCostPrice, setEditingCostPrice] = useState<number | null>(null);

  // Attribute filters (Brick → Fabric → Fit → Pattern → Status)
  const [brickFilter, setBrickFilter] = useState<string>('all');
  const [fabricFilter, setFabricFilter] = useState<string>('all');
  const [fitFilter, setFitFilter] = useState<string>('all');
  const [patternFilter, setPatternFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Search
  const [searchInput, setSearchInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const debouncedSetSearch = useMemo(
    () => debounce((value: string) => setSearchQuery(value), 400),
    [],
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSetSearch(value);
  }, [debouncedSetSearch]);

  const handleSearchClear = useCallback(() => {
    setSearchInput('');
    setSearchQuery('');
  }, []);

  // Build filter params (shared by listing + download)
  const filterParams = useMemo((): Record<string, string> | undefined => {
    const params: Record<string, string> = {};
    if (brickFilter !== 'all') params.brick = brickFilter;
    if (fabricFilter !== 'all') params.fabric = fabricFilter;
    if (fitFilter !== 'all') params.fit = fitFilter;
    if (patternFilter !== 'all') params.pattern = patternFilter;
    if (statusFilter !== 'all') params.status = statusFilter;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    return Object.keys(params).length > 0 ? params : undefined;
  }, [brickFilter, fabricFilter, fitFilter, patternFilter, statusFilter, searchQuery]);

  // ── React Query hooks ──────────────────────────────────────────────

  const { data: filterOptions } = useRunOptionsFilters(runId ?? '');

  const {
    data: runData,
    isLoading: loading,
    error: queryError,
  } = useRunOptions(runId ?? '', filterParams);

  const downloadMutation = useDownloadRunOptions();
  const toggleMutation = useToggleOptionActive();
  const updateQuantityMutation = useUpdateOptionQuantity();
  const updateStatusMutation = useUpdateRunStatus();
  const sendToDpMutation = useSendToDp();

   
  useEffect(() => {
    if (runData) {
      setLocalStyles(runData.styles); // eslint-disable-line react-hooks/set-state-in-effect -- sync React Query data into local state for optimistic edits
      setOtbTotal(runData.kpi.otb_total);  
    }
  }, [runData]);

  const currentStatus = runData?.status ?? '';

  // ── Handlers ────────────────────────────────────────────────────

  const handleToggleActive = useCallback((optionId: number, currentActive: boolean) => {
    const newActive = !currentActive;

    // Optimistic update
    setLocalStyles(prev => prev.map(style => ({
      ...style,
      options: style.options.map(opt =>
        opt.id === optionId ? { ...opt, is_enabled: newActive } : opt
      ),
    })));

    toggleMutation.mutate(
      { optionId, isActive: newActive },
      {
        onError: () => {
          // Revert on error
          setLocalStyles(prev => prev.map(style => ({
            ...style,
            options: style.options.map(opt =>
              opt.id === optionId ? { ...opt, is_enabled: currentActive } : opt
            ),
          })));
        },
      },
    );
  }, [toggleMutation]);

  const handleStartEdit = useCallback((optionId: number, currentQty: number, currentDeliveryDate: string | null, currentMrp: number | null, currentCostPrice: number | null) => {
    setEditingOptionId(optionId);
    setEditingQty(currentQty);
    setEditingDeliveryDate(currentDeliveryDate);
    setEditingMrp(currentMrp);
    setEditingCostPrice(currentCostPrice);
  }, []);

  const handleCancelEdit = useCallback(() => {
    // Revert to original quantity, delivery date, MRP, and cost price
    if (editingOptionId != null && editingQty != null) {
      setLocalStyles(prev => prev.map(style => ({
        ...style,
        options: style.options.map(opt =>
          opt.id === editingOptionId ? { ...opt, quantity: editingQty, delivery_date: editingDeliveryDate, mrp: editingMrp, cost_price: editingCostPrice } : opt
        ),
      })));
    }
    setEditingOptionId(null);
    setEditingQty(null);
    setEditingDeliveryDate(null);
    setEditingMrp(null);
    setEditingCostPrice(null);
  }, [editingOptionId, editingQty, editingDeliveryDate, editingMrp, editingCostPrice]);

  const handleQuantityChange = useCallback((optionId: number, newQty: number) => {
    const intQty = Math.floor(newQty);
    setLocalStyles(prev => prev.map(style => ({
      ...style,
      options: style.options.map(opt =>
        opt.id === optionId ? { ...opt, quantity: intQty } : opt
      ),
    })));
  }, []);

  const handleMrpChange = useCallback((optionId: number, newMrp: number) => {
    setLocalStyles(prev => prev.map(style => ({
      ...style,
      options: style.options.map(opt =>
        opt.id === optionId ? { ...opt, mrp: newMrp } : opt
      ),
    })));
  }, []);

  const handleCostPriceChange = useCallback((optionId: number, newCost: number) => {
    setLocalStyles(prev => prev.map(style => ({
      ...style,
      options: style.options.map(opt =>
        opt.id === optionId ? { ...opt, cost_price: newCost } : opt
      ),
    })));
  }, []);

  const handleDeliveryDateChange = useCallback((optionId: number, date: string | null) => {
    setLocalStyles(prev => prev.map(style => ({
      ...style,
      options: style.options.map(opt =>
        opt.id === optionId ? { ...opt, delivery_date: date } : opt
      ),
    })));
  }, []);

  const handleSave = useCallback((optionId: number) => {
    // Find the current option from local state
    let currentQty = 0;
    let currentDeliveryDate: string | null = null;
    let currentMrp: number | null = null;
    let currentCostPrice: number | null = null;
    for (const style of localStyles) {
      const opt = style.options.find(o => o.id === optionId);
      if (opt) {
        currentQty = opt.quantity;
        currentDeliveryDate = opt.delivery_date;
        currentMrp = opt.mrp;
        currentCostPrice = opt.cost_price;
        break;
      }
    }

    updateQuantityMutation.mutate(
      {
        optionId,
        quantity: currentQty,
        deliveryDate: currentDeliveryDate,
        mrp: currentMrp,
        // Cost is editable only when the costing engine is disabled (demo org).
        // For costing-enabled orgs (Impetus + all others) cost is engine-owned,
        // so never send it — sending 0 for a Pending-Costing option trips the
        // backend gt=0 validator and 422s the quantity save.
        costPrice: !costingEnabled && currentCostPrice && currentCostPrice > 0
          ? currentCostPrice
          : null,
        costingDisabled: !costingEnabled,
      },
      {
        onSuccess: () => {
          setEditingOptionId(null);
          setEditingQty(null);
          setEditingDeliveryDate(null);
          setEditingMrp(null);
          setEditingCostPrice(null);
        },
      },
    );
  }, [localStyles, updateQuantityMutation, costingEnabled]);

  const handleSendForCosting = useCallback(() => {
    if (!runId) return;
    updateStatusMutation.mutate(
      { runId, status: 'Sent For Costing' },
      {
        onSuccess: () => {
          toastSuccess('Successfully sent to costing');
        },
        onError: (err) => {
          toastError(err instanceof Error ? err.message : 'Failed to send to costing');
        },
      },
    );
  }, [runId, updateStatusMutation, toastSuccess, toastError]);

  const handleSendToDp = useCallback(() => {
    if (!runId) return;
    sendToDpMutation.mutate(runId, {
      onSuccess: () => {
        toastSuccess('Successfully sent to DP');
      },
      onError: (err) => {
        toastError(err instanceof Error ? err.message : 'Failed to send to DP');
      },
    });
  }, [runId, sendToDpMutation, toastSuccess, toastError]);

  const handleDownload = useCallback(() => {
    if (!runId) return;
    downloadMutation.mutate({ runId, params: filterParams });
  }, [runId, filterParams, downloadMutation]);

  // ── Compute KPIs from local state (must be before early returns) ──

  const computedKpi = useMemo(() => {
    const allOptions = localStyles.flatMap(s => s.options);
    const activeOpts = allOptions.filter(o => o.is_enabled);
    const totalQty = activeOpts.reduce((sum, o) => sum + o.quantity, 0);
    const totalRevenue = activeOpts.reduce((sum, o) => sum + o.revenue, 0);
    const otbUsed = activeOpts.reduce((sum, o) => {
      const cost = o.cost_price ?? 0;
      return sum + cost * o.quantity;
    }, 0);
    const otbPct = otbTotal > 0 ? Math.round((otbUsed / otbTotal) * 100) : 0;

    return {
      active_options: activeOpts.length,
      total_quantity: totalQty,
      expected_revenue: totalRevenue,
      otb_used: otbUsed,
      otb_total: otbTotal,
      otb_used_percentage: otbPct,
    };
  }, [localStyles, otbTotal]);

  // Check if any active option has 0 quantity — blocks send for costing
  const hasActiveZeroQty = useMemo(() => {
    return localStyles.some(s => s.options.some(o => o.is_enabled && o.quantity === 0));
  }, [localStyles]);


  const hasActiveMrpInvalid = useMemo(() => {
    return localStyles.some(s => s.options.some(o => {
      if (!o.is_enabled) return false;
      const editable = getEditableFields(o.status);
      if (!editable.mrp) return false;
      if (o.mrp == null || o.mrp <= 0) return true;
      if (o.cost_price != null && o.cost_price > 0 && o.mrp <= o.cost_price) return true;
      return false;
    }));
  }, [localStyles]);

  const hasActiveDeliveryDatePast = useMemo(() => {
    const today = new Date().toISOString().split('T')[0] ?? '';
    return localStyles.some(s => s.options.some(o =>
      o.is_enabled && o.delivery_date != null && o.delivery_date < today
    ));
  }, [localStyles]);

  // Check if all non-frozen active options already have "costing received" or "costing failed" — nothing new to send
  const allActiveCostingReceived = useMemo(() => {
    const activeOptions = localStyles.flatMap(s => s.options.filter(o => o.is_enabled));
    if (activeOptions.length === 0) return false;
    const eligibleOptions = activeOptions.filter(o => !FROZEN_STATUSES.includes((o.status ?? '').toLowerCase().trim()));
    if (eligibleOptions.length === 0) return false;
    const terminalStatuses = ['costing received', 'costing failed'];
    return eligibleOptions.every(o => terminalStatuses.includes((o.status ?? '').toLowerCase().trim()));
  }, [localStyles]);

  // Show Send to DP only when at least one active option has "costing received"
  const hasAnyCostingReceived = useMemo(() => {
    return localStyles.some(s => s.options.some(o =>
      o.is_enabled
      && (o.status ?? '').toLowerCase() === 'costing received'
    ));
  }, [localStyles]);

  // Send to DP: enabled when at least one active option has "costing received" AND a delivery date
  const hasAnyCostingReceivedWithDate = useMemo(() => {
    return localStyles.some(s => s.options.some(o =>
      o.is_enabled
      && (o.status ?? '').toLowerCase() === 'costing received'
      && !!o.delivery_date
    ));
  }, [localStyles]);

  // Enable Send to Costing when at least one active option has "pending costing"
  const hasAnyPendingCosting = useMemo(() => {
    return localStyles.some(s => s.options.some(o =>
      o.is_enabled && (o.status ?? '').toLowerCase() === 'pending costing'
    ));
  }, [localStyles]);

  // Combined disabled check for Send to Costing button
  const isSendForCostingDisabled = updateStatusMutation.isPending
    || computedKpi.active_options === 0
    || hasActiveZeroQty
    || allActiveCostingReceived
    || !hasAnyPendingCosting;

  // Combined disabled check for Send to DP button
  const isSendForDpDisabled = sendToDpMutation.isPending
    || !hasAnyCostingReceivedWithDate
    || hasActiveMrpInvalid
    || hasActiveDeliveryDatePast;

  // ── Loading / Error states ──────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Buy Plan"
          backTo={{ label: 'Buy Plans', path: '/buy-plans?tab=brand' }}
        />
        <ShimmerTable rows={4} />
      </div>
    );
  }

  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load buy plan details') : null;

  if (error || !runData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Buy Plan"
          backTo={{ label: 'Buy Plans', path: '/buy-plans?tab=brand' }}
        />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">{error || 'Buy plan not found'}</p>
        </div>
      </div>
    );
  }

  // ── Derived display values ──────────────────────────────────────

  const brandName = runData.buy_plan_display_id || '-';

  const avgNim = runData.kpi.avg_nim;

  const kpiCards = [
    {
      label: 'Active Options',
      value: computedKpi.active_options.toString(),
      icon: Package,
    },
    {
      label: 'Total Quantity',
      value: computedKpi.total_quantity.toLocaleString(),
      icon: ShoppingCart,
    },
    {
      label: 'Expected Revenue',
      value: formatCurrency(computedKpi.expected_revenue),
      icon: TrendingUp,
    },
    ...(avgNim != null ? [{
      label: 'Avg Net Intake Margin',
      value: `${avgNim.toFixed(1)}%`,
      icon: Percent,
    }] : []),
  ];

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <button
              onClick={() => navigate('/buy-plans?tab=brand')}
              className="p-1 -ml-1 rounded hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            Buy Plan - {brandName}
          </span>
        }
        badges={
          <Badge
            variant={
              currentStatus.toLowerCase() === 'approved' ? 'success' :
              currentStatus.toLowerCase().includes('sent') ? 'info' :
              currentStatus.toLowerCase().includes('partial') ? 'default' :
              currentStatus.toLowerCase() === 'rejected' ? 'destructive' :
              currentStatus.toLowerCase().includes('pending') ? 'warning' :
              currentStatus.toLowerCase() === 'draft' ? 'secondary' :
              'default'
            }
            size="sm"
          >
            {currentStatus}
          </Badge>
        }
        actions={canEdit ? (
          <div className="flex items-center gap-2">
            {costingEnabled && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSendForCosting}
                disabled={isSendForCostingDisabled}
                title={
                  computedKpi.active_options === 0 ? 'No active options — toggle on at least one option before sending' :
                  !hasAnyPendingCosting ? 'No options with pending costing status' :
                  hasActiveZeroQty ? 'Some active options have 0 quantity — fix or deactivate them before sending' :
                  allActiveCostingReceived ? 'All active options already have costing received or costing failed' :
                  undefined
                }
              >
                <Send className="w-4 h-4" />
                {updateStatusMutation.isPending ? 'Sending...' : 'Send to Costing'}
              </Button>
            )}
            {hasAnyCostingReceived && (
              <Button
                size="sm"
                onClick={handleSendToDp}
                disabled={isSendForDpDisabled}
                title={
                  !hasAnyCostingReceivedWithDate ? 'At least one option must have costing received and a delivery date to send to DP' :
                  hasActiveMrpInvalid ? 'Some options have invalid MRP — MRP must be greater than 0 and greater than cost' :
                  hasActiveDeliveryDatePast ? 'Some options have a delivery date in the past — select a future date' :
                  undefined
                }
              >
                <Send className="w-4 h-4" />
                {sendToDpMutation.isPending ? 'Sending...' : 'Send to DP'}
              </Button>
            )}
          </div>
        ) : undefined}
      />

      {/* KPI Cards */}
      <div className={cn('grid grid-cols-1 gap-4', kpiCards.length > 3 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3')}>
        {kpiCards.map(card => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                    <p className="text-2xl font-semibold">{card.value}</p>
                    {'subLabel' in card && card.subLabel ? (
                      <p className="text-xs text-gray-500 mt-1">{String(card.subLabel)}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <Icon className="w-4 h-4 text-gray-600" />
                    </div>
                    {'percentage' in card && (
                      <div className="text-xs font-medium mt-2 text-gray-500">
                        {String(card.percentage)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Attribute Filters + Search + Download */}
      {filterOptions && (() => {
        const filters: { label: string; value: string; onChange: (v: string) => void; items: string[] }[] = [
          { label: 'Bricks', value: brickFilter, onChange: setBrickFilter, items: filterOptions.bricks ?? [] },
          { label: 'Fabrics', value: fabricFilter, onChange: setFabricFilter, items: filterOptions.fabrics },
          { label: 'Fits', value: fitFilter, onChange: setFitFilter, items: filterOptions.fits },
          { label: 'Patterns', value: patternFilter, onChange: setPatternFilter, items: filterOptions.patterns },
          { label: 'Statuses', value: statusFilter, onChange: setStatusFilter, items: filterOptions.statuses ?? [] },
        ];
        const visible = filters.filter(f => f.items.length > 0);
        const hasActive = filters.some(f => f.value !== 'all');
        if (visible.length === 0) return null;
        return (
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-2">
            <div className="flex items-center justify-between gap-4">
              <FilterBar className="mb-0">
                {visible.map(f => (
                  <FilterSelect
                    key={f.label}
                    value={f.value}
                    onChange={f.onChange}
                    placeholder={`All ${f.label}`}
                    options={[
                      { value: 'all', label: `All ${f.label}` },
                      ...f.items.map(item => ({ value: item, label: item })),
                    ]}
                    searchable
                  />
                ))}
                {hasActive && (
                  <FilterClear onClear={() => {
                    filters.forEach(f => f.onChange('all'));
                  }} />
                )}
              </FilterBar>
              <div className="flex items-center gap-2 shrink-0">
                <Input
                  type="text"
                  placeholder="Search style or option..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  leftIcon={<Search className="w-4 h-4" />}
                  rightIcon={searchInput ? (
                    <button
                      type="button"
                      onClick={handleSearchClear}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : undefined}
                  containerClassName="w-48 md:w-56"
                  className="h-9 !py-0"
                  aria-label="Search options"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={downloadMutation.isPending || loading}
                  className="shrink-0"
                >
                  <Download className="w-4 h-4" />
                  {downloadMutation.isPending ? 'Downloading...' : 'Download'}
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Options by Style */}
      <div className="space-y-6">
        {localStyles.map((style) => (
          <div key={style.style_code}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-gray-900">{style.style_description}</h3>
                <div className="flex items-center gap-x-3 mt-0.5">
                  <p className="text-xs text-gray-500">
                    {style.style_code} · {style.total_options} options
                  </p>
                  {style.gim != null && (
                    <span className="text-xs text-gray-500">
                      GIM: <span className="font-medium text-gray-700">{style.gim.toFixed(1)}%</span>
                    </span>
                  )}
                  {style.nim != null && (
                    <span className="text-xs text-gray-500">
                      NIM: <span className="font-medium text-gray-700">{style.nim.toFixed(1)}%</span>
                    </span>
                  )}
                </div>
              </div>
              <Badge variant="secondary" size="sm">
                {style.options.filter(o => o.is_enabled).length} active
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {style.options.map(option => (
                <OptionCard
                  key={option.id}
                  option={option}
                  styleDescription={style.style_description}
                  isEditing={editingOptionId === option.id}
                  onStartEdit={() => handleStartEdit(option.id, option.quantity, option.delivery_date, option.mrp, option.cost_price)}
                  onEndEdit={handleCancelEdit}
                  onQuantityChange={(newQty) => handleQuantityChange(option.id, newQty)}
                  onMrpChange={(newMrp) => handleMrpChange(option.id, newMrp)}
                  onCostPriceChange={(newCost) => handleCostPriceChange(option.id, newCost)}
                  onDeliveryDateChange={(date) => handleDeliveryDateChange(option.id, date)}
                  onToggleActive={() => handleToggleActive(option.id, option.is_enabled)}
                  onSave={() => handleSave(option.id)}
                  isSaving={updateQuantityMutation.isPending}
                  editable={getEditableFields(option.status, costingEnabled)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
