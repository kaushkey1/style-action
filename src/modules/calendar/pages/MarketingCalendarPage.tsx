import {
  Megaphone,
  FileText,
  Share2,
  Users,
  BarChart3,
  Rocket,
  Tag,
  Calendar,
  Bot,
  Radio,
  Target,
  TrendingUp,
  Heart,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { Badge, SectionHeader, MetricGrid, Tabs, TabsList, TabsTrigger, TabsContent, DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell, EmptyState } from '@/components/ui';
import { mockMarketingCalendarEvents, type MarketingCalendarEvent } from '../data/mockMarketingCalendar';
import {
  mockCampaigns,
  mockAudienceSegments,
  mockContentItems,
  mockPromos,
  marketingSummary,
} from '../data/mockMarketingCampaigns';
import {cn, getCurrencySymbol, formatDate} from '@/lib/utils';

// ─── Type config ──────────────────────────────────────────────────

type EventType = MarketingCalendarEvent['type'];

const typeConfig: Record<EventType, { label: string; color: string; icon: typeof Megaphone }> = {
  product_story:         { label: 'Product Story',       color: 'bg-violet-100 text-violet-700',   icon: FileText },
  social_prebuzz:        { label: 'Social Pre-buzz',     color: 'bg-blue-100 text-blue-700',       icon: Share2 },
  influencer:            { label: 'Influencer',          color: 'bg-orange-100 text-orange-700',   icon: Users },
  performance_marketing: { label: 'Perf. Marketing',     color: 'bg-green-100 text-green-700',     icon: BarChart3 },
  campaign:              { label: 'Campaign',            color: 'bg-sky-100 text-sky-700',         icon: Megaphone },
  promo:                 { label: 'Promo',               color: 'bg-amber-100 text-amber-700',     icon: Tag },
};

const autonomyBadge: Record<MarketingCalendarEvent['autonomy'], { label: string; color: string }> = {
  T1: { label: 'T1 Auto',     color: 'bg-green-100 text-green-700' },
  T2: { label: 'T2 Suggest',  color: 'bg-blue-100 text-blue-700' },
  T3: { label: 'T3 Draft',    color: 'bg-amber-100 text-amber-700' },
  T4: { label: 'T4 Manual',   color: 'bg-gray-100 text-gray-600' },
};

const statusVariant: Record<MarketingCalendarEvent['status'], 'success' | 'warning' | 'default'> = {
  active: 'success',
  planned: 'warning',
  completed: 'default',
};

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + 'Z');
  const e = new Date(end + 'Z');
  const sFormatted = formatDate(s);
  const eFormatted = formatDate(e);

  // Extract "MMM DD" from "MMM DD, YYYY" format
  const sDate = sFormatted.split(',')[0] ?? sFormatted;
  const eDate = eFormatted.split(',')[0] ?? eFormatted;
  const year = sFormatted.split(',')[1]?.trim() ?? '';

  // If same year, show "MMM DD - MMM DD, YYYY"
  return `${sDate} - ${eDate}, ${year}`;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── KPI Tiles ────────────────────────────────────────────────────

function MarketingKPITiles() {
  const activeCampaigns = mockMarketingCalendarEvents.filter(
    e => (e.type === 'campaign' || e.type === 'promo') && e.status === 'active'
  ).length;
  const dropLinked = mockMarketingCalendarEvents.filter(e => e.dropId).length;
  const channels = new Set(
    mockMarketingCalendarEvents
      .filter(e => e.channel && e.status === 'active')
      .flatMap(e => e.channel!.split(', '))
  );
  const upcoming = mockMarketingCalendarEvents.filter(e => e.status === 'planned').length;

  const tiles = [
    { label: 'Active Campaigns', value: activeCampaigns.toString(), icon: Megaphone, color: 'text-gray-900' },
    { label: 'Drop-Linked Events', value: dropLinked.toString(), icon: Rocket, color: 'text-primary' },
    { label: 'Channels Active', value: channels.size.toString(), icon: Radio, color: 'text-success' },
    { label: 'Upcoming Launches', value: upcoming.toString(), icon: Calendar, color: 'text-amber-600' },
  ];

  return (
    <MetricGrid>
      {tiles.map((t) => (
        <div key={t.label} className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between gap-1 mb-1">
            <p className="text-xs text-gray-500">{t.label}</p>
            <t.icon className="w-4 h-4 text-gray-400" />
          </div>
          <p className={cn('text-xl font-bold', t.color)}>{t.value}</p>
        </div>
      ))}
    </MetricGrid>
  );
}

