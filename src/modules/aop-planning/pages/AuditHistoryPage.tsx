import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  PageHeader,
  EmptyState,
  Badge,
  FilterSearch,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { useAOPPlanningStore } from '../stores/useAOPPlanningStore';
import { AopSubNav } from '../components/AopSubNav';

const ENTITY_COLORS: Record<string, string> = {
  cycle: 'bg-indigo-50 text-indigo-700',
  grid_cell: 'bg-blue-50 text-blue-700',
  exception: 'bg-amber-50 text-amber-700',
  scenario: 'bg-green-50 text-green-700',
  approval: 'bg-purple-50 text-purple-700',
};

const ENTITY_FILTER_OPTIONS = [
  { value: '__all__', label: 'All Types' },
  { value: 'cycle', label: 'Cycle' },
  { value: 'grid_cell', label: 'Grid Cell' },
  { value: 'exception', label: 'Exception' },
  { value: 'scenario', label: 'Scenario' },
  { value: 'approval', label: 'Approval' },
];

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AuditHistoryPage(): React.ReactNode {
  const { cycleId } = useParams<{ cycleId: string }>();
  const cycles = useAOPPlanningStore((s) => s.cycles);
  const auditLog = useAOPPlanningStore((s) => s.auditLog);

  const [entityFilter, setEntityFilter] = useState('__all__');
  const [search, setSearch] = useState('');

  const cycle = cycles.find((c) => c.id === cycleId);

  const filteredEntries = useMemo(() => {
    if (!cycle) return [];
    let entries = auditLog.filter((e) => e.cycleId === cycle.id);
    if (entityFilter !== '__all__') {
      entries = entries.filter((e) => e.entityType === entityFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      entries = entries.filter(
        (e) =>
          e.action.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.actor.toLowerCase().includes(q),
      );
    }
    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [auditLog, cycle, entityFilter, search]);

  if (!cycle) {
    return <EmptyState title="Cycle not found" description="The requested planning cycle does not exist." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Version & Audit History"
        backTo={{ label: cycle.name, path: `/sales-plan/workspace/${cycle.id}` }}
      />

      <AopSubNav />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
          {ENTITY_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setEntityFilter(opt.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                entityFilter === opt.value
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-50',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <FilterSearch placeholder="Search audit log..." value={search} onChange={setSearch} />
      </div>

      {/* Audit Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Timestamp</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Actor</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Action</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Description</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Old</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">New</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8">
                    <EmptyState
                      title="No audit entries"
                      description={search ? `No entries matching "${search}"` : 'No audit entries for the selected filter.'}
                      variant="neutral"
                    />
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatTimestamp(entry.timestamp)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {entry.actor}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{entry.action}</td>
                    <td className="px-4 py-3">
                      <Badge className={ENTITY_COLORS[entry.entityType] ?? 'bg-gray-100 text-gray-600'}>
                        {entry.entityType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[300px] truncate">
                      {entry.description}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs tabular-nums">
                      {entry.oldValue ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs tabular-nums font-medium">
                      {entry.newValue ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
