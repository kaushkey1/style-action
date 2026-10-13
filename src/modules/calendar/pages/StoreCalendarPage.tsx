import {
  Calendar,
  Store,
  Paintbrush,
  Users,
  DoorOpen,
  TrendingUp,
  MapPin,
  Bot,
  Link2,
  PartyPopper,
} from 'lucide-react';
import { Badge, MetricGrid, EmptyState } from '@/components/ui';
import { mockStoreCalendarEvents, type StoreCalendarEvent } from '../data/mockStoreCalendar';
import { cn } from '@/lib/utils';

// ─── Type config ──────────────────────────────────────────────────

type EventType = StoreCalendarEvent['type'];

const typeConfig: Record<EventType, { label: string; color: string; icon: typeof Calendar }> = {
  festival:       { label: 'Festival',       color: 'bg-amber-100 text-amber-700',   icon: PartyPopper },
  renovation:     { label: 'Renovation',     color: 'bg-violet-100 text-violet-700', icon: Paintbrush },
  vm_changeover:  { label: 'VM Changeover',  color: 'bg-blue-100 text-blue-700',     icon: Store },
  staffing:       { label: 'Staffing',       color: 'bg-teal-100 text-teal-700',     icon: Users },
  opening:        { label: 'Store Opening',  color: 'bg-green-100 text-green-700',   icon: DoorOpen },
  closing:        { label: 'Store Closing',  color: 'bg-gray-100 text-gray-700',     icon: DoorOpen },
};

const statusBadge: Record<StoreCalendarEvent['status'], { label: string; variant: 'success' | 'warning' | 'default' }> = {
  active:    { label: 'Active',    variant: 'success' },
  planned:   { label: 'Planned',   variant: 'warning' },
  completed: { label: 'Completed', variant: 'default' },
};

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + 'Z');
  const e = new Date(end + 'Z');
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${s.toLocaleDateString('en-US', opts)} - ${e.toLocaleDateString('en-US', opts)}`;
}

// ─── KPI Tiles ────────────────────────────────────────────────────

function StoreKPITiles() {
  const totalEvents = mockStoreCalendarEvents.length;
  const activeNow = mockStoreCalendarEvents.filter(e => e.status === 'active').length;
  const upcomingFestivals = mockStoreCalendarEvents.filter(
    e => e.type === 'festival' && e.status === 'planned'
  ).length;
  const renovationsInProgress = mockStoreCalendarEvents.filter(
    e => e.type === 'renovation' && e.status === 'active'
  ).length;

  const tiles = [
    { label: 'Total Events', value: totalEvents.toString(), icon: Calendar, color: 'text-gray-900' },
    { label: 'Active Now', value: activeNow.toString(), icon: Store, color: 'text-success' },
    { label: 'Upcoming Festivals', value: upcomingFestivals.toString(), icon: PartyPopper, color: 'text-amber-600' },
    { label: 'Renovations In Progress', value: renovationsInProgress.toString(), icon: Paintbrush, color: 'text-violet-600' },
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

function EventCard({ event }: { event: StoreCalendarEvent }) {
  const tc = typeConfig[event.type];
  const sb = statusBadge[event.status];
  const TypeIcon = tc.icon;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 hover:border-primary/30 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <TypeIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-900">{event.name}</span>
          <span className={cn('px-2 py-0.5 rounded text-xs font-medium', tc.color)}>
            {tc.label}
          </span>
        </div>
        <Badge variant={sb.variant} className="text-[10px]">{sb.label}</Badge>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-700 flex-wrap">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-gray-400" />
          <span>{formatDateRange(event.startDate, event.endDate)}</span>
        </div>

        {event.region && (
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span>{event.region}</span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <Store className="w-3 h-3 text-gray-400" />
          <span>{event.storeIds.length} stores</span>
        </div>

        {event.footfallImpact != null && (
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-success" />
            <span className="text-success font-medium">+{event.footfallImpact}% footfall</span>
          </div>
        )}

        {event.linkedDropId && (
          <div className="flex items-center gap-1">
            <Link2 className="w-3 h-3 text-primary" />
            <span className="text-primary font-medium">{event.linkedDropId}</span>
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

function EventGroup({ type, events }: { type: EventType; events: StoreCalendarEvent[] }) {
  const tc = typeConfig[type];
  const TypeIcon = tc.icon;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <TypeIcon className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-900">{tc.label}s</h3>
        <span className="text-xs text-gray-500">{events.length}</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>
      <div className="space-y-2">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────

export function StoreCalendarPage() {
  // Group events by type, preserving the display order
  const typeOrder: EventType[] = ['festival', 'vm_changeover', 'renovation', 'opening', 'staffing', 'closing'];
  const grouped = typeOrder
    .map((type) => ({
      type,
      events: mockStoreCalendarEvents.filter((e) => e.type === type),
    }))
    .filter((g) => g.events.length > 0);

  return (
    <div className="space-y-4 animate-fadeInUp">
      <StoreKPITiles />
      {grouped.length === 0 ? (
        <EmptyState description="No store calendar events to display" />
      ) : (
      <div className="space-y-3">
        {grouped.map((g) => (
          <EventGroup key={g.type} type={g.type} events={g.events} />
        ))}
      </div>
      )}
    </div>
  );
}
