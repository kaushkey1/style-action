import { Bot, Clock, Shield, AlertTriangle, CheckCircle2, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { JourneyMilestone } from '../data/mockCalendarJourney';

interface MilestoneDetailProps {
  milestone: JourneyMilestone;
  onClose: () => void;
}

export function MilestoneDetail({ milestone, onClose }: MilestoneDetailProps) {
  const statusConfig = {
    completed: { label: 'Completed', color: 'text-success', bg: 'bg-success-50', icon: CheckCircle2 },
    'on-track': { label: 'On Track', color: 'text-success', bg: 'bg-success-50', icon: CheckCircle2 },
    'at-risk': { label: 'At Risk', color: 'text-warning', bg: 'bg-warning-50', icon: AlertTriangle },
    missed: { label: 'Missed', color: 'text-error', bg: 'bg-error-50', icon: AlertTriangle },
    upcoming: { label: 'Upcoming', color: 'text-gray-500', bg: 'bg-gray-50', icon: Clock },
  };

  const conf = statusConfig[milestone.status];
  const StatusIcon = conf.icon;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-lg">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{milestone.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-[10px]">{milestone.phase}</Badge>
            <Badge variant={milestone.status === 'completed' || milestone.status === 'on-track' ? 'success' : milestone.status === 'at-risk' ? 'warning' : milestone.status === 'missed' ? 'error' : 'default'} size="sm">
              <StatusIcon className="w-3 h-3 mr-0.5" />
              {conf.label}
            </Badge>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2" aria-label="Close milestone detail">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Agent Ownership */}
        <div className="flex items-center gap-2 text-xs">
          <Bot className="w-3 h-3 text-gray-400" />
          <span className="text-gray-500">Agent:</span>
          <span className="text-gray-900 font-medium">{milestone.agentId} — {milestone.agentName}</span>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-2 text-xs">
          <Clock className="w-3 h-3 text-gray-400" />
          <span className="text-gray-500">Target:</span>
          <span className="text-gray-900">{milestone.targetDate}</span>
          {milestone.status === 'completed' && (
            <>
              <span className="text-gray-400">|</span>
              <span className="text-success">Completed</span>
            </>
          )}
        </div>

        {/* Human Gate */}
        {milestone.humanGate && (
          <div className="flex items-center gap-2 px-3 py-2 bg-warning-50 rounded-lg border border-warning/20">
            <Shield className="w-4 h-4 text-warning" />
            <div>
              <span className="text-xs font-medium text-warning-700">Human Gate Required</span>
              <p className="text-[10px] text-warning-600 mt-0.5">{milestone.humanGate}</p>
            </div>
          </div>
        )}

        {/* Description */}
        {milestone.description && (
          <div className="rounded-lg p-3 bg-gray-50 border border-gray-100">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Description</p>
            <p className="text-xs text-gray-700">{milestone.description}</p>
          </div>
        )}

        {/* Status context */}
        <div className={cn('rounded-lg p-3', conf.bg)}>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Status Context</p>
          <p className="text-xs text-gray-700">
            {milestone.status === 'completed' && 'All deliverables confirmed. Agent verified completion criteria met.'}
            {milestone.status === 'on-track' && 'Progress within expected parameters. No blockers identified.'}
            {milestone.status === 'at-risk' && 'Timeline pressure detected. Agent recommends resource reallocation or scope adjustment.'}
            {milestone.status === 'missed' && 'Deadline exceeded. Cascade risk analysis initiated. Escalation recommended.'}
            {milestone.status === 'upcoming' && 'Scheduled for future execution. Prerequisites being tracked by agent.'}
          </p>
        </div>

        {/* Quick Links — cross-module navigation */}
        <QuickLinks milestoneName={milestone.name} />
      </div>
    </div>
  );
}

// ─── Quick Links for cross-module navigation ──────────────────────

interface QuickLink {
  label: string;
  to: string;
}

function getQuickLinks(milestoneName: string): QuickLink[] {
  const name = milestoneName.toLowerCase();
  const links: QuickLink[] = [];

  if (name.includes('space plan')) {
    links.push({ label: 'View Space Plan', to: '/store-view' });
  }
  if (name.includes('range')) {
    links.push({ label: 'View Range', to: '/calendar' });
  }
  if (name.includes('otb')) {
    links.push({ label: 'View OTB', to: '/working-capital' });
  }
  if (name.includes('store display') || name.includes('vm')) {
    links.push({ label: 'View Store', to: '/store-view' });
  }

  return links;
}

function QuickLinks({ milestoneName }: { milestoneName: string }) {
  const links = getQuickLinks(milestoneName);
  if (links.length === 0) return null;

  return (
    <div className="pt-2 border-t border-gray-100">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Quick Links</p>
      <div className="flex flex-col gap-1">
        {links.map((link) => (
          <Link
            key={link.label}
            to={link.to}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary-700 font-medium transition-colors group"
          >
            {link.label}
            <ArrowRight className="w-3 h-3 opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ))}
      </div>
    </div>
  );
}
