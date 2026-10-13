import { useState, useMemo } from 'react';
import {
  Input,
  Badge,
  PageHeader as PageHeaderCompound,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  Button,
  Modal,
  ConfirmDialog,
} from '@/components/ui';
import { useOTBStore } from '../stores/otb.store';
import { OTBTabNavigation } from '../components/OTBTabNavigation';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Download } from 'lucide-react';
import { useDownload } from '@/hooks/useDownload';
import { IMPETUS_APP_BASE } from '@/lib/api';
import {
  getOTBCategoryRows,
  getOTBMonths,
  type OTBCategoryRow as OTBReviewRow,
  type OTBException,
  type OTBMonth,
} from '../data/mockBuyingModuleV2';
import { useBuyPlanStore, type OTBCatStatus } from '../stores/buyPlan.store';
import { PermissionGate } from '@/permissions';

// ─── Page Header ────────────────────────────────────────────────────

function OTBPageHeader({ extraActions }: { extraActions?: React.ReactNode }): React.ReactNode {
  const fiscalYear = useOTBStore((s) => s.fiscalYear);
  return (
    <PageHeaderCompound
      title="Open-to-Buy"
      actions={
        <>
          {extraActions}
          <Badge variant="outline" size="sm">{fiscalYear}</Badge>
        </>
      }
    />
  );
}

// ─── Status badge helper ─────────────────────────────────────────────

function MonthStatusBadge({ status }: { status: OTBMonth['status'] }): React.ReactNode {
  const map: Record<OTBMonth['status'], { label: string; variant: 'success' | 'warning' | 'error' | 'default' | 'info' }> = {
    approved: { label: 'Approved', variant: 'success' },
    exceptions_pending: { label: 'Exceptions Pending', variant: 'warning' },
    pending_cfo: { label: 'CFO Review', variant: 'info' },
    draft: { label: 'Draft', variant: 'default' },
  }
  const cfg = map[status] ?? { label: status, variant: 'default' }
  return <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>
}

function CatStatusBadge({ status }: { status: OTBCatStatus }): React.ReactNode {
  if (status === 'approved') return <Badge variant="success" size="sm">Approved</Badge>
  if (status === 'rejected') return <Badge variant="error" size="sm">Rejected</Badge>
  if (status === 'held') return <Badge variant="warning" size="sm">Held</Badge>
  return <Badge variant="default" size="sm">Pending</Badge>
}

// ─── Helpers ─────────────────────────────────────────────────────────

function computePendingExceptions(
  saleMonth: string,
  otbResolutions: Record<string, Record<string, string>>,
): number {
  const rows = getOTBCategoryRows(saleMonth)
  let count = 0
  for (const row of rows) {
    for (const exc of (row.exceptions ?? [])) {
      if (!otbResolutions[row.code]?.[exc.id]) count++
    }
  }
  return count
}

// ─── Category Row Inline Panel ────────────────────────────────────────