// ─── Event Card ───────────────────────────────────────────────────

function MarketingEventCard({ event }: { event: MarketingCalendarEvent }) {
  const tc = typeConfig[event.type];
  const ab = autonomyBadge[event.autonomy];
  const sv = statusVariant[event.status];
  const TypeIcon = tc.icon;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 hover:border-primary/30 hover:shadow-md transition-all duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <TypeIcon className="w-4 h-4 text-gray-500 shrink-0" />
          <span className="text-sm font-semibold text-gray-900 truncate">{event.name}</span>
          <span className={cn('px-2 py-0.5 rounded text-xs font-medium shrink-0', tc.color)}>
            {tc.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', ab.color)}>
            {ab.label}
          </span>
          <Badge variant={sv} className="text-[10px]">{capitalize(event.status)}</Badge>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-700 flex-wrap">
        {event.nDayRelative && (
          <span className="text-xs font-medium text-primary bg-primary/5 px-1.5 py-0.5 rounded">
            {event.nDayRelative}
          </span>
        )}

        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-gray-400" />
          <span>{formatDateRange(event.startDate, event.endDate)}</span>
        </div>

        {event.channel && (
          <div className="flex items-center gap-1">
            <Radio className="w-3 h-3 text-gray-400" />
            <span>{event.channel}</span>
          </div>
        )}

        <div className="flex items-center gap-1 ml-auto">
          <Bot className="w-3 h-3 text-gray-400" />
          <span className="text-gray-500">{event.agentId}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Event Group ──────────────────────────────────────────────────

function MarketingEventGroup({
  title,
  events,
  dropId,
}: {
  title: string;
  events: MarketingCalendarEvent[];
  dropId?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {dropId ? (
          <Rocket className="w-4 h-4 text-primary" />
        ) : (
          <Megaphone className="w-4 h-4 text-gray-500" />
        )}
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span className="text-xs text-gray-400">{events.length}</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>
      <div className="space-y-2">
        {events.map((event) => (
          <MarketingEventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

// ─── Timeline Tab (existing content) ─────────────────────────────

function TimelineTab() {
  const dropLinked = mockMarketingCalendarEvents.filter(e => e.dropId);
  const standalone = mockMarketingCalendarEvents.filter(e => !e.dropId);

  const dropGroups = new Map<string, MarketingCalendarEvent[]>();
  for (const event of dropLinked) {
    const key = event.dropId!;
    if (!dropGroups.has(key)) dropGroups.set(key, []);
    dropGroups.get(key)!.push(event);
  }

  const dropNames: Record<string, string> = {
    'd6f7a8b9-d0e1-4f2a-3b4c-5d6e7f8a9b0c': "SS26 Men's Casuals Drop 4 (N-Day Apr 15)",
    'd8b9c0d1-f2a3-4b4c-5d6e-7f8a9b0c1d2e': "SS26 Women's Indian Drop 2 (N-Day May 1)",
    'db1e2f3a-c5d6-4e7f-8a9b-0c1d2e3f4a5b': 'SS26 Micro-Drop 12 (N-Day Mar 5)',
  };

  return (
    <div className="space-y-4">
      <MarketingKPITiles />
      {dropGroups.size === 0 && standalone.length === 0 ? (
        <EmptyState description="No marketing events to display" />
      ) : (
      <div className="space-y-3">
        {Array.from(dropGroups.entries()).map(([dropId, events]) => (
          <MarketingEventGroup
            key={dropId}
            title={dropNames[dropId] || dropId}
            events={events}
            dropId={dropId}
          />
        ))}
        {standalone.length > 0 && (
          <MarketingEventGroup
            title="Standalone Campaigns"
            events={standalone}
          />
        )}
      </div>
      )}
    </div>
  );
}

// ─── Campaigns Tab ───────────────────────────────────────────────

function CampaignsTab() {
  const campaignStatusVariant: Record<string, 'success' | 'warning' | 'default' | 'error'> = {
    active: 'success',
    planned: 'warning',
    completed: 'default',
    paused: 'error',
  };

  const channelRoas: Record<string, { total: number; count: number }> = {};
  for (const c of mockCampaigns.filter(c => c.roas > 0)) {
    const ch = c.channel.split(' + ')[0] ?? c.channel;
    if (!channelRoas[ch]) channelRoas[ch] = { total: 0, count: 0 };
    channelRoas[ch].total += c.roas;
    channelRoas[ch].count += 1;
  }

  const maxRoas = Math.max(...Object.values(channelRoas).map(v => v.total / v.count));

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <MetricGrid>
        {[
          { label: 'Active Campaigns', value: marketingSummary.activeCampaigns.toString(), icon: Megaphone, color: 'text-gray-900' },
          { label: 'Avg ROAS', value: `${marketingSummary.avgROAS}x`, icon: TrendingUp, color: 'text-success' },
          { label: 'Total Revenue', value: `${getCurrencySymbol()}${marketingSummary.totalRevenueLakh} L`, icon: Target, color: 'text-primary' },
          { label: 'Conversion Rate', value: `${marketingSummary.conversionRate}%`, icon: BarChart3, color: 'text-amber-600' },
        ].map((t) => (
          <div key={t.label} className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between gap-1 mb-1">
              <p className="text-xs text-gray-500">{t.label}</p>
              <t.icon className="w-4 h-4 text-gray-400" />
            </div>
            <p className={cn('text-xl font-bold', t.color)}>{t.value}</p>
          </div>
        ))}
      </MetricGrid>

      {/* Campaign Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <SectionHeader title="Campaign Performance" className="mb-0" />
        </div>
        <DataTable>
            <DataTableHeader>
              {['Campaign', 'Type', 'Channel', 'Budget', 'Spend', 'ROAS', 'Impressions', 'Conversions', 'Status'].map(h => (
                <DataTableHead key={h}>{h}</DataTableHead>
              ))}
            </DataTableHeader>
            <DataTableBody>
              {mockCampaigns.length === 0 ? (
                <tr><td colSpan={9}><EmptyState description="No campaigns to display" /></td></tr>
              ) : mockCampaigns.map(c => (
                <DataTableRow key={c.id}>
                  <DataTableCell className="font-medium text-gray-900">{c.name}</DataTableCell>
                  <DataTableCell className="text-gray-600">{capitalize(c.type)}</DataTableCell>
                  <DataTableCell className="text-gray-600">{c.channel}</DataTableCell>
                  <DataTableCell>{getCurrencySymbol()}{c.budgetLakh} L</DataTableCell>
                  <DataTableCell>{getCurrencySymbol()}{c.spendLakh} L</DataTableCell>
                  <DataTableCell className="font-medium text-gray-900">{c.roas > 0 ? `${c.roas}x` : '—'}</DataTableCell>
                  <DataTableCell className="text-gray-600">{c.impressions > 0 ? `${(c.impressions / 1_000_000).toFixed(1)}M` : '—'}</DataTableCell>
                  <DataTableCell className="text-gray-600">{c.conversions > 0 ? c.conversions.toLocaleString() : '—'}</DataTableCell>
                  <DataTableCell>
                    <Badge variant={campaignStatusVariant[c.status]} className="text-[10px]">{capitalize(c.status)}</Badge>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
        </DataTable>
      </div>

      {/* Channel ROAS Bars */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="ROAS by Channel" />
        {Object.keys(channelRoas).length === 0 ? (
          <EmptyState description="No channel ROAS data to display" />
        ) : (
        <div className="space-y-3">
          {Object.entries(channelRoas).map(([channel, data]) => {
            const avg = +(data.total / data.count).toFixed(1);
            return (
              <div key={channel}>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs text-gray-700">{channel}</span>
                  <span className="text-xs font-medium text-gray-900">{avg}x</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  { }
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    // eslint-disable-next-line no-restricted-syntax -- dynamic width
                    style={{ width: `${(avg / maxRoas) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}

// ─── Audiences Tab ───────────────────────────────────────────────

function AudiencesTab() {
  const segmentColor: Record<string, string> = {
    premium: 'bg-violet-100 text-violet-700',
    aspirational: 'bg-blue-100 text-blue-700',
    value: 'bg-green-100 text-green-700',
    loyalist: 'bg-amber-100 text-amber-700',
    lapsed: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-4">
      {/* CRM Summary Cards */}
      <MetricGrid>
        {[
          { label: 'Total Audience', value: (marketingSummary.totalAudienceSize / 1_000_000).toFixed(1) + 'M', icon: Users, color: 'text-gray-900' },
          { label: 'CRM Active', value: (marketingSummary.crmActiveMembers / 1_000_000).toFixed(1) + 'M', icon: Heart, color: 'text-primary' },
          { label: 'Repeat Purchase Rate', value: `${marketingSummary.repeatPurchaseRate}%`, icon: TrendingUp, color: 'text-success' },
          { label: 'Loyalty Tier 1', value: `${marketingSummary.loyaltyTier1Pct}%`, icon: Target, color: 'text-amber-600' },
        ].map((t) => (
          <div key={t.label} className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between gap-1 mb-1">
              <p className="text-xs text-gray-500">{t.label}</p>
              <t.icon className="w-4 h-4 text-gray-400" />
            </div>
            <p className={cn('text-xl font-bold', t.color)}>{t.value}</p>
          </div>
        ))}
      </MetricGrid>

      {/* Segment Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <SectionHeader title="Audience Segments" className="mb-0" />
        </div>
        <DataTable>
            <DataTableHeader>
              {['Segment', 'Type', 'Size', 'Avg Spend', 'Engagement', 'Growth', ''].map(h => (
                <DataTableHead key={h}>{h}</DataTableHead>
              ))}
            </DataTableHeader>
            <DataTableBody>
              {mockAudienceSegments.length === 0 ? (
                <tr><td colSpan={7}><EmptyState description="No audience segments to display" /></td></tr>
              ) : mockAudienceSegments.map(a => (
                <DataTableRow key={a.id}>
                  <DataTableCell className="font-medium text-gray-900">{a.name}</DataTableCell>
                  <DataTableCell>
                    <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium', segmentColor[a.segment])}>
                      {capitalize(a.segment)}
                    </span>
                  </DataTableCell>
                  <DataTableCell>{(a.size / 1000).toFixed(0)} K</DataTableCell>
                  <DataTableCell>{getCurrencySymbol()}{a.avgSpend.toLocaleString()}</DataTableCell>
                  <DataTableCell>{a.engagementRate}%</DataTableCell>
                  <DataTableCell>
                    <span className={cn('font-medium', a.growthPct >= 0 ? 'text-success' : 'text-error')}>
                      {a.growthPct > 0 ? '+' : ''}{a.growthPct}%
                    </span>
                  </DataTableCell>
                  <DataTableCell>
                    <button className="text-xs text-primary hover:underline">View</button>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
        </DataTable>
      </div>
    </div>
  );
}

// ─── Content Tab ─────────────────────────────────────────────────

function ContentTab() {
  const contentStatusVariant: Record<string, 'success' | 'warning' | 'default' | 'primary'> = {
    published: 'success',
    scheduled: 'warning',
    draft: 'default',
    'in-review': 'primary',
  };

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <MetricGrid>
        {[
          { label: 'Content / Month', value: marketingSummary.contentItemsPerMonth.toString(), icon: FileText, color: 'text-gray-900' },
          { label: 'Social Engagement', value: `${(marketingSummary.socialEngagement / 1000).toFixed(0)} K`, icon: Heart, color: 'text-primary' },
          { label: 'Influencer Collabs', value: marketingSummary.influencerCollabs.toString(), icon: Users, color: 'text-success' },
          { label: 'Content ROI', value: `${marketingSummary.contentROI}x`, icon: TrendingUp, color: 'text-amber-600' },
        ].map((t) => (
          <div key={t.label} className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between gap-1 mb-1">
              <p className="text-xs text-gray-500">{t.label}</p>
              <t.icon className="w-4 h-4 text-gray-400" />
            </div>
            <p className={cn('text-xl font-bold', t.color)}>{t.value}</p>
          </div>
        ))}
      </MetricGrid>

      {/* Content Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <SectionHeader title="Content Pipeline" className="mb-0" />
        </div>
        <DataTable>
            <DataTableHeader>
              {['Title', 'Type', 'Platform', 'Creator', 'Date', 'Engagement', 'Status'].map(h => (
                <DataTableHead key={h}>{h}</DataTableHead>
              ))}
            </DataTableHeader>
            <DataTableBody>
              {mockContentItems.length === 0 ? (
                <tr><td colSpan={7}><EmptyState description="No content items to display" /></td></tr>
              ) : mockContentItems.map(c => (
                <DataTableRow key={c.id}>
                  <DataTableCell className="font-medium text-gray-900">{c.title}</DataTableCell>
                  <DataTableCell className="text-gray-600">{capitalize(c.type)}</DataTableCell>
                  <DataTableCell className="text-gray-600">{c.platform}</DataTableCell>
                  <DataTableCell className="text-gray-600">{c.creator}</DataTableCell>
                  <DataTableCell className="text-gray-600">{formatDate(new Date(c.scheduledDate + 'Z')).split(',')[0]}</DataTableCell>
                  <DataTableCell>{c.engagement > 0 ? `${(c.engagement / 1000).toFixed(1)} K` : '—'}</DataTableCell>
                  <DataTableCell>
                    <Badge variant={contentStatusVariant[c.status]} className="text-[10px]">{capitalize(c.status.replace('-', ' '))}</Badge>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
        </DataTable>
      </div>

      {/* Influencer Board */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Influencer Collaborations" />
        {mockContentItems.filter(c => c.type === 'influencer').length === 0 ? (
          <EmptyState description="No influencer collaborations to display" />
        ) : (
        <MetricGrid columns={3} className="mb-0">
          {mockContentItems.filter(c => c.type === 'influencer').map(c => (
            <div key={c.id} className="rounded-lg border border-gray-200 p-3 hover:border-primary/30 transition-colors">
              <p className="text-sm font-medium text-gray-900 mb-1">{c.creator}</p>
              <p className="text-xs text-gray-500 mb-2">{c.title}</p>
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs text-gray-500">{c.platform}</span>
                <Badge variant={contentStatusVariant[c.status]} className="text-[10px]">{capitalize(c.status)}</Badge>
              </div>
            </div>
          ))}
        </MetricGrid>
        )}
      </div>
    </div>
  );
}

// ─── Promos Tab ──────────────────────────────────────────────────

function PromosTab() {
  const promoStatusVariant: Record<string, 'success' | 'warning' | 'default' | 'error'> = {
    active: 'success',
    scheduled: 'warning',
    expired: 'default',
    paused: 'error',
  };

  const guardrailVariant: Record<string, 'success' | 'warning' | 'error'> = {
    compliant: 'success',
    warning: 'warning',
    breach: 'error',
  };

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <MetricGrid>
        {[
          { label: 'Active Promos', value: marketingSummary.activePromos.toString(), icon: Tag, color: 'text-gray-900' },
          { label: 'Guardrail Breaches', value: marketingSummary.guardrailBreaches.toString(), icon: AlertTriangle, color: 'text-error' },
          { label: 'Total Redemptions', value: mockPromos.reduce((s, p) => s + p.redemptions, 0).toLocaleString(), icon: Target, color: 'text-primary' },
          { label: 'Compliant Rate', value: `${Math.round((mockPromos.filter(p => p.guardrailStatus === 'compliant').length / mockPromos.length) * 100)}%`, icon: Shield, color: 'text-success' },
        ].map((t) => (
          <div key={t.label} className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between gap-1 mb-1">
              <p className="text-xs text-gray-500">{t.label}</p>
              <t.icon className="w-4 h-4 text-gray-400" />
            </div>
            <p className={cn('text-xl font-bold', t.color)}>{t.value}</p>
          </div>
        ))}
      </MetricGrid>

      {/* Promos Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <SectionHeader title="Promotions" className="mb-0" />
        </div>
        <DataTable>
            <DataTableHeader>
              {['Promo', 'Type', 'Dates', 'Discount', 'Redemptions', 'Guardrail', 'Status'].map(h => (
                <DataTableHead key={h}>{h}</DataTableHead>
              ))}
            </DataTableHeader>
            <DataTableBody>
              {mockPromos.length === 0 ? (
                <tr><td colSpan={7}><EmptyState description="No promotions to display" /></td></tr>
              ) : mockPromos.map(p => (
                <DataTableRow key={p.id}>
                  <DataTableCell className="font-medium text-gray-900">{p.name}</DataTableCell>
                  <DataTableCell className="text-gray-600">{capitalize(p.type)}</DataTableCell>
                  <DataTableCell className="text-gray-600">{formatDateRange(p.startDate, p.endDate)}</DataTableCell>
                  <DataTableCell>{p.discountPct > 0 ? `${p.discountPct}%` : '—'}</DataTableCell>
                  <DataTableCell>{p.redemptions > 0 ? p.redemptions.toLocaleString() : '—'}</DataTableCell>
                  <DataTableCell>
                    <Badge variant={guardrailVariant[p.guardrailStatus]} className="text-[10px]">
                      {capitalize(p.guardrailStatus)}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant={promoStatusVariant[p.status]} className="text-[10px]">{capitalize(p.status)}</Badge>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
        </DataTable>
      </div>

      {/* PG1 Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="PG1 Agent Actions" />
        {mockPromos.length === 0 ? (
          <EmptyState description="No agent actions to display" />
        ) : (
        <div className="space-y-2">
          {mockPromos.map(p => (
            <div key={p.id} className={cn(
              'flex items-center justify-between px-3 py-2 rounded-lg border-l-3',
              p.guardrailStatus === 'breach' ? 'border-l-error bg-red-50/50' :
              p.guardrailStatus === 'warning' ? 'border-l-warning bg-amber-50/50' :
              'border-l-success bg-green-50/50'
            )}>
              <div>
                <p className="text-xs font-medium text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{p.pg1Action}</p>
              </div>
              <Badge variant={guardrailVariant[p.guardrailStatus]} className="text-[10px]">
                {capitalize(p.guardrailStatus)}
              </Badge>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────

export function MarketingCalendarPage() {
  return (
    <div className="space-y-4 animate-fadeInUp">
      <Tabs defaultValue="timeline">
        <TabsList variant="underline" className="mb-4">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="audiences">Audiences</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="promos">Promos</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <TimelineTab />
        </TabsContent>
        <TabsContent value="campaigns">
          <CampaignsTab />
        </TabsContent>
        <TabsContent value="audiences">
          <AudiencesTab />
        </TabsContent>
        <TabsContent value="content">
          <ContentTab />
        </TabsContent>
        <TabsContent value="promos">
          <PromosTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
