import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Bot, Users, Shield, RefreshCw, FlaskConical, Zap, CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react';
import { Badge, Button, KpiLabel, MetricGrid } from '@/components/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { FilterBar as FilterBarLayout, FilterSelect, FilterClear } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import {
  type DropJourney,
  type JourneyMilestone,
  type JourneyPhase,
  type MilestoneStatus,
  type AutonomyTier,
} from '../data/mockCalendarJourney';
import type { HumanGate } from '@/modules/exceptions/data/mockHumanGates';
import { RetailCalendarJourney } from '../components/RetailCalendarJourney';
import { ChaseDecisionPanel } from '@/modules/otb/components/ChaseDecisionPanel';
import { MilestoneDetail } from '../components/MilestoneDetail';
import { CalendarHealthPage } from './CalendarHealthPage';
import { StoreCalendarPage } from './StoreCalendarPage';
import { MarketingCalendarPage } from './MarketingCalendarPage';
import { usePersonaStore } from '@/hooks/usePersonaStore';
import { useCalendarStore } from '../stores/useCalendarStore';
import type { SourcingEngine, DropStatus } from '../stores/useCalendarStore';
import { cn } from '@/lib/utils';

// ─── Visual configs ────────────────────────────────────────────────

const PHASES: JourneyPhase[] = ['PLAN', 'BUY', 'MAKE', 'MOVE', 'SELL'];

const phaseStyle: Record<JourneyPhase, { bg: string; activeBg: string; text: string; dot: string }> = {
  PLAN: { bg: 'bg-primary/10', activeBg: 'bg-primary text-white', text: 'text-primary-700', dot: 'bg-primary' },
  BUY: { bg: 'bg-secondary/10', activeBg: 'bg-secondary text-white', text: 'text-secondary-700', dot: 'bg-secondary' },
  MAKE: { bg: 'bg-violet-500/10', activeBg: 'bg-violet-500 text-white', text: 'text-violet-700', dot: 'bg-violet-500' },
  MOVE: { bg: 'bg-teal-500/10', activeBg: 'bg-teal-500 text-white', text: 'text-teal-700', dot: 'bg-teal-500' },
  SELL: { bg: 'bg-success/10', activeBg: 'bg-success text-white', text: 'text-success-700', dot: 'bg-success' },
};

const statusDot: Record<MilestoneStatus, string> = {
  completed: 'bg-success',
  'on-track': 'bg-primary',
  'at-risk': 'bg-warning',
  missed: 'bg-error',
  upcoming: 'bg-gray-300',
};

const statusBadge: Record<MilestoneStatus, { label: string; color: string }> = {
  completed: { label: 'Done', color: 'bg-success-50 text-success-600 border-success/30' },
  'on-track': { label: 'On Track', color: 'bg-primary-50 text-primary-600 border-primary/30' },
  'at-risk': { label: 'At Risk', color: 'bg-warning-50 text-warning-600 border-warning/30' },
  missed: { label: 'Missed', color: 'bg-error-50 text-error-600 border-error/30' },
  upcoming: { label: 'Upcoming', color: 'bg-gray-100 text-gray-500 border-gray-200' },
};

