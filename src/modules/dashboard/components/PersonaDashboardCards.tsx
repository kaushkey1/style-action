import { useNavigate } from 'react-router-dom';
import {
  IndianRupee,
  AlertTriangle,
  GitBranch,
  TrendingUp,
  TrendingDown,
  Store,
  Layers,
  Clock,
  Package,
  Zap,
  Users,
  Target,
  Filter,
  Truck,
  Settings,
  Minus,
  ChevronRight,
} from 'lucide-react';
import { Badge, Button, Card, SectionHeader } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  revenueScoreboard,
  worstPerformers,
  valueChainDomains,
  categoryLeaderboard,
  storeHealthDistribution,
  categoryPnl,
  fashionPyramid,
  optionLifecycle,
  poPipeline,
  vendorRisks,
  activeCampaigns,
  blendedROAS,
  channelMix,
  customerHealth,
  storeRankings,
  competitionAlerts,
  vmComplianceClusters,
  resolutionFunnel,
  deliverySLA,
  configHealth,
  recentAudit,
} from '../data/mockPersonaDashboards';

// ─── Helpers ────────────────────────────────────────────────────────────────

const ragBadge = (status: string) => {
  if (status === 'on-track') return <Badge variant="success" size="sm">On Track</Badge>;
  if (status === 'warning') return <Badge variant="warning" size="sm">Warning</Badge>;
  return <Badge variant="error" size="sm">Critical</Badge>;
};

const ragDot = (status: string) => (
  <span className={cn(
    'inline-block w-2 h-2 rounded-full',
    status === 'on-track' ? 'bg-green-500' : status === 'warning' ? 'bg-amber-500' : 'bg-red-500',
  )} />
);

const trendIcon = (t: string) => {
  if (t === 'up') return <TrendingUp className="w-3 h-3 text-green-500" />;
  if (t === 'down') return <TrendingDown className="w-3 h-3 text-red-500" />;
  return <Minus className="w-3 h-3 text-gray-400" />;
};

const sv = (v: number, seed: number) => Math.round(v * seed);

const cardClassName = 'p-4 min-w-0 overflow-hidden';

const Title = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
  <SectionHeader title={<span className="flex items-center gap-2"><Icon className="w-4 h-4 text-gray-500" />{label}</span>} />
);

// ─── 1. Revenue Scoreboard ──────────────────────────────────────────────────

