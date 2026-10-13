import { useState, useMemo, useEffect, useRef, useId } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Loader2, ChevronDown, Info, Send, FileCheck, X, Lock, Search } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Input,
  Checkbox,
  PageHeader,
  Badge,
  Button,
  Modal,
  ConfirmDialog,
  EmptyState,
  FilterSelect,
  FilterClear,
  Skeleton,
  MetricGrid,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { PermissionGate, useModulePermissions } from '@/permissions';
import {
  type CTLStatus,
} from '../data/mockBuyingModuleV2';
import { useCategoryOptionList, useCategoryStoreList, type PlanScope, type PlanOptionFilters } from '../api/categoryBuyPlanApi';
import { controlReason, lakhText, moneyText, numberText, planPath, toOption, type BuyPlanOption } from '../api/categoryPlanData';
import { CategoryQueryState } from '../components/CategoryQueryState';
import { OptionCardsSkeleton } from '../components/CategoryPlanSkeleton';
import { CategoryWorkbenchActionBar } from '../components/CategoryWorkbenchActionBar';
import { useBuyPlanStore } from '../stores/buyPlan.store';
import { Garment } from '../components/Garment';

type WorkbenchTab = 'options' | 'po_summary'

type BadgeVariant = 'success' | 'error' | 'warning' | 'default' | 'primary' | 'secondary' | 'info' | 'outline'

function ctlBadgeVariant(status: CTLStatus): BadgeVariant {
  if (status === 'pass') return 'success'
  if (status === 'fail') return 'error'
  return 'warning'
}

function failedCtls(opt: BuyPlanOption): string[] {
  const failed: string[] = []
  if (opt.ctl01 === 'fail') failed.push('CTL-01')
  if (opt.ctl02 === 'fail') failed.push('CTL-02')
  if (opt.ctl03 === 'fail') failed.push('CTL-03')
  return failed
}

// ── Store × Option PO Summary ─────────────────────────────────────────────────

