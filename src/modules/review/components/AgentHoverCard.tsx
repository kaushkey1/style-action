import { Bot } from 'lucide-react';

const AGENT_INFO: Record<string, { tier: string; description: string; actions: number; accuracy: string; value: string }> = {
  'Pricing Agent': {
    tier: 'Tier 2 — Pricing & Markdown',
    description: 'Monitors inventory aging, sell-through velocity, and margin trends. Generates markdown proposals when aging thresholds are breached.',
    actions: 342, accuracy: '94%', value: '₹14.2 Cr',
  },
  'OTB Guardian': {
    tier: 'Tier 2 — Open-to-Buy',
    description: 'Monitors OTB utilization and pod-level imbalances. Proposes cross-POD reallocations when utilization variance exceeds ±15%.',
    actions: 89, accuracy: '97%', value: '₹48 Cr',
  },
  'Vendor Agent': {
    tier: 'Tier 2 — Vendor Management',
    description: 'Tracks vendor SLA compliance, OTIF rates, and delivery performance. Flags consecutive breaches and recommends vendor switches.',
    actions: 156, accuracy: '91%', value: '₹22 Cr',
  },
  'Supply Agent': {
    tier: 'Tier 2 — Supply Chain',
    description: 'Detects fabric delays, cascade risks, and vendor capacity constraints. Proposes backup vendor switches and partial allocations.',
    actions: 78, accuracy: '89%', value: '₹8.4 Cr',
  },
  'Style Optimizer': {
    tier: 'Tier 2 — Range Optimization',
    description: 'Identifies slow-moving styles and underperformers. Flags styles for closure, markdown, or redistribution based on sell-through benchmarks.',
    actions: 215, accuracy: '92%', value: '₹31 Cr',
  },
  'Liquidation Trigger': {
    tier: 'Tier 2 — End-of-Life',
    description: 'Routes aged inventory to clearance channels. Evaluates B2B, outlet, and markdown options based on recovery rate projections.',
    actions: 64, accuracy: '96%', value: '₹5.8 Cr',
  },
  'Marketing Agent': {
    tier: 'Tier 2 — Campaign Optimization',
    description: 'Monitors campaign ROAS, CTR, and budget allocation. Proposes reallocations from underperforming to high-performing channels.',
    actions: 128, accuracy: '88%', value: '₹9.1 Cr',
  },
  'Replenishment Engine': {
    tier: 'Tier 2 — Stock Replenishment',
    description: 'Tracks safety stock levels and stockout risks. Generates transfer and replenishment orders when thresholds are breached.',
    actions: 412, accuracy: '95%', value: '₹52 Cr',
  },
  'Exception Engine': {
    tier: 'Tier 1 — Detection',
    description: 'Core detection engine that monitors KPIs against thresholds across all domains. Generates exceptions when breaches are detected.',
    actions: 890, accuracy: '87%', value: '—',
  },
};

const DEFAULT_INFO = {
  tier: 'Tier 2 — Autonomous Agent',
  description: 'AI agent monitoring business metrics and generating actionable recommendations.',
  actions: 0, accuracy: '—', value: '—',
};

interface AgentHoverCardContentProps {
  agentName: string;
}

export function AgentHoverCardContent({ agentName }: AgentHoverCardContentProps): React.ReactNode {
  const info = AGENT_INFO[agentName] ?? DEFAULT_INFO;

  return (
    <div>
      {/* Header — avatar + name + status */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5 text-gray-500" />
        </div>
        <div className="min-w-0 pt-0.5">
          <p className="text-sm font-semibold text-gray-900 truncate">{agentName}</p>
          <p className="text-[11px] text-gray-500 mt-1">{info.tier}</p>
        </div>
        <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 mt-0.5">Active</span>
      </div>

      {/* Description */}
      <p className="text-[11px] text-gray-600 leading-relaxed mt-3">{info.description}</p>

      {/* Stats */}
      <div className="flex gap-5 mt-4 pt-3 border-t border-gray-100">
        <div>
          <p className="text-sm font-bold text-gray-900 tabular-nums">{info.actions || '—'}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Actions (30d)</p>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">{info.accuracy}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Accuracy</p>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">{info.value}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Value</p>
        </div>
      </div>
    </div>
  );
}
