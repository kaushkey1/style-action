import React, { useState, useMemo } from 'react';
import { AlertTriangle, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, EmptyState, Input, Badge } from '@/components/ui';
import { ExceptionRow } from './ExceptionRow';
import { ruleLabel } from '../data/exceptionRules';

import type { PlanningException, ExceptionSeverity } from '../types/aopPlanning.types';

interface ExceptionsDrawerProps {
  exceptions: PlanningException[];
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: (exceptionId: string) => void;
  onResolve: (exceptionId: string) => void;
  onNavigate: (rowId: string) => void;
}

type SeverityFilter = 'all' | ExceptionSeverity;

interface RuleGroup {
  rule: string;
  items: PlanningException[];
  hardCount: number;
  openCount: number;
}

export function ExceptionsDrawer({
  exceptions,
  isOpen,
  onClose,
  onAcknowledge,
  onResolve,
  onNavigate,
}: ExceptionsDrawerProps): React.ReactNode {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const counts = useMemo(
    () => ({
      all: exceptions.length,
      hard: exceptions.filter((e) => e.severity === 'hard').length,
      soft: exceptions.filter((e) => e.severity === 'soft').length,
    }),
    [exceptions],
  );

  const severityFilters: { value: SeverityFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'hard', label: 'Hard', count: counts.hard },
    { value: 'soft', label: 'Soft', count: counts.soft },
  ];

  // Filter by severity + free-text search.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exceptions.filter((e) => {
      if (severityFilter !== 'all' && e.severity !== severityFilter) return false;
      if (!q) return true;
      return (
        ruleLabel(e.rule).toLowerCase().includes(q) ||
        e.message.toLowerCase().includes(q) ||
        e.affectedEntity.toLowerCase().includes(q)
      );
    });
  }, [exceptions, severityFilter, search]);

  // Group by rule; hard-heavy groups first, then by size.
  const groups = useMemo<RuleGroup[]>(() => {
    const map = new Map<string, PlanningException[]>();
    for (const e of filtered) {
      const arr = map.get(e.rule) ?? [];
      arr.push(e);
      map.set(e.rule, arr);
    }
    return [...map.entries()]
      .map(([rule, items]) => ({
        rule,
        items,
        hardCount: items.filter((i) => i.severity === 'hard').length,
        openCount: items.filter((i) => i.status === 'open').length,
      }))
      .sort(
        (a, b) =>
          (b.hardCount > 0 ? 1 : 0) - (a.hardCount > 0 ? 1 : 0) ||
          b.items.length - a.items.length,
      );
  }, [filtered]);

  const allExpanded = groups.length > 0 && groups.every((g) => expanded.has(g.rule));

  const toggleGroup = (rule: string): void => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(rule)) next.delete(rule);
      else next.add(rule);
      return next;
    });
  };

  const toggleAll = (): void => {
    setExpanded(allExpanded ? new Set() : new Set(groups.map((g) => g.rule)));
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title={`Exceptions (${exceptions.length})`} width="lg">
      {/* Controls */}
      <div className="px-4 py-3 border-b border-gray-200 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 flex-1">
            {severityFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setSeverityFilter(filter.value)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                  severityFilter === filter.value
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100',
                )}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
          {groups.length > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs font-medium text-gray-600 hover:text-gray-900"
            >
              {allExpanded ? 'Collapse all' : 'Expand all'}
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by type, message or store…"
            className="pl-9"
            aria-label="Search exceptions"
          />
        </div>
      </div>

      {/* Grouped list */}
      <div className="divide-y divide-gray-100">
        {groups.length === 0 ? (
          <EmptyState icon={AlertTriangle} description="No exceptions match your filter" />
        ) : (
          groups.map((group) => {
            const isGroupOpen = expanded.has(group.rule);
            return (
              <div key={group.rule}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.rule)}
                  aria-expanded={isGroupOpen}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <span className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full shrink-0',
                        group.hardCount > 0 ? 'bg-red-500' : 'bg-amber-500',
                      )}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {ruleLabel(group.rule)}
                    </span>
                    <Badge size="sm" variant="default">
                      {group.items.length}
                    </Badge>
                    {group.openCount > 0 && (
                      <span className="text-xs text-gray-500">{group.openCount} open</span>
                    )}
                  </span>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-gray-400 shrink-0 transition-transform',
                      isGroupOpen && 'rotate-180',
                    )}
                    aria-hidden="true"
                  />
                </button>
                {isGroupOpen && (
                  <div className="divide-y divide-gray-100 bg-gray-50/40">
                    {group.items.map((exception) => (
                      <ExceptionRow
                        key={exception.id}
                        exception={exception}
                        onAcknowledge={() => onAcknowledge(exception.id)}
                        onResolve={() => onResolve(exception.id)}
                        onNavigate={() => {
                          if (exception.deepLinkRowId) {
                            onNavigate(exception.deepLinkRowId);
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Sheet>
  );
}
