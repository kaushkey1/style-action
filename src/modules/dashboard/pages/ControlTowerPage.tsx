import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import {
  Badge,
  Button,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
} from '@/components/ui';
import { useExceptionStore } from '@/modules/exceptions/stores/useExceptionStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {cn, getCurrencySymbol} from '@/lib/utils';
import { healthKpis } from '../data/mockHealthKpis';

// ---------------------------------------------------------------------------
// Period toggle
// ---------------------------------------------------------------------------

type Period = 'WTD' | 'MTD' | 'YTD';

const PERIOD_MULTIPLIER: Record<Period, number> = { WTD: 0.85, MTD: 1, YTD: 1.12 };

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_BORDER: Record<string, string> = {
  on_track: 'border-l-green-500',
  warning: 'border-l-amber-500',
  critical: 'border-l-red-500',
};

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'error'> = {
  on_track: 'success',
  warning: 'warning',
  critical: 'error',
};

const STATUS_LABEL: Record<string, string> = {
  on_track: 'On Track',
  warning: 'Warning',
  critical: 'Critical',
};

const EXC_STATUS: Record<string, { label: string; color: string }> = {
  'agent-reviewing': { label: 'Agent Working', color: 'text-primary' },
  'awaiting-approval': { label: 'Needs Approval', color: 'text-warning' },
  investigating: { label: 'Investigating', color: 'text-primary' },
  'agent-analyzing': { label: 'Agent Working', color: 'text-primary' },
  'agent-acted': { label: 'Agent Acted', color: 'text-success' },
  escalated: { label: 'Escalated', color: 'text-error' },
  resolved: { label: 'Resolved', color: 'text-success' },
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ControlTowerPage() {
  const [period, setPeriod] = useState<Period>('MTD');
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const exceptions = useExceptionStore((s) => s.exceptions);

  // S1 exceptions for the table
  const s1Exceptions = exceptions.filter((e) => e.severity === 'S1');
  const pendingApprovalCount = s1Exceptions.filter((e) => e.status === 'awaiting-approval').length;
  const activeCount = s1Exceptions.filter((e) =>
    ['agent-reviewing', 'investigating', 'agent-analyzing', 'awaiting-approval', 'escalated'].includes(e.status)
  ).length;

  // Severity counts
  const sevCounts = {
    S1: exceptions.filter((e) => e.severity === 'S1').length,
    S2: exceptions.filter((e) => e.severity === 'S2').length,
    S3: exceptions.filter((e) => e.severity === 'S3').length,
    S4: exceptions.filter((e) => e.severity === 'S4').length,
  };

  const mult = PERIOD_MULTIPLIER[period];

  function formatImpact(inr: number): string {
    const cr = inr / 10000000;
    if (cr >= 1) return `${getCurrencySymbol()}${cr.toFixed(1)} Cr`;
    const l = inr / 100000;
    return `${getCurrencySymbol()}${l.toFixed(0)} L`;
  }

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* Key Metrics */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {/* eslint-disable-next-line design-system/prefer-section-header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Key Metrics</h2>
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            {(['WTD', 'MTD', 'YTD'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                  period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className={cn(
          'gap-3',
          isMobile ? 'flex overflow-x-auto scrollbar-hide pr-8' : 'grid grid-cols-4',
        )}>
          {healthKpis.slice(0, 4).map((kpi) => {
            const adjustedValue = Math.round(kpi.value * mult * 10) / 10;
            return (
              <div
                key={kpi.id}
                className={cn(
                  'bg-white rounded-lg border border-gray-200 border-l-3 p-3',
                  STATUS_BORDER[kpi.status],
                  isMobile && 'min-w-[200px] shrink-0',
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-700">{kpi.label}</span>
                  <Badge variant={STATUS_BADGE[kpi.status]} size="sm" className="text-xs">
                    {STATUS_LABEL[kpi.status]}
                  </Badge>
                </div>
                <p className="text-xl font-bold text-gray-900">{kpi.valueFormatted.replace(/[\d.]+/, String(adjustedValue))}</p>
                <p className="text-xs text-gray-500">Target: {kpi.target}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Exceptions & Approvals */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">Exceptions & Approvals</h2>
          </div>
          <div className="flex items-center gap-2">
            {pendingApprovalCount > 0 && (
              <Badge variant="warning" size="sm">{pendingApprovalCount} pending approval</Badge>
            )}
            <span className="text-xs text-gray-500">{activeCount} active</span>
          </div>
        </div>

        {/* Severity summary */}
        <div className="flex items-center gap-4 mb-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="font-bold text-red-600">S1</span> Critical {sevCounts.S1}
          </span>
          <span className="flex items-center gap-1">
            <span className="font-bold text-amber-600">S2</span> High {sevCounts.S2}
          </span>
          <span className="flex items-center gap-1">
            <span className="font-bold text-primary-600">S3</span> Medium {sevCounts.S3}
          </span>
          <span className="text-gray-400">S4 Low {sevCounts.S4}</span>
        </div>

        {/* Exception table — desktop */}
        {!isMobile ? (
          <div className="overflow-x-auto">
            <DataTable>
              <DataTableHeader>
                <DataTableHead>SEV</DataTableHead>
                <DataTableHead>EXCEPTION</DataTableHead>
                <DataTableHead>AGENT ACTION</DataTableHead>
                <DataTableHead>STATUS</DataTableHead>
                <DataTableHead align="right">IMPACT</DataTableHead>
                <DataTableHead align="right">ACTION</DataTableHead>
              </DataTableHeader>
              <DataTableBody>
                {s1Exceptions.slice(0, 10).map((exc) => {
                  const excStatus = EXC_STATUS[exc.status] ?? { label: exc.status, color: 'text-gray-500' };
                  return (
                    <DataTableRow key={exc.id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate('/exceptions')}>
                      <DataTableCell>
                        <Badge variant="error" size="sm">S1</Badge>
                      </DataTableCell>
                      <DataTableCell>
                        <div>
                          <p className="text-xs font-medium text-gray-900 truncate max-w-[300px]">{exc.title}</p>
                          <p className="text-xs text-gray-500">{exc.domain} · {exc.relativeTime}</p>
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <div>
                          <p className="text-xs text-gray-700 truncate max-w-[200px]">
                            {exc.recommendations?.[0]?.action ?? 'Investigating...'}
                          </p>
                          <p className="text-xs text-primary">{exc.recommendations?.[0]?.agent ?? exc.agents[0]}</p>
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <span className={cn('text-xs font-medium', excStatus.color)}>{excStatus.label}</span>
                      </DataTableCell>
                      <DataTableCell align="right">
                        <span className="text-xs font-medium text-gray-900">{formatImpact(exc.projected_impact_inr)}</span>
                      </DataTableCell>
                      <DataTableCell align="right">
                        {exc.status === 'awaiting-approval' ? (
                          <Button size="sm" className="text-xs h-7" onClick={(e) => { e.stopPropagation(); navigate('/approvals'); }}>
                            Approve
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" className="text-xs h-7">View</Button>
                        )}
                      </DataTableCell>
                    </DataTableRow>
                  );
                })}
              </DataTableBody>
            </DataTable>
          </div>
        ) : (
          /* Mobile — card view */
          <div className="space-y-2">
            {s1Exceptions.slice(0, 6).map((exc) => {
              const excStatus = EXC_STATUS[exc.status] ?? { label: exc.status, color: 'text-gray-500' };
              return (
                <button
                  key={exc.id}
                  onClick={() => navigate('/exceptions')}
                  className="w-full text-left p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Badge variant="error" size="sm">S1</Badge>
                    <span className="text-xs text-gray-400">{exc.relativeTime}</span>
                  </div>
                  <p className="text-xs font-medium text-gray-900 line-clamp-1 mb-1">{exc.title}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('text-xs font-medium', excStatus.color)}>{excStatus.label}</span>
                    <span className="text-xs font-medium text-gray-700">{formatImpact(exc.projected_impact_inr)}</span>
                  </div>
                  {exc.status === 'awaiting-approval' && (
                    <Button size="sm" className="w-full mt-2 text-xs h-8" onClick={(e) => { e.stopPropagation(); navigate('/approvals'); }}>
                      Approve
                    </Button>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
