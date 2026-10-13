import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Check,
  X,
  Edit,
} from 'lucide-react';
import { Badge, Button, Input, PageHeader, SectionHeader, DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell, StoreFilterSelect, EmptyState } from '@/components/ui';
import { cn, formatCurrencyFromLakhs } from '@/lib/utils';
import { useOTBStore } from '../stores/otb.store';
import { useModulePermissions } from '@/permissions';
import { OTBTabNavigation } from '../components/OTBTabNavigation';
import { mockUtilizationHeatmap } from '../data/mockOTB';

// ─── Utilization color helpers ───────────────────────────────────────

function getUtilColor(util: number): string {
  if (util >= 85 && util <= 105) return 'bg-green-100/60 text-green-700';
  if ((util >= 70 && util < 85) || (util > 105 && util <= 110))
    return 'bg-yellow-100/60 text-yellow-700';
  return 'bg-red-100/60 text-red-700';
}

function getUtilStatus(finalUtil: number): {
  label: string;
  variant: 'success' | 'warning' | 'error';
} {
  if (finalUtil >= 85 && finalUtil <= 105)
    return { label: 'On track', variant: 'success' };
  if (finalUtil > 105)
    return { label: 'Over-buying', variant: 'error' };
  return { label: 'Under-buying', variant: 'warning' };
}

// ─── Main page component ────────────────────────────────────────────

