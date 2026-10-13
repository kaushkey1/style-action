// Gantt-chart calendar view of drop journeys

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Bot,
  Users,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  mockDropJourneys,
  mockCalendarAlerts,
  type DropJourney,
  type JourneyMilestone,
  type JourneyPhase,
  type MilestoneStatus,
  type AutonomyTier,
} from '../data/mockCalendarJourney';
import { CascadeRiskPanel } from '@/modules/range/components/CascadeRiskPanel';

// ─── Timeline configuration ────────────────────────────────────────

const TIMELINE_START = new Date('2025-10-01');
const TIMELINE_END = new Date('2026-09-01');
const TOTAL_MS = TIMELINE_END.getTime() - TIMELINE_START.getTime();

const timelineMonths: { label: string; year?: string }[] = [
  { label: 'Oct', year: "'25" },
  { label: 'Nov' },
  { label: 'Dec' },
  { label: 'Jan', year: "'26" },
  { label: 'Feb' },
  { label: 'Mar' },
  { label: 'Apr' },
  { label: 'May' },
  { label: 'Jun' },
  { label: 'Jul' },
  { label: 'Aug' },
];

const PHASES: JourneyPhase[] = ['PLAN', 'BUY', 'MAKE', 'MOVE', 'SELL'];

function dateToPercent(dateStr: string): number {
  const d = new Date(dateStr);
  return Math.max(0, Math.min(100, ((d.getTime() - TIMELINE_START.getTime()) / TOTAL_MS) * 100));
}

const todayPct = dateToPercent('2026-02-18');

// ─── Visual configs ────────────────────────────────────────────────