function StoreOptionPOTable({ options, brickKey, scope }: { options: BuyPlanOption[]; brickKey: string; scope: PlanScope }) {
  const query = useCategoryStoreList(scope)
  const stores = query.data?.items ?? []
  const sizes = [...new Set(stores.flatMap(row => [
    ...row.sizes.map(size => size.size), ...row.pivotal_sizes.map(size => size.size),
  ]))].sort()
  const { poSentOptions, poCreatedOptions, sendForPOApproval } = useBuyPlanStore()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sentConfirmOpen, setSentConfirmOpen] = useState(false)

  const sent = new Set(poSentOptions[brickKey] ?? [])
  const created = poCreatedOptions[brickKey] ?? {}
  const sentCount = options.filter(o => sent.has(o.code) && !created[o.code]).length
  const createdCount = Object.keys(created).length

  const pendingOptions = options.filter(o => !created[o.code])
  const eligibleCodes = pendingOptions.filter(o => !sent.has(o.code)).map(o => o.code)
  const allSelected = eligibleCodes.length > 0 && eligibleCodes.every(c => selected.has(c))

  function toggleSelect(code: string) {
    setSelected(prev => { const n = new Set(prev); if (n.has(code)) n.delete(code); else n.add(code); return n })
  }
  function toggleAll() {
    if (allSelected) setSelected(new Set()); else setSelected(new Set(eligibleCodes))
  }

  if (query.isPending || query.isError) return <CategoryQueryState query={query} variant="stores" />
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Total Options', value: options.length },
          { label: 'Sent for Approval', value: sentCount, highlight: sentCount > 0 },
          { label: 'PO Created', value: createdCount, success: createdCount > 0 },
        ].map(stat => (
          <div key={stat.label} className={cn('bg-white border rounded-lg px-4 py-3 min-w-[120px]', stat.success ? 'border-green-200 bg-green-50' : stat.highlight ? 'border-blue-200 bg-blue-50' : 'border-gray-200')}>
            <div className={cn('text-xs font-medium mb-0.5', stat.success ? 'text-green-600' : stat.highlight ? 'text-blue-600' : 'text-gray-500')}>{stat.label}</div>
            <div className={cn('text-lg font-semibold', stat.success ? 'text-green-700' : stat.highlight ? 'text-blue-700' : 'text-gray-900')}>{stat.value}</div>
          </div>
        ))}
      </div>

      {sentCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
          <Info className="w-4 h-4 shrink-0" />
          <span>{sentCount} option{sentCount !== 1 ? 's' : ''} pending CFO approval. CFO can review at PO Review.</span>
        </div>
      )}

      <PermissionGate module="buyPlan" action="edit">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{selected.size} selected</span>
          <Button size="sm" disabled={selected.size === 0} onClick={() => setSentConfirmOpen(true)}>
            <Send className="w-3.5 h-3.5 mr-1.5" />Send for PO Approval
          </Button>
        </div>
      </PermissionGate>

      {/* Store × Option table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2 text-left">
                <PermissionGate module="buyPlan" action="edit">
                  <Checkbox aria-label="Select all options" checked={allSelected} onCheckedChange={toggleAll} className="rounded" />
                </PermissionGate>
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Option Code</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Store</th>
              <th className="px-3 py-2 text-right font-medium text-gray-600">Total Qty</th>
              {sizes.map(size => <th key={size} className="px-3 py-2 text-center font-medium text-gray-600">{size}</th>)}
              <th className="px-3 py-2 text-left font-medium text-gray-600">Pivotal Sizes</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600">CTL</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">PO Status</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">PO Number</th>
            </tr>
          </thead>
          <tbody>
            {options.flatMap(opt => {
              const poStatus = created[opt.code] ? 'created' : sent.has(opt.code) ? 'sent' : 'draft'
              const isEligible = poStatus === 'draft'
              return stores.filter(row => row.option_code === opt.code).map((store, si) => (
                <tr
                  key={`${opt.code}-${store.site}`}
                  className={cn(
                    si === 0 ? 'border-t border-gray-200' : '',
                    poStatus === 'created' ? 'bg-green-50' : '',
                    poStatus === 'sent' ? 'bg-blue-50/40' : '',
                    'hover:bg-gray-50/50'
                  )}
                >
                  <td className="px-3 py-1.5">
                    {si === 0 && (
                      <PermissionGate module="buyPlan" action="edit">
                        {isEligible && (
                          <Checkbox aria-label={`Select ${opt.code}`} checked={selected.has(opt.code)} onCheckedChange={() => toggleSelect(opt.code)} className="rounded" />
                        )}
                      </PermissionGate>
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    {si === 0 && <span className="font-mono font-medium text-gray-900">{opt.code}</span>}
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="font-medium text-gray-800">{store.attributes.store_name ?? store.site}</div>
                    <div className="text-gray-400">{store.attributes.city ?? '-'}</div>
                  </td>
                  <td className="px-3 py-1.5 text-right font-medium">{store.buy_qty.toLocaleString()}</td>
                  {sizes.map(size => {
                    const allocation = store.sizes.find(row => row.size === size)
                    return <td key={size} className="px-3 py-1.5 text-center text-gray-700">
                      {allocation?.size_qty ?? '-'}
                      {allocation && <span className="text-gray-400 ml-0.5">({allocation.pivotal_ratio}x)</span>}
                    </td>
                  })}
                  <td className="px-3 py-1.5">
                    {si === 0 && (
                      <div className="flex gap-0.5 flex-wrap">
                        {store.pivotal_sizes.filter(s => s.is_pivotal).map(row => row.size).map(s => (
                          <Badge key={s} variant="primary" size="sm">{s}</Badge>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    {si === 0 && (
                      <div className="flex gap-0.5">
                        <Badge size="sm" variant={ctlBadgeVariant(opt.ctl01)}>01</Badge>
                        <Badge size="sm" variant={ctlBadgeVariant(opt.ctl02)}>02</Badge>
                        <Badge size="sm" variant={ctlBadgeVariant(opt.ctl03)}>03</Badge>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    {si === 0 && (
                      <>
                        {poStatus === 'created' && <Badge variant="success" size="sm"><FileCheck className="w-3 h-3 mr-0.5" />PO Created</Badge>}
                        {poStatus === 'sent' && <Badge variant="info" size="sm">Pending CFO</Badge>}
                        {poStatus === 'draft' && <Badge variant="default" size="sm">Draft</Badge>}
                      </>
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    {si === 0 && created[opt.code] && (
                      <span className="font-mono text-green-700 font-medium">{created[opt.code]}</span>
                    )}
                  </td>
                </tr>
              ))
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={sentConfirmOpen}
        onOpenChange={setSentConfirmOpen}
        title="Send for PO Approval?"
        description={`Send ${selected.size} option${selected.size !== 1 ? 's' : ''} to CFO for PO approval. Once sent, CFO can approve and create POs.`}
        confirmLabel="Send"
        onConfirm={() => {
          sendForPOApproval(brickKey, Array.from(selected))
          setSelected(new Set())
          setSentConfirmOpen(false)
        }}
      />
    </div>
  )
}

// ── Qty Formula Modal ────────────────────────────────────────────────────────

function QtyFormulaModal({ opt, runId, onClose }: { opt: BuyPlanOption; runId: string; onClose: () => void }) {
  const query = useCategoryStoreList({ run_id: runId, category: opt.source.category,
    subcategory: opt.source.subcategory, brick: opt.source.brick }, opt.code)
  const stores = query.data?.items ?? []
  const quantity = opt.calcQty ?? opt.sysBuyQty
  const format = (value: number | null | undefined) => value == null ? '-' : value.toLocaleString('en-IN', { maximumFractionDigits: 4 })
  const variables = [
    { label: 'Target closing stock', value: opt.source.ideal_closing_stock },
    { label: 'Expected sales', value: opt.source.expected_sales },
    { label: 'Opening stock', value: opt.source.opening_stock },
    { label: 'Inwards', value: opt.source.inwards },
  ]

  return (
    <Modal isOpen onClose={onClose} title="Buy Quantity Calculation" description={`Option ${opt.code}`} size="full">
      <div className="space-y-4 text-sm">
        <section aria-label="Quantity formula" className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">Formula</h3>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
            <p className="text-sm leading-5 text-gray-900">
              <span className="mr-2 text-xs font-medium text-gray-500">For each store:</span>{' '}
              <span className="font-semibold">Buy quantity</span>
              {' = Round up [ max (0, Target closing stock + Expected sales - Opening stock - Inwards) ]'}
            </p>
            <p className="border-t border-primary/10 pt-2 text-xs text-gray-600">
              Negative quantities become 0. Round up each store's quantity, then add the results.
            </p>
          </div>
        </section>

        <section aria-label="Formula variables" className="space-y-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Current values</h3>
            <p className="text-xs text-gray-500 mt-1">Total units across {opt.storeCount} stores</p>
          </div>
          <MetricGrid columns={4} className="grid-cols-2 gap-2 mb-0">
            {variables.map(variable => <div key={variable.label} className="min-w-0 rounded-lg border border-gray-100 bg-gray-50 p-2.5">
              <div className="text-xs text-gray-500 mb-1">{variable.label}</div>
              <div className="text-base font-semibold tabular-nums text-gray-900 break-words">{format(variable.value)}</div>
            </div>)}
          </MetricGrid>
          <div className="flex flex-wrap gap-y-3 pt-3 text-xs">
            {[
              ['True ROS', format(opt.trueRos), 'avg. units / store / day'],
              ['Forward ROS', format(opt.fwdRos), 'avg. units / store / day'],
              ['Days of Cover', format(opt.daysOfCover), 'days'],
            ].map(([label, value, unit]) => <div key={label} className="min-w-[120px] flex-1">
              <div className="text-gray-500">{label}</div>
              <div className="font-medium text-gray-900 mt-1">{value}</div>
              <div className="text-gray-400 mt-0.5">{unit}</div>
            </div>)}
          </div>
        </section>

        <section aria-label="Store calculations" className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">Calculation by store</h3>
          {query.isPending ? (
            <div role="status" aria-label="Loading store calculations" className="space-y-2">
              <Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" />
            </div>
          ) : query.isError ? (
            <div className="rounded-lg border border-gray-200 p-3 space-y-2">
              <p className="text-sm text-gray-500">Store calculations could not be loaded.</p>
              <Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button>
            </div>
          ) : stores.length === 0 ? <p className="text-xs text-gray-500">No store calculations are available.</p> : (
            <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
              {stores.map(store => {
                const net = store.ideal_closing_stock + store.expected_sales - store.opening_stock - store.inwards
                return <div key={store.site} className="p-2.5 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-gray-900 break-words">{store.attributes.store_name ?? store.site}</span>
                    {store.attributes.store_name && <span className="text-xs text-gray-400">{store.site}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 tabular-nums text-gray-700">
                    <span>{format(store.ideal_closing_stock)}</span><span className="text-gray-400">+</span>
                    <span>{format(store.expected_sales)}</span><span className="text-gray-400">-</span>
                    <span>{format(store.opening_stock)}</span><span className="text-gray-400">-</span>
                    <span>{format(store.inwards)}</span><span className="text-gray-400">=</span>
                    <span className="font-medium">{format(net)}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-gray-500">Round up [ max (0, {format(net)}) ]</span>
                    <span className="font-semibold text-primary">{format(store.buy_qty)} units</span>
                  </div>
                </div>
              })}
            </div>
          )}
          <p className="text-xs text-gray-400">Values are displayed to 4 decimal places. Quantities use the full calculation precision.</p>
        </section>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1">
          <p className="text-xs font-medium text-gray-500">Total buy quantity</p>
          <div className="flex flex-wrap items-baseline gap-2 text-gray-700 tabular-nums">
            {!query.isPending && !query.isError && stores.length > 0 && <>
              <span className="text-sm break-words">{stores.length <= 6
                ? stores.map(store => format(store.buy_qty)).join(' + ')
                : `Sum of ${stores.length} store quantities`}</span>
              <span>=</span>
            </>}
            <span className="text-xl font-semibold text-primary">{format(quantity)}</span>
            <span className="text-xs text-gray-500">units</span>
          </div>
          <p className="text-xs text-gray-500">Sum of the rounded buy quantities across all stores.</p>
        </div>
      </div>
    </Modal>
  )
}

// ── Option Card ───────────────────────────────────────────────────────────────

function OptionCard({ opt, heldDecision, onDecision, canDecide, onQtyClick }: {
  opt: BuyPlanOption
  heldDecision?: 'accept' | 'reject'
  onDecision?: (optionCode: string, decision: 'accept' | 'reject') => void
  canDecide?: boolean
  onQtyClick?: (opt: BuyPlanOption) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const detailsId = useId()
  const reduceMotion = useReducedMotion()
  const isHeld = opt.status === 'held'
  const failed = failedCtls(opt)
  const optionOTB = isHeld || opt.otbValue === null ? null : opt.otbValue / 100000

  return (
    <article aria-label={`Option ${opt.code}`} className={cn(
      'min-w-0 overflow-hidden bg-white rounded-lg border transition-colors [overflow-wrap:anywhere]',
      isHeld
        ? heldDecision === 'accept'
          ? 'border-green-300 bg-green-50/30'
          : heldDecision === 'reject'
          ? 'border-gray-300 opacity-60 bg-gray-50'
          : 'border-amber-300 bg-amber-50/30'
        : opt.isNewOption
        ? 'border-primary/30 bg-primary/5'
        : 'border-gray-200',
    )}>
      <div className="p-3 space-y-2">
        <div className="flex gap-3">
          {/* Image */}
          <div className="relative w-20 h-24 bg-gray-100 rounded overflow-hidden shrink-0">
            {/* Inline SVG silhouette - no network request, and it actually looks
                like the garment rather than a random stock photo. */}
            <div className="w-full h-full flex items-center justify-center">
              <Garment option={opt} size="md" />
            </div>
            <div
              className="absolute bottom-0 left-0 right-0 h-4 border-t"
              // eslint-disable-next-line no-restricted-syntax
              style={{
                backgroundColor: opt.hexCode ?? '#888',
                borderColor: opt.hexCode === '#F5F5F5' ? '#e5e7eb' : (opt.hexCode ?? '#888'),
              }}
            />
          </div>

          {/* Right info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-1">
              <div className="min-w-0 flex-1 basis-20">
                <p className="text-xs font-semibold text-gray-900 truncate" title={opt.colorName ?? opt.code}>{opt.colorName ?? opt.code}</p>
                <p className="text-[10px] text-gray-400 font-mono break-all">{opt.code}</p>
              </div>
              <div className="min-w-0 max-w-full flex flex-col items-end gap-0.5 ml-auto">
                {isHeld ? (
                  <Badge variant="error" size="sm">Held</Badge>
                ) : opt.isNewOption ? (
                  <Badge variant="primary" size="sm">T&S</Badge>
                ) : (
                  <Badge variant="success" size="sm">Ready</Badge>
                )}
                <Badge variant="outline" size="sm" className="max-w-full"><span className="truncate" title={opt.segment}>{opt.segment}</span></Badge>
              </div>
            </div>

            <div className="mt-1.5 space-y-0.5 [&>div]:gap-x-2 [&_span]:min-w-0">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">{isHeld ? 'Calc Qty' : 'Qty'}</span>
                {onQtyClick ? (
                  <button
                    className={cn(
                      'font-semibold underline underline-offset-1',
                      isHeld ? 'text-amber-600 hover:text-amber-700' : 'text-primary hover:text-primary/80',
                    )}
                    onClick={() => onQtyClick(opt)}
                  >
                    {isHeld
                      ? (opt.calcQty ?? 0).toLocaleString()
                      : (opt.sysBuyQty > 0 ? opt.sysBuyQty.toLocaleString() : '0')}
                  </button>
                ) : (
                  <span className={cn('font-semibold', isHeld ? 'text-amber-600' : 'text-gray-900')}>
                    {isHeld
                      ? (opt.calcQty ?? 0).toLocaleString()
                      : (opt.sysBuyQty > 0 ? opt.sysBuyQty.toLocaleString() : '0')}
                  </span>
                )}
              </div>
              {isHeld && (
                <div className="text-[9px] text-amber-500 text-right -mt-0.5">System calc - Held by CTL</div>
              )}
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">True ROS</span>
                <span className="text-gray-700">{opt.trueRos > 0 ? opt.trueRos.toFixed(1) : (isHeld ? opt.trueRos.toFixed(1) : '-')}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">Fwd ROS</span>
                <span className="text-gray-700">{opt.fwdRos > 0 ? opt.fwdRos.toFixed(1) : (isHeld ? opt.fwdRos.toFixed(1) : '-')}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">MRP</span>
                <span className="text-gray-700">{moneyText(opt.mrp)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">Intake margin</span>
                <span className={cn('font-medium', opt.ctl02 === 'fail' ? 'text-red-600' : 'text-gray-700')}>
                  {numberText(opt.intakeMarginPct, 1)}{opt.intakeMarginPct !== null ? '%' : ''}
                </span>
              </div>
              {/* Option OTB */}
              <div className="flex justify-between text-[11px] border-t border-gray-100 pt-0.5 mt-0.5">
                <span className="text-gray-500">Option OTB</span>
                {optionOTB != null ? (
                  <span className="font-medium text-gray-700">₹{optionOTB.toFixed(1)}L</span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CTL badges row */}
        <div className="flex flex-wrap gap-1">
          <Badge size="sm" variant={ctlBadgeVariant(opt.ctl01)}>CTL-01</Badge>
          <Badge size="sm" variant={ctlBadgeVariant(opt.ctl02)}>CTL-02</Badge>
          <Badge size="sm" variant={ctlBadgeVariant(opt.ctl03)}>CTL-03</Badge>
        </div>

        {/* Held reason with descriptive text */}
        {isHeld && failed.length > 0 && (
          <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 space-y-0.5">
            <div className="font-semibold">Held - failed CTL controls:</div>
            {failed.map(ctl => (
              <div key={ctl}>• <span className="font-mono">{ctl}</span>: {controlReason(opt, ctl)}</div>
            ))}
          </div>
        )}

        {/* Commercial decision buttons */}
        {isHeld && canDecide && onDecision && (
          <div className="flex gap-2 pt-1">
            <button
              className={cn(
                'flex-1 text-[11px] rounded px-2 py-1 border font-medium transition-colors',
                heldDecision === 'accept'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'border-green-300 text-green-700 hover:bg-green-50'
              )}
              onClick={() => onDecision(opt.code, 'accept')}
            >
              Accept
            </button>
            <button
              className={cn(
                'flex-1 text-[11px] rounded px-2 py-1 border font-medium transition-colors',
                heldDecision === 'reject'
                  ? 'bg-gray-600 text-white border-gray-600'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              )}
              onClick={() => onDecision(opt.code, 'reject')}
            >
              Reject
            </button>
          </div>
        )}

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          aria-expanded={expanded}
          aria-controls={detailsId}
          className="w-full flex items-center justify-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 pt-1 border-t border-gray-100"
        >
          <ChevronDown aria-hidden="true" className={cn('w-3 h-3 transition-transform duration-200 motion-reduce:transition-none', expanded && 'rotate-180')} />
          {expanded ? 'Show less' : 'Details'}
        </button>
      </div>

      {/* Expanded section */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div id={detailsId} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.24, ease: 'easeInOut' }}
            className="overflow-hidden">
            <div className="px-3 pb-3 space-y-1 text-[11px] text-gray-600">
              <div className="pt-2 grid grid-cols-2 gap-x-4 gap-y-0.5">
                <div><span className="text-gray-400">Brand</span><br /><span className="font-medium">{opt.brand}</span></div>
                <div><span className="text-gray-400">Fit</span><br /><span className="font-medium">{opt.fit}</span></div>
                <div><span className="text-gray-400">Fabric</span><br /><span className="font-medium">{opt.fabric}</span></div>
                <div><span className="text-gray-400">Pattern</span><br /><span className="font-medium">{opt.pattern}</span></div>
                <div><span className="text-gray-400">Fashion Grade</span><br /><span className="font-medium">{opt.segment}</span></div>
                <div><span className="text-gray-400">Family</span><br /><span className="font-medium">{opt.family}</span></div>
                <div><span className="text-gray-400">Cost</span><br /><span className="font-medium">{moneyText(opt.cost)}</span></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  )
}

