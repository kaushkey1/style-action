import { useState, useMemo } from 'react';
import { ChevronRight, Package, MapPin } from 'lucide-react';
import {
  PageHeader,
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  EmptyState,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { getPOItems, getPOStoreBreakdown, type POItem, type POStoreBreakdown } from '../data/mockBuyingModuleV2';
import { Garment } from '../components/Garment';
import { useBuyingCapability } from '../useBuyingCapability';
import { useBuyPlanStore, type POItemStatus } from '../stores/buyPlan.store';

type POViewMode = 'months' | 'stores' | 'store-detail'

const MONTHS = [
  { saleMonth: '2026-10', label: 'October 2026' },
  { saleMonth: '2026-11', label: 'November 2026' },
  { saleMonth: '2026-12', label: 'December 2026' },
]

function getMonthSummary(items: POItem[]) {
  const total = items.reduce((s, p) => s + p.totalValueLakh, 0)
  const pending = items.filter(p => p.status === 'pending').length
  const released = items.filter(p => p.status === 'released').length
  const flagged = items.filter(p => p.status === 'flagged').length
  return { total, pending, released, flagged, count: items.length }
}

function dcBadge(dcCode: string, dcName: string) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <Badge variant="outline" size="sm" className="font-mono text-xs cursor-default">
            {dcCode}
          </Badge>
        </span>
      </TooltipTrigger>
      <TooltipContent>{dcName}</TooltipContent>
    </Tooltip>
  )
}

