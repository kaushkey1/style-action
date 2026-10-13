import { useState, useMemo } from 'react';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { Badge, Switch, Pagination, usePagination, SectionHeader, MetricGrid } from '@/components/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { DetailPanel, DetailPanelSection } from '@/components/ui';
import { FilterBar, FilterPills, FilterSearch } from '@/components/ui';
import { EmptyState, PageSkeleton, AwaitingConnection } from '@/components/ui';
import type { Agent, AgentStatus, AgentDomain, HALevel } from '../data/mockAgents';
import { useAgentsData } from '../api/useAgentsData';
import { usePersonaStore } from '@/hooks/usePersonaStore';
import { personaMap } from '@/data/personaConfig';
import { cn } from '@/lib/utils';
import { useSearch } from '@/hooks/useSearch';
import { useFilters } from '@/hooks/useFilters';
import { useSelection } from '@/hooks/useSelection';
import { useResetOnPersonaChange } from '@/hooks/useResetOnPersonaChange';

const statusConfig: Record<AgentStatus, { dot: string; label: string; badge: 'success' | 'warning' | 'error' }> = {
  active: { dot: 'bg-success', label: 'Active', badge: 'success' },
  idle: { dot: 'bg-gray-300', label: 'Idle', badge: 'default' as 'warning' },
  blocked: { dot: 'bg-error', label: 'Blocked', badge: 'error' },
};

const haLevelConfig: Record<HALevel, { label: string; color: string }> = {
  HA4: { label: 'HA4 Manual', color: 'text-gray-500' },
  HA3: { label: 'HA3 Recommend', color: 'text-primary' },
  HA2: { label: 'HA2 Auto', color: 'text-success' },
  HA1: { label: 'HA1 Full Auto', color: 'text-success-600' },
};

const domainTabs: AgentDomain[] = ['Plan', 'Buy', 'Make', 'Move', 'Sell', 'Market'];

const statusCardBg: Record<AgentStatus, string> = {
  active: '',
  idle: '',
  blocked: 'bg-red-50/30',
};