function CategoryInlinePanel({ month }: { month: OTBMonth }) {
  const {
    otbCategoryStatuses, otbCategoryReductions,
    otbResolutions, resolveOTBException,
    setOTBCategoryStatus, setOTBCategoryReduction,
  } = useBuyPlanStore()

  const rows = useMemo(() => getOTBCategoryRows(month.saleMonth), [month.saleMonth])

  const monthStatuses = otbCategoryStatuses[month.saleMonth] ?? {}
  const monthReductions = otbCategoryReductions[month.saleMonth] ?? {}

  const [exceptionModal, setExceptionModal] = useState<OTBReviewRow | null>(null)
  const [reductionModal, setReductionModal] = useState<OTBReviewRow | null>(null)
  const [reductionPct, setReductionPct] = useState('10')
  const [confirmState, setConfirmState] = useState<{
    open: boolean; catCode: string; action: OTBCatStatus
  }>({ open: false, catCode: '', action: 'approved' })

  function getStatus(catCode: string, mockStatus: string): OTBCatStatus {
    return monthStatuses[catCode] ?? (mockStatus as OTBCatStatus) ?? 'pending'
  }

  const totalApproved = rows.reduce((s, r) => {
    const st = getStatus(r.code, r.status)
    if (st !== 'approved') return s
    const reduction = monthReductions[r.code]
    return s + (reduction != null ? r.otbRequested * (1 - reduction / 100) : r.otbRequested)
  }, 0)

  const pendingExceptions = computePendingExceptions(month.saleMonth, otbResolutions)

  return (
    <div className="bg-gray-50 border-t border-b border-gray-200 px-6 py-4 space-y-3">
      {/* Summary strip */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-4 py-3">
        <span>Total Requested: <strong className="text-gray-900">₹{month.otbRequested.toLocaleString()}L</strong></span>
        <span>Total Approved: <strong className="text-green-700">₹{totalApproved.toFixed(1)}L</strong></span>
        {pendingExceptions > 0 && (
          <span className="text-amber-700">Exceptions Pending: <strong>{pendingExceptions}</strong></span>
        )}
        <span>Deadline: <strong className="text-gray-900">{month.deadline}</strong></span>
        <span>Intake margin: <strong className="text-gray-900">{month.intakeMarginPct.toFixed(1)}%</strong></span>
      </div>

      {/* Category table */}
      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
        <DataTable>
          <DataTableHeader>
            <DataTableHead>Category</DataTableHead>
            <DataTableHead align="right">OTB Requested (₹L)</DataTableHead>
            <DataTableHead align="right">OTB Approved (₹L)</DataTableHead>
            <DataTableHead align="right">Margin%</DataTableHead>
            <DataTableHead align="right">Exceptions</DataTableHead>
            <DataTableHead>Status</DataTableHead>
            <DataTableHead>Actions</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {rows.map((row: OTBReviewRow) => {
              const status = getStatus(row.code, row.status)
              const catResolved = otbResolutions[row.code] ?? {}
              const unresolvedExceptions = row.exceptions.filter(e => !catResolved[e.id])
              const hasUnresolved = unresolvedExceptions.length > 0
              const appliedReduction = monthReductions[row.code]

              return (
                <DataTableRow
                  key={row.code}
                  className={cn(
                    status === 'approved' ? 'bg-green-50' : '',
                    status === 'rejected' ? 'bg-gray-50' : '',
                    status === 'held' ? 'bg-amber-50' : ''
                  )}
                >
                  <DataTableCell><span className="font-medium text-gray-900">{row.category}</span></DataTableCell>
                  <DataTableCell align="right"><span className="font-medium">₹{row.otbRequested.toFixed(1)}L</span></DataTableCell>
                  <DataTableCell align="right">
                    {status === 'approved' ? (
                      <span className="text-green-700 font-medium">
                        ₹{(appliedReduction != null
                          ? row.otbRequested * (1 - appliedReduction / 100)
                          : row.otbRequested
                        ).toFixed(1)}L
                      </span>
                    ) : '—'}
                  </DataTableCell>
                  <DataTableCell align="right">{row.marginPct.toFixed(1)}%</DataTableCell>
                  <DataTableCell align="right">
                    {row.exceptions.length > 0 ? (
                      <Badge variant={hasUnresolved ? 'warning' : 'success'} size="sm">
                        {hasUnresolved ? `${unresolvedExceptions.length} pending` : 'All resolved'}
                      </Badge>
                    ) : <span className="text-gray-400">—</span>}
                  </DataTableCell>
                  <DataTableCell><CatStatusBadge status={status} /></DataTableCell>
                  <DataTableCell>
                    <div className="flex items-center gap-2 flex-wrap">
                      {row.exceptions.length > 0 && hasUnresolved && (
                        <Button size="sm" variant="outline" onClick={() => setExceptionModal(row)}>
                          Resolve ({unresolvedExceptions.length})
                        </Button>
                      )}
                      {status !== 'approved' && status !== 'rejected' && (
                        <PermissionGate module="otb" action="approve">
                          <Button
                            size="sm"
                            disabled={hasUnresolved}
                            title={hasUnresolved ? 'Resolve all exceptions before approving' : undefined}
                            onClick={() => setConfirmState({ open: true, catCode: row.code, action: 'approved' })}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm" variant="outline"
                            onClick={() => setOTBCategoryStatus(month.saleMonth, row.code, 'held')}
                          >
                            Hold
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => setConfirmState({ open: true, catCode: row.code, action: 'rejected' })}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm" variant="outline"
                            disabled={hasUnresolved}
                            onClick={() => setReductionModal(row)}
                          >
                            Approve with Reduction
                          </Button>
                        </PermissionGate>
                      )}
                      {status === 'approved' && (
                        <span className="text-xs text-green-600 font-medium">✓ OTB Approved</span>
                      )}
                      {status === 'rejected' && (
                        <span className="text-xs text-gray-500">Rejected — no OTB generated</span>
                      )}
                    </div>
                  </DataTableCell>
                </DataTableRow>
              )
            })}
          </DataTableBody>
        </DataTable>
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState(prev => ({ ...prev, open }))}
        title={
          confirmState.action === 'approved'
            ? `Approve OTB — ${rows.find(r => r.code === confirmState.catCode)?.category ?? ''}?`
            : `Reject OTB — ${rows.find(r => r.code === confirmState.catCode)?.category ?? ''}?`
        }
        description={
          confirmState.action === 'approved'
            ? 'This will approve the OTB for this category. The amount will be decremented from the monthly OTB balance at PO release.'
            : 'This will reject the OTB for this category. No purchase orders can be raised against it.'
        }
        confirmLabel={confirmState.action === 'approved' ? 'Approve' : 'Reject'}
        variant={confirmState.action === 'rejected' ? 'destructive' : 'default'}
        onConfirm={() => {
          setOTBCategoryStatus(month.saleMonth, confirmState.catCode, confirmState.action)
          setConfirmState(prev => ({ ...prev, open: false }))
        }}
      />

      {/* Exception resolution modal */}
      {exceptionModal && (
        <Modal
          isOpen={!!exceptionModal}
          onClose={() => setExceptionModal(null)}
          title={`Resolve Exceptions — ${exceptionModal.category}`}
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-500">All exceptions must be resolved before this category can be approved.</p>
            {exceptionModal.exceptions.map((ex: OTBException) => {
              const resolution = otbResolutions[exceptionModal.code]?.[ex.id]
              return (
                <div
                  key={ex.id}
                  className={cn(
                    'border rounded-lg p-4 space-y-2',
                    resolution === 'approved' ? 'border-green-200 bg-green-50' : '',
                    resolution === 'rejected' ? 'border-gray-200 bg-gray-50' : '',
                    !resolution ? 'border-amber-200 bg-amber-50' : ''
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{ex.description}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{ex.type}</div>
                    </div>
                    {resolution && (
                      <Badge variant={resolution === 'approved' ? 'success' : 'error'} size="sm">
                        {resolution === 'approved' ? 'Approved' : 'Rejected'}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-gray-500">System value: </span><span className="font-medium">{ex.systemValue}</span></div>
                    <div><span className="text-gray-500">Proposed: </span><span className="font-medium">{ex.proposedValue}</span></div>
                  </div>
                  <div className="text-xs text-gray-600"><span className="text-gray-500">Reason: </span>{ex.reason}</div>
                  {!resolution && (
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={() => resolveOTBException(exceptionModal.code, ex.id, 'approved')}>
                        Approve Exception
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => resolveOTBException(exceptionModal.code, ex.id, 'rejected')}>
                        Reject Exception
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Modal>
      )}

      {/* Approve with Reduction modal */}
      {reductionModal && (
        <Modal
          isOpen={!!reductionModal}
          onClose={() => setReductionModal(null)}
          title={`Approve with Reduction — ${reductionModal.category}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
              CALC-10 descope will be applied. This does <strong>NOT</strong> automatically advance the category pipeline stage.
            </div>
            <div>
              <label htmlFor="reduction-percentage" className="block text-sm font-medium text-gray-700 mb-1">Reduction Percentage (%)</label>
              <Input id="reduction-percentage"
                type="number" min={1} max={100} step={1} value={reductionPct}
                onChange={e => setReductionPct(e.target.value)}
                className="w-32 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="text-xs text-gray-500 mt-1">
                OTB after reduction: ₹{(reductionModal.otbRequested * (1 - parseInt(reductionPct || '0', 10) / 100)).toFixed(1)}L
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setReductionModal(null)}>Cancel</Button>
              <Button size="sm" onClick={() => {
                const pct = parseInt(reductionPct, 10)
                if (!isNaN(pct) && pct > 0 && pct <= 100) {
                  setOTBCategoryReduction(month.saleMonth, reductionModal.code, pct)
                  setOTBCategoryStatus(month.saleMonth, reductionModal.code, 'approved')
                  setReductionModal(null)
                }
              }}>Apply Reduction</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Month Row ────────────────────────────────────────────────────────

function MonthRow({ month }: { month: OTBMonth }) {
  const [expanded, setExpanded] = useState(false)
  const { otbCategoryStatuses, otbResolutions } = useBuyPlanStore()
  const rows = useMemo(() => getOTBCategoryRows(month.saleMonth), [month.saleMonth])
  const monthStatuses = otbCategoryStatuses[month.saleMonth] ?? {}

  const approvedCount = rows.filter(r => {
    const st = monthStatuses[r.code] ?? r.status
    return st === 'approved'
  }).length

  const pendingExceptions = computePendingExceptions(month.saleMonth, otbResolutions)

  return (
    <>
      <tr
        className={cn(
          'cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100',
          expanded ? 'bg-blue-50/30' : ''
        )}
        onClick={() => setExpanded(e => !e)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {expanded
              ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
              : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            }
            <span className="font-semibold text-gray-900">{month.label}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-right font-mono text-sm">₹{month.otbRequested.toFixed(1)}L</td>
        <td className="px-4 py-3 text-center text-sm text-gray-600">{month.categories}</td>
        <td className="px-4 py-3 text-center">
          {pendingExceptions > 0 ? (
            <Badge variant="warning" size="sm">{pendingExceptions} pending</Badge>
          ) : (
            <span className="text-gray-400 text-sm">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-center">
          <span className="text-sm text-gray-600">{approvedCount} / {rows.length} approved</span>
        </td>
        <td className="px-4 py-3 text-center"><MonthStatusBadge status={month.status} /></td>
        <td className="px-4 py-3 text-center text-sm text-gray-500">{month.deadline}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="p-0">
            <CategoryInlinePanel month={month} />
          </td>
        </tr>
      )}
    </>
  )
}

// ─── OTB Month List View ─────────────────────────────────────────────

function OTBMonthListView(): React.ReactNode {
  const months = useMemo(() => getOTBMonths(), [])

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">OTB Review — Approve by Category</h3>
        <p className="text-xs text-gray-500 mt-0.5">Click a month to expand and review categories</p>
      </div>
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Sale Month</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">OTB Requested</th>
            <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">Categories</th>
            <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">Exceptions</th>
            <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">Progress</th>
            <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
            <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">Review Deadline</th>
          </tr>
        </thead>
        <tbody>
          {months.map(month => (
            <MonthRow key={month.saleMonth} month={month} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Page Component ────────────────────────────────────────────

export function OTBCategoryPage(): React.ReactNode {
  const { download, isDownloading } = useDownload(IMPETUS_APP_BASE);

  return (
    <div className="animate-fadeInUp">
      <OTBPageHeader extraActions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => download('/otb/category/all', 'otb_category_all.xlsx')}
          disabled={isDownloading}
          className="shrink-0"
        >
          <Download className="w-4 h-4 mr-1.5" />
          {isDownloading ? 'Downloading...' : 'Download'}
        </Button>
      } />
      <OTBTabNavigation />
      <OTBMonthListView />
    </div>
  );
}