export default function POReviewPage() {
  const allPOs = useMemo(() => getPOItems(), [])
  const { poSentOptions, poCreatedOptions, cfoCertifyPOs, poItemStatuses, setPoItemStatus, setPoItemStatuses } = useBuyPlanStore()

  const [view, setView] = useState<POViewMode>('months')
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [selectedStore, setSelectedStore] = useState<POStoreBreakdown | null>(null)
  const [confirmRelease, setConfirmRelease] = useState(false)
  const canApprovePO = useBuyingCapability('po.approve')
  const canReleasePO = useBuyingCapability('po.release')

  function getEffStatus(po: POItem): POItemStatus {
    return (poItemStatuses[po.id] as POItemStatus | undefined) ?? (po.status as POItemStatus)
  }

  // memoised: it feeds storeMap's dependency array, and a fresh array render
  // would rebuild the whole store aggregation on every keystroke
  const monthItems = useMemo(
    () => (selectedMonth ? allPOs.filter(po => po.saleMonth === selectedMonth) : []),
    [selectedMonth, allPOs],
  )
  const storeSubmittedBricks = Object.entries(poSentOptions).filter(([, codes]) => codes.length > 0)

  // Build store-level view: aggregate stores across all POs in the selected month
  const storeMap = useMemo(() => {
    if (!selectedMonth) return new Map<string, { store: POStoreBreakdown; poIds: string[] }>()
    const map = new Map<string, { store: POStoreBreakdown; poIds: string[] }>()
    for (const po of monthItems) {
      const breakdown = getPOStoreBreakdown(po.id)
      for (const storeBreak of breakdown) {
        const existing = map.get(storeBreak.storeCode)
        if (existing) {
          existing.poIds.push(po.id)
          existing.store.totalUnits += storeBreak.totalUnits
          existing.store.options.push(...storeBreak.options)
        } else {
          map.set(storeBreak.storeCode, {
            store: { ...storeBreak, options: [...storeBreak.options] },
            poIds: [po.id],
          })
        }
      }
    }
    return map
  }, [selectedMonth, monthItems])

  const storeList = useMemo(() => Array.from(storeMap.values()).map(v => v.store), [storeMap])

  const releasedCount = monthItems.filter(po => getEffStatus(po) === 'released').length
  const approvedCount = monthItems.filter(po => getEffStatus(po) === 'approved').length
  const pendingCount = monthItems.filter(po => getEffStatus(po) === 'pending').length
  const totalMonthValue = monthItems.reduce((s, p) => s + p.totalValueLakh, 0)
  const hasApprovable = approvedCount > 0

  const selectedMonthLabel = MONTHS.find(m => m.saleMonth === selectedMonth)?.label ?? ''

  const monthsWithSummary = MONTHS.map(m => {
    const items = allPOs.filter(p => p.saleMonth === m.saleMonth)
    const summary = getMonthSummary(items)
    const storeSent = storeSubmittedBricks.length
    return { ...m, ...summary, storeSent }
  })

  function releaseMonth() {
    monthItems
      .filter(po => getEffStatus(po) === 'approved')
      .forEach(po => { setPoItemStatus(po.id, 'released') })
    Object.keys(poSentOptions).forEach(key => cfoCertifyPOs(key))
    setConfirmRelease(false)
  }

  function approveAllPending() {
    const updates: Record<string, POItemStatus> = {}
    monthItems
      .filter(po => getEffStatus(po) === 'pending' && po.checksFailed === 0)
      .forEach(po => { updates[po.id] = 'approved' })
    setPoItemStatuses(updates)
    Object.keys(poSentOptions).forEach(brickKey => {
      if ((poSentOptions[brickKey] ?? []).length > 0) cfoCertifyPOs(brickKey)
    })
  }

  // ─── Store Detail View ───────────────────────────────────────────────────────
  if (view === 'store-detail' && selectedStore) {
    return (
      <div className="animate-fadeInUp p-4 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
          <button onClick={() => { setView('months'); setSelectedMonth(null); setSelectedStore(null) }} className="hover:text-gray-700 transition-colors">
            PO Review
          </button>
          <span className="text-gray-400">/</span>
          <button onClick={() => { setView('stores'); setSelectedStore(null) }} className="hover:text-gray-700 transition-colors">
            {selectedMonthLabel}
          </button>
          <span className="text-gray-400">/</span>
          <span className="font-medium text-gray-900">{selectedStore.storeCode} — {selectedStore.storeName}</span>
        </div>

        {/* Store info card */}
        <div className="bg-white border border-gray-200 rounded-lg px-5 py-4 flex items-center gap-4 flex-wrap">
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Store</div>
            <div className="text-base font-semibold text-gray-900">{selectedStore.storeName}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Code</div>
            <div className="font-mono text-sm font-medium text-gray-900">{selectedStore.storeCode}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">City</div>
            <div className="flex items-center gap-1 text-sm text-gray-900">
              <MapPin className="w-3 h-3 text-gray-400" />
              {selectedStore.city}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">DC</div>
            <div className="flex items-center gap-2">
              {dcBadge(selectedStore.dcCode, selectedStore.dcName)}
              <span className="text-xs text-gray-500">{selectedStore.dcName}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Total Units</div>
            <div className="text-sm font-semibold text-gray-900">{selectedStore.totalUnits.toLocaleString()}</div>
          </div>
        </div>

        {/* Options table */}
        <DataTable>
          <DataTableHeader>
            <DataTableHead>Image</DataTableHead>
            <DataTableHead>Option Code</DataTableHead>
            <DataTableHead>Description</DataTableHead>
            <DataTableHead align="right">S</DataTableHead>
            <DataTableHead align="right">M</DataTableHead>
            <DataTableHead align="right">L</DataTableHead>
            <DataTableHead align="right">XL</DataTableHead>
            <DataTableHead align="right">Total Qty</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {selectedStore.options.map((opt, i) => (
              <DataTableRow key={`${opt.optionCode}-${i}`}>
                <DataTableCell>
                  <div className="w-10 h-14 bg-gray-100 rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                    {/* Inline silhouette — the fixture no longer reaches picsum.photos */}
                    <Garment option={{ code: opt.optionCode, description: opt.description }} size="xs" />
                  </div>
                  </DataTableCell>
                <DataTableCell>
                  <span className="font-mono text-xs font-medium text-gray-900">{opt.optionCode}</span>
                </DataTableCell>
                <DataTableCell>
                  <span className="text-xs text-gray-700">{opt.description}</span>
                </DataTableCell>
                <DataTableCell align="right">
                  <span className="text-xs font-medium">{opt.sizes.S}</span>
                </DataTableCell>
                <DataTableCell align="right">
                  <span className="text-xs font-medium">{opt.sizes.M}</span>
                </DataTableCell>
                <DataTableCell align="right">
                  <span className="text-xs font-medium">{opt.sizes.L}</span>
                </DataTableCell>
                <DataTableCell align="right">
                  <span className="text-xs font-medium">{opt.sizes.XL}</span>
                </DataTableCell>
                <DataTableCell align="right">
                  <span className="font-semibold text-gray-900">{opt.qty.toLocaleString()}</span>
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      </div>
    )
  }

  // ─── Store List View ─────────────────────────────────────────────────────────
  if (view === 'stores' && selectedMonth) {
    return (
      <div className="animate-fadeInUp p-4 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button onClick={() => { setView('months'); setSelectedMonth(null) }} className="hover:text-gray-700 transition-colors">
            PO Review
          </button>
          <span className="text-gray-400">/</span>
          <span className="font-medium text-gray-900">{selectedMonthLabel}</span>
        </div>

        {/* Summary strip */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Stores', value: storeList.length },
            { label: 'Total POs', value: monthItems.length },
            { label: 'Total Value', value: `₹${totalMonthValue.toFixed(1)}L` },
            { label: 'Approved', value: approvedCount, success: approvedCount > 0 },
            { label: 'Released', value: releasedCount, neutral: true },
            { label: 'Pending', value: pendingCount, highlight: pendingCount > 0 },
          ].map(stat => (
            <div
              key={stat.label}
              className={cn(
                'bg-white border rounded-lg px-4 py-3 min-w-[100px]',
                stat.success ? 'border-green-200 bg-green-50' :
                stat.highlight ? 'border-amber-200 bg-amber-50' : 'border-gray-200'
              )}
            >
              <div className={cn('text-xs font-medium mb-0.5', stat.success ? 'text-green-600' : stat.highlight ? 'text-amber-600' : 'text-gray-500')}>
                {stat.label}
              </div>
              <div className={cn('text-lg font-semibold', stat.success ? 'text-green-700' : stat.highlight ? 'text-amber-700' : 'text-gray-900')}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* BR-127 gate 4 — the PO gates belong to the CFO. Guarding them with
            `otb.approve` handed them to Commercial as well, and the reducer
            would then have refused the click. Approve and release are separate
            capabilities and are guarded separately. */}
        {(canApprovePO || canReleasePO) && (
          <div
            // eslint-disable-next-line design-system/prefer-section-header -- filter strip, not a section header
            className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg gap-4"
          >
            <div>
              <div className="text-sm font-medium text-gray-900">CFO: Release Approved POs</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {hasApprovable
                  ? `${approvedCount} PO${approvedCount !== 1 ? 's' : ''} ready for release. Once released, POs are auto-created and cannot be modified.`
                  : 'No approved POs to release for this month.'}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {pendingCount > 0 && canApprovePO && (
                <Button size="sm" variant="outline" onClick={approveAllPending}>
                  Approve All ({pendingCount})
                </Button>
              )}
              {canReleasePO && (
                <Button
                  disabled={!hasApprovable}
                  onClick={() => setConfirmRelease(true)}
                >
                  Release All Approved
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Store table */}
        {storeList.length === 0 ? (
          <EmptyState title="No store data" description="Store-level PO breakdown is not available for this month." />
        ) : (
          <DataTable>
            <DataTableHeader>
              <DataTableHead>Store Code</DataTableHead>
              <DataTableHead>Store Name</DataTableHead>
              <DataTableHead>City</DataTableHead>
              <DataTableHead>DC</DataTableHead>
              <DataTableHead align="right">Options</DataTableHead>
              <DataTableHead align="right">Total Units</DataTableHead>
              <DataTableHead></DataTableHead>
            </DataTableHeader>
            <DataTableBody>
              {storeList.map(store => (
                <DataTableRow
                  key={store.storeCode}
                  className="cursor-pointer"
                  onClick={() => { setSelectedStore(store); setView('store-detail') }}
                >
                  <DataTableCell>
                    <span className="font-mono text-xs font-medium text-gray-900">{store.storeCode}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-sm font-medium text-gray-900">{store.storeName}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                      {store.city}
                    </div>
                  </DataTableCell>
                  <DataTableCell>
                    {dcBadge(store.dcCode, store.dcName)}
                  </DataTableCell>
                  <DataTableCell align="right">
                    <span className="text-sm">{store.options.length}</span>
                  </DataTableCell>
                  <DataTableCell align="right">
                    <span className="font-medium">{store.totalUnits.toLocaleString()}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}

        {/* Workbench-submitted options note */}
        {storeSubmittedBricks.length > 0 && (
          <div className="border border-blue-200 rounded-lg bg-blue-50 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600 shrink-0" />
              <h3 className="text-sm font-semibold text-blue-800">Options sent from Options Workbench</h3>
            </div>
            <div className="flex flex-col gap-1.5">
              {storeSubmittedBricks.map(([brick, codes]) => {
                const created = poCreatedOptions[brick] ?? {}
                const createdCount = Object.keys(created).length
                return (
                  <div key={brick} className="flex items-center justify-between bg-white rounded px-3 py-2 text-xs">
                    <div>
                      <span className="font-mono font-medium text-gray-900">{brick}</span>
                      <span className="text-gray-500 ml-2">{codes.length} option{codes.length !== 1 ? 's' : ''}</span>
                    </div>
                    {createdCount > 0 ? (
                      <Badge variant="success" size="sm">{createdCount} PO{createdCount !== 1 ? 's' : ''} created</Badge>
                    ) : (
                      <Badge variant="default" size="sm">Pending release</Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <ConfirmDialog
          open={confirmRelease}
          onOpenChange={setConfirmRelease}
          title="Release All Approved POs?"
          description={`Release ${approvedCount} approved purchase order${approvedCount !== 1 ? 's' : ''} for ${selectedMonthLabel}. POs will be auto-created and routed to each store's DC. Cannot be modified after release.`}
          confirmLabel="Release"
          onConfirm={releaseMonth}
        />
      </div>
    )
  }

  // ─── Month List View ──────────────────────────────────────────────────────────
  return (
    <div className="animate-fadeInUp p-4 space-y-6">
      <PageHeader title="PO Review" />
      <p className="text-sm text-gray-500 -mt-4">
        CFO review and release of purchase orders. Select a month to view store-level PO details.
      </p>

      {monthsWithSummary.every(m => m.count === 0 && m.storeSent === 0) ? (
        <EmptyState
          title="No purchase orders"
          description="No purchase orders have been generated yet. OTB must be approved before POs are created."
        />
      ) : (
        <DataTable>
          <DataTableHeader>
            <DataTableHead>Sale Month</DataTableHead>
            <DataTableHead align="right">POs</DataTableHead>
            <DataTableHead align="right">Total Value (₹L)</DataTableHead>
            <DataTableHead align="right">Pending Review</DataTableHead>
            <DataTableHead align="right">Released</DataTableHead>
            <DataTableHead align="right">Flagged</DataTableHead>
            <DataTableHead></DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {monthsWithSummary.map(m => (
              <DataTableRow
                key={m.saleMonth}
                onClick={() => { setSelectedMonth(m.saleMonth); setView('stores') }}
                className="cursor-pointer"
              >
                <DataTableCell>
                  <span className="font-medium text-gray-900">{m.label}</span>
                </DataTableCell>
                <DataTableCell align="right">{m.count}</DataTableCell>
                <DataTableCell align="right">
                  {m.total > 0 ? `₹${m.total.toFixed(1)}L` : '—'}
                </DataTableCell>
                <DataTableCell align="right">
                  {m.pending > 0 ? <Badge variant="warning" size="sm">{m.pending}</Badge> : <span className="text-gray-400">—</span>}
                </DataTableCell>
                <DataTableCell align="right">
                  {m.released > 0 ? <Badge variant="success" size="sm">{m.released}</Badge> : <span className="text-gray-400">—</span>}
                </DataTableCell>
                <DataTableCell align="right">
                  {m.flagged > 0 ? <Badge variant="error" size="sm">{m.flagged}</Badge> : <span className="text-gray-400">—</span>}
                </DataTableCell>
                <DataTableCell>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  )
}