function SuccessRateBar({ rate }: { rate: number }) {
  if (rate === 0) return <span className="text-xs text-gray-400">--</span>;
  const color = rate >= 95 ? 'bg-success' : rate >= 90 ? 'bg-warning' : 'bg-error';
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] text-gray-500">success</span>
        <span className={cn('text-xs font-bold tabular-nums', rate >= 95 ? 'text-success' : rate >= 90 ? 'text-warning' : 'text-error')}>
          {rate}%
        </span>
      </div>
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        {/* eslint-disable-next-line no-restricted-syntax -- dynamic width */}
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${rate}%` }} />
      </div>
    </div>
  );
}

function AgentCard({
  agent,
  isSelected,
  onSelect,
}: {
  agent: Agent;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const status = statusConfig[agent.status];
  const ha = haLevelConfig[agent.ha_level];

  return (
    <button
      onClick={onSelect}
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-3 text-left transition-all duration-200 hover:shadow-md',
        statusCardBg[agent.status],
        isSelected ? 'ring-1 ring-primary/30 border-primary' : 'hover:border-primary/30'
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-primary hidden lg:inline">{agent.id}</span>
          <span className={cn('text-[10px] font-medium', ha.color)}>{agent.ha_level}</span>
        </div>
        <Badge variant={status.badge} className="text-[10px]">
          <span className={cn(
            'w-1.5 h-1.5 rounded-full mr-1',
            status.dot,
            agent.status === 'active' && 'animate-pulse'
          )} />
          {status.label}
        </Badge>
      </div>
      <p className="text-sm font-semibold text-gray-900 mb-0.5">{agent.name}</p>
      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{agent.description}</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-1.5 rounded bg-gray-50 text-center">
          <p className="text-[10px] text-gray-500">{agent.taskLabel}</p>
          <p className={cn(
            'font-bold tabular-nums',
            agent.tasksToday >= 100 ? 'text-lg text-gray-900' : 'text-sm text-gray-900'
          )}>
            {agent.tasksToday.toLocaleString()}
          </p>
        </div>
        <div className="p-1.5 rounded bg-gray-50">
          <SuccessRateBar rate={agent.successRate} />
        </div>
      </div>
    </button>
  );
}

function AgentDetail({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const status = statusConfig[agent.status];
  const ha = haLevelConfig[agent.ha_level];
  const [isOn, setIsOn] = useState(agent.status !== 'blocked');

  return (
    <DetailPanel isOpen={true} title={`${agent.id} - ${agent.name}`} onClose={onClose}>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={status.badge}>
            <span className={cn('w-1.5 h-1.5 rounded-full mr-1', status.dot)} />
            {status.label}
          </Badge>
          <Badge variant="outline" className={cn('text-[10px]', ha.color)}>{ha.label}</Badge>
          <Badge variant="outline" className="text-[10px]">{agent.domain}</Badge>
          <span className="text-xs text-gray-500">Uptime: {agent.uptime}% (30d)</span>
        </div>
        <p className="text-xs text-gray-700">{agent.description}</p>

        <DetailPanelSection title="Connected Systems">
          <div className="flex flex-wrap gap-1.5">
            {agent.systems.map((sys) => (
              <Badge key={sys} variant="outline" className="text-[10px]">
                {sys}
              </Badge>
            ))}
          </div>
        </DetailPanelSection>

        <DetailPanelSection title="Today's Activity">
          <MetricGrid columns={3} className="gap-2 mb-3">
            <div className="p-2 rounded-lg bg-gray-50 text-center">
              <p className="text-xs text-gray-500">Tasks</p>
              <p className="text-sm font-bold text-gray-900">{agent.tasksToday.toLocaleString()}</p>
            </div>
            <div className="p-2 rounded-lg bg-gray-50 text-center">
              <p className="text-xs text-gray-500">Success</p>
              <p className="text-sm font-bold text-success">{agent.successRate > 0 ? `${agent.successRate}%` : '--'}</p>
            </div>
            <div className="p-2 rounded-lg bg-gray-50 text-center">
              <p className="text-xs text-gray-500">Failed</p>
              <p className="text-sm font-bold text-error">
                {agent.successRate > 0
                  ? Math.round(agent.tasksToday * (1 - agent.successRate / 100))
                  : '--'}
              </p>
            </div>
          </MetricGrid>
        </DetailPanelSection>

        <DetailPanelSection title="Recent Actions">
          <div className="space-y-2">
            {agent.recentActions.map((action, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-gray-400 shrink-0 font-mono w-10">{action.time}</span>
                <div className="flex-1">
                  <p className={cn(
                    'text-gray-700',
                    action.status === 'blocked' && 'text-error-600 font-medium'
                  )}>
                    {action.description}
                  </p>
                </div>
                {action.status === 'success' && <CheckCircle2 className="w-3 h-3 text-success shrink-0 mt-0.5" />}
                {action.status === 'blocked' && <XCircle className="w-3 h-3 text-error shrink-0 mt-0.5" />}
                {action.status === 'pending' && <Clock className="w-3 h-3 text-warning shrink-0 mt-0.5" />}
              </div>
            ))}
          </div>
        </DetailPanelSection>

        <DetailPanelSection title="Guardrails Active">
          <div className="space-y-1.5">
            {agent.guardrails.map((gr, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <Shield className="w-3 h-3 text-success" />
                <span className="text-gray-700">{gr}</span>
              </div>
            ))}
          </div>
        </DetailPanelSection>

        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
          <SectionHeader
            title="Kill Switch"
            className="mb-2"
            actions={<Switch checked={isOn} onCheckedChange={setIsOn} />}
          />
          <p className="text-xs text-gray-500">
            {isOn
              ? 'Agent is active. Turning off will pause all operations. Pending tasks will queue.'
              : 'Agent is off. Pending tasks are queued. Turn on to resume operations.'}
          </p>
        </div>
      </div>
    </DetailPanel>
  );
}

function AgentCompactRow({
  agent,
  isSelected,
  onSelect,
}: {
  agent: Agent;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const ha = haLevelConfig[agent.ha_level];
  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all hover:bg-gray-50 w-full',
        isSelected ? 'ring-1 ring-primary/30 bg-primary-50/30' : ''
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
      <span className="text-xs font-bold text-primary w-8 shrink-0">{agent.id}</span>
      <span className="text-xs font-medium text-gray-900 flex-1 min-w-0 truncate">{agent.name}</span>
      <span className={cn('text-[10px]', ha.color)}>{agent.ha_level}</span>
      <span className="text-[10px] text-gray-400">{agent.domain}</span>
    </button>
  );
}

function AgentGrid({ agents, selectedId, onSelect }: { agents: Agent[]; selectedId: string | null; onSelect: (id: string | null) => void }) {
  const selected = selectedId ? agents.find((a) => a.id === selectedId) ?? null : null;

  const activeAgents = agents.filter((a) => a.status !== 'idle');
  const idleAgents = agents.filter((a) => a.status === 'idle');

  const [currentPage, setCurrentPage] = useState(1);
  const { totalPages, totalItems, pageSize, getPageItems } = usePagination(activeAgents, 12);
  const pageItems = getPageItems(currentPage);

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className={cn('transition-all', selected ? 'lg:w-[60%]' : 'w-full')}>
        <div className={cn('grid gap-3', selected ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')}>
          {pageItems.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isSelected={selectedId === agent.id}
              onSelect={() => onSelect(selectedId === agent.id ? null : agent.id)}
            />
          ))}
        </div>
        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              pageSize={pageSize}
            />
          </div>
        )}
        {idleAgents.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2 px-1">
              Idle ({idleAgents.length})
            </p>
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
              {idleAgents.map((agent) => (
                <AgentCompactRow
                  key={agent.id}
                  agent={agent}
                  isSelected={selectedId === agent.id}
                  onSelect={() => onSelect(selectedId === agent.id ? null : agent.id)}
                />
              ))}
            </div>
          </div>
        )}
        {agents.length === 0 && (
          <EmptyState description="No agents match your filters" />
        )}
      </div>
      {selected && (
        <div className="lg:w-[40%]">
          <AgentDetail agent={selected} onClose={() => onSelect(null)} />
        </div>
      )}
    </div>
  );
}

export function AgentWorkforcePage() {
  const { personaId } = usePersonaStore();
  const persona = personaMap[personaId];
  const defaultTab = persona?.config.defaultFilters.agentDomain || 'all';

  const { data: agents, loading, error, refetch } = useAgentsData();

  const search = useSearch(agents ?? [], { fields: ['name', 'id'] });
  const statusFilters = useFilters(search.results, { status: 'all' as AgentStatus | 'all' });
  const selection = useSelection();

  useResetOnPersonaChange(() => {
    search.setQuery('');
    statusFilters.clearAll();
    selection.clearSelection();
  });

  const statusPriority: Record<AgentStatus, number> = { blocked: 0, active: 1, idle: 2 };

  const sortedResults = useMemo(
    () => [...statusFilters.results].sort((a, b) => statusPriority[a.status] - statusPriority[b.status]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statusFilters.results]
  );

  if (loading) return <PageSkeleton />;
  if (error || !agents) return <AwaitingConnection feature="Agent Workforce" onRetry={refetch} />;

  const getAgentsForDomain = (domain?: AgentDomain) => {
    const agents = domain ? sortedResults.filter((a) => a.domain === domain) : sortedResults;
    return agents;
  };

  return (
    <div className="animate-fadeInUp">
      {/* Filters */}
      <FilterBar>
        <FilterPills
          value={statusFilters.filters.status}
          onChange={(v) => statusFilters.setFilter('status', v as AgentStatus | 'all')}
          options={[
            { value: 'all', label: 'All', count: agents.length },
            { value: 'active', label: 'Active' },
            { value: 'idle', label: 'Idle' },
            { value: 'blocked', label: 'Blocked' },
          ]}
        />
        <FilterSearch value={search.query} onChange={search.setQuery} placeholder="Search agents..." />
      </FilterBar>

      <p className="text-xs text-gray-500 px-1 mb-3">
        {sortedResults.length} agents &middot; {sortedResults.filter(a => a.status === 'active').length} active &middot; {sortedResults.filter(a => a.status === 'idle').length} idle &middot; {sortedResults.filter(a => a.status === 'blocked').length} blocked
      </p>

      {/* Domain Tabs */}
      <Tabs defaultValue={defaultTab} key={personaId}>
        <TabsList variant="underline" className="mb-4">
          <TabsTrigger value="all">All ({sortedResults.length})</TabsTrigger>
          {domainTabs.map((d) => {
            const count = getAgentsForDomain(d).length;
            return (
              <TabsTrigger key={d} value={d}>
                {d} ({count})
              </TabsTrigger>
            );
          })}
        </TabsList>
        <TabsContent value="all">
          <AgentGrid agents={sortedResults} selectedId={selection.selectedId} onSelect={selection.setSelectedId} />
        </TabsContent>
        {domainTabs.map((d) => (
          <TabsContent key={d} value={d}>
            <AgentGrid
              agents={getAgentsForDomain(d)}
              selectedId={selection.selectedId}
              onSelect={selection.setSelectedId}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