// ── Filter Bar ────────────────────────────────────────────────────────────────

interface Filters {
  brand: string
  segment: string
  fit: string
  ctlStatus: 'all' | 'pass' | 'warn' | 'held'
  search: string
}

function FilterBar({ filters, onChange, options: opts }: {
  filters: Filters
  onChange: (f: Filters) => void
  options: BuyPlanOption[]
}) {
  const choices = (key: 'brand' | 'fit' | 'segment', label: string) => [
    { value: 'all', label },
    ...Array.from(new Set(opts.map(o => key === 'segment' ? o.source.fashion_grade : o.source.attributes[key])
      .filter((value): value is string => !!value))).sort().map(value => ({ value, label: value })),
  ]
  const hasFilters = filters.brand !== 'all' || filters.segment !== 'all' || filters.fit !== 'all' || filters.ctlStatus !== 'all'

  function select(key: keyof Filters, value: string) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2">
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <FilterSelect value={filters.brand} onChange={value => select('brand', value)} placeholder="All Brands"
          options={choices('brand', 'All Brands')} searchable className="w-40" />
        <FilterSelect value={filters.segment} onChange={value => select('segment', value)} placeholder="All Grades"
          options={choices('segment', 'All Grades')} searchable className="w-40" />
        <FilterSelect value={filters.fit} onChange={value => select('fit', value)} placeholder="All Fits"
          options={choices('fit', 'All Fits')} searchable className="w-36" />
        <FilterSelect value={filters.ctlStatus} onChange={value => select('ctlStatus', value)} placeholder="All CTL Status"
          options={[
            { value: 'all', label: 'All CTL Status' }, { value: 'pass', label: 'All Pass' },
            { value: 'warn', label: 'Has Warnings' }, { value: 'held', label: 'Held' },
          ]} searchable className="w-40" />
        {hasFilters && <FilterClear onClear={() => onChange({ ...filters, brand: 'all', segment: 'all', fit: 'all', ctlStatus: 'all' })} />}
      </div>
      <Input type="text" placeholder="Search option code..." aria-label="Search options"
        value={filters.search} onChange={e => select('search', e.target.value)}
        leftIcon={<Search className="w-4 h-4" />}
        rightIcon={filters.search ? (
          <button type="button" onClick={() => select('search', '')} aria-label="Clear search"
            className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>
        ) : undefined}
        containerClassName="ml-auto w-full sm:w-56" className="h-9 !py-0" />
    </div>
  )
}