const phaseColor: Record<JourneyPhase, { bar: string; text: string; dot: string }> = {
  PLAN: { bar: 'bg-primary/20', text: 'text-primary-700', dot: 'bg-primary' },
  BUY: { bar: 'bg-amber-500/20', text: 'text-amber-700', dot: 'bg-amber-500' },
  MAKE: { bar: 'bg-violet-500/15', text: 'text-violet-700', dot: 'bg-violet-500' },
  MOVE: { bar: 'bg-teal-500/15', text: 'text-teal-700', dot: 'bg-teal-500' },
  SELL: { bar: 'bg-success/20', text: 'text-success-700', dot: 'bg-success' },
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

const engineNames: Record<string, string> = {
  fast_response: 'Fast Response',
  scale_margin: 'Scale Margin',
  test_repeat: 'Test & Repeat',
};

const severityBorder: Record<string, string> = {
  S1: 'border-l-error',
  S2: 'border-l-warning',
  S3: 'border-l-primary',
  S4: 'border-l-gray-300',
};

const severityBg: Record<string, string> = {
  S1: 'bg-error-50/50',
  S2: 'bg-warning-50/50',
  S3: 'bg-primary-50/30',
  S4: 'bg-gray-50',
};

// ─── Helpers ───────────────────────────────────────────────────────

function getPhaseSpan(milestones: JourneyMilestone[], phase: JourneyPhase) {
  const pm = milestones.filter(m => m.phase === phase);
  if (pm.length === 0) return null;
  const ts = pm.map(m => new Date(m.targetDate).getTime());
  const start = dateToPercent(new Date(Math.min(...ts)).toISOString().slice(0, 10));
  const endDate = new Date(Math.max(...ts) + 7 * 86400000);
  const end = Math.min(dateToPercent(endDate.toISOString().slice(0, 10)), 100);
  return { start, end, milestones: pm };
}

// ─── Drop Swim Lane ────────────────────────────────────────────────

function DropSwimLane({ drop }: { drop: DropJourney }) {
  const [expanded, setExpanded] = useState(false);

  const healthColor = drop.healthScore >= 90 ? 'text-success' : drop.healthScore >= 75 ? 'text-warning' : 'text-error';
  const statusVariant = drop.status === 'on-track' || drop.status === 'completed'
    ? 'success' as const
    : drop.status === 'at-risk' ? 'warning' as const : 'error' as const;
  const statusLabel = drop.status === 'on-track' ? 'On Track'
    : drop.status === 'at-risk' ? 'At Risk'
      : drop.status === 'delayed' ? 'Delayed' : 'Done';

  const nDayPct = dateToPercent(drop.nDay);

  return (
    <div className={cn('border-b border-gray-100 last:border-b-0', expanded && 'bg-gray-50/20')}>
      <div className="flex">
        {/* Sidebar */}
        <div className="w-48 shrink-0 p-3 border-r border-gray-100">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-left w-full focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2 rounded"
            aria-label={expanded ? 'Collapse drop details' : 'Expand drop details'}
          >
            {expanded
              ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              : <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
            <span className="text-xs font-semibold text-gray-900 truncate">{drop.name}</span>
          </button>
          <div className="flex items-center gap-1.5 mt-1 ml-5">
            <Badge variant="outline" className="text-[10px]">{drop.season}</Badge>
            <Badge variant={statusVariant} className="text-[10px]">{statusLabel}</Badge>
          </div>
          <div className="flex items-center gap-2 mt-1 ml-5">
            <span className={cn('text-xs font-bold', healthColor)}>{drop.healthScore}%</span>
            <span className="text-[10px] text-gray-500">{engineNames[drop.sourcingEngine]}</span>
          </div>
        </div>

        {/* Timeline area */}
        <div className="flex-1 relative py-2 overflow-hidden">
          {/* Month grid lines */}
          {timelineMonths.map((_, i) =>
            i < timelineMonths.length - 1 ? (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-gray-100/70"
                // eslint-disable-next-line no-restricted-syntax -- dynamic positioning
                style={{ left: `${((i + 1) / timelineMonths.length) * 100}%` }}
              />
            ) : null,
          )}

          {/* Today marker */}
          <div
            className="absolute top-0 bottom-0 w-px bg-error/40 z-20"
            // eslint-disable-next-line no-restricted-syntax -- dynamic positioning
            style={{ left: `${todayPct}%` }}
          />

          {/* N-Day triangle marker */}
          <div
            className="absolute top-0.5 z-30"
            // eslint-disable-next-line no-restricted-syntax -- dynamic positioning
            style={{ left: `${nDayPct}%` }}
            title={`N-Day: ${drop.nDay}`}
          >
            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-error/70 -translate-x-1/2" />
          </div>

          {/* Phase bars */}
          <div className="relative h-5 mx-1 mt-2">
            {PHASES.map(phase => {
              const span = getPhaseSpan(drop.milestones, phase);
              if (!span) return null;
              const w = Math.max(span.end - span.start, 1.5);
              return (
                <div
                  key={phase}
                  className={cn('absolute top-0 h-full rounded-sm', phaseColor[phase].bar)}
                  // eslint-disable-next-line no-restricted-syntax -- dynamic positioning and width
                  style={{ left: `${span.start}%`, width: `${w}%` }}
                >
                  {w > 5 && (
                    <span className={cn('text-[10px] font-semibold px-0.5 leading-5 truncate block', phaseColor[phase].text)}>
                      {phase}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Milestone dots */}
          <div className="relative h-3 mx-1 mt-0.5">
            {drop.milestones.map(m => (
              <div
                key={m.id}
                className={cn(
                  'absolute w-1.5 h-1.5 rounded-full -translate-x-1/2 top-0.5 ring-1 ring-white',
                  statusDot[m.status],
                )}
                // eslint-disable-next-line no-restricted-syntax -- dynamic positioning
                style={{ left: `${dateToPercent(m.targetDate)}%` }}
                title={`${m.nDayLabel} · ${m.name} (${statusBadge[m.status].label})`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Expanded milestone details */}
      {expanded && (
        <div className="border-t border-gray-100 bg-white p-3">
          <MilestoneDetails milestones={drop.milestones} />
        </div>
      )}
    </div>
  );
}

// ─── Expanded Milestone Details ────────────────────────────────────

function MilestoneDetails({ milestones }: { milestones: JourneyMilestone[] }) {
  return (
    <div className="space-y-3">
      {PHASES.map(phase => {
        const items = milestones.filter(m => m.phase === phase);
        if (items.length === 0) return null;
        return (
          <div key={phase}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={cn('w-2 h-2 rounded-full', phaseColor[phase].dot)} />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{phase}</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <div className="space-y-1">
              {items.map(m => {
                const sc = statusBadge[m.status];
                const ac = autonomyLabel[m.autonomy];
                return (
                  <div
                    key={m.id}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-1.5 border',
                      m.status === 'completed' ? 'bg-gray-50/50 border-gray-100' : 'bg-white border-gray-200',
                    )}
                  >
                    <div className="w-14 shrink-0">
                      <span className="text-xs font-semibold text-gray-900">{m.nDayLabel}</span>
                      <p className="text-[10px] text-gray-500">{m.targetDate}</p>
                    </div>
                    <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusDot[m.status])} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{m.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{m.description}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Bot className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] text-gray-600">{m.agentId}</span>
                    </div>
                    <span className={cn('text-[10px] px-1 py-0.5 rounded border shrink-0', ac.color)}>
                      {ac.label}
                    </span>
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
                    <span className={cn('text-[10px] px-1 py-0.5 rounded border shrink-0', sc.color)}>
                      {sc.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Alerts Panel ──────────────────────────────────────────────────

function CalendarAlerts() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-warning" />
        <h3 className="text-sm font-semibold text-gray-900">Calendar Alerts</h3>
        <Badge variant="warning" className="text-[10px]">{mockCalendarAlerts.length}</Badge>
      </div>
      <div className="space-y-2">
        {mockCalendarAlerts.map(alert => (
          <Link
            key={alert.id}
            to="/exceptions"
            className={cn(
              'block border-l-3 rounded-r-lg p-2.5 cursor-pointer',
              'hover:shadow-sm hover:brightness-[0.98] transition-all duration-200',
              severityBorder[alert.severity],
              severityBg[alert.severity],
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-gray-900">{alert.title}</span>
                <ExternalLink className="w-3 h-3 text-gray-400 shrink-0" />
              </div>
              <span className="text-[10px] text-gray-400 shrink-0">{alert.time}</span>
            </div>
            <p className="text-[10px] text-gray-600 mb-1">{alert.description}</p>

            {/* Cascade chain visualization */}
            {alert.cascadeChain && alert.cascadeChain.length > 0 && (
              <CascadeRiskPanel
                cascadeChain={alert.cascadeChain}
                currentStepIndex={0}
                className="mt-1.5 mb-1"
              />
            )}

            <div className="flex items-center gap-3">
              {alert.impact && <span className="text-[10px] font-medium text-error-600">{alert.impact}</span>}
              <div className="flex items-center gap-1">
                <Bot className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] text-gray-500">{alert.agentId} {alert.agentName}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────

export function RetailCalendarJourney() {
  return (
    <div className="space-y-3">
      {/* Gantt Calendar */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Timeline header */}
        <div className="flex border-b border-gray-200 bg-gray-50/50">
          <div className="w-48 shrink-0 px-3 py-2 border-r border-gray-100">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Drop Journey</span>
          </div>
          <div className="flex-1 relative">
            <div className="grid grid-cols-11">
              {timelineMonths.map((m, i) => (
                <div
                  key={i}
                  className={cn('text-center py-2', i < timelineMonths.length - 1 && 'border-r border-gray-100')}
                >
                  <span className="text-[10px] font-medium text-gray-500">
                    {m.label}{m.year ? ` ${m.year}` : ''}
                  </span>
                </div>
              ))}
            </div>
            {/* Today marker line */}
            <div
              className="absolute top-0 bottom-0 w-px bg-error/50 z-20"
              // eslint-disable-next-line no-restricted-syntax -- dynamic positioning
              style={{ left: `${todayPct}%` }}
            />
          </div>
        </div>

        {/* Drop swim lanes */}
        {mockDropJourneys.map(drop => (
          <DropSwimLane key={drop.id} drop={drop} />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap px-0.5">
        {PHASES.map(phase => (
          <div key={phase} className="flex items-center gap-1">
            <span className={cn('w-3 h-2 rounded-sm', phaseColor[phase].bar)} />
            <span className="text-[10px] text-gray-500">{phase}</span>
          </div>
        ))}
        <span className="w-px h-3 bg-gray-200" />
        {(['completed', 'on-track', 'at-risk', 'upcoming'] as MilestoneStatus[]).map(s => (
          <div key={s} className="flex items-center gap-1">
            <span className={cn('w-1.5 h-1.5 rounded-full', statusDot[s])} />
            <span className="text-[10px] text-gray-500">{statusBadge[s].label}</span>
          </div>
        ))}
        <span className="w-px h-3 bg-gray-200" />
        <div className="flex items-center gap-1">
          <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[5px] border-t-error/70" />
          <span className="text-[10px] text-gray-500">N-Day</span>
        </div>
      </div>

      {/* Calendar Alerts */}
      <CalendarAlerts />
    </div>
  );
}
