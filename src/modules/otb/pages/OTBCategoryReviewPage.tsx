import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Input,
  PageHeader,
  Badge,
  Button,
  Modal,
  ConfirmDialog,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { PermissionGate } from '@/permissions';
import {
  getOTBCategoryRows,
  getOTBMonths,
  type OTBCategoryRow,
  type OTBException,
} from '../data/mockBuyingModuleV2';
import { useBuyPlanStore } from '../stores/buyPlan.store';

type CatStatus = 'pending' | 'approved' | 'rejected' | 'held'

export default function OTBCategoryReviewPage() {
  const { saleMonth } = useParams<{ saleMonth: string }>()
  const {
    resolveOTBException, otbResolutions,
    otbCategoryStatuses, setOTBCategoryStatus,
    otbCategoryReductions, setOTBCategoryReduction,
    mintOTBNumber, logAudit,
  } = useBuyPlanStore()

  const months = getOTBMonths()
  const month = months.find(m => m.saleMonth === saleMonth)
  const rows = useMemo(() => getOTBCategoryRows(saleMonth ?? ''), [saleMonth])

  /* These decisions used to live in component state, so approving an OTB never
     reached the workbench — which reads otbCategoryStatuses to decide whether
     PO creation is unlocked (BR-131). The chain was silently broken. */
  const monthKey = saleMonth ?? ''
  const categoryStatuses: Record<string, CatStatus> = useMemo(
    () => ({
      ...Object.fromEntries(rows.map(r => [r.code, r.status as CatStatus])),
      ...(otbCategoryStatuses[monthKey] ?? {}),
    }),
    [rows, otbCategoryStatuses, monthKey],
  )
  const [exceptionModal, setExceptionModal] = useState<OTBCategoryRow | null>(null)
  const [reductionModal, setReductionModal] = useState<OTBCategoryRow | null>(null)
  const [reductionPct, setReductionPct] = useState('10')
  const reductionApplied = otbCategoryReductions[monthKey] ?? {}

  const [confirmState, setConfirmState] = useState<{
    open: boolean
    catCode: string
    action: CatStatus
  }>({ open: false, catCode: '', action: 'approved' })

  const setStatus = (catCode: string, action: CatStatus) => {
    setOTBCategoryStatus(monthKey, catCode, action)
    const num = action === 'approved' ? mintOTBNumber(monthKey, catCode) : null
    logAudit({
      screen: 'OTB', action: `OTB ${action}`, object: 'OTB category',
      key: num ?? `${monthKey} · ${catCode}`,
      from: categoryStatuses[catCode] ?? 'pending', to: action,
    })
  }

  const openConfirm = (catCode: string, action: CatStatus) => {
    setConfirmState({ open: true, catCode, action })
  }

  const resolvedMap = otbResolutions

  if (!saleMonth || !month) {
    return (
      <div className="animate-fadeInUp p-4 space-y-6">
        <PageHeader title="OTB Review" backTo="/otb/review" />
        <EmptyState title="Month not found" description="No OTB data for this sale month." />
      </div>
    )
  }

  const totalApproved = rows.reduce((s, r) => {
    return categoryStatuses[r.code] === 'approved' ? s + r.otbRequested : s
  }, 0)

  return (
    <div className="animate-fadeInUp p-4 space-y-6">
      <PageHeader title={`OTB Review — ${month.label}`} backTo="/otb/review" />

      {/* Month summary strip */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">Month Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {[
              { label: 'Total Requested', value: `₹${month.otbRequested.toLocaleString()}L` },
              { label: 'Total Approved', value: `₹${totalApproved.toFixed(1)}L` },
              { label: 'Exceptions Pending', value: month.exceptionsPending.toString(), highlight: month.exceptionsPending > 0 },
              { label: 'Review Deadline', value: month.deadline },
              { label: 'OTB Period Ends', value: month.otbPeriodEnd },
              { label: 'Avg intake margin', value: `${month.intakeMarginPct.toFixed(1)}%` },
            ].map((stat) => (
              <div key={stat.label} className="min-w-[110px]">
                <div className={cn('text-xs font-medium mb-0.5', stat.highlight ? 'text-amber-600' : 'text-gray-500')}>
                  {stat.label}
                </div>
                <div className={cn('text-lg font-semibold', stat.highlight ? 'text-amber-700' : 'text-gray-900')}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
          {rows.map((row: OTBCategoryRow) => {
            const status = categoryStatuses[row.code]
            const catResolved = resolvedMap[row.code] ?? {}
            const unresolvedExceptions = row.exceptions.filter(e => !catResolved[e.id])
            const hasUnresolved = unresolvedExceptions.length > 0
            const appliedReduction = reductionApplied[row.code]

            return (
              <DataTableRow
                key={row.code}
                className={cn(
                  status === 'approved' ? 'bg-green-50' : '',
                  status === 'rejected' ? 'bg-gray-50' : '',
                  status === 'held' ? 'bg-amber-50' : ''
                )}
              >
                <DataTableCell>
                  <span className="font-medium text-gray-900">{row.category}</span>
                </DataTableCell>
                <DataTableCell align="right">
                  <span className="font-medium">₹{row.otbRequested.toFixed(1)}L</span>
                </DataTableCell>
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
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </DataTableCell>
                <DataTableCell>
                  {status === 'approved' && <Badge variant="success">Approved</Badge>}
                  {status === 'rejected' && <Badge variant="error">Rejected</Badge>}
                  {status === 'held' && <Badge variant="warning">Held</Badge>}
                  {status === 'pending' && <Badge variant="default">Pending</Badge>}
                </DataTableCell>
                <DataTableCell>
                  <div className="flex items-center gap-2 flex-wrap">
                    {row.exceptions.length > 0 && hasUnresolved && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExceptionModal(row)}
                      >
                        Resolve ({unresolvedExceptions.length})
                      </Button>
                    )}

                    {status !== 'approved' && status !== 'rejected' && (
                      <PermissionGate module="otb" action="approve">
                        <Button
                          size="sm"
                          disabled={hasUnresolved}
                          title={hasUnresolved ? 'Resolve all exceptions before approving' : undefined}
                          onClick={() => openConfirm(row.code, 'approved')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setStatus(row.code, 'held')}
                        >
                          Hold
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openConfirm(row.code, 'rejected')}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
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
          setStatus(confirmState.catCode, confirmState.action)
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
            <p className="text-sm text-gray-500">
              All exceptions must be resolved before this category can be approved.
            </p>
            {exceptionModal.exceptions.map((ex: OTBException) => {
              const resolution = resolvedMap[exceptionModal.code]?.[ex.id]
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
                    <div>
                      <span className="text-gray-500">System value: </span>
                      <span className="font-medium">{ex.systemValue}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Proposed: </span>
                      <span className="font-medium">{ex.proposedValue}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    <span className="text-gray-500">Reason: </span>{ex.reason}
                  </div>
                  {!resolution && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => resolveOTBException(exceptionModal.code, ex.id, 'approved')}
                      >
                        Approve Exception
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveOTBException(exceptionModal.code, ex.id, 'rejected')}
                      >
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
              <label htmlFor="reduction-percentage" className="block text-sm font-medium text-gray-700 mb-1">
                Reduction Percentage (%)
              </label>
              <Input id="reduction-percentage"
                type="number"
                min={1}
                max={100}
                step={1}
                value={reductionPct}
                onChange={(e) => setReductionPct(e.target.value)}
                className="w-32 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="text-xs text-gray-500 mt-1">
                OTB after reduction: ₹{(reductionModal.otbRequested * (1 - parseInt(reductionPct || '0', 10) / 100)).toFixed(1)}L
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setReductionModal(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const pct = parseInt(reductionPct, 10)
                  if (!isNaN(pct) && pct > 0 && pct <= 100) {
                    setOTBCategoryReduction(monthKey, reductionModal.code, pct)
                    logAudit({
                      screen: 'OTB', action: 'Approved with reduction', object: 'OTB category',
                      key: `${monthKey} · ${reductionModal.code}`, from: 'pending', to: `−${pct}%`,
                    })
                    setStatus(reductionModal.code, 'approved')
                    setReductionModal(null)
                  }
                }}
              >
                Apply Reduction
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
