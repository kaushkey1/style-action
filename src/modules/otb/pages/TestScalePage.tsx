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
import { cn } from '@/lib/utils';
import { useModulePermissions } from '@/permissions';
import {
  getTestScaleOptions,
  type TestScaleOption,
  type TestScaleStatus,
} from '../data/mockBuyingModuleV2';

type BadgeVariant = 'success' | 'error' | 'warning' | 'default' | 'primary' | 'secondary' | 'info' | 'outline'

function getTriggerPct(measured: number, target: number): number {
  if (target === 0) return 0
  return Math.round((measured / target) * 100)
}

function getStatusConfig(status: TestScaleStatus, triggerPct: number): { label: string; variant: BadgeVariant } {
  if (status === 'closed') return { label: 'Closed', variant: 'default' }
  if (status === 'scale_triggered') return { label: 'Scale Triggered', variant: 'success' }
  if (triggerPct >= 70) return { label: 'In Test', variant: 'warning' }
  return { label: 'Below Target', variant: 'error' }
}

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'scale_triggered', label: 'Scale Triggered' },
  { value: 'in_test', label: 'In Test' },
  { value: 'below_target', label: 'Below Target' },
  { value: 'closed', label: 'Closed' },
]

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: "Men's Casuals", label: "Men's Casuals" },
  { value: "Men's Formals", label: "Men's Formals" },
  { value: "Women's Indian Wear", label: "Women's Indian Wear" },
]

export default function TestScalePage() {
  const { approve: canApprove } = useModulePermissions('buyPlan')

  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [localActions, setLocalActions] = useState<Record<string, 'scaled' | 'closed' | 'extended'>>({})

  const allOptions = useMemo(() => getTestScaleOptions(), [])

  const filtered = useMemo(() => {
    return allOptions.filter((item: TestScaleOption) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
      if (statusFilter !== 'all') {
        const triggerPct = getTriggerPct(item.measuredRos, item.targetRos)
        const { label } = getStatusConfig(item.status, triggerPct)
        if (statusFilter === 'scale_triggered' && label !== 'Scale Triggered') return false
        if (statusFilter === 'in_test' && label !== 'In Test') return false
        if (statusFilter === 'below_target' && label !== 'Below Target') return false
        if (statusFilter === 'closed' && label !== 'Closed') return false
      }
      return true
    })
  }, [allOptions, categoryFilter, statusFilter])

  const hasFilters = categoryFilter !== 'all' || statusFilter !== 'all'

  return (
    <div className="animate-fadeInUp p-4 space-y-6">
      <PageHeader
        title="Test & Scale Tracker"
      />
      <p className="text-sm text-gray-500 -mt-4">
        Monitor new option performance across test stores. Scale trigger at 100% of target ROS.
      </p>

      <FilterBar>
        <FilterSelect
          value={categoryFilter}
          onChange={setCategoryFilter}
          placeholder="All Categories"
          options={CATEGORY_OPTIONS}
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="All Status"
          options={STATUS_FILTER_OPTIONS}
        />
        {hasFilters && (
          <FilterClear onClear={() => { setCategoryFilter('all'); setStatusFilter('all') }} />
        )}
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState
          title="No test options found"
          description="No options in test phase match the selected filters."
        />
      ) : (
        <DataTable>
          <DataTableHeader>
              <DataTableHead>Option Code</DataTableHead>
              <DataTableHead>Category</DataTableHead>
              <DataTableHead>Brick</DataTableHead>
              <DataTableHead align="right">Test Stores</DataTableHead>
              <DataTableHead align="right">Depth/Store</DataTableHead>
              <DataTableHead>Window Start</DataTableHead>
              <DataTableHead align="right">Days Elapsed</DataTableHead>
              <DataTableHead align="right">Measured ROS</DataTableHead>
              <DataTableHead align="right">Target ROS</DataTableHead>
              <DataTableHead align="right">Trigger %</DataTableHead>
              <DataTableHead>Status</DataTableHead>
              <DataTableHead>Actions</DataTableHead>
</DataTableHeader>
          <DataTableBody>
            {filtered.map((item: TestScaleOption) => {
              const triggerPct = getTriggerPct(item.measuredRos, item.targetRos)
              const { label: statusLabel, variant: statusVariant } = getStatusConfig(item.status, triggerPct)
              const localAction = localActions[item.id]

              return (
                <DataTableRow key={item.id}>
                  <DataTableCell>
                    <span className="font-mono text-xs font-medium text-gray-900">{item.optionCode}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-xs">{item.category}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-xs">{item.brick}</span>
                  </DataTableCell>
                  <DataTableCell align="right">{item.testStores}</DataTableCell>
                  <DataTableCell align="right">{item.depthPerStore}</DataTableCell>
                  <DataTableCell>
                    <span className="text-xs text-gray-600">{item.windowStart}</span>
                  </DataTableCell>
                  <DataTableCell align="right">
                    <span className={cn(item.daysElapsed > 60 ? 'text-amber-600 font-medium' : 'text-gray-700')}>
                      {item.daysElapsed}d
                    </span>
                  </DataTableCell>
                  <DataTableCell align="right">
                    {item.measuredRos > 0 ? (
                      <span className={cn(
                        'font-medium',
                        item.measuredRos >= item.targetRos ? 'text-green-600' : 'text-red-600'
                      )}>
                        {item.measuredRos.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-gray-400">0.0</span>
                    )}
                  </DataTableCell>
                  <DataTableCell align="right">{item.targetRos.toFixed(1)}</DataTableCell>
                  <DataTableCell align="right">
                    <div className="flex items-center justify-end gap-1">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <progress max={100} value={Math.min(triggerPct, 100)} aria-label="ROS trigger progress"
                          className={cn(
                            'h-1.5 w-full rounded-full',
                            triggerPct >= 100 ? 'bg-green-500' :
                            triggerPct >= 70 ? 'bg-amber-500' : 'bg-red-500'
                          )}
                        />
                      </div>
                      <span className={cn(
                        'text-xs font-medium',
                        triggerPct >= 100 ? 'text-green-600' :
                        triggerPct >= 70 ? 'text-amber-600' : 'text-red-600'
                      )}>
                        {triggerPct}%
                      </span>
                    </div>
                  </DataTableCell>
                  <DataTableCell>
                    {localAction ? (
                      <Badge variant={localAction === 'scaled' ? 'success' : localAction === 'closed' ? 'default' : 'primary'} size="sm">
                        {localAction === 'scaled' ? 'Scale Ordered' : localAction === 'closed' ? 'Closed' : 'Extended'}
                      </Badge>
                    ) : (
                      <Badge variant={statusVariant} size="sm">{statusLabel}</Badge>
                    )}
                  </DataTableCell>
                  <DataTableCell>
                    {canApprove && !localAction && item.status !== 'closed' ? (
                      <div className="flex gap-1">
                        {triggerPct >= 100 && (
                          <Button
                            size="sm"
                            onClick={() => setLocalActions(p => ({ ...p, [item.id]: 'scaled' }))}
                          >
                            Scale Now
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLocalActions(p => ({ ...p, [item.id]: 'extended' }))}
                        >
                          Extend
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setLocalActions(p => ({ ...p, [item.id]: 'closed' }))}
                        >
                          Close
                        </Button>
                      </div>
                    ) : (
                      !localAction && (
                        <span className="text-xs text-gray-400">
                          {item.status === 'closed' ? 'Closed' : 'View only'}
                        </span>
                      )
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