export function OTBUtilizationPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const storeParam = searchParams.get('store');
  const reallocations = useOTBStore((s) => s.reallocations);
  const approveReallocation = useOTBStore((s) => s.approveReallocation);
  const modifyReallocation = useOTBStore((s) => s.modifyReallocation);
  const rejectReallocation = useOTBStore((s) => s.rejectReallocation);
  const { edit: canEdit } = useModulePermissions('otb');

  return (
    <div className="animate-fadeInUp">
      <PageHeader
        title="OTB Management"
        backTo={{ label: 'OTB', path: '/otb' }}
        actions={
          <>
            <StoreFilterSelect
              value={storeParam}
              onChange={(name) => {
                if (name) {
                  searchParams.set('store', name);
                } else {
                  searchParams.delete('store');
                }
                setSearchParams(searchParams);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              disabled
              title="Available in production"
            >
              Export Report
            </Button>
          </>
        }
      />

      <OTBTabNavigation />

      {/* Filters row */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-xs text-gray-700">
          <span className="font-medium text-gray-500">Period:</span>
          H1 FY27
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-xs text-gray-700">
          <span className="font-medium text-gray-500">View:</span>
          All PODs
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-xs text-gray-700">
          <span className="font-medium text-gray-500">Grade:</span>
          All
        </div>
      </div>

      <div className="space-y-4">
        {/* ─── Utilization Heatmap ─────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader title="Utilization Heatmap" />

          <DataTable>
              <DataTableHeader>
                  <DataTableHead className="min-w-[160px]">POD</DataTableHead>
                  {['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map(
                    (month) => (
                      <DataTableHead key={month} align="center" className="min-w-[72px]">
                        {month}
                      </DataTableHead>
                    ),
                  )}
                  <DataTableHead align="center" className="min-w-[110px]">Status</DataTableHead>
              </DataTableHeader>
              <DataTableBody>
                {mockUtilizationHeatmap.length === 0 ? (
                  <tr><td colSpan={8}><EmptyState description="No utilization data to display" /></td></tr>
                ) : mockUtilizationHeatmap.map((pod) => {
                  const finalUtil =
                    pod.monthly[pod.monthly.length - 1]?.util ?? 0;
                  const status = getUtilStatus(finalUtil);

                  return (
                    <DataTableRow key={pod.podId}>
                      <DataTableCell className="font-medium">
                        {pod.podName}
                      </DataTableCell>
                      {pod.monthly.map((m) => (
                        <td key={m.month} className="px-1 py-1.5">
                          <div
                            className={cn(
                              'text-center py-1 px-2 rounded font-semibold text-xs',
                              getUtilColor(m.util),
                            )}
                          >
                            {m.util}%
                          </div>
                        </td>
                      ))}
                      <DataTableCell align="center">
                        <Badge variant={status.variant} size="sm">
                          {status.label}
                        </Badge>
                      </DataTableCell>
                    </DataTableRow>
                  );
                })}
              </DataTableBody>
          </DataTable>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500 font-medium">Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-green-100 border border-green-200" />
              <span className="text-xs text-gray-600">85-105% (On track)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200" />
              <span className="text-xs text-gray-600">
                70-85% or 105-110% (At risk)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-100 border border-red-200" />
              <span className="text-xs text-gray-600">
                {'<70% or >110% (Breach)'}
              </span>
            </div>
          </div>
        </div>

        {/* ─── Reallocation Recommendations (A11) ─────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader title="Reallocation Recommendations (A11)" />

          {reallocations.length === 0 ? (
            <EmptyState description="No reallocation recommendations to display" />
          ) : (
          <div className="space-y-3">
            {reallocations.map((realloc) => (
              <ReallocationCard
                key={realloc.id}
                reallocation={realloc}
                onApprove={() => approveReallocation(realloc.id)}
                onReject={() => rejectReallocation(realloc.id)}
                onModify={(newAmount) => modifyReallocation(realloc.id, newAmount)}
                canEdit={canEdit}
              />
            ))}
          </div>
          )}
        </div>

        {/* Cross-module navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/exceptions')}
            className="text-blue-600 hover:text-blue-700 text-xs font-medium"
          >
            View Exceptions →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reallocation card ───────────────────────────────────────────────

function ReallocationCard({
  reallocation,
  onApprove,
  onReject,
  onModify,
  canEdit,
}: {
  reallocation: ReturnType<typeof useOTBStore.getState>['reallocations'][number];
  onApprove: () => void;
  onReject: () => void;
  onModify: (newAmount: number) => void;
  canEdit: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState(reallocation.amount);
  const priorityConfig: Record<
    string,
    { variant: 'error' | 'warning' | 'info'; label: string }
  > = {
    high: { variant: 'error', label: 'High' },
    medium: { variant: 'warning', label: 'Medium' },
    low: { variant: 'info', label: 'Low' },
  };

  const typeLabels: Record<string, string> = {
    'within-pod': 'Within POD',
    'cross-pod': 'Cross POD',
    'cross-tier': 'Cross Tier',
    'otb-increase': 'OTB Increase',
  };

  const priority = priorityConfig[reallocation.priority] ?? {
    variant: 'info' as const,
    label: reallocation.priority,
  };

  const isActioned =
    reallocation.status === 'approved' || reallocation.status === 'rejected';

  return (
    <div className="rounded-lg border border-gray-200 p-3 hover:border-primary/30 hover:shadow-md transition-all duration-200">
      {/* Top row: badges + amount */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant={priority.variant} size="sm">
            {priority.label}
          </Badge>
          <Badge variant="outline" size="sm">
            {typeLabels[reallocation.type] ?? reallocation.type}
          </Badge>
        </div>
        <span className="text-sm font-semibold text-gray-900">
          {formatCurrencyFromLakhs(reallocation.amount)}
        </span>
      </div>

      {/* From / To */}
      <div className="flex items-center gap-2 mb-1.5 text-xs text-gray-600">
        <span className="font-medium text-gray-500">From:</span>
        {reallocation.fromPodName}
        <span className="text-gray-400 mx-1">&rarr;</span>
        <span className="font-medium text-gray-500">To:</span>
        {reallocation.toPodName}
      </div>

      {/* Reason */}
      <p className="text-xs text-gray-700 mb-1.5">{reallocation.reason}</p>

      {/* Impact */}
      <p className="text-xs text-gray-500 mb-2">
        <span className="font-medium text-gray-600">Impact:</span>{' '}
        {reallocation.impact}
      </p>

      {/* Approval level */}
      <div className="flex items-center gap-1 mb-2 text-xs text-gray-400">
        <span className="font-medium">Approval:</span> {reallocation.approver}
        <span className="mx-1">&middot;</span>
        <span>Recommended by {reallocation.recommendedBy}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isActioned ? (
          reallocation.status === 'approved' ? (
            <Badge variant="success" size="sm">
              <Check className="w-3 h-3 mr-1" />
              Approved{reallocation.approvedBy ? ` by ${reallocation.approvedBy}` : ''}
            </Badge>
          ) : (
            <Badge variant="error" size="sm">
              <X className="w-3 h-3 mr-1" />
              Rejected
            </Badge>
          )
        ) : canEdit ? (
          <>
            <Button size="sm" variant="primary" onClick={onApprove}>
              <Check className="w-3 h-3 mr-1" />
              Approve
            </Button>
            {!isEditing ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-3 h-3 mr-1" />
                Modify Amount
              </Button>
            ) : (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(Number(e.target.value))}
                  className="w-24 h-7 px-2 py-0 text-xs"
                  containerClassName="space-y-0"
                />
                <Button
                  size="sm"
                  variant="primary"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    onModify(editAmount);
                    setIsEditing(false);
                  }}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    setEditAmount(reallocation.amount);
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
            <Button size="sm" variant="outline" className="border-error/40 text-error hover:bg-error-50 hover:border-error/60" onClick={onReject}>
              <X className="w-3 h-3 mr-1" />
              Reject
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
