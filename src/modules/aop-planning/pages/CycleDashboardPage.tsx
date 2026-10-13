import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageHeader,
  MetricGrid,
  MetricCard,
  SectionHeader,
  Badge,
  Button,
  EmptyState,
  Sheet,
} from '@/components/ui';
import { Calendar, AlertTriangle, CheckCircle2, ClipboardList, Plus, History, ChevronRight } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { useCycles, useCreateCycle, useVersions, useSetVersionStatus } from '../api/salesPlanHooks';
import { VersionHistoryList } from '../components/VersionHistoryList';
import type { UserTask, PlanningCycle } from '../types/aopPlanning.types';

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-red-600 bg-red-50',
  medium: 'text-amber-600 bg-amber-50',
  low: 'text-gray-600 bg-gray-50',
};

function TaskCard({ task, onClick }: { task: UserTask; onClick: () => void }): React.ReactNode {
  return (
    <button
      onClick={onClick}
      className="w-full text-left border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors flex items-start gap-3"
    >
      <div className="mt-0.5">
        {task.type === 'resolve_exception' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
        {task.type === 'review' && <ClipboardList className="w-4 h-4 text-gray-500" />}
        {task.type === 'submit' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
        {task.type === 'approve' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
        {task.type === 'revise' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{task.description}</p>
        <p className="text-xs text-gray-500 mt-0.5">{task.cycleName}</p>
      </div>
      <Badge className={PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
    </button>
  );
}

export function CycleDashboardPage(): React.ReactNode {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useCycles();
  const createCycle = useCreateCycle();
  const [versionCycle, setVersionCycle] = useState<{ id: string; name: string } | null>(null);

  const cycles = data?.cycles ?? [];
  const userTasks = data?.tasks ?? [];
  const kpis = data?.kpis;

  const handleCreate = (): void => {
    const next = new Date().getFullYear() + 1;
    createCycle.mutate({
      name: `Superdry · FY${String(next).slice(2)}`,
      brand: 'Superdry',
      fiscalYearLabel: `FY ${next}-${next + 1}`,
      fyStartYear: next,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Plan"
        actions={
          <Button size="sm" onClick={handleCreate} disabled={createCycle.isPending}>
            <Plus className="w-4 h-4 mr-1" />
            {createCycle.isPending ? 'Creating…' : 'New Cycle'}
          </Button>
        }
      />

      <MetricGrid columns={4}>
        <MetricCard label="Active Cycles" value={String(kpis?.activeCycles ?? 0)} icon={Calendar} />
        <MetricCard label="Pending Tasks" value={String(kpis?.pendingTasks ?? 0)} icon={ClipboardList} />
        <MetricCard
          label="Exceptions"
          value={`${kpis?.exceptions.hard ?? 0} hard · ${kpis?.exceptions.soft ?? 0} soft`}
          icon={AlertTriangle}
        />
        <MetricCard label="Locked Plans" value={String(kpis?.lockedPlans ?? 0)} icon={CheckCircle2} />
      </MetricGrid>

      {/* My Tasks */}
      <div>
        <SectionHeader title="My Tasks" />
        {userTasks.length === 0 ? (
          <EmptyState title="No pending tasks" description="All tasks are up to date" variant="neutral" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {userTasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={() => navigate(task.deepLink)} />
            ))}
          </div>
        )}
      </div>

      {/* Planning Cycles */}
      <div>
        <SectionHeader title="Planning Cycles" />
        {isLoading ? (
          <EmptyState title="Loading cycles…" description="Fetching planning cycles" variant="neutral" />
        ) : isError ? (
          <EmptyState title="Couldn't load cycles" description="Please try again" variant="neutral" />
        ) : cycles.length === 0 ? (
          <EmptyState
            title="No planning cycles yet"
            description="Create a cycle to seed the plan from source data"
            variant="neutral"
          />
        ) : (
        <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Cycle</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Fiscal Year</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Version</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Exceptions</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Last Updated</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cycles.map((cycle) => (
                  <CycleVersionRows
                    key={cycle.id}
                    cycle={cycle}
                    onNavigate={navigate}
                    onHistory={(id, name) => setVersionCycle({ id, name })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>

      <Sheet
        isOpen={versionCycle !== null}
        onClose={() => setVersionCycle(null)}
        title="Version history"
        description={versionCycle ? versionCycle.name : undefined}
        width="md"
      >
        {versionCycle && (
          <div className="px-5 py-4">
            <VersionHistoryList cycleId={versionCycle.id} />
          </div>
        )}
      </Sheet>
    </div>
  );
}

interface CycleVersionRowsProps {
  cycle: PlanningCycle;
  onNavigate: (path: string) => void;
  onHistory: (cycleId: string, cycleName: string) => void;
}

/**
 * Renders one row per AOP version so mid-year revisions show as separate rows
 * under the same cycle (same name/FY, different version). The current version
 * carries the live status/exceptions and the Open action; older versions are
 * shown for reference and open the version history.
 */
function CycleVersionRows({ cycle, onNavigate, onHistory }: CycleVersionRowsProps): React.ReactNode {
  const { data } = useVersions(cycle.id);
  const setVersionStatus = useSetVersionStatus(cycle.id);
  const [expanded, setExpanded] = useState(false);
  const isReadOnly = cycle.status === 'LOCKED' || cycle.status === 'PROMOTED';
  const target = isReadOnly
    ? `/sales-plan/review/${cycle.id}`
    : `/sales-plan/workspace/${cycle.id}`;
  // Each version opens its own detail like the latest: the current version uses
  // the cycle target; older versions open the version-scoped (read-only) workspace.
  const rowTarget = (row: { isCurrent: boolean; versionNo: number }): string =>
    row.isCurrent ? target : `/sales-plan/workspace/${cycle.id}?version=${row.versionNo}`;

  // Latest first. Fall back to a single synthetic row while versions load.
  const versions = [...(data?.versions ?? [])].sort((a, b) => b.versionNo - a.versionNo);
  const allRows =
    versions.length > 0
      ? versions.map((v) => ({
          key: v.versionId,
          versionNo: v.versionNo,
          isCurrent: v.isCurrent,
          status: (v.status || 'DRAFT').toUpperCase(),
          isApproved: v.isApproved,
          updatedAt: v.isCurrent ? cycle.updatedAt : v.createdAt,
        }))
      : [{ key: cycle.id, versionNo: cycle.version, isCurrent: true, status: 'DRAFT', isApproved: false, updatedAt: cycle.updatedAt }];

  const olderCount = allRows.length - 1;
  // Collapsed by default: show only the latest version; expand to reveal older versions.
  const rows = expanded ? allRows : allRows.slice(0, 1);

  return (
    <>
      {rows.map((row) => {
        const exceptions = cycle.exceptionCount.hard + cycle.exceptionCount.soft;
        const showToggle = row.isCurrent && olderCount > 0;
        return (
          <tr
            key={row.key}
            className={cn(
              'transition-colors cursor-pointer',
              row.isCurrent ? 'hover:bg-gray-50/50' : 'bg-gray-50/30 hover:bg-gray-50/60',
              row.isApproved && 'bg-green-50/60 hover:bg-green-50/80',
            )}
            onClick={() => onNavigate(rowTarget(row))}
          >
            <td className={cn('px-4 py-3', row.isCurrent ? 'font-medium text-gray-900' : 'text-gray-500 pl-8')}>
              <span className="inline-flex items-center gap-1.5">
                {showToggle ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpanded((v) => !v);
                    }}
                    className="p-0.5 -ml-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    aria-label={expanded ? `Hide older versions of ${cycle.name}` : `Show ${olderCount} older version${olderCount !== 1 ? 's' : ''} of ${cycle.name}`}
                    aria-expanded={expanded}
                  >
                    <ChevronRight className={cn('w-4 h-4 transition-transform', expanded && 'rotate-90')} />
                  </button>
                ) : (
                  !row.isCurrent && <span aria-hidden="true">↳</span>
                )}
                <span>{cycle.name}</span>
                {showToggle && !expanded && (
                  <Badge variant="outline" size="sm" className="ml-1 text-gray-500">
                    +{olderCount}
                  </Badge>
                )}
              </span>
            </td>
            <td className={cn('px-4 py-3', row.isCurrent ? 'text-gray-700' : 'text-gray-400')}>{cycle.fiscalYear}</td>
            <td className="px-4 py-3">
              <Badge
                variant={row.status === 'APPROVED' ? 'success' : row.status === 'REJECTED' ? 'error' : 'outline'}
                size="sm"
              >
                {row.status === 'APPROVED' ? 'Approved' : row.status === 'REJECTED' ? 'Rejected' : 'Draft'}
              </Badge>
            </td>
            <td className="px-4 py-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onHistory(cycle.id, cycle.name);
                }}
                className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900 hover:underline"
                aria-label={`View version history for ${cycle.name} v${row.versionNo}`}
              >
                <History className="w-3.5 h-3.5 text-gray-400" />
                v{row.versionNo}
                {row.isCurrent && (
                  <Badge variant="info" size="sm" className="ml-1">Latest</Badge>
                )}
              </button>
            </td>
            <td className="px-4 py-3 text-gray-700">
              {row.isCurrent ? (exceptions > 0 ? `${cycle.exceptionCount.hard} hard · ${cycle.exceptionCount.soft} soft` : '—') : '—'}
            </td>
            <td className="px-4 py-3 text-gray-500 text-xs">
              {row.updatedAt ? formatDate(row.updatedAt) : '—'}
            </td>
            <td className="px-4 py-3 text-right">
              <div className="inline-flex items-center gap-1">
                {row.status !== 'APPROVED' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={setVersionStatus.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      setVersionStatus.mutate({ versionNo: row.versionNo, status: 'APPROVED' });
                    }}
                  >
                    Approve
                  </Button>
                )}
                {row.status === 'DRAFT' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={setVersionStatus.isPending}
                    className="text-red-600 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setVersionStatus.mutate({ versionNo: row.versionNo, status: 'REJECTED' });
                    }}
                  >
                    Reject
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(rowTarget(row));
                  }}
                >
                  {row.isCurrent ? (isReadOnly ? 'View' : 'Open') : 'View'}
                </Button>
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
}