export function RevenueScoreboardCard({ seed }: { seed: number }) {
  return (
    <Card className={cardClassName}>
      <Title icon={IndianRupee} label="Revenue Scoreboard" />
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-gray-100">
              <th className="text-left py-1.5 font-medium">Period</th>
              <th className="text-right py-1.5 font-medium">Actual</th>
              <th className="text-right py-1.5 font-medium">Plan</th>
              <th className="text-right py-1.5 font-medium">Ach %</th>
              <th className="text-right py-1.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {revenueScoreboard.map((r) => (
              <tr key={r.label} className="border-b border-gray-50">
                <td className="py-1.5 font-medium text-gray-700">{r.label}</td>
                <td className="text-right text-gray-900">{r.actual}</td>
                <td className="text-right text-gray-500">{r.plan}</td>
                <td className="text-right font-medium text-gray-900">{sv(r.achievement, seed)}%</td>
                <td className="text-right">{ragBadge(r.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── 2. Worst Performer ─────────────────────────────────────────────────────

export function WorstPerformerCard({ seed }: { seed: number }) {
  void seed;
  return (
    <Card className={cardClassName}>
      <Title icon={AlertTriangle} label="Worst Performers" />
      <div className="space-y-3">
        {worstPerformers.map((w) => (
          <div key={w.name} className="border border-gray-100 rounded-lg p-3">
            <SectionHeader
              title={<span className="text-xs font-medium text-gray-500 uppercase">{w.type}</span>}
              actions={<Badge variant="error" size="sm">{w.metric}</Badge>}
              className="mb-1"
            />
            <p className="text-sm font-semibold text-gray-900 mb-1">{w.name}</p>
            <div className="flex items-center gap-2 text-xs text-gray-700 mb-1">
              <span>Value: <span className="font-medium text-red-600">{w.value}</span></span>
              <span className="text-gray-400">|</span>
              <span>Target: {w.target}</span>
            </div>
            <p className="text-xs text-gray-500 mb-1">{w.rootCause}</p>
            <p className="text-xs text-primary">{w.agentAction}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── 3. Value Chain Health ──────────────────────────────────────────────────

export function ValueChainHealthCard({ seed }: { seed: number }) {
  const navigate = useNavigate();
  return (
    <Card className={cardClassName}>
      <Title icon={GitBranch} label="Value Chain Health" />
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- custom 5-col value chain grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
        {valueChainDomains.map((d) => (
          <button
            key={d.id}
            onClick={() => navigate('/exceptions')}
            className={cn(
              'rounded-lg px-1.5 py-2 text-center transition-all duration-200',
              'hover:shadow-md cursor-pointer min-w-0',
              d.status === 'on-track' ? 'bg-green-50 border border-green-200' :
              d.status === 'warning' ? 'bg-amber-50 border border-amber-200' :
              'bg-red-50 border border-red-200',
            )}
          >
            <p className="text-xs font-semibold text-gray-900 truncate">{d.name}</p>
            <p className={cn(
              'text-base font-bold',
              d.status === 'on-track' ? 'text-green-700' :
              d.status === 'warning' ? 'text-amber-700' : 'text-red-700',
            )}>{sv(d.totalExceptions, seed)}</p>
            <p className="text-xs text-gray-500">exceptions</p>
          </button>
        ))}
      </div>
    </Card>
  );
}

// ─── 4. Category Leaderboard ────────────────────────────────────────────────

export function CategoryLeaderboardCard({ seed }: { seed: number }) {
  const navigate = useNavigate();
  return (
    <Card className={cardClassName}>
      <Title icon={TrendingUp} label="Category Leaderboard" />
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-gray-100">
              <th className="text-left py-1.5 font-medium">#</th>
              <th className="text-left py-1.5 font-medium">Team</th>
              <th className="text-right py-1.5 font-medium">15d ST%</th>
              <th className="text-right py-1.5 font-medium">Target</th>
              <th className="text-center py-1.5 font-medium">Strikes</th>
              <th className="text-center py-1.5 font-medium">Trend</th>
            </tr>
          </thead>
          <tbody>
            {categoryLeaderboard.map((c) => (
              <tr key={c.rank} className="border-b border-gray-50">
                <td className="py-1.5 text-gray-500">{c.rank}</td>
                <td className="py-1.5 font-medium text-gray-900">{c.team}</td>
                <td className="text-right py-1.5 text-gray-900">{sv(c.sellThrough15d, seed)}%</td>
                <td className="text-right py-1.5 text-gray-500">{c.target}%</td>
                <td className="text-center py-1.5">
                  {c.strikes > 0 ? (
                    <span className="flex items-center justify-center gap-0.5">
                      {Array.from({ length: c.strikes }).map((_, i) => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      ))}
                    </span>
                  ) : <span className="text-gray-400">--</span>}
                </td>
                <td className="text-center py-1.5">{trendIcon(c.trend)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-between text-xs mt-2"
        onClick={() => navigate('/admin/category-teams')}
      >
        View all teams <ChevronRight className="w-3 h-3" />
      </Button>
    </Card>
  );
}

// ─── 5. Store Health Distribution ───────────────────────────────────────────

export function StoreHealthDistCard({ seed }: { seed: number }) {
  const navigate = useNavigate();
  const total = storeHealthDistribution.reduce((a, b) => a + sv(b.count, seed), 0);
  return (
    <Card className={cardClassName}>
      <Title icon={Store} label="Store Health Distribution" />
      <div className="flex h-6 rounded-full overflow-hidden mb-3">
        {storeHealthDistribution.map((b) => (
          // eslint-disable-next-line no-restricted-syntax -- dynamic width percentage for stacked bar
          <div key={b.label} className={cn(b.color, 'transition-all duration-200')} style={{ width: `${(sv(b.count, seed) / total) * 100}%` }} />
        ))}
      </div>
      <div className="flex justify-between text-xs">
        {storeHealthDistribution.map((b) => (
          <div key={b.label} className="flex items-center gap-1.5">
            <span className={cn('w-2 h-2 rounded-full', b.color)} />
            <span className="text-gray-700">{b.label.split(' ')[0]}</span>
            <span className="font-medium text-gray-900">{sv(b.count, seed)}</span>
          </div>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-between text-xs mt-3"
        onClick={() => navigate('/store-view')}
      >
        View stores <ChevronRight className="w-3 h-3" />
      </Button>
    </Card>
  );
}

// ─── 6. Category P&L ────────────────────────────────────────────────────────

export function CategoryPnlCard({ seed }: { seed: number }) {
  void seed;
  return (
    <Card className={cardClassName}>
      <Title icon={IndianRupee} label="Category P&L Snapshot" />
      <div className="grid grid-cols-2 gap-3">
        {categoryPnl.map((m) => (
          <div key={m.label} className="border border-gray-100 rounded-lg p-3">
            <SectionHeader
              title={<span className="text-xs text-gray-500 font-normal">{m.label}</span>}
              actions={ragDot(m.status)}
              className="mb-1"
            />
            <p className="text-lg font-bold text-gray-900">{m.value}</p>
            <p className="text-xs text-gray-500">Target: {m.target}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── 7. Fashion Pyramid ─────────────────────────────────────────────────────

export function FashionPyramidCard({ seed }: { seed: number }) {
  void seed;
  return (
    <Card className={cardClassName}>
      <Title icon={Layers} label="Fashion Pyramid" />
      <div className="space-y-3">
        {fashionPyramid.map((t) => (
          <div key={t.tier}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-gray-700">{t.tier}</span>
              <span className="text-gray-500">{t.actual}% / {t.target}%</span>
            </div>
            <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-200',
                  t.status === 'on-track' ? 'bg-green-500' : t.status === 'warning' ? 'bg-amber-500' : 'bg-red-500',
                )}
                // eslint-disable-next-line no-restricted-syntax -- dynamic width percentage for bar chart
                style={{ width: `${t.actual}%` }}
              />
              {/* eslint-disable-next-line no-restricted-syntax -- dynamic left position for target marker */}
              <div className="absolute top-0 h-full w-0.5 bg-gray-900" style={{ left: `${t.target}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── 8. Option Lifecycle ────────────────────────────────────────────────────

export function OptionLifecycleCard({ seed }: { seed: number }) {
  const navigate = useNavigate();
  const maxCount = Math.max(...optionLifecycle.map((b) => sv(b.count, seed)));
  return (
    <Card className={cardClassName}>
      <Title icon={Clock} label="Option Lifecycle" />
      <div className="space-y-2">
        {optionLifecycle.map((b) => (
          <div key={b.label} className="flex items-center gap-2">
            <span className="text-xs text-gray-700 w-14 shrink-0">{b.label}</span>
            <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
              {/* eslint-disable-next-line no-restricted-syntax -- dynamic width percentage for horizontal bar */}
              <div className={cn(b.color, 'h-full rounded-full transition-all duration-200')} style={{ width: `${(sv(b.count, seed) / maxCount) * 100}%` }} />
            </div>
            <span className="text-xs font-medium text-gray-900 w-12 text-right">{sv(b.count, seed)}</span>
            <span className="text-xs text-gray-500 w-8 text-right">{b.pct}%</span>
          </div>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-between text-xs mt-2"
        onClick={() => navigate('/inventory')}
      >
        View inventory <ChevronRight className="w-3 h-3" />
      </Button>
    </Card>
  );
}

// ─── 9. PO Pipeline ─────────────────────────────────────────────────────────

export function POPipelineCard({ seed }: { seed: number }) {
  return (
    <Card className={cardClassName}>
      <Title icon={Package} label="PO Pipeline" />
      <div className="space-y-1.5">
        {poPipeline.map((p) => {
          const isDelayed = p.stage === 'Delayed';
          return (
            <div
              key={p.stage}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2',
                isDelayed ? 'bg-red-50 border border-red-200' : 'bg-gray-50',
              )}
            >
              <span className={cn('w-2 h-2 rounded-full shrink-0', p.color)} />
              <span className={cn(
                'text-xs font-medium flex-1',
                isDelayed ? 'text-red-700' : 'text-gray-700',
              )}>{p.stage}</span>
              <span className="text-xs font-semibold text-gray-900">{sv(p.count, seed)}</span>
              <span className="text-xs text-gray-500 w-16 text-right">{p.value}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── 10. Vendor Risk ────────────────────────────────────────────────────────

export function VendorRiskCard({ seed }: { seed: number }) {
  return (
    <Card className={cardClassName}>
      <Title icon={AlertTriangle} label="Vendor Risk Watch" />
      <div className="space-y-2">
        {vendorRisks.map((v) => (
          <div key={v.name} className="flex items-center gap-3 border-b border-gray-50 pb-2 last:border-0 last:pb-0">
            <span className={cn(
              'w-2 h-2 rounded-full shrink-0',
              v.riskLevel === 'high' ? 'bg-red-500' : v.riskLevel === 'medium' ? 'bg-amber-500' : 'bg-green-500',
            )} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{v.name}</p>
              <div className="flex gap-3 text-xs text-gray-500">
                <span>Fill: {v.fillRate}%</span>
                <span>OTD: {v.onTime}%</span>
                <span>POs: {sv(v.openPOs, seed)}</span>
              </div>
            </div>
            <Badge
              variant={v.riskLevel === 'high' ? 'error' : v.riskLevel === 'medium' ? 'warning' : 'success'}
              size="sm"
            >{v.riskLevel}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── 11. Campaign Dashboard ─────────────────────────────────────────────────

export function CampaignDashboardCard({ seed }: { seed: number }) {
  void seed;

  const statusBadge = (st: string) => {
    if (st === 'live') return <Badge variant="success" size="sm" dot>Live</Badge>;
    if (st === 'scheduled') return <Badge variant="primary" size="sm">Scheduled</Badge>;
    return <Badge variant="default" size="sm">Completed</Badge>;
  };

  return (
    <Card className={cardClassName}>
      <Title icon={Zap} label="Active Campaigns" />
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-gray-500">Blended ROAS:</span>
        <span className="text-sm font-bold text-gray-900">{blendedROAS}x</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-gray-100">
              <th className="text-left py-1.5 font-medium">Campaign</th>
              <th className="text-left py-1.5 font-medium">Channel</th>
              <th className="text-right py-1.5 font-medium">Spend</th>
              <th className="text-right py-1.5 font-medium">Rev</th>
              <th className="text-right py-1.5 font-medium">ROAS</th>
              <th className="text-right py-1.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {activeCampaigns.map((c) => (
              <tr key={c.name} className="border-b border-gray-50">
                <td className="py-1.5 font-medium text-gray-900">{c.name}</td>
                <td className="py-1.5 text-gray-500">{c.channel}</td>
                <td className="text-right py-1.5 text-gray-700">{c.spend}</td>
                <td className="text-right py-1.5 text-gray-700">{c.revenue}</td>
                <td className="text-right py-1.5 font-medium text-gray-900">{c.roas > 0 ? `${c.roas}x` : '--'}</td>
                <td className="text-right py-1.5">{statusBadge(c.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── 12. Channel Mix ────────────────────────────────────────────────────────

export function ChannelMixCard({ seed }: { seed: number }) {
  void seed;
  return (
    <Card className={cardClassName}>
      <Title icon={Layers} label="Channel Mix" />
      <div className="flex h-6 rounded-full overflow-hidden mb-3">
        {channelMix.map((c) => (
          // eslint-disable-next-line no-restricted-syntax -- dynamic width percentage for stacked bar
          <div key={c.channel} className={cn(c.color, 'transition-all duration-200')} style={{ width: `${c.revenuePct}%` }} title={`${c.channel}: ${c.revenuePct}%`} />
        ))}
      </div>
      <div className="space-y-1.5">
        {channelMix.map((c) => (
          <div key={c.channel} className="flex items-center gap-2 text-xs">
            <span className={cn('w-2 h-2 rounded-full shrink-0', c.color)} />
            <span className="text-gray-700 flex-1">{c.channel}</span>
            <span className="font-medium text-gray-900">{c.revenuePct}%</span>
            <span className="text-gray-500 w-14 text-right">{c.revenue}</span>
            <span className={cn(
              'w-10 text-right font-medium',
              c.growth.startsWith('+') ? 'text-green-600' : 'text-red-600',
            )}>{c.growth}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── 13. Customer Health ────────────────────────────────────────────────────

export function CustomerHealthCard({ seed }: { seed: number }) {
  void seed;
  return (
    <Card className={cardClassName}>
      <Title icon={Users} label="Customer Health" />
      <div className="grid grid-cols-2 gap-3">
        {customerHealth.map((m) => (
          <div key={m.label} className="border border-gray-100 rounded-lg p-3">
            <span className="text-xs text-gray-500">{m.label}</span>
            <p className="text-lg font-bold text-gray-900 mt-1">{m.value}</p>
            <span className={cn(
              'text-xs font-medium',
              m.change.startsWith('+') ? 'text-green-600' : 'text-red-600',
            )}>{m.change}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── 14. Store Ranking ──────────────────────────────────────────────────────

export function StoreRankingCard({ seed }: { seed: number }) {
  const navigate = useNavigate();
  const top = storeRankings.filter((r) => r.position === 'top');
  const bottom = storeRankings.filter((r) => r.position === 'bottom');

  const renderRow = (r: typeof storeRankings[0]) => (
    <div key={r.rank} className="flex items-center gap-2 text-xs py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-gray-500 w-6 text-right">{r.rank}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{r.name}</p>
        <p className="text-gray-500">{r.city}</p>
      </div>
      <span className="font-medium text-gray-900">{sv(r.score, seed)}</span>
      <span className="text-gray-500 w-14 text-right">{r.revPerSqft}</span>
    </div>
  );

  return (
    <Card className={cardClassName}>
      <Title icon={TrendingUp} label="Store Rankings" />
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 rounded-lg p-3 border border-green-100">
          <SectionHeader title={<span className="text-xs font-semibold text-green-700">Top 3</span>} className="mb-2" />
          {top.map(renderRow)}
        </div>
        <div className="bg-red-50 rounded-lg p-3 border border-red-100">
          <SectionHeader title={<span className="text-xs font-semibold text-red-700">Bottom 3</span>} className="mb-2" />
          {bottom.map(renderRow)}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-between text-xs mt-2"
        onClick={() => navigate('/store-view')}
      >
        View all stores <ChevronRight className="w-3 h-3" />
      </Button>
    </Card>
  );
}

// ─── 15. Competition Alerts ─────────────────────────────────────────────────

export function CompetitionAlertsCard({ seed }: { seed: number }) {
  void seed;
  return (
    <Card className={cardClassName}>
      <Title icon={Target} label="Competition Alerts" />
      <div className="space-y-2">
        {competitionAlerts.map((a, i) => (
          <div key={i} className="flex gap-2 text-xs border-b border-gray-50 pb-2 last:border-0 last:pb-0">
            <span className={cn(
              'w-2 h-2 rounded-full shrink-0 mt-1',
              a.severity === 'high' ? 'bg-red-500' : a.severity === 'medium' ? 'bg-amber-500' : 'bg-gray-400',
            )} />
            <div className="flex-1 min-w-0">
              <p className="text-gray-700 leading-relaxed">{a.text}</p>
              <p className="text-gray-500 mt-0.5">{a.time}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── 16. VM Compliance ──────────────────────────────────────────────────────

export function VMComplianceCard({ seed }: { seed: number }) {
  const statusBadge = (st: string) => {
    if (st === 'good') return <Badge variant="success" size="sm">Good</Badge>;
    if (st === 'watch') return <Badge variant="warning" size="sm">Watch</Badge>;
    if (st === 'at-risk') return <Badge variant="error" size="sm">At Risk</Badge>;
    return <Badge variant="error" size="sm">Critical</Badge>;
  };

  return (
    <Card className={cardClassName}>
      <Title icon={Target} label="VM Compliance" />
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-gray-100">
              <th className="text-left py-1.5 font-medium">Cluster</th>
              <th className="text-right py-1.5 font-medium">Stores</th>
              <th className="text-right py-1.5 font-medium">VM</th>
              <th className="text-right py-1.5 font-medium">Plano %</th>
              <th className="text-right py-1.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {vmComplianceClusters.map((c) => (
              <tr key={c.cluster} className="border-b border-gray-50">
                <td className="py-1.5 font-medium text-gray-900">{c.cluster}</td>
                <td className="text-right py-1.5 text-gray-700">{sv(c.stores, seed)}</td>
                <td className="text-right py-1.5 text-gray-900">{c.vmScore}</td>
                <td className="text-right py-1.5 text-gray-700">{c.planogramPct}%</td>
                <td className="text-right py-1.5">{statusBadge(c.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── 17. Resolution Funnel ──────────────────────────────────────────────────

export function ResolutionFunnelCard({ seed }: { seed: number }) {
  const navigate = useNavigate();
  const maxCount = Math.max(...resolutionFunnel.map((f) => sv(f.count, seed)));
  return (
    <Card className={cardClassName}>
      <Title icon={Filter} label="Resolution Funnel" />
      <div className="space-y-1.5">
        {resolutionFunnel.map((f) => (
          <div key={f.label} className="flex items-center gap-2">
            <span className="text-xs text-gray-700 w-24 shrink-0">{f.label}</span>
            <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
              {/* eslint-disable-next-line no-restricted-syntax -- dynamic width percentage for funnel bar */}
              <div className={cn(f.color, 'h-full rounded-full transition-all duration-200')} style={{ width: `${(sv(f.count, seed) / maxCount) * 100}%` }} />
            </div>
            <span className="text-xs font-medium text-gray-900 w-8 text-right">{sv(f.count, seed)}</span>
          </div>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-between text-xs mt-2"
        onClick={() => navigate('/exceptions')}
      >
        View exceptions <ChevronRight className="w-3 h-3" />
      </Button>
    </Card>
  );
}

// ─── 18. Delivery SLA ───────────────────────────────────────────────────────

export function DeliverySLACard({ seed }: { seed: number }) {
  void seed;
  return (
    <Card className={cardClassName}>
      <Title icon={Truck} label="Delivery SLA" />
      <div className="grid grid-cols-2 gap-3">
        {deliverySLA.map((m) => (
          <div key={m.label} className="border border-gray-100 rounded-lg p-3">
            <SectionHeader
              title={<span className="text-xs text-gray-500 font-normal">{m.label}</span>}
              actions={ragDot(m.status)}
              className="mb-1"
            />
            <p className="text-lg font-bold text-gray-900">{m.value}</p>
            <p className="text-xs text-gray-500">Target: {m.target}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── 19. Config Health ──────────────────────────────────────────────────────

export function ConfigHealthCard({ seed }: { seed: number }) {
  void seed;
  return (
    <Card className={cardClassName}>
      <Title icon={Settings} label="System Health" />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {configHealth.map((m) => (
            <div key={m.label} className="border border-gray-100 rounded-lg p-2.5">
              <p className="text-xs text-gray-500">{m.label}</p>
              <p className="text-sm font-bold text-gray-900">{m.value}</p>
              <p className="text-xs text-gray-500">{m.detail}</p>
            </div>
          ))}
        </div>
        <div>
          <SectionHeader title={<span className="text-xs font-semibold text-gray-900">Recent Audit</span>} className="mb-2" />
          <div className="space-y-2">
            {recentAudit.map((a, i) => (
              <div key={i} className="border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                <p className="text-xs text-gray-700 line-clamp-2">{a.action}</p>
                {/* eslint-disable-next-line design-system/prefer-section-header -- item-level metadata row, not a section header */}
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-gray-500 truncate">{a.user}</span>
                  <span className="text-xs text-gray-500 shrink-0 ml-1">{a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
