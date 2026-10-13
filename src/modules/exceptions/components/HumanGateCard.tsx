import { useState } from 'react';
import { Bot, ChevronDown, ChevronRight, CheckCircle2, XCircle, Edit3, Shield } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { ApprovalCountdown } from './ApprovalCountdown';
import type { HumanGate } from '../data/mockHumanGates';
import { agentShortIdMap } from '@/modules/agents/data/mockAgents';
import { cn } from '@/lib/utils';

// Gate type display config
const gateTypeConfig: Record<string, { label: string; color: string }> = {
  'otb-approval': { label: 'OTB Approval', color: 'bg-primary-50 text-primary-700 border-primary/30' },
  'otb-lock': { label: 'OTB Lock', color: 'bg-primary-50 text-primary-700 border-primary/30' },
  'style-closure': { label: 'Style Closure', color: 'bg-warning-50 text-warning-700 border-warning/30' },
  'buy-plan': { label: 'Buy Plan', color: 'bg-success-50 text-success-700 border-success/30' },
  'space-plan': { label: 'Space Plan', color: 'bg-secondary-50 text-secondary-700 border-secondary/30' },
  'capacity-booking': { label: 'Capacity', color: 'bg-success-50 text-success-700 border-success/30' },
  'range-review': { label: 'Range Review', color: 'bg-primary-50 text-primary-700 border-primary/30' },
  'sm-validation': { label: 'SM Validation', color: 'bg-warning-50 text-warning-700 border-warning/30' },
  'phase-transition': { label: 'Phase Gate', color: 'bg-primary-50 text-primary-700 border-primary/30' },
  'liquidation-routing': { label: 'Liquidation', color: 'bg-error-50 text-error-700 border-error/30' },
  'chase-order': { label: 'Chase Order', color: 'bg-success-50 text-success-700 border-success/30' },
  'below-cost-markdown': { label: 'Below Cost MD', color: 'bg-error-50 text-error-700 border-error/30' },
};

const statusBadge: Record<string, { label: string; variant: 'warning' | 'success' | 'error' | 'default' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'error' },
  escalated: { label: 'Escalated', variant: 'error' },
  'auto-approved': { label: 'Auto-Approved', variant: 'success' },
};

interface HumanGateCardProps {
  gate: HumanGate;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export function HumanGateCard({ gate, onApprove, onReject }: HumanGateCardProps) {
  const [showAudit, setShowAudit] = useState(false);
  const typeConf = gateTypeConfig[gate.type] ?? { label: gate.type, color: '' };
  const statusConf = statusBadge[gate.status] ?? { label: gate.status, variant: 'default' as const };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 hover:border-primary/30 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', typeConf.color)}>
              {typeConf.label}
            </span>
            <Badge variant={statusConf.variant} size="sm">{statusConf.label}</Badge>
            <span className="text-[10px] text-gray-500 font-mono">{gate.nDayLabel}</span>
            {gate.dualSignOff && (
              <span className="flex items-center gap-0.5 text-[10px] text-primary">
                <Shield className="w-3 h-3" />
                Dual Sign-off
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-gray-900 truncate">{gate.title}</h3>
        </div>
      </div>

      {/* Agent & Approver */}
      <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Bot className="w-3 h-3 text-gray-400" />
          {agentShortIdMap[gate.agentId] ?? gate.agentId.slice(0, 8)} {gate.agentName}
        </span>
        <span className="text-gray-400">&rarr;</span>
        <span>{gate.approverRole}</span>
        {gate.dualSignOff && (
          <>
            <span className="text-gray-400">+</span>
            <span>{gate.dualSignOff}</span>
          </>
        )}
      </div>

      {/* Context */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <p className="text-xs text-gray-700 mb-2">{gate.context.summary}</p>

        {/* Data Points */}
        {/* eslint-disable design-system/prefer-section-header -- inline label+value data points, not section headers */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {gate.context.dataPoints.map((dp, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500">{dp.label}</span>
              <span className={cn(
                'text-xs font-medium',
                dp.status === 'on-track' ? 'text-success-700' :
                dp.status === 'warning' ? 'text-warning-700' :
                dp.status === 'critical' ? 'text-error-700' : 'text-gray-900'
              )}>
                {dp.value}
              </span>
            </div>
          ))}
        </div>
        {/* eslint-enable design-system/prefer-section-header */}

        {/* Agent Recommendation */}
        <div className="border-t border-gray-200 pt-2 mt-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Agent Recommendation</p>
          <p className="text-xs text-gray-900 font-medium">{gate.context.agentRecommendation}</p>
        </div>

        {/* Financial Impact */}
        {gate.context.financialImpact && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Financial Impact</p>
            <p className="text-xs text-gray-700">{gate.context.financialImpact}</p>
          </div>
        )}

        {/* Cascade Risk */}
        {gate.context.cascadeRisk && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-[10px] text-error-600 uppercase tracking-wider mb-1">Cascade Risk</p>
            <p className="text-xs text-error-700">{gate.context.cascadeRisk}</p>
          </div>
        )}
      </div>

      {/* SLA Countdown */}
      <ApprovalCountdown
        slaDeadline={gate.slaDeadline}
        escalateTo={gate.escalateTo}
        status={gate.status}
        className="mb-3"
      />

      {/* Action Buttons — Approve dominant (Cortex layout) */}
      {gate.status === 'pending' && (
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            className="flex-[3] min-h-10"
            onClick={() => onApprove?.(gate.id)}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-[2] min-h-10 border-error/40 text-error hover:bg-error-50 hover:border-error/60"
            onClick={() => onReject?.(gate.id)}
          >
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Reject
          </Button>
          <Button variant="outline" size="sm" className="min-h-10" aria-label="Modify and re-process">
            <Edit3 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Audit Trail */}
      {gate.auditTrail && gate.auditTrail.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={() => setShowAudit(!showAudit)}
            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showAudit ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Audit Trail ({gate.auditTrail.length})
          </button>
          {showAudit && (
            <div className="mt-2 space-y-1.5">
              {gate.auditTrail.map((entry, i) => (
                <div key={i} className="flex items-start gap-2 text-[10px]">
                  <span className="text-gray-400 whitespace-nowrap shrink-0">
                    {new Date(entry.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-gray-600">
                    <span className="font-medium text-gray-700">{entry.actor}</span> {entry.action}
                    {entry.notes && <span className="text-gray-400"> &mdash; {entry.notes}</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