// ── Summary Strip ─────────────────────────────────────────────────────────────

function SummaryStrip({ options }: { options: BuyPlanOption[] }) {
  const heldOptions = options.filter(o => o.status === 'held')
  const tsOptions = options.filter(o => o.isNewOption)
  const nonHeld = options.filter(o => o.status !== 'held')

  const totalBuyQty = nonHeld.reduce((s, o) => s + o.sysBuyQty, 0)
  const totalBuyQtyAll = options.reduce((s, o) => s + o.sysBuyQty, 0)
  const totalOTB = nonHeld.some(o => o.otbValue === null) ? null : nonHeld.reduce((s, o) => s + (o.otbValue ?? 0), 0)
  const totalOTBAll = options.some(o => o.otbValue === null) ? null : options.reduce((s, o) => s + (o.otbValue ?? 0), 0)

  const stats = [
    { label: 'Total Options', value: options.length.toString(), color: 'text-gray-900' },
    { label: 'T&S Options', value: tsOptions.length.toString(), color: 'text-primary', bg: 'bg-primary/5 border-primary/20' },
    { label: 'Held Options', value: heldOptions.length.toString(), color: 'text-amber-700', bg: heldOptions.length > 0 ? 'bg-amber-50 border-amber-200' : '' },
    { label: 'Total Buy Qty', value: totalBuyQty.toLocaleString(), color: 'text-gray-900' },
    { label: 'Buy Qty (incl. Held)', value: totalBuyQtyAll.toLocaleString(), color: 'text-gray-600' },
    { label: 'Total OTB', value: lakhText(totalOTB), color: 'text-gray-700', bg: 'bg-indigo-50 border-indigo-200' },
    { label: 'OTB (incl. Held)', value: lakhText(totalOTBAll), color: 'text-indigo-500' },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {stats.map(stat => (
        <div key={stat.label} className={cn('flex-1 bg-white border rounded-lg px-3 py-2 min-w-[110px]', stat.bg ?? 'border-gray-200')}>
          <div className="text-[10px] font-medium text-gray-500 mb-0.5">{stat.label}</div>
          <div className={cn('text-base font-semibold', stat.color)}>{stat.value}</div>
        </div>
      ))}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function BuyPlanOptionsWorkbenchPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { saleMonth, catCode, subCode, brickCode } = useParams<{
    saleMonth: string
    catCode: string
    subCode: string
    brickCode: string
  }>()
  const [searchParams] = useSearchParams()
  const query = useCategoryOptionList({ sale_month: saleMonth, category: catCode, subcategory: subCode,
    brick: brickCode, run_id: searchParams.get('run') ?? undefined })
  const runId = query.data?.run.run_id ?? searchParams.get('run') ?? undefined

  // Back navigation. The single-brick brick-list page auto-forwards (with
  // { replace: true }) into this workbench, so an in-app browser-back lands on
  // the correct parent: the subcategory page for single-brick subs (the brick
  // list entry was replaced out of history) and the brick list for multi-brick
  // subs. On a deep link / refresh there is no in-app history, so fall back to
  // the subcategory page — navigating to the brick-list page there would
  // auto-forward straight back here and make Back look dead (the reported bug).
  const goBack = (): void => {
    if (location.key !== 'default') {
      navigate(-1)
    } else {
      navigate(planPath(saleMonth, catCode, undefined, undefined, runId))
    }
  }

  const isCommercial = useModulePermissions('otb').approve

  const [activeTab, setActiveTab] = useState<WorkbenchTab>('options')
  const [qtyModalOpt, setQtyModalOpt] = useState<BuyPlanOption | null>(null)

  const [filters, setFilters] = useState<Filters>({
    brand: 'all', segment: 'all', fit: 'all', ctlStatus: 'all', search: '',
  })

  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search.trim()), filters.search ? 400 : 0)
    return () => clearTimeout(timer)
  }, [filters.search])
  const backendFilters: PlanOptionFilters = {
    brand: filters.brand === 'all' ? undefined : filters.brand,
    fashion_grade: filters.segment === 'all' ? undefined : filters.segment,
    fit: filters.fit === 'all' ? undefined : filters.fit,
    status: filters.ctlStatus === 'all' ? undefined : filters.ctlStatus,
    search: debouncedSearch || undefined,
  }
  const hasBackendFilters = Object.values(backendFilters).some(value => value !== undefined)
  const filteredQuery = useCategoryOptionList({ sale_month: saleMonth, category: catCode, subcategory: subCode,
    brick: brickCode, run_id: runId }, false, backendFilters, hasBackendFilters && !!query.data)

  const {
    categorySubmissions,
    heldDecisions,
    submitForCommercialReview,
    setHeldDecision,
    calculateOTB,
    approveOTB,
    holdOTB,
    poSentOptions,
    otbCategoryStatuses,
  } = useBuyPlanStore()

  const isOTBApproved = !!(saleMonth && catCode && otbCategoryStatuses[saleMonth]?.[catCode] === 'approved')

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'submit' | 'approve' | 'hold' | null>(null)

  const brickKey = brickCode ?? ''
  const sentCount = (poSentOptions[brickKey] ?? []).length

  const allOptions = useMemo(() => query.data?.items.map(row => toOption(row, query.data.run)) ?? [], [query.data])
  const submissionKey = brickCode ?? ''
  const submissionStatus = categorySubmissions[submissionKey] ?? 'draft'

  const heldOptions = allOptions.filter(o => o.status === 'held')
  const heldCount = heldOptions.length
  const allHeldResolved = heldOptions.length === 0 || heldOptions.every(o => !!heldDecisions[o.code])

  // Auto-calculate OTB when all held options are resolved (commercial role)
  const prevAllHeldResolved = useRef(false)
  useEffect(() => {
    if (
      submissionStatus === 'submitted' &&
      isCommercial &&
      allHeldResolved &&
      !prevAllHeldResolved.current &&
      heldCount > 0
    ) {
      calculateOTB(submissionKey)
    }
    prevAllHeldResolved.current = allHeldResolved
  }, [allHeldResolved, submissionStatus, isCommercial, heldCount, calculateOTB, submissionKey])

  const filteredOptions = useMemo(() => hasBackendFilters
    ? filteredQuery.data?.items.map(row => toOption(row, filteredQuery.data.run)) ?? []
    : allOptions, [hasBackendFilters, filteredQuery.data, allOptions])

  const totalOptions = allOptions.length
  const readyCount = allOptions.filter(o => o.status !== 'held').length

  if (brickCode && (query.isPending || query.isError)) return <CategoryQueryState query={query} variant="options"
    title={`${brickCode} - Options Workbench`} backTo={planPath(saleMonth, catCode, undefined, undefined, runId)} />
  if (!brickCode || allOptions.length === 0) {
    return (
      <div className="animate-fadeInUp p-4 space-y-6">
        <PageHeader title="Options Workbench" onBack={goBack} />
        <EmptyState title="No options found" description="No options are available for this brick." />
      </div>
    )
  }

  const confirmMessages: Record<string, { title: string; description: string; label: string }> = {
    submit: {
      title: 'Submit for Commercial Review?',
      description: `Submit ${totalOptions} options for ${brickCode}? ${heldCount > 0 ? `${heldCount} held option${heldCount > 1 ? 's' : ''} will be included for Commercial to decide.` : 'All options are ready.'}`,
      label: 'Submit',
    },
    approve: {
      title: 'Approve OTB?',
      description: 'Approve the calculated OTB for this brick. This will enable PO creation.',
      label: 'Approve OTB',
    },
    hold: {
      title: 'Hold OTB?',
      description: 'OTB will be placed on hold pending further review.',
      label: 'Hold OTB',
    },
  }

  return (
    <div className="animate-fadeInUp p-4 space-y-4">
      <PageHeader
        title={`${brickCode} - Options Workbench`}
        onBack={goBack}
      />

      {/* Summary strip - always visible */}
      <SummaryStrip options={allOptions} />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('options')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'options' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Options
        </button>
        <button
          onClick={() => setActiveTab('po_summary')}
          title={isOTBApproved ? undefined : 'Available once this category\u2019s OTB is approved'}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'po_summary' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          {!isOTBApproved && <Lock className="w-3 h-3" />}
          PO Summary
          {sentCount > 0 && (
            <span className={cn(
              'rounded-full px-1.5 py-0.5 text-[10px] font-bold min-w-[18px] text-center',
              activeTab === 'po_summary' ? 'bg-primary text-white' : 'bg-blue-100 text-blue-700'
            )}>
              {sentCount}
            </span>
          )}
        </button>
      </div>

      {/* PO Summary tab - BR-131: purchase orders open only after this
          category's OTB is approved. Shown and locked rather than hidden, so a
          reviewer can see the step exists and why it is not yet available. */}
      {activeTab === 'po_summary' && (
        isOTBApproved ? (
          <StoreOptionPOTable options={allOptions} brickKey={brickKey}
            scope={{ run_id: runId, category: catCode, subcategory: subCode, brick: brickCode }} />
        ) : (
          <EmptyState
            icon={Lock}
            title="Purchase orders open after OTB approval"
            description={`${catCode ?? 'This category'} has no approved OTB for ${saleMonth ?? 'this month'}. Until Commercial approves it there is no authorised Open to Buy to raise orders against.`}
            action={
              <Button size="sm" variant="outline" onClick={() => navigate(`/otb/review/${saleMonth ?? ''}`)}>
                Open OTB review
              </Button>
            }
          />
        )
      )}

      {/* Options tab content */}
      {activeTab === 'options' && <>

      {/* Status banner */}
      {submissionStatus === 'submitted' && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
          <Info className="w-4 h-4 shrink-0" />
          <span>Submitted for Commercial review. Awaiting decision on held options.</span>
        </div>
      )}
      {submissionStatus === 'calculating_otb' && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
          <span>Calculating OTB… this may take a moment.</span>
        </div>
      )}
      {submissionStatus === 'otb_ready' && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>OTB calculated. Awaiting Commercial approval.</span>
        </div>
      )}
      {submissionStatus === 'otb_approved' && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>OTB approved. PO creation is now enabled.</span>
        </div>
      )}
      {submissionStatus === 'otb_held' && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>OTB held - awaiting further review.</span>
        </div>
      )}

      {/* Commercial held options panel */}
      {isCommercial && submissionStatus === 'submitted' && heldCount > 0 && (
        <div className="border border-amber-200 rounded-lg bg-amber-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <h3 className="text-sm font-semibold text-amber-800">
              {heldCount} held option{heldCount > 1 ? 's' : ''} - resolve all to auto-calculate OTB
            </h3>
          </div>
          <p className="text-xs text-amber-700">
            Accept to include held options in OTB calculation. Reject to exclude them. OTB will be auto-calculated once all decisions are made.
          </p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] items-start gap-3">
            {heldOptions.map(opt => (
              <OptionCard
                key={opt.code}
                opt={opt}
                heldDecision={heldDecisions[opt.code]}
                onDecision={setHeldDecision}
                canDecide={true}
                onQtyClick={setQtyModalOpt}
              />
            ))}
          </div>
        </div>
      )}

      {/* Filter bar */}
      <FilterBar filters={filters} onChange={setFilters} options={allOptions} />

      {/* All options in this brick share one grid, regardless of style. */}
      <section aria-label="Brick options" className="space-y-3" aria-busy={hasBackendFilters && filteredQuery.isFetching}>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">{allOptions[0]?.source.attributes.brick_name ?? brickCode}</h3>
          <span className="text-xs text-gray-400 ml-auto">{filteredOptions.length} option{filteredOptions.length !== 1 ? 's' : ''}</span>
        </div>
        {hasBackendFilters && filteredQuery.isPending ? <OptionCardsSkeleton />
          : hasBackendFilters && filteredQuery.isError ? (
            <EmptyState title="Options could not be loaded" description="Please retry the request."
              action={<Button variant="outline" onClick={() => void filteredQuery.refetch()}>Retry</Button>} />
          ) : filteredOptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No options match the current filters.</div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] items-start gap-3">
              {filteredOptions.map(opt => (
                <OptionCard key={opt.code} opt={opt} heldDecision={heldDecisions[opt.code]}
                  onDecision={isCommercial && submissionStatus === 'submitted' ? setHeldDecision : undefined}
                  canDecide={isCommercial && submissionStatus === 'submitted'} onQtyClick={setQtyModalOpt} />
              ))}
            </div>
          )}
      </section>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmMessages[confirmAction ?? 'submit']?.title ?? ''}
        description={confirmMessages[confirmAction ?? 'submit']?.description ?? ''}
        confirmLabel={confirmMessages[confirmAction ?? 'submit']?.label ?? 'Confirm'}
        onConfirm={() => {
          if (confirmAction === 'submit') submitForCommercialReview(submissionKey)
          else if (confirmAction === 'approve') approveOTB(submissionKey)
          else if (confirmAction === 'hold') holdOTB(submissionKey)
          setConfirmOpen(false)
          setConfirmAction(null)
        }}
      />

      {/* Sticky action bar */}
      <CategoryWorkbenchActionBar>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
          <span><span className="font-semibold text-gray-900">{readyCount}</span> / {totalOptions} ready</span>
          {heldCount > 0 && <Badge variant="warning" size="sm">{heldCount} held</Badge>}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 [&>button]:w-full sm:[&>button]:w-auto">
          {/* Buyer: submit for commercial review */}
          {submissionStatus === 'draft' && (
            <PermissionGate module="buyPlan" action="edit">
              <Button onClick={() => { setConfirmAction('submit'); setConfirmOpen(true) }}>
                Submit for Commercial Review
              </Button>
            </PermissionGate>
          )}

          {/* OTB approved at category level (highest priority - overrides brick-level submission status) */}
          {isOTBApproved && submissionStatus !== 'otb_approved' && (
            <Badge variant="success">OTB Approved - PO Creation Enabled</Badge>
          )}

          {/* Submitted - waiting (non-commercial) */}
          {submissionStatus === 'submitted' && !isCommercial && !isOTBApproved && (
            <Badge variant="info">Pending Commercial Review</Badge>
          )}

          {/* Commercial: resolve held options to auto-trigger OTB calculation */}
          {submissionStatus === 'submitted' && isCommercial && (
            <>
              <Badge variant="warning">
                {allHeldResolved ? 'Calculating OTB…' : `Resolve ${heldCount - heldOptions.filter(o => heldDecisions[o.code]).length} held options`}
              </Badge>
            </>
          )}

          {/* Calculating */}
          {submissionStatus === 'calculating_otb' && (
            <Badge variant="warning">
              <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
              Calculating OTB
            </Badge>
          )}

          {/* OTB ready - Commercial approves or holds */}
          {submissionStatus === 'otb_ready' && isCommercial && (
            <>
              <Badge variant="success">OTB Ready</Badge>
              <Button variant="outline" onClick={() => { setConfirmAction('hold'); setConfirmOpen(true) }}>Hold OTB</Button>
              <Button onClick={() => { setConfirmAction('approve'); setConfirmOpen(true) }}>Approve OTB</Button>
            </>
          )}
          {submissionStatus === 'otb_ready' && !isCommercial && (
            <Badge variant="info">OTB Calculated - Pending Commercial Approval</Badge>
          )}

          {/* Final states */}
          {submissionStatus === 'otb_approved' && (
            <Badge variant="success">OTB Approved - PO Creation Enabled</Badge>
          )}
          {submissionStatus === 'otb_held' && (
            <Badge variant="warning">OTB Held</Badge>
          )}
        </div>
      </CategoryWorkbenchActionBar>

      </>}

      {/* Qty Formula Modal */}
      {qtyModalOpt && (
        <QtyFormulaModal opt={qtyModalOpt} runId={runId ?? ''} onClose={() => setQtyModalOpt(null)} />
      )}
    </div>
  )
}