const autonomyLabel: Record<AutonomyTier, { label: string; color: string }> = {
  T1: { label: 'T1', color: 'bg-success-50 text-success-700 border-success/30' },
  T2: { label: 'T2', color: 'bg-primary-50 text-primary-700 border-primary/30' },
  T3: { label: 'T3', color: 'bg-warning-50 text-warning-700 border-warning/30' },
  T4: { label: 'T4', color: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const engineLabel: Record<string, { label: string; color: string }> = {
  fast_response: { label: 'Fast Response', color: 'bg-primary-50 text-primary-700 border-primary/30' },
  scale_margin: { label: 'Scale Margin', color: 'bg-success-50 text-success-700 border-success/30' },
  test_repeat: { label: 'Test & Repeat', color: 'bg-secondary-50 text-secondary-700 border-secondary/30' },
};

// ─── Helpers ───────────────────────────────────────────────────────

type PhaseStatus = 'completed' | 'active' | 'at-risk' | 'upcoming';

function getPhaseStatus(milestones: JourneyMilestone[], phase: JourneyPhase): PhaseStatus {
  const pm = milestones.filter(m => m.phase === phase);
  if (pm.length === 0) return 'upcoming';
  const hasRisk = pm.some(m => m.status === 'at-risk' || m.status === 'missed');
  if (hasRisk) return 'at-risk';
  const allDone = pm.every(m => m.status === 'completed');
  if (allDone) return 'completed';
  const hasActive = pm.some(m => m.status === 'on-track');
  if (hasActive) return 'active';
  return 'upcoming';
}

function getDropOverallStatus(drop: DropJourney) {
  if (drop.status === 'on-track' || drop.status === 'completed')
    return { label: drop.status === 'completed' ? 'Completed' : 'On Track', variant: 'success' as const };
  if (drop.status === 'at-risk') return { label: 'At Risk', variant: 'warning' as const };
  return { label: 'Delayed', variant: 'error' as const };
}

// ─── Inline Gate Indicator ─────────────────────────────────────────

function InlineGateIndicator({ gate }: { gate: HumanGate }) {
  const approveGate = useCalendarStore((s) => s.approveGate);
  const rejectGate = useCalendarStore((s) => s.rejectGate);

  // Calculate SLA remaining using fixed "now" for mock prototype
  const now = new Date('2026-02-20T10:00:00Z');
  const deadline = new Date(gate.slaDeadline);
  const remainingMs = deadline.getTime() - now.getTime();
  const hours = Math.floor(Math.max(0, remainingMs) / (1000 * 60 * 60));
  const minutes = Math.floor(Math.max(0, (remainingMs % (1000 * 60 * 60))) / (1000 * 60));
  const isExpired = remainingMs <= 0;
  const urgencyColor = isExpired ? 'text-error' : hours < 6 ? 'text-error' : hours < 12 ? 'text-warning' : 'text-success';

  const gateTypeLabels: Record<string, string> = {
    'otb-approval': 'OTB Approval',
    'otb-lock': 'OTB Lock',
    'style-closure': 'Style Closure',
    'buy-plan': 'Buy Plan',
    'space-plan': 'Space Plan',
    'capacity-booking': 'Capacity',
    'range-review': 'Range Review',
    'sm-validation': 'SM Validation',
    'phase-transition': 'Phase Gate',
    'liquidation-routing': 'Liquidation',
    'chase-order': 'Chase Order',
    'below-cost-markdown': 'Below Cost MD',
  };

  return (
    <div className="ml-5 mt-1 rounded-lg border border-warning/30 bg-warning-50/50 p-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Shield className="w-3 h-3 text-warning shrink-0" />
          <span className="text-[10px] font-semibold text-warning-700">
            {gateTypeLabels[gate.type] ?? gate.type}
          </span>
          <span className="text-[10px] text-gray-500">
            {gate.approverRole}
          </span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className={cn('text-[10px] font-medium', urgencyColor)}>
              {isExpired ? 'SLA Expired' : `${hours}h ${minutes}m left`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="primary"
            size="sm"
            className="!px-2 !py-0.5 !text-[10px] !h-auto"
            onClick={(e) => {
              e.stopPropagation();
              approveGate(gate.id);
            }}
          >
            <CheckCircle2 className="w-3 h-3 mr-0.5" />
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="!px-2 !py-0.5 !text-[10px] !h-auto !text-error !border-error/30 hover:!bg-error-50"
            onClick={(e) => {
              e.stopPropagation();
              rejectGate(gate.id);
            }}
          >
            <XCircle className="w-3 h-3 mr-0.5" />
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helper: find a pending gate matching a milestone's humanGate field
function findPendingGateForMilestone(
  milestone: JourneyMilestone,
  humanGates: HumanGate[],
): HumanGate | undefined {
  if (!milestone.humanGate) return undefined;
  // Match by gate type keywords in the milestone's humanGate field
  return humanGates.find((gate) => {
    if (gate.status !== 'pending') return false;
    const milestoneGateText = milestone.humanGate?.toLowerCase() ?? '';
    const gateTitle = gate.title.toLowerCase();
    // Match on gate type or title containing similar keywords
    if (milestone.name.toLowerCase().includes('otb') && (gate.type === 'otb-approval' || gate.type === 'otb-lock')) return true;
    if (milestone.name.toLowerCase().includes('space plan') && gate.type === 'space-plan') return true;
    if (milestone.name.toLowerCase().includes('capacity') && gate.type === 'capacity-booking') return true;
    if (milestone.name.toLowerCase().includes('range') && gate.type === 'range-review') return true;
    if (milestone.name.toLowerCase().includes('style closure') && gate.type === 'style-closure') return true;
    if (milestone.name.toLowerCase().includes('buy plan') && gate.type === 'buy-plan') return true;
    if (milestone.name.toLowerCase().includes('sm validation') && gate.type === 'sm-validation') return true;
    if (milestoneGateText.includes('category owner') && gateTitle.includes(milestone.name.toLowerCase())) return true;
    return false;
  });
}

// ─── Phase Pipeline Bar ────────────────────────────────────────────

function PhasePipeline({ milestones }: { milestones: JourneyMilestone[] }) {
  return (
    <div className="flex items-center gap-0.5">
      {PHASES.map((phase, i) => {
        const status = getPhaseStatus(milestones, phase);
        const pm = milestones.filter(m => m.phase === phase);
        const total = pm.length;
        const done = pm.filter(m => m.status === 'completed').length;

        let barClass = 'bg-gray-100 text-gray-400';
        if (status === 'completed') barClass = 'bg-success text-white';
        else if (status === 'active') barClass = phaseStyle[phase].activeBg;
        else if (status === 'at-risk') barClass = 'bg-warning text-white';

        return (
          <div key={phase} className="flex items-center flex-1 min-w-0">
            <div
              className={cn(
                'flex-1 rounded-lg text-center py-1.5 text-[10px] font-semibold transition-all',
                barClass,
              )}
              title={`${phase}: ${done}/${total} milestones done`}
            >
              <span className="block">{phase}</span>
              {total > 0 && (
                <span className="block text-[10px] font-normal opacity-80">{done}/{total}</span>
              )}
            </div>
            {i < PHASES.length - 1 && (
              <div className={cn('h-0.5 w-1.5 shrink-0', status === 'completed' ? 'bg-success' : 'bg-gray-200')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Milestone Detail Row ──────────────────────────────────────────

function MilestoneRow({
  m,
  isSelected,
  onClick,
}: {
  m: JourneyMilestone;
  isSelected?: boolean;
  onClick?: (m: JourneyMilestone) => void;
}) {
  const sc = statusBadge[m.status];
  const ac = autonomyLabel[m.autonomy];
  return (
    <button
      type="button"
      onClick={() => onClick?.(m)}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-1.5 border w-full text-left',
        'cursor-pointer hover:bg-primary-50/30 transition-all duration-200',
        'focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2',
        isSelected
          ? 'bg-primary-50/50 border-l-2 border-l-primary border-gray-200'
          : m.status === 'completed' ? 'bg-gray-50/50 border-gray-100' : 'bg-white border-gray-200',
      )}
      aria-label={`View details for milestone: ${m.name}`}
    >
      <div className="w-14 shrink-0 text-left">
        <span className="text-xs font-semibold text-gray-900">{m.nDayLabel}</span>
        <p className="text-[10px] text-gray-500">{m.targetDate}</p>
      </div>
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusDot[m.status])} />
      <div className="flex-1 min-w-0 text-left">
        <p className="text-xs font-medium text-gray-900 truncate">{m.name}</p>
        <p className="text-[10px] text-gray-500 truncate">{m.description}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Bot className="w-3 h-3 text-gray-400" />
        <span className="text-[10px] text-gray-600">{m.agentId}</span>
      </div>
      <span className={cn('text-[10px] px-1 py-0.5 rounded border shrink-0', ac.color)}>{ac.label}</span>
      {m.humanGate && (
        <span className="shrink-0" title={m.humanGate}>
          <Users className="w-3 h-3 text-warning" />
        </span>
      )}
      {m.hardGuardrail && (
        <span className="shrink-0" title={m.hardGuardrail}>
          <Shield className="w-3 h-3 text-error" />
        </span>
      )}
      <span className={cn('text-[10px] px-1 py-0.5 rounded border shrink-0', sc.color)}>{sc.label}</span>
    </button>
  );
}

// ─── Phase Section (expandable) ────────────────────────────────────

function PhaseSection({
  phase,
  milestones,
  defaultExpanded = false,
  selectedMilestoneId,
  onMilestoneClick,
}: {
  phase: JourneyPhase;
  milestones: JourneyMilestone[];
  defaultExpanded?: boolean;
  selectedMilestoneId?: string | null;
  onMilestoneClick?: (m: JourneyMilestone) => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const humanGates = useCalendarStore((s) => s.humanGates);
  const items = milestones.filter(m => m.phase === phase);
  if (items.length === 0) return null;

  const status = getPhaseStatus(milestones, phase);
  const done = items.filter(m => m.status === 'completed').length;

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left py-1 focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2 rounded"
        aria-label={expanded ? `Collapse ${phase}` : `Expand ${phase}`}
      >
        {expanded
          ? <ChevronDown className="w-3 h-3 text-gray-400" />
          : <ChevronRight className="w-3 h-3 text-gray-400" />}
        <span className={cn('w-2 h-2 rounded-full', phaseStyle[phase].dot)} />
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{phase}</span>
        <span className="text-[10px] text-gray-400">{done}/{items.length}</span>
        {status === 'at-risk' && <Badge variant="warning" className="text-[10px]">At Risk</Badge>}
        <div className="flex-1 h-px bg-gray-100" />
      </button>
      {expanded && (
        <div className="space-y-1 ml-5 mt-1">
          {items.map(m => {
            const pendingGate = findPendingGateForMilestone(m, humanGates);
            return (
              <div key={m.id}>
                <MilestoneRow
                  m={m}
                  isSelected={selectedMilestoneId === m.id}
                  onClick={onMilestoneClick}
                />
                {pendingGate && <InlineGateIndicator gate={pendingGate} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sourcing Engine-Specific Section ─────────────────────────────

function ScaleMarginEngineSection() {
  const loopSteps = [
    { label: 'Inventory Monitor', icon: '1' },
    { label: 'Reorder Trigger', icon: '2' },
    { label: 'Auto-PO', icon: '3' },
    { label: 'Vendor Dispatch', icon: '4' },
    { label: 'DC Receive', icon: '5' },
    { label: 'Store Replenish', icon: '6' },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <RefreshCw className="w-4 h-4 text-success" />
        <span className="text-sm font-semibold text-gray-900">Scale Margin Engine</span>
        <Badge variant="success" className="text-[10px]">Auto-Replenish Active</Badge>
      </div>

      {/* Replenishment loop diagram */}
      <div className="flex items-center gap-1 flex-wrap justify-center py-2">
        {loopSteps.map((step, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-success/30 bg-success-50">
              <span className="w-4 h-4 rounded-full bg-success text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {step.icon}
              </span>
              <span className="text-[10px] font-medium text-success-700 whitespace-nowrap">{step.label}</span>
            </div>
            {i < loopSteps.length - 1 ? (
              <ArrowRight className="w-3 h-3 text-success/50 shrink-0" />
            ) : (
              <div className="flex items-center gap-0.5">
                <ArrowRight className="w-3 h-3 text-success/50 shrink-0" />
                <RefreshCw className="w-3 h-3 text-success/50 shrink-0" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Key metrics grid */}
      <MetricGrid columns={3} className="mb-0">
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-2">
          <p className="text-[10px] text-gray-500">Safety Stock Level</p>
          <p className="text-sm font-bold text-gray-900">1,200 units</p>
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-2">
          <p className="text-[10px] text-gray-500">Reorder Point</p>
          <p className="text-sm font-bold text-gray-900">800 units</p>
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-2">
          <p className="text-[10px] text-gray-500">Avg Lead Time</p>
          <p className="text-sm font-bold text-gray-900">12 days</p>
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-2">
          <p className="text-[10px] text-gray-500">Auto-PO Count (MTD)</p>
          <p className="text-sm font-bold text-primary">23</p>
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-2">
          <p className="text-[10px] text-gray-500">Fill Rate</p>
          <p className="text-sm font-bold text-success">96.8%</p>
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-2">
          <p className="text-[10px] text-gray-500">Next Reorder</p>
          <p className="text-sm font-bold text-warning">~3 days</p>
        </div>
      </MetricGrid>
    </div>
  );
}

function FastResponseEngineSection() {
  return (
    <div className="space-y-3">
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-gray-900">Fast Response Engine</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">Day 7 Checkpoint</p>
            <p className="text-sm font-medium text-gray-900">Chase / Hold / Kill decisions pending</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Day 14 Checkpoint</p>
            <p className="text-sm font-medium text-gray-500">Upcoming</p>
          </div>
        </div>
      </div>
      <ChaseDecisionPanel />
    </div>
  );
}

function TestRepeatEngineSection({ drop }: { drop: DropJourney }) {
  // Derive test phase info from milestones
  const testSelling = drop.milestones.find(m => m.name === 'Test Selling');
  const scaleOrKill = drop.milestones.find(m => m.name === 'Scale or Kill');
  const isTestActive = testSelling?.status === 'on-track' || testSelling?.status === 'completed';
  const scaleDecided = scaleOrKill?.status === 'completed';
  // Extract test store count from description (e.g. "Test in 80 stores...")
  const storeMatch = testSelling?.description.match(/(\d+)\s*stores/);
  const testStoreCount = storeMatch ? storeMatch[1] : '50';
  // Mock sell-through at Day 7
  const sellThroughDay7 = isTestActive ? 68 : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="flex items-center gap-2 mb-2">
        <FlaskConical className="w-4 h-4 text-secondary" />
        <span className="text-sm font-semibold text-gray-900">Test &amp; Repeat Engine</span>
      </div>
      <div className="flex items-center gap-3 flex-wrap mb-2">
        {isTestActive && (
          <Badge variant="outline" className="text-[10px] border-secondary/30 text-secondary-700 bg-secondary-50">
            Test Phase Active
          </Badge>
        )}
        {scaleDecided ? (
          <Badge variant="success" className="text-[10px]">Scale Approved</Badge>
        ) : (
          <Badge variant="warning" className="text-[10px]">Scale Decision Pending</Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-500">Test Stores</p>
          <p className="text-sm font-medium text-gray-900">Testing in {testStoreCount} stores</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Day 7 <KpiLabel abbr="Sell-Through" /></p>
          {sellThroughDay7 !== null ? (
            <p className={cn(
              'text-sm font-medium',
              sellThroughDay7 >= 60 ? 'text-success' : sellThroughDay7 >= 40 ? 'text-warning' : 'text-error',
            )}>
              {sellThroughDay7}%
            </p>
          ) : (
            <p className="text-sm font-medium text-gray-500">Awaiting data</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SourcingEngineSection({ drop }: { drop: DropJourney }) {
  if (drop.sourcingEngine === 'scale_margin') return <ScaleMarginEngineSection />;
  if (drop.sourcingEngine === 'fast_response') return <FastResponseEngineSection />;
  if (drop.sourcingEngine === 'test_repeat') return <TestRepeatEngineSection drop={drop} />;
  return null;
}

// ─── Drop Journey Pipeline Card ────────────────────────────────────

function DropJourneyPipelineCard({
  drop,
  sourcingView,
}: {
  drop: DropJourney;
  sourcingView: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<JourneyMilestone | null>(null);
  const overallStatus = getDropOverallStatus(drop);
  const healthColor = drop.healthScore >= 90 ? 'text-success' : drop.healthScore >= 75 ? 'text-warning' : 'text-error';
  const eng = engineLabel[drop.sourcingEngine];

  const completedMilestones = drop.milestones.filter(m => m.status === 'completed').length;
  const totalMilestones = drop.milestones.length;
  const activePhase = PHASES.find(p => getPhaseStatus(drop.milestones, p) === 'active' || getPhaseStatus(drop.milestones, p) === 'at-risk');

  const handleMilestoneClick = (m: JourneyMilestone) => {
    setSelectedMilestone(prev => prev?.id === m.id ? null : m);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 hover:border-primary/30 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2 rounded"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded
              ? <ChevronDown className="w-4 h-4 text-gray-400" />
              : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </button>
          <span className="text-sm font-semibold text-gray-900">{drop.name}</span>
          <Badge variant="outline" className="text-[10px]">{drop.season}</Badge>
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', eng?.color)}>{eng?.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className={cn('text-sm font-bold', healthColor)}>{drop.healthScore}%</span>
            <p className="text-[10px] text-gray-500">Health</p>
          </div>
          <Badge variant={overallStatus.variant} className="text-[10px]">{overallStatus.label}</Badge>
        </div>
      </div>

      {/* Phase pipeline */}
      <PhasePipeline milestones={drop.milestones} />

      {/* Summary row */}
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
        <span>{completedMilestones}/{totalMilestones} milestones</span>
        <span>Pod: {drop.categoryPod}</span>
        {activePhase && <span>Current: {activePhase}</span>}
        <span>N-Day: {drop.nDay}</span>
      </div>

      {/* Expanded: engine-specific section + phase details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
          {/* Sourcing engine-specific behavior */}
          <SourcingEngineSection drop={drop} />

          {/* Phase milestone details + detail panel layout */}
          <div className={cn('flex gap-3', selectedMilestone ? 'items-start' : '')}>
            <div className={cn('space-y-2', selectedMilestone ? 'flex-1 min-w-0' : 'w-full')}>
              {PHASES.map(phase => (
                <PhaseSection
                  key={phase}
                  phase={phase}
                  milestones={drop.milestones}
                  defaultExpanded={
                    sourcingView
                      ? (phase === 'MAKE' || phase === 'BUY')
                      : getPhaseStatus(drop.milestones, phase) === 'active' || getPhaseStatus(drop.milestones, phase) === 'at-risk'
                  }
                  selectedMilestoneId={selectedMilestone?.id}
                  onMilestoneClick={handleMilestoneClick}
                />
              ))}
            </div>

            {/* Milestone Detail side panel */}
            {selectedMilestone && (
              <div className="w-80 shrink-0 animate-fadeInUp">
                <MilestoneDetail
                  milestone={selectedMilestone}
                  onClose={() => setSelectedMilestone(null)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Summary Stats ─────────────────────────────────────────────────

function useFilteredDrops() {
  const drops = useCalendarStore((s) => s.drops);
  const seasonFilter = useCalendarStore((s) => s.seasonFilter);
  const podFilter = useCalendarStore((s) => s.podFilter);
  const engineFilter = useCalendarStore((s) => s.engineFilter);
  const statusFilter = useCalendarStore((s) => s.statusFilter);

  return useMemo(() => {
    return drops.filter((drop) => {
      if (seasonFilter && drop.season !== seasonFilter) return false;
      if (podFilter && drop.categoryPod !== podFilter) return false;
      if (engineFilter && drop.sourcingEngine !== engineFilter) return false;
      if (statusFilter && drop.status !== statusFilter) return false;
      return true;
    });
  }, [drops, seasonFilter, podFilter, engineFilter, statusFilter]);
}

function PipelineSummaryStrip() {
  const drops = useFilteredDrops();
  const total = drops.length;
  const onTrack = drops.filter(d => d.status === 'on-track' || d.status === 'completed').length;
  const atRisk = drops.filter(d => d.status === 'at-risk').length;
  const delayed = drops.filter(d => d.status === 'delayed').length;

  return (
    <p className="text-xs text-gray-500 px-1 mb-3">
      {total} drops &middot; {onTrack} on track &middot; {atRisk} at risk &middot; {delayed} delayed
    </p>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────

function DropFilterBar() {
  const seasonFilter = useCalendarStore((s) => s.seasonFilter);
  const podFilter = useCalendarStore((s) => s.podFilter);
  const engineFilter = useCalendarStore((s) => s.engineFilter);
  const statusFilter = useCalendarStore((s) => s.statusFilter);
  const setSeasonFilter = useCalendarStore((s) => s.setSeasonFilter);
  const setPodFilter = useCalendarStore((s) => s.setPodFilter);
  const setEngineFilter = useCalendarStore((s) => s.setEngineFilter);
  const setStatusFilter = useCalendarStore((s) => s.setStatusFilter);

  const drops = useCalendarStore((s) => s.drops);
  const seasons = [...new Set(drops.map(d => d.season))].sort();
  const pods = [...new Set(drops.map(d => d.categoryPod))].sort();

  const hasFilters = seasonFilter || podFilter || engineFilter || statusFilter;

  return (
    <FilterBarLayout className="mb-3">
      <FilterSelect
        value={seasonFilter || '__all__'}
        onChange={(v) => setSeasonFilter(v === '__all__' ? null : v)}
        options={[{ value: '__all__', label: 'All Seasons' }, ...seasons.map(s => ({ value: s, label: s }))]}
        searchable
      />
      <FilterSelect
        value={podFilter || '__all__'}
        onChange={(v) => setPodFilter(v === '__all__' ? null : v)}
        options={[{ value: '__all__', label: 'All PODs' }, ...pods.map(p => ({ value: p, label: p }))]}
        searchable
      />
      <FilterSelect
        value={engineFilter || '__all__'}
        onChange={(v) => setEngineFilter(v === '__all__' ? null : (v as SourcingEngine))}
        options={[
          { value: '__all__', label: 'All Engines' },
          { value: 'fast_response', label: 'Fast Response' },
          { value: 'scale_margin', label: 'Scale Margin' },
          { value: 'test_repeat', label: 'Test & Repeat' },
        ]}
        searchable
      />
      <FilterSelect
        value={statusFilter || '__all__'}
        onChange={(v) => setStatusFilter(v === '__all__' ? null : (v as DropStatus))}
        options={[
          { value: '__all__', label: 'All Status' },
          { value: 'on-track', label: 'On Track' },
          { value: 'at-risk', label: 'At Risk' },
          { value: 'delayed', label: 'Delayed' },
          { value: 'completed', label: 'Completed' },
        ]}
        searchable
      />
      {hasFilters && (
        <FilterClear
          onClear={() => {
            setSeasonFilter(null);
            setPodFilter(null);
            setEngineFilter(null);
            setStatusFilter(null);
          }}
        />
      )}
    </FilterBarLayout>
  );
}

// ─── Three-Calendar Sync Panel ────────────────────────────────────

interface SyncRelationship {
  dropId: string;
  dropName: string;
  nDay: string;
  storeEvent: { name: string; date: string; status: string };
  marketingEvents: { name: string; date: string; status: string }[];
  syncStatus: 'Aligned' | 'At Risk' | 'Delayed';
}

const syncRelationships: SyncRelationship[] = [
  {
    dropId: 'd6f7a8b9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
    dropName: "SS26 Men's Casuals Drop 4",
    nDay: 'Apr 15',
    storeEvent: { name: 'VM Changeover', date: 'Apr 14', status: 'VM refresh scheduled' },
    marketingEvents: [
      { name: 'Product Story', date: 'Mar 25', status: 'Content in progress' },
      { name: 'Social Pre-buzz', date: 'Apr 8', status: 'Scheduled' },
    ],
    syncStatus: 'Aligned',
  },
  {
    dropId: 'd7a8b9c0-e1f2-4a3b-4c5d-6e7f8a9b0c1d',
    dropName: 'SS26 Kidswear Drop 3',
    nDay: 'Apr 20',
    storeEvent: { name: 'VM Changeover', date: 'Apr 18', status: 'Pending vendor confirmation' },
    marketingEvents: [
      { name: 'Product Story', date: 'Apr 1', status: 'Not started' },
    ],
    syncStatus: 'At Risk',
  },
  {
    dropId: 'd8b9c0d1-f2a3-4b4c-5d6e-7f8a9b0c1d2e',
    dropName: "SS26 Women's Indian Drop 2",
    nDay: 'May 1',
    storeEvent: { name: 'VM Changeover', date: 'Apr 29', status: 'VM brief sent' },
    marketingEvents: [
      { name: 'Product Story', date: 'Apr 10', status: 'Planned' },
      { name: 'Social Pre-buzz', date: 'Apr 24', status: 'Planned' },
    ],
    syncStatus: 'Aligned',
  },
];

function ThreeCalendarSyncPanel() {
  const syncStatusConfig: Record<SyncRelationship['syncStatus'], { color: string }> = {
    'Aligned': { color: 'text-success' },
    'At Risk': { color: 'text-warning' },
    'Delayed': { color: 'text-error' },
  };

  return (
    <div className="mt-4 bg-white rounded-lg border border-gray-200 p-3">
      <div className="flex items-center gap-2 mb-3">
        <ArrowRight className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-gray-900">Three-Calendar Synchronization</h3>
        <span className="text-xs text-gray-400">Retail + Store + Marketing</span>
      </div>

      <div className="space-y-3">
        {syncRelationships.map((sync) => {
          const sc = syncStatusConfig[sync.syncStatus];
          return (
            <div
              key={sync.dropId}
              className="rounded-lg border border-gray-100 p-3 hover:border-primary/20 transition-all duration-200"
            >
              {/* Flow visualization */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-xs font-semibold text-gray-900">{sync.dropName}</span>
                <ArrowRight className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-700">{sync.storeEvent.name} ({sync.storeEvent.date})</span>
                {sync.marketingEvents.map((me, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-700">{me.name} ({me.date})</span>
                  </span>
                ))}
              </div>

              {/* Detail row */}
              <div className="flex items-center justify-between gap-2 text-[10px] text-gray-500">
                <div className="flex items-center gap-4">
                  <span>Retail N-Day: <span className="font-medium text-gray-700">{sync.nDay}</span></span>
                  <span>Store: <span className="font-medium text-gray-700">{sync.storeEvent.status}</span></span>
                  <span>Marketing: <span className="font-medium text-gray-700">
                    {sync.marketingEvents[0]?.status ?? 'N/A'}
                  </span></span>
                </div>
                <span className={cn('font-semibold', sc.color)}>
                  Status: {sync.syncStatus} {sync.syncStatus === 'Aligned' ? '\u2713' : sync.syncStatus === 'At Risk' ? '\u26A0' : '\u2717'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────

export function DropTrackerPage() {
  const { personaId } = usePersonaStore();
  const isSourcing = personaId === 'sourcing';
  const filteredDrops = useFilteredDrops();

  return (
    <div className="animate-fadeInUp">
      <Tabs defaultValue="calendar">
        <TabsList variant="underline" className="mb-4">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="store">Store Calendar</TabsTrigger>
          <TabsTrigger value="marketing">Marketing Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <RetailCalendarJourney />
          <ThreeCalendarSyncPanel />
        </TabsContent>

        <TabsContent value="pipeline">
          <DropFilterBar />
          <PipelineSummaryStrip />
          <div className="space-y-3">
            {filteredDrops.map(drop => (
              <DropJourneyPipelineCard
                key={drop.id}
                drop={drop}
                sourcingView={isSourcing}
              />
            ))}
            {filteredDrops.length === 0 && (
              <EmptyState description="No drops match the current filters" />
            )}
          </div>
        </TabsContent>

        <TabsContent value="health">
          <CalendarHealthPage />
        </TabsContent>

        <TabsContent value="store">
          <StoreCalendarPage />
        </TabsContent>

        <TabsContent value="marketing">
          <MarketingCalendarPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
