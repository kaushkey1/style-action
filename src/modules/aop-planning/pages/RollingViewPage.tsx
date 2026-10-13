import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader, Button, Badge, EmptyState } from '@/components/ui';
import { Lock, LockOpen, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRolling, useSetCycleStatus, useCreateCycle } from '../api/salesPlanHooks';
import { AopSubNav } from '../components/AopSubNav';
import { CycleStatusBadge } from '../components/CycleStatusBadge';
import type { RollingCycleInfo, RollingMonth } from '../api/salesPlanApi';
import type { CycleStatus } from '../types/aopPlanning.types';

function fmtCr(value: number): string {
  return `₹${value.toFixed(2)}`;
}

// Per-FY summary card with a Lock/Unlock action (each card owns its own mutation).
function FyLockCard({
  info,
  months,
  tone,
}: {
  info: RollingCycleInfo;
  months: RollingMonth[];
  tone: 'current' | 'next';
}): React.ReactNode {
  const setStatus = useSetCycleStatus(info.cycleId);
  const inView = months.filter((m) => m.cycleId === info.cycleId);
  const total = inView.reduce((s, m) => s + m.value, 0);

  function toggleLock(): void {
    setStatus.mutate(info.isLocked ? 'DRAFT' : 'LOCKED', {
      onError: (e: unknown) =>
        window.alert(e instanceof Error ? e.message : 'Failed to update status'),
    });
  }

  return (
    <div
      className={cn(
        'border rounded-lg p-4 flex-1',
        tone === 'current' ? 'border-gray-300 bg-gray-50' : 'border-indigo-200 bg-indigo-50/40',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">
            {tone === 'current' ? 'Current FY' : 'Next FY (rolling)'}
          </p>
          <p className="text-lg font-bold text-gray-900">{info.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <CycleStatusBadge status={info.status as CycleStatus} />
            {info.isLocked && (
              <Badge size="sm" variant="warning">
                Locked
              </Badge>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLock}
          disabled={setStatus.isPending}
          className="min-h-[44px] md:min-h-0"
        >
          {info.isLocked ? (
            <>
              <LockOpen className="w-4 h-4 mr-1" /> Unlock
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-1" /> Lock FY
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-gray-500 mt-3">
        {tone === 'current' ? 'Full-year plan' : 'H1 shown in rolling window'} ·{' '}
        <span className="font-semibold text-gray-700">{fmtCr(total)} Cr</span>
      </p>
    </div>
  );
}

const METRIC_ROWS: { key: 'value' | 'latestEstimate' | 'priorYear'; label: string }[] = [
  { key: 'value', label: 'Working AOP' },
  { key: 'latestEstimate', label: 'Latest Est' },
  { key: 'priorYear', label: 'Last Year' },
];

export function RollingViewPage(): React.ReactNode {
  const { cycleId } = useParams<{ cycleId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useRolling(cycleId);
  const createCycle = useCreateCycle();

  function handleCreateNext(): void {
    if (!data) return;
    const nextFy = data.current.fyStartYear + 1;
    createCycle.mutate(
      {
        name: `Superdry · FY${String(nextFy + 1).slice(2)}`,
        brand: 'Superdry',
        fiscalYearLabel: `FY ${nextFy}-${nextFy + 1}`,
        fyStartYear: nextFy,
      },
      {
        onError: (e: unknown) =>
          window.alert(e instanceof Error ? e.message : 'Failed to create next-year AOP'),
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rolling 18-Month Plan"
        backTo={{ label: 'Sales Plan', path: '/sales-plan' }}
      />
      <AopSubNav />

      {isLoading ? (
        <div className="h-64 rounded-lg border border-gray-200 bg-gray-50 animate-pulse" />
      ) : isError || !data ? (
        <EmptyState title="Unable to load rolling plan" description="Please try again." />
      ) : (
        <>
          {/* FY summary cards */}
          <div className="flex flex-col md:flex-row gap-4">
            <FyLockCard info={data.current} months={data.months} tone="current" />
            {data.next ? (
              <FyLockCard info={data.next} months={data.months} tone="next" />
            ) : (
              <div className="flex-1 border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-start justify-center gap-2">
                <p className="text-sm text-gray-600">
                  No next-year AOP yet — create FY{data.current.fyStartYear + 1} to extend the rolling horizon.
                </p>
                <Button size="sm" onClick={handleCreateNext} disabled={createCycle.isPending}>
                  <Plus className="w-4 h-4 mr-1" />
                  {createCycle.isPending ? 'Creating…' : `Create FY${data.current.fyStartYear + 1} AOP`}
                </Button>
              </div>
            )}
          </div>

          {/* 18-month timeline */}
          <div>
            <p className="text-xs text-gray-500 mb-2">
              {data.months.length}-month rolling horizon. Values are read-only here — edit each plan in its own Workspace.
            </p>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left text-xs font-medium text-gray-500 min-w-[130px]">
                        Metric
                      </th>
                      {data.months.map((m) => (
                        <th
                          key={m.seq}
                          className={cn(
                            'px-2 py-2 text-right text-xs font-medium whitespace-nowrap min-w-[76px]',
                            m.isFyBoundary && 'border-l-2 border-l-indigo-400',
                            m.fyStartYear === data.current.fyStartYear
                              ? 'text-gray-500'
                              : 'text-gray-700 font-semibold',
                          )}
                        >
                          <div>{m.label}</div>
                          {m.isActual && <div className="text-[10px] text-green-600 font-semibold">actual</div>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {METRIC_ROWS.map((row) => (
                      <tr key={row.key} className="hover:bg-gray-50/40">
                        <td className="sticky left-0 z-10 bg-white px-3 py-2 font-medium text-gray-700">
                          {row.label}
                        </td>
                        {data.months.map((m) => (
                          <td
                            key={m.seq}
                            className={cn(
                              'px-2 py-2 text-right tabular-nums whitespace-nowrap',
                              m.isFyBoundary && 'border-l-2 border-l-indigo-400',
                              row.key === 'priorYear' && 'text-gray-400',
                              row.key === 'value' && m.isActual && 'text-green-700',
                            )}
                          >
                            {m[row.key] > 0 ? fmtCr(m[row.key]) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              The indigo divider marks the fiscal-year boundary (next FY starts). Green = current-year actuals.
            </p>
          </div>

          <div>
            <Button variant="outline" size="sm" onClick={() => navigate(`/sales-plan/workspace/${cycleId}`)}>
              Open Workspace
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
