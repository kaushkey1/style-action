import { useState, useMemo } from 'react';
import {
  PageHeader,
  Badge,
  Button,
  FilterBar,
  FilterSelect,
  FilterClear,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  EmptyState,
} from '@/components/ui';
import { useBuyPlanStore } from '../stores/buyPlan.store';
import { useAuthStore } from '@/hooks/useAuthStore';
import {
  getExceptions,
  type ExceptionItem,
  type ExceptionStatus,
} from '../data/mockBuyingModuleV2';

const ROLE_LABELS: Record<string, string> = {
  'buyer': 'Buyer / Planner',
  'pm': 'Product Manager',
  'format-head': 'Category Head',
  'financial-commercial-admin': 'Commercial',
  'ceo': 'CFO / CEO',
  'super-admin': 'Super Admin',
  'planning-super-admin': 'Planning Admin',
}

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'CTL_OVERRIDE', label: 'CTL Override' },
  { value: 'AOP_UPLIFT', label: 'AOP Uplift' },
  { value: 'SCALE_TRIGGER', label: 'Scale Trigger' },
  { value: 'MARGIN_OVERRIDE', label: 'Margin Override' },
  { value: 'VENDOR_MBQ', label: 'Vendor MBQ' },
]

const MONTH_OPTIONS = [
  { value: 'all', label: 'All Months' },
  { value: '2026-10', label: 'October 2026' },
  { value: '2026-11', label: 'November 2026' },
  { value: '2026-12', label: 'December 2026' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

function statusVariant(status: ExceptionStatus): 'warning' | 'success' | 'error' {
  if (status === 'pending') return 'warning'
  if (status === 'approved') return 'success'
  return 'error'
}

export default function ExceptionQueuePage() {
  const { activeRoleSlug } = useAuthStore()

  const [typeFilter, setTypeFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  /* These decisions used to live in component state and evaporated on
     navigation. They now persist and are audited like every other change. */
  const { exceptionStatus, setExceptionStatus } = useBuyPlanStore()
  const localStatuses = exceptionStatus as Record<string, ExceptionStatus>

  const baseExceptions = useMemo(() => getExceptions(activeRoleSlug), [activeRoleSlug])

  const filtered = useMemo(() => {
    return baseExceptions.filter((ex: ExceptionItem) => {
      if (typeFilter !== 'all' && ex.type !== typeFilter) return false
      if (monthFilter !== 'all' && ex.saleMonth !== monthFilter) return false
      const effectiveStatus = localStatuses[ex.id] ?? ex.status
      if (statusFilter !== 'all' && effectiveStatus !== statusFilter) return false
      return true
    })
  }, [baseExceptions, typeFilter, monthFilter, statusFilter, localStatuses])

  const hasFilters = typeFilter !== 'all' || monthFilter !== 'all' || statusFilter !== 'all'

  const roleLabel = activeRoleSlug ? ROLE_LABELS[activeRoleSlug] ?? activeRoleSlug : 'Unknown'

  const handleAction = (exId: string, action: 'approved' | 'rejected') => {
    setExceptionStatus(exId, action)
  }

  return (
    <div className="animate-fadeInUp p-4 space-y-6">
      <PageHeader title="Exception Queue" />

      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg text-sm">
        <span className="text-gray-600">Showing exceptions for role:</span>
        <span className="font-medium text-primary">{roleLabel}</span>
        {activeRoleSlug === 'ceo' || activeRoleSlug === 'super-admin' ? (
          <Badge variant="primary" size="sm">All exceptions visible</Badge>
        ) : (
          <Badge variant="default" size="sm">Role-filtered view</Badge>
        )}
      </div>

      <FilterBar>
        <FilterSelect
          value={typeFilter}
          onChange={setTypeFilter}
          placeholder="All Types"
          options={TYPE_OPTIONS}
        />
        <FilterSelect
          value={monthFilter}
          onChange={setMonthFilter}
          placeholder="All Months"
          options={MONTH_OPTIONS}
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="All Status"
          options={STATUS_OPTIONS}
        />
        {hasFilters && (
          <FilterClear onClear={() => { setTypeFilter('all'); setMonthFilter('all'); setStatusFilter('all') }} />
        )}
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState
          title="No exceptions found"
          description="No exceptions match your filters or role access level."
        />
      ) : (
        <DataTable>
          <DataTableHeader>
              <DataTableHead>Exception Type</DataTableHead>
              <DataTableHead>OTB Ref</DataTableHead>
              <DataTableHead>Sale Month</DataTableHead>
              <DataTableHead>Category</DataTableHead>
              <DataTableHead>Option Code</DataTableHead>
              <DataTableHead>System Value</DataTableHead>
              <DataTableHead>Proposed Value</DataTableHead>
              <DataTableHead>Reason</DataTableHead>
              <DataTableHead>Raised By</DataTableHead>
              <DataTableHead>Current Step</DataTableHead>
              <DataTableHead>Status</DataTableHead>
              <DataTableHead>Actions</DataTableHead>
</DataTableHeader>
          <DataTableBody>
            {filtered.map((ex: ExceptionItem) => {
              const effectiveStatus = localStatuses[ex.id] ?? ex.status
              const canAct =
                effectiveStatus === 'pending' &&
                ex.currentApprovalStep === activeRoleSlug

              return (
                <DataTableRow key={ex.id}>
                  <DataTableCell>
                    <Badge variant="default" size="sm">
                      {ex.type.replace(/_/g, ' ')}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="font-mono text-xs">{ex.otbRef}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-xs text-gray-600">
                      {MONTH_OPTIONS.find(m => m.value === ex.saleMonth)?.label ?? ex.saleMonth}
                    </span>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-xs">{ex.category}</span>
                  </DataTableCell>
                  <DataTableCell>
                    {ex.optionCode !== '-' ? (
                      <span className="font-mono text-xs">{ex.optionCode}</span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-xs">{ex.systemValue}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-xs font-medium">{ex.proposedValue}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-xs text-gray-600 max-w-[180px] block truncate" title={ex.reason}>
                      {ex.reason}
                    </span>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-xs">{ex.raisedBy}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-xs text-gray-600">
                      {ROLE_LABELS[ex.currentApprovalStep] ?? ex.currentApprovalStep}
                    </span>
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant={statusVariant(effectiveStatus)} size="sm">
                      {effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1)}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell>
                    {canAct ? (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => handleAction(ex.id, 'approved')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(ex.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {effectiveStatus !== 'pending' ? 'Actioned' : 'Not your step'}
                      </span>
                    )}
                  </DataTableCell>
                </DataTableRow>
              )
            })}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  )
}
